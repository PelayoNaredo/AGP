-- =====================================================
-- FASE 1 - TAREA 1.2: Modificar tabla users para multi-tenancy
-- Fecha: 9 de agosto de 2025
-- Descripción: Agregar company_id y migrar usuarios existentes
-- =====================================================

BEGIN;

-- PASO 1: Agregar columna company_id a tabla users (nullable inicialmente)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS company_id UUID;

-- PASO 2: Crear índice para optimizar queries por empresa
CREATE INDEX IF NOT EXISTS idx_users_company_id ON public.users(company_id);

-- PASO 3: Migrar todos los usuarios existentes a la empresa por defecto
-- Esto preserva todos los datos de testing existentes
UPDATE public.users 
SET company_id = '00000000-0000-0000-0000-000000000001'
WHERE company_id IS NULL;

-- PASO 4: Ahora hacer la columna NOT NULL y agregar foreign key
ALTER TABLE public.users 
ALTER COLUMN company_id SET NOT NULL;

-- PASO 5: Agregar constraint de foreign key
ALTER TABLE public.users 
ADD CONSTRAINT fk_users_company_id 
FOREIGN KEY (company_id) REFERENCES public.companies(id) 
ON DELETE RESTRICT ON UPDATE CASCADE;

-- PASO 6: Crear índice compuesto para optimizar consultas multi-tenant
CREATE INDEX IF NOT EXISTS idx_users_company_email ON public.users(company_id, email);
CREATE INDEX IF NOT EXISTS idx_users_company_active ON public.users(company_id, fecha_registro DESC);

-- Verificar migración
SELECT 
    'users migration completed' as status,
    count(*) as total_users,
    count(CASE WHEN company_id IS NOT NULL THEN 1 END) as users_with_company,
    count(DISTINCT company_id) as unique_companies
FROM public.users;

COMMIT;

-- Comandos de verificación (ejecutar después del COMMIT)
-- SELECT u.*, c.company_name FROM public.users u 
-- JOIN public.companies c ON u.company_id = c.id LIMIT 5;
-- 
-- SELECT company_id, count(*) as user_count 
-- FROM public.users GROUP BY company_id;
