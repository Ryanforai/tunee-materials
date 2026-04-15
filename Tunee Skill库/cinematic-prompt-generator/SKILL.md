---
name: cinematic-prompt-generator
description: |
  生成高级感、电影感、真实感的 AI 图片提示词（适用于 Midjourney、Stable Diffusion、Nano Banana Pro 等工具）。
  
  当用户有以下需求时，必须使用此 Skill：
  - 要求"帮我写/生成图片提示词"
  - 上传参考图片，要求分析并生成对应提示词
  - 提到想要"电影感、高级感、真实感、大片感"的图
  - 提到 Midjourney、SD、Flux、Nano Banana 等 AI 图片工具
  - 要求"仿照某张图的风格生成提示词"
  - 提到"人物提示词"、"场景提示词"、"商业摄影提示词"
  
  核心能力：将用户模糊的视觉想法，转化为基于物理光学、摄影逻辑、色彩美学的精准提示词。
---

#  Cinematic Image Prompt Generator

基于九大物理维度生成电影级 AI 图片提示词的完整工作流。

详细知识库见 `references/` 目录，每个模块对应一个独立文档。

---

##  核心公式（9个模块，严格按序）

```
① 主题描述    →  references/01-subject.md
② 景别        →  references/02-shot-size.md
③ 构图        →  references/03-composition.md
④ 焦段 + 虚实 →  references/04-lens-dof.md
⑤ 明暗骨架    →  references/05-light-architecture.md
⑥ 冷暖阶级    →  references/06-color-hierarchy.md
⑦ 逻辑验证    →  references/07-logic-check.md   ← 质量门控，必须执行
⑧ 相机 + 胶片 →  references/08-camera-film.md
⑨ 神态+气质   →  references/09-expression.md    ← 面部表情 + 整体气质词
```

> ️ 模块⑦是质量门控：验证通过才能输出，发现矛盾必须返回修正。

---

##  执行流程

### STEP 1：识别输入类型

| 输入类型 | 处理方式 |
|---------|---------|
| 用户上传参考图片 | 逐维度分析图片（景别/构图/光影/色彩/胶片感），进入 STEP 2 |
| 用户描述场景或风格 | 确认：人物外貌 / 场景地点 / 期望情绪 / 参考风格，进入 STEP 2 |
| 用户提供人物图片 | 以 <<<image_1>>> 代替人物主体描述，进入 STEP 2 |

---

### STEP 2：逐模块构建（查阅对应 reference）

执行每个模块前，查阅对应的 `references/0X-xxx.md` 获取完整词库和规则。

**每个模块的核心问题：**

| 模块 | 核心问题 | Reference |
|------|---------|-----------|
| ① 主题 | 谁，在哪里，做什么，穿什么 | `01-subject.md` |
| ② 景别 | 观众站多远？触发什么心理距离感？ | `02-shot-size.md` |
| ③ 构图 | 主体在哪？眼睛如何流动？画面如何平衡？ | `03-composition.md` |
| ④ 焦段+虚实 | 空间是拉开还是压缩？主体和背景各自什么状态？ | `04-lens-dof.md` |
| ⑤ 明暗骨架 | 光从哪来？照亮哪里？反弹了什么颜色？ | `05-light-architecture.md` |
| ⑥ 冷暖阶级 | 主色是什么？辅色在哪里，占多少？ | `06-color-hierarchy.md` |
| ⑦ 逻辑验证 | 景别/焦段/景深自洽吗？光影自洽吗？色彩自洽吗？ | `07-logic-check.md` |
| ⑧ 相机+胶片 | 什么机器？什么胶片？颗粒感？画幅？ | `08-camera-film.md` |
| ⑨ 神态+气质 | 面部表情是什么？整体气质词是什么？ | `09-expression.md` |

---

### STEP 3：标准输出格式

内部按9个模块完成构建和逻辑验证（⑦必须通过），但**不对用户显示分块结构**。

最终只输出一段完整的英文 prompt，所有模块内容按以下顺序无缝合并，用逗号或换行自然衔接：

```
[①主题：人物/场景描述]
[②景别]
[③构图]
[④焦段 + 景深]
[⑤明暗骨架：光源宿主, 衰减路径, 反射填充]
[⑥色调]
[⑧相机 + 胶片]
[⑨神态+气质：面部表情（若有）, 气质词]
```

> ⑦逻辑验证在内部执行，不输出到最终 prompt。若验证失败，先修正相关模块再合并输出。

####  字数控制：严格不超过 500 词

合并后立即统计词数。若超过 500 词，按以下优先级裁剪，**直到符合上限为止**：

| 裁剪优先级 | 操作 |
|-----------|------|
| 1（最先删） | 删除⑨中的气质词，只保留面部表情核心词 |
| 2 | 构图描述只保留主体位置，删除视觉动线细节 |
| 3 | 明暗骨架合并为一句，删除衰减路径细节 |
| 4 | 色调只保留主色 + 辅色，删除比例说明 |
| 5（最后删） | 相机型号保留，胶片只留型号，删除颗粒/光学效果修饰词 |

> ️ 裁剪时**绝不删除**：①主题（人物/场景核心）、人物一致性语句（有参考图时）、景别、焦段、相机+胶片型号。这五项是 prompt 的骨架，删除会直接影响生图质量。



---

### STEP 4：最终质量检查（输出前内部执行）

- [ ] ⑤ 明暗骨架是否包含完整三层（光源宿主 / 衰减路径 / 反射填充）？
- [ ] ⑥ 是否声明了主色比例 + 辅色位置 + 辅色占比（<20%）？
- [ ] ③ 构图是否声明了主体位置 + 视觉动线 + 画面重量平衡三件事？
- [ ] ④ 焦段和景深是否物理自洽（广角≠浅景深 / 长焦=压缩+浅景深）？
- [ ] ⑦ 逻辑验证是否完成并通过所有三条检查线？
- [ ] 是否出现了禁止词（见下方禁止清单）？
- [ ] 若用户提供了人物图，是否在主题末尾追加了以下两句？
  - `Keep the person exactly as shown in <<<image_1>>> with 100% identical facial features.`
  - `Keep clothing consistent with <<<image_1>>>.`
- [ ] 最终输出是否为**单段合并 prompt**（无分块标题）？
- [ ] 词数是否在 **500 词以内**？若超出，是否已按裁剪优先级精简？

---

## ️ 禁止清单（永远不得出现在提示词中）

```
 情绪堆砌词：dramatic, epic, breathtaking, stunning, gorgeous, beautiful
 质量废话：8k, 16k, ultra-detailed, ultra-realistic, masterpiece, best quality
 矛盾组合：wide angle + extremely shallow depth of field
 矛盾组合：long shot + extreme bokeh background blur
 无源之光：ambient warm light（未指定任何光源实体）
 色彩无主次：warm light + cool light + rich colors（无比例声明）
```


