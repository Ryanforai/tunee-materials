# Timeline Normalization 核心规则

> 研发实现用。输入歌词时间轴 → 输出 4-15s 的行 + 分段。

---

## 约束

```
每行 duration ∈ [4s, 15s]（整数秒）
行连续无间隙：row[i].end == row[i+1].start
全覆盖：[0, audio_duration]
不跨 section 合并
```

## 常量

```
MIN = 4s    MAX = 15s    TARGET = 8s    SWEET = (10,14)
```

## 流水线

```
入口特判 → 预处理 → 纯器乐兜底 → 解锁短locked → 吸收器乐行
→ 填间隙 → 合并短行 → 同section合并 → 拆长行 → 收敛校验 → 生成segment
```

---

## 1. 入口特判

- `audio_dur ≤ 0` → 返回空
- `audio_dur < 4` → 单行 `[0, dur]` + warning

## 2. 预处理

- round 整数秒，clamp `[0, dur]`，按 `(start, end)` 排序
- 重叠 → 截前行 `row[i].end = row[i+1].start`
- **完全覆盖（duration≤0）→ 歌词合并到下一行后删除**
- 删 duration≤0 的行

## 3. 纯器乐兜底

- 全 locked 或空 → 按 ~12s 等分，标 `"Instrumental"`

## 4. 解锁短 locked

- locked 且 duration < 4s → 解锁

## 5. 吸收器乐行

- 无歌词 + 非 locked 的行 → 被同 section 有歌词邻居吸收
- 合并后 ≤ 15s，不跨 section

## 6. 填间隙

- ≤ 3s 间隙 → 吸收进相邻行（前优先）
- 两侧都不能吸收 → 从较长邻居借时间（调边界），**不创建 < 4s 独立行**
- ≥ 4s 间隙 → 建新空行，section 标 `"Interlude"`

## 7. 合并短行（< 4s）

循环直到无违规，**迭代上限 `len(rows) * 3`**。

| 阶段 | 条件 | 动作 |
|------|------|------|
| A | 有同 section 非 locked 邻居，合并后 ≤ 15s | 合并，优先接近 sweet spot |
| B | 被 locked 行夹住 | 贪心吸收 locked 邻居（≤ 15s） |
| B2 | B 超 15s | 拆 locked 邻居中点，近半段合并，远半段独立 |
| C | 有**同 section** 非 locked 邻居可拆 | 拆邻居中点 → 重新触发合并 |
| C 守卫 | 拆出的两段有任一 < 4s，或邻居不同 section | **跳过不拆** |
| D | 所有同 section 路径都走不通 | **从相邻行借时间**（可跨 section）：邻居缩小 need 秒，短行扩展到 ≥ 4s，邻居须仍 ≥ 4s |
| E | D 也不可用（邻居余量不足） | **强制跨 section 合并**：直接和邻居合并，优先最小结果，写 warning |
| 全失败 | E 也不可用（邻居全 locked） | 保留短行 + warning，不崩溃 |

**原则：尽力尊重 section 边界（A→D），实在不可能时强制合并确保 4-15s（E）。**

## 8. 同 Section 合并

- 相邻行 section **完整名相同**（Chorus 1 ≠ Chorus 2）
- 至少一方 < 8s，合并后 ≤ 15s → 合并

## 9. 拆长行（> 15s）

- **locked 和非 locked 都拆**，locked 拆分后保持 `isLocked=True`
- `N = max(2, ceil(dur / 13))`，每段 ≥ 4s
- 非 locked：歌词按 `\n` > `。，.` > 比例 分配到各段
- locked：拆分后无歌词，保持原 section
- 空歌词非 locked + >20s → section 改 `"Instrumental"`

## 10. 收敛校验

- 最多 20 轮：检查短行→长行（**含 locked**）→覆盖→连续性，违规则调对应修复
- 20 轮未收敛 → warning

## 11. Segment 生成

- ≤ 90s → 单 segment
- 按 section 边界切（base 匹配）：

```
Intro → Verse/Pre-Chorus     Verse → Chorus/Pre-Chorus/Bridge
Pre-Chorus → Chorus           Chorus → Verse/Bridge/Interlude/Outro
Drop → Verse/Chorus/Bridge    Bridge/Interlude → 任意
任意 → Bridge/Outro
```

- 过滤空段，小段（≤2行 <20s）并入前段，大段（>10行）中点拆分

---

## 合并行为速查

```
section 归属 → 时间线靠前的行
歌词拼接   → CJK 直接拼，非 CJK 空格拼
locked 行  → 识别 [instrumental]/[music]/[interlude]，< 4s 解锁
```

---

## 输出

```json
{
  "normalized_rows": [{ "startTime", "endTime", "duration", "section", "lyrics", "isLocked" }],
  "segments": [{ "segmentIndex", "sections", "startTime", "endTime", "rowCount", "rows" }],
  "warnings": []
}
```
