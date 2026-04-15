---
name: mv-generation
description: 工作流节点。接收结构化 MV JSON，输出分镜脚本 JSON。由上游编排层调用，不处理自然语言对话。
---

# MV Generation

**只输出 JSON。无前置说明，无后置总结，无 Markdown 包裹。**

---

## 目录结构

```
SKILL.md                          ← 入口：Unwrap → Normalize → Dispatch
shared/
  core.md                         ← frame_prompt 完整写法 + 输出结构（story/visions 共用）
paths/
  story-single.md                 ← 单线叙事·创作指导
  story-dual.md                   ← 双线叙事·创作指导
  visions-realistic.md            ← 写实视觉·创作指导
  visions-surreal.md              ← 超现实·创作指导
  visions-fantasy.md              ← 奇幻·创作指导
  visions-stream.md               ← 意识流·创作指导
  lip-sync-infinite-talk.md       ← 口播·infinite_talk（自包含）
  lip-sync-kling-avatar.md        ← 口播·kling_avatar（自包含）
  lip-sync-wan-video.md           ← 口播·wan_video（自包含）
refs/
  story-single-ref.md             ← 词库 + Case（story-single 配套）
  story-dual-ref.md               ← 词库 + Case（story-dual 配套）
  visions-realistic-ref.md        ← 词库 + Case（visions-realistic 配套）
  visions-surreal-ref.md          ← 词库 + Case（visions-surreal 配套）
  visions-fantasy-ref.md          ← 词库 + Case（visions-fantasy 配套）
  visions-stream-ref.md           ← 词库 + Case（visions-stream 配套）
cases/
  BLUE.md / PARALLEL.md / UNFORGIVEN.md / XOXZ.md / MONOCHROME-BLOOM.md
```

---

## 职责

本文件只做三件事：**Unwrap → Normalize → Dispatch**。

输出：加载哪些文件。

---

## Step 1：Unwrap

如果输入是 `HumanMessage` 包装（`[{"type": "HumanMessage", "content": "..."}]`）：只取 `content` 字段，解析其中的 JSON。否则直接使用输入。

---

## Step 2：Normalize

1. `mv_type`：`"lip_sync"` → `"lip-sync"`
2. `video_model` 归一化（对象型提取 `model_key`，保留 `max_duration / min_duration`）：

| 输入匹配 | model_key |
|---------|-----------|
| `infinite-talk` / `infinite_talk` | `infinite_talk` |
| 含 `kling avatar` / `kling-avatar` / `avatar 2.0` / `avatar_2_0` | `kling_avatar_2_0` |
| 含 `wan` | `wan_video_2_6` |
| 含 `kling` | `kling` |

3. `scene_mode` 缺失且 `lip-sync` → 默认 `multiple_scenes`

---

## Step 3：Dispatch

**Route 只决定拍法框架，不决定剧情骨架。**

- `stage_plan` 是全片唯一 canonical timeline
- route 只能决定镜头语言、光线语言、结构密度、模型适配方式
- route 不得重写输入中的段落顺序、主动作、角色和场景
- route 不得凭 `lyrics / visual_brief / case` 自行发明新的引用对象并写入资源表

### Dispatch 表

```
lip-sync + infinite_talk       → paths/lip-sync-infinite-talk.md
lip-sync + kling_avatar_2_0    → paths/lip-sync-kling-avatar.md
lip-sync + wan_video_2_6       → paths/lip-sync-wan-video.md

story + single                 → shared/core.md + paths/story-single.md + refs/story-single-ref.md
story + dual                   → shared/core.md + paths/story-dual.md + refs/story-dual-ref.md

visions + realistic            → shared/core.md + paths/visions-realistic.md + refs/visions-realistic-ref.md
visions + surreal              → shared/core.md + paths/visions-surreal.md + refs/visions-surreal-ref.md
visions + fantasy              → shared/core.md + paths/visions-fantasy.md + refs/visions-fantasy-ref.md
visions + stream               → shared/core.md + paths/visions-stream.md + refs/visions-stream-ref.md
```

### story_mode 路由判断

```
stage_plan 中是否存在两条清晰的人物/场景线在交替推进？
  → 是 → story + dual
  → 否 → story + single
```

### visions 路由判断

```
Q1: stage_plan 是否涉及多时空/记忆闪回/梦境嵌套/同一人多版本？
  → 是 → visions + stream
  → 否 → Q2

Q2: stage_plan 的场景是否全部存在于现实世界？
  → 否 → visions + fantasy
  → 是 → Q3

Q3: stage_plan 的 visual_brief 是否存在轻度物理违背或现实入侵？
  → 是 → visions + surreal
  → 否 → visions + realistic
```

### Case 的地位

- case 只做风格校准和高级镜头参考
- case **绝不能覆盖** 输入里的 `stage_plan`
- 如 case 与 `stage_plan` 冲突，以 `stage_plan` 为准
- **case 中的 frame_prompt 示例全部按摄影系完整模式书写（含 ④ 虚实 + ⑦ 相机胶片）。实际使用时必须根据渲染族适配：画风系须按 core.md「画风系」规则裁剪——④ 只保留焦段数字、⑦ 跳过。不要照搬 case 的摄影渲染词。**
