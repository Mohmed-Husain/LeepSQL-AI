@echo off
REM ============================================
REM LeepSQL-AI Docker Hub Push Script (Windows)
REM ============================================
REM This script builds and pushes all Docker images to Docker Hub
REM Usage: docker-push.bat <dockerhub-username> [version]
REM Example: docker-push.bat myusername v1.0.0

setlocal enabledelayedexpansion

REM Configuration
set "DOCKERHUB_USERNAME=%~1"
set "PROJECT_NAME=leepsql-ai"
set "VERSION=%~2"

if "%VERSION%"=="" set "VERSION=latest"

echo ============================================
echo   LeepSQL-AI Docker Hub Push Script
echo ============================================

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo Error: Docker is not running. Please start Docker Desktop and try again.
    exit /b 1
)

REM Check if username is provided
if "%DOCKERHUB_USERNAME%"=="" (
    echo Error: Please provide your Docker Hub username
    echo Usage: docker-push.bat ^<dockerhub-username^> [version]
    echo Example: docker-push.bat myusername v1.0.0
    exit /b 1
)

echo Docker Hub Username: %DOCKERHUB_USERNAME%
echo Version Tag: %VERSION%
echo.

REM Login to Docker Hub
echo Step 1: Logging into Docker Hub...
docker login
if errorlevel 1 (
    echo Error: Docker login failed
    exit /b 1
)

REM Build and push Frontend
echo Step 2: Building Frontend image...
docker build -t %DOCKERHUB_USERNAME%/%PROJECT_NAME%-frontend:%VERSION% ./frontend
if errorlevel 1 (
    echo Error: Frontend build failed
    exit /b 1
)
docker tag %DOCKERHUB_USERNAME%/%PROJECT_NAME%-frontend:%VERSION% %DOCKERHUB_USERNAME%/%PROJECT_NAME%-frontend:latest

echo Pushing Frontend image...
docker push %DOCKERHUB_USERNAME%/%PROJECT_NAME%-frontend:%VERSION%
docker push %DOCKERHUB_USERNAME%/%PROJECT_NAME%-frontend:latest

REM Build and push Agents
echo Step 3: Building Agents image...
docker build -t %DOCKERHUB_USERNAME%/%PROJECT_NAME%-agents:%VERSION% ./agents
if errorlevel 1 (
    echo Error: Agents build failed
    exit /b 1
)
docker tag %DOCKERHUB_USERNAME%/%PROJECT_NAME%-agents:%VERSION% %DOCKERHUB_USERNAME%/%PROJECT_NAME%-agents:latest

echo Pushing Agents image...
docker push %DOCKERHUB_USERNAME%/%PROJECT_NAME%-agents:%VERSION%
docker push %DOCKERHUB_USERNAME%/%PROJECT_NAME%-agents:latest

echo.
echo ============================================
echo   All images pushed successfully!
echo ============================================
echo.
echo Your images are now available at:
echo   - %DOCKERHUB_USERNAME%/%PROJECT_NAME%-frontend:%VERSION%
echo   - %DOCKERHUB_USERNAME%/%PROJECT_NAME%-agents:%VERSION%
echo.
echo To pull and run on another machine:
echo   docker pull %DOCKERHUB_USERNAME%/%PROJECT_NAME%-frontend
echo   docker pull %DOCKERHUB_USERNAME%/%PROJECT_NAME%-agents

endlocal
