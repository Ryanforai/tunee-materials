# MV Agent 原子化工具与对话架构调研报告

> 调研日期：2026-04-23
> 调研范围：原子化工具/Skill 架构、Agent 意图识别与工具调度、画布同步与对话展示
> 参考文档：MV 剪辑台设计文档 v6、chat_agent.md/refactored、视频skill SKILL.md

---

## 第一部分：功能原子化清单

### 1.1 原子工具全景图

基于 MV 创作全流程，将功能拆分为三层工具机制：

| 层级 | 定位 | 特点 | 示例 |
|------|------|------|------|
| **Tool** | 单步、确定性操作 | 快速返回、无状态、幂等 | 音频分析、资产上传、文件操作 |
| **Skill** | 多步骤、有内部逻辑的工作流 | 自含路由/引用/分发、可能多轮 | mv-planner、mv-generator |
| **MCP** | 外部服务集成 | 网络调用、可能慢、需要超时 | 模型 API、Web 搜索、存储 |

### 1.2 原子工具清单（不可再拆）

**判断标准**：做一件事，返回一个结果，不编排内部步骤。如果拆开它还能得到更小的有用操作，它就不是原子的。

#### 真正的原子工具（8 个）

**Tool: `analyze_music`**
- **输入**：`{ audio_url: string, audio_type: "song"|"instrumental" }`
- **输出**：`{ bpm: number, key: string, time_signature: string, style_tags: string[], mood_curve: [{ time: number, energy: number, emotion: string }], lyrics_analysis: { language: string, themes: string[], structure: string[] } }`
- **触发**：用户上传音乐
- **耗时**：~5-15s

**Tool: `generate_image`**
- **输入**：`{ prompt: string, negative_prompt?: string, model?: string, size?: string, seed?: number, asset_type: "character"|"scene"|"prop"|"storyboard", asset_name?: string }`
- **输出**：`{ image: { url: string, prompt_used: string, seed: number, width: number, height: number, asset_type: string, asset_name?: string } }`
- **触发**：任何需要图片的场景
- **注意**：一次只生成 1 张，并行由 Agent 调度
- **耗时**：~5-20s

**Tool: `generate_text`**
- **输入**：`{ prompt: string, style?: string, max_tokens?: number, temperature?: number, purpose: "narrative"|"visual_style"|"treatment"|"video_prompt"|"frame_prompt"|"lyrics"|"description" }`
- **输出**：`{ text: string, metadata: { tokens_used: number, model: string } }`
- **触发**：任何需要文字生成的场景（叙事结构、视觉风格、分镜 treatment、prompt 等）
- **耗时**：~2-8s

**Tool: `upload_asset`**
- **输入**：`{ file_url: string, file_type: "image"|"video"|"audio"|"text", asset_type?: string, tags?: string[] }`
- **输出**：`{ asset_id: string, url: string, thumbnail_url: string, metadata: { width?, height?, duration?, format? } }`
- **触发**：用户上传本地文件
- **耗时**：~1-5s

**Tool: `evaluate_quality`**
- **输入**：`{ asset_url: string, asset_type: "image"|"video", criteria?: string[] }`
- **输出**：`{ score: number (0-100), issues: [{ type: string, severity: "critical"|"warning"|"info", description: string, region?: { x, y, w, h } }], suggestion: string }`
- **触发**：资产/视频生成后自动调用
- **耗时**：~3-10s

**Tool: `web_search`**
- **输入**：`{ query: string, source?: string, max_results?: number (default 5) }`
- **输出**：`{ references: [{ title: string, url: string, thumbnail_url?: string, summary: string }] }`
- **触发**：用户搜索参考/灵感不足
- **耗时**：~2-8s

**Tool: `select_model`**
- **输入**：`{ capability: string, constraints: { max_duration?: number, min_duration?: number, style?: string }, user_preference?: string }`
- **输出**：`{ model_key: string, model_name: string, constraints: { max_duration, min_duration } }`
- **触发**：任何需要选择模型的场景（生成前自动路由）
- **耗时**：< 1s

**Tool: `check_timeline`**
- **输入**：`{ stages: [{ start: number, end: number }], audio_duration: number, model_constraints: { min: number, max: number } }`
- **输出**：`{ valid: boolean, issues: [{ type: "gap"|"overlap"|"out_of_range", stage_index: number, detail: string }], fixed_stages?: [{ start: number, end: number }] }`
- **触发**：分镜规划前校验时间轴连续性
- **耗时**：< 1s

#### 组合 Skill（原子工具的编排，非原子）

以下 Skill **不直接实现功能**，而是按固定顺序调用原子工具：

```
generate_proposals (Skill) =
  ① generate_text(purpose="narrative")         ← 叙事结构
  ② generate_text(purpose="visual_style")      ← 视觉风格
  ③ generate_image × N(asset_type="character") ← 角色图（可选）
  ④ generate_image × N(asset_type="scene")     ← 场景图（可选）
  ⑤ generate_text(purpose="description")       ← 方案描述汇总

mv_planner (Skill) =
  ① check_timeline()                           ← 校验时间轴
  ② select_model(capability="video")           ← 选择模型
  ③ generate_text(purpose="treatment") × N     ← 每个 SHOT 的 treatment

mv_generator (Skill) =
  ① generate_text(purpose="video_prompt") × N  ← 每个 SHOT 的视频 prompt
  ② generate_text(purpose="frame_prompt") × N  ← 每个 SHOT 的分镜 prompt

video_generation (Skill) =
  ① mv_generator()                             ← 生成所有 prompt
  ② MCP.video_api × N                          ← 逐 shot 调用视频模型
```

#### MCP Servers（外部服务）

| MCP | 接口 | 特性 |
|-----|------|------|
| `video_model_api` | `generate_video(prompt, frame_reference?, duration, model)` → `{ video_url, status }` | 异步，60-120s |
| `image_model_api` | `generate_image(prompt, size?, seed?)` → `{ image_url }` | 短异步，~20s |
| `storage_service` | `upload`, `download`, `list`, `delete`, `version` | 同步 |

### 1.3 原子性对比：改造前 vs 改造后

| 改造前（伪原子） | 问题 | 改造后（真原子） |
|-----------------|------|-----------------|
| `generate_proposals` 一个黑盒 Skill | 内部 5 步，用户无法干预中间结果 | 拆为 `generate_text` × 3 + `generate_image` × N |
| `generate_image` 一次 count=N | N 张一起返回，失败一张要重跑全部 | 一次 1 张，Agent 并行调度 |
| `mv-planner` 包含 timeline 校验 + treatment | 校验失败整步回退 | `check_timeline` 独立，treatment 用 `generate_text` |
| `add_to_canvas` 列为工具层 | 不产生内容，只是搬运 | 归入前端画布操作，不是 Agent 工具 |

### 1.4 原子工具的画布事件

每个原子工具自带一个 `to_canvas_event` 方法：

```python
TOOL_CANVAS_EVENTS = {
    "analyze_music":    CanvasEvent(type="music_analysis_ready",   target_region="music_analysis"),
    "generate_image":   CanvasEvent(type="asset_created",          target_region="visual_assets"),
    "generate_text":    CanvasEvent(type="text_generated",         target_region="active"),
    "upload_asset":     CanvasEvent(type="asset_created",          target_region="visual_assets"),
    "evaluate_quality": CanvasEvent(type="quality_issue",          target_region="active"),
    "web_search":       CanvasEvent(type="references_ready",       target_region="dialog"),
    "select_model":     None,  # 不产生画布内容
    "check_timeline":   None,  # 不产生画布内容
}
```

### 1.5 原子工具依赖图

```
外部输入
  │
  ├── 音频 → analyze_music ──────────────────────┐
  ├── 文件 → upload_asset  ──────────────────────┤
  ├── 文字 → web_search  ────────────────────────┤
  │                                              │
  │  原子工具（可直接调用）                        │
  ├── generate_image ────────────────────────────┤
  ├── generate_text  ────────────────────────────┤
  ├── evaluate_quality ──────────────────────────┤
  ├── select_model ──────────────────────────────┤
  └── check_timeline ────────────────────────────┘
           │
           │  Skill 层（原子工具的固定编排）
           ├→ generate_proposals = generate_text × 3 + generate_image × N
           ├→ mv_planner = check_timeline + select_model + generate_text × N
           ├→ mv_generator = generate_text × 2N
           └→ video_generation = mv_generator + MCP.video_api × N
```

### 1.6 可独立运行 vs 需组合运行

| 原子工具 | 可独立 | 说明 |
|---------|--------|------|
| analyze_music | 是 | 任何时间可单独重新分析 |
| generate_image | 是 | 最自由，随时生成 |
| generate_text | 是 | 任何文字生成都可直接调 |
| upload_asset | 是 | 直接上传 |
| evaluate_quality | 是 | 检查任意资产 |
| web_search | 是 | 独立补充信息 |
| select_model | 否 | 被其他工具/ Skill 内部调用 |
| check_timeline | 否 | 被 mv_planner 内部调用 |

---

## 第二部分：工具注册与发现机制

### 2.1 工具注册 Schema

```typescript
interface ToolRegistry {
  // 唯一标识
  id: string;           // "generate_image"
  name: string;         // "生成图片"
  layer: "tool" | "skill" | "mcp";

  // 描述（用于 Agent 意图匹配）
  description: string;  // "根据文字描述生成图片，支持角色/场景/物品/分镜图"

  // 输入输出 Schema（JSON Schema）
  input_schema: JSONSchema;
  output_schema: JSONSchema;

  // 元信息
  version: string;      // "1.0.0"
  author?: string;
  tags: string[];       // ["image", "generation", "asset"]

  // 依赖声明
  dependencies: string[];      // 依赖的工具 ID 列表
  requires_auth: boolean;      // 是否需要认证
  requires_canvas: boolean;    // 是否需要画布上下文

  // 性能特征
  avg_latency_ms: number;      // 平均延迟
  max_parallel: number;        // 最大并行数
  cost_estimate?: number;      // 预估成本

  // 状态
  enabled: boolean;
  canary: boolean;             // 灰度发布标记
}
```

### 2.2 注册表存储

```json
// tools-registry.json（随代码发布）
{
  "tools": [
    {
      "id": "generate_image",
      "name": "生成图片",
      "layer": "tool",
      "description": "根据文字描述生成图片，支持角色/场景/物品/分镜图",
      "version": "1.0.0",
      "tags": ["image", "generation", "asset"],
      "dependencies": ["image_model_api"],
      "requires_auth": true,
      "requires_canvas": false,
      "avg_latency_ms": 10000,
      "max_parallel": 4,
      "enabled": true,
      "canary": false
    }
    // ... 更多工具
  ]
}
```

### 2.3 动态发现与加载

```python
# tool_discovery.py
class ToolDiscovery:
    def __init__(self, registry_path: str):
        self.registry = self._load_registry(registry_path)
        self._tools = {}
        self._load_tools()

    def _load_registry(self, path: str) -> dict:
        with open(path) as f:
            return json.load(f)

    def _load_tools(self):
        for tool_def in self.registry["tools"]:
            if not tool_def["enabled"]:
                continue
            # 灰度：canary 工具只对特定用户开放
            if tool_def["canary"]:
                continue
            self._tools[tool_def["id"]] = tool_def

    def discover_by_intent(self, intent: str) -> list[str]:
        """根据意图关键词匹配可用工具"""
        matches = []
        for tool_id, tool in self._tools.items():
            score = self._semantic_match(intent, tool["description"], tool["tags"])
            if score > 0.7:
                matches.append((tool_id, score))
        matches.sort(key=lambda x: x[1], reverse=True)
        return [m[0] for m in matches]

    def get_tool(self, tool_id: str):
        return self._tools.get(tool_id)

    def get_dependencies(self, tool_id: str) -> list[str]:
        """递归获取依赖链"""
        tool = self._tools.get(tool_id)
        if not tool:
            return []
        deps = []
        for dep_id in tool["dependencies"]:
            deps.append(dep_id)
            deps.extend(self.get_dependencies(dep_id))
        return list(set(deps))
```

### 2.4 版本管理与灰度发布

```python
class ToolVersionManager:
    def register_version(self, tool_id: str, version: str, canary: bool = False):
        """注册新版本，支持多版本并存"""
        key = f"{tool_id}@{version}"
        self._versions[key] = {
            "tool_id": tool_id,
            "version": version,
            "canary": canary,
            "rollout_percentage": 0 if canary else 100
        }

    def get_active_version(self, tool_id: str, user_id: str = None) -> str:
        """获取用户应使用的版本"""
        candidates = [
            (k, v) for k, v in self._versions.items()
            if v["tool_id"] == tool_id and v["enabled"]
        ]
        # 灰度：按 user_id hash 决定是否命中 canary
        for key, v in candidates:
            if v["canary"]:
                if user_id and hash(user_id) % 100 < v["rollout_percentage"]:
                    return key
        # 默认返回最新稳定版
        stable = [k for k, v in candidates if not v["canary"]]
        return max(stable) if stable else candidates[0][0]
```

---

## 第三部分：参考现有 Skill 架构模式

### 3.1 mv-planner 架构提取

现有 `mv-planner/SKILL.md` 的核心架构模式：

```
frontmatter（元数据 + 触发条件）
    ↓
§1 输入与解析（字段校验、风格映射、异常兜底）
    ↓
§1.5 条件触发（按需加载 reference，不预先加载）
    ↓
§2 Preflight（资源注册 + Stage Plan 解析）
    ↓
§3 时长校验与 Shot 组织（拆分/合并）
    ↓
§4 Stage Fidelity（保真约束）
    ↓
§R 路由判断（决定加载哪些 reference）
    ↓
输出（纯文本：SUMMARIZE + DIRECTING + SHOT 列表）
```

**可复用的关键模式**：

1. **Lazy Loading References**：SKILL.md 声明目录结构，只在需要时才加载 reference 文件。这减少了上下文消耗，避免不必要的信息干扰。

2. **Route-and-Dispatch**：路由判断（§R）根据输入特征选择加载不同的 reference，而非把所有知识塞进一个 prompt。

3. **Fallback by Design**：每个阶段都有异常兜底（有效风格缺失 → 参考图主导模式；场景名不匹配 → 保留原文继续）。

4. **Output Discipline**：明确约束输出格式（纯文本/JSON，无 markdown fence），下游解析不需要处理格式噪声。

### 3.2 mv-generator 架构提取

```
frontmatter（元数据）
    ↓
路由（planner_text 类型 → prompt-guide）
    ↓
执行规则（8 条硬约束）
    ↓
输出 Schema（严格 JSON，禁止额外字段）
```

**可复用的关键模式**：

1. **Forbidden Fields List**：明确列出禁止输出的字段，防止 Skill 输出下游不需要的中间状态。

2. **Prompt Completeness Guarantee**：`video_prompt / frame_prompt` 是完整成品，不依赖外部拼装。这意味着每个 Skill 的输出是自包含的。

3. **Schema Enforcement**：输出 JSON 的字段类型和必填约束明确，下游可以安全解析。

### 3.3 新模式建议：Agent 级 Skill 编排

现有 Skill 是单点的（planner 或 generator）。MV Agent 需要一个更高层级的编排 Skill：

```
mv-agent/SKILL.md
├── frontmatter: name, description, triggers
├── §1 阶段判断（当前处于创作流程的哪个阶段）
├── §2 工具路由（根据意图 + 阶段选择工具组合）
├── §3 执行策略（顺序/并行/条件）
├── §4 结果汇总（将工具输出整理为用户可理解的回复 + 画布事件）
└── references/
    ├── intent-patterns.md      ← 意图模式匹配规则
    ├── stage-transitions.md    ← 阶段转换规则
    └── fallback-strategies.md  ← 错误回退策略
```

---

## 第四部分：Agent 意图识别与工具调度

### 4.1 MV 场景意图路由扩展

在现有 chat_agent 的意图系统基础上，扩展 MV 创作相关意图：

```
PHASE 0E: MV 创作意图路由

| 用户表达模式                      | 意图                         | 映射工具                          |
|---------------------------------|-----------------------------|----------------------------------|
| "生成/做/画 一张角色图/场景图"     | generate_image              | Tool: generate_image             |
| "生成几个角色/场景"               | generate_images_batch       | Tool: generate_image (count=N)   |
| "把这个放到画布上/用这张"         | add_to_canvas               | Tool: add_to_canvas              |
| "方案A/继续/开始分镜"            | proceed_next_stage          | Skill: generate_proposals → planner |
| "镜头X重新生成/脸歪/换个角度"     | regenerate_shot             | Skill: mv-generator (shot_id=X)  |
| "搜索参考/找灵感/看看类似MV"      | search_reference            | Tool: web_search_reference       |
| "不太好/换方向/换一个"           | feedback_regenerate         | feedback → regenerate_proposal   |
| "导出/导出成片/下载视频"         | export                      | MCP: video_model_api + storage   |
| "分析下这首歌/音乐怎么样"         | analyze_music               | Tool: analyze_music              |
| "帮我做个MV/制作MV"             | mv_creation_full            | 全流程编排                        |
| "质量怎么样/检查一下"            | evaluate                    | Tool: evaluate_quality           |
| "上传图片/用这张参考"            | upload_reference            | Tool: upload_asset               |
```

### 4.2 意图决策树

```
用户输入
  │
  ├── 含上传附件？
  │   ├── 音频 → PHASE 0B（现有 chat_agent 音频路由）
  │   ├── 图片 → intent = upload_reference 或 generate_image（根据上下文）
  │   └── 视频 → intent = upload_reference
  │
  ├── 引用画布元素？（[@方案A] [@镜头3]）
  │   ├── 含"重新生成/换/改" → intent = regenerate_shot
  │   ├── 含"放到画布/用这个" → intent = add_to_canvas
  │   └── 含"质量/检查" → intent = evaluate
  │
  ├── 含动作关键词？（生成/做/画/创建）
  │   ├── 含"角色/场景/分镜" → intent = generate_image
  │   ├── 含"MV/视频" → intent = mv_creation
  │   └── 含"方案/方向" → intent = generate_proposals
  │
  ├── 含选择/确认关键词？（方案A/继续/确定/开始）
  │   └── → intent = proceed_next_stage
  │
  ├── 含搜索关键词？（搜索/找/参考/灵感）
  │   └── → intent = search_reference
  │
  ├── 含反馈/否定？（不好/换/不行/重新）
  │   └── → intent = feedback_regenerate
  │
  ├── 含导出关键词？（导出/下载/成片）
  │   └── → intent = export
  │
  └── 其他 → PHASE 0C（chat_agent 已有意图）
```

### 4.3 LangGraph StateGraph 实现

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict, Optional, Literal

# ── State 定义 ──
class MVAgentState(TypedDict):
    # 用户输入
    user_message: str

    # 意图
    intent: str                          # "generate_image" | "mv_creation" | ...
    intent_confidence: float             # 0.0-1.0

    # 创作阶段
    current_stage: str                   # "idle" | "music_analysis" | "proposals" | "assets" | "storyboard" | "video_generation" | "review"

    # 上下文数据
    music_analysis: Optional[dict]       # analyze_music 输出
    proposals: Optional[list]            # generate_proposals 输出
    selected_proposal_id: Optional[str]
    assets: Optional[list]               # 资产列表
    planner_output: Optional[str]        # mv-planner 输出
    generator_output: Optional[dict]     # mv-generator 输出 (shot JSON)
    video_clips: Optional[list]          # 已生成的视频片段

    # 画布状态
    canvas_events: list                  # 待推送到画布的事件

    # 对话历史
    conversation_history: list
    last_tool_result: Optional[dict]

    # 错误
    error: Optional[str]
    retry_count: int

# ── Node 函数 ──
def detect_intent(state: MVAgentState) -> MVAgentState:
    """意图识别节点 — 对应 chat_agent 的 PHASE 0"""
    # 调用 chat_agent 或本地模式匹配
    # 返回 intent + confidence
    return {"intent": intent, "intent_confidence": confidence}

def route_by_intent(state: MVAgentState) -> str:
    """条件路由 — 返回下一个节点名"""
    intent = state["intent"]
    route_map = {
        "generate_image": "tool_generate_image",
        "generate_images_batch": "tool_generate_image",
        "add_to_canvas": "tool_add_to_canvas",
        "proceed_next_stage": "route_next_stage",
        "regenerate_shot": "tool_regenerate_shot",
        "search_reference": "tool_web_search",
        "feedback_regenerate": "tool_feedback",
        "export": "tool_export",
        "analyze_music": "tool_analyze_music",
        "mv_creation_full": "route_mv_creation_pipeline",
        "evaluate": "tool_evaluate",
        "upload_reference": "tool_upload_asset",
    }
    return route_map.get(intent, "agent_chat_response")

def tool_analyze_music(state: MVAgentState) -> MVAgentState:
    result = analyze_music_tool(audio_url=extract_audio(state))
    return {
        "music_analysis": result,
        "current_stage": "music_analysis",
        "canvas_events": [{"type": "music_analysis_ready", "data": result}],
        "last_tool_result": result
    }

def tool_generate_image(state: MVAgentState) -> MVAgentState:
    count = state.get("intent_confidence", 0) > 0.9 and 4 or 1  # 高置信度时批量
    result = generate_image_tool(
        prompt=extract_prompt(state),
        asset_type=extract_asset_type(state),
        count=count
    )
    # 并行生成
    images = result["images"]
    return {
        "assets": (state.get("assets") or []) + images,
        "canvas_events": [{"type": "asset_created", "data": images}],
        "last_tool_result": result
    }

def tool_mv_planner(state: MVAgentState) -> MVAgentState:
    """调用 mv-planner Skill"""
    plan = mv_planner_skill(
        mv_type="...",
        mv_guide=state["selected_proposal"],
        audio_duration=state["music_analysis"]["duration"],
        video_model=auto_select_model()
    )
    return {
        "planner_output": plan,
        "current_stage": "storyboard",
        "canvas_events": [{"type": "storyboard_ready", "data": plan}]
    }

def tool_mv_generator(state: MVAgentState) -> MVAgentState:
    """调用 mv-generator Skill"""
    shots = mv_generator_skill(
        planner_text=state["planner_output"],
        visual_style=state["selected_proposal"]["visual_style_description"],
        video_model=auto_select_model(),
        characters=state["selected_proposal"]["characters"],
        scenes=state["selected_proposal"]["scenes"]
    )
    return {
        "generator_output": shots,
        "last_tool_result": shots
    }

def tool_generate_video(state: MVAgentState) -> MVAgentState:
    """逐 shot 调用视频模型"""
    shots = state["generator_output"]["shots"]
    clips = []
    for shot in shots:
        clip = video_model_api.generate_video(
            prompt=shot["video_prompt"],
            frame_reference=shot.get("frame_prompt"),
            duration=shot["duration"],
            model=auto_select_model()
        )
        clips.append({**shot, "video_url": clip["video_url"], "status": clip["status"]})
    return {
        "video_clips": clips,
        "current_stage": "video_generation",
        "canvas_events": [{"type": "video_clips_ready", "data": clips}]
    }

def agent_chat_response(state: MVAgentState) -> MVAgentState:
    """兜底节点：生成对话回复"""
    reply = generate_reply(state)
    return {"conversation_history": reply}

# ── 图构建 ──
builder = StateGraph(MVAgentState)

# 添加节点
builder.add_node("detect_intent", detect_intent)
builder.add_node("tool_analyze_music", tool_analyze_music)
builder.add_node("tool_generate_image", tool_generate_image)
builder.add_node("tool_add_to_canvas", tool_add_to_canvas)
builder.add_node("tool_mv_planner", tool_mv_planner)
builder.add_node("tool_mv_generator", tool_mv_generator)
builder.add_node("tool_generate_video", tool_generate_video)
builder.add_node("tool_web_search", tool_web_search)
builder.add_node("tool_evaluate", tool_evaluate)
builder.add_node("route_next_stage", route_next_stage)
builder.add_node("agent_chat_response", agent_chat_response)

# 入口
builder.set_entry_point("detect_intent")

# 条件路由
builder.add_conditional_edges(
    "detect_intent",
    route_by_intent,
    # 所有可能的目标节点
    {
        "tool_generate_image": "tool_generate_image",
        "tool_analyze_music": "tool_analyze_music",
        "tool_mv_planner": "tool_mv_planner",
        "tool_mv_generator": "tool_mv_generator",
        "tool_generate_video": "tool_generate_video",
        "agent_chat_response": "agent_chat_response",
        # ...
    }
)

# 链式连接
builder.add_edge("tool_analyze_music", "agent_chat_response")
builder.add_edge("tool_generate_image", "agent_chat_response")
builder.add_edge("tool_mv_planner", "tool_mv_generator")
builder.add_edge("tool_mv_generator", "tool_generate_video")
builder.add_edge("tool_generate_video", "agent_chat_response")

app = builder.compile()
```

### 4.4 并行工具调用

```python
# 并行生成 4 张图片
import asyncio

async def parallel_generate_image(prompts: list) -> list:
    tasks = [generate_image_async(p) for p in prompts]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    # 处理部分失败
    return [r for r in results if not isinstance(r, Exception)]

# 在 LangGraph 中，使用 Send API 实现并行
def fan_out_generate(state: MVAgentState) -> list:
    """扇出：为每个角色生成图片"""
    characters = state["selected_proposal"]["characters"]
    return [
        Send("tool_generate_image", {
            "user_message": f"生成角色：{char['name']}",
            "prompt": char["appearance"],
            "asset_type": "character",
            "asset_name": char["name"]
        })
        for char in characters
    ]

# 使用 Send 时，LangGraph 会自动并行执行
builder.add_conditional_edges(
    "select_proposal",
    fan_out_generate,
    {"tool_generate_image": "tool_generate_image"}
)
```

### 4.5 回退机制

```python
class FallbackStrategy:
    """工具调用失败时的回退链"""

    STRATEGIES = {
        "generate_image": [
            {"retry_same_model": True, "max_retries": 1},
            {"switch_model": True, "priority_models": ["seedance_2_0", "flux"]},
            {"degrade_to_text": True, "fallback": "返回文字描述到画布"}
        ],
        "generate_video": [
            {"retry_same_model": True, "max_retries": 1},
            {"switch_model": True, "priority_models": ["kling_3_0_omni", "wan_video_2_7"]},
            {"degrade_to_image": True, "fallback": "降级为分镜图"}
        ]
    }

    def execute(self, tool_id: str, error: Exception, attempt: int = 0):
        strategies = self.STRATEGIES.get(tool_id, [])
        if attempt >= len(strategies):
            return {"status": "failed", "fallback": "所有回退策略耗尽"}

        strategy = strategies[attempt]
        if strategy.get("retry_same_model"):
            return {"status": "retry", "same_model": True}
        elif strategy.get("switch_model"):
            return {"status": "retry", "new_model": strategy["priority_models"][attempt]}
        elif strategy.get("degrade_to_text"):
            return {"status": "degraded", "output": strategy["fallback"]}
```

### 4.6 对话状态机

```python
class ConversationStateMachine:
    STATES = {
        "idle": {
            "transitions": ["music_analysis", "chat"],
            "allowed_intents": ["*"],  # 任意意图都可进入
            "can_interrupt": True
        },
        "music_analysis": {
            "transitions": ["proposals", "idle"],
            "allowed_intents": ["analyze_music", "generate_proposals", "chat"],
            "can_interrupt": True
        },
        "proposals": {
            "transitions": ["assets", "storyboard", "proposals"],
            "allowed_intents": ["select_proposal", "feedback_regenerate", "search_reference", "chat"],
            "can_interrupt": True
        },
        "assets": {
            "transitions": ["storyboard"],
            "allowed_intents": ["generate_image", "add_to_canvas", "upload_reference", "chat"],
            "can_interrupt": True
        },
        "storyboard": {
            "transitions": ["video_generation"],
            "allowed_intents": ["proceed_next_stage", "regenerate_shot", "chat"],
            "can_interrupt": True
        },
        "video_generation": {
            "transitions": ["review"],
            "allowed_intents": ["evaluate", "regenerate_shot", "export", "chat"],
            "can_interrupt": False  # 生成中不允许中断
        },
        "review": {
            "transitions": ["video_generation", "export"],
            "allowed_intents": ["regenerate_shot", "export", "evaluate", "chat"],
            "can_interrupt": True
        }
    }

    def transition(self, from_state: str, intent: str) -> tuple[str, bool]:
        """返回 (新状态, 是否允许)"""
        state = self.STATES.get(from_state, {})
        if intent in state.get("allowed_intents", []):
            return self._resolve_next_state(from_state, intent), True
        return from_state, False  # 不允许，保持原状态

    def can_go_back(self, from_state: str, to_state: str) -> bool:
        """检查是否允许回溯"""
        # 允许回退到任意上游阶段
        stage_order = list(self.STATES.keys())
        return stage_order.index(to_state) < stage_order.index(from_state)
```

---

## 第五部分：场景功能拆解与画布同步

### 5.1 场景 A：生成图片

**用户流程**：
1. 用户："帮我生成几个角色图"
2. Agent 识别 intent = generate_images_batch，count=4
3. 对话框插入 loading 消息："正在为你生成 4 张角色图..."
4. 并行调用 4 次 generate_image Tool
5. 每完成一张，对话框出现缩略图卡片，画布资产区域同步出现
6. 全部完成后，loading 消失

**对话框展示**：
- **Loading 态**：旋转点 + "正在生成角色图（1/4）..."
- **进度态**：每完成一张，插入一张缩略图卡片（图片 + 类型标签 "角色" + "放入画布"按钮）
- **完成态**：4 张卡片网格排列（2×2），AI 回复："角色图已生成，你可以选择喜欢的放入画布"

**画布同步**：
- 事件：`asset_created` × 4
- 画布资产区域自动追加卡片，新卡片有 scale-in 动画
- 卡片默认放在"视觉资产"Tab 下的"图片"分组
- 如果是方案绑定的资产，自动关联到对应 proposal

### 5.2 场景 B：生成视频

**用户流程**：
1. 用户："开始生成视频"
2. Agent 识别 intent = proceed_next_stage，当前阶段 = storyboard
3. 顺序执行：mv-planner → mv-generator → video_model_api（逐 shot）
4. 每个 shot 生成过程中，对话框展示进度

**对话框展示**：
- **Planner 阶段**：loading："AI 导演正在规划分镜..." → 输出分镜表格摘要
- **Generator 阶段**：loading："正在生成分镜 prompt..." → 输出 shot 数量
- **视频生成阶段**：进度指示器 "正在生成视频（Shot 3/8）..."
  - 每个 shot 卡片展示三级降级：
    - 生成中：灰色骨架屏 + "生成中"
    - 有 frame_prompt：显示文字描述（Level 3）
    - 有 video：显示缩略图（Level 1）
- **完成态**：8 个 shot 卡片纵向排列，底部"预览完整 MV"按钮

**画布同步**：
- Planner 输出 → `storyboard_ready` 事件 → 画布分镜区域出现表格
- Generator 输出 → `shots_generated` 事件 → 画布时间线出现 clip 占位
- 每个视频完成 → `video_clip_ready` 事件 → 对应 clip 从 Level 3 升级到 Level 1
- 时间线上的 clip 按 start_time 排列，颜色标识生成状态

### 5.3 场景 C：将图片放在画布上

**用户流程**：
1. 用户在对话框点击某张图片的"放入画布"按钮
2. 或用户说"用这张作为主角"（指向已生成的图片）
3. Agent 调用 add_to_canvas Tool
4. 画布高亮显示该图片

**对话框展示**：
- 确认消息："已将「主角特写」添加到画布的视觉资产区域"
- 附带图片缩略图 + 画布位置标签（如 "📍 视觉资产 · 角色"）

**画布同步**：
- 事件：`asset_placed` → 画布滚动定位到该资产卡片
- 卡片短暂高亮（橙色边框脉冲 1 次）后恢复
- 如果已在画布上，toast 提示："该图片已在画布中"

### 5.4 场景 D：出现问题选项

**用户流程**：
1. 某张图片/视频生成后，自动调用 evaluate_quality
2. 发现问题（如"镜头 3 的面部不够清晰，score=42"）
3. Agent 在对话框中展示选项卡片

**对话框展示**：
- 问题卡片：
  ```
  ⚠️ 镜头 3 生成质量检测未通过
  问题：面部区域不够清晰（严重度：warning）
  建议操作：
  [ 重新生成（更换模型） ]
  [ 调整提示词后重试 ]
  [ 保持现状，继续 ]
  [ 手动修改 ]
  ```
- 用户点击选项后，执行对应操作

**画布同步**：
- 事件：`quality_issue` → 画布上对应 clip/资产加橙色警告边框
- 用户选择"重新生成" → 画布 clip 回到"生成中"状态
- 用户选择"保持现状" → 警告边框消失

### 5.5 画布同步协议

```typescript
// 事件类型定义
type CanvasEvent =
  | { type: "music_analysis_ready"; data: MusicAnalysis }
  | { type: "proposal_generated"; data: Proposal }
  | { type: "proposal_selected"; data: { proposal_id: string } }
  | { type: "asset_created"; data: Asset[] }
  | { type: "asset_placed"; data: { asset_id: string; region: string } }
  | { type: "asset_updated"; data: { asset_id: string; changes: Partial<Asset> } }
  | { type: "storyboard_ready"; data: { planner_text: string } }
  | { type: "shots_generated"; data: ShotJSON }
  | { type: "video_clip_ready"; data: { shot_id: string; video_url: string } }
  | { type: "video_clip_progress"; data: { shot_id: string; status: "pending"|"generating"|"done"|"failed" } }
  | { type: "quality_issue"; data: { asset_id: string; issues: QualityIssue[] } }
  | { type: "canvas_focus"; data: { element_id: string; highlight: boolean } };

// Payload 通用结构
interface CanvasEventPayload {
  event_id: string;         // UUID
  timestamp: number;        // ms
  project_id: string;       // 哪个 MV 项目
  event: CanvasEvent;
}

// 反向同步：画布操作 → 对话
type CanvasActionEvent =
  | { type: "asset_deleted"; data: { asset_id: string } }
  | { type: "proposal_edited"; data: { proposal_id: string; changes: string } }
  | { type: "clip_reordered"; data: { timeline: ClipOrder[] } }
  | { type: "preview_requested"; data: { shot_id: string } };
```

**事件传递机制**：

```
Agent 执行工具 → 产生 canvas_events → 写入 State.canvas_events
    ↓
前端监听 State 变更 → 遍历 canvas_events → 分发到画布组件
    ↓
画布组件根据 event.type 更新对应区域
    ↓
画布组件操作 → 发送 CanvasActionEvent → 回传 Agent
```

### 5.6 对话框富内容组件

| 组件 | 触发条件 | 交互 | 画布联动 |
|------|---------|------|---------|
| **缩略图卡片** | asset_created | 点击查看大图，点击"放入画布" | 资产区高亮出现 |
| **方案卡片** | proposal_generated | 展开看分镜表格，点击"选择此方案" | 方案区高亮 + Tab 切换 |
| **进度指示器** | video_clip_progress | 显示 N/M + 每个 shot 状态 | 时间线 clip 状态同步 |
| **选项卡片** | quality_issue / 需要用户选择 | 点击选项 → 触发对应工具 | 问题元素高亮 |
| **引用标签** | 用户点击画布元素回插对话 | 点击可跳转到对应元素 | 双向定位 |
| **Loading 状态** | 任何工具调用中 | 旋转点 + 文字 | 无（等待结果后联动） |

### 5.7 前端实现建议

**事件系统**：推荐使用轻量级 EventBus + 状态管理。对话和画布各自订阅关心的事件类型，不需要全量广播。

```javascript
// 简单实现
const canvasBus = new EventTarget();

// Agent 推送事件
function pushCanvasEvent(event) {
  canvasBus.dispatchEvent(new CustomEvent(event.type, { detail: event.data }));
}

// 画布组件监听
canvasBus.addEventListener('asset_created', (e) => {
  addAssetCard(e.detail);
  animateAssetEntrance(e.detail.id);
});

canvasBus.addEventListener('video_clip_ready', (e) => {
  updateClipInTimeline(e.detail.shot_id, e.detail.video_url);
});
```

**对话消息渲染**：使用增量 DOM 插入，不需要虚拟列表（MV 创作会话消息量通常 < 200 条）。每个消息气泡绑定对应的 canvas_event，支持点击联动。

**时序处理**：Agent 工具调用是异步的。使用消息队列确保事件按到达顺序处理，不按工具完成顺序乱序：

```javascript
const eventQueue = [];
let processing = false;

async function processEvents() {
  if (processing || eventQueue.length === 0) return;
  processing = true;
  while (eventQueue.length > 0) {
    const event = eventQueue.shift();
    await handleEvent(event);  // await 保证顺序
  }
  processing = false;
}
```

**动画建议**：
- 新资产出现：scale(0.8) → scale(1)，150ms ease-out
- 选中高亮：border-color 脉冲 2 次，800ms
- 进度更新：clip 状态色平滑过渡，200ms
- 问题警告：border-color 闪烁 3 次，1.2s
- 方案切换：fade-out → fade-in，200ms

---

## 第六部分：总体架构汇总

```
┌─────────────────────────────────────────────────────────────┐
│  前端层                                                       │
│  ┌──────────────┐  ┌───────────────────────────────────┐    │
│  │  对话面板     │  │  无限画布                          │    │
│  │  · 消息气泡   │←→│  · 音乐分析区 / 方案区 / 资产区     │    │
│  │  · 富内容卡片 │  │  · 分镜表格 / 时间线               │    │
│  │  · 输入框     │  │  · Preview 弹窗                   │    │
│  └──────┬───────┘  └───────────────────────────────────┘    │
│         │ CanvasEvent / CanvasActionEvent 双向同步           │
├─────────┼───────────────────────────────────────────────────┤
│  Agent 编排层 (LangGraph StateGraph)                         │
│                                                             │
│  detect_intent → route_by_intent → 选择工具链                │
│                                                             │
│  Tool 层: analyze_music / generate_image / upload_asset     │
│           / add_to_canvas / evaluate_quality                │
│           / web_search_reference                            │
│                                                             │
│  Skill层: generate_proposals / mv-planner / mv-generator    │
│                                                             │
│  MCP 层: video_model_api / image_model_api / storage_service│
│                                                             │
│  回退: retry → switch_model → degrade                      │
├─────────┼───────────────────────────────────────────────────┤
│  工具 & 服务层                                               │
│  模型 API · 存储 · Web Search · 音频分析                    │
└─────────────────────────────────────────────────────────────┘
```

### 关键设计决策总结

1. **1 个主 Agent + 原子工具集**：不是多 Agent 编排，而是单个 Agent 通过意图识别动态调度工具。工具之间通过 State 传递数据。

2. **三层工具机制各有定位**：Tool 做快操作、Skill 做多步流程、MCP 做外部集成。不要混淆层次。

3. **工具自描述 + 注册表**：每个工具声明 input/output schema、依赖、性能特征，Agent 通过注册表发现和路由。

4. **画布同步基于事件**：Agent 产生 canvas_events，前端监听并更新画布。反向通过 CanvasActionEvent 回传。

5. **回退三级策略**：重试同模型 → 换模型 → 降级输出。确保任何失败都不会让用户看到空白。

6. **Skill 继承现有架构**：mv-planner 和 mv-generator 的 frontmatter + lazy-loading + route-and-dispatch + output discipline 模式直接复用到新工具。

7. **流程内引导 + 自由跳入兼容**：Agent 维护 pipeline_stage 但不阻塞操作。图片生成零前置随时可调；剧本和视频有依赖时自动补齐前置或反问用户。见附录 A。

---

## 附录 A：流程引导与自由跳入的兼容设计

### A.1 问题

用户可能走线性流程（音乐分析 → 方案 → 资产 → 分镜 → 视频），也可能随时自由跳入（"生成一张角色图"、"导出视频"）。两者必须共存。

### A.2 双状态模型

```python
class AgentState:
    # 流程阶段——只是一个进度提示，不是准入条件
    pipeline_stage: "idle" | "music_analysis" | "proposals" | "assets" | "storyboard" | "video"

    # 上下文资产——零散的，用户自由跳入也会填充
    music_analysis: Optional[...]   # 可能为 None
    proposals: Optional[...]         # 可能为 None
    assets: list                     # 可能用户直接"生成角色图"就产生了
    selected_proposal: Optional[...]
    planner_output: Optional[...]
    generator_output: Optional[...]
```

`pipeline_stage` 只用于"当前进度提示"和"智能追问"，**不是阻塞条件**。

### A.3 工具前置条件表

```python
TOOL_PRECONDITIONS = {
    # ── 零前置，随时可调 ──
    "generate_image":       {"requires": []},
    "upload_asset":         {"requires": []},
    "web_search_reference": {"requires": []},
    "evaluate_quality":     {"requires": ["asset_url"]},

    # ── 有前置，可自动补齐或跳过 ──
    "generate_proposals": {
        "requires": ["music_analysis"],
        "missing_action": "auto_or_ask"   # 有音乐就自动分析，没有就问
    },
    "mv_planner": {
        "requires": ["selected_proposal"],
        "missing_action": "ask"           # 必须用户确认方案
    },

    # ── 有前置，必须确认 ──
    "mv_generator": {
        "requires": ["planner_output"],
        "missing_action": "chain"         # 自动链式调用 planner → generator
    },
}
```

### A.4 三类意图的处理逻辑

| 类型 | 示例指令 | 调用的原子工具/Skill | 前置依赖 | 处理方式 |
|------|---------|---------------------|---------|---------|
| **自由跳入** | "生成一张角色图" | Tool: generate_image | 无 | 直接调用 |
| | "搜索王家卫 MV 参考" | Tool: web_search | 无 | 直接调用 |
| | "上传这张图片" | Tool: upload_asset | 无 | 直接调用 |
| | "帮我写段叙事" | Tool: generate_text(purpose="narrative") | 无 | 直接调用 |
| **可补齐** | "帮我做方案" | Skill: generate_proposals (= generate_text×3 + generate_image×N) | music_analysis | 有音乐→自动分析；没有→问 |
| | "生成分镜" | Skill: mv_planner (= check_timeline + select_model + generate_text×N) | selected_proposal | 有方案→直接；没有→引导选方案 |
| **链式** | "生成视频" | Skill: video_generation (= mv_planner → mv_generator → video_api) | 完整链路 | 检查缺失 → 自动补齐或确认 |

### A.5 实际对话示例

**自由跳入，无前置：**
```
用户: "帮我生成一张主角的角色图，赛博朋克风格"
  → intent = generate_image，无前置 → 直接调用
  → 画布资产区域出现图片，pipeline_stage 仍是 idle
```

**自由跳入后想继续：**
```
用户: "帮我生成一张角色图" → 生成完成
用户: "基于这个角色做个方案"
  → intent = generate_proposals，检查前置：music_analysis 缺失
  → Agent: "生成方案需要先分析音乐。你当前没有音乐，可以：
      1. 上传一首音乐
      2. 生成一首示例音乐
      3. 跳过音乐分析，直接写方案描述"
```

**链式自动补齐：**
```
用户: "开始生成视频"
  → intent = mv_creation，检查前置链：proposal × assets × planner 都缺失
  → Agent: "生成视频需要先确定创意方案和分镜规划。我看了下你还没有这些，
      要不要我快速帮你走完前置步骤？"
  → 用户: "好"
  → Agent 自动链式: analyze_music → generate_proposals → user_select → mv_planner → mv_generator → video_api
```

**自由跳入 + 已有部分资产：**
```
用户: "生成角色A、场景B、物品C 的图片" → 3 张图完成
用户: "好，直接基于这些做分镜"
  → Agent: 检测到有 assets 但没有 proposal →
      "我可以跳过方案阶段，直接用你已有的资产来规划分镜。确认吗？"
  → 用户: "确认"
  → mv_planner(assets=state.assets) → 直接规划
```

### A.6 意图路由决策树（完整版）

```
用户输入
  │
  ├── 含上传附件？
  │   ├── 音频 → 分析音乐（如有 pipeline 则进入 music_analysis）
  │   └── 图片/视频 → 上传资产，直接加入 assets 列表
  │
  ├── 自由操作（零前置）
  │   ├── "生成角色/场景/图片" → generate_image（直接调用）
  │   ├── "搜索参考/找灵感" → web_search_reference（直接调用）
  │   ├── "上传/用这张" → upload_asset（直接调用）
  │   └── "质量怎么样/检查" → evaluate_quality（检查最近的资产）
  │
  ├── 流程操作（有前置）
  │   ├── "做方案/生成剧本" → generate_proposals
  │   │   └── 检查: music_analysis 存在？→ 是: 调用 | 否: 问用户
  │   ├── "生成分镜/规划" → mv_planner
  │   │   └── 检查: selected_proposal 存在？→ 是: 调用 | 否: 引导选方案
  │   └── "生成视频/做MV" → mv_planner → mv_generator → video_api
  │       └── 检查整条链路: 缺失什么 → 自动补齐或确认
  │
  ├── 流程推进（下一步）
  │   ├── "继续/下一步/开始" → 根据 pipeline_stage 自动进入下一阶段
  │   └── "方案A/确定/用这个" → select_proposal → 进入下一阶段
  │
  ├── 反馈修改
  │   ├── "重新生成/换一张/脸歪了" → regenerate (最近生成的资产)
  │   ├── "不行/不好/换方向" → feedback → 根据上下文确定改什么
  │   └── "[@镜头3] 重新生成" → regenerate_shot(shot_id=3)
  │
  └── 无法判断
      └── 反问 + 选项卡片（3-4 个可能意图供用户选择）
```
