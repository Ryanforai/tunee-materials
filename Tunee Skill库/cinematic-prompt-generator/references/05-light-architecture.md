# 模块⑤ 明暗骨架（Light Architecture）
> 核心问题：**光从哪里来，照到哪里，然后消失在哪里？**
> 光影是画面高级感最底层的骨架。没有物理光源逻辑，画面就是「塑料感」。

---

## 三层结构（缺一不可）

```
① 光源宿主实体   →  光从哪个物体发出
② 光的衰减路径   →  光照亮哪里，在哪里消失变暗
③ 反射填充       →  光打到什么材质，反弹出什么颜色的补光
```

---

## 第一层：光源宿主实体

**原则：光必须从具体的物体发出，不能无中生有**

❌ 错误：`warm ambient light`（光从哪来？不知道）  
✅ 正确：`A single tungsten floor lamp with amber bulb`（明确宿主）

### 光源词库

**人造室内光源**
```
A single tungsten floor lamp with amber bulb
Six Hollywood vanity mirror bulbs mounted on the mirror frame
A practical table lamp with white linen shade
Candlelight from three pillar candles on the windowsill
A neon sign in the background casting [color] glow
A practical pendant light hanging directly overhead
Fluorescent overhead tubes casting cold blue-white light
```

**自然光源**
```
A single shaft of golden hour sunlight through a gap in the curtains
Overcast diffused skylight from a large north-facing window
Harsh midday sun from directly overhead
A narrow slit of moonlight through half-drawn blinds
```

**舞台/特殊光源**
```
A single theatrical spotlight positioned directly overhead
Footlights along the stage edge casting upward light
A practical follow spot tracking the subject
Projection light from an unseen film projector
```

---

## 第二层：光的衰减路径

**原则：光有起点、有终点，不是均匀覆盖整个画面**

❌ 错误：`soft lighting everywhere`  
✅ 正确：从哪里亮 → 如何衰减 → 暗部在哪里彻底消失

### 衰减路径模板
```
Light originates at [光源位置],
strongly illuminating [最亮区域: face / hands / shoulders],
[rapidly / gradually] falling off toward [衰减方向],
[暗部区域: the waist / the background / the edges]
plunging into [near-absolute black / deep shadow / crushing darkness].
```

### 衰减速度词库
```
rapid falloff       ← 快速衰减，黑色电影感，高对比
gradual falloff     ← 缓慢衰减，柔和过渡
hard cutoff         ← 明暗边界极硬，戏剧感最强
soft transition     ← 明暗边界柔和，自然感
```

### 光影风格关键词
```
hard chiaroscuro contrast           ← 强对比明暗，卡拉瓦乔风
pool of light surrounded by black   ← 光潭效果，圈外全黑
high contrast with crushed shadows  ← 暗部压暗到极限
low key lighting                    ← 整体偏暗，主要靠局部亮点
rembrandt lighting                  ← 单侧三角光，面部一侧有三角亮斑
split lighting                      ← 半边脸亮半边脸暗
butterfly lighting                  ← 蝴蝶光，鼻下小阴影，好莱坞人像
```

---

## 第三层：反射填充

**原则：光打到材质表面后会反弹，形成第二次补光——这是画面真实感的关键**

❌ 错误：完全省略这一层（光打过去就消失了，不真实）  
✅ 正确：描述光打到什么材质，反弹出什么颜色的填充光

### 反射填充模板
```
[光线颜色] light striking [材质表面]
bounces back upward / sideways,
casting a subtle [反射色调] fill on [受光面].
```

### 常见材质反射组合

| 材质 | 反射色调 | 典型用途 |
|------|---------|---------|
| 抛光木地板 | 暖琥珀橙 fill | 室内夜景，底部补光 |
| 白色墙壁 | 中性白色 fill，略带光源色 | 降低对比，增加自然感 |
| 大理石地面 | 冷灰蓝 fill | 奢华室内，冷调 |
| 镜面玻璃 | 镜像反射，亮点 | 化妆镜、橱窗 |
| 水面/湿地面 | 霓虹/光源颜色 fill | 雨夜街头 |
| 金属表面 | 高光点 + 光源色 fill | 工业感、赛博 |
| 丝绸布料 | 柔和光源色 fill | 时装、剧院幕布 |
| 皮肤 | 温暖皮肤反光 | 人像，侧脸补光 |

### 反射填充示例
```
Warm tungsten light striking the polished wooden floor
bounces upward, casting a subtle amber fill 
on her lower dress and the surrounding walls.

The golden spotlight hitting the silk curtain fabric
scatters back, wrapping her silhouette in 
a diffuse antique-gold rim light.

Neon sign light reflecting off the wet pavement
throws fragmented [color] patterns onto 
her lower legs and shoes.
```

---

## 完整三层示例

### 示例A：剧院聚光灯
```
① 光源宿主：
A single powerful theatrical spotlight positioned 
directly overhead acts as the sole light source.

② 衰减路径：
Light originates above, strongly carving her face,
shoulders and crystal gown details, rapidly falling off
toward the stage floor, the far sides of the frame
plunging into crushing absolute black.

③ 反射填充：
The warm spotlight striking the golden satin curtains
scatters back, casting a secondary antique-gold fill
that wraps softly around her silhouette.
```

### 示例B：室内台灯
```
① 光源宿主：
A single practical table lamp with amber linen shade
on the left side of the frame acts as the only light source.

② 衰减路径：
Light originates from the lamp, strongly illuminating
her left cheek and shoulder, gradually falling off
across her face toward the right side,
the right half of her face transitioning into
rembrandt shadow, the background plunging into near-absolute black.

③ 反射填充：
Warm amber light striking the polished oak desk surface
bounces upward, casting a subtle honey-gold fill
beneath her chin and on her collarbones.
```

---

## ⚠️ 三层缺失的后果

| 缺少哪层 | 典型问题 |
|---------|---------|
| 缺① 光源宿主 | 画面光线「漂浮」，来源不明，塑料感 |
| 缺② 衰减路径 | 光均匀覆盖全画面，无对比，无戏剧性 |
| 缺③ 反射填充 | 暗部死黑不透气，画面过于生硬，不真实 |
