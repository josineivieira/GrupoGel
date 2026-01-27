# Script PowerShell - Se elevar automaticamente para ADMIN
# Duplo clique para executar

$isAdmin = [bool]([System.Security.Principal.WindowsIdentity]::GetCurrent().Groups -match 'S-1-5-32-544')

if (-not $isAdmin) {
    Write-Host "Pedindo privilégios de ADMINISTRADOR..." -ForegroundColor Yellow
    $scriptPath = $MyInvocation.MyCommand.Path
    Start-Process powershell -Verb runas -ArgumentList "-File `"$scriptPath`"" -Wait
    exit
}

# Se chegou aqui = É ADMIN!
Clear-Host
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Green
Write-Host "✅ VOCÊ É ADMINISTRADOR!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

Write-Host "Adicionando C:\cloudflare ao PATH..." -ForegroundColor Cyan
Write-Host ""

# Obter PATH atual
$currentPath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")

# Verificar se já existe
if ($currentPath -like "*C:\cloudflare*") {
    Write-Host "✅ C:\cloudflare JÁ ESTÁ NO PATH!" -ForegroundColor Green
} else {
    # Adicionar novo caminho
    $newPath = $currentPath + ";C:\cloudflare"
    [System.Environment]::SetEnvironmentVariable("Path", $newPath, "Machine")
    
    Write-Host "✅ ADICIONADO COM SUCESSO!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Novo PATH:" -ForegroundColor Cyan
    Write-Host "$newPath" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Green
Write-Host "PRONTO! PRÓXIMO PASSO:" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "1. FECHE PowerShell" -ForegroundColor White
Write-Host ""
Write-Host "2. ABRA PowerShell novo como ADMIN" -ForegroundColor White
Write-Host ""
Write-Host "3. Digite:" -ForegroundColor White
Write-Host "   cloudflared login" -ForegroundColor Cyan
Write-Host ""
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Read-Host "Pressione ENTER para fechar"
