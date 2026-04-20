# 音乐能力意图识别测试 Case

## 测试说明
每个 case 包含：用户输入、附件、上下文、预期 chat_agent 输出、预期 extract_new_taskform 输出。

---

## T1: Cover — 上传音频 + 明确翻唱意图

**用户输入**: "Cover this with a rock style, keep the melody"
**附件**: [audio: moonlight.mp3]
**Canvas**: 空

**预期 chat_agent**:
- agent_create: 3 (options, quick_mode=false) 或 2 (quick_mode=true)
- Capability: Cover
- OPTIONS LOGIC: Scenario A1
- model_reasoning: STEP1B → Capability=Cover

**预期 extract_new_taskform**:
- audio_type: song
- reference_audio: Fill (from_user, melody source)
- relevant_content: []

---

## T2: Cover — Canvas 已有歌曲 + 翻唱意图

**用户输入**: "把《月光》翻唱成爵士版本"
**附件**: 无
**Canvas**: gen-001 | "Night Songs" > "月光" | file-001

**预期 chat_agent**:
- agent_create: 3 或 2
- Capability: Cover
- reference: Canvas track

**预期 extract_new_taskform**:
- audio_type: song
- reference_audio: Fill (from_generated, melody source)
- relevant_content: ["gen-001"]

---

## T3: Cover — 保持旋律 + 换风格

**用户输入**: "Keep the melody but change the style to acoustic"
**附件**: [audio: original.mp3] 或引用 Canvas

**预期 chat_agent**:
- agent_create: 3 或 2
- Capability: Cover
- "keep melody" → Cover 触发

**预期 extract_new_taskform**:
- audio_type: song
- reference_audio: Fill

---

## T4: Voice Clone — 上传人声 + 克隆意图

**用户输入**: "用这个声音唱一首情歌"
**附件**: [audio: vocal_sample.mp3] (15-30s 人声)

**预期 chat_agent**:
- agent_create: 2 (direct execute)
- Capability: Voice_Clone
- model_reasoning: STEP1B → Capability=Voice_Clone

**预期 extract_new_taskform**:
- audio_type: song
- reference_audio: Fill (from_user, voice sample)
- relevant_content: []

---

## T5: Voice Clone — 无音频 + 纯文本克隆请求 → 拦截

**用户输入**: "帮我克隆这个歌手的声音"
**附件**: 无

**预期 chat_agent**:
- agent_create: 5
- message: "暂不支持对话触发音色转换（Vocal Change），请在对应的音色卡片中操作，或先上传一段音频作为声音参考"

---

## T6: Hum to Song — 上传哼唱 + 成曲意图

**用户输入**: "把这个哼唱做成一首完整的歌"
**附件**: [audio: humming.mp3] (30s)

**预期 chat_agent**:
- agent_create: 3 或 2
- Capability: Hum_To_Song
- OPTIONS LOGIC: Scenario A2

**预期 extract_new_taskform**:
- audio_type: song
- reference_audio: Fill (from_user, melody to expand)
- relevant_content: []

---

## T7: Hum to Song — MIDI 上传

**用户输入**: [上传 midi 文件]
**附件**: [audio: melody.midi]

**预期 chat_agent**:
- agent_create: 3 或 2
- Capability: Hum_To_Song
- MIDI → 仅支持哼唱成曲

**预期 extract_new_taskform**:
- audio_type: song
- reference_audio: Fill (from_user)
- relevant_content: []

---

## T8: Hum to Song — 口哨/哼唱关键词

**用户输入**: "我哼了一段旋律，帮我扩展成完整的曲子"
**附件**: [audio: whistle.mp3]

**预期 chat_agent**:
- agent_create: 3 或 2
- Capability: Hum_To_Song
- "哼/扩展成曲" → Hum to Song 触发

---

## T9: Imitation — 上传音频 + 风格参考意图

**用户输入**: "参考这首歌的感觉，创作一首类似的"
**附件**: [audio: reference.mp3]

**预期 chat_agent**:
- agent_create: 3
- Capability: Song_Imitation
- OPTIONS LOGIC: Scenario A (reference-based)
- Copyright statement required

**预期 extract_new_taskform**:
- audio_type: song
- reference_audio: Fill (style reference)
- relevant_content: []

---

## T10: Extension — Canvas 已有歌曲 + 续写意图

**用户输入**: "把《月光》续写一下，再加一段"
**附件**: 无
**Canvas**: gen-001 | "Night Songs" > "月光" | file-001 (audio_type=song)

**预期 chat_agent**:
- agent_create: 2
- Capability: Song_Extension

**预期 extract_new_taskform**:
- audio_type: song
- reference_audio: Fill (extension)
- relevant_content: ["gen-001"]

---

## T11: Extension — 纯音乐续写 → 拦截

**用户输入**: "把这个纯音乐续写一下"
**附件**: 无
**Canvas**: gen-002 | "Instrumentals" > "Rain" | file-002 (audio_type=instrumental)

**预期 chat_agent**:
- agent_create: 5
- message: "纯音乐/器乐作品暂不支持续写，我可以为你创作风格相似的新曲目"

---

## T12: 区分 Cover vs Imitation — 关键边界

| Case | 用户输入 | 预期 Capability | 区分依据 |
|------|---------|----------------|---------|
| T12a | "Cover this song" | Cover | "Cover" 关键词 |
| T12b | "翻唱这首歌" | Cover | "翻唱" 关键词 |
| T12c | "参考这首歌的风格创作一首新歌" | Song_Imitation | "参考风格" = 风格参考，旋律全新 |
| T12d | "保持旋律，换个风格唱" | Cover | "保持旋律" = Cover 核心信号 |
| T12e | "模仿这首歌的感觉" + [audio: reference.mp3] | Song_Imitation | "模仿" = Imitation 关键词 + 音频附件 |
| T12f | "Make a song similar to this" + [audio: reference.mp3] | Song_Imitation | "similar" = Imitation + 音频附件 |
| T12g | "用这首歌的旋律，但换成爵士风格" | Cover | "用这首歌的旋律" = 旋律保留 |

---

## T13: 区分 Voice Clone vs Cover

| Case | 用户输入 | 预期 Capability | 区分依据 |
|------|---------|----------------|---------|
| T13a | "用这个声音唱一首新歌" | Voice_Clone | "用这个声音" + "新歌" = 音色克隆 |
| T13b | "克隆这个音色" | Voice_Clone (有音频) / agent_create=5 (无音频) | 有音频→路由，无音频→拦截 |
| T13c | "Cover this song" | Cover | "Cover" = 翻唱，旋律保留 |
| T13d | "换个人唱这首歌" | Cover | 隐含"同一首歌不同声音" = Cover |

---

## T14: 区分 Hum to Song vs Extension

| Case | 用户输入 | 预期 Capability | 区分依据 |
|------|---------|----------------|---------|
| T14a | "把这个哼唱做成完整的歌" | Hum_To_Song | "哼唱" + "做成歌" = 哼唱成曲 |
| T14b | "续写这首歌" | Song_Extension | "续写" = 从末尾接上 |
| T14c | "把这段旋律扩展成完整的曲子" (上传哼唱) | Hum_To_Song | 上传的是哼唱，不是已有歌曲 |
| T14d | "把这个片段继续写下去" (引用 Canvas 歌曲) | Song_Extension | 引用 Canvas + "继续" = 续写 |

---

## T15: 纯文本请求（无音频）

| Case | 用户输入 | 预期 agent_create | 预期 Capability |
|------|---------|-------------------|----------------|
| T15a | "帮我写一首关于夏天的歌" | 3 | Song (默认) |
| T15b | "写歌词" | 3 | not_required (纯文本服务) |
| T15c | "做首纯音乐" | 3 | Instrumental |
| T15d | "支持哼唱成曲吗" | 4 | Query: Hum_To_Song |

---

## T16: 模型能力校验

| Case | 用户输入 | user_choice_models | 预期结果 |
|------|---------|-------------------|---------|
| T16a | "Cover this song" | [model_not_in_cover_whitelist] | 自动切换到 Cover 支持模型 |
| T16b | "用我的哼唱做成歌" | [] (empty) | Supported (auto-select) |
| T16c | "voice clone" (有音频) | [model_not_in_vc_whitelist] | 自动切换到 Voice_Clone 支持模型 |
| T16d | "支持 Cover 功能吗" | [] | agent_create=4, Query: Cover |

---

## T17: 组合场景

| Case | 用户输入 + 附件 | 预期 Capability |
|------|----------------|----------------|
| T17a | "Cover 这首歌，换成女声" + Canvas 引用 | Cover (旋律保留，音色改变) |
| T17b | "用这个哼唱的旋律，Cover 成爵士" + 上传哼唱 | Hum_To_Song (哼唱优先于 Cover) |
| T17c | "参考这首歌，用我的声音唱" + Canvas + 上传人声 | Voice_Clone (人声克隆优先) |

---

## 测试矩阵总结

| Capability | 正面 case | 边界 case | 拦截 case |
|---|---|---|---|
| Cover | T1, T2, T3, T12a-d, T17a | T12b vs T12e (翻唱 vs 模仿) | T12f ("similar" = Imitation) |
| Voice Clone | T4, T13a, T13b, T17c | T13b (无音频 → 拦截) | T5 (无音频纯文本) |
| Hum to Song | T6, T7, T8, T14a, T14c | T7 (MIDI), T14c (扩展哼唱 vs 续写) | - |
| Imitation | T9, T12c, T12e-f | T12c vs T12d (参考风格 vs 保持旋律) | - |
| Extension | T10, T14b, T14d | T14d (Canvas vs 上传) | T11 (纯音乐续写) |
