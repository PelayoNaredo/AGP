-- 🛡️ SIMPLE Fix: Add SET search_path to existing functions
-- Fecha: 7 de agosto de 2025  
-- Propósito: Fijar search_path en funciones existentes SIN cambiar su lógica

-- ⚠️ ESTRATEGIA SIMPLE: Solo agregar SET search_path = '' a cada función
-- Esto resuelve el warning de seguridad sin afectar la funcionalidad

BEGIN;

-- ===============================
-- 📝 MÉTODO SIMPLE: ALTER FUNCTION
-- ===============================

-- Establecer search_path fijo en todas las funciones problemáticas
ALTER FUNCTION public.get_dashboard_data(UUID) SET search_path = '';
ALTER FUNCTION public.get_financial_summary(UUID, date, date) SET search_path = '';
ALTER FUNCTION public.auth_user_company_id() SET search_path = '';
ALTER FUNCTION public.verify_rls_setup() SET search_path = '';
ALTER FUNCTION public.get_current_company_id() SET search_path = '';
ALTER FUNCTION public.set_current_company_id(text) SET search_path = '';
ALTER FUNCTION public.check_company_limits() SET search_path = '';
ALTER FUNCTION public.generate_company_code() SET search_path = '';
ALTER FUNCTION public.generate_invitation_code() SET search_path = '';
ALTER FUNCTION public.get_income_by_period(UUID, date, date) SET search_path = '';
ALTER FUNCTION public.update_inventory_after_sale() SET search_path = '';
ALTER FUNCTION public.get_order_statistics(UUID) SET search_path = '';
ALTER FUNCTION public.get_order_detail_statistics(UUID) SET search_path = '';
ALTER FUNCTION public.get_sales_statistics(UUID) SET search_path = '';
ALTER FUNCTION public.get_company_usage_stats(UUID) SET search_path = '';
ALTER FUNCTION public.clean_expired_invitations() SET search_path = '';
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';

COMMIT;

-- ===============================
-- 📊 VERIFICACIÓN
-- ===============================

-- Verificar que todas las funciones ahora tienen search_path fijo
SELECT 
    proname as function_name,
    CASE 
        WHEN proconfig IS NULL THEN '❌ No configurado'
        WHEN 'search_path=' = ANY(proconfig) THEN '✅ search_path fijo' 
        ELSE '⚠️ Configuración parcial'
    END as search_path_status,
    proconfig
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND proname IN (
        'get_dashboard_data', 'get_financial_summary', 'auth_user_company_id',
        'verify_rls_setup', 'get_current_company_id', 'set_current_company_id',
        'check_company_limits', 'generate_company_code', 'generate_invitation_code',
        'get_income_by_period', 'update_inventory_after_sale', 'get_order_statistics',
        'get_order_detail_statistics', 'get_sales_statistics', 'get_company_usage_stats',
        'clean_expired_invitations', 'update_updated_at_column'
    )
ORDER BY proname;

SELECT '🛡️ SECURITY FIX APPLIED: search_path fixed for all functions!' as status;
