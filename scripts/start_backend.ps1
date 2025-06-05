# Iniciar el backend
Start-Process -NoNewWindow -FilePath "node" -ArgumentList "backend/server.js"
Write-Host "Backend iniciado en http://localhost:3000"