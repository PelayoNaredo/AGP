-- =====================================================
-- FASE 1 - TAREA 1.5: Funciones de utilidad para límites y estadísticas
-- Fecha: 9 de agosto de 2025
-- Descripción: Funciones para gestión de planes y límites por empresa
-- =====================================================

BEGIN;

-- =====================================
-- FUNCIÓN: Obtener estadísticas de uso de una empresa
-- =====================================
CREATE OR REPLACE FUNCTION public.get_company_usage_stats(company_uuid UUID)
RETURNS JSON 
LANGUAGE SQL
STABLE
AS $$
    SELECT json_build_object(
        'users', (SELECT COUNT(*) FROM users WHERE company_id = company_uuid),
        'clients', (SELECT COUNT(*) FROM clients WHERE company_id = company_uuid),
        'products', (SELECT COUNT(*) FROM inventory WHERE company_id = company_uuid),
        'employees', (SELECT COUNT(*) FROM employees WHERE company_id = company_uuid AND activo = true),
        'suppliers', (SELECT COUNT(*) FROM suppliers WHERE company_id = company_uuid AND activo = true),
        'services', (SELECT COUNT(*) FROM services WHERE company_id = company_uuid AND activo = true),
        'sales_this_month', (
            SELECT COUNT(*) FROM sales 
            WHERE company_id = company_uuid 
              AND fecha_emision >= date_trunc('month', CURRENT_DATE)
        ),
        'revenue_this_month', (
            SELECT COALESCE(SUM(total), 0) FROM sales 
            WHERE company_id = company_uuid 
              AND fecha_emision >= date_trunc('month', CURRENT_DATE)
              AND estado = 'completada'
        ),
        'expenses_this_month', (
            SELECT COALESCE(SUM(monto), 0) FROM expenses 
            WHERE company_id = company_uuid 
              AND fecha_gasto >= date_trunc('month', CURRENT_DATE)
        )
    );
$$;

-- =====================================
-- FUNCIÓN: Verificar límites de plan
-- =====================================
CREATE OR REPLACE FUNCTION public.check_company_limits(company_uuid UUID, resource_type TEXT)
RETURNS BOOLEAN 
LANGUAGE PLPGSQL
STABLE
AS $$
DECLARE
    company_plan RECORD;
    current_usage INTEGER;
    limit_value INTEGER;
BEGIN
    -- Obtener datos del plan de la empresa
    SELECT subscription_plan, max_users, max_clients, max_products, max_storage_mb
    INTO company_plan
    FROM companies 
    WHERE id = company_uuid AND is_active = true;
    
    -- Si no existe la empresa o está inactiva, denegar
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Verificar límites según el tipo de recurso
    CASE resource_type
        WHEN 'users' THEN
            SELECT COUNT(*) INTO current_usage FROM users WHERE company_id = company_uuid;
            limit_value := company_plan.max_users;
            
        WHEN 'clients' THEN
            SELECT COUNT(*) INTO current_usage FROM clients WHERE company_id = company_uuid;
            limit_value := company_plan.max_clients;
            
        WHEN 'products' THEN
            SELECT COUNT(*) INTO current_usage FROM inventory WHERE company_id = company_uuid;
            limit_value := company_plan.max_products;
            
        WHEN 'employees' THEN
            SELECT COUNT(*) INTO current_usage FROM employees WHERE company_id = company_uuid AND activo = true;
            -- Los empleados suelen estar limitados por usuarios, usar max_users
            limit_value := company_plan.max_users;
            
        ELSE
            -- Tipo de recurso no reconocido
            RETURN false;
    END CASE;
    
    -- Retornar true si no se ha alcanzado el límite
    RETURN current_usage < limit_value;
END;
$$;

-- =====================================
-- FUNCIÓN: Obtener porcentaje de uso por recurso
-- =====================================
CREATE OR REPLACE FUNCTION public.get_company_usage_percentages(company_uuid UUID)
RETURNS JSON 
LANGUAGE PLPGSQL
STABLE
AS $$
DECLARE
    company_plan RECORD;
    usage_stats RECORD;
    result JSON;
BEGIN
    -- Obtener límites del plan
    SELECT max_users, max_clients, max_products, max_storage_mb
    INTO company_plan
    FROM companies 
    WHERE id = company_uuid AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN '{"error": "Company not found or inactive"}'::JSON;
    END IF;
    
    -- Obtener uso actual
    SELECT 
        (SELECT COUNT(*) FROM users WHERE company_id = company_uuid) as users,
        (SELECT COUNT(*) FROM clients WHERE company_id = company_uuid) as clients,
        (SELECT COUNT(*) FROM inventory WHERE company_id = company_uuid) as products
    INTO usage_stats;
    
    -- Construir JSON con porcentajes
    result := json_build_object(
        'users', json_build_object(
            'current', usage_stats.users,
            'limit', company_plan.max_users,
            'percentage', ROUND((usage_stats.users::DECIMAL / company_plan.max_users) * 100, 2),
            'can_add', usage_stats.users < company_plan.max_users
        ),
        'clients', json_build_object(
            'current', usage_stats.clients,
            'limit', company_plan.max_clients,
            'percentage', ROUND((usage_stats.clients::DECIMAL / company_plan.max_clients) * 100, 2),
            'can_add', usage_stats.clients < company_plan.max_clients
        ),
        'products', json_build_object(
            'current', usage_stats.products,
            'limit', company_plan.max_products,
            'percentage', ROUND((usage_stats.products::DECIMAL / company_plan.max_products) * 100, 2),
            'can_add', usage_stats.products < company_plan.max_products
        )
    );
    
    RETURN result;
END;
$$;

-- =====================================
-- FUNCIÓN: Validar si se puede agregar N recursos
-- =====================================
CREATE OR REPLACE FUNCTION public.can_add_resources(company_uuid UUID, resource_type TEXT, quantity INTEGER)
RETURNS BOOLEAN 
LANGUAGE PLPGSQL
STABLE
AS $$
DECLARE
    company_plan RECORD;
    current_usage INTEGER;
    limit_value INTEGER;
BEGIN
    -- Obtener datos del plan de la empresa
    SELECT max_users, max_clients, max_products
    INTO company_plan
    FROM companies 
    WHERE id = company_uuid AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Verificar límites según el tipo de recurso
    CASE resource_type
        WHEN 'users' THEN
            SELECT COUNT(*) INTO current_usage FROM users WHERE company_id = company_uuid;
            limit_value := company_plan.max_users;
            
        WHEN 'clients' THEN
            SELECT COUNT(*) INTO current_usage FROM clients WHERE company_id = company_uuid;
            limit_value := company_plan.max_clients;
            
        WHEN 'products' THEN
            SELECT COUNT(*) INTO current_usage FROM inventory WHERE company_id = company_uuid;
            limit_value := company_plan.max_products;
            
        ELSE
            RETURN false;
    END CASE;
    
    -- Verificar si se pueden agregar N recursos
    RETURN (current_usage + quantity) <= limit_value;
END;
$$;

-- =====================================
-- FUNCIÓN: Trigger para actualizar updated_at en companies
-- =====================================
CREATE OR REPLACE FUNCTION public.update_companies_updated_at()
RETURNS TRIGGER 
LANGUAGE PLPGSQL
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_companies_updated_at ON public.companies;
CREATE TRIGGER trigger_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION update_companies_updated_at();

COMMIT;

-- =====================================
-- COMANDOS DE PRUEBA (Ejecutar después del COMMIT)
-- =====================================

-- Prueba 1: Obtener estadísticas de uso
-- SELECT get_company_usage_stats('00000000-0000-0000-0000-000000000001');

-- Prueba 2: Verificar límites
-- SELECT check_company_limits('00000000-0000-0000-0000-000000000001', 'users');
-- SELECT check_company_limits('00000000-0000-0000-0000-000000000001', 'clients');

-- Prueba 3: Obtener porcentajes de uso
-- SELECT get_company_usage_percentages('00000000-0000-0000-0000-000000000001');

-- Prueba 4: Verificar si se pueden agregar recursos
-- SELECT can_add_resources('00000000-0000-0000-0000-000000000001', 'clients', 5);
