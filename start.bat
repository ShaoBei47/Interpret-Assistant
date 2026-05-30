@echo off
title Interpret-Assistant
echo ========================================
echo  Interpret-Assistant - Local Server
echo ========================================

where node >nul 2>&1
if %errorlevel% equ 0 (
    echo [Found Node.js] Starting http-server...
    start http://localhost:8080/src/index.html
    npx --yes http-server -p 8080 -c-1
    pause
    exit /b
)

where python3 >nul 2>&1
if %errorlevel% equ 0 (
    echo [Found Python3] Starting http.server...
    start http://localhost:8000/src/index.html
    python3 -m http.server 8000
    pause
    exit /b
)

where python >nul 2>&1
if %errorlevel% equ 0 (
    echo [Found Python] Starting http.server...
    start http://localhost:8000/src/index.html
    python -m http.server 8000
    pause
    exit /b
)

echo.
echo No Python or Node.js found.
echo Install one of them, or use VS Code Live Server on src/index.html
echo.
pause
