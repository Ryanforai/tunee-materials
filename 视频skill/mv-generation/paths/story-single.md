# story_mode · 单线 · 完整执行文件

> 单线叙事 MV。输入已经给出 stage 规划，本文件负责把这条线拍得更有戏、更有层次、更像导演作品。
> **执行时同时加载 refs/story-single-ref.md（词库 + Case）。**

---

## §1 输入与解析

### 所有字段

`mv_type` / `mv_guide.md_stages` / `mv_guide.mv_elements` / `language_code` / `audio_duration` / `video_model` / `visual_style` / `mv_guide.style_guide`（可选）

**忽略字段（出现时直接跳过）：** `image_model` / `mv_guide.stages`（旧格式，以 `md_stages` 为准）

### 有效风格值（effective_style）

`mv_guide.style_guide` 存在且非空时优先；否则回退到 `visual_style`。空字符串视为缺失。都缺失则走参考图主导模式。

### 渲染族（rendering_family）

有效风格值存在时，根据文本内容判定渲染族，决定 frame_prompt ④⑦ 的写法。

| 渲染族 | 判定条件 | frame_prompt ④⑦ 行为 |
|--------|---------|----------------------|
| **摄影系 `photographic`** | `effective_style` 含：`写实 / realistic / cinematic / 电影 / 胶片 / film / vintage / 复古 / Y2K / noir / 黑色电影 / 赛博朋克 / cyberpunk / documentary / 纪录 / CG写实 / 真人 / live-action / 精致写实 / 高级质感`；或无法判定时兜底 | ④ 焦段 + 虚实完整；⑦ 相机 + 胶片完整 |
| **画风系 `stylized`** | `effective_style` 含：`动漫 / anime / 赛璐璞 / cel / 水墨 / ink wash / 水彩 / watercolor / 油画 / oil painting / 3D渲染 / 3D render / toon / 像素 / pixel / 浮世绘 / ukiyo-e / 国画 / 漫画 / comic / manga / 剪纸 / paper cut / 插画 / illustration / flat design / 低多边形 / low poly / voxel` | ④ 仅焦段数字（透视）；⑦ 跳过 |

两族同时命中 → **画风系优先**。

### `audio_duration`

输入可能为浮点，立即四舍五入为整数使用。

### `mv_guide.md_stages`

全片 **canonical stage plan**，不是参考信息。期望内容是 Markdown 表格，至少包含列：`时间段` / `音乐结构` / `歌词` / `画面描述` / `场景` / `角色`

时间值须为整数秒，浮点立即四舍五入。

### Error JSON

```json
{"error": "错误类型", "detail": "具体说明，告知调用方如何修正"}
```

输出 error JSON 后立刻停止。

### 异常兜底（story/visions 相关条目）

| 情况 | 处理 |
|------|------|
| 有效风格值缺失 | 参考图主导模式。video_prompt 全局行用 `Light:` / `光线:` 只写光源+方向；frame_prompt：④只写焦段数字、⑤只写光线方向、⑥⑦跳过 |
| 有效风格值存在但无法映射 | 原文注入 prompt |
| characters 为空但 mv_guide 提到人物 | 角色资源为空，prompt 中不生成角色 `<<<image_X>>>` |
| scenes 为空但 mv_guide 提到场景 | 场景资源为空，prompt 中不生成场景 `<<<image_X>>>` |
| md_stages 中某 stage 的场景名经标准化后仍不在 `scenes[]` 中 | 不报错，`scene_name` 保留 md_stages 原文（不置 null），prompt 用文字描述环境，不生成场景 `<<<image_X>>>`。场景名仍出现在输出中，仅无参考图绑定 |
| `music_structure` 无法标准化 | 保留原文 |

---

## §2 Preflight

### Asset Map（资源注册）

- character key = `character.name`，scene key = `scene.scene_name`（若无则取 `scene.name`）
- 名称匹配前先 trim 首尾空格、统一全角/半角斜杠和破折号。**此规则同样适用于 `md_stages` 中的 `场景` / `角色` 列与 `scenes[]` / `characters[]` 的匹配**
- 只有 `mv_elements.characters[] / scenes[]` 中显式存在的对象才能进入资源表
- `md_stages`、`lyrics`、`visual_brief`、case 或其他描述性文本都不能作为创建新资源对象的依据
- `character_name` 含 `/` 时，按 `/` 拆分、逐项 trim 后分别校验，再按原顺序拼回
- `scene_name` 只允许单一场景名或空值，不允许 `/` 拼接多场景

> `<<<image_X>>>` 编号不在此处预分配。每个 shot 按 §13「frame_prompt」规则独立从 1 开始重新编号。

### Stage Plan Parsing

将 `mv_guide.md_stages` 解析为内部 `stage_plan`：

```json
[
  {
    "stage_id": "Stage 1",
    "start": 0, "end": 10, "duration": 10,
    "music_structure": "Verse",
    "lyrics": "...",
    "visual_brief": "...",
    "scene_name": "墨室琴案",
    "character_name": "小K"
  }
]
```

- **时间值绝对只允许整数秒**，浮点立即四舍五入
- 新的合法 `时间段` 才算下一个 stage
- `stage_plan[0].start = 0`，`stage_plan[最后].end = audio_duration`
- 相邻 stage 连续无间隙、无重叠
- `scene_name` 不允许 `A/B` 多场景拼接

---

## §3 时长校验

- `effective_max_duration = min(video_model.max_duration, 12)`；若未提供 `max_duration`，默认 `12`
- `min_duration` 从 `video_model` 读取，默认 `3`

**拆分超长 stage（时长 > `effective_max_duration`）：**

1. 优先按画面描述中的**内容转折点**切分
2. 若画面描述无明确转折，按**歌词断句**切分
3. 若歌词也无明确断点，按**近似等分**切分，每段不超过 `effective_max_duration`（奇数秒时前段取较长值，如 15s → 8s + 7s）
4. 拆分后的每个 shot 继承原 stage 的 `character_name`、`scene_name`
5. 拆分后的相邻 shot 之间必须有景别、运镜或视角的变化，不允许简单续写

**超短 stage 吸收（时长 < `min_duration`）：**

必须吸收进相邻 shot 作为内部 beat，不允许丢掉其角色、主动作或关键意象。

---

## §4 Stage Fidelity + 硬约束

### 通用约束

`stage_plan` 是全片语义主轴：

- 最终输出必须覆盖所有 stage，保持原始顺序
- 不允许省略 stage 的主动作、角色、核心情绪
- 默认不允许省略场景
- **字段继承硬约束**：`stage_plan` 中 `character_name` 非空的 stage，产出的每个 shot 必须 `character_name = stage_plan.character_name`（拆分 stage 时每个子 shot 同理继承）。导演不得将有角色的 stage 降级为空镜。`scene_name` 同理：stage 指定了场景，shot 必须携带该 `scene_name`
- 不允许无依据新增支线剧情
- 默认优先 `1 stage → 1 shot`
- `shots` 按 `stage_plan` 顺序推进，不得逆序或跳段
- 时间轴连续：`shots[0].start_time = 0`，`shots[最后].end_time = audio_duration`，相邻 shot 无间隙无重叠
- **所有时间值必须为整数（秒）**

### story_mode 额外约束

- 合并相邻 stage 前先检查合并后时长是否合法；不得把各自合法的 stage 合成一个超出 `effective_max_duration` 的 shot
- 超短 stage（< `min_duration`）必须吸收为相邻 shot 内部 beat，不允许丢掉其角色、主动作或关键意象

---

## §5 全片导演规划

在写任何 shot 之前，先从完整 `stage_plan` 得出全片拍摄曲线，至少内部明确：

- `visual_thesis`：整片最重要的视觉母题
- `energy_curve`：哪几段克制，哪几段释放
- `camera_curve`：运镜如何逐段升级或收束
- `lens_curve`：焦段如何映射心理距离
- `light_curve`：色温、对比度、主光方向如何推进
- `hero_stages`：哪些段必须出记忆点
- `breath_stages`：哪些段必须留呼吸
- `contrast_points`：哪些相邻段需要明显反差

### 高级感核心

- 一个段落只有一个主动作或主姿态
- 一个画面只有一个主光逻辑
- 一个镜头只有一个主要情绪方向——由光源变化、身体姿态递进、景别压缩或环境改变具体体现，不依赖旁白
- 一个高潮只靠 1-2 个强记忆点，不靠堆满技巧

`shot intention`（拍什么）和 `shot progression`（怎么成立）是两层。若最后只剩一句"缓慢推近人物"，说明只写了运镜，没有写出 progression。

### 廉价感警报

以下连续出现 2 次以上 = 明显掉档：

- 连续中景正面表演，没有景别压缩和释放
- 每段只是"人物看镜头唱/演"，没有阈值变化
- 光线很好听，但没有明确光源和主次
- 所有段都在"用力"，没有呼吸和留白
- 每段都在炫运镜，反而没有一个能截图的定格
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
- `performance_mode`：对镜、回避、挑衅、抽离、静止还是失控
- `camera_strategy`：用什么机位逻辑最对
- `composition_strategy`：对称、偏轴、遮挡、留白、压迫、窥视、隔离？
- `lighting_strategy`：主光从哪里来，怎么落在人物和空间上
- `progression_strategy`：内部如何从 A 推到 B
- `hero_frame`：最值得截图的一帧是什么

### Stage Treatment 原则

- 输入只规定大概拍什么，你负责升级成更高级的镜头设计
- 可以升级构图、焦段、光线、细节、递进
- 不允许改掉本来的主动作、角色、场景和段落意义
- 即使 stage 很简单，也先想清 `状态A → 触发点 → 状态B` 怎么被看见

### 单线高级化方法

- 不要把"发生了什么"平着拍完，优先找出这段最贵的一帧
- 一个 stage 里只挑一个最值钱的动作，不要什么都拍
- 如果是情绪段，不要只拍脸；给空间、手部、物件、门槛

### 单线递进规则

- 开场段：先给视觉悬念，不要立刻把全部信息说完
- 积累段：用人物动作、空间阈值、物件状态推动，不靠抽象内心独白
- 转折段：必须通过可拍到的动作完成（`[PASS]` 打开纸袋 / 拿起钥匙 / 推门进入 / 把外套搭上肩；`[FAIL]` 只在 description 里说"她终于想通了"）
- 余波段：让空间和身体状态保留变化后的后劲

### 同一场景内的推进

同一场景连续出现不等于重复。必须至少推进一项：
- 人物距离镜头更近或更远
- 人物从空间边缘进入中心，或反过来
- 物件状态发生变化
- 光线方向或强度变化
- 前景遮挡或景深层次变化

让同一场景拍出高级感：开始拍"人被空间吞住" → 中段拍"人和空间发生接触" → 结束拍"人改变了空间里的某个状态"

### Stage Treatment 快速检查 5 问

1. 最值得被记住的一瞬间是什么
2. 最强的身体线条是什么
3. 空间压迫或释放来自哪里
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

若答不出这 4 件事，不能直接落成 prompt。递进优先来自观察顺序；运镜只是承载 beat 的工具。

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

### 超长 / 超短 stage 的合法适配

- 超过 `effective_max_duration` → 拆成多个连续 shot，按上方 beat 蓝图独立设计每个 shot。拆分后的相邻 shot 必须至少改变以下一项：景别 / 运镜方式 / 视角（正→侧、平→仰等）。典型节奏：第一 shot 建立 → 后续 shot 强化或转角度 → 最后 shot 交付峰值或收束
- 短于 `min_duration` → 吸收进相邻 shot 作为内部 beat，不允许丢掉其角色、主动作或关键意象

### 子镜头升级逻辑

高级子镜头每一条都给观众新的视觉价值：
- 人物镜头给姿态（身体线条、肢体关系、视线方向）
- 细节镜头给触感和时间
- 空间镜头给关系和孤独
- 反射/遮挡镜头给心理层

如果多条子镜头都只是换角度看同一张脸 = 不高级。

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
- 色温：冷 → 暖 / 暖 → 冷
- 空间：封闭 → 开阔 / 室内 → 室外

### 反重复

相邻 shot 同时满足三项 = 无效重复：同一场景 + 同一情绪段位 + 同一构图和镜位关系。

**单线反重复规则：**

相邻两 shot 同时满足三项 = 无效重复：同一场景 + 同一身体状态 + 同一情绪段位

有效推进至少满足一项：空间阈值变化 / 物件状态变化 / 人物关系变化 / 情绪节点变化 / 光线状态变化

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

第一帧也要有 hero 质感，不要用平庸默认姿态开场。

**Hero Frame 判断法（至少满足其中 3 条）：**
- 轮廓一眼能认
- 身体线条清楚
- 光源关系清楚
- 背景足够干净或有秩序
- 缩成缩略图也能成立
- 静音截图也有情绪

---

## §11 剪切哲学

每个 shot 切到下一个 shot 时，必须在内部确认用哪种切法，不能默认硬切。

| 切法 | 触发条件 | 禁止场景 |
|------|----------|----------|
| **硬切** | 音乐节拍强击点 / 情绪对立 / 场景完全切换 | 同场景同情绪段位之间 |
| **匹配切** | 上一 shot 末帧动作 → 下一 shot 开场同方向动作 | 随意使用，动作不匹配时强用 |
| **跳切** | 同角色同场景快速时间跳跃，制造焦虑或时间压缩感 | 情绪舒展段 / 余波段 |
| **叠化** | 意识流 / 记忆层切换 / Outro 收尾 | 节拍强点 / 副歌高能段 |

**跨 shot 色温连续性：** 每个 shot 在内部记录自己的主色温（冷 / 中 / 暖），相邻 shot 不允许连续 3 个以上同色温，除非是刻意的情绪沉浸设计且在全片导演规划中明确标注。

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
- 有效风格值缺失时：保持 `光线:` / `Light:` 不变，只写光源+方向，不写色温词（warm / cool / amber / blue-grey 等），不发明额外视觉风格
- 子镜头 4 维度：景别 / 运镜 / 人物动作（空镜为场景变化）/ 画面变化
- 每条子镜头都应对应一个新的 beat，不是同一动作的同义改写
- 一个有效 beat 优先新增以下之一：新身体状态 / 新空间关系 / 新物件状态 / 新光线关系 / 新情绪重量
- 若某条子镜头删掉运镜描述后几乎不剩内容，说明不是有效 beat，应回到 shot progression 重新设计
- `video_prompt` 内部时间轴从 `0s` 重新开始
- 完成绑定后，子镜头中**必须**用 `<<<image_X>>>` 指代角色，禁止用角色名文字替代

**有效风格值 → Visual Style / Light 行的规则：**

词库见 refs/story-single-ref.md

---


## §13-§14 → shared/core.md

> frame_prompt 完整写法（8 模块 + 渲染族适配 + 7 个 FAIL/PASS 校准示例 + 核心原理）和输出 JSON 结构、占位符作用域、人物引用、空镜规则、物理可实现性、导演职责边界均定义在 `shared/core.md` 中，执行时已加载。

---
## §15 自检清单

每个 shot 输出前逐项确认：

```
□ shot_id / scene_name / start_time / end_time / duration / description / video_prompt / frame_prompt / character_name 全部存在（character_name 不允许省略键，空镜写 null）
□ start_time / end_time / duration 全部为整数，无小数点
□ duration = end_time - start_time
□ 时间轴与前一个 shot 的 end_time 连续
□ 时长在合法区间内（3-12s，或 effective_max_duration）
□ stage_plan 中 character_name 非空 → 该 shot 的 character_name 必须与之一致，不得为 null（禁止擅自降为空镜）
□ stage_plan 中 scene_name 非空 → 该 shot 的 scene_name 必须与之一致，不得为 null
□ 仅 stage_plan.character_name 为空的 shot 才可空镜（character_name = null）
□ frame_prompt 占位符从 <<<image_1>>> 起，先角色后场景（无首帧偏移）
□ story video_prompt 占位符：<<<image_1>>> = 首帧，<<<image_2>>> 起 = 角色→场景
□ story → video_prompt 中同一角色/场景的编号 = frame_prompt 中对应编号 + 1（逐一核对，不允许对齐失误）
□ video_prompt 无全局禁止词
□ video_prompt 无物理矛盾（wide angle + shallow DoF / long shot + extreme bokeh / close-up + wide angle）
□ 有效风格值缺失时 → frame_prompt 无写实渲染词（禁止：tack sharp / soft diffusion / bokeh / 三层光 / 色温 / 相机型号 / 胶片 / grain / halation）
□ 渲染族为画风系时 → frame_prompt ④ 仅焦段数字（无 tack sharp / bokeh），⑦ 跳过
□ scene_name 最多 1 个场景
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

情绪泛指词禁止：`sad expression / happy face` → 写成可拍的物理状态，如 `downcast eyes, lips parted, brow furrowed`

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
```
