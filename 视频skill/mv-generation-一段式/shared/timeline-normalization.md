# Timeline Normalize

**只做一件事：校验并纠正 `mv_guide.md_stages` 的时间段。检测到问题时在此处修复，不要重头重新加载所有文件。**

---

## 输入

`mv_guide.md_stages`（Markdown 表格），`audio_duration`（整数秒），`video_model`（model_key 字符串）。

### 解析

- 从 `时间段` 列提取每行的 `start` / `end`，格式如 `0s-8s` / `0-8`
- 浮点秒数立即四舍五入为整数
- 记录总行数

---

## 校验规则（5 项）

| # | 规则 | 违规示例 |
|---|------|---------|
| T0 | md_stages 至少 1 行 | 空表格 / 空数组 |
| T1 | 所有时间戳为整数秒，start < end | `0.5s-3.2s` |
| T2 | 首行 start = 0，末行 end = audio_duration | `1s-8s`（首行从1开始）|
| T3 | 相邻行连续：row[N].end == row[N+1].start，无间隙、无重叠 | `0-5` / `6-10`（gap 1s）或 `0-5` / `4-10`（overlap）|
| T4 | 每行时长在 model 合法范围内 | model min=4, 某行 `0-2`（2s 太短）|
| T5 | `one_take` 必须仅 1 行 | 2 行：`0-5s` + `5-10s` |

### 模型时长范围

| model_key | min_duration | max_duration | 总和约束 |
|-----------|-------------|-------------|---------|
| `seedance_2_0` | 4s | 15s | = audio_duration |
| `kling_3_0_omni` | 4s | 15s | = audio_duration |
| `wan_video_2_7` | 2s | 15s | = audio_duration |
| `infinite_talk` | 5s | 300s | — |
| `one_take` | = audio_duration | = audio_duration | 仅 1 行 |

未提供 model_key 时 → `wan_video_2_7`。

---

## 纠正规则

按顺序执行，每一步输出修正后的内部表格。

### R1：修复间隙（Gap）

row[N].end < row[N+1].start：

- 间隙 1-3s → 延长 row[N].end = row[N+1].start（吸收进前一行）
- 间隙 ≥ 4s → 新建一行填补，继承前一行的 scene/character/lyrics 为空

### R2：修复重叠（Overlap）

row[N].end > row[N+1].start：

- 将 row[N].end 提前 = row[N+1].start（截断前一行末尾）
- 若截断后 row[N] 时长 < min_duration，改为延长 row[N+1].start = row[N].end，并标记需要后续合并
- **修复后从 N=0 重新扫描全表**，防止截断引发与 row[N-1] 的级联重叠；**此重扫计入下方 3 轮总限制**

### R3：修复首尾

- 首行 start ≠ 0 → 强制设为 0
- 末行 end ≠ audio_duration → 强制设为 audio_duration
- 强制后若该行时长越界，触发 R4 或 R5

### R4：拆分超长行（duration > max_duration）

- 优先在歌词断句处分割
- 无断句可分 → 近似等分（奇数秒前段取较长值，如 17s → 9s + 8s）
- 分割后每段继承原行的 music_structure / scene / character，visual_description 标记需重生成

### R5：合并超短行（duration < min_duration）

- 与相邻行合并，优先与前一行；**若是首行则与后一行合并**
- 合并后歌词用空格连接，保留后一行的 music_structure 和 scene，union character

---

## 输出

全部通过 → 修正后的 `md_stages` 表格，继续后续步骤。

3 轮修复后仍有违规 → 追加 `_violations` 记录未修复项，继续后续步骤。
