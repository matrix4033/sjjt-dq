@echo off
chcp 65001 >nul
echo ========================================
echo 启动前端服务器
echo ========================================
echo.

REM 使用 Python 内置 HTTP 服务器
echo 使用 Python 启动 HTTP 服务器...
echo 访问地址: http://localhost:8000
echo 按 Ctrl+C 停止服务器
echo.

python -m http.server 8000
