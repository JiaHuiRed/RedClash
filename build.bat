@echo off
chcp 65001 >nul
echo ========================================
echo   RedClash Release Build
echo ========================================
echo.

cd /d "%~dp0"

:: 限制并行编译数，避免低内存机器 LLVM OOM
set CARGO_BUILD_JOBS=2
set NODE_OPTIONS=--max-old-space-size=4096

echo [1/2] 安装前端依赖...
call pnpm install
if %ERRORLEVEL% NEQ 0 (
    echo [错误] pnpm install 失败
    pause
    exit /b 1
)

echo.
echo [2/2] 编译 Release 包（预计 10-20 分钟）...
call node_modules\.bin\tauri build
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
