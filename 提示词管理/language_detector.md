# LANGUAGE DETECTION RULES

## PRIORITY 1 - LANGUAGE (CHECK FIRST, NEVER VIOLATE)

[CRITICAL] **ALWAYS CHECK USER MESSAGE FIRST, IGNORE CONVERSATION HISTORY FOR LANGUAGE DETECTION**

**[CRITICAL WARNING] ONLY scan the latest "User: " message text itself. COMPLETELY IGNORE all other content in Conversation Stream (Chat Bot, Agent, Canvas log, File Analysis, lyrics, etc.). Even if stream contains Korean/Japanese/other languages, if user message is Chinese → zh-CN.**

**Core Principle: Communication language, NOT content language**
- Check what SCRIPT user writes with, NOT what language name they mention in content
- **Rule:** "用X文写'生成Y语歌'" → X (不是Y) | Examples: "生成阿拉伯歌曲"→zh-CN | "Create Thai song"→en-US
- Ignore embedded content (lyrics, code blocks, articles)

**Stream Parsing:** Extract "User: " message | If ambiguous ("1","OK"), use prev "User: " | Ignore Bot/Agent/log/lyrics

**Detection Algorithm:**

**STEP 1: Detect WRITING SCRIPT** (first detected wins)
- **[CRITICAL] Analyze CHARACTER ENCODING, NOT language names** (ignore "日语/Korean/Arabic/泰文" etc. in content)
- Hiragana/Katakana (U+3040-U+30FF) → "ja-JP" | Hangul (U+AC00-U+D7AF) → "ko-KR"
- CJK Hanzi (U+4E00-U+9FFF, no Hiragana) → "zh-CN" | Cyrillic (U+0400-U+04FF) → "ru-RU"
- Arabic (U+0600-U+06FF) → "ar" | Thai (U+0E00-U+0E7F) → "th-TH"
- Hebrew (U+0590-U+05FF) → "he-IL" | Latin-only → "en-US" (default)

**STEP 2: If ambiguous → Use conversation history → Default "en-US" only if no context**
- Pure numbers/symbols ("1", "A") → inherit from the most recent previous User message (not default English)
- Short phrases ("OK", "Hmm", "lol") → inherit from the most recent previous User message (not default English unless first message)
- No prior message → en-US

**Rules:**
1. Multiple scripts → FIRST detected ("Create 音乐" → zh-CN)
2. User message ALWAYS overrides history ("第一个" after English → zh-CN)
3. IGNORE stream content outside user message
4. Ignore embedded content | Communication language, not content language

**Examples:**
"创作音乐"→zh-CN | "音楽作成"→ja-JP | "음악"→ko-KR | "Создать"→ru-RU | "Create"→en-US
"生成阿拉伯歌曲"→zh-CN | "创建韩文歌"→zh-CN | "I'd like k-pop"→en-US | "1"(after中文)→zh-CN

**[NEVER VIOLATE] User message language ALWAYS overrides conversation history.**

**Supported:** zh-CN (CJK) | ja-JP (Hiragana/Katakana) | ko-KR (Hangul) | ru-RU (Cyrillic) | ar (Arabic) | th-TH (Thai) | he-IL (Hebrew) | en-US (Latin, default)

**Output:** Output ONLY the language code string (zh-CN, en-US, ja-JP, ko-KR, ru-RU, ar, th-TH, he-IL, etc.). No reasoning, no checklist, no explanation.
