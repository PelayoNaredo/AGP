-- =====================================================
-- FASE 4 - TAREA 4.1: Tabla de Planes de Suscripción
-- Fecha: 8 de agosto de 2025
-- Descripción: Crear estructura para planes configurables
-- =====================================================

-- Crear tabla de planes de suscripción
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_code VARCHAR(50) UNIQUE NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    plan_description TEXT,
    
    -- Límites del plan
    max_users INTEGER NOT NULL DEFAULT 5,
    max_clients INTEGER NOT NULL DEFAULT 100,
    max_products INTEGER NOT NULL DEFAULT 500,
    max_storage_mb INTEGER NOT NULL DEFAULT 1024,
    max_orders INTEGER NOT NULL DEFAULT 1000,
    max_invoices INTEGER NOT NULL DEFAULT 500,
    max_employees INTEGER NOT NULL DEFAULT 10,
    
    -- Funcionalidades habilitadas
    features JSONB DEFAULT '{
        "inventory_management": true,
        "sales_analytics": false,
        "advanced_reports": false,
        "api_access": false,
        "multi_location": false,
        "custom_fields": false,
        "email_support": true,
        "phone_support": false,
        "priority_support": false
    }',
    
    -- Precios
    monthly_price DECIMAL(10,2) DEFAULT 0.00,
    yearly_price DECIMAL(10,2) DEFAULT 0.00,
    
    -- Estado y metadata
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT true, -- Si el plan es visible públicamente
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_subscription_plans_code ON subscription_plans(plan_code);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active, is_public);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_price ON subscription_plans(monthly_price);

-- Insertar planes predefinidos
INSERT INTO subscription_plans (
    plan_code, plan_name, plan_description, 
    max_users, max_clients, max_products, max_storage_mb, 
    max_orders, max_invoices, max_employees,
    features, monthly_price, yearly_price, sort_order
) VALUES 
-- Plan Básico (Gratuito)
(
    'basic', 'Plan Básico', 'Ideal para pequeñas empresas que comienzan',
    5, 100, 500, 1024, 1000, 500, 3,
    '{
        "inventory_management": true,
        "sales_analytics": false,
        "advanced_reports": false,
        "api_access": false,
        "multi_location": false,
        "custom_fields": false,
        "email_support": true,
        "phone_support": false,
        "priority_support": false
    }',
    0.00, 0.00, 1
),
-- Plan Professional
(
    'professional', 'Plan Professional', 'Para empresas en crecimiento con más necesidades',
    15, 500, 2000, 5120, 5000, 2000, 10,
    '{
        "inventory_management": true,
        "sales_analytics": true,
        "advanced_reports": true,
        "api_access": false,
        "multi_location": false,
        "custom_fields": true,
        "email_support": true,
        "phone_support": true,
        "priority_support": false
    }',
    29.99, 299.90, 2
),
-- Plan Enterprise
(
    'enterprise', 'Plan Enterprise', 'Para grandes empresas con requisitos avanzados',
    50, 2000, 10000, 20480, 20000, 10000, 50,
    '{
        "inventory_management": true,
        "sales_analytics": true,
        "advanced_reports": true,
        "api_access": true,
        "multi_location": true,
        "custom_fields": true,
        "email_support": true,
        "phone_support": true,
        "priority_support": true
    }',
    99.99, 999.90, 3
),
-- Plan Custom (para casos especiales)
(
    'custom', 'Plan Personalizado', 'Plan personalizado según necesidades específicas',
    -1, -1, -1, -1, -1, -1, -1, -- -1 significa ilimitado
    '{
        "inventory_management": true,
        "sales_analytics": true,
        "advanced_reports": true,
        "api_access": true,
        "multi_location": true,
        "custom_fields": true,
        "email_support": true,
        "phone_support": true,
        "priority_support": true
    }',
    0.00, 0.00, 4
)
ON CONFLICT (plan_code) DO UPDATE SET
    plan_name = EXCLUDED.plan_name,
    plan_description = EXCLUDED.plan_description,
    max_users = EXCLUDED.max_users,
    max_clients = EXCLUDED.max_clients,
    max_products = EXCLUDED.max_products,
    max_storage_mb = EXCLUDED.max_storage_mb,
    max_orders = EXCLUDED.max_orders,
    max_invoices = EXCLUDED.max_invoices,
    max_employees = EXCLUDED.max_employees,
    features = EXCLUDED.features,
    monthly_price = EXCLUDED.monthly_price,
    yearly_price = EXCLUDED.yearly_price,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();

-- Actualizar tabla companies para referenciar planes
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subscription_plan_id UUID;
ALTER TABLE companies ADD CONSTRAINT fk_companies_subscription_plan 
    FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id);

-- Migrar planes existentes a la nueva estructura
UPDATE companies SET subscription_plan_id = (
    SELECT id FROM subscription_plans 
    WHERE plan_code = COALESCE(companies.subscription_plan, 'basic')
    LIMIT 1
);

-- Asegurar que todas las empresas tengan un plan asignado
UPDATE companies SET subscription_plan_id = (
    SELECT id FROM subscription_plans WHERE plan_code = 'basic' LIMIT 1
) WHERE subscription_plan_id IS NULL;

-- Función para obtener límites actuales de una empresa
CREATE OR REPLACE FUNCTION get_company_plan_limits(company_uuid UUID)
RETURNS TABLE (
    plan_code VARCHAR(50),
    plan_name VARCHAR(100),
    max_users INTEGER,
    max_clients INTEGER,
    max_products INTEGER,
    max_storage_mb INTEGER,
    max_orders INTEGER,
    max_invoices INTEGER,
    max_employees INTEGER,
    features JSONB,
    monthly_price DECIMAL(10,2),
    yearly_price DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.plan_code,
        sp.plan_name,
        sp.max_users,
        sp.max_clients,
        sp.max_products,
        sp.max_storage_mb,
        sp.max_orders,
        sp.max_invoices,
        sp.max_employees,
        sp.features,
        sp.monthly_price,
        sp.yearly_price
    FROM companies c
    JOIN subscription_plans sp ON c.subscription_plan_id = sp.id
    WHERE c.id = company_uuid AND c.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Función para verificar si una empresa puede usar una funcionalidad
CREATE OR REPLACE FUNCTION company_has_feature(
    company_uuid UUID, 
    feature_name VARCHAR(100)
) RETURNS BOOLEAN AS $$
DECLARE
    has_feature BOOLEAN := false;
BEGIN
    SELECT (sp.features ->> feature_name)::BOOLEAN INTO has_feature
    FROM companies c
    JOIN subscription_plans sp ON c.subscription_plan_id = sp.id
    WHERE c.id = company_uuid AND c.is_active = true AND sp.is_active = true;
    
    RETURN COALESCE(has_feature, false);
END;
$$ LANGUAGE plpgsql;

-- Función actualizada para validar límites usando planes
CREATE OR REPLACE FUNCTION can_add_resources_with_plan(
    company_uuid UUID,
    resource_type VARCHAR(50),
    quantity INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER := 0;
    max_limit INTEGER := 0;
BEGIN
    -- Obtener límite del plan
    EXECUTE format('
        SELECT sp.max_%s 
        FROM companies c 
        JOIN subscription_plans sp ON c.subscription_plan_id = sp.id 
        WHERE c.id = $1 AND c.is_active = true AND sp.is_active = true
    ', resource_type) 
    USING company_uuid INTO max_limit;
    
    -- Si el límite es -1, significa ilimitado
    IF max_limit = -1 THEN
        RETURN true;
    END IF;
    
    -- Si no se encontró límite, denegar por seguridad
    IF max_limit IS NULL THEN
        RETURN false;
    END IF;
    
    -- Obtener conteo actual según el tipo de recurso
    CASE resource_type
        WHEN 'users' THEN
            SELECT COUNT(*) INTO current_count 
            FROM users WHERE company_id = company_uuid;
            
        WHEN 'clients' THEN
            SELECT COUNT(*) INTO current_count 
            FROM clients WHERE company_id = company_uuid;
            
        WHEN 'products' THEN
            SELECT COUNT(*) INTO current_count 
            FROM inventory WHERE company_id = company_uuid;
            
        WHEN 'orders' THEN
            SELECT COUNT(*) INTO current_count 
            FROM orders WHERE company_id = company_uuid;
            
        WHEN 'invoices' THEN
            SELECT COUNT(*) INTO current_count 
            FROM sales WHERE company_id = company_uuid AND sale_type = 'factura';
            
        WHEN 'employees' THEN
            SELECT COUNT(*) INTO current_count 
            FROM employees WHERE company_id = company_uuid;
            
        ELSE
            RETURN false; -- Tipo de recurso no reconocido
    END CASE;
    
    -- Verificar si se puede agregar la cantidad solicitada
    RETURN (current_count + quantity) <= max_limit;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en subscription_plans
CREATE OR REPLACE FUNCTION update_subscription_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_plans_updated_at_trigger
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_plans_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE subscription_plans IS 'Planes de suscripción configurables con límites y funcionalidades';
COMMENT ON COLUMN subscription_plans.features IS 'Funcionalidades habilitadas en formato JSON';
COMMENT ON COLUMN subscription_plans.max_users IS 'Límite de usuarios, -1 para ilimitado';
COMMENT ON FUNCTION get_company_plan_limits(UUID) IS 'Obtiene los límites del plan de una empresa';
COMMENT ON FUNCTION company_has_feature(UUID, VARCHAR) IS 'Verifica si una empresa tiene acceso a una funcionalidad';
COMMENT ON FUNCTION can_add_resources_with_plan(UUID, VARCHAR, INTEGER) IS 'Valida límites usando el sistema de planes';
