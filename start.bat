@echo off
chcp 65001 >nul
echo ============================================
echo  EcoSynTech Farm OS - Khoi dong nhanh
echo  Chi 1 click la chay - Danh cho nong dan
echo ============================================
echo.

REM Bước 1: Kiểm tra Node.js
echo [1] Kiem tra Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [!] Node.js chua cai dat!
    echo    Vui long cai dat Node.js tu: https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js: %nodejs_version%
echo.

REM Bước 2: Cài đặt dependencies
echo [2] Kiem tra thu vien...
if not exist "node_modules" (
    echo     Dang cai dat thu vien lan dau...
    call npm install
    if %errorlevel% neq 0 (
        echo  [!] Loi cai dat thu vien!
        pause
        exit /b 1
    )
)
echo [OK] Thu vien OK
echo.

REM Bước 3: Tạo .env nếu chưa có
echo [3] Kiem tra cau hinh...
if not exist ".env" (
    echo     Tao file cau hinh moi...
    
    REM Generate random secrets
    for /f "delims=" %%i in ('powershell -Command "[guid]::NewGuid().ToString('n')"') do set JWT_SECRET=%%i
    for /f "delims=" %%i in ('powershell -Command "[guid]::NewGuid().ToString('n')"') do set HMAC_SECRET=%%i
    for /f "delims=" %%i in ('powershell -Command "[guid]::NewGuid().ToString('n')"') do set WEBHOOK_SECRET=%%i
    
    (
        echo # EcoSynTech Farm OS Configuration
        echo PORT=3000
        echo NODE_ENV=development
        echo JWT_SECRET=%JWT_SECRET%
        echo JWT_EXPIRES_IN=7d
        echo HMAC_SECRET=%HMAC_SECRET%
        echo WEBHOOK_SECRET=%WEBHOOK_SECRET%
        echo DB_PATH=.\data\ecosyntech.db
        echo FARM_LAT=10.7769
        echo FARM_LON=106.7009
    ) > .env
)
echo [OK] Cau hinh OK
echo.

REM Bước 4: Tạo thư mục data
echo [4] Kiem tra du lieu...
if not exist "data" mkdir data
echo [OK] Thu muc du lieu OK
echo.

REM Bước 5: Chạy server
echo ============================================
echo  EcoSynTech Farm OS DA SAN SANG!
echo ============================================
echo.
echo  Truy cap website:
echo    http://localhost:3000        - Trang chu
echo    http://localhost:3000/products - San pham
echo    http://localhost:3000/policies - Chinh sach
echo    http://localhost:3000/dashboard - Quan ly farm
echo.
echo  Nhan bat ky phim nao de dung
pause >nul

npm start