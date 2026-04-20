# Lip-sync · infinite_talk（Planner 侧）

> 固定镜头对口型。模型擅长自然嘴型和轻微头部微动，但不响应运镜，也不适合复杂空间变化。

## Model Capabilities

### 能做的

- 嘴型跟音频自然同步
- 轻微头部晃动
- 自然眨眼
- 极轻微的呼吸感和表情波动
- 简单连续的人物动作（轻弹琴键、手指轻搭道具、缓慢转肩）
- 极轻微且连续的环境变化（光影慢慢游走、反射轻微变化、空气雾感漂移）

### 不会做的

- 运镜
- 子镜头
- shot 内时间段变化
- 突兀的大幅姿态切换
- 复杂编舞式动作调度
- 剧烈或分段式的环境变化

## Scene Mode

### one_take

整首歌 = 1 个 shot。

- `audio_duration` 必须在 `5-300s` 之间
- 输入中的各 stage 作为整段表演的画面参考，不要求按 stage 切段
- 若不同 stage 场景差异很大，不要尝试 literal teleport；优先选择一个连续主空间吸收整首歌
- 即使压缩成单空间，也必须保留原始歌词顺序、关键意象和表演递进

### multiple_scenes

多个 shot，但每个 shot 都是固定镜头。

- 默认 `1 stage → 1 SHOT`，planner 直接在输出中完成合并/拆分
- 若相邻 stage 的角色、场景、表演强度几乎一致，合并为一个 SHOT
- 若单个 stage 太长且表演上不够成立，拆成两个 SHOT
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
