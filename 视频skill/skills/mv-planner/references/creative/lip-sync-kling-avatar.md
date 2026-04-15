# Lip-sync · kling_avatar_2_0（Planner 侧）

> 动态运镜对口型。支持 `5-300s`，可做一个连续主运镜，但 shot 内不支持时间段落变化。

## Model Capabilities

### 能做的

- 嘴型跟音频同步
- 一个连续主运镜
- 轻微构图变化
- 更完整的空间感和动态感

### 不会做的

- 子镜头
- shot 内时间段变化
- 多段机位切换
- 一个 shot 内先推后拉或反复切换运动方式

## Scene Mode

### one_take

整首歌 = 1 个 shot。

- `audio_duration` 必须在 `5-300s` 之间
- 输入中的各 stage 作为整段表演的画面参考，不要求按 stage 切段
- 若不同 stage 场景差异过大，优先选择一个连续主空间，不要硬写 teleport
- 可以用一个连续主运镜增强生命力，但不要为了"丰富"而硬加运动

### multiple_scenes

多个 shot，每个 shot 都是单段连续镜头。

- 默认优先 `1 stage → 1 shot`
- 若某个 stage 在镜头上不够完整，可与相邻兼容 stage 合并
- 若某个 stage 很长且表演上不够成立，可拆成多个合法 shot
- 相邻 shot 至少换一个维度：场景 / 景别 / 角度 / 光线色温 / 情绪强度
- 所有适配都必须保留原始 stage 顺序和关键意象

## Planner 输出

输出 SUMMARIZE + DIRECTING + SHOT 列表。每个 SHOT 带时间范围和来源 stage 编号。

```
SUMMARIZE
（2-3 句视觉概述）

DIRECTING
渲染族: 摄影系 | 画风系 | 参考图主导
cam: （摄影系时）

SHOT_1 [0-10s] (S1+S2)
SHOT_2 [10-20s] (S3)
SHOT_3 [20-30s] (S4)
```

- 合并的 stage 写在同一 SHOT 括号中：`(S1+S2)`
- 拆分的 stage 分成多个 SHOT：`(S4前半)` `(S4后半)`
- 正常 1 stage = 1 SHOT：`(S3)`
- 相邻 SHOT 至少换一个维度：场景 / 景别 / 角度 / 光线色温 / 情绪强度
