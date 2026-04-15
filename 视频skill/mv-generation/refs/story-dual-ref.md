# story_mode · 双线 · 词库 + Case

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

### 身体姿态优先级

- 下巴抬起但肩膀压低
- 一手抓住衣领或包带
- 背靠空间边缘，重心偏到一侧
- 身体已经转走，视线还没离开
- 手停在物件上方而不是已经拿完

---

## 色调风格

> **以下色调表和推荐相机仅在渲染族为摄影系时使用。**

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

> **以下完整光线词库用于 video_prompt 全局 Light/视觉风格 行和导演决策层，不直接写入 frame_prompt。**

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

---

## 风格禁止词

**精致写实：** `handheld shake` / `gritty` / `raw` / `unpolished` / `neon`

**纪录写实：** `smooth gimbal` / `perfectly centered` / `rim light` / `god ray`

---

## Case：PARALLEL — 都市双线离别

> story_mode · 双线（汇聚型） | 色调: 当代简约，线A偏冷 / 线B偏暖 | Pop / R&B
> **参考价值：** 严格 A/B 交替节奏、室外冷色 vs 室内暖色视觉区分、物件状态推进叙事（手机/外套/钥匙）、汇聚型结尾两线视觉趋同、不可逆动作完成转折

### summarize

同一座城市同一个傍晚，两个人各自经历关系结束后的第一个小时。线A跟着离开的人穿过冷蓝街道和天桥——动态、行走、室外；线B跟着留下的人在暖琥珀色公寓里——静止、被遗留物件包围。两条线通过物件呼应（同一件外套、同一串钥匙、同一条未发出的消息）。越接近结尾，线A背景出现暖色窗光，线B开始向窗外看——色温逐渐靠拢。最后线B的人走到窗边俯看街道，线A的人刚从那条街走过已不在画面里。

---

### Shot 1 · [线A] 建立 · 离开的人（7s）

**video_prompt**
傍晚城市人行道，蓝灰色天光，路面微湿反光，行人稀少。
镜头1: 0-2s: 中景 / 缓慢跟随 / 男生低头快步走在人行道上，外套搭在手臂上，手机攥在右手里 / 步伐快，身体前倾，不看两侧 ｜ 镜头2: 2-4s: 近景 / 持续跟随 / 他的侧脸，下颌绷紧，目光直视前方不回头 / 嘴紧闭，眉头微皱 ｜ 镜头3: 4-5s: 特写 / 固定 / 手机屏幕亮起一条打到一半的消息，光标闪烁，然后屏幕被他拇指按灭 / 屏幕从亮变暗 ｜ 镜头4: 5-7s: 全景 / 固定 / 他的身影走进天桥入口，蓝灰色建筑群铺满背景 / 人影走入钢结构天桥，身形被金属框架遮挡一半

**frame_prompt**
Keep the person exactly as shown in <<<image_1>>> with 100% identical facial features, hair, and clothing. Do not alter any aspect of the person's appearance from <<<image_1>>>. Keep the visual style exactly consistent with the reference image. <<<image_1>>> walking briskly on a damp city sidewalk at dusk, a dark jacket draped over one arm, phone gripped tightly in the other hand, head slightly lowered. Medium shot, subject in left third of frame, empty sidewalk stretching behind. Shot on 50mm lens. Subject tack sharp. Background softly blurred urban buildings and street lamps. Overcast blue-grey dusk sky as dominant ambient, one distant sodium street lamp beginning to warm up but not yet reaching the subject. Scene dominated by cool slate blue and concrete grey. Only the damp pavement catches a faint warm reflection from a shopfront, ≤ 10%. Shot on Sony Venice 2, Kodak Vision3 250D emulation, fine grain, neutral contrast, 16:9.

---

### Shot 2 · [线B] 建立 · 留下的人（5s）

**video_prompt**
傍晚公寓客厅，琥珀色台灯是唯一光源，门刚被关上。
镜头1: 0-2s: 全景 / 固定 / 女生站在玄关门口面对刚关上的门，一只手还停在门把手位置 / 身体正对门板，手指搭在金属把手上 ｜ 镜头2: 2-3s: 近景 / 缓慢推进 / 她的手从门把手上慢慢松开，指尖最后离开金属表面 / 五根手指逐一松开，手臂垂下 ｜ 镜头3: 3-5s: 中景 / 固定 / 她转过身背靠门缓慢滑坐到地上，台灯把半边脸照成暖橙，另一半沉进阴影 / 后背贴门板下滑，膝盖弯曲，半脸明半脸暗

**frame_prompt**
Keep the person exactly as shown in <<<image_1>>> with 100% identical facial features, hair, and clothing. Do not alter any aspect of the person's appearance from <<<image_1>>>. Keep the visual style exactly consistent with the reference image. <<<image_1>>> standing facing a closed apartment door, one hand resting on the door handle, fingers still wrapped around the metal, body weight slightly forward, head bowed. Full shot, subject centered in frame, door filling the background. Shot on 50mm lens. Subject tack sharp. Background flat door surface with single amber table lamp casting a warm pool to the right edge. Scene dominated by warm amber and muted shadow. Only the metal door handle catches a faint cool grey reflection, ≤ 10%. Shot on Sony Venice 2, Kodak Vision3 250D emulation, fine grain, 16:9.

---

> **使用注意：** case 中的 frame_prompt 全部按摄影系完整模式书写。实际使用时必须根据渲染族适配：画风系须裁剪——④ 只保留焦段数字、⑦ 跳过。不要照搬 case 的摄影渲染词。
