# Shared Core · frame_prompt + 输出结构

> 所有 story_mode / visions 路由共用。本文件定义 frame_prompt 的完整写法（8 模块 + 渲染族适配 + FAIL/PASS 校准示例）和输出 JSON 结构。

---

## §13 frame_prompt 写法

全程英文。基于 video_prompt 镜头1在 0s 的静止切片，禁止参考镜头2及之后。

### 编号重置（写任何内容之前必须先完成）

frame_prompt 的 `<<<image_X>>>` 编号与 video_prompt **完全无关**——没有首帧图，没有 +1 偏移：

1. 从 `<<<image_1>>>` 开始
2. 先角色（按 `character_name` 中出现的先后），后场景
3. 只包含本 shot 实际出场的资源

**速算：** 若 video_prompt 中某角色 = `<<<image_N>>>`，则该角色在 frame_prompt 中 = `<<<image_N-1>>>`（因为去掉了首帧图的 1 位偏移）。

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
空镜：跳过第 1、2 句，写 [场景主体] in/at [细节]
```

`<<<image_X>>>` 是正文里唯一合法的角色指代方式。禁止泛称或角色名文字替代。禁止文字描述角色外貌。

**硬规则：video_prompt 中出现了几个角色，frame_prompt 中就必须出现几个 `<<<image_X>>>`，一个都不能少。**

一致性声明模板：
```
单角色：Keep the person exactly as shown in <<<image_X>>> with 100% identical facial features, hair, and clothing. Do not alter any aspect of the person's appearance from <<<image_X>>>. Keep the visual style exactly consistent with the reference image.
多角色：Keep all persons exactly as shown in <<<image_1>>>, <<<image_2>>>（依次列出该 shot 所有角色的编号）with 100% identical facial features, hair, and clothing. Do not alter any aspect of any person's appearance. Keep the visual style exactly consistent with the reference images.
```

**[PASS] — 单角色 + 场景**
```
Keep the person exactly as shown in <<<image_1>>> with 100% identical facial features, hair, and clothing. Do not alter any aspect of the person's appearance from <<<image_1>>>. Keep the visual style exactly consistent with the reference image. <<<image_1>>> chin raised, body facing directly toward camera, feet planted at the threshold, one hand hanging loose at the side, the other barely lifted with fingers half-curled. Set against the background shown in <<<image_2>>>.
```

**[PASS] — 双角色 + 场景**
```
Keep all persons exactly as shown in <<<image_1>>>, <<<image_2>>> with 100% identical facial features, hair, and clothing. Do not alter any aspect of any person's appearance. Keep the visual style exactly consistent with the reference images. <<<image_1>>> head tilted back, chin raised, neck elongated, eyes half-closed gazing upward, one hand resting on <<<image_2>>>'s chest. <<<image_2>>> standing close, shoulders angled inward, jaw set, free hand gripping <<<image_1>>>'s wrist. Set against the background shown in <<<image_3>>>.
```

**[FAIL] — 占位符降级为附注，声明被挤到中间**
```
A figure stands before a glowing portal, silhouetted against colorful backlight. Medium close-up, portal center dominating background. The character must be exactly consistent with <<<image_2>>>. Shot on 85mm lens...
```
> 错误 1: 泛称 "A figure" 做主语而不是 <<<image_X>>>
> 错误 2: 编号用了 video_prompt 的 <<<image_2>>> 而不是 frame_prompt 的 <<<image_1>>>
> 错误 3: 一致性声明被姿态和景别隔开，不在开头

**[FAIL] — 默认姿态**
```
<<<image_1>>> standing on a rooftop at sunset.
<<<image_1>>> walking down a street at night.
A young woman with long black hair — <<<image_1>>> standing by the window.
```

写法要点：头部角度 / 四肢位置 / 身体重心 / 视线方向 / 面部微状态。不允许用 standing / walking / sitting 这种默认动作。

**② 景别** — 标准景别关键词（如 `Close-up (CU), shoulders up`）

**③ 构图** — 主体位置 + 视觉动线 + 视觉重量平衡

#### 有效风格值存在时 · 摄影系（④-⑧ 完整模式）

**④ 焦段+虚实** — `Shot on [X]mm lens. [主体] is tack sharp. The background [状态].`

**⑤⑥ 跳过**，在①末追加 `Visual style: [有效风格值原文]`

**⑦ 相机+胶片** — `Shot on [相机], [胶片] emulation, [颗粒], [光学效果].`

**⑧ 神态+气质** — 面部物理描述 + 气质词（最多 1-2 个）

**字数上限 600 词。裁剪优先级：** ⑧气质词 → ③视觉动线 → ⑦只留型号。

**绝不删除：** ①主题 + 一致性声明、②景别、④焦段、⑦相机型号。

**[PASS] — 摄影系完整模式（effective_style = "赛博朋克霓虹街道"，④虚实 + ⑦相机胶片）**
```
Keep the person exactly as shown in <<<image_1>>> with 100% identical facial features, hair, and clothing. Do not alter any aspect of the person's appearance from <<<image_1>>>. Keep the visual style exactly consistent with the reference image. Visual style: 赛博朋克霓虹街道. <<<image_1>>> chin raised, body facing directly toward camera, feet planted at the threshold, one hand hanging loose at the side, the other barely lifted with fingers half-curled. Set against the background shown in <<<image_2>>>. Medium wide shot. <<<image_1>>> placed center-left, broad negative space to the right. Shot on 85mm lens. <<<image_1>>> is tack sharp. The background falls into soft diffusion. Shot on RED Monstro 8K, CineStill 800T emulation, fine grain, cool halation on highlights. Jaw set, lips pressed, contained defiance.
```

#### 有效风格值存在时 · 画风系（④-⑧ 画风适配模式）

**核心原则：画风系风格（动漫 / 水墨 / 油画 / 3D 等）自带完整渲染逻辑——线条粗细、平涂/渐变、纸张/画布质感、光影简化方式。如果你写了 tack sharp + ARRI + film grain，生图模型会被迫用摄影质感覆盖画风的原生渲染，导致"水墨里出真实皮肤""动漫里出光学景深"。所以：保留构图控制，砍掉一切摄影渲染词，让 `Visual style` 声明和参考图独占渲染权威。**

**④ 焦段（仅透视）** — `[X]mm lens.`（禁止：tack sharp / soft diffusion / bokeh）

**⑤⑥ 跳过**，在①末追加 `Visual style: [有效风格值原文]`

**⑦ 跳过**

**⑧ 神态+气质** — 面部物理描述 + 气质词（最多 1-2 个）

**字数上限 600 词。绝不删除：** ①主题 + 一致性声明 + `Visual style:` 声明、②景别、④焦段数字。

**[PASS] — 画风系完整模式（effective_style = "水墨山水"，④仅焦段 + ⑦跳过）**
```
Keep the person exactly as shown in <<<image_1>>> with 100% identical facial features, hair, and clothing. Do not alter any aspect of the person's appearance from <<<image_1>>>. Keep the visual style exactly consistent with the reference image. Visual style: 水墨山水. <<<image_1>>> chin raised, body facing directly toward camera, feet planted at the threshold, one hand hanging loose at the side, the other barely lifted with fingers half-curled. Set against the background shown in <<<image_2>>>. Medium wide shot. <<<image_1>>> placed center-left, broad negative space to the right. 85mm lens. Jaw set, lips pressed, contained defiance.
```
> 对比摄影系：没有 `tack sharp` / `soft diffusion` / `RED Monstro` / `CineStill` / `grain` / `halation`。焦段数字保留（控制透视压缩），渲染质感完全由 `Visual style` 声明和参考图决定。

**[FAIL] — 画风系但写了摄影渲染词**
```
Keep the person exactly as shown in <<<image_1>>> ... Visual style: 动漫赛璐璞 ... Shot on 85mm lens. <<<image_1>>> is tack sharp. The background falls into soft diffusion. Shot on ARRI Alexa Mini LF, Fuji Eterna 500T emulation, fine grain, subtle halation on highlights.
```
> 错误：`effective_style` 命中画风系（动漫），却写了 ④ 虚实 + ⑦ 相机胶片。`tack sharp / soft diffusion / ARRI / film emulation / grain / halation` 会与动漫风格冲突，生图模型被迫在两套矛盾指令间挣扎。

#### 有效风格值缺失时（参考图主导模式）

**核心原则：你看不到参考图长什么样。参考图可能是水墨、动漫、3D、写实中的任何一种。如果你写了 ARRI + film grain + three-layer cinematic lighting，而参考图是赛璐璞动漫风，生图模型会被迫在两套矛盾指令间挣扎。所以：不写任何会强加渲染风格的词，让参考图独占风格权威。**

**④ 焦段（仅透视）** — `[X]mm lens.`（禁止渲染词）

**⑤ 光线方向（仅空间）** — `[Light source] from [direction], shaping [受光区].`（禁止色温词）

**⑥ 跳过**

**⑦ 跳过**

**⑧ 神态+气质** — 面部物理描述 + 气质词（最多 1-2 个）

**字数上限 600 词。绝不删除：** ①主题 + 一致性声明、②景别、④焦段数字。

**[PASS] — 参考图主导模式（④仅焦段 ⑤仅方向 ⑥⑦跳）**
```
Keep the person exactly as shown in <<<image_1>>> with 100% identical facial features, hair, and clothing. Do not alter any aspect of the person's appearance from <<<image_1>>>. Keep the visual style exactly consistent with the reference image. <<<image_1>>> chin raised, body facing directly toward camera, feet planted at the threshold, one hand hanging loose at the side, the other barely lifted with fingers half-curled. Set against the background shown in <<<image_2>>>. Medium wide shot. <<<image_1>>> placed center-left, broad negative space to the right. 85mm lens. Overcast sky from above, shaping the arm and shoulder edge. Jaw set, lips pressed, contained defiance.
```
> 对比：没有 `Visual style:` 声明、没有 `tack sharp` / `soft diffusion` / 相机 / 胶片。风格完全由 <<<image_1>>> <<<image_2>>> 决定。

**[FAIL] — 有效风格值缺失但写了摄影渲染词**
```
Keep the person exactly as shown in <<<image_1>>> ... <<<image_1>>> standing ankle-deep in still water ... 85mm lens. <<<image_1>>> is tack sharp. The distant lake falls into soft diffusion. Shot on ARRI Alexa Mini LF, soft film emulation, fine grain, subtle halation on bright mist edges.
```
> 错误：有效风格值为空却写了完整 ④⑤⑥⑦，强加了写实电影美学。如果参考图是动漫/水墨/3D 风格，这些词会与参考图冲突。

---


---

## §14 输出结构

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
      "character_name": "string | null"
    }
  ]
}
```

### 字段说明

- `shot_id`：格式 `"Shot 1"` / `"Shot 2"` / ...，从 1 递增
- `summarize`：用 `language_code` 书写。导演视角的全片概述——整体视觉风格、情绪走向、段落规划、色调基调，不是镜头列表
- `scene_name`：取自资源表中的单一场景名 key；允许为空
- `character_name`：**所有 shot 必填，不允许省略该键。** 空镜填 `null`；有角色时填角色名，多角色用 `/` 分隔
- `description`：用 `language_code` 书写
- `video_prompt`：用 `language_code` 书写，含子镜头时间轴
- `frame_prompt`：全程英文；引用了任何 `<<<image_X>>>` 参考图时，必须写出风格一致性要求

### 占位符作用域

**核心原则：每个 shot 独立编号，从 1 开始，只包含该 shot 实际使用的资源，顺序固定：先角色，后场景。**

**编号速查（story，同一 shot 内相同资源的编号对照）：**

| 资源 | frame_prompt | video_prompt |
|------|-------------|-------------|
| 首帧图 | — （无此概念） | `<<<image_1>>>` （固定） |
| 第 1 个角色 | `<<<image_1>>>` | `<<<image_2>>>` |
| 第 2 个角色 | `<<<image_2>>>` | `<<<image_3>>>` |
| 场景 | 角色之后下一位 | 角色之后下一位（在首帧偏移基础上再+1） |

> **结论：story/visions 中，同一个角色/场景在 video_prompt 的编号 = 在 frame_prompt 的编号 + 1。**

> 例：同一 MV 中全局有 角色A / 角色B / 场景C，但某 shot 只用角色B + 场景C，则该 shot 的编号是 角色B=`<<<image_1>>>`（frame_prompt） / `<<<image_2>>>`（video_prompt）；场景C=`<<<image_2>>>`（frame_prompt）/ `<<<image_3>>>`（video_prompt）。

video_prompt 开头推荐写法：
```
<<<image_1>>> is the first frame; <<<image_2>>> is character Ren; <<<image_3>>> is scene Lamp-lit writing desk, and keep the visual style exactly consistent with the reference image(s).
```

### 人物引用规则

**禁止模糊人物引用。** 每个人物必须明确身份：
- **mv_elements.characters[] 中注册的角色**：用 `<<<image_X>>>` 引用，禁止"第二个人物""另一个人"等模糊称呼
- **临时配角**（不在资源表中）：必须详细描述外貌（性别、年龄段、体型、服装、发型）
- **路人/群众/行人**：作为环境元素允许，不需详描

### 空镜规则

**空镜仅在对应 `stage_plan` 的 `character_name` 本身为空/null 时才合法。** 如果 `stage_plan` 指定了角色，该 stage 产出的 shot 不得降级为空镜——即使导演认为空镜更有意境。

合法空镜的输出要求：
- `character_name = null`
- `video_prompt` 禁止写已注册角色的名字和 `<<<image_X>>>`
- `frame_prompt` 不引用人物 `<<<image_X>>>`，不写一致性声明
- 路人、人群、行人作为环境元素允许

### video_prompt 物理可实现性

每句描述必须是视频模型可渲染的具体画面。

**[FAIL]** "人影退成光晕中的暗斑" / "身体化为光粒子消散" / "两人融合成一个剪影"

**[PASS]** "两人转身走远，背影缩小到画面边缘" / "镜头缓慢拉远直到人物变成远处小点" / "两人并肩站立，逆光使轮廓连成一条线"

### 导演职责边界

输入已经定义了每段 `拍什么`。输出必须升级：更强的镜头语言、更高级的构图和光线、更清晰的段落递进、更有记忆点的定格画面。

禁止：无依据改写剧情、擅自改动角色关系、擅自替换场景、丢掉 stage 明确给出的关键动作和意象。

---

