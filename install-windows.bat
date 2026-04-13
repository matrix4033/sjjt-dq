@echo off
chcp 65001 >nul
echo ========================================
echo Windows 环境安装脚本
echo 数据汇聚情况周报系统 - PostgreSQL 版本
echo ========================================
echo.

REM 检查 Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ✗ 错误: 未找到 Python
    echo 请先安装 Python 3.7 或更高版本
    echo 下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo 检测到 Python 版本:
python --version
echo.

REM 删除旧的虚拟环境
if exist "api\venv" (
    echo 删除旧的虚拟环境...
    rmdir /s /q api\venv
    echo ✓ 已删除
    echo.
)

REM 创建虚拟环境
echo 步骤 1: 创建虚拟环境...
python -m venv api\venv
if errorlevel 1 (
    echo ✗ 虚拟环境创建失败
    pause
    exit /b 1
)
echo ✓ 虚拟环境创建成功
echo.

REM 激活虚拟环境
echo 步骤 2: 激活虚拟环境...
call api\venv\Scripts\activate.bat

REM 升级 pip
echo 步骤 3: 升级 pip...
python -m pip install --upgrade pip
echo.

REM 安装依赖
echo 步骤 4: 安装依赖包...
pip install -r api\requirements.txt
if errorlevel 1 (
    echo ✗ 依赖安装失败
    deactivate
    pause
    exit /b 1
)
echo ✓ 依赖安装成功
echo.

REM 验证安装
echo 步骤 5: 验证安装...
python -c "import flask; print('Flask 版本:', flask.__version__)"
python -c "import psycopg2; print('psycopg2 版本:', psycopg2.__version__)"
python -c "import flask_cors; print('flask-cors: 已安装')"
python -c "import dotenv; print('python-dotenv: 已安装')"
echo.

REM 退出虚拟环境
deactivate

REM 检查配置文件
if not exist "api\.env" (
    echo ========================================
    echo 配置数据库连接
    echo ========================================
    if exist "api\.env.example" (
        echo 复制配置文件模板...
        copy api\.env.example api\.env
        echo.
        echo ✓ 已创建 api\.env 文件
        echo.
        echo 请编辑 api\.env 文件，配置数据库连接信息:
        echo   DB_HOST=localhost
        echo   DB_PORT=5432
        echo   DB_USER=postgres
        echo   DB_PASSWORD=your_password
        echo   DB_NAME=data_center
        echo.
    ) else (
        echo ⚠ 警告: 未找到 api\.env.example 文件
        echo 请手动创建 api\.env 文件
        echo.
    )
)

echo ========================================
echo 安装完成！
echo ========================================
echo.
echo 下一步:
echo 1. 配置数据库连接: 编辑 api\.env 文件
echo 2. 初始化数据库: psql -U postgres -d data_center -f setup-database-postgresql.sql
echo 3. 导入数据: python import-csv-to-postgresql.py
echo 4. 启动服务: start-all.bat
echo.
echo ========================================
pause
