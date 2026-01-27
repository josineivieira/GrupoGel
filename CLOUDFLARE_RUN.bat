@echo off
chcp 65001 >nul
color 0A
cls

echo.
echo ════════════════════════════════════════════════════════
echo   🔗 CLOUDFLARE TUNNEL - LINK FIXO
echo ════════════════════════════════════════════════════════
echo.

REM Verificar se cloudflared está instalado
where cloudflared >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ cloudflared não está instalado!
    echo.
    echo 📌 Como instalar:
    echo    1. Baixe: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
    echo    2. Extraia em: C:\cloudflare
    echo    3. Add C:\cloudflare ao PATH do Windows
    echo.
    pause
    exit /b 1
)

echo ✅ cloudflared detectado
echo.
echo 📌 Certifique-se que:
echo    ✓ START_EXTERNAL.bat está rodando
echo    ✓ App está em http://localhost:3000
echo    ✓ Você já fez login com: cloudflared login
echo.

echo ════════════════════════════════════════════════════════
echo   🚀 Iniciando Cloudflare Tunnel...
echo ════════════════════════════════════════════════════════
echo.

cloudflared tunnel run --url http://localhost:3000 deliverydocs

echo.
echo ❌ Tunnel foi fechado
echo.
pause
