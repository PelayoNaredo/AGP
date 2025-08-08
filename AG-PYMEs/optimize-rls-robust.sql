-- 🚀 Script de Optimización RLS Performance (ROBUSTO)
-- Fecha: 7 de agosto de 2025
-- Propósito: Optimizar todas las políticas RLS de manera robusta
-- SOLUCIÓN: Maneja políticas existentes sin errores

-- ⚠️ CRÍTICO: Este script resuelve los timeouts de Edge Functions
-- Problema: auth.<function>() se re-evalúa por cada fila
-- Solución: (select auth.<function>()) se evalúa una vez por consulta

BEGIN;

-- ===============================
-- FUNCIÓN AUXILIAR PARA RECREAR POLÍTICAS
-- ===============================

-- Crear función temporal para limpiar y recrear políticas
CREATE OR REPLACE FUNCTION recreate_policy(
    table_name text,
    policy_name text,
    policy_expression text
) RETURNS void AS $$
BEGIN
    -- Eliminar todas las políticas existentes en la tabla
    EXECUTE format('DROP POLICY IF EXISTS "Company isolation for %s" ON %s', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "%s_policy" ON %s', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "%s_company_isolation" ON %s', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "%s_company_isolation_optimized" ON %s', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "%s_isolation_optimized" ON %s', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "%s_isolation_final" ON %s', table_name, table_name);
    
    -- Crear la nueva política optimizada
    EXECUTE format('CREATE POLICY "%s" ON %s FOR ALL USING (%s)', policy_name, table_name, policy_expression);
END;
$$ LANGUAGE plpgsql;

-- ===============================
-- APLICAR OPTIMIZACIONES A TODAS LAS TABLAS
-- ===============================

-- Tablas principales con company_id
SELECT recreate_policy('alerts', 'alerts_optimized', 'company_id::text = (select auth.jwt() ->> ''company_id'')');
SELECT recreate_policy('appointments', 'appointments_optimized', 'company_id::text = (select auth.jwt() ->> ''company_id'')');
SELECT recreate_policy('clients', 'clients_optimized', 'company_id::text = (select auth.jwt() ->> ''company_id'')');
SELECT recreate_policy('company_invitations', 'company_invitations_optimized', 'company_id::text = (select auth.jwt() ->> ''company_id'')');
SELECT recreate_policy('employees', 'employees_optimized', 'company_id::text = (select auth.jwt() ->> ''company_id'')');
SELECT recreate_policy('employee_services', 'employee_services_optimized', 'company_id::text = (select auth.jwt() ->> ''company_id'')');
SELECT recreate_policy('expenses', 'expenses_optimized', 'company_id::text = (select auth.jwt() ->> ''company_id'')');
SELECT recreate_policy('income', 'income_optimized', 'company_id::text = (select auth.jwt() ->> ''company_id'')');
SELECT recreate_policy('inventory', 'inventory_optimized', 'company_id::text = (select auth.jwt() ->> ''company_id'')');
SELECT recreate_policy('leaves', 'leaves_optimized', 'company_id::text = (select auth.jwt() ->> ''company_id'')');
SELECT recreate_policy('orders', 'orders_optimized', 'company_id::text = (select auth.jwt() ->> ''company_id'')');
SELECT recreate_policy('order_detail', 'order_detail_optimized', 'company_id::text = (select auth.jwt() ->> ''company_id'')');
SELECT recreate_policy('product_codes', 'product_codes_optimized', 'company_id::text = (select auth.jwt() ->> ''company_id'')');
SELECT recreate_policy('sales', 'sales_optimized', 'company_id::text = (select auth.jwt() ->> ''company_id'')');
SELECT recreate_policy('sale_products', 'sale_products_optimized', 'company_id::text = (select auth.jwt() ->> ''company_id'')');
SELECT recreate_policy('sale_services', 'sale_services_optimized', 'company_id::text = (select auth.jwt() ->> ''company_id'')');
SELECT recreate_policy('services', 'services_optimized', 'company_id::text = (select auth.jwt() ->> ''company_id'')');
SELECT recreate_policy('service_levels', 'service_levels_optimized', 'company_id::text = (select auth.jwt() ->> ''company_id'')');
SELECT recreate_policy('settings', 'settings_optimized', 'company_id::text = (select auth.jwt() ->> ''company_id'')');
SELECT recreate_policy('shifts', 'shifts_optimized', 'company_id::text = (select auth.jwt() ->> ''company_id'')');
SELECT recreate_policy('shift_intervals', 'shift_intervals_optimized', 'company_id::text = (select auth.jwt() ->> ''company_id'')');
SELECT recreate_policy('suppliers', 'suppliers_optimized', 'company_id::text = (select auth.jwt() ->> ''company_id'')');
SELECT recreate_policy('users', 'users_optimized', 'company_id::text = (select auth.jwt() ->> ''company_id'')');

-- Tabla especial: companies (usa id en lugar de company_id)
SELECT recreate_policy('companies', 'companies_optimized', 'id::text = (select auth.jwt() ->> ''company_id'')');

-- ===============================
-- LIMPIEZA
-- ===============================

-- Eliminar función temporal
DROP FUNCTION recreate_policy(text, text, text);

COMMIT;

-- ===============================
-- VERIFICACIÓN FINAL
-- ===============================

SELECT 'RLS Policies optimized successfully! Checking results...' as status;

-- Contar políticas por tabla
SELECT 
    tablename,
    COUNT(*) as policy_count,
    array_agg(policyname) as policies
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN (
        'alerts', 'appointments', 'clients', 'companies', 'company_invitations',
        'employees', 'employee_services', 'expenses', 'income', 'inventory',
        'leaves', 'orders', 'order_detail', 'product_codes', 'sales',
        'sale_products', 'sale_services', 'services', 'service_levels',
        'settings', 'shifts', 'shift_intervals', 'suppliers', 'users'
    )
GROUP BY tablename
ORDER BY tablename;

SELECT '✅ Optimization complete! Edge Functions should now work without timeouts.' as final_status;
