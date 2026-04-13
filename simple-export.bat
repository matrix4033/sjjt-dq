@echo off
echo Simple ARM64 Export
echo ==================
echo.

set PKG=arm64-simple

echo Creating package...
if exist %PKG% rmdir /s /q %PKG%
mkdir %PKG%

echo.
echo 1. Exporting Python 3.12 image...
docker pull python:3.12-slim
docker save python:3.12-slim -o %PKG%\python-3.12-slim.tar

echo.
echo 2. Copying source code...
mkdir %PKG%\source
copy *.* %PKG%\source\ >nul 2>&1
if exist api mkdir %PKG%\source\api && copy api\*.* %PKG%\source\api\ >nul 2>&1
if exist css mkdir %PKG%\source\css && copy css\*.* %PKG%\source\css\ >nul 2>&1
if exist js mkdir %PKG%\source\js && copy js\*.* %PKG%\source\js\ >nul 2>&1
if exist data mkdir %PKG%\source\data && copy data\*.* %PKG%\source\data\ >nul 2>&1

echo.
echo 3. Creating Dockerfile...
(
echo FROM python:3.12-slim
echo WORKDIR /app
echo ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 FLASK_APP=api/app.py
echo RUN apt-get update ^&^& apt-get install -y gcc libpq-dev curl build-essential ^&^& rm -rf /var/lib/apt/lists/*
echo COPY api/requirements.txt /app/api/requirements.txt
echo RUN pip install --upgrade pip ^&^& pip install -r api/requirements.txt
echo COPY . /app/
echo RUN useradd app ^&^& chown -R app:app /app
echo USER app
echo EXPOSE 5000
echo CMD ["python", "api/app.py"]
) > %PKG%\source\Dockerfile

echo.
echo 4. Creating deploy script...
(
echo #!/bin/bash
echo echo "Loading Python image..."
echo docker load -i python-3.12-slim.tar
echo echo "Building application..."
echo cd source
echo docker build -t dzxt:arm64 .
echo echo "Starting application..."
echo docker stop dzxt-app 2^>/dev/null ^&^& docker rm dzxt-app 2^>/dev/null
echo docker run -d -p 5000:5000 --name dzxt-app dzxt:arm64
echo echo "Done! Access: http://localhost:5000"
) > %PKG%\deploy.sh

echo.
echo ✅ Package created: %PKG%\
echo 📦 Contents: Python image + Source code + Dockerfile + Deploy script
echo 🚀 Transfer to ARM64 Linux and run: chmod +x deploy.sh && ./deploy.sh
echo.
pause