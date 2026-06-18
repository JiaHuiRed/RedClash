@echo off
chcp 65001 >nul
echo ========================================
echo   RedClash Release Build
echo ========================================
echo.

cd /d "%~dp0"

:: Kill running RedClash / mihomo to release the exe file lock before build
echo [0/3] Stopping RedClash process...
taskkill /F /IM red-clash.exe >nul 2>&1
taskkill /F /IM mihomo.exe >nul 2>&1
taskkill /F /IM clash-meta.exe >nul 2>&1
timeout /t 2 /nobreak >nul

:: Skip corepack network check for pnpm binary (packageManager field in package.json)
set COREPACK_ENABLE_STRICT=0

:: 限制并行编译数，避免低内存机器 LLVM OOM
set CARGO_BUILD_JOBS=1
set NODE_OPTIONS=--max-old-space-size=4096
:: 覆盖 release profile 设置，降低内存峰值
set CARGO_PROFILE_RELEASE_CODEGEN_UNITS=64
set CARGO_PROFILE_RELEASE_LTO=false
set CARGO_PROFILE_RELEASE_OPT_LEVEL=1

echo [1/3] 安装前端依赖...
call pnpm install --prefer-offline
if %ERRORLEVEL% NEQ 0 (
    echo [错误] pnpm install 失败
    pause
    exit /b 1
)

echo.
echo [2/3] 构建前端（Vite）...
call pnpm run web:build
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 前端构建失败
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
    pause
    exit /b 1
)

echo.
echo ========================================
echo   编译完成！
echo   安装包：src-tauri\target\release\bundle\
echo   可执行：target\release\red-clash.exe
echo ========================================
echo.
pause
