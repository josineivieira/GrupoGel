# Script para adicionar C:\cloudflare ao PATH do Windows
# Clique direito e selecione "Executar com PowerShell"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "   Adicionando PATH Automaticamente" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está rodando como ADMINISTRADOR
$isAdmin = [bool]([System.Security.Principal.WindowsIdentity]::GetCurrent().Groups -match 'S-1-5-32-544')

if (-not $isAdmin) {
    Write-Host "❌ ERRO: Este script precisa ser executado como ADMINISTRADOR!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Clique direito no arquivo e selecione 'Executar com PowerShell'" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

Write-Host "✅ Executando como ADMINISTRADOR" -ForegroundColor Green
Write-Host ""

# Obter o PATH atual
$currentPath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")

# Verificar se C:\cloudflare já está no PATH
if ($currentPath -like "*C:\cloudflare*") {
    Write-Host "✅ C:\cloudflare JÁ ESTÁ no PATH!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Você pode usar 'cloudflared' em qualquer lugar agora!" -ForegroundColor Cyan
} else {
    Write-Host "⏳ Adicionando C:\cloudflare ao PATH..." -ForegroundColor Yellow
    Write-Host ""
    
    # Adicionar ao PATH
    $newPath = $currentPath + ";C:\cloudflare"
    [System.Environment]::SetEnvironmentVariable("Path", $newPath, "Machine")
    
    Write-Host "✅ PATH ADICIONADO COM SUCESSO!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Novo PATH:" -ForegroundColor Cyan
    Write-Host $newPath -ForegroundColor White
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "   Verificando instalação..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Tentar executar cloudflared para verificar
try {
    $version = & cloudflared --version 2>&1
    Write-Host "✅ cloudflared está funcionando!" -ForegroundColor Green
    Write-Host "Versão: $version" -ForegroundColor Cyan
} catch {
    Write-Host "⚠️  cloudflared ainda não foi baixado" -ForegroundColor Yellow
    Write-Host "Baixe de: https://github.com/cloudflare/cloudflared/releases" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "   PRÓXIMO PASSO:" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. FECHE TODOS os PowerShell" -ForegroundColor White
Write-Host "2. ABRA PowerShell novo como ADMIN" -ForegroundColor White
Write-Host "3. Digite: cloudflared login" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pressione ENTER para fechar este script..." -ForegroundColor Yellow

pause
