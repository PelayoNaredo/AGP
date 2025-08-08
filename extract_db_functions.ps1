# 🗄️ Script para Extraer Funciones y Triggers de Supabase
# Autor: GitHub Copilot
# Fecha: $(Get-Date -Format "yyyy-MM-dd")

param(
    [string]$OutputPath = "AG-PYMEs\Database_Funciones_y_Triggers_Complete.md",
    [switch]$Verbose = $false
)

function Write-ColorOutput {
    param($Message, $Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Get-SupabaseFunctions {
    Write-ColorOutput "🔍 Creando archivos de consultas SQL..." "Yellow"
    
    # Esta función ya no es necesaria, solo documentamos las consultas
    return $true
}

function New-DatabaseDocumentation {
    param($MigrationFiles, $SchemaPath)
    
    Write-ColorOutput "📝 Generando documentación completa..." "Green"
    
    $markdown = @"
# 🗄️ Base de Datos: Funciones y Triggers Completas

*Generado automáticamente el $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")*

## 📊 Resumen del Sistema

### 🎯 Arquitectura de Base de Datos
- **Sistema**: PostgreSQL con Supabase
- **Esquemas**: public, auth
- **Características**: RLS (Row Level Security), Multi-tenancy
- **Archivos de Migración**: $($MigrationFiles.Count) encontrados

### 📋 Inventario de Objetos
- **Funciones Personalizadas**: [Se determinará tras consulta SQL]
- **Triggers Activos**: [Se determinará tras consulta SQL]
- **Funciones de Migración**: [Análisis de archivos de migración]

---

## 🚀 Instrucciones de Extracción

### **Método 1: Supabase CLI (Recomendado)**

``````bash
# Desde la carpeta AG-PYMEs
cd AG-PYMEs

# Extraer esquema completo
supabase db dump --schema public --schema-only > database_schema.sql

# Extraer solo funciones
supabase db dump --schema public --schema-only | grep -A 50 "CREATE.*FUNCTION" > functions.sql

# Extraer solo triggers  
supabase db dump --schema public --schema-only | grep -A 20 "CREATE.*TRIGGER" > triggers.sql
``````

### **Método 2: SQL Editor de Supabase Dashboard**

1. Abrir **Supabase Dashboard** → **SQL Editor**
2. Ejecutar las consultas proporcionadas en la sección [Consultas SQL](#consultas-sql)
3. Exportar resultados como CSV o copiar
4. Actualizar este documento con los resultados

### **Método 3: Script Automatizado**

``````powershell
# Ejecutar este script desde PowerShell
.\extract_db_functions.ps1 -Verbose
``````

---

## 🔧 Funciones Encontradas en Migraciones

"@

    # Analizar archivos de migración
    foreach ($migration in $MigrationFiles) {
        if ($Verbose) { Write-ColorOutput "📄 Analizando: $($migration.Name)" "Cyan" }
        
        $content = Get-Content $migration.FullName -Raw
        
        # Buscar funciones en el archivo
        $functionMatches = [regex]::Matches($content, 'CREATE.*?FUNCTION\s+(\w+)', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        
        if ($functionMatches.Count -gt 0) {
            $markdown += @"

### 📁 $($migration.Name)

"@
            foreach ($match in $functionMatches) {
                $functionName = $match.Groups[1].Value
                $markdown += @"
#### 🔹 Función: ``$functionName``

``````sql
$($content)
``````

---

"@
            }
        }
    }

    $markdown += @"

---

## 📊 Consultas SQL para Extracción Manual

### 🔍 Consulta 1: Todas las Funciones Personalizadas

``````sql
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_functiondef(p.oid) as function_definition,
    obj_description(p.oid, 'pg_proc') as description,
    CASE 
        WHEN p.provolatile = 'i' THEN 'IMMUTABLE'
        WHEN p.provolatile = 's' THEN 'STABLE'
        WHEN p.provolatile = 'v' THEN 'VOLATILE'
    END as volatility,
    CASE p.prosecdef 
        WHEN true THEN 'SECURITY DEFINER'
        ELSE 'SECURITY INVOKER'
    END as security
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'auth')
  AND p.prokind = 'f'
  AND NOT EXISTS (
    SELECT 1 FROM pg_depend d 
    WHERE d.objid = p.oid 
    AND d.deptype = 'e'
  )
ORDER BY n.nspname, p.proname;
``````

### 🔍 Consulta 2: Todos los Triggers

``````sql
SELECT 
    t.schemaname,
    t.tablename,
    t.triggername,
    pg_get_triggerdef(tr.oid) as trigger_definition,
    obj_description(tr.oid, 'pg_trigger') as description,
    t.tgenabled::text as enabled,
    CASE t.tgtype & 66
        WHEN 2 THEN 'BEFORE'
        WHEN 64 THEN 'AFTER'
        WHEN 66 THEN 'INSTEAD OF'
    END as timing,
    CASE t.tgtype & 28
        WHEN 4 THEN 'INSERT'
        WHEN 8 THEN 'DELETE'
        WHEN 16 THEN 'UPDATE'
        WHEN 12 THEN 'INSERT, DELETE'
        WHEN 20 THEN 'INSERT, UPDATE'
        WHEN 24 THEN 'DELETE, UPDATE'
        WHEN 28 THEN 'INSERT, DELETE, UPDATE'
    END as events
FROM pg_trigger tr
JOIN pg_class c ON tr.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_stat_user_tables t ON t.schemaname = n.nspname AND t.tablename = c.relname
WHERE n.nspname = 'public'
  AND NOT tr.tgisinternal
ORDER BY t.schemaname, t.tablename, t.triggername;
``````

### 🔍 Consulta 3: Funciones de Trigger

``````sql
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition,
    obj_description(p.oid, 'pg_proc') as description,
    array_agg(DISTINCT t.tablename) as used_by_tables
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
LEFT JOIN pg_trigger tr ON tr.tgfoid = p.oid
LEFT JOIN pg_class c ON tr.tgrelid = c.oid
LEFT JOIN pg_stat_user_tables t ON t.schemaname = n.nspname AND t.tablename = c.relname
WHERE n.nspname = 'public'
  AND p.prorettype = (SELECT oid FROM pg_type WHERE typname = 'trigger')
GROUP BY n.nspname, p.proname, p.oid
ORDER BY n.nspname, p.proname;
``````

---

## 📝 Instrucciones de Actualización

### ✅ Para Completar esta Documentación:

1. **Ejecutar Consultas SQL**:
   - Copiar consultas de arriba
   - Ejecutar en Supabase Dashboard → SQL Editor
   - Documentar resultados en las secciones correspondientes

2. **Extraer con CLI**:
   - Ejecutar: ``supabase db dump --schema public --schema-only``
   - Filtrar funciones y triggers
   - Agregar código completo a este documento

3. **Validar Migraciones**:
   - Revisar cada archivo de migración
   - Documentar funciones encontradas
   - Verificar estado actual en la base de datos

### 🎯 Formato de Documentación por Función:

``````markdown
### 🔹 nombre_funcion()

**📋 Información General**
- **Esquema**: public/auth
- **Parámetros**: (param1 tipo, param2 tipo)
- **Retorna**: tipo_retorno
- **Seguridad**: SECURITY DEFINER/INVOKER
- **Volatilidad**: IMMUTABLE/STABLE/VOLATILE

**💡 Propósito**
Descripción de qué hace la función y por qué existe.

**📥 Entrada**
- param1: Descripción del parámetro
- param2: Descripción del parámetro

**📤 Salida**
Descripción del valor retornado

**🔧 Código SQL**
```sql
[Código completo de la función]
```

**🔗 Relaciones**
- Usada por: [triggers, otras funciones, aplicación]
- Depende de: [tablas, otras funciones]

**📊 Ejemplo de Uso**
```sql
SELECT nombre_funcion(valor1, valor2);
```
``````

---

## 🚀 Próximos Pasos

1. **Ejecutar consultas SQL** en Supabase Dashboard
2. **Documentar resultados** en las secciones vacías
3. **Validar funcionalidad** de cada función/trigger
4. **Crear ejemplos de uso** para cada componente
5. **Establecer dependencias** entre funciones

---

*📅 Última actualización: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")*
*🤖 Generado por: Script PowerShell automatizado*
"@

    return $markdown
}

# MAIN EXECUTION
Write-ColorOutput "🚀 Iniciando extracción de funciones y triggers de Supabase..." "Green"

try {
    # Verificar que estamos en el directorio correcto
    if (!(Test-Path "AG-PYMEs\supabase\config.toml")) {
        Write-ColorOutput "❌ Error: No se encontró AG-PYMEs\supabase\config.toml" "Red"
        Write-ColorOutput "💡 Ejecutar desde: C:\Users\North Arder\Desktop\AppGestionPYMEs\" "Yellow"
        exit 1
    }

    # Buscar archivos de migración
    Write-ColorOutput "📂 Buscando archivos de migración..." "Cyan"
    $migrationPath = "AG-PYMEs\supabase\migrations"
    
    if (Test-Path $migrationPath) {
        $migrationFiles = Get-ChildItem -Path $migrationPath -Filter "*.sql" | Sort-Object Name
        Write-ColorOutput "✅ Encontrados $($migrationFiles.Count) archivos de migración" "Green"
    } else {
        Write-ColorOutput "⚠️  No se encontró carpeta de migraciones" "Yellow"
        $migrationFiles = @()
    }

    # Generar documentación
    $documentation = New-DatabaseDocumentation -MigrationFiles $migrationFiles -SchemaPath $migrationPath
    
    # Guardar archivo
    $documentation | Out-File -FilePath $OutputPath -Encoding UTF8
    
    Write-ColorOutput "✅ Documentación generada exitosamente!" "Green"
    Write-ColorOutput "📁 Archivo: $OutputPath" "Cyan"
    Write-ColorOutput "📊 Archivos de migración analizados: $($migrationFiles.Count)" "Yellow"
    
    if ($migrationFiles.Count -gt 0) {
        Write-ColorOutput "📝 Migraciones encontradas:" "White"
        foreach ($file in $migrationFiles) {
            Write-ColorOutput "   - $($file.Name)" "Gray"
        }
    }
    
    Write-ColorOutput "" "White"
    Write-ColorOutput "🎯 PRÓXIMOS PASOS:" "Yellow"
    Write-ColorOutput "1. Abrir Supabase Dashboard → SQL Editor" "White"
    Write-ColorOutput "2. Ejecutar las consultas SQL del documento generado" "White"
    Write-ColorOutput "3. Completar la documentación con los resultados" "White"
    Write-ColorOutput "4. Validar que todas las funciones están documentadas" "White"

} catch {
    Write-ColorOutput "❌ Error durante la ejecución: $($_.Exception.Message)" "Red"
    exit 1
} finally {
    # Limpiar archivos temporales
    if (Test-Path "temp_queries.sql") {
        Remove-Item "temp_queries.sql" -Force
    }
}

Write-ColorOutput "🎉 Script completado!" "Green"
