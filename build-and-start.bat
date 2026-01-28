@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================
echo    BUILD AND START SCRIPT
echo ========================================
echo.

echo [1/3] Installing frontend dependencies...
cd frontend
call npm install
if errorlevel 1 (
    echo Error during npm install
    exit /b 1
)

echo.
echo [2/3] Building frontend...
call npm run build
if errorlevel 1 (
    echo Error during npm build
    exit /b 1
)

echo.
echo [3/3] Starting backend...
cd ..\backend
call npm start
if errorlevel 1 (
    echo Error starting backend
    exit /b 1
)
