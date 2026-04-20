---
name: mv-planner-keling
description: MV 导演规划。接收完整 MV 输入，输出纯文本（SUMMARIZE + DIRECTING + 逐段 treatment）。只做策略，不写 prompt。
---

# MV Planner

**输出纯文本，不要 JSON，不要 markdown code fence。**

## 目录结构

```
SKILL.md                              ← 入口：输入解析 → Preflight → 路由 → Dispatch
references/
  timeline-normalization.md           ← 时间轴纠正（按需加载：仅发现时间问题时查阅）
  directing.md                        ← 导演 grammar + treatment 写法 + 共用风格资源
  creative/
    story-single.md                   ← 单线叙事（含风格判断 + Case）
    story-dual.md                     ← 双线叙事（含风格判断 + Case）
    visions-realistic.md              ← 写实视觉（含概念原则 + Case）
    visions-surreal.md                ← 超现实（含概念原则 + Case）
    visions-fantasy.md                ← 奇幻（含概念原则）
    visions-stream.md                 ← 意识流（含概念原则 + Case）
    lip-sync-infinite-talk.md         ← 口播·infinite_talk
    lip-sync-wan-video-2-7.md         ← 口播·wan_video_2_7
```

---

## §1 输入与解析

### 所有字段

`mv_type` / `mv_guide.md_stages` / `mv_guide.mv_elements` / `language_code` / `audio_duration` / `video_model` / `visual_style` / `mv_guide.style_guide`（可选）

**忽略字段（出现时直接跳过）：** `image_model` / `mv_guide.stages`（旧格式，以 `md_stages` 为准）

### 有效风格值（effective_style）

`mv_guide.style_guide` 存在且非空时优先；否则回退到 `visual_style`。空字符串视为缺失。都缺失则走参考图主导模式。

### 渲染族（rendering_family）

| 渲染族                    | 判定条件                                                                                                                                                                                                                                                             |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **摄影系 `photographic`** | `effective_style` 含：`写实 / realistic / cinematic / 电影 / 胶片 / film / vintage / 复古 / Y2K / noir / 黑色电影 / 赛博朋克 / cyberpunk / documentary / 纪录 / CG写实 / 真人 / live-action / 精致写实 / 高级质感`；或无法判定时兜底                                                                      |
| **画风系 `stylized`**     | `effective_style` 含：`动漫 / anime / 赛璐璞 / cel / 水墨 / ink wash / 水彩 / watercolor / 油画 / oil painting / 3D渲染 / 3D render / toon / 像素 / pixel / 浮世绘 / ukiyo-e / 国画 / 漫画 / comic / manga / 剪纸 / paper cut / 插画 / illustration / flat design / 低多边形 / low poly / voxel` |

两族同时命中 → **画风系优先**。

### `audio_duration`

输入可能为浮点，立即四舍五入为整数使用。

### `mv_guide.md_stages`

全片 **canonical stage plan**。期望 Markdown 表格，至少含列：`时间段` / `音乐结构` / `歌词` / `画面描述` / `场景` / `角色`。时间值须为整数秒，浮点立即四舍五入。

### 异常兜底

| 情况                            | 处理                         |
| ----------------------------- | -------------------------- |
| 有效风格值缺失                       | 参考图主导模式。不推荐色调/相机，只写光源+方向   |
| 有效风格值存在但无法映射                  | 保留原文传递给 generator          |
| characters 为空但 mv_guide 提到人物  | 角色资源为空，treatment 中仍可描述人物动作 |
| scenes 为空但 mv_guide 提到场景      | 场景资源为空，treatment 中仍可描述环境   |
| md_stages 中场景名不在 `scenes[]` 中 | 不报错，保留原文                   |
| `music_structure` 无法标准化       | 保留原文                       |

---

## §1.5 条件触发：Timeline Normalize

**不要主动加载此文件。** 只有在 §2 Preflight（Stage Plan Parsing 或 Asset Map）中发现以下任一情况时，才加载 `references/timeline-normalization.md` 进行修复：

- 时间段 start/end 不是整数秒
- 首行 start ≠ 0，或末行 end ≠ audio_duration
- 相邻行存在间隙（gap）或重叠（overlap）
- 某行时长超出 video_model 的 min/max 约束

触发后按文件中的 gap 吸收/重叠截断/超长拆分/超短合并 修复，**最多 3 轮**。修复成功 → **以修正后的 stage_plan 继续执行后续步骤**，不重头重新加载所有文件。3 轮后仍有违规 → 输出末尾追加 `_violations` 并继续。

未触发（时间无问题）→ 跳过此步，正常执行 §2 及后续步骤。

## §2 Preflight

### Asset Map（资源注册）

- character key = `character.name`，scene key = `scene.scene_name`（若无则取 `scene.name`）
- 名称匹配前先 trim 首尾空格、统一全角/半角斜杠和破折号。**同样适用于 `md_stages` 中 `场景`/`角色` 列的匹配**
- 只有 `mv_elements.characters[] / scenes[]` 中显式存在的对象才能进入资源表
- `character_name` 含 `/` 时，按 `/` 拆分、逐项 trim 后分别校验
- `scene_name` 只允许单一场景名或空值，不允许 `/` 拼接多场景

### Stage Plan Parsing

将 `mv_guide.md_stages` 解析为内部 `stage_plan`：

- **时间值绝对只允许整数秒**，浮点立即四舍五入
- 新的合法 `时间段` 才算下一个 stage
- `stage_plan[0].start = 0`，`stage_plan[最后].end = audio_duration`
- 相邻 stage 连续无间隙、无重叠
- `-` / `–` / `—` / 全角破折号视为同义分隔符

---

## §3 时长校验与 Shot 组织

- `max_duration` / `min_duration` 从 `video_model` 读取；未提供时按 `references/timeline-normalization.md` 模型时长范围表默认
- lip-sync 场景下，各模型约束：**infinite_talk** [5, 300] / **wan_video_2_7** [2, 15]
- story/visions 场景下，模型约束：**seedance_2_0** [4, 15] / **kling_3_0_omni** [4, 15] / **wan_video_2_7** [2, 15]
- 正常 stage → 1 stage = 1 SHOT
- 超长 stage（> max_duration）→ 拆成多个 SHOT，每个时长合法
- 超短 stage（< min_duration）→ 并入相邻 SHOT
- 结果直接体现在输出的 SHOT 列表中（带时间范围和来源 stage 编号）

拆分优先级：内容转折 > 歌词断句 > 近似等分（奇数秒前段取较长值）

---

## §4 Stage Fidelity

- treatment 必须覆盖所有 stage，保持原始顺序
- `character_name` 非空 → 不得降级为空镜
- `scene_name` 非空 → 必须在该场景中设计
- 不允许无依据新增支线剧情
- stage 是片段（segment），不是镜头（shot）。planner 列出视觉落点，generator 决定怎么拍

---

## §R 路由判断

> 路由决定加载哪些 reference。若由上游代码指定路由则跳过此步。

### story_mode 路由

```
stage_plan 中是否存在两条清晰的人物/场景线在交替推进？
  → 是 → directing.md + creative/story-dual.md
  → 否 → directing.md + creative/story-single.md
```

### visions 路由

```
Q1: 多时空/记忆闪回/梦境嵌套/同一人多版本？ → visions + stream
Q2: 场景全部存在于现实世界？ → 否 → visions + fantasy
Q3: visual_brief 存在轻度物理违背？ → 是 → visions + surreal → 否 → visions + realistic（兜底）
```

加载：`directing.md + creative/visions-{route}.md`

### lip-sync 路由

由 `video_model.model_key` 决定，仅加载 `creative/lip-sync-*.md`（自包含）。

---

## 输出格式

```
SUMMARIZE
（用 language_code 语言写 2-3 句全片视觉概述，给用户看）

DIRECTING
渲染族: 摄影系 | 画风系 | 参考图主导
cam: （摄影系时写推荐相机/胶片组合；画风系/参考图主导时省略此行）

SHOT_1 [0-8s] (S1): ①落点A ②落点B(body: ...) ③落点C | 氛围·情绪 →衔接
SHOT_2 [8-15s] (S2+S3): ①落点A ②落点B(body: ...) ③落点C ④落点D | 氛围·情绪 →衔接
SHOT_3 [15-20s] (S4前半): ①落点A ②落点B(body: ...) ③落点C | 氛围·情绪 →衔接
SHOT_4 [20-25s] (S4后半): ①落点A ②落点B(body: ...) ③落点C | 氛围·情绪 →衔接
```

- 合并的 stage 写在同一 SHOT 括号中：`(S2+S3)`
- 拆分的 stage 分成多个 SHOT：`(S4前半)` `(S4后半)`
- 正常 1 stage = 1 SHOT：`(S1)`
- 落点数量按 shot 时长弹性调整（见 directing.md）
- 双线叙事时，每个 SHOT treatment 开头加 `[线A]` 或 `[线B]`（见 story-dual.md）

> feeling / motif / sound-image / 能量走向是内部推理过程，结果编码在 treatment 的落点和标注中，不输出为独立块。
