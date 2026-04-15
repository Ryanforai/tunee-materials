# 视频测试

## 项目简介

Tunee MV Studio 视频生成相关的测试素材、提示词研究、图片和音频样本。包含各阶段的 prompt 探索文件、需求文档和视觉参考。

---

## 文件结构

```
视频测试/
├── 提示词文件 (.md)           ← 各类生成和分析用 prompt
├── 图片素材 (.png/.jpeg/.jpg) ← 视觉参考、截图、生成测试图
├── 音频样本 (.mp3/.MP3)       ← 测试用音乐片段
├── 文档 (.pdf)                ← 需求文档、技术评测、用户反馈
└── 其他测试文件
```

---

## 主要提示词文件

| 文件 | 用途 |
|------|------|
| `mv_creative_script_prompt.md` | MV 创意分镜脚本生成提示词 |
| `mv_modification_prompt.md` | MV 分镜修改提示词 |
| `storyboard_flow_prompt_story_mode.md` | 故事模式分镜流程提示词 |
| `storyboard_flow_prompt_visions.md` | Visions 模式分镜流程提示词 |
| `storyboard_flow_prompt_animated_pv.md` | 动画 PV 分镜流程提示词 |
| `visual_designer_prompt_updated.md` | 视觉设计师提示词（更新版）|
| `creative_analysis_gen.md` | 创意分析生成提示词 |
| `creative_analysis_regen.md` | 创意分析重生成提示词 |
| `character_design.md` | 角色设计提示词 |
| `lyrics_format.md` | 歌词格式规范 |
| `music_title.md` | 音乐标题生成提示词 |
| `extract_draft.md` | 草稿提取提示词 |
| `lyric_wiki_zh.md` / `lyric_wiki_en.md` | 歌词知识库（中/英） |

---

## 参考文档

| 文件 | 内容 |
|------|------|
| `视频生成-支持frame生成 需求文档.pdf` | frame 生成功能需求文档 |
| `用户反馈清单.pdf` | 用户反馈汇总 |
| `角色列表节点.pdf` | 角色列表节点设计文档 |
| `HeartMuLa 技术拆解.pdf` | 开源音乐生成模型技术分析 |
| `Tempolor i3 vs i3.5 纯音乐评测.pdf` | 音乐生成模型对比评测 |

---

## 注意

此目录为测试和研究性质，文件处于不同开发阶段，部分为历史版本。生产用提示词请参考 [`creative_analysis/`](../creative_analysis/CLAUDE.md)。
