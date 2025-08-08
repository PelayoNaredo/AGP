import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getUserAndCompanyId } from "../_shared/auth-utils.ts";

// Configuración de Supabase
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
};

// Función para validar datos de venta
function validateSaleData(data: any, isUpdate = false): string[] {
  const errors: string[] = [];

  // Campos obligatorios en creación
  if (!isUpdate) {
    if (!data.numero_documento) {
      errors.push("numero_documento es obligatorio");
    }

    if (!data.tipo_documento) {
      errors.push("tipo_documento es obligatorio");
    }

    if (data.subtotal === undefined || data.subtotal === null) {
      errors.push("subtotal es obligatorio");
    }

    if (data.total === undefined || data.total === null) {
      errors.push("total es obligatorio");
    }
  }

  // Validación de tipo de documento
  const tiposDocumento = [
    "factura",
    "presupuesto",
    "ticket",
    "nota_credito",
    "nota_debito",
  ];
  if (data.tipo_documento && !tiposDocumento.includes(data.tipo_documento)) {
    errors.push(`tipo_documento debe ser uno de: ${tiposDocumento.join(", ")}`);
  }

  // Validación de valores numéricos
  if (
    data.subtotal !== undefined &&
    (isNaN(parseFloat(data.subtotal)) || parseFloat(data.subtotal) < 0)
  ) {
    errors.push("subtotal debe ser un número positivo");
  }

  if (
    data.total !== undefined &&
    (isNaN(parseFloat(data.total)) || parseFloat(data.total) < 0)
  ) {
    errors.push("total debe ser un número positivo");
  }

  // Validación de estado
  const estadosValidos = [
    "pagado",
    "pendiente",
    "parcial",
    "cancelado",
    "devuelto",
  ];
  if (data.estado && !estadosValidos.includes(data.estado)) {
    errors.push(`estado debe ser uno de: ${estadosValidos.join(", ")}`);
  }

  // Validación de método de pago
  const metodosPago = [
    "efectivo",
    "tarjeta",
    "transferencia",
    "cheque",
    "credito",
    "mixto",
  ];
  if (data.metodo_pago && !metodosPago.includes(data.metodo_pago)) {
    errors.push(`metodo_pago debe ser uno de: ${metodosPago.join(", ")}`);
  }

  return errors;
}

async function handleSecureRoute(req: Request) {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split("/").filter(Boolean);
  const method = req.method;

  // Autenticación y autorización
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return createCorsErrorResponse("Token de autorización requerido", 401);
  }

  const { companyId, error: authError } = await getUserAndCompanyId(
    authHeader.replace("Bearer ", "")
  );
  if (authError || !companyId) {
    return new Response(
      JSON.stringify({
        error: authError || "Company ID no encontrado en el token",
      }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // GET /sales - Obtener todas las ventas (con filtros opcionales)
  if (method === "GET" && pathSegments.length === 1) {
    try {
      // Obtener parámetros de filtro de la URL
      const filters: any = {};
      const estado = url.searchParams.get("estado");
      const tipo_documento = url.searchParams.get("tipo_documento");
      const metodo_pago = url.searchParams.get("metodo_pago");
      const fecha_desde = url.searchParams.get("fecha_desde");
      const fecha_hasta = url.searchParams.get("fecha_hasta");
      const id_cliente = url.searchParams.get("id_cliente");

      if (estado) filters.estado = estado;
      if (tipo_documento) filters.tipo_documento = tipo_documento;
      if (metodo_pago) filters.metodo_pago = metodo_pago;
      if (fecha_desde) filters.fecha_desde = fecha_desde;
      if (fecha_hasta) filters.fecha_hasta = fecha_hasta;
      if (id_cliente) filters.id_cliente = parseInt(id_cliente);

      let query = supabaseAdmin
        .from("sales")
        .select(
          `
            *,
            clients(
              id_cliente,
              nombre,
              apellido,
              tipo_cliente,
              tipo_documento,
              documento,
              razon_social
            ),
            employees!inner(
              id_empleado,
              nombre,
              company_id
            )
          `
        )
        .eq("employees.company_id", companyId)
        .is("fecha_eliminacion", null)
        .order("fecha_emision", { ascending: false });

      // Aplicar filtros
      if (filters.estado) {
        query = query.eq("estado", filters.estado);
      }

      if (filters.tipo_documento) {
        query = query.eq("tipo_documento", filters.tipo_documento);
      }

      if (filters.metodo_pago) {
        query = query.eq("metodo_pago", filters.metodo_pago);
      }

      if (filters.fecha_desde && filters.fecha_hasta) {
        query = query
          .gte("fecha_emision", filters.fecha_desde)
          .lte("fecha_emision", filters.fecha_hasta);
      }

      if (filters.id_cliente) {
        query = query.eq("id_cliente", filters.id_cliente);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error al obtener ventas:", error);
        throw error;
      }

      return createCorsJsonResponse(data, 200);
    } catch (error) {
      console.error("Error en getAllSales:", error);
      return new Response(
        JSON.stringify({
          error: "Error al obtener ventas",
          details: error.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  // GET /sales/stats - Obtener estadísticas de ventas
  if (
    method === "GET" &&
    pathSegments.length === 2 &&
    pathSegments[1] === "stats"
  ) {
    try {
      const period = url.searchParams.get("period") || "month";
      const validPeriods = ["day", "week", "month", "year"];

      if (!validPeriods.includes(period)) {
        return new Response(
          JSON.stringify({
            error: "Período inválido. Debe ser: day, week, month o year",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Calcular fecha de inicio según el período
      const ahora = new Date();
      let fechaInicio: Date;

      switch (period) {
        case "day":
          fechaInicio = new Date(
            ahora.getFullYear(),
            ahora.getMonth(),
            ahora.getDate()
          );
          break;
        case "week":
          fechaInicio = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
          break;
        case "year":
          fechaInicio = new Date(ahora.getFullYear(), 0, 1);
          break;
        default:
          fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      }

      // Obtener datos de ventas del período
      const { data: salesData, error: salesError } = await supabaseAdmin
        .from("sales")
        .select(
          `
            total,
            estado,
            tipo_documento,
            metodo_pago,
            employees!inner(company_id)
          `
        )
        .eq("employees.company_id", companyId)
        .gte("fecha_emision", fechaInicio.toISOString())
        .is("fecha_eliminacion", null);

      if (salesError) {
        console.error("Error al obtener estadísticas:", salesError);
        throw salesError;
      }

      // Procesar estadísticas
      const stats = {
        general: {
          total_ventas: salesData.length,
          ingresos_totales: salesData.reduce(
            (sum, sale) => sum + parseFloat(sale.total || 0),
            0
          ),
          promedio_venta: 0,
          venta_minima: 0,
          venta_maxima: 0,
        },
        por_tipo: {},
        por_estado: {},
        por_metodo_pago: {},
      };

      if (salesData.length > 0) {
        const totales = salesData.map((sale) => parseFloat(sale.total || 0));
        stats.general.promedio_venta =
          stats.general.ingresos_totales / salesData.length;
        stats.general.venta_minima = Math.min(...totales);
        stats.general.venta_maxima = Math.max(...totales);

        // Agrupar estadísticas
        salesData.forEach((sale) => {
          // Por tipo
          if (!stats.por_tipo[sale.tipo_documento]) {
            stats.por_tipo[sale.tipo_documento] = { cantidad: 0, total: 0 };
          }
          stats.por_tipo[sale.tipo_documento].cantidad++;
          stats.por_tipo[sale.tipo_documento].total += parseFloat(
            sale.total || 0
          );

          // Por estado
          if (!stats.por_estado[sale.estado]) {
            stats.por_estado[sale.estado] = { cantidad: 0, total: 0 };
          }
          stats.por_estado[sale.estado].cantidad++;
          stats.por_estado[sale.estado].total += parseFloat(sale.total || 0);

          // Por método de pago
          if (!stats.por_metodo_pago[sale.metodo_pago]) {
            stats.por_metodo_pago[sale.metodo_pago] = {
              cantidad: 0,
              total: 0,
            };
          }
          stats.por_metodo_pago[sale.metodo_pago].cantidad++;
          stats.por_metodo_pago[sale.metodo_pago].total += parseFloat(
            sale.total || 0
          );
        });
      }

      return createCorsJsonResponse(stats, 200);
    } catch (error) {
      console.error("Error en getSalesStats:", error);
      return new Response(
        JSON.stringify({
          error: "Error al obtener estadísticas de ventas",
          details: error.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  // GET /sales/search - Buscar ventas
  if (
    method === "GET" &&
    pathSegments.length === 2 &&
    pathSegments[1] === "search"
  ) {
    try {
      const term = url.searchParams.get("term");
      const clienteId = url.searchParams.get("clienteId");
      const fechaInicio = url.searchParams.get("fechaInicio");
      const fechaFin = url.searchParams.get("fechaFin");
      const tipoDocumento = url.searchParams.get("tipoDocumento");
      const estado = url.searchParams.get("estado");
      const metodoPago = url.searchParams.get("metodoPago");

      let query = supabaseAdmin
        .from("sales")
        .select(
          `
            *,
            clients(
              id_cliente,
              nombre,
              apellido,
              tipo_cliente,
              tipo_documento,
              documento,
              razon_social
            ),
            employees!inner(
              id_empleado,
              nombre,
              company_id
            )
          `
        )
        .eq("employees.company_id", companyId)
        .is("fecha_eliminacion", null)
        .order("fecha_emision", { ascending: false });

      // Aplicar filtros de búsqueda
      if (clienteId) {
        query = query.eq("id_cliente", parseInt(clienteId));
      }

      if (fechaInicio && fechaFin) {
        query = query
          .gte("fecha_emision", fechaInicio)
          .lte("fecha_emision", fechaFin);
      }

      if (tipoDocumento) {
        query = query.eq("tipo_documento", tipoDocumento);
      }

      if (estado) {
        query = query.eq("estado", estado);
      }

      if (metodoPago) {
        query = query.eq("metodo_pago", metodoPago);
      }

      // Para búsqueda por término, necesitaríamos una consulta más compleja
      // Por simplicidad, aplicamos los otros filtros
      const { data, error } = await query;

      if (error) {
        console.error("Error al buscar ventas:", error);
        throw error;
      }

      // Si hay término de búsqueda, filtrar en el cliente
      let filteredData = data;
      if (term) {
        const searchTerm = term.toLowerCase();
        filteredData = data.filter(
          (sale) =>
            sale.numero_documento?.toLowerCase().includes(searchTerm) ||
            sale.clients?.nombre?.toLowerCase().includes(searchTerm) ||
            sale.clients?.apellido?.toLowerCase().includes(searchTerm) ||
            sale.clients?.documento?.toLowerCase().includes(searchTerm) ||
            sale.clients?.razon_social?.toLowerCase().includes(searchTerm)
        );
      }

      return createCorsJsonResponse(filteredData, 200);
    } catch (error) {
      console.error("Error en searchSales:", error);
      return new Response(
        JSON.stringify({
          error: "Error al buscar ventas",
          details: error.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  // GET /sales/{id} - Obtener una venta por ID con detalles completos
  if (
    method === "GET" &&
    pathSegments.length === 2 &&
    !["stats", "search"].includes(pathSegments[1])
  ) {
    try {
      const saleId = parseInt(pathSegments[1]);

      if (isNaN(saleId)) {
        return createCorsErrorResponse("ID inválido", 400);
      }

      // Obtener información básica de la venta
      const { data: sale, error: saleError } = await supabaseAdmin
        .from("sales")
        .select(
          `
            *,
            clients(
              id_cliente,
              nombre,
              apellido,
              tipo_cliente,
              tipo_documento,
              documento,
              direccion,
              codigo_postal,
              ciudad,
              provincia,
              pais,
              email,
              telefono,
              razon_social,
              regimen_fiscal,
              tipo_iva
            ),
            employees!inner(
              id_empleado,
              nombre,
              company_id
            )
          `
        )
        .eq("id_venta", saleId)
        .eq("employees.company_id", companyId)
        .single();

      if (saleError) {
        if (saleError.code === "PGRST116") {
          return createCorsErrorResponse("Venta no encontrada", 404);
        }
        console.error("Error al obtener venta:", saleError);
        throw saleError;
      }

      // Obtener productos de la venta
      const { data: productos } = await supabaseAdmin
        .from("sale_products")
        .select(
          `
            *,
            inventory(
              id_producto,
              nombre_producto,
              descripcion
            )
          `
        )
        .eq("id_venta", saleId);

      // Obtener servicios de la venta
      const { data: servicios } = await supabaseAdmin
        .from("sale_services")
        .select(
          `
            *,
            services(
              id_servicio,
              nombre_servicio,
              descripcion
            ),
            employees(
              id_empleado,
              nombre
            )
          `
        )
        .eq("id_venta", saleId);

      // Construir respuesta completa
      const saleWithDetails = {
        ...sale,
        productos: productos || [],
        servicios: servicios || [],
      };

      return createCorsJsonResponse(saleWithDetails, 200);
    } catch (error) {
      console.error("Error en getSaleById:", error);
      return new Response(
        JSON.stringify({
          error: "Error al obtener venta",
          details: error.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  // POST /sales - Crear una nueva venta
  if (method === "POST" && pathSegments.length === 1) {
    try {
      const saleData = await req.json();

      // Validar datos
      const validationErrors = validateSaleData(saleData);
      if (validationErrors.length > 0) {
        return new Response(
          JSON.stringify({
            error: "Datos inválidos",
            details: validationErrors,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Verificar que no existe una venta con el mismo número de documento
      const { data: existingSale } = await supabaseAdmin
        .from("sales")
        .select(
          `
            id_venta,
            employees!inner(company_id)
          `
        )
        .eq("numero_documento", saleData.numero_documento)
        .eq("employees.company_id", companyId)
        .single();

      if (existingSale) {
        return new Response(
          JSON.stringify({
            error: "Ya existe una venta con ese número de documento",
          }),
          {
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Verificar cliente si se especifica
      if (saleData.id_cliente) {
        const { data: client } = await supabaseAdmin
          .from("clients")
          .select("id_cliente")
          .eq("company_id", companyId)
          .eq("id_cliente", saleData.id_cliente)
          .single();

        if (!client) {
          return new Response(
            JSON.stringify({
              error:
                "El cliente especificado no existe o no pertenece a esta empresa",
            }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }

      // Preparar datos para inserción
      const insertData = {
        numero_documento: saleData.numero_documento,
        tipo_documento: saleData.tipo_documento,
        fecha_emision: saleData.fecha_emision || new Date().toISOString(),
        id_cliente: saleData.id_cliente || null,
        id_empleado_vendedor: saleData.id_empleado_vendedor || null,
        tipo_iva: saleData.tipo_iva || "general",
        porcentaje_iva:
          saleData.porcentaje_iva !== undefined
            ? parseFloat(saleData.porcentaje_iva)
            : 21.0,
        porcentaje_retencion:
          saleData.porcentaje_retencion !== undefined
            ? parseFloat(saleData.porcentaje_retencion)
            : 0,
        subtotal: parseFloat(saleData.subtotal),
        descuento:
          saleData.descuento !== undefined ? parseFloat(saleData.descuento) : 0,
        impuestos:
          saleData.impuestos !== undefined ? parseFloat(saleData.impuestos) : 0,
        total: parseFloat(saleData.total),
        metodo_pago: saleData.metodo_pago || "efectivo",
        estado: saleData.estado || "pagado",
        notas: saleData.notas || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: newSale, error } = await supabaseAdmin
        .from("sales")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("Error al crear venta:", error);
        if (error.code === "23505") {
          return new Response(
            JSON.stringify({
              error: "El número de documento ya está registrado",
            }),
            {
              status: 409,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        throw error;
      }

      return createCorsJsonResponse(newSale, 201);
    } catch (error) {
      console.error("Error en createSale:", error);
      return new Response(
        JSON.stringify({
          error: "Error al crear venta",
          details: error.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  // PUT /sales/{id} - Actualizar una venta
  if (method === "PUT" && pathSegments.length === 2) {
    try {
      const saleId = parseInt(pathSegments[1]);

      if (isNaN(saleId)) {
        return createCorsErrorResponse("ID inválido", 400);
      }

      const saleData = await req.json();

      // Validar datos
      const validationErrors = validateSaleData(saleData, true);
      if (validationErrors.length > 0) {
        return new Response(
          JSON.stringify({
            error: "Datos inválidos",
            details: validationErrors,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Verificar que la venta existe y pertenece a la empresa
      const { data: existingSale } = await supabaseAdmin
        .from("sales")
        .select(
          `
            *,
            employees!inner(company_id)
          `
        )
        .eq("id_venta", saleId)
        .eq("employees.company_id", companyId)
        .single();

      if (!existingSale) {
        return createCorsErrorResponse("Venta no encontrada", 404);
      }

      // Preparar datos para actualización (solo campos proporcionados)
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (saleData.numero_documento !== undefined)
        updateData.numero_documento = saleData.numero_documento;
      if (saleData.tipo_documento !== undefined)
        updateData.tipo_documento = saleData.tipo_documento;
      if (saleData.id_cliente !== undefined)
        updateData.id_cliente = saleData.id_cliente;
      if (saleData.subtotal !== undefined)
        updateData.subtotal = parseFloat(saleData.subtotal);
      if (saleData.total !== undefined)
        updateData.total = parseFloat(saleData.total);
      if (saleData.estado !== undefined) updateData.estado = saleData.estado;
      if (saleData.metodo_pago !== undefined)
        updateData.metodo_pago = saleData.metodo_pago;
      if (saleData.notas !== undefined) updateData.notas = saleData.notas;

      const { data, error } = await supabaseAdmin
        .from("sales")
        .update(updateData)
        .eq("id_venta", saleId)
        .select()
        .single();

      if (error) {
        console.error("Error al actualizar venta:", error);
        throw error;
      }

      return createCorsJsonResponse(data, 200);
    } catch (error) {
      console.error("Error en updateSale:", error);
      return new Response(
        JSON.stringify({
          error: "Error al actualizar venta",
          details: error.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  // PATCH /sales/{id}/status - Actualizar solo el estado de una venta
  if (
    method === "PATCH" &&
    pathSegments.length === 3 &&
    pathSegments[2] === "status"
  ) {
    try {
      const saleId = parseInt(pathSegments[1]);

      if (isNaN(saleId)) {
        return createCorsErrorResponse("ID inválido", 400);
      }

      const { estado } = await req.json();

      const estadosValidos = [
        "pagado",
        "pendiente",
        "parcial",
        "cancelado",
        "devuelto",
      ];
      if (!estadosValidos.includes(estado)) {
        return new Response(
          JSON.stringify({
            error: `Estado inválido. Debe ser: ${estadosValidos.join(", ")}`,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Verificar que la venta existe y pertenece a la empresa
      const { data: existingSale } = await supabaseAdmin
        .from("sales")
        .select(
          `
            id_venta,
            employees!inner(company_id)
          `
        )
        .eq("id_venta", saleId)
        .eq("employees.company_id", companyId)
        .single();

      if (!existingSale) {
        return createCorsErrorResponse("Venta no encontrada", 404);
      }

      const { data, error } = await supabaseAdmin
        .from("sales")
        .update({
          estado: estado,
          updated_at: new Date().toISOString(),
        })
        .eq("id_venta", saleId)
        .select()
        .single();

      if (error) {
        console.error("Error al actualizar estado:", error);
        throw error;
      }

      return createCorsJsonResponse(data, 200);
    } catch (error) {
      console.error("Error en updateSaleStatus:", error);
      return new Response(
        JSON.stringify({
          error: "Error al actualizar estado de venta",
          details: error.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  // DELETE /sales/{id} - Eliminar una venta (soft delete)
  if (method === "DELETE" && pathSegments.length === 2) {
    try {
      const saleId = parseInt(pathSegments[1]);

      if (isNaN(saleId)) {
        return createCorsErrorResponse("ID inválido", 400);
      }

      // Verificar que la venta existe y pertenece a la empresa
      const { data: existingSale } = await supabaseAdmin
        .from("sales")
        .select(
          `
            id_venta,
            employees!inner(company_id)
          `
        )
        .eq("id_venta", saleId)
        .eq("employees.company_id", companyId)
        .single();

      if (!existingSale) {
        return createCorsErrorResponse("Venta no encontrada", 404);
      }

      // Eliminar registros relacionados
      await supabaseAdmin.from("sale_products").delete().eq("id_venta", saleId);
      await supabaseAdmin.from("sale_services").delete().eq("id_venta", saleId);

      // Marcar como eliminada (soft delete)
      const { error } = await supabaseAdmin
        .from("sales")
        .update({
          fecha_eliminacion: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id_venta", saleId);

      if (error) {
        console.error("Error al eliminar venta:", error);
        throw error;
      }

      return new Response(
        JSON.stringify({ message: "Venta eliminada correctamente" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Error en deleteSale:", error);
      return new Response(
        JSON.stringify({
          error: "Error al eliminar venta",
          details: error.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  // Si no coincide con ninguna ruta
  return createCorsErrorResponse("Endpoint no encontrado", 404);
}

serve(withCors(async (req) => {
  // Manejar preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    return await handleSecureRoute(req);
  } catch (error: any) {
    console.error("Error en sales EdgeFunction:", error);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
