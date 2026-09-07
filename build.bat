@echo off
chcp 65001 >nul
echo ========================================
echo   RedClash Release Build
echo ========================================
echo.

cd /d "%~dp0"

:: 需要管理员权限：clash_verge_service 是 verge-mihomo 的看门狗，杀掉 mihomo 会在 2 秒内被重拉；
:: 且该服务自身的 exe 就在 target\release\resources\ 里，不停服务的话要等编译完 20 分钟后
:: 的打包阶段才报文件占用（EBUSY），白等一场
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [提示] 停止 clash_verge_service 需要管理员权限，正在以管理员身份重新启动本脚本...
    powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b 0
)

:: Kill running RedClash / mihomo to release the exe file lock before build
echo [0/3] 停止 RedClash 进程与看门狗服务...
sc query clash_verge_service | findstr /i "RUNNING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo    - 停止 clash_verge_service
    net stop clash_verge_service >nul 2>&1
    set SERVICE_WAS_RUNNING=1
)
taskkill /F /IM red-clash.exe >nul 2>&1
taskkill /F /IM mihomo.exe >nul 2>&1
taskkill /F /IM clash-meta.exe >nul 2>&1
taskkill /F /IM verge-mihomo.exe >nul 2>&1
taskkill /F /IM verge-mihomo-alpha.exe >nul 2>&1
timeout /t 2 /nobreak >nul

:: Skip corepack network check for pnpm binary (packageManager field in package.json)
set COREPACK_ENABLE_STRICT=0

:: 上面已杀掉 mihomo，pnpm 全局 config（%LOCALAPPDATA%\pnpm\config\config.yaml）和 HTTPS_PROXY
:: 仍指向 127.0.0.1:7897 这个已死的端口，npmmirror 会被 ECONNREFUSED；pnpm 只认 NO_PROXY
:: （清空 env / npm_config_* 都压不过全局 config，已实测），国内镜像直连即可
set "NO_PROXY=localhost,127.0.0.1,192.168.*,10.*,172.16.*,registry.npmmirror.com"

:: 限制并行编译数，避免低内存机器 LLVM OOM（本机 16G 内存，留些余量，别设太高）
set CARGO_BUILD_JOBS=2
set NODE_OPTIONS=--max-old-space-size=4096
:: 覆盖 release profile 设置，降低内存峰值
set CARGO_PROFILE_RELEASE_CODEGEN_UNITS=64
set CARGO_PROFILE_RELEASE_LTO=false
set CARGO_PROFILE_RELEASE_OPT_LEVEL=1

echo [1/3] 安装前端依赖...
call pnpm install --prefer-offline
if %ERRORLEVEL% NEQ 0 (
    echo [错误] pnpm install 失败
    call :restore_service
    pause
    exit /b 1
)

echo.
echo [2/3] 构建前端（Vite）...
call pnpm run web:build
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 前端构建失败
    call :restore_service
    pause
    exit /b 1
)

echo.
echo [3/3] 编译 Rust 后端并打包（预计 15-25 分钟）...
:: -c 跳过 beforeBuildCommand，前端已在上一步构建完毕
call node_modules\.bin\tauri build -c "{\"build\":{\"beforeBuildCommand\":\"\"}}"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [错误] 编译失败，请查看上方错误信息
    call :restore_service
    pause
    exit /b 1
)

:: 恢复代理必须在打包完成之后：服务锁的就是 target\release\resources 里的 exe
call :restore_service

echo.
echo ========================================
echo   编译完成！
echo   安装包：src-tauri\target\release\bundle\
echo   可执行：target\release\red-clash.exe
echo ========================================
echo.
pause
exit /b 0

:: 无论构建成败都把看门狗服务拉回来，用户的系统代理靠它
:restore_service
if not defined SERVICE_WAS_RUNNING exit /b 0
echo    - 重启 clash_verge_service...
net start clash_verge_service >nul 2>&1
exit /b 0
