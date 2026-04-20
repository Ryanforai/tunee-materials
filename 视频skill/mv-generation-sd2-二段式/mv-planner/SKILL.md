---
name: mv-planner-seedance
description: MV 导演规划（Seedance 2.0 专用）。接收完整 MV 输入，输出纯文本（SUMMARIZE + DIRECTING + 逐段 treatment）。只做策略，不写 prompt。
---

# MV Planner · Seedance 2.0

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
    visions.md                        ← 视觉概念型（含概念原则 + 场景类型 + Case）
    mv-clone.md                       ← 参考重构型（含视觉 DNA 移植 + 重复段落升级 + Case）
  styles/
    kpop.md                           ← K-pop / 流行舞曲拍法参考
    ballad.md                         ← Ballad / 抒情拍法参考
    edm.md                            ← EDM / 电子拍法参考
    rock.md                           ← Rock / 摇滚拍法参考
    rnb.md                            ← R&B / Soul 拍法参考
    hiphop.md                         ← Hip-hop / 说唱拍法参考
    chinese.md                        ← 古风 / 国风拍法参考
```

---

## §1 输入与解析

### 所有字段

`mv_type` / `mv_guide.md_stages` / `mv_guide.mv_elements` / `language_code` / `audio_duration` / `video_model` / `visual_style` / `mv_guide.style_guide`（可选）/ `music_tags`（可选）

**忽略字段（出现时直接跳过）：** `image_model` / `mv_guide.stages`（旧格式，以 `md_stages` 为准）

### 有效风格值（effective_style）

`mv_guide.style_guide` 存在且非空时优先；否则回退到 `visual_style`。空字符串视为缺失。都缺失则走参考图主导模式。

### 渲染族（rendering_family）

| 渲染族 | 判定条件 |
|---|---|
| **摄影系 `photographic`** | `effective_style` 含：`写实 / realistic / cinematic / 电影 / 胶片 / film / vintage / 复古 / Y2K / noir / 黑色电影 / 赛博朋克 / cyberpunk / documentary / 纪录 / CG写实 / 真人 / live-action / 精致写实 / 高级质感`；或无法判定时兜底 |
| **画风系 `stylized`** | `effective_style` 含：`动漫 / anime / 赛璐璞 / cel / 水墨 / ink wash / 水彩 / watercolor / 油画 / oil painting / 3D渲染 / 3D render / toon / 像素 / pixel / 浮世绘 / ukiyo-e / 国画 / 漫画 / comic / manga / 剪纸 / paper cut / 插画 / illustration / flat design / 低多边形 / low poly / voxel` |

两族同时命中 → **画风系优先**。

### `audio_duration`

输入可能为浮点，立即四舍五入为整数使用。

### `mv_guide.md_stages`

全片 **canonical stage plan**。期望 Markdown 表格，至少含列：`时间段` / `音乐结构` / `歌词` / `画面描述` / `场景` / `角色`。时间值须为整数秒，浮点立即四舍五入。

### 异常兜底

| 情况 | 处理 |
|---|---|
| 有效风格值缺失 | 参考图主导模式。不推荐色调/相机，只写光源+方向 |
| 有效风格值存在但无法映射 | 保留原文传递给 generator |
| characters 为空但 mv_guide 提到人物 | 角色资源为空，treatment 中仍可描述人物动作 |
| scenes 为空但 mv_guide 提到场景 | 场景资源为空，treatment 中仍可描述环境 |
| md_stages 中场景名不在 `scenes[]` 中 | 不报错，保留原文 |
| `music_structure` 无法标准化 | 保留原文 |
| `music_tags` 缺失或空 | 不加载风格文件，跳过 visual_identity，拍法由 style_guide + md_stages 上下文驱动 |

---

## §1.5 条件触发：Timeline Normalize

**不要主动加载此文件。** 只有在 §2 Preflight（Stage Plan Parsing 或 Asset Map）中发现以下任一情况时，才加载 `references/timeline-normalization.md` 进行修复：

- 时间段 start/end 不是整数秒
- 首行 start ≠ 0，或末行 end ≠ audio_duration
- 相邻行存在间隙（gap）或重叠（overlap）
- 某行时长超出 [4, 15] 秒约束

触发后按文件中的 gap 吸收/重叠截断/超长拆分/超短合并 修复，**最多 3 轮**。修复成功 → **以修正后的 stage_plan 继续执行后续步骤**，不重头重新加载所有文件。3 轮后仍有违规 → 输出末尾追加 `_violations` 并继续。

未触发（时间无问题）→ 跳过此步，正常执行 §2 及后续步骤。

## §2 Preflight

### Asset Map（资源注册）

- character key = `character.name`，scene key = `scene.scene_name`（若无则取 `scene.name`）
- 名称匹配前先 trim 首尾空格、统一全角/半角斜杠和破折号。**同样适用于 `md_stages` 中 `场景`/`角色` 列的匹配**
- 只有 `mv_elements.characters[] / scenes[]` 中显式存在的对象才能进入资源表
- `character_name` 含 `/` 时，按 `/` 拆分、逐项 trim 后分别校验
- `scene_name` 只允许单一场景名或空值，不允许 `/` 拼接多场景

### 道具锁定

扫描全部 stage `画面描述`，识别跨 2+ stage 反复出现的道具/物件（车辆、乐器、手机、行李箱等）。为每个道具写一句**固定视觉描述**（颜色 + 型号/形态 + 材质），全片复用，写入 DIRECTING 块传递给 generator。

示例：
- 画面描述多次提到「敞篷车」→ 道具锁定：`深蓝色老款野马敞篷，米色真皮座椅，胡桃木纹仪表盘`
- 画面描述多次提到「吉他」→ 道具锁定：`枫木原色 Dreadnought 木吉他，琴身有磨痕`

### Stage Plan Parsing

将 `mv_guide.md_stages` 解析为内部 `stage_plan`：

- **时间值绝对只允许整数秒**，浮点立即四舍五入
- 新的合法 `时间段` 才算下一个 stage
- `stage_plan[0].start = 0`，`stage_plan[最后].end = audio_duration`
- 相邻 stage 连续无间隙、无重叠
- `-` / `–` / `—` / 全角破折号视为同义分隔符

---

## §3 Shot 组织

**严格 1 stage = 1 SHOT**，时间范围直接对应 §1.5 已校验的 `md_stages` 时间段，不合并、不拆分。

- 每个 SHOT 的 `start_time` / `end_time` 直接取 stage 的时间值，整数秒
- SHOT 内部由 generator 按 2-4s 划分子镜头，SHOT 边界本身不变

---

## §4 Style Dispatch

`music_tags` 存在且非空时，识别主要风格类别，加载对应风格文件。风格文件为 Preflight 推导 visual_identity 提供拍法锚点。

| 关键词 | 风格文件 |
|---|---|
| K-pop / Kpop / 韩流 / 流行舞曲 / dance pop / idol | references/styles/kpop.md |
| Hip-hop / Rap / 说唱 / Trap / Drill | references/styles/hiphop.md |
| Ballad / 抒情 / 慢歌 / 情歌 | references/styles/ballad.md |
| EDM / 电子 / House / Techno / Trance / Dubstep | references/styles/edm.md |
| Rock / 摇滚 / Punk / Metal / Indie rock | references/styles/rock.md |
| R&B / Soul / Neo-soul / Funk | references/styles/rnb.md |
| 古风 / 中国风 / 国风 / 国潮 / 民族 | references/styles/chinese.md |

- 匹配取最佳匹配，不区分大小写
- 无法匹配任何关键词 → 不加载风格文件，visual_identity 由模型自行从 music_tags 推导
- `music_tags` 缺失或空 → 不加载风格文件，跳过 visual_identity

**Visual Identity 推导（music_tags 存在且已加载风格文件时）：**

参考风格文件中的拍法特征，结合 style_guide，推导 3 项决策，全片复用，写入 DIRECTING 块：

- **`pacing`**：主歌段 vs 副歌/高潮段的镜头时长范围（写具体秒数）
- **`signature_shots`**：2 个本片标志性镜头手法（从三级运镜库中选，写具体 L1+L2 组合）
- **`color_logic`**：一句话色彩策略（主色调 + 段落间变化逻辑）

pacing 不是只看 BPM——必须综合 music_tags 全部信息 + 风格文件中的指导。

**Visual Language 推导（effective_style 存在时）：**

从 effective_style 推导 3 项决策，全片复用，写入 DIRECTING 块：

- **`texture`**：画面质感（如：胶片颗粒 / 干净数字 / 水墨渲染 / 油画笔触）
- **`composition_tendency`**：构图倾向（如：大量留白 / 饱满紧凑 / 对称几何 / 动态对角线）
- **`effect_signature`**：1-2 个标志性视觉效果（如：lens flare / 速度线 / 粒子飘落 / 烟雾弥漫 / 无特效）

---

## §5 Stage Fidelity

- treatment 必须覆盖所有 stage，保持原始顺序
- `character_name` 非空 → 不得降级为空镜
- `scene_name` 非空 → 必须在该场景中设计
- 不允许无依据新增支线剧情
- stage 是片段（segment），不是镜头（shot）。planner 列出视觉落点，generator 决定怎么拍

---

## §R 路由判断

> 路由决定加载哪些 reference。若由上游代码指定路由则跳过此步。
> **`mv_type` 是顶层 switch，两条分支互斥，只进入其中一条，不得跨分支加载。**

```
mv_type = story_mode  → 进入 [story_mode 分支]
mv_type = visions     → 进入 [visions 分支]
mv_type = mv_clone    → 进入 [mv_clone 分支]
```

### [story_mode 分支]

```
stage_plan 中是否存在两条清晰的人物/场景线在交替推进？
  → 是 → 加载 directing.md + creative/story-dual.md
  → 否 → 加载 directing.md + creative/story-single.md
```

### [visions 分支]

```
加载 directing.md + creative/visions.md
```

> visions 内部的场景类型（写实/超现实/奇幻/意识流）在 visions.md 中作为内部决策处理，不拆分文件。

### [mv_clone 分支]

```
加载 directing.md + creative/mv-clone.md
```

---

## 输出格式

```
SUMMARIZE
（用 language_code 语言写 2-3 句全片视觉概述，给用户看）

DIRECTING
渲染族: 摄影系 | 画风系 | 参考图主导
cam: （摄影系时写推荐相机/胶片组合；画风系/参考图主导时省略此行）
大气: （全片主大气效果，如：薄雾 / 雨雾 / 粉尘 / 无特殊大气）
道具锁定: （跨段道具及其固定视觉描述；无跨段道具则省略此行）
pacing: （music_tags 存在时写；缺失则省略）
signature_shots: （music_tags 存在时写；缺失则省略）
color_logic: （music_tags 存在时写；缺失则省略）
texture: （effective_style 存在时写；缺失则省略）
composition_tendency: （effective_style 存在时写；缺失则省略）
effect_signature: （effective_style 存在时写；缺失则省略）

SHOT_1 [0-8s] (S1): ①[角色名]落点A(body: ...) ②[scene]落点B ③[prop]落点C | 氛围·情绪 →衔接
SHOT_2 [8-20s] (S2): ①[角色名]落点A(body: ...) ②[prop]落点B ③[scene]落点C ④[light]落点D | 氛围·情绪 →衔接
SHOT_3 [20-28s] (S3): ①[角色名]落点A(body: ...) ②[light]落点B ③[scene]落点C | 氛围·情绪 →衔接
```

- 严格 1 stage = 1 SHOT，括号内标注对应 stage 编号：`(S1)` `(S2)` ...
- 落点数量按 shot 时长弹性调整（见 directing.md）
- 双线叙事时，每个 SHOT treatment 开头加 `[线A]` 或 `[线B]`（见 creative/story-dual.md）
- 每个落点开头必须加主体 tag：`[角色名]`（注册角色）/ `[scene]`（场景）/ `[prop]`（物件）/ `[light]`（光影）

> feeling / motif / sound-image / 能量走向是内部推理过程，结果编码在 treatment 的落点和标注中，不输出为独立块。
