@echo off
chcp 65001 >nul
color 0A
cls

echo.
echo ════════════════════════════════════════════════════════
echo    🚀 DELIVERY DOCS APP - INICIANDO
echo ════════════════════════════════════════════════════════
echo.

REM Matar processos anteriores
taskkill /F /IM node.exe 2>nul
taskkill /F /IM npm.exe 2>nul
timeout /t 2 /nobreak >nul

echo [1/4] ✅ Processos antigos finalizados
echo.

REM Iniciar backend em nova janela
echo [2/4] 🔵 Iniciando Backend (porta 5000)...
start "Backend - Delivery Docs" cmd /k "cd /d %cd%\backend && npm run dev"

timeout /t 3 /nobreak >nul

REM Iniciar frontend em nova janela com acesso externo
echo [3/4] 🎨 Iniciando Frontend (porta 3000 - Acessível externamente)...
start "Frontend - Delivery Docs" cmd /k "cd /d %cd%\frontend && set DANGEROUSLY_DISABLE_HOST_CHECK=true && npm start"

timeout /t 3 /nobreak >nul

echo.
echo ════════════════════════════════════════════════════════
echo    ✅ APLICAÇÃO INICIADA COM SUCESSO!
echo ════════════════════════════════════════════════════════
echo.
echo 📌 Endereços:
echo    🌐 Frontend Local:     http://localhost:3000
echo    🌐 Frontend Celular:   http://192.168.1.3:3000
echo    🔌 Backend Local:      http://localhost:5000/api
echo    🔌 Backend Celular:    http://192.168.1.3:5000/api
echo.
echo 🔐 Credenciais:
echo    Motorista: motorista@example.com / senha123
echo    Admin:     admin@example.com / admin123
echo.
echo ⚠️  Feche as janelas dos servidores para parar a aplicação
echo.
echo ════════════════════════════════════════════════════════
echo.

pause
