-- =====================================================
-- FASE 1 - Script de Verificación y Rollback de Emergencia
-- Fecha: 9 de agosto de 2025
-- Descripción: Comandos para verificar migración y rollback si es necesario
-- =====================================================

-- =====================================
-- COMANDOS DE VERIFICACIÓN COMPLETA
-- =====================================

-- 1. Verificar que la tabla companies existe y tiene datos
SELECT 'Companies table verification' as check_name, 
       count(*) as companies_count,
       string_agg(company_name, ', ') as company_names
FROM companies;

-- 2. Verificar que todas las tablas tienen company_id
SELECT 'Tables with company_id column' as check_name,
       count(*) as tables_count
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND column_name = 'company_id'
  AND table_name NOT IN ('companies');

-- 3. Verificar que todos los datos existentes fueron migrados
WITH table_counts AS (
  SELECT 'users' as table_name, count(*) as total, count(company_id) as migrated FROM users
  UNION ALL
  SELECT 'clients', count(*), count(company_id) FROM clients
  UNION ALL
  SELECT 'employees', count(*), count(company_id) FROM employees
  UNION ALL
  SELECT 'inventory', count(*), count(company_id) FROM inventory
  UNION ALL
  SELECT 'sales', count(*), count(company_id) FROM sales
  UNION ALL
  SELECT 'expenses', count(*), count(company_id) FROM expenses
  UNION ALL
  SELECT 'income', count(*), count(company_id) FROM income
  UNION ALL
  SELECT 'services', count(*), count(company_id) FROM services
  UNION ALL
  SELECT 'suppliers', count(*), count(company_id) FROM suppliers
)
SELECT 
  'Data migration verification' as check_name,
  table_name, 
  total as total_records, 
  migrated as migrated_records,
  (total = migrated) as migration_complete
FROM table_counts
ORDER BY table_name;

-- 4. Verificar que RLS está habilitado
SELECT 
    'RLS Status' as check_name,
    tablename,
    rowsecurity as rls_enabled,
    (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE t.schemaname = 'public' 
  AND t.tablename NOT LIKE 'pg_%'
  AND t.tablename NOT LIKE 'sql_%'
ORDER BY t.tablename;

-- 5. Verificar funciones creadas
SELECT 'Utility functions verification' as check_name,
       count(*) as functions_count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('get_company_usage_stats', 'check_company_limits', 'get_company_usage_percentages', 'can_add_resources');

-- 6. Probar contexto de empresa (usando datos de testing)
SET app.current_company_id = '00000000-0000-0000-0000-000000000001';
SELECT 'RLS Context Test' as check_name,
       count(*) as visible_records
FROM users; -- Solo debería ver usuarios de la empresa establecida

-- Resetear contexto
RESET app.current_company_id;

-- 7. Verificar índices creados
SELECT 'Indexes verification' as check_name,
       count(*) as indexes_with_company_id
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexdef LIKE '%company_id%';

-- =====================================
-- SCRIPT DE ROLLBACK DE EMERGENCIA
-- =====================================

/*
-- ⚠️  USAR SOLO EN CASO DE EMERGENCIA ⚠️
-- Este script revierte COMPLETAMENTE la migración multi-tenancy
-- PERDERÁ todos los cambios de multi-tenancy pero preservará los datos originales

BEGIN;

-- 1. Deshabilitar RLS en todas las tablas
ALTER TABLE public.alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.income DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_detail DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_levels DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_intervals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;

-- 2. Eliminar todas las políticas RLS
DROP POLICY IF EXISTS "tenant_isolation" ON public.alerts;
DROP POLICY IF EXISTS "tenant_isolation" ON public.appointments;
DROP POLICY IF EXISTS "tenant_isolation" ON public.clients;
DROP POLICY IF EXISTS "tenant_isolation" ON public.employees;
DROP POLICY IF EXISTS "tenant_isolation" ON public.expenses;
DROP POLICY IF EXISTS "tenant_isolation" ON public.income;
DROP POLICY IF EXISTS "tenant_isolation" ON public.inventory;
DROP POLICY IF EXISTS "tenant_isolation" ON public.leaves;
DROP POLICY IF EXISTS "tenant_isolation" ON public.orders;
DROP POLICY IF EXISTS "tenant_isolation" ON public.sales;
DROP POLICY IF EXISTS "tenant_isolation" ON public.services;
DROP POLICY IF EXISTS "tenant_isolation" ON public.suppliers;
DROP POLICY IF EXISTS "tenant_isolation" ON public.settings;
DROP POLICY IF EXISTS "tenant_isolation" ON public.shifts;
DROP POLICY IF EXISTS "tenant_isolation" ON public.users;
DROP POLICY IF EXISTS "tenant_isolation" ON public.employee_services;
DROP POLICY IF EXISTS "tenant_isolation" ON public.order_detail;
DROP POLICY IF EXISTS "tenant_isolation" ON public.product_codes;
DROP POLICY IF EXISTS "tenant_isolation" ON public.sale_products;
DROP POLICY IF EXISTS "tenant_isolation" ON public.sale_services;
DROP POLICY IF EXISTS "tenant_isolation" ON public.service_levels;
DROP POLICY IF EXISTS "tenant_isolation" ON public.shift_intervals;
DROP POLICY IF EXISTS "company_isolation" ON public.companies;

-- 3. Eliminar constraints de foreign key de company_id
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS fk_users_company_id;
ALTER TABLE public.alerts DROP CONSTRAINT IF EXISTS fk_alerts_company_id;
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS fk_appointments_company_id;
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS fk_clients_company_id;
ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS fk_employees_company_id;
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS fk_expenses_company_id;
ALTER TABLE public.income DROP CONSTRAINT IF EXISTS fk_income_company_id;
ALTER TABLE public.inventory DROP CONSTRAINT IF EXISTS fk_inventory_company_id;
ALTER TABLE public.leaves DROP CONSTRAINT IF EXISTS fk_leaves_company_id;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS fk_orders_company_id;
ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS fk_sales_company_id;
ALTER TABLE public.services DROP CONSTRAINT IF EXISTS fk_services_company_id;
ALTER TABLE public.suppliers DROP CONSTRAINT IF EXISTS fk_suppliers_company_id;
ALTER TABLE public.settings DROP CONSTRAINT IF EXISTS fk_settings_company_id;
ALTER TABLE public.shifts DROP CONSTRAINT IF EXISTS fk_shifts_company_id;
-- (continuar con todas las tablas...)

-- 4. Eliminar columnas company_id
ALTER TABLE public.users DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.alerts DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.appointments DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.clients DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.employees DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.expenses DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.income DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.inventory DROP COLUMN IF EXISTS company_id;
-- (continuar con todas las tablas...)

-- 5. Eliminar tabla companies
DROP TABLE IF EXISTS public.companies CASCADE;

-- 6. Eliminar funciones de utilidad
DROP FUNCTION IF EXISTS public.get_company_usage_stats(UUID);
DROP FUNCTION IF EXISTS public.check_company_limits(UUID, TEXT);
DROP FUNCTION IF EXISTS public.get_company_usage_percentages(UUID);
DROP FUNCTION IF EXISTS public.can_add_resources(UUID, TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.update_companies_updated_at();

COMMIT;

-- Verificación post-rollback
SELECT 'Rollback completed' as status, 
       count(*) as remaining_company_id_columns
FROM information_schema.columns 
WHERE table_schema = 'public' AND column_name = 'company_id';

*/
