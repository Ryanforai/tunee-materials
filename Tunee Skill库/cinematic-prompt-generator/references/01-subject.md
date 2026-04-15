# 模块① 主题描述（Subject）
> 回答：**画面里有什么人，在哪里，做什么**

---

## 核心结构

```
[人物占位或描述] — [外貌细节], [服装/配饰], [动作/姿态] in/at [场景+环境氛围] —
```

---

## 三个必填项

### 1. 人物主体
**有参考图片时** → 始终用占位符代替人物描述，并在【①主题】模块末尾**强制追加**以下两句一致性声明：
```
<<<image_1>>>
<<<image_2>>>   ← 多人物时依次编号
```

⚠️ **有参考图时必须追加（缺一不可）：**
```
Keep the person exactly as shown in <<<image_1>>> with 100% identical facial features.
Keep clothing consistent with <<<image_1>>>.
```
这两句永远放在【①主题】内容的最末尾，紧接在场景描述之后。

**无参考图片时** → 详细描述外貌：
```
a [年龄感] [性别] [人种] with [发色+发型], [肤色特征],
[面部特征：sharp cheekbones / weathered skin / delicate features]
```

### 2. 服装与配饰（细节越具体越好）
```
wearing [服装材质+款式+颜色], [配饰1], [配饰2]

示例：
wearing a black sparkly deep-V crystal-embellished gown with high slit,
black elbow-length gloves, layered pearl necklace
```

### 3. 场景与环境
```
[动作/姿态] in/at [具体地点], [环境氛围细节]

示例：
standing center stage between two massive draped theatre curtains
sitting at a rain-soaked Tokyo street corner, neon signs reflecting on wet pavement
walking alone through a vast Icelandic lava field at dusk
```

---

## 神态与表情

表情词库已独立拆分，查阅 `references/09-expression.md` 获取完整分类词库（8大情绪类别，40+ 条物理描述）。

---

## 完整示例

```
<<<image_1>>> — a commanding woman with long platinum
silver-blonde wavy hair, deep red lips, wearing a black
sparkly deep-V crystal-embellished gown with high slit,
black elbow-length gloves, layered pearl necklace,
standing at absolute center stage between two massive
draped theatre curtains, chin raised, expression
powerful and untouchable —
```

```
A stoic Middle Eastern man in his 40s with weathered skin
and sharp jawline, wearing a dark linen shirt, standing
alone at the edge of a golden sand dune at sunset,
gaze fixed on the distant horizon, expression
calm and resigned —
```

---

## ⚠️ 注意事项

- 描述要**具体**，不要用泛指：`beautiful woman` ❌ → `woman with sharp cheekbones and platinum hair` ✅
- 服装材质很重要：`dress` ❌ → `silk slip dress with cowl neckline` ✅
- 场景要有**物理细节**：`city` ❌ → `rain-soaked Tokyo street, neon signs reflecting` ✅
