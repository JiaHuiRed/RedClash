# Changelog

## v0.0.4 (2026-06-06)

### 🎉 新增功能

- **macOS 风格窗口 chrome**：交通灯（红/黄/绿）+ 毛玻璃标题栏，覆盖所有平台。替代 Windows 原生标题栏，与 RedCode 风格统一
- **深蓝主题（DeepBlue）**：v0.0.2 主题系统的新调色板，深色 `#0D1B2A` / 浅色 `#F0F4FA`

### 🚀 优化改进

- **红色调色板色相修正**：dark mode background `#1A1A2E` → `#2A1418`（深红黑），light mode `#F5F5F5` → `#F5E8E8`（淡红白）。切换红色调色板时主内容区、侧边栏顶部、标题栏背景都正确变红（之前只有按钮变红）
- **移除"优先系统标题栏"开关**：decorations 改由 Rust 端 `DEFAULT_DECORATIONS` 强制控制，UI 开关失去意义
- **移除未使用的 home/log/rule/test 页面及对应 i18n 词条**：精简包体，减少首次加载翻译资源体积
- **移除未使用的 SVG 图标**（connections/home/logs/rules/unlock/test/apple/github/google/youtube）：减少 dist 资源

### 🐞 修复问题

- **Windows 标题栏与 React 端交通灯并排显示**：根因在 `src-tauri/src/utils/resolve/window.rs:24` 的 `DEFAULT_DECORATIONS` 常量在 Windows/macOS 平台写死为 `true`，Rust builder 调用 `.decorations(DEFAULT_DECORATIONS)` 覆盖了 `tauri.conf.json` 的 `decorations: false`。改 Rust 常量为 `false` 让 React 端 `WindowControls` 接管
- **`tauri.conf.json` 残留 `titleBarStyle: "Overlay"`**（macOS-only，Windows 上无效）：移除
- **`layout.scss:147-163` 悬空代码块**（unmatched `}` 导致整个 React 树挂掉、Vite 报 sass 错误覆盖整个窗口）：清理
- **Vite import 残留**：`_layout.tsx` 引用已删除的 `icon_dark.svg?react` / `icon_light.svg?react` 报 import-analysis 错误 — SVG 已删除，移除 import 与 JSX

### 🔨 构建

- **`pnpm dev`** 走 `verge-dev` feature 编译后端
- **`pnpm build`** 走 release 模式生成 NSIS 安装包（`bundle.targets: ["nsis"]`，`tauri.windows.conf.json` 配置）
- **cargo features**：`protocol-asset / devtools / tray-icon / image-ico / image-png`

## v0.0.3 (2026-06-06)

### 🪟 窗口 chrome 重塑（macOS 风格）

- **WindowControls 统一 3 圆点交通灯**（红/黄/绿），所有平台同一套，去掉 OS 分支判断（macos/windows/linux 各自一套样式合并）
- **去掉 MUI IconButton 与 Box 圆点**，改用原生 `<button>` 配合 inline sx
- **hover 时显色**，idle 时饱和度降低（macOS 风格）
- **毛玻璃 titlebar**：`backdrop-filter: saturate(180%) blur(20px)` + 半透背景（CSS 变量 `--titlebar-bg`）
  - light: `rgba(245, 245, 245, 0.72)`
  - dark: `rgba(13, 27, 42, 0.6)`
- 去掉 `layout.scss` 里 `.macos` / `.windows` / `.linux` 三套平台分支

### ⚙️ 窗口配置

- `tauri.conf.json` → `app.windows[0]`：`decorations: false` / `transparent: true`
- 默认 1024×720，min 800×540
- `titleBarStyle: "Overlay"` 后续 v0.0.4 移除（macOS-only，Windows 上无效）

### 🎨 主题调色

- `_theme.tsx` 默认 palette 由 `red` 改为 `blue`
- 4 套色板（red/blue/green/beige）保留，blue 排第一
- light + dark 蓝系（macOS 玻璃感）

### 🧹 清理 updater 体系

- 删 `tauri-plugin-updater` 依赖
- 删 `tauri.conf.json` → `plugins.updater` 配置
- 删 `capabilities/desktop.json` → `updater:*` 权限
- 删 `core/updater.rs` 整个文件（579 行） + `mod.rs` 的 `pub mod`
- 删 `lib.rs` → `tauri_plugin_updater` plugin 注册
- 删 `utils/resolve/mod.rs` → `init_silent_updater` 调用

### ✅ 验证

- `cargo check` 通过
- `bun typecheck` 通过

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
