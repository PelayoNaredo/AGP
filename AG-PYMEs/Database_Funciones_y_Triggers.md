# 🗄️ Base de Datos: Funciones y Triggers de Supabase

## 🎯 Índice

1. [**Métodos de Extracción**](#métodos-de-extracción)
2. [**Consultas SQL para Inventario**](#consultas-sql-para-inventario)
3. [**Funciones Encontradas**](#funciones-encontradas)
4. [**Triggers Encontrados**](#triggers-encontrados)
5. [**Scripts de Extracción**](#scripts-de-extracción)

---

## 🛠️ Métodos de Extracción

### **1️⃣ Usando Supabase CLI**

```bash
# Método 1: Dump completo de funciones y triggers
supabase db dump --schema public --schema-only | grep -A 100 -B 5 "CREATE.*FUNCTION\|CREATE.*TRIGGER" > database_functions_triggers.sql

# Método 2: Dump específico solo del esquema
supabase db dump --schema public --data-only=false > complete_schema.sql

# Método 3: Dump con filtro por tipo de objeto
supabase db dump --schema public --schema-only | sed -n '/CREATE.*FUNCTION/,/;$/p' > functions_only.sql
supabase db dump --schema public --schema-only | sed -n '/CREATE.*TRIGGER/,/;$/p' > triggers_only.sql
```

### **2️⃣ Consultas SQL Directas**

Ejecuta estas consultas en el **SQL Editor** de Supabase Dashboard:

#### **🔍 Consulta para Todas las Funciones**

```sql
-- Obtener todas las funciones personalizadas
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
  AND p.prokind = 'f'  -- Solo funciones (no procedimientos)
  AND NOT EXISTS (
    -- Excluir funciones del sistema
    SELECT 1 FROM pg_depend d
    WHERE d.objid = p.oid
    AND d.deptype = 'e'
  )
ORDER BY n.nspname, p.proname;
```

#### **🔍 Consulta para Todos los Triggers**

```sql
-- Obtener todos los triggers
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
```

#### **🔍 Consulta para Funciones de Trigger**

```sql
-- Obtener funciones que son usadas por triggers
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
```

### **3️⃣ Script PowerShell para Automatizar**

```````powershell
# Crear script para extraer funciones y triggers
# Guardar como: extract_db_functions.ps1

param(
    [string]$OutputPath = "database_functions_triggers.md"
)

Write-Host "🔍 Extrayendo funciones y triggers de Supabase..." -ForegroundColor Green

# Verificar que Supabase CLI esté instalado
if (!(Get-Command "supabase" -ErrorAction SilentlyContinue)) {
    Write-Error "❌ Supabase CLI no encontrado. Instalar con: npm install -g supabase"
    exit 1
}

# Verificar que estamos en un proyecto Supabase
if (!(Test-Path "supabase/config.toml")) {
    Write-Error "❌ No se encontró supabase/config.toml. Ejecutar desde la raíz del proyecto."
    exit 1
}

Write-Host "📊 Generando dump del esquema..." -ForegroundColor Yellow
$schemaDump = supabase db dump --schema public --schema-only

# Extraer funciones
Write-Host "🔧 Extrayendo funciones..." -ForegroundColor Yellow
$functions = $schemaDump | Select-String -Pattern "CREATE.*FUNCTION" -Context 0,50

# Extraer triggers
Write-Host "⚡ Extrayendo triggers..." -ForegroundColor Yellow
$triggers = $schemaDump | Select-String -Pattern "CREATE.*TRIGGER" -Context 0,10

# Crear documento markdown
$markdown = @"
# 🗄️ Funciones y Triggers de la Base de Datos

*Generado automáticamente el $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")*

## 📊 Resumen

- **Funciones encontradas**: $($functions.Count)
- **Triggers encontrados**: $($triggers.Count)

## 🔧 Funciones

"@

foreach ($func in $functions) {
    $functionName = ($func.Line -split ' ')[2] -replace '\(.*', ''
    $markdown += @"


### 🔹 $functionName

``````sql
$($func.Line)
$($func.Context.PostContext -join "`n")
```````

"@
}

$markdown += @"

## ⚡ Triggers

"@

foreach ($trigger in $triggers) {
    $triggerName = ($trigger.Line -split ' ')[2]
$markdown += @"

### 🔸 $triggerName

```sql
$($trigger.Line)
$($trigger.Context.PostContext -join "`n")
```

"@
}

# Guardar archivo

$markdown | Out-File -FilePath $OutputPath -Encoding UTF8
Write-Host "✅ Archivo generado: $OutputPath" -ForegroundColor Green
Write-Host "📁 Ubicación: $(Resolve-Path $OutputPath)" -ForegroundColor Cyan

````

### **4️⃣ Usando psql (Si tienes acceso directo)**

```bash
# Conectar a la base de datos y extraer funciones
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" << EOF
\o functions_output.txt
\df+ public.*
\do triggers_output.txt
SELECT * FROM information_schema.triggers WHERE trigger_schema = 'public';
\q
EOF
````

---

## 📋 Consultas SQL para Inventario Completo

### **🔍 Inventario de Objetos de Base de Datos**

```sql
-- Vista general de todos los objetos personalizados
WITH db_objects AS (
  -- Funciones
  SELECT
    'FUNCTION' as object_type,
    n.nspname as schema_name,
    p.proname as object_name,
    pg_get_function_arguments(p.oid) as details,
    obj_description(p.oid, 'pg_proc') as description
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.prokind = 'f'

  UNION ALL

  -- Triggers
  SELECT
    'TRIGGER' as object_type,
    n.nspname as schema_name,
    tr.tgname as object_name,
    c.relname as details,
    obj_description(tr.oid, 'pg_trigger') as description
  FROM pg_trigger tr
  JOIN pg_class c ON tr.tgrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public' AND NOT tr.tgisinternal

  UNION ALL

  -- Vistas
  SELECT
    'VIEW' as object_type,
    schemaname as schema_name,
    viewname as object_name,
    definition as details,
    NULL as description
  FROM pg_views
  WHERE schemaname = 'public'

  UNION ALL

  -- Índices personalizados
  SELECT
    'INDEX' as object_type,
    n.nspname as schema_name,
    i.relname as object_name,
    pg_get_indexdef(i.oid) as details,
    obj_description(i.oid, 'pg_class') as description
  FROM pg_index ix
  JOIN pg_class i ON ix.indexrelid = i.oid
  JOIN pg_class t ON ix.indrelid = t.oid
  JOIN pg_namespace n ON t.relnamespace = n.oid
  WHERE n.nspname = 'public'
    AND NOT ix.indisprimary
    AND NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      WHERE c.conindid = ix.indexrelid
    )
)
SELECT
  object_type,
  object_name,
  schema_name,
  CASE
    WHEN LENGTH(details) > 100 THEN LEFT(details, 100) || '...'
    ELSE details
  END as summary,
  description
FROM db_objects
ORDER BY object_type, object_name;
```

---

## 🚀 Método Recomendado para tu Proyecto

Basándome en tu estructura de proyecto, te recomiendo este enfoque:

### **Paso 1: Ejecutar el Script PowerShell**

```powershell
# Desde la raíz de tu proyecto AG-PYMEs
cd "C:\Users\North Arder\Desktop\AppGestionPYMEs\AG-PYMEs"

# Extraer funciones y triggers
supabase db dump --schema public --schema-only > temp_schema.sql

# Filtrar solo funciones y triggers
Get-Content temp_schema.sql | Select-String -Pattern "CREATE.*FUNCTION|CREATE.*TRIGGER" -Context 5,20 > database_objects.txt

# Limpiar archivo temporal
Remove-Item temp_schema.sql
```

### **Paso 2: Ejecutar Consultas SQL en Supabase Dashboard**

1. Ve a tu proyecto en **Supabase Dashboard**
2. Abre el **SQL Editor**
3. Ejecuta las consultas que te proporcioné arriba
4. Exporta los resultados

### **Paso 3: Generar Documentación Automática**

¿Quieres que genere un script que combine todo y cree automáticamente la documentación completa? Puedo crear un script que:

1. Extraiga todas las funciones y triggers
2. Las organize por categorías
3. Genere documentación con ejemplos de uso
4. Incluya diagramas de dependencias

**¿Te gustaría que proceda con crear este script automatizado?** 🤔

---

## ✅ RESULTADOS DE EXTRACCIÓN

### 🎉 Script Node.js Ejecutado Exitosamente

**📊 Resumen de Extracción:**

- ✅ **Script creado**: `extract-db-functions.js`
- ✅ **Archivos analizados**: 7 migraciones
- ✅ **Funciones encontradas**: 8 funciones
- ✅ **Triggers encontrados**: 0 triggers
- ✅ **Documentación generada**: `Database_Funciones_y_Triggers_Complete.md`

### 🔧 Funciones Encontradas por Archivo:

1. **003_rls_alerts_secure.sql**: 1 función
2. **20250102_fix_rls_function.sql**: 2 funciones
3. **20250202_add_set_current_company_id.sql**: 1 función
4. **20250805_fix_app_current_company_id.sql**: 4 funciones

### 🚀 Comandos para Ejecutar:

```bash
# Ejecutar análisis básico (recomendado)
cd "C:\Users\North Arder\Desktop\AppGestionPYMEs"
node extract-db-functions.js --verbose

# Ver ayuda del script
node extract-db-functions.js --help

# Análisis detallado de cada migración
node extract-db-functions.js --verbose
```

### 📁 Archivos Generados:

- **📄 extract-db-functions.js**: Script principal Node.js
- **📄 Database_Funciones_y_Triggers_Complete.md**: Documentación completa generada automáticamente
- **📄 package-extract.json**: Configuración del proyecto Node.js

---

## 🎯 PRÓXIMOS PASOS RECOMENDADOS

1. **✅ Revisar Documentación Completa**:

   - Abrir `AG-PYMEs/Database_Funciones_y_Triggers_Complete.md`
   - Verificar que todas las funciones están documentadas
   - Analizar el código de cada función

2. **🔍 Ejecutar Consultas SQL en Supabase Dashboard**:

   - Usar las consultas proporcionadas en la documentación
   - Verificar que las funciones están activas en la base de datos
   - Comparar con las migraciones

3. **📊 Complementar con Información en Vivo**:

   - Ejecutar las consultas SQL para obtener funciones activas
   - Documentar triggers adicionales que puedan existir
   - Verificar permisos y seguridad de las funciones

4. **🛠️ Mantenimiento**:
   - Re-ejecutar el script cuando agregues nuevas migraciones
   - Mantener la documentación actualizada
   - Usar `--verbose` para debugging

---

**🎉 ¡Documentación de funciones y triggers completada exitosamente!**

# 🗄️ Base de Datos: Funciones y Triggers Completas

_Generado automáticamente el 6/8/2025, 11:59:08_

## 📊 Resumen del Sistema

### 🎯 Información General

- **Archivos de migración analizados**: 7
- **Funciones encontradas en migraciones**: 8
- **Triggers encontrados en migraciones**: 0
- **Extracción con Supabase CLI**: ❌ No disponible

### 📋 Ubicaciones

- **Migraciones**: `AG-PYMEs/supabase/migrations/`
- **Archivos analizados**: 001_enable_rls_alerts.sql, 001_rls_alerts.sql, 002_rls_alerts_basic.sql, 003_rls_alerts_secure.sql, 20250102_fix_rls_function.sql, 20250202_add_set_current_company_id.sql, 20250805_fix_app_current_company_id.sql

---

## 🔧 Funciones Encontradas

### 📁 Desde Archivos de Migración

#### 🔹 `debug_auth_info`

**📄 Archivo**: `003_rls_alerts_secure.sql` (línea 30)

```sql
CREATE OR REPLACE FUNCTION debug_auth_info()
RETURNS json AS $$
BEGIN
  RETURN json_build_object(
    'role', auth.role(),
    'uid', auth.uid(),
    'jwt_claims', auth.jwt()
  );
END;
```

---

#### 🔹 `set_current_company_id`

**📄 Archivo**: `20250102_fix_rls_function.sql` (línea 2)

```sql
CREATE OR REPLACE FUNCTION set_current_company_id(company_uuid UUID)
RETURNS void AS $$
BEGIN
  -- Establecer el parámetro de configuración personalizado para la sesión actual
  PERFORM set_config('app.current_company_id', company_uuid::text, false);
END;
```

---

#### 🔹 `get_current_company_id`

**📄 Archivo**: `20250102_fix_rls_function.sql` (línea 15)

```sql
CREATE OR REPLACE FUNCTION get_current_company_id()
RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.current_company_id', true)::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
```

---

#### 🔹 `set_current_company_id`

**📄 Archivo**: `20250202_add_set_current_company_id.sql` (línea 4)

```sql
CREATE OR REPLACE FUNCTION set_current_company_id(company_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Establecer el parámetro de configuración app.current_company_id
  PERFORM set_config('app.current_company_id', company_id::TEXT, false);
END;
```

---

#### 🔹 `set_current_company_id`

**📄 Archivo**: `20250805_fix_app_current_company_id.sql` (línea 6)

```sql
CREATE OR REPLACE FUNCTION set_current_company_id(company_uuid UUID)
RETURNS void AS $$
BEGIN
  -- Establecer el parámetro de configuración personalizado para la sesión actual
  PERFORM set_config('app.current_company_id', company_uuid::text, false);
END;
```

---

#### 🔹 `get_current_company_id`

**📄 Archivo**: `20250805_fix_app_current_company_id.sql` (línea 15)

```sql
CREATE OR REPLACE FUNCTION get_current_company_id()
RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.current_company_id', true)::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
```

---

#### 🔹 `auth_user_company_id`

**📄 Archivo**: `20250805_fix_app_current_company_id.sql` (línea 26)

```sql
CREATE OR REPLACE FUNCTION auth_user_company_id()
RETURNS UUID AS $$
BEGIN
  -- Primero intentar obtener de la configuración de sesión
  BEGIN
    RETURN current_setting('app.current_company_id', false)::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      -- Si falla, extraer del JWT del usuario autenticado
      RETURN COALESCE(
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'company_id',
        (auth.jwt() ->> 'app_metadata')::jsonb ->> 'company_id'
      )::UUID;
  END;
```

---

#### 🔹 `test_rls_configuration`

**📄 Archivo**: `20250805_fix_app_current_company_id.sql` (línea 77)

```sql
CREATE OR REPLACE FUNCTION test_rls_configuration()
RETURNS TABLE(
  test_name text,
  status text,
  details text
) AS $$
BEGIN
  -- Test 1: Verificar que las funciones existen
  RETURN QUERY SELECT
    'Functions exist'::text,
    'OK'::text,
    'set_current_company_id, get_current_company_id, auth_user_company_id'::text;

  -- Test 2: Probar establecer company_id
  BEGIN
    PERFORM set_current_company_id('cdd29637-e0b4-472a-a84c-264384277a82'::UUID);
    RETURN QUERY SELECT
      'Set company_id'::text,
      'OK'::text,
      'Function executed successfully'::text;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT
        'Set company_id'::text,
        'ERROR'::text,
        SQLERRM::text;
  END;
```

---

## ⚡ Triggers Encontrados

### 📁 Desde Archivos de Migración

_No se encontraron triggers en los archivos de migración._

## 📋 Detalle de Archivos de Migración

### 📄 001_enable_rls_alerts.sql

- **Tamaño**: 0 caracteres
- **Funciones**: 0
- **Triggers**: 0

<details>
<summary>👁️ Ver contenido completo</summary>

```sql

```

</details>

---

### 📄 001_rls_alerts.sql

- **Tamaño**: 0 caracteres
- **Funciones**: 0
- **Triggers**: 0

<details>
<summary>👁️ Ver contenido completo</summary>

```sql

```

</details>

---

### 📄 002_rls_alerts_basic.sql

- **Tamaño**: 0 caracteres
- **Funciones**: 0
- **Triggers**: 0

<details>
<summary>👁️ Ver contenido completo</summary>

```sql

```

</details>

---

### 📄 003_rls_alerts_secure.sql

- **Tamaño**: 2819 caracteres
- **Funciones**: 1
- **Triggers**: 0

<details>
<summary>👁️ Ver contenido completo</summary>

```sql
-- 🔒 Política RLS SEGURA para Tabla ALERTS
-- Fecha: 2 de agosto de 2025
-- Objetivo: Implementar aislamiento real por company_id

-- 1. Primero, eliminar la política permisiva temporal
DROP POLICY IF EXISTS "basic_company_isolation_alerts" ON alerts;

-- 2. Crear política de aislamiento REAL por company_id
-- Nota: Usamos el company_id directamente del registro, no del JWT por ahora
-- La Edge Function ya maneja la seguridad mediante supabaseAdmin.eq("company_id", authData.company_id)
CREATE POLICY "secure_company_isolation_alerts" ON alerts
  FOR ALL
  USING (
    -- Por ahora, la seguridad la maneja la Edge Function
    -- En futuras versiones usaremos: auth.jwt() -> 'user_metadata' ->> 'company_id'
    true
  );

-- 3. Para testing: crear política que bloquee acceso directo desde frontend
-- Esta política solo permitirá acceso via service_role (Edge Functions)
CREATE POLICY "block_direct_frontend_access" ON alerts
  FOR ALL
  USING (
    -- Solo permitir acceso via service_role (Edge Functions) o usuarios específicos
    auth.role() = 'service_role' OR
    auth.role() = 'authenticated'  -- Permitir por ahora para testing
  );

-- 4. Crear función auxiliar para debugging
CREATE OR REPLACE FUNCTION debug_auth_info()
RETURNS json AS $$
BEGIN
  RETURN json_build_object(
    'role', auth.role(),
    'uid', auth.uid(),
    'jwt_claims', auth.jwt()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Grant permisos necesarios
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE alerts TO authenticated;
GRANT ALL ON TABLE alerts TO service_role;

-- 6. Verificación final
DO $$
DECLARE
  policy_count INTEGER;
  rls_enabled BOOLEAN;
BEGIN
  -- Verificar que RLS está habilitado
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class
  WHERE relname = 'alerts' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

  -- Contar policies activas
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'alerts' AND schemaname = 'public';

  RAISE NOTICE '📊 Estado RLS en alerts:';
  RAISE NOTICE '  - RLS habilitado: %', rls_enabled;
  RAISE NOTICE '  - Policies activas: %', policy_count;

  -- Mostrar policies existentes
  RAISE NOTICE '📋 Policies existentes:';
  FOR rec IN
    SELECT policyname, cmd, qual
    FROM pg_policies
    WHERE tablename = 'alerts' AND schemaname = 'public'
  LOOP
    RAISE NOTICE '  - %: %', rec.policyname, rec.cmd;
  END LOOP;

  IF rls_enabled AND policy_count >= 1 THEN
    RAISE NOTICE '✅ SUCCESS: RLS configurado para alerts';
    RAISE NOTICE '🔒 SEGURIDAD: Edge Functions manejan aislamiento por company_id';
  ELSE
    RAISE WARNING '⚠️ WARNING: Configuración RLS incompleta';
  END IF;
END
$$;

```

</details>

---

### 📄 20250102_fix_rls_function.sql

- **Tamaño**: 1039 caracteres
- **Funciones**: 2
- **Triggers**: 0

<details>
<summary>👁️ Ver contenido completo</summary>

```sql
-- Crear función set_current_company_id que falta para RLS
CREATE OR REPLACE FUNCTION set_current_company_id(company_uuid UUID)
RETURNS void AS $$
BEGIN
  -- Establecer el parámetro de configuración personalizado para la sesión actual
  PERFORM set_config('app.current_company_id', company_uuid::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permisos de ejecución a todos los usuarios autenticados
GRANT EXECUTE ON FUNCTION set_current_company_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION set_current_company_id(UUID) TO anon;

-- Crear función auxiliar para obtener el company_id actual
CREATE OR REPLACE FUNCTION get_current_company_id()
RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.current_company_id', true)::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permisos de ejecución
GRANT EXECUTE ON FUNCTION get_current_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_company_id() TO anon;

```

</details>

---

### 📄 20250202_add_set_current_company_id.sql

- **Tamaño**: 826 caracteres
- **Funciones**: 1
- **Triggers**: 0

<details>
<summary>👁️ Ver contenido completo</summary>

```sql
-- Función para establecer el company_id actual en la sesión
-- Esto es necesario para que funcionen las políticas RLS de multi-tenancy

CREATE OR REPLACE FUNCTION set_current_company_id(company_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Establecer el parámetro de configuración app.current_company_id
  PERFORM set_config('app.current_company_id', company_id::TEXT, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permitir que usuarios autenticados ejecuten esta función
GRANT EXECUTE ON FUNCTION set_current_company_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION set_current_company_id(UUID) TO anon;

-- Comentario para documentar la función
COMMENT ON FUNCTION set_current_company_id(UUID) IS
'Establece el company_id actual en la sesión para que funcionen las políticas RLS de multi-tenancy';

```

</details>

---

### 📄 20250805_fix_app_current_company_id.sql

- **Tamaño**: 4920 caracteres
- **Funciones**: 4
- **Triggers**: 0

<details>
<summary>👁️ Ver contenido completo</summary>

```sql
-- Migración para resolver el problema del parámetro app.current_company_id no reconocido
-- Fecha: 5 de agosto de 2025
-- Problema: "unrecognized configuration parameter app.current_company_id"

-- 1. Asegurar que las funciones RLS existan y funcionen correctamente
CREATE OR REPLACE FUNCTION set_current_company_id(company_uuid UUID)
RETURNS void AS $$
BEGIN
  -- Establecer el parámetro de configuración personalizado para la sesión actual
  PERFORM set_config('app.current_company_id', company_uuid::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Función auxiliar para obtener el company_id actual
CREATE OR REPLACE FUNCTION get_current_company_id()
RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.current_company_id', true)::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Función auxiliar segura que maneja la extracción de company_id del JWT
CREATE OR REPLACE FUNCTION auth_user_company_id()
RETURNS UUID AS $$
BEGIN
  -- Primero intentar obtener de la configuración de sesión
  BEGIN
    RETURN current_setting('app.current_company_id', false)::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      -- Si falla, extraer del JWT del usuario autenticado
      RETURN COALESCE(
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'company_id',
        (auth.jwt() ->> 'app_metadata')::jsonb ->> 'company_id'
      )::UUID;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 4. Otorgar permisos necesarios
GRANT EXECUTE ON FUNCTION set_current_company_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION set_current_company_id(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_current_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_company_id() TO anon;
GRANT EXECUTE ON FUNCTION auth_user_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION auth_user_company_id() TO anon;

-- 5. Actualizar políticas RLS problemáticas para usar la nueva función segura
-- Esto resuelve el problema del parámetro no reconocido

-- Verificar si la tabla users existe y tiene RLS habilitado
DO $$
BEGIN
  -- Solo actualizar si la tabla existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN

    -- Eliminar políticas existentes problemáticas si existen
    DROP POLICY IF EXISTS "Users can only see their company data" ON users;
    DROP POLICY IF EXISTS "Users can only access their company" ON users;
    DROP POLICY IF EXISTS "Company isolation for users" ON users;

    -- Crear nueva política segura que no depende del parámetro problemático
    CREATE POLICY "Company isolation for users" ON users
      FOR ALL
      USING (company_id = auth_user_company_id());

    -- Asegurar que RLS esté habilitado
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;

  END IF;
END $$;

-- 6. Función de prueba para verificar que todo funciona
CREATE OR REPLACE FUNCTION test_rls_configuration()
RETURNS TABLE(
  test_name text,
  status text,
  details text
) AS $$
BEGIN
  -- Test 1: Verificar que las funciones existen
  RETURN QUERY SELECT
    'Functions exist'::text,
    'OK'::text,
    'set_current_company_id, get_current_company_id, auth_user_company_id'::text;

  -- Test 2: Probar establecer company_id
  BEGIN
    PERFORM set_current_company_id('cdd29637-e0b4-472a-a84c-264384277a82'::UUID);
    RETURN QUERY SELECT
      'Set company_id'::text,
      'OK'::text,
      'Function executed successfully'::text;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT
        'Set company_id'::text,
        'ERROR'::text,
        SQLERRM::text;
  END;

  -- Test 3: Probar obtener company_id
  BEGIN
    DECLARE
      result UUID;
    BEGIN
      result := get_current_company_id();
      RETURN QUERY SELECT
        'Get company_id'::text,
        'OK'::text,
        COALESCE(result::text, 'NULL')::text;
    END;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT
        'Get company_id'::text,
        'ERROR'::text,
        SQLERRM::text;
  END;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permisos para la función de prueba
GRANT EXECUTE ON FUNCTION test_rls_configuration() TO authenticated;
GRANT EXECUTE ON FUNCTION test_rls_configuration() TO anon;

-- Comentarios de documentación
COMMENT ON FUNCTION set_current_company_id(UUID) IS
'Establece el company_id actual en la sesión para RLS multi-tenancy';

COMMENT ON FUNCTION get_current_company_id() IS
'Obtiene el company_id actual de la sesión o NULL si no está establecido';

COMMENT ON FUNCTION auth_user_company_id() IS
'Función segura que obtiene company_id de sesión o JWT como fallback';

COMMENT ON FUNCTION test_rls_configuration() IS
'Función de prueba para verificar que la configuración RLS funciona correctamente';

```

</details>

---

## 📊 Consultas SQL para Extracción Manual

### 🔍 Consulta 1: Todas las Funciones Personalizadas

```sql
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
```

### 🔍 Consulta 2: Todos los Triggers

```sql
SELECT
    n.nspname as schema_name,
    c.relname as table_name,
    t.tgname as trigger_name,
    pg_get_triggerdef(t.oid) as trigger_definition,
    obj_description(t.oid, 'pg_trigger') as description,
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
    END as events,
    t.tgenabled as enabled
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND NOT t.tgisinternal
ORDER BY n.nspname, c.relname, t.tgname;
```

## 🚀 Comandos de Extracción

### Usando Supabase CLI:

```bash
# Extraer esquema completo
cd AG-PYMEs
supabase db dump --schema public --schema-only

# Filtrar solo funciones
supabase db dump --schema public --schema-only | grep -A 50 "CREATE.*FUNCTION"

# Filtrar solo triggers
supabase db dump --schema public --schema-only | grep -A 20 "CREATE.*TRIGGER"
```

### Usando este script:

```bash
# Solo migraciones
node extract-db-functions.js

# Con Supabase CLI
node extract-db-functions.js --use-cli

# Modo verbose
node extract-db-functions.js --verbose --use-cli
```

---

## 📝 Instrucciones de Uso

### ✅ Para Ejecutar este Script:

1. **Instalar dependencias** (si es necesario):

   ```bash
   npm install
   ```

2. **Ejecutar análisis básico**:

   ```bash
   node extract-db-functions.js
   ```

3. **Ejecutar con Supabase CLI**:

   ```bash
   node extract-db-functions.js --use-cli
   ```

4. **Modo detallado**:
   ```bash
   node extract-db-functions.js --verbose --use-cli
   ```

### 🎯 Características del Script:

- ✅ **Análisis de migraciones**: Escanea todos los archivos .sql
- ✅ **Extracción con CLI**: Usa Supabase CLI si está disponible
- ✅ **Detección automática**: Encuentra funciones y triggers
- ✅ **Documentación completa**: Genera markdown estructurado
- ✅ **Manejo de errores**: Continúa aunque falte CLI
- ✅ **Modo verbose**: Información detallada del proceso

---

_📅 Última actualización: 6/8/2025, 11:59:08_
_🤖 Generado por: extract-db-functions.js (Node.js)_
_📊 Análisis automático de 7 archivos de migración_
