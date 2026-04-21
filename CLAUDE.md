# 趣丸材料（tunee-materials）

## 项目简介

Tunee MV Studio 的 AI 资产总库。包含 MV 分镜脚本提示词、视频生成 Skill、图片/音乐生成 Skill、提示词研究素材和数据分析报告。

---

## 目录结构

```
趣丸材料/
├── 创意分析/             ← 剧本大纲节点：MV 分镜脚本提示词库
├── Tunee Skill库/        ← Claude Skill 合集（图片/音乐生成）
├── 视频skill/            ← 视频生成 Skill（MV 生成一段式/二段式 + SD2 专用版本）
├── 提示词管理/           ← 提示词研究素材（聊天代理/歌词/音乐生成/视觉设计等）
├── 视频agent/            ← 视频 Agent 原型与讨论笔记
├── 数据分析/             ← MV 视频生成数据分析报告与经验沉淀
└── 周报/                 ← 每周工作周报
```

---

## 模块说明

### 创意分析 — 剧本大纲节点

MV 分镜脚本生成与修改的 System Prompt 集合，供 MV 生成流水线调用。

```
创意分析/
├── prompts/generation/     ← 生成类（lipsync/故事/Visions/Clone 模式）
├── prompts/modification/   ← 修改类（普通/lipsync/Clone，单轮 + 多轮记忆版）
├── CLAUDE.md               ← 模块文档
├── EXPERIENCE.md           ← 经验沉淀
└── 修改提示词—多轮对话历史记忆改造方案.md
```

输出均为**纯 JSON**。详细说明见 [`创意分析/CLAUDE.md`](创意分析/CLAUDE.md)。

---

### Tunee Skill库 — Claude Skill 合集

可直接安装到 Claude Code 的 Skill 包。

| Skill | 说明 |
|-------|------|
| `cinematic-prompt-generator` | 基于 9 个物理维度生成电影感 AI 图片提示词 |
| `free-music-generator` | 免费音乐生成 Skill（含歌词指南 + 音乐提示词指南） |

详细说明见 [`Tunee Skill库/CLAUDE.md`](Tunee%20Skill库/CLAUDE.md)。

---

### 视频skill — 视频生成 Skill

完整版 MV 分镜生成 Skill，接收结构化 MV JSON，输出分镜脚本 JSON。

```
视频skill/
├── mv-generation-一段式/     ← 完整版单节点（支持 infinite_talk / wan_video_2_7 / seedance_2_0 / kling_3_0_omni）
├── mv-generation-二段式/     ← 双节点拆分版（mv-planner + mv-generator，多模型）
├── mv-generation-sd2-一段式/ ← Seedance 2.0 专用单节点（story/visions/clone，4-15s）
└── mv-generation-sd2-二段式/ ← Seedance 2.0 专用双节点
```

详细说明见 [`视频skill/CLAUDE.md`](视频skill/CLAUDE.md)。

---

### 提示词管理 — 提示词研究素材

各阶段提示词研究文件，包含聊天代理路由、歌词处理、音乐生成流水线、视觉设计等。

```
提示词管理/
├── chat_agent.md             ← 前端聊天代理（意图识别/音频路由/能力校验）
├── extract_draft.md          ← 意图分析 + 字段决策
├── extract_new_taskform.md   ← TaskForm JSON 结构化
├── music_process_reference.md ← 参考音频处理
├── lyric_wiki_zh.md / lyric_wiki_en.md ← 歌词知识库
├── lyrics_format.md          ← 歌词格式规范
├── music_title.md / music_title_no_summary.md ← 音乐标题生成
├── visual_designer_prompt_updated.md ← 视觉设计师提示词
├── video_analysis.md         ← 视频分析提示词
├── understanding.md          ← 理解笔记
├── music_process_reference.md ← 音乐处理参考
└── 提示词工程原则.md         ← 提示词工程最佳实践
```

核心调用链路：`chat_agent → extract_draft / extract_new_taskform → music_process_reference → 下游生成`

详细说明见 [`提示词管理/CLAUDE.md`](提示词管理/CLAUDE.md)。

---

### 视频agent — 视频 Agent 原型

视频生成 Agent 的 HTML 原型和讨论笔记。

```
视频agent/
├── prototype.html    ← Agent 交互原型
├── 讨论笔记.md       ← 设计讨论记录
└── .impeccable.md    ← 设计质量检查清单
```

---

### 数据分析 — 数据报告与经验沉淀

MV 视频生成的数据分析报告，按周组织，含漏斗分析和经验总结。

```
数据分析/
├── 数据分析经验沉淀.md              ← 可复用的分析方法论
├── 数据分析04.08-04.15/           ← 第1期
│   └── MV视频生成数据分析报告.md
└── 数据分析04.12-04.19/           ← 第2期
    └── MV视频生成数据分析报告.md
```

详细说明见 [`数据分析/CLAUDE.md`](数据分析/CLAUDE.md)。

---

### 周报 — 每周工作汇报

按周记录工作进展，成果导向写法。

```
周报/
├── 2026-04-14~2026-04-20.md  ← 首份周报
└── 周报经验.md                ← 写作框架与自检清单
```

详细说明见 [`周报/CLAUDE.md`](周报/CLAUDE.md)。

---

## 各模块 CLAUDE.md 索引

| 模块 | 详细文档 |
|------|---------|
| 创意分析 | [`创意分析/CLAUDE.md`](创意分析/CLAUDE.md) |
| Tunee Skill 库 | [`Tunee Skill库/CLAUDE.md`](Tunee%20Skill库/CLAUDE.md) |
| 视频 Skill | [`视频skill/CLAUDE.md`](视频skill/CLAUDE.md) |
| 提示词管理 | [`提示词管理/CLAUDE.md`](提示词管理/CLAUDE.md) |
| 数据分析 | [`数据分析/CLAUDE.md`](数据分析/CLAUDE.md) |
| 周报 | [`周报/CLAUDE.md`](周报/CLAUDE.md) |
