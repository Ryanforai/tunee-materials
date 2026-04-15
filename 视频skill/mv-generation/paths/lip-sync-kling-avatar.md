# Lip-sync · kling_avatar_2_0 · 完整执行文件

> 动态运镜对口型。支持 `5-300s`，可做一个连续主运镜，但 shot 内不支持时间段落变化。口型效果中等，正脸和主唱脸部面积必须优先。
> **本文件自包含，执行时无需加载任何外部文件。**

---

## §1 输入与解析

### 所有字段

`mv_type` / `mv_guide.md_stages` / `mv_guide.mv_elements` / `language_code` / `audio_duration` / `video_model` / `visual_style` / `mv_guide.style_guide`（可选）

**仅 lip-sync 可选：** `scene_mode` / `lyrics_timeline_organize`

**忽略字段（出现时直接跳过）：** `image_model` / `mv_guide.stages`（旧格式，以 `md_stages` 为准）

### 有效风格值（effective_style）

`mv_guide.style_guide` 存在且非空时优先作为有效风格值，此时 `visual_style` 为空或不传；`mv_guide.style_guide` 不存在或为空时回退到 `visual_style`。空字符串视为缺失。上游确保两者至少一个有值，但若都缺失则走参考图主导模式。后续所有「有效风格值有值 / 缺失」的判断均基于此优先级链。

### 渲染族（rendering_family）

有效风格值存在时，根据文本内容判定渲染族，决定 frame_prompt ④⑦ 的写法。

| 渲染族 | 判定条件 | frame_prompt ④⑦ 行为 |
|--------|---------|----------------------|
| **摄影系 `photographic`** | `effective_style` 含以下任一关键词：`写实 / realistic / cinematic / 电影 / 胶片 / film / vintage / 复古 / Y2K / noir / 黑色电影 / 赛博朋克 / cyberpunk / documentary / 纪录 / CG写实 / 真人 / live-action / 精致写实 / 高级质感`；或无法判定时兜底 | ④ 焦段 + 虚实完整；⑦ 相机 + 胶片完整 |
| **画风系 `stylized`** | `effective_style` 含以下任一关键词：`动漫 / anime / 赛璐璞 / cel / 水墨 / ink wash / 水彩 / watercolor / 油画 / oil painting / 3D渲染 / 3D render / toon / 像素 / pixel / 浮世绘 / ukiyo-e / 国画 / 漫画 / comic / manga / 剪纸 / paper cut / 插画 / illustration / flat design / 低多边形 / low poly / voxel` | ④ 仅焦段数字（透视）；⑦ 跳过 |

> 关键词匹配不区分大小写。若 `effective_style` 同时命中两族关键词，以**画风系优先**。

### `audio_duration`

输入可能为浮点（如 `46.0`），立即四舍五入为整数使用。

### `mv_guide.md_stages`

全片 **canonical stage plan**，不是参考信息。期望内容是 Markdown 表格，至少包含列：`时间段` / `音乐结构` / `歌词` / `画面描述` / `场景` / `角色`

- 时间值须为整数秒，若输入含浮点（如 `9.7s`），立即四舍五入为整数
- `-` / `–` / `—` / 全角破折号视为同义分隔符

### Error JSON

```json
{"error": "错误类型", "detail": "具体说明，告知调用方如何修正"}
```

输出 error JSON 后立刻停止。

### 异常兜底（lip-sync 相关条目）

| 情况 | 处理 |
|------|------|
| `scene_mode` 缺失且 `lip-sync` | 默认 `multiple_scenes` |
| 有效风格值缺失 | 参考图主导模式。frame_prompt：④只写焦段数字、⑤只写光线方向、⑥⑦跳过 |
| 有效风格值存在但无法映射 | 原文注入 prompt |
| `lyrics_timeline_organize` 与 `md_stages` 不一致 | 以 `md_stages` 为准 |
| characters 为空 | 角色资源为空，不生成角色 `<<<image_X>>>` |
| scenes 为空 | 场景资源为空，不生成场景 `<<<image_X>>>` |
| md_stages 中 stage 的场景名不在 `scenes[]` 中 | 不报错，`scene_name = null`，prompt 用文字描述环境 |
| `music_structure` 无法标准化 | 保留原文 |

---

## §2 Preflight

### Asset Map（资源注册）

- character key = `character.name`，scene key = `scene.scene_name`（若无则取 `scene.name`）
- 名称匹配前先 trim 首尾空格、统一全角/半角斜杠和破折号
- 只有 `mv_elements.characters[] / scenes[]` 中显式存在的对象才能进入资源表
- `md_stages`、`lyrics`、`visual_brief`、case 或其他描述性文本都不能作为创建新资源对象的依据
- `character_name` 含 `/` 时，按 `/` 拆分、逐项 trim 后分别校验，再按原顺序拼回
- `scene_name` 只允许单一场景名或空值，不允许 `/` 拼接多场景

### Stage Plan Parsing

将 `mv_guide.md_stages` 解析为内部 `stage_plan`：

```json
[
  {
    "stage_id": "Stage 1",
    "start": 0, "end": 10, "duration": 10,
    "music_structure": "Chorus",
    "lyrics": "...",
    "visual_brief": "...",
    "scene_name": "舞台",
    "character_name": "小K"
  }
]
```

- **时间值绝对只允许整数秒。** 若输入含浮点，解析时立即四舍五入
- 新的合法 `时间段` 才算下一个 stage；中间换行并入上一 stage 文本字段
- `stage_plan[0].start = 0`，`stage_plan[最后].end = audio_duration`
- 相邻 stage 连续无间隙、无重叠

### Stage 时间段原则（lip-sync）

Stage 层保持输入的时间切分不变；Shot 层根据模型能力适配：
- stage 时长 < 5s → 吸收进相邻 shot 作为内部 beat
- 相邻 stage 间存在间隙或重叠 → 对齐修正
- **不允许自行重新划分时间段**

---

## §3 时长校验

| scene_mode | min | max | 特殊约束 |
|------------|-----|-----|---------|
| `one_take` | 5 | 300 | shots 长度 = 1 |
| `multiple_scenes` | 5 | 300 | 每 shot 最多一个连续主运镜 |

- `audio_duration < 5` → error JSON
- `one_take` 且 `audio_duration > 300` → error JSON

不通过 → error JSON 停止。

---

## §4 Stage Fidelity + 硬约束

### 通用约束

`stage_plan` 是全片语义主轴：

- 最终输出必须覆盖所有 stage，保持原始顺序
- 不允许省略 stage 的主动作、角色、核心情绪
- 不允许无依据新增支线剧情
- 默认优先 `1 stage → 1 shot`
- 时间轴连续：`shots[0].start_time = 0`，`shots[最后].end_time = audio_duration`，相邻 shot 无间隙无重叠
- **所有时间值必须为整数（秒）**

### Lip-sync 专项约束

- 每个 shot 都必须显式包含 `character_name` 字段，不能省略键名
- `character_name` 必须直接继承该 shot 覆盖的 `stage_plan.character_name`；多角色按 stage 顺序用 `/` 连接
- `character_name` 不得为 `null`、不得为空字符串、不得留空
- 不允许空镜 shot
- `video_prompt` 只能描述一个对整段 shot 都成立的连续画面，禁止内部时间轴、禁止 `From / By / At`
- **`video_prompt` 禁止一切 `<<<image_X>>>` 占位符和首帧语法**
- `frame_prompt` 的 `<<<image_X>>>` 从 `<<<image_1>>>` 开始编号，先角色后场景（无首帧概念）
- 主唱默认优先正脸或轻微 `3/4` 正脸，避免长时间侧脸、背脸、遮嘴
- 默认优先 `Close-up / Medium close-up / Medium`，不要把主唱拍得过远
- `kling_avatar_2_0` 每个 shot 最多一个连续主运镜
- `video_prompt` 必须明确避免任何可读文字元素（字幕、歌词字卡、logo、水印、屏幕 UI、可辨识招牌文字）
- 每个 shot 至少包含 1 类人物自然微动作与 1 类环境或光影缓慢变化

### one_take 额外约束

- 整首歌 = 1 个 shot，`shots` 长度 = 1
- `md_stages` 作为整支 one-take 的 performance brief
- 若不同 stage 场景差异过大，优先选择一个连续主空间
- 可以用一个连续主运镜增强生命力，但不要为了"丰富"而硬加运动

### multiple_scenes 规则

- 默认优先 `1 stage → 1 shot`
- 若某个 stage 在镜头上不够完整，可与相邻兼容 stage 合并
- 若某个 stage 很长且表演上不够成立，可拆成多个合法 shot
- 相邻 shot 至少换一个维度：场景 / 景别 / 角度 / 光线色温 / 情绪强度
- 所有适配必须保留原始 stage 顺序和关键意象

---

## §5 模型能力与限制

### 能做的

- 嘴型跟音频同步
- 一个连续主运镜
- 轻微构图变化
- 更完整的空间感和动态感

### 不会做的

- 子镜头
- shot 内时间段变化
- 多段机位切换
- 一个 shot 内先推后拉或反复切换运动方式

---

## §6 video_prompt 写法

一段连续描述。**禁止 `<<<image_X>>>`**——对口型模型直接接收图片输入，不在 prompt 中声明。

```
Perfect lip-sync singing to the provided audio. [Framing], [camera move or locked camera], [subject state with natural micro-movements], [scene with slow ambient/light drift], [lighting]. No text, no subtitles, no logo, no watermark.
```

### 允许的 camera move（每个 shot 最多一个）

- `locked camera`
- `gentle push-in`
- `gentle pull-back`
- `short lateral track`
- `slight orbit`

不允许：`From / By / At` / 多阶段时间转折 / 多段机位切换 / 先推后拉 / 先 orbit 再反转

---

## §7 frame_prompt 写法

全程英文。基于该 shot 在 0s 的开场静帧。

### 编号重置（写任何内容之前必须先完成）

1. 从 `<<<image_1>>>` 开始
2. 先角色（按 `character_name` 中出现的先后），后场景
3. 只包含本 shot 实际出场的资源
4. **无首帧概念**——`<<<image_1>>>` 直接是第一个角色

**示例（`character_name = "Riot"`，`scene_name = "Mirror-lit room"`）：**

| 位置 | Riot | 场景 |
|------|------|------|
| frame_prompt | `<<<image_1>>>` | `<<<image_2>>>` |

### 渲染族判定表

| 渲染族 | 判定条件 |
|--------|---------|
| **摄影系** | `effective_style` 含：`写实 / realistic / cinematic / 电影 / 胶片 / film / vintage / 复古 / Y2K / noir / 黑色电影 / 赛博朋克 / cyberpunk / documentary / 纪录 / CG写实 / 真人 / live-action / 精致写实 / 高级质感`；或无法判定时兜底 |
| **画风系** | `effective_style` 含：`动漫 / anime / 赛璐璞 / cel / 水墨 / ink wash / 水彩 / watercolor / 油画 / oil painting / 3D渲染 / 3D render / toon / 像素 / pixel / 浮世绘 / ukiyo-e / 国画 / 漫画 / comic / manga / 剪纸 / paper cut / 插画 / illustration / flat design / 低多边形 / low poly / voxel` |

两族同时命中 → **画风系优先**。

### 8 模块按序

**① 主题描述**

按以下固定顺序输出：
```
第 1 句：一致性声明
第 2 句：<<<image_X>>> + 身体姿态（占位符做主语，姿态具体到每个身体部位）
         多角色时：每人单独一句，各写姿态 + 两人的物理接触或空间关系
第 3 句：场景引用（有场景资源 → set against the background shown in <<<image_N>>>；无场景资源 → 文字描述环境）
```

`<<<image_X>>>` 是正文里唯一合法的角色指代方式。禁止用泛称或角色名文字替代。

一致性声明模板：
```
单角色：Keep the person exactly as shown in <<<image_X>>> with 100% identical facial features, hair, and clothing. Do not alter any aspect of the person's appearance from <<<image_X>>>. Keep the visual style exactly consistent with the reference image.
多角色：Keep all persons exactly as shown in <<<image_1>>>, <<<image_2>>>（依次列出所有角色编号）with 100% identical facial features, hair, and clothing. Do not alter any aspect of any person's appearance. Keep the visual style exactly consistent with the reference images.
```

写法要点：头部角度 / 四肢位置 / 身体重心 / 视线方向 / 面部微状态。不允许用 standing / walking / sitting 这种默认动作。

**② 景别** — 标准景别关键词（如 `Close-up (CU), shoulders up`），含拍摄角度（如 `slight low angle`）

**③ 构图** — 主体位置 + 视觉动线 + 视觉重量平衡

#### 有效风格值存在时 · 摄影系（④-⑧ 完整模式）

**④ 焦段+虚实** — `Shot on [X]mm lens. [主体] is tack sharp. The background [状态].`

**⑤⑥ 跳过**，在①末追加 `Visual style: [有效风格值原文]`

**⑦ 相机+胶片** — `Shot on [相机], [胶片] emulation, [颗粒], [光学效果].`

**⑧ 神态+气质** — 面部物理描述 + 气质词（最多 1-2 个）

**字数上限 600 词。裁剪优先级：** ⑧气质词 → ③视觉动线 → ⑦只留型号。

**绝不删除：** ①主题 + 一致性声明、②景别、④焦段、⑦相机型号。

#### 有效风格值存在时 · 画风系（④-⑧ 画风适配模式）

**④ 焦段（仅透视）** — 只写焦段数字：`[X]mm lens.`
> 禁止：`tack sharp` / `soft diffusion` / `shallow depth of field` / `bokeh`

**⑤⑥ 跳过**，在①末追加 `Visual style: [有效风格值原文]`

**⑦ 跳过**

**⑧ 神态+气质** — 面部物理描述 + 气质词（最多 1-2 个）

**字数上限 600 词。裁剪优先级：** ⑧气质词 → ③视觉动线。

**绝不删除：** ①主题 + 一致性声明 + `Visual style:` 声明、②景别、④焦段数字。

#### 有效风格值缺失时（参考图主导模式）

**④ 焦段（仅透视）** — `[X]mm lens.`（禁止：tack sharp / soft diffusion / bokeh）

**⑤ 光线方向（仅空间）** — `[Light source] from [direction], shaping [受光区].`（禁止色温词）

**⑥ 跳过**

**⑦ 跳过**

**⑧ 神态+气质** — 面部物理描述 + 气质词（最多 1-2 个）

**字数上限 600 词。绝不删除：** ①主题 + 一致性声明、②景别、④焦段数字。

---

## §8 输出结构

### JSON Schema

```json
{
  "summarize": "string",
  "shots": [
    {
      "shot_id": "Shot 1",
      "scene_name": "string",
      "start_time": 0,
      "end_time": 10,
      "duration": 10,
      "description": "string",
      "video_prompt": "string",
      "frame_prompt": "string",
      "character_name": "string"
    }
  ]
}
```

### 字段说明

- `shot_id`：格式 `"Shot 1"` / `"Shot 2"` / ...，从 1 递增
- `summarize`：用 `language_code` 书写。导演视角的全片概述
- `scene_name`：取自资源表中的单一场景名 key；允许为空
- `character_name`：**必填非空字符串**，lip-sync 不允许空镜
- `description`：用 `language_code` 书写
- `video_prompt`：全程英文，单段连续描述。禁止 `<<<image_X>>>`
- `frame_prompt`：全程英文，引用了 `<<<image_X>>>` 时必须写出风格一致性要求

### 占位符作用域

**lip-sync video_prompt 不使用任何 `<<<image_X>>>`。**

**frame_prompt 每个 shot 独立编号，从 `<<<image_1>>>` 开始，先角色后场景，无首帧偏移。**

---

## §9 自检清单

```
□ shot_id / scene_name / start_time / end_time / duration / description / video_prompt / frame_prompt / character_name 全部存在
□ character_name 不允许省略键，不允许为 null 或空字符串
□ start_time / end_time / duration 全部为整数，无小数点
□ duration = end_time - start_time
□ 时间轴与前一个 shot 的 end_time 连续
□ 时长 ≥ 5s
□ frame_prompt 占位符从 <<<image_1>>> 起，先角色后场景，无首帧偏移
□ lip-sync video_prompt：无任何 <<<image_X>>>
□ video_prompt 无全局禁止词
□ video_prompt 无物理矛盾
□ video_prompt 包含至少 1 类人物自然微动作 + 1 类环境或光影缓慢变化
□ 每个 shot 最多一个连续主运镜
□ 有效风格值缺失时 → frame_prompt 无写实渲染词
□ 渲染族为画风系时 → frame_prompt ④ 仅焦段数字，⑦ 跳过
□ scene_name 最多 1 个场景
```

---

## §10 全局禁止词 + 模型专属禁止词

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

情绪泛指词禁止：`sad expression / happy face` → 写成可拍的物理状态

### 模型专属禁止词（kling_avatar_2_0）

```
shot 1 / shot 2 / sub-shot / timeline / 0s-5s
From / By / At
cut to / jump cut / montage inside one shot
camera pushes then pulls / orbit then reverse / multiple moves in one shot
```

---

## §11 禁止输出的字段

```
mv_type / video_model / visual_style / style_guide / rendering_family / md_stages / mv_elements / stage_plan / checks / notes / route / style_pick / structure / title
```
