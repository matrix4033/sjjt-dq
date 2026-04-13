@echo off
chcp 65001 >nul
echo ========================================
echo 启动 Python API 后端服务
echo ========================================
echo.

REM 检查是否已安装依赖
if not exist "api\venv" (
    echo 首次运行，正在创建虚拟环境...
    python -m venv api\venv
    echo.
    echo 正在安装依赖包...
    call api\venv\Scripts\activate.bat
    pip install -r api\requirements.txt
    echo.
) else (
    call api\venv\Scripts\activate.bat
)

REM 检查 .env 文件
if not exist "api\.env" (
    echo 警告: 未找到 api\.env 文件
    echo 请复制 api\.env.example 为 api\.env 并配置数据库连接
    echo.
    pause
    exit /b 1
)

echo 启动 API 服务...
echo API 地址: http://localhost:5000
echo 按 Ctrl+C 停止服务器
echo.

cd api
python app.py
