@echo off
title Install SSL Certificate to Windows Trust Store

echo.
echo =====================================================
echo   Installing Self-Signed Certificate to Trust Store
echo =====================================================
echo.

REM Check if certificate exists
if not exist "certs\server.crt" (
    echo ERROR: Certificate file not found at certs\server.crt
    echo Please generate certificates first: npm run ssl:generate
    pause
    exit /b 1
)

echo This will install the self-signed certificate to your Windows
echo certificate store, which will eliminate the security warning.
echo.
echo WARNING: Only do this for development certificates you trust!
echo.
set /p CONFIRM="Do you want to continue? (y/N): "

if /i "%CONFIRM%" neq "y" (
    echo Operation cancelled.
    pause
    exit /b 0
)

echo.
echo Installing certificate...

REM Import certificate to Local Machine Trusted Root Certification Authorities
certlm.msc
echo.
echo Manual Steps:
echo 1. In the Certificate Manager that opened:
echo 2. Navigate to "Trusted Root Certification Authorities" ^> "Certificates"
echo 3. Right-click ^> "All Tasks" ^> "Import..."
echo 4. Click "Next" ^> "Browse..." ^> Select "certs\server.crt"
echo 5. Click "Next" ^> "Next" ^> "Finish"
echo.
echo Alternatively, run this command as Administrator:
echo certutil -addstore -f "ROOT" "certs\server.crt"
echo.

pause

