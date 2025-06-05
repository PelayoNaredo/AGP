# Detener el frontend
Get-Process -Name "expo" | Stop-Process -Force
Write-Host "Frontend detenido."