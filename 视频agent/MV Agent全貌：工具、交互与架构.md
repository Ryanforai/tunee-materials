# MV Agent 全貌：工具、交互与架构

> 调研日期：2026-04-23
> 参考文档：Tunee MV Agent — 对话区产品需求文档（PRD）、MV 剪辑台设计文档 v6、chat_agent.md/refactored、视频skill SKILL.md

---

## 一、全景分类表

| 类别 | 数量 | 做什么 |
|------|------|--------|
| **原子工具** | **7** | Agent 做不了、必须依赖外部的事 |
| **Skill 组合** | 4 | 原子工具的固定编排 |
| **MCP Server** | 3 | 外部服务（图片模型 / 视频模型 / 存储） |
| **Agent 内部能力** | 若干 | Agent 本身就是 LLM，不需要工具 |
| **前端操作** | 若干 | 用户上传、画布拖拽，不由 Agent 调用 |
| **对话回复格式** | 6 | Agent 给前端的消息类型 |
| **画布事件** | 13 | 工具完成后同步画布的事件 |
| **用户意图** | 6 大类 | 指令的分类 |
| **流程阶段** | 7 | 进度标记 |
| **回退策略** | 3 级 | 失败降级链路 |

---

## 二、原子工具（7 个）

**判断标准**：Agent（LLM）自己做不了，必须调用外部系统。

| # | 工具 | 输入 | 输出 | 耗时 | 画布事件 | 外部依赖 |
|---|------|------|------|------|---------|---------|
| 1 | `analyze_music` | audio_url | bpm, key, mood_curve, lyrics | 5-15s | music_analysis_ready | 音频分析 API |
| 2 | `generate_image` | prompt, asset_type | 图片 URL + seed | 5-20s | asset_created | image_model_api |
| 3 | `generate_video` | video_prompt, frame_url, duration | 视频 URL | 60-120s | video_clip_progress | video_model_api |
| 4 | `evaluate_quality` | asset_url, asset_type | score, issues[], suggestion | 3-10s | quality_issue | VLM API |
| 5 | `web_search` | query, max_results? | 参考列表 | 2-8s | references_ready | 搜索 API |
| 6 | `get_asset` | asset_id | { url, prompt?, seed?, metadata } | <1s | 无 | storage_service |
| 7 | `push_to_canvas` | event_type, target_region, data | success | <1s | 对应事件 | 前端 EventBus |

### 2.1 详细定义

**Tool 1: `analyze_music`**
```python
def analyze_music(audio_url: str, audio_type: "song"|"instrumental") -> dict:
    return {
        "bpm": 128,
        "key": "C major",
        "time_signature": "4/4",
        "style_tags": ["electronic", "ambient"],
        "mood_curve": [{"time": 0, "energy": 0.3, "emotion": "calm"}, ...],
        "lyrics_analysis": {"language": "zh-CN", "themes": [...], "structure": ["Intro", "Verse", "Chorus"]}
    }
```

**Tool 2: `generate_image`**
```python
def generate_image(prompt: str, asset_type: str, model?: str, seed?: int, negative_prompt?: str, size?: str) -> dict:
    return {
        "image_url": "https://cdn.tunee.com/...",
        "prompt_used": prompt,
        "seed": 42,
        "width": 1024, "height": 768,
        "asset_type": "character",  # character | scene | prop | storyboard
        "model_used": "seedance_2_0"
    }
```

**Tool 3: `generate_video`**
```python
def generate_video(video_prompt: str, frame_url?: str, duration: int, model?: str, motion_strength?: float) -> dict:
    return {
        "video_url": "https://cdn.tunee.com/...",
        "status": "completed" | "processing" | "failed",
        "model_used": "kling_3_0_omni",
        "cost": 0.05
    }
```
异步任务：先提交任务（返回 task_id），轮询直到 status=completed。

**Tool 4: `evaluate_quality`**
```python
def evaluate_quality(asset_url: str, asset_type: "image"|"video", criteria?: list) -> dict:
    return {
        "score": 42,  # 0-100
        "issues": [
            {"type": "face_blur", "severity": "warning", "description": "面部区域不够清晰"}
        ],
        "suggestion": "建议使用更大尺寸或更换模型重新生成"
    }
```

**Tool 5: `web_search`**
```python
def web_search(query: str, source?: str, max_results: int = 5) -> dict:
    return {
        "references": [
            {"title": "...", "url": "...", "thumbnail_url": "...", "summary": "..."}
        ]
    }
```

**Tool 6: `get_asset`**
```python
def get_asset(asset_id: str) -> dict:
    return {
        "url": "https://cdn.tunee.com/...",
        "prompt": "原始生成 prompt",
        "seed": 42,
        "asset_type": "character",
        "created_at": "2026-04-23T10:00:00Z",
        "metadata": {"width": 1024, "height": 768}
    }
```

**Tool 7: `push_to_canvas`**
```python
def push_to_canvas(event_type: str, target_region: str, data: dict) -> dict:
    return {"success": True}
    # 前端接收后根据 event_type 更新对应画布区域
```

---

## 三、Skill 组合（4 个）

Skill 不是工具，是原子工具的固定编排。

### Skill 1: `generate_proposals`（生成方案）

```
Agent 自己做的事:
  - 构思叙事结构（generate_text 由 Agent 直接输出）
  - 撰写视觉风格描述
  - 汇总方案内容
  ↓
调用原子工具:
  - generate_image × N(asset_type="character")  ← 角色图
  - generate_image × N(asset_type="scene")      ← 场景图
  ↓
输出:
  proposals [{ name, concept, narrative_structure, storyboard, visual_style, characters[], scenes[] }]
  ↓
画布同步:
  - push_to_canvas("proposal_generated", "proposal_area", data)
```

### Skill 2: `mv_planner`（分镜规划）

```
Agent 自己做的事:
  - 校验时间轴连续性（数学计算）
  - 选择模型（查表逻辑）
  - 撰写每个 SHOT 的 treatment 文字
  ↓
输出:
  SUMMARIZE + DIRECTING + SHOT 列表（纯文本）
  ↓
画布同步:
  - push_to_canvas("storyboard_ready", "storyboard_area", data)
```

### Skill 3: `mv_generator`（分镜 prompt 生成）

```
Agent 自己做的事:
  - 将 treatment 转化为 video_prompt
  - 将 treatment 转化为 frame_prompt
  ↓
输出:
  shot JSON [{ shot_id, video_prompt, frame_prompt, start_time, end_time, scene_name }]
  ↓
画布同步:
  - push_to_canvas("shots_generated", "timeline", data)
```

### Skill 4: `video_generation`（视频生成）

```
Agent 自己做的事:
  - 为每个 shot 准备 prompt（mv_generator 的内容）
  ↓
调用原子工具:
  - generate_video × N(逐 shot，异步)
  ↓
画布同步:
  - push_to_canvas("video_clip_progress", "timeline", data)  ← 逐个更新
  - push_to_canvas("video_clips_ready", "timeline", data)    ← 全部完成
```

---

## 四、Agent 内部能力（不需要工具）

以下 Agent 本身就是 LLM，**不需要注册为工具**：

| 能力 | Agent 如何做 | 说明 |
|------|------------|------|
| 意图识别 | 分析用户消息 + 上下文 → 判断意图 | 对应 chat_agent 的 PHASE 0 |
| 文字生成 | 直接输出文本 | 叙事结构、视觉风格、treatment、prompt 等都直接写 |
| 方案构思 | 基于音乐分析结果推理 | 不需要工具 |
| 模型选择 | 查能力表 → 返回 model_key | 内部逻辑，不涉及外部调用 |
| 时间轴校验 | 数学计算（间隙/重叠/超长） | 内部逻辑 |
| 前置条件检查 | 读 State → 判断缺失什么 | 内部逻辑 |
| 回退决策 | 根据错误类型选择策略 | 内部逻辑 |
| 对话回复生成 | 直接输出 TextReply/OptionCard 的文字部分 | 本身就是 LLM |
| 画布读取 | 读 State 中的结构化数据 | 不需要工具，get_asset 只用于读存储里的 URL |

---

## 五、MCP Server（3 个）

原子工具的底层外部服务：

| MCP | 被谁调用 | 关键接口 | 特性 |
|-----|---------|---------|------|
| `image_model_api` | generate_image | `generate_image(prompt, size?, seed?) → { image_url }` | 短异步，~20s |
| `video_model_api` | generate_video | `generate_video(prompt, frame_url?, duration, model) → { task_id }` | 异步，60-120s，需轮询 |
| `storage_service` | get_asset | `get_asset(asset_id) → { url, metadata }` | 同步 |

`upload_asset` 不在这里——用户上传是前端操作，文件直接进 storage。Agent 通过 `get_asset` 访问。

---

## 六、对话回复格式（6 种）

Agent 执行完工具或完成内部推理后，返回给前端的消息类型。

```typescript
type AgentReply =
  | TextReply          // 纯文字回复
  | AssetCard          // 资产卡片（缩略图 + 操作按钮）
  | ProposalCard       // 方案卡片（摘要 + 选择按钮）
  | OptionCard         // 选项卡片（问题 + 可点击选项）
  | ProgressIndicator  // 进度指示器（N/M + 状态列表）
  | LoadingState;      // 加载状态
```

### 6.1 TextReply
```json
{ "type": "text", "content": "角色图已生成，你可以选择喜欢的放入画布" }
```

### 6.2 AssetCard
```json
{
  "type": "asset_card",
  "data": {
    "url": "https://...", "asset_type": "character", "asset_name": "主角",
    "actions": ["put_on_canvas", "regenerate", "download"]
  }
}
```

### 6.3 ProposalCard
```json
{
  "type": "proposal_card",
  "data": {
    "proposal_id": "proposal_A", "name": "都市霓虹",
    "concept": "赛博朋克风格的城市夜景 MV",
    "storyboard_preview": "Intro: 雨夜街头 → Verse1: 霓虹灯下 → ...",
    "actions": ["select", "view_detail", "regenerate"]
  }
}
```

### 6.4 OptionCard
```json
{
  "type": "option_card",
  "data": {
    "title": "镜头 3 质量检测未通过",
    "description": "面部区域不够清晰（score: 42，严重度: warning）",
    "options": [
      {
        "label": "重新生成", "action": "regenerate", "style": "primary",
        "next_step": { "tool": "generate_image", "params": { "asset_type": "storyboard", "seed": null } }
      },
      {
        "label": "调整提示词重试", "action": "regen_with_new_prompt", "style": "secondary",
        "next_step": { "tool": "generate_video", "params": { "new_prompt": true } }
      },
      {
        "label": "保持现状", "action": "keep", "style": "ghost",
        "next_step": null
      },
      {
        "label": "手动修改", "action": "manual_edit", "style": "ghost",
        "next_step": null
      }
    ],
    "target_element": { "type": "shot", "id": "Shot_3" }
  }
}
```

### 6.5 ProgressIndicator
```json
{
  "type": "progress_indicator",
  "data": {
    "title": "正在生成视频", "total": 8, "completed": 3,
    "items": [
      {"id": "Shot_1", "status": "done"}, {"id": "Shot_2", "status": "done"},
      {"id": "Shot_3", "status": "done"}, {"id": "Shot_4", "status": "generating"},
      {"id": "Shot_5", "status": "pending"}, {"id": "Shot_6", "status": "pending"},
      {"id": "Shot_7", "status": "pending"}, {"id": "Shot_8", "status": "pending"}
    ]
  }
}
```

### 6.6 LoadingState
```json
{
  "type": "loading",
  "data": { "message": "AI 导演正在规划分镜...", "estimated_seconds": 15 }
}
```

---

## 七、画布事件（13 种）

### 正向同步：工具 → 画布

| 事件类型 | 触发工具 | 目标区域 | 画布响应 |
|---------|---------|---------|---------|
| `music_analysis_ready` | analyze_music | 音乐分析区 | 情绪曲线+关键词出现 |
| `proposal_generated` | generate_proposals | 方案区 | 方案 Tab 出现 |
| `proposal_selected` | 用户选择 | 方案区 | 高亮选中 Tab |
| `asset_created` | generate_image | 视觉资产区 | 新卡片 scale-in |
| `asset_updated` | regenerate | 视觉资产区 | 替换内容+闪烁 |
| `asset_placed` | 用户点击"放入画布" | 对应区域 | 滚动定位+高亮 |
| `storyboard_ready` | mv_planner | 分镜表格区 | 分镜表格出现 |
| `shots_generated` | mv_generator | 时间线 | clip 占位出现 |
| `video_clip_progress` | generate_video（逐个） | 时间线 | 单个 clip 状态更新 |
| `video_clips_ready` | generate_video（完成） | 时间线+预览区 | 所有 clip 就位 |
| `quality_issue` | evaluate_quality | 对应元素 | 橙色警告边框 |
| `references_ready` | web_search | 对话区 | 参考卡片 |
| `canvas_focus` | 任何 | 指定元素 | 滚动定位+高亮 |

### 反向同步：画布 → 对话

| 事件类型 | 触发操作 | Agent 响应 |
|---------|---------|-----------|
| `element_selected` | 用户选中画布元素 | Agent 读 State 定位数据 |
| `asset_deleted` | 用户删除资产 | "已从资产库移除" |
| `proposal_edited` | 用户编辑方案 | "方案已更新，需要同步分镜吗？" |
| `clip_reordered` | 用户拖动时间线 | "时间线已更新" |
| `preview_requested` | 用户点击预览 | 打开 Preview 弹窗 |

---

## 八、用户意图大类（6 类）

| 大类 | 含义 | 示例 | Agent 内部 | 调用工具 |
|------|------|------|-----------|---------|
| **自由操作** | 零前置 | "生成角色图" | 意图识别 | generate_image |
| **流程推进** | 下一步 | "继续"、"方案A" | 判断当前阶段→决定下一步 | 取决于阶段 |
| **链式执行** | 多步配合 | "生成视频" | 检查前置→补齐或确认 | mv_generator→generate_video×N |
| **反馈修改** | 不满意 | "换一张"、"脸歪了" | 根据上下文定位目标 | 取决于改什么 |
| **状态查询** | 问进度 | "到第几步了" | 读 State 回复 | 无 |
| **闲聊** | 无关 | "你好" | 直接回复 | 无 |

---

## 九、流程阶段（7 个）

`pipeline_stage` 是进度标记，不是准入条件。

| 阶段 | 含义 | 可跳入 |
|------|------|--------|
| `idle` | 无进行中流程 | — |
| `music_analysis` | 音乐分析完成 | 是（直接分析音乐） |
| `proposals` | 方案已生成 | 是（直接出方案需音乐） |
| `assets` | 资产已就位 | 是（直接生成图片） |
| `storyboard` | 分镜已规划 | 是（直接规划需方案） |
| `video_generation` | 视频生成中 | 是（生成视频需完整链路） |
| `review` | 全部完成 | — |

---

## 十、完整交互流程示例

### 10.1 线性流程

```
用户: "帮我为《夏日微风》做 MV"
  → Agent: 检测到 mv_creation，state 无音乐分析
  → Agent 内部: 构思回复 → reply(LoadingState, "好的，先分析下这首歌~")
  → 工具: analyze_music(audio_url="...")
  → 工具: push_to_canvas("music_analysis_ready", "music_area", data)
  → Agent 内部: 生成回复 → reply(AssetCard, 分析结果摘要)

用户: "基于这个生成方案吧"
  → Agent: proceed，进入 proposals
  → Agent 内部: 构思叙事结构 + 视觉风格（直接输出文字）
  → 工具: generate_image × 4(asset_type="character")  ← 并行
  → 工具: push_to_canvas("proposal_generated", "proposal_area", data)
  → Agent 内部: 汇总 → reply(ProposalCard × 3)

用户: "方案 B 不错"
  → Agent: select_proposal("B")，更新 state.selected_proposal
  → Agent 内部: 回复 → reply(TextReply, "好的，开始为方案 B 生成视觉资产")

用户: "开始生成分镜"
  → Agent: 进入 storyboard
  → Agent 内部: 校验时间轴 + 撰写每个 SHOT 的 treatment（直接输出文字）
  → Agent 内部: 生成 shot JSON（video_prompt + frame_prompt）
  → 工具: push_to_canvas("storyboard_ready", "storyboard_area", data)
  → 工具: push_to_canvas("shots_generated", "timeline", data)
  → Agent 内部: 回复 → reply(TextReply, "分镜规划完成，共 8 个镜头，要生成视频吗？")

用户: "生成视频"
  → Agent: 进入 video_generation
  → Agent 内部: 回复 → reply(ProgressIndicator, 0/8)
  → 工具: generate_video × 8(逐 shot，异步)
  → 每完成一个:
    → 工具: push_to_canvas("video_clip_progress", "timeline", {shot_id, status})
    → Agent 内部: 更新 ProgressIndicator
  → 全部完成后:
    → 工具: push_to_canvas("video_clips_ready", "timeline", data)
    → Agent 内部: 回复 → reply(TextReply, "MV 生成完成！可以预览或导出")
```

### 10.2 自由跳入

```
用户: "帮我生成一张赛博朋克风格的主角图"
  → Agent: 意图识别 = generate_image，无前置
  → 工具: generate_image(prompt="cyberpunk protagonist...", asset_type="character")
  → 工具: push_to_canvas("asset_created", "visual_assets", data)
  → Agent 内部: 回复 → reply(AssetCard, 图片 + "放入画布"按钮)

用户: "搜索王家卫风格的 MV 参考"
  → Agent: 意图识别 = web_search，无前置
  → 工具: web_search(query="王家卫 MV reference")
  → Agent 内部: 回复 → reply(AssetCard × N, 参考列表)

用户: "质量怎么样"
  → Agent: 读取最近生成的资产 URL
  → 工具: get_asset(asset_id=last_asset_id)
  → 工具: evaluate_quality(asset_url=asset.url, asset_type="image")
  → score >= 70 → reply(TextReply, "质量良好，score: 82")
  → score < 70  → reply(OptionCard, 问题+选项)
```

### 10.3 问题选项完整流程

```
用户: "生成视频" → generate_video(Shot 3) 完成
  → 工具: evaluate_quality(asset_url=shot3_video, asset_type="video")
  → 结果: score=42, issues=[{type: "face_blur", severity: "warning"}]
  → Agent 内部: 回复 → reply(OptionCard, 问题+4 个选项)
  → 工具: push_to_canvas("quality_issue", "Shot_3", data)  ← 画布橙色警告边框

用户点击"重新生成"
  → Agent: 收到 action="regenerate"
  → 工具: generate_image(asset_type="storyboard", prompt=..., seed=new_seed)
  → 工具: generate_video(video_prompt=..., frame_url=new_image_url)
  → 工具: push_to_canvas("asset_updated", "Shot_3", data)
```

### 10.4 画布选中元素 → Agent 修改

```
画布: 用户点击 Shot 3 的分镜图
  → CanvasActionEvent: { type: "element_selected", data: { shot_id: "Shot_3" } }

用户: "帮我改一下这个分镜"
  → Agent: 解析消息，检测到 element_selected 事件
  → Agent 内部: 读取 State 中 Shot 3 的 shot JSON + treatment
  → Agent 内部: 根据用户指令生成新 prompt
  → 工具: generate_image(..., seed=new_seed)  ← 重新生成分镜图
  → 工具: generate_video(..., frame_url=new_image_url)  ← 重新生成视频
  → 工具: push_to_canvas("asset_updated", "Shot_3", data)
```

---

## 十一、Agent 核心循环

```python
def agent_loop(user_message: str, state: AgentState) -> AgentReply:
    """
    Agent 每轮对话的核心逻辑
    """

    # ── Step 1: 意图识别（Agent 内部能力）──
    intent = detect_intent(user_message, state)
    # 含 [@xxx] 引用？→ 解析 → 锁定画布目标
    # 关键词匹配？→ 映射到意图
    # 上下文推理？→ 结合 state 判断

    # ── Step 2: 前置条件检查（Agent 内部逻辑）──
    missing = check_preconditions(intent, state)
    if missing:
        return OptionCard(build_missing_options(missing))  # 反问用户

    # ── Step 3: 执行（内部推理 + 外部工具混合）──
    canvas_events = []

    if intent.requires_external_tool:
        for tool_call in intent.resolve_tools(state):
            try:
                result = tool_call.execute(state)
                canvas_events.append(tool_call.to_canvas_event(result))
            except ToolError as e:
                # 回退: retry → switch_model → degrade
                result = handle_fallback(tool_call, e, state)
                canvas_events.append(tool_call.to_canvas_event(result))

    # ── Step 4: 推送画布事件 ──
    for event in canvas_events:
        push_to_canvas(event.type, event.target_region, event.data)

    # ── Step 5: 更新 State ──
    state.update_with(result)
    state.pipeline_stage = resolve_next_stage(intent, state)

    # ── Step 6: 生成对话回复（Agent 内部能力）──
    return generate_reply(state, intent, result)
```

---

## 十二、架构总览

```
┌─────────────────────────────────────────────────────────┐
│  前端（360px 对话面板 + 无限画布）                        │
│  ┌────────────┐  CanvasEvents  ┌─────────────────────┐  │
│  │  对话面板   │ ←────────────→ │  无限画布            │  │
│  │ · Text     │                │ · 音乐分析区         │  │
│  │ · AssetCard│                │ · 方案区(Tab)        │  │
│  │ · Proposal │                │ · 视觉资产区         │  │
│  │ · Option   │                │ · 分镜表格区         │  │
│  │ · Progress │                │ · 时间线             │  │
│  │ · Loading  │                │ · Preview 弹窗       │  │
│  │            │                │                      │  │
│  │ 输入栏      │                └─────────────────────┘  │
│  │ [📎][⚙][▶]│                📎=upload_asset(前端)     │
│  └────────────┘                ⚙=select_model(内部)      │
├─────────────────────────────────────────────────────────┤
│  Agent (LangGraph StateGraph)                            │
│                                                         │
│  内部能力（不需要工具）:                                   │
│    意图识别 │ 文字生成 │ 方案构思 │ 模型选择              │
│    时间轴校验 │ 前置检查 │ 回退决策 │ 回复生成            │
│                                                         │
│  原子工具（需要外部调用）:                                 │
│    analyze_music │ generate_image │ generate_video      │
│    evaluate_quality │ web_search │ get_asset            │
│    push_to_canvas                                       │
│                                                         │  Skill 组合（工具编排）:                                   │
│    generate_proposals = Agent 构思 + generate_image×N   │
│    mv_planner     = Agent 构思（无需工具）               │
│    mv_generator   = Agent 构思（无需工具）               │
│    video_generation = mv_generator + generate_video×N   │
│                                                         │
│  回退: retry → switch_model → degrade                   │
├─────────────────────────────────────────────────────────┤
│  MCP: image_model_api │ video_model_api │ storage       │
└─────────────────────────────────────────────────────────┘
```

### 关键原则

1. **原子工具 = Agent 做不了的事**——生成像素、分析音频、质检、搜索。文字/推理/规划是 Agent 本身能力，不是工具。
2. **Skill = 原子工具 + Agent 内部能力的编排**。generate_proposals 中，构思是 Agent 做的，生成图片是调工具。
3. **画布读取是 State 查询**，不是工具。Agent 读 State 中的结构化数据。用户上传的资产通过 get_asset 获取 URL。
4. **push_to_canvas 是唯一的"前端工具"**——Agent 产生数据后必须通过它同步到画布。
5. **对话回复格式不是工具**，是 Agent 选择的消息呈现方式。
6. **流程阶段是进度提示**，不是准入条件。

---

## 附录 A：工具对比表（改造前 vs 改造后）

| 之前列的"工具" | 为什么不是工具 | 正确归类 |
|---------------|--------------|---------|
| `upload_asset` | 用户上传操作，不是 Agent 调用 | 前端操作 |
| `generate_text` | Agent 本身就是文字生成器 | Agent 内部能力 |
| `select_model` | 查表逻辑，不涉及外部调用 | Agent 内部能力 |
| `check_timeline` | 数学计算，不涉及外部调用 | Agent 内部能力 |
| `add_to_canvas` | 前端操作，Agent 不操作 DOM | 前端操作 |

## 附录 B：完整 7 工具 × 使用场景矩阵

| 工具 | 自由跳入 | 流程内 | 反馈修改 | 链式执行 |
|------|---------|--------|---------|---------|
| analyze_music | "分析这首歌" | 线性流程第 1 步 | — | — |
| generate_image | "生成角色图" | 方案资产 / 分镜图 | "换一张" | 视频前置 |
| generate_video | — | 最后一步 | "重新生成 Shot3" | 链式尾 |
| evaluate_quality | "质量怎么样" | 生成后自动调用 | — | — |
| web_search | "搜索王家卫 MV" | 方案生成前补充 | — | — |
| get_asset | — | 读已有资产作为上下文 | 读被修改的目标 | 读前置资产 |
| push_to_canvas | 每次工具调用后 | 每次工具调用后 | 每次修改后 | 每次视频完成后 |

---

## 附录 C：PRD 产品约束

### C.1 对话面板尺寸

宽度 **360px**（固定），内容区 ~328px。所有富内容卡片适配此宽度：
- AssetCard：缩略图 100% 宽度，16:9 比例
- OptionCard：选项垂直堆叠，每选项独占一行
- ProgressIndicator：shot 状态可横向滚动

### C.2 色彩系统（OKLCH）

琥珀橙 `oklch(0.580 0.180 48)` 为唯一强调色。黑白灰为主，浅色主题。

### C.3 动画规范

| 场景 | 时长 | Easing |
|------|------|--------|
| AssetCard 入场 | 150ms | ease-out |
| OptionCard 展开 | 140ms | ease-out |
| Progress 更新 | 200ms | linear |
| quality_issue 警告 | 1.2s 循环 | ease-in-out |
| 方案切换 | 200ms | fade |

### C.4 引用标签

`[@方案A]`、`[@Shot3]` 等引用标签实现画布 ↔ 对话双向引用。Agent 解析 `[@xxx]` 后锁定操作目标。

### C.5 人格系统（5 种）

专业导演 / 创意伙伴 / 温柔助手 / 毒舌审美 / 艺术家。影响对话回复风格，不影响工具调用。
