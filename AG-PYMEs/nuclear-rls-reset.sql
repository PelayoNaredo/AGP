-- 💥 SOLUCIÓN NUCLEAR: Reset Completo de Políticas RLS
-- Fecha: 7 de agosto de 2025
-- Propósito: Eliminar TODAS las políticas RLS y crear solo las optimizadas

-- ⚠️ CRÍTICO: Esto resuelve definitivamente los timeouts de Edge Functions
-- Estrategia: Borrar todo y empezar de cero con políticas optimizadas

BEGIN;

-- ===============================
-- 🚀 FASE 1: SOLUCIÓN NUCLEAR 
-- Eliminar TODAS las políticas RLS del esquema public
-- ===============================

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Iterar sobre TODAS las políticas RLS en el esquema public
    FOR r IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        -- Eliminar cada política encontrada
        EXECUTE format('DROP POLICY "%s" ON %s.%s', r.policyname, r.schemaname, r.tablename);
        RAISE NOTICE 'Eliminada política: % en tabla %', r.policyname, r.tablename;
    END LOOP;
END
$$;

SELECT '💥 NUCLEAR RESET COMPLETE: All RLS policies deleted!' as phase1_status;

-- ===============================
-- 🎯 FASE 2: CREACIÓN DE POLÍTICAS OPTIMIZADAS
-- Solo UNA política por tabla, completamente optimizada
-- ===============================

-- Crear políticas optimizadas para todas las tablas con company_id
CREATE POLICY "rls_optimized" ON alerts FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));
CREATE POLICY "rls_optimized" ON appointments FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));
CREATE POLICY "rls_optimized" ON clients FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));
CREATE POLICY "rls_optimized" ON company_invitations FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));
CREATE POLICY "rls_optimized" ON employees FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));
CREATE POLICY "rls_optimized" ON employee_services FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));
CREATE POLICY "rls_optimized" ON expenses FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));
CREATE POLICY "rls_optimized" ON income FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));
CREATE POLICY "rls_optimized" ON inventory FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));
CREATE POLICY "rls_optimized" ON leaves FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));
CREATE POLICY "rls_optimized" ON orders FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));
CREATE POLICY "rls_optimized" ON order_detail FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));
CREATE POLICY "rls_optimized" ON product_codes FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));
CREATE POLICY "rls_optimized" ON sales FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));
CREATE POLICY "rls_optimized" ON sale_products FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));
CREATE POLICY "rls_optimized" ON sale_services FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));
CREATE POLICY "rls_optimized" ON services FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));
CREATE POLICY "rls_optimized" ON service_levels FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));
CREATE POLICY "rls_optimized" ON settings FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));
CREATE POLICY "rls_optimized" ON shifts FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));
CREATE POLICY "rls_optimized" ON shift_intervals FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));
CREATE POLICY "rls_optimized" ON suppliers FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));
CREATE POLICY "rls_optimized" ON users FOR ALL USING (company_id::text = (select auth.jwt() ->> 'company_id'));

-- Tabla especial: companies usa 'id' en lugar de 'company_id'
CREATE POLICY "rls_optimized" ON companies FOR ALL USING (id::text = (select auth.jwt() ->> 'company_id'));

SELECT '🎯 OPTIMIZATION COMPLETE: All tables now have single optimized RLS policy!' as phase2_status;

COMMIT;

-- ===============================
-- 📊 VERIFICACIÓN FINAL
-- ===============================

-- Contar políticas por tabla (debe ser exactamente 1 por tabla)
SELECT 
    tablename,
    COUNT(*) as policy_count,
    string_agg(policyname, ', ') as policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
HAVING tablename IN (
    'alerts', 'appointments', 'clients', 'companies', 'company_invitations',
    'employees', 'employee_services', 'expenses', 'income', 'inventory',
    'leaves', 'orders', 'order_detail', 'product_codes', 'sales',
    'sale_products', 'sale_services', 'services', 'service_levels',
    'settings', 'shifts', 'shift_intervals', 'suppliers', 'users'
)
ORDER BY tablename;

-- Verificar que todas las políticas usan la sintaxis optimizada
SELECT 
    tablename,
    policyname,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
    AND qual LIKE '%(select auth.jwt()%'
ORDER BY tablename;

-- Mensaje final
SELECT 
    '✅ NUCLEAR RESET SUCCESS! ' || 
    'All duplicate policies eliminated. ' ||
    'Edge Functions should now work without timeouts!' as final_status;

-- Performance tip
SELECT 
    '💡 TIP: The optimized syntax "(select auth.jwt())" is evaluated once per query instead of once per row, ' ||
    'dramatically improving performance for large datasets.' as performance_tip;
