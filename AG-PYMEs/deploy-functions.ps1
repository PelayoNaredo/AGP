# 🚀 Script de Deployment Masivo de Edge Functions
# Fecha: 7 de agosto de 2025
# Propósito: Desplegar todas las Edge Functions optimizadas

$projectRef = "kwuxtvgnzjqlrccftnru"

# Lista de todas las Edge Functions a desplegar
$functions = @(
    # Funciones principales optimizadas (100% Backend Compatible)
    "alerts",
    "appointments", 
    "clients",
    "income",
    
    # Funciones con ARQUITECTURA OPTIMIZADA (75% reducción)
    "dashboard",
    "expenses",
    "employees",
    "inventory",
    "leaves",
    
    # Funciones con ARQUITECTURA OPTIMIZADA (65-70% reducción)
    "orders",
    "shifts",
    "sales",
    "services",
    "suppliers",
    "settings",
    "users",
    "user-sync",
    "signed-url",
    
    # Funciones con withTenantContext
    "companies",
    "order-detail",
    
    # Funciones de autenticación (sin withTenantContext)
    "login",
    "register"
)

Write-Host "🚀 Iniciando deployment masivo de Edge Functions..." -ForegroundColor Green
Write-Host "📊 Total de funciones a desplegar: $($functions.Count)" -ForegroundColor Cyan

$deployed = @()
$failed = @()
$skipped = @()

foreach ($func in $functions) {
    Write-Host "`n⏳ Desplegando función: $func" -ForegroundColor Yellow
    
    try {
        # Verificar que el archivo index.ts existe
        $indexPath = "supabase\functions\$func\index.ts"
        if (-not (Test-Path $indexPath)) {
            Write-Host "❌ Archivo no encontrado: $indexPath" -ForegroundColor Red
            $skipped += $func
            continue
        }
        
        # Ejecutar deployment
        $result = supabase functions deploy $func --project-ref $projectRef 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $func desplegado exitosamente" -ForegroundColor Green
            $deployed += $func
        } else {
            Write-Host "❌ Error desplegando $func" -ForegroundColor Red
            Write-Host $result -ForegroundColor Red
            $failed += $func
        }
    }
    catch {
        Write-Host "❌ Error inesperado desplegando $func`: $_" -ForegroundColor Red
        $failed += $func
    }
    
    # Pausa pequeña entre deployments para evitar rate limiting
    Start-Sleep -Seconds 2
}

# Resumen final
Write-Host "`n📊 RESUMEN DEL DEPLOYMENT:" -ForegroundColor Cyan
Write-Host "✅ Desplegadas exitosamente: $($deployed.Count)" -ForegroundColor Green
if ($deployed.Count -gt 0) {
    $deployed | ForEach-Object { Write-Host "   - $_" -ForegroundColor Green }
}

Write-Host "❌ Fallidas: $($failed.Count)" -ForegroundColor Red
if ($failed.Count -gt 0) {
    $failed | ForEach-Object { Write-Host "   - $_" -ForegroundColor Red }
}

Write-Host "⏭️ Omitidas (sin archivo): $($skipped.Count)" -ForegroundColor Yellow
if ($skipped.Count -gt 0) {
    $skipped | ForEach-Object { Write-Host "   - $_" -ForegroundColor Yellow }
}

if ($deployed.Count -eq $functions.Count) {
    Write-Host "`n🎉 ¡DEPLOYMENT COMPLETADO AL 100%!" -ForegroundColor Green
    Write-Host "🔗 Dashboard: https://supabase.com/dashboard/project/$projectRef/functions" -ForegroundColor Cyan
} else {
    Write-Host "`n⚠️ Deployment parcial completado" -ForegroundColor Yellow
}

Write-Host "`n🏁 Script finalizado." -ForegroundColor Cyan
