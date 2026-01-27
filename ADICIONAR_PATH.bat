@echo off
REM Script para adicionar PATH automaticamente
REM Clique direito > Executar como administrador

setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
color 0A
cls

echo.
echo ════════════════════════════════════════════════════════
echo    ⚙️  ADICIONANDO PATH AUTOMATICAMENTE
echo ════════════════════════════════════════════════════════
echo.

REM Verificar se está rodando como ADMIN
net session >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo ❌ ERRO: Você precisa ser ADMINISTRADOR!
    echo.
    echo Como executar como ADMIN:
    echo  1. Encontre este arquivo: ADICIONAR_PATH.bat
    echo  2. Clique direito nele
    echo  3. Selecione "Executar como administrador"
    echo.
    pause
    exit /b 1
)

color 0A
echo ✅ Você é ADMINISTRADOR!
echo.
echo ⏳ Adicionando C:\cloudflare ao PATH...
echo.

REM Adicionar ao PATH usando reg
reg add "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v Path /t REG_EXPAND_SZ /d "!Path!;C:\cloudflare" /f >nul 2>&1

if %errorlevel% equ 0 (
    echo ✅ PATH ADICIONADO COM SUCESSO!
    echo.
) else (
    echo ❌ Erro ao adicionar PATH
    echo Tente de novo ou faça manualmente
    pause
    exit /b 1
)

echo.
echo ════════════════════════════════════════════════════════
echo    ✅ PRÓXIMOS PASSOS:
echo ════════════════════════════════════════════════════════
echo.
echo 1️⃣  FECHE TODOS os PowerShell/CMD abertos
echo.
echo 2️⃣  ABRA PowerShell novo como ADMINISTRADOR
echo.
echo 3️⃣  Digite este comando:
echo.
echo      cloudflared login
echo.
echo 4️⃣  Um navegador vai abrir, faça login na Cloudflare
echo.
echo 5️⃣  Depois vire o terminal e veja a mensagem de sucesso
echo.
echo ════════════════════════════════════════════════════════
echo.
echo Pressione qualquer tecla para fechar...
pause >nul
