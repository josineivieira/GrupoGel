$path = [Environment]::GetEnvironmentVariable('Path','Machine')
[Environment]::SetEnvironmentVariable('Path', $path + ';C:\cloudflare', 'Machine')
Write-Host "Pronto! C:\cloudflare foi adicionado ao PATH"
