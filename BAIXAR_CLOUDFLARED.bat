@echo off
REM Script para baixar e instalar Cloudflared automaticamente
chcp 65001 >nul 2>&1
color 0A
cls

echo.
echo ════════════════════════════════════════════════════════
echo    BAIXANDO CLOUDFLARED...
echo ════════════════════════════════════════════════════════
echo.

REM Criar pasta se não existir
if not exist C:\cloudflare mkdir C:\cloudflare

REM Baixar cloudflared
echo Baixando arquivo (pode levar alguns segundos)...
echo.

powershell -Command "(New-Object System.Net.WebClient).DownloadFile('https://github.com/cloudflare/cloudflared/releases/download/2024.2.1/cloudflared-windows-amd64.exe', 'C:\cloudflare\cloudflared.exe')"

if exist C:\cloudflare\cloudflared.exe (
    echo.
    echo ════════════════════════════════════════════════════════
    echo    ✅ CLOUDFLARED BAIXADO COM SUCESSO!
    echo ════════════════════════════════════════════════════════
    echo.
    echo Arquivo: C:\cloudflare\cloudflared.exe
    echo.
    echo PROXIMOS PASSOS:
    echo ==================
    echo.
    echo 1. Feche este PowerShell
    echo.
    echo 2. ABRA PowerShell novo como ADMIN
    echo.
    echo 3. Digite:
    echo    cloudflared login
    echo.
    echo ════════════════════════════════════════════════════════
) else (
    color 0C
    echo.
    echo ════════════════════════════════════════════════════════
    echo    ❌ ERRO AO BAIXAR
    echo ════════════════════════════════════════════════════════
    echo.
    echo Tente baixar manualmente em:
    echo https://github.com/cloudflare/cloudflared/releases
    echo.
    echo Coloque o arquivo em: C:\cloudflare\
    echo.
)

echo.
pause
