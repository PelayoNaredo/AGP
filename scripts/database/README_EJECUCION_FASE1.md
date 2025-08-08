# 🗄️ Scripts de Migración Multi-Tenancy - Fase 1

## 📋 Orden de Ejecución en pgAdmin

### ⚠️ IMPORTANTE: Hacer Backup Antes de Comenzar

```sql
-- Crear backup completo antes de ejecutar cualquier script
pg_dump -h localhost -U tu_usuario -d ag_pymes > backup_pre_multitenancy.sql
```

### 🔢 Secuencia de Ejecución

#### **1. Script: `01_create_companies.sql`**

**Tiempo estimado:** 30 segundos

```sql
-- Crear tabla companies y empresa por defecto para datos existentes
```

✅ **Verificar:** Debe aparecer 1 empresa llamada "Empresa Principal"

#### **2. Script: `02_migrate_users_multitenancy.sql`**

**Tiempo estimado:** 1 minuto

```sql
-- Agregar company_id a usuarios y migrar datos existentes
```

✅ **Verificar:** Todos los usuarios deben tener company_id asignado

#### **3. Script: `03a_add_company_id_main_tables.sql`**

**Tiempo estimado:** 2-3 minutos

```sql
-- Agregar company_id a tablas principales (alerts, appointments, clients, employees, expenses, income, inventory)
```

✅ **Verificar:** 8 tablas principales modificadas

#### **4. Script: `03b_add_company_id_remaining_tables.sql`**

**Tiempo estimado:** 2 minutos

```sql
-- Agregar company_id a tablas restantes (leaves, orders, sales, services, suppliers, settings, shifts)
```

✅ **Verificar:** 7 tablas más modificadas

#### **5. Script: `03c_add_company_id_detail_tables.sql`**

**Tiempo estimado:** 1 minuto

```sql
-- Agregar company_id a tablas de detalle y auxiliares
```

✅ **Verificar:** Todas las tablas auxiliares modificadas

#### **6. Script: `04a_enable_rls_main_tables.sql`**

**Tiempo estimado:** 1 minuto

```sql
-- Habilitar RLS y crear políticas para tablas principales
```

✅ **Verificar:** RLS habilitado en tablas principales

#### **7. Script: `04b_complete_rls_policies.sql`**

**Tiempo estimado:** 30 segundos

```sql
-- Completar políticas RLS para tablas auxiliares
```

✅ **Verificar:** RLS habilitado en todas las tablas

#### **8. Script: `05_utility_functions.sql`**

**Tiempo estimado:** 30 segundos

```sql
-- Crear funciones de utilidad para límites y estadísticas
```

✅ **Verificar:** 4 funciones creadas

#### **9. Script: `06_verification_and_rollback.sql`**

**Tiempo estimado:** 30 segundos

```sql
-- Solo ejecutar la sección de VERIFICACIÓN (no el rollback)
```

✅ **Verificar:** Todos los checks deben estar OK

---

## 🧪 Pruebas de Funcionamiento

### **Prueba 1: Contexto de Empresa**

```sql
-- Establecer empresa actual
SET app.current_company_id = '00000000-0000-0000-0000-000000000001';

-- Verificar que solo ve datos de su empresa
SELECT count(*) FROM clients;
SELECT count(*) FROM users;
SELECT count(*) FROM inventory;

-- Resetear contexto
RESET app.current_company_id;
```

### **Prueba 2: Aislamiento de Datos**

```sql
-- Con empresa válida
SET app.current_company_id = '00000000-0000-0000-0000-000000000001';
SELECT count(*) FROM clients; -- Debe mostrar datos

-- Con empresa inexistente
SET app.current_company_id = '11111111-1111-1111-1111-111111111111';
SELECT count(*) FROM clients; -- Debe mostrar 0

RESET app.current_company_id;
```

### **Prueba 3: Funciones de Límites**

```sql
-- Obtener estadísticas de uso
SELECT get_company_usage_stats('00000000-0000-0000-0000-000000000001');

-- Verificar límites
SELECT check_company_limits('00000000-0000-0000-0000-000000000001', 'clients');

-- Obtener porcentajes
SELECT get_company_usage_percentages('00000000-0000-0000-0000-000000000001');
```

---

## 🚨 Posibles Errores y Soluciones

### **Error: "relation already exists"**

```sql
-- Solución: Usar IF NOT EXISTS (ya incluido en scripts)
-- Los scripts son seguros para re-ejecutar
```

### **Error: "column already exists"**

```sql
-- Solución: Usar ADD COLUMN IF NOT EXISTS (ya incluido)
-- Continuar con siguiente script
```

### **Error: "function does not exist"**

```sql
-- Solución: Ejecutar script 05_utility_functions.sql
-- Verificar que se crearon las funciones
```

### **Error: "permission denied"**

```sql
-- Solución: Usar usuario con permisos SUPERUSER o CREATE
-- O ejecutar como postgres
```

---

## ✅ Checklist de Verificación

- [ ] **Backup realizado** antes de comenzar
- [ ] **Tabla companies** creada con 1 empresa
- [ ] **24 tablas** modificadas con company_id
- [ ] **Todos los datos existentes** migrados (company_id NOT NULL)
- [ ] **RLS habilitado** en todas las tablas
- [ ] **Políticas RLS** creadas (1 por tabla)
- [ ] **4 funciones de utilidad** creadas
- [ ] **Pruebas de contexto** funcionando
- [ ] **Aislamiento de datos** verificado

---

## 🔄 En Caso de Problemas

### **Rollback Parcial** (volver a estado anterior)

```sql
-- Solo ejecutar la sección comentada en 06_verification_and_rollback.sql
-- ⚠️ ESTO ELIMINA TODOS LOS CAMBIOS MULTI-TENANCY
```

### **Restaurar desde Backup**

```bash
# Restaurar backup completo
psql -h localhost -U tu_usuario -d ag_pymes < backup_pre_multitenancy.sql
```

---

## 📊 Métricas Post-Migración

### **Tamaño de BD**

```sql
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### **Conteo de Registros**

```sql
SELECT
    'Total records migrated:' as description,
    sum(
        (xpath('/row/c/text()', query_to_xml('SELECT count(*) as c FROM ' || table_name, false, true, '')))[1]::text::int
    ) as total_records
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name NOT IN ('companies', 'spatial_ref_sys');
```

---

> **🎯 Objetivo:** Al completar todos los scripts, tendrás un sistema multi-tenant completamente funcional que preserva todos tus datos de testing existentes, pero ahora organizados por empresa.

**¡La migración de la Fase 1 estará completa! 🚀**
