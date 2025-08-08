-- =====================================================
-- FASE 1 - TAREA 1.1: Crear tabla companies
-- Fecha: 9 de agosto de 2025
-- Descripción: Tabla principal para gestión multi-tenant
-- =====================================================

BEGIN;

-- Crear tabla companies (empresas/tenants)
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    company_code VARCHAR(50) NOT NULL UNIQUE,
    subscription_plan VARCHAR(50) NOT NULL DEFAULT 'basic',
    max_users INTEGER NOT NULL DEFAULT 5,
    max_clients INTEGER NOT NULL DEFAULT 100,
    max_products INTEGER NOT NULL DEFAULT 500,
    max_storage_mb INTEGER NOT NULL DEFAULT 1000,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_companies_code ON public.companies(company_code);
CREATE INDEX IF NOT EXISTS idx_companies_active ON public.companies(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_companies_plan ON public.companies(subscription_plan);

-- Crear empresa por defecto para datos existentes
INSERT INTO public.companies (
    id, 
    company_name, 
    company_code, 
    subscription_plan, 
    max_users, 
    max_clients, 
    max_products, 
    max_storage_mb
) VALUES (
    '00000000-0000-0000-0000-000000000001', -- UUID fijo para facilitar migración
    'Empresa Principal', 
    'LEGACY_MAIN', 
    'enterprise',  -- Plan enterprise para no tener limitaciones durante testing
    1000,         -- Límites altos para datos de testing
    10000, 
    50000, 
    100000
) ON CONFLICT (company_code) DO NOTHING;

-- Verificar creación
SELECT 'companies table created successfully' as status, count(*) as companies_count 
FROM public.companies;

COMMIT;

-- Comandos de verificación (ejecutar después del COMMIT)
-- SELECT * FROM public.companies;
-- SELECT pg_size_pretty(pg_total_relation_size('public.companies')) as table_size;
