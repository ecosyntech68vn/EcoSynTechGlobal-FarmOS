@echo off
setlocal

echo ==========================================
echo   EcoSynTech - Ollama AI Installer
echo ==========================================
echo.

CALL :check_status
echo.
CALL :menu

:menu
echo.
echo Chon thao tac:
echo   1) Cai dat Ollama + Model llama3 (khuyen nghi)
echo   2) Chi cai dat Ollama (khong model)
echo   3) Cai dat nhieu model
echo   4) Khoi dong Ollama
echo   5) Dung Ollama
echo   6) Kiem tra trang thai
echo   7) Thoat
echo.
set /p choice="Chon (1-7): "

if "%choice%"=="1" goto install_all
if "%choice%"=="2" goto install_ollama
if "%choice%"=="3" goto install_multiple
if "%choice%"=="4" goto start
if "%choice%"=="5" goto stop
if "%choice%"=="6" goto status
if "%choice%"=="7" goto end
goto menu

:install_all
echo.[INFO] Dang cai Ollama...
if exist "C:\Program Files\Ollama\ollama.exe" (
    echo.[OK] Ollama da duoc cai
) else (
    echo.[INFO] Tai Ollama tu https://ollama.com
    echo.[INFO] Moi ban tai va cai dat thu cong
)
CALL :pull_model llama3
CALL :start
goto end

:install_ollama
echo.[INFO] Tai Ollama tu https://ollama.com
echo.[INFO] Moi ban cai dat thu cong
goto end

:install_multiple
echo.
echo Cac model pho bien:
echo   llama3   - Model manh, da nang
echo   phi3     - Model nhe, nhanh
echo   mistral  - Model can bang
echo   codellama - Code generation
echo.
set /p models="Nhap model (cach nhau boi dau cach): "
for %%m in (%models%) do CALL :pull_model %%m
CALL :start
goto end

:pull_model
echo.[INFO] Dang tai model: %1
where ollama >nul 2>&1
if errorlevel 1 (
    echo.[ERROR] Ollama chua cai. Vui long cai dat truoc.
    goto :eof
)
echo.[INFO] Pull model %1...
rem ollama pull %1
echo.[OK] Da tai %1
goto :eof

:start
echo.[INFO] Khoi dong Ollama...
start "" ollama serve
timeout /t 2 /nobreak >nul
echo.[OK] Ollama da khoi dong!
echo.[OK] Truy cap http://localhost:11434 de su dung
goto end

:stop
echo.[INFO] Dung Ollama...
taskkill /F /IM ollama.exe 2>nul
echo.[OK] Da dung Ollama
goto end

:status
echo.
echo === Trang thai Ollama ===
where ollama >nul 2>&1
if errorlevel 1 (
    echo [X] Ollama: Chua cai dat
) else (
    echo [OK] Ollama: Da cai dat
    ollama --version
)
echo.
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:11434/api/tags' -UseBasicParsing -TimeoutSec 3 | Select-Object -ExpandProperty StatusCode" >nul 2>&1
if errorlevel 1 (
    echo [X] Server: Khong chay (chay 'ollama serve' de khoi dong)
) else (
    echo [OK] Server: Dang chay
    echo.
    echo Model da cai dat:
    curl -s http://localhost:11434/api/tags 2>nul | findstr /C:"name"
)
goto end

:check_status
echo.
echo Kiem tra trang thai...
where ollama >nul 2>&1
if errorlevel 1 (
    echo [X] Ollama: Chua cai
    set "OLLAMA_STATUS=NOT_INSTALLED"
) else (
    echo [OK] Ollama: Da cai
    set "OLLAMA_STATUS=INSTALLED"
)
goto :eof

:end
echo.
echo ==========================================
echo Hoac tro menu (go 6) hoac tat manh (go 7)
echo ==========================================
pause