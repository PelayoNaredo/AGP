# Script para extraer funciones y triggers de Supabase
param(
    [string]$OutputPath = "AG-PYMEs\Database_Funciones_y_Triggers_Complete.md"
)

function Write-Status {
    param($Message, $Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

# Main execution
Write-Status "Iniciando extraccion de funciones y triggers..." "Green"

try {
    # Verificar directorio
    if (!(Test-Path "AG-PYMEs\supabase\config.toml")) {
        Write-Status "Error: No se encontro AG-PYMEs\supabase\config.toml" "Red"
        exit 1
    }

    # Buscar migraciones
    $migrationPath = "AG-PYMEs\supabase\migrations"
    $migrationFiles = @()
    
    if (Test-Path $migrationPath) {
        $migrationFiles = Get-ChildItem -Path $migrationPath -Filter "*.sql" | Sort-Object Name
        Write-Status "Encontrados $($migrationFiles.Count) archivos de migracion" "Green"
    }

    # Crear documentacion
    $content = @"
# Base de Datos: Funciones y Triggers Completas

*Generado el $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")*

## Resumen
- Archivos de migracion: $($migrationFiles.Count)

## Migraciones Analizadas

"@

    # Analizar cada migracion
    foreach ($file in $migrationFiles) {
        Write-Status "Analizando: $($file.Name)" "Cyan"
        $fileContent = Get-Content $file.FullName -Raw -Encoding UTF8
        
        $content += @"

### $($file.Name)

``````sql
$fileContent
``````

"@
    }

    $content += @"

## Consultas SQL para Extraction Manual

### Consulta 1: Funciones Personalizadas
``````sql
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.prokind = 'f'
ORDER BY p.proname;
``````

### Consulta 2: Triggers
``````sql
SELECT 
    schemaname,
    tablename,
    triggername,
    pg_get_triggerdef(tr.oid) as trigger_definition
FROM pg_trigger tr
JOIN pg_class c ON tr.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_stat_user_tables t ON t.schemaname = n.nspname AND t.tablename = c.relname
WHERE n.nspname = 'public' AND NOT tr.tgisinternal
ORDER BY tablename, triggername;
``````

## Comandos de Extraction

### Usando Supabase CLI:
``````bash
# Extraer esquema completo
supabase db dump --schema public --schema-only

# Filtrar solo funciones
supabase db dump --schema public --schema-only | grep -A 50 "CREATE.*FUNCTION"
``````

---
*Documento generado automaticamente*
"@

    # Guardar archivo
    $content | Out-File -FilePath $OutputPath -Encoding UTF8
    
    Write-Status "Documentacion generada: $OutputPath" "Green"
    Write-Status "Migraciones incluidas: $($migrationFiles.Count)" "Yellow"

} catch {
    Write-Status "Error: $($_.Exception.Message)" "Red"
    exit 1
}

Write-Status "Script completado exitosamente!" "Green"
