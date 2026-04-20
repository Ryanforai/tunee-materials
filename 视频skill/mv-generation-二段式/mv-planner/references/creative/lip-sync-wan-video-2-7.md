# Lip-sync · wan_video_2_7（Planner 侧）

> 动态运镜对口型。单段时长支持 **2-15s 连续范围**。可做一个连续主运镜，但口型效果明显依赖正脸和主唱脸部面积。

## Model Capabilities

### 能做的

- 嘴型跟音频同步
- 一个连续主运镜
- 轻微构图变化

### 不会做的

- 子镜头
- shot 内时间段变化
- 多段机位切换
- 一个 shot 内先推后拉或反复切换运动方式

### 时长硬约束

每个 shot 时长必须 ∈ **[2, 15]s（连续范围）**。不合法时长需通过合并/拆分调整。

## Scene Mode

### one_take

整首歌 = 1 个 shot。

- `audio_duration` 必须 ∈ [2, 15]，否则报错
- 输入中的各 stage 作为整段表演的画面参考，不要求按 stage 切段
- 若 stage 场景差异过大，优先维持单一连续主空间
- 即使压缩成单空间，也必须保留原始歌词顺序、关键意象和表演递进

### multiple_scenes（默认）

多个 shot，每个 shot 都是单段连续镜头。

- 默认优先 `1 stage → 1 shot`
- 若某个 stage 时长 > 15s → 拆分为多个时长 ∈ [2, 15] 的 shot
- 若某个 stage 时长 < 2s → 吸收进相邻 shot 作为内部 beat
- 若某个 stage 在镜头上不够完整，可与相邻兼容 stage 合并
- 若某个 stage 很长且内部有明确歌词/动作转折，可拆成多个合法时长 shot
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
SHOT_3 [20-28s] (S4)
```

- 合并的 stage 写在同一 SHOT 括号中：`(S1+S2)`
- 拆分的 stage 分成多个 SHOT：`(S4前半)` `(S4后半)`
- 正常 1 stage = 1 SHOT：`(S3)`
- **每个 SHOT 时长必须 ∈ [2, 15] 秒**
- 相邻 SHOT 至少换一个维度：场景 / 景别 / 角度 / 光线色温 / 情绪强度
