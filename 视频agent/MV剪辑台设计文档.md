# MV 剪辑台 — 交互设计规范

> 面向实现方的完整设计文档。单 HTML 文件原型，无后端依赖。

---

## 一、设计定位

### 核心差异化：音乐驱动，不是画面驱动

大多数视频编辑器（剪映、Premiere）以"画面内容"为中心。本产品以**音乐节拍**为第一时间基准，所有操作（分割、对齐、快切）都围绕 BPM 展开。

| 维度 | 剪映 | MV 剪辑台 |
|------|------|---------|
| 时间基准 | 帧 / 秒 | **节拍（BPM）** |
| 主视觉焦点 | 素材缩略图 | **音频波形** |
| 素材组织 | 通用分类 | **Option A / B / C 分镜方案** |
| 字幕 | 通用字幕轨 | **歌词轨（LRC 自动解析）** |
| 剪辑风格 | 自由剪辑 | **节拍吸附 / 全轨吸附** |

### 品牌定位三词

**rhythmic（律动）/ focused（专注）/ professional（专业）**

### 视觉基调

- **主题：浅色**（反常识——大多数专业编辑器是深色，浅色主题是差异化）
- 整体氛围：温暖的工作台，像一张铺开的乐谱纸
- 视频预览区保留深色（必须能看清视频内容）
- 色彩：**黑白灰为主，橙色作为唯一强调色**
- 字体：Libre Baskerville（UI 正文）+ JetBrains Mono（时间码）

---

## 二、整体布局（精简版 mv-editor-simple.html）

```
┌─────────────────────────────────────────────────────────────────────┐
│  T  MV 工作台          [▶ 视频剪辑器]          [导出成片]  [Y]       │
│     视频剪辑器·自动保存中                                            │
├──────────┬──────────────────────────────────────────────────────────┤
│          │  ┌─素材面板(30%)────────┐  ┌─视频预览(70%)────────────┐  │
│  AI      │  │ [All][A][B][C]       │  │                           │  │
│  对话    │  │ [视频][图片][音频]   │  │     深色视频画面 16/9      │  │
│  面板    │  │                      │  │                           │  │
│  360px   │  │ 素材1  素材2         │  │  进度条                   │  │
│          │  │ 素材3  [导入]        │  │  [▶]  时间码  [🔊][⛶][1×] │  │
│          │  └──────────────────────┘  └───────────────────────────┘  │
│  [T] 你好│                                                          │
│  我是    │  ┌─轨道工具栏 40px────────────────────────────────────┐  │
│  Tunee…  │  │ [分割][删除]  │  [撤销][重做]                      │  │
│          │  ├────────────────────────────────────────────────────┤  │
│  [Y] 帮  │  │ [轨道头]  时间尺                                  │  │
│  我做…   │  │ [视频轨]  ▭━━━▬━━━▭━━▬━━━▭━━━━━━━                │  │
│          │  │ [音频轨]    ████████████████（波形）               │  │
│  ──────  │  └────────────────────────────────────────────────────┤  │
│  [📎][⚙] │                                                          │
│  输入框   │                                                          │
└──────────┴──────────────────────────────────────────────────────────┘
```

**高度分配**：topbar 52px / 主内容区 flex:1（8px padding）/ 编辑区内部 editor-top flex:7 + editor-bottom flex:3

### 整体布局（完整版 mv-editor.html）

```
┌─────────────────────────────────────────────────────────────────┐
│  [← 返回]                                    [导出成片 →]        │
├────────────┬────────────────────────────────────────────────────┤
│            │                                                   │
│  素材库    │          视频预览区                                │
│  30%       │          70%                                      │
│            │                                                   │
├────────────┴───────────────────────────────────────────────────┤
│  轨道工具栏  40px                                               │
│  [分割][删除]                          [+ 新增歌词字幕]          │
├─────────────────────────────────────────────────────────────────┤
│  时间轴区域                                                     │
│  [轨道头]  [时间尺]  视频轨/音频轨/歌词轨                        │
└─────────────────────────────────────────────────────────────────┘
```

完整版：传统全屏编辑器布局，无对话面板，无撤销/重做。

---

## 三、色彩系统（CSS 变量，使用 OKLCH）

```css
:root {
  /* ── 背景层级 ── */
  --bg:           oklch(0.970 0.004 50);   /* 主背景，暖浅灰 */
  --bg-surface:   oklch(0.996 0.001 50);   /* 面板/卡片，近白 */
  --bg-raised:    oklch(0.958 0.005 50);   /* 次级卡片 */
  --bg-hover:     oklch(0.940 0.007 50);   /* hover 态 */
  --bg-active:    oklch(0.920 0.010 50);   /* active 态 */

  /* ── 边框 ── */
  --border-faint: oklch(0.920 0.004 50);
  --border:       oklch(0.880 0.005 50);
  --border-firm:  oklch(0.820 0.007 50);

  /* ── 文字 ── */
  --text-hi:      oklch(0.170 0.004 50);   /* 主要文字 */
  --text-mid:     oklch(0.400 0.005 50);   /* 次要 */
  --text-lo:      oklch(0.580 0.005 50);   /* 辅助 */
  --text-dim:     oklch(0.720 0.003 50);   /* placeholder */

  /* ── 强调色：琥珀橙（唯一彩色）── */
  --acc:          oklch(0.580 0.180 48);
  --acc-hover:    oklch(0.520 0.190 47);
  --acc-muted:    oklch(0.580 0.180 48 / 0.07);
  --acc-ring:     oklch(0.580 0.180 48 / 0.25);
  --text-acc:     oklch(0.480 0.160 47);

  /* ── 轨道素材色 — 黑白灰层次，非彩色 ── */
  --tr-v1:      oklch(0.935 0.004 50);
  --tr-v1-b:    oklch(0.830 0.005 50);
  --tr-v1-t:    oklch(0.170 0.004 50);

  --tr-au:      oklch(0.945 0.003 50);
  --tr-au-b:    oklch(0.850 0.004 50);
  --tr-au-t:    oklch(0.170 0.004 50);

  --tr-ly:      oklch(0.950 0.006 48);
  --tr-ly-b:    oklch(0.580 0.180 48 / 0.25);
  --tr-ly-t:    oklch(0.480 0.160 47);

  /* ── 时间轴专用 ── */
  --tl-bg:       oklch(0.962 0.003 50);
  --ruler-bg:    oklch(0.942 0.005 50);
  --head-bg:     oklch(0.990 0.002 50);
  --ph-color:    oklch(0.520 0.190 47);

  /* ── 字体 ── */
  --f-body: 'Libre Baskerville', Georgia, serif;

  /* ── 间距（4pt 体系）── */
  --s1: 4px;  --s2: 8px;   --s3: 12px;  --s4: 16px;
  --s5: 24px; --s6: 32px;  --s7: 48px;

  /* ── 圆角 ── */
  --r:    5px;
  --r-lg: 9px;
  --r-xl: 14px;

  /* ── 阴影 ── */
  --sh-sm: 0 1px 3px oklch(0.17 0.004 50 / 0.07), 0 1px 2px oklch(0.17 0.004 50 / 0.04);
  --sh-md: 0 4px 14px oklch(0.17 0.004 50 / 0.10), 0 2px 5px oklch(0.17 0.004 50 / 0.06);
  --sh-lg: 0 12px 40px oklch(0.17 0.004 50 / 0.14), 0 4px 12px oklch(0.17 0.004 50 / 0.08);
}
```

---

## 四、字体规范

所有 UI 文字统一使用 **Libre Baskerville**（衬线体），仅时间码等极个别场景可使用等宽体。

| 用途 | 字体 | 大小 | 字重 |
|------|------|------|------|
| UI 正文 | Libre Baskerville | 0.875rem | 400–600 |
| 按钮 / 标签 | Libre Baskerville | 0.75–0.8125rem | 500–600 |
| 时间码 | Libre Baskerville | 0.8125rem | 500 |
| 轨道时长 | Libre Baskerville | 0.5rem | 400 |
| 时间尺刻度 | Libre Baskerville | 0.5625rem | 400 |
| 轨道名/分类标签 | Libre Baskerville | 0.6875rem | 600 |
| 画面描述文字 | Libre Baskerville | 1rem | 400 |
| 音乐结构标签 | Libre Baskerville | 0.625rem | 500 |

Google Fonts 引入：
```html
<link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
```

---

## 五、顶部工具栏（精简版）

高度 52px，`background: var(--bg-surface)`。

### 5.1 品牌区（左侧）
```
[T] MV 工作台
    视频剪辑器 · 自动保存中
```
- `.topbar-logo`：26px 圆形，`background: var(--text-hi)`，白色 "T"
- `.topbar-title`：0.8125rem，600
- `.topbar-sub`：0.6875rem，`color: var(--text-lo)`

### 5.2 浏览器风格标签页
```
[▶ 视频剪辑器]
```
- 圆角顶部标签：`border-radius: 7px 7px 0 0`，`background: var(--bg)`
- 带播放图标（12px），`margin-bottom: -1px` 覆盖底部边框

### 5.3 右侧操作区
```
[↓ 导出成片]  [Y]
```
- 导出按钮：`height: 30px`，`border: 1px solid var(--border)`，hover 高亮
- 用户头像：30px 圆形，`background: var(--acc)`，白色字母

### 5.4 返回按钮（完整版）
- 图标按钮（ib 类），点击调用 `history.back()`
- 含义：返回 Tunee MV Studio 主界面

### 5.5 导出成片按钮
- 主要按钮（tb.primary 类），`background: var(--acc)`，白色文字
- 带下载图标（SVG）
- 原型阶段显示"导出功能开发中…"toast 提示

---

## 六、AI 对话面板（精简版独有）

宽 360px，`background: var(--bg-surface)`，`border: 1px solid var(--border)`，`border-radius: var(--r-lg)`。

### 6.1 消息列表（`.chat-messages`）
- 可滚动，`overflow-y: auto`，`padding: 20px 16px 10px`
- 每条消息包含头像 + 昵称 + 气泡

### 6.2 消息气泡
- **用户消息**（`.chat-msg.user`）：右对齐，`flex-direction: row-reverse`
  - 气泡：`background: var(--text-hi)`，`color: var(--bg-surface)`
  - 圆角：`14px 14px 4px 14px`（右下角尖锐）
  - 头像：30px 圆形，`background: var(--acc)`
- **AI 消息**（`.chat-msg`）：左对齐
  - 气泡：`background: transparent`，`padding: 4px 0`
  - 昵称：12px，600，`color: var(--text-mid)`
  - 头像：28px 方形圆角，`background: var(--text-hi)`，白色 "T"

### 6.3 富内容卡片
- **故事板卡片**（`.chat-card`）：`background: var(--bg-raised)`，`border: 1px solid var(--border)`
  - Header：图标 + "故事板" + "已更新"badge + 展开箭头
  - 可折叠（点击 header 展开/收起内容区）
- **选项卡片**（`.chat-options-card`）：同上背景
  - 标题："您想调整哪个镜头？"
  - 每个选项：圆形勾选框 + 标题 + 描述
  - 选中：`border-color: var(--acc)` + 橙色填充 + 白色对勾
  - 底部：文本输入框（`.chat-option-input`）+ 发送按钮

### 6.4 输入区（`.chat-input-area`）
- 圆角输入框：`border-radius: 14px`，`border: 1px solid var(--border)`
- 内部：textarea + 底部工具栏
- 工具栏：附件按钮 + 工具按钮 + 型号标签（`Tunee MV · Pro`）+ 发送按钮
- 附件/工具按钮：28px 圆角方形，hover 背景高亮
- 型号标签：圆角 pill，`border: 1px solid var(--border)`，橙色点前缀
- 发送按钮：30px 圆形，`background: var(--text-hi)`

### 6.5 Loading 状态
- "正在思考中…"：旋转脉冲点（`.dot-pulse`）+ 文字
- 脉冲动画：`@keyframes pulse`，opacity 在 0.3-1 之间循环

---

## 七、素材库面板

宽 30%（flex 0 0 30%），`background: var(--bg-surface)`，`border: 1px solid var(--border)`，`border-radius: var(--r-lg)`。

### 7.1 主标签（Primary Tabs）

```
[All]  [Option A]  [Option B]  [Option C]
```

- 容器：`padding: 0 var(--s2)`，底部 `1px solid var(--border)`
- 激活 Tab：下边 2px 实线 `var(--acc)`，`color: var(--text-hi)`
- Option A/B/C 前缀圆点（5px）：
  - A：`var(--text-hi)`（深灰黑）
  - B：`var(--text-mid)`（中灰）
  - C：`var(--acc)`（橙色）

### 7.2 类型标签（Type Tabs）

```
[视频]  [图片]  [音频]
```

三等分，`text-transform: uppercase`，`font-size: 0.6875rem`，`letter-spacing: 0.04em`

激活：`background: var(--bg-raised)`，`border: 1px solid var(--border)`

### 7.3 素材网格

- 2列等宽，`gap: 8px`，`padding: 8px 12px 12px`
- 素材缩略图：`aspect-ratio: 16/9`，渐变色占位（按素材名称生成 OKLCH 渐变）
- 右下角：时长徽章（黑底白字，`font-size: 0.5625rem`）
- 右上角：已使用标记（6px 橙色圆点，白色 2px ring）
- 素材名：`font-size: 0.6875rem`，`font-weight: 500`，`color: var(--text-mid)`，截断显示

**缩略图渐变占位算法**：基于文件名字符码求和，生成**黑白灰 + 微暖色调**渐变。chroma 控制在 0.01-0.04，色相固定在 45-60 范围（暖灰），不使用彩虹色。

**导入素材卡片**：素材网格最后一个位置是一个虚线边框的导入卡片，点击后调用系统文件选择器（`<input type="file" multiple>`），支持视频/图片/音频。

**交互**：hover 时 `translateY(-1px)` + `var(--sh-md)`；cursor: grab；可拖拽到时间轴

---

## 八、视频预览区

### 8.1 预览舞台

- 外容器：`display: flex; align-items: center; justify-content: center; padding: var(--s4) var(--s5)`
- 最大宽度 700px，`border: 1px solid var(--border)`，`border-radius: var(--r-lg)`
- 视频窗口：`background: oklch(0.090 0.002 50)`，`border-radius: var(--r-lg)`，`aspect-ratio: 16/9`

**当前片段标签**（视频画面左上角）：
- `font-size: 0.625rem`，`font-weight: 600`
- 背景：`oklch(0.09 0.002 50 / 0.55)`，`padding: 2px 7px`，`border-radius: 4px`
- 内容：`城市夜景.mp4 · 00:00:00`

**hover 播放覆盖层**：
- 绝对定位铺满，opacity 0 → 1（transition 0.18s）
- 居中 54px 圆圈：`background: oklch(1 0 0 / 0.13)`，`backdrop-filter: blur(6px)`

### 8.2 播放控制栏

**进度条**：
- 高度 4px，`background: var(--border)`，`border-radius: 2px`
- 已播放部分：`background: var(--acc)`
- 拖拽圆点：12px 圆，`background: var(--acc)`，`box-shadow: 0 0 0 2.5px white`
- hover 时高度变为 5px（微交互）
- 点击任意位置跳转

**时间码**：`font-size: 0.8125rem`，格式 `mm:ss / mm:ss`，总时长用 `var(--text-dim)`

**播放按钮**：38px 圆形，`background: var(--text-hi)`，白色图标，hover scale(1.06)。播放时切换为暂停图标（双竖线）。

**布局**：时间码居左，播放按钮居中，音量/全屏/速度居右。

**音量控制**：点击音量图标弹出滑块 Popover，初始 50%，实时显示百分比。

**倍速控制**：点击速度按钮弹出选项列表（0.8×、1×、1.2×、2×），选中后影响播放速度。

**全屏**：调用浏览器 Fullscreen API。

### 8.3 视频预览 — 三级降级策略

播放区域根据素材生成状态，按以下优先级展示：

**1. 视频已就绪**：显示渐变色块模拟视频画面 + 右上角 `视频` 标签（橙色）
**2. 视频未生成，但有分镜图**：显示渐变模拟分镜图（亮度 0.30+）+ 右上角「分镜图」badge
**3. 两者都没有**：显示文字描述，包含：
   - **音乐结构标签**：如 `VERSE 1`、`CHORUS`、`BRIDGE`、`OUTRO`（大写）
   - **画面描述**：Libre Baskerville 字体，1rem，行高 1.75，居中展示
   - 底部提示："视频生成中，以下为分镜描述"

底部标签栏显示格式：`片名 · 音乐结构 · 时间码`

---

## 九、轨道工具栏

高度 40px，`background: var(--bg-surface)`，上下各 1px border。

**左侧工具按钮**（tlb 类）：
- `height: 26px`，透明背景，hover `var(--bg-hover)`
- 图标+文字组合：分割（分道线图标）、删除（X 图标）

**分隔符**（`.tl-sep`）：1px 竖线，`height: 16px`

**撤销/重做按钮**（精简版独有）：
- 撤销（↩ 图标）、重做（↪ 图标）
- 无历史时 `opacity: 0.4` + `pointer-events: none`
- 有历史时 `opacity: 1` + 可点击

**右侧**（ml: auto）：
- 完整版（mv-editor.html）：`+ 新增歌词字幕`（橙色 muted 背景，橙色文字，橙色边框）
- 精简版（mv-editor-simple.html）：无右侧按钮

---

## 十、时间轴区域

`background: var(--tl-bg)`，flex:3。

### 10.1 整体结构

时间轴是一个水平滚动容器：
```
[轨道头列 84px，sticky left, z-index: 15]  [时间轴内容，min-width: dur × zoom]
```

轨道头列背景：`var(--head-bg)`，右侧 `1px solid var(--border)`

### 10.2 轨道头

每条轨道头高 48px，`border-bottom: 1px solid var(--border-faint)`

左侧 3px 色条（绝对定位，top/bottom 各 4px）：
- 视频轨：`var(--text-hi)`（深灰黑）
- 音频轨：`var(--text-lo)`（浅灰）
- 歌词轨：`var(--acc)`（橙色，仅完整版）
- 动态视频轨：`var(--border)`（更浅）

轨道名：`font-size: 0.6875rem`，`font-weight: 600`，`color: var(--text-mid)`，**居中对齐**

### 10.3 时间尺

高 28px，`background: var(--ruler-bg)`，底部 `1px solid var(--border)`

刻度：
- 每 15 秒：主刻度线（`var(--border-firm)`，从底部 12px 高）+ 时间标签
- 每 5 秒：次刻度线（`var(--border)`，从底部 8px 高）
- 时间标签：`font-size: 0.5625rem`，`transform: translateX(-50%)`

可点击跳转（`cursor: pointer`）

### 10.4 播放头

- 宽 2px，`background: var(--ph-color)`
- 顶部三角形帽：`clip-path: polygon(0 0, 100% 0, 50% 100%)`，宽 12px，高 8px
- z-index: 20，pointer-events: none
- 随播放实时更新 left 值

### 10.5 轨道行

每条轨道行高 48px，`background: var(--tl-bg)`，`border-bottom: 1px solid var(--border-faint)`

`position: relative`（素材块绝对定位在其中）

### 10.6 文件版本差异

- **完整版**（mv-editor.html）：视频轨 1 + 视频轨 2 + 音频轨 + 歌词轨，支持新增轨道和新增歌词字幕
- **精简版**（mv-editor-simple.html）：仅视频轨 + 音频轨两条轨道，无歌词相关功能

---

## 十一、素材块（Clip）设计

### 11.1 基础样式

```css
.clip {
  position: absolute;
  top: 5px; bottom: 5px;
  border-radius: var(--r);
  cursor: grab;
  overflow: hidden;
  user-select: none;
}
.clip:hover { box-shadow: var(--sh-sm); }
.clip.sel  { box-shadow: 0 0 0 2px var(--acc), var(--sh-md); z-index: 5; }
```

### 11.2 类型样式

**视频轨1（cv1）**：
- `background: oklch(0.935 0.004 50)` 近白
- `border: 1px solid oklch(0.830 0.005 50)`
- 文字：`var(--text-hi)`（深色）
- 装饰：帧刻度线（等间距竖线）

**音频轨（cau）**：
- `background: oklch(0.945 0.003 50)` 极浅灰
- `border: 1px solid oklch(0.850 0.004 50)`
- 覆盖 Canvas 绘制波形（伪随机，基于 clip ID seed，opacity: 0.35）

### 11.3 内容区

```
padding: 0 var(--s2)
上层：素材名（0.625rem, 600, 截断）
下层：时长（0.5rem, opacity: 0.65）
```

### 11.4 拖拽调整柄（Resize Handles）

两侧各一个 7px 宽区域，`cursor: col-resize`

`::after` 伪元素：2px × 14px 竖线，`opacity: 0.30`，hover 变 0.65

### 11.5 音频波形 Canvas 算法

```js
function drawWave(canvas, id) {
  // 确定性伪随机（LCG）
  let seed = [...id].reduce((a,c) => a * 31 + c.charCodeAt(0), 1);
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff;
  };
  const W = canvas.width, H = canvas.height, mid = H / 2;

  ctx.beginPath();
  ctx.moveTo(0, mid);
  for (let x = 0; x <= W; x++) {
    const amp = (Math.sin(x*0.035)*0.55 + Math.sin(x*0.11)*0.30 + rand()*0.15) * (mid*0.75);
    ctx.lineTo(x, mid - amp);
  }
  for (let x = W; x >= 0; x--) {
    const amp = (Math.sin(x*0.035)*0.55 + Math.sin(x*0.11)*0.30 + rand()*0.15) * (mid*0.75);
    ctx.lineTo(x, mid + amp);
  }
  ctx.closePath();
  ctx.fillStyle = 'oklch(0.600 0.005 50)';
  ctx.globalAlpha = 0.45;
  ctx.fill();
}
```

---

## 十二、交互行为

### 12.1 素材块选中

- 点击：移除所有 `.sel`，当前加 `.sel`（橙色 2px 边框发光）
- 点击空白处：取消选中

### 12.2 素材块移动（Drag Move）

```
mousedown（素材中心区域）→ 记录 { x0, origLeft }
mousemove → newLeft = origLeft + (e.clientX - x0)
  边界限制：newLeft = max(0, newLeft)
  实时更新 el.style.left
mouseup → 排序 + 紧靠 + 清除监听
```

mouseup 时执行**插入排序 + 紧密排列**：
1. 根据最终位置计算新起始时间（0.5s 吸附）
2. 从原位置移除 clip，插入新位置
3. 按 start 时间排序
4. 重新紧靠：每个 clip 起始 = 前一个 clip 结束，无间隙
5. `pushHistory()` — 记录到撤销栈

```js
clips.sort((a, b) => a[0] - b[0]);
for (let i = 1; i < clips.length; i++) {
  clips[i][0] = clips[i-1][0] + clips[i-1][1];
}
renderAllClips();
```

**初始化紧靠**：`init()` 阶段对所有轨道执行同样的排序 + 紧靠逻辑。

### 12.3 素材块裁剪（Resize）

```
mousedown（左右拖拽柄）→ 记录 { x0, origLeft, origWidth, side }
mousemove:
  if side === 'l':
    newLeft  = origLeft + dx
    newWidth = origWidth - dx
    约束：width > 20px
  if side === 'r':
    newWidth = origWidth + dx
    约束：width > 20px
mouseup → 清除监听
```

### 12.4 时间轴缩放

`Ctrl/Cmd + 滚轮`：
```js
zoom = clamp(zoom * (deltaY > 0 ? 0.85 : 1.18), 4, 80)
renderRuler(); renderAllClips(); updatePH();
```

### 12.5 进度条跳转

点击进度条 → `t = pct * dur` → 更新播放头、时间码

点击时间尺 → `t = (clickX + scrollLeft) / zoom` → 同上

### 12.6 播放

模拟播放（定时器，每 100ms +0.1s × speed）：
- 更新 `playhead.style.left`
- 更新进度条宽度 + 圆点位置
- 更新时间码
- 自动滚动：若播放头超出视口右侧 80px 内，平滑滚动时间轴

### 12.7 撤销 / 重做

```js
pushHistory() → 深拷贝 CLIPS 推入 undo 栈，清空 redo 栈（max 30）
undo() → 从 undo 弹出推入 redo，恢复 CLIPS，重绘
redo() → 从 redo 弹出推入 undo，恢复 CLIPS，重绘
```

触发 undo/redo 的操作：删除 clip、分割 clip、拖拽 clip、导入素材到轨道。

---

## 十三、歌词字幕弹窗（完整版独有）

触发：点击"+ 新增歌词字幕"

遮罩：`background: oklch(0.175 0.009 56 / 0.32)`，`backdrop-filter: blur(3px)`

宽度 440px，`border-radius: var(--r-xl)`

LRC 解析逻辑：
```js
const regex = /\[(\d+):(\d+(?:\.\d+)?)\](.+)/;
// time = min*60 + sec
// 每段时长 = 下一段时间 - 本段时间（最后一段默认 10s）
```

---

## 十四、演示数据（预填充）

**全局**：BPM = 128，总时长 = 3:45（225秒），默认缩放 20px/s

**素材库**：

| 分类 | 类型 | 素材 |
|------|------|------|
| 通用 | 视频 | 城市夜景(12s)、霓虹街道(8s)、人群剪影(15s)、车流延时(20s)、天际线(10s)、地铁站台(18s) |
| 通用 | 图片 | 封面背景.jpg、纹理叠层.png、光晕素材.png、Logo白版.svg |
| 通用 | 音频 | 无名之曲.mp3(3:45)、环境噪声.wav(30s) |
| Option A | 视频 | 主角特写A1(6s)、主角侧脸A2(5s)、主角全景A3(8s)、主角回眸A4(4s) |
| Option B | 视频 | 空镜B1(10s)、空镜B2(8s)、空镜B3(12s)、空镜B4(6s) |
| Option C | 视频 | 特效镜头C1(6s)、转场特效C2(4s) |

**时间轴**（单位：秒）：

> 初始化时 clip 自动紧靠，无间隙。

| 轨道 | 素材（完整版） |
|------|------|
| 视频轨1 | 城市夜景[0-12]、霓虹街道[12-20]、主角特写A1[20-26]、主角侧脸A2[26-31]、天际线[31-41]、主角回眸A4[41-53]、霓虹街道[53-61]、城市夜景[61-67] |
| 视频轨2 | 空镜B2[0-8]、人群剪影[8-20]、地铁站台[20-30] |
| 音频轨 | 无名之曲.mp3[0-225]（横贯全程） |
| 歌词轨 | 就算你忘了我[15-27]、还有这首歌记得你[30-52]、时光停在那一刻[60-100]、永远[120-150] |

| 轨道 | 素材（精简版） |
|------|------|
| 视频轨 | 城市夜景[0-12]、霓虹街道[12-20]、主角特写A1[20-26]、主角侧脸A2[26-31]、天际线[31-41]、主角回眸A4[41-53]、霓虹街道[53-61]、城市夜景[61-67] |
| 音频轨 | 无名之曲.mp3[0-225]（横贯全程） |

**播放头初始位置**：00:26（t = 26s，落在「主角特写A1」分镜图上）

---

## 十五、动效规范

| 场景 | 属性 | 时长 | Easing |
|------|------|------|--------|
| Popover 入场 | opacity + translateY(5px) + scale(0.97) | 140ms | ease-out |
| Modal 入场 | opacity + translateY(18px) + scale(0.96) | 180ms | ease-out |
| 素材 hover | transform: translateY(-1px) + box-shadow | 120ms | ease |
| Tab 切换 | （无动画，即时切换，保持快速感） | — | — |
| 进度条更新 | width 渐变 | 80ms | linear |
| 素材选中边框 | box-shadow | 100ms | ease |
| 播放按钮状态 | transform: scale | 100ms | ease |
| 脉冲 Loading | opacity 0.3 → 1 | 1.2s | ease-in-out 循环 |

**禁止**：任何使用 `border-left` 或 `border-right` > 1px 作为装饰色条的写法（使用绝对定位色块替代）；渐变色文字；高斯模糊玻璃效果。

---

## 十六、键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `Space` | 播放 / 暂停 |
| `Delete` / `Backspace` | 删除选中素材 |
| `S` | 在播放头处分割 |
| `Cmd/Ctrl + Z` | 撤销（仅精简版） |
| `Cmd/Ctrl + Shift + Z` | 重做（仅精简版） |
| `Ctrl/Cmd + 滚轮` | 时间轴缩放 |
| `Enter`（chat 输入框中） | 发送消息 |
| `Shift + Enter`（chat 输入框中） | 换行 |

> 已移除：G（节拍网格切换）、Shift+拖拽（临时关闭节拍吸附）

---

## 十七、图标系统

全部使用 inline SVG（Feather 风格），stroke-based，`fill: none`，`stroke-width: 1.8-2.0`。不使用 emoji。

| 图标 | 用途 |
|------|------|
| 返回箭头（polyline） | 顶部工具栏返回（完整版） |
| 下载（path + polyline） | 导出成片 |
| 分道线（line × 3） | 分割 |
| X（line × 2） | 删除 |
| 撤销（polyline + path） | 撤销 |
| 重做（polyline + path） | 重做 |
| 加号（line × 2） | 新增歌词 |
| 播放/暂停（polygon/rect） | 播放控制 |
| 音量（polygon + path） | 音量控制 |
| 全屏（polyline + line） | 全屏切换 |
| 上传（path + polyline + line） | 导入素材卡片 |
| 附件（path） | 聊天附件 |
| 工具/齿轮（circle + path） | 聊天工具 |
| 发送（line + polygon） | 聊天发送 |
| 视频播放（rect + polygon） | 标签页图标 |

---

## 十八、视频预览三级降级

| 状态 | 展示内容 | 标签 |
|------|---------|------|
| 视频已就绪 | 画面占位（渐变模拟） | 橙色 `视频` |
| 视频未生成，有分镜图 | 分镜图铺满画面（渐变，亮度 0.30+） | `分镜图` |
| 两者都没有 | 音乐结构标签 + 画面描述（白色文字） | `描述` |

Clip 数据结构：`[start, dur, label, cssClass, options]`
- `options.videoReady` — 视频是否已生成
- `options.imageSeed` — 分镜图 seed
- `options.structure` — 音乐结构（Intro/Verse/Chorus/Bridge/Outro）
- `options.desc` — 画面描述文字

---

## 十九、歌词生成（完整版独有）

点击"新增歌词字幕"后不弹弹窗，直接：
1. 显示歌词轨道行 + 轨道头
2. 轨道内显示 loading："AI 正在分析歌词内容…"（旋转 spinner + 文字）
3. 3 秒后自动填充歌词数据

---

## 二十、技术要求（给实现方）

- **单 HTML 文件**，无外部 JS 框架，无后端
- CSS：原生 CSS，使用 CSS 变量，OKLCH 颜色
- 布局：CSS Grid + Flexbox，精简版为 chat-panel + editor-area 双栏，editor-area 内 editor-top flex:7 + editor-bottom flex:3
- 素材面板/视频预览：30% / 70% 比例
- 时间轴素材：`position: absolute` 在 `position: relative` 的轨道行内
- 音频波形：Canvas 2D API，确定性伪随机（LCG）
- 字体：Google Fonts — Libre Baskerville（全量）
- 不需要真实视频播放，使用渐变色块模拟
- 不需要真实文件导入，使用硬编码 Demo 数据 + `<input type="file">` 系统文件选择
- 素材缩略图：CSS 渐变占位，由文件名生成暖灰色调
- 音量/倍速：Popover + range slider + radio list
- 全屏：调用浏览器 Fullscreen API
- 撤销/重做：深拷贝 CLIPS 到栈中，max 30 层

---

*设计文档版本：2026-04-23 v6*
*设计依据：impeccable 设计原则 + 音乐MV剪辑台功能调研*
*变更历史：*
- *v1 → v2：顶部工具栏精简为返回+导出；轨道头移除锁定/隐藏/静音等操作图标；素材色从彩虹色改为黑白灰+橙点缀*
- *v2 → v3：素材/视频区域从 262px 固定改为 30%/70% 比例；"通用"Tab 改为 "All"；所有字体统一为 Libre Baskerville；新增音量/倍速 Popover；全屏按钮调用 Fullscreen API；视频预览三级降级*
- *v3 → v4：移除节拍网格（Beat Grid）及其所有相关 CSS/DOM/交互*
- *v4 → v5：新增 mv-editor-simple.html（单视频轨+单音频轨）；clip 拖拽结束后执行插入排序+紧密排列；init 阶段自动紧靠；Level 2 分镜图亮度提升到 0.30*
- *v5 → v6：精简版重大改版 — 新增 AI 对话面板（360px 左栏，含消息/富内容卡片/选项选择/输入发送）；顶部工具栏改为品牌标识+浏览器标签页+用户头像布局；时间轴工具栏新增撤销/重做（Cmd/Ctrl+Z）；面板改为卡片式圆角设计；新增聊天快捷键（Enter 发送）*
