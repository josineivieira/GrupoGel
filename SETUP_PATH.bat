@echo off
REM Script SIMPLES para adicionar PATH
REM Clique DIREITO > Executar como administrador

setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
cls
color 0A

echo.
echo ════════════════════════════════════════════════════════
echo    VERIFICANDO PRIVILÉGIOS...
echo ════════════════════════════════════════════════════════
echo.

REM Verificar se é admin
net session >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    cls
    echo.
    echo ════════════════════════════════════════════════════════
    echo    ERRO: PRIVILÉGIOS DE ADMIN NECESSÁRIOS
    echo ════════════════════════════════════════════════════════
    echo.
    echo Este script PRECISA ser executado como ADMINISTRADOR
    echo.
    echo COMO FAZER:
    echo ============
    echo.
    echo 1. Encontre este arquivo: SETUP_PATH.bat
    echo.
    echo 2. Clique DIREITO nele (nao duplo clique)
    echo.
    echo 3. Selecione: "Executar como administrador"
    echo.
    echo 4. Clique em "Sim" quando aparecer a janela azul
    echo.
    echo ════════════════════════════════════════════════════════
    echo.
    pause
    exit /b 1
)

REM Se chegou aqui, é admin!
color 0A
cls
echo.
echo ════════════════════════════════════════════════════════
echo    VOCE E ADMINISTRADOR - OK!
echo ════════════════════════════════════════════════════════
echo.

echo Adicionando C:\cloudflare ao PATH...
echo.

REM Adicionar ao PATH
setx /M Path "%PATH%;C:\cloudflare"

echo.
echo.
echo ════════════════════════════════════════════════════════
echo    PRONTO!
echo ════════════════════════════════════════════════════════
echo.
echo C:\cloudflare foi ADICIONADO!
echo.
echo.
echo PROXIMO PASSO:
echo ==============
echo.
echo 1. FECHE esta janela
echo.
echo 2. ABRA PowerShell novo como ADMIN
echo.
echo 3. Digite:
echo    cloudflared login
echo.
echo.
echo ════════════════════════════════════════════════════════
echo.
echo PRESSIONE UMA TECLA PARA FECHAR...
echo.
pause

echo Pressione qualquer tecla para fechar...
pause >nul
exit /b 0
