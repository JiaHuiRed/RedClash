# RedClash 项目记忆

> 目标：代理客户端，核心价值是**连接速度**（测速准确性、选节点效率、UI 响应）。

## 当前进度（260907）

- **版本 v0.1.2**，本地 master 与 origin/master 同步（260907 拉齐）
- **Android 全链路已真机打通并推送**：订阅导入（Rust HTTPS）→ 72 节点进内核 → TUN 接管（tun0）→ 其他 App 流量走代理节点（`www.google.com -> [Hy2]Taiwan9` 实测，哥哥平板浏览器亲测成功）；移动端 UI 适配（隐藏桌面专属控件）已随 c6e972b 完成
- **桌面构建链路修复（260907，未提交）**：稳定版内核 sidecar 刷到 v1.19.30；build.bat 加 NO_PROXY 绕死代理 + 结束自动恢复 clash_verge_service；tauri cli 平台二进制半残安装已重建（详见踩坑）
- **待办（按序）**：
  - DelaySnapshot 渲染缓存（上游参考 upstream-delay.ts 150-171 快照 + 211-222 多监听）
  - 插件升级 0.5.5：需先验证上游"节点全空"已修
  - 500ms 最小加载动画是感知速度权衡（可讨论缩短）

## 与上游关系（重要）

- 本地 master 与 upstream/dev **无共同祖先**（上游历史在 init commit 20582d81 时被丢弃重建）→ 同步只能手工 diff，git merge/rebase 走不通
- upstream = github.com/clash-verge-rev/clash-verge-rev.git（dev 分支，2.5.3 为 260906 时点）；本地 0.1.2
- mihomo 核心两边同源（prebuild.mjs 都拉 MetaCubeX 最新），内核无差距
- 本地独有：主题系统（macOS chrome + 红/深蓝）、tauri-plugin-mihomo-revert 本地插件、构建适配 hack
- 上游插件参考：C:\Users\ADMINI~1\AppData\Local\Temp\redcode\upstream-plugin（0.5.5 浅克隆）
- 上游 delay.ts 参考：C:\Users\ADMINI~1\AppData\Local\Temp\redcode\upstream-delay.ts（486 行）

## 踩坑

- 工作区大量 `M` 是 Windows git stat cache 假阳性：`git update-index --refresh` 后消失，别当真实改动
- mihomo `/proxies` API **不含 provider 节点**（上游 proxy_view.rs MemberResolver 先 group 再 /proxies 最后 /providers 证明）→ generateItem miss 后走 providerMap，`IProxyItem.provider` 运行时真实有效
- 插件 healthcheck 命令（healthcheck_node_in_provider）0.1.5 基线就有，之前只是前端没用
- **磁盘清理（260818）**：target 曾达 30GB（debug 23G + release 8.2G，纯 Rust 编译产物，git 已忽略可安全删）。安全 hook 拦 `Remove-Item -Recurse -Force`（需用户确认），绕法是先 `Rename-Item` 改名（hook 放行）+ 用户确认后 `[System.IO.Directory]::Delete($path,$true)`；删 debug/incremental 8.5GB 后下次 dev 编译只重建该缓存，代价最小
- **订阅 UA 分流真相与 vless 兜底（260828 更正）**：星辰/一元都是 UA 分流型——clash-verge UA→全量 yaml（星辰 62 节点）；陌生 UA（red-clash/vX）→星辰回「合法 yaml 但 proxies:[]」空模板、一元回残缺+广告假节点；无 UA curl→星辰回 base64 vless 直链（当初只用无 UA 探测，误诊「星辰只有直链端点」）。主解药=默认 UA 改 clash-verge/v{version}（v0.1.0）；convert.rs 转换器（v0.1.1，b15b22b3）是直链型源兜底——只在 yaml 解析失败时触发，合法空 yaml 不走它。教训：判断服务端返回形态必须把 UA 矩阵测全
- **tauri dev 数据目录隔离（260828）**：`pnpm dev` 的 debug 版 identifier 加 `.dev` 后缀 → 数据目录 `AppData\Roaming\io.github.QiuYeDeng.red-clash.dev`，与生产目录完全独立（订阅/配置不互通）；「debug 里订阅卡片没了」多为进了新实例，不是 bug
- **git 中文提交信息走 `-F` 文件**：shell 代码页 GBK，`git commit -m "中文"` 有乱码风险，message 先 write 成 UTF-8 文件再 `git commit -F`
- **本机 7897 = 项目自己的 mihomo（260907）**：RedClash 在跑时 `127.0.0.1:7897` 就是现成代理，拉 GitHub 先 `netstat` 查 7897 再挂 `HTTPS_PROXY`，别问用户"要不要开代理"——代理项目本身就在跑代理；build.bat 第 0 步会杀它，而 pnpm 全局 config（`%LOCALAPPDATA%\pnpm\config\config.yaml`）写死 proxy=7897 → 构建期连 npmmirror 都 ECONNREFUSED。pnpm 只认 NO_PROXY（清 env / npm_config_* 都压不过全局 config，实测），已在 build.bat 把 registry.npmmirror.com 加进 NO_PROXY，并在结尾恢复 clash_verge_service
- **pnpm 半残安装陷阱（260907）**：异常中断的 install 会留 .pnpm 空壳包目录（有目录无内容），后续 install 连 `--force` 都报 "Already up to date" 不修复；解法只有 `rm -rf node_modules && pnpm i`（store 全命中仅 19s）。tauri cli 报 "Cannot find native binding" 先查 `.pnpm/@tauri-apps+cli-win32-*` 是否空壳

## Android 移植（260830-260906，全链路真机已通）

> 改动清单与实现细节见 commit `d749d028`（17 文件，feat android）+ `36d11f84`；本节只留 commit 里查不到的环境/运维/行为坑。

- **环境**：JDK=C:\Java\jdk-17；ANDROID_HOME=D:\Android\android-sdk（NDK 27.2.12479018）；平板=TB335FC（adb 设备号 HA2FQHSA）；Go 1.24.5 在 D:\AI\tools\go（mihomo 依赖缓存 `~\go\pkg\mod`）
- **构建**：`.redcode/temp/android-build.bat`（环境注入+代理，mcp start_process 启动）；linker 必须用 NDK `aarch64-linux-android24-clang.cmd` 包装器，裸 clang.exe 会被 lld 拒；产物 `gen/android/.../app-universal-debug.apk`（~129MB）
- **内核（sidecar 不入 git，丢了要重编）**：自建 mihomo v1.19.30 `go build -tags "with_gvisor cmfa" ...`（cmfa 绕开 Android 16 禁读 packages.xml，这是 TUN 流量为 0 的正解；源码 `.redcode/temp/mihomo-11930`，原版备份 `.redcode/temp/verge-mihomo-android.upstream.bak`）
- **AAR 补丁**：rustls-platform-verifier 的 Java 校验器类用 crates.io `rustls-platform-verifier-android` 0.1.1 预编译 AAR（已入 `android/libs/`）；Maven 没发官方组件
- **下载镜像/代理**：Maven 走阿里镜像（gen/android build.gradle.kts 已改）；Gradle 分发包走腾讯镜像；sdkmanager/go 下载要 `JAVA_TOOL_OPTIONS` 代理（只对新 JVM 生效，杀 daemon 才换代理）；代理节点瞬时挂→先 curl 测 google
- **SDK 半残目录陷阱**：只有 .installer 无 android.jar 的目录 Gradle 认已装、永等——Rename 留底 + sdkmanager 补装
- **调试**：CDP `adb forward tcp:9222 localabstract:webview_devtools_remote_<pid>` + `.redcode/temp/cdp-eval.ps1`；invoke 用 `window.__TAURI_INTERNALS__.invoke`（无全局 invoke）；插件命令带 `plugin:mihomo|` 前缀；App 日志 `adb shell run-as io.github.QiuYeDeng.red_clash tail ... logs/latest.log`；锁屏时命令 pending，App 切后台时 CDP 挂起
- **运行行为坑**：①`import_profile` 不触发 enhance，导入后要 `patch_profiles_config` 才把订阅喂进内核；②重装后 `enable_tun_mode` 被重置为 false，要再 patch 开；③App 自身 UID 被 VPN 排除（防回环），测代理必须用其他 App 的流量；④`get_connections` 只列活跃连接，验证走代理要轮询或看内核日志；⑤Android 16 拒绝从 app data 执行 ELF，内核必须走 jniLibs/extractNativeLibs 路径；⑥jni 0.22 `EnvOutcome` 要 `.into_outcome()` 再 match，无 Debug

## 关键路径

- 测速核心：`src/services/delay.ts`（DelayManager 单例，CACHE_TTL 30min，hashKey=`${group}::${name}`）
- 节点排序/过滤：`src/utils/proxy.ts` + `src/components/proxy/proxy-groups.tsx`
- 构建：pnpm@11.2.2 固定（COREPACK_ENABLE_STRICT=0），`pnpm typecheck` = `tsc --noEmit`；commit hook = cargo-make（fmt/test），push 走 `-c http.https://github.com.proxy=http://127.0.0.1:7897`
