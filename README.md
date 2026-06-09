<h1 align="center">
  <img src="./src-tauri/icons/icon.png" alt="RedClash" width="128" />
  <br>
  <b>RedClash</b>
  <br>
</h1>

<p align="center">
  <i>自用的 Clash 桌面客户端 · 红黑主题 · 仅Windows</i>
</p>

<p align="center">
  <a href="https://github.com/JiaHuiRed/RedClash/stargazers">
    <img src="https://img.shields.io/github/stars/JiaHuiRed/RedClash?style=for-the-badge&color=red" alt="Stars" />
  </a>
  <a href="https://github.com/JiaHuiRed/RedClash/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/JiaHuiRed/RedClash?style=for-the-badge&color=blue" alt="License" />
  </a>
  <a href="./Changelog.md">
    <img src="https://img.shields.io/github/package-json/v/JiaHuiRed/RedClash?style=for-the-badge&color=green" alt="Release" />
  </a>
  <a href="https://github.com/JiaHuiRed/RedClash">
    <img src="https://img.shields.io/badge/platform-Windows-0078D6?style=for-the-badge&logo=windows" alt="Platform" />
  </a>
</p>

<p align="center">
  <a href="#-特性">✨ 特性</a> ·
  <a href="#-技术栈">🚀 技术栈</a> ·
  <a href="#-开发">🛠️ 开发</a> ·
  <a href="./Changelog.md">📋 更新日志</a> ·
  <a href="#-致谢">❤️ 致谢</a> ·
  <a href="#-许可">📜 许可</a>
</p>

---

## ✨ 特性

基于 [clash-verge-rev](https://github.com/clash-verge-rev/clash-verge-rev) v2.5.2 深度定制：

- 🎨 **4 套主题配色** — 红色 / 深蓝（默认）/ 护眼绿 / 米黄
- 🌗 **明暗双模式** — 默认深色启动，支持浅色 / 深色 / 跟随系统
- 🪟 **macOS 风格窗口** — 交通灯 group hover（✕/−/⤢ 符号）+ 毛玻璃标题栏（blur 28px），所有平台统一
- 🪟 **Windows-only** — 精简掉 macOS / Linux 平台代码，专注 Windows
- 🖼️ **全新图标** — 黑猫冰淇淋（Jiang 系列）
- ⚡ **保留核心功能** — 订阅管理、代理切换、规则配置、TUN 模式、备份、WebDAV
- 🧹 **精简界面** — 只保留首页/代理/订阅/设置四个页面，移除连接/日志/规则/测试/解锁等低频页面
- 🌐 **中文优先** — 只保留中文语言包，减少包体体积

## 🚀 技术栈

| 层级 | 选型 |
| --- | --- |
| 框架 | [Tauri 2](https://github.com/tauri-apps/tauri) |
| 前端 | React 19 + TypeScript + Vite |
| UI | [MUI](https://github.com/mui/material-ui) |
| 代理核心 | Mihomo（已集成在 sidecar）|
| 包管理 | pnpm |

## 🛠️ 开发

### 环境要求

- **Node.js** 18+
- **pnpm** 9+
- **Rust** 1.95+（项目固定版本，见 `rust-toolchain.toml`）
- **Tauri** 系统依赖 → 见 [Tauri 官方文档](https://tauri.app/start/prerequisites/)

### 启动开发

```bash
pnpm install
pnpm run tauri dev
```

### 构建发行

```bash
pnpm run tauri build
```

构建产物在 `src-tauri/target/release/bundle/` 下。

## 📦 项目结构

```
RedClash/
├── src/                    # React 前端
│   ├── pages/             # 页面（代理/配置/设置）
│   │   ├── _theme.tsx     # 4 套主题色板定义
│   │   └── _layout/       # 布局 hooks
│   ├── components/setting/mods/
│   │   ├── theme-mode-switch.tsx      # 浅/深/系统
│   │   └── theme-palette-switch.tsx   # 4 套配色
│   └── ...
├── src-tauri/              # Rust 后端
│   ├── src/config/verge.rs  # 主题配置 (theme_palette)
│   └── ...
└── script/
    └── generate-icons.ts   # 图标生成脚本（jiang.ico → 各种尺寸）
```

## ❤️ 致谢

| 项目 | 说明 |
| --- | --- |
| [clash-verge-rev](https://github.com/clash-verge-rev/clash-verge-rev) | 上游项目，本项目基于 v2.5.2 |
| [Clash Verge](https://github.com/zzzgydi/clash-verge) | 原始项目 |
| [Mihomo](https://github.com/MetaCubeX/mihomo) | 代理核心 |
| [Tauri](https://github.com/tauri-apps/tauri) | 桌面框架 |

## 📜 许可

本项目遵循 [GNU GPL v3.0](./LICENSE) 协议。
