# Prompt 写法指南（lip-sync）

> generator 的核心工作：把 planner 的导演 treatment 翻译成视频模型能理解的 video_prompt + frame_prompt。
> lip-sync 的 video_prompt 结构与 story/visions 不同，frame_prompt 结构相同。

---

## 一、video_prompt 写法

lip-sync 的 video_prompt 是一段连续描述，**禁止 `<<<image_X>>>`、禁止时间段标记、禁止子镜头**。

**语言：** `language_code = zh-CN` 用中文，其他用英文。禁止中英混杂。

### 格式

```
Perfect lip-sync singing to the provided audio. [景别], [运镜或 locked camera], [主体状态 + 自然微动作], [场景 + 环境缓慢变化], [光线]. No text, no subtitles, no logo, no watermark.
```

### 每个 shot 必须包含

- 1 类人物自然微动作：呼吸起伏 / 轻微转肩 / 极轻头部晃动 / 手指轻搭道具
- 1 类环境或光影缓慢变化：光影在表面缓慢流动 / 反射轻微变化 / haze 缓慢漂移
- 也允许简单连续动作直接写明（轻弹琴键、手掌扶麦、指尖沿桌面缓慢滑动），只要整段成立

### 禁止

- `<<<image_X>>>` / 首帧语法
- 时间段标记（`0-5s` / `0s-10s`）
- `From` / `By` / `At`
- 子镜头编号（`shot 1` / `镜头1`）
- 任何可读文字、字幕、logo、水印、UI

### 模型分支

#### infinite_talk — 固定镜头

- video_prompt 末尾加 `Static shot.`
- 禁止任何运镜词（pan / tilt / dolly / orbit / zoom / handheld / crane / pushes / pulls）
- 允许简单连续动作，但必须整段成立，不能写成分段表演

#### wan_video_2_7 — 允许 1 个连续主运镜 + 连续时长范围

- 每个 shot 最多 1 个连续主运镜；无明确空间动机时用 `locked camera`
- 允许：`locked camera` / `gentle push-in` / `gentle pull-back` / `short lateral track` / `slight orbit`
- 禁止：shot 内先推后拉 / orbit 再反转 / 多段机位切换
- **时长硬约束：每个 shot 时长必须 ∈ [2, 15]s（连续范围，非离散值）**

### 通用 lip-sync 规则

- 默认优先正脸或轻微 3/4 正脸
- 默认优先 Close-up / Medium close-up / Medium
- 不要让主唱离镜头太远，不要长时间遮挡嘴部
- 所有 shot 必须有非空 `character_name`（不允许 null、不允许空字符串、不允许空镜）
- 情绪驱动动作，lip-sync 优先于花哨镜头
- 悲伤类情绪禁止微笑
- 禁止凭空加道具

---

## 二、frame_prompt 写法

frame_prompt 是完整成品，全程英文。基于该 shot 在 0s 的开场静帧。

### <<<image_X>>> 编号规则

角色从 `<<<image_1>>>` 开始，场景排在角色之后：

- `<<<image_1>>>` = 第 1 个角色
- `<<<image_2>>>` = 第 2 个角色（或单角色时的场景）
- 场景排在所有角色之后

> lip-sync video_prompt 禁止 `<<<image_X>>>`，编号只存在于 frame_prompt。

### 渲染族判定表

| 渲染族 | 判定条件 |
|--------|---------|
| **摄影系** | effective_style 含：`写实 / realistic / cinematic / 电影 / 胶片 / film / vintage / 复古 / Y2K / noir / 黑色电影 / 赛博朋克 / cyberpunk / documentary / 纪录 / CG写实 / 真人 / live-action / 精致写实 / 高级质感`；或无法判定时兜底 |
| **画风系** | effective_style 含：`动漫 / anime / 赛璐璞 / cel / 水墨 / ink wash / 水彩 / watercolor / 油画 / oil painting / 3D渲染 / 3D render / toon / 像素 / pixel / 浮世绘 / ukiyo-e / 国画 / 漫画 / comic / manga / 剪纸 / paper cut / 插画 / illustration / flat design / 低多边形 / low poly / voxel` |

两族同时命中 → **画风系优先**。planner DIRECTING 中会标注渲染族。

### frame_prompt 结构

按以下模块顺序拼成完整字符串：

**① 一致性声明**（必须写在开头）
```
单角色：Keep the person exactly as shown in <<<image_1>>> with 100% identical facial features, hair, and clothing. Do not alter any aspect of the person's appearance from <<<image_1>>>. Keep the visual style exactly consistent with the reference image.
多角色：Keep all persons exactly as shown in <<<image_1>>>, <<<image_2>>>（依次列出）with 100% identical facial features, hair, and clothing. Do not alter any aspect of any person's appearance. Keep the visual style exactly consistent with the reference images.
```

**② Visual style 声明**（有效风格值存在时）
`Visual style: [有效风格值原文].`

**③ 角色姿态**
`<<<image_1>>>` 做主语，姿态具体到身体部位。多角色时每人单独一句，各写姿态 + 物理接触或空间关系。

`<<<image_X>>>` 是唯一合法的角色指代方式。禁止泛称（"人物""the figure""she""he"）或角色名文字替代。禁止文字描述角色外貌。禁止态度词替代身体描述。

姿态要点：头部角度 / 四肢位置 / 身体重心 / 视线方向 / 面部微状态。禁止 standing / walking / sitting 默认动作。

**硬规则：frame_prompt 中必须出现该 shot 所有角色的 `<<<image_X>>>`，一个都不能少。**

**④ 场景引用**
有场景资源 → `Set against the background shown in <<<image_N>>>.`
无场景资源 → 文字描述环境

**⑤ 景别** — 标准景别关键词（如 `Close-up (CU), shoulders up`）

**⑥ 构图** — 主体位置 + 视觉动线 + 视觉重量平衡。禁止在此写光线/色温/氛围。

**⑦ 焦段 + 虚实**（按渲染族分支）

- **摄影系**：`Shot on [X]mm lens. [主体] is tack sharp. The background [状态].`
- **画风系**：`[X]mm lens.`（禁止：tack sharp / soft diffusion / bokeh）
- **参考图主导**：`[X]mm lens.`（禁止渲染词）

**⑧ 相机+胶片**（仅摄影系）
`Shot on [相机], [胶片] emulation, [颗粒], [光学效果].`
画风系/参考图主导 → 跳过

**⑨ 光线方向**（仅参考图主导模式）
`[Light source] from [direction], shaping [受光区].`（禁止色温词）
摄影系/画风系 → 跳过

**⑩ 神态+气质**
面部物理状态（用 treatment `(body: ...)` 关键词）+ 气质词（最多 1-2 个）

### 渲染族分支总结

| 模块 | 摄影系 | 画风系 | 参考图主导 |
|------|--------|--------|-----------|
| ① 一致性声明 | ✅ | ✅ | ✅ |
| ② Visual style | ✅ | ✅ | — |
| ③ 角色姿态 | ✅ | ✅ | ✅ |
| ④ 场景引用 | ✅ | ✅ | ✅ |
| ⑤ 景别 | ✅ | ✅ | ✅ |
| ⑥ 构图 | ✅ | ✅ | ✅ |
| ⑦ 焦段+虚实 | 完整（tack sharp） | 仅焦段数字 | 仅焦段数字 |
| ⑧ 相机+胶片 | ✅ | — | — |
| ⑨ 光线方向 | — | — | ✅ |
| ⑩ 神态+气质 | ✅ | ✅ | ✅ |

**字数上限 600 词。裁剪优先级：** ⑩气质词 → ⑥视觉动线 → ⑧只留型号。
**绝不删除：** ①一致性声明、③角色姿态、⑤景别、⑦焦段。

### PASS/FAIL 示例

**[PASS] — 摄影系（effective_style = "赛博朋克霓虹街道"）**
```
Keep the person exactly as shown in <<<image_1>>> with 100% identical facial features, hair, and clothing. Do not alter any aspect of the person's appearance from <<<image_1>>>. Keep the visual style exactly consistent with the reference image. Visual style: 赛博朋克霓虹街道. <<<image_1>>> chin raised, body facing directly toward camera, feet planted at the threshold, one hand hanging loose at the side, the other barely lifted with fingers half-curled. Set against the background shown in <<<image_2>>>. Medium wide shot. <<<image_1>>> placed center-left, broad negative space to the right. Shot on 85mm lens. <<<image_1>>> is tack sharp. The background falls into soft diffusion. Shot on RED Monstro 8K, CineStill 800T emulation, fine grain, cool halation on highlights. Jaw set, lips pressed, contained defiance.
```

**[PASS] — 画风系（effective_style = "水墨山水"）**
```
Keep the person exactly as shown in <<<image_1>>> with 100% identical facial features, hair, and clothing. Do not alter any aspect of the person's appearance from <<<image_1>>>. Keep the visual style exactly consistent with the reference image. Visual style: 水墨山水. <<<image_1>>> chin raised, body facing directly toward camera, feet planted at the threshold, one hand hanging loose at the side, the other barely lifted with fingers half-curled. Set against the background shown in <<<image_2>>>. Medium wide shot. <<<image_1>>> placed center-left, broad negative space to the right. 85mm lens. Jaw set, lips pressed, contained defiance.
```

**[PASS] — 参考图主导**
```
Keep the person exactly as shown in <<<image_1>>> with 100% identical facial features, hair, and clothing. Do not alter any aspect of the person's appearance from <<<image_1>>>. Keep the visual style exactly consistent with the reference image. <<<image_1>>> chin raised, body facing directly toward camera, feet planted at the threshold, one hand hanging loose at the side, the other barely lifted with fingers half-curled. Set against the background shown in <<<image_2>>>. Medium wide shot. <<<image_1>>> placed center-left, broad negative space to the right. 85mm lens. Overcast sky from above, shaping the arm and shoulder edge. Jaw set, lips pressed, contained defiance.
```

**[FAIL] — 缺少一致性声明**
```
<<<image_1>>> chin raised, body facing directly toward camera. Set against the background shown in <<<image_2>>>. Medium wide shot. 85mm lens.
```
> 错误：开头没有一致性声明。

**[FAIL] — 用角色名替代 <<<image_X>>>**
```
Keep the person exactly as shown in <<<image_1>>>... Kaiya, tongue between teeth, playful defiance.
```
> 错误 1：用角色名 "Kaiya" 而不是 <<<image_1>>>
> 错误 2："playful defiance" 是态度词，不是身体描述

**[FAIL] — 画风系写了摄影渲染词**
```
... Visual style: 动漫赛璐璞 ... Shot on 85mm lens. <<<image_1>>> is tack sharp. Shot on ARRI Alexa Mini LF, Fuji Eterna 500T emulation.
```
> 错误：画风系却写了虚实 + 相机胶片。

---

## 三、通用规则

### description 规则

description 是导演指令：谁在哪做什么 + 镜头怎么拍。禁止散文/元叙述。语言跟随 `language_code`（用户可见字段）。

### 物理可实现性

每句描述必须是视频模型可渲染的具体画面。

**[FAIL]** "人影退成光晕中的暗斑" / "身体化为光粒子消散"
**[PASS]** "两人转身走远，背影缩小到画面边缘" / "逆光使轮廓连成一条线"

### 摄影系相机速查（仅渲染族=摄影系时）

| 色调 | 推荐相机 |
|-----|---------|
| 胶片复古 | Alexa Classic + Kodak 5254/5293 |
| 当代简约 | Sony Venice 2 / ARRI Alexa 35 |
| Y2K千禧 | RED Monstro 8K |
| 东亚唯美 | ARRI Alexa Mini LF + Fuji Eterna 500T |
| 赛博未来感 | RED Monstro 8K + CineStill 800T |

> planner DIRECTING 中会给出推荐相机，generator 在 frame_prompt ⑧ 中引用。

---

## 四、禁止词

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

**物理矛盾禁止：** `wide angle + shallow DoF` / `long shot + extreme bokeh` / `close-up + wide angle`

**情绪泛指词禁止：** `sad expression / happy face` → 写可拍的物理状态

### 模型专属禁止词

#### infinite_talk
```
camera pushes / camera pulls / pan / tilt / dolly / orbit / zoom / handheld / crane
cut to / jump cut / shot 1 / shot 2 / sub-shot / timeline
0s-5s / 0-10s / 10-20s / 镜头1 / 镜头2
From / By / At
tears / crying / teary / anguished
```

#### wan_video_2_7
```
shot 1 / shot 2 / sub-shot / timeline / 0s-5s
From / By / At
cut to / jump cut / montage inside one shot
camera pushes then pulls / orbit then reverse / multiple moves in one shot
```

---

## 五、自检清单

每个 shot 输出前逐项确认：

```
□ shot_id / scene_name / start_time / end_time / duration / description / video_prompt / frame_prompt / character_name 全部存在
□ character_name 不允许省略键，不允许为 null 或空字符串
□ start_time / end_time / duration 全部为整数，无小数点
□ duration = end_time - start_time
□ 时间轴与前一个 shot 的 end_time 连续
□ frame_prompt 以一致性声明开头（Keep the person exactly as shown in ...）
□ frame_prompt 中 <<<image_X>>> 从 1 开始，先角色后场景
□ video_prompt 无 <<<image_X>>>、无时间段标记、无子镜头编号
□ video_prompt 包含至少 1 类人物自然微动作 + 1 类环境或光影缓慢变化
□ video_prompt 无禁止词、无物理矛盾
□ infinite_talk → video_prompt 末尾有 "Static shot."，无任何运镜词
□ wan_video_2_7 → 每 shot 最多 1 个连续主运镜，时长 ∈ [2, 15]s（连续范围）
□ 有效风格值缺失 → frame_prompt 无写实渲染词（tack sharp / soft diffusion / 相机 / 胶片）
□ 画风系 → frame_prompt 仅焦段数字（无 tack sharp / bokeh / 相机 / 胶片）
□ scene_name 最多 1 个场景
```
