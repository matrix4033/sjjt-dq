@echo off
chcp 65001 >nul
echo ========================================
echo 大数据中心数据汇聚情况周报系统
echo ========================================
echo.
echo 正在启动后端和前端服务...
echo.

REM 在新窗口启动后端
start "API 后端服务" cmd /k start-backend.bat

REM 等待 3 秒让后端启动
timeout /t 3 /nobreak >nul

REM 在新窗口启动前端
start "前端服务器" cmd /k start-frontend.bat

echo.
echo ========================================
echo 服务已启动！
echo ========================================
echo.
echo 后端 API: http://localhost:5000
echo 前端页面: http://localhost:8000
echo.
echo 请在浏览器中访问: http://localhost:8000
echo.
echo 关闭此窗口不会停止服务
echo 要停止服务，请关闭对应的命令行窗口
echo ========================================
pause
