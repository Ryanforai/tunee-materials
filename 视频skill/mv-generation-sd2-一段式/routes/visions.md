# Visions Route · 视觉概念型 MV 完整执行手册

> **只输出 JSON。** 无前置说明、无导演规划文字、无分析过程、无后置总结、无 Markdown 包裹。
> 所有导演规划、Stage Treatment、Beat Plan 都是**内部推理过程，禁止输出**。输出只有一个合法形态：JSON。

---

## §1 硬约束

输出只有 `summarize` + `shots[]`，shots 内只有 8 个字段（见 §3 schema）。输入字段名不得出现在输出中。

---

## §2 输入处理

### 输入解析

**字段：** `mv_type` / `mv_guide.md_stages` / `mv_guide.mv_elements` / `language_code` / `audio_duration` / `video_model` / `visual_style` / `mv_guide.style_guide`（可选）/ `mv_guide.music_tags`（可选）

**忽略：** `image_model` / `mv_guide.stages`

**有效风格值（effective_style）：** `style_guide` 存在且非空时优先；否则回退 `visual_style`。空字符串视为缺失。都缺失→参考图主导模式。

**渲染族（rendering_family）：**

| 渲染族 | 判定条件 |
|---|---|
| **摄影系 `photographic`** | `effective_style` 含：`写实 / realistic / cinematic / 电影 / 胶片 / film / vintage / 复古 / Y2K / noir / 黑色电影 / 赛博朋克 / cyberpunk / CG写实 / 真人 / live-action`；或无法判定时兜底 |
| **画风系 `stylized`** | `effective_style` 含：`动漫 / anime / 赛璐璞 / cel / 水墨 / ink wash / 水彩 / watercolor / 油画 / oil painting / 3D渲染 / 3D render / toon / 像素 / pixel / 浮世绘 / 国画 / 漫画 / comic / manga / 插画 / illustration / flat design / low poly` |

两族同时命中 → **画风系优先**。渲染族决定是否在风格行推荐相机/胶片组合：摄影系时写；画风系/参考图主导时省略。

**音乐特征（music_tags）：** 自由文本，描述 BPM / 风格 / 乐器 / 情绪 / 人声类型等。存在时由 SKILL.md 加载对应风格文件，并在 Preflight 触发 visual_identity 推导。

**audio_duration：** 浮点→立即四舍五入为整数。

**md_stages：** 全片 canonical stage plan。Markdown 表格，至少含：`时间段` / `音乐结构` / `歌词` / `画面描述` / `场景` / `角色`。时间值须为整数。

**Error JSON：**

```json
{"error": "错误类型", "detail": "具体说明"}
```

**异常兜底：**

| 情况 | 处理 |
|------|------|
| 有效风格值缺失 | 参考图主导模式，光线只写光源+方向，不推荐相机 |
| characters 为空 | 不生成角色 @图片N |
| scenes 为空 | 不生成场景 @图片N |
| 场景名不在 scenes[] | scene_name 保留原文，不生成场景 @图片N |
| music_tags 缺失 | 不加载风格文件，跳过 visual_identity，拍法由 style_guide + md_stages 上下文驱动 |

### Preflight

**Asset Map：**

- character key = `character.name`，scene key = `scene.scene_name`（若无取 `scene.name`）
- 名称匹配前 trim 空格、统一全角/半角斜杠和破折号
- 只有 `mv_elements.characters[] / scenes[]` 显式存在的对象才进资源表
- 描述性文本不能创建新资源对象
- `character_name` 含 `/` → 按 `/` 拆分逐项校验
- `scene_name` 只允许单一场景名或空值

**道具锁定：**

扫描全部 stage visual_brief，识别跨 2+ stage 反复出现的道具/物件。为每个道具写一句**固定视觉描述**（颜色 + 型号/形态 + 材质），全片复用。

**视觉身份（Visual Identity）：**

当 music_tags 存在且已加载风格文件时，参考风格文件中的拍法特征，结合 style_guide，推导 3 项决策，全片复用：

- **`pacing`**：主歌段 vs 副歌/高潮段的镜头时长范围（写具体秒数）
- **`signature_shots`**：2 个本片标志性镜头手法（从三级运镜库中选，写具体 L1+L2 组合）
- **`color_logic`**：一句话色彩策略（主色调 + 段落间变化逻辑）

pacing 不是只看 BPM——必须综合 music_tags 全部信息 + 风格文件中的指导。

**视觉语言（Visual Language）：**

从 effective_style 推导 3 项决策，全片复用（effective_style 缺失则跳过）：

- **`texture`**：画面质感
- **`composition_tendency`**：构图倾向
- **`effect_signature`**：1-2 个标志性视觉效果

**Stage Plan Parsing：**

```json
[{
  "stage_id": "Stage 1",
  "start": 0, "end": 10, "duration": 10,
  "music_structure": "Verse",
  "lyrics": "...",
  "visual_brief": "...",
  "scene_name": "墨室琴案",
  "character_name": "小K"
}]
```

- `stage_plan[0].start = 0`，`stage_plan[最后].end = audio_duration`
- 相邻 stage 连续无间隙无重叠
- **所有时间值整数**

### 时长校验

- `effective_max_duration`：默认 `15`
- `min_duration`：默认 `4`

**硬性约束：每个输出 shot 的 duration 必须 ≥ min_duration（默认 4s）且 ≤ effective_max_duration（默认 15s）。不允许输出任何 < 4s 的 shot。**

**拆分（> max）：** 优先转折点切→歌词断句切→近似等分（奇数秒前段取较长值）。拆分后每段 ≥ min_duration。拆分后继承 character_name / scene_name，相邻 shot 必须改变景别/运镜/视角。

**吸收（< min）：** 合入相邻 shot 内部 beat，不丢角色/主动作/关键意象。**绝不允许把 < 4s 的内容作为独立 shot 输出。**

### Stage Fidelity

`stage_plan` 是全片语义主轴：

- 覆盖所有 stage，保持原始顺序
- **字段继承**：stage character_name 非空 → shot 必须继承；scene_name 同理
- 不得将有角色的 stage 降级为空镜
- 默认 1 stage → 1 shot
- 时间轴连续：`shots[0].start_time = 0`，`shots[最后].end_time = audio_duration`

---

## §3 输出规则

### 输出 JSON Schema

**输出 schema 与输入 schema 不同。必须严格使用以下字段名，不得照抄输入字段名。**

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
      "character_name": "string | null"
    }
  ]
}
```

**字段说明：**

- `shot_id`：`"Shot 1"` / `"Shot 2"` / ... 格式，从 1 递增
- `summarize`：导演视角全片概述——视觉风格、情绪走向、段落规划、色调基调
- `character_name`：字符串，空镜填 `null`，多角色用 `/` 分隔
- 所有文本字段由 `language_code` 决定语言（zh-CN→中文，其他→英文）

### @图片N 引用系统

每个 shot 独立编号从 1 开始，**先角色后场景**，video_prompt 开头显式绑定身份。

**写法：** `@图片1是角色X的参考形象，@图片2是场景「Y」的参考图，保持画面风格与参考图一致；`
**多角色：** `@图片1是角色A的参考形象，@图片2是角色B的参考形象，@图片3是场景「Y」的参考图；`
**English：** `@图片1 is reference for character X; @图片2 is reference for scene Y; keep visual style consistent with references;`
**空镜（null）：** 不写角色绑定，`@图片1是场景「Y」的参考图；`，禁止写已注册角色名。

- 已注册角色用 `@图片N`，禁止"第二个人物""另一个人"
- 临时配角详描外貌，路人作环境元素

### 核心约束

**语言：**

- `summarize` / `description` / `video_prompt`：由 `language_code` 决定（zh-CN→中文，其他→英文）
- 运镜术语始终英文；`body:` 关键词始终英文；其余遵守语言规则，禁止中英混杂

**物理可实现性：**

每句描述必须是视频模型可渲染的具体画面。

**[FAIL]** "人影退成光晕中的暗斑" → **[PASS]** "人物转身走远，背影缩小到画面边缘"
**[FAIL]** "时间凝固" → **[PASS]** "所有运动极度放慢，水滴悬在半空，衣摆缓慢飘动"

**空镜规则：** 空镜仅在 `stage_plan` 的 `character_name` 为空/null 时合法。stage 指定了角色 → shot 不得降级为空镜。

**导演职责边界：** 输入定义"拍什么"，输出升级"怎么拍得更好"。禁止：无依据改写剧情、擅自改动角色关系、丢掉关键动作和意象、用抽象情感词替代具体画面描述。

**场景图 = 首帧/尾帧参考，不是容器：**

- 场景参考图是某一帧的视觉参考，不是 shot 必须停留的空间
- shot 可以完全不引用任何场景图（只绑定角色 @图片N）
- `scene_name` 字段：引用了场景图时填对应场景名；未引用时填描述性名称
- stage_plan 指定的 scene 是建议，不是强制

---

## §4 导演流水线

### 全片导演规划

> **内部推理，不输出。**

写 shot 前，先想清楚全片大局：

- `core_feeling`：这首歌最核心的感受（一句具体的话，不是"孤独"）
- `visual_motif`：1-2 个反复出现的视觉元素（如：玻璃折射 / 水面倒影 / 门缝光线），贯穿全片
- `concept_carrier`：全片核心概念由什么物理材质承载（皮肤 / 玻璃 / 水面 / 金属 / 薄雾 / 织物 / 影子）
- `energy_curve`：哪几段克制，哪几段释放
- `hero_stages`：哪些段必须出记忆点
- 全片主大气效果（薄雾 / 雨雾 / 粉尘 / 热浪 / 烟雾 / 无特殊大气）

**Visions 专属：** 每个 stage 有**一个情绪锚点** + **一个主视觉载体**（人/物/光/反射/大气）。概念必须嵌入具体物质——不拍"孤独"，拍"空椅子上光线缓慢移动"。

**概念嵌入方法：**

| 抽象概念 | ❌ 直接写 | ✅ 嵌入物质 |
|---------|----------|------------|
| 孤独 | "孤独的氛围" | 空旷房间中央一把椅子，侧光只照亮椅面 |
| 时间 | "时间流逝" | 墙上光斑从左移到右，影子角度渐变 |
| 记忆 | "回忆涌上" | 手指触碰旧照片边缘，照片表面反光微动 |
| 挣扎 | "内心挣扎" | 手握紧又松开，指甲在掌心留下印记 |
| 自由 | "自由感" | 风吹起薄纱帘直到填满整个画面 |

**Visions 特权：** 概念型 MV 没有线性叙事约束，你是视觉诗人——天马行空是核心武器。可以比 Story 更大胆、更自由地使用视觉奇观和超现实手法。但天马行空 ≠ 乱来——每一帧都必须是**美的、酷的**，有审美逻辑。

**Shot 1 铁律：** 前 2 秒建立"这个片子不一般"。禁止：全景缓慢建立 / 角色从远处走来 / 空镜配文字。

**廉价感警报（连续 2 次 = 掉档）：** 连续中景正面 / 每段只是"人物看镜头" / 光线没有明确光源 / 全部在用力没呼吸

### 渲染族与视觉定调

根据 §2 判断的渲染族，决定风格行写法：

- **摄影系**：风格行写具体相机型号 + 胶片/传感器组合（如 `ARRI Alexa Mini LF 50mm，Kodak 5219 胶片模拟，subtle film grain`）
- **画风系**：风格行写画风描述，不写相机
- **参考图主导**：风格行只写光源+色调，不写相机

色调参考（摄影系）：

| 色调 | 关键词 | 推荐相机 |
|-----|-------|---------|
| 胶片复古 | 复古/vintage | Alexa Classic + Kodak 5254/5293 |
| 当代简约 | 简约/minimalist | Sony Venice 2 / ARRI Alexa 35 |
| Y2K千禧 | Y2K/chrome | RED Monstro 8K |
| 东亚唯美 | 唯美/古风/日式 | ARRI Alexa Mini LF + Fuji Eterna 500T |
| 赛博未来感 | 赛博/cyber | RED Monstro 8K + CineStill 800T |

### 大气连贯

全片选 **1 种**主大气效果，写入每个 shot 的风格行，可微调浓度，不换种类。用具体物理描述，不写抽象词。

### Stage Treatment

> **内部推理，不输出。**

每段写之前想清楚：让观众记住什么？光从哪来？世界在做什么？shot 内张力弧线（静蓄→爆发 / 平推→揭示 / 收敛→定格）？最贵的一帧长什么样？本段用概念诗意还是奇观想象？

**Hero shot（全片 2-3 个）** 额外想清楚：利用 Seedance 能力突破真实摄影限制（尺度穿越 / 时间操控 / 不可能机位 / 物质变化 / 视角跳跃）。

**同一画面不可无变化复用——必须改变构图、光线、色彩或空间关系。**

### Shot 组织

**规则：** 默认 1 stage → 1 shot。超长 stage（>15s）拆分，超短 stage（<4s）并入相邻 shot。

**子镜头划分：** 每个 shot 时间范围内，按时间段拆分为多个子镜头，每个子镜头 **2-4s**，不超过 6s。

| shot 时长 | 子镜头数量 |
|-----------|-----------|
| 4-5s | 2-3镜 |
| 6-8s | 3-4镜 |
| 9-12s | 4-5镜 |
| 13-15s | 5-6镜 |

相邻子镜头必须切换景别或镜头运动，禁止连续两个子镜头用相同景别+相同机位。

### Beat 序列写法

Beat 序列是 video_prompt 的主体。每个 `→` 是**观众视线的一次落点**。

**核心原则：不写"角色是什么状态"，写"观众的眼睛在这一刻落在哪里"。**

**① 每个 beat 只写一件事**

**② 身体动作写传导顺序，不写结果**

```
❌ @图片1转身
✅ 肩膀先启动，躯干跟上，头是最后转完的，发丝惯性比头慢半拍才落定
```

人体传导规律：
- 转身：肩 → 躯干 → 头 → 发丝
- 伸手：肩 → 肘 → 腕 → 指尖
- 起身：腿 → 腰 → 脊背 → 肩 → 头

**③ 眼神写轨迹，不写状态**

```
❌ eyes forward，gaze steady
✅ gaze 从地面开始抬，抬到一半停住两拍，才完成抬起 snap 锁定镜头
```

**④ 每个 SHOT 至少一次速度突变**

触发词：`骤然 / snap / 猛然 / 瞬间收住`。分布在整个 SHOT 范围内，不要求每个子镜头都触发。

**⑤ 附属物写惯性延迟**

```
发丝比头慢半拍落定 / 裙摆动作收住后还荡了一下才垂下
```

**⑥ 落点是可截图的定格画面**

```
落点：手指完全握住，指节压白，花瓣落在手背不再滑落
```

**情绪身体化参考（禁止直接写情绪词，按需转译）：**

| 情绪 | 眼部 | 嘴唇/下颌 | 身体信号 |
|------|------|---------|---------| 
| 克制的悲 | gaze locked on fixed point, not blinking | lower lip pressed inward | one slow swallow |
| 即将哭泣 | eyes glistening, lower lashes wet | lips sealed but trembling | chin pulls down slightly |
| 交托/放松 | eyes close slowly | jaw releases | 深呼气肩膀落下半厘米 |
| 坚定 | eyes sharp, direct contact | lips press then release | chin lifts one degree |

### 快切组（Chorus / 高能段专用）

仅在音乐高能段使用，在 beat 序列中用【】标注：

```
[慢 beat 缓冲] →
【快切组，共Xs】
→ [部位A + 瞬间动作]
→ [部位B + 瞬间动作]
→ [部位C + 瞬间动作]
[慢 beat 缓冲 / 落点]
```

**四条规则：**
- 组内每个 beat 只写部位+动作，不写速度修饰
- **组内镜头运动必须锁定**
- 前后各留一个慢 beat 缓冲
- 组内部位必须交替

### 按音乐段落的 Beat 密度策略

| 音乐段落 | Beat 节奏 | 快切组 | 落点时长 |
|---------|---------|-------|---------| 
| Intro | 极慢，1个/2s | 无 | 长，2s+ |
| Verse | 匀速，1个/1s | 无 | 中，1.5s |
| Pre-chorus | 渐快，1个/0.8s | 可选，放末尾蓄力 | 短，悬而未发 |
| **Chorus** | **1个/0.3-0.4s** | **1-2组，核心** | **强，1.5-2s** |
| Bridge | 视情绪定 | 通常无 | 视情绪定 |
| Outro | 极慢，1个/2s+ | 无 | 极长，3s+ |

### 镜头层

**格式：** `镜头：[运动方式]，[触发条件]时锁定。`

镜头运动与 beat 序列**必须分行写**，禁止混在同一句话里。**快切组期间镜头运动锁定。**

**运镜决策：先问三个问题**

**问题一：这一镜的情绪是收紧还是释放？**
- 收紧 → 镜头抵抗情绪，反向运动或锁定
- 释放 → 镜头顺情绪，加速或大幅位移

**问题二：这一镜和下一镜的关系是什么？**
- 同一场景延续 → 镜头运动方向为下一镜提供动势
- 场景切换 → 镜头运动在切点前反向收束
- 情绪对比 → 镜头语言故意与上一镜反向

**问题三：这一镜里有没有「空间矛盾」可以利用？**
- Dolly Zoom / Pull Focus / 可穿透介质（玻璃/水面/镜面/烟雾）

确定意图后，用物理语言描述运动，不堆砌术语标签：

```
❌ Slow Dolly In + Smooth + Cinematic + Intimate
✅ Slow Dolly In，从腰部高度推到面部，眼睛充满画面时锁定。
```

**运镜三级体系：**

**Level 1：** Pan / Tilt / Zoom In/Out / Dolly In/Out / Truck / Crane Up/Down / Orbit / Arc Shot / Tracking / Static / Push In / Pull Out / Pedestal / Pull Focus

**Level 2 — 修饰词：** Smooth / Slow / Fast / Subtle / Gradual / Sudden / Handheld / Aerial / Dutch Angle / Gimbal / Steadicam / POV

**Level 3 — 组合（最多 2-3 个，用 + 连接）：** Orbit+Zoom In / Crane Up+Pan / Dolly Zoom / Tracking+Handheld / Dolly Back+Crane Up

### 全局写作规则

**光影融入叙事：** 光影描述融入 beat 序列，不作为独立附件。光影变化本身是 beat。

**大气带入每镜：** 全片选定的大气效果写入每个 shot 风格行，可微调浓度，不换种类。

**一致性锁定：** 每个 shot 的 video_prompt 必须写入：
```
全片保持统一视觉风格，角色保持一致五官和服装，场景保持一致环境和光线，核心道具保持一致外观特征；
```

**道具连贯：** 已锁定道具首次出现必须写完整固定描述，后续保持一致。

**空间连续性：** 同一场景连续 shot，video_prompt 首句（绑定之后）必须锚定主体在空间中的位置。

**风格对齐：**

当 visual_identity 存在时：机位选择优先使用 signature_shots；色彩描述与 color_logic 一致；副歌/高潮段视觉强度必须与主歌段有明显区分。

当 visual_language 存在时：画面质感与 texture 一致；构图体现 composition_tendency；effect_signature 至少在全片 50%+ 的 shot 中出现。

**收束（仅全片最后 shot 末尾）：**
```
[后期处理词 2-3个叠加]收尾，[张力宣言]。
后期处理词：暗角 / 胶片颗粒 / 色差 / 运动模糊 / 轻微过曝
```

### 反差 · Hero · 转场

**反差：** 全片至少 2 次明显反差：景别远↔近 / 动↔静 / 冷↔暖 / 封闭↔开阔

**反重复：** 相邻 shot 同满三项（同场景+同情绪+同构图）= 无效重复。至少推进一项：空间阈值 / 物件状态 / 人物关系 / 光线状态。

**Hero Frame：** 全片 2-3 个，优先：开场第一帧、副歌开头、转折、结尾。

**跨场景转场桥接：** 跨场景切换时，前后 shot 必须有至少一条视觉桥（事件延续 / 光影变化 / 视觉母题 / 空间流动）。

**场景回访：** 再次进入已出现过的场景时，必须至少改变：光线状态 / 空间状态 / 大气浓度。

---

## §5 Visions 专属导演方法

### 场景类型参考（非硬性路由，可混合）

**[写实]** 克制运镜（Subtle/Static/gentle Dolly），精致写实用 Smooth 修饰，纪录写实用 Handheld

**[超现实]** 三段升级：正常 → 轻微违和 → 明显异常。异常必须具体可拍（花从裂缝加速生长 / 水珠向上漂浮），不写"超现实的氛围"

**[奇幻]** 先定世界规则（重力/光源/材质），全片一致，异质元素最多 1-2 种

**[意识流]** 四层光线签名：
- 现实：中性光 4500-5500K / 记忆：过曝偏暖 2700-3500K / 幻想：欠曝偏冷 6500-9000K / 恐惧：高对比极暗冷蓝青
- 层切换需触发物特写

### Visions 补充规则

**表情写法：** 用英文可拍物理状态描述（如 `downcast eyes, brow furrowed`），不用中文情绪词。先写物理质感，再写气质。最多 1-2 个。

**风格禁止词：** visions 专属禁止：`linear narrative` / `clear cause and effect` / `single timeline`（除非 stage_plan 明确要求叙事结构）

---

## §6 格式 + 示例

### video_prompt 格式

**标准模板：**

```
[资源绑定]
@图片1是角色X的参考形象，@图片2是场景「Y」的参考图，保持画面风格与参考图一致；
全片保持统一视觉风格，角色保持一致五官和服装，场景保持一致环境和光线，核心道具保持一致外观特征；

风格：[渲染风格/色彩基调/视觉调性，大气效果写在此行；摄影系时写相机型号]
场景：[此刻这个空间的真实样子——环境+光线+正在发生的动态元素，写物理状态，不写形容词]

[Xs-Xs] 镜头1（景别 · 镜头运动）
[视觉元素A + 动作] →
[视觉元素B + 动作] →
落点：[定格画面——描述可拍的物理状态]
镜头：[运动方式]，[触发条件]时锁定。

[Xs-Xs] 镜头2（景别 · 镜头运动）
[视觉元素A + 动作] →
[视觉元素B + 动作] →
落点：[定格画面——描述可拍的物理状态]
镜头：[运动方式]，[触发条件]时锁定。

...（按实际子镜头数继续）

[收束（仅全片最后 shot）]
[后期处理词]收尾，[张力宣言]。

约束：avoid jitter，avoid identity drift，avoid bent limbs；角色运动与镜头运动全程分离；@图片N五官服装全镜一致。
```

**格式规则：**

1. **时间轴从 0 开始计数**，每个 SHOT 独立重置。最后一镜的 end_time = SHOT duration，子镜头之间无间隙
2. **子镜头数量**与 shot 时长匹配（见 §4 Shot 组织表）
3. **每个子镜头**开头有 `[Xs-Xs] 镜头N（景别 · 镜头运动）` 标注行；相邻子镜头必须切换景别或机位
4. **镜头行与 beat 序列分行**，beat 序列用 `→` 连接，每个 `→` 只写一件事
5. **落点行**明确写可截图的定格画面，不写"静止"
6. **约束行**每 shot 末尾固定写入；特殊情况追加对应条目
7. 有效风格值存在→风格行写风格；缺失→只写光源+色调
8. 绑定后**必须**用 @图片N 指代角色；空镜不写角色 @图片N
9. 快切组仅在 Chorus/高能段使用；快切组期间镜头行写"镜头运动锁定"

**约束行按需追加：**
- 呼吸镜头（无角色）：`无角色面部入画`
- 镜像/双人：`禁止生成完整第二人脸，仅渲染[部位]局部反射`
- 特效场景：`禁止渲染角色身体透明或变形，用强光覆盖轮廓替代`

### Case: Visions MV 输出示例

> Verse 7s 概念诗意段 + Chorus 12s hero 奇观段。仅供格式校准，禁止复制剧情。

```json
{
  "summarize": "以废弃温室为舞台的视觉概念片。冷灰蓝渐变暖琥珀，薄雾贯穿。从锈铁枯叶的静默对话到镜面碎裂中的自我重组，Yuki完成一场关于重生的视觉仪式。",
  "shots": [
    {
      "shot_id": "Shot 2",
      "scene_name": "废弃温室",
      "start_time": 8,
      "end_time": 15,
      "duration": 7,
      "description": "Verse 概念诗意：废弃温室中的时间痕迹——锈蚀、枯萎、光线，用不同视角捕捉「被遗弃」的物质形态",
      "video_prompt": "@图片1是角色Yuki的参考形象，@图片2是场景「废弃温室」的参考图，保持画面风格与参考图一致；\n全片保持统一视觉风格，角色保持一致五官和服装，场景保持一致环境和光线，核心道具保持一致外观特征；\n\n风格：ARRI Alexa Mini LF 50mm，Fuji Eterna 500T 胶片模拟，冷灰蓝底调，薄雾弥散，穹顶裂缝自然光渗入。\n场景：废弃温室，锈蚀铁架支撑破碎玻璃穹顶，地面裂缝中枯萎根茎蜿蜒，空气中细尘悬浮不落。\n\n[0-2s] 镜头1（微距 · Static）\n锈蚀铁架表面，铁锈纹理如干涸河床 →\n一滴冷凝水从铁架上方滑落，击中锈面溅开微小水花 →\n落点：水珠中折射出穹顶破洞外的天空，铁锈纹理清晰，水珠边缘不再扩散。\n镜头：锁定微距不动——让细节本身建立世界，不需要运动。\n\n[2-5s] 镜头2（低角度仰拍 · Slow Crane Up）\n从地面枯叶堆仰拍穹顶，破碎玻璃缝隙中光束斜切而下如固体光柱 →\n@图片1的剪影站在光柱中央，细尘在光柱中缓缓旋转上升 →\n腰先微微弯曲，脊背跟上，头骤然抬起——gaze 从地面直接 snap 向穹顶裂缝处的光源 →\n落点：@图片1仰角剪影轮廓清晰，光柱在她两侧对称切割空间，细尘在她肩线高度悬停。\n镜头：Slow Crane Up 从地面枯叶平视缓缓升至@图片1腰部高度，头骤然抬起时锁定——镜头的迟缓衬托动作的突然。\n\n[5-7s] 镜头3（近景 · Pull Focus）\n@图片1手指抚过一根枯死的藤蔓，指腹触碰处干皮簌簌碎裂坠落 →\n指尖下露出藤芯内部一线翠绿——还活着 →\n落点：焦点落在翠绿藤芯上，指尖皮肤纹理与藤芯翠绿同时清晰，@图片1的侧脸在背景虚化中隐约可见(body: soft breath, lips parted)。\n镜头：Pull Focus 从@图片1侧脸切换到指尖接触点，镜头本身不动——焦点落下的瞬间即是发现的重量。\n\n约束：avoid jitter，avoid identity drift，avoid bent limbs；角色运动与镜头运动全程分离；@图片1五官服装全镜一致。",
      "character_name": "Yuki"
    },
    {
      "shot_id": "Shot 3",
      "scene_name": "镜面虚空",
      "start_time": 15,
      "end_time": 27,
      "duration": 12,
      "description": "Chorus hero 奇观：温室碎玻璃化为无限镜面空间，Yuki在自我碎片中完成重组",
      "video_prompt": "@图片1是角色Yuki的参考形象；\n全片保持统一视觉风格，角色保持一致五官和服装，核心道具保持一致外观特征；\n\n风格：超现实CG画风，冷灰蓝向暖琥珀剧烈转变，液态光质感，零重力漂浮，薄雾浓度骤升。\n场景：温室消失，@图片1悬浮于无限延伸的黑色虚空中，周围数百片温室碎玻璃漂浮，每一片都是一面小镜子，镜面内映出不同时刻的她。\n\n[0-3s] 镜头1（特写 · Static）\n@图片1睁开眼——瞳孔中倒映出环绕的碎玻璃镜片 →\n她呼出的气息在冷空中凝结为白雾，白雾触碰最近的镜片 →\n触碰点骤然亮起暖光，暖光沿镜片边缘向外扩散成一圈金线 →\n落点：瞳孔中倒影清晰，金线完整环绕最近的镜片，白雾还未消散。\n镜头：锁定面部特写不动——越是宏大奇观发生的前夕，镜头越要克制。\n\n[3-6s] 镜头2（全景 · Slow Orbit）\n暖光在镜片之间连锁传递，数百片碎玻璃依次亮起 →\n【快切组，共1.5s】\n→ 左侧镜片亮起，映出@图片1奔跑的身影\n→ 右侧镜片亮起，映出@图片1蜷缩的姿态\n→ 头顶镜片亮起，映出@图片1双臂展开的轮廓\n落点：所有镜片全部亮起，形成一条螺旋光路环绕@图片1上升，@图片1剪影在光路中央，暖光将黑色虚空从边缘向内驱散。\n镜头：快切组期间镜头运动锁定；落点帧完成后 Slow Orbit 开始缓缓环绕——用轻柔环绕配合奇观不让人晕眩。\n\n[6-9s] 镜头3（中景 · Dolly In）\n所有镜片同时向@图片1飞来——不是碎裂而是融合 →\n碎片贴合她的轮廓逐片嵌入，每嵌入一片她的身体轮廓变得更清晰更完整 →\n落点：@图片1站在画面中央，碎片最后一片嵌入，她的轮廓边缘描出一道完整的暖金光线，双臂自然垂下(body: chin lifts one degree, eyes sharp, direct contact)。\n镜头：Dolly In 从中景缓推到近景，最后一片嵌入时锁定——顺情绪推进，到达即是完成。\n\n[9-12s] 镜头4（全景 · Dolly Back+Crane Up）\n@图片1脚下从黑暗中生出新鲜的绿色苔藓，向四周蔓延 →\n头顶形成一座完整的玻璃穹顶，内壁映满暖色光 →\n落点：@图片1站在穹顶中央，苔藓铺满地面，穹顶内壁暖光将她的剪影压在画面正中，暗角渐起。\n镜头：Dolly Back+Crane Up，@图片1在退后中反而压住画面中央——用空间矛盾制造「渺小却完整」的感觉。\n\n胶片颗粒+色差+轻微过曝收尾，重生不是爆炸，是碎片找到了回家的路。\n\n约束：avoid jitter，avoid identity drift，avoid bent limbs；角色运动与镜头运动全程分离；@图片1五官服装全镜一致；禁止渲染角色身体透明或变形，用强光覆盖轮廓替代。",
      "character_name": "Yuki"
    }
  ]
}
```

---

## §7 收尾验证

### 禁止词

```
dramatic / epic / breathtaking / stunning / gorgeous / beautiful / magical
cinematic lighting（必须写具体光源）
ethereal glow / glowing particles / floating orbs / magical particles
neon / 霓虹（用 colored gel light / colored LED strip / colored storefront sign 替代）
ambient warm light / warm light + cool light（无主次）
linear narrative / clear cause and effect / single timeline（除非 stage_plan 明确要求）
```

运镜禁止：缓慢移动 / 镜头变化 / 画面切换 → 用三级精确术语
情感禁止：sad expression / happy face → 写可拍物理状态
物理矛盾禁止：wide angle + shallow DoF / long shot + extreme bokeh / close-up + wide angle
特效禁止：禁止描述角色身体半透明或溶解。"融入背景"用强光从外部包裹轮廓替代。

### 最终检查

```
□ 字段完整（8字段），时间值整数，时间轴连续，每 shot 4-15s
□ video_prompt 子镜头时间轴从 0 开始计数，每 shot 独立重置，最后一镜 end_time = SHOT duration
□ 子镜头数量与 shot 时长匹配（4-5s:2-3镜 / 6-8s:3-4镜 / 9-12s:4-5镜 / 13-15s:5-6镜）
□ 每个子镜头开头有 [Xs-Xs] 镜头N（景别 · 镜头运动）标注行
□ 相邻子镜头景别或机位已切换，无连续两镜同景别同机位
□ beat 序列用 → 连接，每个 → 只写一件事
□ 身体动作写传导顺序，不写结果
□ 眼神有轨迹（从哪→到哪→停在哪），不写状态词
□ 每个 SHOT 至少一次速度突变（骤然/snap/猛然），分布在整个 SHOT 内
□ 附属物有惯性延迟
□ 落点是定格画面，描述可拍的物理状态，不写"静止"
□ 镜头行与 beat 序列分行，先问三个问题再决定运镜
□ 快切组仅在 Chorus/高能段使用，组内镜头运动锁定，前后有慢 beat 缓冲
□ 约束行每 shot 末尾写入，特殊情况追加对应条目
□ @图片N 先角色后场景，每 shot 从 1 重新开始
□ 一致性锁定文本每 shot 写入
□ 风格行写渲染/色调/大气；摄影系时包含相机型号；场景行写物理状态无形容词
□ 无禁止词，无物理矛盾，无身体透明/溶解描述
□ 道具首次出现写完整固定描述
□ 同场景连续 shot 有空间锚点
□ 全片最后 shot 有收束句
□ 至少 2 次反差，2-3 个 hero frame，Shot 1 反直觉开场
□ 跨场景有视觉桥，场景回访有变化
□ character_name 非空 → 不得为空镜
□ 概念诗意段用镜头语言制造变化，奇观段天马行空但美且酷，每帧有审美逻辑
```
