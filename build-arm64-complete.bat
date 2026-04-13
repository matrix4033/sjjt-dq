@echo off
echo Complete ARM64 Build Solution for Offline Deployment
echo ====================================================
echo.

REM Check if running in WSL
wsl --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: WSL not available
    echo Please install WSL and Ubuntu-24.04
    pause
    exit /b 1
)

echo This script will use WSL Ubuntu-24.04 to build ARM64 images
echo.
set /p confirm="Continue? (y/n): "
if /i not "%confirm%"=="y" exit /b 0

echo.
echo Executing ARM64 build in WSL Ubuntu-24.04...
echo This may take 10-15 minutes depending on your internet connection
echo.

REM Execute the build script in WSL
wsl -d Ubuntu-24.04 --exec bash -c "cd '%CD%' && chmod +x build-arm64-complete.sh && ./build-arm64-complete.sh"

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo SUCCESS! ARM64 deployment package ready
    echo ========================================
    echo.
    echo Package location: arm64-deployment\
    echo.
    echo Next steps:
    echo 1. Copy the 'arm64-deployment' folder to your ARM64 Linux server
    echo 2. On the ARM64 server, run: cd arm64-deployment ^&^& ./deploy-arm64.sh
    echo 3. Access your application at http://localhost:5000
    echo.
    echo The package is completely offline-ready!
) else (
    echo.
    echo Build failed. Please check the error messages above.
    echo.
    echo Common solutions:
    echo 1. Ensure Docker Desktop is running
    echo 2. Check internet connection for downloading base images
    echo 3. Verify WSL Ubuntu-24.04 is properly configured
)

echo.
pause