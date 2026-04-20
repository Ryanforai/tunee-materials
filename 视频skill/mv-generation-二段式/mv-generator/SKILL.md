---
name: mv-generator-keling
description: MV Shot 生成器。接收 planner_text + 全局上下文，输出结构化 shot JSON（含完整 video_prompt / frame_prompt）。
---

# MV Generator

**只输出 JSON。无前置说明，无后置总结，无 markdown code fence。**

## 目录结构

```
SKILL.md                              ← 入口：路由 → 加载 → 输出 schema
references/
  prompt-guide.md                     ← story_mode / visions 的 prompt 写法（自包含）
  prompt-guide-lipsync.md             ← lip-sync 的 prompt 写法（自包含）
```

## 输入

1. **planner_text** — SUMMARIZE + DIRECTING + SHOT 列表（每个 SHOT 带 `[起止时间]` `(来源stage)` + ①②③... 视觉落点）
2. **全局上下文** — visual_style, mv_type, video_model, characters, scenes

## 路由

### story_mode / visions

加载 `references/prompt-guide.md`

### lip-sync

加载 `references/prompt-guide-lipsync.md`

lip-sync 内部按 `video_model.model_key` 区分：
- `infinite_talk` → 固定镜头
- `wan_video_2_7` → 允许 1 个连续主运镜，时长 ∈ [2, 15]s（连续范围）
- `one_take` → 单镜头整曲，时长 = audio_duration（约束在 planner 层已校验）

## 执行规则

1. planner_text 中的 SHOT 列表是权威的 shot 结构和时间，直接按 SHOT 生成
2. DIRECTING 提供渲染族和 cam 推荐
3. treatment 的 ①②③... 视觉落点 → beat 的素材来源
4. characters / scenes 提供角色和场景的名称与描述，用于填充 shot 的 `character_name`、`scene_name` 及 prompt 中的细节
5. `character_name` 非空 → 不得为 null（禁止擅自降为空镜）
6. `scene_name` 非空 → shot 必须携带该 scene_name；**若 planner 未分配场景则按当前 shot 的 treatment 上下文推断一个场景名**
7. 时间轴连续：无间隙无重叠，所有时间值为整数秒
8. **video_prompt / frame_prompt 是完整成品**，不依赖任何外部拼装

## 输出 Schema

```json
{
  "summarize": "从 planner SUMMARIZE 透传的全片视觉概述",
  "shots": [
    {
      "shot_id": "Shot N",
      "scene_name": "场景名（必填）",
      "start_time": 0,
      "end_time": 8,
      "duration": 8,
      "description": "导演指令：谁在哪做什么+镜头怎么拍",
      "video_prompt": "完整 video_prompt",
      "frame_prompt": "完整 frame_prompt",
      "character_name": "角色名 or null"
    }
  ]
}
```

## 禁止输出的字段

```
mv_type / video_model / visual_style / style_guide / rendering_family / md_stages / mv_elements / checks / notes / route / style_pick / structure / title
```
