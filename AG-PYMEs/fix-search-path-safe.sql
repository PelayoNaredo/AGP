-- 🛡️ SIMPLE Fix: Add SET search_path to existing functions (CORRECTED)
-- Fecha: 8 de agosto de 2025  
-- Propósito: Fijar search_path usando las firmas correctas de las funciones

BEGIN;

-- ===============================
-- 🔍 MÉTODO SEGURO: Verificar firmas primero
-- ===============================

-- Crear script con las firmas correctas basadas en las funciones reales
-- Nota: Algunas funciones pueden no existir o tener parámetros diferentes

-- Funciones con firmas conocidas:
DO $$
BEGIN
    -- get_dashboard_data
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = 'get_dashboard_data') THEN
        ALTER FUNCTION public.get_dashboard_data(UUID) SET search_path = '';
        RAISE NOTICE 'Fixed: get_dashboard_data';
    END IF;

    -- get_financial_summary 
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = 'get_financial_summary') THEN
        ALTER FUNCTION public.get_financial_summary(UUID, INTEGER, INTEGER) SET search_path = '';
        RAISE NOTICE 'Fixed: get_financial_summary';
    END IF;

    -- auth_user_company_id
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = 'auth_user_company_id') THEN
        ALTER FUNCTION public.auth_user_company_id() SET search_path = '';
        RAISE NOTICE 'Fixed: auth_user_company_id';
    END IF;

    -- verify_rls_setup
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = 'verify_rls_setup') THEN
        ALTER FUNCTION public.verify_rls_setup() SET search_path = '';
        RAISE NOTICE 'Fixed: verify_rls_setup';
    END IF;

    -- get_current_company_id
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = 'get_current_company_id') THEN
        ALTER FUNCTION public.get_current_company_id() SET search_path = '';
        RAISE NOTICE 'Fixed: get_current_company_id';
    END IF;

    -- set_current_company_id
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = 'set_current_company_id') THEN
        ALTER FUNCTION public.set_current_company_id(text) SET search_path = '';
        RAISE NOTICE 'Fixed: set_current_company_id';
    END IF;

    -- check_company_limits
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = 'check_company_limits') THEN
        ALTER FUNCTION public.check_company_limits() SET search_path = '';
        RAISE NOTICE 'Fixed: check_company_limits';
    END IF;

    -- generate_company_code
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = 'generate_company_code') THEN
        ALTER FUNCTION public.generate_company_code() SET search_path = '';
        RAISE NOTICE 'Fixed: generate_company_code';
    END IF;

    -- generate_invitation_code
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = 'generate_invitation_code') THEN
        ALTER FUNCTION public.generate_invitation_code() SET search_path = '';
        RAISE NOTICE 'Fixed: generate_invitation_code';
    END IF;

    -- get_income_by_period
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = 'get_income_by_period') THEN
        ALTER FUNCTION public.get_income_by_period(UUID, date, date) SET search_path = '';
        RAISE NOTICE 'Fixed: get_income_by_period';
    END IF;

    -- update_inventory_after_sale
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = 'update_inventory_after_sale') THEN
        ALTER FUNCTION public.update_inventory_after_sale() SET search_path = '';
        RAISE NOTICE 'Fixed: update_inventory_after_sale';
    END IF;

    -- get_order_statistics
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = 'get_order_statistics') THEN
        ALTER FUNCTION public.get_order_statistics(UUID) SET search_path = '';
        RAISE NOTICE 'Fixed: get_order_statistics';
    END IF;

    -- get_order_detail_statistics
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = 'get_order_detail_statistics') THEN
        ALTER FUNCTION public.get_order_detail_statistics(UUID) SET search_path = '';
        RAISE NOTICE 'Fixed: get_order_detail_statistics';
    END IF;

    -- get_sales_statistics
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = 'get_sales_statistics') THEN
        ALTER FUNCTION public.get_sales_statistics(UUID) SET search_path = '';
        RAISE NOTICE 'Fixed: get_sales_statistics';
    END IF;

    -- get_company_usage_stats
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = 'get_company_usage_stats') THEN
        ALTER FUNCTION public.get_company_usage_stats(UUID) SET search_path = '';
        RAISE NOTICE 'Fixed: get_company_usage_stats';
    END IF;

    -- clean_expired_invitations
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = 'clean_expired_invitations') THEN
        ALTER FUNCTION public.clean_expired_invitations() SET search_path = '';
        RAISE NOTICE 'Fixed: clean_expired_invitations';
    END IF;

    -- update_updated_at_column
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
               WHERE n.nspname = 'public' AND p.proname = 'update_updated_at_column') THEN
        ALTER FUNCTION public.update_updated_at_column() SET search_path = '';
        RAISE NOTICE 'Fixed: update_updated_at_column';
    END IF;

END $$;

COMMIT;

-- ===============================
-- 📊 VERIFICACIÓN FINAL
-- ===============================

-- Mostrar todas las funciones con su configuración de search_path
SELECT 
    proname as function_name,
    pg_get_function_arguments(p.oid) as parameters,
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

SELECT '🛡️ SECURITY FIX APPLIED: search_path fixed for existing functions!' as status;
