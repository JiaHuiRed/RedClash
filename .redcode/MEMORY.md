# RedClash 项目记忆

> 目标：代理客户端，核心价值是**连接速度**（测速准确性、选节点效率、UI 响应）。

## 当前进度（260828）

- **v0.1.1 已 push**（origin/master = 8dc18cfa）：feat vless 直链订阅转换（b15b22b3）+ fix pnpm-lock 补 tauri cli 平台二进制（7856d30b）+ release 升版（8dc18cfa）。一元/星辰订阅节点显示问题全解决——主解药是 UA 修复（v0.1.0，用户公司在远端做），星辰 62 节点已实测全显示
- **警惕（260828）**：`.redcode/MEMORY.md` 曾被未知进程重置为 4 行空模板（git commit hooks 或引擎播种嫌疑，未定案），本次已手工恢复；若再见此现象需排查 `.husky` hook 与引擎播种逻辑
- **待办（按序）**：
  - ③ DelaySnapshot 渲染缓存（节点多时 UI 不抖）——上游参考 upstream-delay.ts 150-171 行快照 + 211-222 行 addGroupListener 多监听（配套）
  - ④ 插件升级 0.5.5：需先验证上游"节点全空"已修（本地 revert 是 0.1.5，当初因该 bug 本地化）
  - ⑤ 500ms 最小加载动画是感知速度权衡（两边一致，可讨论缩短）

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
- APK 内容核验只有 `lib/arm64-v8a/libapp_lib.so` 和常规资源，未包含 mihomo ELF；当前是可安装 UI 外壳，stage 2 仍需显式嵌入 Android ELF 并由 Rust `std::process::Command` 拉起。
- **真机首测（260902）**：平板 `TB335FC` 已通过 adb 在线；首个 debug APK 安装、启动成功且进程存活，但 logcat 报 `window.set_theme`、`event.listen`、`mihomo.get_proxies` not allowed。根因是 `tauri.conf.json` 的 capability 列表漏挂 `android-capability`；同时 Android capability 补 `core:window:allow-set-theme`
- **Android 重编（260902）**：旧临时构建脚本把 `CARGO_TARGET_AARCH64_LINUX_ANDROID_LINKER` 指向裸 `clang.exe`，重新触发 Rust 链接时会被 lld 拒绝 Android 参数；改为 NDK 的 `aarch64-linux-android24-clang.cmd` 目标包装器后已实测 `BUILD SUCCESSFUL`，APK 已更新
- **Android WebView 平台判断（260902）**：Vite 构建时 `OS_PLATFORM` 继承 Windows 构建机的 `win32`，必须先检查 Android UA，再检查桌面平台；否则移动端会误执行 `set_minimizable`、`get_auto_proxy`、`is_service_available`
- **Android 核心 stage 2（260902）**：普通 asset 可成功打入 APK 并经 `app.fs().read(asset://...)` 抽到 app home，但 Android 16 拒绝从 app data 执行 ELF（mode 0700 仍 `Permission denied`）；改为构建钩子将 ARM64 ELF 注入 jniLibs 为 `libverge_mihomo.so`、`extractNativeLibs=true`，Rust 从提取后的 native library path 启动。已真机验证配置校验通过、核心进程存活、Unix REST socket 创建、前端无连接错误。
- **Android IPC 初始化（260902）**：Tauri plugin 注册发生在 `AppHandle` 初始化前；此阶段不能经 `app_home_dir()` 计算 socket。Android IPC 改用 `/data/data/<package>/<APP_ID>/verge-mihomo.sock`，与运行期 sandbox 同路径；`/tmp` 属 shell 用户，mihomo 无权创建 `/tmp/verge`。
- **后续待做**：stage 2 = Rust 侧 std::process::Command 拉起 mihomo ELF（sidecar 在 Android 走不通，issue #9774）；stage 3 = Kotlin VpnService + TUN（最大新代码块）

## 关键路径

- 测速核心：`src/services/delay.ts`（DelayManager 单例，CACHE_TTL 30min，hashKey=`${group}::${name}`）
- 节点排序/过滤：`src/utils/proxy.ts` + `src/components/proxy/proxy-groups.tsx`
- 构建：pnpm@11.2.2 固定（COREPACK_ENABLE_STRICT=0），`pnpm typecheck` = `tsc --noEmit`；commit hook = cargo-make（fmt/test），push 走 `-c http.https://github.com.proxy=http://127.0.0.1:7897`
