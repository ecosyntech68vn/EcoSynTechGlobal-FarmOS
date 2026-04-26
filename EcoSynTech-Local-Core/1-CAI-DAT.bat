@echo off
chcp 65001 >nul
title EcoSynTech - Cai dat lan dau
echo.
echo ============================================
echo  🌱 ECO SYNTECH - CAI DAT LAN DAU
echo  Danh cho nong dan - Rat don gian
echo ============================================
echo.

REM ===== BƯỚC 1: KIỂM TRA NODE.JS =====
echo [1/5] Kiem tra Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [!] May chua cai Node.js!
    echo.
    echo  Huong dan cai dat:
    echo  1. Vao trinh duyet: https://nodejs.org
    echo  2. Tai ban Windows (Moi nhat)
    echo  3. Mo file tai ve, nhan Next Next...
    echo.
    echo  Sau cai dat xong, chay lai file nay!
    pause
    exit /b 1
)
echo  [OK] Node.js: %nodejs_version%

REM ===== BƯỚC 2: CÀI ĐẶT THƯ VIỆN =====
echo.
echo [2/5] Tai thu vien (cho lan dau)...
echo  (Co the mat 1-3 phut, cho tinh...)
call npm install
if %errorlevel% neq 0 (
    echo  [!] Loi tai thu vien!
    pause
    exit /b 1
)
echo  [OK] Tai xong!

REM ===== BƯỚC 3: TẠO THƯ MỤC DATA =====
echo.
echo [3/5] Tao thu muc luu du lieu...
if not exist "data" mkdir data
echo  [OK] Tao xong!

REM ===== BƯỚC 4: TẠO FILE CẤU HÌNH .ENV =====
echo.
echo [4/5] Tao cau hinh (tao mat khau bao mat)...
if not exist ".env" (
    REM Generate secure random secrets
    for /f "delims=" %%i in ('powershell -Command "[guid]::NewGuid().ToString('n').Replace('a','!'").Replace('b','@").Replace('c','#")"') do set JWT=!%%i!
    for /f "delims=" %%i in ('powershell -Command "[guid]::NewGuid().ToString('n')"') do set HMAC=%%i
    for /f "delims=" %%i in ('powershell -Command "[guid]::NewGuid().ToString('n')"') do set WEB=%%i
    
    (
        echo # === Cau hinh EcoSynTech Farm OS ===
        echo # Sinh tu dong - Mat khau bao mat
        echo PORT=3000
        echo NODE_ENV=development
        echo JWT_SECRET=%JWT%
        echo JWT_EXPIRES_IN=7d
        echo HMAC_SECRET=%HMAC%
        echo WEBHOOK_SECRET=%WEB%
        echo.
        echo # Du lieu
        echo DB_PATH=.\data\ecosyntech.db
        echo BACKUP_DIR=.\backups
        echo.
        echo # Vi tri trang trai (mac dinh)
        echo FARM_LAT=10.7769
        echo FARM_LON=106.7009
    ) > .env
    echo  [OK] Tao xong! Mat khau: Tu dong tao
)
echo  [OK] Cau hinh san!

REM ===== BƯỚC 5: CHẠY THỬ =====
echo.
echo ============================================
echo  🌱 DA CAI DAT XONG!
echo ============================================
echo.
echo  Vui long tai va chay file [2-CHAY] de khoi dong!
echo.
pause