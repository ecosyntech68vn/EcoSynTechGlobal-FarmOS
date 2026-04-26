@echo off
chcp 65001 >nul
title EcoSynTech - Khoi dong
echo.
echo ============================================
echo  🌱 ECO SYNTECH - KHOI DONG
echo  Farm OS cho nong dan Viet Nam
echo ============================================
echo.

REM ===== KIỂM TRA ĐÃ CÀI ĐẶT CHƯA =====
if not exist ".env" (
    echo  [!] Chua cai dat lan dau!
    echo.
    echo  Vui long chay file [1-CAI-DAT] truoc!
    echo  sau do quay lai chay file nay.
    echo.
    pause
    exit /b 1
)

REM ===== CHẠY SERVER =====
echo  [1] Dang khoi dong server...
echo.
echo ============================================
echo  🌱 ECO SYNTECH - DA SAN SANG!
echo ============================================
echo.
echo  📱 MO TRINH DUYET va truy cap:
echo.
echo     http://localhost:3000         - Trang chu ban hang
echo     http://localhost:3000/products - San pham
echo     http://localhost:3000/policies  - Chinh sach
echo     http://localhost:3000/dashboard - Quan ly trang trai
echo.
echo  📞 HO TRO: Zalo 0989516698
echo.
echo  Nhan Ctrl+C de dung server
echo ============================================
echo.

REM Chạy server
npm start

echo.
echo  👋 Tam biet! Hen gap lai!
pause