# 模块⑩ 神态与表情词库（Expression Library）
> 回答：**人物的内心状态如何通过面部物理细节呈现**

词库按情绪大类分组，每条包含：**情绪标签 → 面部物理描述（可直接用于 prompt）**

---

## 🔥 强势 / 权威 / 不可侵犯

| 情绪标签 | 英文描述 |
|---------|---------|
| 强势不可侵犯 | `chin raised, jaw set, eyes heavy-lidded and unyielding` |
| 冷酷支配 | `flat affect, steady unblinking gaze, lips pressed in a thin line` |
| 傲慢轻视 | `one brow slightly arched, slight downward tilt of the chin, corners of mouth barely curled` |
| 掌控全局 | `calm eyes scanning the distance, jaw relaxed but deliberate, no visible tension` |
| 威压逼视 | `direct eye contact, pupils dilated, brow slightly furrowed, no smile` |

---

## 🌧 忧郁 / 内省 / 悲伤

| 情绪标签 | 英文描述 |
|---------|---------|
| 忧郁内省 | `downcast eyes, soft unfocused gaze, lips slightly parted, brow gently furrowed` |
| 压抑的悲伤 | `tight jaw, glassy eyes not quite crying, stillness in the face like held breath` |
| 失神凝视 | `eyes fixed at a point in the distance, no expression engaging the viewer, face slack` |
| 隐忍克制 | `eyes slightly red-rimmed, mouth closed firmly, chin held up despite visible effort` |
| 沉默的哀恸 | `head bowed, eyes closed or half-closed, brow carrying weight, face soft and collapsed inward` |

---

## 🥀 颓废 / 自溺 / 堕落美学

| 情绪标签 | 英文描述 |
|---------|---------|
| 颓废自溺 | `heavy-lidded eyes, slow gaze, lips slightly swollen, skin flushed at cheeks` |
| 放纵后的倦态 | `disheveled but intentional, smudged eye makeup, expression lazy and unashamed` |
| 迷醉游离 | `unfocused pupils, head tilted slightly back, lips parted, face tilted toward light` |
| 冷感享乐 | `expression flat but indulgent, eyes closed halfway, slight smirk with no warmth` |

---

## 🧊 冷静 / 疏离 / 空洞

| 情绪标签 | 英文描述 |
|---------|---------|
| 冷静疏离 | `neutral expression, eyes observing without engaging, no micro-expressions` |
| 情感抽离 | `blank gaze directed past the camera, face muscle-relaxed, no readable affect` |
| 职业性冷漠 | `composed and polished expression, mouth neutral, eyes alert but giving nothing away` |
| 空洞凝视 | `wide eyes but hollow, staring without seeing, slight parting of lips` |
| 超然物外 | `serene stillness, no tension in brow or jaw, gaze elevated as if watching something only they can see` |

---

## ⚡ 紧张 / 恐惧 / 脆弱

| 情绪标签 | 英文描述 |
|---------|---------|
| 脆弱敞开 | `eyes glistening, brows knitted slightly, mouth trembling at the corners` |
| 恐惧压抑 | `wide eyes, flared nostrils, jaw tight, skin pale and taut over the cheekbones` |
| 战栗前的静止 | `unnatural stillness, held breath visible in the chest, eyes scanning without moving the head` |
| 暴露无援 | `shoulders slightly drawn in, head tilted down, eyes looking up — exposed but unable to flee` |
| 崩溃边缘 | `reddened eyes, bitten lower lip, cheeks flushed unevenly, forehead slightly creased` |

---

## 😏 神秘 / 暧昧 / 诱惑

| 情绪标签 | 英文描述 |
|---------|---------|
| 神秘莫测 | `slight closed-lip smile that doesn't reach the eyes, gaze oblique, head angled` |
| 暗藏秘密 | `expression almost amused, eyes holding something back, one corner of mouth pulled subtly` |
| 危险诱惑 | `slow deliberate eye contact, relaxed posture but focused gaze, lips barely parted` |
| 戏谑轻挑 | `one eyebrow raised, light in the eyes, mouth caught between smirk and smile` |
| 无法解读 | `expression shifts depending on angle — from front: neutral; from side: almost smiling` |

---

## 😤 愤怒 / 对抗 / 燃烧

| 情绪标签 | 英文描述 |
|---------|---------|
| 压制的愤怒 | `jaw clenched, nostrils slightly flared, eyes narrowed and still, breath controlled` |
| 冷怒爆发前 | `unnaturally calm face with eyes burning, stillness that reads as dangerous` |
| 轻蔑对抗 | `eyes locked on target, chin down, slight sneer on the upper lip` |
| 燃烧的意志 | `brow furrowed hard, lips pressed, eyes bright and fierce, face forward-tilted` |

---

## 🌿 平静 / 接纳 / 温柔

| 情绪标签 | 英文描述 |
|---------|---------|
| 疲惫而有尊严 | `tired eyes that haven't given up, lines of exhaustion worn openly, quiet composure` |
| 温柔克制 | `soft eyes with slight upward corners, gentle set of the mouth, no tension in the brow` |
| 内心平和 | `face completely relaxed, eyes soft and present, breath visible in the chest as slow and even` |
| 接受命运的宁静 | `gaze lowered, expression neither sad nor happy, the stillness of someone who has let go` |

---

## ⚠️ 使用原则

- 表情描述必须落实到**面部物理细节**（眼睛/眉毛/嘴唇/下颌/肤色变化），不得使用泛情绪词
- ❌ 禁止：`sad expression`, `happy face`, `emotional look`
- ✅ 正确：`eyes glistening, brows knitted, mouth trembling at the corners`
- 每个 prompt 选 **1–2条**，过多会相互矛盾
- 表情词与神态应与整体场景、光影、色调**情绪自洽**

---

## 🎨 整体气质词（Atmosphere Keywords）
> 用于 prompt 末尾，对整张图的情绪做最终定性。最多选 **1–2个**，不可与面部表情矛盾。

**颓废 / 欲望系**
```
decadent and intoxicating atmosphere
sensual and languid atmosphere
opulent and suffocating atmosphere
```

**孤独 / 疏离系**
```
melancholic and alienated atmosphere
lonely and untouchable atmosphere
resigned and distant atmosphere
```

**庄严 / 史诗系**
```
monumental and inevitable atmosphere
vast and humbling atmosphere
timeless and austere atmosphere
```

**神秘 / 不安系**
```
uncanny and haunting atmosphere
eerie and suspended atmosphere
dreamlike and unsettling atmosphere
```

**温柔 / 治愈系**
```
tender and ephemeral atmosphere
bittersweet and nostalgic atmosphere
quiet and luminous atmosphere
```

**强势 / 权威系**
```
commanding and untouchable atmosphere
powerful and regal atmosphere
defiant and magnetic atmosphere
```

**都市 / 现代系**
```
detached and metropolitan atmosphere
cool and self-possessed atmosphere
sleek and guarded atmosphere
```

> ⚠️ 气质词不能替代物理描述：`dramatic and cinematic` ❌ → `decadent and intoxicating` ✅
