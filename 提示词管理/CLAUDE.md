# 提示词管理

## 项目简介

Tunee MV Studio 的提示词研究素材库。包含聊天代理路由、歌词处理、音乐生成流水线、视觉设计等各阶段的提示词探索文件。

---

## 文件结构

```
提示词管理/
├── chat_agent.md                  ← 前端聊天代理（意图识别/音频路由/能力校验/agent_create 决策）
├── extract_draft.md               ← 意图分析 + 字段决策（task_type/content/information_to_collect）
├── extract_new_taskform.md        ← Canvas→TaskForm JSON 结构化（生成 max 3 个 TaskForm）
├── music_process_reference.md     ← 参考音频处理（url/title/mode/reference mode 判定）
├── lyric_wiki_zh.md               ← 歌词知识库（中文版）
├── lyric_wiki_en.md               ← 歌词知识库（英文版）
├── lyrics_format.md               ← 歌词格式规范
├── music_title.md                 ← 音乐标题生成提示词
├── music_title_no_summary.md      ← 音乐标题生成（无总结版）
├── visual_designer_prompt_updated.md ← 视觉设计师提示词（更新版）
├── video_analysis.md              ← 视频分析提示词
├── understanding.md               ← 理解笔记
├── music_process_reference.md     ← 音乐处理参考
└── 提示词工程原则.md              ← 提示词工程最佳实践
```

---

## 核心文档：音乐生成流水线（4 个核心文件）

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
| `extract_new_taskform.md` | TaskForm 组装 | Canvas + Conversation + Last Requirement | `[{topic_title, create_title, user_instruction, user_requirement: {audio_type, prompt, lyric, reference_audio}, relevantContent}]` |
| `music_process_reference.md` | 参考音频处理 | 结构化任务 + 候选 URL | `{url, title, mode, start_time, end_time, oss_id, version}` |

### 关键概念映射（Audio Upload Intent → reference mode）

| taskform 意图 | draft 分类 | chat_agent 路由行 | music_process_reference mode |
|---|---|---|---|
| Cover (翻唱, 保持旋律) | CREATE 子类型 | Audio Router #2 | cover |
| Voice Extraction (提取人声) | CREATE 子类型 | Audio Router #1 | upload_vocal |
| Hum to Song (哼唱成曲) | CREATE 子类型 | Audio Router #3 | melody |
| Imitation (模仿/类似风格) | CREATE 子类型 | Audio Router #4 | imitation |
| Extension (续写/延长) | UPDATE | Audio Router #5 | extension |
| 全新创作 | CREATE | - | - (无 reference) |

### 已知待对齐事项

- negative_prompt：chat_agent 声明不支持，但 draft/taskform 有完整传递逻辑
- Extension 的 instrumental 阻断：draft 缺少，chat_agent/music_process_reference 都有
- Imitation 来源：chat_agent 支持 Canvas track，music_process_reference 仅支持上传音频
- Cover 模型限制（Mureka V9 Remix）仅 music_process_reference 提及
- MV 创建管线在 chat_agent 有完整路由，下游未建模
- reference_audio 的 taskform 输出 schema 与 music_process_reference 输入 schema 不完全兼容
- "TODO" 哨兵值在 draft 中使用，但 music_process_reference 无此概念

---

## 注意

此目录为提示词研究性质，部分文件为历史版本。生产用提示词请参考 [`创意分析/`](../创意分析/CLAUDE.md) 和 [`视频skill/`](../视频skill/CLAUDE.md)。
