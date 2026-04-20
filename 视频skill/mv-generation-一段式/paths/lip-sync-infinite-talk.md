# Lip-sync · infinite_talk · 完整执行文件

> 固定镜头对口型。不响应运镜，不适合复杂空间变化。
> **本文件自包含，执行时无需加载任何外部文件。**

---

## §1 输入与解析

### 字段清单

`mv_type` / `mv_guide.md_stages` / `mv_guide.mv_elements` / `language_code` / `audio_duration` / `video_model` / `visual_style` / `mv_guide.style_guide`（可选）

**仅 lip-sync 可选：** `scene_mode` / `lyrics_timeline_organize`

**忽略字段：** `image_model` / `mv_guide.stages`（旧格式，以 `md_stages` 为准）

### 有效风格值（effective_style）

`mv_guide.style_guide` 存在且非空时优先；否则回退到 `visual_style`。空字符串视为缺失。两者都缺失则走**参考图主导模式**。后续所有「有效风格值有值 / 缺失」的判断均基于此链。

### 渲染族（rendering_family）

有效风格值存在时判定，决定 frame_prompt ④⑦ 写法。关键词匹配不区分大小写；**两族同时命中以画风系优先**；无法判定时兜底摄影系。

| 渲染族 | 判定关键词 |
|--------|-----------|
| **摄影系 `photographic`** | 写实 / realistic / cinematic / 电影 / 胶片 / film / vintage / 复古 / Y2K / noir / 黑色电影 / 赛博朋克 / cyberpunk / documentary / 纪录 / CG写实 / 真人 / live-action / 精致写实 / 高级质感 |
| **画风系 `stylized`** | 动漫 / anime / 赛璐璞 / cel / 水墨 / ink wash / 水彩 / watercolor / 油画 / oil painting / 3D渲染 / 3D render / toon / 像素 / pixel / 浮世绘 / ukiyo-e / 国画 / 漫画 / comic / manga / 剪纸 / paper cut / 插画 / illustration / flat design / 低多边形 / low poly / voxel |

### audio_duration

输入可能为浮点，立即四舍五入为整数。全片时间轴终点 = `round(audio_duration)`。**全文所有时间值只允许整数秒。**

### mv_guide.md_stages

全片 **canonical stage plan**，不是参考信息。Markdown 表格，至少含列：`时间段` / `音乐结构` / `歌词` / `画面描述` / `场景` / `角色`

- `时间段` 格式如 `0s-10s`；容忍 `10s - 25s` / `25 - 33s` 等变体；浮点须立即转为整数
- `场景` / `角色` 可用 `/` 表示同段多项
- `画面描述` 说明这段大概拍什么，不规定镜头语言

### mv_guide.mv_elements

资产表。`scenes[]` 中 `name` / `scene_name` 视为同义键。

```json
{
  "characters": [{"index": 0, "name": "小K", "description": ["..."]}],
  "scenes": [{"index": 0, "name": "空山境", "description": ["..."]}]
}
```

> `index` 是数组位置（从 0 起），与 `<<<image_X>>>` 编号无关。

### 异常兜底

| 情况 | 处理 |
|------|------|
| `scene_mode` 缺失 | 默认 `multiple_scenes` |
| `lyrics_timeline_organize` 与 `md_stages` 不一致 | 以 `md_stages` 为准 |
| 有效风格值缺失 | 参考图主导模式：video_prompt 不写风格词；frame_prompt ④ 只写焦段数字、⑤ 只写光线方向、⑦ 跳过 |
| 有效风格值存在但无法映射渲染族 | 原文注入 prompt，按摄影系兜底 |
| `music_structure` 无法标准化 | 保留原文 |

### Error JSON

```json
{"error": "错误类型", "detail": "具体说明，告知调用方如何修正"}
```

输出 error JSON 后立刻停止。

---

## §2 Preflight

### Asset Map（资源注册）

将 `mv_elements` 中所有合法角色和场景注册到内部资源表。

- character key = `character.name`，scene key = `scene.scene_name`（若无则取 `scene.name`）
- 名称匹配前先 trim 首尾空格、统一全角/半角斜杠和破折号
- 只有 `mv_elements.characters[] / scenes[]` 中显式存在的对象才能进入资源表；`md_stages`、`lyrics`、`visual_brief` 等描述性文本不得作为创建资源的依据
- `characters[]` 为空 → prompt 中不生成角色 `<<<image_X>>>`
- `scenes[]` 为空 → prompt 中不生成场景 `<<<image_X>>>`
- `character_name` 含 `/` 时，按 `/` 拆分、逐项 trim 后分别校验，再按原顺序拼回
- `scene_name` 只允许单一场景名或空值，不允许 `/` 拼接多场景

> `<<<image_X>>>` 编号不在此处预分配，每个 shot 按 §6 规则独立从 1 开始重新编号。

### Stage Plan Parsing

将 `md_stages` 解析为内部 `stage_plan`：

```json
[{
  "stage_id": "Stage 1",
  "start": 0, "end": 6, "duration": 6,
  "music_structure": "Chorus",
  "lyrics": "...",
  "visual_brief": "...",
  "scene_name": "墨室琴案",
  "character_name": "小K"
}]
```

- 先识别表头，再做逻辑行重组；新的合法 `时间段` 才算下一个 stage，中间换行并入上一 stage 文本字段
- `-` / `–` / `—` / 全角破折号视为同义分隔符

### Stage Plan Validation

- `stage_plan[0].start = 0`，最后一项 `.end = audio_duration`；相邻 stage 连续无间隙无重叠
- `duration = end - start`
- `character_name` 多项值（A/B）拆分后逐项校验；`scene_name` 不允许 A/B 多场景拼接
- `character_name` 必须与 `mv_elements.characters` 对应
- 某 stage 的 `scene_name` 在 `scenes[]` 中找不到匹配 → **不报错**，该 shot 的 `scene_name = null`，prompt 用文字描述环境，不生成场景 `<<<image_X>>>`

### Stage 时间段原则

**stage 时间段优先遵循输入的 `md_stages`，不允许自行重新划分。**（infinite_talk 支持最长 300s 单 shot）

Shot 层适配：
- stage 时长 < 5s → 吸收进相邻 shot 作为内部 beat
- 相邻 stage 间存在间隙或重叠 → 对齐修正

---

## §3 时长校验

| scene_mode | min | max | 特殊约束 |
|------------|-----|-----|---------|
| `one_take` | 5 | 300 | shots 长度 = 1 |
| `multiple_scenes` | 5 | 300 | 每 shot 时长 ≥ 5s |

- `audio_duration < 5` → error JSON
- `one_take` 且 `audio_duration > 300` → error JSON

---

## §4 Stage Fidelity + 硬约束

### 通用约束

- 最终输出必须覆盖所有 stage，保持原始顺序；不允许省略主动作、角色、核心情绪；不允许无依据新增支线剧情
- 默认优先 `1 stage → 1 shot`；可合并/拆分，但必须保留原始 stage 的角色、主动作和情绪递进
- 时间轴连续：`shots[0].start_time = 0`，`shots[最后].end_time = audio_duration`，相邻 shot 无间隙无重叠

### 模型能力边界

**能做：** 嘴型同步 / 轻微头部晃动 / 自然眨眼 / 呼吸感和表情波动 / 简单连续人物动作 / 光影在表面缓慢游走 / 有来源方向的雾气或烟缓慢流动

**不做：** 运镜 / 子镜头 / shot 内时间段变化 / 突兀大幅姿态切换 / 复杂编舞 / 剧烈或分段式环境变化

### Lip-sync 专项约束

- **不允许空镜 shot**
- 每个 shot 必须显式包含 `character_name`，直接继承该 shot 覆盖的 `stage_plan.character_name`；不得为 `null` 或空字符串；多角色按 stage 顺序用 `/` 连接；若无法推导出合法值，输出 error JSON
- `infinite_talk` 只接受固定镜头（Static shot）；**`video_prompt` 描述整段连续成立的画面，禁止内部时间轴、禁止 `From / By / At`**
- **`video_prompt` 禁止一切 `<<<image_X>>>` 占位符**（对口型模型直接接收图片，不在 prompt 中声明）
- 主唱默认优先正脸或轻微 3/4 正脸，避免长时间侧脸、背脸、遮嘴；默认优先 Close-up / Medium close-up / Medium
- `video_prompt` 必须避免任何可读文字（字幕、歌词字卡、logo、水印、屏幕 UI）；场景含招牌/屏幕/灯牌，只能写成抽象光源或色块
- `video_prompt` 必须同时包含：**① 人物自然微动作**（如 breathing rise and fall / slight head tilt）；**② 背景自然流动**——须写清楚**载体 + 运动方向 + 覆盖区域**，禁止只写模糊词（不允许只写 `haze shifting`）；流动元素须与 `visual_brief` 和场景描述兼容；若场景无自然流动载体，退到与场景氛围相符的光影缓慢变化（如灯光强度轻微起伏、反光面上的光斑缓慢移动），不得凭空发明与参考图矛盾的元素
- 固定镜头只限制 camera grammar，不限制人物与环境本身

### one_take 额外约束

- 整首歌 = 1 个 shot；`shots` 长度 = 1；`md_stages` 仍是 canonical performance brief
- 若不同 stage 场景差异大，优先选一个连续主空间；必须保留原始歌词顺序、关键意象和表演递进

### multiple_scenes 规则

- 默认 `1 stage → 1 shot`；相邻 stage 角色/场景/表演强度几乎一致时可合并；单个 stage 太长时可拆成两个固定镜头 shot
- 所有适配必须保留原始 stage 顺序和关键意象

---

## §5 video_prompt 写法

一段连续描述，不写内部时间轴。**禁止 `<<<image_X>>>`**。

```
Perfect lip-sync singing to the provided audio. [Framing], [subject state + natural micro-movements], [background natural flow: carrier + direction + area], [lighting]. No text, no subtitles, no logo, no watermark. Static shot.
```

**`[background natural flow]` 是强制要素，不可省略或模糊带过。** 须写出具体的物理流动——载体是什么、从哪来往哪去、影响画面哪个区域。

不要写：运镜词 / 多阶段节奏 / 夸张大动作 / 剧烈环境变化 / 多地点跳转

**[PASS]**
```
Perfect lip-sync singing to the provided audio. Medium close-up, shoulders and face filling the frame. Chin slightly raised, body angled a quarter turn toward camera, one hand resting loosely at the collarbone, fingers barely curled. Thin mist drifting in from the right side of the background, slowly veiling the lower third of the scene. Dim light from upper left, shaping the cheekbone and jaw edge. No text, no subtitles, no logo, no watermark. Static shot.
```

**[FAIL] — 背景无载体无方向**
```
Perfect lip-sync singing to the provided audio. Close-up. Haze shifting softly. Warm ambient glow. Static shot.
```
> 错误 1：`Haze shifting` 无载体、无方向、无覆盖区域
> 错误 2：`Warm ambient glow` 是全局禁止词（无主次光源）

---

## §6 frame_prompt 写法

全程英文。基于该 shot 在 0s 的开场静帧。

### 占位符编号（写任何内容之前先完成）

每个 shot 独立编号，从 `<<<image_1>>>` 开始：先角色（按 `character_name` 出现顺序），后场景，只包含本 shot 实际出场的资源。**无首帧概念。**

**示例（`character_name = "Riot"`，`scene_name = "Mirror-lit room"`）：**

| 位置 | Riot | 场景 |
|------|------|------|
| frame_prompt | `<<<image_1>>>` | `<<<image_2>>>` |

### 渲染族决策表

| 模式 | 触发条件 | ④ 焦段 | ⑦ 相机胶片 |
|------|---------|--------|-----------|
| **摄影系** | effective_style 命中摄影系关键词，或无法判定 | 焦段 + tack sharp + 背景虚实 | 相机型号 + 胶片 + 颗粒 + 光学效果 |
| **画风系** | effective_style 命中画风系关键词 | 只写焦段数字（禁 tack sharp / bokeh / diffusion） | **跳过** |
| **参考图主导** | effective_style 缺失 | 只写焦段数字 | **跳过** |

> 判定关键词见 §1。画风系和参考图主导模式，渲染权威交给风格声明和参考图，**禁止写任何摄影渲染词**。

### 8 模块按序

**① 主题描述（固定顺序，不可打乱）**

```
第 1 句：一致性声明
第 2 句：<<<image_X>>> + 身体姿态（占位符做主语，具体到每个部位；多角色时每人单独一句，写姿态 + 空间关系）
第 3 句：场景引用（有场景资源 → set against the background shown in <<<image_N>>>；无 → 文字描述环境）
```

**`<<<image_X>>>` 是唯一合法的角色指代方式。** 禁止用泛称（the figure / she / he）或角色名文字替代。禁止文字描述角色外貌。

**硬规则：video_prompt 中出现了几个角色，frame_prompt 中就必须出现几个 `<<<image_X>>>`，一个都不能少。**

一致性声明模板：
```
单角色：Keep the person exactly as shown in <<<image_X>>> with 100% identical facial features, hair, and clothing. Do not alter any aspect of the person's appearance from <<<image_X>>>. Keep the visual style exactly consistent with the reference image.
多角色：Keep all persons exactly as shown in <<<image_1>>>, <<<image_2>>>（依次列出该 shot 所有角色编号，不多写不少写）with 100% identical facial features, hair, and clothing. Do not alter any aspect of any person's appearance. Keep the visual style exactly consistent with the reference images.
```

①末追加（有效风格值存在时）：`Visual style: [有效风格值原文]`

**② 景别** — 标准景别关键词（如 `Close-up (CU), shoulders up`）

**③ 构图** — 主体位置 + 视觉动线 + 视觉重量平衡

**④ 焦段** — 见渲染族决策表

**⑤ 光线方向（仅参考图主导模式）** — `[Light source] from [direction], shaping [受光区].`（只提供空间定位；禁止色温词、三层光分解、衰减/补光/反射描述）

**⑥ 跳过**

**⑦ 相机+胶片** — 见渲染族决策表

**⑧ 神态+气质** — 面部物理描述 + 气质词（最多 1-2 个）

**字数上限 600 词。裁剪优先级：** ⑧气质词 → ③视觉动线 → ⑦只留型号。

**绝不删除：** ① 主题 + 一致性声明、② 景别、④ 焦段。

姿态写法要点：头部角度 / 四肢位置 / 身体重心 / 视线方向 / 面部微状态。**禁止用 standing / walking / sitting 等默认动作。**

### 示例

**[FAIL] — 声明被挤到中间，泛称做主语**
```
A figure stands before a glowing portal, silhouetted against colorful backlight. Medium close-up, portal center dominating background. The character must be exactly consistent with <<<image_2>>>. Shot on 85mm lens...
```
> 错误 1：泛称 "A figure" 做主语
> 错误 2：一致性声明不在开头

**[PASS] — 摄影系（effective_style = "赛博朋克霓虹街道"）**
```
Keep the person exactly as shown in <<<image_1>>> with 100% identical facial features, hair, and clothing. Do not alter any aspect of the person's appearance from <<<image_1>>>. Keep the visual style exactly consistent with the reference image. Visual style: 赛博朋克霓虹街道. <<<image_1>>> chin raised, body facing directly toward camera, feet planted at the threshold, one hand hanging loose at the side, the other barely lifted with fingers half-curled. Set against the background shown in <<<image_2>>>. Medium wide shot. <<<image_1>>> placed center-left, broad negative space to the right. Shot on 85mm lens. <<<image_1>>> is tack sharp. The background falls into soft diffusion. Shot on RED Monstro 8K, CineStill 800T emulation, fine grain, cool halation on highlights. Jaw set, lips pressed, contained defiance.
```

**[PASS] — 画风系（effective_style = "水墨山水"）**
```
Keep the person exactly as shown in <<<image_1>>> with 100% identical facial features, hair, and clothing. Do not alter any aspect of the person's appearance from <<<image_1>>>. Keep the visual style exactly consistent with the reference image. Visual style: 水墨山水. <<<image_1>>> chin raised, body facing directly toward camera, feet planted at the threshold, one hand hanging loose at the side, the other barely lifted with fingers half-curled. Set against the background shown in <<<image_2>>>. Medium wide shot. <<<image_1>>> placed center-left, broad negative space to the right. 85mm lens. Jaw set, lips pressed, contained defiance.
```

**[FAIL] — 画风系但写了摄影渲染词**
```
Keep the person exactly as shown in <<<image_1>>> ... Visual style: 动漫赛璐璞 ... Shot on 85mm lens. <<<image_1>>> is tack sharp. The background falls into soft diffusion. Shot on ARRI Alexa Mini LF, Fuji Eterna 500T emulation, fine grain, subtle halation on highlights.
```
> 错误：画风系写了 ④ 虚实 + ⑦ 相机胶片。

**[PASS] — 参考图主导模式（有效风格值缺失）**
```
Keep the person exactly as shown in <<<image_1>>> with 100% identical facial features, hair, and clothing. Do not alter any aspect of the person's appearance from <<<image_1>>>. Keep the visual style exactly consistent with the reference image. <<<image_1>>> chin raised, body facing directly toward camera, feet planted at the threshold, one hand hanging loose at the side, the other barely lifted with fingers half-curled. Set against the background shown in <<<image_2>>>. Medium wide shot. <<<image_1>>> placed center-left, broad negative space to the right. 85mm lens. Overcast sky from above, shaping the arm and shoulder edge. Jaw set, lips pressed, contained defiance.
```

**[FAIL] — 参考图主导但写了摄影渲染词**
```
Keep the person exactly as shown in <<<image_1>>> ... <<<image_1>>> standing ankle-deep in still water ... 85mm lens. <<<image_1>>> is tack sharp. The distant lake falls into soft diffusion. Shot on ARRI Alexa Mini LF, soft film emulation, fine grain, subtle halation on bright mist edges.
```
> 错误：有效风格值缺失却写了摄影渲染词。

---

## §7 输出结构

### JSON Schema

```json
{
  "summarize": "string",
  "shots": [{
    "shot_id": "Shot 1",
    "scene_name": "string",
    "start_time": 0,
    "end_time": 60,
    "duration": 60,
    "description": "string",
    "video_prompt": "string",
    "frame_prompt": "string",
    "character_name": "string"
  }]
}
```

### 字段说明

- `shot_id`：`"Shot 1"` / `"Shot 2"` / ...，从 1 递增
- `summarize`：用 `language_code` 书写。导演视角的全片概述——整体风格、情绪走向、色调基调，不是镜头列表
- `scene_name`：资源表中的单一场景名；允许为空，最多 1 个
- `character_name`：**必填非空字符串**，继承自 stage_plan；缺少此键视为结构校验失败
- `description`：用 `language_code` 书写
- `video_prompt`：全程英文，单段连续描述，**禁止 `<<<image_X>>>`**
- `frame_prompt`：全程英文，占位符规则见 §6

---

## §8 自检清单

每个 shot 输出前逐项确认：

```
□ shot_id / scene_name / start_time / end_time / duration / description / video_prompt / frame_prompt / character_name 全部存在
□ character_name 非空字符串，从 stage_plan 正确继承
□ start_time / end_time / duration 全为整数；duration = end_time - start_time
□ 时间轴与前一个 shot 的 end_time 连续；时长 ≥ 5s
□ frame_prompt 占位符从 <<<image_1>>> 起，先角色后场景，无首帧偏移
□ frame_prompt ① 一致性声明在最前，<<<image_X>>> 做姿态句主语（无泛称 / 无角色名文字）
□ frame_prompt ① 姿态句无默认动作（standing / walking / sitting），写了具体物理状态
□ video_prompt 无任何 <<<image_X>>>
□ video_prompt 无全局禁止词；无物理矛盾（wide angle + shallow DoF / long shot + extreme bokeh / close-up + wide angle）
□ video_prompt 含人物自然微动作 + 背景自然流动（载体 + 方向 + 覆盖区域，禁止只写 haze shifting 等模糊词）
□ video_prompt 末尾有 "Static shot."
□ 有效风格值缺失时：frame_prompt 无摄影渲染词（tack sharp / soft diffusion / bokeh / 色温 / 相机型号 / 胶片 / grain / halation）
□ 渲染族为画风系时：frame_prompt ④ 仅焦段数字，⑦ 跳过
□ scene_name 最多 1 个场景
```

---

## §9 全局禁止词 + 模型专属禁止词

### 全局禁止词

```
dramatic / epic / breathtaking / stunning / gorgeous / beautiful / magical
8k / 16k / ultra-detailed / ultra-realistic / masterpiece / best quality
cinematic lighting（必须写具体光源）
ethereal glow / glowing particles / floating orbs / magical particles
lens flare explosion / light burst / light rays
neon / 霓虹（用 colored gel light / colored LED strip / colored storefront sign 替代）
radiant / luminous / dazzling / sparkling
ambient warm light / warm light + cool light（无主次）
```

物理矛盾禁止：`wide angle + shallow DoF` / `long shot + extreme bokeh` / `close-up + wide angle`

情绪泛指词禁止：`sad expression / happy face` → 写成可拍的物理状态，如 `downcast eyes, lips parted, brow furrowed`

### 模型专属禁止词（infinite_talk）

```
camera pushes / camera pulls / pan / tilt / dolly / orbit / zoom / handheld / crane
cut to / jump cut / shot 1 / shot 2 / sub-shot / timeline
0s-5s / 0-10s / 10-20s / 镜头1 / 镜头2
From / By / At
tears / crying / teary / anguished
```

---

## §10 禁止输出的字段

```
mv_type / video_model / visual_style / style_guide / rendering_family / md_stages / mv_elements / stage_plan / checks / notes / route / style_pick / structure / title
```
