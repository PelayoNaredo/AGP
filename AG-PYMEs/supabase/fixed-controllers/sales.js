import { createClient } from "@supabase/supabase-js";

// Configuración de Supabase
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Cliente con SERVICE_ROLE_KEY para operaciones administrativas
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

// Función para extraer company_id del JWT
function extractCompanyId(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.company_id || null;
  } catch (error) {
    console.error("Error extracting company_id:", error);
    return null;
  }
}

// Función para validar datos de venta
function validateSaleData(data, isUpdate = false) {
  const errors = [];

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

  // Validación de número de documento
  if (
    data.numero_documento &&
    (typeof data.numero_documento !== "string" ||
      data.numero_documento.trim().length === 0)
  ) {
    errors.push("numero_documento debe ser un texto válido");
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
    data.descuento !== undefined &&
    data.descuento !== null &&
    (isNaN(parseFloat(data.descuento)) || parseFloat(data.descuento) < 0)
  ) {
    errors.push("descuento debe ser un número positivo");
  }

  if (
    data.impuestos !== undefined &&
    data.impuestos !== null &&
    (isNaN(parseFloat(data.impuestos)) || parseFloat(data.impuestos) < 0)
  ) {
    errors.push("impuestos debe ser un número positivo");
  }

  if (
    data.total !== undefined &&
    (isNaN(parseFloat(data.total)) || parseFloat(data.total) < 0)
  ) {
    errors.push("total debe ser un número positivo");
  }

  if (
    data.porcentaje_iva !== undefined &&
    data.porcentaje_iva !== null &&
    (isNaN(parseFloat(data.porcentaje_iva)) ||
      parseFloat(data.porcentaje_iva) < 0 ||
      parseFloat(data.porcentaje_iva) > 100)
  ) {
    errors.push("porcentaje_iva debe ser un número entre 0 y 100");
  }

  if (
    data.porcentaje_retencion !== undefined &&
    data.porcentaje_retencion !== null &&
    (isNaN(parseFloat(data.porcentaje_retencion)) ||
      parseFloat(data.porcentaje_retencion) < 0 ||
      parseFloat(data.porcentaje_retencion) > 100)
  ) {
    errors.push("porcentaje_retencion debe ser un número entre 0 y 100");
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

  // Validación de tipo de IVA
  const tiposIva = ["general", "reducido", "superreducido", "exento"];
  if (data.tipo_iva && !tiposIva.includes(data.tipo_iva)) {
    errors.push(`tipo_iva debe ser uno de: ${tiposIva.join(", ")}`);
  }

  // Validación de consistencia de totales
  if (
    data.subtotal !== undefined &&
    data.total !== undefined &&
    data.descuento !== undefined &&
    data.impuestos !== undefined &&
    data.porcentaje_retencion !== undefined
  ) {
    const subtotalNum = parseFloat(data.subtotal);
    const descuentoNum = parseFloat(data.descuento || 0);
    const impuestosNum = parseFloat(data.impuestos || 0);
    const retencionNum =
      (subtotalNum * parseFloat(data.porcentaje_retencion || 0)) / 100;
    const totalCalculado =
      subtotalNum - descuentoNum + impuestosNum - retencionNum;
    const totalProporcionado = parseFloat(data.total);

    const diferencia = Math.abs(totalCalculado - totalProporcionado);
    if (diferencia > 0.05) {
      // Permitir pequeña diferencia por redondeo
      errors.push(
        `El total no coincide con el cálculo: calculado ${totalCalculado.toFixed(2)}, proporcionado ${totalProporcionado.toFixed(2)}`
      );
    }
  }

  // Validación de productos
  if (data.productos && Array.isArray(data.productos)) {
    data.productos.forEach((producto, index) => {
      if (!producto.id_producto) {
        errors.push(`productos[${index}]: id_producto es obligatorio`);
      }
      if (
        !producto.cantidad ||
        isNaN(parseFloat(producto.cantidad)) ||
        parseFloat(producto.cantidad) <= 0
      ) {
        errors.push(
          `productos[${index}]: cantidad debe ser un número positivo`
        );
      }
      if (
        producto.precio_unitario === undefined ||
        isNaN(parseFloat(producto.precio_unitario)) ||
        parseFloat(producto.precio_unitario) < 0
      ) {
        errors.push(
          `productos[${index}]: precio_unitario debe ser un número positivo`
        );
      }
    });
  }

  // Validación de servicios
  if (data.servicios && Array.isArray(data.servicios)) {
    data.servicios.forEach((servicio, index) => {
      if (!servicio.id_servicio) {
        errors.push(`servicios[${index}]: id_servicio es obligatorio`);
      }
      if (
        servicio.precio === undefined ||
        isNaN(parseFloat(servicio.precio)) ||
        parseFloat(servicio.precio) < 0
      ) {
        errors.push(`servicios[${index}]: precio debe ser un número positivo`);
      }
    });
  }

  return errors;
}

// Obtener todas las ventas con información de cliente
async function getAllSales(companyId, filters = {}) {
  try {
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
      .order("fecha_emision", { ascending: false });

    // Aplicar filtros opcionales
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

    return { success: true, data };
  } catch (error) {
    console.error("Error en getAllSales:", error);
    return {
      success: false,
      error: "Error al obtener ventas",
      details: error.message,
    };
  }
}

// Obtener venta por ID con detalles completos
async function getSaleById(companyId, saleId) {
  try {
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
        return { success: false, error: "Venta no encontrada" };
      }
      console.error("Error al obtener venta:", saleError);
      throw saleError;
    }

    // Obtener productos de la venta
    const { data: productos, error: productosError } = await supabaseAdmin
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

    if (productosError) {
      console.error("Error al obtener productos de venta:", productosError);
    }

    // Obtener servicios de la venta
    const { data: servicios, error: serviciosError } = await supabaseAdmin
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
        ),
        service_levels(
          id_nivel,
          nombre_nivel
        )
      `
      )
      .eq("id_venta", saleId);

    if (serviciosError) {
      console.error("Error al obtener servicios de venta:", serviciosError);
    }

    // Construir respuesta completa
    const saleWithDetails = {
      ...sale,
      productos: productos || [],
      servicios: servicios || [],
    };

    return { success: true, data: saleWithDetails };
  } catch (error) {
    console.error("Error en getSaleById:", error);
    return {
      success: false,
      error: "Error al obtener venta",
      details: error.message,
    };
  }
}

// Crear una nueva venta con productos y servicios
async function createSale(companyId, saleData) {
  try {
    // Validar datos
    const validationErrors = validateSaleData(saleData);
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: "Datos inválidos",
        details: validationErrors,
      };
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
      return {
        success: false,
        error: "Ya existe una venta con ese número de documento",
      };
    }

    // Verificar que el cliente existe y pertenece a la empresa (si se especifica)
    if (saleData.id_cliente) {
      const { data: client } = await supabaseAdmin
        .from("clients")
        .select("id_cliente, tipo_iva")
        .eq("company_id", companyId)
        .eq("id_cliente", saleData.id_cliente)
        .single();

      if (!client) {
        return {
          success: false,
          error:
            "El cliente especificado no existe o no pertenece a esta empresa",
        };
      }
    }

    // Verificar que el empleado vendedor existe y pertenece a la empresa (si se especifica)
    if (saleData.id_empleado_vendedor) {
      const { data: employee } = await supabaseAdmin
        .from("employees")
        .select("id_empleado")
        .eq("company_id", companyId)
        .eq("id_empleado", saleData.id_empleado_vendedor)
        .single();

      if (!employee) {
        return {
          success: false,
          error:
            "El empleado vendedor especificado no existe o no pertenece a esta empresa",
        };
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
        return {
          success: false,
          error: "El número de documento ya está registrado",
        };
      }
      throw error;
    }

    const saleId = newSale.id_venta;

    // Insertar productos si existen
    if (saleData.productos && saleData.productos.length > 0) {
      const productosInsert = saleData.productos.map((producto) => ({
        id_venta: saleId,
        id_producto: parseInt(producto.id_producto),
        cantidad: parseFloat(producto.cantidad),
        precio_unitario: parseFloat(producto.precio_unitario),
        subtotal:
          parseFloat(producto.cantidad) * parseFloat(producto.precio_unitario),
        descuento: producto.descuento ? parseFloat(producto.descuento) : 0,
      }));

      const { error: productosError } = await supabaseAdmin
        .from("sale_products")
        .insert(productosInsert);

      if (productosError) {
        console.error("Error al insertar productos:", productosError);
        // Rollback: eliminar la venta creada
        await supabaseAdmin.from("sales").delete().eq("id_venta", saleId);
        throw productosError;
      }
    }

    // Insertar servicios si existen
    if (saleData.servicios && saleData.servicios.length > 0) {
      const serviciosInsert = saleData.servicios.map((servicio) => ({
        id_venta: saleId,
        id_servicio: parseInt(servicio.id_servicio),
        id_empleado: servicio.id_empleado
          ? parseInt(servicio.id_empleado)
          : null,
        id_nivel_servicio: servicio.id_nivel_servicio
          ? parseInt(servicio.id_nivel_servicio)
          : null,
        precio: parseFloat(servicio.precio),
        subtotal: parseFloat(servicio.precio),
        notas: servicio.notas || null,
      }));

      const { error: serviciosError } = await supabaseAdmin
        .from("sale_services")
        .insert(serviciosInsert);

      if (serviciosError) {
        console.error("Error al insertar servicios:", serviciosError);
        // Rollback: eliminar la venta y productos creados
        await supabaseAdmin
          .from("sale_products")
          .delete()
          .eq("id_venta", saleId);
        await supabaseAdmin.from("sales").delete().eq("id_venta", saleId);
        throw serviciosError;
      }
    }

    // Obtener la venta completa con todos sus detalles
    const completeResult = await getSaleById(companyId, saleId);
    return completeResult;
  } catch (error) {
    console.error("Error en createSale:", error);
    return {
      success: false,
      error: "Error al crear venta",
      details: error.message,
    };
  }
}

// Actualizar estado de una venta
async function updateSaleStatus(companyId, saleId, estado) {
  try {
    const estadosValidos = [
      "pagado",
      "pendiente",
      "parcial",
      "cancelado",
      "devuelto",
    ];
    if (!estadosValidos.includes(estado)) {
      return {
        success: false,
        error: `Estado inválido. Debe ser: ${estadosValidos.join(", ")}`,
      };
    }

    // Verificar que la venta existe y pertenece a la empresa
    const { data: existingSale } = await supabaseAdmin
      .from("sales")
      .select(
        `
        id_venta,
        estado,
        employees!inner(company_id)
      `
      )
      .eq("id_venta", saleId)
      .eq("employees.company_id", companyId)
      .single();

    if (!existingSale) {
      return { success: false, error: "Venta no encontrada" };
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
      console.error("Error al actualizar estado de venta:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error en updateSaleStatus:", error);
    return {
      success: false,
      error: "Error al actualizar estado de venta",
      details: error.message,
    };
  }
}

// Actualizar una venta existente
async function updateSale(companyId, saleId, saleData) {
  try {
    // Validar datos
    const validationErrors = validateSaleData(saleData, true);
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: "Datos inválidos",
        details: validationErrors,
      };
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
      return { success: false, error: "Venta no encontrada" };
    }

    // Verificar duplicado de número de documento si se cambia
    if (
      saleData.numero_documento &&
      saleData.numero_documento !== existingSale.numero_documento
    ) {
      const { data: duplicateSale } = await supabaseAdmin
        .from("sales")
        .select(
          `
          id_venta,
          employees!inner(company_id)
        `
        )
        .eq("numero_documento", saleData.numero_documento)
        .eq("employees.company_id", companyId)
        .neq("id_venta", saleId)
        .single();

      if (duplicateSale) {
        return {
          success: false,
          error: "Ya existe otra venta con ese número de documento",
        };
      }
    }

    // Preparar datos para actualización
    const updateData = {
      numero_documento:
        saleData.numero_documento !== undefined
          ? saleData.numero_documento
          : existingSale.numero_documento,
      tipo_documento:
        saleData.tipo_documento !== undefined
          ? saleData.tipo_documento
          : existingSale.tipo_documento,
      id_cliente:
        saleData.id_cliente !== undefined
          ? saleData.id_cliente
          : existingSale.id_cliente,
      id_empleado_vendedor:
        saleData.id_empleado_vendedor !== undefined
          ? saleData.id_empleado_vendedor
          : existingSale.id_empleado_vendedor,
      tipo_iva:
        saleData.tipo_iva !== undefined
          ? saleData.tipo_iva
          : existingSale.tipo_iva,
      porcentaje_iva:
        saleData.porcentaje_iva !== undefined
          ? parseFloat(saleData.porcentaje_iva)
          : existingSale.porcentaje_iva,
      porcentaje_retencion:
        saleData.porcentaje_retencion !== undefined
          ? parseFloat(saleData.porcentaje_retencion)
          : existingSale.porcentaje_retencion,
      subtotal:
        saleData.subtotal !== undefined
          ? parseFloat(saleData.subtotal)
          : existingSale.subtotal,
      descuento:
        saleData.descuento !== undefined
          ? parseFloat(saleData.descuento)
          : existingSale.descuento,
      impuestos:
        saleData.impuestos !== undefined
          ? parseFloat(saleData.impuestos)
          : existingSale.impuestos,
      total:
        saleData.total !== undefined
          ? parseFloat(saleData.total)
          : existingSale.total,
      metodo_pago:
        saleData.metodo_pago !== undefined
          ? saleData.metodo_pago
          : existingSale.metodo_pago,
      estado:
        saleData.estado !== undefined ? saleData.estado : existingSale.estado,
      notas: saleData.notas !== undefined ? saleData.notas : existingSale.notas,
      updated_at: new Date().toISOString(),
    };

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

    return { success: true, data };
  } catch (error) {
    console.error("Error en updateSale:", error);
    return {
      success: false,
      error: "Error al actualizar venta",
      details: error.message,
    };
  }
}

// Eliminar una venta (soft delete)
async function deleteSale(companyId, saleId) {
  try {
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
      return { success: false, error: "Venta no encontrada" };
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

    return {
      success: true,
      message: "Venta eliminada correctamente",
    };
  } catch (error) {
    console.error("Error en deleteSale:", error);
    return {
      success: false,
      error: "Error al eliminar venta",
      details: error.message,
    };
  }
}

// Buscar ventas por varios criterios
async function searchSales(companyId, searchParams) {
  try {
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

    // Filtro por término general (número documento, ID, cliente)
    if (searchParams.term) {
      // Para búsqueda por texto, usar ilike con wildcards
      query = query.or(
        `numero_documento.ilike.%${searchParams.term}%,clients.nombre.ilike.%${searchParams.term}%,clients.apellido.ilike.%${searchParams.term}%,clients.documento.ilike.%${searchParams.term}%,clients.razon_social.ilike.%${searchParams.term}%`
      );
    }

    // Otros filtros específicos
    if (searchParams.clienteId) {
      query = query.eq("id_cliente", searchParams.clienteId);
    }

    if (searchParams.fechaInicio && searchParams.fechaFin) {
      query = query
        .gte("fecha_emision", searchParams.fechaInicio)
        .lte("fecha_emision", searchParams.fechaFin);
    }

    if (searchParams.tipoDocumento) {
      query = query.eq("tipo_documento", searchParams.tipoDocumento);
    }

    if (searchParams.estado) {
      query = query.eq("estado", searchParams.estado);
    }

    if (searchParams.metodoPago) {
      query = query.eq("metodo_pago", searchParams.metodoPago);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error al buscar ventas:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error en searchSales:", error);
    return {
      success: false,
      error: "Error al buscar ventas",
      details: error.message,
    };
  }
}

// Obtener estadísticas de ventas
async function getSalesStats(companyId, period = "month") {
  try {
    const validPeriods = ["day", "week", "month", "year"];
    if (!validPeriods.includes(period)) {
      return {
        success: false,
        error: "Período inválido. Debe ser: day, week, month o year",
      };
    }

    // Para simplificar, obtenemos estadísticas básicas
    // En una implementación real con PostgreSQL, usaríamos funciones de fecha más complejas

    const ahora = new Date();
    let fechaInicio;

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
    }

    // Estadísticas generales del período
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

      // Agrupar por tipo
      salesData.forEach((sale) => {
        if (!stats.por_tipo[sale.tipo_documento]) {
          stats.por_tipo[sale.tipo_documento] = { cantidad: 0, total: 0 };
        }
        stats.por_tipo[sale.tipo_documento].cantidad++;
        stats.por_tipo[sale.tipo_documento].total += parseFloat(
          sale.total || 0
        );

        if (!stats.por_estado[sale.estado]) {
          stats.por_estado[sale.estado] = { cantidad: 0, total: 0 };
        }
        stats.por_estado[sale.estado].cantidad++;
        stats.por_estado[sale.estado].total += parseFloat(sale.total || 0);

        if (!stats.por_metodo_pago[sale.metodo_pago]) {
          stats.por_metodo_pago[sale.metodo_pago] = { cantidad: 0, total: 0 };
        }
        stats.por_metodo_pago[sale.metodo_pago].cantidad++;
        stats.por_metodo_pago[sale.metodo_pago].total += parseFloat(
          sale.total || 0
        );
      });
    }

    return { success: true, data: stats };
  } catch (error) {
    console.error("Error en getSalesStats:", error);
    return {
      success: false,
      error: "Error al obtener estadísticas de ventas",
      details: error.message,
    };
  }
}

// Generar documento de venta
async function generateSaleDocument(companyId, saleId, documentType) {
  try {
    const validTypes = ["ticket", "factura", "presupuesto", "nota_credito"];
    if (!validTypes.includes(documentType)) {
      return {
        success: false,
        error: `Tipo de documento inválido. Debe ser: ${validTypes.join(", ")}`,
      };
    }

    // Obtener la venta completa
    const saleResult = await getSaleById(companyId, saleId);
    if (!saleResult.success) {
      return saleResult;
    }

    // En una implementación real, aquí generarías el PDF
    // Por ahora, devolvemos los datos estructurados para el documento
    const documentData = {
      venta: saleResult.data,
      fecha_generacion: new Date().toISOString(),
      tipo_documento: documentType,
      // Aquí irían campos adicionales específicos del tipo de documento
    };

    return {
      success: true,
      data: documentData,
      message: `Documento de tipo ${documentType} generado correctamente`,
    };
  } catch (error) {
    console.error("Error en generateSaleDocument:", error);
    return {
      success: false,
      error: "Error al generar documento de venta",
      details: error.message,
    };
  }
}

// Exportar funciones para uso en EdgeFunction
export {
  getAllSales,
  getSaleById,
  createSale,
  updateSaleStatus,
  updateSale,
  deleteSale,
  searchSales,
  getSalesStats,
  generateSaleDocument,
  extractCompanyId,
  validateSaleData,
};
