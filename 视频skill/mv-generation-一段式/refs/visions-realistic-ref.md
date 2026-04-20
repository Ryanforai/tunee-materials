# visions · 写实系 · 词库 + Case

---

## 焦段

| 焦段 | 用途 |
|------|------|
| 35–50mm | 平静客观，基调建立，空间与人物并重 |
| 85mm | 唯美高级感，情绪人像，仪式感动作 |
| 135mm | 疏离感，人群中孤独，情绪被环境隔开 |
| 200mm+ | 极度隔离，偷窥感，概念压缩 |
| Macro / 100mm | 记忆触发物、皮肤、反射、材质细节 |

---

## 光线词库

> **以下完整光线词库用于 video_prompt 全局 Light/视觉风格 行和导演决策层，不直接写入 frame_prompt。**

**精致写实光源：**
- 人造：`A single tungsten floor lamp` / `Colored storefront sign casting light` / `Fluorescent overhead tubes`
- 自然：`Golden hour sunlight through curtain gap` / `Overcast diffused skylight`
- 舞台：`A single theatrical spotlight directly overhead`

**衰减速度：**
- `rapid falloff`：高对比、切断式情绪
- `gradual falloff`：柔和、延迟释放
- `hard cutoff`：戏剧最强、空间像被切开

**纪录写实：**
`Natural light from window/street lamp falling unevenly. No supplementary lighting.`

---

## 光色层次规则

- 主色必须清楚，辅色只负责提醒或刺点
- 辅色优先落在：背景边缘 / 反射面 / 玻璃 / 水面 / 金属 / 雾气
- 不同 stage 如果是同一情绪家族，主色可稳定，辅色变化
- 不同 stage 如果是明确对立，主色就要切换

### 廉价梦境警报

以下组合很容易掉到"AI 梦境拼贴"：

- 每段都极端，没有基线
- 每段都只靠发光、漂浮、烟雾
- 没有稳定主色，只是一堆好看颜色
- 每段都在说"神秘"，但没有具体载体

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

## 辅色规则

- 主色占比应明显高于辅色
- 辅色优先在背景、边缘、反射面
- 辅色克制词：`subtle` / `faint` / `barely perceptible` / `ghostly` / `whisper of`

---

## 表情词库

```
强势：chin raised, jaw set, heavy-lidded unyielding
忧郁：downcast eyes, soft unfocused, lips parted, brow furrowed
颓废：heavy-lidded, slow gaze, lips swollen, skin flushed
冷静：neutral, observing without engaging
脆弱：eyes wet, brows knitted, mouth trembling
神秘：slight closed-lip smile, gaze oblique
愤怒：jaw clenched, nostrils flared, eyes narrowed
```

气质词最多 1-2 个。先写物理质感，再写气质。

---

## Stage 级变奏

- 同一人物在不同 stage 中，至少变化一项：景别 / 视线关系 / 空间层次 / 光色对比 / 材质感
- 同一空间在不同 stage 中，至少变化一项：光源位置 / 反射载体 / 空气质感 / 色偏 / 前景密度
- 副歌、drop、崩塌点要把概念推到最强，但仍须与写实系的现实基底一致

---

## 风格禁止词

**精致写实：** `handheld shake` / `gritty` / `raw` / `neon`

**纪录写实：** `smooth gimbal` / `perfectly centered` / `rim light` / `god ray`

---

## Case：UNFORGIVEN — 多人写实概念

> visions · 写实系 | 色调: 胶片复古 + 当代简约混搭 | K-pop
> **参考价值：** 多人物队形构图、日夜场景强对比切换、战损妆容特写、色调三段递进（户外自然光→琥珀暖光→冷蓝夜景+车灯）

### summarize

以西部/机能废土美学为视觉骨架。白天户外停机坪五人同步齐舞，室内昏暗通道战损妆容极端特写，夜晚街道五人手牵手站立。色调沿「户外自然光→复古琥珀暖光→冷蓝夜景+车灯白光」三段递进。全片没有故事线，只有站姿、表情、队形变化。

---

### Shot 1 · 停机坪 · 白天（5s）

**video_prompt**
户外停机坪，深绿色直升机，晴朗天空，均匀明亮自然日光。
镜头1: 0-1s: 全景 / 低角度固定 / 五人背靠直升机同步张开双臂，站成一排 / 五人手臂同时展开，脚站定 ｜ 镜头2: 1-2s: 全景 / 极缓慢向前推进 / 她们同时将右手食指指向天空 / 五只手同时指向上方 ｜ 镜头3: 2-3s: 中景 / 持续推进 / 随节拍同时变换站姿，双腿打开，肩膀后仰 / 站姿从并脚切换到宽腿，重心后移 ｜ 镜头4: 3-4s: 中景 / 微微向右横移 / 队形从一字排开变成交错站位 / 三人前排两人后排，位置交换完成 ｜ 镜头5: 4-5s: 特写 / 急推至领舞者面部后急停定格 / 领舞者下巴微抬，眼睛直视镜头，全员右手做手枪手势 / 下巴抬起，眼睛不眨，手势定住

**frame_prompt**
Keep all persons exactly as shown in <<<image_1>>>, <<<image_2>>>, <<<image_3>>>, <<<image_4>>>, <<<image_5>>> with 100% identical facial features, hair, and clothing. Do not alter any aspect of any person's appearance. Keep the visual style exactly consistent with the reference images. <<<image_1>>> at group center, <<<image_2>>> second from left, <<<image_3>>> far left, <<<image_4>>> second from right, <<<image_5>>> far right — all five standing in formation in front of a massive dark green military helicopter on tarmac. Full shot, low angle looking slightly up, all five figures in frame. Clear daytime sky filling the upper two-thirds. Shot on 35mm lens, deep depth of field, sharp across all subjects. Bright even natural sunlight, no harsh shadows. Shot on ARRI Alexa 65, Kodak Vision3 250D emulation.

---

### Shot 2 · 夜晚街道 · 站立（5s）

**video_prompt**
夜晚城市街道，两旁老式汽车，冷蓝色街道环境光，两侧车灯直射镜头。
镜头1: 0-1s: 全景 / 低角度固定 / 五人手牵手高举站立在街道中央，双脚站定不动 / 十只手交叉握住高举过头顶 ｜ 镜头2: 1-2s: 全景 / 极缓慢向后拉远 / 车灯在潮湿路面上形成长条光晕 / 画面两侧出现车灯光斑，路面反光条纹拉长 ｜ 镜头3: 2-3s: 全景 / 持续拉远 / 她们身体完全静止如雕塑 / 五人姿势与上一秒完全一致，无任何运动 ｜ 镜头4: 3-4s: 大远景 / 继续后退并轻微升高 / 街道两侧建筑和车辆完整进入画面 / 建筑轮廓从两侧入画，五人在画面中缩小 ｜ 镜头5: 4-5s: 极端远景 / 拉至最远后画面缓慢变暗 / 五人轮廓在车灯和路灯交织中变成纯黑剪影 / 人物细节消失，只剩黑色轮廓，画面整体变暗

**frame_prompt**
Keep all persons exactly as shown in <<<image_1>>>, <<<image_2>>>, <<<image_3>>>, <<<image_4>>>, <<<image_5>>> with 100% identical facial features, hair, and clothing. Do not alter any aspect of any person's appearance. Keep the visual style exactly consistent with the reference images. Five figures standing motionless hand-in-hand in the center of a wet night street, arms raised overhead, linked hands held high. Wide shot, all five in frame, street stretching behind and ahead. Shot on 35mm lens, deep depth of field. Cold blue ambient streetlight as dominant source, two distant car headlights pointing toward camera from left and right, creating horizontal lens flares along wet tarmac. Scene dominated by deep cold blue and slate grey. Only headlight flare adds warm white, ≤ 15%. Shot on ARRI Alexa 65, Kodak Vision3 500T emulation, visible grain, 16:9.

---

> **使用注意：** case 中的 frame_prompt 全部按摄影系完整模式书写。实际使用时必须根据渲染族适配：画风系须裁剪——④ 只保留焦段数字、⑦ 跳过。不要照搬 case 的摄影渲染词。
