# MV Agent 对话区 — 产品需求文档

> 版本：v1.0 | 日期：2026-04-26 | 状态：待评审
> 上游文档：`原子能力体系讨论稿.md`、`对话框交互方案.md`、`MV Agent全貌：工具、交互与架构.md`

---

## 1. 背景与目标

### 1.1 背景

当前 Tunee MV 生成分为两个独立阶段：对话阶段（聊天生成方案）和编辑阶段（剪辑台）。用户需要在两个界面之间跳转，上下文断裂，无法在对话中直接操控画布上的素材。

### 1.2 目标

将对话与画布融合为统一的 Agent 体验：**对话是入口，画布是工作台，Agent 是大脑**。用户通过自然语言与 Agent 对话，Agent 识别意图后自动激活画布，调用原子能力完成 MV 生成的全流程。

### 1.3 核心差异化

| 传统对话式 AI | Tunee MV Agent |
|---|---|
| 纯文字对话，无可视化工作台 | 全屏对话 ↔ 30% 对话 + 70% 画布，按需切换 |
| 线性流程，必须按顺序走完 | 自由跳入，用户可以从任意节点开始 |
| 一个会话一个上下文 | 多 Page 并行，同时做多首歌的 MV |
| 黑盒生成，用户看不到过程 | 工具调用实时可视化，进度可追踪 |

### 1.4 目标用户

- 音乐创作者 / AI 音乐人
- 想快速出 MV 的非专业视频用户
- 需要迭代修改 MV 分镜的专业用户

### 1.5 成功指标

**北极星指标：**
- MV 完成率（从首次进入对话到导出成片）

**辅助指标：**
- 对话到画布的激活率（触发 `activate_workspace` 的会话占比）
- 平均交互轮数（从进入到完成所需对话轮次）
- 工具调用成功率（每次调用成功 vs 失败的比例）
- 多 Page 使用率（同时打开 ≥ 2 个 Page 的用户占比）

---

## 2. 整体布局与信息架构

### 2.1 两种 UI 模式

| 模式 | 布局 | 触发时机 | 说明 |
|------|------|---------|------|
| **全屏对话** | 100% 聊天面板 | 默认进入、闲聊、状态查询 | 用户刚进入产品、或完成 MV 后 |
| **对话 + 画布** | 360px 对话 + 70% 画布 | 识别到 MV 相关意图时激活 | 做 MV、生图、搜索参考等 |

### 2.2 模式切换

| 能力 | 能力名 | 触发 | UI 行为 | 优先级 |
|------|--------|------|---------|--------|
| **M1** | `activate_workspace` | Agent 识别到 MV 意图 | 全屏对话 → 360px 对话 + 70% 画布 | P0 |
| M2（V2） | `deactivate_workspace` | 任务完成 / 长时间无操作 | 360px + 70% → 全屏对话 | P1 |

### 2.3 画布 Page 管理

| 能力 | 能力名 | 说明 | 优先级 |
|------|--------|------|--------|
| **C2** | `open_page` | 画布新开一个 Page（类似浏览器新标签） | P1 |
| **C3** | `switch_page` | 切换到指定 Page | P1 |
| **C4** | `close_page` | 关闭一个 Page | P1 |
| **C5** | `list_pages` | 列出所有已打开的 Page | P1 |

---

## 3. 对话面板 — 布局规范

### 3.1 整体结构

```
┌─────────────────────────────┐  ← 360px 固定宽
│  Header（Agent 人格信息）    │  40px
├─────────────────────────────┤
│                             │
│  消息流区（可滚动）          │  flex:1, overflow-y: auto
│                             │
├─────────────────────────────┤
│  Tool Call 状态栏（可收起）  │  0~48px，工具调用期间展示
├─────────────────────────────┤
│  输入区                     │  min 56px, max 160px
└─────────────────────────────┘
```

### 3.2 尺寸规范

| 区域 | 规格 |
|------|------|
| 面板宽度 | 360px（固定） |
| 内容区水平 padding | 16px |
| 消息气泡最大宽 | 288px |
| 用户气泡最大宽 | 240px |
| 头像尺寸 | 28px × 28px |
| 消息间距 | 12px（同方向连续），20px（换方向） |

### 3.3 Header

```
[Agent 头像 28px] [人格标签 badge] ................. [设置图标]
                  "专业导演模式"
```

人格切换入口在 Header 右侧 icon，点击弹出底部 Sheet 选择 5 种人格。

### 3.4 人格系统

| 人格 | 语气 | 特殊 UI |
|------|------|---------|
| 专业导演 | 简洁、术语化 | OptionCard 选项用专业词 |
| 创意伙伴 | 活泼、多感叹号 | 气泡带随机 emoji 装饰点 |
| 温柔助手 | 暖、鼓励 | 完成时 confetti 微动画 |
| 毒舌审美 | 直接、带主观评价 | ErrorBubble 文案更犀利 |
| 艺术家 | 意象化语言 | 背景色调偏暖 |

人格不影响工具调用逻辑和卡片数据结构，只影响文案和极少数视觉微调。

---

## 4. 原子能力体系 — 完整清单

> 每层以列表形式展示，按优先级排序。

### L0: UI 模式层（界面切换）

| # | 能力名 | 方向 | 输入 | 输出 | 说明 | 优先级 |
|---|--------|------|------|------|------|--------|
| M1 | `activate_workspace` | Agent → UI | intent_type, initial_layout? | { workspace_id } | 检测 MV 意图 → 全屏对话变 30% 对话 + 70% 画布 | P0 |

### L1: 感知层（"读" — 理解用户上传的内容）

| # | 能力名 | 输入 | 输出 | 底层实现 | 说明 | 优先级 |
|---|--------|------|------|---------|------|--------|
| P1 | `read_asset` | asset_id / URL | { url, type, size, metadata } | 存储 API | 读取素材基本信息 | P0 |
| P2 | `analyze_music` | audio_url, lyrics_text? | { bpm, key, duration, mood_curve, structure, energy_curve } | 音频分析 API | 分析音乐（BPM/调性/情绪） | P0 |
| P3 | `parse_lyrics` | lyrics_text / lrc_url | { language, lines: [{time, text}], structure } | 文本解析 + LLM | 解析歌词时间戳 | P1 |
| P4 | `analyze_image` | image_url | { description, colors, composition, faces[], style_tags } | VLM API | 理解图片内容 | P1 |
| P5 | `analyze_video` | video_url | { duration, fps, resolution, scenes[], motion_level } | VLM API + ffprobe | 理解视频内容 | P1 |
| P6 | `read_text_file` | text_url / text_content | { content, encoding, language } | 文件读取 | 读取上传文本 | P2 |

### L2: 画布操作层（"放" — 决定内容在哪、怎么展示）

| # | 能力名 | 输入 | 输出 | 底层实现 | 说明 | 优先级 |
|---|--------|------|------|---------|------|--------|
| C1 | `push_to_canvas` | event_type, target_region, data | { success } | 前端 EventBus | 推数据到画布指定区域 | P0 |
| C6 | `focus_element` | element_id | { success } | 前端定位 | 聚焦画布元素（缩放+居中） | P1 |
| C7 | `update_element` | element_id, patch_data | { success } | 前端更新 | 更新画布元素属性 | P1 |
| C8 | `remove_element` | element_id | { success } | 前端删除 | 从画布移除元素 | P1 |
| C2 | `open_page` | page_id, page_title, initial_content? | { page_id } | 前端路由 | 画布新开 Page | P1 |
| C3 | `switch_page` | page_id | { success } | 前端路由 | 切换 Page | P1 |
| C4 | `close_page` | page_id | { success } | 前端路由 | 关闭 Page | P1 |
| C5 | `list_pages` | — | [{ page_id, title, thumbnail, status }] | 前端状态 | 列出所有 Page | P2 |
| C9 | `layout_elements` | region, layout_type, elements | { success } | 前端排版 | 排列画布元素 | P2 |

### L3: 外部工具层（"做" — 真正产生新内容）

| # | 能力名 | 输入 | 输出 | 底层实现 | 预计耗时 | 说明 | 优先级 |
|---|--------|------|------|---------|---------|------|--------|
| T1 | `generate_image` | prompt, asset_type, model?, seed?, size? | { image_url, seed, metadata } | 图片生成 API | 5-20s | 生成图片（角色/场景/分镜/参考） | P0 |
| T2 | `generate_video` | video_prompt, frame_url?, duration, model? | { video_url / task_id, status } | 视频生成 API | 60-120s | 生成视频片段（异步） | P0 |
| T4 | `evaluate_quality` | asset_url, asset_type, criteria? | { score, issues[], suggestion } | VLM API | 3-10s | 质量检测 | P0 |
| T3 | `run_ffmpeg` | input_urls, operation, params | { output_url, metadata } | ffmpeg | 1-30s | 音视频处理（拼接/提取/转码/烧字幕） | P1 |
| T6 | `lip_sync` | video_url, audio_url | { video_url (synced), metadata } | Lip-Sync API | 10-60s | 口型同步 | P1 |
| T7 | `face_swap` | source_video_url, face_image_url | { video_url (swapped) } | Face-Swap API | 10-30s | 换脸/角色一致性 | P1 |
| T5 | `web_search` | query, source?, max_results? | { references[] } | 搜索 API | 2-8s | 搜索参考素材 | P2 |

### L4: 技能组合层（"编" — 多步骤工作流编排）

#### 编排型 Skill（6 个）

| # | Skill 名 | 触发条件 | 编排流程 | 输出 | 优先级 |
|---|---------|---------|---------|------|--------|
| S1 | `generate_proposals` | "帮我做个 MV" | 音乐分析 → 构思结构 → generate_image × N → 汇总方案 | proposals[] | P0 |
| S2 | `mv_planner` | 方案确定后 | 校验时间轴 → 撰写 SHOT treatment → 输出分镜列表 | 文字分镜 | P0 |
| S3 | `mv_generator` | 分镜确定后 | treatment → video_prompt + frame_prompt → 结构化 JSON | shot JSON[] | P0 |
| S4 | `video_generation` | "开始生成视频" | 逐 shot generate_video → 质检 → push_to_canvas | video_clips | P0 |
| S5 | `revise_shot` | "Shot 3 重做" | 定位目标 → 理解意图 → 重新生成 → 推送画布 | updated shot | P0 |
| S6 | `export_mv` | "导出成片" | ffmpeg(concat → add_subtitles → convert) | final video | P1 |

#### 创意分析节点 Skill（4 个模式）

| # | Skill 名 | 核心使命 | 对应文件 | 输出格式 | 优先级 |
|---|---------|---------|---------|---------|--------|
| S7 | `creative_analysis_story` | 角色动作和故事推进，现实物理规则 | `创意分析/prompts/generation/mv_story_mode_script_prompt.md` | mv_guide JSON | P0 |
| S8 | `creative_analysis_visions` | 异世界视觉奇观，角色在不可能世界中行动 | `创意分析/prompts/generation/mv_visions_script_prompt.md` | mv_guide JSON | P0 |
| S9 | `creative_analysis_lipsync` | 口型同步 MV，按 video_model 分段 | `创意分析/prompts/generation/mv_creative_script_lipsync_prompt.md` | mv_guide JSON | P0 |
| S10 | `creative_analysis_clone` | 基于参考 MV 视觉 DNA 重组到新时间轴 | `创意分析/prompts/generation/mv_clone_mode_script_prompt.md` | mv_guide JSON | P1 |

#### 资产生成 Skill（3 个）

| # | Skill 名 | 定位 | 来源 | 说明 | 优先级 |
|---|---------|------|------|------|--------|
| S11 | `asset_generation_character` | 角色图提示词生成 | `Tunee Skill库/cinematic-prompt-generator/` | 9 维度：主题→景别→构图→焦段→光影→色彩→逻辑验证→胶片→神态 | P0 |
| S12 | `asset_generation_scene` | 场景图提示词生成 | `Tunee Skill库/cinematic-prompt-generator/` | 同上 9 维度，聚焦场景构建 | P0 |
| S13 | `cinematic_prompt_generator` | 电影感提示词总 Skill | `Tunee Skill库/cinematic-prompt-generator/SKILL.md` | 适用于 MJ/SD 等工具 | P1 |

#### 视频生成 Skill 节点（4 个版本）

| Skill 名 | 模型支持 | 说明 | 优先级 |
|----------|---------|------|--------|
| mv-generation-一段式 | infinite_talk / wan_video_2_7 / seedance_2_0 / kling_3_0_omni | 单节点完整版 | P0 |
| mv-generation-二段式 | 同上 | planner + generator 双节点拆分 | P1 |
| mv-generation-sd2-一段式 | seedance_2_0 | SD2 专用单节点 | P1 |
| mv-generation-sd2-二段式 | seedance_2_0 | SD2 专用双节点 | P1 |

---

## 5. 消息类型与视觉规范

### 5.1 消息类型清单

Agent 执行完工具或完成内部推理后，返回给前端的消息类型。

| 消息类型 | 何时出现 | 视觉形态 | 优先级 |
|---------|---------|---------|--------|
| **TextReply** | Agent 完成推理 / 工具完成后说明 | 左对齐文字气泡，支持 Markdown | P0 |
| **UserMessage** | 用户发送消息 | 右对齐琥珀橙气泡 | P0 |
| **AssetCard** | generate_image / generate_video 完成 | 缩略图 + 名称 + 操作按钮 | P0 |
| **ProposalCard** | generate_proposals 完成 | 方案摘要 + 分镜预览 + 选择按钮 | P0 |
| **OptionCard** | evaluate_quality 未通过 / 多选决策点 | 问题标题 + 可点击选项列表 | P0 |
| **ProgressIndicator** | generate_video × N 开始后 | 进度条 + Shot 状态列表 | P0 |
| **LoadingState** | 工具调用前 / 意图分析中 | 三点弹跳 + 倒计时 | P0 |
| **ErrorBubble** | 工具失败 / 网络异常 | 红色边框气泡 + 错误摘要 + 重试 | P1 |

### 5.2 用户消息（右对齐）

```
                   ┌──────────────────────┐
                   │  帮我为《夏日微风》  │
                   │  做一个 MV           │
                   └──────────────────────┘ [用户头像]
```

- 背景色：`oklch(0.580 0.180 48)`（琥珀橙）
- 文字色：white
- 圆角：12px 12px 2px 12px
- 支持 `[@Shot3]` 引用标签，标签样式：`background: oklch(0.9 0.05 48)` + 圆角 4px

### 5.3 TextReply（Agent 文字消息，左对齐）

```
[头像]  ┌──────────────────────────────┐
        │  角色图已生成，你可以选择喜  │
        │  欢的放入画布 ↗             │
        └──────────────────────────────┘
```

- 背景色：`oklch(0.96 0.00 0)`（近白灰）
- 文字色：`oklch(0.15 0.00 0)`
- 圆角：2px 12px 12px 12px
- Markdown 支持：`**bold**`、`- list`、`` `code` ``
- 流式输出：逐字渲染，光标闪烁 `|`，完成后光标消失

### 5.4 AssetCard（资产卡片）

```
[头像]  ┌──────────────────────────────┐
        │ [缩略图 288×162px 16:9]      │
        │─────────────────────────────│
        │  主角 · 角色图               │
        │  ─────────────────────────  │
        │  [放入画布]  [重新生成]  [↓] │
        └──────────────────────────────┘
```

- 缩略图：圆角 8px 8px 0 0，`object-fit: cover`
- 资产名 + 类型：`font-size: 13px`，`color: oklch(0.4 0.00 0)`
- 操作按钮区：高度 40px，三等分
  - 「放入画布」：accent 色填充
  - 「重新生成」：outline 样式
  - 下载图标：ghost 样式
- 入场动画：`scale(0.92) → scale(1.0)`，150ms ease-out

### 5.5 ProposalCard（方案卡片）

```
[头像]  ┌──────────────────────────────┐
        │  方案 A · 都市霓虹           │
        │  ─────────────────────────  │
        │  赛博朋克风格的城市夜景 MV   │
        │                              │
        │  Intro 雨夜街头              │
        │  → Verse1 霓虹灯下          │
        │  → Chorus 俯瞰城市          │
        │  ─────────────────────────  │
        │   [选择方案]    [查看详情]   │
        └──────────────────────────────┘
```

- 方案名：`font-weight: 600`，accent 色
- 分镜预览：最多 3 行，超出 `...` 收起
- 「选择方案」按钮：点击后变为 `✓ 已选择`，不可重复点击
- 多张 ProposalCard 连续出现时，间距收紧为 8px

### 5.6 OptionCard（决策选项卡片）

```
[头像]  ┌──────────────────────────────┐
        │  ⚠ 镜头 3 质量未通过         │
        │  面部区域不够清晰（42 分）   │
        │  ─────────────────────────  │
        │  ●  重新生成                 │  ← primary
        │  ○  调整提示词重试           │  ← secondary
        │  ○  保持现状                 │  ← ghost
        │  ○  手动修改                 │  ← ghost
        └──────────────────────────────┘
```

- 标题行：`⚠` 图标用 `oklch(0.65 0.15 80)`（黄橙警告色）
- 每个选项独占一行，高度 40px，左侧 radio 点
- 选中后：整张卡片锁定，选中项高亮，未选项变灰（`opacity: 0.4`）

### 5.7 ProgressIndicator（进度卡片）

```
[头像]  ┌──────────────────────────────┐
        │  正在生成视频  3 / 8         │
        │  ████████░░░░░░░░░  37%     │
        │  ─────────────────────────  │
        │  ✓ Shot1  ✓ Shot2  ✓ Shot3  │
        │  ⟳ Shot4  · Shot5  · Shot6  │
        │  · Shot7  · Shot8           │
        └──────────────────────────────┘
```

- 进度条：accent 色，`height: 4px`，`border-radius: 2px`
- Shot 状态：`✓` 绿色完成 / `⟳` 旋转中（橙色）/ `·` 灰色待处理
- 进度数字和进度条实时更新（只 patch 数值，不重渲染整个卡片）

### 5.8 LoadingState（思考中/调用工具中）

```
[头像]  ┌──────────────────────────────┐
        │  ● ● ●   AI 导演正在规划分镜  │
        │          预计 15 秒           │
        └──────────────────────────────┘
```

- 三点动画：依次弹跳，周期 1.2s
- 倒计时：`estimated_seconds` 开始倒数，到 0 后显示「正在努力中...」
- 替换规则：工具完成后，LoadingState 直接被结果卡片替换（不保留历史）

### 5.9 ErrorBubble（错误气泡）

```
[头像]  ┌──────────────────────────────┐
        │  ✕  生成失败                 │  ← 红色图标
        │  generate_video 超时（120s） │
        │  [重试]                      │
        └──────────────────────────────┘
```

---

## 6. 输入区设计

### 6.1 结构

```
┌─────────────────────────────────────────┐
│  [📎] [输入框，placeholder: 告诉我你的] │ [发送]
│       [想法，或 @ 引用画布元素...]      │
└─────────────────────────────────────────┘
```

- 输入框：`textarea`，min-height 40px，max-height 120px，自动增高
- 附件按钮：上传参考图 / 音频 / 视频 / 文本（触发前端 upload 操作）
- 发送按钮：有内容时 accent 色，无内容时灰色禁用
- 工具调用期间：输入框 `disabled`，发送按钮变为「停止」（红色）

### 6.2 @ 引用触发

输入 `@` 后弹出浮层选择器：

```
┌──────────────────────┐
│  @  [搜索框]         │
│  ─────────────────  │
│  [@Shot1] 海滩日落   │
│  [@Shot2] 城市夜景   │
│  [@方案A] 都市霓虹   │
│  [@主角] 角色图      │
└──────────────────────┘
```

| 引用标签 | 对应 | 点击行为 |
|---------|------|---------|
| `[@Shot_3]` | 分镜第 3 镜 | 画布聚焦到该 Shot |
| `[@方案A]` | 生成的方案 A | 画布切换到方案 Tab |
| `[@主角]` | 命名资产 | 资产库高亮该卡片 |
| `[@当前选中]` | 画布选中元素 | 无（仅上下文引用） |

### 6.3 快捷指令

输入 `/` 触发命令面板：

| 命令 | 说明 | 调用能力 |
|------|------|---------|
| `/分析音乐` | 触发音频分析 | P2 `analyze_music` |
| `/生成方案` | 进入方案生成流程 | S1 `generate_proposals` |
| `/生成分镜` | 进入分镜规划 | S2 `mv_planner` |
| `/生成视频` | 进入视频生成 | S4 `video_generation` |
| `/质量检测` | 对所有资产调用质检 | T4 `evaluate_quality` |
| `/搜索参考` | 弹出搜索框 | T5 `web_search` |
| `/切换人格` | 打开人格选择 Sheet | — |

---

## 7. 工具调用可视化

### 7.1 Tool Call 状态栏（底部固定条）

工具执行期间，输入区上方出现一条薄栏：

```
┌─────────────────────────────────────────┐
│  ⟳ generate_image · 角色图 · 已用 8s   [×]│
└─────────────────────────────────────────┘
```

- 高度 36px，背景 `oklch(0.96 0.02 48)`（浅琥珀）
- 显示：工具名、参数摘要（最多 20 字）、已用时间（秒计）
- `[×]` 点击可中止当前工具调用（触发 abort 信号）
- 多个并行工具：状态栏叠加显示，最多 3 行，超出折叠为「+ N 个工具运行中」

### 7.2 工具调用时序

```
用户发送消息
  ↓
[LoadingState] 出现（意图分析中）
  ↓
Tool Call 状态栏出现（工具名 + 计时）
  ↓
工具完成 → 状态栏消失
  ↓
结果卡片 / TextReply 流式出现
```

### 7.3 并行工具调用示意

当 `generate_image × 4` 并行时：

```
┌───────────────────────────────────────────┐
│  ⟳ generate_image · 主角         · 12s  │
│  ⟳ generate_image · 场景A        · 10s  │
│  ✓ generate_image · 场景B        · 9s   │
│  + 1 个工具运行中                         │
└───────────────────────────────────────────┘
```

全部完成后状态栏收起（height: 0, 200ms ease），结果卡片批量入场。

---

## 8. 交互状态与边界处理

### 8.1 状态机

```
空闲（idle）
  → 用户发送消息 → 意图分析中
    → 无需工具 → 流式输出文字 → 空闲
    → 需要工具 → Tool Call 执行中
      → 成功 → 结果卡片出现 → 空闲
      → 失败 → 错误处理（见 8.2）
```

### 8.2 错误处理

| 场景 | UI 表现 | 用户操作 |
|------|---------|---------|
| 工具超时 | OptionCard：「重试 / 跳过 / 换模型」 | 三选一 |
| 工具返回错误 | ErrorBubble（红色边框）+ 错误摘要 | 「重试」按钮 |
| 网络断开 | 状态栏变红 + 「重连中...」 | 自动重连，失败后「刷新」 |
| 质量不达标 | OptionCard（问题 + 4 个选项） | 用户决策 |

### 8.3 消息历史与会话管理

- 单次会话内消息无限滚动，不分页
- 新消息出现时自动滚动到底部，但用户手动上翻后固定（出现「↓ 新消息」提示）
- 消息不持久化到本地（刷新即重置），仅 Agent State 持久化

---

## 9. 对话 ↔ 画布 双向事件协议

### 9.1 对话 → 画布（push_to_canvas 事件）

| 事件类型 | 触发工具 | 目标区域 | 画布响应 | 优先级 |
|---------|---------|---------|---------|--------|
| `music_analysis_ready` | analyze_music | 音乐分析区 | 情绪曲线 + 关键词出现 | P0 |
| `proposal_generated` | generate_proposals | 方案区 | 方案 Tab 出现 | P0 |
| `proposal_selected` | 用户选择 | 方案区 | 高亮选中 Tab | P0 |
| `asset_created` | generate_image | 视觉资产区 | 新卡片 scale-in | P0 |
| `asset_updated` | regenerate | 视觉资产区 | 替换内容 + 闪烁 | P0 |
| `asset_placed` | 用户点击"放入画布" | 对应区域 | 滚动定位 + 高亮 | P0 |
| `storyboard_ready` | mv_planner | 分镜表格区 | 分镜表格出现 | P0 |
| `shots_generated` | mv_generator | 时间线 | clip 占位出现 | P0 |
| `video_clip_progress` | generate_video（逐个） | 时间线 | 单个 clip 状态更新 | P0 |
| `video_clips_ready` | generate_video（完成） | 时间线 + 预览区 | 所有 clip 就位 | P0 |
| `quality_issue` | evaluate_quality | 对应元素 | 橙色警告边框 | P0 |
| `references_ready` | web_search | 对话区 | 参考卡片 | P1 |
| `canvas_focus` | 任何 | 指定元素 | 滚动定位 + 高亮 | P1 |

### 9.2 画布 → 对话（反向事件）

| 事件类型 | 触发操作 | Agent 响应 | 优先级 |
|---------|---------|-----------|--------|
| `element_selected` | 用户选中画布元素 | Agent 读 State 定位数据 | P0 |
| `asset_deleted` | 用户删除资产 | "已从资产库移除" | P0 |
| `proposal_edited` | 用户编辑方案 | "方案已更新，需要同步分镜吗？" | P1 |
| `clip_reordered` | 用户拖动时间线 | "时间线已更新" | P1 |
| `preview_requested` | 用户点击预览 | 打开 Preview 弹窗 | P2 |

### 9.3 画布 → Agent 反向事件详述

| 事件类型 | 方向 | 说明 | 优先级 |
|---------|------|------|--------|
| `element_selected` | canvas→agent | 用户选中元素时广播，Agent 更新内部 context pointer | P0 |
| `element_deleted` | canvas→agent | 用户删除元素时广播，Agent 更新 State | P0 |
| `element_reordered` | canvas→agent | 用户拖拽排序时广播，Agent 同步 | P0 |
| `property_changed` | canvas→agent | 用户编辑元素属性时广播，Agent 合并 delta | P1 |
| `element_created` | canvas→agent | 用户手动创建/上传时广播，Agent 注册到资产库 | P1 |

### 9.4 Agent → 画布 引导能力

| 事件类型 | 方向 | 说明 | 优先级 |
|---------|------|------|--------|
| `highlight_element` | agent→canvas | 高亮/脉冲某个元素，引导用户注意 | P1 |
| `focus_element` | agent→canvas | 平移+缩放画布，聚焦到指定元素 | P1 |
| `annotate_element` | agent→canvas | 在元素上附加浮动注释（空间标注） | P2 |

---

## 10. 完整交互流程示例

### 10.1 从零到完整 MV

```
用户: "帮我为《晴天》做一支 MV" [上传: 晴天.mp3]

Step 0: Agent 识别意图 = mv_creation
  → 模式层: M1 activate_workspace("mv_creation")
    → UI: 全屏对话 → 360px 对话 + 70% 画布
    → 初始化: 创建 Page_1，设置默认 region 布局
  → 感知层: P2 analyze_music("晴天.mp3")
    → 返回: { bpm: 128, key: "G", structure: [Intro,Verse,Chorus,Bridge,Outro] }
  → 画布层: C1 push_to_canvas("music_analysis", "music_area", data)
  → 回复: TextReply("这首歌 BPM 128，G 大调，结构为 Intro→Verse→Chorus→Bridge→Outro")

Step 1: 用户: "开始吧"
  → Agent 调用 Skill: S1 generate_proposals
    → 内部: LLM 构思 3 个方案（叙事结构 + 视觉风格）
    → 资产生成: S11/S12 generate_image × 6 (3 方案 × 角色 + 场景)
    → 画布: C1 push_to_canvas("proposal_generated", "proposal_area", data)
  → 回复: ProposalCard × 3

Step 2: 用户: "选方案 A"
  → Agent 更新 State，pipeline_stage → proposals
  → 画布: C1 push_to_canvas("proposal_selected", "proposal_area", { id: "A" })
  → 回复: TextReply("好的，开始为方案 A 规划分镜")

Step 3: 用户: "生成分镜"
  → Agent 调用 Skill: S7 creative_analysis_story → 创意分析（Story 模式）
    → 输出: mv_guide JSON（含 style_guide, md_stages, mv_elements）
  → 画布: C1 push_to_canvas("storyboard_ready", "storyboard_area", data)
  → Agent 调用 Skill: S3 mv_generator → 分镜 JSON 生成
  → 画布: C1 push_to_canvas("shots_generated", "timeline", data)
  → 回复: TextReply("8 个镜头已规划完成，要生成视频吗？")

Step 4: 用户: "生成视频"
  → Agent 调用 Skill: S4 video_generation
    → 逐 shot: T2 generate_video(frame_url=分镜图, duration=时长)
    → 每完成一个: C1 push_to_canvas("video_clip_progress", "timeline", data)
    → T4 evaluate_quality 自动质检
    → 全部完成: C1 push_to_canvas("video_clips_ready", "timeline", data)
  → 回复: ProgressIndicator → TextReply("MV 生成完成！可以预览或导出")

Step 5: 用户: "Shot 3 的脸歪了，重做"
  → Agent 调用 Skill: S5 revise_shot
    → P1 read_asset(Shot_3.frame_url) → 理解当前状态
    → LLM 分析用户意图 → 修改 prompt
    → T1 generate_image(new_prompt, asset_type="storyboard")
    → T2 generate_video(new_frame_url)
    → T4 evaluate_quality → score 85 → 通过
    → C7 update_element("Shot_3", { video_url: new_url })
  → 回复: AssetCard(新分镜图 + 新视频)

Step 6: 用户: "导出成片"
  → Agent 调用 Skill: S6 export_mv
    → T3 run_ffmpeg(operation="concat", inputs=[所有shot])
    → T3 run_ffmpeg(operation="add_subtitles", ...)
    → T3 run_ffmpeg(operation="convert", format="mp4")
  → 回复: AssetCard(最终视频 + 下载按钮)
```

### 10.2 自由跳入

```
用户: "帮我生成一张赛博朋克风格的主角图"
  → M1 activate_workspace("generate_image")
  → 感知层: S13 cinematic_prompt_generator → 9 维度构建 prompt
  → 工具层: T1 generate_image(prompt="cyberpunk protagonist...", asset_type="character")
  → 画布层: C1 push_to_canvas("asset_created", "visual_assets", data)
  → 回复: AssetCard(图片 + "放入画布"按钮)

用户: "搜索王家卫风格的 MV 参考"
  → M1 activate_workspace("web_search")
  → 工具层: T5 web_search(query="王家卫 MV reference")
  → 回复: AssetCard × N (参考列表)

用户: "质量怎么样"
  → P1 read_asset(last_asset_id) → 获取 URL
  → T4 evaluate_quality(asset_url=asset.url, asset_type="image")
  → score >= 70 → TextReply("质量良好，score: 82")
  → score < 70  → OptionCard(问题 + 选项)
```

### 10.3 多 Page 场景

```
用户: "先做 A 歌的 MV"
  → activate_workspace → 创建 Page_1 (A 歌)

用户: "再帮我为 B 歌也做一个"
  → C2 open_page("B_song_mv") → 创建 Page_2
  → C3 switch_page("page_2") → 切换到 B 歌
  → 开始 B 歌的 MV 生成流程（独立 State）

用户: "把 A 歌的主角图用到 B 歌里"
  → 读取 Page_1 的 assets → 复制到 Page_2 的 assets
  → C1 push_to_canvas("asset_created", "visual_assets", { ...page_1_character_data })
```

---

## 11. 动画总表

| 场景 | 属性 | 时长 | Easing |
|------|------|------|--------|
| 消息气泡入场 | `translateY(8px)→0` + `opacity 0→1` | 180ms | ease-out |
| AssetCard 入场 | `scale(0.92)→1` + `opacity 0→1` | 150ms | ease-out |
| OptionCard 展开 | `height 0→auto` | 140ms | ease-out |
| ProgressIndicator 更新 | 进度条 width 过渡 | 200ms | linear |
| Tool Call 状态栏出现/消失 | `height 0↔36px` | 160ms | ease |
| LoadingState 三点弹跳 | `translateY -4px→0` | 400ms/点 | ease-in-out |
| @ 浮层弹出 | `scale(0.95)→1` + `opacity` | 120ms | ease-out |
| 错误气泡抖动 | `translateX ±4px` 3次 | 320ms | ease-in-out |
| 画布模式切换 | `grid-template-columns` 过渡 | 300ms | ease-in-out |

---

## 12. 快捷键

| 快捷键 | 功能 | 作用域 |
|--------|------|--------|
| `Enter` | 发送消息 | 输入框聚焦时 |
| `Shift + Enter` | 换行 | 输入框聚焦时 |
| `Esc` | 停止当前工具调用 | 工具执行中 |
| `@` | 触发引用选择器 | 输入框聚焦时 |
| `/` | 触发命令面板 | 输入框聚焦时 |

---

## 13. 术语表

| 术语 | 含义 |
|------|------|
| `activate_workspace` | 从全屏对话切换到 30% 对话 + 70% 画布的 UI 模式切换操作 |
| `push_to_canvas` | Agent 向画布推送数据的唯一通道，通过 event_type 分发 |
| `mv_guide` | 创意分析 Skill 的输出格式，含 style_guide、md_stages、mv_elements |
| `pipeline_stage` | 流程阶段标记（idle → music_analysis → proposals → storyboard → video_generation → review） |
| `Page` | 画布的工作区单位，每个 Page 独立维护 State |
| `region` | 画布上的功能区域（music_area / proposal_area / visual_assets / timeline） |

---

## 14. Agent State 结构

### 14.1 单 Page State

```typescript
interface PageState {
  page_id: string;
  title: string;
  pipeline_stage: "idle" | "music_analysis" | "proposals" | "assets" | "storyboard" | "video_generation" | "review";
  audio_url: string | null;
  music_analysis: MusicAnalysis | null;
  selected_proposal: string | null;
  proposals: Proposal[];
  storyboard: ShotJSON[] | null;
  assets: Record<string, Asset>;       // asset_id → Asset
  video_clips: VideoClip[];
  quality_reports: QualityReport[];
}
```

### 14.2 全局 State

```typescript
interface AgentState {
  workspace_active: boolean;
  current_page_id: string;
  pages: Map<string, PageState>;      // 方案 A: Map<page_id, State>
  intent_history: IntentRecord[];
  tool_call_status: ToolStatus[];
  personality: "director" | "creative" | "gentle" | "harsh" | "artist";
}
```

---

## 15. 异常与边界情况

### 15.1 输入异常

| 场景 | 处理 |
|------|------|
| 用户上传不支持的文件类型 | Toast "不支持的文件格式"，不进入处理流程 |
| 上传文件超过大小限制 | Toast "文件大小超过 200MB 限制" |
| 空消息发送 | 发送按钮禁用，无法发送 |
| 上传的音频文件损坏 | P2 analyze_music 返回错误 → ErrorBubble + 重试选项 |

### 15.2 工具异常

| 场景 | 处理 |
|------|------|
| 图片生成超时（> 30s） | OptionCard：重试 / 换模型 / 跳过 |
| 视频生成失败（模型报错） | ErrorBubble + 自动触发回退（retry → switch_model → degrade） |
| 质检 API 不可用 | 跳过质检，TextReply 告知用户 "质量检测暂不可用" |
| ffmpeg 执行失败 | ErrorBubble + 错误详情 + 重试 |

### 15.3 状态异常

| 场景 | 处理 |
|------|------|
| 用户在非 MV 意图下发送消息 | 不触发 activate_workspace，保持全屏对话 |
| 用户刷新页面 | 从持久化 State 恢复，画布状态保留，对话消息丢失 |
| 多 Page 同时编辑同一资产 | 使用 Lamport 时间戳检测冲突，后写入的覆盖先写入的 |
| 网络断开 | 状态栏变红 + "重连中..."，本地缓存用户输入，重连后自动发送 |

---

## 16. 外部依赖

| 依赖 | 用途 | 状态 |
|------|------|------|
| 图片生成 API（Seedance 2.0 / MidJourney 等） | T1 generate_image | 需接入 |
| 视频生成 API（Kling 3.0 / Wan 2.7 / Seedance 2.0） | T2 generate_video | 需接入 |
| 音频分析 API | P2 analyze_music | 需接入 |
| VLM API（质量检测 / 图片理解 / 视频理解） | T4 evaluate_quality, P4, P5 | 需接入 |
| Lip-Sync API | T6 lip_sync | 需接入 |
| Face-Swap API | T7 face_swap | 需接入 |
| 搜索 API | T5 web_search | 需接入 |
| ffmpeg（服务端） | T3 run_ffmpeg | 需接入 |
| 存储服务 | P1 read_asset, get_asset | 需接入 |

---

## 17. 非功能性需求

### 17.1 性能指标

| 维度 | 要求 |
|------|------|
| 消息渲染延迟 | < 100ms（首条消息出现） |
| Tool Call 状态栏更新 | < 200ms（状态变更到 UI 响应） |
| 画布 push_to_canvas 响应 | < 300ms（事件分发到渲染完成） |
| 模式切换动画 | 300ms，不掉帧 |
| 流式输出延迟 | < 50ms/字符 |
| 首屏加载 | ≤ 2s |

### 17.2 兼容性

| 维度 | 要求 |
|------|------|
| 浏览器 | Chrome 120+, Safari 17+, Edge 120+ |
| 设备 | 桌面端（≥ 1280px 宽），不做移动端适配 |
| 国际化 | 所有 UI 文本使用 i18n key，初始英文，后续中文 |

---

## 18. 埋点事件清单

| 事件名 | 触发时机 | 参数 | 对应指标 |
|--------|---------|------|---------|
| `agent_page_view` | 进入对话页面 | `page_id`, `workspace_active` | 流量基准 |
| `workspace_activated` | activate_workspace 触发 | `intent_type` | 画布激活率 |
| `tool_call_start` | 工具开始调用 | `tool_name`, `params_summary` | 工具调用成功率 |
| `tool_call_success` | 工具调用成功 | `tool_name`, `duration_ms` | 工具调用成功率 |
| `tool_call_failure` | 工具调用失败 | `tool_name`, `error_code` | 工具调用成功率 |
| `message_sent` | 用户发送消息 | `has_attachment`, `has_mention` | 平均交互轮数 |
| `option_selected` | 用户在 OptionCard 中做选择 | `option_label`, `context` | 决策转化率 |
| `proposal_selected` | 用户选择方案 | `proposal_id` | 方案采纳率 |
| `asset_placed_on_canvas` | 用户点击"放入画布" | `asset_type`, `asset_id` | 资产使用率 |
| `quality_issue_shown` | 质检未通过展示 OptionCard | `asset_type`, `score` | 质量合格率 |
| `export_click` | 用户点击导出 | `clip_count`, `total_duration` | MV 完成率 |

**MV 完成率计算公式：**
`MV 完成率 =（当日触发 workspace_activated 且当日触发 export_click 的独立用户数）/（当日触发 agent_page_view 的独立用户数）`

---

## 19. v1 范围与后续规划

### 19.1 v1 包含

| 层级 | 能力 | 说明 |
|------|------|------|
| L0 | M1 activate_workspace | 全屏对话 ↔ 30/70 画布切换 |
| L1 | P1, P2 | read_asset, analyze_music |
| L2 | C1, C2, C3, C4, C5, C6, C7, C8 | 画布操作（不含 layout_elements） |
| L3 | T1, T2, T4 | generate_image, generate_video, evaluate_quality |
| L4 | S1, S2, S3, S4, S5, S7, S8, S9, S11, S12, S13, mv-generation-一段式 | 编排型 Skill + Story/Visions/Lipsync 创意分析 + 资产生成 + 视频生成 |

### 19.2 后续版本（不在 v1 范围）

| 层级 | 能力 | 版本 | 说明 |
|------|------|------|------|
| L0 | M2 deactivate_workspace | V2 | 收起画布回到全屏对话 |
| L1 | P3, P4, P5, P6 | V2 | parse_lyrics, analyze_image/video, read_text_file |
| L2 | C9 layout_elements | V2 | 画布元素排列 |
| L3 | T3, T5, T6, T7 | V2 | run_ffmpeg, web_search, lip_sync, face_swap |
| L4 | S6 export_mv, S10 clone_mode | V2 | 导出成片, Clone 模式创意分析 |
| L4 | mv-generation-二段式, sd2 版本 | V2 | 双节点拆分版 + SD2 专用版 |
