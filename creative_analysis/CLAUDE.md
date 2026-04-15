# 剧本大纲节点

## 项目简介

Tunee MV Studio 的 AI 提示词库。每个文件是一个独立的 System Prompt，用于驱动 AI 模型生成 MV 分镜脚本（JSON 格式），供 MV 生成流水线使用。

---

## 文件结构

文件按用途分为两个子目录：

### `prompts/generation/` — 生成类

| 文件 | 用途 |
|---|---|
| `mv_creative_script_prompt.md` | 创意模式：根据 payload 生成完整 MV 创意导览 |
| `mv_creative_script_lipsync_prompt.md` | 创意模式（口型同步版）：生成含 lipsync 镜头的 MV 导览 |
| `mv_story_mode_script_prompt.md` | 故事模式：叙事驱动，强调角色动作与情节推进 |
| `mv_visions_script_prompt.md` | Visions 模式（具体用途见文件内容） |
| `mv_clone_mode_script_prompt.md` | Clone 模式：基于参考 MV 视觉 DNA，重组到新歌时间轴 |

### `prompts/modification/` — 修改类

| 文件 | 用途 |
|---|---|
| `mv_creative_script_modification_prompt.md` | 修改模式：对已有创意导览应用用户修改指令 |
| `mv_creative_script_lipsync_modification_prompt.md` | 修改模式（lipsync 版） |
| `mv_creative_script_modification_prompt_memory.md` | 修改模式（带 memory 上下文版） |
| `mv_creative_script_lipsync_modification_prompt_memory.md` | 修改模式（lipsync + memory 版） |
| `mv_clone_mode_modification_prompt.md` | Clone 修改模式：对已有 clone 导览应用用户修改指令，保持参考 MV 视觉保真度 |

---

## 输出格式规范

所有提示词的输出均为**纯 JSON**，顶层结构：

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
- 时间轴行时长约束：4s ≤ duration ≤ 15s（locked 行除外）

---

## 命名规律

```
mv_{模式}_{变体}_prompt{_memory}.md
```

- 模式：`creative_script` / `story_mode` / `visions` / `clone_mode`
- 变体：`lipsync`（口型同步）、`modification`（修改已有结果）
- 后缀：`_memory`（携带上下文记忆的版本）

---

## 修改提示词时的注意事项

- 每个文件的 Hard Constraints 部分是核心约束，修改前必须读懂
- `story_mode` 和 `creative` 模式的时间轴规则不同，不要混用
- `_memory` 变体与对应基础版本保持逻辑一致，改基础版时同步检查 memory 版
