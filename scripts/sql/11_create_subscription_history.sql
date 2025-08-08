-- =====================================================
-- FASE 4 - TAREA 4.2: Historial de Suscripciones
-- Fecha: 8 de agosto de 2025
-- Descripción: Seguimiento de cambios de plan y facturación
-- =====================================================

-- Tabla para historial de suscripciones
CREATE TABLE IF NOT EXISTS subscription_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    
    -- Plan anterior y nuevo
    previous_plan_id UUID REFERENCES subscription_plans(id),
    new_plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    
    -- Detalles del cambio
    change_type VARCHAR(50) NOT NULL CHECK (change_type IN (
        'upgrade', 'downgrade', 'renewal', 'cancellation', 'reactivation', 'trial_start', 'trial_end'
    )),
    change_reason TEXT,
    
    -- Información de facturación
    billing_cycle VARCHAR(20) CHECK (billing_cycle IN ('monthly', 'yearly', 'custom')),
    amount_charged DECIMAL(10,2) DEFAULT 0.00,
    
    -- Fechas importantes
    effective_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expiry_date TIMESTAMP WITH TIME ZONE,
    
    -- Metadatos
    changed_by_user_id INTEGER REFERENCES users(id_usuario),
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Índices para subscription_history
CREATE INDEX IF NOT EXISTS idx_subscription_history_company ON subscription_history(company_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_dates ON subscription_history(effective_date, expiry_date);
CREATE INDEX IF NOT EXISTS idx_subscription_history_type ON subscription_history(change_type);
CREATE INDEX IF NOT EXISTS idx_subscription_history_transaction ON subscription_history(transaction_id);

-- Tabla para notificaciones de límites
CREATE TABLE IF NOT EXISTS limit_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    
    -- Detalles de la notificación
    resource_type VARCHAR(50) NOT NULL,
    threshold_percentage INTEGER NOT NULL, -- 75, 90, 95, 100
    current_usage INTEGER NOT NULL,
    max_limit INTEGER NOT NULL,
    
    -- Estado de la notificación
    notification_type VARCHAR(30) NOT NULL CHECK (notification_type IN (
        'warning', 'critical', 'limit_reached', 'limit_exceeded'
    )),
    is_acknowledged BOOLEAN DEFAULT false,
    acknowledged_by_user_id INTEGER REFERENCES users(id_usuario),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    
    -- Canales de notificación
    sent_email BOOLEAN DEFAULT false,
    sent_push BOOLEAN DEFAULT false,
    shown_in_app BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para limit_notifications
CREATE INDEX IF NOT EXISTS idx_limit_notifications_company ON limit_notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_limit_notifications_resource ON limit_notifications(resource_type);
CREATE INDEX IF NOT EXISTS idx_limit_notifications_unacknowledged ON limit_notifications(company_id, is_acknowledged) WHERE is_acknowledged = false;
CREATE INDEX IF NOT EXISTS idx_limit_notifications_recent ON limit_notifications(created_at DESC);

-- Tabla para seguimiento de uso diario (para analytics)
CREATE TABLE IF NOT EXISTS daily_usage_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Contadores diarios
    users_count INTEGER DEFAULT 0,
    clients_count INTEGER DEFAULT 0,
    products_count INTEGER DEFAULT 0,
    storage_mb INTEGER DEFAULT 0,
    orders_count INTEGER DEFAULT 0,
    invoices_count INTEGER DEFAULT 0,
    employees_count INTEGER DEFAULT 0,
    
    -- Actividad del día
    api_requests INTEGER DEFAULT 0,
    logins_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar duplicados por día
    UNIQUE(company_id, usage_date)
);

-- Índices para daily_usage_stats
CREATE INDEX IF NOT EXISTS idx_daily_usage_stats_company_date ON daily_usage_stats(company_id, usage_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_usage_stats_date ON daily_usage_stats(usage_date DESC);

-- Función para registrar cambio de plan
CREATE OR REPLACE FUNCTION log_subscription_change(
    p_company_id UUID,
    p_previous_plan_id UUID,
    p_new_plan_id UUID,
    p_change_type VARCHAR(50),
    p_change_reason TEXT DEFAULT NULL,
    p_billing_cycle VARCHAR(20) DEFAULT 'monthly',
    p_amount_charged DECIMAL(10,2) DEFAULT 0.00,
    p_changed_by_user_id INTEGER DEFAULT NULL,
    p_expiry_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    history_id UUID;
BEGIN
    INSERT INTO subscription_history (
        company_id,
        previous_plan_id,
        new_plan_id,
        change_type,
        change_reason,
        billing_cycle,
        amount_charged,
        changed_by_user_id,
        expiry_date
    ) VALUES (
        p_company_id,
        p_previous_plan_id,
        p_new_plan_id,
        p_change_type,
        p_change_reason,
        p_billing_cycle,
        p_amount_charged,
        p_changed_by_user_id,
        COALESCE(p_expiry_date, NOW() + INTERVAL '1 month')
    ) RETURNING id INTO history_id;
    
    -- Actualizar el plan en la tabla companies
    UPDATE companies 
    SET subscription_plan_id = p_new_plan_id, updated_at = NOW()
    WHERE id = p_company_id;
    
    RETURN history_id;
END;
$$ LANGUAGE plpgsql;

-- Función para crear notificación de límite
CREATE OR REPLACE FUNCTION create_limit_notification(
    p_company_id UUID,
    p_resource_type VARCHAR(50),
    p_current_usage INTEGER,
    p_max_limit INTEGER,
    p_threshold_percentage INTEGER DEFAULT 90
) RETURNS UUID AS $$
DECLARE
    notification_id UUID;
    notification_type VARCHAR(30);
    usage_percentage DECIMAL(5,2);
BEGIN
    -- Calcular porcentaje de uso
    usage_percentage := (p_current_usage::DECIMAL / GREATEST(p_max_limit, 1)) * 100;
    
    -- Determinar tipo de notificación
    IF usage_percentage >= 100 THEN
        notification_type := 'limit_reached';
    ELSIF usage_percentage >= 95 THEN
        notification_type := 'critical';
    ELSIF usage_percentage >= p_threshold_percentage THEN
        notification_type := 'warning';
    ELSE
        -- No crear notificación si no se ha alcanzado el umbral
        RETURN NULL;
    END IF;
    
    -- Verificar si ya existe una notificación similar reciente (último día)
    IF EXISTS (
        SELECT 1 FROM limit_notifications 
        WHERE company_id = p_company_id 
            AND resource_type = p_resource_type 
            AND notification_type = notification_type
            AND created_at > NOW() - INTERVAL '24 hours'
            AND is_acknowledged = false
    ) THEN
        -- Ya existe una notificación similar reciente, no crear otra
        RETURN NULL;
    END IF;
    
    -- Crear nueva notificación
    INSERT INTO limit_notifications (
        company_id,
        resource_type,
        threshold_percentage,
        current_usage,
        max_limit,
        notification_type
    ) VALUES (
        p_company_id,
        p_resource_type,
        p_threshold_percentage,
        p_current_usage,
        p_max_limit,
        notification_type
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Función para capturar estadísticas diarias
CREATE OR REPLACE FUNCTION capture_daily_usage_stats(p_company_id UUID DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
    companies_processed INTEGER := 0;
    company_record RECORD;
BEGIN
    -- Si se especifica una empresa, procesar solo esa
    IF p_company_id IS NOT NULL THEN
        INSERT INTO daily_usage_stats (
            company_id, usage_date,
            users_count, clients_count, products_count, 
            orders_count, invoices_count, employees_count
        )
        SELECT 
            c.id,
            CURRENT_DATE,
            COALESCE((SELECT COUNT(*) FROM users WHERE company_id = c.id), 0),
            COALESCE((SELECT COUNT(*) FROM clients WHERE company_id = c.id), 0),
            COALESCE((SELECT COUNT(*) FROM inventory WHERE company_id = c.id), 0),
            COALESCE((SELECT COUNT(*) FROM orders WHERE company_id = c.id), 0),
            COALESCE((SELECT COUNT(*) FROM sales WHERE company_id = c.id AND sale_type = 'factura'), 0),
            COALESCE((SELECT COUNT(*) FROM employees WHERE company_id = c.id), 0)
        FROM companies c
        WHERE c.id = p_company_id AND c.is_active = true
        ON CONFLICT (company_id, usage_date) 
        DO UPDATE SET
            users_count = EXCLUDED.users_count,
            clients_count = EXCLUDED.clients_count,
            products_count = EXCLUDED.products_count,
            orders_count = EXCLUDED.orders_count,
            invoices_count = EXCLUDED.invoices_count,
            employees_count = EXCLUDED.employees_count;
            
        companies_processed := 1;
    ELSE
        -- Procesar todas las empresas activas
        FOR company_record IN 
            SELECT id FROM companies WHERE is_active = true
        LOOP
            INSERT INTO daily_usage_stats (
                company_id, usage_date,
                users_count, clients_count, products_count, 
                orders_count, invoices_count, employees_count
            )
            SELECT 
                company_record.id,
                CURRENT_DATE,
                COALESCE((SELECT COUNT(*) FROM users WHERE company_id = company_record.id), 0),
                COALESCE((SELECT COUNT(*) FROM clients WHERE company_id = company_record.id), 0),
                COALESCE((SELECT COUNT(*) FROM inventory WHERE company_id = company_record.id), 0),
                COALESCE((SELECT COUNT(*) FROM orders WHERE company_id = company_record.id), 0),
                COALESCE((SELECT COUNT(*) FROM sales WHERE company_id = company_record.id AND sale_type = 'factura'), 0),
                COALESCE((SELECT COUNT(*) FROM employees WHERE company_id = company_record.id), 0)
            ON CONFLICT (company_id, usage_date) 
            DO UPDATE SET
                users_count = EXCLUDED.users_count,
                clients_count = EXCLUDED.clients_count,
                products_count = EXCLUDED.products_count,
                orders_count = EXCLUDED.orders_count,
                invoices_count = EXCLUDED.invoices_count,
                employees_count = EXCLUDED.employees_count;
                
            companies_processed := companies_processed + 1;
        END LOOP;
    END IF;
    
    RETURN companies_processed;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener notificaciones activas de una empresa
CREATE OR REPLACE FUNCTION get_company_notifications(
    p_company_id UUID,
    p_unacknowledged_only BOOLEAN DEFAULT true,
    p_limit INTEGER DEFAULT 50
) RETURNS TABLE (
    id UUID,
    resource_type VARCHAR(50),
    notification_type VARCHAR(30),
    threshold_percentage INTEGER,
    current_usage INTEGER,
    max_limit INTEGER,
    usage_percentage DECIMAL(5,2),
    is_acknowledged BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ln.id,
        ln.resource_type,
        ln.notification_type,
        ln.threshold_percentage,
        ln.current_usage,
        ln.max_limit,
        ROUND((ln.current_usage::DECIMAL / GREATEST(ln.max_limit, 1)) * 100, 2) as usage_percentage,
        ln.is_acknowledged,
        ln.created_at
    FROM limit_notifications ln
    WHERE ln.company_id = p_company_id
        AND (NOT p_unacknowledged_only OR ln.is_acknowledged = false)
    ORDER BY ln.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
CREATE OR REPLACE FUNCTION update_limit_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER limit_notifications_updated_at_trigger
    BEFORE UPDATE ON limit_notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_limit_notifications_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE subscription_history IS 'Historial de cambios de planes de suscripción';
COMMENT ON TABLE limit_notifications IS 'Notificaciones de límites alcanzados o próximos a alcanzar';
COMMENT ON TABLE daily_usage_stats IS 'Estadísticas diarias de uso para analytics y reporting';
COMMENT ON FUNCTION log_subscription_change IS 'Registra cambios en el plan de suscripción';
COMMENT ON FUNCTION create_limit_notification IS 'Crea notificaciones automáticas cuando se alcanzan umbrales';
COMMENT ON FUNCTION capture_daily_usage_stats IS 'Captura estadísticas de uso diarias para análisis';
