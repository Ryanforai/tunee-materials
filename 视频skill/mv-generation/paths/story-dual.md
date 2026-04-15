# story_mode · 双线 · 完整执行文件

> 双线叙事 MV。stage_plan 中存在两条清晰的人物/场景线交替推进。本文件在 story-single 的基础上增加双线对位设计规则。
> **执行时同时加载 refs/story-dual-ref.md（词库 + Case）。**

---

## §1 输入与解析

### 所有字段

`mv_type` / `mv_guide.md_stages` / `mv_guide.mv_elements` / `language_code` / `audio_duration` / `video_model` / `visual_style` / `mv_guide.style_guide`（可选）

**忽略字段（出现时直接跳过）：** `image_model` / `mv_guide.stages`

### 有效风格值（effective_style）

`mv_guide.style_guide` 存在且非空时优先；否则回退到 `visual_style`。空字符串视为缺失。都缺失则走参考图主导模式。

### 渲染族（rendering_family）

| 渲染族 | 判定条件 | frame_prompt ④⑦ 行为 |
|--------|---------|----------------------|
| **摄影系 `photographic`** | `effective_style` 含：`写实 / realistic / cinematic / 电影 / 胶片 / film / vintage / 复古 / Y2K / noir / 黑色电影 / 赛博朋克 / cyberpunk / documentary / 纪录 / CG写实 / 真人 / live-action / 精致写实 / 高级质感`；或无法判定时兜底 | ④ 焦段 + 虚实完整；⑦ 相机 + 胶片完整 |
| **画风系 `stylized`** | `effective_style` 含：`动漫 / anime / 赛璐璞 / cel / 水墨 / ink wash / 水彩 / watercolor / 油画 / oil painting / 3D渲染 / 3D render / toon / 像素 / pixel / 浮世绘 / ukiyo-e / 国画 / 漫画 / comic / manga / 剪纸 / paper cut / 插画 / illustration / flat design / 低多边形 / low poly / voxel` | ④ 仅焦段数字（透视）；⑦ 跳过 |

两族同时命中 → **画风系优先**。

### `audio_duration`

输入可能为浮点，立即四舍五入为整数使用。

### `mv_guide.md_stages`

全片 **canonical stage plan**。时间值须为整数秒，浮点立即四舍五入。

### Error JSON

```json
{"error": "错误类型", "detail": "具体说明，告知调用方如何修正"}
```

输出 error JSON 后立刻停止。

### 异常兜底

| 情况 | 处理 |
|------|------|
| 有效风格值缺失 | 参考图主导模式。video_prompt 全局行只写光源+方向；frame_prompt：④只写焦段数字、⑤只写光线方向、⑥⑦跳过 |
| 有效风格值存在但无法映射 | 原文注入 prompt |
| characters 为空 | 角色资源为空，不生成角色 `<<<image_X>>>` |
| scenes 为空 | 场景资源为空，不生成场景 `<<<image_X>>>` |
| md_stages 中 stage 的场景名经标准化后仍不在 `scenes[]` 中 | 不报错，`scene_name` 保留 md_stages 原文（不置 null），prompt 用文字描述环境，不生成场景 `<<<image_X>>>` |
| `music_structure` 无法标准化 | 保留原文 |

---

## §2 Preflight

### Asset Map（资源注册）

- character key = `character.name`，scene key = `scene.scene_name`（若无则取 `scene.name`）
- 名称匹配前先 trim 首尾空格、统一全角/半角斜杠和破折号。**此规则同样适用于 `md_stages` 中的 `场景` / `角色` 列与 `scenes[]` / `characters[]` 的匹配**
- 只有 `mv_elements.characters[] / scenes[]` 中显式存在的对象才能进入资源表
- `md_stages`、`lyrics`、`visual_brief`、case 或其他描述性文本都不能作为创建新资源对象的依据
- `character_name` 含 `/` 时，按 `/` 拆分、逐项 trim 后分别校验，再按原顺序拼回
- `scene_name` 只允许单一场景名或空值

### Stage Plan Parsing

将 `mv_guide.md_stages` 解析为内部 `stage_plan`：

```json
[
  {
    "stage_id": "Stage 1",
    "start": 0, "end": 7, "duration": 7,
    "music_structure": "Verse",
    "lyrics": "...",
    "visual_brief": "...",
    "scene_name": "城市街道",
    "character_name": "男生"
  },
  {
    "stage_id": "Stage 2",
    "start": 7, "end": 12, "duration": 5,
    "music_structure": "Verse",
    "lyrics": "...",
    "visual_brief": "...",
    "scene_name": "公寓客厅",
    "character_name": "女生"
  }
]
```

- **时间值绝对只允许整数秒**，浮点立即四舍五入
- `stage_plan[0].start = 0`，`stage_plan[最后].end = audio_duration`
- 相邻 stage 连续无间隙、无重叠
- 先识别表头，再做逻辑行重组
- `-` / `–` / `—` / 全角破折号视为同义分隔符
- `character_name` 必须能与 `mv_elements.characters` 对应
- `scene_name` 优先与 `mv_elements.scenes` 对应。若某 stage 的 `scene_name` 在 `scenes[]` 中找不到匹配：不报错，该场景不进入资源表，对应 shot 的 `scene_name` 填 `null`

---

## §3 时长校验

- `effective_max_duration = min(video_model.max_duration, 12)`；若未提供 `max_duration`，默认 `12`
- `min_duration` 从 `video_model` 读取，默认 `3`

**拆分超长 stage（时长 > `effective_max_duration`）：**

1. 优先按画面描述中的**内容转折点**切分
2. 若画面描述无明确转折，按**歌词断句**切分
3. 若歌词也无明确断点，按**近似等分**切分，奇数秒时前段取较长值
4. 拆分后的每个 shot 继承原 stage 的 `character_name`、`scene_name`
5. 拆分后的相邻 shot 之间必须有景别、运镜或视角的变化，不允许简单续写

**超短 stage 吸收（时长 < `min_duration`）：**

必须吸收进相邻 shot 作为内部 beat，不允许丢掉其角色、主动作或关键意象。

---

## §4 Stage Fidelity + 硬约束

### 通用约束

- 最终输出必须覆盖所有 stage，保持原始顺序
- 不允许省略 stage 的主动作、角色、核心情绪
- **字段继承硬约束**：`stage_plan` 中 `character_name` 非空的 stage，产出的每个 shot 必须 `character_name = stage_plan.character_name`（拆分 stage 时每个子 shot 同理继承）。导演不得将有角色的 stage 降级为空镜。`scene_name` 同理：stage 指定了场景，shot 必须携带该 `scene_name`
- 不允许无依据新增支线剧情
- 默认优先 `1 stage → 1 shot`
- 时间轴连续：`shots[0].start_time = 0`，`shots[最后].end_time = audio_duration`
- **所有时间值必须为整数（秒）**

### story_mode 额外约束

- 合并相邻 stage 前先检查合并后时长是否合法
- 超短 stage（< `min_duration`）必须吸收为相邻 shot 内部 beat

---

## §5 全片导演规划

在写任何 shot 之前，先从完整 `stage_plan` 识别双线结构，至少内部明确：

- `line_A` / `line_B`：两条线各自的角色、场景、情绪走向
- `visual_thesis`：整片最重要的视觉母题
- `color_separation`：两线的色温/色调如何区分（如 线A冷蓝 / 线B暖琥珀）
- `energy_curve`：哪几段克制，哪几段释放
- `camera_curve`：运镜如何逐段升级或收束
- `hero_stages`：哪些段必须出记忆点
- `contrast_points`：哪些相邻段需要明显反差
- `convergence_plan`：两条线何时视觉趋同（通常在高潮或结尾）

### 高级感核心

- 一个段落只有一个主动作或主姿态
- 一个画面只有一个主光逻辑
- 两条线必须有视觉上的区分依据（色温、空间、动静、构图方向），不能"换了人物但画面感觉一样"
- 高潮汇聚时，两线的视觉语言必须有可察觉的靠拢

### 廉价感警报

以下连续出现 2 次以上 = 明显掉档：
- 连续中景正面表演，没有景别压缩和释放
- 两条线之间没有视觉对比，切换没有惊喜感
- 所有段都在"用力"，没有呼吸和留白
- 每段信息说满，观众没有补完空间

---

## §6 音乐结构 → 镜头策略

| 结构 | 强度 | 景别倾向 | 运镜倾向 | 光线策略 | 核心指令 |
|------|------|---------|---------|---------|---------|
| Intro | 低 | 全景→中景 | 固定 / 极缓推 | 单光源留暗 | 第一帧就要抓力，但不打满 |
| Verse | 低→中 | 中景⇄近景 | 缓推 / 跟随 | 克制侧光 | 让人物和场景先成立 |
| Pre-chorus | 中→高 | 近景 / 特写 | 推进加速 | 空间压缩，加重前景 | 蓄力但不释放 |
| Chorus / Drop | 高 | 景别跳跃 | 最强运镜 | 强对比 / 强色温 | 至少 1 个截图即成立的画面 |
| Bridge | 转向 | 新视角 | 抽离 / 重组 | 反差光线 | 做视觉反差和新角度 |
| Outro | 余震 | 全→中 | 固定 / 极缓拉 | 松弛 | 保留改变后的空气感 |

---

## §7 Stage Treatment 方法

每个 stage 先做导演 treatment，再生成 shot。至少内部回答：

- `stage_goal`：这段让观众记住什么
- `emotional_intensity`：相对前后段怎么变化
- `which_line`：这段属于线A还是线B，与前一段另一条线形成什么对比
- `camera_strategy`：用什么机位逻辑最对
- `composition_strategy`：对称、偏轴、遮挡、留白、压迫、窥视、隔离？
- `lighting_strategy`：主光从哪里来，与另一条线的光线语言形成何种对比
- `hero_frame`：最值得截图的一帧是什么

### 双线对位方法

- **严格交替节奏：** stage 按 A/B/A/B 或 A/A/B/B 排列，形成节拍感
- **物件呼应：** 两条线通过同一件物品建立联系（手机、外套、钥匙、未发出的消息）
- **色温对立：** 线A室外冷色 vs 线B室内暖色；切换即是视觉对比信号
- **动静对立：** 线A动态行走 vs 线B静止留守
- **汇聚型结尾：** 越接近结尾，两线视觉语言趋同（色温靠拢、景别靠近）

### Stage Treatment 快速检查 5 问

1. 这段属于哪条线，与上一段对比在哪里
2. 最值得被记住的一瞬间是什么
3. 最强的身体线条是什么
4. 光是"照亮什么"，不是"照亮一切"
5. 和上一段相比，真正新增的视觉信息是什么

---

## §8 Shot / Sub-shot 落地

### 基本规则

- `stage` 是语义主轴，默认优先 `1 stage → 1 shot`
- 长 stage 可在 shot 内部拆成 sub-shot
- 模型限制时可把多个 stage 吸收进一个 shot 的内部 beat
- 即使合并，必须保留原始 stage 顺序和情绪递进

### Shot Beat Plan（写 prompt 前必须先完成）

每个 shot 先明确：
- 这个 shot 的开场建立是什么
- 中段强化是什么
- 呼吸或转接点在哪里
- 收束或记忆点是什么

### Shot 内部递进蓝图

```
3-5s (2-3 beat):
  beat 1: 人物/空间锚定 — 景别、主体位置、主光
  beat 2: 主动作或主状态变化 — 身体/物件/光线至少变一项
  beat 3 (可选): 呼吸/细节/余波

6-8s (3-4 beat):
  beat 1: 建立 — 景别 + 空间 + 人物初始状态
  beat 2: 发展 — 主动作展开，情绪推进
  beat 3: 呼吸/细节 — 物件/反射/身体局部/环境
  beat 4: 落点 — 定格或转接，给记忆点

9-12s (4-6 beat):
  beat 1: 建立
  beat 2: 推进 — 主动作第一阶段
  beat 3: 转折/新信息 — 新景别或新视角
  beat 4: 强化 — 情绪峰值
  beat 5: 呼吸
  beat 6: 收束 — 记忆点或余波
```

### 子镜头密度

| shot 时长 | 推荐子镜头数 |
|-----------|------------|
| 3-5s      | 2-3        |
| 6-8s      | 3-4        |
| 9-11s     | 4-5        |
| 12s       | 5-6        |

- `6-8s` shot 默认至少 `3` 个子镜头；例外只写 `1` 个时须同时满足：① 明确的静止凝视、空间停顿或仪式性定格 ② 画面内部有可见变化（光线漂移 / 焦点迁移 / 身体微调至少一项） ③ 该变化推动叙事或情感，不只是运动
- `9s+` shot 默认至少 `3` 个子镜头；若做不到，优先拆 shot

### 呼吸镜头

每个 6s 以上 shot 至少有 1 个呼吸镜头；高潮段也要，只是更短。

**可插入的类型：**
- 环境空镜：窗外天空、街道远景、风吹帘子
- 物件细节：钥匙、杯子、镜子、水渍、布料
- 身体局部：手指、脚步、肩线、发丝、喉结
- 光影细节：反光、影子移动、玻璃折射、墙上游走的光

**[FAIL]**
```
0-2s: 近景 / 她看向镜头
2-4s: 特写 / 她侧脸
4-6s: 特写 / 她闭眼
```

**[PASS]**
```
0-2s: 中景 / 她对镜整理衣领
2-3s: 特写 / 镜边灯泡在玻璃里抖出一圈虚焦反光
3-5s: 近景 / 她抬眼看向镜中自己，嘴角压着一点笑
5-6s: 中近景 / 她转回正面，肩线前压，准备进入下一段
```

---

## §9 反差与反重复

### 反差

全片至少 2 次明显反差跳跃，优先从这些维度：
- 景别：远 → 近 / 近 → 远
- 动静：完全静止 → 明显动作
- 色温：冷 → 暖 / 暖 → 冷（双线天然提供）
- 空间：封闭 → 开阔 / 室内 → 室外

### 双线反重复规则

- 同一条线的相邻出现不能视觉上完全相同
- 切换到另一条线就是天然的反重复，但同一条线内仍须推进
- 线A和线B之间必须有可感知的色温或空间对立
- 汇聚段（高潮/结尾）允许色温靠拢，但须在全片导演规划中明确标注

### 反重复轮转表

```
上一 shot 主要特征 → 本 shot 优先方向:
  正脸人像   → 背影 / 侧面 / 局部 / 空镜 / 反射
  固定镜头   → 运镜（推 / 拉 / 环绕 / 跟随）
  暖色调     → 冷色或中性
  近景       → 全景或特写（跳过中景）
  人物独占   → 加入环境 / 前景 / 物件
  高强度     → 呼吸 / 留白
```

每个 shot 比前一个至少新增一个具体变化：新空间阈值 / 新物件状态 / 新身体姿态 / 新关系距离 / 新光线状态 / 新情绪重量。

---

## §10 Hero Frame

每支 MV 至少 2-3 个强定格画面，优先落在：开场第一帧、副歌开头、转折点、结尾余味段。

优先类型：
- 逆光剪影 + 大面积留白
- 正中央孤立人物 + 对称空间
- 强单侧光 + 半明半暗的脸
- 低角仰拍或高角俯拍 + 极简动作
- 近景人像 + 前景遮挡 / 反射 / 玻璃层次

**Hero Frame 判断法（至少满足其中 3 条）：**
- 轮廓一眼能认
- 身体线条清楚
- 光源关系清楚
- 背景足够干净或有秩序
- 缩成缩略图也能成立
- 静音截图也有情绪

---

## §11 剪切哲学

| 切法 | 触发条件 | 禁止场景 |
|------|----------|----------|
| **硬切** | 音乐节拍强击点 / 情绪对立 / 场景完全切换（双线切换天然适合） | 同场景同情绪段位之间 |
| **匹配切** | 上一 shot 末帧动作 → 下一 shot 开场同方向动作 | 随意使用，动作不匹配时强用 |
| **跳切** | 同角色同场景快速时间跳跃 | 情绪舒展段 / 余波段 |
| **叠化** | 意识流 / 记忆层切换 / Outro 收尾 | 节拍强点 / 副歌高能段 |

**跨 shot 色温连续性：** 相邻 shot 不允许连续 3 个以上同色温，双线天然提供色温交替，须在导演规划中确认每段主色温。

---

## §12 video_prompt 写法

**语言：** `language_code = zh-CN` 用中文，其他用英文。

**zh-CN：**
```
<<<image_1>>>是首帧图；如存在后续参考图，按局部资源顺序（先角色按 character_name 先后，后场景）逐个写明绑定关系：<<<image_X>>>是角色角色名；<<<image_Y>>>是场景场景名，并保持画面风格与参考图完全一致；
【全局】场景: [环境] / 光线: [光源+方向+色温]
0-[X]s: [景别] / [运镜] / [描述] / [画面变化] ｜ [X]-[X]s: ...
```

**英文：**
```
<<<image_1>>> is the first frame; if additional reference images are provided, declare bindings in local-resource order (characters first by character_name order, then scene): <<<image_X>>> is character [Character Name]; <<<image_Y>>> is scene [Scene Name], and keep the visual style exactly consistent with the reference image(s);
[Global] Scene: [environment] / Light: [source+direction+color temp]
0-[X]s: [framing] / [camera movement] / [description] / [visual change] | [X]-[X]s: ...
```

### 规则

- 有效风格值存在时：`光线:` → `视觉风格:` / `Light:` → `Visual Style:`，内容为有效风格值原文
- 有效风格值缺失时：保持 `光线:` / `Light:` 不变，只写光源+方向，不写色温词
- 子镜头 4 维度：景别 / 运镜 / 人物动作（空镜为场景变化）/ 画面变化
- 每条子镜头都应对应一个新的 beat
- `video_prompt` 内部时间轴从 `0s` 重新开始
- 完成绑定后，子镜头中**必须**用 `<<<image_X>>>` 指代角色，禁止用角色名文字替代

词库见 refs/story-dual-ref.md

---


## §13-§14 → shared/core.md

> frame_prompt 完整写法（8 模块 + 渲染族适配 + 7 个 FAIL/PASS 校准示例 + 核心原理）和输出 JSON 结构、占位符作用域、人物引用、空镜规则、物理可实现性、导演职责边界均定义在 `shared/core.md` 中，执行时已加载。

---
## §15 自检清单

```
□ shot_id / scene_name / start_time / end_time / duration / description / video_prompt / frame_prompt / character_name 全部存在
□ start_time / end_time / duration 全部为整数，无小数点
□ duration = end_time - start_time
□ 时间轴与前一个 shot 的 end_time 连续
□ 时长在合法区间内
□ stage_plan 中 character_name 非空 → 该 shot 的 character_name 必须与之一致，不得为 null（禁止擅自降为空镜）
□ stage_plan 中 scene_name 非空 → 该 shot 的 scene_name 必须与之一致，不得为 null
□ 仅 stage_plan.character_name 为空的 shot 才可空镜（character_name = null）
□ frame_prompt 占位符从 <<<image_1>>> 起，先角色后场景（无首帧偏移）
□ video_prompt 占位符：<<<image_1>>> = 首帧，<<<image_2>>> 起 = 角色→场景
□ video_prompt 中同一角色/场景的编号 = frame_prompt 中对应编号 + 1
□ video_prompt 无全局禁止词
□ video_prompt 无物理矛盾
□ 有效风格值缺失时 → frame_prompt 无写实渲染词
□ 渲染族为画风系时 → frame_prompt ④ 仅焦段数字，⑦ 跳过
□ scene_name 最多 1 个场景
□ 两条线有可察觉的视觉区分（色温/空间/动静）
□ 高潮/结尾汇聚段的两线视觉语言有趋同
```

---

## §16 全局禁止词

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

---

## §17 禁止输出的字段

```
mv_type / video_model / visual_style / style_guide / rendering_family / md_stages / mv_elements / stage_plan / checks / notes / route / style_pick / structure / title
```

---

## §18 导演硬性检查项

```
□ 全片先做过导演规划，不是逐段随手写
□ 所有 stage 都被覆盖，且顺序未被破坏
□ 音乐结构和镜头强度匹配（查 §6 速查表）
□ 至少 2 次明确反差跳跃
□ 至少 2-3 个 hero frame
□ 相邻 shot 不构成无效重复（查 §9 反重复轮转表）
□ 6s 以上 shot 有呼吸镜头
□ 6s 以上 shot 不只靠一个连续运镜承担全部变化
□ 子镜头围绕同一事件递进，不切去无关内容
□ 每个 shot 比前一个至少新增一个具体变化
□ 每个相邻 shot 之间确认了切法（硬切/匹配切/跳切/叠化），不默认硬切
□ 未出现连续 3 个以上同色温 shot（除非全片规划中明确标注）
□ 两条线有视觉区分（色温/空间/动静对立）
□ 汇聚型结尾两线视觉语言有趋同
```
