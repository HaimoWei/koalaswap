@echo off
echo 开始执行用户邮箱验证更新...
echo.

REM 执行快速验证脚本
psql -h localhost -p 15433 -U koalaswap -d koalaswap_dev -f quick_verify_users.sql

echo.
if %ERRORLEVEL% EQU 0 (
    echo ✅ 用户邮箱验证状态更新成功！
) else (
    echo ❌ 更新失败，错误代码：%ERRORLEVEL%
)

echo.
echo 按任意键继续...
pause >nul