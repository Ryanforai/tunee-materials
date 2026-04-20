# Prompt 工程经验积累

> 本文件持续迭代，记录每次 prompt 修改任务中沉淀的方法、规则、心得。
> 最后更新：2026-04-17

---

## 一、新增视频模型的标准流程

每次引入一个新的 `video_model`，需要同步更新以下位置：

### Generation prompt
1. **Section 3 新增小节**：定义该模型的分段规则
   - Duration range（时长范围）
   - Segmentation procedure（分段步骤，编号列出）
   - scene_mode 声明（是否支持 one_take）
2. **Section 6 Output Gate**：在 Timeline checks 第 2 条里追加该模型的时长规则

### Modification prompt（含 memory 版）
1. **Section 3.1 / 4.1 Timeline Repair**：如果已引用 base prompt 的 Section 3，无需单独列规则，但 Output Gate 需单独更新
2. **Output Gate**：在 Timeline checks 的模型规则行追加新模型

### Field aliases & defaults
- 三个文件的 `video_model missing or empty` 默认值同步更新

### 模型规则写法模板
```
### X.X video_model = `model_name`

**Duration range per row**: Xs–Ys (any integer duration / 或离散值 {a, b, c})

**Segmentation procedure**:
1. ...
2. ...
3. 边界校验（< min → 合并；> max → 拆分）
4. 最后一行 endTime 强制等于 audio_duration（超出/不足的处理）
5. Music Structure cell 规则

**scene_mode**: `model_name` always uses `multiple_scenes`; `one_take` input → apply the single-row rule in Section 3 opening.
```

---

## 二、新增约束规则的标准流程

以「人物正对镜头」为例，说明如何在 prompt 中落地一个新的强制约束：

1. **写作规范区（画面描述写作规范）**：在对应 section 头部加 `[CRITICAL]` 标注，明确禁止的行为
2. **Output Gate**：在 Consistency checks 或对应检查区新增一条校验项，与写作规范呼应
3. **修复示例**：搜索所有 Example 的 output JSON，找出违反新规则的画面描述并修正
   - 常见违规：`侧对镜头`、`侧脸对着`、`背对`、`低头` 等措辞

> 心得：约束规则必须「三联」：写作规范定义 → Output Gate 校验 → Example 示范，缺一不可。只在规范里写但 Example 违规，会给模型错误的示范。

---

## 三、JSON Schema 字段顺序原则

**原则：简单结构在前，复杂结构在后。**

| 字段 | 类型 | 推荐位置 |
|---|---|---|
| `style_guide` | string | 第一位 |
| `md_stages` | string（Markdown 表格） | 第二位 |
| `mv_elements` | object（含 characters/scenes 数组） | 最后 |

Generation prompt、Modification prompt、Memory Modification prompt 三个文件的 Schema 和 Example output JSON 应保持一致的字段顺序。

---

## 四、三文件同步原则

lipsync 提示词由三个文件组成，修改时需同步检查：

| 文件 | 角色 | 关键同步点 |
|---|---|---|
| `mv_creative_script_lipsync_prompt.md` | 生成 | 新模型定义、默认值、Output Gate |
| `mv_creative_script_lipsync_modification_prompt.md` | 修改（单轮） | Output Gate 模型规则、默认值、Schema 字段顺序 |
| `mv_creative_script_lipsync_modification_prompt_memory.md` | 修改（多轮+历史） | 同上，额外注意 Revert mode 逻辑不受影响 |

> 心得：modification 文件的 Timeline Repair 引用了"see Section 3 of the base prompt"，因此 generation 文件的分段规则是单一来源。但 Output Gate 的模型时长校验每个文件必须独立列出，不能靠引用。

---

## 五、Token 优化策略（实战经验）

本次通过子 agent 对三个文件优化后，平均压缩 15–20%，主要方法：

| 方法 | 说明 |
|---|---|
| 合并重复定义 | `style_guide` 规则同时出现在 Hard Constraints 和 Style Guide 章节，保留一处，另一处压缩为一行引用 |
| 删除历史背景叙述 | 如"The three previously frozen columns now follow a tiered policy"之类的背景说明无助于模型执行 |
| 表格替代段落 | 修改范围分类（Local/Global/Character op/Scene op）用表格比段落更清晰且更省 token |
| 步骤列表替代长叙述 | Timeline Adaptation 四步改为编号列表，语义等价但结构更清 |
| 歧义短语删除 | "prefer the result closest to the model's preferred range"中"preferred range"无定义，删除比保留更安全 |

---

## 六、子 Agent 质检流程

每次完成重大改动后，开一个子 agent 做逻辑审查，prompt 模板如下：

```
你是一个严格的 Prompt 审查员。请完整读取以下文件，检查：
1. 逻辑一致性：各规则之间是否有矛盾
2. 覆盖完整性：新规则是否在所有应该出现的地方都被提及
3. 上下文清晰度：引用是否正确，表达是否有歧义
4. 冗余与漏洞：是否有重复定义或未覆盖的边界情况

文件路径：[列出路径]

不需要修改文件，只需给出审查报告，按文件和章节标注位置。
```

> 心得：质检 agent 和优化 agent 最好分开。质检只报告，优化才动文件。合并在一起时，agent 容易过度修改。

---

## 七、常见边界情况清单（lipsync 专项）

记录在写分段规则、校验规则时容易遗漏的边界：

- **最后一行 endTime 强制等于 audio_duration**：所有模型都有此要求，但处理方式不同
  - `infinite-talk`：直接 force，允许超出正常范围的最后一行
  - `wan_video_2_7`：force 后若超 15s 则拆，若不足 2s 则并入前一段
- **one_take 模式**：单行覆盖全程，所有分段规则跳过，三个模型统一处理
- **scene_mode 缺失**：默认 `multiple_scenes`
- **video_model 缺失**：现在默认 `wan_video_2_7`（曾经是 `infinite-talk`，2026-04-15 变更）
- **lyric cell 拼接**：多行歌词 join 用单空格，禁止换行符，所有模型一致
- **场景计数规则 Exception**：所有场景均只出现 1 次时，全部输出，不受"≥2 次才进 mv_elements"限制

---

## 八、多轮记忆改造经验（2026-04-17）

### 8.1 为什么同时携带 user_modification + ori_mv_guide

早期方案只存 mv_guide 快照（结果），模型只能看到"上一版变成了什么样"，但不知道"用户当时要求了什么"。这导致：

- 模型无法判断当前指令与历史指令的冲突关系
- 用户反复要求同一改动时，模型不确定是用户不满意还是新意图
- Revert 场景下，模型不知道要恢复到哪个语义状态

**改进**：每轮同时存储 `user_modification`（用户原话）+ `ori_mv_guide`（对应产出），让模型理解"因果关系"而不仅是"状态变化"。

### 8.2 新文件而非修改原文件的决策

memory 版提示词采用新增 `*_memory.md` 文件而非直接修改原文件的策略：

- 原文件作为回归基准，`history: []` 时行为必须完全一致
- 上游节点可按需选择版本，不需要条件判断
- 部署回滚成本低——切回原文件即可

### 8.3 Token 控制要点

- `style_guide` 不在快照中重复，因为它始终从 `ori_mv_guide` 原样复制
- 5 轮上限 + FIFO 丢弃，调用方也可根据 mv_guide 大小动态调整（如 >20 行时只保留 3 轮）
- 典型场景下 5 轮历史约 1,475 token，占比 < 5%

### 8.4 三文件同步改造的顺序

当三个 modification 文件需要同步改造时：

1. 先完成一个文件（推荐 lipsync，结构最清晰）作为模板
2. 将新增段落（Input Normalization、Multi-Round History、Execution Order）套用到其他两个
3. 最后统一检查各文件模式特定约束（如 lipsync 的 video_model 规则）未被覆盖

