--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

-- Started on 2025-05-15 16:04:51

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

--
-- TOC entry 5163 (class 1262 OID 16388)
-- Name: pymes_db; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE pymes_db WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'es-ES';


ALTER DATABASE pymes_db OWNER TO postgres;

\connect pymes_db

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
-- TOC entry 5164 (class 0 OID 0)
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
    CONSTRAINT alerts_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['inventario'::character varying, 'mantenimiento'::character varying, 'horarios'::character varying, 'pagos'::character varying])::text[]))),
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
-- TOC entry 5165 (class 0 OID 0)
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
-- TOC entry 5166 (class 0 OID 0)
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
-- TOC entry 5167 (class 0 OID 0)
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
-- TOC entry 5168 (class 0 OID 0)
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
-- TOC entry 5169 (class 0 OID 0)
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
-- TOC entry 5170 (class 0 OID 0)
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
-- TOC entry 5171 (class 0 OID 0)
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
    id_gasto integer,
    comentarios text
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
-- TOC entry 5172 (class 0 OID 0)
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
-- TOC entry 5173 (class 0 OID 0)
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
-- TOC entry 5174 (class 0 OID 0)
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
-- TOC entry 5175 (class 0 OID 0)
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
-- TOC entry 5176 (class 0 OID 0)
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
-- TOC entry 5177 (class 0 OID 0)
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
-- TOC entry 5178 (class 0 OID 0)
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
-- TOC entry 5179 (class 0 OID 0)
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
-- TOC entry 5180 (class 0 OID 0)
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
-- TOC entry 5181 (class 0 OID 0)
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
-- TOC entry 5182 (class 0 OID 0)
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
-- TOC entry 5183 (class 0 OID 0)
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
-- TOC entry 5184 (class 0 OID 0)
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
-- TOC entry 5185 (class 0 OID 0)
-- Dependencies: 217
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_usuario_seq OWNED BY public.users.id_usuario;


--
-- TOC entry 4822 (class 2604 OID 16509)
-- Name: alerts id_recordatorio; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alerts ALTER COLUMN id_recordatorio SET DEFAULT nextval('public.recordatorios_id_recordatorio_seq'::regclass);


--
-- TOC entry 4856 (class 2604 OID 33271)
-- Name: appointments id_cita; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments ALTER COLUMN id_cita SET DEFAULT nextval('public.appointments_id_cita_seq'::regclass);


--
-- TOC entry 4829 (class 2604 OID 33106)
-- Name: clients id_cliente; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients ALTER COLUMN id_cliente SET DEFAULT nextval('public.clients_id_cliente_seq'::regclass);


--
-- TOC entry 4839 (class 2604 OID 33147)
-- Name: employee_services id_empleado_servicio; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_services ALTER COLUMN id_empleado_servicio SET DEFAULT nextval('public.employee_services_id_empleado_servicio_seq'::regclass);


--
-- TOC entry 4804 (class 2604 OID 16417)
-- Name: employees id_empleado; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees ALTER COLUMN id_empleado SET DEFAULT nextval('public.empleados_id_empleado_seq'::regclass);


--
-- TOC entry 4818 (class 2604 OID 16483)
-- Name: expenses id_gasto; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses ALTER COLUMN id_gasto SET DEFAULT nextval('public.gastos_id_gasto_seq'::regclass);


--
-- TOC entry 4820 (class 2604 OID 16494)
-- Name: income id_ingreso; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.income ALTER COLUMN id_ingreso SET DEFAULT nextval('public.ingresos_id_ingreso_seq'::regclass);


--
-- TOC entry 4815 (class 2604 OID 16466)
-- Name: inventory id_producto; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory ALTER COLUMN id_producto SET DEFAULT nextval('public.inventarios_id_producto_seq'::regclass);


--
-- TOC entry 4810 (class 2604 OID 16443)
-- Name: leaves id_baja; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leaves ALTER COLUMN id_baja SET DEFAULT nextval('public.bajas_id_baja_seq'::regclass);


--
-- TOC entry 4826 (class 2604 OID 24614)
-- Name: order_detail id_detalle; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_detail ALTER COLUMN id_detalle SET DEFAULT nextval('public.order_detail_id_detalle_seq'::regclass);


--
-- TOC entry 4824 (class 2604 OID 24594)
-- Name: orders id_pedido; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id_pedido SET DEFAULT nextval('public.orders_id_pedido_seq'::regclass);


--
-- TOC entry 4854 (class 2604 OID 33255)
-- Name: product_codes id_codigo; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_codes ALTER COLUMN id_codigo SET DEFAULT nextval('public.product_codes_id_codigo_seq'::regclass);


--
-- TOC entry 4846 (class 2604 OID 33202)
-- Name: sale_products id_detalle_producto; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale_products ALTER COLUMN id_detalle_producto SET DEFAULT nextval('public.sale_products_id_detalle_producto_seq'::regclass);


--
-- TOC entry 4849 (class 2604 OID 33221)
-- Name: sale_services id_detalle_servicio; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale_services ALTER COLUMN id_detalle_servicio SET DEFAULT nextval('public.sale_services_id_detalle_servicio_seq'::regclass);


--
-- TOC entry 4840 (class 2604 OID 33166)
-- Name: sales id_venta; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales ALTER COLUMN id_venta SET DEFAULT nextval('public.sales_id_venta_seq'::regclass);


--
-- TOC entry 4838 (class 2604 OID 33133)
-- Name: service_levels id_nivel; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_levels ALTER COLUMN id_nivel SET DEFAULT nextval('public.service_levels_id_nivel_seq'::regclass);


--
-- TOC entry 4834 (class 2604 OID 33120)
-- Name: services id_servicio; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services ALTER COLUMN id_servicio SET DEFAULT nextval('public.services_id_servicio_seq'::regclass);


--
-- TOC entry 4802 (class 2604 OID 16406)
-- Name: settings id_ajuste; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings ALTER COLUMN id_ajuste SET DEFAULT nextval('public.ajustes_id_ajuste_seq'::regclass);


--
-- TOC entry 4828 (class 2604 OID 32865)
-- Name: shift_intervals id_intervalo; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_intervals ALTER COLUMN id_intervalo SET DEFAULT nextval('public.shift_intervals_id_intervalo_seq'::regclass);


--
-- TOC entry 4809 (class 2604 OID 16431)
-- Name: shifts id_horario; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts ALTER COLUMN id_horario SET DEFAULT nextval('public.horarios_id_horario_seq'::regclass);


--
-- TOC entry 4811 (class 2604 OID 16457)
-- Name: suppliers id_proveedor; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers ALTER COLUMN id_proveedor SET DEFAULT nextval('public.proveedores_id_proveedor_seq'::regclass);


--
-- TOC entry 4800 (class 2604 OID 16393)
-- Name: users id_usuario; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id_usuario SET DEFAULT nextval('public.usuarios_id_usuario_seq'::regclass);


-- Completed on 2025-05-15 16:04:51

--
-- PostgreSQL database dump complete
--

