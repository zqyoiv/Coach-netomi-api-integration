@echo off
title Netomi HTTPS Server

echo.
echo =====================================================
echo   Netomi API Integration - HTTPS Server Launcher
echo =====================================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if package.json exists
if not exist "package.json" (
    echo ERROR: package.json not found
    echo Please run this script from the project root directory
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Check if SSL certificates exist
if not exist "certs\server.crt" (
    echo SSL certificates not found. Generating self-signed certificates...
    node generate-ssl.js
    if %errorlevel% neq 0 (
        echo ERROR: Failed to generate SSL certificates
        pause
        exit /b 1
    )
    echo.
)

REM Check if .env file exists
if not exist ".env" (
    echo.
    echo WARNING: .env file not found
    echo Please copy env.example to .env and configure your Netomi API settings
    echo.
    echo Starting server with default configuration...
    echo.
)

REM Start the HTTPS server
echo Starting HTTPS server...
echo.
echo Server will be available at:
echo   - HTTPS: https://localhost:3443
echo   - HTTP:  http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

node https-server.js

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Server failed to start
    echo Check the error messages above for details
    pause
    exit /b 1
)

pause
