# 视频 Skill 合集

## 项目简介

Tunee MV Studio 视频生成相关 Skill 的完整版合集。包含 MV 分镜生成（mv-generation）以及拆分后的双节点架构（mv-planner + mv-generator）。

---

## 目录结构

```
视频skill/
├── mv-generation/              ← 完整版 MV 生成 Skill（单节点，推荐使用）
│   ├── SKILL.md                ← Skill 入口：Unwrap → Normalize → Dispatch
│   ├── shared/
│   │   └── core.md             ← frame_prompt 完整写法 + 输出结构（story/visions 共用）
│   ├── paths/                  ← 各路径创作指导（story-single/dual, visions-*, lip-sync-*）
│   ├── refs/                   ← 各路径配套词库 + Case
│   └── cases/                  ← 参考案例（BLUE, PARALLEL, UNFORGIVEN, XOXZ, MONOCHROME-BLOOM）
├── skills/                     ← 双节点拆分版
│   ├── mv-planner/             ← 规划节点：生成 stage_plan
│   └── mv-generator/           ← 生成节点：根据 stage_plan 生成分镜
├── mv-generation-一段式.zip     ← 一段式完整版打包
├── mv-gen-sd2-二段式.zip        ← 二段式（SD2）打包
├── mv-generation-sd2-一段式.zip ← SD2 一段式打包
└── skills-二段式.zip            ← 双节点版打包
```

---

## Skill 说明

### mv-generation（主版本）

工作流节点，只做三件事：**Unwrap → Normalize → Dispatch**。

- 接收上游编排层传入的结构化 MV JSON
- 根据 `mv_type` 和子类型分发到对应 path 文件
- 只输出 JSON，无自然语言对话

支持的路径：
- `lip-sync`：infinite_talk / kling_avatar_2_0 / wan_video_2_6
- `story`：single（单线叙事）/ dual（双线叙事）
- `visions`：realistic / surreal / fantasy / stream（意识流）

### skills/mv-planner + mv-generator

双节点版本，将规划和生成拆分为两个独立节点，适合需要中间审核或分步调用的场景。

---

## Case 使用原则

- Case 只做风格校准和镜头参考，**不覆盖** `stage_plan`
- 画风系渲染须按 `core.md` 规则裁剪，不照搬 Case 中的摄影渲染词
