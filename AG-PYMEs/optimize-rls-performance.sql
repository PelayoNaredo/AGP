-- 🚀 Script de Optimización RLS Performance
-- Fecha: 7 de agosto de 2025
-- Propósito: Optimizar todas las políticas RLS para mejorar performance de Edge Functions

-- ⚠️ CRÍTICO: Este script resuelve los timeouts de Edge Functions
-- Problema: auth.<function>() se re-evalúa por cada fila
-- Solución: (select auth.<function>()) se evalúa una vez por consulta

BEGIN;

-- ===============================
-- LIMPIEZA COMPLETA DE POLÍTICAS DUPLICADAS
-- ===============================

-- 1. ALERTS - Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "Company isolation for alerts" ON alerts;
DROP POLICY IF EXISTS "alerts_policy" ON alerts;
DROP POLICY IF EXISTS "alerts_isolation_optimized" ON alerts;
CREATE POLICY "alerts_isolation_optimized" ON alerts
    FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));

-- 2. APPOINTMENTS - Eliminar TODAS las políticas existentes  
DROP POLICY IF EXISTS "Company isolation for appointments" ON appointments;
DROP POLICY IF EXISTS "appointments_policy" ON appointments;
DROP POLICY IF EXISTS "appointments_isolation_optimized" ON appointments;
CREATE POLICY "appointments_isolation_optimized" ON appointments
    FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));

-- 3. CLIENTS - Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "Company isolation for clients" ON clients;
DROP POLICY IF EXISTS "clients_policy" ON clients;
DROP POLICY IF EXISTS "clients_isolation_optimized" ON clients;
CREATE POLICY "clients_isolation_optimized" ON clients
    FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));

-- 4. COMPANIES - Eliminar TODAS las políticas existentes (crítico)
DROP POLICY IF EXISTS "companies_own_company" ON companies;
DROP POLICY IF EXISTS "companies_insert_policy" ON companies;
DROP POLICY IF EXISTS "companies_select_policy" ON companies;
DROP POLICY IF EXISTS "companies_update_policy" ON companies;
DROP POLICY IF EXISTS "companies_delete_policy" ON companies;
DROP POLICY IF EXISTS "companies_isolation_optimized" ON companies;
CREATE POLICY "companies_isolation_optimized" ON companies
    FOR ALL USING (id::text = (select auth.jwt() ->> 'company_id'));

-- 5. COMPANY_INVITATIONS - Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "company_invitations_company_isolation" ON company_invitations;
DROP POLICY IF EXISTS "company_invitations_policy" ON company_invitations;
CREATE POLICY "company_invitations_isolation_optimized" ON company_invitations
    FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));

-- 6. EMPLOYEES - Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "Company isolation for employees" ON employees;
DROP POLICY IF EXISTS "employees_policy" ON employees;
CREATE POLICY "employees_isolation_optimized" ON employees
    FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));

-- 7. EMPLOYEE_SERVICES - Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "Company isolation for employee_services" ON employee_services;
DROP POLICY IF EXISTS "employee_services_policy" ON employee_services;
CREATE POLICY "employee_services_isolation_optimized" ON employee_services
    FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));

-- 8. EXPENSES - Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "Company isolation for expenses" ON expenses;
DROP POLICY IF EXISTS "expenses_policy" ON expenses;
CREATE POLICY "expenses_isolation_optimized" ON expenses
    FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));

-- 9. INCOME - Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "Company isolation for income" ON income;
DROP POLICY IF EXISTS "income_policy" ON income;
CREATE POLICY "income_isolation_optimized" ON income
    FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));

-- 10. INVENTORY - Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "Company isolation for inventory" ON inventory;
DROP POLICY IF EXISTS "inventory_policy" ON inventory;
CREATE POLICY "inventory_isolation_optimized" ON inventory
    FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));

-- 11. LEAVES - Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "Company isolation for leaves" ON leaves;
DROP POLICY IF EXISTS "leaves_policy" ON leaves;
CREATE POLICY "leaves_isolation_optimized" ON leaves
    FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));

-- 12. ORDERS - Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "Company isolation for orders" ON orders;
DROP POLICY IF EXISTS "orders_policy" ON orders;
CREATE POLICY "orders_isolation_optimized" ON orders
    FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));

-- 13. ORDER_DETAIL - Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "Company isolation for order_detail" ON order_detail;
DROP POLICY IF EXISTS "order_detail_policy" ON order_detail;
CREATE POLICY "order_detail_isolation_optimized" ON order_detail
    FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));

-- 14. PRODUCT_CODES - Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "Company isolation for product_codes" ON product_codes;
DROP POLICY IF EXISTS "product_codes_policy" ON product_codes;
CREATE POLICY "product_codes_isolation_optimized" ON product_codes
    FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));

-- 15. SALES - Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "Company isolation for sales" ON sales;
DROP POLICY IF EXISTS "sales_policy" ON sales;
CREATE POLICY "sales_isolation_optimized" ON sales
    FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));

-- 16. SALE_PRODUCTS - Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "Company isolation for sale_products" ON sale_products;
DROP POLICY IF EXISTS "sale_products_policy" ON sale_products;
CREATE POLICY "sale_products_isolation_optimized" ON sale_products
    FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));

-- 17. SALE_SERVICES - Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "Company isolation for sale_services" ON sale_services;
DROP POLICY IF EXISTS "sale_services_policy" ON sale_services;
CREATE POLICY "sale_services_isolation_optimized" ON sale_services
    FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));

-- 18. SERVICES - Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "Company isolation for services" ON services;
DROP POLICY IF EXISTS "services_policy" ON services;
CREATE POLICY "services_isolation_optimized" ON services
    FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));

-- 19. SERVICE_LEVELS - Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "Company isolation for service_levels" ON service_levels;
DROP POLICY IF EXISTS "service_levels_policy" ON service_levels;
CREATE POLICY "service_levels_isolation_optimized" ON service_levels
    FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));

-- 20. SETTINGS - Eliminar TODAS las políticas existentes (múltiples)
DROP POLICY IF EXISTS "Company isolation for settings" ON settings;
DROP POLICY IF EXISTS "settings_company_isolation" ON settings;
DROP POLICY IF EXISTS "settings_company_isolation_optimized" ON settings;
DROP POLICY IF EXISTS "settings_policy" ON settings;
CREATE POLICY "settings_isolation_final" ON settings
    FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));

-- 21. SHIFTS - Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "Company isolation for shifts" ON shifts;
DROP POLICY IF EXISTS "shifts_policy" ON shifts;
CREATE POLICY "shifts_isolation_optimized" ON shifts
    FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));

-- 22. SHIFT_INTERVALS - Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "Company isolation for shift_intervals" ON shift_intervals;
DROP POLICY IF EXISTS "shift_intervals_policy" ON shift_intervals;
CREATE POLICY "shift_intervals_isolation_optimized" ON shift_intervals
    FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));

-- 23. SUPPLIERS - Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "Company isolation for suppliers" ON suppliers;
DROP POLICY IF EXISTS "suppliers_policy" ON suppliers;
CREATE POLICY "suppliers_isolation_optimized" ON suppliers
    FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));

-- 24. USERS - Eliminar TODAS las políticas existentes (crítico)
DROP POLICY IF EXISTS "Company isolation for users" ON users;
DROP POLICY IF EXISTS "users_company_isolation" ON users;
DROP POLICY IF EXISTS "users_company_isolation_optimized" ON users;
DROP POLICY IF EXISTS "users_policy" ON users;
CREATE POLICY "users_isolation_final" ON users
    FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));

COMMIT;

-- ===============================
-- VERIFICACIÓN DE OPTIMIZACIÓN
-- ===============================

-- Mostrar todas las políticas RLS optimizadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN (
        'alerts', 'appointments', 'clients', 'companies', 'company_invitations',
        'employees', 'employee_services', 'expenses', 'income', 'inventory',
        'leaves', 'orders', 'order_detail', 'product_codes', 'sales',
        'sale_products', 'sale_services', 'services', 'service_levels',
        'settings', 'shifts', 'shift_intervals', 'suppliers', 'users'
    )
ORDER BY tablename, policyname;

-- Mensaje de éxito
SELECT 'RLS Policies optimized successfully! Edge Functions performance should improve dramatically.' as status;
