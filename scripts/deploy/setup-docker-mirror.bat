@echo off
echo 配置 Docker 镜像加速器...

REM 检查 Docker Desktop 是否运行
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: Docker Desktop 未运行，请先启动 Docker Desktop
    pause
    exit /b 1
)

REM 获取用户目录下的 Docker 配置路径
set DOCKER_CONFIG_DIR=%USERPROFILE%\.docker

REM 创建配置目录（如果不存在）
if not exist "%DOCKER_CONFIG_DIR%" (
    mkdir "%DOCKER_CONFIG_DIR%"
)

REM 复制镜像加速器配置
copy "docker-daemon.json" "%DOCKER_CONFIG_DIR%\daemon.json"

if %errorlevel% equ 0 (
    echo 镜像加速器配置成功！
    echo 配置文件位置: %DOCKER_CONFIG_DIR%\daemon.json
    echo.
    echo 请重启 Docker Desktop 以使配置生效
    echo 然后重新运行构建命令：
    echo   docker build -t dzxt:1.0 .
) else (
    echo 配置失败，请手动配置
    echo 请将 docker-daemon.json 的内容复制到 Docker Desktop 设置中
)

pause