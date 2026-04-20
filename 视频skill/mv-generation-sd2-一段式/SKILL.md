---
name: mv-generation-sd
description: 工作流节点（Seedance 2.0 专用）。接收结构化 MV JSON，输出分镜脚本 JSON。无首帧图，无 frame_prompt。由上游编排层调用，不处理自然语言对话。
---

# MV Generation · Seedance 2.0

**只输出 JSON。无前置说明，无后置总结，无 Markdown 包裹。**

---

## 目录结构

```
SKILL.md                          ← 入口：Unwrap → Normalize → Rendering Family → Dispatch
timeline-normalization.md         ← 时间段校验与纠正（按需加载：仅发现时间问题时查阅）
routes/
  story.md                        ← story 完整执行手册 + 专属导演指导 + Case
  visions.md                      ← visions 完整执行手册 + 专属导演指导 + Case
  mv_clone.md                     ← mv_clone 完整执行手册 + 参考重构指导 + Case
styles/                           ← 音乐风格拍法参考（按需加载）
  kpop.md                         ← K-pop / 流行舞曲
  hiphop.md                       ← Hip-hop / 说唱（West Coast / Trap / Old School）
  ballad.md                       ← Ballad / 抒情
  edm.md                          ← EDM / 电子（House / Techno / Trance）
  rock.md                         ← Rock / 摇滚（Indie / Punk / Metal）
  rnb.md                          ← R&B / Soul
  chinese.md                      ← 古风 / 中国风 / 国风
```

---

## 职责

本文件只做五件事：**Unwrap → Normalize → Rendering Family → Dispatch → 输出前自检**。

---

## Step 1：Unwrap

如果输入是 `HumanMessage` 包装（`[{"type": "HumanMessage", "content": "..."}]`）：只取 `content` 字段，解析其中的 JSON。否则直接使用输入。

---

## Step 2：Normalize

1. `mv_type`：仅支持 `story` / `visions` / `mv_clone`。收到 `lip-sync` / `lip_sync` → error JSON 停止。
2. `video_model`：归一化为 `seedance_2_0`（对象型提取 `model_key`，保留 `max_duration / min_duration`）。若 `max_duration` 未提供，默认 `15`；若 `min_duration` 未提供，默认 `4`。

---

## Step 2：Normalize

1. `mv_type`：仅支持 `story` / `visions` / `mv_clone`。收到 `lip-sync` / `lip_sync` → error JSON 停止。
2. `video_model`：归一化为 `seedance_2_0`（对象型提取 `model_key`，保留 `max_duration / min_duration`）。若 `max_duration` 未提供，默认 `15`；若 `min_duration` 未提供，默认 `4`。

---

## Step 2.5：Rendering Family 判断

在 Dispatch 之前，判断渲染族，传递给路由文件使用。

**有效风格值（effective_style）：** `mv_guide.style_guide` 存在且非空时优先；否则回退 `visual_style`。空字符串视为缺失。

| 渲染族 | 判定条件 |
|---|---|
| **摄影系 `photographic`** | `effective_style` 含：`写实 / realistic / cinematic / 电影 / 胶片 / film / vintage / 复古 / Y2K / noir / 黑色电影 / 赛博朋克 / cyberpunk / CG写实 / 真人 / live-action`；或无法判定时兜底 |
| **画风系 `stylized`** | `effective_style` 含：`动漫 / anime / 赛璐璞 / cel / 水墨 / ink wash / 水彩 / watercolor / 油画 / oil painting / 3D渲染 / 3D render / toon / 像素 / pixel / 浮世绘 / 国画 / 漫画 / comic / manga / 插画 / illustration / flat design / low poly` |

两族同时命中 → **画风系优先**。`effective_style` 缺失 → **参考图主导模式**（风格行只写光源+色调，不推荐相机）。

渲染族的作用：
- **摄影系**：路由文件风格行写具体相机型号 + 胶片/传感器组合
- **画风系**：路由文件风格行写画风描述，不写相机
- **参考图主导**：路由文件风格行只写光源+色调

---

## Step 4：Dispatch

**Route 只决定拍法框架，不决定剧情骨架。**

- `stage_plan` 是全片唯一 canonical timeline
- route 只能决定镜头语言、光线语言、结构密度、模型适配方式
- route 不得重写输入中的段落顺序、主动作、角色和场景

### Route Dispatch

```
story    → routes/story.md
visions  → routes/visions.md
mv_clone → routes/mv_clone.md
```

### story_mode 路由判断

```
stage_plan 中是否存在两条清晰的人物/场景线在交替推进？
  → 是 → story（sub_route: dual）
  → 否 → story（sub_route: single）
```

> sub_route 传入 routes/story.md，该文件内部区分 single/dual 的差异段落。

### Style Dispatch

`mv_guide.music_tags` 存在且非空时，识别主要风格类别，加载对应风格文件：

| 关键词 | 风格文件 |
|--------|---------|
| K-pop / Kpop / 韩流 / 流行舞曲 / dance pop / idol | styles/kpop.md |
| Hip-hop / Rap / 说唱 / Trap / Drill | styles/hiphop.md |
| Ballad / 抒情 / 慢歌 / 情歌 | styles/ballad.md |
| EDM / 电子 / House / Techno / Trance / Dubstep | styles/edm.md |
| Rock / 摇滚 / Punk / Metal / Indie rock | styles/rock.md |
| R&B / Soul / Neo-soul / Funk | styles/rnb.md |
| 古风 / 中国风 / 国风 / 国潮 / 民族 | styles/chinese.md |

- 匹配取最佳匹配，不区分大小写
- 无法匹配任何关键词 → 不加载风格文件，visual_identity 由模型自行从 music_tags 推导
- `music_tags` 缺失或空 → 不加载风格文件，跳过 visual_identity

---

## Step 5：输出前自检

在输出 JSON 之前，自检时间段：

- 时间段 start/end 是否为整数秒
- 首行 start = 0，末行 end = audio_duration
- 相邻行连续（无间隙、无重叠）
- 每行时长在 [min_duration, max_duration] 范围内

**发现问题** → 加载 `timeline-normalization.md`，按其中的修复规则修正（gap 吸收/重叠截断/超长拆分/超短合并），**最多 3 轮**。修复成功后重新自检，通过后输出。3 轮后仍有违规 → 在输出 JSON 中追加 `_violations` 字段。

**无问题** → 直接输出 JSON，不加载该文件。
