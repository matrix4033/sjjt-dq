@echo off
chcp 65001 >nul
echo ARM64 Offline Export - Fixed Version
echo =====================================
echo.

set PKG=arm64-offline-fixed

echo Creating package directory...
if exist %PKG% rmdir /s /q %PKG%
mkdir %PKG%
mkdir %PKG%\images
mkdir %PKG%\source

echo.
echo Step 1: Checking Docker...
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker not running
    pause
    exit /b 1
)
echo Docker OK

echo.
echo Step 2: Pulling and exporting Python 3.12 image...
docker pull python:3.12-slim
if %errorlevel% neq 0 (
    echo Trying China mirror...
    docker pull registry.cn-hangzhou.aliyuncs.com/library/python:3.12-slim
    docker tag registry.cn-hangzhou.aliyuncs.com/library/python:3.12-slim python:3.12-slim
)

docker save python:3.12-slim -o %PKG%\images\python-3.12-slim.tar
echo Python image exported

echo.
echo Step 3: Copying source files...
copy *.html %PKG%\source\ >nul 2>&1
copy *.py %PKG%\source\ >nul 2>&1
copy *.md %PKG%\source\ >nul 2>&1
copy *.sql %PKG%\source\ >nul 2>&1
copy Dockerfile* %PKG%\source\ >nul 2>&1

if exist api (
    mkdir %PKG%\source\api
    copy api\*.* %PKG%\source\api\ >nul 2>&1
)

if exist css (
    mkdir %PKG%\source\css
    copy css\*.* %PKG%\source\css\ >nul 2>&1
)

if exist js (
    mkdir %PKG%\source\js
    copy js\*.* %PKG%\source\js\ >nul 2>&1
)

if exist data (
    mkdir %PKG%\source\data
    copy data\*.* %PKG%\source\data\ >nul 2>&1
)

echo Source files copied

echo.
echo Step 4: Creating ARM64 Dockerfile with dependency fixes...
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
echo # Install system dependencies for PostgreSQL and compilation
echo RUN apt-get update ^&^& apt-get install -y --no-install-recommends \
echo     gcc \
echo     g++ \
echo     libpq-dev \
echo     libpq5 \
echo     postgresql-client \
echo     curl \
echo     build-essential \
echo     python3-dev \
echo     ^&^& rm -rf /var/lib/apt/lists/* \
echo     ^&^& apt-get clean
echo.
echo # Copy requirements
echo COPY api/requirements.txt /app/api/requirements.txt
echo.
echo # Install Python dependencies with fallback strategy
echo RUN pip install --upgrade pip ^&^& \
echo     pip install --no-cache-dir Flask==3.0.3 flask-cors==4.0.1 python-dotenv==1.0.1 Werkzeug==3.0.3 itsdangerous==2.2.0 click==8.1.7 Jinja2==3.1.4 MarkupSafe==2.1.5 ^&^& \
echo     ^(pip install --no-cache-dir psycopg2-binary==2.9.9 ^|^| pip install --no-cache-dir psycopg2^)
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
) > %PKG%\source\Dockerfile.arm64

echo ARM64 Dockerfile created

echo.
echo Step 5: Creating deployment script...
(
echo #!/bin/bash
echo echo "ARM64 Offline Deployment - Fixed Version"
echo echo "========================================"
echo echo ""
echo echo "Checking architecture..."
echo ARCH=^$^(uname -m^)
echo echo "Detected: ^$ARCH"
echo if [[ "^$ARCH" != "aarch64" ^&^& "^$ARCH" != "arm64" ]]; then
echo     echo "Warning: Optimized for ARM64, current: ^$ARCH"
echo fi
echo echo ""
echo echo "Loading Python image..."
echo docker load -i images/python-3.12-slim.tar
echo if [ ^$? -ne 0 ]; then
echo     echo "Failed to load Python image"
echo     exit 1
echo fi
echo echo "Python image loaded successfully"
echo echo ""
echo echo "Building application..."
echo cd source
echo docker build -f Dockerfile.arm64 -t dzxt:arm64 .
echo if [ ^$? -ne 0 ]; then
echo     echo "Build failed"
echo     exit 1
echo fi
echo cd ..
echo echo "Application built successfully"
echo echo ""
echo echo "Starting application..."
echo docker stop dzxt-app 2^>/dev/null
echo docker rm dzxt-app 2^>/dev/null
echo docker run -d -p 5000:5000 --name dzxt-app dzxt:arm64
echo if [ ^$? -eq 0 ]; then
echo     echo "Application started successfully!"
echo     echo "Access: http://localhost:5000"
echo     echo ""
echo     echo "Container status:"
echo     docker ps ^| grep dzxt-app
echo else
echo     echo "Failed to start application"
echo     exit 1
echo fi
) > %PKG%\deploy.sh

echo Deployment script created

echo.
echo Step 6: Creating management script...
(
echo #!/bin/bash
echo echo "Application Management"
echo echo "====================="
echo echo ""
echo echo "Commands:"
echo echo "  ./manage.sh start    - Start application"
echo echo "  ./manage.sh stop     - Stop application"
echo echo "  ./manage.sh restart  - Restart application"
echo echo "  ./manage.sh logs     - View logs"
echo echo "  ./manage.sh status   - Check status"
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
echo         docker ps ^| grep dzxt-app ^|^| echo "Not running"
echo         ;;
echo     *^)
echo         echo "Usage: ^$0 {start^|stop^|restart^|logs^|status}"
echo         echo ""
echo         echo "Current status:"
echo         docker ps ^| grep dzxt ^|^| echo "No containers running"
echo         ;;
echo esac
) > %PKG%\manage.sh

echo Management script created

echo.
echo Step 7: Creating README...
(
echo # ARM64 Offline Deployment Package - Fixed Version
echo.
echo ## Contents
echo - images/python-3.12-slim.tar: Python 3.12 Docker image
echo - source/: Complete application source code
echo - Dockerfile.arm64: ARM64 optimized Dockerfile with dependency fixes
echo - deploy.sh: Main deployment script
echo - manage.sh: Application management script
echo.
echo ## Requirements
echo - ARM64 Linux machine
echo - Docker installed
echo - No internet required
echo.
echo ## Deployment
echo ```bash
echo # Make scripts executable
echo chmod +x *.sh
echo.
echo # Deploy application
echo ./deploy.sh
echo ```
echo.
echo ## Management
echo ```bash
echo ./manage.sh start     # Start
echo ./manage.sh stop      # Stop
echo ./manage.sh restart   # Restart
echo ./manage.sh logs      # View logs
echo ./manage.sh status    # Check status
echo ```
echo.
echo ## Access
echo - Local: http://localhost:5000
echo - Network: http://your-server-ip:5000
echo.
echo ## Fixes Applied
echo - Enhanced PostgreSQL development libraries
echo - Fallback strategy for psycopg2-binary compilation issues
echo - Alternative psycopg2 installation if binary fails
echo - Fixed encoding issues in Windows scripts
) > %PKG%\README.md

echo README created

echo.
echo Package Summary
echo ===============
echo Package: %PKG%\
echo.
echo Contents:
dir /B %PKG%
echo.
echo Image size:
for %%f in (%PKG%\images\*.tar) do (
    for %%A in ("%%f") do echo %%~nxA: %%~zA bytes
)

echo.
echo Next Steps:
echo 1. Transfer '%PKG%' folder to ARM64 Linux machine
echo 2. Run: chmod +x *.sh
echo 3. Deploy: ./deploy.sh
echo.
echo This package avoids dependency download issues
echo and will install packages directly on ARM64 machine
echo.
pause