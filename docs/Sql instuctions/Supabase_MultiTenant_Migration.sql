-- ========================================
-- MIGRACIÓN MULTI-TENANCY PARA SUPABASE
-- Sistema de Gestión de PYMEs con Multi-Tenancy
-- ========================================

-- Habilitar extensiones necesarias para Supabase
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- 1. TABLA COMPANIES (EMPRESAS)
-- ========================================

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(200) NOT NULL,
    company_code VARCHAR(50) UNIQUE NOT NULL,
    subscription_plan VARCHAR(50) NOT NULL DEFAULT 'basic',
    
    -- Información de contacto
    company_address TEXT,
    company_phone VARCHAR(20),
    company_email VARCHAR(100),
    company_website VARCHAR(200),
    
    -- Información fiscal
    tax_id VARCHAR(20), -- CIF/NIF de la empresa
    tax_rate DECIMAL(5,2) DEFAULT 21.00,
    default_currency VARCHAR(3) DEFAULT 'EUR',
    
    -- Límites por plan
    max_users INTEGER NOT NULL DEFAULT 5,
    max_clients INTEGER NOT NULL DEFAULT 100,
    max_products INTEGER NOT NULL DEFAULT 500,
    max_storage_mb INTEGER NOT NULL DEFAULT 1000,
    
    -- Fechas y estado
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    -- Configuraciones adicionales
    settings JSONB DEFAULT '{}',
    
    CONSTRAINT companies_subscription_plan_check CHECK (
        subscription_plan IN ('basic', 'pro', 'enterprise')
    )
);

-- Índices para la tabla companies
CREATE INDEX idx_companies_company_code ON companies(company_code);
CREATE INDEX idx_companies_subscription_plan ON companies(subscription_plan);
CREATE INDEX idx_companies_is_active ON companies(is_active);
CREATE INDEX idx_companies_created_at ON companies(created_at);

-- ========================================
-- 2. TABLA COMPANY_INVITATIONS (INVITACIONES DE EMPRESA)
-- ========================================

CREATE TABLE company_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    invitation_code VARCHAR(20) UNIQUE NOT NULL,
    invited_email VARCHAR(100),
    invited_by_user_id UUID, -- Se definirá después de crear users
    
    -- Estado de la invitación
    status VARCHAR(20) DEFAULT 'pending',
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    used_at TIMESTAMP WITH TIME ZONE,
    used_by_user_id UUID, -- Se definirá después de crear users
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT company_invitations_status_check CHECK (
        status IN ('pending', 'accepted', 'expired', 'revoked')
    )
);

-- Índices para company_invitations
CREATE INDEX idx_company_invitations_company_id ON company_invitations(company_id);
CREATE INDEX idx_company_invitations_invitation_code ON company_invitations(invitation_code);
CREATE INDEX idx_company_invitations_status ON company_invitations(status);
CREATE INDEX idx_company_invitations_expires_at ON company_invitations(expires_at);

-- ========================================
-- 3. TABLA USERS (USUARIOS) - MODIFICADA PARA MULTI-TENANCY
-- ========================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Información personal
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    
    -- Roles y permisos
    rol VARCHAR(50) NOT NULL DEFAULT 'empleado',
    permissions JSONB DEFAULT '[]',
    
    -- Fechas y estado
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    
    -- Configuraciones de usuario
    user_settings JSONB DEFAULT '{}',
    
    -- Constraint para email único por empresa
    CONSTRAINT users_email_company_unique UNIQUE (email, company_id),
    CONSTRAINT users_rol_check CHECK (
        rol IN ('admin', 'empleado', 'viewer')
    )
);

-- Índices para la tabla users
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_rol ON users(rol);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_email_company ON users(email, company_id);

-- ========================================
-- 4. ACTUALIZAR FOREIGN KEYS DE INVITATIONS
-- ========================================

ALTER TABLE company_invitations 
ADD CONSTRAINT fk_invitations_invited_by_user 
FOREIGN KEY (invited_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE company_invitations 
ADD CONSTRAINT fk_invitations_used_by_user 
FOREIGN KEY (used_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- ========================================
-- 5. SETTINGS (CONFIGURACIONES) - MODIFICADA PARA MULTI-TENANCY
-- ========================================

CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Información del negocio
    nombre_local VARCHAR(100),
    direccion TEXT,
    telefono VARCHAR(20),
    url_backend VARCHAR(255),
    
    -- Horarios
    horario_apertura TIME,
    horario_cierre TIME,
    
    -- Branding
    logo_local TEXT,
    tema VARCHAR(20) DEFAULT 'claro',
    
    -- Configuraciones financieras
    default_currency VARCHAR(3) DEFAULT 'EUR',
    tax_rate DECIMAL(5,2) DEFAULT 21.00,
    
    -- Configuraciones adicionales
    additional_settings JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT settings_tema_check CHECK (
        tema IN ('claro', 'oscuro')
    )
);

-- Índice para settings
CREATE INDEX idx_settings_company_id ON settings(company_id);

-- ========================================
-- 6. ALERTS (ALERTAS) - MODIFICADA PARA MULTI-TENANCY
-- ========================================

CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    titulo VARCHAR(100) NOT NULL,
    descripcion TEXT,
    fecha_recordatorio TIMESTAMP WITH TIME ZONE NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente',
    dias_anticipacion INTEGER DEFAULT 0,
    recurrencia VARCHAR(20),
    tipo VARCHAR(50) NOT NULL,
    prioridad VARCHAR(20) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT alerts_estado_check CHECK (
        estado IN ('pendiente', 'completado')
    ),
    CONSTRAINT alerts_tipo_check CHECK (
        tipo IN ('inventario', 'mantenimiento', 'horario', 'pago', 'pedido', 'empleado', 'otros')
    ),
    CONSTRAINT alerts_prioridad_check CHECK (
        prioridad IN ('baja', 'media', 'alta')
    )
);

-- Índices para alerts
CREATE INDEX idx_alerts_company_id ON alerts(company_id);
CREATE INDEX idx_alerts_fecha_recordatorio ON alerts(fecha_recordatorio);
CREATE INDEX idx_alerts_estado ON alerts(estado);
CREATE INDEX idx_alerts_tipo ON alerts(tipo);
CREATE INDEX idx_alerts_prioridad ON alerts(prioridad);

-- ========================================
-- 7. CLIENTS (CLIENTES) - MODIFICADA PARA MULTI-TENANCY
-- ========================================

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Información personal
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100),
    documento VARCHAR(20) NOT NULL,
    
    -- Dirección
    direccion VARCHAR(255) NOT NULL,
    codigo_postal VARCHAR(10) NOT NULL,
    ciudad VARCHAR(100),
    provincia VARCHAR(50) NOT NULL,
    pais VARCHAR(100) DEFAULT 'España',
    
    -- Contacto
    telefono VARCHAR(20),
    email VARCHAR(100),
    
    -- Información fiscal
    razon_social VARCHAR(200),
    regimen_fiscal VARCHAR(50),
    tipo_cliente VARCHAR(20) NOT NULL,
    tipo_documento VARCHAR(10) NOT NULL,
    tipo_iva VARCHAR(20) DEFAULT 'general',
    
    -- Comercial
    descuento_preferencial DECIMAL(5,2) DEFAULT 0,
    notas TEXT,
    
    -- Fechas
    fecha_registro DATE DEFAULT CURRENT_DATE,
    fecha_ultima_compra DATE,
    
    -- Constraint para documento único por empresa
    CONSTRAINT clients_documento_company_unique UNIQUE (documento, company_id),
    
    CONSTRAINT clients_tipo_cliente_check CHECK (
        tipo_cliente IN ('particular', 'empresa', 'autonomo')
    ),
    CONSTRAINT clients_tipo_documento_check CHECK (
        tipo_documento IN ('DNI', 'NIF', 'CIF', 'NIE', 'PASAPORTE')
    ),
    CONSTRAINT clients_tipo_iva_check CHECK (
        tipo_iva IN ('general', 'reducido', 'superreducido', 'exento')
    )
);

-- Índices para clients
CREATE INDEX idx_clients_company_id ON clients(company_id);
CREATE INDEX idx_clients_documento ON clients(documento);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_tipo_cliente ON clients(tipo_cliente);
CREATE INDEX idx_clients_documento_company ON clients(documento, company_id);

-- ========================================
-- 8. EMPLOYEES (EMPLEADOS) - MODIFICADA PARA MULTI-TENANCY
-- ========================================

CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Información personal
    nombre VARCHAR(100) NOT NULL,
    dni VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    fecha_nacimiento DATE,
    
    -- Dirección
    direccion VARCHAR(255),
    codigo_postal VARCHAR(10),
    ciudad VARCHAR(100),
    pais VARCHAR(100) DEFAULT 'España',
    telefono_emergencia VARCHAR(20),
    
    -- Información laboral
    fecha_contratacion DATE NOT NULL,
    cargo VARCHAR(50),
    departamento VARCHAR(255),
    salario DECIMAL(10,2),
    horas_contratadas INTEGER DEFAULT 40,
    tipo_contrato VARCHAR(50),
    
    -- Documentación y estado
    nss VARCHAR(20),
    documento_adjunto TEXT[] DEFAULT '{}',
    notas TEXT,
    activo BOOLEAN DEFAULT true,
    
    -- Constraint para DNI y email únicos por empresa
    CONSTRAINT employees_dni_company_unique UNIQUE (dni, company_id),
    CONSTRAINT employees_email_company_unique UNIQUE (email, company_id),
    
    CONSTRAINT employees_tipo_contrato_check CHECK (
        tipo_contrato IN ('indefinido', 'temporal', 'practicas', 'formacion')
    )
);

-- Índices para employees
CREATE INDEX idx_employees_company_id ON employees(company_id);
CREATE INDEX idx_employees_dni ON employees(dni);
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_activo ON employees(activo);
CREATE INDEX idx_employees_dni_company ON employees(dni, company_id);
CREATE INDEX idx_employees_email_company ON employees(email, company_id);

-- ========================================
-- 9. SUPPLIERS (PROVEEDORES) - MODIFICADA PARA MULTI-TENANCY
-- ========================================

CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Información básica
    nombre_proveedor VARCHAR(100) NOT NULL,
    contacto VARCHAR(100),
    telefono VARCHAR(20),
    email VARCHAR(100),
    sitio_web VARCHAR(100),
    
    -- Información fiscal
    direccion_fiscal VARCHAR(255),
    cif VARCHAR(13) NOT NULL,
    
    -- Configuraciones comerciales
    condiciones_pago VARCHAR(50),
    dias_credito INTEGER,
    cuenta_bancaria VARCHAR(20),
    moneda VARCHAR(3) DEFAULT 'EUR',
    plantilla_email TEXT,
    
    -- Estado
    fecha_registro DATE DEFAULT CURRENT_DATE,
    activo BOOLEAN DEFAULT true,
    
    -- Constraint para CIF único por empresa
    CONSTRAINT suppliers_cif_company_unique UNIQUE (cif, company_id)
);

-- Índices para suppliers
CREATE INDEX idx_suppliers_company_id ON suppliers(company_id);
CREATE INDEX idx_suppliers_cif ON suppliers(cif);
CREATE INDEX idx_suppliers_activo ON suppliers(activo);
CREATE INDEX idx_suppliers_cif_company ON suppliers(cif, company_id);

-- ========================================
-- 10. INVENTORY (INVENTARIO) - MODIFICADA PARA MULTI-TENANCY
-- ========================================

CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    id_proveedor UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    
    -- Información del producto
    nombre_producto VARCHAR(100) NOT NULL,
    descripcion TEXT,
    referencia VARCHAR(50),
    
    -- Stock
    cantidad_actual INTEGER NOT NULL CHECK (cantidad_actual >= 0),
    cantidad_minima INTEGER NOT NULL CHECK (cantidad_minima >= 0),
    
    -- Precios
    precio_unitario DECIMAL(10,2) NOT NULL,
    pvp DECIMAL(10,2) DEFAULT 0.00,
    
    -- Fechas
    fecha_actualizacion DATE DEFAULT CURRENT_DATE,
    
    -- Constraint para referencia única por empresa
    CONSTRAINT inventory_referencia_company_unique UNIQUE (referencia, company_id)
);

-- Índices para inventory
CREATE INDEX idx_inventory_company_id ON inventory(company_id);
CREATE INDEX idx_inventory_referencia ON inventory(referencia);
CREATE INDEX idx_inventory_proveedor ON inventory(id_proveedor);
CREATE INDEX idx_inventory_cantidad_actual ON inventory(cantidad_actual);
CREATE INDEX idx_inventory_referencia_company ON inventory(referencia, company_id);

-- ========================================
-- 11. SERVICES (SERVICIOS) - MODIFICADA PARA MULTI-TENANCY
-- ========================================

CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Información del servicio
    nombre_servicio VARCHAR(100) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(50),
    
    -- Configuración de precios
    precio_base DECIMAL(10,2),
    tipo_tarifa VARCHAR(50) NOT NULL,
    
    -- Tiempo
    duracion_estimada_minutos INTEGER,
    
    -- Estado y configuración
    requiere_profesional BOOLEAN DEFAULT true,
    activo BOOLEAN DEFAULT true,
    fecha_creacion DATE DEFAULT CURRENT_DATE,
    
    CONSTRAINT services_tipo_tarifa_check CHECK (
        tipo_tarifa IN ('fijo', 'por_hora', 'variable', 'por_nivel', 'mano_obra')
    )
);

-- Índices para services
CREATE INDEX idx_services_company_id ON services(company_id);
CREATE INDEX idx_services_activo ON services(activo);
CREATE INDEX idx_services_tipo_tarifa ON services(tipo_tarifa);

-- ========================================
-- 12. TABLAS ADICIONALES CON MULTI-TENANCY
-- ========================================

-- SERVICE_LEVELS (NIVELES DE SERVICIO)
CREATE TABLE service_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    id_servicio UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    
    nombre_nivel VARCHAR(50) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    tiempo_estimado_minutos INTEGER
);

CREATE INDEX idx_service_levels_company_id ON service_levels(company_id);
CREATE INDEX idx_service_levels_servicio ON service_levels(id_servicio);

-- EMPLOYEE_SERVICES (SERVICIOS DE EMPLEADOS)
CREATE TABLE employee_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    id_empleado UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    id_servicio UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    
    porcentaje_comision DECIMAL(5,2),
    
    CONSTRAINT employee_services_unique UNIQUE (id_empleado, id_servicio)
);

CREATE INDEX idx_employee_services_company_id ON employee_services(company_id);
CREATE INDEX idx_employee_services_empleado ON employee_services(id_empleado);
CREATE INDEX idx_employee_services_servicio ON employee_services(id_servicio);

-- PRODUCT_CODES (CÓDIGOS DE PRODUCTOS)
CREATE TABLE product_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    id_producto UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    
    codigo VARCHAR(100) NOT NULL,
    tipo_codigo VARCHAR(20) NOT NULL,
    fecha_creacion DATE DEFAULT CURRENT_DATE,
    
    CONSTRAINT product_codes_codigo_company_unique UNIQUE (codigo, company_id),
    CONSTRAINT product_codes_tipo_codigo_check CHECK (
        tipo_codigo IN ('barcode', 'qr', 'sku', 'interno')
    )
);

CREATE INDEX idx_product_codes_company_id ON product_codes(company_id);
CREATE INDEX idx_product_codes_producto ON product_codes(id_producto);
CREATE INDEX idx_product_codes_codigo ON product_codes(codigo);

-- ========================================
-- 13. SALES (VENTAS) - MODIFICADA PARA MULTI-TENANCY
-- ========================================

CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Información del documento
    numero_documento VARCHAR(20) NOT NULL,
    tipo_documento VARCHAR(20) NOT NULL,
    fecha_emision TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Referencias
    id_cliente UUID REFERENCES clients(id),
    id_empleado_vendedor UUID REFERENCES employees(id),
    id_usuario_registro UUID REFERENCES users(id),
    venta_relacionada UUID REFERENCES sales(id),
    
    -- Importes
    subtotal DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(10,2) DEFAULT 0,
    impuestos DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    
    -- Configuración fiscal
    tipo_iva VARCHAR(20),
    porcentaje_iva DECIMAL(5,2) DEFAULT 21.00,
    porcentaje_retencion DECIMAL(5,2) DEFAULT 0,
    
    -- Estado y pago
    metodo_pago VARCHAR(50),
    estado VARCHAR(20) NOT NULL,
    notas TEXT,
    
    -- Constraint para número de documento único por empresa
    CONSTRAINT sales_numero_documento_company_unique UNIQUE (numero_documento, company_id),
    
    CONSTRAINT sales_estado_check CHECK (
        estado IN ('pagado', 'pendiente', 'parcial', 'cancelado', 'devuelto')
    ),
    CONSTRAINT sales_tipo_documento_check CHECK (
        tipo_documento IN ('ticket', 'factura', 'presupuesto', 'abono')
    ),
    CONSTRAINT sales_tipo_iva_check CHECK (
        tipo_iva IN ('general', 'reducido', 'superreducido', 'exento')
    )
);

-- Índices para sales
CREATE INDEX idx_sales_company_id ON sales(company_id);
CREATE INDEX idx_sales_numero_documento ON sales(numero_documento);
CREATE INDEX idx_sales_fecha_emision ON sales(fecha_emision);
CREATE INDEX idx_sales_cliente ON sales(id_cliente);
CREATE INDEX idx_sales_estado ON sales(estado);
CREATE INDEX idx_sales_numero_documento_company ON sales(numero_documento, company_id);

-- ========================================
-- 14. DETALLES DE VENTAS
-- ========================================

-- SALE_PRODUCTS (PRODUCTOS EN VENTAS)
CREATE TABLE sale_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    id_venta UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    id_producto UUID NOT NULL REFERENCES inventory(id),
    
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    porcentaje_descuento DECIMAL(5,2) DEFAULT 0,
    porcentaje_impuesto DECIMAL(5,2) DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL
);

CREATE INDEX idx_sale_products_company_id ON sale_products(company_id);
CREATE INDEX idx_sale_products_venta ON sale_products(id_venta);
CREATE INDEX idx_sale_products_producto ON sale_products(id_producto);

-- SALE_SERVICES (SERVICIOS EN VENTAS)
CREATE TABLE sale_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    id_venta UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    id_servicio UUID NOT NULL REFERENCES services(id),
    id_empleado UUID REFERENCES employees(id),
    id_nivel_servicio UUID REFERENCES service_levels(id),
    
    cantidad INTEGER DEFAULT 1,
    horas_trabajadas DECIMAL(6,2),
    precio_unitario DECIMAL(10,2) NOT NULL,
    porcentaje_descuento DECIMAL(5,2) DEFAULT 0,
    porcentaje_impuesto DECIMAL(5,2) DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL,
    
    fecha_programada TIMESTAMP WITH TIME ZONE,
    fecha_completado TIMESTAMP WITH TIME ZONE,
    estado_servicio VARCHAR(20) DEFAULT 'completado',
    notas_servicio TEXT,
    
    CONSTRAINT sale_services_estado_servicio_check CHECK (
        estado_servicio IN ('completado', 'programado', 'en_progreso', 'cancelado', 'reprogramado')
    )
);

CREATE INDEX idx_sale_services_company_id ON sale_services(company_id);
CREATE INDEX idx_sale_services_venta ON sale_services(id_venta);
CREATE INDEX idx_sale_services_servicio ON sale_services(id_servicio);
CREATE INDEX idx_sale_services_empleado ON sale_services(id_empleado);

-- ========================================
-- 15. SISTEMA FINANCIERO
-- ========================================

-- EXPENSES (GASTOS)
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    tipo_gasto VARCHAR(50) NOT NULL,
    concepto VARCHAR(100) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    fecha_gasto DATE DEFAULT CURRENT_DATE,
    comentarios TEXT,
    
    CONSTRAINT expenses_tipo_gasto_check CHECK (
        tipo_gasto IN ('fijo', 'variable')
    )
);

CREATE INDEX idx_expenses_company_id ON expenses(company_id);
CREATE INDEX idx_expenses_fecha_gasto ON expenses(fecha_gasto);
CREATE INDEX idx_expenses_tipo_gasto ON expenses(tipo_gasto);

-- INCOME (INGRESOS)
CREATE TABLE income (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    fecha_ingreso DATE DEFAULT CURRENT_DATE,
    ingresos DECIMAL(10,2) NOT NULL,
    comentarios TEXT,
    concepto VARCHAR(100),
    categoria VARCHAR(100),
    metodo_ingreso VARCHAR(100)
);

CREATE INDEX idx_income_company_id ON income(company_id);
CREATE INDEX idx_income_fecha_ingreso ON income(fecha_ingreso);

-- ========================================
-- 16. SISTEMA DE PEDIDOS
-- ========================================

-- ORDERS (PEDIDOS)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    id_proveedor UUID NOT NULL REFERENCES suppliers(id),
    id_gasto UUID REFERENCES expenses(id),
    
    fecha_pedido TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_entrega_estimada TIMESTAMP WITH TIME ZONE,
    estado VARCHAR(50) NOT NULL,
    total DECIMAL(10,2),
    metodo_pago VARCHAR(50),
    comentarios TEXT
);

CREATE INDEX idx_orders_company_id ON orders(company_id);
CREATE INDEX idx_orders_proveedor ON orders(id_proveedor);
CREATE INDEX idx_orders_fecha_pedido ON orders(fecha_pedido);
CREATE INDEX idx_orders_estado ON orders(estado);

-- ORDER_DETAIL (DETALLES DE PEDIDO)
CREATE TABLE order_detail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    id_pedido UUID NOT NULL REFERENCES orders(id),
    id_producto UUID NOT NULL REFERENCES inventory(id),
    
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) GENERATED ALWAYS AS (cantidad::numeric * precio_unitario) STORED
);

CREATE INDEX idx_order_detail_company_id ON order_detail(company_id);
CREATE INDEX idx_order_detail_pedido ON order_detail(id_pedido);
CREATE INDEX idx_order_detail_producto ON order_detail(id_producto);

-- ========================================
-- 17. SISTEMA DE HORARIOS Y CITAS
-- ========================================

-- SHIFTS (HORARIOS)
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    id_empleado UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    fecha_inicio_semana DATE NOT NULL
);

CREATE INDEX idx_shifts_company_id ON shifts(company_id);
CREATE INDEX idx_shifts_empleado ON shifts(id_empleado);
CREATE INDEX idx_shifts_fecha_inicio ON shifts(fecha_inicio_semana);

-- SHIFT_INTERVALS (INTERVALOS DE HORARIO)
CREATE TABLE shift_intervals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    id_horario UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    
    dia_semana INTEGER CHECK (dia_semana >= 1 AND dia_semana <= 7),
    hora_entrada TIME,
    hora_salida TIME,
    
    CONSTRAINT unique_shift_interval_supabase UNIQUE (id_horario, dia_semana, hora_entrada)
);

CREATE INDEX idx_shift_intervals_company_id ON shift_intervals(company_id);
CREATE INDEX idx_shift_intervals_horario ON shift_intervals(id_horario);
CREATE INDEX idx_shift_intervals_dia_semana ON shift_intervals(dia_semana);

-- APPOINTMENTS (CITAS)
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    id_cliente UUID REFERENCES clients(id),
    id_empleado UUID REFERENCES employees(id),
    id_servicio UUID REFERENCES services(id),
    
    fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_fin TIMESTAMP WITH TIME ZONE NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente',
    notas TEXT,
    recordatorio_enviado BOOLEAN DEFAULT false,
    
    CONSTRAINT appointments_estado_check CHECK (
        estado IN ('pendiente', 'confirmada', 'completada', 'cancelada')
    )
);

CREATE INDEX idx_appointments_company_id ON appointments(company_id);
CREATE INDEX idx_appointments_cliente ON appointments(id_cliente);
CREATE INDEX idx_appointments_empleado ON appointments(id_empleado);
CREATE INDEX idx_appointments_fecha_inicio ON appointments(fecha_inicio);
CREATE INDEX idx_appointments_estado ON appointments(estado);

-- LEAVES (BAJAS)
CREATE TABLE leaves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    id_empleado UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    tipo_baja VARCHAR(50),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    comentarios TEXT
);

CREATE INDEX idx_leaves_company_id ON leaves(company_id);
CREATE INDEX idx_leaves_empleado ON leaves(id_empleado);
CREATE INDEX idx_leaves_fecha_inicio ON leaves(fecha_inicio);

-- ========================================
-- 18. FUNCIONES PARA AUTOMATIZACIÓN
-- ========================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para generar códigos de empresa únicos
CREATE OR REPLACE FUNCTION generate_company_code(company_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_code TEXT;
    counter INTEGER := 1;
    final_code TEXT;
BEGIN
    -- Limpiar el nombre y tomar los primeros 6 caracteres
    base_code := UPPER(REGEXP_REPLACE(company_name, '[^A-Za-z0-9]', '', 'g'));
    base_code := LEFT(base_code, 6);
    
    -- Si es muy corto, rellenar con números aleatorios
    IF LENGTH(base_code) < 4 THEN
        base_code := base_code || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    END IF;
    
    final_code := base_code;
    
    -- Asegurar unicidad
    WHILE EXISTS (SELECT 1 FROM companies WHERE company_code = final_code) LOOP
        final_code := base_code || LPAD(counter::TEXT, 2, '0');
        counter := counter + 1;
    END LOOP;
    
    RETURN final_code;
END;
$$ LANGUAGE plpgsql;

-- Función para generar códigos de invitación
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..10 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    
    -- Asegurar unicidad
    WHILE EXISTS (SELECT 1 FROM company_invitations WHERE invitation_code = result) LOOP
        result := '';
        FOR i IN 1..10 LOOP
            result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
        END LOOP;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 19. POLÍTICAS DE SEGURIDAD RLS (ROW LEVEL SECURITY)
-- ========================================

-- Habilitar RLS en todas las tablas principales
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE income ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_detail ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_intervals ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 20. POLÍTICAS BÁSICAS PARA MULTI-TENANCY
-- ========================================

-- Los usuarios solo pueden ver datos de su empresa
CREATE POLICY "Users can only see their company data" ON users
    FOR ALL USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY "Company isolation for clients" ON clients
    FOR ALL USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY "Company isolation for employees" ON employees
    FOR ALL USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY "Company isolation for suppliers" ON suppliers
    FOR ALL USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY "Company isolation for inventory" ON inventory
    FOR ALL USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY "Company isolation for services" ON services
    FOR ALL USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY "Company isolation for sales" ON sales
    FOR ALL USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY "Company isolation for expenses" ON expenses
    FOR ALL USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY "Company isolation for income" ON income
    FOR ALL USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY "Company isolation for alerts" ON alerts
    FOR ALL USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY "Company isolation for settings" ON settings
    FOR ALL USING (company_id = current_setting('app.current_company_id')::UUID);

-- Políticas para tablas de relación
CREATE POLICY "Company isolation for service_levels" ON service_levels
    FOR ALL USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY "Company isolation for employee_services" ON employee_services
    FOR ALL USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY "Company isolation for product_codes" ON product_codes
    FOR ALL USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY "Company isolation for sale_products" ON sale_products
    FOR ALL USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY "Company isolation for sale_services" ON sale_services
    FOR ALL USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY "Company isolation for orders" ON orders
    FOR ALL USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY "Company isolation for order_detail" ON order_detail
    FOR ALL USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY "Company isolation for shifts" ON shifts
    FOR ALL USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY "Company isolation for shift_intervals" ON shift_intervals
    FOR ALL USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY "Company isolation for appointments" ON appointments
    FOR ALL USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY "Company isolation for leaves" ON leaves
    FOR ALL USING (company_id = current_setting('app.current_company_id')::UUID);

-- ========================================
-- 21. FUNCIONES DE UTILIDAD PARA ESTADÍSTICAS
-- ========================================

-- Función para obtener estadísticas de uso de una empresa
CREATE OR REPLACE FUNCTION get_company_usage_stats(company_uuid UUID)
RETURNS JSON AS $$
DECLARE
    stats JSON;
BEGIN
    SELECT json_build_object(
        'users', (SELECT COUNT(*) FROM users WHERE company_id = company_uuid AND is_active = true),
        'clients', (SELECT COUNT(*) FROM clients WHERE company_id = company_uuid),
        'products', (SELECT COUNT(*) FROM inventory WHERE company_id = company_uuid),
        'employees', (SELECT COUNT(*) FROM employees WHERE company_id = company_uuid AND activo = true),
        'sales_this_month', (SELECT COUNT(*) FROM sales WHERE company_id = company_uuid AND fecha_emision >= date_trunc('month', CURRENT_DATE)),
        'revenue_this_month', (SELECT COALESCE(SUM(total), 0) FROM sales WHERE company_id = company_uuid AND fecha_emision >= date_trunc('month', CURRENT_DATE) AND estado = 'pagado'),
        'pending_appointments', (SELECT COUNT(*) FROM appointments WHERE company_id = company_uuid AND estado = 'pendiente' AND fecha_inicio > NOW()),
        'low_stock_products', (SELECT COUNT(*) FROM inventory WHERE company_id = company_uuid AND cantidad_actual <= cantidad_minima)
    ) INTO stats;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para validar límites de plan
CREATE OR REPLACE FUNCTION check_company_limits(company_uuid UUID, resource_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    company_record companies%ROWTYPE;
    current_usage INTEGER;
BEGIN
    SELECT * INTO company_record FROM companies WHERE id = company_uuid;
    
    CASE resource_type
        WHEN 'users' THEN
            SELECT COUNT(*) INTO current_usage FROM users WHERE company_id = company_uuid AND is_active = true;
            RETURN current_usage < company_record.max_users;
        WHEN 'clients' THEN
            SELECT COUNT(*) INTO current_usage FROM clients WHERE company_id = company_uuid;
            RETURN current_usage < company_record.max_clients;
        WHEN 'products' THEN
            SELECT COUNT(*) INTO current_usage FROM inventory WHERE company_id = company_uuid;
            RETURN current_usage < company_record.max_products;
        ELSE
            RETURN false;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 22. DATOS INICIALES DE EJEMPLO
-- ========================================

-- Crear una empresa de ejemplo
INSERT INTO companies (
    id,
    company_name,
    company_code,
    subscription_plan,
    company_address,
    company_phone,
    company_email,
    max_users,
    max_clients,
    max_products,
    max_storage_mb
) VALUES (
    uuid_generate_v4(),
    'EMPRESA DEMO',
    'DEMO01',
    'basic',
    'Calle Ejemplo 123, Madrid',
    '+34912345678',
    'info@empresademo.com',
    5,
    100,
    500,
    1000
);

-- ========================================
-- COMENTARIOS FINALES
-- ========================================

-- Esta migración incluye:
-- 1. ✅ Sistema completo de multi-tenancy con companies
-- 2. ✅ Usuarios vinculados a empresas con roles
-- 3. ✅ Sistema de invitaciones con códigos únicos
-- 4. ✅ Todas las tablas existentes adaptadas para multi-tenancy
-- 5. ✅ UUIDs como claves primarias (requisito de Supabase)
-- 6. ✅ Índices optimizados para consultas multi-tenant
-- 7. ✅ Row Level Security (RLS) configurado
-- 8. ✅ Políticas de seguridad para aislamiento de datos
-- 9. ✅ Funciones de utilidad para estadísticas y validaciones
-- 10. ✅ Triggers para automatización (updated_at)
-- 11. ✅ Constraints y validaciones de datos
-- 12. ✅ Configuración de límites por plan de suscripción

-- PRÓXIMOS PASOS:
-- 1. Ejecutar esta migración en Supabase
-- 2. Configurar autenticación de Supabase Auth
-- 3. Implementar middleware en el backend para establecer company_id
-- 4. Actualizar el frontend según el documento de implementación
-- 5. Migrar datos existentes si es necesario


-- WARNS:
-- [
--   {
--     "name": "function_search_path_mutable",
--     "title": "Function Search Path Mutable",
--     "level": "WARN",
--     "facing": "EXTERNAL",
--     "categories": [
--       "SECURITY"
--     ],
--     "description": "Detects functions where the search_path parameter is not set.",
--     "detail": "Function \\`public.check_company_limits\\` has a role mutable search_path",
--     "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable",
--     "metadata": {
--       "name": "check_company_limits",
--       "type": "function",
--       "schema": "public"
--     },
--     "cache_key": "function_search_path_mutable_public_check_company_limits_f8d2447041f116f08ace7c7318669985"
--   },
--   {
--     "name": "function_search_path_mutable",
--     "title": "Function Search Path Mutable",
--     "level": "WARN",
--     "facing": "EXTERNAL",
--     "categories": [
--       "SECURITY"
--     ],
--     "description": "Detects functions where the search_path parameter is not set.",
--     "detail": "Function \\`public.generate_invitation_code\\` has a role mutable search_path",
--     "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable",
--     "metadata": {
--       "name": "generate_invitation_code",
--       "type": "function",
--       "schema": "public"
--     },
--     "cache_key": "function_search_path_mutable_public_generate_invitation_code_85cf4b1ee6129a0ccd467df6e723f869"
--   },
--   {
--     "name": "function_search_path_mutable",
--     "title": "Function Search Path Mutable",
--     "level": "WARN",
--     "facing": "EXTERNAL",
--     "categories": [
--       "SECURITY"
--     ],
--     "description": "Detects functions where the search_path parameter is not set.",
--     "detail": "Function \\`public.update_updated_at_column\\` has a role mutable search_path",
--     "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable",
--     "metadata": {
--       "name": "update_updated_at_column",
--       "type": "function",
--       "schema": "public"
--     },
--     "cache_key": "function_search_path_mutable_public_update_updated_at_column_06bcf30ac3d0a7f279a54cbf228a7bec"
--   },
--   {
--     "name": "function_search_path_mutable",
--     "title": "Function Search Path Mutable",
--     "level": "WARN",
--     "facing": "EXTERNAL",
--     "categories": [
--       "SECURITY"
--     ],
--     "description": "Detects functions where the search_path parameter is not set.",
--     "detail": "Function \\`public.generate_company_code\\` has a role mutable search_path",
--     "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable",
--     "metadata": {
--       "name": "generate_company_code",
--       "type": "function",
--       "schema": "public"
--     },
--     "cache_key": "function_search_path_mutable_public_generate_company_code_eef54c7a5bd17812eb1f6d9b0c3fc39f"
--   },
--   {
--     "name": "function_search_path_mutable",
--     "title": "Function Search Path Mutable",
--     "level": "WARN",
--     "facing": "EXTERNAL",
--     "categories": [
--       "SECURITY"
--     ],
--     "description": "Detects functions where the search_path parameter is not set.",
--     "detail": "Function \\`public.get_company_usage_stats\\` has a role mutable search_path",
--     "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable",
--     "metadata": {
--       "name": "get_company_usage_stats",
--       "type": "function",
--       "schema": "public"
--     },
--     "cache_key": "function_search_path_mutable_public_get_company_usage_stats_3e14839ba0e24ef2a5a0cecc75d4d76c"
--   }
-- ]