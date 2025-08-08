#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Script para transformar Edge Functions de Supabase a usar variables de entorno de Deno
.DESCRIPTION
    Este script encuentra y reemplaza automáticamente las credenciales hardcodeadas de Supabase
    por variables de entorno de Deno en todas las funciones Edge.
.EXAMPLE
    .\transform-to-deno-env.ps1
#>

param(
    [Parameter(Mandatory = $false)]
    [string]$FunctionsPath = "AG-PYMEs\supabase\functions",
    
    [Parameter(Mandatory = $false)]
    [switch]$DryRun = $false
)

# Colores para output
function Write-Success { param($msg) Write-Host $msg -ForegroundColor Green }
function Write-Warning { param($msg) Write-Host $msg -ForegroundColor Yellow }
function Write-Error { param($msg) Write-Host $msg -ForegroundColor Red }
function Write-Info { param($msg) Write-Host $msg -ForegroundColor Cyan }

# Patrones para encontrar y reemplazar
$HARDCODED_PATTERN = @'
(?s)// Crear cliente Supabase\s*const supabase = createClient\(\s*"https://[^"]*",\s*"[^"]*"\s*\);
'@

$DENO_ENV_REPLACEMENT = @'
// Crear cliente Supabase usando variables de entorno
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);
'@

Write-Info "🔧 Iniciando transformación de Edge Functions a Deno env..."
Write-Info "📁 Buscando funciones en: $FunctionsPath"

if ($DryRun) {
    Write-Warning "🧪 MODO DRY-RUN: Solo mostrará los cambios sin aplicarlos"
}

# Verificar que el directorio existe
if (!(Test-Path $FunctionsPath)) {
    Write-Error "❌ No se encontró el directorio: $FunctionsPath"
    exit 1
}

# Buscar todos los archivos index.ts en subdirectorios
$functionFiles = Get-ChildItem -Path $FunctionsPath -Recurse -Name "index.ts" | ForEach-Object {
    Join-Path $FunctionsPath $_
}

if ($functionFiles.Count -eq 0) {
    Write-Warning "⚠️  No se encontraron archivos index.ts en $FunctionsPath"
    exit 0
}

Write-Info "📝 Encontrados $($functionFiles.Count) archivos de funciones:"
$functionFiles | ForEach-Object { Write-Info "   - $_" }

$transformedCount = 0
$alreadyTransformedCount = 0
$errorCount = 0

foreach ($filePath in $functionFiles) {
    $functionName = Split-Path (Split-Path $filePath -Parent) -Leaf
    Write-Info "`n🔍 Procesando función: $functionName"
    
    try {
        # Leer contenido del archivo
        $content = Get-Content $filePath -Raw -Encoding UTF8
        
        if ([string]::IsNullOrEmpty($content)) {
            Write-Warning "⚠️  Archivo vacío: $filePath"
            continue
        }
        
        # Verificar si ya usa Deno.env
        if ($content -match 'Deno\.env\.get\("SUPABASE_URL"\)') {
            Write-Success "✅ $functionName ya usa variables de entorno Deno"
            $alreadyTransformedCount++
            continue
        }
        
        # Verificar si tiene el patrón hardcodeado
        if ($content -notmatch 'createClient\(\s*"https://[^"]*",\s*"[^"]*"\s*\)') {
            Write-Warning "⚠️  $functionName no tiene el patrón de credenciales hardcodeadas esperado"
            continue
        }
        
        Write-Info "🔄 Transformando $functionName..."
        
        # Realizar la transformación
        $newContent = $content -replace $HARDCODED_PATTERN, $DENO_ENV_REPLACEMENT
        
        # Verificar que se hizo el cambio
        if ($newContent -eq $content) {
            Write-Warning "⚠️  No se pudo transformar $functionName - patrón no encontrado exactamente"
            continue
        }
        
        if ($DryRun) {
            Write-Info "📋 CAMBIOS PROPUESTOS para ${functionName}:"
            Write-Info "   - Reemplazar credenciales hardcodeadas con Deno.env.get()"
            Write-Info "   - Variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
        } else {
            # Escribir el archivo transformado
            Set-Content -Path $filePath -Value $newContent -Encoding UTF8 -NoNewline
            Write-Success "✅ $functionName transformado exitosamente"
        }
        
        $transformedCount++
        
    } catch {
        Write-Error "❌ Error procesando ${functionName}: $_"
        $errorCount++
    }
}

# Resumen final
Write-Info "`n📊 RESUMEN DE TRANSFORMACIÓN:"
Write-Success "✅ Funciones transformadas: $transformedCount"
Write-Info "📋 Ya transformadas: $alreadyTransformedCount"
Write-Error "❌ Errores: $errorCount"
Write-Info "📁 Total procesadas: $($functionFiles.Count)"

if ($DryRun -and $transformedCount -gt 0) {
    Write-Info "`n🎯 Para aplicar los cambios, ejecuta:"
    Write-Info "   .\transform-to-deno-env.ps1"
} elseif ($transformedCount -gt 0) {
    Write-Success "`n🎉 ¡Transformación completada!"
    Write-Info "📝 Las funciones ahora usan:"
    Write-Info "   - Deno.env.get('SUPABASE_URL')"
    Write-Info "   - Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')"
    Write-Info ""
    Write-Info "🔧 Asegúrate de configurar estas variables en tu entorno de Supabase Edge Functions"
} else {
    Write-Info "`n✨ Todas las funciones ya están actualizadas o no necesitan cambios"
}

exit 0
