# 🚀 Comandos de Terminal para Migración Multi-Tenancy

## 📋 Comandos Directos para Ejecutar

### ⚠️ PASO 0: Hacer Backup

```bash
# Cambiar la contraseña según tu configuración
set PGPASSWORD=tu_contraseña_real
pg_dump -h localhost -U postgres -d agpymes > backup_pre_multitenancy_$(date +%Y%m%d_%H%M%S).sql
```

### 🚀 PASO 1: Script 01_create_companies.sql

```bash
set PGPASSWORD=tu_contraseña_real && psql -h localhost -U postgres -d agpymes -f "scripts\database\01_create_companies.sql"
```

### 🚀 PASO 2: Script 02_migrate_users_multitenancy.sql

```bash
set PGPASSWORD=tu_contraseña_real && psql -h localhost -U postgres -d agpymes -f "scripts\database\02_migrate_users_multitenancy.sql"
```

### 🚀 PASO 3: Script 03a_add_company_id_main_tables.sql

```bash
set PGPASSWORD=tu_contraseña_real && psql -h localhost -U postgres -d agpymes -f "scripts\database\03a_add_company_id_main_tables.sql"
```

### 🚀 PASO 4: Script 03b_add_company_id_remaining_tables.sql

```bash
set PGPASSWORD=tu_contraseña_real && psql -h localhost -U postgres -d agpymes -f "scripts\database\03b_add_company_id_remaining_tables.sql"
```

### 🚀 PASO 5: Script 03c_add_company_id_detail_tables.sql

```bash
set PGPASSWORD=tu_contraseña_real && psql -h localhost -U postgres -d agpymes -f "scripts\database\03c_add_company_id_detail_tables.sql"
```

### 🚀 PASO 6: Script 04a_enable_rls_main_tables.sql

```bash
set PGPASSWORD=tu_contraseña_real && psql -h localhost -U postgres -d agpymes -f "scripts\database\04a_enable_rls_main_tables.sql"
```

### 🚀 PASO 7: Script 04b_complete_rls_policies.sql

```bash
set PGPASSWORD=tu_contraseña_real && psql -h localhost -U postgres -d agpymes -f "scripts\database\04b_complete_rls_policies.sql"
```

### 🚀 PASO 8: Script 05_utility_functions.sql

```bash
set PGPASSWORD=tu_contraseña_real && psql -h localhost -U postgres -d agpymes -f "scripts\database\05_utility_functions.sql"
```

### ✅ VERIFICACIÓN: Script 06_verification_and_rollback.sql

```bash
set PGPASSWORD=tu_contraseña_real && psql -h localhost -U postgres -d agpymes -c "
-- Solo ejecutar las queries de verificación, NO el rollback
SELECT 'Companies table verification' as check_name,
       count(*) as companies_count,
       string_agg(company_name, ', ') as company_names
FROM companies;

SELECT 'Tables with company_id column' as check_name,
       count(*) as tables_count
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'company_id'
  AND table_name NOT IN ('companies');
"
```

## 🧪 Pruebas de Funcionamiento

### Probar Contexto de Empresa

```bash
set PGPASSWORD=tu_contraseña_real && psql -h localhost -U postgres -d agpymes -c "
SET app.current_company_id = '00000000-0000-0000-0000-000000000001';
SELECT 'Test RLS' as test_name, count(*) as visible_records FROM clients;
RESET app.current_company_id;
"
```

### Probar Funciones de Límites

```bash
set PGPASSWORD=tu_contraseña_real && psql -h localhost -U postgres -d agpymes -c "
SELECT get_company_usage_stats('00000000-0000-0000-0000-000000000001');
"
```

## 📦 Script Todo-en-Uno (Ejecutar después del backup)

```bash
# Reemplazar 'tu_contraseña_real' por la contraseña correcta
set PGPASSWORD=tu_contraseña_real

# Ejecutar todos los scripts en secuencia
psql -h localhost -U postgres -d agpymes -f "scripts\database\01_create_companies.sql" && ^
psql -h localhost -U postgres -d agpymes -f "scripts\database\02_migrate_users_multitenancy.sql" && ^
psql -h localhost -U postgres -d agpymes -f "scripts\database\03a_add_company_id_main_tables.sql" && ^
psql -h localhost -U postgres -d agpymes -f "scripts\database\03b_add_company_id_remaining_tables.sql" && ^
psql -h localhost -U postgres -d agpymes -f "scripts\database\03c_add_company_id_detail_tables.sql" && ^
psql -h localhost -U postgres -d agpymes -f "scripts\database\04a_enable_rls_main_tables.sql" && ^
psql -h localhost -U postgres -d agpymes -f "scripts\database\04b_complete_rls_policies.sql" && ^
psql -h localhost -U postgres -d agpymes -f "scripts\database\05_utility_functions.sql"

echo "¡Migración Multi-Tenancy Fase 1 completada!"
```
