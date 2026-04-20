# visions · 轻超现实 · 词库 + Case

---

## 焦段

| 焦段 | 用途 |
|------|------|
| 35–50mm | 平静客观，真实基底建立，空间与人物并重 |
| 85mm | 唯美高级感，情绪人像，异常初现段 |
| 135mm | 疏离感，人在异常中的孤独，隔离感 |
| 200mm+ | 极度隔离，偷窥感，异常逼近人物 |
| Macro / 100mm | 异常细节特写，触发物，皮肤/材质边界 |

---

## 光线词库

> **以下完整光线词库用于 video_prompt 全局 Light/视觉风格 行和导演决策层，不直接写入 frame_prompt。**

**精致写实光源（现实段）：**
- 人造：`A single tungsten floor lamp` / `Colored storefront sign casting light` / `Fluorescent overhead tubes`
- 自然：`Golden hour sunlight through curtain gap` / `Overcast diffused skylight`
- 舞台：`A single theatrical spotlight directly overhead`

**幻想光源（异常段）：**
- `Light with no visible source, color-shifted` — 异常进入
- `Shadow moving against the light direction` — 影子异常
- `Water reflection brighter than the water itself` — 反射异常

**衰减速度：**
- `rapid falloff`：高对比、切断式情绪
- `gradual falloff`：柔和、延迟释放
- `hard cutoff`：戏剧最强、空间像被切开

---

## 异常载体词库

**物件：** `a glass of water stays perfectly still during an earthquake` / `a clock with no hands still ticking` / `a candle burning upward and downward simultaneously`

**反射：** `reflection shows a different time of day` / `mirror shows a gesture not being made` / `water reflection shows a figure that isn't there`

**影子：** `shadow facing the wrong direction` / `shadow slightly ahead of the person` / `shadow refusing to follow movement`

**灯光：** `light source color shifts without physical explanation` / `a single spotlight with no origin`

**材质：** `fabric rippling in still air` / `stone wall breathing slowly` / `glass floor showing depth that isn't there`

---

## 色调风格

> **以下色调表和推荐相机仅在渲染族为摄影系时使用。**

允许：胶片复古 / 东亚唯美 / 当代简约 / 赛博未来感 / 混搭融合（不推荐 Y2K）

| 色调 | 关键词 | 主色 | 推荐相机 |
|-----|-------|------|---------|
| 胶片复古 | 复古/vintage | 偏黄偏橙暖调 | Alexa Classic + Kodak 5254/5293 |
| 当代简约 | 简约/minimalist | 白/米/灰/黑 | Sony Venice 2 / ARRI Alexa 35 |
| 东亚唯美 | 唯美/古风/日式 | 低饱和自然色 | ARRI Alexa Mini LF + Fuji Eterna 500T |
| 赛博未来感 | 赛博/cyber | 冷黑/深蓝/冷紫 | RED Monstro 8K + CineStill 800T |
| 混搭融合 | 混搭/融合 | 两种主导交替 | 按主导选型 |

---

## 辅色规则

- 主色占比应明显高于辅色
- 辅色优先在背景、边缘、反射面
- 辅色克制词：`subtle` / `faint` / `barely perceptible` / `ghostly` / `whisper of`
- 异常色必须与现实基底的主色有明确差异（色温对立或饱和度跳跃）

---

## 表情词库

```
强势：chin raised, jaw set, heavy-lidded unyielding
忧郁：downcast eyes, soft unfocused, lips parted, brow furrowed
颓废：heavy-lidded, slow gaze, lips swollen, skin flushed
冷静：neutral, observing without engaging
脆弱：eyes wet, brows knitted, mouth trembling
神秘：slight closed-lip smile, gaze oblique
困惑/发现：eyes widening slightly, head tilting, breath pausing
```

气质词最多 1-2 个。先写物理质感，再写气质。

---

## 风格禁止词

**精致写实（现实基底段）：** `handheld shake` / `gritty` / `raw` / `neon`

**轻超现实专属禁止：** `surreal` / `dreamlike` / `otherworldly` / `uncanny`（必须写具体异常的物理形态）

---

## Case：XOXZ — 赛博暗黑 ↔ Y2K梦幻

> visions · 纯幻想 / 轻超现实 | 色调: 赛博暗黑 ↔ Y2K千禧梦幻极端反差 | K-pop
> **参考价值：** 多维空间嵌套、极端色调反差转场（深紫冷黑 ↔ 柔白淡黄）、单色沉浸空间、相同笑容复制的诡异感、时空倒流视觉效果

### summarize

整片在两套色彩系统间切换：暗黑层以高对比深紫、品红、冷青主导；梦幻层转入柔和的白、天空蓝、淡黄。以沉睡少女为开头和结尾，中间在深空、废土卧室、黄色花海之间跳跃。结尾玻璃碎片倒退飞行回到原位，窗户复原，少女继续沉睡。

---

### Shot 1 · 深渊凝视 · 建立（赛博暗黑层，4s）

**video_prompt**
纯黑宇宙深渊，点缀微弱星光与悬浮透明气泡，侧逆向伦勃朗光，冷蓝星光补光。
镜头1: 0-1s: 极端特写 / 极缓慢向内推进 / 沉睡少女闭眼躺在透明球体内，身体轻微上下浮动 / 身体缓慢升降一厘米，头发漂浮 ｜ 镜头2: 1-2s: 极端特写 / 极速切入另一少女面部 / 她嘴唇微张约两毫米，下颌轻微左右晃动 / 嘴唇开合，下巴小幅移动 ｜ 镜头3: 2-3s: 极端特写 / 固定 / 头部向右倾斜约五度，嘴角右侧微微上扬形成不对称弧线 / 头微歪，嘴角一侧轻微牵动 ｜ 镜头4: 3-4s: 极端特写 / 急速向前推至眼球占满屏幕 / 瞳孔收缩，眼白中的血丝和虹膜纹理清晰可见 / 眼球充满画面，虹膜细节放大

**frame_prompt**
Keep the person exactly as shown in <<<image_1>>> with 100% identical facial features, hair, and clothing. Do not alter any aspect of the person's appearance from <<<image_1>>>. Keep the visual style exactly consistent with the reference image. <<<image_1>>> sleeping peacefully inside a transparent sphere floating in a dark void. Extreme close-up, face at center. Shot on 100mm macro lens, extremely shallow depth of field, background dissolving into absolute blackness. Single soft side-light carving Rembrandt shadows across the jawline. Deep cold indigo tones, subtle silver highlights on bubble edge. Shot on ARRI Alexa 65. Serene yet eerie.

---

### Shot 2 · 失真天堂 · 反转（Y2K梦幻层，10s）

**video_prompt**
一望无际黄色花海，极其虚假的蓝天白云（像塑料感），漫反射柔和日光，画面边缘极强柔光溢出白边。
镜头1: 0-2s: 全景 / 斯坦尼康平滑半环绕 / 少女们踮脚旋转，裙摆展开 / 脚尖着地原地旋转，裙子飘起成圆形 ｜ 镜头2: 2-4s: 中景 / 匀速向前推进 / 她们面带完全相同弧度的笑容，同步挥动手臂 / 五人笑容弧度一致，手臂动作同步 ｜ 镜头3: 4-6s: 中景仰拍 / 微微仰拍 / 她们同时仰头闭眼向天空伸出双手，十指张开 / 头后仰，双手伸直指向天空 ｜ 镜头4: 6-7s: 近景 / 极速横向摇摄在五人脸部之间切换 / 她们笑容弧度完全一致，像复制粘贴 / 快速切过五张脸，每张脸的微笑角度相同 ｜ 镜头5: 7-9s: 大远景 / 向天垂直拉升 / 女孩们在巨大花海中变成五个小点 / 人物缩小为花海中的五个色点 ｜ 镜头6: 9-10s: 大远景 / 毫无预兆向左急速甩镜至完全虚焦 / 画面猛然左移，花海变成一片黄色模糊 / 所有细节消失，只剩模糊色块

**frame_prompt**
Keep all persons exactly as shown in <<<image_1>>>, <<<image_2>>>, <<<image_3>>>, <<<image_4>>>, <<<image_5>>> with 100% identical facial features, hair, and clothing. Do not alter any aspect of any person's appearance. Keep the visual style exactly consistent with the reference images. <<<image_1>>> front-left, <<<image_2>>> center, <<<image_3>>> front-right, <<<image_4>>> back-left, <<<image_5>>> back-right — all five standing scattered organically in a vast endless meadow of bright yellow flowers, all mid-twirl on tiptoes with skirts fanning out. Wide shot, unnaturally perfect blue sky with fluffy white clouds above. 50mm lens, bright and airy, heavy bloom on edges. Flat diffused soft sunlight, no harsh shadows. Pastel palette, overpowering sky blue and butter yellow. Early 2000s digital overexposure. Sweet but uncannily artificial.

---

> **使用注意：** case 中的 frame_prompt 全部按摄影系完整模式书写。实际使用时必须根据渲染族适配：画风系须裁剪——④ 只保留焦段数字、⑦ 跳过。不要照搬 case 的摄影渲染词。
