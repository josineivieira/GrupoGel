@echo off
chcp 65001 >nul
color 0A
cls

echo.
echo ════════════════════════════════════════════════════════
echo   🔗 CLOUDFLARE TUNNEL - LINK FIXO
echo ════════════════════════════════════════════════════════
echo.
echo ℹ️  Este script configura link PERMANENTE para seu app
echo.

REM Verificar se cloudflared está instalado
where cloudflared >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ cloudflared não está instalado!
    echo.
    echo 📌 Como instalar:
    echo    1. Baixe em: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
    echo    2. Extraia em: C:\cloudflare
    echo    3. Adicione C:\cloudflare ao PATH (ou copie cloudflared.exe para system32)
    echo.
    pause
    exit /b 1
)

echo ✅ cloudflared detectado
echo.
echo 📋 Próximos passos:
echo.
echo 1️⃣  Faça login na sua conta Cloudflare:
echo.
cloudflared login

echo.
echo 2️⃣  Crie um novo tunnel:
echo.
echo    Copie e cole este comando:
echo.
echo    cloudflared tunnel create deliverydocs
echo.
echo.
echo 3️⃣  Depois execute este comando:
echo.
echo    cloudflared tunnel run --url http://localhost:3000 deliverydocs
echo.
echo ════════════════════════════════════════════════════════
echo.
pause
