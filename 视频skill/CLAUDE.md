# 视频 Skill 合集

## 项目简介

Tunee MV Studio 视频生成相关 Skill 的完整版合集。包含 MV 分镜生成（mv-generation）以及拆分后的双节点架构（mv-planner + mv-generator），每个都有对应 Seedance 2.0 专用版本（sd2）。

---

## 目录结构

```
视频skill/
├── mv-generation-一段式/              ← 完整版单节点（多模型：infinite_talk / wan_video_2_7 / seedance_2_0 / kling_3_0_omni）
│   ├── SKILL.md                       ← 入口：Unwrap → Timeline Normalize → Normalize → Dispatch
│   ├── shared/
│   │   ├── timeline-normalization.md  ← 时间段校验与纠正（所有模型共用）
│   │   └── core.md                    ← frame_prompt 完整写法
│   ├── paths/                         ← 各路径创作指导
│   ├── refs/                          ← 配套词库 + Case
│   └── cases/                         ← 参考案例
│
├── mv-generation-二段式/              ← 双节点拆分版（多模型）
│   ├── mv-planner/                    ← 规划节点
│   │   ├── SKILL.md                   ← 入口：输入解析 → §1.5 Timeline Normalize → Preflight → 路由 → Dispatch
│   │   └── references/
│   │       ├── timeline-normalization.md ← 时间段校验
│   │       ├── directing.md
│   │       └── creative/              ← story-single/dual, visions-*, lip-sync-*
│   └── mv-generator/                  ← 生成节点
│       ├── SKILL.md
│       └── references/
│           ├── prompt-guide.md        ← story/visions prompt 写法
│           └── prompt-guide-lipsync.md ← lip-sync prompt 写法
│
├── mv-generation-sd2-一段式/          ← Seedance 2.0 专用单节点（story/visions/clone，4-15s）
│   ├── SKILL.md                       ← 入口：Unwrap → Normalize → §2.5 Timeline Normalize → Rendering Family → Dispatch
│   ├── timeline-normalization.md      ← 时间段校验（seedance_2_0 专用 4-15s）
│   ├── routes/                        ← story.md / visions.md / mv_clone.md（自包含，含 Case）
│   └── styles/                        ← 音乐风格拍法参考（kpop/hiphop/ballad/edm/rock/rnb/chinese）
│
├── mv-generation-sd2-二段式/          ← Seedance 2.0 专用双节点
│   ├── mv-planner/
│   │   ├── SKILL.md                   ← 入口：输入解析 → §1.5 Timeline Normalize → Preflight → 路由 → Dispatch
│   │   └── references/
│   │       ├── timeline-normalization.md ← 时间段校验
│   │       ├── directing.md
│   │       ├── creative/              ← story-single/dual, visions, mv-clone
│   │       └── styles/                ← 音乐风格拍法参考
│   └── mv-generator/
│       ├── SKILL.md
│       └── references/
│           └── prompt-guide.md        ← story/visions prompt 写法
```

---

## Skill 说明

### mv-generation-一段式（主版本，多模型）

工作流单节点，支持 4 个模型：**infinite_talk** / **wan_video_2_7** / **seedance_2_0** / **kling_3_0_omni**。

- 接收结构化 MV JSON，输出分镜脚本 JSON
- 根据 `mv_type` 和子类型分发到对应 path 文件
- 只输出 JSON，无自然语言对话

支持路径：
- `lip-sync`：infinite_talk / wan_video_2_7
- `story`：single（单线叙事）/ dual（双线叙事）
- `visions`：realistic / surreal / fantasy / stream（意识流）

### mv-generation-二段式（双节点，多模型）

规划 + 生成拆分架构，模型支持同一张表。

- **planner**：输出 SUMMARIZE + DIRECTING + SHOT treatment（纯文本）
- **generator**：根据 planner 输出生成完整 video_prompt / frame_prompt（JSON）

### mv-generation-sd2-一段式（SD2 专用）

仅支持 **seedance_2_0**（4-15s），支持 `story` / `visions` / `clone`，不支持 lip-sync。

- routes/story.md 和 routes/visions.md 各自自包含（含完整 Case）
- 带 7 个音乐风格文件（kpop/hiphop/ballad/edm/rock/rnb/chinese）

### mv-generation-sd2-二段式（SD2 双节点）

SD2 专用的双节点版本，结构同主版本二段式，但仅 seedance_2_0。

---

## 时间轴规范化

所有 4 个 skill 均内置 `timeline-normalization.md`，在加载重型参考文件之前执行：

| 校验项 | 规则 |
|--------|------|
| T0 | md_stages 至少 1 行 |
| T1 | 所有时间戳为整数秒，start < end |
| T2 | 首行 start = 0，末行 end = audio_duration |
| T3 | 相邻行连续：无间隙、无重叠 |
| T4 | 每行时长在 model 合法范围内 |
| T5 | one_take 必须仅 1 行（多模型版） |

纠正规则：R1 间隙吸收 → R2 重叠截断 → R3 首尾修复 → R4 超长拆分 → R5 超短合并，最多 3 轮。

---

## Case 使用原则

- Case 只做风格校准和镜头参考，**不覆盖** `stage_plan`
- 画风系渲染须按 `core.md` 规则裁剪，不照搬 Case 中的摄影渲染词
