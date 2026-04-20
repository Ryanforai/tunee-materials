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
| `music_title_no_summary.md` | 音乐标题生成（无总结版） |
| `test_cases_music_capabilities.md` | 音乐能力测试用例 |
| `test.md` | 测试文件 |
| `understanding.md` | 理解笔记 |

---

## 参考文档

| 文件 | 内容 |
|------|------|
| `视频生成-支持frame生成 需求文档.pdf` | frame 生成功能需求文档 |
| `用户反馈清单.pdf` | 用户反馈汇总 |
| `角色列表节点.pdf` | 角色列表节点设计文档 |
| `HeartMuLa 技术拆解.pdf` | 开源音乐生成模型技术分析 |
| `Tempolor i3 vs i3.5 纯音乐评测.pdf` | 音乐生成模型对比评测 |
| `音乐能力升级 - Cover等功能回归.pdf` | Cover 等功能回归需求文档 |

---

## 核心文档

### 音乐生成流水线（4 个核心文件）

这 4 个文件构成 Tunee 音乐创作的完整调用链路：

```
用户消息 + Canvas + 上下文
        │
        ▼
  chat_agent.md (Tunee 前端聊天代理)
  ── 意图识别 / 音频上传路由 / 能力校验 / agent_create 决策
        │  agent_create=2/3 触发生成
        ▼
  ┌──────────────────────────────────┐
  │ extract_draft.md                 │  extract_new_taskform.md
  │ 意图→任务类型 (update/create/    │  Canvas→TaskForm JSON 结构化
  │  research_create) / Copy vs TODO │  生成 max 3 个 TaskForm
  └────────┬─────────────────────────┘
           ▼
  music_process_reference.md
  选择参考音频 URL + 判定 reference mode
  (cover / upload_vocal / melody / imitation / extension)
           ▼
       下游执行生成
```

| 文件 | 角色 | 输入 | 输出 |
|------|------|------|------|
| `chat_agent.md` | 前端路由 | 用户消息 + Canvas + uploads + context | `{agent_create, message, options, language_code, model_reasoning, is_mv_creation}` |
| `extract_draft.md` | 意图分析 + 字段决策 | user_instruction + user_requirement + relevant_content | `{task_type, content: {prompt, lyric, negative_prompt, reference_audio, relevant_knowledge}, information_to_collect}` |
| `extract_new_taskform.md` | TaskForm 组装 | Canvas + Conversation + Last Requirement | `[{topic_title, create_title, user_instruction, user_requirement: {audio_type, prompt, lyric, reference_audio}, relevant_content}]` |
| `music_process_reference.md` | 参考音频处理 | 结构化任务 + 候选 URL | `{url, title, mode, start_time, end_time, oss_id, version}` |

**关键概念映射（Audio Upload Intent → reference mode）：**

| taskform 意图 | draft 分类 | chat_agent 路由行 | music_process_reference mode |
|---|---|---|---|
| Cover (翻唱, 保持旋律) | CREATE 子类型 | Audio Router #2 | cover |
| Voice Extraction (提取人声) | CREATE 子类型 | Audio Router #1 | upload_vocal |
| Hum to Song (哼唱成曲) | CREATE 子类型 | Audio Router #3 | melody |
| Imitation (模仿/类似风格) | CREATE 子类型 | Audio Router #4 | imitation |
| Extension (续写/延长) | UPDATE | Audio Router #5 | extension |
| 全新创作 | CREATE | - | - (无 reference) |

**已知待对齐事项（记录，不修改）：**
- negative_prompt：chat_agent 声明不支持，但 draft/taskform 有完整传递逻辑
- Extension 的 instrumental 阻断：draft 缺少，chat_agent/music_process_reference 都有
- Imitation 来源：chat_agent 支持 Canvas track，music_process_reference 仅支持上传音频
- Cover 模型限制（Mureka V9 Remix）仅 music_process_reference 提及
- MV 创建管线在 chat_agent 有完整路由，下游未建模
- reference_audio 的 taskform 输出 schema 与 music_process_reference 输入 schema 不完全兼容
- "TODO" 哨兵值在 draft 中使用，但 music_process_reference 无此概念

---

## 注意

此目录为测试和研究性质，文件处于不同开发阶段，部分为历史版本。生产用提示词请参考 [`creative_analysis/`](../creative_analysis/CLAUDE.md)。
