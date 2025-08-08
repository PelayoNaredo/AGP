-- =====================================================
-- FASE 1 - TAREA 1.4: Implementar Row Level Security (RLS)
-- Fecha: 9 de agosto de 2025
-- Descripción: Habilitar RLS y crear políticas de aislamiento
-- IMPORTANTE: Usar session variable para PostgreSQL nativo
-- =====================================================

BEGIN;

-- =====================================
-- HABILITAR ROW LEVEL SECURITY EN TODAS LAS TABLAS
-- =====================================

-- Tablas principales
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Tablas de detalle y auxiliares
ALTER TABLE public.employee_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_detail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_intervals ENABLE ROW LEVEL SECURITY;

-- Tabla companies (política especial)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- =====================================
-- CREAR POLÍTICAS DE AISLAMIENTO POR TENANT
-- =====================================

-- POLÍTICA PARA TABLA COMPANIES (acceso a su propia empresa)
CREATE POLICY "company_isolation" ON public.companies
FOR ALL 
USING (id = COALESCE(current_setting('app.current_company_id', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid));

-- POLÍTICA UNIVERSAL PARA TABLAS CON COMPANY_ID
-- Patrón: Solo ver/modificar datos de su empresa

-- Alertas
CREATE POLICY "tenant_isolation" ON public.alerts
FOR ALL 
USING (company_id = COALESCE(current_setting('app.current_company_id', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid));

-- Citas
CREATE POLICY "tenant_isolation" ON public.appointments
FOR ALL 
USING (company_id = COALESCE(current_setting('app.current_company_id', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid));

-- Clientes
CREATE POLICY "tenant_isolation" ON public.clients
FOR ALL 
USING (company_id = COALESCE(current_setting('app.current_company_id', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid));

-- Empleados
CREATE POLICY "tenant_isolation" ON public.employees
FOR ALL 
USING (company_id = COALESCE(current_setting('app.current_company_id', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid));

-- Gastos
CREATE POLICY "tenant_isolation" ON public.expenses
FOR ALL 
USING (company_id = COALESCE(current_setting('app.current_company_id', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid));

-- Ingresos
CREATE POLICY "tenant_isolation" ON public.income
FOR ALL 
USING (company_id = COALESCE(current_setting('app.current_company_id', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid));

-- Inventario
CREATE POLICY "tenant_isolation" ON public.inventory
FOR ALL 
USING (company_id = COALESCE(current_setting('app.current_company_id', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid));

-- Bajas laborales
CREATE POLICY "tenant_isolation" ON public.leaves
FOR ALL 
USING (company_id = COALESCE(current_setting('app.current_company_id', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid));

-- Pedidos
CREATE POLICY "tenant_isolation" ON public.orders
FOR ALL 
USING (company_id = COALESCE(current_setting('app.current_company_id', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid));

-- Ventas
CREATE POLICY "tenant_isolation" ON public.sales
FOR ALL 
USING (company_id = COALESCE(current_setting('app.current_company_id', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid));

-- Servicios
CREATE POLICY "tenant_isolation" ON public.services
FOR ALL 
USING (company_id = COALESCE(current_setting('app.current_company_id', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid));

-- Proveedores
CREATE POLICY "tenant_isolation" ON public.suppliers
FOR ALL 
USING (company_id = COALESCE(current_setting('app.current_company_id', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid));

-- Configuración
CREATE POLICY "tenant_isolation" ON public.settings
FOR ALL 
USING (company_id = COALESCE(current_setting('app.current_company_id', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid));

-- Horarios
CREATE POLICY "tenant_isolation" ON public.shifts
FOR ALL 
USING (company_id = COALESCE(current_setting('app.current_company_id', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid));

-- Usuarios
CREATE POLICY "tenant_isolation" ON public.users
FOR ALL 
USING (company_id = COALESCE(current_setting('app.current_company_id', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid));

COMMIT;
