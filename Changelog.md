# Changelog

## v0.0.2 (2026-06-06)

### 🎨 主题系统升级

#### ✨ 4 套主题配色

- 🔴 **红色**（默认）— 经典 RedClash 风格
- 🔵 **深蓝** — 沉稳专业
- 🟢 **护眼绿** — 长时使用不疲劳
- 🟡 **米黄** — 暖色调

在 `设置 → 主题配色` 切换。

#### 🌗 默认深色启动

- `theme_mode` 默认 `dark`（跟随系统可手动选 light）
- 启动时立即应用深色主题

#### 🎯 主题色板架构

- 新增 `ThemePalette` 类型：`'red' | 'blue' | 'green' | 'beige'`
- `getThemeByPalette(palette, mode)` 函数统一取色
- `useThemePalette` signal + `ThemePaletteProvider` context
- `verge.theme_palette` 配置持久化（Rust 端 `Option<String>` + `patch!`）

#### 🧩 新增组件

- `theme-palette-switch.tsx` — 配色切换按钮组
- i18n 4 个色系名（`red` / `blue` / `green` / `beige`）

### 🪟 Windows-only 精简

#### 🗑️ 删除

- `tauri.linux.conf.json` / `tauri.macos.conf.json`
- `packages/linux/` / `packages/macos/`
- `icons/icon.icns`（macOS）
- `images/background.png`（DMG 背景）
- `Cargo.toml` macOS-only `objc2*` 依赖

#### 🛡️ 保留

- Rust 代码中 `#[cfg(target_os = "macos"/"linux")]` 块原样保留
  - 不影响 Windows 编译
  - 以后想恢复 macOS / Linux 支持时不用重写

### 🖼️ 图标替换

- 用 `C:\Users\Administrator\Pictures\jiang.ico`（黑猫冰淇淋，256×256）
- 替换全部 14 个尺寸 + 8 个托盘图标
- `script/generate-icons.ts` 用 Pillow 读取 ICO → sharp 切各种尺寸
- 工作目录 `.icon-work/` 已清理

## v0.0.1 (2026-06-06)

### 🎉 初始版本

基于 [clash-verge-rev v2.5.2](https://github.com/clash-verge-rev/clash-verge-rev) 二次开发。

#### 🔄 品牌更名

- 项目名：Clash Verge Rev → **RedClash**
- 版本号：从 v2.5.2 → v0.0.1（独立版本起点）
- 所有用户可见字符串改为 RedClash
- Tauri 配置、Cargo 元数据、包名统一更新

#### 🎨 主题配色（v0.0.1 初版）

- 主色调：红色系（`#DE3C4B` / `#FF4757`）
- 暗色背景：深蓝黑（`#1A1A2E`）

#### 🖼️ 视觉资源

- 全新应用图标：红黑配色 + 闪电标识（v0.0.2 替换为 jiang.ico）

#### ❤️ 致谢上游

本项目的所有核心功能来自 [clash-verge-rev](https://github.com/clash-verge-rev/clash-verge-rev)，在此表示感谢。
