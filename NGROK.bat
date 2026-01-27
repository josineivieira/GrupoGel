@echo off
chcp 65001 >nul
color 0A
cls

echo.
echo ════════════════════════════════════════════════════════
echo   🌐 COMPARTILHANDO APP NA INTERNET (NGROK)
echo ════════════════════════════════════════════════════════
echo.

REM Verificar se ngrok está instalado
if not exist "C:\ngrok\ngrok.exe" (
    echo.
    echo ❌ ngrok não encontrado em C:\ngrok\
    echo.
    echo 📌 Como instalar:
    echo    1. Baixe: https://ngrok.com/download
    echo    2. Extraia em: C:\ngrok
    echo    3. Execute este arquivo novamente
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Iniciando ngrok...
echo.
echo 📌 Certifique-se que:
echo    ✓ START_EXTERNAL.bat está rodando
echo    ✓ App está acessível em http://localhost:3000
echo.
echo ════════════════════════════════════════════════════════
echo.

cd C:\ngrok
.\ngrok http 3000

echo.
echo ❌ ngrok foi fechado
echo.
pause
