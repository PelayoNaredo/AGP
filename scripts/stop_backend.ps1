# Detener el backend
Get-Process -Name "node" | Stop-Process -Force
Write-Host "Backend detenido."