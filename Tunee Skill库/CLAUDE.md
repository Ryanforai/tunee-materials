# Tunee Skill 库

## 项目简介

Tunee MV Studio 的 Claude Skill 合集。每个子目录是一个独立的 Claude Skill，可直接安装到 Claude Code 中使用。

---

## 目录结构

```
Tunee Skill库/
├── cinematic-prompt-generator/   ← 电影感图片提示词生成 Skill
│   ├── SKILL.md                  ← Skill 入口，定义触发条件和执行流程
│   └── references/               ← 9个模块的知识库（主题/景别/构图等）
├── cinematic-prompt-generator.zip ← 打包版（供分发安装）
└── free-music-generator.zip       ← 免费音乐生成 Skill 打包版
```

---

## Skill 说明

### cinematic-prompt-generator

生成高级感、电影感、真实感的 AI 图片提示词，适用于 Midjourney、Stable Diffusion、Nano Banana Pro 等工具。

基于 9 个物理维度构建提示词：主题描述 → 景别 → 构图 → 焦段+虚实 → 明暗骨架 → 冷暖阶级 → 逻辑验证 → 相机+胶片 → 神态+气质。

详细规则见 `cinematic-prompt-generator/SKILL.md` 和 `references/` 目录。

### free-music-generator

免费音乐生成 Skill，已打包为 zip 格式，解压后可安装使用。

---

## 安装方式

将 Skill 文件夹放置到 Claude Code 的 Skills 目录，或解压 zip 包安装：

```bash
# 示例：安装 cinematic-prompt-generator
cp -r cinematic-prompt-generator ~/.claude/skills/
```
