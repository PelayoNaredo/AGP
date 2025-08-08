-- =====================================================
-- FASE 1 - TAREA 1.3b: Agregar company_id a tablas restantes (continuación)
-- Fecha: 9 de agosto de 2025
-- Descripción: Completar migración de tablas restantes
-- =====================================================

BEGIN;

-- =====================================
-- TABLA: leaves (bajas laborales)
-- =====================================
ALTER TABLE public.leaves 
ADD COLUMN IF NOT EXISTS company_id UUID;

UPDATE public.leaves 
SET company_id = '00000000-0000-0000-0000-000000000001'
WHERE company_id IS NULL;

ALTER TABLE public.leaves 
ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE public.leaves 
ADD CONSTRAINT fk_leaves_company_id 
FOREIGN KEY (company_id) REFERENCES public.companies(id) 
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS idx_leaves_company_id ON public.leaves(company_id);

-- =====================================
-- TABLA: orders (pedidos)
-- =====================================
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS company_id UUID;

UPDATE public.orders 
SET company_id = '00000000-0000-0000-0000-000000000001'
WHERE company_id IS NULL;

ALTER TABLE public.orders 
ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE public.orders 
ADD CONSTRAINT fk_orders_company_id 
FOREIGN KEY (company_id) REFERENCES public.companies(id) 
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS idx_orders_company_id ON public.orders(company_id);
CREATE INDEX IF NOT EXISTS idx_orders_company_fecha ON public.orders(company_id, fecha_pedido DESC);

-- =====================================
-- TABLA: sales (ventas)
-- =====================================
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS company_id UUID;

UPDATE public.sales 
SET company_id = '00000000-0000-0000-0000-000000000001'
WHERE company_id IS NULL;

ALTER TABLE public.sales 
ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE public.sales 
ADD CONSTRAINT fk_sales_company_id 
FOREIGN KEY (company_id) REFERENCES public.companies(id) 
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS idx_sales_company_id ON public.sales(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_company_fecha ON public.sales(company_id, fecha_emision DESC);
CREATE INDEX IF NOT EXISTS idx_sales_company_documento ON public.sales(company_id, numero_documento);

-- =====================================
-- TABLA: services (servicios)
-- =====================================
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS company_id UUID;

UPDATE public.services 
SET company_id = '00000000-0000-0000-0000-000000000001'
WHERE company_id IS NULL;

ALTER TABLE public.services 
ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE public.services 
ADD CONSTRAINT fk_services_company_id 
FOREIGN KEY (company_id) REFERENCES public.companies(id) 
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS idx_services_company_id ON public.services(company_id);
CREATE INDEX IF NOT EXISTS idx_services_company_activo ON public.services(company_id) WHERE activo = true;

-- =====================================
-- TABLA: suppliers (proveedores)
-- =====================================
ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS company_id UUID;

UPDATE public.suppliers 
SET company_id = '00000000-0000-0000-0000-000000000001'
WHERE company_id IS NULL;

ALTER TABLE public.suppliers 
ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE public.suppliers 
ADD CONSTRAINT fk_suppliers_company_id 
FOREIGN KEY (company_id) REFERENCES public.companies(id) 
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS idx_suppliers_company_id ON public.suppliers(company_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_company_activo ON public.suppliers(company_id) WHERE activo = true;

-- =====================================
-- TABLA: settings (configuración)
-- =====================================
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS company_id UUID;

UPDATE public.settings 
SET company_id = '00000000-0000-0000-0000-000000000001'
WHERE company_id IS NULL;

ALTER TABLE public.settings 
ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE public.settings 
ADD CONSTRAINT fk_settings_company_id 
FOREIGN KEY (company_id) REFERENCES public.companies(id) 
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS idx_settings_company_id ON public.settings(company_id);

-- =====================================
-- TABLA: shifts (horarios)
-- =====================================
ALTER TABLE public.shifts 
ADD COLUMN IF NOT EXISTS company_id UUID;

UPDATE public.shifts 
SET company_id = '00000000-0000-0000-0000-000000000001'
WHERE company_id IS NULL;

ALTER TABLE public.shifts 
ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE public.shifts 
ADD CONSTRAINT fk_shifts_company_id 
FOREIGN KEY (company_id) REFERENCES public.companies(id) 
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS idx_shifts_company_id ON public.shifts(company_id);

COMMIT;
