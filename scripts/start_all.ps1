# Cambiar al directorio raíz del proyecto
Set-Location -Path "C:\Users\North Arder\Desktop\AppGestionPYMEs"

# Iniciar el backend
Start-Process -NoNewWindow -FilePath "node" -ArgumentList "backend/server.js"


# Iniciar el frontend
Set-Location -Path "AG-PYMEs"
Invoke-Expression "npx expo start"
Set-Location -Path ".."
Write-Host "Frontend iniciado. Escanea el codigo QR con Expo Go."
