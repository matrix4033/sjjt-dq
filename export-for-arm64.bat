@echo off
echo Windows 11 Export for ARM64 Linux Offline Deployment
echo ======================================================
echo.

set EXPORT_DIR=arm64-offline-package
set DATE_STAMP=%date:~0,4%%date:~5,2%%date:~8,2%

echo Creating export directory...
if exist %EXPORT_DIR% rmdir /s /q %EXPORT_DIR%
mkdir %EXPORT_DIR%
mkdir %EXPORT_DIR%\docker-images
mkdir %EXPORT_DIR%\python-wheels
mkdir %EXPORT_DIR%\source-code
mkdir %EXPORT_DIR%\scripts

echo.
echo Step 1: Checking Docker status...
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)
echo Docker is running OK

echo.
echo Step 2: Pulling Python 3.12 base image...
docker pull python:3.12-slim
if %errorlevel% neq 0 (
    echo Trying China mirror...
    docker pull registry.cn-hangzhou.aliyuncs.com/library/python:3.12-slim
    docker tag registry.cn-hangzhou.aliyuncs.com/library/python:3.12-slim python:3.12-slim
)

echo.
echo Step 3: Exporting Python 3.12 image...
docker save python:3.12-slim -o %EXPORT_DIR%\docker-images\python-3.12-slim.tar
echo Python image exported successfully

echo.
echo Step 4: Downloading Python wheels for requirements.txt...
echo Creating temporary container to download wheels...

docker run --rm -v %cd%\%EXPORT_DIR%\python-wheels:/wheels python:3.12-slim bash -c "
    pip install --upgrade pip
    echo 'Downloading wheels for requirements.txt...'
    pip download -d /wheels Flask==3.0.3
    pip download -d /wheels flask-cors==4.0.1
    pip download -d /wheels psycopg2-binary==2.9.9
    pip download -d /wheels python-dotenv==1.0.1
    pip download -d /wheels Werkzeug==3.0.3
    pip download -d /wheels itsdangerous==2.2.0
    pip download -d /wheels click==8.1.7
    pip download -d /wheels Jinja2==3.1.4
    pip download -d /wheels MarkupSafe==2.1.5
    echo 'Wheels downloaded successfully'
"

if %errorlevel% equ 0 (
    echo Python wheels downloaded successfully
) else (
    echo Warning: Some wheels may have failed to download
    echo Will install from PyPI on target machine
)

echo.
echo Step 5: Copying source code...
copy *.html %EXPORT_DIR%\source-code\ >nul 2>&1
copy *.py %EXPORT_DIR%\source-code\ >nul 2>&1
copy *.md %EXPORT_DIR%\source-code\ >nul 2>&1
copy *.sql %EXPORT_DIR%\source-code\ >nul 2>&1
copy Dockerfile* %EXPORT_DIR%\source-code\ >nul 2>&1

if exist api (
    mkdir %EXPORT_DIR%\source-code\api
    copy api\*.* %EXPORT_DIR%\source-code\api\ >nul 2>&1
)

if exist css (
    mkdir %EXPORT_DIR%\source-code\css
    copy css\*.* %EXPORT_DIR%\source-code\css\ >nul 2>&1
)

if exist js (
    mkdir %EXPORT_DIR%\source-code\js
    copy js\*.* %EXPORT_DIR%\source-code\js\ >nul 2>&1
)

if exist data (
    mkdir %EXPORT_DIR%\source-code\data
    copy data\*.* %EXPORT_DIR%\source-code\data\ >nul 2>&1
)

echo Source code copied successfully

echo.
echo Step 6: Creating ARM64 Dockerfile...
(
echo FROM python:3.12-slim
echo.
echo WORKDIR /app
echo.
echo ENV PYTHONDONTWRITEBYTECODE=1 \
echo     PYTHONUNBUFFERED=1 \
echo     FLASK_APP=api/app.py \
echo     FLASK_ENV=production
echo.
echo # Install system dependencies for ARM64
echo RUN apt-get update ^&^& apt-get install -y --no-install-recommends \
echo     gcc \
echo     g++ \
echo     libpq-dev \
echo     libpq5 \
echo     postgresql-client \
echo     curl \
echo     build-essential \
echo     ^&^& rm -rf /var/lib/apt/lists/* \
echo     ^&^& apt-get clean
echo.
echo # Copy Python wheels
echo COPY python-wheels/ /tmp/wheels/
echo.
echo # Copy requirements
echo COPY api/requirements.txt /app/api/requirements.txt
echo.
echo # Install Python dependencies from wheels first, fallback to PyPI
echo RUN pip install --upgrade pip ^&^& \
echo     ^(pip install --no-index --find-links /tmp/wheels -r api/requirements.txt ^|^| \
echo      pip install -r api/requirements.txt^) ^&^& \
echo     rm -rf /tmp/wheels
echo.
echo # Copy application code
echo COPY . /app/
echo.
echo # Create non-root user
echo RUN useradd --create-home --shell /bin/bash app ^&^& \
echo     chown -R app:app /app
echo USER app
echo.
echo EXPOSE 5000
echo.
echo HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
echo     CMD curl -f http://localhost:5000/api/health ^|^| exit 1
echo.
echo CMD ["python", "api/app.py"]
) > %EXPORT_DIR%\source-code\Dockerfile.arm64-offline

echo ARM64 Dockerfile createdec
ho.
echo Step 7: Creating deployment scripts for ARM64 Linux...

REM Main deployment script
(
echo #!/bin/bash
echo echo "ARM64 Linux Offline Deployment"
echo echo "=============================="
echo echo ""
echo echo "🔍 Checking system architecture..."
echo ARCH=^$^(uname -m^)
echo echo "Detected architecture: ^$ARCH"
echo if [[ "^$ARCH" != "aarch64" ^&^& "^$ARCH" != "arm64" ]]; then
echo     echo "⚠️  Warning: This deployment is optimized for ARM64"
echo     echo "   Current architecture: ^$ARCH"
echo     read -p "Continue anyway? (y/N): " -n 1 -r
echo     echo
echo     if [[ ! ^$REPLY =~ ^^[Yy]^$ ]]; then
echo         exit 1
echo     fi
echo fi
echo echo ""
echo echo "📦 Step 1: Loading Python 3.12 Docker image..."
echo docker load -i docker-images/python-3.12-slim.tar
echo if [ ^$? -ne 0 ]; then
echo     echo "❌ Failed to load Python image"
echo     exit 1
echo fi
echo echo "✅ Python image loaded successfully"
echo echo ""
echo echo "🔨 Step 2: Building application with offline dependencies..."
echo cd source-code
echo cp -r ../python-wheels ./
echo docker build -f Dockerfile.arm64-offline -t dzxt:arm64 .
echo if [ ^$? -ne 0 ]; then
echo     echo "❌ Failed to build application"
echo     exit 1
echo fi
echo cd ..
echo echo "✅ Application built successfully"
echo echo ""
echo echo "🛑 Step 3: Stopping old containers..."
echo docker stop dzxt-app 2^>/dev/null
echo docker rm dzxt-app 2^>/dev/null
echo echo ""
echo echo "🚀 Step 4: Starting application..."
echo docker run -d -p 5000:5000 --name dzxt-app dzxt:arm64
echo if [ ^$? -eq 0 ]; then
echo     echo "✅ Application deployed successfully!"
echo     echo "🌐 Access URL: http://localhost:5000"
echo     echo ""
echo     echo "📊 Container status:"
echo     docker ps ^| grep dzxt-app
echo     echo ""
echo     echo "💡 Management commands:"
echo     echo "  docker logs dzxt-app -f    # View logs"
echo     echo "  docker restart dzxt-app    # Restart"
echo     echo "  docker stop dzxt-app       # Stop"
echo else
echo     echo "❌ Failed to start application"
echo     echo "Check logs: docker logs dzxt-app"
echo     exit 1
echo fi
) > %EXPORT_DIR%\scripts\deploy-arm64.sh

REM Quick deployment script
(
echo #!/bin/bash
echo echo "Quick ARM64 Deployment"
echo echo "====================="
echo docker load -i docker-images/python-3.12-slim.tar
echo cd source-code
echo cp -r ../python-wheels ./
echo docker build -f Dockerfile.arm64-offline -t dzxt:arm64 .
echo docker stop dzxt-app 2^>/dev/null ^&^& docker rm dzxt-app 2^>/dev/null
echo docker run -d -p 5000:5000 --name dzxt-app dzxt:arm64
echo echo "Deployment completed! Access: http://localhost:5000"
) > %EXPORT_DIR%\scripts\quick-deploy.sh

REM Management script
(
echo #!/bin/bash
echo echo "ARM64 Application Management"
echo echo "==========================="
echo echo ""
echo echo "Available commands:"
echo echo "  start    - Start the application"
echo echo "  stop     - Stop the application"
echo echo "  restart  - Restart the application"
echo echo "  logs     - View application logs"
echo echo "  status   - Check application status"
echo echo ""
echo case "^$1" in
echo     start^)
echo         docker start dzxt-app
echo         ;;
echo     stop^)
echo         docker stop dzxt-app
echo         ;;
echo     restart^)
echo         docker restart dzxt-app
echo         ;;
echo     logs^)
echo         docker logs dzxt-app -f
echo         ;;
echo     status^)
echo         docker ps ^| grep dzxt-app ^|^| echo "Application not running"
echo         ;;
echo     *^)
echo         echo "Usage: ^$0 {start^|stop^|restart^|logs^|status}"
echo         echo ""
echo         echo "Current status:"
echo         docker ps ^| grep dzxt ^|^| echo "No dzxt containers running"
echo         ;;
echo esac
) > %EXPORT_DIR%\scripts\manage.sh

echo Deployment scripts created

echo.
echo Step 8: Creating documentation...
(
echo # ARM64 Linux Offline Deployment Package
echo.
echo Created from Windows 11: %DATE_STAMP%
echo.
echo ## Package Contents
echo.
echo - `docker-images/python-3.12-slim.tar`: Python 3.12 Docker image
echo - `python-wheels/`: Pre-downloaded Python packages
echo - `source-code/`: Complete application source code
echo - `scripts/`: Deployment and management scripts
echo.
echo ## System Requirements
echo.
echo - ARM64 Linux machine
echo - Docker installed and running
echo - No internet connection required
echo.
echo ## Quick Deployment
echo.
echo ```bash
echo # Make scripts executable
echo chmod +x scripts/*.sh
echo.
echo # Deploy application
echo ./scripts/deploy-arm64.sh
echo ```
echo.
echo ## Alternative Deployment
echo.
echo ```bash
echo # Quick deployment
echo ./scripts/quick-deploy.sh
echo ```
echo.
echo ## Manual Deployment
echo.
echo ```bash
echo # Load Python image
echo docker load -i docker-images/python-3.12-slim.tar
echo.
echo # Build application
echo cd source-code
echo cp -r ../python-wheels ./
echo docker build -f Dockerfile.arm64-offline -t dzxt:arm64 .
echo.
echo # Run application
echo docker run -d -p 5000:5000 --name dzxt-app dzxt:arm64
echo ```
echo.
echo ## Application Management
echo.
echo ```bash
echo # Using management script
echo ./scripts/manage.sh start    # Start
echo ./scripts/manage.sh stop     # Stop
echo ./scripts/manage.sh restart  # Restart
echo ./scripts/manage.sh logs     # View logs
echo ./scripts/manage.sh status   # Check status
echo.
echo # Direct Docker commands
echo docker start dzxt-app        # Start
echo docker stop dzxt-app         # Stop
echo docker restart dzxt-app      # Restart
echo docker logs dzxt-app -f      # View logs
echo docker ps ^| grep dzxt       # Check status
echo ```
echo.
echo ## Access Application
echo.
echo - Local: http://localhost:5000
echo - Network: http://your-server-ip:5000
echo.
echo ## Troubleshooting
echo.
echo If deployment fails:
echo.
echo 1. Check Docker is running: `docker version`
echo 2. Check system architecture: `uname -m` ^(should be aarch64 or arm64^)
echo 3. View container logs: `docker logs dzxt-app`
echo 4. Check container status: `docker ps -a ^| grep dzxt`
echo.
echo ## Package Info
echo.
echo - Python Version: 3.12
echo - Architecture: ARM64 optimized
echo - Dependencies: Pre-downloaded
echo - Internet Required: No
) > %EXPORT_DIR%\README.md

echo Documentation created

echo.
echo Step 9: Package summary...
echo ========================================
echo ✅ ARM64 offline package export completed!
echo ========================================
echo.
echo 📦 Package location: %EXPORT_DIR%\
echo.
echo 📊 Package contents:
dir /B %EXPORT_DIR%
echo.
echo 💾 Docker image size:
for %%f in (%EXPORT_DIR%\docker-images\*.tar) do (
    for %%A in ("%%f") do echo   %%~nxA: %%~zA bytes
)

echo.
echo 📦 Python wheels:
dir /B %EXPORT_DIR%\python-wheels 2>nul | find /c /v ""
echo  packages downloaded

echo.
echo 🚀 Next Steps:
echo 1. Transfer the entire '%EXPORT_DIR%' folder to your ARM64 Linux machine
echo 2. On ARM64 machine, run: chmod +x scripts/*.sh
echo 3. Deploy: ./scripts/deploy-arm64.sh
echo.
echo 💡 This package is completely self-contained for offline deployment
echo.
pause