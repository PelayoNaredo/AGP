--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

-- Started on 2025-08-08 13:38:55

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 220 (class 1259 OID 16403)
-- Name: settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settings (
    id_ajuste integer NOT NULL,
    nombre_local character varying(100) NOT NULL,
    direccion character varying(255) NOT NULL,
    telefono character varying(20),
    url_backend character varying(255),
    horario_apertura time without time zone,
    horario_cierre time without time zone,
    logo_local text,
    tema character varying(20),
    CONSTRAINT ajustes_tema_check CHECK (((tema)::text = ANY ((ARRAY['claro'::character varying, 'oscuro'::character varying])::text[])))
);


ALTER TABLE public.settings OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16402)
-- Name: ajustes_id_ajuste_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ajustes_id_ajuste_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ajustes_id_ajuste_seq OWNER TO postgres;

--
-- TOC entry 5161 (class 0 OID 0)
-- Dependencies: 219
-- Name: ajustes_id_ajuste_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ajustes_id_ajuste_seq OWNED BY public.settings.id_ajuste;


--
-- TOC entry 236 (class 1259 OID 16506)
-- Name: alerts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alerts (
    id_recordatorio integer NOT NULL,
    titulo character varying(100) NOT NULL,
    descripcion text,
    fecha_recordatorio timestamp without time zone NOT NULL,
    estado character varying(20),
    dias_anticipacion integer DEFAULT 0,
    recurrencia character varying(20),
    tipo character varying(50) NOT NULL,
    prioridad character varying(20) NOT NULL,
    CONSTRAINT alerts_prioridad_check CHECK (((prioridad)::text = ANY ((ARRAY['baja'::character varying, 'media'::character varying, 'alta'::character varying])::text[]))),
    CONSTRAINT alerts_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['inventario'::character varying, 'mantenimiento'::character varying, 'horario'::character varying, 'pago'::character varying, 'pedido'::character varying, 'empleado'::character varying, 'otros'::character varying])::text[]))),
    CONSTRAINT recordatorios_estado_check CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'completado'::character varying])::text[])))
);


ALTER TABLE public.alerts OWNER TO postgres;

--
-- TOC entry 260 (class 1259 OID 33268)
-- Name: appointments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.appointments (
    id_cita integer NOT NULL,
    id_cliente integer,
    id_empleado integer,
    id_servicio integer,
    fecha_inicio timestamp without time zone NOT NULL,
    fecha_fin timestamp without time zone NOT NULL,
    estado character varying(20) DEFAULT 'pendiente'::character varying,
    notas text,
    recordatorio_enviado boolean DEFAULT false,
    CONSTRAINT appointments_estado_check CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'confirmada'::character varying, 'completada'::character varying, 'cancelada'::character varying])::text[])))
);


ALTER TABLE public.appointments OWNER TO postgres;

--
-- TOC entry 259 (class 1259 OID 33267)
-- Name: appointments_id_cita_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.appointments_id_cita_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.appointments_id_cita_seq OWNER TO postgres;

--
-- TOC entry 5162 (class 0 OID 0)
-- Dependencies: 259
-- Name: appointments_id_cita_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.appointments_id_cita_seq OWNED BY public.appointments.id_cita;


--
-- TOC entry 226 (class 1259 OID 16440)
-- Name: leaves; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leaves (
    id_baja integer NOT NULL,
    id_empleado integer,
    tipo_baja character varying(50),
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    comentarios text
);


ALTER TABLE public.leaves OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16439)
-- Name: bajas_id_baja_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bajas_id_baja_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bajas_id_baja_seq OWNER TO postgres;

--
-- TOC entry 5163 (class 0 OID 0)
-- Dependencies: 225
-- Name: bajas_id_baja_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bajas_id_baja_seq OWNED BY public.leaves.id_baja;


--
-- TOC entry 244 (class 1259 OID 33103)
-- Name: clients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clients (
    id_cliente integer NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100),
    documento character varying(20) NOT NULL,
    direccion character varying(255) NOT NULL,
    codigo_postal character varying(10) NOT NULL,
    ciudad character varying(100),
    pais character varying(100) DEFAULT 'España'::character varying,
    telefono character varying(20),
    email character varying(100),
    razon_social character varying(200),
    regimen_fiscal character varying(50),
    descuento_preferencial numeric(5,2) DEFAULT 0,
    notas text,
    fecha_registro date DEFAULT CURRENT_DATE,
    fecha_ultima_compra date,
    tipo_cliente character varying(20) NOT NULL,
    tipo_documento character varying(10) NOT NULL,
    provincia character varying(50) NOT NULL,
    tipo_iva character varying(20) DEFAULT 'general'::character varying,
    CONSTRAINT clients_tipo_cliente_check CHECK (((tipo_cliente)::text = ANY ((ARRAY['particular'::character varying, 'empresa'::character varying, 'autonomo'::character varying])::text[]))),
    CONSTRAINT clients_tipo_documento_check CHECK (((tipo_documento)::text = ANY ((ARRAY['DNI'::character varying, 'NIF'::character varying, 'CIF'::character varying, 'NIE'::character varying, 'PASAPORTE'::character varying])::text[]))),
    CONSTRAINT clients_tipo_iva_check CHECK (((tipo_iva)::text = ANY ((ARRAY['general'::character varying, 'reducido'::character varying, 'superreducido'::character varying, 'exento'::character varying])::text[])))
);


ALTER TABLE public.clients OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 33102)
-- Name: clients_id_cliente_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.clients_id_cliente_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clients_id_cliente_seq OWNER TO postgres;

--
-- TOC entry 5164 (class 0 OID 0)
-- Dependencies: 243
-- Name: clients_id_cliente_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.clients_id_cliente_seq OWNED BY public.clients.id_cliente;


--
-- TOC entry 222 (class 1259 OID 16414)
-- Name: employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employees (
    id_empleado integer NOT NULL,
    nombre character varying(100) NOT NULL,
    dni character varying(20) NOT NULL,
    email character varying(100) NOT NULL,
    telefono character varying(20),
    fecha_contratacion date NOT NULL,
    cargo character varying(50),
    salario numeric(10,2),
    activo boolean DEFAULT true,
    documento_adjunto text[] DEFAULT '{}'::text[],
    nss character varying(20),
    telefono_emergencia character varying(20),
    direccion character varying(255),
    codigo_postal character varying(10),
    ciudad character varying(100),
    pais character varying(100) DEFAULT 'España'::character varying,
    fecha_nacimiento date,
    horas_contratadas integer DEFAULT 40 NOT NULL,
    tipo_contrato character varying(50),
    notas text,
    departamento character varying(255),
    CONSTRAINT employees_tipo_contrato_check CHECK (((tipo_contrato)::text = ANY ((ARRAY['indefinido'::character varying, 'temporal'::character varying, 'practicas'::character varying, 'formacion'::character varying])::text[])))
);


ALTER TABLE public.employees OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16413)
-- Name: empleados_id_empleado_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.empleados_id_empleado_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.empleados_id_empleado_seq OWNER TO postgres;

--
-- TOC entry 5165 (class 0 OID 0)
-- Dependencies: 221
-- Name: empleados_id_empleado_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.empleados_id_empleado_seq OWNED BY public.employees.id_empleado;


--
-- TOC entry 250 (class 1259 OID 33144)
-- Name: employee_services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_services (
    id_empleado_servicio integer NOT NULL,
    id_empleado integer,
    id_servicio integer,
    porcentaje_comision numeric(5,2)
);


ALTER TABLE public.employee_services OWNER TO postgres;

--
-- TOC entry 249 (class 1259 OID 33143)
-- Name: employee_services_id_empleado_servicio_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_services_id_empleado_servicio_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_services_id_empleado_servicio_seq OWNER TO postgres;

--
-- TOC entry 5166 (class 0 OID 0)
-- Dependencies: 249
-- Name: employee_services_id_empleado_servicio_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_services_id_empleado_servicio_seq OWNED BY public.employee_services.id_empleado_servicio;


--
-- TOC entry 232 (class 1259 OID 16480)
-- Name: expenses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expenses (
    id_gasto integer NOT NULL,
    tipo_gasto character varying(50) NOT NULL,
    concepto character varying(100) NOT NULL,
    monto numeric(10,2) NOT NULL,
    fecha_gasto date DEFAULT CURRENT_DATE,
    comentarios text,
    CONSTRAINT gastos_tipo_gasto_check CHECK (((tipo_gasto)::text = ANY ((ARRAY['fijo'::character varying, 'variable'::character varying])::text[])))
);


ALTER TABLE public.expenses OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 16479)
-- Name: gastos_id_gasto_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.gastos_id_gasto_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.gastos_id_gasto_seq OWNER TO postgres;

--
-- TOC entry 5167 (class 0 OID 0)
-- Dependencies: 231
-- Name: gastos_id_gasto_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.gastos_id_gasto_seq OWNED BY public.expenses.id_gasto;


--
-- TOC entry 224 (class 1259 OID 16428)
-- Name: shifts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shifts (
    id_horario integer NOT NULL,
    id_empleado integer,
    fecha_inicio_semana date NOT NULL
);


ALTER TABLE public.shifts OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16427)
-- Name: horarios_id_horario_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.horarios_id_horario_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.horarios_id_horario_seq OWNER TO postgres;

--
-- TOC entry 5168 (class 0 OID 0)
-- Dependencies: 223
-- Name: horarios_id_horario_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.horarios_id_horario_seq OWNED BY public.shifts.id_horario;


--
-- TOC entry 234 (class 1259 OID 16491)
-- Name: income; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.income (
    id_ingreso integer NOT NULL,
    fecha_ingreso date DEFAULT CURRENT_DATE,
    ingresos numeric(10,2) NOT NULL,
    comentarios text,
    concepto character varying(100),
    categoria character varying(100),
    metodo_ingreso character varying(100)
);


ALTER TABLE public.income OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 16490)
-- Name: ingresos_id_ingreso_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ingresos_id_ingreso_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ingresos_id_ingreso_seq OWNER TO postgres;

--
-- TOC entry 5169 (class 0 OID 0)
-- Dependencies: 233
-- Name: ingresos_id_ingreso_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ingresos_id_ingreso_seq OWNED BY public.income.id_ingreso;


--
-- TOC entry 230 (class 1259 OID 16463)
-- Name: inventory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory (
    id_producto integer NOT NULL,
    nombre_producto character varying(100) NOT NULL,
    descripcion text,
    cantidad_actual integer NOT NULL,
    cantidad_minima integer NOT NULL,
    precio_unitario numeric(10,2) NOT NULL,
    id_proveedor integer,
    fecha_actualizacion date DEFAULT CURRENT_DATE,
    referencia character varying(50),
    pvp numeric(10,2) DEFAULT 0.00,
    CONSTRAINT inventarios_cantidad_actual_check CHECK ((cantidad_actual >= 0)),
    CONSTRAINT inventarios_cantidad_minima_check CHECK ((cantidad_minima >= 0))
);


ALTER TABLE public.inventory OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16462)
-- Name: inventarios_id_producto_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inventarios_id_producto_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventarios_id_producto_seq OWNER TO postgres;

--
-- TOC entry 5170 (class 0 OID 0)
-- Dependencies: 229
-- Name: inventarios_id_producto_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inventarios_id_producto_seq OWNED BY public.inventory.id_producto;


--
-- TOC entry 240 (class 1259 OID 24611)
-- Name: order_detail; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_detail (
    id_detalle integer NOT NULL,
    id_pedido integer NOT NULL,
    id_producto integer NOT NULL,
    cantidad integer NOT NULL,
    precio_unitario numeric(10,2) NOT NULL,
    subtotal numeric(10,2) GENERATED ALWAYS AS (((cantidad)::numeric * precio_unitario)) STORED
);


ALTER TABLE public.order_detail OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 24610)
-- Name: order_detail_id_detalle_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_detail_id_detalle_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_detail_id_detalle_seq OWNER TO postgres;

--
-- TOC entry 5171 (class 0 OID 0)
-- Dependencies: 239
-- Name: order_detail_id_detalle_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_detail_id_detalle_seq OWNED BY public.order_detail.id_detalle;


--
-- TOC entry 238 (class 1259 OID 24591)
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id_pedido integer NOT NULL,
    id_proveedor integer NOT NULL,
    id_gasto integer,
    fecha_pedido timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_entrega_estimada timestamp without time zone,
    estado character varying(50) NOT NULL,
    total numeric(10,2),
    metodo_pago character varying(50),
    comentarios text
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 24590)
-- Name: orders_id_pedido_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_id_pedido_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_pedido_seq OWNER TO postgres;

--
-- TOC entry 5172 (class 0 OID 0)
-- Dependencies: 237
-- Name: orders_id_pedido_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_id_pedido_seq OWNED BY public.orders.id_pedido;


--
-- TOC entry 258 (class 1259 OID 33252)
-- Name: product_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_codes (
    id_codigo integer NOT NULL,
    id_producto integer,
    codigo character varying(100) NOT NULL,
    tipo_codigo character varying(20) NOT NULL,
    fecha_creacion date DEFAULT CURRENT_DATE,
    CONSTRAINT product_codes_tipo_codigo_check CHECK (((tipo_codigo)::text = ANY ((ARRAY['barcode'::character varying, 'qr'::character varying, 'sku'::character varying, 'interno'::character varying])::text[])))
);


ALTER TABLE public.product_codes OWNER TO postgres;

--
-- TOC entry 257 (class 1259 OID 33251)
-- Name: product_codes_id_codigo_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_codes_id_codigo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_codes_id_codigo_seq OWNER TO postgres;

--
-- TOC entry 5173 (class 0 OID 0)
-- Dependencies: 257
-- Name: product_codes_id_codigo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_codes_id_codigo_seq OWNED BY public.product_codes.id_codigo;


--
-- TOC entry 228 (class 1259 OID 16454)
-- Name: suppliers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.suppliers (
    id_proveedor integer NOT NULL,
    nombre_proveedor character varying(100) NOT NULL,
    contacto character varying(100),
    telefono character varying(20),
    email character varying(100),
    plantilla_email text,
    direccion_fiscal character varying(255),
    cif character varying(13) NOT NULL,
    condiciones_pago character varying(50),
    dias_credito integer,
    cuenta_bancaria character varying(20),
    moneda character varying(3) DEFAULT 'EUR'::character varying,
    sitio_web character varying(100),
    fecha_registro date DEFAULT CURRENT_DATE,
    activo boolean DEFAULT true
);


ALTER TABLE public.suppliers OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16453)
-- Name: proveedores_id_proveedor_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.proveedores_id_proveedor_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.proveedores_id_proveedor_seq OWNER TO postgres;

--
-- TOC entry 5174 (class 0 OID 0)
-- Dependencies: 227
-- Name: proveedores_id_proveedor_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.proveedores_id_proveedor_seq OWNED BY public.suppliers.id_proveedor;


--
-- TOC entry 235 (class 1259 OID 16505)
-- Name: recordatorios_id_recordatorio_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.recordatorios_id_recordatorio_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recordatorios_id_recordatorio_seq OWNER TO postgres;

--
-- TOC entry 5175 (class 0 OID 0)
-- Dependencies: 235
-- Name: recordatorios_id_recordatorio_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.recordatorios_id_recordatorio_seq OWNED BY public.alerts.id_recordatorio;


--
-- TOC entry 254 (class 1259 OID 33199)
-- Name: sale_products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sale_products (
    id_detalle_producto integer NOT NULL,
    id_venta integer,
    id_producto integer,
    cantidad integer NOT NULL,
    precio_unitario numeric(10,2) NOT NULL,
    porcentaje_descuento numeric(5,2) DEFAULT 0,
    porcentaje_impuesto numeric(5,2) DEFAULT 0,
    subtotal numeric(10,2) NOT NULL
);


ALTER TABLE public.sale_products OWNER TO postgres;

--
-- TOC entry 253 (class 1259 OID 33198)
-- Name: sale_products_id_detalle_producto_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sale_products_id_detalle_producto_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sale_products_id_detalle_producto_seq OWNER TO postgres;

--
-- TOC entry 5176 (class 0 OID 0)
-- Dependencies: 253
-- Name: sale_products_id_detalle_producto_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sale_products_id_detalle_producto_seq OWNED BY public.sale_products.id_detalle_producto;


--
-- TOC entry 256 (class 1259 OID 33218)
-- Name: sale_services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sale_services (
    id_detalle_servicio integer NOT NULL,
    id_venta integer,
    id_servicio integer,
    id_empleado integer,
    horas_trabajadas numeric(6,2),
    id_nivel_servicio integer,
    cantidad integer DEFAULT 1,
    precio_unitario numeric(10,2) NOT NULL,
    porcentaje_descuento numeric(5,2) DEFAULT 0,
    porcentaje_impuesto numeric(5,2) DEFAULT 0,
    fecha_programada timestamp without time zone,
    fecha_completado timestamp without time zone,
    estado_servicio character varying(20) DEFAULT 'completado'::character varying,
    subtotal numeric(10,2) NOT NULL,
    notas_servicio text,
    CONSTRAINT sale_services_estado_servicio_check CHECK (((estado_servicio)::text = ANY ((ARRAY['completado'::character varying, 'programado'::character varying, 'en_progreso'::character varying, 'cancelado'::character varying, 'reprogramado'::character varying])::text[])))
);


ALTER TABLE public.sale_services OWNER TO postgres;

--
-- TOC entry 255 (class 1259 OID 33217)
-- Name: sale_services_id_detalle_servicio_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sale_services_id_detalle_servicio_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sale_services_id_detalle_servicio_seq OWNER TO postgres;

--
-- TOC entry 5177 (class 0 OID 0)
-- Dependencies: 255
-- Name: sale_services_id_detalle_servicio_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sale_services_id_detalle_servicio_seq OWNED BY public.sale_services.id_detalle_servicio;


--
-- TOC entry 252 (class 1259 OID 33163)
-- Name: sales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sales (
    id_venta integer NOT NULL,
    numero_documento character varying(20) NOT NULL,
    tipo_documento character varying(20) NOT NULL,
    fecha_emision timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    id_cliente integer,
    id_empleado_vendedor integer,
    subtotal numeric(10,2) NOT NULL,
    descuento numeric(10,2) DEFAULT 0,
    impuestos numeric(10,2) DEFAULT 0,
    total numeric(10,2) NOT NULL,
    metodo_pago character varying(50),
    estado character varying(20) NOT NULL,
    notas text,
    venta_relacionada integer,
    id_usuario_registro integer,
    tipo_iva character varying(20),
    porcentaje_iva numeric(5,2) DEFAULT 21.00,
    porcentaje_retencion numeric(5,2) DEFAULT 0,
    CONSTRAINT sales_estado_check CHECK (((estado)::text = ANY ((ARRAY['pagado'::character varying, 'pendiente'::character varying, 'parcial'::character varying, 'cancelado'::character varying, 'devuelto'::character varying])::text[]))),
    CONSTRAINT sales_tipo_documento_check CHECK (((tipo_documento)::text = ANY ((ARRAY['ticket'::character varying, 'factura'::character varying, 'presupuesto'::character varying, 'abono'::character varying])::text[]))),
    CONSTRAINT sales_tipo_iva_check CHECK (((tipo_iva)::text = ANY ((ARRAY['general'::character varying, 'reducido'::character varying, 'superreducido'::character varying, 'exento'::character varying])::text[])))
);


ALTER TABLE public.sales OWNER TO postgres;

--
-- TOC entry 251 (class 1259 OID 33162)
-- Name: sales_id_venta_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sales_id_venta_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sales_id_venta_seq OWNER TO postgres;

--
-- TOC entry 5178 (class 0 OID 0)
-- Dependencies: 251
-- Name: sales_id_venta_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sales_id_venta_seq OWNED BY public.sales.id_venta;


--
-- TOC entry 248 (class 1259 OID 33130)
-- Name: service_levels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_levels (
    id_nivel integer NOT NULL,
    id_servicio integer,
    nombre_nivel character varying(50) NOT NULL,
    descripcion text,
    precio numeric(10,2) NOT NULL,
    tiempo_estimado_minutos integer
);


ALTER TABLE public.service_levels OWNER TO postgres;

--
-- TOC entry 247 (class 1259 OID 33129)
-- Name: service_levels_id_nivel_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.service_levels_id_nivel_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.service_levels_id_nivel_seq OWNER TO postgres;

--
-- TOC entry 5179 (class 0 OID 0)
-- Dependencies: 247
-- Name: service_levels_id_nivel_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.service_levels_id_nivel_seq OWNED BY public.service_levels.id_nivel;


--
-- TOC entry 246 (class 1259 OID 33117)
-- Name: services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.services (
    id_servicio integer NOT NULL,
    nombre_servicio character varying(100) NOT NULL,
    descripcion text,
    precio_base numeric(10,2),
    tipo_tarifa character varying(50) NOT NULL,
    duracion_estimada_minutos integer,
    categoria character varying(50),
    requiere_profesional boolean DEFAULT true,
    activo boolean DEFAULT true,
    fecha_creacion date DEFAULT CURRENT_DATE,
    CONSTRAINT services_tipo_tarifa_check CHECK (((tipo_tarifa)::text = ANY ((ARRAY['fijo'::character varying, 'por_hora'::character varying, 'variable'::character varying, 'por_nivel'::character varying, 'mano_obra'::character varying])::text[])))
);


ALTER TABLE public.services OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 33116)
-- Name: services_id_servicio_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.services_id_servicio_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.services_id_servicio_seq OWNER TO postgres;

--
-- TOC entry 5180 (class 0 OID 0)
-- Dependencies: 245
-- Name: services_id_servicio_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.services_id_servicio_seq OWNED BY public.services.id_servicio;


--
-- TOC entry 242 (class 1259 OID 32862)
-- Name: shift_intervals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shift_intervals (
    id_intervalo integer NOT NULL,
    id_horario integer,
    dia_semana integer,
    hora_entrada time without time zone,
    hora_salida time without time zone,
    CONSTRAINT shift_intervals_dia_semana_check CHECK (((dia_semana >= 1) AND (dia_semana <= 7)))
);


ALTER TABLE public.shift_intervals OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 32861)
-- Name: shift_intervals_id_intervalo_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.shift_intervals_id_intervalo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shift_intervals_id_intervalo_seq OWNER TO postgres;

--
-- TOC entry 5181 (class 0 OID 0)
-- Dependencies: 241
-- Name: shift_intervals_id_intervalo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.shift_intervals_id_intervalo_seq OWNED BY public.shift_intervals.id_intervalo;


--
-- TOC entry 218 (class 1259 OID 16390)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id_usuario integer NOT NULL,
    nombre character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    contrasena character varying(255) NOT NULL,
    rol character varying(50) NOT NULL,
    fecha_registro date DEFAULT CURRENT_DATE,
    CONSTRAINT usuarios_rol_check CHECK (((rol)::text = ANY ((ARRAY['admin'::character varying, 'empleado'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 16389)
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuarios_id_usuario_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_usuario_seq OWNER TO postgres;

--
-- TOC entry 5182 (class 0 OID 0)
-- Dependencies: 217
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_usuario_seq OWNED BY public.users.id_usuario;


--
-- TOC entry 4821 (class 2604 OID 16509)
-- Name: alerts id_recordatorio; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alerts ALTER COLUMN id_recordatorio SET DEFAULT nextval('public.recordatorios_id_recordatorio_seq'::regclass);


--
-- TOC entry 4855 (class 2604 OID 33271)
-- Name: appointments id_cita; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments ALTER COLUMN id_cita SET DEFAULT nextval('public.appointments_id_cita_seq'::regclass);


--
-- TOC entry 4828 (class 2604 OID 33106)
-- Name: clients id_cliente; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients ALTER COLUMN id_cliente SET DEFAULT nextval('public.clients_id_cliente_seq'::regclass);


--
-- TOC entry 4838 (class 2604 OID 33147)
-- Name: employee_services id_empleado_servicio; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_services ALTER COLUMN id_empleado_servicio SET DEFAULT nextval('public.employee_services_id_empleado_servicio_seq'::regclass);


--
-- TOC entry 4803 (class 2604 OID 16417)
-- Name: employees id_empleado; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees ALTER COLUMN id_empleado SET DEFAULT nextval('public.empleados_id_empleado_seq'::regclass);


--
-- TOC entry 4817 (class 2604 OID 16483)
-- Name: expenses id_gasto; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses ALTER COLUMN id_gasto SET DEFAULT nextval('public.gastos_id_gasto_seq'::regclass);


--
-- TOC entry 4819 (class 2604 OID 16494)
-- Name: income id_ingreso; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.income ALTER COLUMN id_ingreso SET DEFAULT nextval('public.ingresos_id_ingreso_seq'::regclass);


--
-- TOC entry 4814 (class 2604 OID 16466)
-- Name: inventory id_producto; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory ALTER COLUMN id_producto SET DEFAULT nextval('public.inventarios_id_producto_seq'::regclass);


--
-- TOC entry 4809 (class 2604 OID 16443)
-- Name: leaves id_baja; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leaves ALTER COLUMN id_baja SET DEFAULT nextval('public.bajas_id_baja_seq'::regclass);


--
-- TOC entry 4825 (class 2604 OID 24614)
-- Name: order_detail id_detalle; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_detail ALTER COLUMN id_detalle SET DEFAULT nextval('public.order_detail_id_detalle_seq'::regclass);


--
-- TOC entry 4823 (class 2604 OID 24594)
-- Name: orders id_pedido; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id_pedido SET DEFAULT nextval('public.orders_id_pedido_seq'::regclass);


--
-- TOC entry 4853 (class 2604 OID 33255)
-- Name: product_codes id_codigo; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_codes ALTER COLUMN id_codigo SET DEFAULT nextval('public.product_codes_id_codigo_seq'::regclass);


--
-- TOC entry 4845 (class 2604 OID 33202)
-- Name: sale_products id_detalle_producto; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale_products ALTER COLUMN id_detalle_producto SET DEFAULT nextval('public.sale_products_id_detalle_producto_seq'::regclass);


--
-- TOC entry 4848 (class 2604 OID 33221)
-- Name: sale_services id_detalle_servicio; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale_services ALTER COLUMN id_detalle_servicio SET DEFAULT nextval('public.sale_services_id_detalle_servicio_seq'::regclass);


--
-- TOC entry 4839 (class 2604 OID 33166)
-- Name: sales id_venta; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales ALTER COLUMN id_venta SET DEFAULT nextval('public.sales_id_venta_seq'::regclass);


--
-- TOC entry 4837 (class 2604 OID 33133)
-- Name: service_levels id_nivel; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_levels ALTER COLUMN id_nivel SET DEFAULT nextval('public.service_levels_id_nivel_seq'::regclass);


--
-- TOC entry 4833 (class 2604 OID 33120)
-- Name: services id_servicio; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services ALTER COLUMN id_servicio SET DEFAULT nextval('public.services_id_servicio_seq'::regclass);


--
-- TOC entry 4802 (class 2604 OID 16406)
-- Name: settings id_ajuste; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings ALTER COLUMN id_ajuste SET DEFAULT nextval('public.ajustes_id_ajuste_seq'::regclass);


--
-- TOC entry 4827 (class 2604 OID 32865)
-- Name: shift_intervals id_intervalo; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_intervals ALTER COLUMN id_intervalo SET DEFAULT nextval('public.shift_intervals_id_intervalo_seq'::regclass);


--
-- TOC entry 4808 (class 2604 OID 16431)
-- Name: shifts id_horario; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts ALTER COLUMN id_horario SET DEFAULT nextval('public.horarios_id_horario_seq'::regclass);


--
-- TOC entry 4810 (class 2604 OID 16457)
-- Name: suppliers id_proveedor; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers ALTER COLUMN id_proveedor SET DEFAULT nextval('public.proveedores_id_proveedor_seq'::regclass);


--
-- TOC entry 4800 (class 2604 OID 16393)
-- Name: users id_usuario; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id_usuario SET DEFAULT nextval('public.usuarios_id_usuario_seq'::regclass);


--
-- TOC entry 5131 (class 0 OID 16506)
-- Dependencies: 236
-- Data for Name: alerts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alerts (id_recordatorio, titulo, descripcion, fecha_recordatorio, estado, dias_anticipacion, recurrencia, tipo, prioridad) FROM stdin;
1	Revisión stock mensual	Realizar conteo físico de productos en almacén 3	2024-03-25 09:00:00	pendiente	0	\N	inventario	alta
4	Mantenimiento montacargas	Revisión trimestral sistema hidráulico	2024-04-01 07:00:00	pendiente	0	\N	mantenimiento	alta
3	Cambio turno personal	Ajustar horarios por mantenimiento preventivo	2024-03-20 08:00:00	completado	0	\N	horario	baja
5	Renovación suscripción software	Recordar renovación anual de licencia AGP 1.0	2024-04-15 02:00:00	\N	0	\N	empleado	baja
2	Vencimiento factura proveedor	Pago a ProveedorTech vence el 28/03 -  1,250.00€	2024-03-27 13:30:00	\N	0	\N	pago	media
\.


--
-- TOC entry 5155 (class 0 OID 33268)
-- Dependencies: 260
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.appointments (id_cita, id_cliente, id_empleado, id_servicio, fecha_inicio, fecha_fin, estado, notas, recordatorio_enviado) FROM stdin;
4	\N	7	3	2025-05-26 17:00:00	2025-05-26 17:30:00	cancelada		f
5	\N	6	4	2025-05-26 17:00:00	2025-05-26 17:30:00	cancelada		f
6	5	7	5	2025-05-26 20:30:00	2025-05-26 21:00:00	cancelada		f
3	5	6	4	2025-05-24 19:30:00	2025-05-24 20:00:00	cancelada		f
7	\N	6	3	2025-05-26 19:30:00	2025-05-26 20:00:00	pendiente		f
8	\N	7	\N	2025-05-27 10:30:00	2025-05-27 11:00:00	pendiente		f
9	\N	6	\N	2025-05-27 10:30:00	2025-05-27 11:00:00	pendiente		f
10	\N	6	\N	2025-05-27 10:30:00	2025-05-27 11:00:00	pendiente		f
11	\N	6	\N	2025-05-27 10:00:00	2025-05-27 12:00:00	pendiente		f
12	5	7	8	2025-05-30 16:00:00	2025-05-30 16:30:00	pendiente	GOGOGO	f
13	\N	6	\N	2025-07-30 14:00:00	2025-07-30 14:30:00	pendiente		f
14	\N	\N	\N	2025-07-30 14:00:00	2025-07-30 14:30:00	pendiente		f
15	\N	\N	4	2025-07-30 14:00:00	2025-07-30 14:30:00	pendiente		f
\.


--
-- TOC entry 5139 (class 0 OID 33103)
-- Dependencies: 244
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clients (id_cliente, nombre, apellido, documento, direccion, codigo_postal, ciudad, pais, telefono, email, razon_social, regimen_fiscal, descuento_preferencial, notas, fecha_registro, fecha_ultima_compra, tipo_cliente, tipo_documento, provincia, tipo_iva) FROM stdin;
5	Pepito	Grillo	123345876F	direccion adfadfadsf	12345	ciudad asdasd	España	12356753445	pepeg@gmail.com	\N	\N	0.00	asdasdasdasdasdads	2025-05-10	\N	particular	DNI	provincia asdasd	general
\.


--
-- TOC entry 5145 (class 0 OID 33144)
-- Dependencies: 250
-- Data for Name: employee_services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_services (id_empleado_servicio, id_empleado, id_servicio, porcentaje_comision) FROM stdin;
4	2	4	15.00
\.


--
-- TOC entry 5117 (class 0 OID 16414)
-- Dependencies: 222
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employees (id_empleado, nombre, dni, email, telefono, fecha_contratacion, cargo, salario, activo, documento_adjunto, nss, telefono_emergencia, direccion, codigo_postal, ciudad, pais, fecha_nacimiento, horas_contratadas, tipo_contrato, notas, departamento) FROM stdin;
6	Laila Garcia	99999999A	lailagar@gmail.com	71263512	2025-04-15	Jefa	999999.00	t	{1484bf1a-6e5d-42a7-9b61-8203c54fa6a3.pdf}	123223543534	626734983	Calle Oran 39	33211	Gijon	España	1999-11-30	40	indefinido	Es muy buena en su trabajo	Administración
2	Pedro Sánchez Herrero	87654321B	pedro@example.com	123986497	2022-09-10	Gerente	2500.00	f	{}	237846316548	569858123	Avenida del ladron	33208	Gijon	España	1987-12-10	20	practicas	Casi nos roba el salario	Contabilidad
7	Test	111111111	AMIAU@GMAIL.COM	873495629	2025-04-13	A MIAU	11111.00	t	{}	465426866845	458219766	Calle Falsa 123	28001	Madrid	España	1990-10-15	40	temporal	Miau miau miau miau	Desarrollo
\.


--
-- TOC entry 5127 (class 0 OID 16480)
-- Dependencies: 232
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expenses (id_gasto, tipo_gasto, concepto, monto, fecha_gasto, comentarios) FROM stdin;
1	fijo	Renta del local	1200.00	2024-03-01	Pago mensual de renta
2	variable	Compra Mercancias	2200.00	2025-04-15	Compra de Cables HDMI
3	fijo	Compra nómina	1293.47	2025-03-20	\N
4	variable	Compra alquiler	1449.74	2025-04-08	Pago urgente/autorizado por gerencia
5	fijo	Pago nómina	495.66	2025-03-20	Pago urgente/autorizado por gerencia
6	variable	Pago alquiler	1974.30	2025-02-25	\N
7	fijo	Pago impuestos	200.45	2025-04-14	\N
8	variable	Compra impuestos	1184.68	2025-03-20	Pago urgente/autorizado por gerencia
9	variable	Pago servicios	1887.06	2025-03-08	\N
10	variable	Pago logística	306.69	2025-02-26	\N
11	fijo	Pago alquiler	1163.00	2025-04-04	Pago urgente/autorizado por gerencia
12	variable	Pago alquiler	212.26	2025-02-27	\N
13	variable	Pago equipos	1804.13	2025-03-12	Pago urgente/autorizado por gerencia
14	fijo	Pago impuestos	1359.34	2025-03-12	Pago urgente/autorizado por gerencia
15	variable	Compra servicios	137.61	2025-03-07	Pago urgente/autorizado por gerencia
16	variable	Compra servicios	466.45	2025-02-21	\N
17	fijo	Pago equipos	1818.58	2025-03-27	\N
18	fijo	Compra publicidad	127.36	2025-02-24	\N
19	variable	Compra publicidad	1845.76	2025-04-03	Pago urgente/autorizado por gerencia
20	variable	Pago alquiler	519.04	2025-03-03	Pago urgente/autorizado por gerencia
21	variable	Compra impuestos	1349.67	2025-04-10	\N
22	variable	Pago servicios	949.74	2025-04-15	Pago urgente/autorizado por gerencia
23	variable	Compra logística	1617.95	2025-03-30	\N
24	fijo	Pago mantenimiento	1441.88	2025-04-12	Pago urgente/autorizado por gerencia
25	variable	Pago mantenimiento	1905.52	2025-03-31	\N
26	fijo	Compra publicidad	1087.12	2025-04-20	\N
27	variable	Compra logística	888.54	2025-04-08	\N
28	variable	Compra mantenimiento	239.58	2025-04-01	\N
29	fijo	Pago mantenimiento	1401.35	2025-02-27	\N
30	fijo	Pago logística	578.06	2025-03-31	\N
31	fijo	Compra mantenimiento	525.76	2025-04-15	\N
32	variable	Pago mantenimiento	1164.25	2025-03-13	\N
33	variable	Pago servicios	1097.52	2025-04-15	\N
34	fijo	Compra equipos	1432.57	2025-03-23	\N
35	fijo	Pago impuestos	1593.43	2025-03-09	Pago urgente/autorizado por gerencia
36	variable	Compra servicios	1469.00	2025-03-29	Pago urgente/autorizado por gerencia
37	variable	Pago impuestos	1087.42	2025-03-02	\N
38	variable	Compra materiales	1723.99	2025-03-25	\N
39	variable	Pago logística	1181.19	2025-03-13	\N
40	variable	Pago nómina	491.81	2025-02-28	Pago urgente/autorizado por gerencia
41	variable	Compra impuestos	1599.93	2025-02-24	\N
42	fijo	Pago materiales	413.86	2025-03-30	\N
43	variable	Gasto diario #1	138.80	2025-04-14	\N
44	variable	Gasto diario #2	88.61	2025-04-14	\N
45	variable	Gasto diario #3	410.01	2025-04-14	\N
46	variable	Gasto diario #4	498.02	2025-04-14	\N
47	variable	Gasto diario #5	346.65	2025-04-14	\N
48	variable	Gasto diario #6	170.10	2025-04-14	\N
49	variable	Gasto diario #7	472.48	2025-04-14	\N
50	variable	Gasto diario #8	485.94	2025-04-14	\N
51	variable	Gasto diario #1	196.25	2025-04-15	\N
52	variable	Gasto diario #2	382.60	2025-04-15	\N
53	variable	Gasto diario #3	408.43	2025-04-15	\N
54	variable	Gasto diario #4	361.25	2025-04-15	\N
55	variable	Gasto diario #1	135.92	2025-04-16	\N
56	variable	Gasto diario #1	308.61	2025-04-17	\N
57	variable	Gasto diario #2	302.32	2025-04-17	\N
58	variable	Gasto diario #3	451.86	2025-04-17	\N
59	variable	Gasto diario #4	91.99	2025-04-17	\N
60	variable	Gasto diario #5	390.57	2025-04-17	\N
61	variable	Gasto diario #6	384.48	2025-04-17	\N
62	variable	Gasto diario #1	113.74	2025-04-18	\N
63	variable	Gasto diario #2	85.58	2025-04-18	\N
64	variable	Gasto diario #3	334.14	2025-04-18	\N
65	variable	Gasto diario #1	171.68	2025-04-19	\N
66	variable	Gasto diario #2	317.91	2025-04-19	\N
67	variable	Gasto diario #3	247.48	2025-04-19	\N
68	variable	Gasto diario #4	340.21	2025-04-19	\N
69	variable	Gasto diario #5	449.19	2025-04-19	\N
70	variable	Gasto diario #1	392.41	2025-04-20	\N
71	variable	Gasto diario #2	386.06	2025-04-20	\N
72	fijo	Alquiler oficina	2500.00	2024-01-01	\N
73	fijo	Nómina empleados	18500.00	2024-01-05	\N
74	fijo	Seguro equipos	1200.00	2024-01-10	\N
75	fijo	Alquiler oficina	2500.00	2024-02-01	\N
76	fijo	Nómina empleados	18500.00	2024-02-05	\N
77	fijo	Licencia software	899.00	2024-02-15	\N
78	fijo	Vehiculo - mantenimiento	623.16	2024-03-30	Aprobado por gerencia
79	fijo	Almacén - mantenimiento	1497.41	2024-03-27	\N
80	fijo	Taller - materiales	1678.94	2024-03-25	\N
81	variable	Taller - limpieza	1070.53	2024-03-22	\N
82	variable	Taller - reparación	1944.85	2024-03-15	\N
83	fijo	Vehiculo - materiales	1409.41	2024-03-13	\N
84	fijo	Taller - materiales	214.18	2024-03-02	\N
85	fijo	Vehiculo - reparación	1166.16	2024-03-27	Aprobado por gerencia
86	variable	Taller - suministros	536.57	2024-03-06	\N
87	variable	Personal - reparación	221.72	2024-03-06	Aprobado por gerencia
88	variable	Personal - limpieza	242.00	2024-03-28	\N
89	variable	Personal - mantenimiento	1109.79	2024-03-08	\N
90	variable	Almacén - mantenimiento	464.11	2024-03-23	\N
91	fijo	Almacén - limpieza	511.31	2024-03-13	Aprobado por gerencia
92	fijo	Almacén - reparación	1999.47	2024-03-12	\N
93	fijo	Almacén - materiales	1831.67	2024-03-06	\N
94	variable	Personal - mantenimiento	818.69	2024-03-15	\N
95	variable	Almacén - mantenimiento	710.65	2024-03-27	\N
96	variable	Vehiculo - suministros	1640.18	2024-03-30	\N
97	variable	Taller - reparación	1305.60	2024-03-25	\N
98	variable	Almacén - limpieza	653.31	2024-03-12	\N
99	fijo	Almacén - materiales	1549.46	2024-03-19	\N
100	variable	Almacén - materiales	748.62	2024-03-31	Aprobado por gerencia
101	fijo	Taller - mantenimiento	1439.50	2024-03-16	\N
102	fijo	Almacén - reparación	973.24	2024-03-01	Aprobado por gerencia
103	variable	Personal - mantenimiento	360.65	2024-03-26	\N
104	fijo	Taller - reparación	1487.94	2024-03-10	\N
105	variable	Almacén - materiales	717.02	2024-03-06	\N
106	variable	Oficina - mantenimiento	1457.35	2024-03-10	\N
107	variable	Almacén - materiales	405.44	2024-03-26	Aprobado por gerencia
108	variable	Almacén - reparación	247.72	2024-03-17	Aprobado por gerencia
109	variable	Almacén - materiales	1575.53	2024-03-08	\N
110	fijo	Vehiculo - reparación	209.37	2024-03-04	\N
111	variable	Taller - limpieza	1482.03	2024-03-30	\N
112	variable	Vehiculo - materiales	294.50	2024-03-23	\N
113	fijo	Taller - reparación	403.49	2024-03-07	\N
114	fijo	Almacén - materiales	365.12	2024-03-08	\N
115	fijo	Vehiculo - materiales	303.02	2024-03-10	\N
116	variable	Personal - mantenimiento	226.98	2024-03-10	\N
117	variable	Taller - reparación	225.71	2024-03-24	Aprobado por gerencia
118	variable	Taller - mantenimiento	911.52	2024-03-04	\N
119	variable	Vehiculo - suministros	338.07	2024-03-16	Aprobado por gerencia
120	variable	Taller - materiales	461.72	2024-03-17	\N
121	fijo	Almacén - reparación	1820.66	2024-03-04	\N
122	variable	Personal - reparación	704.15	2024-03-04	\N
123	variable	Taller - limpieza	1091.40	2024-03-13	\N
124	variable	Vehiculo - reparación	666.86	2024-03-11	\N
125	fijo	Vehiculo - mantenimiento	602.94	2024-03-05	Aprobado por gerencia
126	fijo	Taller - suministros	912.02	2024-03-15	\N
127	variable	Almacén - reparación	1588.59	2024-03-10	\N
128	variable	Oficina - suministros	368.65	2024-03-17	\N
129	variable	Taller - materiales	1489.64	2024-03-04	Aprobado por gerencia
130	fijo	Almacén - mantenimiento	1748.59	2024-03-04	\N
131	variable	Personal - mantenimiento	1795.87	2024-03-04	\N
132	fijo	Personal - materiales	204.45	2024-03-12	\N
133	variable	Vehiculo - reparación	1640.32	2024-03-18	\N
134	fijo	Almacén - materiales	1401.55	2024-03-12	\N
135	fijo	Personal - limpieza	1781.10	2024-03-30	\N
136	fijo	Oficina - limpieza	1712.94	2024-03-29	\N
137	variable	Vehiculo - materiales	1056.00	2024-03-16	\N
138	variable	Vehiculo - reparación	932.71	2024-03-05	\N
139	variable	Vehiculo - mantenimiento	644.70	2024-03-25	\N
140	fijo	Vehiculo - mantenimiento	1503.78	2024-03-11	\N
141	variable	Vehiculo - materiales	1909.06	2024-03-15	\N
142	variable	Personal - mantenimiento	1196.16	2024-03-21	\N
143	fijo	Taller - materiales	1248.08	2024-03-31	\N
144	variable	Almacén - limpieza	779.87	2024-03-30	\N
145	fijo	Personal - mantenimiento	946.22	2024-03-29	\N
146	variable	Taller - limpieza	648.75	2024-03-22	\N
147	variable	Taller - mantenimiento	1733.18	2024-03-13	Aprobado por gerencia
148	variable	Vehiculo - limpieza	539.21	2024-03-07	\N
149	fijo	Almacén - reparación	1761.35	2024-03-25	Aprobado por gerencia
150	variable	Vehiculo - reparación	663.77	2024-03-07	\N
151	variable	Vehiculo - limpieza	576.10	2024-03-01	Aprobado por gerencia
152	fijo	Vehiculo - reparación	257.18	2024-03-18	\N
153	variable	Personal - suministros	332.92	2024-03-25	Aprobado por gerencia
154	fijo	Vehiculo - mantenimiento	1218.09	2024-03-16	Aprobado por gerencia
155	variable	Almacén - mantenimiento	335.77	2024-03-25	\N
156	variable	Taller - mantenimiento	1025.26	2024-03-16	Aprobado por gerencia
157	variable	Taller - materiales	500.11	2024-03-02	\N
158	variable	Oficina - limpieza	410.16	2024-03-23	Aprobado por gerencia
159	variable	Vehiculo - reparación	1196.68	2024-03-24	\N
160	variable	Taller - materiales	1378.39	2024-03-07	\N
161	variable	Vehiculo - limpieza	1483.72	2024-03-22	Aprobado por gerencia
162	fijo	Taller - reparación	1825.28	2024-03-16	\N
163	variable	Vehiculo - materiales	443.38	2024-03-02	Aprobado por gerencia
164	fijo	Vehiculo - mantenimiento	1939.72	2024-03-21	Aprobado por gerencia
165	variable	Almacén - reparación	1067.19	2024-03-08	\N
166	variable	Taller - limpieza	1793.60	2024-03-06	Aprobado por gerencia
167	variable	Taller - materiales	1284.96	2024-03-07	\N
168	fijo	Taller - limpieza	1546.69	2024-03-30	\N
169	variable	Vehiculo - materiales	262.06	2024-03-07	\N
170	variable	Taller - mantenimiento	1167.17	2024-03-19	\N
171	fijo	Taller - reparación	435.74	2024-03-06	\N
172	fijo	Alquiler nave industrial	4200.00	2024-03-01	\N
173	fijo	Nomina empleados	16700.00	2024-03-05	\N
174	fijo	Seguro maquinaria	895.00	2024-03-10	\N
175	fijo	Pago recurrente	895.00	2024-04-01	Gasto no presupuestado
176	fijo	Pago recurrente	895.00	2024-04-02	\N
177	fijo	Pago recurrente	895.00	2024-04-03	\N
178	fijo	Pago recurrente	16700.00	2024-04-04	\N
179	variable	Otros servicios	2293.12	2024-04-05	Gasto no presupuestado
180	variable	Transporte	725.73	2024-04-08	\N
181	variable	Transporte	1834.52	2024-04-09	Gasto no presupuestado
182	variable	Compra material	1852.82	2024-04-10	\N
183	variable	Transporte	2302.19	2024-04-11	\N
184	variable	Transporte	716.63	2024-04-12	\N
185	variable	Transporte	913.07	2024-04-15	\N
186	variable	Transporte	2239.88	2024-04-16	\N
187	variable	Otros servicios	412.02	2024-04-17	\N
188	variable	Compra material	1432.08	2024-04-18	\N
189	variable	Transporte	726.18	2024-04-19	Gasto no presupuestado
190	variable	Compra material	1496.70	2024-04-22	\N
191	variable	Compra material	1761.78	2024-04-23	\N
192	variable	Transporte	939.26	2024-04-24	\N
193	variable	Compra material	789.53	2024-04-25	\N
194	variable	Compra material	1680.84	2024-04-26	\N
195	variable	Transporte	974.45	2024-04-29	\N
196	variable	Transporte	998.49	2024-04-30	\N
197	fijo	blabla	9.00	2025-05-06	asdadasda
198	variable	compras test	10.00	2025-06-07	
\.


--
-- TOC entry 5129 (class 0 OID 16491)
-- Dependencies: 234
-- Data for Name: income; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.income (id_ingreso, fecha_ingreso, ingresos, comentarios, concepto, categoria, metodo_ingreso) FROM stdin;
4695	2025-04-25	123.00	Beneficios diarios	\N	\N	\N
4697	2025-05-07	10.00	blabla	\N	\N	\N
4700	2025-05-06	76.59	Cierre diario 2025-05-06: Cierre diario	\N	\N	\N
4696	2025-04-30	124.00	Dinerooo	\N	\N	\N
4698	2025-05-07	12.00	asdasdaqd	\N	\N	\N
4701	2025-05-14	294.76	Cierre diario 2025-05-14: Cierre sin devoluciones	\N	\N	\N
195	2025-04-01	66.44	\N	\N	\N	\N
196	2025-04-02	136.92	\N	\N	\N	\N
197	2025-04-03	134.31	\N	\N	\N	\N
198	2025-04-04	102.52	\N	\N	\N	\N
199	2025-04-05	145.94	\N	\N	\N	\N
200	2025-04-06	141.89	\N	\N	\N	\N
201	2025-04-07	71.54	\N	\N	\N	\N
202	2025-04-08	106.28	\N	\N	\N	\N
203	2025-04-09	119.88	\N	\N	\N	\N
204	2025-04-10	118.04	\N	\N	\N	\N
205	2025-04-11	92.52	\N	\N	\N	\N
206	2025-04-12	83.99	\N	\N	\N	\N
207	2025-04-13	128.64	\N	\N	\N	\N
208	2025-04-14	113.86	\N	\N	\N	\N
209	2025-04-15	132.76	\N	\N	\N	\N
210	2025-04-16	120.70	\N	\N	\N	\N
211	2025-04-17	136.60	\N	\N	\N	\N
212	2025-04-18	95.87	\N	\N	\N	\N
213	2025-04-19	140.50	\N	\N	\N	\N
214	2025-04-20	104.25	\N	\N	\N	\N
215	2025-04-21	142.44	\N	\N	\N	\N
216	2025-04-22	149.71	\N	\N	\N	\N
217	2025-04-23	148.53	\N	\N	\N	\N
218	2025-04-24	51.96	\N	\N	\N	\N
219	2025-04-25	85.48	\N	\N	\N	\N
220	2025-04-26	96.89	\N	\N	\N	\N
221	2025-04-27	117.72	\N	\N	\N	\N
222	2025-04-28	80.57	\N	\N	\N	\N
223	2025-04-29	105.16	\N	\N	\N	\N
224	2025-04-30	95.80	\N	\N	\N	\N
225	2025-04-01	98.24	\N	\N	\N	\N
226	2025-04-02	131.86	\N	\N	\N	\N
227	2025-04-03	132.55	\N	\N	\N	\N
228	2025-04-04	78.41	\N	\N	\N	\N
229	2025-04-05	128.51	\N	\N	\N	\N
230	2025-04-06	64.88	\N	\N	\N	\N
231	2025-04-07	50.14	\N	\N	\N	\N
232	2025-04-08	73.43	\N	\N	\N	\N
233	2025-04-09	96.85	\N	\N	\N	\N
234	2025-04-10	77.98	\N	\N	\N	\N
235	2025-04-11	97.71	\N	\N	\N	\N
236	2025-04-12	82.29	\N	\N	\N	\N
237	2025-04-13	149.90	\N	\N	\N	\N
238	2025-04-14	99.80	\N	\N	\N	\N
239	2025-04-15	56.52	\N	\N	\N	\N
240	2025-04-16	68.65	\N	\N	\N	\N
241	2025-04-17	145.89	\N	\N	\N	\N
242	2025-04-18	61.72	\N	\N	\N	\N
243	2025-04-19	50.95	\N	\N	\N	\N
244	2025-04-20	137.58	\N	\N	\N	\N
245	2025-04-21	133.02	\N	\N	\N	\N
246	2025-04-22	140.89	\N	\N	\N	\N
247	2025-04-23	99.72	\N	\N	\N	\N
248	2025-04-24	62.17	\N	\N	\N	\N
249	2025-04-25	50.64	\N	\N	\N	\N
250	2025-04-26	117.59	\N	\N	\N	\N
251	2025-04-27	75.88	\N	\N	\N	\N
252	2025-04-28	67.60	\N	\N	\N	\N
253	2025-04-29	129.26	\N	\N	\N	\N
254	2025-04-30	136.12	\N	\N	\N	\N
255	2025-04-01	94.89	\N	\N	\N	\N
256	2025-04-02	78.11	\N	\N	\N	\N
257	2025-04-03	64.83	\N	\N	\N	\N
258	2025-04-04	129.31	\N	\N	\N	\N
259	2025-04-05	86.96	\N	\N	\N	\N
260	2025-04-06	131.11	\N	\N	\N	\N
261	2025-04-07	90.80	\N	\N	\N	\N
262	2025-04-08	135.16	\N	\N	\N	\N
263	2025-04-09	139.27	\N	\N	\N	\N
264	2025-04-10	79.59	\N	\N	\N	\N
265	2025-04-11	84.06	\N	\N	\N	\N
266	2025-04-12	132.59	\N	\N	\N	\N
267	2025-04-13	64.54	\N	\N	\N	\N
268	2025-04-14	119.50	\N	\N	\N	\N
269	2025-04-15	73.52	\N	\N	\N	\N
270	2025-04-16	93.14	\N	\N	\N	\N
271	2025-04-17	116.01	\N	\N	\N	\N
272	2025-04-18	110.50	\N	\N	\N	\N
273	2025-04-19	94.88	\N	\N	\N	\N
274	2025-04-20	101.52	\N	\N	\N	\N
275	2025-04-21	56.04	\N	\N	\N	\N
276	2025-04-22	128.80	\N	\N	\N	\N
277	2025-04-23	55.56	\N	\N	\N	\N
278	2025-04-24	77.42	\N	\N	\N	\N
279	2025-04-25	96.25	\N	\N	\N	\N
280	2025-04-26	110.86	\N	\N	\N	\N
281	2025-04-27	116.81	\N	\N	\N	\N
282	2025-04-28	123.07	\N	\N	\N	\N
283	2025-04-29	128.04	\N	\N	\N	\N
284	2025-04-30	67.70	\N	\N	\N	\N
285	2025-04-01	93.76	\N	\N	\N	\N
286	2025-04-02	65.76	\N	\N	\N	\N
287	2025-04-03	139.66	\N	\N	\N	\N
288	2025-04-04	106.23	\N	\N	\N	\N
289	2025-04-05	144.20	\N	\N	\N	\N
290	2025-04-06	65.84	\N	\N	\N	\N
291	2025-04-07	147.76	\N	\N	\N	\N
292	2025-04-08	90.45	\N	\N	\N	\N
293	2025-04-09	132.88	\N	\N	\N	\N
294	2025-04-10	61.88	\N	\N	\N	\N
295	2025-04-11	108.57	\N	\N	\N	\N
296	2025-04-12	90.27	\N	\N	\N	\N
297	2025-04-13	107.64	\N	\N	\N	\N
298	2025-04-14	88.35	\N	\N	\N	\N
299	2025-04-15	141.26	\N	\N	\N	\N
300	2025-04-16	63.50	\N	\N	\N	\N
301	2025-04-17	83.99	\N	\N	\N	\N
302	2025-04-18	65.17	\N	\N	\N	\N
303	2025-04-19	83.60	\N	\N	\N	\N
304	2025-04-20	77.98	\N	\N	\N	\N
305	2025-04-21	63.51	\N	\N	\N	\N
306	2025-04-22	60.58	\N	\N	\N	\N
307	2025-04-23	112.56	\N	\N	\N	\N
308	2025-04-24	55.24	\N	\N	\N	\N
309	2025-04-25	53.48	\N	\N	\N	\N
310	2025-04-26	71.63	\N	\N	\N	\N
311	2025-04-27	141.59	\N	\N	\N	\N
312	2025-04-28	127.70	\N	\N	\N	\N
313	2025-04-29	107.62	\N	\N	\N	\N
314	2025-04-30	135.40	\N	\N	\N	\N
315	2025-04-01	58.85	\N	\N	\N	\N
316	2025-04-02	76.27	\N	\N	\N	\N
317	2025-04-03	103.62	\N	\N	\N	\N
318	2025-04-04	110.77	\N	\N	\N	\N
319	2025-04-05	121.77	\N	\N	\N	\N
320	2025-04-06	131.36	\N	\N	\N	\N
321	2025-04-07	78.37	\N	\N	\N	\N
322	2025-04-08	109.95	\N	\N	\N	\N
323	2025-04-09	65.51	\N	\N	\N	\N
324	2025-04-10	93.89	\N	\N	\N	\N
325	2025-04-11	109.47	\N	\N	\N	\N
326	2025-04-12	129.87	\N	\N	\N	\N
327	2025-04-13	140.79	\N	\N	\N	\N
328	2025-04-14	80.01	\N	\N	\N	\N
329	2025-04-15	131.45	\N	\N	\N	\N
330	2025-04-16	144.80	\N	\N	\N	\N
331	2025-04-17	70.17	\N	\N	\N	\N
332	2025-04-18	102.07	\N	\N	\N	\N
333	2025-04-19	92.01	\N	\N	\N	\N
334	2025-04-20	131.75	\N	\N	\N	\N
335	2025-04-21	68.30	\N	\N	\N	\N
336	2025-04-22	110.84	\N	\N	\N	\N
337	2025-04-23	75.46	\N	\N	\N	\N
338	2025-04-24	82.56	\N	\N	\N	\N
339	2025-04-25	143.57	\N	\N	\N	\N
340	2025-04-26	106.00	\N	\N	\N	\N
341	2025-04-27	118.34	\N	\N	\N	\N
342	2025-04-28	53.01	\N	\N	\N	\N
343	2025-04-29	113.84	\N	\N	\N	\N
344	2025-04-30	55.57	\N	\N	\N	\N
345	2025-04-01	54.84	\N	\N	\N	\N
346	2025-04-02	68.76	\N	\N	\N	\N
347	2025-04-03	148.75	\N	\N	\N	\N
348	2025-04-04	72.32	\N	\N	\N	\N
349	2025-04-05	68.45	\N	\N	\N	\N
350	2025-04-06	147.85	\N	\N	\N	\N
351	2025-04-07	57.01	\N	\N	\N	\N
352	2025-04-08	76.44	\N	\N	\N	\N
353	2025-04-09	143.92	\N	\N	\N	\N
354	2025-04-10	91.11	\N	\N	\N	\N
355	2025-04-11	145.33	\N	\N	\N	\N
356	2025-04-12	62.20	\N	\N	\N	\N
357	2025-04-13	140.69	\N	\N	\N	\N
358	2025-04-14	143.57	\N	\N	\N	\N
359	2025-04-15	148.54	\N	\N	\N	\N
360	2025-04-16	96.30	\N	\N	\N	\N
361	2025-04-17	60.04	\N	\N	\N	\N
362	2025-04-18	59.97	\N	\N	\N	\N
363	2025-04-19	95.25	\N	\N	\N	\N
364	2025-04-20	127.34	\N	\N	\N	\N
365	2025-04-21	99.97	\N	\N	\N	\N
366	2025-04-22	131.19	\N	\N	\N	\N
367	2025-04-23	67.80	\N	\N	\N	\N
368	2025-04-24	101.88	\N	\N	\N	\N
369	2025-04-25	72.71	\N	\N	\N	\N
370	2025-04-26	90.87	\N	\N	\N	\N
371	2025-04-27	115.28	\N	\N	\N	\N
372	2025-04-28	104.28	\N	\N	\N	\N
373	2025-04-29	105.75	\N	\N	\N	\N
374	2025-04-30	105.89	\N	\N	\N	\N
375	2025-04-01	127.30	\N	\N	\N	\N
376	2025-04-02	94.37	\N	\N	\N	\N
377	2025-04-03	80.82	\N	\N	\N	\N
378	2025-04-04	70.42	\N	\N	\N	\N
379	2025-04-05	134.65	\N	\N	\N	\N
380	2025-04-06	96.04	\N	\N	\N	\N
381	2025-04-07	98.27	\N	\N	\N	\N
382	2025-04-08	124.71	\N	\N	\N	\N
383	2025-04-09	144.74	\N	\N	\N	\N
384	2025-04-10	79.81	\N	\N	\N	\N
385	2025-04-11	117.84	\N	\N	\N	\N
386	2025-04-12	57.31	\N	\N	\N	\N
387	2025-04-13	138.76	\N	\N	\N	\N
388	2025-04-14	92.07	\N	\N	\N	\N
389	2025-04-15	52.46	\N	\N	\N	\N
390	2025-04-16	77.23	\N	\N	\N	\N
391	2025-04-17	141.64	\N	\N	\N	\N
392	2025-04-18	113.30	\N	\N	\N	\N
393	2025-04-19	73.27	\N	\N	\N	\N
394	2025-04-20	76.22	\N	\N	\N	\N
395	2025-04-21	91.26	\N	\N	\N	\N
396	2025-04-22	87.03	\N	\N	\N	\N
397	2025-04-23	116.65	\N	\N	\N	\N
398	2025-04-24	105.82	\N	\N	\N	\N
399	2025-04-25	86.44	\N	\N	\N	\N
400	2025-04-26	106.41	\N	\N	\N	\N
401	2025-04-27	51.06	\N	\N	\N	\N
402	2025-04-28	147.22	\N	\N	\N	\N
403	2025-04-29	105.29	\N	\N	\N	\N
404	2025-04-30	80.46	\N	\N	\N	\N
405	2025-04-01	72.57	\N	\N	\N	\N
406	2025-04-02	83.22	\N	\N	\N	\N
407	2025-04-03	132.97	\N	\N	\N	\N
408	2025-04-04	145.29	\N	\N	\N	\N
409	2025-04-05	134.62	\N	\N	\N	\N
410	2025-04-06	83.00	\N	\N	\N	\N
411	2025-04-07	124.45	\N	\N	\N	\N
412	2025-04-08	110.39	\N	\N	\N	\N
413	2025-04-09	50.99	\N	\N	\N	\N
414	2025-04-10	145.29	\N	\N	\N	\N
415	2025-04-11	117.22	\N	\N	\N	\N
416	2025-04-12	50.32	\N	\N	\N	\N
417	2025-04-13	123.77	\N	\N	\N	\N
418	2025-04-14	78.77	\N	\N	\N	\N
419	2025-04-15	96.69	\N	\N	\N	\N
420	2025-04-16	115.92	\N	\N	\N	\N
421	2025-04-17	136.28	\N	\N	\N	\N
422	2025-04-18	110.04	\N	\N	\N	\N
423	2025-04-19	91.45	\N	\N	\N	\N
424	2025-04-20	67.32	\N	\N	\N	\N
425	2025-04-21	67.19	\N	\N	\N	\N
426	2025-04-22	129.45	\N	\N	\N	\N
427	2025-04-23	149.26	\N	\N	\N	\N
428	2025-04-24	72.19	\N	\N	\N	\N
429	2025-04-25	149.00	\N	\N	\N	\N
430	2025-04-26	94.59	\N	\N	\N	\N
431	2025-04-27	135.02	\N	\N	\N	\N
432	2025-04-28	147.85	\N	\N	\N	\N
433	2025-04-29	56.52	\N	\N	\N	\N
434	2025-04-30	58.70	\N	\N	\N	\N
435	2025-04-01	69.96	\N	\N	\N	\N
436	2025-04-02	134.06	\N	\N	\N	\N
437	2025-04-03	137.25	\N	\N	\N	\N
438	2025-04-04	68.74	\N	\N	\N	\N
439	2025-04-05	127.79	\N	\N	\N	\N
440	2025-04-06	120.87	\N	\N	\N	\N
441	2025-04-07	110.31	\N	\N	\N	\N
442	2025-04-08	149.35	\N	\N	\N	\N
443	2025-04-09	82.34	\N	\N	\N	\N
444	2025-04-10	63.68	\N	\N	\N	\N
445	2025-04-11	143.19	\N	\N	\N	\N
446	2025-04-12	51.00	\N	\N	\N	\N
447	2025-04-13	127.94	\N	\N	\N	\N
448	2025-04-14	55.97	\N	\N	\N	\N
449	2025-04-15	84.51	\N	\N	\N	\N
450	2025-04-16	128.96	\N	\N	\N	\N
451	2025-04-17	148.90	\N	\N	\N	\N
452	2025-04-18	141.49	\N	\N	\N	\N
453	2025-04-19	94.01	\N	\N	\N	\N
454	2025-04-20	50.20	\N	\N	\N	\N
455	2025-04-21	86.78	\N	\N	\N	\N
456	2025-04-22	122.27	\N	\N	\N	\N
457	2025-04-23	81.21	\N	\N	\N	\N
458	2025-04-24	114.30	\N	\N	\N	\N
459	2025-04-25	111.23	\N	\N	\N	\N
460	2025-04-26	99.38	\N	\N	\N	\N
461	2025-04-27	106.97	\N	\N	\N	\N
462	2025-04-28	93.37	\N	\N	\N	\N
463	2025-04-29	141.29	\N	\N	\N	\N
464	2025-04-30	52.36	\N	\N	\N	\N
465	2025-04-01	108.20	\N	\N	\N	\N
466	2025-04-02	128.86	\N	\N	\N	\N
467	2025-04-03	144.67	\N	\N	\N	\N
468	2025-04-04	114.97	\N	\N	\N	\N
469	2025-04-05	108.99	\N	\N	\N	\N
470	2025-04-06	146.78	\N	\N	\N	\N
471	2025-04-07	89.92	\N	\N	\N	\N
472	2025-04-08	149.40	\N	\N	\N	\N
473	2025-04-09	141.37	\N	\N	\N	\N
474	2025-04-10	93.62	\N	\N	\N	\N
475	2025-04-11	139.16	\N	\N	\N	\N
476	2025-04-12	55.87	\N	\N	\N	\N
477	2025-04-13	78.67	\N	\N	\N	\N
478	2025-04-14	52.00	\N	\N	\N	\N
479	2025-04-15	50.39	\N	\N	\N	\N
480	2025-04-16	94.82	\N	\N	\N	\N
481	2025-04-17	64.04	\N	\N	\N	\N
482	2025-04-18	117.02	\N	\N	\N	\N
483	2025-04-19	64.46	\N	\N	\N	\N
484	2025-04-20	108.22	\N	\N	\N	\N
485	2025-04-21	132.86	\N	\N	\N	\N
486	2025-04-22	113.46	\N	\N	\N	\N
487	2025-04-23	87.35	\N	\N	\N	\N
488	2025-04-24	50.68	\N	\N	\N	\N
489	2025-04-25	144.96	\N	\N	\N	\N
490	2025-04-26	50.31	\N	\N	\N	\N
491	2025-04-27	149.22	\N	\N	\N	\N
492	2025-04-28	57.37	\N	\N	\N	\N
493	2025-04-29	105.92	\N	\N	\N	\N
494	2025-04-30	71.86	\N	\N	\N	\N
495	2025-04-01	69.55	\N	\N	\N	\N
496	2025-04-02	132.43	\N	\N	\N	\N
497	2025-04-03	55.59	\N	\N	\N	\N
498	2025-04-04	86.14	\N	\N	\N	\N
499	2025-04-05	133.23	\N	\N	\N	\N
500	2025-04-06	102.26	\N	\N	\N	\N
501	2025-04-07	119.62	\N	\N	\N	\N
502	2025-04-08	103.88	\N	\N	\N	\N
503	2025-04-09	88.57	\N	\N	\N	\N
504	2025-04-10	134.83	\N	\N	\N	\N
505	2025-04-11	59.46	\N	\N	\N	\N
506	2025-04-12	76.63	\N	\N	\N	\N
507	2025-04-13	64.50	\N	\N	\N	\N
508	2025-04-14	123.67	\N	\N	\N	\N
509	2025-04-15	62.54	\N	\N	\N	\N
510	2025-04-16	126.55	\N	\N	\N	\N
511	2025-04-17	102.01	\N	\N	\N	\N
512	2025-04-18	85.19	\N	\N	\N	\N
513	2025-04-19	138.27	\N	\N	\N	\N
514	2025-04-20	64.70	\N	\N	\N	\N
515	2025-04-21	102.71	\N	\N	\N	\N
516	2025-04-22	99.01	\N	\N	\N	\N
517	2025-04-23	147.17	\N	\N	\N	\N
518	2025-04-24	53.09	\N	\N	\N	\N
519	2025-04-25	144.16	\N	\N	\N	\N
520	2025-04-26	57.48	\N	\N	\N	\N
521	2025-04-27	72.62	\N	\N	\N	\N
522	2025-04-28	126.78	\N	\N	\N	\N
523	2025-04-29	114.86	\N	\N	\N	\N
524	2025-04-30	118.00	\N	\N	\N	\N
525	2025-04-01	59.53	\N	\N	\N	\N
526	2025-04-02	84.53	\N	\N	\N	\N
527	2025-04-03	120.04	\N	\N	\N	\N
528	2025-04-04	88.15	\N	\N	\N	\N
529	2025-04-05	88.67	\N	\N	\N	\N
530	2025-04-06	59.92	\N	\N	\N	\N
531	2025-04-07	140.89	\N	\N	\N	\N
532	2025-04-08	147.21	\N	\N	\N	\N
533	2025-04-09	103.62	\N	\N	\N	\N
534	2025-04-10	57.53	\N	\N	\N	\N
535	2025-04-11	108.24	\N	\N	\N	\N
536	2025-04-12	50.27	\N	\N	\N	\N
537	2025-04-13	63.88	\N	\N	\N	\N
538	2025-04-14	80.10	\N	\N	\N	\N
539	2025-04-15	115.07	\N	\N	\N	\N
540	2025-04-16	57.08	\N	\N	\N	\N
541	2025-04-17	98.14	\N	\N	\N	\N
542	2025-04-18	130.07	\N	\N	\N	\N
543	2025-04-19	135.25	\N	\N	\N	\N
544	2025-04-20	117.09	\N	\N	\N	\N
545	2025-04-21	67.92	\N	\N	\N	\N
546	2025-04-22	52.68	\N	\N	\N	\N
547	2025-04-23	148.12	\N	\N	\N	\N
548	2025-04-24	108.88	\N	\N	\N	\N
549	2025-04-25	82.36	\N	\N	\N	\N
550	2025-04-26	118.19	\N	\N	\N	\N
551	2025-04-27	133.62	\N	\N	\N	\N
552	2025-04-28	92.57	\N	\N	\N	\N
553	2025-04-29	55.43	\N	\N	\N	\N
554	2025-04-30	124.35	\N	\N	\N	\N
555	2025-04-01	93.56	\N	\N	\N	\N
556	2025-04-02	95.88	\N	\N	\N	\N
557	2025-04-03	77.70	\N	\N	\N	\N
558	2025-04-04	90.52	\N	\N	\N	\N
559	2025-04-05	106.12	\N	\N	\N	\N
560	2025-04-06	139.29	\N	\N	\N	\N
561	2025-04-07	68.92	\N	\N	\N	\N
562	2025-04-08	102.95	\N	\N	\N	\N
563	2025-04-09	111.06	\N	\N	\N	\N
564	2025-04-10	50.93	\N	\N	\N	\N
565	2025-04-11	68.70	\N	\N	\N	\N
566	2025-04-12	132.02	\N	\N	\N	\N
567	2025-04-13	81.93	\N	\N	\N	\N
568	2025-04-14	149.30	\N	\N	\N	\N
569	2025-04-15	102.01	\N	\N	\N	\N
570	2025-04-16	139.05	\N	\N	\N	\N
571	2025-04-17	101.75	\N	\N	\N	\N
572	2025-04-18	63.35	\N	\N	\N	\N
573	2025-04-19	137.42	\N	\N	\N	\N
574	2025-04-20	91.35	\N	\N	\N	\N
575	2025-04-21	84.97	\N	\N	\N	\N
576	2025-04-22	133.24	\N	\N	\N	\N
577	2025-04-23	144.95	\N	\N	\N	\N
578	2025-04-24	141.95	\N	\N	\N	\N
579	2025-04-25	106.27	\N	\N	\N	\N
580	2025-04-26	70.52	\N	\N	\N	\N
581	2025-04-27	88.81	\N	\N	\N	\N
582	2025-04-28	74.00	\N	\N	\N	\N
583	2025-04-29	56.71	\N	\N	\N	\N
584	2025-04-30	76.78	\N	\N	\N	\N
585	2025-04-01	76.65	\N	\N	\N	\N
586	2025-04-02	61.53	\N	\N	\N	\N
587	2025-04-03	104.37	\N	\N	\N	\N
588	2025-04-04	74.73	\N	\N	\N	\N
589	2025-04-05	135.15	\N	\N	\N	\N
590	2025-04-06	148.31	\N	\N	\N	\N
591	2025-04-07	127.73	\N	\N	\N	\N
592	2025-04-08	70.59	\N	\N	\N	\N
593	2025-04-09	92.80	\N	\N	\N	\N
594	2025-04-10	131.99	\N	\N	\N	\N
595	2025-04-11	97.59	\N	\N	\N	\N
596	2025-04-12	65.89	\N	\N	\N	\N
597	2025-04-13	143.94	\N	\N	\N	\N
598	2025-04-14	132.21	\N	\N	\N	\N
599	2025-04-15	88.47	\N	\N	\N	\N
600	2025-04-16	103.60	\N	\N	\N	\N
601	2025-04-17	71.87	\N	\N	\N	\N
602	2025-04-18	126.23	\N	\N	\N	\N
603	2025-04-19	127.67	\N	\N	\N	\N
604	2025-04-20	137.24	\N	\N	\N	\N
605	2025-04-21	106.39	\N	\N	\N	\N
606	2025-04-22	117.32	\N	\N	\N	\N
607	2025-04-23	78.83	\N	\N	\N	\N
608	2025-04-24	119.35	\N	\N	\N	\N
609	2025-04-25	101.77	\N	\N	\N	\N
610	2025-04-26	97.01	\N	\N	\N	\N
611	2025-04-27	111.39	\N	\N	\N	\N
612	2025-04-28	83.60	\N	\N	\N	\N
613	2025-04-29	55.00	\N	\N	\N	\N
614	2025-04-30	53.54	\N	\N	\N	\N
615	2025-04-01	64.64	\N	\N	\N	\N
616	2025-04-02	126.26	\N	\N	\N	\N
617	2025-04-03	113.52	\N	\N	\N	\N
618	2025-04-04	124.73	\N	\N	\N	\N
619	2025-04-05	51.69	\N	\N	\N	\N
620	2025-04-06	93.60	\N	\N	\N	\N
621	2025-04-07	144.42	\N	\N	\N	\N
622	2025-04-08	99.51	\N	\N	\N	\N
623	2025-04-09	84.69	\N	\N	\N	\N
624	2025-04-10	110.98	\N	\N	\N	\N
625	2025-04-11	94.12	\N	\N	\N	\N
626	2025-04-12	64.69	\N	\N	\N	\N
627	2025-04-13	82.06	\N	\N	\N	\N
628	2025-04-14	132.15	\N	\N	\N	\N
629	2025-04-15	90.86	\N	\N	\N	\N
630	2025-04-16	114.69	\N	\N	\N	\N
631	2025-04-17	70.87	\N	\N	\N	\N
632	2025-04-18	118.85	\N	\N	\N	\N
633	2025-04-19	62.49	\N	\N	\N	\N
634	2025-04-20	79.29	\N	\N	\N	\N
635	2025-04-21	140.85	\N	\N	\N	\N
636	2025-04-22	51.35	\N	\N	\N	\N
637	2025-04-23	141.60	\N	\N	\N	\N
638	2025-04-24	132.49	\N	\N	\N	\N
639	2025-04-25	57.61	\N	\N	\N	\N
640	2025-04-26	124.53	\N	\N	\N	\N
641	2025-04-27	102.05	\N	\N	\N	\N
642	2025-04-28	90.01	\N	\N	\N	\N
643	2025-04-29	97.20	\N	\N	\N	\N
644	2025-04-30	76.07	\N	\N	\N	\N
645	2025-04-01	54.44	\N	\N	\N	\N
646	2025-04-02	75.58	\N	\N	\N	\N
647	2025-04-03	149.01	\N	\N	\N	\N
648	2025-04-04	138.15	\N	\N	\N	\N
649	2025-04-05	51.16	\N	\N	\N	\N
650	2025-04-06	54.53	\N	\N	\N	\N
651	2025-04-07	74.71	\N	\N	\N	\N
652	2025-04-08	83.05	\N	\N	\N	\N
653	2025-04-09	62.27	\N	\N	\N	\N
654	2025-04-10	137.31	\N	\N	\N	\N
655	2025-04-11	122.46	\N	\N	\N	\N
656	2025-04-12	65.49	\N	\N	\N	\N
657	2025-04-13	64.50	\N	\N	\N	\N
658	2025-04-14	109.79	\N	\N	\N	\N
659	2025-04-15	132.97	\N	\N	\N	\N
660	2025-04-16	103.04	\N	\N	\N	\N
661	2025-04-17	103.88	\N	\N	\N	\N
662	2025-04-18	76.21	\N	\N	\N	\N
663	2025-04-19	52.32	\N	\N	\N	\N
664	2025-04-20	72.47	\N	\N	\N	\N
665	2025-04-21	109.82	\N	\N	\N	\N
666	2025-04-22	121.18	\N	\N	\N	\N
667	2025-04-23	98.05	\N	\N	\N	\N
668	2025-04-24	64.68	\N	\N	\N	\N
669	2025-04-25	94.08	\N	\N	\N	\N
670	2025-04-26	102.35	\N	\N	\N	\N
671	2025-04-27	56.43	\N	\N	\N	\N
672	2025-04-28	52.12	\N	\N	\N	\N
673	2025-04-29	80.32	\N	\N	\N	\N
674	2025-04-30	117.01	\N	\N	\N	\N
675	2025-04-01	59.95	\N	\N	\N	\N
676	2025-04-02	145.90	\N	\N	\N	\N
677	2025-04-03	125.47	\N	\N	\N	\N
678	2025-04-04	126.92	\N	\N	\N	\N
679	2025-04-05	82.12	\N	\N	\N	\N
680	2025-04-06	84.53	\N	\N	\N	\N
681	2025-04-07	143.61	\N	\N	\N	\N
682	2025-04-08	59.93	\N	\N	\N	\N
683	2025-04-09	55.11	\N	\N	\N	\N
684	2025-04-10	145.05	\N	\N	\N	\N
685	2025-04-11	108.46	\N	\N	\N	\N
686	2025-04-12	106.39	\N	\N	\N	\N
687	2025-04-13	76.50	\N	\N	\N	\N
688	2025-04-14	121.72	\N	\N	\N	\N
689	2025-04-15	92.89	\N	\N	\N	\N
690	2025-04-16	115.61	\N	\N	\N	\N
691	2025-04-17	107.62	\N	\N	\N	\N
692	2025-04-18	86.75	\N	\N	\N	\N
693	2025-04-19	146.21	\N	\N	\N	\N
694	2025-04-20	144.75	\N	\N	\N	\N
695	2025-04-21	93.99	\N	\N	\N	\N
696	2025-04-22	132.77	\N	\N	\N	\N
697	2025-04-23	66.52	\N	\N	\N	\N
698	2025-04-24	113.33	\N	\N	\N	\N
699	2025-04-25	68.79	\N	\N	\N	\N
700	2025-04-26	142.17	\N	\N	\N	\N
701	2025-04-27	64.71	\N	\N	\N	\N
702	2025-04-28	70.47	\N	\N	\N	\N
703	2025-04-29	130.20	\N	\N	\N	\N
704	2025-04-30	118.73	\N	\N	\N	\N
705	2025-04-01	143.23	\N	\N	\N	\N
706	2025-04-02	116.08	\N	\N	\N	\N
707	2025-04-03	74.52	\N	\N	\N	\N
708	2025-04-04	97.99	\N	\N	\N	\N
709	2025-04-05	57.86	\N	\N	\N	\N
710	2025-04-06	63.98	\N	\N	\N	\N
711	2025-04-07	144.55	\N	\N	\N	\N
712	2025-04-08	114.92	\N	\N	\N	\N
713	2025-04-09	133.97	\N	\N	\N	\N
714	2025-04-10	72.19	\N	\N	\N	\N
715	2025-04-11	139.67	\N	\N	\N	\N
716	2025-04-12	84.43	\N	\N	\N	\N
717	2025-04-13	57.10	\N	\N	\N	\N
718	2025-04-14	60.94	\N	\N	\N	\N
719	2025-04-15	140.76	\N	\N	\N	\N
720	2025-04-16	121.77	\N	\N	\N	\N
721	2025-04-17	149.10	\N	\N	\N	\N
722	2025-04-18	76.44	\N	\N	\N	\N
723	2025-04-19	139.95	\N	\N	\N	\N
724	2025-04-20	121.47	\N	\N	\N	\N
725	2025-04-21	136.99	\N	\N	\N	\N
726	2025-04-22	108.01	\N	\N	\N	\N
727	2025-04-23	79.21	\N	\N	\N	\N
728	2025-04-24	63.85	\N	\N	\N	\N
729	2025-04-25	145.78	\N	\N	\N	\N
730	2025-04-26	120.58	\N	\N	\N	\N
731	2025-04-27	50.35	\N	\N	\N	\N
732	2025-04-28	84.91	\N	\N	\N	\N
733	2025-04-29	128.93	\N	\N	\N	\N
734	2025-04-30	105.93	\N	\N	\N	\N
735	2025-04-01	91.82	\N	\N	\N	\N
736	2025-04-02	109.66	\N	\N	\N	\N
737	2025-04-03	92.40	\N	\N	\N	\N
738	2025-04-04	116.74	\N	\N	\N	\N
739	2025-04-05	50.67	\N	\N	\N	\N
740	2025-04-06	82.41	\N	\N	\N	\N
741	2025-04-07	62.58	\N	\N	\N	\N
742	2025-04-08	140.39	\N	\N	\N	\N
743	2025-04-09	118.15	\N	\N	\N	\N
744	2025-04-10	85.16	\N	\N	\N	\N
745	2025-04-11	77.05	\N	\N	\N	\N
746	2025-04-12	58.10	\N	\N	\N	\N
747	2025-04-13	52.83	\N	\N	\N	\N
748	2025-04-14	128.68	\N	\N	\N	\N
749	2025-04-15	98.44	\N	\N	\N	\N
750	2025-04-16	60.41	\N	\N	\N	\N
751	2025-04-17	122.50	\N	\N	\N	\N
752	2025-04-18	82.33	\N	\N	\N	\N
753	2025-04-19	107.00	\N	\N	\N	\N
754	2025-04-20	81.08	\N	\N	\N	\N
755	2025-04-21	128.14	\N	\N	\N	\N
756	2025-04-22	50.67	\N	\N	\N	\N
757	2025-04-23	88.63	\N	\N	\N	\N
758	2025-04-24	53.03	\N	\N	\N	\N
759	2025-04-25	126.09	\N	\N	\N	\N
760	2025-04-26	142.48	\N	\N	\N	\N
761	2025-04-27	115.35	\N	\N	\N	\N
762	2025-04-28	89.28	\N	\N	\N	\N
763	2025-04-29	126.02	\N	\N	\N	\N
764	2025-04-30	67.37	\N	\N	\N	\N
765	2025-04-01	58.52	\N	\N	\N	\N
766	2025-04-02	77.67	\N	\N	\N	\N
767	2025-04-03	66.89	\N	\N	\N	\N
768	2025-04-04	94.24	\N	\N	\N	\N
769	2025-04-05	58.89	\N	\N	\N	\N
770	2025-04-06	142.73	\N	\N	\N	\N
771	2025-04-07	66.40	\N	\N	\N	\N
772	2025-04-08	65.67	\N	\N	\N	\N
773	2025-04-09	60.81	\N	\N	\N	\N
774	2025-04-10	60.12	\N	\N	\N	\N
775	2025-04-11	124.97	\N	\N	\N	\N
776	2025-04-12	101.27	\N	\N	\N	\N
777	2025-04-13	55.80	\N	\N	\N	\N
778	2025-04-14	111.73	\N	\N	\N	\N
779	2025-04-15	63.72	\N	\N	\N	\N
780	2025-04-16	78.25	\N	\N	\N	\N
781	2025-04-17	54.93	\N	\N	\N	\N
782	2025-04-18	118.24	\N	\N	\N	\N
783	2025-04-19	79.25	\N	\N	\N	\N
784	2025-04-20	77.92	\N	\N	\N	\N
785	2025-04-21	70.00	\N	\N	\N	\N
786	2025-04-22	138.07	\N	\N	\N	\N
787	2025-04-23	89.57	\N	\N	\N	\N
788	2025-04-24	104.08	\N	\N	\N	\N
789	2025-04-25	147.13	\N	\N	\N	\N
790	2025-04-26	94.25	\N	\N	\N	\N
791	2025-04-27	134.62	\N	\N	\N	\N
792	2025-04-28	147.56	\N	\N	\N	\N
793	2025-04-29	101.54	\N	\N	\N	\N
794	2025-04-30	69.75	\N	\N	\N	\N
795	2025-04-01	98.48	\N	\N	\N	\N
796	2025-04-02	82.24	\N	\N	\N	\N
797	2025-04-03	96.99	\N	\N	\N	\N
798	2025-04-04	71.33	\N	\N	\N	\N
799	2025-04-05	144.85	\N	\N	\N	\N
800	2025-04-06	133.82	\N	\N	\N	\N
801	2025-04-07	116.70	\N	\N	\N	\N
802	2025-04-08	92.80	\N	\N	\N	\N
803	2025-04-09	117.32	\N	\N	\N	\N
804	2025-04-10	88.15	\N	\N	\N	\N
805	2025-04-11	58.14	\N	\N	\N	\N
806	2025-04-12	57.02	\N	\N	\N	\N
807	2025-04-13	66.57	\N	\N	\N	\N
808	2025-04-14	126.84	\N	\N	\N	\N
809	2025-04-15	108.51	\N	\N	\N	\N
810	2025-04-16	109.19	\N	\N	\N	\N
811	2025-04-17	119.68	\N	\N	\N	\N
812	2025-04-18	138.14	\N	\N	\N	\N
813	2025-04-19	105.92	\N	\N	\N	\N
814	2025-04-20	96.50	\N	\N	\N	\N
815	2025-04-21	84.85	\N	\N	\N	\N
816	2025-04-22	76.42	\N	\N	\N	\N
817	2025-04-23	77.31	\N	\N	\N	\N
818	2025-04-24	80.92	\N	\N	\N	\N
819	2025-04-25	66.92	\N	\N	\N	\N
820	2025-04-26	63.70	\N	\N	\N	\N
821	2025-04-27	80.41	\N	\N	\N	\N
822	2025-04-28	97.02	\N	\N	\N	\N
823	2025-04-29	111.19	\N	\N	\N	\N
824	2025-04-30	59.18	\N	\N	\N	\N
825	2025-04-01	111.64	\N	\N	\N	\N
826	2025-04-02	127.61	\N	\N	\N	\N
827	2025-04-03	136.69	\N	\N	\N	\N
828	2025-04-04	139.71	\N	\N	\N	\N
829	2025-04-05	115.28	\N	\N	\N	\N
830	2025-04-06	80.03	\N	\N	\N	\N
831	2025-04-07	71.42	\N	\N	\N	\N
832	2025-04-08	63.05	\N	\N	\N	\N
833	2025-04-09	61.74	\N	\N	\N	\N
834	2025-04-10	93.36	\N	\N	\N	\N
835	2025-04-11	60.62	\N	\N	\N	\N
836	2025-04-12	56.23	\N	\N	\N	\N
837	2025-04-13	116.89	\N	\N	\N	\N
838	2025-04-14	98.66	\N	\N	\N	\N
839	2025-04-15	130.34	\N	\N	\N	\N
840	2025-04-16	65.47	\N	\N	\N	\N
841	2025-04-17	141.62	\N	\N	\N	\N
842	2025-04-18	85.87	\N	\N	\N	\N
843	2025-04-19	114.56	\N	\N	\N	\N
844	2025-04-20	134.59	\N	\N	\N	\N
845	2025-04-21	61.00	\N	\N	\N	\N
846	2025-04-22	130.93	\N	\N	\N	\N
847	2025-04-23	145.90	\N	\N	\N	\N
848	2025-04-24	103.07	\N	\N	\N	\N
849	2025-04-25	72.64	\N	\N	\N	\N
850	2025-04-26	75.56	\N	\N	\N	\N
851	2025-04-27	109.08	\N	\N	\N	\N
852	2025-04-28	71.15	\N	\N	\N	\N
853	2025-04-29	92.08	\N	\N	\N	\N
854	2025-04-30	65.41	\N	\N	\N	\N
855	2025-04-01	76.50	\N	\N	\N	\N
856	2025-04-02	64.14	\N	\N	\N	\N
857	2025-04-03	130.63	\N	\N	\N	\N
858	2025-04-04	144.87	\N	\N	\N	\N
859	2025-04-05	55.77	\N	\N	\N	\N
860	2025-04-06	70.12	\N	\N	\N	\N
861	2025-04-07	136.37	\N	\N	\N	\N
862	2025-04-08	112.85	\N	\N	\N	\N
863	2025-04-09	116.44	\N	\N	\N	\N
864	2025-04-10	74.08	\N	\N	\N	\N
865	2025-04-11	133.50	\N	\N	\N	\N
866	2025-04-12	81.17	\N	\N	\N	\N
867	2025-04-13	79.76	\N	\N	\N	\N
868	2025-04-14	148.24	\N	\N	\N	\N
869	2025-04-15	67.70	\N	\N	\N	\N
870	2025-04-16	69.41	\N	\N	\N	\N
871	2025-04-17	109.94	\N	\N	\N	\N
872	2025-04-18	137.78	\N	\N	\N	\N
873	2025-04-19	95.95	\N	\N	\N	\N
874	2025-04-20	100.71	\N	\N	\N	\N
875	2025-04-21	81.60	\N	\N	\N	\N
876	2025-04-22	88.85	\N	\N	\N	\N
877	2025-04-23	74.31	\N	\N	\N	\N
878	2025-04-24	139.94	\N	\N	\N	\N
879	2025-04-25	120.84	\N	\N	\N	\N
880	2025-04-26	89.17	\N	\N	\N	\N
881	2025-04-27	136.55	\N	\N	\N	\N
882	2025-04-28	92.19	\N	\N	\N	\N
883	2025-04-29	93.42	\N	\N	\N	\N
884	2025-04-30	50.20	\N	\N	\N	\N
885	2025-04-01	149.27	\N	\N	\N	\N
886	2025-04-02	69.95	\N	\N	\N	\N
887	2025-04-03	140.21	\N	\N	\N	\N
888	2025-04-04	61.36	\N	\N	\N	\N
889	2025-04-05	85.86	\N	\N	\N	\N
890	2025-04-06	89.63	\N	\N	\N	\N
891	2025-04-07	131.90	\N	\N	\N	\N
892	2025-04-08	115.64	\N	\N	\N	\N
893	2025-04-09	77.05	\N	\N	\N	\N
894	2025-04-10	134.60	\N	\N	\N	\N
895	2025-04-11	126.98	\N	\N	\N	\N
896	2025-04-12	75.84	\N	\N	\N	\N
897	2025-04-13	54.40	\N	\N	\N	\N
898	2025-04-14	81.31	\N	\N	\N	\N
899	2025-04-15	119.59	\N	\N	\N	\N
900	2025-04-16	63.00	\N	\N	\N	\N
901	2025-04-17	149.48	\N	\N	\N	\N
902	2025-04-18	141.83	\N	\N	\N	\N
903	2025-04-19	90.15	\N	\N	\N	\N
904	2025-04-20	76.79	\N	\N	\N	\N
905	2025-04-21	118.23	\N	\N	\N	\N
906	2025-04-22	142.49	\N	\N	\N	\N
907	2025-04-23	92.72	\N	\N	\N	\N
908	2025-04-24	82.54	\N	\N	\N	\N
909	2025-04-25	77.67	\N	\N	\N	\N
910	2025-04-26	149.04	\N	\N	\N	\N
911	2025-04-27	93.34	\N	\N	\N	\N
912	2025-04-28	134.87	\N	\N	\N	\N
913	2025-04-29	138.32	\N	\N	\N	\N
914	2025-04-30	148.43	\N	\N	\N	\N
915	2025-04-01	97.90	\N	\N	\N	\N
916	2025-04-02	71.92	\N	\N	\N	\N
917	2025-04-03	101.97	\N	\N	\N	\N
918	2025-04-04	62.72	\N	\N	\N	\N
919	2025-04-05	53.46	\N	\N	\N	\N
920	2025-04-06	147.64	\N	\N	\N	\N
921	2025-04-07	105.28	\N	\N	\N	\N
922	2025-04-08	86.46	\N	\N	\N	\N
923	2025-04-09	57.04	\N	\N	\N	\N
924	2025-04-10	106.76	\N	\N	\N	\N
925	2025-04-11	58.54	\N	\N	\N	\N
926	2025-04-12	76.61	\N	\N	\N	\N
927	2025-04-13	104.26	\N	\N	\N	\N
928	2025-04-14	67.14	\N	\N	\N	\N
929	2025-04-15	144.52	\N	\N	\N	\N
930	2025-04-16	140.01	\N	\N	\N	\N
931	2025-04-17	81.93	\N	\N	\N	\N
932	2025-04-18	73.78	\N	\N	\N	\N
933	2025-04-19	138.34	\N	\N	\N	\N
934	2025-04-20	147.04	\N	\N	\N	\N
935	2025-04-21	84.88	\N	\N	\N	\N
936	2025-04-22	120.17	\N	\N	\N	\N
937	2025-04-23	124.23	\N	\N	\N	\N
938	2025-04-24	68.66	\N	\N	\N	\N
939	2025-04-25	65.80	\N	\N	\N	\N
940	2025-04-26	76.88	\N	\N	\N	\N
941	2025-04-27	96.83	\N	\N	\N	\N
942	2025-04-28	121.24	\N	\N	\N	\N
943	2025-04-29	143.69	\N	\N	\N	\N
944	2025-04-30	99.51	\N	\N	\N	\N
945	2025-04-01	124.04	\N	\N	\N	\N
946	2025-04-02	127.34	\N	\N	\N	\N
947	2025-04-03	83.08	\N	\N	\N	\N
948	2025-04-04	130.40	\N	\N	\N	\N
949	2025-04-05	98.85	\N	\N	\N	\N
950	2025-04-06	146.48	\N	\N	\N	\N
951	2025-04-07	133.17	\N	\N	\N	\N
952	2025-04-08	118.71	\N	\N	\N	\N
953	2025-04-09	64.59	\N	\N	\N	\N
954	2025-04-10	58.13	\N	\N	\N	\N
955	2025-04-11	95.28	\N	\N	\N	\N
956	2025-04-12	149.56	\N	\N	\N	\N
957	2025-04-13	136.79	\N	\N	\N	\N
958	2025-04-14	74.16	\N	\N	\N	\N
959	2025-04-15	119.05	\N	\N	\N	\N
960	2025-04-16	136.92	\N	\N	\N	\N
961	2025-04-17	62.57	\N	\N	\N	\N
962	2025-04-18	85.15	\N	\N	\N	\N
963	2025-04-19	111.50	\N	\N	\N	\N
964	2025-04-20	123.24	\N	\N	\N	\N
965	2025-04-21	93.87	\N	\N	\N	\N
966	2025-04-22	149.97	\N	\N	\N	\N
967	2025-04-23	133.15	\N	\N	\N	\N
968	2025-04-24	104.46	\N	\N	\N	\N
969	2025-04-25	77.73	\N	\N	\N	\N
970	2025-04-26	76.80	\N	\N	\N	\N
971	2025-04-27	93.90	\N	\N	\N	\N
972	2025-04-28	134.86	\N	\N	\N	\N
973	2025-04-29	86.71	\N	\N	\N	\N
974	2025-04-30	74.13	\N	\N	\N	\N
975	2025-04-01	60.45	\N	\N	\N	\N
976	2025-04-02	136.76	\N	\N	\N	\N
977	2025-04-03	141.07	\N	\N	\N	\N
978	2025-04-04	103.08	\N	\N	\N	\N
979	2025-04-05	91.64	\N	\N	\N	\N
980	2025-04-06	122.37	\N	\N	\N	\N
981	2025-04-07	100.45	\N	\N	\N	\N
982	2025-04-08	83.47	\N	\N	\N	\N
983	2025-04-09	85.97	\N	\N	\N	\N
984	2025-04-10	129.54	\N	\N	\N	\N
985	2025-04-11	69.47	\N	\N	\N	\N
986	2025-04-12	68.36	\N	\N	\N	\N
987	2025-04-13	51.85	\N	\N	\N	\N
988	2025-04-14	133.51	\N	\N	\N	\N
989	2025-04-15	148.91	\N	\N	\N	\N
990	2025-04-16	127.23	\N	\N	\N	\N
991	2025-04-17	101.59	\N	\N	\N	\N
992	2025-04-18	59.67	\N	\N	\N	\N
993	2025-04-19	51.43	\N	\N	\N	\N
994	2025-04-20	98.21	\N	\N	\N	\N
995	2025-04-21	101.59	\N	\N	\N	\N
996	2025-04-22	122.16	\N	\N	\N	\N
997	2025-04-23	74.53	\N	\N	\N	\N
998	2025-04-24	93.00	\N	\N	\N	\N
999	2025-04-25	88.02	\N	\N	\N	\N
1000	2025-04-26	115.11	\N	\N	\N	\N
1001	2025-04-27	63.08	\N	\N	\N	\N
1002	2025-04-28	107.53	\N	\N	\N	\N
1003	2025-04-29	147.79	\N	\N	\N	\N
1004	2025-04-30	67.54	\N	\N	\N	\N
1005	2025-04-01	130.51	\N	\N	\N	\N
1006	2025-04-02	131.70	\N	\N	\N	\N
1007	2025-04-03	85.08	\N	\N	\N	\N
1008	2025-04-04	134.07	\N	\N	\N	\N
1009	2025-04-05	80.17	\N	\N	\N	\N
1010	2025-04-06	59.98	\N	\N	\N	\N
1011	2025-04-07	95.91	\N	\N	\N	\N
1012	2025-04-08	127.24	\N	\N	\N	\N
1013	2025-04-09	54.28	\N	\N	\N	\N
1014	2025-04-10	137.79	\N	\N	\N	\N
1015	2025-04-11	79.94	\N	\N	\N	\N
1016	2025-04-12	70.32	\N	\N	\N	\N
1017	2025-04-13	61.71	\N	\N	\N	\N
1018	2025-04-14	146.11	\N	\N	\N	\N
1019	2025-04-15	91.69	\N	\N	\N	\N
1020	2025-04-16	133.48	\N	\N	\N	\N
1021	2025-04-17	127.80	\N	\N	\N	\N
1022	2025-04-18	62.26	\N	\N	\N	\N
1023	2025-04-19	51.39	\N	\N	\N	\N
1024	2025-04-20	66.91	\N	\N	\N	\N
1025	2025-04-21	137.97	\N	\N	\N	\N
1026	2025-04-22	60.66	\N	\N	\N	\N
1027	2025-04-23	59.83	\N	\N	\N	\N
1028	2025-04-24	62.35	\N	\N	\N	\N
1029	2025-04-25	92.80	\N	\N	\N	\N
1030	2025-04-26	132.83	\N	\N	\N	\N
1031	2025-04-27	128.95	\N	\N	\N	\N
1032	2025-04-28	114.50	\N	\N	\N	\N
1033	2025-04-29	93.85	\N	\N	\N	\N
1034	2025-04-30	119.81	\N	\N	\N	\N
1035	2025-04-01	90.98	\N	\N	\N	\N
1036	2025-04-02	148.73	\N	\N	\N	\N
1037	2025-04-03	133.37	\N	\N	\N	\N
1038	2025-04-04	55.12	\N	\N	\N	\N
1039	2025-04-05	111.16	\N	\N	\N	\N
1040	2025-04-06	61.12	\N	\N	\N	\N
1041	2025-04-07	94.84	\N	\N	\N	\N
1042	2025-04-08	95.17	\N	\N	\N	\N
1043	2025-04-09	64.45	\N	\N	\N	\N
1044	2025-04-10	65.41	\N	\N	\N	\N
1045	2025-04-11	147.72	\N	\N	\N	\N
1046	2025-04-12	92.65	\N	\N	\N	\N
1047	2025-04-13	61.59	\N	\N	\N	\N
1048	2025-04-14	136.89	\N	\N	\N	\N
1049	2025-04-15	55.97	\N	\N	\N	\N
1050	2025-04-16	121.03	\N	\N	\N	\N
1051	2025-04-17	107.89	\N	\N	\N	\N
1052	2025-04-18	119.74	\N	\N	\N	\N
1053	2025-04-19	63.75	\N	\N	\N	\N
1054	2025-04-20	124.38	\N	\N	\N	\N
1055	2025-04-21	82.28	\N	\N	\N	\N
1056	2025-04-22	73.19	\N	\N	\N	\N
1057	2025-04-23	114.51	\N	\N	\N	\N
1058	2025-04-24	135.85	\N	\N	\N	\N
1059	2025-04-25	103.46	\N	\N	\N	\N
1060	2025-04-26	55.30	\N	\N	\N	\N
1061	2025-04-27	75.42	\N	\N	\N	\N
1062	2025-04-28	101.67	\N	\N	\N	\N
1063	2025-04-29	136.36	\N	\N	\N	\N
1064	2025-04-30	82.11	\N	\N	\N	\N
1065	2025-04-01	93.21	\N	\N	\N	\N
1066	2025-04-02	102.19	\N	\N	\N	\N
1067	2025-04-03	60.94	\N	\N	\N	\N
1068	2025-04-04	77.24	\N	\N	\N	\N
1069	2025-04-05	82.30	\N	\N	\N	\N
1070	2025-04-06	116.74	\N	\N	\N	\N
1071	2025-04-07	66.49	\N	\N	\N	\N
1072	2025-04-08	80.41	\N	\N	\N	\N
1073	2025-04-09	149.22	\N	\N	\N	\N
1074	2025-04-10	124.02	\N	\N	\N	\N
1075	2025-04-11	55.15	\N	\N	\N	\N
1076	2025-04-12	99.50	\N	\N	\N	\N
1077	2025-04-13	109.16	\N	\N	\N	\N
1078	2025-04-14	89.19	\N	\N	\N	\N
1079	2025-04-15	71.63	\N	\N	\N	\N
1080	2025-04-16	55.11	\N	\N	\N	\N
1081	2025-04-17	78.70	\N	\N	\N	\N
1082	2025-04-18	117.60	\N	\N	\N	\N
1083	2025-04-19	71.93	\N	\N	\N	\N
1084	2025-04-20	125.54	\N	\N	\N	\N
1085	2025-04-21	57.34	\N	\N	\N	\N
1086	2025-04-22	117.23	\N	\N	\N	\N
1087	2025-04-23	107.69	\N	\N	\N	\N
1088	2025-04-24	113.29	\N	\N	\N	\N
1089	2025-04-25	112.42	\N	\N	\N	\N
1090	2025-04-26	91.60	\N	\N	\N	\N
1091	2025-04-27	130.05	\N	\N	\N	\N
1092	2025-04-28	108.88	\N	\N	\N	\N
1093	2025-04-29	68.57	\N	\N	\N	\N
1094	2025-04-30	131.70	\N	\N	\N	\N
1095	2025-03-01	89.50	\N	\N	\N	\N
1096	2025-03-02	105.15	\N	\N	\N	\N
1097	2025-03-03	107.05	\N	\N	\N	\N
1098	2025-03-04	147.75	\N	\N	\N	\N
1099	2025-03-05	107.00	\N	\N	\N	\N
1100	2025-03-06	78.42	\N	\N	\N	\N
1101	2025-03-07	81.39	\N	\N	\N	\N
1102	2025-03-08	134.98	\N	\N	\N	\N
1103	2025-03-09	132.56	\N	\N	\N	\N
1104	2025-03-10	109.09	\N	\N	\N	\N
1105	2025-03-11	121.69	\N	\N	\N	\N
1106	2025-03-12	103.84	\N	\N	\N	\N
1107	2025-03-13	55.96	\N	\N	\N	\N
1108	2025-03-14	122.66	\N	\N	\N	\N
1109	2025-03-15	117.20	\N	\N	\N	\N
1110	2025-03-16	69.35	\N	\N	\N	\N
1111	2025-03-17	149.02	\N	\N	\N	\N
1112	2025-03-18	105.69	\N	\N	\N	\N
1113	2025-03-19	100.94	\N	\N	\N	\N
1114	2025-03-20	137.94	\N	\N	\N	\N
1115	2025-03-21	133.40	\N	\N	\N	\N
1116	2025-03-22	70.28	\N	\N	\N	\N
1117	2025-03-23	99.78	\N	\N	\N	\N
1118	2025-03-24	68.39	\N	\N	\N	\N
1119	2025-03-25	73.35	\N	\N	\N	\N
1120	2025-03-26	66.04	\N	\N	\N	\N
1121	2025-03-27	88.86	\N	\N	\N	\N
1122	2025-03-28	109.08	\N	\N	\N	\N
1123	2025-03-29	147.97	\N	\N	\N	\N
1124	2025-03-30	102.35	\N	\N	\N	\N
1125	2025-03-31	100.17	\N	\N	\N	\N
1126	2025-03-01	65.76	\N	\N	\N	\N
1127	2025-03-02	102.46	\N	\N	\N	\N
1128	2025-03-03	100.37	\N	\N	\N	\N
1129	2025-03-04	135.98	\N	\N	\N	\N
1130	2025-03-05	93.02	\N	\N	\N	\N
1131	2025-03-06	80.60	\N	\N	\N	\N
1132	2025-03-07	133.70	\N	\N	\N	\N
1133	2025-03-08	51.90	\N	\N	\N	\N
1134	2025-03-09	115.97	\N	\N	\N	\N
1135	2025-03-10	126.33	\N	\N	\N	\N
1136	2025-03-11	94.64	\N	\N	\N	\N
1137	2025-03-12	60.09	\N	\N	\N	\N
1138	2025-03-13	93.45	\N	\N	\N	\N
1139	2025-03-14	52.94	\N	\N	\N	\N
1140	2025-03-15	71.32	\N	\N	\N	\N
1141	2025-03-16	114.96	\N	\N	\N	\N
1142	2025-03-17	65.95	\N	\N	\N	\N
1143	2025-03-18	105.48	\N	\N	\N	\N
1144	2025-03-19	54.92	\N	\N	\N	\N
1145	2025-03-20	58.31	\N	\N	\N	\N
1146	2025-03-21	75.87	\N	\N	\N	\N
1147	2025-03-22	98.08	\N	\N	\N	\N
1148	2025-03-23	99.25	\N	\N	\N	\N
1149	2025-03-24	147.81	\N	\N	\N	\N
1150	2025-03-25	72.23	\N	\N	\N	\N
1151	2025-03-26	102.95	\N	\N	\N	\N
1152	2025-03-27	54.07	\N	\N	\N	\N
1153	2025-03-28	144.71	\N	\N	\N	\N
1154	2025-03-29	86.53	\N	\N	\N	\N
1155	2025-03-30	77.15	\N	\N	\N	\N
1156	2025-03-31	53.77	\N	\N	\N	\N
1157	2025-03-01	111.61	\N	\N	\N	\N
1158	2025-03-02	91.64	\N	\N	\N	\N
1159	2025-03-03	83.06	\N	\N	\N	\N
1160	2025-03-04	137.04	\N	\N	\N	\N
1161	2025-03-05	125.43	\N	\N	\N	\N
1162	2025-03-06	134.29	\N	\N	\N	\N
1163	2025-03-07	112.73	\N	\N	\N	\N
1164	2025-03-08	57.55	\N	\N	\N	\N
1165	2025-03-09	82.93	\N	\N	\N	\N
1166	2025-03-10	100.08	\N	\N	\N	\N
1167	2025-03-11	122.90	\N	\N	\N	\N
1168	2025-03-12	51.28	\N	\N	\N	\N
1169	2025-03-13	89.26	\N	\N	\N	\N
1170	2025-03-14	136.62	\N	\N	\N	\N
1171	2025-03-15	140.43	\N	\N	\N	\N
1172	2025-03-16	53.13	\N	\N	\N	\N
1173	2025-03-17	133.94	\N	\N	\N	\N
1174	2025-03-18	111.21	\N	\N	\N	\N
1175	2025-03-19	96.86	\N	\N	\N	\N
1176	2025-03-20	119.46	\N	\N	\N	\N
1177	2025-03-21	111.31	\N	\N	\N	\N
1178	2025-03-22	124.86	\N	\N	\N	\N
1179	2025-03-23	70.39	\N	\N	\N	\N
1180	2025-03-24	109.39	\N	\N	\N	\N
1181	2025-03-25	111.80	\N	\N	\N	\N
1182	2025-03-26	63.17	\N	\N	\N	\N
1183	2025-03-27	124.16	\N	\N	\N	\N
1184	2025-03-28	87.94	\N	\N	\N	\N
1185	2025-03-29	72.29	\N	\N	\N	\N
1186	2025-03-30	53.57	\N	\N	\N	\N
1187	2025-03-31	129.45	\N	\N	\N	\N
1188	2025-03-01	121.42	\N	\N	\N	\N
1189	2025-03-02	136.52	\N	\N	\N	\N
1190	2025-03-03	97.75	\N	\N	\N	\N
1191	2025-03-04	98.00	\N	\N	\N	\N
1192	2025-03-05	143.17	\N	\N	\N	\N
1193	2025-03-06	74.99	\N	\N	\N	\N
1194	2025-03-07	109.60	\N	\N	\N	\N
1195	2025-03-08	105.54	\N	\N	\N	\N
1196	2025-03-09	115.90	\N	\N	\N	\N
1197	2025-03-10	87.55	\N	\N	\N	\N
1198	2025-03-11	50.89	\N	\N	\N	\N
1199	2025-03-12	138.39	\N	\N	\N	\N
1200	2025-03-13	58.44	\N	\N	\N	\N
1201	2025-03-14	74.08	\N	\N	\N	\N
1202	2025-03-15	118.26	\N	\N	\N	\N
1203	2025-03-16	136.74	\N	\N	\N	\N
1204	2025-03-17	72.94	\N	\N	\N	\N
1205	2025-03-18	128.44	\N	\N	\N	\N
1206	2025-03-19	64.07	\N	\N	\N	\N
1207	2025-03-20	80.04	\N	\N	\N	\N
1208	2025-03-21	69.86	\N	\N	\N	\N
1209	2025-03-22	81.76	\N	\N	\N	\N
1210	2025-03-23	90.94	\N	\N	\N	\N
1211	2025-03-24	146.22	\N	\N	\N	\N
1212	2025-03-25	136.71	\N	\N	\N	\N
1213	2025-03-26	116.91	\N	\N	\N	\N
1214	2025-03-27	135.77	\N	\N	\N	\N
1215	2025-03-28	119.42	\N	\N	\N	\N
1216	2025-03-29	60.96	\N	\N	\N	\N
1217	2025-03-30	109.95	\N	\N	\N	\N
1218	2025-03-31	100.63	\N	\N	\N	\N
1219	2025-03-01	87.31	\N	\N	\N	\N
1220	2025-03-02	80.84	\N	\N	\N	\N
1221	2025-03-03	134.59	\N	\N	\N	\N
1222	2025-03-04	143.83	\N	\N	\N	\N
1223	2025-03-05	62.96	\N	\N	\N	\N
1224	2025-03-06	59.41	\N	\N	\N	\N
1225	2025-03-07	114.10	\N	\N	\N	\N
1226	2025-03-08	120.53	\N	\N	\N	\N
1227	2025-03-09	132.21	\N	\N	\N	\N
1228	2025-03-10	134.22	\N	\N	\N	\N
1229	2025-03-11	122.70	\N	\N	\N	\N
1230	2025-03-12	101.70	\N	\N	\N	\N
1231	2025-03-13	114.63	\N	\N	\N	\N
1232	2025-03-14	68.49	\N	\N	\N	\N
1233	2025-03-15	119.76	\N	\N	\N	\N
1234	2025-03-16	115.75	\N	\N	\N	\N
1235	2025-03-17	93.27	\N	\N	\N	\N
1236	2025-03-18	56.14	\N	\N	\N	\N
1237	2025-03-19	81.99	\N	\N	\N	\N
1238	2025-03-20	124.95	\N	\N	\N	\N
1239	2025-03-21	146.97	\N	\N	\N	\N
1240	2025-03-22	80.79	\N	\N	\N	\N
1241	2025-03-23	125.31	\N	\N	\N	\N
1242	2025-03-24	134.48	\N	\N	\N	\N
1243	2025-03-25	61.32	\N	\N	\N	\N
1244	2025-03-26	148.65	\N	\N	\N	\N
1245	2025-03-27	85.98	\N	\N	\N	\N
1246	2025-03-28	63.24	\N	\N	\N	\N
1247	2025-03-29	125.34	\N	\N	\N	\N
1248	2025-03-30	137.96	\N	\N	\N	\N
1249	2025-03-31	87.88	\N	\N	\N	\N
1250	2025-03-01	61.72	\N	\N	\N	\N
1251	2025-03-02	75.35	\N	\N	\N	\N
1252	2025-03-03	63.34	\N	\N	\N	\N
1253	2025-03-04	114.25	\N	\N	\N	\N
1254	2025-03-05	107.17	\N	\N	\N	\N
1255	2025-03-06	126.40	\N	\N	\N	\N
1256	2025-03-07	69.99	\N	\N	\N	\N
1257	2025-03-08	133.71	\N	\N	\N	\N
1258	2025-03-09	95.89	\N	\N	\N	\N
1259	2025-03-10	147.82	\N	\N	\N	\N
1260	2025-03-11	68.20	\N	\N	\N	\N
1261	2025-03-12	132.55	\N	\N	\N	\N
1262	2025-03-13	54.13	\N	\N	\N	\N
1263	2025-03-14	63.11	\N	\N	\N	\N
1264	2025-03-15	58.74	\N	\N	\N	\N
1265	2025-03-16	50.06	\N	\N	\N	\N
1266	2025-03-17	64.31	\N	\N	\N	\N
1267	2025-03-18	106.24	\N	\N	\N	\N
1268	2025-03-19	109.02	\N	\N	\N	\N
1269	2025-03-20	102.43	\N	\N	\N	\N
1270	2025-03-21	117.99	\N	\N	\N	\N
1271	2025-03-22	137.42	\N	\N	\N	\N
1272	2025-03-23	106.48	\N	\N	\N	\N
1273	2025-03-24	119.64	\N	\N	\N	\N
1274	2025-03-25	98.52	\N	\N	\N	\N
1275	2025-03-26	105.14	\N	\N	\N	\N
1276	2025-03-27	145.46	\N	\N	\N	\N
1277	2025-03-28	53.26	\N	\N	\N	\N
1278	2025-03-29	146.91	\N	\N	\N	\N
1279	2025-03-30	72.15	\N	\N	\N	\N
1280	2025-03-31	60.87	\N	\N	\N	\N
1281	2025-03-01	61.01	\N	\N	\N	\N
1282	2025-03-02	122.37	\N	\N	\N	\N
1283	2025-03-03	137.27	\N	\N	\N	\N
1284	2025-03-04	108.93	\N	\N	\N	\N
1285	2025-03-05	116.19	\N	\N	\N	\N
1286	2025-03-06	69.15	\N	\N	\N	\N
1287	2025-03-07	131.14	\N	\N	\N	\N
1288	2025-03-08	82.04	\N	\N	\N	\N
1289	2025-03-09	89.44	\N	\N	\N	\N
1290	2025-03-10	116.64	\N	\N	\N	\N
1291	2025-03-11	119.88	\N	\N	\N	\N
1292	2025-03-12	53.54	\N	\N	\N	\N
1293	2025-03-13	55.04	\N	\N	\N	\N
1294	2025-03-14	101.68	\N	\N	\N	\N
1295	2025-03-15	62.11	\N	\N	\N	\N
1296	2025-03-16	131.52	\N	\N	\N	\N
1297	2025-03-17	52.16	\N	\N	\N	\N
1298	2025-03-18	103.88	\N	\N	\N	\N
1299	2025-03-19	88.18	\N	\N	\N	\N
1300	2025-03-20	146.50	\N	\N	\N	\N
1301	2025-03-21	101.44	\N	\N	\N	\N
1302	2025-03-22	98.60	\N	\N	\N	\N
1303	2025-03-23	148.14	\N	\N	\N	\N
1304	2025-03-24	125.68	\N	\N	\N	\N
1305	2025-03-25	84.86	\N	\N	\N	\N
1306	2025-03-26	71.46	\N	\N	\N	\N
1307	2025-03-27	70.95	\N	\N	\N	\N
1308	2025-03-28	139.92	\N	\N	\N	\N
1309	2025-03-29	62.85	\N	\N	\N	\N
1310	2025-03-30	146.21	\N	\N	\N	\N
1311	2025-03-31	85.22	\N	\N	\N	\N
1312	2025-03-01	109.87	\N	\N	\N	\N
1313	2025-03-02	112.62	\N	\N	\N	\N
1314	2025-03-03	84.38	\N	\N	\N	\N
1315	2025-03-04	66.92	\N	\N	\N	\N
1316	2025-03-05	108.91	\N	\N	\N	\N
1317	2025-03-06	111.22	\N	\N	\N	\N
1318	2025-03-07	123.74	\N	\N	\N	\N
1319	2025-03-08	78.82	\N	\N	\N	\N
1320	2025-03-09	110.83	\N	\N	\N	\N
1321	2025-03-10	90.12	\N	\N	\N	\N
1322	2025-03-11	81.43	\N	\N	\N	\N
1323	2025-03-12	74.40	\N	\N	\N	\N
1324	2025-03-13	93.86	\N	\N	\N	\N
1325	2025-03-14	90.01	\N	\N	\N	\N
1326	2025-03-15	102.02	\N	\N	\N	\N
1327	2025-03-16	138.47	\N	\N	\N	\N
1328	2025-03-17	99.69	\N	\N	\N	\N
1329	2025-03-18	73.51	\N	\N	\N	\N
1330	2025-03-19	123.44	\N	\N	\N	\N
1331	2025-03-20	108.38	\N	\N	\N	\N
1332	2025-03-21	140.83	\N	\N	\N	\N
1333	2025-03-22	59.84	\N	\N	\N	\N
1334	2025-03-23	123.51	\N	\N	\N	\N
1335	2025-03-24	90.49	\N	\N	\N	\N
1336	2025-03-25	50.02	\N	\N	\N	\N
1337	2025-03-26	106.27	\N	\N	\N	\N
1338	2025-03-27	96.34	\N	\N	\N	\N
1339	2025-03-28	128.38	\N	\N	\N	\N
1340	2025-03-29	64.65	\N	\N	\N	\N
1341	2025-03-30	119.88	\N	\N	\N	\N
1342	2025-03-31	91.94	\N	\N	\N	\N
1343	2025-03-01	75.74	\N	\N	\N	\N
1344	2025-03-02	110.59	\N	\N	\N	\N
1345	2025-03-03	139.14	\N	\N	\N	\N
1346	2025-03-04	58.54	\N	\N	\N	\N
1347	2025-03-05	87.94	\N	\N	\N	\N
1348	2025-03-06	120.84	\N	\N	\N	\N
1349	2025-03-07	91.42	\N	\N	\N	\N
1350	2025-03-08	57.57	\N	\N	\N	\N
1351	2025-03-09	130.42	\N	\N	\N	\N
1352	2025-03-10	59.16	\N	\N	\N	\N
1353	2025-03-11	145.82	\N	\N	\N	\N
1354	2025-03-12	72.84	\N	\N	\N	\N
1355	2025-03-13	108.02	\N	\N	\N	\N
1356	2025-03-14	86.83	\N	\N	\N	\N
1357	2025-03-15	95.05	\N	\N	\N	\N
1358	2025-03-16	147.16	\N	\N	\N	\N
1359	2025-03-17	124.10	\N	\N	\N	\N
1360	2025-03-18	62.61	\N	\N	\N	\N
1361	2025-03-19	62.51	\N	\N	\N	\N
1362	2025-03-20	140.70	\N	\N	\N	\N
1363	2025-03-21	125.07	\N	\N	\N	\N
1364	2025-03-22	60.34	\N	\N	\N	\N
1365	2025-03-23	104.94	\N	\N	\N	\N
1366	2025-03-24	76.22	\N	\N	\N	\N
1367	2025-03-25	63.34	\N	\N	\N	\N
1368	2025-03-26	141.15	\N	\N	\N	\N
1369	2025-03-27	110.68	\N	\N	\N	\N
1370	2025-03-28	148.05	\N	\N	\N	\N
1371	2025-03-29	110.84	\N	\N	\N	\N
1372	2025-03-30	82.43	\N	\N	\N	\N
1373	2025-03-31	110.68	\N	\N	\N	\N
1374	2025-03-01	78.72	\N	\N	\N	\N
1375	2025-03-02	136.42	\N	\N	\N	\N
1376	2025-03-03	50.58	\N	\N	\N	\N
1377	2025-03-04	66.78	\N	\N	\N	\N
1378	2025-03-05	68.56	\N	\N	\N	\N
1379	2025-03-06	81.27	\N	\N	\N	\N
1380	2025-03-07	85.51	\N	\N	\N	\N
1381	2025-03-08	133.44	\N	\N	\N	\N
1382	2025-03-09	90.69	\N	\N	\N	\N
1383	2025-03-10	111.27	\N	\N	\N	\N
1384	2025-03-11	103.48	\N	\N	\N	\N
1385	2025-03-12	75.32	\N	\N	\N	\N
1386	2025-03-13	107.71	\N	\N	\N	\N
1387	2025-03-14	136.11	\N	\N	\N	\N
1388	2025-03-15	80.26	\N	\N	\N	\N
1389	2025-03-16	112.67	\N	\N	\N	\N
1390	2025-03-17	108.10	\N	\N	\N	\N
1391	2025-03-18	77.83	\N	\N	\N	\N
1392	2025-03-19	132.35	\N	\N	\N	\N
1393	2025-03-20	109.56	\N	\N	\N	\N
1394	2025-03-21	100.70	\N	\N	\N	\N
1395	2025-03-22	109.77	\N	\N	\N	\N
1396	2025-03-23	82.74	\N	\N	\N	\N
1397	2025-03-24	117.68	\N	\N	\N	\N
1398	2025-03-25	64.33	\N	\N	\N	\N
1399	2025-03-26	129.71	\N	\N	\N	\N
1400	2025-03-27	140.45	\N	\N	\N	\N
1401	2025-03-28	82.38	\N	\N	\N	\N
1402	2025-03-29	122.11	\N	\N	\N	\N
1403	2025-03-30	67.75	\N	\N	\N	\N
1404	2025-03-31	140.59	\N	\N	\N	\N
1405	2025-03-01	132.60	\N	\N	\N	\N
1406	2025-03-02	123.84	\N	\N	\N	\N
1407	2025-03-03	132.24	\N	\N	\N	\N
1408	2025-03-04	120.20	\N	\N	\N	\N
1409	2025-03-05	75.78	\N	\N	\N	\N
1410	2025-03-06	94.85	\N	\N	\N	\N
1411	2025-03-07	92.90	\N	\N	\N	\N
1412	2025-03-08	113.14	\N	\N	\N	\N
1413	2025-03-09	51.35	\N	\N	\N	\N
1414	2025-03-10	97.70	\N	\N	\N	\N
1415	2025-03-11	125.61	\N	\N	\N	\N
1416	2025-03-12	68.60	\N	\N	\N	\N
1417	2025-03-13	139.12	\N	\N	\N	\N
1418	2025-03-14	63.26	\N	\N	\N	\N
1419	2025-03-15	132.34	\N	\N	\N	\N
1420	2025-03-16	50.48	\N	\N	\N	\N
1421	2025-03-17	93.92	\N	\N	\N	\N
1422	2025-03-18	118.88	\N	\N	\N	\N
1423	2025-03-19	134.65	\N	\N	\N	\N
1424	2025-03-20	84.08	\N	\N	\N	\N
1425	2025-03-21	141.53	\N	\N	\N	\N
1426	2025-03-22	146.09	\N	\N	\N	\N
1427	2025-03-23	118.76	\N	\N	\N	\N
1428	2025-03-24	107.22	\N	\N	\N	\N
1429	2025-03-25	101.52	\N	\N	\N	\N
1430	2025-03-26	61.97	\N	\N	\N	\N
1431	2025-03-27	129.42	\N	\N	\N	\N
1432	2025-03-28	134.63	\N	\N	\N	\N
1433	2025-03-29	94.03	\N	\N	\N	\N
1434	2025-03-30	73.68	\N	\N	\N	\N
1435	2025-03-31	124.49	\N	\N	\N	\N
1436	2025-03-01	138.47	\N	\N	\N	\N
1437	2025-03-02	52.61	\N	\N	\N	\N
1438	2025-03-03	123.36	\N	\N	\N	\N
1439	2025-03-04	92.10	\N	\N	\N	\N
1440	2025-03-05	108.59	\N	\N	\N	\N
1441	2025-03-06	101.41	\N	\N	\N	\N
1442	2025-03-07	77.79	\N	\N	\N	\N
1443	2025-03-08	81.56	\N	\N	\N	\N
1444	2025-03-09	64.65	\N	\N	\N	\N
1445	2025-03-10	134.12	\N	\N	\N	\N
1446	2025-03-11	75.72	\N	\N	\N	\N
1447	2025-03-12	118.46	\N	\N	\N	\N
1448	2025-03-13	113.09	\N	\N	\N	\N
1449	2025-03-14	60.04	\N	\N	\N	\N
1450	2025-03-15	108.06	\N	\N	\N	\N
1451	2025-03-16	107.28	\N	\N	\N	\N
1452	2025-03-17	130.69	\N	\N	\N	\N
1453	2025-03-18	129.34	\N	\N	\N	\N
1454	2025-03-19	92.87	\N	\N	\N	\N
1455	2025-03-20	100.33	\N	\N	\N	\N
1456	2025-03-21	82.06	\N	\N	\N	\N
1457	2025-03-22	114.58	\N	\N	\N	\N
1458	2025-03-23	95.17	\N	\N	\N	\N
1459	2025-03-24	105.51	\N	\N	\N	\N
1460	2025-03-25	58.54	\N	\N	\N	\N
1461	2025-03-26	94.64	\N	\N	\N	\N
1462	2025-03-27	118.54	\N	\N	\N	\N
1463	2025-03-28	54.62	\N	\N	\N	\N
1464	2025-03-29	138.45	\N	\N	\N	\N
1465	2025-03-30	119.57	\N	\N	\N	\N
1466	2025-03-31	116.44	\N	\N	\N	\N
1467	2025-03-01	95.84	\N	\N	\N	\N
1468	2025-03-02	89.05	\N	\N	\N	\N
1469	2025-03-03	126.74	\N	\N	\N	\N
1470	2025-03-04	133.17	\N	\N	\N	\N
1471	2025-03-05	114.54	\N	\N	\N	\N
1472	2025-03-06	131.88	\N	\N	\N	\N
1473	2025-03-07	66.64	\N	\N	\N	\N
1474	2025-03-08	57.53	\N	\N	\N	\N
1475	2025-03-09	79.28	\N	\N	\N	\N
1476	2025-03-10	137.26	\N	\N	\N	\N
1477	2025-03-11	53.90	\N	\N	\N	\N
1478	2025-03-12	67.69	\N	\N	\N	\N
1479	2025-03-13	107.82	\N	\N	\N	\N
1480	2025-03-14	138.95	\N	\N	\N	\N
1481	2025-03-15	96.92	\N	\N	\N	\N
1482	2025-03-16	92.17	\N	\N	\N	\N
1483	2025-03-17	92.32	\N	\N	\N	\N
1484	2025-03-18	110.50	\N	\N	\N	\N
1485	2025-03-19	91.82	\N	\N	\N	\N
1486	2025-03-20	101.58	\N	\N	\N	\N
1487	2025-03-21	134.70	\N	\N	\N	\N
1488	2025-03-22	148.53	\N	\N	\N	\N
1489	2025-03-23	91.10	\N	\N	\N	\N
1490	2025-03-24	88.90	\N	\N	\N	\N
1491	2025-03-25	135.10	\N	\N	\N	\N
1492	2025-03-26	147.72	\N	\N	\N	\N
1493	2025-03-27	76.52	\N	\N	\N	\N
1494	2025-03-28	83.85	\N	\N	\N	\N
1495	2025-03-29	87.51	\N	\N	\N	\N
1496	2025-03-30	90.31	\N	\N	\N	\N
1497	2025-03-31	123.76	\N	\N	\N	\N
1498	2025-03-01	120.84	\N	\N	\N	\N
1499	2025-03-02	115.03	\N	\N	\N	\N
1500	2025-03-03	56.33	\N	\N	\N	\N
1501	2025-03-04	59.39	\N	\N	\N	\N
1502	2025-03-05	52.11	\N	\N	\N	\N
1503	2025-03-06	94.85	\N	\N	\N	\N
1504	2025-03-07	81.83	\N	\N	\N	\N
1505	2025-03-08	129.36	\N	\N	\N	\N
1506	2025-03-09	76.04	\N	\N	\N	\N
1507	2025-03-10	136.64	\N	\N	\N	\N
1508	2025-03-11	92.17	\N	\N	\N	\N
1509	2025-03-12	146.46	\N	\N	\N	\N
1510	2025-03-13	131.13	\N	\N	\N	\N
1511	2025-03-14	121.51	\N	\N	\N	\N
1512	2025-03-15	112.01	\N	\N	\N	\N
1513	2025-03-16	113.73	\N	\N	\N	\N
1514	2025-03-17	84.72	\N	\N	\N	\N
1515	2025-03-18	145.73	\N	\N	\N	\N
1516	2025-03-19	119.54	\N	\N	\N	\N
1517	2025-03-20	98.99	\N	\N	\N	\N
1518	2025-03-21	98.13	\N	\N	\N	\N
1519	2025-03-22	114.25	\N	\N	\N	\N
1520	2025-03-23	79.22	\N	\N	\N	\N
1521	2025-03-24	110.81	\N	\N	\N	\N
1522	2025-03-25	65.91	\N	\N	\N	\N
1523	2025-03-26	140.20	\N	\N	\N	\N
1524	2025-03-27	82.31	\N	\N	\N	\N
1525	2025-03-28	140.18	\N	\N	\N	\N
1526	2025-03-29	85.88	\N	\N	\N	\N
1527	2025-03-30	75.27	\N	\N	\N	\N
1528	2025-03-31	60.10	\N	\N	\N	\N
1529	2025-03-01	132.40	\N	\N	\N	\N
1530	2025-03-02	73.63	\N	\N	\N	\N
1531	2025-03-03	122.16	\N	\N	\N	\N
1532	2025-03-04	125.56	\N	\N	\N	\N
1533	2025-03-05	94.89	\N	\N	\N	\N
1534	2025-03-06	146.59	\N	\N	\N	\N
1535	2025-03-07	99.53	\N	\N	\N	\N
1536	2025-03-08	102.92	\N	\N	\N	\N
1537	2025-03-09	112.27	\N	\N	\N	\N
1538	2025-03-10	128.94	\N	\N	\N	\N
1539	2025-03-11	134.86	\N	\N	\N	\N
1540	2025-03-12	138.62	\N	\N	\N	\N
1541	2025-03-13	135.73	\N	\N	\N	\N
1542	2025-03-14	121.54	\N	\N	\N	\N
1543	2025-03-15	102.23	\N	\N	\N	\N
1544	2025-03-16	80.66	\N	\N	\N	\N
1545	2025-03-17	130.95	\N	\N	\N	\N
1546	2025-03-18	101.75	\N	\N	\N	\N
1547	2025-03-19	99.00	\N	\N	\N	\N
1548	2025-03-20	81.39	\N	\N	\N	\N
1549	2025-03-21	117.01	\N	\N	\N	\N
1550	2025-03-22	101.14	\N	\N	\N	\N
1551	2025-03-23	128.91	\N	\N	\N	\N
1552	2025-03-24	86.02	\N	\N	\N	\N
1553	2025-03-25	126.98	\N	\N	\N	\N
1554	2025-03-26	63.85	\N	\N	\N	\N
1555	2025-03-27	121.06	\N	\N	\N	\N
1556	2025-03-28	101.76	\N	\N	\N	\N
1557	2025-03-29	113.44	\N	\N	\N	\N
1558	2025-03-30	128.25	\N	\N	\N	\N
1559	2025-03-31	122.85	\N	\N	\N	\N
1560	2025-03-01	138.22	\N	\N	\N	\N
1561	2025-03-02	120.76	\N	\N	\N	\N
1562	2025-03-03	60.15	\N	\N	\N	\N
1563	2025-03-04	63.90	\N	\N	\N	\N
1564	2025-03-05	89.86	\N	\N	\N	\N
1565	2025-03-06	149.80	\N	\N	\N	\N
1566	2025-03-07	85.39	\N	\N	\N	\N
1567	2025-03-08	62.58	\N	\N	\N	\N
1568	2025-03-09	59.14	\N	\N	\N	\N
1569	2025-03-10	114.01	\N	\N	\N	\N
1570	2025-03-11	81.64	\N	\N	\N	\N
1571	2025-03-12	81.61	\N	\N	\N	\N
1572	2025-03-13	98.76	\N	\N	\N	\N
1573	2025-03-14	95.53	\N	\N	\N	\N
1574	2025-03-15	57.93	\N	\N	\N	\N
1575	2025-03-16	64.08	\N	\N	\N	\N
1576	2025-03-17	57.24	\N	\N	\N	\N
1577	2025-03-18	95.57	\N	\N	\N	\N
1578	2025-03-19	65.23	\N	\N	\N	\N
1579	2025-03-20	140.92	\N	\N	\N	\N
1580	2025-03-21	145.81	\N	\N	\N	\N
1581	2025-03-22	125.54	\N	\N	\N	\N
1582	2025-03-23	120.54	\N	\N	\N	\N
1583	2025-03-24	82.07	\N	\N	\N	\N
1584	2025-03-25	144.77	\N	\N	\N	\N
1585	2025-03-26	91.37	\N	\N	\N	\N
1586	2025-03-27	104.74	\N	\N	\N	\N
1587	2025-03-28	66.38	\N	\N	\N	\N
1588	2025-03-29	148.37	\N	\N	\N	\N
1589	2025-03-30	106.87	\N	\N	\N	\N
1590	2025-03-31	59.73	\N	\N	\N	\N
1591	2025-03-01	81.62	\N	\N	\N	\N
1592	2025-03-02	51.62	\N	\N	\N	\N
1593	2025-03-03	76.33	\N	\N	\N	\N
1594	2025-03-04	70.81	\N	\N	\N	\N
1595	2025-03-05	59.74	\N	\N	\N	\N
1596	2025-03-06	83.47	\N	\N	\N	\N
1597	2025-03-07	107.65	\N	\N	\N	\N
1598	2025-03-08	93.28	\N	\N	\N	\N
1599	2025-03-09	100.26	\N	\N	\N	\N
1600	2025-03-10	53.33	\N	\N	\N	\N
1601	2025-03-11	77.73	\N	\N	\N	\N
1602	2025-03-12	136.23	\N	\N	\N	\N
1603	2025-03-13	121.88	\N	\N	\N	\N
1604	2025-03-14	133.36	\N	\N	\N	\N
1605	2025-03-15	121.12	\N	\N	\N	\N
1606	2025-03-16	133.30	\N	\N	\N	\N
1607	2025-03-17	95.16	\N	\N	\N	\N
1608	2025-03-18	113.96	\N	\N	\N	\N
1609	2025-03-19	82.68	\N	\N	\N	\N
1610	2025-03-20	78.94	\N	\N	\N	\N
1611	2025-03-21	103.55	\N	\N	\N	\N
1612	2025-03-22	149.01	\N	\N	\N	\N
1613	2025-03-23	125.51	\N	\N	\N	\N
1614	2025-03-24	147.20	\N	\N	\N	\N
1615	2025-03-25	119.41	\N	\N	\N	\N
1616	2025-03-26	99.91	\N	\N	\N	\N
1617	2025-03-27	101.99	\N	\N	\N	\N
1618	2025-03-28	76.48	\N	\N	\N	\N
1619	2025-03-29	77.14	\N	\N	\N	\N
1620	2025-03-30	90.03	\N	\N	\N	\N
1621	2025-03-31	86.80	\N	\N	\N	\N
1622	2025-03-01	148.52	\N	\N	\N	\N
1623	2025-03-02	125.17	\N	\N	\N	\N
1624	2025-03-03	76.41	\N	\N	\N	\N
1625	2025-03-04	123.19	\N	\N	\N	\N
1626	2025-03-05	91.28	\N	\N	\N	\N
1627	2025-03-06	133.40	\N	\N	\N	\N
1628	2025-03-07	149.78	\N	\N	\N	\N
1629	2025-03-08	92.32	\N	\N	\N	\N
1630	2025-03-09	125.46	\N	\N	\N	\N
1631	2025-03-10	105.35	\N	\N	\N	\N
1632	2025-03-11	67.34	\N	\N	\N	\N
1633	2025-03-12	77.48	\N	\N	\N	\N
1634	2025-03-13	139.76	\N	\N	\N	\N
1635	2025-03-14	123.84	\N	\N	\N	\N
1636	2025-03-15	89.24	\N	\N	\N	\N
1637	2025-03-16	92.71	\N	\N	\N	\N
1638	2025-03-17	69.88	\N	\N	\N	\N
1639	2025-03-18	66.69	\N	\N	\N	\N
1640	2025-03-19	141.72	\N	\N	\N	\N
1641	2025-03-20	51.02	\N	\N	\N	\N
1642	2025-03-21	66.55	\N	\N	\N	\N
1643	2025-03-22	76.17	\N	\N	\N	\N
1644	2025-03-23	60.29	\N	\N	\N	\N
1645	2025-03-24	58.93	\N	\N	\N	\N
1646	2025-03-25	87.78	\N	\N	\N	\N
1647	2025-03-26	74.14	\N	\N	\N	\N
1648	2025-03-27	140.30	\N	\N	\N	\N
1649	2025-03-28	110.31	\N	\N	\N	\N
1650	2025-03-29	84.11	\N	\N	\N	\N
1651	2025-03-30	126.73	\N	\N	\N	\N
1652	2025-03-31	51.45	\N	\N	\N	\N
1653	2025-03-01	130.40	\N	\N	\N	\N
1654	2025-03-02	72.25	\N	\N	\N	\N
1655	2025-03-03	118.12	\N	\N	\N	\N
1656	2025-03-04	88.82	\N	\N	\N	\N
1657	2025-03-05	147.29	\N	\N	\N	\N
1658	2025-03-06	76.78	\N	\N	\N	\N
1659	2025-03-07	89.34	\N	\N	\N	\N
1660	2025-03-08	127.07	\N	\N	\N	\N
1661	2025-03-09	109.58	\N	\N	\N	\N
1662	2025-03-10	74.21	\N	\N	\N	\N
1663	2025-03-11	68.12	\N	\N	\N	\N
1664	2025-03-12	139.32	\N	\N	\N	\N
1665	2025-03-13	105.71	\N	\N	\N	\N
1666	2025-03-14	149.65	\N	\N	\N	\N
1667	2025-03-15	124.93	\N	\N	\N	\N
1668	2025-03-16	51.32	\N	\N	\N	\N
1669	2025-03-17	112.84	\N	\N	\N	\N
1670	2025-03-18	149.36	\N	\N	\N	\N
1671	2025-03-19	80.75	\N	\N	\N	\N
1672	2025-03-20	138.10	\N	\N	\N	\N
1673	2025-03-21	138.15	\N	\N	\N	\N
1674	2025-03-22	129.54	\N	\N	\N	\N
1675	2025-03-23	121.11	\N	\N	\N	\N
1676	2025-03-24	118.19	\N	\N	\N	\N
1677	2025-03-25	145.97	\N	\N	\N	\N
1678	2025-03-26	55.89	\N	\N	\N	\N
1679	2025-03-27	114.83	\N	\N	\N	\N
1680	2025-03-28	89.13	\N	\N	\N	\N
1681	2025-03-29	85.70	\N	\N	\N	\N
1682	2025-03-30	80.66	\N	\N	\N	\N
1683	2025-03-31	129.91	\N	\N	\N	\N
1684	2025-03-01	98.22	\N	\N	\N	\N
1685	2025-03-02	53.22	\N	\N	\N	\N
1686	2025-03-03	57.85	\N	\N	\N	\N
1687	2025-03-04	127.00	\N	\N	\N	\N
1688	2025-03-05	115.02	\N	\N	\N	\N
1689	2025-03-06	57.56	\N	\N	\N	\N
1690	2025-03-07	99.32	\N	\N	\N	\N
1691	2025-03-08	95.86	\N	\N	\N	\N
1692	2025-03-09	105.21	\N	\N	\N	\N
1693	2025-03-10	136.14	\N	\N	\N	\N
1694	2025-03-11	103.52	\N	\N	\N	\N
1695	2025-03-12	93.28	\N	\N	\N	\N
1696	2025-03-13	94.33	\N	\N	\N	\N
1697	2025-03-14	60.13	\N	\N	\N	\N
1698	2025-03-15	72.68	\N	\N	\N	\N
1699	2025-03-16	85.89	\N	\N	\N	\N
1700	2025-03-17	61.37	\N	\N	\N	\N
1701	2025-03-18	107.06	\N	\N	\N	\N
1702	2025-03-19	126.14	\N	\N	\N	\N
1703	2025-03-20	104.32	\N	\N	\N	\N
1704	2025-03-21	58.41	\N	\N	\N	\N
1705	2025-03-22	55.90	\N	\N	\N	\N
1706	2025-03-23	56.34	\N	\N	\N	\N
1707	2025-03-24	142.31	\N	\N	\N	\N
1708	2025-03-25	66.98	\N	\N	\N	\N
1709	2025-03-26	56.46	\N	\N	\N	\N
1710	2025-03-27	63.89	\N	\N	\N	\N
1711	2025-03-28	86.30	\N	\N	\N	\N
1712	2025-03-29	127.54	\N	\N	\N	\N
1713	2025-03-30	132.43	\N	\N	\N	\N
1714	2025-03-31	60.24	\N	\N	\N	\N
1715	2025-03-01	110.95	\N	\N	\N	\N
1716	2025-03-02	92.01	\N	\N	\N	\N
1717	2025-03-03	101.64	\N	\N	\N	\N
1718	2025-03-04	92.92	\N	\N	\N	\N
1719	2025-03-05	124.35	\N	\N	\N	\N
1720	2025-03-06	128.06	\N	\N	\N	\N
1721	2025-03-07	144.45	\N	\N	\N	\N
1722	2025-03-08	74.24	\N	\N	\N	\N
1723	2025-03-09	59.45	\N	\N	\N	\N
1724	2025-03-10	98.00	\N	\N	\N	\N
1725	2025-03-11	87.97	\N	\N	\N	\N
1726	2025-03-12	131.09	\N	\N	\N	\N
1727	2025-03-13	116.52	\N	\N	\N	\N
1728	2025-03-14	57.44	\N	\N	\N	\N
1729	2025-03-15	53.09	\N	\N	\N	\N
1730	2025-03-16	106.33	\N	\N	\N	\N
1731	2025-03-17	127.50	\N	\N	\N	\N
1732	2025-03-18	104.58	\N	\N	\N	\N
1733	2025-03-19	119.83	\N	\N	\N	\N
1734	2025-03-20	110.28	\N	\N	\N	\N
1735	2025-03-21	68.07	\N	\N	\N	\N
1736	2025-03-22	65.22	\N	\N	\N	\N
1737	2025-03-23	100.89	\N	\N	\N	\N
1738	2025-03-24	103.63	\N	\N	\N	\N
1739	2025-03-25	66.09	\N	\N	\N	\N
1740	2025-03-26	61.46	\N	\N	\N	\N
1741	2025-03-27	66.43	\N	\N	\N	\N
1742	2025-03-28	62.01	\N	\N	\N	\N
1743	2025-03-29	119.95	\N	\N	\N	\N
1744	2025-03-30	109.58	\N	\N	\N	\N
1745	2025-03-31	111.98	\N	\N	\N	\N
1746	2025-03-01	125.80	\N	\N	\N	\N
1747	2025-03-02	93.03	\N	\N	\N	\N
1748	2025-03-03	66.56	\N	\N	\N	\N
1749	2025-03-04	141.64	\N	\N	\N	\N
1750	2025-03-05	149.24	\N	\N	\N	\N
1751	2025-03-06	111.87	\N	\N	\N	\N
1752	2025-03-07	138.72	\N	\N	\N	\N
1753	2025-03-08	98.10	\N	\N	\N	\N
1754	2025-03-09	119.78	\N	\N	\N	\N
1755	2025-03-10	78.34	\N	\N	\N	\N
1756	2025-03-11	101.71	\N	\N	\N	\N
1757	2025-03-12	87.37	\N	\N	\N	\N
1758	2025-03-13	62.08	\N	\N	\N	\N
1759	2025-03-14	121.77	\N	\N	\N	\N
1760	2025-03-15	107.50	\N	\N	\N	\N
1761	2025-03-16	120.39	\N	\N	\N	\N
1762	2025-03-17	122.53	\N	\N	\N	\N
1763	2025-03-18	132.01	\N	\N	\N	\N
1764	2025-03-19	126.31	\N	\N	\N	\N
1765	2025-03-20	111.93	\N	\N	\N	\N
1766	2025-03-21	149.77	\N	\N	\N	\N
1767	2025-03-22	122.23	\N	\N	\N	\N
1768	2025-03-23	71.22	\N	\N	\N	\N
1769	2025-03-24	136.01	\N	\N	\N	\N
1770	2025-03-25	85.57	\N	\N	\N	\N
1771	2025-03-26	89.64	\N	\N	\N	\N
1772	2025-03-27	74.66	\N	\N	\N	\N
1773	2025-03-28	119.33	\N	\N	\N	\N
1774	2025-03-29	70.25	\N	\N	\N	\N
1775	2025-03-30	78.77	\N	\N	\N	\N
1776	2025-03-31	125.22	\N	\N	\N	\N
1777	2025-03-01	88.15	\N	\N	\N	\N
1778	2025-03-02	89.20	\N	\N	\N	\N
1779	2025-03-03	104.81	\N	\N	\N	\N
1780	2025-03-04	101.07	\N	\N	\N	\N
1781	2025-03-05	55.05	\N	\N	\N	\N
1782	2025-03-06	59.55	\N	\N	\N	\N
1783	2025-03-07	129.47	\N	\N	\N	\N
1784	2025-03-08	104.45	\N	\N	\N	\N
1785	2025-03-09	89.32	\N	\N	\N	\N
1786	2025-03-10	52.47	\N	\N	\N	\N
1787	2025-03-11	110.14	\N	\N	\N	\N
1788	2025-03-12	85.08	\N	\N	\N	\N
1789	2025-03-13	115.10	\N	\N	\N	\N
1790	2025-03-14	72.03	\N	\N	\N	\N
1791	2025-03-15	146.59	\N	\N	\N	\N
1792	2025-03-16	110.17	\N	\N	\N	\N
1793	2025-03-17	125.63	\N	\N	\N	\N
1794	2025-03-18	120.03	\N	\N	\N	\N
1795	2025-03-19	55.65	\N	\N	\N	\N
1796	2025-03-20	74.36	\N	\N	\N	\N
1797	2025-03-21	88.73	\N	\N	\N	\N
1798	2025-03-22	79.25	\N	\N	\N	\N
1799	2025-03-23	114.11	\N	\N	\N	\N
1800	2025-03-24	61.00	\N	\N	\N	\N
1801	2025-03-25	50.25	\N	\N	\N	\N
1802	2025-03-26	59.31	\N	\N	\N	\N
1803	2025-03-27	54.37	\N	\N	\N	\N
1804	2025-03-28	51.04	\N	\N	\N	\N
1805	2025-03-29	67.52	\N	\N	\N	\N
1806	2025-03-30	72.38	\N	\N	\N	\N
1807	2025-03-31	86.18	\N	\N	\N	\N
1808	2025-03-01	146.64	\N	\N	\N	\N
1809	2025-03-02	101.86	\N	\N	\N	\N
1810	2025-03-03	114.42	\N	\N	\N	\N
1811	2025-03-04	69.11	\N	\N	\N	\N
1812	2025-03-05	135.89	\N	\N	\N	\N
1813	2025-03-06	124.77	\N	\N	\N	\N
1814	2025-03-07	107.89	\N	\N	\N	\N
1815	2025-03-08	109.06	\N	\N	\N	\N
1816	2025-03-09	58.70	\N	\N	\N	\N
1817	2025-03-10	56.94	\N	\N	\N	\N
1818	2025-03-11	82.35	\N	\N	\N	\N
1819	2025-03-12	100.74	\N	\N	\N	\N
1820	2025-03-13	89.26	\N	\N	\N	\N
1821	2025-03-14	70.82	\N	\N	\N	\N
1822	2025-03-15	86.41	\N	\N	\N	\N
1823	2025-03-16	73.15	\N	\N	\N	\N
1824	2025-03-17	55.86	\N	\N	\N	\N
1825	2025-03-18	105.51	\N	\N	\N	\N
1826	2025-03-19	76.72	\N	\N	\N	\N
1827	2025-03-20	116.34	\N	\N	\N	\N
1828	2025-03-21	141.50	\N	\N	\N	\N
1829	2025-03-22	123.31	\N	\N	\N	\N
1830	2025-03-23	110.50	\N	\N	\N	\N
1831	2025-03-24	113.26	\N	\N	\N	\N
1832	2025-03-25	73.74	\N	\N	\N	\N
1833	2025-03-26	54.96	\N	\N	\N	\N
1834	2025-03-27	149.95	\N	\N	\N	\N
1835	2025-03-28	60.65	\N	\N	\N	\N
1836	2025-03-29	106.98	\N	\N	\N	\N
1837	2025-03-30	147.50	\N	\N	\N	\N
1838	2025-03-31	122.48	\N	\N	\N	\N
1839	2025-03-01	102.94	\N	\N	\N	\N
1840	2025-03-02	74.31	\N	\N	\N	\N
1841	2025-03-03	50.84	\N	\N	\N	\N
1842	2025-03-04	76.15	\N	\N	\N	\N
1843	2025-03-05	142.51	\N	\N	\N	\N
1844	2025-03-06	98.40	\N	\N	\N	\N
1845	2025-03-07	52.10	\N	\N	\N	\N
1846	2025-03-08	115.64	\N	\N	\N	\N
1847	2025-03-09	96.17	\N	\N	\N	\N
1848	2025-03-10	143.31	\N	\N	\N	\N
1849	2025-03-11	66.96	\N	\N	\N	\N
1850	2025-03-12	60.35	\N	\N	\N	\N
1851	2025-03-13	70.81	\N	\N	\N	\N
1852	2025-03-14	131.57	\N	\N	\N	\N
1853	2025-03-15	144.68	\N	\N	\N	\N
1854	2025-03-16	110.70	\N	\N	\N	\N
1855	2025-03-17	126.91	\N	\N	\N	\N
1856	2025-03-18	121.38	\N	\N	\N	\N
1857	2025-03-19	129.73	\N	\N	\N	\N
1858	2025-03-20	124.55	\N	\N	\N	\N
1859	2025-03-21	50.59	\N	\N	\N	\N
1860	2025-03-22	69.66	\N	\N	\N	\N
1861	2025-03-23	68.14	\N	\N	\N	\N
1862	2025-03-24	149.14	\N	\N	\N	\N
1863	2025-03-25	53.13	\N	\N	\N	\N
1864	2025-03-26	66.12	\N	\N	\N	\N
1865	2025-03-27	98.28	\N	\N	\N	\N
1866	2025-03-28	130.04	\N	\N	\N	\N
1867	2025-03-29	133.09	\N	\N	\N	\N
1868	2025-03-30	99.89	\N	\N	\N	\N
1869	2025-03-31	51.08	\N	\N	\N	\N
1870	2025-03-01	84.99	\N	\N	\N	\N
1871	2025-03-02	60.15	\N	\N	\N	\N
1872	2025-03-03	136.21	\N	\N	\N	\N
1873	2025-03-04	70.85	\N	\N	\N	\N
1874	2025-03-05	115.00	\N	\N	\N	\N
1875	2025-03-06	90.60	\N	\N	\N	\N
1876	2025-03-07	82.89	\N	\N	\N	\N
1877	2025-03-08	54.40	\N	\N	\N	\N
1878	2025-03-09	95.05	\N	\N	\N	\N
1879	2025-03-10	86.86	\N	\N	\N	\N
1880	2025-03-11	90.41	\N	\N	\N	\N
1881	2025-03-12	98.41	\N	\N	\N	\N
1882	2025-03-13	147.24	\N	\N	\N	\N
1883	2025-03-14	142.04	\N	\N	\N	\N
1884	2025-03-15	84.28	\N	\N	\N	\N
1885	2025-03-16	56.52	\N	\N	\N	\N
1886	2025-03-17	81.83	\N	\N	\N	\N
1887	2025-03-18	79.92	\N	\N	\N	\N
1888	2025-03-19	112.23	\N	\N	\N	\N
1889	2025-03-20	70.07	\N	\N	\N	\N
1890	2025-03-21	52.35	\N	\N	\N	\N
1891	2025-03-22	99.84	\N	\N	\N	\N
1892	2025-03-23	69.10	\N	\N	\N	\N
1893	2025-03-24	87.86	\N	\N	\N	\N
1894	2025-03-25	142.51	\N	\N	\N	\N
1895	2025-03-26	145.60	\N	\N	\N	\N
1896	2025-03-27	86.87	\N	\N	\N	\N
1897	2025-03-28	70.04	\N	\N	\N	\N
1898	2025-03-29	87.80	\N	\N	\N	\N
1899	2025-03-30	60.09	\N	\N	\N	\N
1900	2025-03-31	103.59	\N	\N	\N	\N
1901	2025-03-01	113.96	\N	\N	\N	\N
1902	2025-03-02	128.45	\N	\N	\N	\N
1903	2025-03-03	57.70	\N	\N	\N	\N
1904	2025-03-04	74.76	\N	\N	\N	\N
1905	2025-03-05	75.47	\N	\N	\N	\N
1906	2025-03-06	72.19	\N	\N	\N	\N
1907	2025-03-07	110.11	\N	\N	\N	\N
1908	2025-03-08	108.88	\N	\N	\N	\N
1909	2025-03-09	134.34	\N	\N	\N	\N
1910	2025-03-10	67.56	\N	\N	\N	\N
1911	2025-03-11	130.47	\N	\N	\N	\N
1912	2025-03-12	96.62	\N	\N	\N	\N
1913	2025-03-13	87.22	\N	\N	\N	\N
1914	2025-03-14	105.68	\N	\N	\N	\N
1915	2025-03-15	88.86	\N	\N	\N	\N
1916	2025-03-16	54.19	\N	\N	\N	\N
1917	2025-03-17	54.18	\N	\N	\N	\N
1918	2025-03-18	80.20	\N	\N	\N	\N
1919	2025-03-19	57.84	\N	\N	\N	\N
1920	2025-03-20	50.66	\N	\N	\N	\N
1921	2025-03-21	58.96	\N	\N	\N	\N
1922	2025-03-22	120.95	\N	\N	\N	\N
1923	2025-03-23	62.42	\N	\N	\N	\N
1924	2025-03-24	138.04	\N	\N	\N	\N
1925	2025-03-25	118.85	\N	\N	\N	\N
1926	2025-03-26	67.45	\N	\N	\N	\N
1927	2025-03-27	71.51	\N	\N	\N	\N
1928	2025-03-28	132.48	\N	\N	\N	\N
1929	2025-03-29	115.83	\N	\N	\N	\N
1930	2025-03-30	64.32	\N	\N	\N	\N
1931	2025-03-31	107.83	\N	\N	\N	\N
1932	2025-03-01	95.15	\N	\N	\N	\N
1933	2025-03-02	110.13	\N	\N	\N	\N
1934	2025-03-03	129.37	\N	\N	\N	\N
1935	2025-03-04	83.86	\N	\N	\N	\N
1936	2025-03-05	60.66	\N	\N	\N	\N
1937	2025-03-06	121.86	\N	\N	\N	\N
1938	2025-03-07	79.27	\N	\N	\N	\N
1939	2025-03-08	134.21	\N	\N	\N	\N
1940	2025-03-09	94.81	\N	\N	\N	\N
1941	2025-03-10	101.13	\N	\N	\N	\N
1942	2025-03-11	87.21	\N	\N	\N	\N
1943	2025-03-12	67.20	\N	\N	\N	\N
1944	2025-03-13	124.75	\N	\N	\N	\N
1945	2025-03-14	61.46	\N	\N	\N	\N
1946	2025-03-15	108.24	\N	\N	\N	\N
1947	2025-03-16	51.53	\N	\N	\N	\N
1948	2025-03-17	61.41	\N	\N	\N	\N
1949	2025-03-18	66.93	\N	\N	\N	\N
1950	2025-03-19	119.82	\N	\N	\N	\N
1951	2025-03-20	59.65	\N	\N	\N	\N
1952	2025-03-21	129.57	\N	\N	\N	\N
1953	2025-03-22	94.15	\N	\N	\N	\N
1954	2025-03-23	80.05	\N	\N	\N	\N
1955	2025-03-24	85.53	\N	\N	\N	\N
1956	2025-03-25	135.76	\N	\N	\N	\N
1957	2025-03-26	130.97	\N	\N	\N	\N
1958	2025-03-27	109.39	\N	\N	\N	\N
1959	2025-03-28	53.15	\N	\N	\N	\N
1960	2025-03-29	99.42	\N	\N	\N	\N
1961	2025-03-30	123.48	\N	\N	\N	\N
1962	2025-03-31	121.47	\N	\N	\N	\N
1963	2025-03-01	94.27	\N	\N	\N	\N
1964	2025-03-02	87.26	\N	\N	\N	\N
1965	2025-03-03	60.62	\N	\N	\N	\N
1966	2025-03-04	140.91	\N	\N	\N	\N
1967	2025-03-05	139.86	\N	\N	\N	\N
1968	2025-03-06	62.20	\N	\N	\N	\N
1969	2025-03-07	50.96	\N	\N	\N	\N
1970	2025-03-08	107.76	\N	\N	\N	\N
1971	2025-03-09	117.28	\N	\N	\N	\N
1972	2025-03-10	83.65	\N	\N	\N	\N
1973	2025-03-11	90.18	\N	\N	\N	\N
1974	2025-03-12	115.35	\N	\N	\N	\N
1975	2025-03-13	55.63	\N	\N	\N	\N
1976	2025-03-14	114.23	\N	\N	\N	\N
1977	2025-03-15	107.42	\N	\N	\N	\N
1978	2025-03-16	114.47	\N	\N	\N	\N
1979	2025-03-17	94.85	\N	\N	\N	\N
1980	2025-03-18	63.47	\N	\N	\N	\N
1981	2025-03-19	141.59	\N	\N	\N	\N
1982	2025-03-20	54.51	\N	\N	\N	\N
1983	2025-03-21	78.73	\N	\N	\N	\N
1984	2025-03-22	99.72	\N	\N	\N	\N
1985	2025-03-23	59.60	\N	\N	\N	\N
1986	2025-03-24	144.34	\N	\N	\N	\N
1987	2025-03-25	103.83	\N	\N	\N	\N
1988	2025-03-26	106.50	\N	\N	\N	\N
1989	2025-03-27	128.72	\N	\N	\N	\N
1990	2025-03-28	118.43	\N	\N	\N	\N
1991	2025-03-29	142.84	\N	\N	\N	\N
1992	2025-03-30	95.18	\N	\N	\N	\N
1993	2025-03-31	61.74	\N	\N	\N	\N
1994	2025-03-01	85.40	\N	\N	\N	\N
1995	2025-03-02	81.40	\N	\N	\N	\N
1996	2025-03-03	74.02	\N	\N	\N	\N
1997	2025-03-04	119.72	\N	\N	\N	\N
1998	2025-03-05	108.56	\N	\N	\N	\N
1999	2025-03-06	120.83	\N	\N	\N	\N
2000	2025-03-07	143.44	\N	\N	\N	\N
2001	2025-03-08	121.68	\N	\N	\N	\N
2002	2025-03-09	120.34	\N	\N	\N	\N
2003	2025-03-10	76.32	\N	\N	\N	\N
2004	2025-03-11	143.48	\N	\N	\N	\N
2005	2025-03-12	89.85	\N	\N	\N	\N
2006	2025-03-13	86.92	\N	\N	\N	\N
2007	2025-03-14	134.07	\N	\N	\N	\N
2008	2025-03-15	100.48	\N	\N	\N	\N
2009	2025-03-16	116.46	\N	\N	\N	\N
2010	2025-03-17	114.66	\N	\N	\N	\N
2011	2025-03-18	132.64	\N	\N	\N	\N
2012	2025-03-19	114.14	\N	\N	\N	\N
2013	2025-03-20	145.64	\N	\N	\N	\N
2014	2025-03-21	133.27	\N	\N	\N	\N
2015	2025-03-22	107.97	\N	\N	\N	\N
2016	2025-03-23	148.22	\N	\N	\N	\N
2017	2025-03-24	107.45	\N	\N	\N	\N
2018	2025-03-25	77.47	\N	\N	\N	\N
2019	2025-03-26	114.22	\N	\N	\N	\N
2020	2025-03-27	50.96	\N	\N	\N	\N
2021	2025-03-28	57.53	\N	\N	\N	\N
2022	2025-03-29	68.19	\N	\N	\N	\N
2023	2025-03-30	90.15	\N	\N	\N	\N
2024	2025-03-31	82.72	\N	\N	\N	\N
2025	2025-02-01	123.82	\N	\N	\N	\N
2026	2025-02-02	111.04	\N	\N	\N	\N
2027	2025-02-03	144.23	\N	\N	\N	\N
2028	2025-02-04	81.81	\N	\N	\N	\N
2029	2025-02-05	130.89	\N	\N	\N	\N
2030	2025-02-06	115.36	\N	\N	\N	\N
2031	2025-02-07	63.79	\N	\N	\N	\N
2032	2025-02-08	84.93	\N	\N	\N	\N
2033	2025-02-09	70.80	\N	\N	\N	\N
2034	2025-02-10	117.92	\N	\N	\N	\N
2035	2025-02-11	74.13	\N	\N	\N	\N
2036	2025-02-12	76.81	\N	\N	\N	\N
2037	2025-02-13	125.75	\N	\N	\N	\N
2038	2025-02-14	111.43	\N	\N	\N	\N
2039	2025-02-15	138.94	\N	\N	\N	\N
2040	2025-02-16	70.15	\N	\N	\N	\N
2041	2025-02-17	149.35	\N	\N	\N	\N
2042	2025-02-18	115.72	\N	\N	\N	\N
2043	2025-02-19	94.82	\N	\N	\N	\N
2044	2025-02-20	83.11	\N	\N	\N	\N
2045	2025-02-21	75.00	\N	\N	\N	\N
2046	2025-02-22	106.74	\N	\N	\N	\N
2047	2025-02-23	105.93	\N	\N	\N	\N
2048	2025-02-24	124.98	\N	\N	\N	\N
2049	2025-02-25	51.83	\N	\N	\N	\N
2050	2025-02-26	53.22	\N	\N	\N	\N
2051	2025-02-27	145.77	\N	\N	\N	\N
2052	2025-02-28	113.48	\N	\N	\N	\N
2053	2025-02-01	80.58	\N	\N	\N	\N
2054	2025-02-02	137.50	\N	\N	\N	\N
2055	2025-02-03	100.29	\N	\N	\N	\N
2056	2025-02-04	71.30	\N	\N	\N	\N
2057	2025-02-05	144.62	\N	\N	\N	\N
2058	2025-02-06	63.98	\N	\N	\N	\N
2059	2025-02-07	111.64	\N	\N	\N	\N
2060	2025-02-08	100.04	\N	\N	\N	\N
2061	2025-02-09	149.34	\N	\N	\N	\N
2062	2025-02-10	60.60	\N	\N	\N	\N
2063	2025-02-11	118.55	\N	\N	\N	\N
2064	2025-02-12	78.47	\N	\N	\N	\N
2065	2025-02-13	113.03	\N	\N	\N	\N
2066	2025-02-14	148.30	\N	\N	\N	\N
2067	2025-02-15	107.71	\N	\N	\N	\N
2068	2025-02-16	122.45	\N	\N	\N	\N
2069	2025-02-17	87.11	\N	\N	\N	\N
2070	2025-02-18	105.12	\N	\N	\N	\N
2071	2025-02-19	57.26	\N	\N	\N	\N
2072	2025-02-20	75.47	\N	\N	\N	\N
2073	2025-02-21	145.26	\N	\N	\N	\N
2074	2025-02-22	145.19	\N	\N	\N	\N
2075	2025-02-23	122.57	\N	\N	\N	\N
2076	2025-02-24	84.31	\N	\N	\N	\N
2077	2025-02-25	79.14	\N	\N	\N	\N
2078	2025-02-26	112.71	\N	\N	\N	\N
2079	2025-02-27	95.42	\N	\N	\N	\N
2080	2025-02-28	138.94	\N	\N	\N	\N
2081	2025-02-01	90.06	\N	\N	\N	\N
2082	2025-02-02	131.46	\N	\N	\N	\N
2083	2025-02-03	108.42	\N	\N	\N	\N
2084	2025-02-04	113.67	\N	\N	\N	\N
2085	2025-02-05	128.23	\N	\N	\N	\N
2086	2025-02-06	141.34	\N	\N	\N	\N
2087	2025-02-07	142.45	\N	\N	\N	\N
2088	2025-02-08	53.43	\N	\N	\N	\N
2089	2025-02-09	53.90	\N	\N	\N	\N
2090	2025-02-10	89.41	\N	\N	\N	\N
2091	2025-02-11	57.66	\N	\N	\N	\N
2092	2025-02-12	56.30	\N	\N	\N	\N
2093	2025-02-13	109.75	\N	\N	\N	\N
2094	2025-02-14	145.12	\N	\N	\N	\N
2095	2025-02-15	139.64	\N	\N	\N	\N
2096	2025-02-16	75.73	\N	\N	\N	\N
2097	2025-02-17	57.35	\N	\N	\N	\N
2098	2025-02-18	114.06	\N	\N	\N	\N
2099	2025-02-19	85.32	\N	\N	\N	\N
2100	2025-02-20	73.23	\N	\N	\N	\N
2101	2025-02-21	77.13	\N	\N	\N	\N
2102	2025-02-22	127.62	\N	\N	\N	\N
2103	2025-02-23	67.76	\N	\N	\N	\N
2104	2025-02-24	121.21	\N	\N	\N	\N
2105	2025-02-25	68.31	\N	\N	\N	\N
2106	2025-02-26	73.65	\N	\N	\N	\N
2107	2025-02-27	67.76	\N	\N	\N	\N
2108	2025-02-28	129.39	\N	\N	\N	\N
2109	2025-02-01	64.04	\N	\N	\N	\N
2110	2025-02-02	61.26	\N	\N	\N	\N
2111	2025-02-03	71.04	\N	\N	\N	\N
2112	2025-02-04	134.30	\N	\N	\N	\N
2113	2025-02-05	87.90	\N	\N	\N	\N
2114	2025-02-06	125.87	\N	\N	\N	\N
2115	2025-02-07	112.38	\N	\N	\N	\N
2116	2025-02-08	52.10	\N	\N	\N	\N
2117	2025-02-09	127.09	\N	\N	\N	\N
2118	2025-02-10	148.32	\N	\N	\N	\N
2119	2025-02-11	114.77	\N	\N	\N	\N
2120	2025-02-12	110.20	\N	\N	\N	\N
2121	2025-02-13	75.37	\N	\N	\N	\N
2122	2025-02-14	123.66	\N	\N	\N	\N
2123	2025-02-15	141.30	\N	\N	\N	\N
2124	2025-02-16	76.50	\N	\N	\N	\N
2125	2025-02-17	74.99	\N	\N	\N	\N
2126	2025-02-18	83.73	\N	\N	\N	\N
2127	2025-02-19	136.99	\N	\N	\N	\N
2128	2025-02-20	105.27	\N	\N	\N	\N
2129	2025-02-21	79.06	\N	\N	\N	\N
2130	2025-02-22	95.03	\N	\N	\N	\N
2131	2025-02-23	123.11	\N	\N	\N	\N
2132	2025-02-24	88.53	\N	\N	\N	\N
2133	2025-02-25	143.92	\N	\N	\N	\N
2134	2025-02-26	133.90	\N	\N	\N	\N
2135	2025-02-27	88.40	\N	\N	\N	\N
2136	2025-02-28	139.47	\N	\N	\N	\N
2137	2025-02-01	140.06	\N	\N	\N	\N
2138	2025-02-02	116.99	\N	\N	\N	\N
2139	2025-02-03	93.80	\N	\N	\N	\N
2140	2025-02-04	132.08	\N	\N	\N	\N
2141	2025-02-05	69.40	\N	\N	\N	\N
2142	2025-02-06	131.44	\N	\N	\N	\N
2143	2025-02-07	133.62	\N	\N	\N	\N
2144	2025-02-08	55.27	\N	\N	\N	\N
2145	2025-02-09	63.38	\N	\N	\N	\N
2146	2025-02-10	77.68	\N	\N	\N	\N
2147	2025-02-11	143.06	\N	\N	\N	\N
2148	2025-02-12	63.39	\N	\N	\N	\N
2149	2025-02-13	83.53	\N	\N	\N	\N
2150	2025-02-14	58.19	\N	\N	\N	\N
2151	2025-02-15	134.26	\N	\N	\N	\N
2152	2025-02-16	93.98	\N	\N	\N	\N
2153	2025-02-17	112.13	\N	\N	\N	\N
2154	2025-02-18	52.84	\N	\N	\N	\N
2155	2025-02-19	67.83	\N	\N	\N	\N
2156	2025-02-20	123.07	\N	\N	\N	\N
2157	2025-02-21	98.42	\N	\N	\N	\N
2158	2025-02-22	148.94	\N	\N	\N	\N
2159	2025-02-23	89.27	\N	\N	\N	\N
2160	2025-02-24	107.26	\N	\N	\N	\N
2161	2025-02-25	58.40	\N	\N	\N	\N
2162	2025-02-26	93.15	\N	\N	\N	\N
2163	2025-02-27	72.19	\N	\N	\N	\N
2164	2025-02-28	138.56	\N	\N	\N	\N
2165	2025-02-01	60.37	\N	\N	\N	\N
2166	2025-02-02	111.99	\N	\N	\N	\N
2167	2025-02-03	63.65	\N	\N	\N	\N
2168	2025-02-04	92.88	\N	\N	\N	\N
2169	2025-02-05	114.12	\N	\N	\N	\N
2170	2025-02-06	114.00	\N	\N	\N	\N
2171	2025-02-07	82.06	\N	\N	\N	\N
2172	2025-02-08	105.80	\N	\N	\N	\N
2173	2025-02-09	73.95	\N	\N	\N	\N
2174	2025-02-10	68.00	\N	\N	\N	\N
2175	2025-02-11	94.19	\N	\N	\N	\N
2176	2025-02-12	140.59	\N	\N	\N	\N
2177	2025-02-13	55.90	\N	\N	\N	\N
2178	2025-02-14	112.05	\N	\N	\N	\N
2179	2025-02-15	68.55	\N	\N	\N	\N
2180	2025-02-16	104.57	\N	\N	\N	\N
2181	2025-02-17	87.91	\N	\N	\N	\N
2182	2025-02-18	75.33	\N	\N	\N	\N
2183	2025-02-19	138.65	\N	\N	\N	\N
2184	2025-02-20	130.56	\N	\N	\N	\N
2185	2025-02-21	77.38	\N	\N	\N	\N
2186	2025-02-22	124.49	\N	\N	\N	\N
2187	2025-02-23	142.53	\N	\N	\N	\N
2188	2025-02-24	79.46	\N	\N	\N	\N
2189	2025-02-25	76.58	\N	\N	\N	\N
2190	2025-02-26	118.65	\N	\N	\N	\N
2191	2025-02-27	96.77	\N	\N	\N	\N
2192	2025-02-28	57.21	\N	\N	\N	\N
2193	2025-02-01	75.13	\N	\N	\N	\N
2194	2025-02-02	80.74	\N	\N	\N	\N
2195	2025-02-03	140.84	\N	\N	\N	\N
2196	2025-02-04	129.09	\N	\N	\N	\N
2197	2025-02-05	55.19	\N	\N	\N	\N
2198	2025-02-06	143.43	\N	\N	\N	\N
2199	2025-02-07	96.47	\N	\N	\N	\N
2200	2025-02-08	143.32	\N	\N	\N	\N
2201	2025-02-09	105.32	\N	\N	\N	\N
2202	2025-02-10	90.30	\N	\N	\N	\N
2203	2025-02-11	120.56	\N	\N	\N	\N
2204	2025-02-12	101.29	\N	\N	\N	\N
2205	2025-02-13	86.82	\N	\N	\N	\N
2206	2025-02-14	134.88	\N	\N	\N	\N
2207	2025-02-15	91.67	\N	\N	\N	\N
2208	2025-02-16	123.88	\N	\N	\N	\N
2209	2025-02-17	66.63	\N	\N	\N	\N
2210	2025-02-18	104.82	\N	\N	\N	\N
2211	2025-02-19	61.16	\N	\N	\N	\N
2212	2025-02-20	51.89	\N	\N	\N	\N
2213	2025-02-21	141.41	\N	\N	\N	\N
2214	2025-02-22	87.52	\N	\N	\N	\N
2215	2025-02-23	55.53	\N	\N	\N	\N
2216	2025-02-24	99.49	\N	\N	\N	\N
2217	2025-02-25	96.84	\N	\N	\N	\N
2218	2025-02-26	100.16	\N	\N	\N	\N
2219	2025-02-27	54.74	\N	\N	\N	\N
2220	2025-02-28	130.56	\N	\N	\N	\N
2221	2025-02-01	132.91	\N	\N	\N	\N
2222	2025-02-02	63.78	\N	\N	\N	\N
2223	2025-02-03	141.46	\N	\N	\N	\N
2224	2025-02-04	146.13	\N	\N	\N	\N
2225	2025-02-05	88.48	\N	\N	\N	\N
2226	2025-02-06	115.79	\N	\N	\N	\N
2227	2025-02-07	114.47	\N	\N	\N	\N
2228	2025-02-08	111.96	\N	\N	\N	\N
2229	2025-02-09	114.86	\N	\N	\N	\N
2230	2025-02-10	130.59	\N	\N	\N	\N
2231	2025-02-11	89.71	\N	\N	\N	\N
2232	2025-02-12	84.19	\N	\N	\N	\N
2233	2025-02-13	93.27	\N	\N	\N	\N
2234	2025-02-14	115.47	\N	\N	\N	\N
2235	2025-02-15	57.77	\N	\N	\N	\N
2236	2025-02-16	66.00	\N	\N	\N	\N
2237	2025-02-17	91.82	\N	\N	\N	\N
2238	2025-02-18	96.47	\N	\N	\N	\N
2239	2025-02-19	118.83	\N	\N	\N	\N
2240	2025-02-20	63.03	\N	\N	\N	\N
2241	2025-02-21	122.61	\N	\N	\N	\N
2242	2025-02-22	104.72	\N	\N	\N	\N
2243	2025-02-23	72.16	\N	\N	\N	\N
2244	2025-02-24	51.52	\N	\N	\N	\N
2245	2025-02-25	74.48	\N	\N	\N	\N
2246	2025-02-26	142.66	\N	\N	\N	\N
2247	2025-02-27	121.86	\N	\N	\N	\N
2248	2025-02-28	56.75	\N	\N	\N	\N
2249	2025-02-01	81.85	\N	\N	\N	\N
2250	2025-02-02	137.98	\N	\N	\N	\N
2251	2025-02-03	124.93	\N	\N	\N	\N
2252	2025-02-04	137.13	\N	\N	\N	\N
2253	2025-02-05	91.78	\N	\N	\N	\N
2254	2025-02-06	110.99	\N	\N	\N	\N
2255	2025-02-07	127.07	\N	\N	\N	\N
2256	2025-02-08	92.08	\N	\N	\N	\N
2257	2025-02-09	113.12	\N	\N	\N	\N
2258	2025-02-10	144.89	\N	\N	\N	\N
2259	2025-02-11	52.83	\N	\N	\N	\N
2260	2025-02-12	132.82	\N	\N	\N	\N
2261	2025-02-13	58.65	\N	\N	\N	\N
2262	2025-02-14	74.12	\N	\N	\N	\N
2263	2025-02-15	136.13	\N	\N	\N	\N
2264	2025-02-16	92.42	\N	\N	\N	\N
2265	2025-02-17	51.19	\N	\N	\N	\N
2266	2025-02-18	59.06	\N	\N	\N	\N
2267	2025-02-19	52.38	\N	\N	\N	\N
2268	2025-02-20	59.60	\N	\N	\N	\N
2269	2025-02-21	145.90	\N	\N	\N	\N
2270	2025-02-22	52.97	\N	\N	\N	\N
2271	2025-02-23	52.84	\N	\N	\N	\N
2272	2025-02-24	96.93	\N	\N	\N	\N
2273	2025-02-25	120.64	\N	\N	\N	\N
2274	2025-02-26	72.97	\N	\N	\N	\N
2275	2025-02-27	135.62	\N	\N	\N	\N
2276	2025-02-28	88.42	\N	\N	\N	\N
2277	2025-02-01	84.85	\N	\N	\N	\N
2278	2025-02-02	139.42	\N	\N	\N	\N
2279	2025-02-03	103.18	\N	\N	\N	\N
2280	2025-02-04	103.49	\N	\N	\N	\N
2281	2025-02-05	70.35	\N	\N	\N	\N
2282	2025-02-06	89.38	\N	\N	\N	\N
2283	2025-02-07	132.33	\N	\N	\N	\N
2284	2025-02-08	51.17	\N	\N	\N	\N
2285	2025-02-09	85.35	\N	\N	\N	\N
2286	2025-02-10	90.00	\N	\N	\N	\N
2287	2025-02-11	97.89	\N	\N	\N	\N
2288	2025-02-12	132.53	\N	\N	\N	\N
2289	2025-02-13	71.46	\N	\N	\N	\N
2290	2025-02-14	116.96	\N	\N	\N	\N
2291	2025-02-15	73.21	\N	\N	\N	\N
2292	2025-02-16	107.22	\N	\N	\N	\N
2293	2025-02-17	59.30	\N	\N	\N	\N
2294	2025-02-18	143.37	\N	\N	\N	\N
2295	2025-02-19	96.66	\N	\N	\N	\N
2296	2025-02-20	109.80	\N	\N	\N	\N
2297	2025-02-21	59.47	\N	\N	\N	\N
2298	2025-02-22	116.78	\N	\N	\N	\N
2299	2025-02-23	135.19	\N	\N	\N	\N
2300	2025-02-24	147.64	\N	\N	\N	\N
2301	2025-02-25	112.80	\N	\N	\N	\N
2302	2025-02-26	110.86	\N	\N	\N	\N
2303	2025-02-27	68.38	\N	\N	\N	\N
2304	2025-02-28	116.92	\N	\N	\N	\N
2305	2025-02-01	114.50	\N	\N	\N	\N
2306	2025-02-02	59.99	\N	\N	\N	\N
2307	2025-02-03	67.65	\N	\N	\N	\N
2308	2025-02-04	104.05	\N	\N	\N	\N
2309	2025-02-05	121.14	\N	\N	\N	\N
2310	2025-02-06	81.80	\N	\N	\N	\N
2311	2025-02-07	143.46	\N	\N	\N	\N
2312	2025-02-08	104.80	\N	\N	\N	\N
2313	2025-02-09	54.39	\N	\N	\N	\N
2314	2025-02-10	127.77	\N	\N	\N	\N
2315	2025-02-11	60.46	\N	\N	\N	\N
2316	2025-02-12	103.17	\N	\N	\N	\N
2317	2025-02-13	96.69	\N	\N	\N	\N
2318	2025-02-14	146.60	\N	\N	\N	\N
2319	2025-02-15	74.42	\N	\N	\N	\N
2320	2025-02-16	90.43	\N	\N	\N	\N
2321	2025-02-17	130.06	\N	\N	\N	\N
2322	2025-02-18	77.28	\N	\N	\N	\N
2323	2025-02-19	58.22	\N	\N	\N	\N
2324	2025-02-20	145.19	\N	\N	\N	\N
2325	2025-02-21	143.36	\N	\N	\N	\N
2326	2025-02-22	73.77	\N	\N	\N	\N
2327	2025-02-23	64.68	\N	\N	\N	\N
2328	2025-02-24	119.82	\N	\N	\N	\N
2329	2025-02-25	78.89	\N	\N	\N	\N
2330	2025-02-26	93.13	\N	\N	\N	\N
2331	2025-02-27	81.54	\N	\N	\N	\N
2332	2025-02-28	94.13	\N	\N	\N	\N
2333	2025-02-01	103.23	\N	\N	\N	\N
2334	2025-02-02	53.43	\N	\N	\N	\N
2335	2025-02-03	53.82	\N	\N	\N	\N
2336	2025-02-04	50.57	\N	\N	\N	\N
2337	2025-02-05	112.96	\N	\N	\N	\N
2338	2025-02-06	97.45	\N	\N	\N	\N
2339	2025-02-07	144.83	\N	\N	\N	\N
2340	2025-02-08	122.22	\N	\N	\N	\N
2341	2025-02-09	51.52	\N	\N	\N	\N
2342	2025-02-10	87.63	\N	\N	\N	\N
2343	2025-02-11	147.06	\N	\N	\N	\N
2344	2025-02-12	137.92	\N	\N	\N	\N
2345	2025-02-13	74.37	\N	\N	\N	\N
2346	2025-02-14	121.66	\N	\N	\N	\N
2347	2025-02-15	58.87	\N	\N	\N	\N
2348	2025-02-16	71.00	\N	\N	\N	\N
2349	2025-02-17	53.57	\N	\N	\N	\N
2350	2025-02-18	135.64	\N	\N	\N	\N
2351	2025-02-19	108.83	\N	\N	\N	\N
2352	2025-02-20	74.80	\N	\N	\N	\N
2353	2025-02-21	146.33	\N	\N	\N	\N
2354	2025-02-22	88.15	\N	\N	\N	\N
2355	2025-02-23	69.36	\N	\N	\N	\N
2356	2025-02-24	65.76	\N	\N	\N	\N
2357	2025-02-25	68.35	\N	\N	\N	\N
2358	2025-02-26	52.16	\N	\N	\N	\N
2359	2025-02-27	60.00	\N	\N	\N	\N
2360	2025-02-28	87.52	\N	\N	\N	\N
2361	2025-02-01	53.61	\N	\N	\N	\N
2362	2025-02-02	110.20	\N	\N	\N	\N
2363	2025-02-03	140.03	\N	\N	\N	\N
2364	2025-02-04	52.03	\N	\N	\N	\N
2365	2025-02-05	78.17	\N	\N	\N	\N
2366	2025-02-06	72.03	\N	\N	\N	\N
2367	2025-02-07	96.81	\N	\N	\N	\N
2368	2025-02-08	60.64	\N	\N	\N	\N
2369	2025-02-09	113.23	\N	\N	\N	\N
2370	2025-02-10	128.83	\N	\N	\N	\N
2371	2025-02-11	134.04	\N	\N	\N	\N
2372	2025-02-12	98.12	\N	\N	\N	\N
2373	2025-02-13	59.52	\N	\N	\N	\N
2374	2025-02-14	117.35	\N	\N	\N	\N
2375	2025-02-15	102.64	\N	\N	\N	\N
2376	2025-02-16	113.00	\N	\N	\N	\N
2377	2025-02-17	145.81	\N	\N	\N	\N
2378	2025-02-18	146.25	\N	\N	\N	\N
2379	2025-02-19	51.17	\N	\N	\N	\N
2380	2025-02-20	87.55	\N	\N	\N	\N
2381	2025-02-21	133.98	\N	\N	\N	\N
2382	2025-02-22	98.96	\N	\N	\N	\N
2383	2025-02-23	89.74	\N	\N	\N	\N
2384	2025-02-24	78.43	\N	\N	\N	\N
2385	2025-02-25	90.88	\N	\N	\N	\N
2386	2025-02-26	56.41	\N	\N	\N	\N
2387	2025-02-27	75.64	\N	\N	\N	\N
2388	2025-02-28	97.61	\N	\N	\N	\N
2389	2025-02-01	137.95	\N	\N	\N	\N
2390	2025-02-02	122.17	\N	\N	\N	\N
2391	2025-02-03	95.61	\N	\N	\N	\N
2392	2025-02-04	86.21	\N	\N	\N	\N
2393	2025-02-05	139.44	\N	\N	\N	\N
2394	2025-02-06	65.93	\N	\N	\N	\N
2395	2025-02-07	121.91	\N	\N	\N	\N
2396	2025-02-08	51.49	\N	\N	\N	\N
2397	2025-02-09	103.08	\N	\N	\N	\N
2398	2025-02-10	61.84	\N	\N	\N	\N
2399	2025-02-11	71.34	\N	\N	\N	\N
2400	2025-02-12	132.86	\N	\N	\N	\N
2401	2025-02-13	82.20	\N	\N	\N	\N
2402	2025-02-14	137.06	\N	\N	\N	\N
2403	2025-02-15	54.89	\N	\N	\N	\N
2404	2025-02-16	86.13	\N	\N	\N	\N
2405	2025-02-17	56.39	\N	\N	\N	\N
2406	2025-02-18	70.76	\N	\N	\N	\N
2407	2025-02-19	84.33	\N	\N	\N	\N
2408	2025-02-20	95.99	\N	\N	\N	\N
2409	2025-02-21	144.65	\N	\N	\N	\N
2410	2025-02-22	139.26	\N	\N	\N	\N
2411	2025-02-23	112.87	\N	\N	\N	\N
2412	2025-02-24	135.68	\N	\N	\N	\N
2413	2025-02-25	67.28	\N	\N	\N	\N
2414	2025-02-26	68.47	\N	\N	\N	\N
2415	2025-02-27	65.90	\N	\N	\N	\N
2416	2025-02-28	114.31	\N	\N	\N	\N
2417	2025-02-01	69.82	\N	\N	\N	\N
2418	2025-02-02	74.86	\N	\N	\N	\N
2419	2025-02-03	102.25	\N	\N	\N	\N
2420	2025-02-04	50.47	\N	\N	\N	\N
2421	2025-02-05	66.17	\N	\N	\N	\N
2422	2025-02-06	136.72	\N	\N	\N	\N
2423	2025-02-07	80.92	\N	\N	\N	\N
2424	2025-02-08	98.72	\N	\N	\N	\N
2425	2025-02-09	80.52	\N	\N	\N	\N
2426	2025-02-10	99.53	\N	\N	\N	\N
2427	2025-02-11	149.52	\N	\N	\N	\N
2428	2025-02-12	114.08	\N	\N	\N	\N
2429	2025-02-13	106.85	\N	\N	\N	\N
2430	2025-02-14	104.41	\N	\N	\N	\N
2431	2025-02-15	54.73	\N	\N	\N	\N
2432	2025-02-16	91.32	\N	\N	\N	\N
2433	2025-02-17	98.22	\N	\N	\N	\N
2434	2025-02-18	55.40	\N	\N	\N	\N
2435	2025-02-19	86.35	\N	\N	\N	\N
2436	2025-02-20	113.55	\N	\N	\N	\N
2437	2025-02-21	101.84	\N	\N	\N	\N
2438	2025-02-22	133.19	\N	\N	\N	\N
2439	2025-02-23	106.42	\N	\N	\N	\N
2440	2025-02-24	102.94	\N	\N	\N	\N
2441	2025-02-25	102.54	\N	\N	\N	\N
2442	2025-02-26	101.17	\N	\N	\N	\N
2443	2025-02-27	87.42	\N	\N	\N	\N
2444	2025-02-28	134.81	\N	\N	\N	\N
2445	2025-02-01	127.20	\N	\N	\N	\N
2446	2025-02-02	117.87	\N	\N	\N	\N
2447	2025-02-03	72.75	\N	\N	\N	\N
2448	2025-02-04	133.45	\N	\N	\N	\N
2449	2025-02-05	82.23	\N	\N	\N	\N
2450	2025-02-06	79.11	\N	\N	\N	\N
2451	2025-02-07	129.70	\N	\N	\N	\N
2452	2025-02-08	142.10	\N	\N	\N	\N
2453	2025-02-09	61.07	\N	\N	\N	\N
2454	2025-02-10	137.22	\N	\N	\N	\N
2455	2025-02-11	114.95	\N	\N	\N	\N
2456	2025-02-12	55.64	\N	\N	\N	\N
2457	2025-02-13	68.54	\N	\N	\N	\N
2458	2025-02-14	117.33	\N	\N	\N	\N
2459	2025-02-15	107.46	\N	\N	\N	\N
2460	2025-02-16	104.45	\N	\N	\N	\N
2461	2025-02-17	64.95	\N	\N	\N	\N
2462	2025-02-18	141.73	\N	\N	\N	\N
2463	2025-02-19	88.98	\N	\N	\N	\N
2464	2025-02-20	92.92	\N	\N	\N	\N
2465	2025-02-21	133.02	\N	\N	\N	\N
2466	2025-02-22	55.55	\N	\N	\N	\N
2467	2025-02-23	68.74	\N	\N	\N	\N
2468	2025-02-24	102.99	\N	\N	\N	\N
2469	2025-02-25	64.39	\N	\N	\N	\N
2470	2025-02-26	127.45	\N	\N	\N	\N
2471	2025-02-27	128.98	\N	\N	\N	\N
2472	2025-02-28	140.63	\N	\N	\N	\N
2473	2025-02-01	90.59	\N	\N	\N	\N
2474	2025-02-02	93.07	\N	\N	\N	\N
2475	2025-02-03	126.15	\N	\N	\N	\N
2476	2025-02-04	74.50	\N	\N	\N	\N
2477	2025-02-05	105.38	\N	\N	\N	\N
2478	2025-02-06	52.49	\N	\N	\N	\N
2479	2025-02-07	84.26	\N	\N	\N	\N
2480	2025-02-08	96.01	\N	\N	\N	\N
2481	2025-02-09	86.78	\N	\N	\N	\N
2482	2025-02-10	66.53	\N	\N	\N	\N
2483	2025-02-11	136.39	\N	\N	\N	\N
2484	2025-02-12	100.05	\N	\N	\N	\N
2485	2025-02-13	51.77	\N	\N	\N	\N
2486	2025-02-14	130.43	\N	\N	\N	\N
2487	2025-02-15	119.88	\N	\N	\N	\N
2488	2025-02-16	69.61	\N	\N	\N	\N
2489	2025-02-17	88.53	\N	\N	\N	\N
2490	2025-02-18	65.59	\N	\N	\N	\N
2491	2025-02-19	139.83	\N	\N	\N	\N
2492	2025-02-20	132.73	\N	\N	\N	\N
2493	2025-02-21	125.50	\N	\N	\N	\N
2494	2025-02-22	52.55	\N	\N	\N	\N
2495	2025-02-23	132.12	\N	\N	\N	\N
2496	2025-02-24	54.73	\N	\N	\N	\N
2497	2025-02-25	110.84	\N	\N	\N	\N
2498	2025-02-26	140.69	\N	\N	\N	\N
2499	2025-02-27	136.06	\N	\N	\N	\N
2500	2025-02-28	117.47	\N	\N	\N	\N
2501	2025-02-01	145.99	\N	\N	\N	\N
2502	2025-02-02	79.27	\N	\N	\N	\N
2503	2025-02-03	123.20	\N	\N	\N	\N
2504	2025-02-04	91.22	\N	\N	\N	\N
2505	2025-02-05	95.49	\N	\N	\N	\N
2506	2025-02-06	107.88	\N	\N	\N	\N
2507	2025-02-07	106.02	\N	\N	\N	\N
2508	2025-02-08	51.70	\N	\N	\N	\N
2509	2025-02-09	127.73	\N	\N	\N	\N
2510	2025-02-10	87.52	\N	\N	\N	\N
2511	2025-02-11	69.75	\N	\N	\N	\N
2512	2025-02-12	132.91	\N	\N	\N	\N
2513	2025-02-13	69.90	\N	\N	\N	\N
2514	2025-02-14	108.45	\N	\N	\N	\N
2515	2025-02-15	64.50	\N	\N	\N	\N
2516	2025-02-16	127.12	\N	\N	\N	\N
2517	2025-02-17	51.07	\N	\N	\N	\N
2518	2025-02-18	112.59	\N	\N	\N	\N
2519	2025-02-19	96.60	\N	\N	\N	\N
2520	2025-02-20	77.57	\N	\N	\N	\N
2521	2025-02-21	123.59	\N	\N	\N	\N
2522	2025-02-22	84.79	\N	\N	\N	\N
2523	2025-02-23	119.55	\N	\N	\N	\N
2524	2025-02-24	92.28	\N	\N	\N	\N
2525	2025-02-25	138.84	\N	\N	\N	\N
2526	2025-02-26	105.23	\N	\N	\N	\N
2527	2025-02-27	106.76	\N	\N	\N	\N
2528	2025-02-28	60.39	\N	\N	\N	\N
2529	2025-02-01	80.59	\N	\N	\N	\N
2530	2025-02-02	112.52	\N	\N	\N	\N
2531	2025-02-03	145.35	\N	\N	\N	\N
2532	2025-02-04	75.82	\N	\N	\N	\N
2533	2025-02-05	132.33	\N	\N	\N	\N
2534	2025-02-06	89.47	\N	\N	\N	\N
2535	2025-02-07	127.50	\N	\N	\N	\N
2536	2025-02-08	96.87	\N	\N	\N	\N
2537	2025-02-09	82.73	\N	\N	\N	\N
2538	2025-02-10	69.52	\N	\N	\N	\N
2539	2025-02-11	81.39	\N	\N	\N	\N
2540	2025-02-12	119.56	\N	\N	\N	\N
2541	2025-02-13	110.00	\N	\N	\N	\N
2542	2025-02-14	57.49	\N	\N	\N	\N
2543	2025-02-15	92.89	\N	\N	\N	\N
2544	2025-02-16	107.79	\N	\N	\N	\N
2545	2025-02-17	78.81	\N	\N	\N	\N
2546	2025-02-18	105.10	\N	\N	\N	\N
2547	2025-02-19	108.08	\N	\N	\N	\N
2548	2025-02-20	107.83	\N	\N	\N	\N
2549	2025-02-21	87.15	\N	\N	\N	\N
2550	2025-02-22	121.42	\N	\N	\N	\N
2551	2025-02-23	91.36	\N	\N	\N	\N
2552	2025-02-24	143.48	\N	\N	\N	\N
2553	2025-02-25	70.39	\N	\N	\N	\N
2554	2025-02-26	112.64	\N	\N	\N	\N
2555	2025-02-27	99.64	\N	\N	\N	\N
2556	2025-02-28	103.11	\N	\N	\N	\N
2557	2025-02-01	138.06	\N	\N	\N	\N
2558	2025-02-02	83.48	\N	\N	\N	\N
2559	2025-02-03	101.75	\N	\N	\N	\N
2560	2025-02-04	129.11	\N	\N	\N	\N
2561	2025-02-05	104.12	\N	\N	\N	\N
2562	2025-02-06	68.82	\N	\N	\N	\N
2563	2025-02-07	126.13	\N	\N	\N	\N
2564	2025-02-08	114.90	\N	\N	\N	\N
2565	2025-02-09	111.46	\N	\N	\N	\N
2566	2025-02-10	60.92	\N	\N	\N	\N
2567	2025-02-11	104.15	\N	\N	\N	\N
2568	2025-02-12	137.82	\N	\N	\N	\N
2569	2025-02-13	137.71	\N	\N	\N	\N
2570	2025-02-14	138.00	\N	\N	\N	\N
2571	2025-02-15	60.47	\N	\N	\N	\N
2572	2025-02-16	138.95	\N	\N	\N	\N
2573	2025-02-17	138.21	\N	\N	\N	\N
2574	2025-02-18	76.77	\N	\N	\N	\N
2575	2025-02-19	133.72	\N	\N	\N	\N
2576	2025-02-20	88.96	\N	\N	\N	\N
2577	2025-02-21	110.50	\N	\N	\N	\N
2578	2025-02-22	123.16	\N	\N	\N	\N
2579	2025-02-23	55.63	\N	\N	\N	\N
2580	2025-02-24	58.98	\N	\N	\N	\N
2581	2025-02-25	121.91	\N	\N	\N	\N
2582	2025-02-26	72.82	\N	\N	\N	\N
2583	2025-02-27	129.36	\N	\N	\N	\N
2584	2025-02-28	75.23	\N	\N	\N	\N
2585	2025-02-01	136.79	\N	\N	\N	\N
2586	2025-02-02	56.78	\N	\N	\N	\N
2587	2025-02-03	65.71	\N	\N	\N	\N
2588	2025-02-04	87.08	\N	\N	\N	\N
2589	2025-02-05	54.98	\N	\N	\N	\N
2590	2025-02-06	61.11	\N	\N	\N	\N
2591	2025-02-07	95.71	\N	\N	\N	\N
2592	2025-02-08	110.93	\N	\N	\N	\N
2593	2025-02-09	111.60	\N	\N	\N	\N
2594	2025-02-10	110.77	\N	\N	\N	\N
2595	2025-02-11	111.87	\N	\N	\N	\N
2596	2025-02-12	88.57	\N	\N	\N	\N
2597	2025-02-13	94.64	\N	\N	\N	\N
2598	2025-02-14	123.35	\N	\N	\N	\N
2599	2025-02-15	90.92	\N	\N	\N	\N
2600	2025-02-16	118.62	\N	\N	\N	\N
2601	2025-02-17	66.41	\N	\N	\N	\N
2602	2025-02-18	74.54	\N	\N	\N	\N
2603	2025-02-19	79.97	\N	\N	\N	\N
2604	2025-02-20	137.18	\N	\N	\N	\N
2605	2025-02-21	128.66	\N	\N	\N	\N
2606	2025-02-22	127.83	\N	\N	\N	\N
2607	2025-02-23	115.36	\N	\N	\N	\N
2608	2025-02-24	96.28	\N	\N	\N	\N
2609	2025-02-25	112.86	\N	\N	\N	\N
2610	2025-02-26	56.89	\N	\N	\N	\N
2611	2025-02-27	129.80	\N	\N	\N	\N
2612	2025-02-28	121.70	\N	\N	\N	\N
2613	2025-02-01	72.41	\N	\N	\N	\N
2614	2025-02-02	98.18	\N	\N	\N	\N
2615	2025-02-03	118.16	\N	\N	\N	\N
2616	2025-02-04	129.68	\N	\N	\N	\N
2617	2025-02-05	91.79	\N	\N	\N	\N
2618	2025-02-06	117.02	\N	\N	\N	\N
2619	2025-02-07	61.95	\N	\N	\N	\N
2620	2025-02-08	75.59	\N	\N	\N	\N
2621	2025-02-09	145.03	\N	\N	\N	\N
2622	2025-02-10	146.03	\N	\N	\N	\N
2623	2025-02-11	121.68	\N	\N	\N	\N
2624	2025-02-12	101.84	\N	\N	\N	\N
2625	2025-02-13	73.53	\N	\N	\N	\N
2626	2025-02-14	104.94	\N	\N	\N	\N
2627	2025-02-15	69.31	\N	\N	\N	\N
2628	2025-02-16	118.47	\N	\N	\N	\N
2629	2025-02-17	89.31	\N	\N	\N	\N
2630	2025-02-18	104.78	\N	\N	\N	\N
2631	2025-02-19	140.90	\N	\N	\N	\N
2632	2025-02-20	96.49	\N	\N	\N	\N
2633	2025-02-21	128.79	\N	\N	\N	\N
2634	2025-02-22	52.94	\N	\N	\N	\N
2635	2025-02-23	140.15	\N	\N	\N	\N
2636	2025-02-24	134.06	\N	\N	\N	\N
2637	2025-02-25	139.13	\N	\N	\N	\N
2638	2025-02-26	59.08	\N	\N	\N	\N
2639	2025-02-27	73.00	\N	\N	\N	\N
2640	2025-02-28	53.17	\N	\N	\N	\N
2641	2025-02-01	92.52	\N	\N	\N	\N
2642	2025-02-02	83.41	\N	\N	\N	\N
2643	2025-02-03	91.36	\N	\N	\N	\N
2644	2025-02-04	124.43	\N	\N	\N	\N
2645	2025-02-05	82.36	\N	\N	\N	\N
2646	2025-02-06	70.50	\N	\N	\N	\N
2647	2025-02-07	119.02	\N	\N	\N	\N
2648	2025-02-08	64.20	\N	\N	\N	\N
2649	2025-02-09	64.32	\N	\N	\N	\N
2650	2025-02-10	73.28	\N	\N	\N	\N
2651	2025-02-11	86.51	\N	\N	\N	\N
2652	2025-02-12	60.42	\N	\N	\N	\N
2653	2025-02-13	108.21	\N	\N	\N	\N
2654	2025-02-14	66.44	\N	\N	\N	\N
2655	2025-02-15	133.83	\N	\N	\N	\N
2656	2025-02-16	63.70	\N	\N	\N	\N
2657	2025-02-17	112.14	\N	\N	\N	\N
2658	2025-02-18	142.74	\N	\N	\N	\N
2659	2025-02-19	129.23	\N	\N	\N	\N
2660	2025-02-20	83.82	\N	\N	\N	\N
2661	2025-02-21	112.85	\N	\N	\N	\N
2662	2025-02-22	118.78	\N	\N	\N	\N
2663	2025-02-23	103.44	\N	\N	\N	\N
2664	2025-02-24	136.54	\N	\N	\N	\N
2665	2025-02-25	94.05	\N	\N	\N	\N
2666	2025-02-26	52.60	\N	\N	\N	\N
2667	2025-02-27	97.44	\N	\N	\N	\N
2668	2025-02-28	100.55	\N	\N	\N	\N
2669	2025-02-01	68.84	\N	\N	\N	\N
2670	2025-02-02	88.93	\N	\N	\N	\N
2671	2025-02-03	135.70	\N	\N	\N	\N
2672	2025-02-04	143.27	\N	\N	\N	\N
2673	2025-02-05	87.70	\N	\N	\N	\N
2674	2025-02-06	108.67	\N	\N	\N	\N
2675	2025-02-07	89.35	\N	\N	\N	\N
2676	2025-02-08	106.48	\N	\N	\N	\N
2677	2025-02-09	89.82	\N	\N	\N	\N
2678	2025-02-10	146.78	\N	\N	\N	\N
2679	2025-02-11	63.82	\N	\N	\N	\N
2680	2025-02-12	100.20	\N	\N	\N	\N
2681	2025-02-13	63.51	\N	\N	\N	\N
2682	2025-02-14	103.18	\N	\N	\N	\N
2683	2025-02-15	140.34	\N	\N	\N	\N
2684	2025-02-16	96.46	\N	\N	\N	\N
2685	2025-02-17	105.68	\N	\N	\N	\N
2686	2025-02-18	112.12	\N	\N	\N	\N
2687	2025-02-19	134.91	\N	\N	\N	\N
2688	2025-02-20	101.37	\N	\N	\N	\N
2689	2025-02-21	132.15	\N	\N	\N	\N
2690	2025-02-22	76.48	\N	\N	\N	\N
2691	2025-02-23	135.06	\N	\N	\N	\N
2692	2025-02-24	109.81	\N	\N	\N	\N
2693	2025-02-25	57.07	\N	\N	\N	\N
2694	2025-02-26	141.47	\N	\N	\N	\N
2695	2025-02-27	82.34	\N	\N	\N	\N
2696	2025-02-28	69.83	\N	\N	\N	\N
2697	2025-02-01	65.72	\N	\N	\N	\N
2698	2025-02-02	103.29	\N	\N	\N	\N
2699	2025-02-03	89.66	\N	\N	\N	\N
2700	2025-02-04	117.16	\N	\N	\N	\N
2701	2025-02-05	129.67	\N	\N	\N	\N
2702	2025-02-06	100.00	\N	\N	\N	\N
2703	2025-02-07	120.20	\N	\N	\N	\N
2704	2025-02-08	79.40	\N	\N	\N	\N
2705	2025-02-09	119.46	\N	\N	\N	\N
2706	2025-02-10	123.17	\N	\N	\N	\N
2707	2025-02-11	98.94	\N	\N	\N	\N
2708	2025-02-12	134.91	\N	\N	\N	\N
2709	2025-02-13	59.74	\N	\N	\N	\N
2710	2025-02-14	84.69	\N	\N	\N	\N
2711	2025-02-15	110.11	\N	\N	\N	\N
2712	2025-02-16	83.72	\N	\N	\N	\N
2713	2025-02-17	115.56	\N	\N	\N	\N
2714	2025-02-18	148.75	\N	\N	\N	\N
2715	2025-02-19	92.69	\N	\N	\N	\N
2716	2025-02-20	57.19	\N	\N	\N	\N
2717	2025-02-21	129.29	\N	\N	\N	\N
2718	2025-02-22	116.36	\N	\N	\N	\N
2719	2025-02-23	137.01	\N	\N	\N	\N
2720	2025-02-24	100.51	\N	\N	\N	\N
2721	2025-02-25	67.60	\N	\N	\N	\N
2722	2025-02-26	130.92	\N	\N	\N	\N
2723	2025-02-27	70.09	\N	\N	\N	\N
2724	2025-02-28	70.61	\N	\N	\N	\N
2725	2025-02-01	82.48	\N	\N	\N	\N
2726	2025-02-02	69.37	\N	\N	\N	\N
2727	2025-02-03	61.65	\N	\N	\N	\N
2728	2025-02-04	138.10	\N	\N	\N	\N
2729	2025-02-05	116.98	\N	\N	\N	\N
2730	2025-02-06	72.03	\N	\N	\N	\N
2731	2025-02-07	149.62	\N	\N	\N	\N
2732	2025-02-08	82.88	\N	\N	\N	\N
2733	2025-02-09	93.03	\N	\N	\N	\N
2734	2025-02-10	146.82	\N	\N	\N	\N
2735	2025-02-11	147.29	\N	\N	\N	\N
2736	2025-02-12	135.00	\N	\N	\N	\N
2737	2025-02-13	57.10	\N	\N	\N	\N
2738	2025-02-14	141.88	\N	\N	\N	\N
2739	2025-02-15	90.05	\N	\N	\N	\N
2740	2025-02-16	119.69	\N	\N	\N	\N
2741	2025-02-17	79.55	\N	\N	\N	\N
2742	2025-02-18	66.75	\N	\N	\N	\N
2743	2025-02-19	77.26	\N	\N	\N	\N
2744	2025-02-20	66.38	\N	\N	\N	\N
2745	2025-02-21	88.35	\N	\N	\N	\N
2746	2025-02-22	83.25	\N	\N	\N	\N
2747	2025-02-23	108.88	\N	\N	\N	\N
2748	2025-02-24	105.05	\N	\N	\N	\N
2749	2025-02-25	96.50	\N	\N	\N	\N
2750	2025-02-26	138.25	\N	\N	\N	\N
2751	2025-02-27	70.79	\N	\N	\N	\N
2752	2025-02-28	131.13	\N	\N	\N	\N
2753	2025-02-01	85.54	\N	\N	\N	\N
2754	2025-02-02	103.25	\N	\N	\N	\N
2755	2025-02-03	108.85	\N	\N	\N	\N
2756	2025-02-04	99.08	\N	\N	\N	\N
2757	2025-02-05	134.34	\N	\N	\N	\N
2758	2025-02-06	93.55	\N	\N	\N	\N
2759	2025-02-07	119.95	\N	\N	\N	\N
2760	2025-02-08	81.53	\N	\N	\N	\N
2761	2025-02-09	134.06	\N	\N	\N	\N
2762	2025-02-10	67.98	\N	\N	\N	\N
2763	2025-02-11	87.45	\N	\N	\N	\N
2764	2025-02-12	72.53	\N	\N	\N	\N
2765	2025-02-13	96.44	\N	\N	\N	\N
2766	2025-02-14	83.67	\N	\N	\N	\N
2767	2025-02-15	69.51	\N	\N	\N	\N
2768	2025-02-16	126.60	\N	\N	\N	\N
2769	2025-02-17	133.17	\N	\N	\N	\N
2770	2025-02-18	117.17	\N	\N	\N	\N
2771	2025-02-19	67.37	\N	\N	\N	\N
2772	2025-02-20	139.80	\N	\N	\N	\N
2773	2025-02-21	100.47	\N	\N	\N	\N
2774	2025-02-22	144.95	\N	\N	\N	\N
2775	2025-02-23	74.00	\N	\N	\N	\N
2776	2025-02-24	55.41	\N	\N	\N	\N
2777	2025-02-25	147.66	\N	\N	\N	\N
2778	2025-02-26	59.44	\N	\N	\N	\N
2779	2025-02-27	77.92	\N	\N	\N	\N
2780	2025-02-28	127.75	\N	\N	\N	\N
2781	2025-02-01	141.76	\N	\N	\N	\N
2782	2025-02-02	123.95	\N	\N	\N	\N
2783	2025-02-03	51.09	\N	\N	\N	\N
2784	2025-02-04	96.06	\N	\N	\N	\N
2785	2025-02-05	136.26	\N	\N	\N	\N
2786	2025-02-06	52.92	\N	\N	\N	\N
2787	2025-02-07	141.84	\N	\N	\N	\N
2788	2025-02-08	71.17	\N	\N	\N	\N
2789	2025-02-09	127.71	\N	\N	\N	\N
2790	2025-02-10	84.02	\N	\N	\N	\N
2791	2025-02-11	54.57	\N	\N	\N	\N
2792	2025-02-12	57.07	\N	\N	\N	\N
2793	2025-02-13	110.23	\N	\N	\N	\N
2794	2025-02-14	79.77	\N	\N	\N	\N
2795	2025-02-15	64.73	\N	\N	\N	\N
2796	2025-02-16	98.08	\N	\N	\N	\N
2797	2025-02-17	144.11	\N	\N	\N	\N
2798	2025-02-18	99.76	\N	\N	\N	\N
2799	2025-02-19	70.16	\N	\N	\N	\N
2800	2025-02-20	141.28	\N	\N	\N	\N
2801	2025-02-21	100.72	\N	\N	\N	\N
2802	2025-02-22	132.74	\N	\N	\N	\N
2803	2025-02-23	56.21	\N	\N	\N	\N
2804	2025-02-24	96.01	\N	\N	\N	\N
2805	2025-02-25	93.52	\N	\N	\N	\N
2806	2025-02-26	119.27	\N	\N	\N	\N
2807	2025-02-27	104.68	\N	\N	\N	\N
2808	2025-02-28	59.41	\N	\N	\N	\N
2809	2025-02-01	52.22	\N	\N	\N	\N
2810	2025-02-02	141.70	\N	\N	\N	\N
2811	2025-02-03	114.27	\N	\N	\N	\N
2812	2025-02-04	94.32	\N	\N	\N	\N
2813	2025-02-05	137.92	\N	\N	\N	\N
2814	2025-02-06	88.34	\N	\N	\N	\N
2815	2025-02-07	140.18	\N	\N	\N	\N
2816	2025-02-08	119.33	\N	\N	\N	\N
2817	2025-02-09	134.96	\N	\N	\N	\N
2818	2025-02-10	65.97	\N	\N	\N	\N
2819	2025-02-11	107.31	\N	\N	\N	\N
2820	2025-02-12	86.14	\N	\N	\N	\N
2821	2025-02-13	84.98	\N	\N	\N	\N
2822	2025-02-14	145.88	\N	\N	\N	\N
2823	2025-02-15	51.13	\N	\N	\N	\N
2824	2025-02-16	80.86	\N	\N	\N	\N
2825	2025-02-17	108.44	\N	\N	\N	\N
2826	2025-02-18	93.29	\N	\N	\N	\N
2827	2025-02-19	70.63	\N	\N	\N	\N
2828	2025-02-20	119.66	\N	\N	\N	\N
2829	2025-02-21	123.08	\N	\N	\N	\N
2830	2025-02-22	88.03	\N	\N	\N	\N
2831	2025-02-23	116.26	\N	\N	\N	\N
2832	2025-02-24	146.78	\N	\N	\N	\N
2833	2025-02-25	96.29	\N	\N	\N	\N
2834	2025-02-26	105.54	\N	\N	\N	\N
2835	2025-02-27	110.89	\N	\N	\N	\N
2836	2025-02-28	71.18	\N	\N	\N	\N
2837	2025-02-01	120.68	\N	\N	\N	\N
2838	2025-02-02	127.13	\N	\N	\N	\N
2839	2025-02-03	104.08	\N	\N	\N	\N
2840	2025-02-04	53.88	\N	\N	\N	\N
2841	2025-02-05	118.37	\N	\N	\N	\N
2842	2025-02-06	145.84	\N	\N	\N	\N
2843	2025-02-07	90.39	\N	\N	\N	\N
2844	2025-02-08	91.60	\N	\N	\N	\N
2845	2025-02-09	69.73	\N	\N	\N	\N
2846	2025-02-10	103.53	\N	\N	\N	\N
2847	2025-02-11	71.37	\N	\N	\N	\N
2848	2025-02-12	112.80	\N	\N	\N	\N
2849	2025-02-13	53.40	\N	\N	\N	\N
2850	2025-02-14	68.54	\N	\N	\N	\N
2851	2025-02-15	149.25	\N	\N	\N	\N
2852	2025-02-16	105.15	\N	\N	\N	\N
2853	2025-02-17	102.57	\N	\N	\N	\N
2854	2025-02-18	78.31	\N	\N	\N	\N
2855	2025-02-19	112.90	\N	\N	\N	\N
2856	2025-02-20	117.45	\N	\N	\N	\N
2857	2025-02-21	50.72	\N	\N	\N	\N
2858	2025-02-22	113.10	\N	\N	\N	\N
2859	2025-02-23	138.13	\N	\N	\N	\N
2860	2025-02-24	50.73	\N	\N	\N	\N
2861	2025-02-25	120.60	\N	\N	\N	\N
2862	2025-02-26	107.92	\N	\N	\N	\N
2863	2025-02-27	102.98	\N	\N	\N	\N
2864	2025-02-28	133.33	\N	\N	\N	\N
2865	2024-04-01	137.87	\N	\N	\N	\N
2866	2024-04-02	91.77	\N	\N	\N	\N
2867	2024-04-03	94.38	\N	\N	\N	\N
2868	2024-04-04	101.75	\N	\N	\N	\N
2869	2024-04-05	120.36	\N	\N	\N	\N
2870	2024-04-06	57.44	\N	\N	\N	\N
2871	2024-04-07	78.41	\N	\N	\N	\N
2872	2024-04-08	74.32	\N	\N	\N	\N
2873	2024-04-09	95.85	\N	\N	\N	\N
2874	2024-04-10	93.60	\N	\N	\N	\N
2875	2024-04-11	86.80	\N	\N	\N	\N
2876	2024-04-12	115.35	\N	\N	\N	\N
2877	2024-04-13	145.84	\N	\N	\N	\N
2878	2024-04-14	106.97	\N	\N	\N	\N
2879	2024-04-15	98.44	\N	\N	\N	\N
2880	2024-04-16	137.29	\N	\N	\N	\N
2881	2024-04-17	139.39	\N	\N	\N	\N
2882	2024-04-18	107.35	\N	\N	\N	\N
2883	2024-04-19	137.82	\N	\N	\N	\N
2884	2024-04-20	131.88	\N	\N	\N	\N
2885	2024-04-21	100.20	\N	\N	\N	\N
2886	2024-04-22	89.92	\N	\N	\N	\N
2887	2024-04-23	101.50	\N	\N	\N	\N
2888	2024-04-24	58.76	\N	\N	\N	\N
2889	2024-04-25	146.59	\N	\N	\N	\N
2890	2024-04-26	143.60	\N	\N	\N	\N
2891	2024-04-27	64.41	\N	\N	\N	\N
2892	2024-04-28	117.82	\N	\N	\N	\N
2893	2024-04-29	56.69	\N	\N	\N	\N
2894	2024-04-30	57.59	\N	\N	\N	\N
2895	2024-04-01	123.78	\N	\N	\N	\N
2896	2024-04-02	140.81	\N	\N	\N	\N
2897	2024-04-03	125.27	\N	\N	\N	\N
2898	2024-04-04	74.34	\N	\N	\N	\N
2899	2024-04-05	60.08	\N	\N	\N	\N
2900	2024-04-06	57.99	\N	\N	\N	\N
2901	2024-04-07	51.91	\N	\N	\N	\N
2902	2024-04-08	75.23	\N	\N	\N	\N
2903	2024-04-09	142.79	\N	\N	\N	\N
2904	2024-04-10	134.36	\N	\N	\N	\N
2905	2024-04-11	124.13	\N	\N	\N	\N
2906	2024-04-12	143.51	\N	\N	\N	\N
2907	2024-04-13	91.58	\N	\N	\N	\N
2908	2024-04-14	77.33	\N	\N	\N	\N
2909	2024-04-15	71.30	\N	\N	\N	\N
2910	2024-04-16	65.73	\N	\N	\N	\N
2911	2024-04-17	138.79	\N	\N	\N	\N
2912	2024-04-18	135.96	\N	\N	\N	\N
2913	2024-04-19	61.48	\N	\N	\N	\N
2914	2024-04-20	97.89	\N	\N	\N	\N
2915	2024-04-21	140.25	\N	\N	\N	\N
2916	2024-04-22	96.31	\N	\N	\N	\N
2917	2024-04-23	129.15	\N	\N	\N	\N
2918	2024-04-24	80.96	\N	\N	\N	\N
2919	2024-04-25	92.59	\N	\N	\N	\N
2920	2024-04-26	130.77	\N	\N	\N	\N
2921	2024-04-27	83.55	\N	\N	\N	\N
2922	2024-04-28	114.02	\N	\N	\N	\N
2923	2024-04-29	74.88	\N	\N	\N	\N
2924	2024-04-30	119.82	\N	\N	\N	\N
2925	2024-04-01	97.72	\N	\N	\N	\N
2926	2024-04-02	130.66	\N	\N	\N	\N
2927	2024-04-03	67.98	\N	\N	\N	\N
2928	2024-04-04	118.45	\N	\N	\N	\N
2929	2024-04-05	143.97	\N	\N	\N	\N
2930	2024-04-06	51.30	\N	\N	\N	\N
2931	2024-04-07	108.00	\N	\N	\N	\N
2932	2024-04-08	66.53	\N	\N	\N	\N
2933	2024-04-09	111.04	\N	\N	\N	\N
2934	2024-04-10	55.60	\N	\N	\N	\N
2935	2024-04-11	74.01	\N	\N	\N	\N
2936	2024-04-12	71.31	\N	\N	\N	\N
2937	2024-04-13	101.71	\N	\N	\N	\N
2938	2024-04-14	84.87	\N	\N	\N	\N
2939	2024-04-15	68.10	\N	\N	\N	\N
2940	2024-04-16	91.68	\N	\N	\N	\N
2941	2024-04-17	81.37	\N	\N	\N	\N
2942	2024-04-18	147.96	\N	\N	\N	\N
2943	2024-04-19	56.60	\N	\N	\N	\N
2944	2024-04-20	79.99	\N	\N	\N	\N
2945	2024-04-21	88.10	\N	\N	\N	\N
2946	2024-04-22	61.98	\N	\N	\N	\N
2947	2024-04-23	111.26	\N	\N	\N	\N
2948	2024-04-24	136.30	\N	\N	\N	\N
2949	2024-04-25	137.75	\N	\N	\N	\N
2950	2024-04-26	143.38	\N	\N	\N	\N
2951	2024-04-27	137.18	\N	\N	\N	\N
2952	2024-04-28	133.57	\N	\N	\N	\N
2953	2024-04-29	133.61	\N	\N	\N	\N
2954	2024-04-30	98.12	\N	\N	\N	\N
2955	2024-04-01	90.71	\N	\N	\N	\N
2956	2024-04-02	97.62	\N	\N	\N	\N
2957	2024-04-03	73.38	\N	\N	\N	\N
2958	2024-04-04	71.74	\N	\N	\N	\N
2959	2024-04-05	105.14	\N	\N	\N	\N
2960	2024-04-06	82.31	\N	\N	\N	\N
2961	2024-04-07	98.00	\N	\N	\N	\N
2962	2024-04-08	51.85	\N	\N	\N	\N
2963	2024-04-09	94.86	\N	\N	\N	\N
2964	2024-04-10	144.46	\N	\N	\N	\N
2965	2024-04-11	58.15	\N	\N	\N	\N
2966	2024-04-12	95.40	\N	\N	\N	\N
2967	2024-04-13	128.21	\N	\N	\N	\N
2968	2024-04-14	94.78	\N	\N	\N	\N
2969	2024-04-15	101.57	\N	\N	\N	\N
2970	2024-04-16	117.81	\N	\N	\N	\N
2971	2024-04-17	93.09	\N	\N	\N	\N
2972	2024-04-18	148.02	\N	\N	\N	\N
2973	2024-04-19	116.08	\N	\N	\N	\N
2974	2024-04-20	109.59	\N	\N	\N	\N
2975	2024-04-21	119.72	\N	\N	\N	\N
2976	2024-04-22	50.93	\N	\N	\N	\N
2977	2024-04-23	89.60	\N	\N	\N	\N
2978	2024-04-24	68.80	\N	\N	\N	\N
2979	2024-04-25	50.68	\N	\N	\N	\N
2980	2024-04-26	70.48	\N	\N	\N	\N
2981	2024-04-27	86.88	\N	\N	\N	\N
2982	2024-04-28	107.45	\N	\N	\N	\N
2983	2024-04-29	116.19	\N	\N	\N	\N
2984	2024-04-30	78.63	\N	\N	\N	\N
2985	2024-04-01	124.34	\N	\N	\N	\N
2986	2024-04-02	113.05	\N	\N	\N	\N
2987	2024-04-03	65.38	\N	\N	\N	\N
2988	2024-04-04	56.40	\N	\N	\N	\N
2989	2024-04-05	52.08	\N	\N	\N	\N
2990	2024-04-06	74.49	\N	\N	\N	\N
2991	2024-04-07	81.35	\N	\N	\N	\N
2992	2024-04-08	113.81	\N	\N	\N	\N
2993	2024-04-09	114.08	\N	\N	\N	\N
2994	2024-04-10	115.76	\N	\N	\N	\N
2995	2024-04-11	67.80	\N	\N	\N	\N
2996	2024-04-12	63.99	\N	\N	\N	\N
2997	2024-04-13	78.27	\N	\N	\N	\N
2998	2024-04-14	142.24	\N	\N	\N	\N
2999	2024-04-15	103.16	\N	\N	\N	\N
3000	2024-04-16	112.68	\N	\N	\N	\N
3001	2024-04-17	124.35	\N	\N	\N	\N
3002	2024-04-18	64.24	\N	\N	\N	\N
3003	2024-04-19	141.25	\N	\N	\N	\N
3004	2024-04-20	125.37	\N	\N	\N	\N
3005	2024-04-21	95.03	\N	\N	\N	\N
3006	2024-04-22	98.89	\N	\N	\N	\N
3007	2024-04-23	124.88	\N	\N	\N	\N
3008	2024-04-24	88.73	\N	\N	\N	\N
3009	2024-04-25	137.61	\N	\N	\N	\N
3010	2024-04-26	132.63	\N	\N	\N	\N
3011	2024-04-27	149.57	\N	\N	\N	\N
3012	2024-04-28	147.63	\N	\N	\N	\N
3013	2024-04-29	142.84	\N	\N	\N	\N
3014	2024-04-30	101.12	\N	\N	\N	\N
3015	2024-04-01	92.87	\N	\N	\N	\N
3016	2024-04-02	138.52	\N	\N	\N	\N
3017	2024-04-03	144.26	\N	\N	\N	\N
3018	2024-04-04	123.68	\N	\N	\N	\N
3019	2024-04-05	129.89	\N	\N	\N	\N
3020	2024-04-06	72.23	\N	\N	\N	\N
3021	2024-04-07	103.39	\N	\N	\N	\N
3022	2024-04-08	62.17	\N	\N	\N	\N
3023	2024-04-09	146.96	\N	\N	\N	\N
3024	2024-04-10	54.72	\N	\N	\N	\N
3025	2024-04-11	78.32	\N	\N	\N	\N
3026	2024-04-12	101.18	\N	\N	\N	\N
3027	2024-04-13	60.86	\N	\N	\N	\N
3028	2024-04-14	54.41	\N	\N	\N	\N
3029	2024-04-15	109.08	\N	\N	\N	\N
3030	2024-04-16	75.40	\N	\N	\N	\N
3031	2024-04-17	71.81	\N	\N	\N	\N
3032	2024-04-18	136.86	\N	\N	\N	\N
3033	2024-04-19	133.71	\N	\N	\N	\N
3034	2024-04-20	62.11	\N	\N	\N	\N
3035	2024-04-21	143.71	\N	\N	\N	\N
3036	2024-04-22	97.91	\N	\N	\N	\N
3037	2024-04-23	82.19	\N	\N	\N	\N
3038	2024-04-24	122.15	\N	\N	\N	\N
3039	2024-04-25	59.31	\N	\N	\N	\N
3040	2024-04-26	51.50	\N	\N	\N	\N
3041	2024-04-27	78.58	\N	\N	\N	\N
3042	2024-04-28	106.18	\N	\N	\N	\N
3043	2024-04-29	50.47	\N	\N	\N	\N
3044	2024-04-30	101.92	\N	\N	\N	\N
3045	2024-04-01	71.88	\N	\N	\N	\N
3046	2024-04-02	144.40	\N	\N	\N	\N
3047	2024-04-03	54.37	\N	\N	\N	\N
3048	2024-04-04	61.91	\N	\N	\N	\N
3049	2024-04-05	52.10	\N	\N	\N	\N
3050	2024-04-06	80.52	\N	\N	\N	\N
3051	2024-04-07	144.48	\N	\N	\N	\N
3052	2024-04-08	98.44	\N	\N	\N	\N
3053	2024-04-09	50.59	\N	\N	\N	\N
3054	2024-04-10	118.69	\N	\N	\N	\N
3055	2024-04-11	116.85	\N	\N	\N	\N
3056	2024-04-12	138.86	\N	\N	\N	\N
3057	2024-04-13	111.44	\N	\N	\N	\N
3058	2024-04-14	138.46	\N	\N	\N	\N
3059	2024-04-15	118.35	\N	\N	\N	\N
3060	2024-04-16	136.65	\N	\N	\N	\N
3061	2024-04-17	76.24	\N	\N	\N	\N
3062	2024-04-18	144.18	\N	\N	\N	\N
3063	2024-04-19	116.11	\N	\N	\N	\N
3064	2024-04-20	132.42	\N	\N	\N	\N
3065	2024-04-21	143.12	\N	\N	\N	\N
3066	2024-04-22	124.75	\N	\N	\N	\N
3067	2024-04-23	72.21	\N	\N	\N	\N
3068	2024-04-24	76.70	\N	\N	\N	\N
3069	2024-04-25	127.06	\N	\N	\N	\N
3070	2024-04-26	147.90	\N	\N	\N	\N
3071	2024-04-27	146.89	\N	\N	\N	\N
3072	2024-04-28	83.70	\N	\N	\N	\N
3073	2024-04-29	68.85	\N	\N	\N	\N
3074	2024-04-30	108.76	\N	\N	\N	\N
3075	2024-04-01	133.84	\N	\N	\N	\N
3076	2024-04-02	80.61	\N	\N	\N	\N
3077	2024-04-03	128.30	\N	\N	\N	\N
3078	2024-04-04	88.89	\N	\N	\N	\N
3079	2024-04-05	147.05	\N	\N	\N	\N
3080	2024-04-06	145.70	\N	\N	\N	\N
3081	2024-04-07	119.81	\N	\N	\N	\N
3082	2024-04-08	111.30	\N	\N	\N	\N
3083	2024-04-09	116.38	\N	\N	\N	\N
3084	2024-04-10	101.36	\N	\N	\N	\N
3085	2024-04-11	71.18	\N	\N	\N	\N
3086	2024-04-12	104.67	\N	\N	\N	\N
3087	2024-04-13	60.74	\N	\N	\N	\N
3088	2024-04-14	106.15	\N	\N	\N	\N
3089	2024-04-15	137.61	\N	\N	\N	\N
3090	2024-04-16	86.03	\N	\N	\N	\N
3091	2024-04-17	55.27	\N	\N	\N	\N
3092	2024-04-18	52.92	\N	\N	\N	\N
3093	2024-04-19	111.03	\N	\N	\N	\N
3094	2024-04-20	78.78	\N	\N	\N	\N
3095	2024-04-21	129.51	\N	\N	\N	\N
3096	2024-04-22	91.94	\N	\N	\N	\N
3097	2024-04-23	144.37	\N	\N	\N	\N
3098	2024-04-24	126.87	\N	\N	\N	\N
3099	2024-04-25	62.79	\N	\N	\N	\N
3100	2024-04-26	78.57	\N	\N	\N	\N
3101	2024-04-27	145.52	\N	\N	\N	\N
3102	2024-04-28	93.08	\N	\N	\N	\N
3103	2024-04-29	145.91	\N	\N	\N	\N
3104	2024-04-30	130.91	\N	\N	\N	\N
3105	2024-04-01	93.96	\N	\N	\N	\N
3106	2024-04-02	77.72	\N	\N	\N	\N
3107	2024-04-03	138.77	\N	\N	\N	\N
3108	2024-04-04	140.13	\N	\N	\N	\N
3109	2024-04-05	66.29	\N	\N	\N	\N
3110	2024-04-06	87.26	\N	\N	\N	\N
3111	2024-04-07	121.69	\N	\N	\N	\N
3112	2024-04-08	114.77	\N	\N	\N	\N
3113	2024-04-09	60.84	\N	\N	\N	\N
3114	2024-04-10	54.72	\N	\N	\N	\N
3115	2024-04-11	125.84	\N	\N	\N	\N
3116	2024-04-12	82.32	\N	\N	\N	\N
3117	2024-04-13	89.18	\N	\N	\N	\N
3118	2024-04-14	144.99	\N	\N	\N	\N
3119	2024-04-15	147.49	\N	\N	\N	\N
3120	2024-04-16	108.55	\N	\N	\N	\N
3121	2024-04-17	86.43	\N	\N	\N	\N
3122	2024-04-18	85.41	\N	\N	\N	\N
3123	2024-04-19	55.32	\N	\N	\N	\N
3124	2024-04-20	107.98	\N	\N	\N	\N
3125	2024-04-21	124.00	\N	\N	\N	\N
3126	2024-04-22	129.69	\N	\N	\N	\N
3127	2024-04-23	116.41	\N	\N	\N	\N
3128	2024-04-24	78.01	\N	\N	\N	\N
3129	2024-04-25	57.78	\N	\N	\N	\N
3130	2024-04-26	140.92	\N	\N	\N	\N
3131	2024-04-27	72.66	\N	\N	\N	\N
3132	2024-04-28	60.56	\N	\N	\N	\N
3133	2024-04-29	71.21	\N	\N	\N	\N
3134	2024-04-30	138.26	\N	\N	\N	\N
3135	2024-04-01	95.83	\N	\N	\N	\N
3136	2024-04-02	79.86	\N	\N	\N	\N
3137	2024-04-03	149.21	\N	\N	\N	\N
3138	2024-04-04	98.16	\N	\N	\N	\N
3139	2024-04-05	129.64	\N	\N	\N	\N
3140	2024-04-06	94.22	\N	\N	\N	\N
3141	2024-04-07	76.05	\N	\N	\N	\N
3142	2024-04-08	94.11	\N	\N	\N	\N
3143	2024-04-09	85.33	\N	\N	\N	\N
3144	2024-04-10	128.33	\N	\N	\N	\N
3145	2024-04-11	115.85	\N	\N	\N	\N
3146	2024-04-12	86.48	\N	\N	\N	\N
3147	2024-04-13	147.19	\N	\N	\N	\N
3148	2024-04-14	141.07	\N	\N	\N	\N
3149	2024-04-15	72.79	\N	\N	\N	\N
3150	2024-04-16	121.87	\N	\N	\N	\N
3151	2024-04-17	84.54	\N	\N	\N	\N
3152	2024-04-18	133.65	\N	\N	\N	\N
3153	2024-04-19	135.63	\N	\N	\N	\N
3154	2024-04-20	120.03	\N	\N	\N	\N
3155	2024-04-21	85.42	\N	\N	\N	\N
3156	2024-04-22	70.83	\N	\N	\N	\N
3157	2024-04-23	57.38	\N	\N	\N	\N
3158	2024-04-24	116.50	\N	\N	\N	\N
3159	2024-04-25	115.14	\N	\N	\N	\N
3160	2024-04-26	125.83	\N	\N	\N	\N
3161	2024-04-27	127.10	\N	\N	\N	\N
3162	2024-04-28	105.67	\N	\N	\N	\N
3163	2024-04-29	127.66	\N	\N	\N	\N
3164	2024-04-30	132.49	\N	\N	\N	\N
3165	2024-04-01	60.24	\N	\N	\N	\N
3166	2024-04-02	72.59	\N	\N	\N	\N
3167	2024-04-03	115.03	\N	\N	\N	\N
3168	2024-04-04	86.83	\N	\N	\N	\N
3169	2024-04-05	90.77	\N	\N	\N	\N
3170	2024-04-06	103.27	\N	\N	\N	\N
3171	2024-04-07	66.05	\N	\N	\N	\N
3172	2024-04-08	116.81	\N	\N	\N	\N
3173	2024-04-09	105.16	\N	\N	\N	\N
3174	2024-04-10	66.55	\N	\N	\N	\N
3175	2024-04-11	79.08	\N	\N	\N	\N
3176	2024-04-12	111.21	\N	\N	\N	\N
3177	2024-04-13	58.57	\N	\N	\N	\N
3178	2024-04-14	97.34	\N	\N	\N	\N
3179	2024-04-15	113.40	\N	\N	\N	\N
3180	2024-04-16	138.79	\N	\N	\N	\N
3181	2024-04-17	110.00	\N	\N	\N	\N
3182	2024-04-18	87.21	\N	\N	\N	\N
3183	2024-04-19	106.62	\N	\N	\N	\N
3184	2024-04-20	54.80	\N	\N	\N	\N
3185	2024-04-21	76.62	\N	\N	\N	\N
3186	2024-04-22	50.48	\N	\N	\N	\N
3187	2024-04-23	55.25	\N	\N	\N	\N
3188	2024-04-24	121.51	\N	\N	\N	\N
3189	2024-04-25	101.01	\N	\N	\N	\N
3190	2024-04-26	51.73	\N	\N	\N	\N
3191	2024-04-27	109.95	\N	\N	\N	\N
3192	2024-04-28	137.71	\N	\N	\N	\N
3193	2024-04-29	70.38	\N	\N	\N	\N
3194	2024-04-30	139.18	\N	\N	\N	\N
3195	2024-04-01	144.30	\N	\N	\N	\N
3196	2024-04-02	130.79	\N	\N	\N	\N
3197	2024-04-03	147.32	\N	\N	\N	\N
3198	2024-04-04	85.01	\N	\N	\N	\N
3199	2024-04-05	143.64	\N	\N	\N	\N
3200	2024-04-06	95.31	\N	\N	\N	\N
3201	2024-04-07	137.55	\N	\N	\N	\N
3202	2024-04-08	139.64	\N	\N	\N	\N
3203	2024-04-09	71.93	\N	\N	\N	\N
3204	2024-04-10	60.92	\N	\N	\N	\N
3205	2024-04-11	137.56	\N	\N	\N	\N
3206	2024-04-12	131.65	\N	\N	\N	\N
3207	2024-04-13	91.04	\N	\N	\N	\N
3208	2024-04-14	117.36	\N	\N	\N	\N
3209	2024-04-15	73.19	\N	\N	\N	\N
3210	2024-04-16	147.29	\N	\N	\N	\N
3211	2024-04-17	124.64	\N	\N	\N	\N
3212	2024-04-18	117.88	\N	\N	\N	\N
3213	2024-04-19	59.40	\N	\N	\N	\N
3214	2024-04-20	91.55	\N	\N	\N	\N
3215	2024-04-21	143.13	\N	\N	\N	\N
3216	2024-04-22	74.17	\N	\N	\N	\N
3217	2024-04-23	135.19	\N	\N	\N	\N
3218	2024-04-24	97.84	\N	\N	\N	\N
3219	2024-04-25	81.12	\N	\N	\N	\N
3220	2024-04-26	109.95	\N	\N	\N	\N
3221	2024-04-27	108.13	\N	\N	\N	\N
3222	2024-04-28	91.17	\N	\N	\N	\N
3223	2024-04-29	132.58	\N	\N	\N	\N
3224	2024-04-30	143.29	\N	\N	\N	\N
3225	2024-04-01	127.11	\N	\N	\N	\N
3226	2024-04-02	110.05	\N	\N	\N	\N
3227	2024-04-03	148.35	\N	\N	\N	\N
3228	2024-04-04	101.84	\N	\N	\N	\N
3229	2024-04-05	136.32	\N	\N	\N	\N
3230	2024-04-06	119.91	\N	\N	\N	\N
3231	2024-04-07	55.51	\N	\N	\N	\N
3232	2024-04-08	67.89	\N	\N	\N	\N
3233	2024-04-09	53.40	\N	\N	\N	\N
3234	2024-04-10	104.41	\N	\N	\N	\N
3235	2024-04-11	97.99	\N	\N	\N	\N
3236	2024-04-12	61.93	\N	\N	\N	\N
3237	2024-04-13	77.62	\N	\N	\N	\N
3238	2024-04-14	147.36	\N	\N	\N	\N
3239	2024-04-15	120.71	\N	\N	\N	\N
3240	2024-04-16	96.88	\N	\N	\N	\N
3241	2024-04-17	74.83	\N	\N	\N	\N
3242	2024-04-18	108.32	\N	\N	\N	\N
3243	2024-04-19	112.78	\N	\N	\N	\N
3244	2024-04-20	149.56	\N	\N	\N	\N
3245	2024-04-21	55.44	\N	\N	\N	\N
3246	2024-04-22	73.72	\N	\N	\N	\N
3247	2024-04-23	50.80	\N	\N	\N	\N
3248	2024-04-24	117.30	\N	\N	\N	\N
3249	2024-04-25	131.48	\N	\N	\N	\N
3250	2024-04-26	54.33	\N	\N	\N	\N
3251	2024-04-27	75.68	\N	\N	\N	\N
3252	2024-04-28	146.04	\N	\N	\N	\N
3253	2024-04-29	65.62	\N	\N	\N	\N
3254	2024-04-30	110.09	\N	\N	\N	\N
3255	2024-04-01	62.51	\N	\N	\N	\N
3256	2024-04-02	148.23	\N	\N	\N	\N
3257	2024-04-03	77.26	\N	\N	\N	\N
3258	2024-04-04	89.69	\N	\N	\N	\N
3259	2024-04-05	116.75	\N	\N	\N	\N
3260	2024-04-06	104.60	\N	\N	\N	\N
3261	2024-04-07	91.81	\N	\N	\N	\N
3262	2024-04-08	138.60	\N	\N	\N	\N
3263	2024-04-09	115.02	\N	\N	\N	\N
3264	2024-04-10	111.63	\N	\N	\N	\N
3265	2024-04-11	54.22	\N	\N	\N	\N
3266	2024-04-12	69.94	\N	\N	\N	\N
3267	2024-04-13	126.81	\N	\N	\N	\N
3268	2024-04-14	98.23	\N	\N	\N	\N
3269	2024-04-15	136.35	\N	\N	\N	\N
3270	2024-04-16	124.29	\N	\N	\N	\N
3271	2024-04-17	126.45	\N	\N	\N	\N
3272	2024-04-18	72.65	\N	\N	\N	\N
3273	2024-04-19	67.96	\N	\N	\N	\N
3274	2024-04-20	143.61	\N	\N	\N	\N
3275	2024-04-21	148.59	\N	\N	\N	\N
3276	2024-04-22	123.57	\N	\N	\N	\N
3277	2024-04-23	133.34	\N	\N	\N	\N
3278	2024-04-24	67.93	\N	\N	\N	\N
3279	2024-04-25	81.74	\N	\N	\N	\N
3280	2024-04-26	99.18	\N	\N	\N	\N
3281	2024-04-27	148.37	\N	\N	\N	\N
3282	2024-04-28	57.49	\N	\N	\N	\N
3283	2024-04-29	116.57	\N	\N	\N	\N
3284	2024-04-30	135.30	\N	\N	\N	\N
3285	2024-04-01	111.85	\N	\N	\N	\N
3286	2024-04-02	108.52	\N	\N	\N	\N
3287	2024-04-03	91.51	\N	\N	\N	\N
3288	2024-04-04	104.67	\N	\N	\N	\N
3289	2024-04-05	134.38	\N	\N	\N	\N
3290	2024-04-06	89.37	\N	\N	\N	\N
3291	2024-04-07	105.13	\N	\N	\N	\N
3292	2024-04-08	108.85	\N	\N	\N	\N
3293	2024-04-09	143.72	\N	\N	\N	\N
3294	2024-04-10	129.13	\N	\N	\N	\N
3295	2024-04-11	91.32	\N	\N	\N	\N
3296	2024-04-12	96.48	\N	\N	\N	\N
3297	2024-04-13	52.72	\N	\N	\N	\N
3298	2024-04-14	144.11	\N	\N	\N	\N
3299	2024-04-15	106.91	\N	\N	\N	\N
3300	2024-04-16	55.98	\N	\N	\N	\N
3301	2024-04-17	94.76	\N	\N	\N	\N
3302	2024-04-18	137.08	\N	\N	\N	\N
3303	2024-04-19	92.02	\N	\N	\N	\N
3304	2024-04-20	131.38	\N	\N	\N	\N
3305	2024-04-21	145.81	\N	\N	\N	\N
3306	2024-04-22	113.03	\N	\N	\N	\N
3307	2024-04-23	146.63	\N	\N	\N	\N
3308	2024-04-24	68.12	\N	\N	\N	\N
3309	2024-04-25	81.60	\N	\N	\N	\N
3310	2024-04-26	110.41	\N	\N	\N	\N
3311	2024-04-27	147.79	\N	\N	\N	\N
3312	2024-04-28	113.90	\N	\N	\N	\N
3313	2024-04-29	83.20	\N	\N	\N	\N
3314	2024-04-30	90.72	\N	\N	\N	\N
3315	2024-04-01	66.50	\N	\N	\N	\N
3316	2024-04-02	60.44	\N	\N	\N	\N
3317	2024-04-03	95.67	\N	\N	\N	\N
3318	2024-04-04	124.40	\N	\N	\N	\N
3319	2024-04-05	86.03	\N	\N	\N	\N
3320	2024-04-06	119.06	\N	\N	\N	\N
3321	2024-04-07	134.83	\N	\N	\N	\N
3322	2024-04-08	142.85	\N	\N	\N	\N
3323	2024-04-09	66.81	\N	\N	\N	\N
3324	2024-04-10	112.67	\N	\N	\N	\N
3325	2024-04-11	127.32	\N	\N	\N	\N
3326	2024-04-12	123.08	\N	\N	\N	\N
3327	2024-04-13	76.07	\N	\N	\N	\N
3328	2024-04-14	146.03	\N	\N	\N	\N
3329	2024-04-15	56.30	\N	\N	\N	\N
3330	2024-04-16	130.21	\N	\N	\N	\N
3331	2024-04-17	112.53	\N	\N	\N	\N
3332	2024-04-18	149.68	\N	\N	\N	\N
3333	2024-04-19	75.28	\N	\N	\N	\N
3334	2024-04-20	90.25	\N	\N	\N	\N
3335	2024-04-21	86.99	\N	\N	\N	\N
3336	2024-04-22	81.67	\N	\N	\N	\N
3337	2024-04-23	125.80	\N	\N	\N	\N
3338	2024-04-24	92.99	\N	\N	\N	\N
3339	2024-04-25	89.32	\N	\N	\N	\N
3340	2024-04-26	146.20	\N	\N	\N	\N
3341	2024-04-27	72.01	\N	\N	\N	\N
3342	2024-04-28	129.31	\N	\N	\N	\N
3343	2024-04-29	110.47	\N	\N	\N	\N
3344	2024-04-30	65.61	\N	\N	\N	\N
3345	2024-04-01	134.57	\N	\N	\N	\N
3346	2024-04-02	77.37	\N	\N	\N	\N
3347	2024-04-03	71.92	\N	\N	\N	\N
3348	2024-04-04	68.11	\N	\N	\N	\N
3349	2024-04-05	120.64	\N	\N	\N	\N
3350	2024-04-06	119.31	\N	\N	\N	\N
3351	2024-04-07	61.64	\N	\N	\N	\N
3352	2024-04-08	143.92	\N	\N	\N	\N
3353	2024-04-09	124.42	\N	\N	\N	\N
3354	2024-04-10	121.31	\N	\N	\N	\N
3355	2024-04-11	130.60	\N	\N	\N	\N
3356	2024-04-12	87.54	\N	\N	\N	\N
3357	2024-04-13	102.44	\N	\N	\N	\N
3358	2024-04-14	68.68	\N	\N	\N	\N
3359	2024-04-15	80.68	\N	\N	\N	\N
3360	2024-04-16	92.03	\N	\N	\N	\N
3361	2024-04-17	78.39	\N	\N	\N	\N
3362	2024-04-18	144.15	\N	\N	\N	\N
3363	2024-04-19	119.12	\N	\N	\N	\N
3364	2024-04-20	117.86	\N	\N	\N	\N
3365	2024-04-21	121.65	\N	\N	\N	\N
3366	2024-04-22	71.59	\N	\N	\N	\N
3367	2024-04-23	126.16	\N	\N	\N	\N
3368	2024-04-24	73.76	\N	\N	\N	\N
3369	2024-04-25	57.78	\N	\N	\N	\N
3370	2024-04-26	89.77	\N	\N	\N	\N
3371	2024-04-27	86.75	\N	\N	\N	\N
3372	2024-04-28	139.26	\N	\N	\N	\N
3373	2024-04-29	121.19	\N	\N	\N	\N
3374	2024-04-30	69.14	\N	\N	\N	\N
3375	2024-04-01	117.25	\N	\N	\N	\N
3376	2024-04-02	134.20	\N	\N	\N	\N
3377	2024-04-03	85.09	\N	\N	\N	\N
3378	2024-04-04	54.80	\N	\N	\N	\N
3379	2024-04-05	106.53	\N	\N	\N	\N
3380	2024-04-06	105.08	\N	\N	\N	\N
3381	2024-04-07	73.79	\N	\N	\N	\N
3382	2024-04-08	81.24	\N	\N	\N	\N
3383	2024-04-09	134.12	\N	\N	\N	\N
3384	2024-04-10	104.95	\N	\N	\N	\N
3385	2024-04-11	79.35	\N	\N	\N	\N
3386	2024-04-12	124.68	\N	\N	\N	\N
3387	2024-04-13	129.83	\N	\N	\N	\N
3388	2024-04-14	125.88	\N	\N	\N	\N
3389	2024-04-15	57.13	\N	\N	\N	\N
3390	2024-04-16	136.97	\N	\N	\N	\N
3391	2024-04-17	84.11	\N	\N	\N	\N
3392	2024-04-18	58.03	\N	\N	\N	\N
3393	2024-04-19	77.21	\N	\N	\N	\N
3394	2024-04-20	130.97	\N	\N	\N	\N
3395	2024-04-21	81.26	\N	\N	\N	\N
3396	2024-04-22	99.07	\N	\N	\N	\N
3397	2024-04-23	144.52	\N	\N	\N	\N
3398	2024-04-24	61.73	\N	\N	\N	\N
3399	2024-04-25	62.93	\N	\N	\N	\N
3400	2024-04-26	133.20	\N	\N	\N	\N
3401	2024-04-27	122.38	\N	\N	\N	\N
3402	2024-04-28	76.81	\N	\N	\N	\N
3403	2024-04-29	75.54	\N	\N	\N	\N
3404	2024-04-30	107.39	\N	\N	\N	\N
3405	2024-04-01	106.37	\N	\N	\N	\N
3406	2024-04-02	142.09	\N	\N	\N	\N
3407	2024-04-03	84.91	\N	\N	\N	\N
3408	2024-04-04	106.11	\N	\N	\N	\N
3409	2024-04-05	149.55	\N	\N	\N	\N
3410	2024-04-06	65.02	\N	\N	\N	\N
3411	2024-04-07	135.88	\N	\N	\N	\N
3412	2024-04-08	86.76	\N	\N	\N	\N
3413	2024-04-09	81.38	\N	\N	\N	\N
3414	2024-04-10	128.97	\N	\N	\N	\N
3415	2024-04-11	56.85	\N	\N	\N	\N
3416	2024-04-12	91.98	\N	\N	\N	\N
3417	2024-04-13	127.83	\N	\N	\N	\N
3418	2024-04-14	100.77	\N	\N	\N	\N
3419	2024-04-15	126.05	\N	\N	\N	\N
3420	2024-04-16	147.20	\N	\N	\N	\N
3421	2024-04-17	105.79	\N	\N	\N	\N
3422	2024-04-18	116.47	\N	\N	\N	\N
3423	2024-04-19	127.44	\N	\N	\N	\N
3424	2024-04-20	96.70	\N	\N	\N	\N
3425	2024-04-21	96.65	\N	\N	\N	\N
3426	2024-04-22	84.97	\N	\N	\N	\N
3427	2024-04-23	70.33	\N	\N	\N	\N
3428	2024-04-24	81.71	\N	\N	\N	\N
3429	2024-04-25	89.06	\N	\N	\N	\N
3430	2024-04-26	106.45	\N	\N	\N	\N
3431	2024-04-27	148.98	\N	\N	\N	\N
3432	2024-04-28	114.64	\N	\N	\N	\N
3433	2024-04-29	128.29	\N	\N	\N	\N
3434	2024-04-30	57.61	\N	\N	\N	\N
3435	2024-04-01	98.39	\N	\N	\N	\N
3436	2024-04-02	117.35	\N	\N	\N	\N
3437	2024-04-03	103.55	\N	\N	\N	\N
3438	2024-04-04	85.21	\N	\N	\N	\N
3439	2024-04-05	98.28	\N	\N	\N	\N
3440	2024-04-06	110.32	\N	\N	\N	\N
3441	2024-04-07	113.87	\N	\N	\N	\N
3442	2024-04-08	74.86	\N	\N	\N	\N
3443	2024-04-09	61.40	\N	\N	\N	\N
3444	2024-04-10	129.37	\N	\N	\N	\N
3445	2024-04-11	117.13	\N	\N	\N	\N
3446	2024-04-12	76.07	\N	\N	\N	\N
3447	2024-04-13	121.55	\N	\N	\N	\N
3448	2024-04-14	77.26	\N	\N	\N	\N
3449	2024-04-15	82.74	\N	\N	\N	\N
3450	2024-04-16	62.65	\N	\N	\N	\N
3451	2024-04-17	88.51	\N	\N	\N	\N
3452	2024-04-18	62.37	\N	\N	\N	\N
3453	2024-04-19	117.65	\N	\N	\N	\N
3454	2024-04-20	111.95	\N	\N	\N	\N
3455	2024-04-21	110.84	\N	\N	\N	\N
3456	2024-04-22	111.39	\N	\N	\N	\N
3457	2024-04-23	141.38	\N	\N	\N	\N
3458	2024-04-24	131.37	\N	\N	\N	\N
3459	2024-04-25	111.00	\N	\N	\N	\N
3460	2024-04-26	115.03	\N	\N	\N	\N
3461	2024-04-27	74.29	\N	\N	\N	\N
3462	2024-04-28	115.66	\N	\N	\N	\N
3463	2024-04-29	81.74	\N	\N	\N	\N
3464	2024-04-30	54.18	\N	\N	\N	\N
3465	2024-04-01	63.25	\N	\N	\N	\N
3466	2024-04-02	115.15	\N	\N	\N	\N
3467	2024-04-03	141.74	\N	\N	\N	\N
3468	2024-04-04	73.44	\N	\N	\N	\N
3469	2024-04-05	66.73	\N	\N	\N	\N
3470	2024-04-06	119.13	\N	\N	\N	\N
3471	2024-04-07	135.57	\N	\N	\N	\N
3472	2024-04-08	95.68	\N	\N	\N	\N
3473	2024-04-09	68.49	\N	\N	\N	\N
3474	2024-04-10	50.29	\N	\N	\N	\N
3475	2024-04-11	55.75	\N	\N	\N	\N
3476	2024-04-12	110.55	\N	\N	\N	\N
3477	2024-04-13	73.58	\N	\N	\N	\N
3478	2024-04-14	127.09	\N	\N	\N	\N
3479	2024-04-15	136.15	\N	\N	\N	\N
3480	2024-04-16	65.75	\N	\N	\N	\N
3481	2024-04-17	98.81	\N	\N	\N	\N
3482	2024-04-18	111.05	\N	\N	\N	\N
3483	2024-04-19	130.35	\N	\N	\N	\N
3484	2024-04-20	81.36	\N	\N	\N	\N
3485	2024-04-21	84.87	\N	\N	\N	\N
3486	2024-04-22	69.69	\N	\N	\N	\N
3487	2024-04-23	122.53	\N	\N	\N	\N
3488	2024-04-24	107.07	\N	\N	\N	\N
3489	2024-04-25	102.03	\N	\N	\N	\N
3490	2024-04-26	92.20	\N	\N	\N	\N
3491	2024-04-27	116.61	\N	\N	\N	\N
3492	2024-04-28	72.19	\N	\N	\N	\N
3493	2024-04-29	115.76	\N	\N	\N	\N
3494	2024-04-30	86.50	\N	\N	\N	\N
3495	2024-04-01	108.74	\N	\N	\N	\N
3496	2024-04-02	56.19	\N	\N	\N	\N
3497	2024-04-03	69.23	\N	\N	\N	\N
3498	2024-04-04	124.92	\N	\N	\N	\N
3499	2024-04-05	142.40	\N	\N	\N	\N
3500	2024-04-06	132.06	\N	\N	\N	\N
3501	2024-04-07	53.54	\N	\N	\N	\N
3502	2024-04-08	86.16	\N	\N	\N	\N
3503	2024-04-09	78.61	\N	\N	\N	\N
3504	2024-04-10	104.74	\N	\N	\N	\N
3505	2024-04-11	74.32	\N	\N	\N	\N
3506	2024-04-12	120.82	\N	\N	\N	\N
3507	2024-04-13	61.03	\N	\N	\N	\N
3508	2024-04-14	137.15	\N	\N	\N	\N
3509	2024-04-15	53.32	\N	\N	\N	\N
3510	2024-04-16	119.66	\N	\N	\N	\N
3511	2024-04-17	138.37	\N	\N	\N	\N
3512	2024-04-18	68.23	\N	\N	\N	\N
3513	2024-04-19	116.99	\N	\N	\N	\N
3514	2024-04-20	149.58	\N	\N	\N	\N
3515	2024-04-21	101.54	\N	\N	\N	\N
3516	2024-04-22	87.59	\N	\N	\N	\N
3517	2024-04-23	148.00	\N	\N	\N	\N
3518	2024-04-24	109.05	\N	\N	\N	\N
3519	2024-04-25	84.04	\N	\N	\N	\N
3520	2024-04-26	136.99	\N	\N	\N	\N
3521	2024-04-27	131.97	\N	\N	\N	\N
3522	2024-04-28	86.09	\N	\N	\N	\N
3523	2024-04-29	128.67	\N	\N	\N	\N
3524	2024-04-30	134.93	\N	\N	\N	\N
3525	2024-04-01	100.30	\N	\N	\N	\N
3526	2024-04-02	134.09	\N	\N	\N	\N
3527	2024-04-03	101.84	\N	\N	\N	\N
3528	2024-04-04	107.39	\N	\N	\N	\N
3529	2024-04-05	109.40	\N	\N	\N	\N
3530	2024-04-06	141.50	\N	\N	\N	\N
3531	2024-04-07	61.00	\N	\N	\N	\N
3532	2024-04-08	70.99	\N	\N	\N	\N
3533	2024-04-09	94.55	\N	\N	\N	\N
3534	2024-04-10	131.31	\N	\N	\N	\N
3535	2024-04-11	82.71	\N	\N	\N	\N
3536	2024-04-12	90.11	\N	\N	\N	\N
3537	2024-04-13	102.50	\N	\N	\N	\N
3538	2024-04-14	59.88	\N	\N	\N	\N
3539	2024-04-15	139.85	\N	\N	\N	\N
3540	2024-04-16	137.59	\N	\N	\N	\N
3541	2024-04-17	147.60	\N	\N	\N	\N
3542	2024-04-18	82.17	\N	\N	\N	\N
3543	2024-04-19	125.54	\N	\N	\N	\N
3544	2024-04-20	87.25	\N	\N	\N	\N
3545	2024-04-21	82.59	\N	\N	\N	\N
3546	2024-04-22	98.35	\N	\N	\N	\N
3547	2024-04-23	142.47	\N	\N	\N	\N
3548	2024-04-24	53.91	\N	\N	\N	\N
3549	2024-04-25	140.52	\N	\N	\N	\N
3550	2024-04-26	73.66	\N	\N	\N	\N
3551	2024-04-27	79.70	\N	\N	\N	\N
3552	2024-04-28	99.21	\N	\N	\N	\N
3553	2024-04-29	101.13	\N	\N	\N	\N
3554	2024-04-30	61.76	\N	\N	\N	\N
3555	2024-04-01	69.37	\N	\N	\N	\N
3556	2024-04-02	112.65	\N	\N	\N	\N
3557	2024-04-03	78.56	\N	\N	\N	\N
3558	2024-04-04	126.17	\N	\N	\N	\N
3559	2024-04-05	127.34	\N	\N	\N	\N
3560	2024-04-06	127.52	\N	\N	\N	\N
3561	2024-04-07	139.83	\N	\N	\N	\N
3562	2024-04-08	95.52	\N	\N	\N	\N
3563	2024-04-09	125.91	\N	\N	\N	\N
3564	2024-04-10	66.15	\N	\N	\N	\N
3565	2024-04-11	104.32	\N	\N	\N	\N
3566	2024-04-12	109.18	\N	\N	\N	\N
3567	2024-04-13	50.49	\N	\N	\N	\N
3568	2024-04-14	97.30	\N	\N	\N	\N
3569	2024-04-15	88.72	\N	\N	\N	\N
3570	2024-04-16	59.59	\N	\N	\N	\N
3571	2024-04-17	107.96	\N	\N	\N	\N
3572	2024-04-18	83.29	\N	\N	\N	\N
3573	2024-04-19	71.34	\N	\N	\N	\N
3574	2024-04-20	110.14	\N	\N	\N	\N
3575	2024-04-21	84.08	\N	\N	\N	\N
3576	2024-04-22	133.25	\N	\N	\N	\N
3577	2024-04-23	70.85	\N	\N	\N	\N
3578	2024-04-24	69.16	\N	\N	\N	\N
3579	2024-04-25	148.74	\N	\N	\N	\N
3580	2024-04-26	87.61	\N	\N	\N	\N
3581	2024-04-27	73.35	\N	\N	\N	\N
3582	2024-04-28	123.32	\N	\N	\N	\N
3583	2024-04-29	108.57	\N	\N	\N	\N
3584	2024-04-30	125.30	\N	\N	\N	\N
3585	2024-04-01	138.73	\N	\N	\N	\N
3586	2024-04-02	97.61	\N	\N	\N	\N
3587	2024-04-03	148.67	\N	\N	\N	\N
3588	2024-04-04	63.36	\N	\N	\N	\N
3589	2024-04-05	137.57	\N	\N	\N	\N
3590	2024-04-06	98.59	\N	\N	\N	\N
3591	2024-04-07	102.52	\N	\N	\N	\N
3592	2024-04-08	106.24	\N	\N	\N	\N
3593	2024-04-09	110.17	\N	\N	\N	\N
3594	2024-04-10	128.24	\N	\N	\N	\N
3595	2024-04-11	124.87	\N	\N	\N	\N
3596	2024-04-12	70.77	\N	\N	\N	\N
3597	2024-04-13	88.85	\N	\N	\N	\N
3598	2024-04-14	133.68	\N	\N	\N	\N
3599	2024-04-15	104.59	\N	\N	\N	\N
3600	2024-04-16	80.84	\N	\N	\N	\N
3601	2024-04-17	134.85	\N	\N	\N	\N
3602	2024-04-18	137.31	\N	\N	\N	\N
3603	2024-04-19	56.77	\N	\N	\N	\N
3604	2024-04-20	139.58	\N	\N	\N	\N
3605	2024-04-21	130.67	\N	\N	\N	\N
3606	2024-04-22	109.18	\N	\N	\N	\N
3607	2024-04-23	102.75	\N	\N	\N	\N
3608	2024-04-24	116.70	\N	\N	\N	\N
3609	2024-04-25	110.39	\N	\N	\N	\N
3610	2024-04-26	97.81	\N	\N	\N	\N
3611	2024-04-27	85.24	\N	\N	\N	\N
3612	2024-04-28	93.62	\N	\N	\N	\N
3613	2024-04-29	73.89	\N	\N	\N	\N
3614	2024-04-30	136.52	\N	\N	\N	\N
3615	2024-04-01	137.07	\N	\N	\N	\N
3616	2024-04-02	82.52	\N	\N	\N	\N
3617	2024-04-03	139.06	\N	\N	\N	\N
3618	2024-04-04	146.99	\N	\N	\N	\N
3619	2024-04-05	76.15	\N	\N	\N	\N
3620	2024-04-06	137.73	\N	\N	\N	\N
3621	2024-04-07	121.94	\N	\N	\N	\N
3622	2024-04-08	131.13	\N	\N	\N	\N
3623	2024-04-09	84.09	\N	\N	\N	\N
3624	2024-04-10	139.50	\N	\N	\N	\N
3625	2024-04-11	111.94	\N	\N	\N	\N
3626	2024-04-12	97.30	\N	\N	\N	\N
3627	2024-04-13	75.17	\N	\N	\N	\N
3628	2024-04-14	53.21	\N	\N	\N	\N
3629	2024-04-15	55.40	\N	\N	\N	\N
3630	2024-04-16	57.95	\N	\N	\N	\N
3631	2024-04-17	82.41	\N	\N	\N	\N
3632	2024-04-18	70.72	\N	\N	\N	\N
3633	2024-04-19	85.49	\N	\N	\N	\N
3634	2024-04-20	140.15	\N	\N	\N	\N
3635	2024-04-21	62.31	\N	\N	\N	\N
3636	2024-04-22	65.61	\N	\N	\N	\N
3637	2024-04-23	115.34	\N	\N	\N	\N
3638	2024-04-24	69.75	\N	\N	\N	\N
3639	2024-04-25	108.68	\N	\N	\N	\N
3640	2024-04-26	130.53	\N	\N	\N	\N
3641	2024-04-27	110.53	\N	\N	\N	\N
3642	2024-04-28	147.90	\N	\N	\N	\N
3643	2024-04-29	81.53	\N	\N	\N	\N
3644	2024-04-30	135.24	\N	\N	\N	\N
3645	2024-04-01	105.55	\N	\N	\N	\N
3646	2024-04-02	109.59	\N	\N	\N	\N
3647	2024-04-03	62.91	\N	\N	\N	\N
3648	2024-04-04	82.24	\N	\N	\N	\N
3649	2024-04-05	106.50	\N	\N	\N	\N
3650	2024-04-06	117.40	\N	\N	\N	\N
3651	2024-04-07	99.78	\N	\N	\N	\N
3652	2024-04-08	138.43	\N	\N	\N	\N
3653	2024-04-09	55.94	\N	\N	\N	\N
3654	2024-04-10	107.97	\N	\N	\N	\N
3655	2024-04-11	128.05	\N	\N	\N	\N
3656	2024-04-12	78.12	\N	\N	\N	\N
3657	2024-04-13	50.35	\N	\N	\N	\N
3658	2024-04-14	130.56	\N	\N	\N	\N
3659	2024-04-15	68.23	\N	\N	\N	\N
3660	2024-04-16	149.01	\N	\N	\N	\N
3661	2024-04-17	114.28	\N	\N	\N	\N
3662	2024-04-18	135.68	\N	\N	\N	\N
3663	2024-04-19	86.25	\N	\N	\N	\N
3664	2024-04-20	142.60	\N	\N	\N	\N
3665	2024-04-21	137.03	\N	\N	\N	\N
3666	2024-04-22	109.17	\N	\N	\N	\N
3667	2024-04-23	105.01	\N	\N	\N	\N
3668	2024-04-24	88.53	\N	\N	\N	\N
3669	2024-04-25	69.95	\N	\N	\N	\N
3670	2024-04-26	65.06	\N	\N	\N	\N
3671	2024-04-27	124.86	\N	\N	\N	\N
3672	2024-04-28	117.88	\N	\N	\N	\N
3673	2024-04-29	75.93	\N	\N	\N	\N
3674	2024-04-30	76.82	\N	\N	\N	\N
3675	2024-04-01	124.55	\N	\N	\N	\N
3676	2024-04-02	128.15	\N	\N	\N	\N
3677	2024-04-03	131.20	\N	\N	\N	\N
3678	2024-04-04	110.53	\N	\N	\N	\N
3679	2024-04-05	114.83	\N	\N	\N	\N
3680	2024-04-06	126.83	\N	\N	\N	\N
3681	2024-04-07	141.07	\N	\N	\N	\N
3682	2024-04-08	137.10	\N	\N	\N	\N
3683	2024-04-09	101.43	\N	\N	\N	\N
3684	2024-04-10	51.63	\N	\N	\N	\N
3685	2024-04-11	76.79	\N	\N	\N	\N
3686	2024-04-12	96.78	\N	\N	\N	\N
3687	2024-04-13	123.50	\N	\N	\N	\N
3688	2024-04-14	63.85	\N	\N	\N	\N
3689	2024-04-15	87.70	\N	\N	\N	\N
3690	2024-04-16	68.00	\N	\N	\N	\N
3691	2024-04-17	136.98	\N	\N	\N	\N
3692	2024-04-18	84.24	\N	\N	\N	\N
3693	2024-04-19	91.58	\N	\N	\N	\N
3694	2024-04-20	147.37	\N	\N	\N	\N
3695	2024-04-21	133.71	\N	\N	\N	\N
3696	2024-04-22	92.20	\N	\N	\N	\N
3697	2024-04-23	144.28	\N	\N	\N	\N
3698	2024-04-24	115.88	\N	\N	\N	\N
3699	2024-04-25	141.60	\N	\N	\N	\N
3700	2024-04-26	100.92	\N	\N	\N	\N
3701	2024-04-27	132.53	\N	\N	\N	\N
3702	2024-04-28	142.58	\N	\N	\N	\N
3703	2024-04-29	55.72	\N	\N	\N	\N
3704	2024-04-30	91.36	\N	\N	\N	\N
3705	2024-04-01	97.23	\N	\N	\N	\N
3706	2024-04-02	147.90	\N	\N	\N	\N
3707	2024-04-03	53.49	\N	\N	\N	\N
3708	2024-04-04	87.24	\N	\N	\N	\N
3709	2024-04-05	106.75	\N	\N	\N	\N
3710	2024-04-06	122.88	\N	\N	\N	\N
3711	2024-04-07	94.74	\N	\N	\N	\N
3712	2024-04-08	122.32	\N	\N	\N	\N
3713	2024-04-09	110.86	\N	\N	\N	\N
3714	2024-04-10	106.35	\N	\N	\N	\N
3715	2024-04-11	63.95	\N	\N	\N	\N
3716	2024-04-12	116.17	\N	\N	\N	\N
3717	2024-04-13	58.84	\N	\N	\N	\N
3718	2024-04-14	74.54	\N	\N	\N	\N
3719	2024-04-15	146.16	\N	\N	\N	\N
3720	2024-04-16	142.27	\N	\N	\N	\N
3721	2024-04-17	70.23	\N	\N	\N	\N
3722	2024-04-18	67.09	\N	\N	\N	\N
3723	2024-04-19	66.84	\N	\N	\N	\N
3724	2024-04-20	128.64	\N	\N	\N	\N
3725	2024-04-21	142.30	\N	\N	\N	\N
3726	2024-04-22	124.45	\N	\N	\N	\N
3727	2024-04-23	106.28	\N	\N	\N	\N
3728	2024-04-24	72.56	\N	\N	\N	\N
3729	2024-04-25	105.16	\N	\N	\N	\N
3730	2024-04-26	107.71	\N	\N	\N	\N
3731	2024-04-27	53.78	\N	\N	\N	\N
3732	2024-04-28	71.44	\N	\N	\N	\N
3733	2024-04-29	63.68	\N	\N	\N	\N
3734	2024-04-30	82.51	\N	\N	\N	\N
3735	2024-04-01	142.89	\N	\N	\N	\N
3736	2024-04-02	91.31	\N	\N	\N	\N
3737	2024-04-03	69.42	\N	\N	\N	\N
3738	2024-04-04	101.69	\N	\N	\N	\N
3739	2024-04-05	131.43	\N	\N	\N	\N
3740	2024-04-06	105.18	\N	\N	\N	\N
3741	2024-04-07	79.65	\N	\N	\N	\N
3742	2024-04-08	135.94	\N	\N	\N	\N
3743	2024-04-09	120.39	\N	\N	\N	\N
3744	2024-04-10	92.37	\N	\N	\N	\N
3745	2024-04-11	84.62	\N	\N	\N	\N
3746	2024-04-12	59.09	\N	\N	\N	\N
3747	2024-04-13	142.20	\N	\N	\N	\N
3748	2024-04-14	143.73	\N	\N	\N	\N
3749	2024-04-15	134.76	\N	\N	\N	\N
3750	2024-04-16	83.85	\N	\N	\N	\N
3751	2024-04-17	58.36	\N	\N	\N	\N
3752	2024-04-18	146.47	\N	\N	\N	\N
3753	2024-04-19	112.21	\N	\N	\N	\N
3754	2024-04-20	96.69	\N	\N	\N	\N
3755	2024-04-21	73.94	\N	\N	\N	\N
3756	2024-04-22	98.15	\N	\N	\N	\N
3757	2024-04-23	66.49	\N	\N	\N	\N
3758	2024-04-24	50.59	\N	\N	\N	\N
3759	2024-04-25	60.81	\N	\N	\N	\N
3760	2024-04-26	132.43	\N	\N	\N	\N
3761	2024-04-27	121.90	\N	\N	\N	\N
3762	2024-04-28	107.50	\N	\N	\N	\N
3763	2024-04-29	136.63	\N	\N	\N	\N
3764	2024-04-30	121.83	\N	\N	\N	\N
3765	2024-03-01	113.76	\N	\N	\N	\N
3766	2024-03-02	133.50	\N	\N	\N	\N
3767	2024-03-03	61.35	\N	\N	\N	\N
3768	2024-03-04	52.67	\N	\N	\N	\N
3769	2024-03-05	97.96	\N	\N	\N	\N
3770	2024-03-06	64.34	\N	\N	\N	\N
3771	2024-03-07	102.80	\N	\N	\N	\N
3772	2024-03-08	145.66	\N	\N	\N	\N
3773	2024-03-09	148.28	\N	\N	\N	\N
3774	2024-03-10	116.22	\N	\N	\N	\N
3775	2024-03-11	127.64	\N	\N	\N	\N
3776	2024-03-12	128.59	\N	\N	\N	\N
3777	2024-03-13	129.65	\N	\N	\N	\N
3778	2024-03-14	146.33	\N	\N	\N	\N
3779	2024-03-15	95.00	\N	\N	\N	\N
3780	2024-03-16	100.31	\N	\N	\N	\N
3781	2024-03-17	89.33	\N	\N	\N	\N
3782	2024-03-18	145.39	\N	\N	\N	\N
3783	2024-03-19	70.07	\N	\N	\N	\N
3784	2024-03-20	142.67	\N	\N	\N	\N
3785	2024-03-21	147.39	\N	\N	\N	\N
3786	2024-03-22	56.63	\N	\N	\N	\N
3787	2024-03-23	69.68	\N	\N	\N	\N
3788	2024-03-24	87.55	\N	\N	\N	\N
3789	2024-03-25	85.28	\N	\N	\N	\N
3790	2024-03-26	145.04	\N	\N	\N	\N
3791	2024-03-27	103.75	\N	\N	\N	\N
3792	2024-03-28	143.60	\N	\N	\N	\N
3793	2024-03-29	74.96	\N	\N	\N	\N
3794	2024-03-30	62.96	\N	\N	\N	\N
3795	2024-03-31	101.39	\N	\N	\N	\N
3796	2024-03-01	69.76	\N	\N	\N	\N
3797	2024-03-02	102.03	\N	\N	\N	\N
3798	2024-03-03	96.92	\N	\N	\N	\N
3799	2024-03-04	51.31	\N	\N	\N	\N
3800	2024-03-05	98.52	\N	\N	\N	\N
3801	2024-03-06	61.72	\N	\N	\N	\N
3802	2024-03-07	111.74	\N	\N	\N	\N
3803	2024-03-08	105.50	\N	\N	\N	\N
3804	2024-03-09	78.89	\N	\N	\N	\N
3805	2024-03-10	71.92	\N	\N	\N	\N
3806	2024-03-11	59.91	\N	\N	\N	\N
3807	2024-03-12	140.05	\N	\N	\N	\N
3808	2024-03-13	122.22	\N	\N	\N	\N
3809	2024-03-14	125.39	\N	\N	\N	\N
3810	2024-03-15	89.32	\N	\N	\N	\N
3811	2024-03-16	74.50	\N	\N	\N	\N
3812	2024-03-17	146.90	\N	\N	\N	\N
3813	2024-03-18	138.10	\N	\N	\N	\N
3814	2024-03-19	99.81	\N	\N	\N	\N
3815	2024-03-20	90.39	\N	\N	\N	\N
3816	2024-03-21	138.75	\N	\N	\N	\N
3817	2024-03-22	77.82	\N	\N	\N	\N
3818	2024-03-23	128.23	\N	\N	\N	\N
3819	2024-03-24	80.98	\N	\N	\N	\N
3820	2024-03-25	125.17	\N	\N	\N	\N
3821	2024-03-26	50.70	\N	\N	\N	\N
3822	2024-03-27	66.83	\N	\N	\N	\N
3823	2024-03-28	67.75	\N	\N	\N	\N
3824	2024-03-29	121.70	\N	\N	\N	\N
3825	2024-03-30	110.81	\N	\N	\N	\N
3826	2024-03-31	139.62	\N	\N	\N	\N
3827	2024-03-01	124.55	\N	\N	\N	\N
3828	2024-03-02	78.26	\N	\N	\N	\N
3829	2024-03-03	75.31	\N	\N	\N	\N
3830	2024-03-04	145.40	\N	\N	\N	\N
3831	2024-03-05	63.95	\N	\N	\N	\N
3832	2024-03-06	64.18	\N	\N	\N	\N
3833	2024-03-07	101.34	\N	\N	\N	\N
3834	2024-03-08	80.95	\N	\N	\N	\N
3835	2024-03-09	126.18	\N	\N	\N	\N
3836	2024-03-10	72.79	\N	\N	\N	\N
3837	2024-03-11	119.40	\N	\N	\N	\N
3838	2024-03-12	115.48	\N	\N	\N	\N
3839	2024-03-13	143.54	\N	\N	\N	\N
3840	2024-03-14	142.24	\N	\N	\N	\N
3841	2024-03-15	56.90	\N	\N	\N	\N
3842	2024-03-16	84.89	\N	\N	\N	\N
3843	2024-03-17	53.26	\N	\N	\N	\N
3844	2024-03-18	78.74	\N	\N	\N	\N
3845	2024-03-19	149.47	\N	\N	\N	\N
3846	2024-03-20	91.70	\N	\N	\N	\N
3847	2024-03-21	88.89	\N	\N	\N	\N
3848	2024-03-22	60.35	\N	\N	\N	\N
3849	2024-03-23	89.98	\N	\N	\N	\N
3850	2024-03-24	86.37	\N	\N	\N	\N
3851	2024-03-25	129.09	\N	\N	\N	\N
3852	2024-03-26	57.89	\N	\N	\N	\N
3853	2024-03-27	64.96	\N	\N	\N	\N
3854	2024-03-28	88.56	\N	\N	\N	\N
3855	2024-03-29	144.66	\N	\N	\N	\N
3856	2024-03-30	142.80	\N	\N	\N	\N
3857	2024-03-31	67.66	\N	\N	\N	\N
3858	2024-03-01	139.98	\N	\N	\N	\N
3859	2024-03-02	85.64	\N	\N	\N	\N
3860	2024-03-03	121.84	\N	\N	\N	\N
3861	2024-03-04	113.21	\N	\N	\N	\N
3862	2024-03-05	138.04	\N	\N	\N	\N
3863	2024-03-06	139.20	\N	\N	\N	\N
3864	2024-03-07	99.29	\N	\N	\N	\N
3865	2024-03-08	57.00	\N	\N	\N	\N
3866	2024-03-09	100.51	\N	\N	\N	\N
3867	2024-03-10	60.74	\N	\N	\N	\N
3868	2024-03-11	51.92	\N	\N	\N	\N
3869	2024-03-12	132.39	\N	\N	\N	\N
3870	2024-03-13	99.62	\N	\N	\N	\N
3871	2024-03-14	71.83	\N	\N	\N	\N
3872	2024-03-15	53.10	\N	\N	\N	\N
3873	2024-03-16	85.67	\N	\N	\N	\N
3874	2024-03-17	61.66	\N	\N	\N	\N
3875	2024-03-18	77.43	\N	\N	\N	\N
3876	2024-03-19	70.73	\N	\N	\N	\N
3877	2024-03-20	62.76	\N	\N	\N	\N
3878	2024-03-21	66.30	\N	\N	\N	\N
3879	2024-03-22	124.36	\N	\N	\N	\N
3880	2024-03-23	133.80	\N	\N	\N	\N
3881	2024-03-24	71.21	\N	\N	\N	\N
3882	2024-03-25	70.78	\N	\N	\N	\N
3883	2024-03-26	127.72	\N	\N	\N	\N
3884	2024-03-27	132.72	\N	\N	\N	\N
3885	2024-03-28	125.14	\N	\N	\N	\N
3886	2024-03-29	56.20	\N	\N	\N	\N
3887	2024-03-30	75.35	\N	\N	\N	\N
3888	2024-03-31	148.82	\N	\N	\N	\N
3889	2024-03-01	133.89	\N	\N	\N	\N
3890	2024-03-02	109.26	\N	\N	\N	\N
3891	2024-03-03	149.73	\N	\N	\N	\N
3892	2024-03-04	98.67	\N	\N	\N	\N
3893	2024-03-05	94.30	\N	\N	\N	\N
3894	2024-03-06	62.18	\N	\N	\N	\N
3895	2024-03-07	59.45	\N	\N	\N	\N
3896	2024-03-08	85.10	\N	\N	\N	\N
3897	2024-03-09	114.85	\N	\N	\N	\N
3898	2024-03-10	108.19	\N	\N	\N	\N
3899	2024-03-11	92.20	\N	\N	\N	\N
3900	2024-03-12	146.32	\N	\N	\N	\N
3901	2024-03-13	93.05	\N	\N	\N	\N
3902	2024-03-14	50.23	\N	\N	\N	\N
3903	2024-03-15	54.84	\N	\N	\N	\N
3904	2024-03-16	67.73	\N	\N	\N	\N
3905	2024-03-17	127.77	\N	\N	\N	\N
3906	2024-03-18	58.69	\N	\N	\N	\N
3907	2024-03-19	124.31	\N	\N	\N	\N
3908	2024-03-20	65.79	\N	\N	\N	\N
3909	2024-03-21	121.24	\N	\N	\N	\N
3910	2024-03-22	83.89	\N	\N	\N	\N
3911	2024-03-23	56.65	\N	\N	\N	\N
3912	2024-03-24	109.22	\N	\N	\N	\N
3913	2024-03-25	123.60	\N	\N	\N	\N
3914	2024-03-26	137.29	\N	\N	\N	\N
3915	2024-03-27	142.18	\N	\N	\N	\N
3916	2024-03-28	112.80	\N	\N	\N	\N
3917	2024-03-29	128.98	\N	\N	\N	\N
3918	2024-03-30	82.55	\N	\N	\N	\N
3919	2024-03-31	63.03	\N	\N	\N	\N
3920	2024-03-01	123.19	\N	\N	\N	\N
3921	2024-03-02	65.73	\N	\N	\N	\N
3922	2024-03-03	137.80	\N	\N	\N	\N
3923	2024-03-04	114.20	\N	\N	\N	\N
3924	2024-03-05	65.20	\N	\N	\N	\N
3925	2024-03-06	61.05	\N	\N	\N	\N
3926	2024-03-07	76.75	\N	\N	\N	\N
3927	2024-03-08	71.47	\N	\N	\N	\N
3928	2024-03-09	110.67	\N	\N	\N	\N
3929	2024-03-10	64.67	\N	\N	\N	\N
3930	2024-03-11	104.31	\N	\N	\N	\N
3931	2024-03-12	51.12	\N	\N	\N	\N
3932	2024-03-13	143.69	\N	\N	\N	\N
3933	2024-03-14	116.07	\N	\N	\N	\N
3934	2024-03-15	97.75	\N	\N	\N	\N
3935	2024-03-16	107.97	\N	\N	\N	\N
3936	2024-03-17	106.94	\N	\N	\N	\N
3937	2024-03-18	73.64	\N	\N	\N	\N
3938	2024-03-19	56.14	\N	\N	\N	\N
3939	2024-03-20	56.73	\N	\N	\N	\N
3940	2024-03-21	93.82	\N	\N	\N	\N
3941	2024-03-22	120.02	\N	\N	\N	\N
3942	2024-03-23	135.79	\N	\N	\N	\N
3943	2024-03-24	145.68	\N	\N	\N	\N
3944	2024-03-25	134.78	\N	\N	\N	\N
3945	2024-03-26	55.99	\N	\N	\N	\N
3946	2024-03-27	98.44	\N	\N	\N	\N
3947	2024-03-28	61.82	\N	\N	\N	\N
3948	2024-03-29	94.67	\N	\N	\N	\N
3949	2024-03-30	69.36	\N	\N	\N	\N
3950	2024-03-31	67.38	\N	\N	\N	\N
3951	2024-03-01	85.22	\N	\N	\N	\N
3952	2024-03-02	94.20	\N	\N	\N	\N
3953	2024-03-03	94.64	\N	\N	\N	\N
3954	2024-03-04	126.72	\N	\N	\N	\N
3955	2024-03-05	148.57	\N	\N	\N	\N
3956	2024-03-06	134.80	\N	\N	\N	\N
3957	2024-03-07	57.47	\N	\N	\N	\N
3958	2024-03-08	70.23	\N	\N	\N	\N
3959	2024-03-09	72.42	\N	\N	\N	\N
3960	2024-03-10	110.07	\N	\N	\N	\N
3961	2024-03-11	119.41	\N	\N	\N	\N
3962	2024-03-12	147.57	\N	\N	\N	\N
3963	2024-03-13	81.38	\N	\N	\N	\N
3964	2024-03-14	141.18	\N	\N	\N	\N
3965	2024-03-15	99.50	\N	\N	\N	\N
3966	2024-03-16	123.11	\N	\N	\N	\N
3967	2024-03-17	132.08	\N	\N	\N	\N
3968	2024-03-18	114.40	\N	\N	\N	\N
3969	2024-03-19	118.49	\N	\N	\N	\N
3970	2024-03-20	122.54	\N	\N	\N	\N
3971	2024-03-21	63.52	\N	\N	\N	\N
3972	2024-03-22	133.99	\N	\N	\N	\N
3973	2024-03-23	71.43	\N	\N	\N	\N
3974	2024-03-24	94.47	\N	\N	\N	\N
3975	2024-03-25	105.76	\N	\N	\N	\N
3976	2024-03-26	115.53	\N	\N	\N	\N
3977	2024-03-27	121.01	\N	\N	\N	\N
3978	2024-03-28	122.24	\N	\N	\N	\N
3979	2024-03-29	72.84	\N	\N	\N	\N
3980	2024-03-30	101.78	\N	\N	\N	\N
3981	2024-03-31	92.87	\N	\N	\N	\N
3982	2024-03-01	149.31	\N	\N	\N	\N
3983	2024-03-02	103.60	\N	\N	\N	\N
3984	2024-03-03	94.70	\N	\N	\N	\N
3985	2024-03-04	65.36	\N	\N	\N	\N
3986	2024-03-05	114.70	\N	\N	\N	\N
3987	2024-03-06	100.80	\N	\N	\N	\N
3988	2024-03-07	117.21	\N	\N	\N	\N
3989	2024-03-08	74.25	\N	\N	\N	\N
3990	2024-03-09	97.85	\N	\N	\N	\N
3991	2024-03-10	75.69	\N	\N	\N	\N
3992	2024-03-11	107.91	\N	\N	\N	\N
3993	2024-03-12	61.56	\N	\N	\N	\N
3994	2024-03-13	66.16	\N	\N	\N	\N
3995	2024-03-14	139.79	\N	\N	\N	\N
3996	2024-03-15	62.72	\N	\N	\N	\N
3997	2024-03-16	147.94	\N	\N	\N	\N
3998	2024-03-17	119.03	\N	\N	\N	\N
3999	2024-03-18	125.30	\N	\N	\N	\N
4000	2024-03-19	51.43	\N	\N	\N	\N
4001	2024-03-20	109.35	\N	\N	\N	\N
4002	2024-03-21	148.20	\N	\N	\N	\N
4003	2024-03-22	105.49	\N	\N	\N	\N
4004	2024-03-23	91.62	\N	\N	\N	\N
4005	2024-03-24	86.84	\N	\N	\N	\N
4006	2024-03-25	92.83	\N	\N	\N	\N
4007	2024-03-26	56.15	\N	\N	\N	\N
4008	2024-03-27	70.51	\N	\N	\N	\N
4009	2024-03-28	82.65	\N	\N	\N	\N
4010	2024-03-29	135.44	\N	\N	\N	\N
4011	2024-03-30	80.45	\N	\N	\N	\N
4012	2024-03-31	59.45	\N	\N	\N	\N
4013	2024-03-01	69.93	\N	\N	\N	\N
4014	2024-03-02	73.41	\N	\N	\N	\N
4015	2024-03-03	94.65	\N	\N	\N	\N
4016	2024-03-04	74.07	\N	\N	\N	\N
4017	2024-03-05	57.06	\N	\N	\N	\N
4018	2024-03-06	147.94	\N	\N	\N	\N
4019	2024-03-07	86.13	\N	\N	\N	\N
4020	2024-03-08	115.43	\N	\N	\N	\N
4021	2024-03-09	59.00	\N	\N	\N	\N
4022	2024-03-10	60.10	\N	\N	\N	\N
4023	2024-03-11	133.68	\N	\N	\N	\N
4024	2024-03-12	118.56	\N	\N	\N	\N
4025	2024-03-13	93.19	\N	\N	\N	\N
4026	2024-03-14	53.01	\N	\N	\N	\N
4027	2024-03-15	131.02	\N	\N	\N	\N
4028	2024-03-16	100.34	\N	\N	\N	\N
4029	2024-03-17	120.11	\N	\N	\N	\N
4030	2024-03-18	118.43	\N	\N	\N	\N
4031	2024-03-19	135.24	\N	\N	\N	\N
4032	2024-03-20	129.31	\N	\N	\N	\N
4033	2024-03-21	129.28	\N	\N	\N	\N
4034	2024-03-22	136.17	\N	\N	\N	\N
4035	2024-03-23	123.98	\N	\N	\N	\N
4036	2024-03-24	93.30	\N	\N	\N	\N
4037	2024-03-25	105.40	\N	\N	\N	\N
4038	2024-03-26	115.33	\N	\N	\N	\N
4039	2024-03-27	99.83	\N	\N	\N	\N
4040	2024-03-28	122.63	\N	\N	\N	\N
4041	2024-03-29	132.16	\N	\N	\N	\N
4042	2024-03-30	130.64	\N	\N	\N	\N
4043	2024-03-31	134.01	\N	\N	\N	\N
4044	2024-03-01	69.67	\N	\N	\N	\N
4045	2024-03-02	134.58	\N	\N	\N	\N
4046	2024-03-03	87.80	\N	\N	\N	\N
4047	2024-03-04	50.12	\N	\N	\N	\N
4048	2024-03-05	129.50	\N	\N	\N	\N
4049	2024-03-06	69.58	\N	\N	\N	\N
4050	2024-03-07	75.62	\N	\N	\N	\N
4051	2024-03-08	63.37	\N	\N	\N	\N
4052	2024-03-09	80.13	\N	\N	\N	\N
4053	2024-03-10	145.95	\N	\N	\N	\N
4054	2024-03-11	98.55	\N	\N	\N	\N
4055	2024-03-12	113.12	\N	\N	\N	\N
4056	2024-03-13	143.11	\N	\N	\N	\N
4057	2024-03-14	106.35	\N	\N	\N	\N
4058	2024-03-15	115.87	\N	\N	\N	\N
4059	2024-03-16	122.07	\N	\N	\N	\N
4060	2024-03-17	88.22	\N	\N	\N	\N
4061	2024-03-18	53.17	\N	\N	\N	\N
4062	2024-03-19	60.63	\N	\N	\N	\N
4063	2024-03-20	93.39	\N	\N	\N	\N
4064	2024-03-21	115.25	\N	\N	\N	\N
4065	2024-03-22	56.90	\N	\N	\N	\N
4066	2024-03-23	60.56	\N	\N	\N	\N
4067	2024-03-24	91.17	\N	\N	\N	\N
4068	2024-03-25	98.17	\N	\N	\N	\N
4069	2024-03-26	54.03	\N	\N	\N	\N
4070	2024-03-27	110.32	\N	\N	\N	\N
4071	2024-03-28	97.98	\N	\N	\N	\N
4072	2024-03-29	80.23	\N	\N	\N	\N
4073	2024-03-30	119.44	\N	\N	\N	\N
4074	2024-03-31	99.97	\N	\N	\N	\N
4075	2024-03-01	124.11	\N	\N	\N	\N
4076	2024-03-02	90.85	\N	\N	\N	\N
4077	2024-03-03	139.73	\N	\N	\N	\N
4078	2024-03-04	66.25	\N	\N	\N	\N
4079	2024-03-05	130.18	\N	\N	\N	\N
4080	2024-03-06	116.98	\N	\N	\N	\N
4081	2024-03-07	112.03	\N	\N	\N	\N
4082	2024-03-08	138.34	\N	\N	\N	\N
4083	2024-03-09	137.68	\N	\N	\N	\N
4084	2024-03-10	92.07	\N	\N	\N	\N
4085	2024-03-11	89.22	\N	\N	\N	\N
4086	2024-03-12	105.18	\N	\N	\N	\N
4087	2024-03-13	91.91	\N	\N	\N	\N
4088	2024-03-14	74.47	\N	\N	\N	\N
4089	2024-03-15	64.20	\N	\N	\N	\N
4090	2024-03-16	140.88	\N	\N	\N	\N
4091	2024-03-17	106.38	\N	\N	\N	\N
4092	2024-03-18	98.86	\N	\N	\N	\N
4093	2024-03-19	77.85	\N	\N	\N	\N
4094	2024-03-20	88.77	\N	\N	\N	\N
4095	2024-03-21	78.13	\N	\N	\N	\N
4096	2024-03-22	99.71	\N	\N	\N	\N
4097	2024-03-23	134.90	\N	\N	\N	\N
4098	2024-03-24	72.17	\N	\N	\N	\N
4099	2024-03-25	148.17	\N	\N	\N	\N
4100	2024-03-26	117.53	\N	\N	\N	\N
4101	2024-03-27	147.38	\N	\N	\N	\N
4102	2024-03-28	145.25	\N	\N	\N	\N
4103	2024-03-29	106.44	\N	\N	\N	\N
4104	2024-03-30	55.50	\N	\N	\N	\N
4105	2024-03-31	69.24	\N	\N	\N	\N
4106	2024-03-01	101.92	\N	\N	\N	\N
4107	2024-03-02	106.19	\N	\N	\N	\N
4108	2024-03-03	139.13	\N	\N	\N	\N
4109	2024-03-04	82.74	\N	\N	\N	\N
4110	2024-03-05	135.11	\N	\N	\N	\N
4111	2024-03-06	111.88	\N	\N	\N	\N
4112	2024-03-07	119.06	\N	\N	\N	\N
4113	2024-03-08	76.42	\N	\N	\N	\N
4114	2024-03-09	131.80	\N	\N	\N	\N
4115	2024-03-10	136.92	\N	\N	\N	\N
4116	2024-03-11	87.53	\N	\N	\N	\N
4117	2024-03-12	56.01	\N	\N	\N	\N
4118	2024-03-13	101.49	\N	\N	\N	\N
4119	2024-03-14	70.53	\N	\N	\N	\N
4120	2024-03-15	120.11	\N	\N	\N	\N
4121	2024-03-16	107.40	\N	\N	\N	\N
4122	2024-03-17	108.34	\N	\N	\N	\N
4123	2024-03-18	137.78	\N	\N	\N	\N
4124	2024-03-19	115.36	\N	\N	\N	\N
4125	2024-03-20	122.46	\N	\N	\N	\N
4126	2024-03-21	86.27	\N	\N	\N	\N
4127	2024-03-22	89.36	\N	\N	\N	\N
4128	2024-03-23	148.65	\N	\N	\N	\N
4129	2024-03-24	64.23	\N	\N	\N	\N
4130	2024-03-25	77.16	\N	\N	\N	\N
4131	2024-03-26	96.89	\N	\N	\N	\N
4132	2024-03-27	140.21	\N	\N	\N	\N
4133	2024-03-28	149.55	\N	\N	\N	\N
4134	2024-03-29	140.39	\N	\N	\N	\N
4135	2024-03-30	136.04	\N	\N	\N	\N
4136	2024-03-31	112.97	\N	\N	\N	\N
4137	2024-03-01	123.26	\N	\N	\N	\N
4138	2024-03-02	71.00	\N	\N	\N	\N
4139	2024-03-03	71.81	\N	\N	\N	\N
4140	2024-03-04	60.17	\N	\N	\N	\N
4141	2024-03-05	123.03	\N	\N	\N	\N
4142	2024-03-06	124.42	\N	\N	\N	\N
4143	2024-03-07	64.55	\N	\N	\N	\N
4144	2024-03-08	68.82	\N	\N	\N	\N
4145	2024-03-09	62.19	\N	\N	\N	\N
4146	2024-03-10	126.87	\N	\N	\N	\N
4147	2024-03-11	73.91	\N	\N	\N	\N
4148	2024-03-12	109.71	\N	\N	\N	\N
4149	2024-03-13	78.81	\N	\N	\N	\N
4150	2024-03-14	78.36	\N	\N	\N	\N
4151	2024-03-15	60.32	\N	\N	\N	\N
4152	2024-03-16	111.94	\N	\N	\N	\N
4153	2024-03-17	121.85	\N	\N	\N	\N
4154	2024-03-18	67.65	\N	\N	\N	\N
4155	2024-03-19	83.99	\N	\N	\N	\N
4156	2024-03-20	77.96	\N	\N	\N	\N
4157	2024-03-21	99.04	\N	\N	\N	\N
4158	2024-03-22	109.48	\N	\N	\N	\N
4159	2024-03-23	67.60	\N	\N	\N	\N
4160	2024-03-24	131.43	\N	\N	\N	\N
4161	2024-03-25	140.08	\N	\N	\N	\N
4162	2024-03-26	134.17	\N	\N	\N	\N
4163	2024-03-27	117.67	\N	\N	\N	\N
4164	2024-03-28	113.74	\N	\N	\N	\N
4165	2024-03-29	139.49	\N	\N	\N	\N
4166	2024-03-30	130.69	\N	\N	\N	\N
4167	2024-03-31	106.91	\N	\N	\N	\N
4168	2024-03-01	148.00	\N	\N	\N	\N
4169	2024-03-02	50.92	\N	\N	\N	\N
4170	2024-03-03	51.45	\N	\N	\N	\N
4171	2024-03-04	125.25	\N	\N	\N	\N
4172	2024-03-05	143.08	\N	\N	\N	\N
4173	2024-03-06	110.49	\N	\N	\N	\N
4174	2024-03-07	96.23	\N	\N	\N	\N
4175	2024-03-08	71.91	\N	\N	\N	\N
4176	2024-03-09	108.84	\N	\N	\N	\N
4177	2024-03-10	118.93	\N	\N	\N	\N
4178	2024-03-11	72.18	\N	\N	\N	\N
4179	2024-03-12	135.15	\N	\N	\N	\N
4180	2024-03-13	135.67	\N	\N	\N	\N
4181	2024-03-14	118.99	\N	\N	\N	\N
4182	2024-03-15	139.44	\N	\N	\N	\N
4183	2024-03-16	131.73	\N	\N	\N	\N
4184	2024-03-17	148.97	\N	\N	\N	\N
4185	2024-03-18	57.47	\N	\N	\N	\N
4186	2024-03-19	75.60	\N	\N	\N	\N
4187	2024-03-20	149.21	\N	\N	\N	\N
4188	2024-03-21	118.20	\N	\N	\N	\N
4189	2024-03-22	83.37	\N	\N	\N	\N
4190	2024-03-23	104.38	\N	\N	\N	\N
4191	2024-03-24	113.03	\N	\N	\N	\N
4192	2024-03-25	128.65	\N	\N	\N	\N
4193	2024-03-26	103.75	\N	\N	\N	\N
4194	2024-03-27	126.82	\N	\N	\N	\N
4195	2024-03-28	92.45	\N	\N	\N	\N
4196	2024-03-29	132.24	\N	\N	\N	\N
4197	2024-03-30	71.45	\N	\N	\N	\N
4198	2024-03-31	97.19	\N	\N	\N	\N
4199	2024-03-01	142.53	\N	\N	\N	\N
4200	2024-03-02	107.23	\N	\N	\N	\N
4201	2024-03-03	96.31	\N	\N	\N	\N
4202	2024-03-04	128.63	\N	\N	\N	\N
4203	2024-03-05	69.13	\N	\N	\N	\N
4204	2024-03-06	119.11	\N	\N	\N	\N
4205	2024-03-07	138.38	\N	\N	\N	\N
4206	2024-03-08	143.75	\N	\N	\N	\N
4207	2024-03-09	99.34	\N	\N	\N	\N
4208	2024-03-10	60.76	\N	\N	\N	\N
4209	2024-03-11	112.64	\N	\N	\N	\N
4210	2024-03-12	132.87	\N	\N	\N	\N
4211	2024-03-13	96.40	\N	\N	\N	\N
4212	2024-03-14	75.22	\N	\N	\N	\N
4213	2024-03-15	61.85	\N	\N	\N	\N
4214	2024-03-16	92.12	\N	\N	\N	\N
4215	2024-03-17	113.59	\N	\N	\N	\N
4216	2024-03-18	110.89	\N	\N	\N	\N
4217	2024-03-19	136.66	\N	\N	\N	\N
4218	2024-03-20	105.01	\N	\N	\N	\N
4219	2024-03-21	50.29	\N	\N	\N	\N
4220	2024-03-22	71.50	\N	\N	\N	\N
4221	2024-03-23	133.61	\N	\N	\N	\N
4222	2024-03-24	102.49	\N	\N	\N	\N
4223	2024-03-25	69.46	\N	\N	\N	\N
4224	2024-03-26	138.68	\N	\N	\N	\N
4225	2024-03-27	58.33	\N	\N	\N	\N
4226	2024-03-28	126.99	\N	\N	\N	\N
4227	2024-03-29	146.64	\N	\N	\N	\N
4228	2024-03-30	103.43	\N	\N	\N	\N
4229	2024-03-31	133.78	\N	\N	\N	\N
4230	2024-03-01	118.20	\N	\N	\N	\N
4231	2024-03-02	141.03	\N	\N	\N	\N
4232	2024-03-03	69.68	\N	\N	\N	\N
4233	2024-03-04	145.87	\N	\N	\N	\N
4234	2024-03-05	123.04	\N	\N	\N	\N
4235	2024-03-06	94.73	\N	\N	\N	\N
4236	2024-03-07	66.08	\N	\N	\N	\N
4237	2024-03-08	130.14	\N	\N	\N	\N
4238	2024-03-09	141.23	\N	\N	\N	\N
4239	2024-03-10	79.99	\N	\N	\N	\N
4240	2024-03-11	100.43	\N	\N	\N	\N
4241	2024-03-12	75.83	\N	\N	\N	\N
4242	2024-03-13	58.04	\N	\N	\N	\N
4243	2024-03-14	72.27	\N	\N	\N	\N
4244	2024-03-15	82.66	\N	\N	\N	\N
4245	2024-03-16	81.16	\N	\N	\N	\N
4246	2024-03-17	140.30	\N	\N	\N	\N
4247	2024-03-18	110.12	\N	\N	\N	\N
4248	2024-03-19	101.58	\N	\N	\N	\N
4249	2024-03-20	65.74	\N	\N	\N	\N
4250	2024-03-21	51.91	\N	\N	\N	\N
4251	2024-03-22	123.46	\N	\N	\N	\N
4252	2024-03-23	127.45	\N	\N	\N	\N
4253	2024-03-24	95.58	\N	\N	\N	\N
4254	2024-03-25	128.36	\N	\N	\N	\N
4255	2024-03-26	103.98	\N	\N	\N	\N
4256	2024-03-27	55.22	\N	\N	\N	\N
4257	2024-03-28	116.20	\N	\N	\N	\N
4258	2024-03-29	148.41	\N	\N	\N	\N
4259	2024-03-30	76.45	\N	\N	\N	\N
4260	2024-03-31	115.02	\N	\N	\N	\N
4261	2024-03-01	83.44	\N	\N	\N	\N
4262	2024-03-02	101.28	\N	\N	\N	\N
4263	2024-03-03	83.27	\N	\N	\N	\N
4264	2024-03-04	115.62	\N	\N	\N	\N
4265	2024-03-05	120.04	\N	\N	\N	\N
4266	2024-03-06	102.14	\N	\N	\N	\N
4267	2024-03-07	149.53	\N	\N	\N	\N
4268	2024-03-08	70.39	\N	\N	\N	\N
4269	2024-03-09	74.47	\N	\N	\N	\N
4270	2024-03-10	54.53	\N	\N	\N	\N
4271	2024-03-11	69.74	\N	\N	\N	\N
4272	2024-03-12	145.72	\N	\N	\N	\N
4273	2024-03-13	81.58	\N	\N	\N	\N
4274	2024-03-14	137.44	\N	\N	\N	\N
4275	2024-03-15	81.11	\N	\N	\N	\N
4276	2024-03-16	90.99	\N	\N	\N	\N
4277	2024-03-17	85.31	\N	\N	\N	\N
4278	2024-03-18	137.98	\N	\N	\N	\N
4279	2024-03-19	92.69	\N	\N	\N	\N
4280	2024-03-20	128.53	\N	\N	\N	\N
4281	2024-03-21	103.87	\N	\N	\N	\N
4282	2024-03-22	122.75	\N	\N	\N	\N
4283	2024-03-23	59.61	\N	\N	\N	\N
4284	2024-03-24	72.19	\N	\N	\N	\N
4285	2024-03-25	146.35	\N	\N	\N	\N
4286	2024-03-26	104.63	\N	\N	\N	\N
4287	2024-03-27	105.99	\N	\N	\N	\N
4288	2024-03-28	124.79	\N	\N	\N	\N
4289	2024-03-29	133.37	\N	\N	\N	\N
4290	2024-03-30	129.80	\N	\N	\N	\N
4291	2024-03-31	146.95	\N	\N	\N	\N
4292	2024-03-01	63.64	\N	\N	\N	\N
4293	2024-03-02	119.96	\N	\N	\N	\N
4294	2024-03-03	119.51	\N	\N	\N	\N
4295	2024-03-04	57.35	\N	\N	\N	\N
4296	2024-03-05	132.22	\N	\N	\N	\N
4297	2024-03-06	96.72	\N	\N	\N	\N
4298	2024-03-07	108.33	\N	\N	\N	\N
4299	2024-03-08	111.27	\N	\N	\N	\N
4300	2024-03-09	149.38	\N	\N	\N	\N
4301	2024-03-10	93.21	\N	\N	\N	\N
4302	2024-03-11	147.94	\N	\N	\N	\N
4303	2024-03-12	140.96	\N	\N	\N	\N
4304	2024-03-13	109.92	\N	\N	\N	\N
4305	2024-03-14	69.05	\N	\N	\N	\N
4306	2024-03-15	107.58	\N	\N	\N	\N
4307	2024-03-16	67.11	\N	\N	\N	\N
4308	2024-03-17	68.87	\N	\N	\N	\N
4309	2024-03-18	148.13	\N	\N	\N	\N
4310	2024-03-19	74.98	\N	\N	\N	\N
4311	2024-03-20	105.98	\N	\N	\N	\N
4312	2024-03-21	87.75	\N	\N	\N	\N
4313	2024-03-22	90.46	\N	\N	\N	\N
4314	2024-03-23	104.58	\N	\N	\N	\N
4315	2024-03-24	73.57	\N	\N	\N	\N
4316	2024-03-25	102.26	\N	\N	\N	\N
4317	2024-03-26	148.24	\N	\N	\N	\N
4318	2024-03-27	73.16	\N	\N	\N	\N
4319	2024-03-28	59.18	\N	\N	\N	\N
4320	2024-03-29	91.37	\N	\N	\N	\N
4321	2024-03-30	58.04	\N	\N	\N	\N
4322	2024-03-31	112.29	\N	\N	\N	\N
4323	2024-03-01	87.50	\N	\N	\N	\N
4324	2024-03-02	79.35	\N	\N	\N	\N
4325	2024-03-03	64.62	\N	\N	\N	\N
4326	2024-03-04	137.75	\N	\N	\N	\N
4327	2024-03-05	147.95	\N	\N	\N	\N
4328	2024-03-06	75.02	\N	\N	\N	\N
4329	2024-03-07	105.65	\N	\N	\N	\N
4330	2024-03-08	99.79	\N	\N	\N	\N
4331	2024-03-09	57.59	\N	\N	\N	\N
4332	2024-03-10	147.16	\N	\N	\N	\N
4333	2024-03-11	149.94	\N	\N	\N	\N
4334	2024-03-12	112.10	\N	\N	\N	\N
4335	2024-03-13	54.95	\N	\N	\N	\N
4336	2024-03-14	63.00	\N	\N	\N	\N
4337	2024-03-15	82.93	\N	\N	\N	\N
4338	2024-03-16	85.66	\N	\N	\N	\N
4339	2024-03-17	124.22	\N	\N	\N	\N
4340	2024-03-18	84.78	\N	\N	\N	\N
4341	2024-03-19	68.62	\N	\N	\N	\N
4342	2024-03-20	117.17	\N	\N	\N	\N
4343	2024-03-21	66.33	\N	\N	\N	\N
4344	2024-03-22	99.48	\N	\N	\N	\N
4345	2024-03-23	56.91	\N	\N	\N	\N
4346	2024-03-24	99.03	\N	\N	\N	\N
4347	2024-03-25	59.99	\N	\N	\N	\N
4348	2024-03-26	88.10	\N	\N	\N	\N
4349	2024-03-27	141.77	\N	\N	\N	\N
4350	2024-03-28	104.79	\N	\N	\N	\N
4351	2024-03-29	52.81	\N	\N	\N	\N
4352	2024-03-30	87.20	\N	\N	\N	\N
4353	2024-03-31	93.79	\N	\N	\N	\N
4354	2024-03-01	74.23	\N	\N	\N	\N
4355	2024-03-02	53.88	\N	\N	\N	\N
4356	2024-03-03	133.95	\N	\N	\N	\N
4357	2024-03-04	61.75	\N	\N	\N	\N
4358	2024-03-05	145.49	\N	\N	\N	\N
4359	2024-03-06	120.39	\N	\N	\N	\N
4360	2024-03-07	118.68	\N	\N	\N	\N
4361	2024-03-08	143.10	\N	\N	\N	\N
4362	2024-03-09	136.89	\N	\N	\N	\N
4363	2024-03-10	147.52	\N	\N	\N	\N
4364	2024-03-11	96.41	\N	\N	\N	\N
4365	2024-03-12	137.47	\N	\N	\N	\N
4366	2024-03-13	133.29	\N	\N	\N	\N
4367	2024-03-14	59.41	\N	\N	\N	\N
4368	2024-03-15	61.27	\N	\N	\N	\N
4369	2024-03-16	123.32	\N	\N	\N	\N
4370	2024-03-17	96.03	\N	\N	\N	\N
4371	2024-03-18	93.68	\N	\N	\N	\N
4372	2024-03-19	139.73	\N	\N	\N	\N
4373	2024-03-20	63.21	\N	\N	\N	\N
4374	2024-03-21	142.14	\N	\N	\N	\N
4375	2024-03-22	147.26	\N	\N	\N	\N
4376	2024-03-23	117.86	\N	\N	\N	\N
4377	2024-03-24	75.76	\N	\N	\N	\N
4378	2024-03-25	95.55	\N	\N	\N	\N
4379	2024-03-26	128.39	\N	\N	\N	\N
4380	2024-03-27	83.88	\N	\N	\N	\N
4381	2024-03-28	71.88	\N	\N	\N	\N
4382	2024-03-29	58.44	\N	\N	\N	\N
4383	2024-03-30	89.70	\N	\N	\N	\N
4384	2024-03-31	143.08	\N	\N	\N	\N
4385	2024-03-01	83.53	\N	\N	\N	\N
4386	2024-03-02	55.31	\N	\N	\N	\N
4387	2024-03-03	118.53	\N	\N	\N	\N
4388	2024-03-04	69.14	\N	\N	\N	\N
4389	2024-03-05	93.78	\N	\N	\N	\N
4390	2024-03-06	74.51	\N	\N	\N	\N
4391	2024-03-07	140.57	\N	\N	\N	\N
4392	2024-03-08	100.31	\N	\N	\N	\N
4393	2024-03-09	73.27	\N	\N	\N	\N
4394	2024-03-10	97.45	\N	\N	\N	\N
4395	2024-03-11	119.60	\N	\N	\N	\N
4396	2024-03-12	62.95	\N	\N	\N	\N
4397	2024-03-13	124.98	\N	\N	\N	\N
4398	2024-03-14	106.11	\N	\N	\N	\N
4399	2024-03-15	128.77	\N	\N	\N	\N
4400	2024-03-16	85.49	\N	\N	\N	\N
4401	2024-03-17	85.60	\N	\N	\N	\N
4402	2024-03-18	58.55	\N	\N	\N	\N
4403	2024-03-19	85.78	\N	\N	\N	\N
4404	2024-03-20	57.87	\N	\N	\N	\N
4405	2024-03-21	123.88	\N	\N	\N	\N
4406	2024-03-22	143.59	\N	\N	\N	\N
4407	2024-03-23	115.29	\N	\N	\N	\N
4408	2024-03-24	52.14	\N	\N	\N	\N
4409	2024-03-25	141.10	\N	\N	\N	\N
4410	2024-03-26	60.67	\N	\N	\N	\N
4411	2024-03-27	111.88	\N	\N	\N	\N
4412	2024-03-28	107.20	\N	\N	\N	\N
4413	2024-03-29	89.24	\N	\N	\N	\N
4414	2024-03-30	81.92	\N	\N	\N	\N
4415	2024-03-31	65.92	\N	\N	\N	\N
4416	2024-03-01	117.20	\N	\N	\N	\N
4417	2024-03-02	62.14	\N	\N	\N	\N
4418	2024-03-03	112.62	\N	\N	\N	\N
4419	2024-03-04	116.37	\N	\N	\N	\N
4420	2024-03-05	149.39	\N	\N	\N	\N
4421	2024-03-06	76.03	\N	\N	\N	\N
4422	2024-03-07	74.82	\N	\N	\N	\N
4423	2024-03-08	124.07	\N	\N	\N	\N
4424	2024-03-09	146.79	\N	\N	\N	\N
4425	2024-03-10	108.87	\N	\N	\N	\N
4426	2024-03-11	133.41	\N	\N	\N	\N
4427	2024-03-12	111.07	\N	\N	\N	\N
4428	2024-03-13	106.68	\N	\N	\N	\N
4429	2024-03-14	137.31	\N	\N	\N	\N
4430	2024-03-15	135.44	\N	\N	\N	\N
4431	2024-03-16	122.84	\N	\N	\N	\N
4432	2024-03-17	142.02	\N	\N	\N	\N
4433	2024-03-18	148.75	\N	\N	\N	\N
4434	2024-03-19	119.90	\N	\N	\N	\N
4435	2024-03-20	144.06	\N	\N	\N	\N
4436	2024-03-21	52.35	\N	\N	\N	\N
4437	2024-03-22	58.78	\N	\N	\N	\N
4438	2024-03-23	88.05	\N	\N	\N	\N
4439	2024-03-24	51.99	\N	\N	\N	\N
4440	2024-03-25	71.49	\N	\N	\N	\N
4441	2024-03-26	86.49	\N	\N	\N	\N
4442	2024-03-27	126.93	\N	\N	\N	\N
4443	2024-03-28	76.87	\N	\N	\N	\N
4444	2024-03-29	75.39	\N	\N	\N	\N
4445	2024-03-30	95.77	\N	\N	\N	\N
4446	2024-03-31	85.96	\N	\N	\N	\N
4447	2024-03-01	86.38	\N	\N	\N	\N
4448	2024-03-02	125.80	\N	\N	\N	\N
4449	2024-03-03	147.66	\N	\N	\N	\N
4450	2024-03-04	113.93	\N	\N	\N	\N
4451	2024-03-05	137.07	\N	\N	\N	\N
4452	2024-03-06	135.66	\N	\N	\N	\N
4453	2024-03-07	66.15	\N	\N	\N	\N
4454	2024-03-08	76.02	\N	\N	\N	\N
4455	2024-03-09	56.41	\N	\N	\N	\N
4456	2024-03-10	59.09	\N	\N	\N	\N
4457	2024-03-11	113.85	\N	\N	\N	\N
4458	2024-03-12	108.20	\N	\N	\N	\N
4459	2024-03-13	102.86	\N	\N	\N	\N
4460	2024-03-14	66.53	\N	\N	\N	\N
4461	2024-03-15	76.69	\N	\N	\N	\N
4462	2024-03-16	66.98	\N	\N	\N	\N
4463	2024-03-17	84.75	\N	\N	\N	\N
4464	2024-03-18	105.41	\N	\N	\N	\N
4465	2024-03-19	74.52	\N	\N	\N	\N
4466	2024-03-20	121.06	\N	\N	\N	\N
4467	2024-03-21	85.67	\N	\N	\N	\N
4468	2024-03-22	87.40	\N	\N	\N	\N
4469	2024-03-23	86.67	\N	\N	\N	\N
4470	2024-03-24	101.16	\N	\N	\N	\N
4471	2024-03-25	79.79	\N	\N	\N	\N
4472	2024-03-26	87.84	\N	\N	\N	\N
4473	2024-03-27	61.78	\N	\N	\N	\N
4474	2024-03-28	74.26	\N	\N	\N	\N
4475	2024-03-29	141.28	\N	\N	\N	\N
4476	2024-03-30	72.58	\N	\N	\N	\N
4477	2024-03-31	129.75	\N	\N	\N	\N
4478	2024-03-01	98.59	\N	\N	\N	\N
4479	2024-03-02	88.66	\N	\N	\N	\N
4480	2024-03-03	149.01	\N	\N	\N	\N
4481	2024-03-04	97.64	\N	\N	\N	\N
4482	2024-03-05	132.27	\N	\N	\N	\N
4483	2024-03-06	102.77	\N	\N	\N	\N
4484	2024-03-07	136.36	\N	\N	\N	\N
4485	2024-03-08	67.91	\N	\N	\N	\N
4486	2024-03-09	98.04	\N	\N	\N	\N
4487	2024-03-10	108.21	\N	\N	\N	\N
4488	2024-03-11	115.90	\N	\N	\N	\N
4489	2024-03-12	136.14	\N	\N	\N	\N
4490	2024-03-13	143.53	\N	\N	\N	\N
4491	2024-03-14	137.81	\N	\N	\N	\N
4492	2024-03-15	106.09	\N	\N	\N	\N
4493	2024-03-16	50.58	\N	\N	\N	\N
4494	2024-03-17	92.14	\N	\N	\N	\N
4495	2024-03-18	146.55	\N	\N	\N	\N
4496	2024-03-19	51.86	\N	\N	\N	\N
4497	2024-03-20	52.00	\N	\N	\N	\N
4498	2024-03-21	142.30	\N	\N	\N	\N
4499	2024-03-22	99.23	\N	\N	\N	\N
4500	2024-03-23	95.25	\N	\N	\N	\N
4501	2024-03-24	133.85	\N	\N	\N	\N
4502	2024-03-25	75.83	\N	\N	\N	\N
4503	2024-03-26	139.13	\N	\N	\N	\N
4504	2024-03-27	126.71	\N	\N	\N	\N
4505	2024-03-28	130.42	\N	\N	\N	\N
4506	2024-03-29	122.63	\N	\N	\N	\N
4507	2024-03-30	76.69	\N	\N	\N	\N
4508	2024-03-31	83.80	\N	\N	\N	\N
4509	2024-03-01	93.05	\N	\N	\N	\N
4510	2024-03-02	145.58	\N	\N	\N	\N
4511	2024-03-03	53.26	\N	\N	\N	\N
4512	2024-03-04	67.93	\N	\N	\N	\N
4513	2024-03-05	136.28	\N	\N	\N	\N
4514	2024-03-06	89.57	\N	\N	\N	\N
4515	2024-03-07	87.99	\N	\N	\N	\N
4516	2024-03-08	122.02	\N	\N	\N	\N
4517	2024-03-09	94.37	\N	\N	\N	\N
4518	2024-03-10	68.71	\N	\N	\N	\N
4519	2024-03-11	80.61	\N	\N	\N	\N
4520	2024-03-12	54.31	\N	\N	\N	\N
4521	2024-03-13	86.41	\N	\N	\N	\N
4522	2024-03-14	141.99	\N	\N	\N	\N
4523	2024-03-15	86.67	\N	\N	\N	\N
4524	2024-03-16	126.58	\N	\N	\N	\N
4525	2024-03-17	50.32	\N	\N	\N	\N
4526	2024-03-18	104.43	\N	\N	\N	\N
4527	2024-03-19	69.80	\N	\N	\N	\N
4528	2024-03-20	95.61	\N	\N	\N	\N
4529	2024-03-21	113.66	\N	\N	\N	\N
4530	2024-03-22	113.75	\N	\N	\N	\N
4531	2024-03-23	138.90	\N	\N	\N	\N
4532	2024-03-24	77.77	\N	\N	\N	\N
4533	2024-03-25	72.90	\N	\N	\N	\N
4534	2024-03-26	98.19	\N	\N	\N	\N
4535	2024-03-27	126.45	\N	\N	\N	\N
4536	2024-03-28	96.65	\N	\N	\N	\N
4537	2024-03-29	106.32	\N	\N	\N	\N
4538	2024-03-30	148.76	\N	\N	\N	\N
4539	2024-03-31	113.55	\N	\N	\N	\N
4540	2024-03-01	105.63	\N	\N	\N	\N
4541	2024-03-02	89.14	\N	\N	\N	\N
4542	2024-03-03	109.93	\N	\N	\N	\N
4543	2024-03-04	126.31	\N	\N	\N	\N
4544	2024-03-05	137.28	\N	\N	\N	\N
4545	2024-03-06	120.78	\N	\N	\N	\N
4546	2024-03-07	132.75	\N	\N	\N	\N
4547	2024-03-08	109.08	\N	\N	\N	\N
4548	2024-03-09	50.18	\N	\N	\N	\N
4549	2024-03-10	59.16	\N	\N	\N	\N
4550	2024-03-11	59.86	\N	\N	\N	\N
4551	2024-03-12	131.29	\N	\N	\N	\N
4552	2024-03-13	109.14	\N	\N	\N	\N
4553	2024-03-14	63.36	\N	\N	\N	\N
4554	2024-03-15	134.37	\N	\N	\N	\N
4555	2024-03-16	95.52	\N	\N	\N	\N
4556	2024-03-17	60.20	\N	\N	\N	\N
4557	2024-03-18	60.92	\N	\N	\N	\N
4558	2024-03-19	95.04	\N	\N	\N	\N
4559	2024-03-20	81.86	\N	\N	\N	\N
4560	2024-03-21	108.34	\N	\N	\N	\N
4561	2024-03-22	121.12	\N	\N	\N	\N
4562	2024-03-23	82.88	\N	\N	\N	\N
4563	2024-03-24	127.30	\N	\N	\N	\N
4564	2024-03-25	131.33	\N	\N	\N	\N
4565	2024-03-26	89.56	\N	\N	\N	\N
4566	2024-03-27	59.39	\N	\N	\N	\N
4567	2024-03-28	106.47	\N	\N	\N	\N
4568	2024-03-29	126.51	\N	\N	\N	\N
4569	2024-03-30	90.94	\N	\N	\N	\N
4570	2024-03-31	88.72	\N	\N	\N	\N
4571	2024-03-01	93.48	\N	\N	\N	\N
4572	2024-03-02	122.73	\N	\N	\N	\N
4573	2024-03-03	93.19	\N	\N	\N	\N
4574	2024-03-04	75.02	\N	\N	\N	\N
4575	2024-03-05	88.24	\N	\N	\N	\N
4576	2024-03-06	79.60	\N	\N	\N	\N
4577	2024-03-07	50.99	\N	\N	\N	\N
4578	2024-03-08	97.35	\N	\N	\N	\N
4579	2024-03-09	87.58	\N	\N	\N	\N
4580	2024-03-10	90.92	\N	\N	\N	\N
4581	2024-03-11	68.15	\N	\N	\N	\N
4582	2024-03-12	123.72	\N	\N	\N	\N
4583	2024-03-13	81.68	\N	\N	\N	\N
4584	2024-03-14	126.16	\N	\N	\N	\N
4585	2024-03-15	76.45	\N	\N	\N	\N
4586	2024-03-16	68.84	\N	\N	\N	\N
4587	2024-03-17	96.18	\N	\N	\N	\N
4588	2024-03-18	95.92	\N	\N	\N	\N
4589	2024-03-19	72.11	\N	\N	\N	\N
4590	2024-03-20	93.47	\N	\N	\N	\N
4591	2024-03-21	73.64	\N	\N	\N	\N
4592	2024-03-22	97.28	\N	\N	\N	\N
4593	2024-03-23	124.61	\N	\N	\N	\N
4594	2024-03-24	117.44	\N	\N	\N	\N
4595	2024-03-25	105.67	\N	\N	\N	\N
4596	2024-03-26	86.34	\N	\N	\N	\N
4597	2024-03-27	59.67	\N	\N	\N	\N
4598	2024-03-28	59.42	\N	\N	\N	\N
4599	2024-03-29	106.56	\N	\N	\N	\N
4600	2024-03-30	113.52	\N	\N	\N	\N
4601	2024-03-31	55.40	\N	\N	\N	\N
4602	2024-03-01	81.34	\N	\N	\N	\N
4603	2024-03-02	112.44	\N	\N	\N	\N
4604	2024-03-03	51.63	\N	\N	\N	\N
4605	2024-03-04	104.76	\N	\N	\N	\N
4606	2024-03-05	108.28	\N	\N	\N	\N
4607	2024-03-06	134.31	\N	\N	\N	\N
4608	2024-03-07	119.53	\N	\N	\N	\N
4609	2024-03-08	75.32	\N	\N	\N	\N
4610	2024-03-09	67.08	\N	\N	\N	\N
4611	2024-03-10	66.21	\N	\N	\N	\N
4612	2024-03-11	71.15	\N	\N	\N	\N
4613	2024-03-12	117.35	\N	\N	\N	\N
4614	2024-03-13	86.89	\N	\N	\N	\N
4615	2024-03-14	113.68	\N	\N	\N	\N
4616	2024-03-15	83.07	\N	\N	\N	\N
4617	2024-03-16	52.56	\N	\N	\N	\N
4618	2024-03-17	149.99	\N	\N	\N	\N
4619	2024-03-18	71.49	\N	\N	\N	\N
4620	2024-03-19	51.08	\N	\N	\N	\N
4621	2024-03-20	62.83	\N	\N	\N	\N
4622	2024-03-21	136.51	\N	\N	\N	\N
4623	2024-03-22	93.10	\N	\N	\N	\N
4624	2024-03-23	136.12	\N	\N	\N	\N
4625	2024-03-24	89.99	\N	\N	\N	\N
4626	2024-03-25	98.15	\N	\N	\N	\N
4627	2024-03-26	86.44	\N	\N	\N	\N
4628	2024-03-27	117.30	\N	\N	\N	\N
4629	2024-03-28	117.95	\N	\N	\N	\N
4630	2024-03-29	59.24	\N	\N	\N	\N
4631	2024-03-30	144.31	\N	\N	\N	\N
4632	2024-03-31	133.53	\N	\N	\N	\N
4633	2024-03-01	125.77	\N	\N	\N	\N
4634	2024-03-02	143.81	\N	\N	\N	\N
4635	2024-03-03	81.46	\N	\N	\N	\N
4636	2024-03-04	140.79	\N	\N	\N	\N
4637	2024-03-05	140.95	\N	\N	\N	\N
4638	2024-03-06	145.49	\N	\N	\N	\N
4639	2024-03-07	80.58	\N	\N	\N	\N
4640	2024-03-08	66.43	\N	\N	\N	\N
4641	2024-03-09	118.04	\N	\N	\N	\N
4642	2024-03-10	123.18	\N	\N	\N	\N
4643	2024-03-11	115.19	\N	\N	\N	\N
4644	2024-03-12	70.22	\N	\N	\N	\N
4645	2024-03-13	150.00	\N	\N	\N	\N
4646	2024-03-14	94.63	\N	\N	\N	\N
4647	2024-03-15	86.62	\N	\N	\N	\N
4648	2024-03-16	110.23	\N	\N	\N	\N
4649	2024-03-17	107.02	\N	\N	\N	\N
4650	2024-03-18	146.99	\N	\N	\N	\N
4651	2024-03-19	108.27	\N	\N	\N	\N
4652	2024-03-20	89.71	\N	\N	\N	\N
4653	2024-03-21	89.22	\N	\N	\N	\N
4654	2024-03-22	138.99	\N	\N	\N	\N
4655	2024-03-23	56.45	\N	\N	\N	\N
4656	2024-03-24	94.48	\N	\N	\N	\N
4657	2024-03-25	93.79	\N	\N	\N	\N
4658	2024-03-26	115.82	\N	\N	\N	\N
4659	2024-03-27	79.69	\N	\N	\N	\N
4660	2024-03-28	110.74	\N	\N	\N	\N
4661	2024-03-29	91.60	\N	\N	\N	\N
4662	2024-03-30	124.56	\N	\N	\N	\N
4663	2024-03-31	50.90	\N	\N	\N	\N
4664	2024-03-01	85.96	\N	\N	\N	\N
4665	2024-03-02	115.43	\N	\N	\N	\N
4666	2024-03-03	147.02	\N	\N	\N	\N
4667	2024-03-04	101.95	\N	\N	\N	\N
4668	2024-03-05	56.08	\N	\N	\N	\N
4669	2024-03-06	103.83	\N	\N	\N	\N
4670	2024-03-07	53.10	\N	\N	\N	\N
4671	2024-03-08	124.52	\N	\N	\N	\N
4672	2024-03-09	129.65	\N	\N	\N	\N
4673	2024-03-10	108.90	\N	\N	\N	\N
4674	2024-03-11	79.65	\N	\N	\N	\N
4675	2024-03-12	94.58	\N	\N	\N	\N
4676	2024-03-13	147.07	\N	\N	\N	\N
4677	2024-03-14	67.13	\N	\N	\N	\N
4678	2024-03-15	100.73	\N	\N	\N	\N
4679	2024-03-16	114.42	\N	\N	\N	\N
4680	2024-03-17	109.19	\N	\N	\N	\N
4681	2024-03-18	118.43	\N	\N	\N	\N
4682	2024-03-19	85.06	\N	\N	\N	\N
4683	2024-03-20	117.01	\N	\N	\N	\N
4684	2024-03-21	56.36	\N	\N	\N	\N
4685	2024-03-22	59.55	\N	\N	\N	\N
4686	2024-03-23	123.26	\N	\N	\N	\N
4687	2024-03-24	148.62	\N	\N	\N	\N
4688	2024-03-25	87.76	\N	\N	\N	\N
4689	2024-03-26	62.39	\N	\N	\N	\N
4690	2024-03-27	101.31	\N	\N	\N	\N
4691	2024-03-28	146.97	\N	\N	\N	\N
4692	2024-03-29	51.33	\N	\N	\N	\N
4693	2024-03-30	52.57	\N	\N	\N	\N
4694	2024-03-31	144.22	\N	\N	\N	\N
4699	2025-05-07	10.00	lkjkh	\N	\N	\N
4702	2025-05-18	2.00	test	test	otros	otros
\.


--
-- TOC entry 5125 (class 0 OID 16463)
-- Dependencies: 230
-- Data for Name: inventory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory (id_producto, nombre_producto, descripcion, cantidad_actual, cantidad_minima, precio_unitario, id_proveedor, fecha_actualizacion, referencia, pvp) FROM stdin;
1	Bombilla LED 10W	Bombilla LED estándar para uso doméstico	494	100	3.01	1	\N	8000300240245	4.50
6	Ibudol 400mg	Ibuprofeno 400mg comprimidos Kern Pharma	197	20	2.14	1	\N	8470007017028	3.60
2	Cable HDMI 2.0	Cable HDMI de alta velocidad 4K	491	50	12.90	3	2025-06-07	12345	16.77
5	Disco SSD 500GB	Unidad de estado sólido SATA III	192	100	43.90	3	2025-06-07	2146234572	59.67
3	Sensor de Movimiento PIR	Sensor para sistemas de seguridad	137	30	17.75	1	\N	87435623532	24.38
4	Cemento Rápido 25kg	Cemento de fraguado rápido	84	200	6.81	2	\N	98745347653	8.84
7	Choped		200	100	3.00	1	\N	12321342345243	3.90
\.


--
-- TOC entry 5121 (class 0 OID 16440)
-- Dependencies: 226
-- Data for Name: leaves; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leaves (id_baja, id_empleado, tipo_baja, fecha_inicio, fecha_fin, comentarios) FROM stdin;
2	2	medica	2024-02-06	2024-02-11	Reposo médico
\.


--
-- TOC entry 5135 (class 0 OID 24611)
-- Dependencies: 240
-- Data for Name: order_detail; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_detail (id_detalle, id_pedido, id_producto, cantidad, precio_unitario) FROM stdin;
1	1	1	100	4.50
2	1	3	50	18.75
4	3	2	150	12.90
5	3	5	80	45.90
3	2	4	200	6.80
6	6	1	100	7.00
7	7	1	10	10.00
8	7	3	1	12.00
9	8	1	10	8.00
10	9	2	1	10.00
11	9	6	1	10.00
\.


--
-- TOC entry 5133 (class 0 OID 24591)
-- Dependencies: 238
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id_pedido, id_proveedor, id_gasto, fecha_pedido, fecha_entrega_estimada, estado, total, metodo_pago, comentarios) FROM stdin;
1	1	\N	2025-04-13 21:18:12.159904	2025-04-18 19:18:12.159	Pendiente	1387.50	transferencia	\N
2	2	\N	2025-04-13 21:18:12.159904	2025-04-16 19:18:12.159	Enviado	1360.00	tarjeta	\N
6	5	\N	2025-04-25 12:36:22.340207	2025-04-25 10:35:49.924	Cancelado	700.00	Transferencia Bancaria	
7	4	\N	2025-05-03 12:16:06.454544	2025-05-03 10:15:00.168	Pendiente	112.00	Transferencia bancaria	Se podria hacer el envio para x fecha?
8	4	\N	2025-05-03 21:25:51.546206	2025-05-03 09:25:04.115	Pendiente	80.00	Transferencia	Blabla
9	6	\N	2025-05-14 14:18:35.302873	2025-05-14 12:17:49.972	Pendiente	20.00		
3	3	\N	2025-04-13 21:18:12.159904	2025-04-20 13:18:12.159	Completado	5607.00	efectivo	\N
\.


--
-- TOC entry 5153 (class 0 OID 33252)
-- Dependencies: 258
-- Data for Name: product_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_codes (id_codigo, id_producto, codigo, tipo_codigo, fecha_creacion) FROM stdin;
1	1	789123456	barcode	2025-05-08
2	2	WEB-123-QR	qr	2025-05-08
\.


--
-- TOC entry 5149 (class 0 OID 33199)
-- Dependencies: 254
-- Data for Name: sale_products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sale_products (id_detalle_producto, id_venta, id_producto, cantidad, precio_unitario, porcentaje_descuento, porcentaje_impuesto, subtotal) FROM stdin;
3	12	4	2	6.80	0.00	21.00	13.60
4	13	5	2	45.90	0.00	21.00	91.80
5	14	1	1	4.50	0.00	21.00	4.50
6	15	3	2	18.75	0.00	21.00	37.50
7	16	2	1	12.90	0.00	21.00	12.90
8	17	4	2	6.80	0.00	21.00	13.60
9	18	5	2	45.90	0.00	21.00	91.80
10	19	1	2	4.50	0.00	21.00	9.00
11	20	3	2	18.75	0.00	21.00	37.50
12	21	2	2	12.90	0.00	21.00	25.80
13	22	4	4	6.80	0.00	21.00	27.20
14	23	3	3	18.75	0.00	21.00	56.25
15	24	5	2	45.90	0.00	21.00	91.80
16	26	6	1	3.60	0.00	21.00	3.60
17	27	2	1	16.77	0.00	21.00	16.77
18	28	6	2	3.60	0.00	21.00	7.20
19	28	2	2	16.77	0.00	21.00	33.54
20	28	5	1	59.67	0.00	21.00	59.67
21	29	3	3	24.38	0.00	21.00	73.14
22	30	4	2	8.84	0.00	21.00	17.68
\.


--
-- TOC entry 5151 (class 0 OID 33218)
-- Dependencies: 256
-- Data for Name: sale_services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sale_services (id_detalle_servicio, id_venta, id_servicio, id_empleado, horas_trabajadas, id_nivel_servicio, cantidad, precio_unitario, porcentaje_descuento, porcentaje_impuesto, fecha_programada, fecha_completado, estado_servicio, subtotal, notas_servicio) FROM stdin;
4	25	8	\N	\N	\N	1	200.00	0.00	21.00	\N	\N	completado	200.00	\N
5	25	6	\N	\N	\N	1	40.00	0.00	21.00	\N	\N	completado	40.00	\N
6	27	4	\N	\N	\N	1	75.00	0.00	21.00	\N	\N	completado	75.00	\N
7	30	9	\N	\N	\N	1	30.00	0.00	21.00	\N	\N	completado	30.00	\N
\.


--
-- TOC entry 5147 (class 0 OID 33163)
-- Dependencies: 252
-- Data for Name: sales; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sales (id_venta, numero_documento, tipo_documento, fecha_emision, id_cliente, id_empleado_vendedor, subtotal, descuento, impuestos, total, metodo_pago, estado, notas, venta_relacionada, id_usuario_registro, tipo_iva, porcentaje_iva, porcentaje_retencion) FROM stdin;
12	VENTA-1746691398353	ticket	2025-05-08 10:03:18.485982	\N	\N	13.60	0.00	2.86	16.46	efectivo	pagado	\N	\N	\N	general	21.00	0.00
13	VENTA-1746691852317	ticket	2025-05-08 10:10:52.39648	\N	\N	91.80	0.00	19.28	111.08	efectivo	pagado	\N	\N	\N	general	21.00	0.00
14	VENTA-1746692351736	ticket	2025-05-08 10:19:11.814471	\N	\N	4.50	0.00	0.95	5.45	efectivo	pagado	\N	\N	\N	general	21.00	0.00
15	VENTA-1746692915386	ticket	2025-05-08 10:28:35.50232	\N	\N	37.50	0.00	7.88	45.38	efectivo	pagado	\N	\N	\N	general	21.00	0.00
16	VENTA-1746693124909	ticket	2025-05-08 10:32:04.999815	\N	\N	12.90	0.00	2.71	15.61	efectivo	pagado	\N	\N	\N	general	21.00	0.00
17	VENTA-1746693900813	ticket	2025-05-08 10:45:00.898477	\N	\N	13.60	0.00	2.86	16.46	efectivo	pagado	\N	\N	\N	general	21.00	0.00
18	VENTA-1746694132080	ticket	2025-05-08 10:48:52.167985	\N	\N	91.80	0.00	19.28	111.08	efectivo	pagado	\N	\N	\N	general	21.00	0.00
19	VENTA-1746695838411	ticket	2025-05-08 11:17:18.497961	\N	\N	9.00	0.00	1.89	10.89	efectivo	pagado	\N	\N	\N	general	21.00	0.00
20	VENTA-1746696329106	ticket	2025-05-08 11:25:29.207471	\N	\N	37.50	0.00	7.88	45.38	efectivo	pagado	\N	\N	\N	general	21.00	0.00
21	VENTA-1746697020956	ticket	2025-05-08 11:37:01.045945	\N	\N	25.80	0.00	5.42	31.22	efectivo	pagado	\N	\N	\N	general	21.00	0.00
22	VENTA-1746697172348	ticket	2025-05-08 11:39:32.563521	\N	\N	27.20	0.00	5.71	32.91	efectivo	pagado	\N	\N	\N	general	21.00	0.00
23	VENTA-1746697455886	ticket	2025-05-08 11:44:16.009715	\N	\N	56.25	0.00	11.81	68.06	efectivo	pagado	\N	\N	\N	general	21.00	0.00
24	VENTA-1746813142211	ticket	2025-05-09 19:52:22.516457	\N	\N	91.80	0.00	19.28	111.08	efectivo	pagado	\N	\N	\N	general	21.00	0.00
25	VENTA-1747214840123	ticket	2025-05-14 11:27:20.583189	\N	\N	240.00	0.00	50.40	290.40	efectivo	pagado	\N	\N	\N	general	21.00	0.00
26	VENTA-1747227477426	ticket	2025-05-14 14:57:57.757919	\N	\N	3.60	0.00	0.76	4.36	efectivo	pagado	\N	\N	\N	general	21.00	0.00
27	VENTA-1747404833572	ticket	2025-05-16 16:13:53.779693	\N	\N	91.77	0.00	19.27	111.04	efectivo	pagado	\N	\N	\N	general	21.00	0.00
28	VENTA-1749709031994	ticket	2025-06-12 08:17:12.333494	\N	\N	100.41	0.00	21.09	121.50	efectivo	pagado	\N	\N	\N	general	21.00	0.00
29	VENTA-1751177760917	ticket	2025-06-29 08:16:01.134318	\N	\N	73.14	0.00	15.36	88.50	efectivo	pagado	\N	\N	\N	general	21.00	0.00
30	VENTA-1751177863104	ticket	2025-06-29 08:17:43.228698	\N	\N	47.68	0.00	10.01	57.69	efectivo	pagado	\N	\N	\N	general	21.00	0.00
\.


--
-- TOC entry 5143 (class 0 OID 33130)
-- Dependencies: 248
-- Data for Name: service_levels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.service_levels (id_nivel, id_servicio, nombre_nivel, descripcion, precio, tiempo_estimado_minutos) FROM stdin;
1	3	Básico	Web estática 5 páginas	500.00	600
2	3	Premium	Web dinámica con CMS	1200.00	1200
3	4	Estándar	Instalación básica	50.00	60
4	4	Premium	Instalación + capacitación	150.00	180
6	6	kasdjfhasdf	dsFsdSDFsdfaSDFASDFASDF	20.00	10
7	6	ssksasdjfgasdfsssss	sdfadsf	40.00	15
\.


--
-- TOC entry 5141 (class 0 OID 33117)
-- Dependencies: 246
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.services (id_servicio, nombre_servicio, descripcion, precio_base, tipo_tarifa, duracion_estimada_minutos, categoria, requiere_profesional, activo, fecha_creacion) FROM stdin;
3	Corte de pelo	Corte básico unisex	15.00	fijo	30	Belleza	t	t	2025-05-08
4	Consultoría IT	Asesoramiento tecnológico	75.00	por_hora	60	Tecnología	t	t	2025-05-08
5	Diseño Web	Desarrollo web a medida	500.00	variable	600	Tecnología	t	t	2025-05-08
8	Mano de Obra	\N	10.00	mano_obra	\N	\N	t	t	2025-05-14
6	Instalación Software	Instalación y configuración	10.00	por_nivel	120	Tecnología	t	t	2025-05-08
9	Limpieza de vestuarios	limpieza y desinfección de vestuarios	30.00	fijo	20	Limpieza	t	t	2025-05-14
\.


--
-- TOC entry 5115 (class 0 OID 16403)
-- Dependencies: 220
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settings (id_ajuste, nombre_local, direccion, telefono, url_backend, horario_apertura, horario_cierre, logo_local, tema) FROM stdin;
1	AGP	Calle Falsa 123	123456789	https://jennet-choice-quietly.ngrok-free.app	08:00:00	23:00:00	https://jennet-choice-quietly.ngrok-free.app/api/media/8889ba6d-afbe-4d98-96be-4891aec84635.png	oscuro
\.


--
-- TOC entry 5137 (class 0 OID 32862)
-- Dependencies: 242
-- Data for Name: shift_intervals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shift_intervals (id_intervalo, id_horario, dia_semana, hora_entrada, hora_salida) FROM stdin;
1	17	1	09:00:00	17:00:00
4	18	1	09:00:00	17:00:00
10	17	2	16:00:00	20:00:00
12	18	2	09:00:00	13:00:00
13	18	2	15:00:00	19:00:00
15	17	3	09:00:00	23:00:00
17	17	4	09:00:00	23:00:00
19	17	5	09:00:00	23:00:00
21	19	1	09:00:00	17:00:00
23	19	2	16:00:00	20:00:00
25	19	3	09:00:00	23:00:00
27	19	4	09:00:00	23:00:00
29	19	5	09:00:00	23:00:00
31	20	1	09:00:00	17:00:00
33	20	2	09:00:00	13:00:00
34	20	2	15:00:00	19:00:00
36	21	1	09:00:00	17:00:00
38	21	2	16:00:00	20:00:00
40	21	3	09:00:00	23:00:00
42	21	4	09:00:00	23:00:00
44	21	5	09:00:00	23:00:00
46	22	1	09:00:00	17:00:00
48	22	2	09:00:00	13:00:00
49	22	2	15:00:00	19:00:00
66	23	1	09:00:00	17:00:00
68	23	2	16:00:00	20:00:00
70	23	3	09:00:00	23:00:00
72	23	4	09:00:00	23:00:00
74	23	5	09:00:00	23:00:00
76	24	1	09:00:00	17:00:00
78	24	2	09:00:00	13:00:00
79	24	2	15:00:00	19:00:00
80	25	1	09:00:00	17:00:00
81	25	2	16:00:00	20:00:00
82	25	3	09:00:00	23:00:00
83	25	4	09:00:00	23:00:00
85	26	1	09:00:00	17:00:00
86	26	2	09:00:00	13:00:00
87	26	2	15:00:00	19:00:00
89	26	3	11:00:00	18:00:00
90	27	1	09:00:00	17:00:00
91	27	2	16:00:00	20:00:00
92	27	3	09:00:00	23:00:00
93	27	4	09:00:00	23:00:00
94	27	5	09:00:00	23:00:00
95	28	1	09:00:00	17:00:00
96	28	2	09:00:00	13:00:00
97	28	2	15:00:00	19:00:00
98	28	3	11:00:00	18:00:00
104	29	4	10:00:00	12:00:00
114	32	1	09:00:00	17:00:00
115	32	2	16:00:00	20:00:00
116	32	3	09:00:00	23:00:00
117	32	4	09:00:00	23:00:00
118	32	5	09:00:00	23:00:00
119	33	1	09:00:00	17:00:00
120	33	2	09:00:00	13:00:00
121	33	2	15:00:00	19:00:00
122	33	3	11:00:00	18:00:00
\.


--
-- TOC entry 5119 (class 0 OID 16428)
-- Dependencies: 224
-- Data for Name: shifts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shifts (id_horario, id_empleado, fecha_inicio_semana) FROM stdin;
2	2	2024-03-11
10	2	2025-04-13
14	2	2025-04-20
17	6	2025-04-27
5	2	2025-03-31
18	7	2025-04-27
19	6	2025-05-04
20	7	2025-05-04
21	6	2025-05-11
22	7	2025-05-11
23	6	2025-05-18
24	7	2025-05-18
25	6	2025-05-25
26	7	2025-05-25
27	6	2025-06-01
28	7	2025-06-01
29	7	2025-08-31
32	6	2025-06-08
33	7	2025-06-08
7	2	2025-04-06
\.


--
-- TOC entry 5123 (class 0 OID 16454)
-- Dependencies: 228
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.suppliers (id_proveedor, nombre_proveedor, contacto, telefono, email, plantilla_email, direccion_fiscal, cif, condiciones_pago, dias_credito, cuenta_bancaria, moneda, sitio_web, fecha_registro, activo) FROM stdin;
2	Electrónica Global	Lic. Fernanda Torres	5559876543	compras@electronicaglobal.mx	Buen día {nombre}, su pedido está listo...	Blvd. Innovación 456, Gijon, Asturias	EGL880202XYZ	Contado	\N	987654321098765432	USD	www.electronicaglobal.com	2023-03-20	t
3	Papelería Creativa	Sra. Margarita López	5551122334	atencion@papeleriacreativa.com		Calle Papel 789, Madrid, CA Madrid	PCR770303MNL	15 días crédito	15	654321098765432109	EUR		2025-04-13	f
1	Suministros Industriales SA	Ing. Carlos Méndez	5551234567	ventas@suministrosindustriales.com	Estimado {nombre}, adjunto su cotización...	Av. Tecnológico 123, Lugo de Llanera, Asturias	SIS990101ABC	30 días crédito	30	012345678901234567	EUR	www.suministrosindustriales.com	2023-01-15	t
4	Electrónica Ibérica SL	Juan Martínez	+34911234567	ventas@electronicaiberica.es	Esto es un test\nProductos: {ITEMS}\nFecha: {FECHA_PEDIDO}\nTotal: {TOTAL}\nProveedor: {PROVEEDOR}\nNumero pedido: {NUMERO_PEDIDO}\nFecha entrega: {FECHA_ENTREGA}\nMetodo Pago: {METODO_PAGO}\nComentarios: {COMENTARIOS}\nNombres {NOMBRE_EMPRESA} {PROVEEDOR}\n{ESTADO}	Calle Tecnología 45, Madrid	A12345678		\N		EUR		2025-04-13	t
5	Materiales Construcción Norte	María López	+34944778899	pedidos@mcnorte.es		Polígono Industrial Norte, Zaragoza	B87654321	Transferencia	5	12323726354736491283	EUR	sitiowebcn.com	2025-04-13	t
6	Suministros Informáticos SA	Carlos García	+34935556677	info@suministrosinformaticos.com		Avenida Digital 22, Barcelona	C11223344		\N		EUR	unawebtest.com	2025-04-13	t
\.


--
-- TOC entry 5113 (class 0 OID 16390)
-- Dependencies: 218
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id_usuario, nombre, email, contrasena, rol, fecha_registro) FROM stdin;
1	Juan Pérez	juan@example.com	hashed_password	admin	2024-01-10
2	María García	maria@example.com	hashed_password	empleado	2024-02-15
3	Carlos López	carlos@example.com	hashed_password	empleado	2024-03-05
4	admin	admin	$2b$10$E24V4LQwcxfJ28tYntsi8OE79hry6kHYQu8JobNwUX/XA1K13C5wm	admin	2025-03-19
\.


--
-- TOC entry 5183 (class 0 OID 0)
-- Dependencies: 219
-- Name: ajustes_id_ajuste_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ajustes_id_ajuste_seq', 1, true);


--
-- TOC entry 5184 (class 0 OID 0)
-- Dependencies: 259
-- Name: appointments_id_cita_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.appointments_id_cita_seq', 15, true);


--
-- TOC entry 5185 (class 0 OID 0)
-- Dependencies: 225
-- Name: bajas_id_baja_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bajas_id_baja_seq', 8, true);


--
-- TOC entry 5186 (class 0 OID 0)
-- Dependencies: 243
-- Name: clients_id_cliente_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.clients_id_cliente_seq', 5, true);


--
-- TOC entry 5187 (class 0 OID 0)
-- Dependencies: 221
-- Name: empleados_id_empleado_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.empleados_id_empleado_seq', 7, true);


--
-- TOC entry 5188 (class 0 OID 0)
-- Dependencies: 249
-- Name: employee_services_id_empleado_servicio_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employee_services_id_empleado_servicio_seq', 4, true);


--
-- TOC entry 5189 (class 0 OID 0)
-- Dependencies: 231
-- Name: gastos_id_gasto_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.gastos_id_gasto_seq', 198, true);


--
-- TOC entry 5190 (class 0 OID 0)
-- Dependencies: 223
-- Name: horarios_id_horario_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.horarios_id_horario_seq', 33, true);


--
-- TOC entry 5191 (class 0 OID 0)
-- Dependencies: 233
-- Name: ingresos_id_ingreso_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ingresos_id_ingreso_seq', 4702, true);


--
-- TOC entry 5192 (class 0 OID 0)
-- Dependencies: 229
-- Name: inventarios_id_producto_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inventarios_id_producto_seq', 7, true);


--
-- TOC entry 5193 (class 0 OID 0)
-- Dependencies: 239
-- Name: order_detail_id_detalle_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_detail_id_detalle_seq', 11, true);


--
-- TOC entry 5194 (class 0 OID 0)
-- Dependencies: 237
-- Name: orders_id_pedido_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_id_pedido_seq', 9, true);


--
-- TOC entry 5195 (class 0 OID 0)
-- Dependencies: 257
-- Name: product_codes_id_codigo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_codes_id_codigo_seq', 2, true);


--
-- TOC entry 5196 (class 0 OID 0)
-- Dependencies: 227
-- Name: proveedores_id_proveedor_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.proveedores_id_proveedor_seq', 6, true);


--
-- TOC entry 5197 (class 0 OID 0)
-- Dependencies: 235
-- Name: recordatorios_id_recordatorio_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recordatorios_id_recordatorio_seq', 5, true);


--
-- TOC entry 5198 (class 0 OID 0)
-- Dependencies: 253
-- Name: sale_products_id_detalle_producto_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sale_products_id_detalle_producto_seq', 22, true);


--
-- TOC entry 5199 (class 0 OID 0)
-- Dependencies: 255
-- Name: sale_services_id_detalle_servicio_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sale_services_id_detalle_servicio_seq', 7, true);


--
-- TOC entry 5200 (class 0 OID 0)
-- Dependencies: 251
-- Name: sales_id_venta_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sales_id_venta_seq', 30, true);


--
-- TOC entry 5201 (class 0 OID 0)
-- Dependencies: 247
-- Name: service_levels_id_nivel_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.service_levels_id_nivel_seq', 7, true);


--
-- TOC entry 5202 (class 0 OID 0)
-- Dependencies: 245
-- Name: services_id_servicio_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.services_id_servicio_seq', 10, true);


--
-- TOC entry 5203 (class 0 OID 0)
-- Dependencies: 241
-- Name: shift_intervals_id_intervalo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.shift_intervals_id_intervalo_seq', 122, true);


--
-- TOC entry 5204 (class 0 OID 0)
-- Dependencies: 217
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_usuario_seq', 4, true);


--
-- TOC entry 4883 (class 2606 OID 16412)
-- Name: settings ajustes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT ajustes_pkey PRIMARY KEY (id_ajuste);


--
-- TOC entry 4941 (class 2606 OID 33278)
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id_cita);


--
-- TOC entry 4895 (class 2606 OID 16447)
-- Name: leaves bajas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leaves
    ADD CONSTRAINT bajas_pkey PRIMARY KEY (id_baja);


--
-- TOC entry 4917 (class 2606 OID 33115)
-- Name: clients clients_documento_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_documento_key UNIQUE (documento);


--
-- TOC entry 4919 (class 2606 OID 33113)
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id_cliente);


--
-- TOC entry 4885 (class 2606 OID 16424)
-- Name: employees empleados_dni_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT empleados_dni_key UNIQUE (dni);


--
-- TOC entry 4887 (class 2606 OID 16426)
-- Name: employees empleados_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT empleados_email_key UNIQUE (email);


--
-- TOC entry 4889 (class 2606 OID 16422)
-- Name: employees empleados_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT empleados_pkey PRIMARY KEY (id_empleado);


--
-- TOC entry 4925 (class 2606 OID 33151)
-- Name: employee_services employee_services_id_empleado_id_servicio_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_services
    ADD CONSTRAINT employee_services_id_empleado_id_servicio_key UNIQUE (id_empleado, id_servicio);


--
-- TOC entry 4927 (class 2606 OID 33149)
-- Name: employee_services employee_services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_services
    ADD CONSTRAINT employee_services_pkey PRIMARY KEY (id_empleado_servicio);


--
-- TOC entry 4891 (class 2606 OID 24677)
-- Name: employees employees_nss_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_nss_key UNIQUE (nss);


--
-- TOC entry 4903 (class 2606 OID 16489)
-- Name: expenses gastos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT gastos_pkey PRIMARY KEY (id_gasto);


--
-- TOC entry 4893 (class 2606 OID 16433)
-- Name: shifts horarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT horarios_pkey PRIMARY KEY (id_horario);


--
-- TOC entry 4905 (class 2606 OID 16499)
-- Name: income ingresos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.income
    ADD CONSTRAINT ingresos_pkey PRIMARY KEY (id_ingreso);


--
-- TOC entry 4899 (class 2606 OID 16473)
-- Name: inventory inventarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventarios_pkey PRIMARY KEY (id_producto);


--
-- TOC entry 4901 (class 2606 OID 41100)
-- Name: inventory inventory_referencia_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_referencia_key UNIQUE (referencia);


--
-- TOC entry 4911 (class 2606 OID 24617)
-- Name: order_detail order_detail_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_detail
    ADD CONSTRAINT order_detail_pkey PRIMARY KEY (id_detalle);


--
-- TOC entry 4909 (class 2606 OID 24599)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id_pedido);


--
-- TOC entry 4937 (class 2606 OID 33261)
-- Name: product_codes product_codes_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_codes
    ADD CONSTRAINT product_codes_codigo_key UNIQUE (codigo);


--
-- TOC entry 4939 (class 2606 OID 33259)
-- Name: product_codes product_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_codes
    ADD CONSTRAINT product_codes_pkey PRIMARY KEY (id_codigo);


--
-- TOC entry 4897 (class 2606 OID 16461)
-- Name: suppliers proveedores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT proveedores_pkey PRIMARY KEY (id_proveedor);


--
-- TOC entry 4907 (class 2606 OID 16515)
-- Name: alerts recordatorios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT recordatorios_pkey PRIMARY KEY (id_recordatorio);


--
-- TOC entry 4933 (class 2606 OID 33206)
-- Name: sale_products sale_products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale_products
    ADD CONSTRAINT sale_products_pkey PRIMARY KEY (id_detalle_producto);


--
-- TOC entry 4935 (class 2606 OID 33230)
-- Name: sale_services sale_services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale_services
    ADD CONSTRAINT sale_services_pkey PRIMARY KEY (id_detalle_servicio);


--
-- TOC entry 4929 (class 2606 OID 33177)
-- Name: sales sales_numero_documento_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_numero_documento_key UNIQUE (numero_documento);


--
-- TOC entry 4931 (class 2606 OID 33175)
-- Name: sales sales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_pkey PRIMARY KEY (id_venta);


--
-- TOC entry 4923 (class 2606 OID 33137)
-- Name: service_levels service_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_levels
    ADD CONSTRAINT service_levels_pkey PRIMARY KEY (id_nivel);


--
-- TOC entry 4921 (class 2606 OID 33128)
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id_servicio);


--
-- TOC entry 4913 (class 2606 OID 32868)
-- Name: shift_intervals shift_intervals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_intervals
    ADD CONSTRAINT shift_intervals_pkey PRIMARY KEY (id_intervalo);


--
-- TOC entry 4915 (class 2606 OID 32870)
-- Name: shift_intervals unique_shift_interval; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_intervals
    ADD CONSTRAINT unique_shift_interval UNIQUE (id_horario, dia_semana, hora_entrada);


--
-- TOC entry 4879 (class 2606 OID 16401)
-- Name: users usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- TOC entry 4881 (class 2606 OID 16399)
-- Name: users usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id_usuario);


--
-- TOC entry 4964 (class 2606 OID 33279)
-- Name: appointments appointments_id_cliente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_id_cliente_fkey FOREIGN KEY (id_cliente) REFERENCES public.clients(id_cliente);


--
-- TOC entry 4965 (class 2606 OID 33284)
-- Name: appointments appointments_id_empleado_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_id_empleado_fkey FOREIGN KEY (id_empleado) REFERENCES public.employees(id_empleado);


--
-- TOC entry 4966 (class 2606 OID 33289)
-- Name: appointments appointments_id_servicio_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_id_servicio_fkey FOREIGN KEY (id_servicio) REFERENCES public.services(id_servicio);


--
-- TOC entry 4943 (class 2606 OID 16448)
-- Name: leaves bajas_id_empleado_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leaves
    ADD CONSTRAINT bajas_id_empleado_fkey FOREIGN KEY (id_empleado) REFERENCES public.employees(id_empleado) ON DELETE CASCADE;


--
-- TOC entry 4951 (class 2606 OID 33152)
-- Name: employee_services employee_services_id_empleado_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_services
    ADD CONSTRAINT employee_services_id_empleado_fkey FOREIGN KEY (id_empleado) REFERENCES public.employees(id_empleado) ON DELETE CASCADE;


--
-- TOC entry 4952 (class 2606 OID 33157)
-- Name: employee_services employee_services_id_servicio_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_services
    ADD CONSTRAINT employee_services_id_servicio_fkey FOREIGN KEY (id_servicio) REFERENCES public.services(id_servicio) ON DELETE CASCADE;


--
-- TOC entry 4945 (class 2606 OID 24605)
-- Name: orders fk_gasto; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT fk_gasto FOREIGN KEY (id_gasto) REFERENCES public.expenses(id_gasto);


--
-- TOC entry 4947 (class 2606 OID 24618)
-- Name: order_detail fk_pedido; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_detail
    ADD CONSTRAINT fk_pedido FOREIGN KEY (id_pedido) REFERENCES public.orders(id_pedido);


--
-- TOC entry 4948 (class 2606 OID 24623)
-- Name: order_detail fk_producto; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_detail
    ADD CONSTRAINT fk_producto FOREIGN KEY (id_producto) REFERENCES public.inventory(id_producto);


--
-- TOC entry 4946 (class 2606 OID 24600)
-- Name: orders fk_proveedor; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT fk_proveedor FOREIGN KEY (id_proveedor) REFERENCES public.suppliers(id_proveedor);


--
-- TOC entry 4942 (class 2606 OID 16434)
-- Name: shifts horarios_id_empleado_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT horarios_id_empleado_fkey FOREIGN KEY (id_empleado) REFERENCES public.employees(id_empleado) ON DELETE CASCADE;


--
-- TOC entry 4944 (class 2606 OID 16474)
-- Name: inventory inventarios_id_proveedor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventarios_id_proveedor_fkey FOREIGN KEY (id_proveedor) REFERENCES public.suppliers(id_proveedor) ON DELETE SET NULL;


--
-- TOC entry 4963 (class 2606 OID 33262)
-- Name: product_codes product_codes_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_codes
    ADD CONSTRAINT product_codes_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.inventory(id_producto) ON DELETE CASCADE;


--
-- TOC entry 4957 (class 2606 OID 33212)
-- Name: sale_products sale_products_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale_products
    ADD CONSTRAINT sale_products_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.inventory(id_producto);


--
-- TOC entry 4958 (class 2606 OID 33207)
-- Name: sale_products sale_products_id_venta_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale_products
    ADD CONSTRAINT sale_products_id_venta_fkey FOREIGN KEY (id_venta) REFERENCES public.sales(id_venta) ON DELETE CASCADE;


--
-- TOC entry 4959 (class 2606 OID 33241)
-- Name: sale_services sale_services_id_empleado_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale_services
    ADD CONSTRAINT sale_services_id_empleado_fkey FOREIGN KEY (id_empleado) REFERENCES public.employees(id_empleado);


--
-- TOC entry 4960 (class 2606 OID 33246)
-- Name: sale_services sale_services_id_nivel_servicio_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale_services
    ADD CONSTRAINT sale_services_id_nivel_servicio_fkey FOREIGN KEY (id_nivel_servicio) REFERENCES public.service_levels(id_nivel);


--
-- TOC entry 4961 (class 2606 OID 33236)
-- Name: sale_services sale_services_id_servicio_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale_services
    ADD CONSTRAINT sale_services_id_servicio_fkey FOREIGN KEY (id_servicio) REFERENCES public.services(id_servicio);


--
-- TOC entry 4962 (class 2606 OID 33231)
-- Name: sale_services sale_services_id_venta_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale_services
    ADD CONSTRAINT sale_services_id_venta_fkey FOREIGN KEY (id_venta) REFERENCES public.sales(id_venta) ON DELETE CASCADE;


--
-- TOC entry 4953 (class 2606 OID 33178)
-- Name: sales sales_id_cliente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_id_cliente_fkey FOREIGN KEY (id_cliente) REFERENCES public.clients(id_cliente);


--
-- TOC entry 4954 (class 2606 OID 33183)
-- Name: sales sales_id_empleado_vendedor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_id_empleado_vendedor_fkey FOREIGN KEY (id_empleado_vendedor) REFERENCES public.employees(id_empleado);


--
-- TOC entry 4955 (class 2606 OID 33193)
-- Name: sales sales_id_usuario_registro_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_id_usuario_registro_fkey FOREIGN KEY (id_usuario_registro) REFERENCES public.users(id_usuario);


--
-- TOC entry 4956 (class 2606 OID 33188)
-- Name: sales sales_venta_relacionada_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_venta_relacionada_fkey FOREIGN KEY (venta_relacionada) REFERENCES public.sales(id_venta);


--
-- TOC entry 4950 (class 2606 OID 33138)
-- Name: service_levels service_levels_id_servicio_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_levels
    ADD CONSTRAINT service_levels_id_servicio_fkey FOREIGN KEY (id_servicio) REFERENCES public.services(id_servicio) ON DELETE CASCADE;


--
-- TOC entry 4949 (class 2606 OID 32871)
-- Name: shift_intervals shift_intervals_id_horario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_intervals
    ADD CONSTRAINT shift_intervals_id_horario_fkey FOREIGN KEY (id_horario) REFERENCES public.shifts(id_horario) ON DELETE CASCADE;


-- Completed on 2025-08-08 13:38:55

--
-- PostgreSQL database dump complete
--

