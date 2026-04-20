# Timeline Normalization 技术规格 v2 (Final)

> 将 lyrics_timeline（歌词时间轴）处理为符合硬约束的 `normalized_rows[]` + `segments[]`。
> 确定性算法，无创意判断，从 prompt 移至后端代码实现。

---

## 一、输出硬约束

| 约束 | 规则 |
|------|------|
| 时间类型 | `startTime` / `endTime` 为整数秒（`round()`） |
| 行时长 | 非锁定行 duration ∈ **[4s, 15s]** |
| 连续性 | `row[i].end == row[i+1].start`，无间隙无重叠 |
| 全覆盖 | `row[0].start == 0`，`row[-1].end == audio_duration` |
| **结构完整性** | **不同 base section 的行禁止合并**（宁留短行不跨段） |

> 例外：`audio_duration < 4s` 时硬约束降级为"尽力而为" + warning。

---

## 二、常量

```
MIN_DURATION    = 4s       # 硬下限
TARGET_DURATION = 8s       # 软目标，同 section 内合并到此以上
MAX_DURATION    = 15s      # 硬上限
SWEET_SPOT      = (10, 14) # 合并理想区间
```

---

## 三、核心规则

### 3.1 锁定行（Locked Row）

**识别**：歌词匹配以下正则 → locked：
- `^\[inst(rumental)?(\s*:.*?)?\]$`
- `^\[music\]$`
- `^\[interlude\]$`

**规则**：
- 锁定行不参与主动合并
- duration < 4s 的锁定行 → 解锁，转为普通行
- **duration > 15s 的锁定行 → 拆分**（保持 `isLocked=True`，每段 4-15s）
- 锁定行歌词清空（仅保留 section）

### 3.2 合并铁律（所有合并步骤通用）

| 规则 | 说明 |
|------|------|
| **禁止跨 section 合并** | 不同 base section（Verse ≠ Chorus）的行永远不合并。宁可留一个 <4s 短行 + warning，也不把 Verse 尾和 Chorus 头焊在一起 |
| **section 归属** | 合并后 section 取**时间线靠前**的行（观众感知以进入时刻为准），不按 duration 选 |
| **歌词拼接** | 双方均为 CJK 字符 → 直接拼接无空格；否则空格分隔 |
| **MAX_DURATION 守卫** | 任何合并结果 > 15s → 不允许执行 |

### 3.3 Section 匹配

**base 匹配**（仅用于 segment 边界判断）：
- `"Verse 1"` → `"Verse"`，`"Chorus 2"` → `"Chorus"`

**完整匹配**（用于合并决策）：
- `"Chorus 1" ≠ "Chorus 2"` → 不合并
- 避免把歌曲中不同位置出现的同名段落混为一行

---

## 四、处理流水线

### Step 0: 入口特判

```
if audio_dur <= 0  → 返回空 + warning
if audio_dur < 4   → 单行 [0, audio_dur] + warning，跳过后续
```

### Step 1: 预处理

- 时间 `round()` → 整数秒，clamp 到 `[0, audio_dur]`
- 按 `(start, end)` 排序
- 去重叠：`row[i].end = min(row[i].end, row[i+1].start)`
- **完全覆盖（duration ≤ 0）的行**：歌词合并到下一行后删除，写入 warning
- 部分截断（duration 缩减 > 50%）：写入 warning，保留完整歌词
- 移除 duration ≤ 0 的行

### Step 2: 纯器乐兜底

- 输入为空 或 所有行都 locked → 按 ~12s 等分，标为 `"Instrumental"`

### Step 3: 解锁短锁定行

- `is_locked && duration < 4s` → 解锁

### Step 4: 吸收器乐行

- 目标：无歌词、非锁定的行
- 被相邻**同 section** 有歌词的行吸收，合并后 ≤ 15s
- 优先有歌词邻居 > 同 section 邻居 > 前方邻居
- **不跨 section 吸收**

### Step 5: 填补间隙

- 间隙 ≤ 3s → 吸收进相邻非锁定行（先前方、后后方）
- 间隙 ≤ 3s 且两侧都无法吸收（locked / 已满 15s）→ **从较长的相邻行借时间**（调整该行 end/start 边界扩展），不创建独立短行
- 间隙 ≥ 4s → 创建新空行，section 继承逻辑：
  - 前后行同 section → 继承
  - 前后行不同 section → 标为 `"Interlude"`
  - 歌曲开头无前行 → `"Intro"`

### Step 6: 合并短行

循环执行直到无 < 4s 非锁定行。**加迭代上限 = `len(rows) * 3`，超限 → warning + 退出。**

**Phase A — 同 section 邻居合并**：
- 找非锁定、**同 base section** 邻居
- 合并后 ≤ 15s，优先接近 sweet spot (10-14s)
- **不同 section 的邻居直接跳过**

**Phase B — 被锁定行夹住**：
1. 向两侧贪心扩展锁定邻居，**检查 total ≤ MAX_DURATION**
2. 达标 → 合并为一个非锁定行
3. 超限 → **Phase B2：拆分锁定邻居**
   - 选较短的锁定邻居
   - 从中点拆分（两段均解锁）
   - 短行与近侧半段合并
   - 远侧半段成为独立行（≥ 4s 有保障，因为原锁定行 ≥ 4s → 半段 ≥ 2s... 见下方安全证明）

> **Phase B2 安全证明**：原锁定行 duration ≥ 4s（< 4s 已在 Step 3 解锁），拆半后每段 ≥ 2s。短行 + 近侧半段 ≤ 3 + 7 = 10 ≤ 15 ✓。远侧半段若 < 4s → 下一轮迭代会继续处理。最坏情况：锁定行恰好 4s → 拆成 2+2，短行(3)+近(2)=5 ✓，远(2) < 4 → 下一轮被后面的行吸收。链式收敛有保障，因为每次拆分严格增加非锁定行数量。

**Phase C — 死锁逃逸**：
- 找**同 base section** 非锁定邻居（不同 section 拆了也合不了，跳过留给 Phase D/E）
- 拆分前检查：两个产物是否都 ≥ MIN_DURATION
  - 是 → 拆分，触发下轮合并
  - **否 → 跳过拆分**（避免 split↔merge 死循环）

**Phase D — 借时间（跨 section）**：
- 当 Phase A-C 全部因 section 限制走不通时触发
- 从余量最大的非锁定邻居借 `need = MIN_DURATION - r.duration` 秒
- **可跨 section**：不合并内容，仅调整时间边界
- 邻居缩短 need 秒（须仍 ≥ MIN_DURATION），短行扩展 need 秒
- 典型场景：`[Verse 12s] [Pre-Chorus 3s] [Chorus 12s]` → Verse 缩到 11s，Pre-Chorus 扩到 4s

**Phase E — 强制跨 section 合并（最后手段）**：
- 当 Phase A-D 全部走不通时触发（邻居余量不足以借时间）
- 直接与非锁定邻居合并，**无视 section 差异**，合并后 ≤ MAX_DURATION
- 优先选最小合并结果（减少级联膨胀）
- section 取时间线靠前行，歌词正常拼接
- 写入 warning 标记强制合并
- 典型场景：`[Verse 3s] [Chorus 3s]` 数学上不可能各达 4s → 合并为 `[Verse 6s]`

**Fallback**：Phase E 也无法执行（所有邻居为 locked 且 Phase B 失败）→ 保留短行 + warning，不崩溃

### Step 7: 同 Section 合并

- 相邻行**完整 section 名相同**（"Chorus 1" == "Chorus 1"，≠ "Chorus 2"）
- 至少一方 < TARGET_DURATION (8s)
- 合并后 ≤ MAX_DURATION (15s)
- 目标：把碎片行合并成 8-15s 的完整段

### Step 8: 拆分长行

- duration > 15s → 拆成 N 段（**locked 行也拆，保持 `isLocked=True`**）
- `N = max(2, ceil(duration / 13))`，保证每段 ≥ 4s
- **非 locked 行歌词分配**：
  1. 按 `\n` 分割歌词
  2. `\n` 不足 → 按中文句号 `。`、逗号 `，`、英文句号 `.` 分割
  3. 将分割后的句子按时间比例分配到各段
  4. 分割点不足 → 全部歌词归入第一段（fallback）
- **locked 行**：拆分后每段无歌词，保持 locked 标记和原 section
- **空歌词非 locked 长行**（器乐段 > 20s）：section 强制改为 `"Instrumental"`，防止继承的 "Chorus" 等标签误导下游情绪匹配

### Step 9: 收敛校验

循环最多 **20 次**（从 10 上调），依次检查：
1. 短行（< 4s 非锁定） → 调 merge_short_rows
2. 长行（> 15s，**含 locked**） → 调 split_long_rows
3. 覆盖性（首行 start=0，末行 end=audio_dur） → 调 fill_gaps
4. 连续性（相邻行无间隙） → 调 fill_gaps

全部通过 → 退出。20 次未收敛 → warning。

---

## 五、Segment 生成

### 切分规则

| 条件 | 处理 |
|------|------|
| 歌曲 ≤ 90s | 整首 = 1 个 segment |
| section 边界变化 | 按预定义边界对切分（见下表） |
| 无自然边界 | 按行数中点切分（≥ 2 行时） |
| 仅 1 行 | 单 segment，不切分 |

### 预定义边界对（base 匹配）

```
Intro      → Verse, Pre-Chorus
Verse      → Chorus, Pre-Chorus, Bridge
Pre-Chorus → Chorus
Chorus     → Verse, Bridge, Interlude, Outro
Drop       → Verse, Chorus, Bridge
Bridge     → 任意（作为 A 时通配）
Interlude  → 任意（作为 A 时通配）
任意        → Bridge（作为 B 时也触发）
任意        → Outro
```

> 相比 v1 新增：`Verse→Bridge`、`Drop→Verse/Chorus/Bridge`、`任意→Bridge`。

### 后处理

- 过滤空 segment（rowCount = 0）
- 小段合并：≤ 2 行且 < 20s → 并入前一段
- 大段拆分：> 10 行 → 从中点一分为二

---

## 六、合并时的 Section 归属（完整规则）

| 场景 | Section 取自 | 歌词处理 |
|------|-------------|----------|
| 同 section 合并 | 保持该 section | CJK 直接拼接 / 非 CJK 空格拼接 |
| 吸收器乐行 | 歌词行的 section | 保留歌词行歌词 |
| Phase B 吸收锁定行 | 非锁定行的 section | 保留非锁定行歌词 |
| **不同 section** | **禁止合并** | — |

---

## 七、安全保障

### 7.1 循环终止保障

| 循环 | 终止条件 | 安全机制 |
|------|---------|---------|
| `merge_short_rows` | 无 < 4s 非锁定行 | 迭代上限 `len(rows) * 3 + 20` |
| `absorb_instrumentals` | 无可吸收行 | 行数单调递减 → 自然终止 |
| `merge_same_section` | 无可合并对 | 行数单调递减 + 迭代上限 `len(rows) * 2 + 10` |
| `validate_and_fix` | 无违规 | 最多 20 次迭代 |

### 7.2 Phase C 死循环防护

旧代码问题：5s 行 split 成 2s+3s → 下轮 merge 回 5s → 无限循环。

**修复**：split 前检查两个产物是否都 ≥ 4s。不满足 → 跳过该行，写 warning。

### 7.3 fill_gaps 不产生 < 4s 独立行

间隙 < 4s 时一定通过吸收或借时间解决，**永远不创建 duration < 4s 的独立行**。

### 7.4 所有 merge 都检查 MAX_DURATION

包括 Phase B 吸收锁定行。超限时走 Phase B2（拆分锁定行）而非直接合并。

### 7.5 极端输入兜底

| 输入 | 处理 |
|------|------|
| `audio_duration ≤ 0` | 返回空 + warning |
| `audio_duration < 4s` | 单行覆盖全长 + warning |
| 空 timeline | 纯器乐兜底（等分） |
| 全 locked | 纯器乐兜底（等分） |
| 严重重叠 | 截断 + 保留歌词 + warning |
| 合并死锁（所有路径失败） | 保留短行 + warning，不崩溃 |

---

## 八、输出结构

```json
{
  "normalized_rows": [
    {
      "startTime": 0,
      "endTime": 8,
      "duration": 8,
      "section": "Intro",
      "lyrics": "",
      "isLocked": false
    }
  ],
  "segments": [
    {
      "segmentIndex": 0,
      "sections": ["Intro", "Verse"],
      "startTime": 0,
      "endTime": 45,
      "rowCount": 5,
      "rows": ["...同 normalized_rows 结构"]
    }
  ],
  "warnings": []
}
```

---

## 九、研发 Checklist

实现时逐条打勾，确保无遗漏：

- [ ] 所有 `while changed` 循环有迭代上限
- [ ] Phase C split 前检查产物 ≥ 4s
- [ ] Phase B 吸收锁定行前检查 ≤ 15s
- [ ] 不同 base section 的行永不合并
- [ ] `merge_same_section` 用完整 section 名比较
- [ ] fill_gaps 不创建 < 4s 独立行
- [ ] split_long_rows 按句子分配歌词
- [ ] 中文歌词拼接不加空格
- [ ] 空歌词长行（>20s）section 标为 Instrumental
- [ ] segment 过滤空段
- [ ] 边界对包含 Verse→Bridge、Drop→X、X→Bridge
- [ ] audio_dur < 4s 特判
- [ ] 重叠截断时写 warning
- [ ] 合并死锁时写 warning 不崩溃
- [ ] 最终输出前做一次全量约束校验（断言级别）
