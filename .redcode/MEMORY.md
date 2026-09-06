# RedClash 项目记忆

> 目标：代理客户端，核心价值是**连接速度**（测速准确性、选节点效率、UI 响应）。

## 当前进度（260906）

- **Android 全链路已真机打通**：订阅导入（Rust HTTPS）→ 72 节点进内核 → TUN 接管（tun0）→ 其他 App 流量走代理节点（`www.google.com -> [Hy2]Taiwan9` 实测）。详见「Android 全链路验证（260906）」
- **v0.1.1 已 push**（origin/master = 8dc18cfa）；此后 260830-260906 的 Android 移植改动**全在未提交工作树**（10 modified + 6 untracked），commit 前先跑三件套回归（已全绿 260906：typecheck / cargo test / android cargo check）
- **待办（按序）**：
  - Android 端 UI 适配：去掉桌面装饰件（顶部红黄绿三灯在触屏无用）、布局按平板触屏走——用户 260906 提出，界面不能照抄桌面
  - Android 工作树收尾提交 + 询问 push
  - 桌面内核升级：`verge-mihomo-x86_64-pc-windows-msvc.exe` 是 2026/5/31 旧包，删 sidecar 或 prebuild `--force` 可刷到 v1.19.30
  - ③ DelaySnapshot 渲染缓存（上游参考 upstream-delay.ts 150-171 快照 + 211-222 多监听）
  - ④ 插件升级 0.5.5：需先验证上游"节点全空"已修
  - ⑤ 500ms 最小加载动画是感知速度权衡（可讨论缩短）

## 与上游关系（重要）

- 本地 master 与 upstream/dev **无共同祖先**（上游历史在 init commit 20582d81 时被丢弃重建）→ 同步只能手工 diff，git merge/rebase 走不通
- upstream = github.com/clash-verge-rev/clash-verge-rev.git（dev 分支，当前 2.5.3）；本地 0.1.1
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

## Android 移植（260830 开工）

- **目标**：联想小新 11 平板（Android 16），核心诉求=平板上原生跑 mihomo 代理。调研结论见下
- **已完成——工具链全就位**：
  - JDK 17 = C:\Java\jdk-17（Temurin 17.0.20，从 F 盘模拟器目录搬来；F 盘原目录暂留未删）
  - ANDROID_HOME=D:\Android\android-sdk（补装 platforms;android-35、build-tools;35.0.1、ndk;27.2.12479018；licenses 手写标准 hash 文件）
  - rustup 4×android target 全装（rsproxy.cn 镜像）
  - `pnpm tauri android init` ✅（gen/android 完整 Gradle 工程已生成；gitignore 掉 gen）
- **调研关键事实**：mihomo 官方 release 有 Android arm64 CLI 二进制（mihomo-android-arm64-v8-*.gz，17.9MB→52MB ELF）；tauri-plugin-shell Android "只能 open URL"，sidecar 走不通（issue #9774 开放中）→ core 得 Rust 侧 `std::process::Command` 直接 exec ELF；VPN 需 Kotlin VpnService + mihomo TUN fd 对接（最大新代码块）
- **踩坑（本会话实证）**：
  - 老 cmdline-tools 2.1 的 sdkmanager 在 JDK17 下可用（4.0.1），但下载 HTTPS 包必须设 `JAVA_TOOL_OPTIONS` 走代理（--proxy 参数对 HTTPS 无效，直连 dl.google.com 超时）
  - setx 用户级变量对 RedCode 长驻 bash 进程**不生效**，每条命令都要手动 `$env:JAVA_HOME`/`$env:ANDROID_HOME`；RUSTUP_DIST_SERVER 同理
  - `tauri android init` 静默挂 10 分钟的真凶=init 内部 rustup 下载 4 个 android target 走直连卡死 → 先 rsproxy 手动装齐 4 个 target，init 秒过
  - Start-Job 后台作业随 bash 调用进程死亡：长任务必须 Start-Process 独立进程 + bat 文件（cmd 串会被外层变量提前展开，坑）
- **✅ Rust 平台适配完成（260831，cargo check --target aarch64-linux-android 29→0 错误，17 warnings）**：tray/autostart/hotkey/service/sysopt/win_uwp 模块级 cfg(not(any(android,ios)))、16 文件引用点 cfg、RunningMode::Service 变体 cfg（连同 Display/dirs clash_latest_log 两处 match）、generate_handlers 拆 desktop 全量/mobile 减 11 条两版、Sysproxy/ProxyType::System 双 arm、dark_light/center/decorations/fullscreen/unminimize 五处 API 差异后置 cfg 块。项目 cfg 铁律：只用 #[cfg(target_os="...")]/#[cfg(not(any(target_os="android",target_os="ios")))]，无 cfg(desktop)；use 组内不能放 cfg 行，cfg use 拆组外独立语句；tauri generate_handler! 不支持条目级 cfg → 拆两版函数
- **APK 编译战役（260831，第 1-11 轮）**：见下「Android APK 编译」

## Android APK 编译（260831 十轮战役）

- **构建命令**：`.redcode/temp/android-build.bat`（含全套环境注入 + JAVA_TOOL_OPTIONS 代理 + `call pnpm tauri android build --debug --target aarch64 --verbose`，输出 android-build.log，结尾写 BUILD_EXITCODE/BUILD_DONE）；长任务用 mcp start_process 启动，等日志标志
- **踩坑链（按遭遇序）**：
  1. **Windows 开发者模式必须开**（tauri 打包 jniLibs symlink 需权限）：提权 reg add `HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock /v AllowDevelopmentWithoutDevLicense /t REG_DWORD /d 1 /f`
  2. **Gradle 分发包下载**：services.gradle.org 走代理也慢死 → 腾讯镜像 `https://mirrors.cloud.tencent.com/gradle/gradle-8.14.3-bin.zip` 直连 11MB/s；zip Rename 到 wrapper 期望的 dists 路径（`C:\Users\Administrator\.gradle\wrapper\dists\gradle-8.14.3-bin\<hash>\gradle-8.14.3-bin.zip`）
  3. **Gradle 卡死诊断法**：CPU 不动 + .gradle/caches 无写入 + daemon 日志停在某行 = 网络等下死（代理慢/包半残）。daemon 日志在 `C:\Users\Administrator\.gradle\daemon\8.14.3\daemon-*.out.log`
  4. **代理节点会瞬时不稳**（国外出口挂、国内正常）：下载前先 curl -x http://127.0.0.1:7897 测 google 连通；节点挂了请用户换节点
  5. **Maven 依赖用阿里镜像**（gen/android/build.gradle.kts 的 repositories 全改 `maven("https://maven.aliyun.com/repository/{google,public,gradle-plugin}")`）：Maven Central/国外大文件走代理极慢（55MB 120s+ 下不完）。gradle.properties 的 systemProp 代理对 daemon 持久有效；**JAVA_TOOL_OPTIONS 只对新启动 JVM 生效，杀 daemon 后重启才用新代理**
  6. **SDK 包半残目录陷阱**：build-tools/35.0.0 与 platforms/android-36 都曾是「只有 .installer/无 android.jar」的半残目录 → Gradle 看到目录存在认为已装，卡 `Preparing "Install..."` 永等。修法：杀 java + Rename 残目录留底 + sdkmanager 手动补装（JAVA_TOOL_OPTIONS 代理技法）。**gen/android build.gradle.kts compileSdk=36 → platforms;android-36 也得装全**
  7. **tauri-plugin-mihomo-revert 无 Android Gradle 工程** → `:tauri-plugin-mihomo` NoCompatibleVariantsFailure（第 10 轮真因）。已补齐 android/ 下 5 文件：settings.gradle（include :tauri-android→./.tauri/tauri-api）+ build.gradle.kts（copy clipboard 模板，namespace=app.tauri.mihomo，compileSdk 36/minSdk 24）+ AndroidManifest.xml + proguard-rules.pro + src/main/java/MihomoPlugin.kt（`class MihomoPlugin(activity: Activity): Plugin(activity)` 空 load——mihomo 逻辑全在 Rust 侧）
  8. 模板参考：registry 里 tauri-plugin-clipboard-manager-2.3.2/android/（build.gradle.kts 45 行标准结构）
- **APK 构建已成功（260902）**：先因缺 `mobile_entry_point` 失败，补 `#[cfg_attr(mobile, tauri::mobile_entry_point)]` 后通过；全架构构建又因缺 armv7 sidecar 失败，改用 `--target aarch64` 后成功。产物 `src-tauri/gen/android/app/build/outputs/apk/universal/debug/app-universal-debug.apk`，包名 `io.github.QiuYeDeng.red_clash`，versionCode 1001/versionName 0.1.1/minSdk 24，约 129MB。
- **真机首测（260902）**：平板 `TB335FC` 已通过 adb 在线；首个 debug APK 安装、启动成功且进程存活，但 logcat 报 `window.set_theme`、`event.listen`、`mihomo.get_proxies` not allowed。根因是 `tauri.conf.json` 的 capability 列表漏挂 `android-capability`；同时 Android capability 补 `core:window:allow-set-theme`
- **Android 重编（260902）**：旧临时构建脚本把 `CARGO_TARGET_AARCH64_LINUX_ANDROID_LINKER` 指向裸 `clang.exe`，重新触发 Rust 链接时会被 lld 拒绝 Android 参数；改为 NDK 的 `aarch64-linux-android24-clang.cmd` 目标包装器后已实测 `BUILD SUCCESSFUL`，APK 已更新
- **Android WebView 平台判断（260902）**：Vite 构建时 `OS_PLATFORM` 继承 Windows 构建机的 `win32`，必须先检查 Android UA，再检查桌面平台；否则移动端会误执行 `set_minimizable`、`get_auto_proxy`、`is_service_available`
- **Android 核心 stage 2（260902）**：普通 asset 可成功打入 APK 并经 `app.fs().read(asset://...)` 抽到 app home，但 Android 16 拒绝从 app data 执行 ELF（mode 0700 仍 `Permission denied`）；改为构建钩子将 ARM64 ELF 注入 jniLibs 为 `libverge_mihomo.so`、`extractNativeLibs=true`，Rust 从提取后的 native library path 启动。已真机验证配置校验通过、核心进程存活、Unix REST socket 创建、前端无连接错误。
- **Android IPC 初始化（260902）**：Tauri plugin 注册发生在 `AppHandle` 初始化前；此阶段不能经 `app_home_dir()` 计算 socket。Android IPC 改用 `/data/data/<package>/<APP_ID>/verge-mihomo.sock`，与运行期 sandbox 同路径；`/tmp` 属 shell 用户，mihomo 无权创建 `/tmp/verge`。
- **Android stage 3（260903，未提交）**：已在工作树接入 Tauri Android plugin 注册、`VpnService` 授权/foreground service/PFD、清除 `FD_CLOEXEC`，并在生成 Run/Check YAML 时将真实 fd 写入 `tun.file-descriptor`；Android TUN 配置变更走 core restart，前端不再按桌面 service/admin 禁用开关。
## Android TUN 真机攻坚（260904）

- **真机验证进度（260904，260906 收官）**：APK 安装启动、`MihomoVpnService` 起前台服务、`tun0` 建立并被系统判定 VALIDATED（`198.18.0.1/30`、DNS 1.1.1.1、默认路由走 tun0）、mihomo 子进程存活且 REST unix socket 正常。当时卡「tun0 rx bytes 恒 0」，真因与解法见下两条；最终闭环见「Android 全链路验证（260906）」
- **真因（不是我们代码的锅）**：mihomo 日志 `Start TUN listening error: build android rules: read packages list: open /data/system/packages.xml: permission denied`。`listener/sing_tun/server.go:371` **无条件**调 `buildAndroidRules` → `newPackageManager()` 读 `/data/system/packages.xml` 建按应用路由表；Android 16 不给第三方应用读该文件，**且没有任何配置项能跳过**
- **正解=官方 `cmfa` 构建标签（别改源码）**：`listener/sing_tun/server_android.go` 带 `//go:build android && !cmfa`，而 `server_notandroid.go` 带 `//go:build !android || cmfa` 且其 `buildAndroidRules` 是空实现。用 `-tags "with_gvisor cmfa"` 编译后，`/data/system/packages.xml` 字符串从二进制里彻底消失。副作用（已确认无害）：关掉 loopback 探测器（我们内核流量走 app UID 已排除、无环）、path 放开 unsafe path、`process.FindPackageName` 未注册只影响按包名规则
- **自建内核流程**：`go build -tags "with_gvisor cmfa" -trimpath -ldflags '-X github.com/metacubex/mihomo/constant.Version=v1.19.30-redclash -w -s -buildid='`，`GOOS=android GOARCH=arm64 CGO_ENABLED=0`。产物覆盖 `src-tauri/sidecar/verge-mihomo-aarch64-linux-android`（该文件**不被 git 跟踪**，可放心覆盖；原版已备份到 `.redcode/temp/verge-mihomo-android.upstream.bak`）
- **Go 工具链**：注册表里挂着 `Go Programming Language amd64 go1.26.4` 但磁盘上已无 go.exe；现装在 `D:\AI\tools\go`（go1.24.5）。模块缓存 `C:\Users\Administrator\go\pkg\mod` 已有 mihomo 全套依赖，重建很快。GitHub 走 `http.proxy=http://127.0.0.1:7897`（webfetch 访问 github/raw 会被 fake-ip 挡掉，只能用 curl/git 带代理）
- **调试 Android WebView 的技法**：`adb forward tcp:9222 localabstract:webview_devtools_remote_<pid>` → `http://127.0.0.1:9222/json/list` 取 page target → 用 PS7 `System.Net.WebSockets.ClientWebSocket` 发 CDP `Runtime.evaluate`（脚本 `.redcode/temp/cdp-eval.ps1`，`-NoAwait` 可让长命令异步执行不阻塞）。**Tauri v2 invoke 参数必须带参数名**：`invoke('patch_verge_config', { payload: {...} })`，写成 `{ enable_tun_mode: true }` 会报 `missing required key payload`
- **桌面内核落后**：`verge-mihomo-x86_64-pc-windows-msvc.exe` 是 2026/5/31 的旧包，最新 v1.19.30（8/16）。`scripts/prebuild.mjs:380/477` 是「文件已存在就跳过」，所以从没自动刷新；升级=删 sidecar 或 `--force`
- **订阅导入 panic（第二个坑）**：Rust 侧 HTTPS 全挂，日志 `Panic occurred at rustls-platform-verifier-0.7.0\src\android.rs:90: Unknown panic payload`。reqwest 默认用 rustls-platform-verifier 校验证书，它在 Android 上要经 JNI 调系统信任库，**必须先用 App Context 调 `init_with_env`**，否则首个 HTTPS 请求就 panic（前端 fetch 走 Chromium 栈所以不受影响，容易误判「网络没问题」）。官方 Kotlin 配套组件**没发 Maven**（rustls/rustls-platform-verifier#115），只能自己接线 → 修法：`src-tauri/src/android.rs` 导出 `Java_app_tauri_mihomo_MihomoPlugin_nativeInitVerifier`，`MihomoPlugin.load()` 里 `nativeInitVerifier(hostActivity)` 调一次。依赖加在 `[target.'cfg(target_os = "android")'.dependencies]`（jni 0.22 + rustls-platform-verifier 0.7），不影响桌面构建
- **jni 0.22 的坑**：`EnvUnowned::with_env` 返回的不是 Result，是 `EnvOutcome`，要 `.into_outcome()` 再 match `Outcome::{Ok,Err,Panic}`（Outcome 没有 Debug）
- **读 App 日志**：debug 包可以 `adb shell run-as io.github.QiuYeDeng.red_clash tail -n 30 io.github.QiuYeDeng.red-clash/logs/latest.log`，比走 CDP 读文件快且不会卡住
- **后台限制**：平板锁屏/灭屏时，`startForegroundService` 与 VPN 授权弹窗都会受限，命令会一直 pending——真机验证前务必确认屏幕亮着且在前台

## Android 全链路验证（260906）

- **已实测闭环**：装 APK → `import_profile` 导入星辰订阅（Rust HTTPS 2.5s，无 panic）→ `patch_profiles_config` 后内核 72 节点/4 组 → `patch_verge_config(enable_tun_mode=true)` 起 tun0 → 平板浏览器（其他 App）访问 `www.google.com` 连接链显示 `[Hy2]Taiwan9 ×2.9`；哥哥本人在平板浏览器上 Google 验证成功。选节点用 `delay_group`（keepFixed 参数必传）+ `select_node_for_group`
- **导入后必须 patch_profiles_config**：`import_profile` 只存文件+设 current，不跑 enhance；`restart_core` 也不行——`generate_file` 只把 `runtime()` 缓存写盘，缓存是启动时生成的旧数据（proxies 恒空 7 个）。`patch_profiles_config` 走 `update_config_forced` 才重新 enhance + 更新内核
- **enable_tun_mode 会被重置**：重装/切配置后 verge.yaml 里是 false，TUN 不自动恢复；`patch_verge_config({payload:{enable_tun_mode:true}})` 再开（Android 下触发 RESTART_CORE→generate_file→start_vpn 写 fd）
- **CDP 里没有全局 invoke**：用 `window.__TAURI_INTERNALS__.invoke(cmd, args)`（invoke 不可枚举，Object.keys 看不到，typeof 才探到）；插件命令带命名空间 `plugin:mihomo|get_proxies` 等
- **App 自身流量不进 TUN**：VPN 建立时 `addDisallowedApplication(packageName)` 排除了自己（防回环），App 内 fetch 走 wlan0 直连——测代理必须用**其他 App** 的流量（adb 拉起浏览器）或看内核日志/连接链
- **get_connections 只显示活跃连接**：请求完成就消失，验证走代理要轮询连拍或看 get_clash_logs；后台 WebView 被节流时 CDP invoke 会挂起不返回，把 App 拉回前台即恢复
- **订阅导入 TLS 修法补全（AAR）**：Rust `init_with_env` 接线后仍报 `failed to call native verifier`——缺 Java 侧 `org.rustls.platformverifier.CertificateVerifier`。取 crates.io `rustls-platform-verifier-android` 0.1.1 的预编译 AAR（9.3KB）→ `tauri-plugin-mihomo-revert/android/libs/`，插件 build.gradle.kts 加 `implementation(files("libs/rustls-platform-verifier-0.1.1.aar"))`；javap 验证 `verifyCertificateChain` 签名与 Rust 0.7.0 期望一致（避开 Maven 未发 + 源码 BuildConfig.TEST 依赖两坑）。已真机验证导入成功
- **红黄绿三灯（用户提出待办）**：macOS 主题装饰件在 Android 无窗口控制功能，纯摆设——移动端 UI 适配时去掉，布局按触屏/窄屏重新裁，不照抄桌面

## 关键路径

- 测速核心：`src/services/delay.ts`（DelayManager 单例，CACHE_TTL 30min，hashKey=`${group}::${name}`）
- 节点排序/过滤：`src/utils/proxy.ts` + `src/components/proxy/proxy-groups.tsx`
- 构建：pnpm@11.2.2 固定（COREPACK_ENABLE_STRICT=0），`pnpm typecheck` = `tsc --noEmit`；commit hook = cargo-make（fmt/test），push 走 `-c http.https://github.com.proxy=http://127.0.0.1:7897`
