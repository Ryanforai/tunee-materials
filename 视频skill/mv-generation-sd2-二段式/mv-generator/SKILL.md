---
name: mv-generator-seedance
description: MV Shot 生成器（Seedance 2.0 专用）。接收 planner_text + 全局上下文，输出结构化 shot JSON（含完整 video_prompt）。
---

# MV Generator · Seedance 2.0

**只输出 JSON。无前置说明，无后置总结，无 markdown code fence。**

## 目录结构

```
SKILL.md                              ← 入口：路由 → 加载 → 输出 schema
references/
  prompt-guide.md                     ← story_mode / visions 的 prompt 写法（自包含）
```

---

## 输入

1. **planner_text** — SUMMARIZE + DIRECTING + SHOT 列表
   - 每个 SHOT 带 `[起止时间]` `(来源stage)` + ①②③... 视觉落点（含主体 tag）
   - DIRECTING 块含渲染族、cam（摄影系时）、大气、道具锁定、pacing、signature_shots、color_logic、texture、composition_tendency、effect_signature
2. **全局上下文** — `visual_style`、`mv_type`、`video_model`、`characters`（含 name + description）、`scenes`（含 scene_name + description）、`language_code`

---

## 路由

### story_mode / visions / mv_clone

加载 `references/prompt-guide.md`

> mv_clone 的 video_prompt 格式与 story/visions 一致，共用同一套 prompt 写法。clone 专属的参考镜头 DNA 由 planner 在 treatment 中传递。

---

## 执行规则

1. planner_text 中的 SHOT 列表是权威的 shot 结构和时间，直接按 SHOT 生成
2. DIRECTING 块的渲染族、大气、道具锁定、visual_identity / visual_language 各项决策全片复用
3. treatment 的 ①②③... 视觉落点 → beat 的素材来源；每个落点可展开成 1-3 个 beat（身体传导顺序、眼神轨迹、附属物惯性延迟各算一个 beat）；落点的主体 tag 决定 @图片N 映射；Chorus/高能段落点密集且局部时，触发快切组写法（见 prompt-guide.md §四）
4. DIRECTING 中的 `pacing` 字段决定当前 shot 所属音乐段落的 beat 密度策略：主歌段用慢节奏匀速 beat，副歌/高潮段用快切组；**pacing 缺失时按主歌段默认节奏处理**
5. characters / scenes 提供角色和场景的名称与描述，用于填充 shot 的 `character_name`、`scene_name` 及 prompt 中的细节
6. `character_name` 非空 → 不得为 null（禁止擅自降为空镜）
7. `scene_name` 非空 → shot 必须携带该 scene_name；**若 planner 未分配场景则按当前 shot 的 treatment 上下文推断一个场景名**
8. 时间轴连续：无间隙无重叠，所有时间值为整数秒
9. **video_prompt 是完整成品**，不依赖任何外部拼装
10. 每个 shot 的 video_prompt 必须写入一致性锁定文本（见 prompt-guide.md）
11. 每个 shot 的 video_prompt 必须带入 DIRECTING 中的大气效果（可微调浓度）
12. 道具锁定描述在道具首次出现的 shot 中必须写入完整固定描述
13. 摄影系时使用 DIRECTING 中推荐的 cam 组合

---

## 输出 Schema

```json
{
  "summarize": "从 planner SUMMARIZE 透传的全片视觉概述",
  "shots": [
    {
      "shot_id": "Shot N",
      "scene_name": "场景名（必填）",
      "start_time": 0,
      "end_time": 10,
      "duration": 10,
      "description": "导演指令：谁在哪做什么+镜头怎么拍",
      "video_prompt": "完整 video_prompt",
      "character_name": "角色名 or null"
    }
  ]
}
```

**字段说明：**

- `shot_id`：`"Shot 1"` / `"Shot 2"` / ... 格式，从 1 递增
- `summarize`：从 planner SUMMARIZE 原文透传，不改写
- `character_name`：字符串，空镜填 `null`，多角色用 `/` 分隔
- 所有文本字段（`description` / `video_prompt`）由 `language_code` 决定语言（zh-CN→中文，其他→英文）

---

## 禁止输出的字段

```
mv_type / video_model / visual_style / style_guide / rendering_family / md_stages / mv_elements / checks / notes / route / style_pick / structure / title / frame_prompt
```
