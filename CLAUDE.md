# 趣丸材料（tunee-materials）

## 项目简介

Tunee MV Studio 的 AI 资产总库。包含 MV 分镜脚本提示词、视频生成 Skill、图片提示词生成 Skill 和测试素材。

---

## 目录结构

```
趣丸材料/
├── creative_analysis/   ← 剧本大纲节点：MV 分镜脚本提示词库
├── Tunee Skill库/       ← Claude Skill 合集（图片/音乐生成）
├── 视频skill/           ← 视频生成 Skill（MV 生成完整版 + 双节点版）
└── 视频测试/            ← 测试素材（提示词研究、图片、音频、需求文档）
```

---

## 模块说明

### creative_analysis — 剧本大纲节点

MV 分镜脚本生成与修改的 System Prompt 集合，供 MV 生成流水线调用。

```
creative_analysis/
├── prompts/generation/     ← 生成类（创意/lipsync/故事/Visions/Clone 模式）
└── prompts/modification/   ← 修改类（普通/lipsync/memory 版本）
```

输出均为**纯 JSON**。详细说明见 [`creative_analysis/CLAUDE.md`](creative_analysis/CLAUDE.md)。

---

### Tunee Skill库 — Claude Skill 合集

可直接安装到 Claude Code 的 Skill 包。

| Skill | 说明 |
|-------|------|
| `cinematic-prompt-generator` | 基于 9 个物理维度生成电影感 AI 图片提示词 |
| `free-music-generator.zip` | 免费音乐生成 Skill（打包版） |

详细说明见 [`Tunee Skill库/CLAUDE.md`](Tunee%20Skill库/CLAUDE.md)。

---

### 视频skill — 视频生成 Skill

完整版 MV 分镜生成 Skill，接收结构化 MV JSON，输出分镜脚本 JSON。

```
视频skill/
├── mv-generation/     ← 主版本（Unwrap → Normalize → Dispatch）
│   ├── paths/         ← 各路径创作指导（story/visions/lip-sync）
│   ├── refs/          ← 配套词库 + Case
│   ├── cases/         ← 参考案例（BLUE/PARALLEL/UNFORGIVEN/XOXZ 等）
│   └── shared/core.md ← frame_prompt 完整写法
└── skills/            ← 双节点版（mv-planner + mv-generator）
```

详细说明见 [`视频skill/CLAUDE.md`](视频skill/CLAUDE.md)。

---

### 视频测试 — 测试素材

各阶段提示词研究文件、视觉参考图片、音频样本和需求文档。

详细说明见 [`视频测试/CLAUDE.md`](视频测试/CLAUDE.md)。

---

## 各模块 CLAUDE.md 索引

| 模块 | 详细文档 |
|------|---------|
| 剧本大纲节点 | [`creative_analysis/CLAUDE.md`](creative_analysis/CLAUDE.md) |
| Tunee Skill 库 | [`Tunee Skill库/CLAUDE.md`](Tunee%20Skill库/CLAUDE.md) |
| 视频 Skill | [`视频skill/CLAUDE.md`](视频skill/CLAUDE.md) |
| 视频测试 | [`视频测试/CLAUDE.md`](视频测试/CLAUDE.md) |
