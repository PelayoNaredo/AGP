-- 🛡️ ULTRA SAFE Fix: Add SET search_path dynamically
-- Fecha: 8 de agosto de 2025  
-- Propósito: Fijar search_path usando firmas dinámicas de funciones existentes

BEGIN;

-- ===============================
-- 🔄 MÉTODO ULTRA DINÁMICO
-- ===============================

DO $$
DECLARE
    func_record RECORD;
    alter_sql TEXT;
BEGIN
    -- Iterar sobre TODAS las funciones problemáticas que realmente existen
    FOR func_record IN 
        SELECT 
            p.oid,
            n.nspname as schema_name,
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as identity_args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname IN (
            'get_dashboard_data', 'get_financial_summary', 'auth_user_company_id',
            'verify_rls_setup', 'get_current_company_id', 'set_current_company_id',
            'check_company_limits', 'generate_company_code', 'generate_invitation_code',
            'get_income_by_period', 'update_inventory_after_sale', 'get_order_statistics',
            'get_order_detail_statistics', 'get_sales_statistics', 'get_company_usage_stats',
            'clean_expired_invitations', 'update_updated_at_column'
        )
    LOOP
        -- Construir comando ALTER dinámicamente
        alter_sql := format('ALTER FUNCTION %s.%s(%s) SET search_path = ''''', 
                           func_record.schema_name, 
                           func_record.function_name, 
                           func_record.identity_args);
        
        BEGIN
            -- Ejecutar el ALTER con manejo de errores
            EXECUTE alter_sql;
            RAISE NOTICE '✅ Fixed: %(%)', func_record.function_name, func_record.identity_args;
        EXCEPTION 
            WHEN OTHERS THEN
                RAISE NOTICE '❌ Error fixing %(%) - %', func_record.function_name, func_record.identity_args, SQLERRM;
        END;
    END LOOP;
END $$;

COMMIT;

-- ===============================
-- 📊 VERIFICACIÓN COMPLETA
-- ===============================

-- Mostrar TODAS las funciones con su estado de search_path
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as parameters,
    CASE 
        WHEN p.proconfig IS NULL THEN '❌ No configurado'
        WHEN 'search_path=' = ANY(p.proconfig) THEN '✅ search_path fijo' 
        ELSE '⚠️ Configuración parcial'
    END as search_path_status,
    p.proconfig as config_details
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname IN (
        'get_dashboard_data', 'get_financial_summary', 'auth_user_company_id',
        'verify_rls_setup', 'get_current_company_id', 'set_current_company_id',
        'check_company_limits', 'generate_company_code', 'generate_invitation_code',
        'get_income_by_period', 'update_inventory_after_sale', 'get_order_statistics',
        'get_order_detail_statistics', 'get_sales_statistics', 'get_company_usage_stats',
        'clean_expired_invitations', 'update_updated_at_column'
    )
ORDER BY p.proname, pg_get_function_identity_arguments(p.oid);

-- Contar funciones arregladas vs no arregladas
SELECT 
    COUNT(*) as total_functions,
    COUNT(CASE WHEN 'search_path=' = ANY(proconfig) THEN 1 END) as functions_fixed,
    COUNT(CASE WHEN proconfig IS NULL THEN 1 END) as functions_not_fixed
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname IN (
        'get_dashboard_data', 'get_financial_summary', 'auth_user_company_id',
        'verify_rls_setup', 'get_current_company_id', 'set_current_company_id',
        'check_company_limits', 'generate_company_code', 'generate_invitation_code',
        'get_income_by_period', 'update_inventory_after_sale', 'get_order_statistics',
        'get_order_detail_statistics', 'get_sales_statistics', 'get_company_usage_stats',
        'clean_expired_invitations', 'update_updated_at_column'
    );

SELECT '🛡️ ULTRA SAFE SECURITY FIX COMPLETED!' as final_status;
