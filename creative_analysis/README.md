# Tunee MV Studio — AI Prompt Library

Tunee MV Studio 的 AI System Prompt 库。每个文件是一个独立的 System Prompt，驱动 AI 模型生成 MV 分镜脚本（JSON 格式），供 MV 生成流水线使用。

---

## 目录结构

```
prompts/
├── generation/          # 生成类：从零生成 MV 导览
│   ├── mv_creative_script_prompt.md
│   ├── mv_creative_script_lipsync_prompt.md
│   ├── mv_story_mode_script_prompt.md
│   ├── mv_visions_script_prompt.md
│   └── mv_clone_mode_script_prompt.md
└── modification/        # 修改类：对已有导览应用修改指令
    ├── mv_creative_script_modification_prompt.md
    ├── mv_creative_script_lipsync_modification_prompt.md
    ├── mv_creative_script_modification_prompt_memory.md
    ├── mv_creative_script_lipsync_modification_prompt_memory.md
    └── mv_clone_mode_modification_prompt.md
```

---

## 模式说明

### 生成模式（generation）

| 文件 | 模式 | 说明 |
|---|---|---|
| `mv_creative_script_prompt.md` | Creative | 根据 payload 生成完整 MV 创意导览 |
| `mv_creative_script_lipsync_prompt.md` | Creative + Lipsync | 生成含口型同步镜头的 MV 导览 |
| `mv_story_mode_script_prompt.md` | Story Mode | 叙事驱动，强调角色动作与情节推进 |
| `mv_visions_script_prompt.md` | Visions | 见文件内详细说明 |
| `mv_clone_mode_script_prompt.md` | Clone Mode | 提取参考 MV 的视觉 DNA（场景/运镜/色调/角色美学），重组到新歌时间轴 |

### 修改模式（modification）

| 文件 | 适配生成模式 | 说明 |
|---|---|---|
| `mv_creative_script_modification_prompt.md` | Creative | 对已有创意导览应用用户修改指令 |
| `mv_creative_script_lipsync_modification_prompt.md` | Creative + Lipsync | 同上，保留 lipsync 约束 |
| `mv_creative_script_modification_prompt_memory.md` | Creative | 携带 memory 上下文的修改版 |
| `mv_creative_script_lipsync_modification_prompt_memory.md` | Creative + Lipsync | 携带 memory 上下文的 lipsync 修改版 |
| `mv_clone_mode_modification_prompt.md` | Clone Mode | 对已有 clone 导览应用修改，保持参考 MV 的视觉保真度（分镜层级、场景库、人物外观库约束） |

---

## 输出格式

所有 prompt 的输出均为**纯 JSON**，禁止 Markdown 代码块包裹、额外说明文字或分析过程。

**顶层结构：**

```json
{
  "mv_guide": {
    "style_guide": "...",
    "md_stages": "| Time | Music Structure | Lyrics | Visual Description | Scene | Characters |\n|---|...",
    "mv_elements": {
      "characters": [
        {
          "index": 1,
          "name": "Explicit Name",
          "description": ["ethnicity gender; identity + personality + visual presence", "relationship + emotional state + role in MV"]
        }
      ],
      "scenes": [
        {
          "index": 1,
          "name": "Scene Name",
          "description": ["location + environment + atmosphere", "rendering prompt seed: 光线 / 色调 / 材质 / 动态 / 现实系数"]
        }
      ]
    }
  }
}
```

**`md_stages` 规则：**
- 列顺序：Time | Music Structure | Lyrics | Visual Description | Scene | Characters
- 每行时长约束：4s ≤ duration ≤ 15s（locked 行除外）
- `Music Structure` 列始终用英文，其余列跟随 `language_code`

---

## 命名规律

```
mv_{模式}_{变体}_prompt{_memory}.md
```

| 部分 | 可选值 |
|---|---|
| 模式 | `creative_script` / `story_mode` / `visions` / `clone_mode` |
| 变体 | `lipsync`（口型同步）、`modification`（修改已有结果） |
| 后缀 | `_memory`（携带上下文记忆的版本） |

---

## 开发注意事项

- 每个文件的 **Hard Constraints** 部分是核心约束，修改前必须读懂
- `story_mode` 和 `creative` 模式的时间轴规则不同，不要混用
- `_memory` 变体与对应基础版本保持逻辑一致，改基础版时同步检查 memory 版
- `clone_mode` 的修改版依赖 `video_analysis_results` 作为视觉参考资产，与 creative 修改版输入结构不同
