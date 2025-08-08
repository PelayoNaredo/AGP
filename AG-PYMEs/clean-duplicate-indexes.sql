-- 🧹 Script de Limpieza de Índices Duplicados
-- Fecha: 7 de agosto de 2025
-- Propósito: Eliminar índices duplicados para mejorar performance

-- ⚠️ IMPORTANTE: Ejecutar en horario de bajo tráfico
-- Este script mejorará el rendimiento de las Edge Functions

BEGIN;

-- 1. Tabla: alerts
-- Eliminar idx_alerts_fecha_recordatorio (mantener idx_alerts_fecha)
DROP INDEX IF EXISTS idx_alerts_fecha_recordatorio;

-- 2. Tabla: company_invitations
-- Eliminar idx_company_invitations_invitation_code (mantener idx_company_invitations_code)
DROP INDEX IF EXISTS idx_company_invitations_invitation_code;

-- 3. Tabla: employee_services
-- Eliminar idx_employee_services_servicio (mantener idx_employee_services_service)
DROP INDEX IF EXISTS idx_employee_services_servicio;

-- 4. Tabla: inventory
-- Eliminar idx_inventory_cantidad_actual (mantener idx_inventory_cantidad)
DROP INDEX IF EXISTS idx_inventory_cantidad_actual;

-- 5. Tabla: sale_products
-- Eliminar idx_sale_products_venta (mantener idx_sale_products_sale)
DROP INDEX IF EXISTS idx_sale_products_venta;

-- 6. Tabla: sale_services
-- Eliminar idx_sale_services_venta (mantener idx_sale_services_sale)
DROP INDEX IF EXISTS idx_sale_services_venta;

-- 7. Tabla: service_levels
-- Eliminar idx_service_levels_servicio (mantener idx_service_levels_service)
DROP INDEX IF EXISTS idx_service_levels_servicio;

-- 8. Tabla: settings
-- Eliminar idx_settings_company (mantener idx_settings_company_id)
DROP INDEX IF EXISTS idx_settings_company;

-- 9. Tabla: shift_intervals
-- Eliminar idx_shift_intervals_horario (mantener idx_shift_intervals_shift)
DROP INDEX IF EXISTS idx_shift_intervals_horario;

-- 10. Tabla: suppliers
-- Eliminar idx_suppliers_company (mantener idx_suppliers_company_id)
DROP INDEX IF EXISTS idx_suppliers_company;

COMMIT;

-- 📊 Verificar que los índices duplicados han sido eliminados
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
    AND tablename IN (
        'alerts', 'company_invitations', 'employee_services', 
        'inventory', 'sale_products', 'sale_services', 
        'service_levels', 'settings', 'shift_intervals', 'suppliers'
    )
ORDER BY tablename, indexname;
