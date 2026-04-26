@echo off
REM EcoSynTech Local Core V3.0 - Windows 1-Click Installer
REM Simplified version - Same features as install.sh

setlocal

set "APP_NAME=EcoSynTech Local Core"
set "VERSION=3.0.0"
set "PORT=3000"

title %APP_NAME% %VERSION% - Installer
color 1f

echo.
echo ================================================
echo  %APP_NAME% %VERSION%
echo  1-Click Installer for Windows
echo ================================================
echo.

REM Check Node.js
echo [1/5] Checking Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found!
    echo Please install: https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do echo Node.js: %%i - OK

REM Check npm
echo [2/5] Checking npm...
where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm not found!
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm -v') do echo npm: %%i - OK

REM Install dependencies
echo [3/5] Installing dependencies...
call npm install --legacy-peer-deps 2>nul
if errorlevel 1 (
    echo Retrying with normal install...
    call npm install
)
echo Dependencies - OK

REM Create directories and .env
echo [4/5] Setting up environment...
if not exist "data" mkdir data
if not exist "data\backups" mkdir data\backups
if not exist "logs" mkdir logs
if not exist "models" mkdir models

if not exist ".env" (
    (
        echo # EcoSynTech Local Core V3.0 - Environment
        echo.
        echo PORT=%PORT%
        echo NODE_ENV=development
        echo DB_PATH=.\data\ecosyntech.db
        echo.
        echo JWT_SECRET=%RANDOM%%RANDOM%%RANDOM%
        echo JWT_EXPIRY=86400
        echo.
        echo AI_PROVIDER=deepseek
        echo DEEPSEEK_API_KEY=
        echo OLLAMA_URL=http://localhost:11434
        echo OLLAMA_MODEL=llama3
        echo.
        echo TELEGRAM_BOT_TOKEN=
        echo TELEGRAM_CHAT_ID=
        echo ZALO_APP_ID=
        echo ZALO_APP_SECRET=
        echo.
        echo CORS_ORIGIN=*
        echo RATE_LIMIT_WINDOW=900000
        echo RATE_LIMIT_MAX_REQUESTS=100
        echo.
        echo AUTO_BACKUP_ENABLED=true
        echo BACKUP_INTERVAL=daily
        echo BACKUP_RETENTION=7
        echo.
        echo LOG_LEVEL=info
        echo METRICS_ENABLED=true
    ) > .env
    echo .env created - OK
) else (
    echo .env exists - skipping
)

REM Test system
echo [5/5] Testing system...
node --check server.js 2>nul
if errorlevel 1 (
    echo [ERROR] Server syntax error!
    pause
    exit /b 1
)
echo System test - PASSED

echo.
echo ================================================
echo  INSTALLATION COMPLETE!
echo ================================================
echo.
echo  Server: http://localhost:%PORT%
echo  Login:  admin / admin123
echo.
echo  IMPORTANT: Change password after first login!
echo.
echo  Next steps:
echo    npm start     - Run server
echo    npm run dev   - Development mode
echo.
echo  Documentation: QUICKSTART.md
echo.
pause