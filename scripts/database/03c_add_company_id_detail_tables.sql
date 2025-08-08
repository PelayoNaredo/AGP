-- =====================================================
-- FASE 1 - TAREA 1.3c: Agregar company_id a tablas de detalle y auxiliares
-- Fecha: 9 de agosto de 2025
-- Descripción: Completar tablas de detalle y relaciones auxiliares
-- =====================================================

BEGIN;

-- =====================================
-- TABLA: employee_services (servicios por empleado)
-- =====================================
ALTER TABLE public.employee_services 
ADD COLUMN IF NOT EXISTS company_id UUID;

UPDATE public.employee_services 
SET company_id = '00000000-0000-0000-0000-000000000001'
WHERE company_id IS NULL;

ALTER TABLE public.employee_services 
ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE public.employee_services 
ADD CONSTRAINT fk_employee_services_company_id 
FOREIGN KEY (company_id) REFERENCES public.companies(id) 
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS idx_employee_services_company_id ON public.employee_services(company_id);

-- =====================================
-- TABLA: order_detail (detalles de pedido)
-- =====================================
ALTER TABLE public.order_detail 
ADD COLUMN IF NOT EXISTS company_id UUID;

UPDATE public.order_detail 
SET company_id = '00000000-0000-0000-0000-000000000001'
WHERE company_id IS NULL;

ALTER TABLE public.order_detail 
ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE public.order_detail 
ADD CONSTRAINT fk_order_detail_company_id 
FOREIGN KEY (company_id) REFERENCES public.companies(id) 
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS idx_order_detail_company_id ON public.order_detail(company_id);

-- =====================================
-- TABLA: product_codes (códigos de producto)
-- =====================================
ALTER TABLE public.product_codes 
ADD COLUMN IF NOT EXISTS company_id UUID;

UPDATE public.product_codes 
SET company_id = '00000000-0000-0000-0000-000000000001'
WHERE company_id IS NULL;

ALTER TABLE public.product_codes 
ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE public.product_codes 
ADD CONSTRAINT fk_product_codes_company_id 
FOREIGN KEY (company_id) REFERENCES public.companies(id) 
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS idx_product_codes_company_id ON public.product_codes(company_id);
CREATE INDEX IF NOT EXISTS idx_product_codes_company_codigo ON public.product_codes(company_id, codigo);

-- =====================================
-- TABLA: sale_products (productos vendidos)
-- =====================================
ALTER TABLE public.sale_products 
ADD COLUMN IF NOT EXISTS company_id UUID;

UPDATE public.sale_products 
SET company_id = '00000000-0000-0000-0000-000000000001'
WHERE company_id IS NULL;

ALTER TABLE public.sale_products 
ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE public.sale_products 
ADD CONSTRAINT fk_sale_products_company_id 
FOREIGN KEY (company_id) REFERENCES public.companies(id) 
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS idx_sale_products_company_id ON public.sale_products(company_id);

-- =====================================
-- TABLA: sale_services (servicios vendidos)
-- =====================================
ALTER TABLE public.sale_services 
ADD COLUMN IF NOT EXISTS company_id UUID;

UPDATE public.sale_services 
SET company_id = '00000000-0000-0000-0000-000000000001'
WHERE company_id IS NULL;

ALTER TABLE public.sale_services 
ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE public.sale_services 
ADD CONSTRAINT fk_sale_services_company_id 
FOREIGN KEY (company_id) REFERENCES public.companies(id) 
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS idx_sale_services_company_id ON public.sale_services(company_id);

-- =====================================
-- TABLA: service_levels (niveles de servicio)
-- =====================================
ALTER TABLE public.service_levels 
ADD COLUMN IF NOT EXISTS company_id UUID;

UPDATE public.service_levels 
SET company_id = '00000000-0000-0000-0000-000000000001'
WHERE company_id IS NULL;

ALTER TABLE public.service_levels 
ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE public.service_levels 
ADD CONSTRAINT fk_service_levels_company_id 
FOREIGN KEY (company_id) REFERENCES public.companies(id) 
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS idx_service_levels_company_id ON public.service_levels(company_id);

-- =====================================
-- TABLA: shift_intervals (intervalos de horario)
-- =====================================
ALTER TABLE public.shift_intervals 
ADD COLUMN IF NOT EXISTS company_id UUID;

UPDATE public.shift_intervals 
SET company_id = '00000000-0000-0000-0000-000000000001'
WHERE company_id IS NULL;

ALTER TABLE public.shift_intervals 
ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE public.shift_intervals 
ADD CONSTRAINT fk_shift_intervals_company_id 
FOREIGN KEY (company_id) REFERENCES public.companies(id) 
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS idx_shift_intervals_company_id ON public.shift_intervals(company_id);

-- Verificación final de la migración
SELECT 
    'Migration Phase 1.3 completed successfully' as status,
    count(*) as total_tables_with_company_id
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND column_name = 'company_id'
  AND table_name NOT IN ('companies'); -- Excluir la tabla companies

COMMIT;
