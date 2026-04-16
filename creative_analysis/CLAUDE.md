# 剧本大纲节点

## 项目简介

Tunee MV Studio 的 AI 提示词库。每个文件是一个独立的 System Prompt，用于驱动 AI 模型生成 MV 分镜脚本（JSON 格式），供 MV 生成流水线使用。

---

## 文件结构

文件按用途分为两个子目录：

### `prompts/generation/` — 生成类

| 文件 | 用途 |
|---|---|
| `mv_creative_script_lipsync_prompt.md` | Lipsync 模式：口型同步 MV，按 video_model 分段规则生成镜头序列 |
| `mv_story_mode_script_prompt.md` | 故事模式：叙事驱动，强调角色动作与情节推进 |
| `mv_visions_script_prompt.md` | Visions 模式：异世界物理规则驱动的视觉诗意风格 |
| `mv_clone_mode_script_prompt.md` | Clone 模式：基于参考 MV 视觉 DNA，重组到新歌时间轴 |

### `prompts/modification/` — 修改类

| 文件 | 用途 |
|---|---|
| `mv_creative_script_modification_prompt.md` | 修改模式：对已有创意导览应用用户修改指令 |
| `mv_creative_script_lipsync_modification_prompt.md` | 修改模式（lipsync 版） |
| `mv_clone_mode_modification_prompt.md` | Clone 修改模式：对已有 clone 导览应用用户修改指令，保持参考 MV 视觉保真度 |

---

## 输出格式规范

所有生成类提示词的输出均为**纯 JSON**，顶层结构：

```json
{
  "mv_guide": {
    "style_guide": "...",
    "md_stages": "Markdown 表格字符串",
    "mv_elements": {
      "characters": [...],
      "scenes": [...]
    }
  }
}
```

- 禁止输出 Markdown 代码块包裹、额外说明文字、分析过程
- `md_stages` 列顺序：Time | Music Structure | Lyrics | Visual Description | Scene | Characters
- 时间轴行时长约束：`story_mode` / `visions` / `clone_mode` 为 4s ≤ duration ≤ 15s（locked 行除外）；`lipsync` 按 `video_model` 分段规则（见下）
- 当 timeline normalization 经 3 次迭代仍有无法解决的违规时，输出中会出现顶层 `_violations` 数组（条件字段，无违规时省略）

### Lipsync 分段规则（按 video_model）

| video_model | 每行时长范围 | 末行约束 | 总和 |
|---|---|---|---|
| `infinite-talk` / `kling_avatar_2.0` | 5s–300s | ≥ 5s | — |
| `wan_video_2_6` | {5, 10, 15}s | {10, 15}s | = audio_duration |
| `one_take` | = audio_duration | — | 仅 1 行 |

---

## 命名规律

```
mv_{模式}_{变体}_prompt{_memory}.md
```

- 模式：`creative_script` / `story_mode` / `visions` / `clone_mode`
- 变体：`lipsync`（口型同步）、`modification`（修改已有结果）
- 后缀：`_memory`（携带上下文记忆的版本）

---

## Timeline Normalization 架构（story_mode / visions / clone_mode 共用）

三个模式的时间轴规范化流程统一为以下执行顺序：

1. **Step 0 — Section boundary pre-cut**（必须最先执行）：扫描 `lyrics_timeline`，在每处 section 标签变化处插入硬性行边界。后续所有步骤均不得跨 section 合并。
2. **Step 1 — Gap absorption**：吸收同 section 内的空隙（1–3s 合并入相邻行；≥ 4s 新建空歌词行）。
3. **Step 2 — Short row merge**：合并 < 4s 的行（仅同 section，严禁跨 section）；含 Deadlock escape 路径。
4. **Step 3 — Emotion-driven merging**：连续情绪方向的相邻同 section 行合并（严禁跨 section）。
5. **Step 4 — Long row split**：拆分 > 15s 的行（仅在 section 内拆分）。
6. **Verify pass**：检查 6 项（整数秒、首行起始=0、末行结束=audio_duration、相邻行连续无缝、4–15s、无跨 section）。最多 3 次迭代，仍有违规记入 `_violations`。

`visions` 模式额外要求在 Section 5.6（Timeline Anchoring）中预先计算各 section 的行数预算，然后再触发上述流程。

---

## 修改提示词时的注意事项

- `story_mode` / `visions` / `clone_mode` 的 timeline normalization 逻辑已统一，修改时保持三个文件一致
- `lipsync` 的分段规则与上述模式完全独立，不要混用
- `wan_video_2_6` 算法依赖整除性（audio_duration 须为 5 的倍数），遇到非整除情况会有近似处理
- `_violations` 是条件输出字段，只在真实违规时存在；修改任何时间轴规则时需同步检查 `_violations` 逻辑
