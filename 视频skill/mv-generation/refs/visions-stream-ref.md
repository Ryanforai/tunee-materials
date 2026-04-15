# visions · 意识流 · 词库 + Case

---

## 焦段

| 焦段 | 用途 |
|------|------|
| 35–50mm | 现实层建立，平静客观，空间与人物并重 |
| 85mm | 唯美高级感，情绪人像，记忆层温柔段 |
| 135mm | 疏离感，恐惧层，人物被意识隔开 |
| 200mm+ | 极度隔离，偷窥感，最深意识层 |
| Macro / 100mm | 触发物特写，皮肤/物件边界，切层前的细节锚点 |

---

## 时空层光线规范

```
[现实层] → 正常光线，色温中性（4500-5500K），对比度正常
[记忆层] → 过曝 / 偏暖（2700-3500K）/ 轻微虚焦 / gradual falloff
[幻想层] → 欠曝 / 偏冷（6500-9000K）/ 色彩偏移 / rapid falloff
[恐惧层] → 高对比 / 极暗 / 冷色（蓝青或绿冷）/ hard cutoff
```

---

## 光线词库

> **以下完整光线词库用于 video_prompt 全局 Light/视觉风格 行和导演决策层，不直接写入 frame_prompt。**

**现实层光源：**
- `Natural light from window, even and neutral`
- `Single overhead fluorescent, flat and functional`
- `Overcast diffused skylight from above`

**记忆层光源：**
- `Overexposed warm window light bleeding across skin`
- `Soft tungsten lamp, warm and slightly diffused`
- `Golden hour light trapped in an interior, overly warm`

**幻想层光源：**
- `Cold sourceless ambient, color-shifted blue-green`
- `Multiple cold fill lights from no clear origin`
- `Underlit from below, cold and directional`

**恐惧层光源：**
- `Single hard sidelight, rapid falloff, near total darkness`
- `Hard overhead with deep dark shadows below eyebrows`
- `Cold contrast light, hard cutoff between light and shadow`

**叙事功能光：**
- `Phone screen spill`：私密切层，一个人的意识回响
- `Mirror reflection brighter than source`：意识分裂
- `Car headlight sweeping`：现实入侵记忆层

---

## 触发物词库

**视觉触发物（进入新层前给特写）：**
- 手持物：`a phone screen with an unread message` / `an old photograph` / `a key that doesn't fit any door`
- 反射：`a window reflection showing a different time of day` / `a mirror showing a gesture not being performed`
- 身体：`fingers slowly wrapping around a glass` / `eyes closing against their own will`
- 环境：`a single lamp turning on in a dark room` / `a door left ajar with light bleeding through`

---

## 气质词参考

```
fragmented memory / overlapping consciousness / time collapse
interior monologue / dissociation / psychological space
suspended moment / echo of a past self / involuntary recall
```

---

## 色调风格

> **以下色调表和推荐相机仅在渲染族为摄影系时使用。**

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
- 各层辅色不同，辅色差异也是层区分的辅助手段

---

## 表情词库

```
强势：chin raised, jaw set, heavy-lidded unyielding
忧郁：downcast eyes, soft unfocused, lips parted, brow furrowed
颓废：heavy-lidded, slow gaze, lips swollen, skin flushed
冷静：neutral, observing without engaging
脆弱：eyes wet, brows knitted, mouth trembling
神秘：slight closed-lip smile, gaze oblique
游离：eyes focusing somewhere far away, body present but mind absent
```

气质词最多 1-2 个。先写物理质感，再写气质。

---

## 风格禁止词

**意识流专属禁止：** `linear narrative` / `clear cause and effect` / `single timeline` / `realistic continuity` / `one location only`

---

## Case：MONOCHROME-BLOOM — 黑白意识流 + 高饱和爆发

> visions · 意识流 | 色调: 黑白高反差 → 高饱和糖彩渐变 | J-pop / 电子流行
> **参考价值：** 黑白画面中局部插入高饱和彩色（凝胶灯/亚克力道具）、眼睛-屏幕-镜面作为反复出现的视觉元素、从黑白硬切到全彩的转场手法、角色在独立纯色背景前依次出现、高潮后回到自然光收尾

### summarize

以黑白高反差为基底，前半段只在凝胶灯、有色亚克力道具、彩色织物里出现少量高饱和色。副歌时白光吞没画面后硬切进入全彩纯色背景空间。反复出现的视觉元素：眼部特写、电脑通话画面、相机取景框、粉盒镜面。高潮段每个角色站在独立配色的纯色背景墙前。结尾回到妆面特写和日落侧脸。

---

### Shot 1 · 黑白世界 · 建立（9s）

**video_prompt**
纯黑背景，黑白高反差，胶片颗粒质感。
镜头1: 0-2s: 超近景 / 极缓慢推进 / 黑发少女抬手挡在眼前，然后缓慢放下手露出眼睛，瞳孔直视镜头 / 手从眼前移开，眼睛从被遮挡到完全可见 ｜ 镜头2: 2-4s: 特写 / 轻微横移 / 车厢拉环和金属机械部件，浅景深，工业材质表面反光，车厢内空无一人 / 金属部件反光，座椅空着 ｜ 镜头3: 4-6s: 中景 / 缓慢推进 / 少女站在明暗交界的走廊，缓慢转头，侧脸被窗外强逆光勾出白色轮廓线 / 头从正面转向侧面，脸部轮廓被光勾出一条白边 ｜ 镜头4: 6-7s: 全景 / 固定 / 单人站在空旷白色工作室落地窗前，人在画面中央偏下，占画面不到五分之一 / 大面积白色空间，人很小 ｜ 镜头5: 7-8s: 中景 / 缓慢推进 / 角色坐在长桌前看笔记本电脑，屏幕上有另一个人的视频通话画面 / 电脑屏幕亮着，屏幕里有一张脸 ｜ 镜头6: 8-9s: 近景 / 固定 / 电脑屏幕画面映在角色脸上，脸上出现一个矩形光斑 / 脸上有一块长方形亮区，其余面部暗

**frame_prompt**
Keep the person exactly as shown in <<<image_1>>> with 100% identical facial features, hair, and clothing. Do not alter any aspect of the person's appearance from <<<image_1>>>. Keep the visual style exactly consistent with the reference image. <<<image_1>>> hand slowly lowering from eyes, gazing directly at camera with a cold detached expression. Extreme close-up, face filling center frame, pure black background. Shot on 100mm macro lens, extremely shallow depth of field, background absolute blackness. Black and white high contrast, no color anywhere. Single soft side-light from upper right carving sharp highlight along cheekbone and nose bridge, rapid falloff into deep shadow on opposite side. Visible film grain. Shot on ARRI Alexa 65, Kodak Tri-X 400 emulation, heavy grain, 16:9.

---

### Shot 2 · 白光爆发 · Drop（5s）

**video_prompt**
黑暗舞台中央，白光瞬间吞没画面后硬切进入高饱和纯色背景空间。
镜头1: 0-1s: 全景 / 固定 / 单人黑色剪影站在黑暗舞台中央，向头顶一束白色强光张开双臂 / 人物只有黑色轮廓，双臂从身侧打开到水平 ｜ 镜头2: 1-2s: 全景 / 急速推进 / 白光从人物身后扩大直到吞没整个画面，全白 / 白色从中心扩散，画面从暗变全白 ｜ 镜头3: 2-3s: 全景 / 固定 / 白色消退，角色站在高饱和紫色背景墙前，身穿对比色黄绿服装 / 紫色墙面+黄绿衣服，颜色对比强烈 ｜ 镜头4: 3-4s: 中景 / 缓慢环绕 / 第二位角色站在纯粉色背景墙前凝视镜头，身穿宝蓝色外套 / 粉色墙面+蓝色外套，角色正对镜头 ｜ 镜头5: 4-5s: 全景 / 固定 / 多角色并排站在分段配色的宽背景墙前（紫/粉/黄/蓝/绿各一段） / 五人并排，每人身后一种颜色

**frame_prompt**
Keep the person exactly as shown in <<<image_1>>> with 100% identical facial features, hair, and clothing. Do not alter any aspect of the person's appearance from <<<image_1>>>. Keep the visual style exactly consistent with the reference image. <<<image_1>>> standing as a pure black silhouette in the center of a dark stage, arms outstretched horizontally, facing a single intense white spotlight from directly above. Wide shot, figure centered, stage floor barely visible, surrounding darkness absolute. Shot on 35mm lens, deep depth of field. Hard white spotlight from directly overhead, rapid falloff, total darkness beyond subject. Scene dominated by deep black with one hard white cone. No other colors. Shot on ARRI Alexa 65, Kodak Vision3 500T emulation, 16:9.

---

> **使用注意：** case 中的 frame_prompt 全部按摄影系完整模式书写。实际使用时必须根据渲染族适配：画风系须裁剪——④ 只保留焦段数字、⑦ 跳过。不要照搬 case 的摄影渲染词。
