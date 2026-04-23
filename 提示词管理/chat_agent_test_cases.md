# chat_agent.md 测试用例

## 正常情况（Happy Path）

### Case 1: 快速模式直接生成（DECISION LOGIC #2）
- **输入**: user_message="直接生成一首K-pop歌曲", quick_mode=true, language_code=null, user_choice_models=["mureka_v7.6"], Canvas=[]
- **期望**: agent_create=2, language_code="zh-CN", message≈"好的！马上开始制作！", options=[], model_reasoning 包含 STEP1-4（Capability=Song, List∩Whitelist≠empty → Supported）

### Case 2: 指定模型+创作意图（DECISION LOGIC #0）
- **输入**: user_message="用mureka_v7.6帮我做一首安静的爵士乐", quick_mode=false, user_choice_models=["mureka_v7.6"], Canvas=[]
- **期望**: agent_create=3, message=简短过渡语（不含选项内容）, options=4个爵士风格方向, model_reasoning 包含 Capability=Song 校验

### Case 3: 模糊创作意图（DECISION LOGIC #9 → Scenario C）
- **输入**: user_message="想做首歌", quick_mode=false, user_choice_models=null, Canvas=[]
- **期望**: agent_create=3, message=ack+过渡, options=4个不同风格方向, model_reasoning Capability=Song, List empty → Supported(auto-select)

### Case 4: 纯聊天（DECISION LOGIC #11）
- **输入**: user_message="你好，今天天气怎么样", quick_mode=false, Canvas=[]
- **期望**: agent_create=4, model_reasoning=null, message=自然对话, options=[]

### Case 5: 带歌词的创作（DECISION LOGIC #7.5）
- **输入**: user_message="用我的歌词做首歌：[Verse]...[Chorus]...", quick_mode=false, Canvas=[]
- **期望**: agent_create=2 或 3（取决于信息完整度）, 若=3 则 options 围绕歌词风格变体

### Case 6: 选择选项后执行（Pattern 3 Execute）
- **输入**: user_message="选第2个", quick_mode=false, Canvas=[]（前一轮已给出 options）
- **期望**: agent_create=2, message="好的！马上开始制作！", options=[]

### Case 7: 指定语言（PRIORITY 1）
- **输入**: user_message="Create a pop song", language_code="ja-JP", quick_mode=false
- **期望**: agent_create=3, language_code="ja-JP", options 的 title/describe 全部为日文

### Case 8: MV 创建（DECISION LOGIC #7）
- **输入**: user_message="帮我为《夜曲》做个MV", quick_mode=false, can_create_video=true, Canvas=[{title:"夜曲", status:"completed", audio_type:"song"}]
- **期望**: is_mv_creation=true, agent_create=2, message≈简短确认

### Case 9: Voice Extraction（DECISION LOGIC #0.5）
- **输入**: user_message="用这个声音唱首歌", quick_mode=false, [Attachments]=vocal_audio.mp3
- **期望**: agent_create=3, message=brief vocal/timbre analysis + transition, options=4个不同歌曲风格, Capability=Voice_Extraction

### Case 10: Cover（DECISION LOGIC #0.6）
- **输入**: user_message="翻唱这首，换成摇滚风格", quick_mode=false, Canvas=[{title:"晴天", audio_type:"song"}]
- **期望**: agent_create=3, message=melody analysis + transition, options=3种不同风格的同一旋律翻唱 + "我全都要", Capability=Cover

### Case 11: Hum to Song（DECISION LOGIC #0.7）
- **输入**: user_message="帮我编曲成一首完整的歌", quick_mode=false, [Attachments]=humming.wav
- **期望**: agent_create=3, message=brief humming analysis, options=4种编曲方向, Capability=Hum_To_Song

### Case 12: Imitation（DECISION LOGIC #0.8）
- **输入**: user_message="模仿这首的感觉做一首类似的", quick_mode=false, [Attachments]=ref_audio.mp3
- **期望**: agent_create=3, message=musical analysis + copyright statement, options=3个风格变体, Capability=Song_Imitation

---

## 边界情况（Edge Cases）

### Case E1: PHASE 0 阻断 — 纯音乐续写
- **输入**: user_message="直接续写这首纯音乐", quick_mode=true, Canvas=[{title:"月光", audio_type:"instrumental"}]
- **期望**: agent_create=5, message="纯音乐暂不支持续写，我可以创作风格相似的新曲目", model_reasoning=null
- **验证点**: quick_mode=true 不能覆盖 PHASE 0 阻断

### Case E2: PHASE 0 阻断 — 纯音乐提取人声
- **输入**: user_message="提取人声", quick_mode=false, [Attachments]=instrumental.mp3（分析显示无人声）
- **期望**: agent_create=5, message="纯音乐没有人声，无法提取音色", model_reasoning=null

### Case E3: PHASE 0 阻断 — 纯音乐翻唱
- **输入**: user_message="翻唱这首", quick_mode=false, Canvas=[{audio_type:"instrumental"}]
- **期望**: agent_create=5, message="纯音乐没有主旋律，无法翻唱", model_reasoning=null

### Case E4: PHASE 0 阻断 — 纯音乐哼唱成曲
- **输入**: user_message="做成歌", quick_mode=false, [Attachments]=instrumental.mp3
- **期望**: agent_create=5, message="纯音乐没有哼唱旋律，无法扩展成曲", model_reasoning=null

### Case E5: 模型能力校验 — 不支持需切换
- **输入**: user_message="用<ModelA>帮我做一首纯音乐", user_choice_models=["ModelA"], quick_mode=false, best_model_infos=["ModelX","ModelY"], instrumental_models=["ModelX"]
- **期望**: agent_create=3, model_reasoning 中 List∩Whitelist=[] → Not Supported → auto-select, message 以"你选择的模型不支持纯音乐创作，已为你更换合适的模型来生成。"开头

### Case E6: 模型能力校验 — 空列表自动选择
- **输入**: user_message="做首K-pop歌曲", user_choice_models=[], quick_mode=true
- **期望**: agent_create=2, message 不含任何模型名, model_reasoning List empty → Supported(auto-select)

### Case E7: 否定词覆盖 quick_mode 关键词
- **输入**: user_message="不要现在就生成，我想先聊聊", quick_mode=false
- **期望**: agent_create=4（不能触发 #2 quick_mode）, message=对话

### Case E8: 模糊修改意图（DECISION LOGIC #6）
- **输入**: user_message="换成男声", quick_mode=false, Canvas=[{title:"昨天"}]（无明确引用）
- **期望**: agent_create=4, message=提供两条创作路径（全新创作 vs 参考已有作品）, 不使用"修改/modify"一词

### Case E9: 视频上传 — 音乐创作 vs 视频编辑
- **输入 A**: user_message="为这个视频配乐", [Attachments]=video.mp4 → 期望: agent_create=2/3, message="我会根据视频的内容/情绪/画面创作音乐音频"
- **输入 B**: user_message="合成这个视频并导出", [Attachments]=video.mp4 → 期望: agent_create=5, message="我专注音乐创作，暂不支持视频编辑或导出成品视频"

### Case E10: 版权保护 — 参考音频模仿
- **输入**: user_message="模仿这首歌的风格", quick_mode=false, [Attachments]=ref_audio.mp3
- **期望**: agent_create=3, message 包含 musical analysis + 版权检测声明（如"版权检测通过后创作类似风格的原创音乐"）, options 中不含版权声明

### Case E11: 语言自动检测 — CJK
- **输入 A**: user_message="做一首中文歌" → 期望: language_code="zh-CN"
- **输入 B**: user_message="J-ポップを作って" → 期望: language_code="ja-JP"
- **输入 C**: user_message="K-pop 노래 만들어줘" → 期望: language_code="ko-KR"

### Case E12: 不支持的歌词语言
- **输入**: user_message="用泰语歌词做首歌", quick_mode=false
- **期望**: agent_create=5, message="暂不支持该语言的歌词生成，目前支持：中文/英文/日文/韩文/西班牙文/法文/德文/意大利文/葡萄牙文/俄文"

### Case E13: Vocal Change 无音频上传
- **输入**: user_message="换音色", quick_mode=false, Canvas=[{title:"晴天"}]（无上传）
- **期望**: agent_create=5, message="暂不支持对话触发音色转换（Vocal Change），请在对应的音色卡片中操作，或先上传一段音频作为声音参考"

### Case E14: Vocal Change 有音频上传
- **输入**: user_message="用这个声音克隆音色", quick_mode=false, [Attachments]=vocal.mp3
- **期望**: 路由到 Audio Upload Intent Router #1 Voice Extraction, agent_create=2/3（不触发 agent_create=5）

### Case E15: 快速模式 + 不支持歌词的语言 → 阻断优先
- **输入**: user_message="直接生成一首泰语歌", quick_mode=true
- **期望**: 检查语言阻断 → agent_create=5（不被 quick_mode 覆盖）

### Case E16: 专辑概念请求（DECISION LOGIC #10）
- **输入**: user_message="帮我做一张包含10首歌的概念专辑", quick_mode=false
- **期望**: agent_create=6, message=肯定理解 + 引导迭代创作, model_reasoning=null

### Case E17: 创意写作请求 — 写歌词/写prompt（DECISION LOGIC #8.5）
- **输入 A（quick_mode=true）**: user_message="帮我写歌词", quick_mode=true → 期望: agent_create=2, message="好的，马上为你写！", options=[]
- **输入 B（quick_mode=false）**: user_message="帮我写歌词", quick_mode=false → 期望: agent_create=3, message=ack+theme summary（不含实际歌词）, options=4个风格方向
- **验证点**: message 中禁止包含实际歌词内容

### Case E18: 系统中断
- **输入**: {"role": "System", "message": "Stopped by user."}
- **期望**: agent_create=4, message=自然确认（如"好的，已停止"）

### Case E19: Reference Baseline 继承
- **输入**: user_message="再做一首", quick_mode=false, Canvas=[], 历史中有上传参考音频且未 detached
- **期望**: agent_create=3（或 2 如果 quick_mode=true）, message 确认继承参考基线, options 围绕参考基线风格变体

### Case E20: 实时调研+创作（DECISION LOGIC #4）
- **输入**: user_message="当下最火的电音风格是什么，帮我做一首", quick_mode=false
- **期望**: agent_create=2, message≈ack, options=[]（调研后直接执行，非选项模式）

### Case E21: 修改已有音频文件（CAPABILITY TRUTH）
- **输入**: user_message="把这首的节奏调快一点", quick_mode=false, Canvas=[{title:"晴天"}]
- **期望**: agent_create=4, message=解释不能直接修改已有音频，但可参考创作新曲，请求确认, options=[]

### Case E22: 选项格式校验
- **输入**: 任何触发 agent_create=3 的情况
- **验证点**:
  - 必须 exactly 4 个 options
  - 最后一个 option title = "我全都要"/"All of the above"
  - 所有 option 的 optionId/value/title/describe 不能为 null/空/"None"
  - title 不能有 "1." 编号前缀
  - message 不能包含任何 option 内容

### Case E23: Query Context — 查询模型可用性（STEP4 Query）
- **输入**: user_message="还能用mureka_v7.5吗？", agent_create=4, all_models=["mureka_v7.5","mureka_v7.6"]
- **期望**: agent_create=4, model_reasoning Capability=Model_Availability, message="[mureka_v7.5] 当前可用" + 各能力白名单 breakdown

### Case E24: Query Context — 查询模型不在列表中
- **输入**: user_message="mureka_v1还能用吗？", agent_create=4, all_models=["mureka_v7.5","mureka_v7.6"]
- **期望**: agent_create=4, message="[mureka_v1] 当前不可用，当前支持的模型有：[mureka_v7.5, mureka_v7.6]"

### Case E25: "来X首" 语义理解（PRIORITY 4）
- **输入**: user_message="来3首歌", quick_mode=false
- **期望**: agent_create=3, options=3个风格方向 + "我全都要", message 不含"生成3首歌"字样，理解为"探索3个方向"

### Case E26: 上传音频但意图不匹配任何路由
- **输入**: user_message="听听这个", quick_mode=false, [Attachments]=audio.mp3
- **期望**: 当作 Reference Baseline（风格参考），agent_create=3（参考创作）

### Case E27: 明确 track 引用 + 修改（DECISION LOGIC #5）
- **输入**: user_message="把《晴天》的歌词改一下", quick_mode=false, Canvas=[{title:"晴天"}]
- **期望**: agent_create=2（材料修改 = 正常创作流程）, message=确认

### Case E28: MIDI 上传（Hum to Song 变体）
- **输入**: user_message="把这个MIDI做成完整的歌", quick_mode=false, [Attachments]=melody.mid
- **期望**: agent_create=3, Capability=Hum_To_Song（MIDI 支持）, message=MIDI 分析

---

## 校验清单

| # | 校验项 | 适用 Cases |
|---|--------|-----------|
| 1 | agent_create 值与 DECISION LOGIC 匹配 | 所有 |
| 2 | model_reasoning: 2/3/4 时非 null，5/6 时为 null | 所有 |
| 3 | message 不含 options 内容 | 3,5,9,10,11,12 |
| 4 | options 恰好 4 个，最后一个为"我全都要" | 2,3,5,9,10,11,12 |
| 5 | language_code 符合 PRIORITY 1 语言流 | 7,11,12 |
| 6 | PHASE 0 阻断优先级高于 quick_mode | E1-E4, E15 |
| 7 | model_reasoning 中不含具体模型名（creation context） | E5 |
| 8 | Not Supported 时 message 以 switch notice 开头 | E5 |
| 9 | message 不含"修改/modify"（Pattern 1 Clarify） | E8 |
| 10 | options title 无编号前缀 | E22 |
| 11 | agent_create=3 时 message 不枚举选项内容 | E22 |
