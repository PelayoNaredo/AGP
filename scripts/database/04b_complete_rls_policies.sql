-- =====================================================
-- FASE 1 - TAREA 1.4b: Completar políticas RLS para tablas auxiliares
-- Fecha: 9 de agosto de 2025
-- Descripción: Políticas RLS para tablas de detalle y relaciones
-- =====================================================

BEGIN;

-- =====================================
-- POLÍTICAS PARA TABLAS AUXILIARES
-- =====================================

-- Servicios por empleado
CREATE POLICY "tenant_isolation" ON public.employee_services
FOR ALL 
USING (company_id = COALESCE(current_setting('app.current_company_id', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid));

-- Detalle de pedidos
CREATE POLICY "tenant_isolation" ON public.order_detail
FOR ALL 
USING (company_id = COALESCE(current_setting('app.current_company_id', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid));

-- Códigos de producto
CREATE POLICY "tenant_isolation" ON public.product_codes
FOR ALL 
USING (company_id = COALESCE(current_setting('app.current_company_id', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid));

-- Productos vendidos
CREATE POLICY "tenant_isolation" ON public.sale_products
FOR ALL 
USING (company_id = COALESCE(current_setting('app.current_company_id', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid));

-- Servicios vendidos
CREATE POLICY "tenant_isolation" ON public.sale_services
FOR ALL 
USING (company_id = COALESCE(current_setting('app.current_company_id', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid));

-- Niveles de servicio
CREATE POLICY "tenant_isolation" ON public.service_levels
FOR ALL 
USING (company_id = COALESCE(current_setting('app.current_company_id', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid));

-- Intervalos de horario
CREATE POLICY "tenant_isolation" ON public.shift_intervals
FOR ALL 
USING (company_id = COALESCE(current_setting('app.current_company_id', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid));

-- =====================================
-- VERIFICACIÓN DE POLÍTICAS RLS
-- =====================================

-- Verificar que RLS está habilitado en todas las tablas
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    (SELECT count(*) FROM pg_policies WHERE schemaname = t.schemaname AND tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE t.schemaname = 'public' 
  AND t.tablename != 'spatial_ref_sys'  -- Excluir tablas del sistema
ORDER BY t.tablename;

COMMIT;

-- =====================================
-- COMANDOS DE PRUEBA (Ejecutar después del COMMIT)
-- =====================================

-- Prueba 1: Establecer contexto de empresa
-- SET app.current_company_id = '00000000-0000-0000-0000-000000000001';

-- Prueba 2: Verificar que solo ve datos de su empresa
-- SELECT count(*) FROM clients; -- Solo debería ver clientes de su empresa

-- Prueba 3: Cambiar a empresa inexistente
-- SET app.current_company_id = '11111111-1111-1111-1111-111111111111';
-- SELECT count(*) FROM clients; -- Debería retornar 0

-- Prueba 4: Resetear contexto
-- RESET app.current_company_id;
