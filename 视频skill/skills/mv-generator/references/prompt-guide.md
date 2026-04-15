# Prompt 写法指南（story_mode / visions）

> generator 的核心工作：把 planner 的导演 treatment 翻译成视频模型能理解的 video_prompt + frame_prompt。

---

## 一、video_prompt 写法

video_prompt 是完整成品，直接输出。

### 结构（按顺序）

1. **资源绑定声明**：`<<<image_1>>> is the first frame; <<<image_2>>> is character [名]; <<<image_3>>> is scene [名], and keep the visual style exactly consistent with the reference image(s);`
2. **全局行**：有效风格值存在 → `\nVisual Style: [原文]`；缺失 → `\nLight: [光源+方向]`
3. **beat 时间轴**：`\n0-[X]s: [景别·角度] / [运镜] / [<<<image_2>>>主体动作] / [环境·光影细节] ｜ [X]-[X]s: ...`

内部时间轴每个 shot 从 0s 开始，用 ｜ 分隔子镜头。

**语言：** `language_code = zh-CN` 用中文，其他用英文。禁止中英混杂。

### <<<image_X>>> 编号规则（video_prompt）

video_prompt 有一张首帧图占 `<<<image_1>>>`，角色从 `<<<image_2>>>` 开始：

- `<<<image_1>>>` = 首帧图（固定）
- `<<<image_2>>>` = 第 1 个角色
- `<<<image_3>>>` = 第 2 个角色（或单角色时的场景）
- 场景排在所有角色之后
- **空镜（无角色）：** `<<<image_1>>>` = 首帧，`<<<image_2>>>` = 场景。不空占角色槽位

### Beat 发现序列

treatment 用 ①②③... 列出了不同观察主体的视觉落点（数量已按 shot 时长适配）。每个落点天然对应一个 beat。beat 规划 = 把落点排成观众的发现顺序。

**关键原则：每个 beat 描述的是这段时间里发生了什么变化，不是「这里有什么」。**
planner 的落点已经是「运动事件」格式（起始 → 变化 → 结束）。generator 将每条落点翻译成 video_prompt 的 beat 时，必须保留这个变化轨迹，不能退化为静止状态描述。

```
❌ <<<image_2>>>手指摩挲耳际碎发          （动作正在发生的状态，无起点无终点）
✅ <<<image_2>>>手指从领口沿颈线上滑 → 触到耳际碎发后停住 → 指尖轻压一下后缩回

❌ 走廊尽头有光                          （静止场景，无变化）
✅ 走廊尽头的光 → 随远处门缝宽窄变化而忽明忽暗 → 稳定在一条细缝亮度
```

```
3-5s (2-3 beat):
  beat 1: 观众首先看到什么变化？（落点①的变化轨迹）
  beat 2: 然后发现了什么新变化？（落点②，必须换观察主体类别）
  beat 3 (可选): 还注意到什么？

6-8s (3-4 beat):
  beat 1-3: 对应落点①②③的变化轨迹
  beat 4: 收束（落点④ 或回到落点①做变奏）

9-12s (4-6 beat):
  beat 1-3: 对应落点①②③
  beat 4-5: 对应落点④⑤
  beat 6: 收束
```

#### 观察主体类别

| 类别 | 示例 |
|------|------|
| 人物全身 | 站姿、走姿、跑姿、舞蹈 |
| 人物局部 | 手指、肩线、脚步、发丝、嘴唇 |
| 物件 | 墨镜、创可贴、钥匙、手机屏幕 |
| 环境 | 走廊尽头、天际线、墙面纹理、地面 |
| 光影/反射 | 影子、镜面反射、光斑、色温变化 |

**相邻两个 beat 的观察主体必须属于不同类别。**

### 子镜头密度

| shot 时长 | 推荐子镜头数 |
|-----------|------------|
| 3-5s      | 2-3        |
| 6-8s      | 3-4        |
| 9-11s     | 4-5        |
| 12s       | 5-6        |

### 子镜头多样性（最重要的质量规则）

每条子镜头必须给观众**新的视觉信息**：新的观察对象 / 新的景别层次 / 新的空间关系 / 新的物件或环境细节。

**[FAIL] — 8s shot，3条子镜头都是同一人从近拉远**
```
0-2s: 眼部微距 / 极快后拉 / <<<image_2>>>瞳孔折射 / 侧光在粉墙投影
2-5s: 中景 / 继续后拉 / <<<image_2>>>身体后倾，嘴唇微张 / 环境光震动
5-8s: 广角 / 缓慢环绕 / <<<image_2>>>孤立站在走廊中央 / 阴影笼罩全身
```
> 错误：3条子镜头主体全是同一人做同一件事。

**[PASS] — 8s shot，4条子镜头各有变化轨迹**
```
0-2s: 眼部微距 / 极快后拉至中景 / <<<image_2>>>眼皮从半闭缓缓抬起，瞳孔从模糊到对焦，手指从领口沿颈线上滑至耳际停住 / 侧光随后拉从眼角阴影扩散至肩线
2-4s: 特写 / 固定 / 墙面几何阴影从左缓慢旋转至右，一条光线像指针从粉色漆面一端划至另一端后消失 / 光影本身完成一次运动后静止
4-6s: 中景 / 缓慢侧移 / <<<image_2>>>从面朝侧方缓缓转头至正对光源，肩膀从上提紧缩松沉至自然位，下巴同步微抬 / 侧移使前景走廊柱进入画面左侧
6-8s: 全景 / 固定 / <<<image_2>>>从走廊边缘走至中央停下，阴影栅栏从肩膀落至脚下，远处尽头一小块亮光在她停下时恰好对上她的轮廓 / 空间关系完成
```

### 呼吸镜头

每个 6s 以上 shot 至少 1 个呼吸镜头（不拍人物主体）。

**核心要求：每条呼吸镜头必须包含一个轻微但可拍到的物理变化**——不能只是「走廊尽头」「窗外天空」这类静止场景描述，否则渲染结果等于一张静止画面。

各类呼吸镜头的变化写法示例：
- 环境：`走廊尽头的光 → 随远处门缝变化而忽明忽暗 → 稳定在细缝亮度` / `窗外树枝 → 被风推动偏离约15度 → 弹回静止`
- 物件：`桌上钥匙 → 被人走过的气流推动旋转半圈 → 停下` / `水渍边缘 → 在灯光下缓慢蒸发收缩约2mm → 停止`
- 身体局部：`<<<image_2>>>手指 → 从伸直状态逐根向掌心卷拢 → 最终握成松拳` / `肩线 → 随呼吸上升约1cm → 缓慢落回`
- 光影：`墙上光斑 → 随车灯经过从左扫至右后消失` / `地面影子 → 随云层移动缓慢变淡至消失`

### 镜头多样化

本窗口内 ≤50% shot 用同一运镜；焦段至少用 2 种不同值。

---

## 二、frame_prompt 写法

frame_prompt 是完整成品，全程英文。基于 video_prompt 第一个 beat 在 0s 的静止切片。

### <<<image_X>>> 编号规则（frame_prompt）

frame_prompt 没有首帧图，角色从 `<<<image_1>>>` 开始：

- `<<<image_1>>>` = 第 1 个角色
- `<<<image_2>>>` = 第 2 个角色（或单角色时的场景）
- 场景排在所有角色之后
- **空镜（无角色）：** `<<<image_1>>>` = 场景。不空占角色槽位

**速算：同一资源在 video_prompt 的编号 = 在 frame_prompt 的编号 + 1**（因为 video_prompt 多了一张首帧图占位）

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

`<<<image_X>>>` 是唯一合法的角色指代方式。禁止泛称（"人物""the figure""she""he"）或角色名文字替代。禁止文字描述角色外貌。禁止态度词替代身体描述（"playful defiance" 不是姿态）。

姿态要点：头部角度 / 四肢位置 / 身体重心 / 视线方向 / 面部微状态。禁止 standing / walking / sitting 默认动作。

**硬规则：video_prompt 中出现了几个角色，frame_prompt 中就必须出现几个 `<<<image_X>>>`，一个都不能少。**

**④ 场景引用**
有场景资源 → `Set against the background shown in <<<image_N>>>.`
无场景资源 → 文字描述环境

空镜：跳过①②③，写 `[场景主体] in/at [细节]`

**⑤ 景别** — 标准景别关键词（如 `Wide shot` / `Medium shot` / `Close-up (CU), shoulders up`）

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
摄影系/画风系 → 跳过（Visual style 声明已涵盖）

**⑩ 神态+气质**
面部物理状态（直接取 treatment `(body_frame: ...)` 中的关键词）+ 气质词（最多 1-2 个）

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

**[PASS] — 摄影系（effective_style = "胶片复古"）**
```
Keep the person exactly as shown in <<<image_1>>> with 100% identical facial features, hair, and clothing. Do not alter any aspect of the person's appearance from <<<image_1>>>. Keep the visual style exactly consistent with the reference image. Visual style: 胶片复古. <<<image_1>>> chin raised, body facing directly toward camera, feet planted at the threshold, one hand hanging loose at the side, the other barely lifted with fingers half-curled. Set against the background shown in <<<image_2>>>. Medium wide shot. <<<image_1>>> placed center-left, broad negative space to the right. Shot on 85mm lens. <<<image_1>>> is tack sharp. The background falls into soft diffusion. Shot on Alexa Classic, Kodak 5293 emulation, warm grain, soft halation. Jaw set, lips pressed, contained defiance.
```

**[PASS] — 参考图主导**
```
Keep the person exactly as shown in <<<image_1>>> with 100% identical facial features, hair, and clothing. Do not alter any aspect of the person's appearance from <<<image_1>>>. Keep the visual style exactly consistent with the reference image. <<<image_1>>> chin raised, body facing directly toward camera, feet planted at the threshold, one hand hanging loose at the side, the other barely lifted with fingers half-curled. Set against the background shown in <<<image_2>>>. Medium wide shot. <<<image_1>>> placed center-left, broad negative space to the right. 85mm lens. Overcast sky from above, shaping the arm and shoulder edge. Jaw set, lips pressed, contained defiance.
```

**[PASS] — 多角色（3人）**
```
Keep all persons exactly as shown in <<<image_1>>>, <<<image_2>>>, <<<image_3>>> with 100% identical facial features, hair, and clothing. Do not alter any aspect of any person's appearance. Keep the visual style exactly consistent with the reference images. <<<image_1>>> running at front, body leaning forward, hair streaming back, mouth open laughing, bare feet splashing. <<<image_2>>> half a step behind on the left, arms pumping, jaw set, fierce sideways glance at <<<image_1>>>. <<<image_3>>> on the right, ponytail whipping, head tilted back, eyes closed in abandon. Set against the background shown in <<<image_4>>>.
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

**[FAIL] — 参考图主导写了摄影渲染词**
```
... 85mm lens. <<<image_1>>> is tack sharp. Shot on ARRI Alexa Mini LF, soft film emulation, fine grain.
```
> 错误：无风格值却强加了写实电影美学。

---

## 三、通用规则

### 人物引用规则

- **注册角色**（characters[] 中的）：用 `<<<image_X>>>` 引用
- **临时配角**（不在资源表中）：必须详细描述外貌（性别、年龄段、体型、服装、发型）
- **路人/群众**：作为环境元素允许，不需详描

### 空镜规则

空镜仅在对应 stage 的 `character_name` 为空/null 时才合法。如果 stage 指定了角色，该 shot 不得降级为空镜。

合法空镜：`character_name = null`，video_prompt 不引用角色 `<<<image_X>>>`，frame_prompt 不写一致性声明。

### 物理可实现性

每句描述必须是视频模型可渲染的具体画面。

**[FAIL]** "人影退成光晕中的暗斑" / "身体化为光粒子消散"
**[PASS]** "两人转身走远，背影缩小到画面边缘" / "逆光使轮廓连成一条线"

### description 规则

description 是导演指令：谁在哪做什么 + 镜头怎么拍。禁止散文/元叙述。语言跟随 `language_code`（用户可见字段）。

### 光线词库

**人造：** `A single lamp` / `phone screen` / `colored storefront sign` / `bare overhead bulb`
**自然：** `Late afternoon sun through blinds` / `pre-dawn grey` / `overcast diffused`
**叙事功能光：** `Car headlight sweeping`（关系打断）/ `Doorway flooding with light`（阈值变化）
**衰减：** `rapid falloff`（切断）/ `gradual falloff`（柔和）/ `hard cutoff`（戏剧最强）

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

---

## 五、质量校准案例

> 仅供校准 prompt 品质，禁止复制剧情。

**video_prompt**（7s，海边相遇）：
```
<<<image_1>>> is the first frame; <<<image_2>>> is character A; <<<image_3>>> is character B; <<<image_4>>> is scene Beach, and keep the visual style exactly consistent with the reference image(s);
Visual Style: 胶片复古
0-2s: 中景 / 轻柔跟随 / <<<image_2>>>和<<<image_3>>>牵手从浅水区边缘冲入及踝海水，两人笑着同步迈步，脚踩起的水花从脚跟飞溅至小腿 / 水花从无到有随脚步节奏间歇喷出 ｜ 2-4s: 大全景 / 固定 / 两人从静止站立开始互相泼水，手掌扬起水从右侧飞向左侧，白裙和浅色上衣被浪花依次打湿变透 / 水弧从右侧出现划至左侧消散 ｜ 4-5s: 俯拍近景 / 固定 / 两人从站姿向后仰倒至沙滩，落地后双手同步从身侧向镜头伸出比手势 / 手从画面外进入至完全清晰 ｜ 5-7s: 近景 / 固定 / 两人额头从相距约10cm缓慢靠近轻贴，贴上后两人同时微笑，落日边光从侧面勾亮头发轮廓和脸缘 / 光线随接触完成后亮度微升
```

**frame_prompt**：
```
Keep all persons exactly as shown in <<<image_1>>>, <<<image_2>>> with 100% identical facial features, hair, and clothing. Do not alter any aspect of any person's appearance. Keep the visual style exactly consistent with the reference images. <<<image_1>>> and <<<image_2>>> running hand-in-hand through ankle-deep surf at golden hour, both laughing with mouths open, bare feet splashing water. <<<image_1>>> is on the left side closer to the ocean, <<<image_2>>> on the right closer to the beach. Visual style: 胶片复古. Set against the background shown in <<<image_3>>>. Medium shot, two figures in center frame, ocean horizon behind. Shot on 50mm lens. <<<image_1>>> and <<<image_2>>> are tack sharp. The background falls into soft diffusion. Shot on Alexa Classic, Kodak 5293 emulation, warm grain, soft halation. Joyful, sun-drunk.
```

---

## 六、自检清单

每个 shot 输出前确认（仅列模型易错项）：

```
□ 全字段存在，时间为整数，duration = end_time - start_time，时间轴连续无间隙
□ video_prompt beat 中角色用 <<<image_X>>>，不用角色名文字
□ video_prompt 中同一资源的编号 = frame_prompt 中对应编号 + 1
□ character_name 非空 → 该 shot 不得为空镜
□ 有效风格值缺失 → frame_prompt 无写实渲染词
□ 画风系 → frame_prompt 仅焦段数字，无 tack sharp / bokeh / 相机 / 胶片
□ 相邻 beat 观察主体属于不同类别
□ 每个 beat 描述包含变化轨迹（起始 → 过程 → 结束），不是静止状态截面
□ 6s+ shot 至少 1 个呼吸镜头，且呼吸镜头包含可拍到的轻微物理变化
□ frame_prompt ⑩ 的神态关键词来自 treatment body_frame，不是 body_arc
□ 本 shot 的景别倾向 / 主运镜方向 / 主观察主体类别与上一个 shot 至少一项不同
```
