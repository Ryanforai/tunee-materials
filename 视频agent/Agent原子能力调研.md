# AI Agent 原子能力调研：从 Tool 到 Skill 的视频 Agent 实践

> 调研日期：2026-04-26

---

## 一、什么是 Agent 的原子能力？

**原子能力（Atomic Capabilities）** 是 LLM Agent 可调用、可组合的最小行为单元。它不是模型本身的推理能力，而是**模型能够触发外部世界发生变化**的能力边界。

### 1.1 能力层次模型

Agent 的能力分为三个层次，由低到高：

| 层级 | 名称 | 定义 | 示例 |
|------|------|------|------|
| **L1** | Tool（工具） | 最底层原子操作，确定性强，输入输出有明确 schema | API 调用、文件读写、数据库查询 |
| **L2** | Skill（技能） | 组合多个 Tool + 判断逻辑，完成一个完整子任务 | "生成 MV 分镜脚本" = 解析 JSON + 调用视频模型 + 格式化输出 |
| **L3** | Workflow（工作流） | 多个 Skill 串/并行编排，完成端到端复杂任务 | "从歌曲到完整 MV" = 理解歌词 → 生成分镜 → 逐段生成视频 → 合成 |

**关键区别**：
- **Tool = 做什么**（deterministic RPC）
- **Skill = 怎么做**（procedural knowledge：流程、判断、最佳实践）
- **Tool 没有 Skill → 调用不一致、容易猜参数**
- **Skill 没有 Tool → 能推理正确但无法执行**

> 来源：[SoK: Agentic Skills — Beyond Tool Use in LLM Agents](https://arxiv.org/abs/2602.20867) (2026.02) 定义了 Agent Skill 为"可复用的、可调用的模块，封装了程序性知识、前置条件、执行语义和验证属性"。

### 1.2 原子能力的核心要素

每个原子能力（Tool / Skill）应具备：

1. **Discovery（发现）**：`description` 字段，让模型知道何时该调用
2. **Input Schema（输入定义）**：参数类型、必填项、默认值
3. **Execution（执行语义）**：调用后实际发生什么
4. **Verification（验证属性）**：如何判断执行成功
5. **Composition（组合规则）**：能跟哪些其他能力组合

---

## 二、Claude 的原子能力体系

Claude 的原子能力分为两大类：**Tool Use** 和 **Agent Skills**，两者协同工作。

### 2.1 Tool Use — 执行层原子能力

Claude 通过 Tool Use 调用外部函数，模型自主决定何时调用、传入什么参数。

#### Tool 分类

| 类型 | 执行位置 | 示例 |
|------|---------|------|
| **Client Tools** | 用户应用中执行 | 自定义 API、MCP Server 工具 |
| **Server Tools** | Anthropic 基础设施执行 | `web_search`、`code_execution`、`web_fetch` |
| **Anthropic 内置工具** | Claude Code 环境 | `Read`、`Write`、`Edit`、`Bash`、`Glob`、`Grep` |

#### Tool 的 agentic loop

```
用户请求 → Claude 判断是否需要工具 → 输出 tool_use block
→ 宿主环境执行 → 返回 tool_result → Claude 继续推理或输出
```

#### 关键设计原则

- **工具描述越详细，调用准确率越高** — 描述是模型的"理解入口"
- **超过 ~20 个工具时需要 tool search** — 避免上下文污染
- **strict mode** 确保参数类型安全
- **input_examples** 对复杂工具特别重要

> 来源：[Tool use with Claude](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)

### 2.2 Agent Skills — 知识层原子能力

Agent Skill 是**文件系统中的模块化能力包**，将领域知识、工作流和最佳实践打包，按需加载。

#### Skill 的三级加载机制

| 级别 | 何时加载 | Token 消耗 | 内容 |
|------|---------|-----------|------|
| **Level 1: Metadata** | 启动时 | ~100 tokens/Skill | `name` + `description`（YAML frontmatter） |
| **Level 2: Instructions** | Skill 被触发时 | < 5K tokens | SKILL.md 主体（流程、最佳实践） |
| **Level 3+: Resources** | 按需访问 | 几乎无限制 | 额外文件、脚本、模板、参考资料 |

#### Skill 的目录结构

```
my-skill/
├── SKILL.md          ← 必须，主指令文件
├── REFERENCE.md      ← 可选，详细参考资料
├── scripts/
│   └── helper.py     ← 可选，可执行脚本
└── templates/
    └── output.json   ← 可选，输出模板
```

#### Skill 的优势

- **渐进式披露（Progressive Disclosure）**：只加载任务需要的部分，不浪费 context
- **脚本执行不占 context**：脚本代码本身不进入上下文，只有输出结果占 token
- **可组合**：Skill 之间可以互相引用
- **一次编写，多次复用**

> 来源：[Agent Skills Overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)

### 2.3 Claude 原子能力的完整栈

对于一个完整任务，Claude 的原子能力栈如下：

```
用户意图理解（LLM 推理）
    ↓
意图匹配 Skill（Skill Metadata 匹配）
    ↓
加载 Skill 指令（SKILL.md）
    ↓
Skill 指导 Tool 选择（Read → 处理 → Write）
    ↓
多轮 Tool 执行循环
    ↓
验证输出质量
```

**对于视频类任务，Claude 本身不直接生成视频**，但可以作为"编排大脑"：
1. 理解用户意图（自然语言 → 结构化任务）
2. 选择合适的 Skill（如 MV 生成 Skill）
3. 调用外部工具/模型（通过 MCP 或 API）
4. 协调多步骤工作流
5. 验证和优化结果

---

## 三、视频 Agent 的原子能力拆解

基于对当前视频生成生态（Runway、Kling、Seedance、Wan 等）和学术研究（Camera Artist、UniVA、StoryAgent、MovieAgent）的调研，一个完整的 MV Agent 需要以下原子能力。

### 3.1 视频 Agent 能力全景图

```
                    ┌─────────────────────────────────┐
                    │       用户意图理解 (LLM)         │
                    └────────────┬────────────────────┘
                                 │
            ┌────────────────────┼────────────────────┐
            ▼                    ▼                    ▼
     ┌────────────┐      ┌────────────┐      ┌────────────┐
     │ 策划层 Skill │      │ 生成层 Tool │      │ 编辑层 Tool │
     └────────────┘      └────────────┘      └────────────┘
```

### 3.2 策划层 Skill（Planning Skills）

| # | 原子能力 | 类型 | 描述 | 输入 | 输出 |
|---|---------|------|------|------|------|
| **P1** | **歌词/剧本理解** | Skill | 解析歌曲歌词，提取情感、节奏、场景暗示 | 歌词文本 | 场景结构化列表 |
| **P2** | **分镜脚本生成** | Skill | 将场景转换为结构化分镜 JSON（镜头、时长、画面描述、运镜） | 场景列表 + 风格 | 分镜脚本 JSON |
| **P3** | **视觉风格设计** | Skill | 定义整体视觉基调、色彩、角色外观、场景设定 | 歌曲主题 + 风格描述 | 视觉设定文档 |
| **P4** | **角色一致性管理** | Skill | 追踪角色在多镜头中的外观一致性（参考图、特征描述） | 角色描述 | 角色参考卡 |

### 3.3 生成层 Tool（Generation Tools）

| # | 原子能力 | 类型 | 描述 | 当前可用模型 |
|---|---------|------|------|-------------|
| **G1** | **Text-to-Image** | Tool | 根据文本生成关键帧参考图 | DALL·E、MidJourney、Seedance |
| **G2** | **Image-to-Video** | Tool | 将参考图+运动描述转化为视频片段 | Kling 3.0、Runway Gen-4、Wan 2.1、Seedance 2.0 |
| **G3** | **Text-to-Video** | Tool | 直接从文本生成视频片段 | Kling 3.0、Runway Gen-4、Sora 2 |
| **G4** | **Lip-Sync / 口型同步** | Tool | 将音频轨道与角色口型同步 | Hedra、Seedance 2.0 lipsync 模式 |
| **G5** | **Video-to-Video** | Tool | 对已有视频做风格迁移或修改 | Runway、Wan 2.1 |
| **G6** | **Face Swap / 换脸** | Tool | 保持角色跨镜头一致性的换脸 | InsightFace、RoPE 增强模型 |
| **G7** | **Infinite Talk / 对话驱动** | Tool | 音频驱动的角色动画（全身或半身） | Kling infinite_talk 模式 |
| **G8** | **Video-to-Audio** | Tool | 根据视频内容生成匹配的音效/配乐 | 各模型内置 |

### 3.4 编辑层 Tool（Editing Tools）

| # | 原子能力 | 类型 | 描述 |
|---|---------|------|------|
| **E1** | **镜头拼接** | Tool | 将多段视频按时间线拼接，处理过渡效果 |
| **E2** | **时长控制** | Tool | 拉伸/压缩视频片段以匹配音乐节奏 |
| **E3** | **音频对齐** | Tool | 将视频片段与歌词/音乐时间点精确对齐 |
| **E4** | **质量评估** | Tool | 自动评估生成视频质量（模糊、变形、一致性），决定是否重生成 |
| **E5** | **多轮修改** | Tool | 基于用户反馈修改特定镜头，保持其他镜头不变 |

### 3.5 端到端工作流示例：从歌曲到 MV

```
用户输入: "帮我为《晴天》生成一支 MV"
                      ↓
        ┌─────────────────────────────┐
        │ Skill: 歌词理解 (P1)          │
        │ → 解析歌词，提取 4 个场景      │
        └──────────────┬──────────────┘
                       ↓
        ┌─────────────────────────────┐
        │ Skill: 分镜脚本生成 (P2)      │
        │ → 输出 8 镜头分镜 JSON        │
        └──────────────┬──────────────┘
                       ↓
        ┌─────────────────────────────┐
        │ Skill: 视觉风格设计 (P3)      │
        │ → 定义日系青春色调            │
        └──────────────┬──────────────┘
                       ↓
        ┌─────────────────────────────┐
        │ Skill: 角色一致性管理 (P4)    │
        │ → 生成主角参考卡              │
        └──────────────┬──────────────┘
                       ↓
        ┌───────────────────────────────────────┐
        │ 循环执行（每个镜头）：                    │
        │   Tool: Text-to-Image (G1)  → 关键帧    │
        │   Tool: Image-to-Video (G2) → 视频片段  │
        │   Tool: Lip-Sync (G4)       → 对口型    │
        │   Tool: 质量评估 (E4)       → 是否通过   │
        └──────────────┬────────────────────────┘
                       ↓
        ┌─────────────────────────────┐
        │ Tool: 镜头拼接 (E1)           │
        │ Tool: 音频对齐 (E3)           │
        │ → 输出完整 MV                 │
        └─────────────────────────────┘
```

### 3.6 学术研究参考

| 项目 | 核心贡献 | 原子能力覆盖 |
|------|---------|-------------|
| **Camera Artist** (2026.04) | 多 Agent 模拟真实电影制作流程，显式建模电影语言 | P1, P2, G2, G3, E1 |
| **UniVA** (2025.11) | 首个开源全能视频 Agent，统一理解+分割+编辑+生成 | P2, G1-G6, E1-E4 |
| **StoryAgent** (2024.11) | 多 Agent 协作的叙事视频生成 | P1, P2, P4, G2 |
| **MovieAgent** | 基于 CoT 的自动化电影生成 | P1, P2, G3 |
| **AutoMV** | 音乐视频自动生成的多 Agent 系统 | P1, P2, G4, E3 |

---

## 四、对 Tunee MV Agent 的启示

### 4.1 当前项目已有的原子能力

从现有代码和文档看，Tunee 已经具备或规划了以下能力：

| 能力 | 状态 | 对应文件 |
|------|------|---------|
| 分镜脚本生成（Skill） | ✅ 已实现 | `视频skill/` 目录（一段式/二段式/SD2 版） |
| MV 编辑器（剪辑台） | 🚧 开发中 | `mv-editor-prd.md`, `mv-editor.html` |
| 对话区交互 | 📋 需求阶段 | `Tunee MV Agent — 对话区产品需求.pdf` |
| 对话框交互方案 | ✅ 已设计 | `对话框交互方案.md` |

### 4.2 建议补充的原子能力

| 优先级 | 能力 | 理由 |
|--------|------|------|
| **P0** | **质量评估 Tool** | 视频生成失败时自动重试，提升成品率 |
| **P0** | **角色一致性 Skill** | 多镜头角色外观一致性是 MV 生成的核心痛点 |
| **P1** | **音乐节奏对齐 Tool** | MV 镜头切换需要对齐鼓点/歌词节奏 |
| **P1** | **多轮修改 Skill** | 用户要求修改特定镜头时，保留其他镜头不变 |
| **P2** | **口型同步 Tool** | 歌词驱动 MV 中角色唱歌的口型同步 |
| **P2** | **镜头过渡效果 Tool** | 淡入淡出、转场等编辑层能力 |

### 4.3 原子能力的组织方式

建议采用 **Skill + Tool 混合架构**：

```
mv-agent/
├── skills/
│   ├── mv-planner/       ← 分镜策划 Skill（P1+P2+P3）
│   ├── character-keeper/ ← 角色一致性 Skill（P4）
│   └── revision-handler/ ← 多轮修改 Skill
├── tools/
│   ├── video-gen/        ← 视频生成 Tool（G2/G3/G7）
│   ├── image-gen/        ← 图片生成 Tool（G1）
│   ├── lip-sync/         ← 口型同步 Tool（G4）
│   ├── quality-check/    ← 质量评估 Tool（E4）
│   └── timeline-composer/ ← 时间线合成 Tool（E1+E2+E3）
└── SKILL.md              ← Agent 总入口，协调所有子能力
```

---

## 五、关键结论

1. **原子能力 ≠ 模型能力，而是 Agent 的"手脚"**：LLM 是大脑，Tool 是手脚，Skill 是肌肉记忆。三者结合才能完成复杂视频任务。

2. **Tool 和 Skill 缺一不可**：没有 Tool 的 Skill 只能"纸上谈兵"，没有 Skill 的 Tool 调用不稳定。2026 年的最佳实践是两者结合。

3. **视频 Agent 的核心难点在组合**：单个视频生成模型（如 Kling）只是 G2/G3 级别的原子能力。真正有价值的 Agent 是能把 P1→P4→G1→G4→E1 串联起来，形成端到端工作流。

4. **渐进式加载是架构关键**：Claude Skill 的三级加载机制允许 Agent 拥有大量能力而不受 context window 限制，这对视频 Agent（需要大量参考资料和脚本）尤为重要。

5. **质量评估应作为一等公民**：视频生成的随机性导致必须有一个独立的质量评估原子能力，用于判断是否需要重生成或调整参数。

---

## 参考资料

1. [SoK: Agentic Skills — Beyond Tool Use in LLM Agents](https://arxiv.org/abs/2602.20867) — Agent Skill 的系统分类法
2. [Tool use with Claude](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview) — Claude Tool Use 官方文档
3. [Agent Skills Overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview) — Claude Agent Skills 官方文档
4. [Camera Artist: A Multi-Agent Framework for Cinematic Language Storytelling Video Generation](https://arxiv.org/abs/2604.09195) — 电影语言多 Agent 框架
5. [UniVA: Universal Video Agent](https://arxiv.org/html/2511.08521v1) — 全能视频 Agent
6. [StoryAgent: Customized Storytelling Video Generation](https://arxiv.org/abs/2411.04925) — 叙事视频生成
7. [Agent Skills: The Missing Layer That Makes AI Agents Enterprise-Ready](https://dev.to/sreeni5018/agent-skills-the-missing-layer-that-makes-ai-agents-enterprise-ready-3gc)
8. [SKILLS.md: The New Primitive for Building AI Agents](https://michielh.medium.com/skills-md-the-new-primitive-for-building-ai-agents-e3d3f024b6c5)
9. [The AI Video & Image Stack 2026](https://medium.com/@cliprise/the-ai-video-image-stack-2026-models-workflows-and-the-end-of-single-tool-thinking-08ba5f97aa7d)
10. [How Agentic AI Works: AI Agents, Planning & Multi-Step Reasoning](https://esi.in/blog/how-agentic-ai-works-ai-agents-autonomous-systems-multi-step- reasoning)
