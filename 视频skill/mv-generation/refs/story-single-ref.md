# story_mode · 单线 · 词库 + Case

---

## 焦段

| 焦段 | 叙事功能 |
|------|---------|
| 24–35mm | 临场感；空间阈值变化；进入/离开某个场所 |
| 50mm | 客观视角；建立段落；人物和空间并重 |
| 85mm | 情绪聚焦；表演细节；副歌前积累 |
| 135mm | 疏离；关系拉开；人物在环境中的孤独 |
| 200mm+ | 极度隔离；窥视感；无法靠近的关系 |

---

## 构图手法

- 对称居中：命运感、审判感、被空间吞没
- 偏轴留白：失衡、犹豫、关系未对齐
- 前景遮挡：窥视、压迫、记忆感
- 镜中构图：自我审视、身份拉扯
- 门框/走廊/窗框：阈值变化、即将进入或离开

### 高级感来源

- 阈值：门框、楼梯、车门、窗前、走廊转角
- 前景：玻璃、水汽、帘子、肩膀、门框边缘
- 关系距离：同框但不接触 / 接触但不对视 / 对视但不靠近
- 物件状态：钥匙、手机、衣领、杯子、镜子、信封
- 材质：湿地面、旧木头、金属反光、布料褶皱

### 身体姿态优先级

比起 generic 动作，优先使用更能成立画面的身体状态：
- 下巴抬起但肩膀压低
- 一手抓住衣领或包带
- 背靠空间边缘，重心偏到一侧
- 身体已经转走，视线还没离开
- 手停在物件上方而不是已经拿完

---

## 色调风格

> **以下色调表和推荐相机仅在渲染族为摄影系时使用。** 画风系或有效风格值缺失时，frame_prompt 不写相机型号、胶片模拟、色彩主辅比例。

有效风格值存在且为摄影系时，从此表选型。精致写实允许全 6 种，纪录写实只允许前两种。

| 色调 | 关键词 | 主色 | 推荐相机 |
|-----|-------|------|---------|
| 胶片复古 | 复古/vintage | 偏黄偏橙暖调 | Alexa Classic + Kodak 5254/5293 |
| 当代简约 | 简约/minimalist | 白/米/灰/黑 | Sony Venice 2 / ARRI Alexa 35 |
| Y2K千禧 | Y2K/chrome | 银色/冷白/荧光 | RED Monstro 8K |
| 东亚唯美 | 唯美/古风/日式 | 低饱和自然色 | ARRI Alexa Mini LF + Fuji Eterna 500T |
| 赛博未来感 | 赛博/cyber | 冷黑/深蓝/冷紫 | RED Monstro 8K + CineStill 800T |
| 混搭融合 | 混搭/融合 | 两种主导交替 | 按主导选型 |

---

## 光线词库

> **以下完整光线词库用于 video_prompt 全局 Light/视觉风格 行和导演决策层（stage treatment / shot 设计），不直接写入 frame_prompt。** frame_prompt 中：摄影系和画风系 ⑤⑥ 跳过（由 Visual style 声明替代）；参考图主导模式 ⑤ 仅写光源+方向一句话。

**人造：** `A single lamp` / `phone screen` / `colored storefront sign` / `bare overhead bulb`

**自然：** `Late afternoon sun through blinds` / `pre-dawn grey` / `overcast diffused`

**叙事功能光：**
- `Car headlight sweeping`：关系被打断、时间流动
- `Doorway flooding with light`：进入、离开、阈值变化
- `Phone screen spill`：私密、夜晚、一个人的情绪回响

**光线叙事功能：**
- 高对比强侧光 → 冲突 / 决断
- 柔和漫射 → 脆弱 / 停顿
- 背光逆光 → 离开 / 转折 / 成为剪影

辅色克制词：`subtle` / `faint` / `barely perceptible` / `ghostly` / `whisper of`

---

## 表情与身体微状态

- 建立：`neutral expression, eyes scanning, body containing something unsaid`
- 积累：`jaw set, brows drawn, lips pressed, shoulders held tight`
- 转折：`brows knitted, mouth trembling, nostrils flared, chin lifted against pressure`
- 余波：`heavy-lidded eyes, soft unfocused gaze, shoulders dropped, breathing settling`

气质词最多 1-2 个，须与当前 stage 叙事位置匹配。

---

## 风格禁止词

**精致写实：** `handheld shake` / `gritty` / `raw` / `unpolished` / `neon`

**纪录写实：** `smooth gimbal` / `perfectly centered` / `rim light` / `god ray`

---

## Case：BLUE — Pop Ballad 恋爱短片

> story_mode · 单线 | 色调: 胶片复古暖调 | Acoustic pop / Ballad
> **参考价值：** 环境先于人物出场、自然元素（风/水/鸟群）制造画面运动、双人关系靠简单动作成立、近景人像与远景海天交替、痕迹式收尾（脚印/背影）

### summarize

海边落日恋爱短片。前段用车窗、湖面、长椅、树影建立空间，女主延迟出场。中段用牵手奔跑、海浪嬉闹、沙滩自拍三组动作完成情侣关系。全片画面运动由风吹头发、海浪打脚、鸟群飞过承担，不需要复杂表演。结尾不用正脸，只留脚印、背影。

---

### Shot · 空椅湖面 · 建立（5s，纯环境，人物尚未出场）

**video_prompt**
清晨湖边公园，低角度暖阳穿过树道，地面有长树影，空气微暖雾。
镜头1: 0-2s: 大全景 / 固定 / 一张空木长椅面对闪光湖面，三只鸟从画面上方掠过 / 椅子空着，湖面反光 ｜ 镜头2: 2-3s: 大全景 / 极缓慢推进 / 阳光照亮临水小路，树影横压地面，远处一个极小人影在走 / 小路延伸，人影很远 ｜ 镜头3: 3-4s: 特写 / 固定 / 阳光穿过树叶缝隙，高光在叶片间跳动，焦点极浅 / 叶片边缘发亮，背景全糊 ｜ 镜头4: 4-5s: 中景 / 缓慢跟随 / 几只鸭子在金色涟漪中游动，栏杆投影落在水面 / 鸭子划过水面，涟漪扩散

**frame_prompt**
An empty wooden park bench facing a shimmering lake surface in early morning light. No human figures visible. Wide shot, bench positioned in lower third, expansive water surface filling upper frame. A small flock of birds mid-flight crossing the top edge. Shot on 50mm lens, medium depth of field, bench sharp, far shore softly blurred. Single shaft of warm golden morning sunlight from upper left, long tree shadows stretching across damp ground, gentle mist above water surface. Scene dominated by warm amber and muted sage green. Only water surface catches faint cool silver reflection, ≤ 10%. Shot on Alexa Classic, Kodak Vision3 250D emulation, visible film grain, soft halation around water highlights, 16:9. Quiet, anticipatory, tinged with nostalgia.

---

### Shot · 海边相遇 · Chorus（7s）

**video_prompt**
傍晚浅滩，低角度夕阳，海水泛橙粉色，浪花轻柔打脚。
镜头1: 0-2s: 中景 / 轻柔跟随 / 女孩和男孩牵手沿浅水区跑，两人都在笑，脚踩水花溅起 / 水花从脚下飞溅，两人身体前倾 ｜ 镜头2: 2-4s: 大全景 / 固定 / 两人在浅海浪里互相泼水，白裙和浅色上衣被浪花打湿变透 / 水被手掌扬起，衣服湿贴身体 ｜ 镜头3: 4-5s: 俯拍近景 / 固定 / 两人仰躺在沙滩上朝头顶镜头伸手比手势 / 两只手伸向镜头，沙子粘在手臂上 ｜ 镜头4: 5-7s: 近景 / 固定 / 两人额头轻贴面对面笑，落日边光照亮头发轮廓和脸缘 / 额头相碰，头发边缘被逆光勾亮

**frame_prompt**
Keep all persons exactly as shown in <<<image_1>>>, <<<image_2>>> with 100% identical facial features, hair, and clothing. Do not alter any aspect of any person's appearance. Keep the visual style exactly consistent with the reference images. <<<image_1>>> and <<<image_2>>> running hand-in-hand through ankle-deep surf at golden hour, both laughing with mouths open, bare feet splashing water. <<<image_1>>> is on the left side closer to the ocean, <<<image_2>>> on the right closer to the beach. Medium shot, two figures in center frame, ocean horizon behind. Shot on 85mm lens. Both subjects tack sharp. Background dissolves into warm amber-pink bokeh of sunset sea. Low golden sun from camera-left, warm rim light on both figures' hair edges, gentle orange fill reflected off wet sand. Scene dominated by warm peach-gold. Only wet sand catches cool blue-grey sky reflection, ≤ 10%. Shot on Alexa Classic, Kodak 5293 emulation, warm grain, soft halation, 16:9.

---

> **使用注意：** case 中的 frame_prompt 全部按摄影系完整模式书写（含 ④ 虚实 + ⑦ 相机胶片）。实际使用时必须根据渲染族适配：画风系须裁剪——④ 只保留焦段数字、⑦ 跳过。不要照搬 case 的摄影渲染词。
