-- =====================================================
-- FASE 1 - TAREA 1.3: Agregar company_id a todas las tablas operacionales
-- Fecha: 9 de agosto de 2025
-- Descripción: Modificar 24 tablas para soporte multi-tenant
-- IMPORTANTE: Preservar todos los datos existentes
-- =====================================================

BEGIN;

-- =====================================
-- TABLA: alerts (recordatorios)
-- =====================================
ALTER TABLE public.alerts 
ADD COLUMN IF NOT EXISTS company_id UUID;

UPDATE public.alerts 
SET company_id = '00000000-0000-0000-0000-000000000001'
WHERE company_id IS NULL;

ALTER TABLE public.alerts 
ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE public.alerts 
ADD CONSTRAINT fk_alerts_company_id 
FOREIGN KEY (company_id) REFERENCES public.companies(id) 
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS idx_alerts_company_id ON public.alerts(company_id);

-- =====================================
-- TABLA: appointments (citas)
-- =====================================
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS company_id UUID;

UPDATE public.appointments 
SET company_id = '00000000-0000-0000-0000-000000000001'
WHERE company_id IS NULL;

ALTER TABLE public.appointments 
ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE public.appointments 
ADD CONSTRAINT fk_appointments_company_id 
FOREIGN KEY (company_id) REFERENCES public.companies(id) 
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS idx_appointments_company_id ON public.appointments(company_id);
CREATE INDEX IF NOT EXISTS idx_appointments_company_fecha ON public.appointments(company_id, fecha_inicio);

-- =====================================
-- TABLA: clients (clientes)
-- =====================================
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS company_id UUID;

UPDATE public.clients 
SET company_id = '00000000-0000-0000-0000-000000000001'
WHERE company_id IS NULL;

ALTER TABLE public.clients 
ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE public.clients 
ADD CONSTRAINT fk_clients_company_id 
FOREIGN KEY (company_id) REFERENCES public.companies(id) 
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS idx_clients_company_id ON public.clients(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_company_documento ON public.clients(company_id, documento);

-- =====================================
-- TABLA: employees (empleados)
-- =====================================
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS company_id UUID;

UPDATE public.employees 
SET company_id = '00000000-0000-0000-0000-000000000001'
WHERE company_id IS NULL;

ALTER TABLE public.employees 
ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE public.employees 
ADD CONSTRAINT fk_employees_company_id 
FOREIGN KEY (company_id) REFERENCES public.companies(id) 
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS idx_employees_company_id ON public.employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_company_activo ON public.employees(company_id) WHERE activo = true;

-- =====================================
-- TABLA: expenses (gastos)
-- =====================================
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS company_id UUID;

UPDATE public.expenses 
SET company_id = '00000000-0000-0000-0000-000000000001'
WHERE company_id IS NULL;

ALTER TABLE public.expenses 
ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE public.expenses 
ADD CONSTRAINT fk_expenses_company_id 
FOREIGN KEY (company_id) REFERENCES public.companies(id) 
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS idx_expenses_company_id ON public.expenses(company_id);
CREATE INDEX IF NOT EXISTS idx_expenses_company_fecha ON public.expenses(company_id, fecha_gasto DESC);

-- =====================================
-- TABLA: income (ingresos)
-- =====================================
ALTER TABLE public.income 
ADD COLUMN IF NOT EXISTS company_id UUID;

UPDATE public.income 
SET company_id = '00000000-0000-0000-0000-000000000001'
WHERE company_id IS NULL;

ALTER TABLE public.income 
ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE public.income 
ADD CONSTRAINT fk_income_company_id 
FOREIGN KEY (company_id) REFERENCES public.companies(id) 
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS idx_income_company_id ON public.income(company_id);
CREATE INDEX IF NOT EXISTS idx_income_company_fecha ON public.income(company_id, fecha_ingreso DESC);

-- =====================================
-- TABLA: inventory (inventario)
-- =====================================
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS company_id UUID;

UPDATE public.inventory 
SET company_id = '00000000-0000-0000-0000-000000000001'
WHERE company_id IS NULL;

ALTER TABLE public.inventory 
ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE public.inventory 
ADD CONSTRAINT fk_inventory_company_id 
FOREIGN KEY (company_id) REFERENCES public.companies(id) 
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS idx_inventory_company_id ON public.inventory(company_id);
CREATE INDEX IF NOT EXISTS idx_inventory_company_referencia ON public.inventory(company_id, referencia);

COMMIT;
