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

// Función para validar datos de la orden
function validateOrderData(data, isUpdate = false) {
  const errors = [];

  // Validación de proveedor (obligatorio en creación)
  if (!isUpdate && !data.id_proveedor) {
    errors.push("id_proveedor es obligatorio");
  }

  if (data.id_proveedor !== undefined && data.id_proveedor !== null) {
    const idProveedor = parseInt(data.id_proveedor);
    if (isNaN(idProveedor) || idProveedor <= 0) {
      errors.push("ID de proveedor debe ser un número entero positivo");
    }
  }

  // Validación de gasto (si se proporciona)
  if (data.id_gasto !== undefined && data.id_gasto !== null) {
    const idGasto = parseInt(data.id_gasto);
    if (isNaN(idGasto) || idGasto <= 0) {
      errors.push("ID de gasto debe ser un número entero positivo");
    }
  }

  // Validación de fecha de entrega
  if (
    data.fecha_entrega_estimada &&
    !isValidDate(data.fecha_entrega_estimada)
  ) {
    errors.push("Fecha de entrega estimada debe ser una fecha válida");
  }

  // Validación de estado
  const estadosValidos = [
    "pendiente",
    "confirmado",
    "enviado",
    "entregado",
    "cancelado",
  ];
  if (data.estado && !estadosValidos.includes(data.estado.toLowerCase())) {
    errors.push(
      "Estado debe ser: pendiente, confirmado, enviado, entregado o cancelado"
    );
  }

  // Validación de total
  if (data.total !== undefined && data.total !== null) {
    const total = parseFloat(data.total);
    if (isNaN(total) || total < 0) {
      errors.push("Total debe ser un número positivo o cero");
    }
  }

  // Validación de método de pago
  const metodosPago = [
    "efectivo",
    "transferencia",
    "tarjeta",
    "cheque",
    "credito",
  ];
  if (
    data.metodo_pago &&
    !metodosPago.includes(data.metodo_pago.toLowerCase())
  ) {
    errors.push(
      "Método de pago debe ser: efectivo, transferencia, tarjeta, cheque o credito"
    );
  }

  return errors;
}

// Función auxiliar para validar fechas
function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

// Obtener todas las órdenes
async function getAllOrders(companyId) {
  try {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select(
        `
        *,
        suppliers:id_proveedor (
          nombre_proveedor,
          contacto,
          telefono,
          email
        )
      `
      )
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error al obtener órdenes:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error en getAllOrders:", error);
    return {
      success: false,
      error: "Error al obtener órdenes",
      details: error.message,
    };
  }
}

// Obtener una orden por ID
async function getOrderById(companyId, orderId) {
  try {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select(
        `
        *,
        suppliers:id_proveedor (
          nombre_proveedor,
          contacto,
          telefono,
          email,
          direccion_fiscal,
          condiciones_pago,
          dias_credito
        )
      `
      )
      .eq("company_id", companyId)
      .eq("id_pedido", orderId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { success: false, error: "Orden no encontrada" };
      }
      console.error("Error al obtener orden:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error en getOrderById:", error);
    return {
      success: false,
      error: "Error al obtener orden",
      details: error.message,
    };
  }
}

// Crear una nueva orden
async function createOrder(companyId, orderData) {
  try {
    // Validar datos
    const validationErrors = validateOrderData(orderData);
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: "Datos inválidos",
        details: validationErrors,
      };
    }

    // Verificar que el proveedor existe y pertenece a la empresa
    const { data: existingSupplier } = await supabaseAdmin
      .from("suppliers")
      .select("id_proveedor, activo")
      .eq("company_id", companyId)
      .eq("id_proveedor", orderData.id_proveedor)
      .single();

    if (!existingSupplier) {
      return {
        success: false,
        error: "El proveedor especificado no existe",
      };
    }

    if (!existingSupplier.activo) {
      return {
        success: false,
        error: "El proveedor especificado está inactivo",
      };
    }

    // Verificar que el gasto existe (si se proporciona)
    if (orderData.id_gasto) {
      // Aquí se verificaría con la tabla de gastos cuando exista
      // Por ahora solo validamos que sea un número válido
    }

    // Preparar datos para inserción
    const insertData = {
      company_id: companyId,
      id_proveedor: parseInt(orderData.id_proveedor),
      id_gasto: orderData.id_gasto ? parseInt(orderData.id_gasto) : null,
      fecha_entrega_estimada: orderData.fecha_entrega_estimada || null,
      estado: orderData.estado?.toLowerCase() || "pendiente",
      total: orderData.total ? parseFloat(orderData.total) : 0,
      metodo_pago: orderData.metodo_pago?.toLowerCase() || null,
      comentarios: orderData.comentarios || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("orders")
      .insert(insertData)
      .select(
        `
        *,
        suppliers:id_proveedor (
          nombre_proveedor,
          contacto,
          telefono,
          email
        )
      `
      )
      .single();

    if (error) {
      console.error("Error al crear orden:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error en createOrder:", error);
    return {
      success: false,
      error: "Error al crear orden",
      details: error.message,
    };
  }
}

// Actualizar una orden existente
async function updateOrder(companyId, orderId, orderData) {
  try {
    // Validar datos
    const validationErrors = validateOrderData(orderData, true);
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: "Datos inválidos",
        details: validationErrors,
      };
    }

    // Verificar que la orden existe y pertenece a la empresa
    const { data: existingOrder } = await supabaseAdmin
      .from("orders")
      .select("id_pedido, estado")
      .eq("company_id", companyId)
      .eq("id_pedido", orderId)
      .single();

    if (!existingOrder) {
      return { success: false, error: "Orden no encontrada" };
    }

    // Verificar que el proveedor existe (si se cambia)
    if (orderData.id_proveedor) {
      const { data: existingSupplier } = await supabaseAdmin
        .from("suppliers")
        .select("id_proveedor, activo")
        .eq("company_id", companyId)
        .eq("id_proveedor", orderData.id_proveedor)
        .single();

      if (!existingSupplier) {
        return {
          success: false,
          error: "El proveedor especificado no existe",
        };
      }

      if (!existingSupplier.activo) {
        return {
          success: false,
          error: "El proveedor especificado está inactivo",
        };
      }
    }

    // Preparar datos para actualización
    const updateData = {
      updated_at: new Date().toISOString(),
    };

    if (orderData.id_proveedor !== undefined) {
      updateData.id_proveedor = parseInt(orderData.id_proveedor);
    }

    if (orderData.id_gasto !== undefined) {
      updateData.id_gasto = orderData.id_gasto
        ? parseInt(orderData.id_gasto)
        : null;
    }

    if (orderData.fecha_entrega_estimada !== undefined) {
      updateData.fecha_entrega_estimada =
        orderData.fecha_entrega_estimada || null;
    }

    if (orderData.estado !== undefined) {
      updateData.estado = orderData.estado?.toLowerCase() || "pendiente";
    }

    if (orderData.total !== undefined) {
      updateData.total = orderData.total ? parseFloat(orderData.total) : 0;
    }

    if (orderData.metodo_pago !== undefined) {
      updateData.metodo_pago = orderData.metodo_pago?.toLowerCase() || null;
    }

    if (orderData.comentarios !== undefined) {
      updateData.comentarios = orderData.comentarios || null;
    }

    const { data, error } = await supabaseAdmin
      .from("orders")
      .update(updateData)
      .eq("company_id", companyId)
      .eq("id_pedido", orderId)
      .select(
        `
        *,
        suppliers:id_proveedor (
          nombre_proveedor,
          contacto,
          telefono,
          email
        )
      `
      )
      .single();

    if (error) {
      console.error("Error al actualizar orden:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error en updateOrder:", error);
    return {
      success: false,
      error: "Error al actualizar orden",
      details: error.message,
    };
  }
}

// Eliminar una orden
async function deleteOrder(companyId, orderId) {
  try {
    // Verificar que la orden existe y pertenece a la empresa
    const { data: existingOrder } = await supabaseAdmin
      .from("orders")
      .select("id_pedido, estado")
      .eq("company_id", companyId)
      .eq("id_pedido", orderId)
      .single();

    if (!existingOrder) {
      return { success: false, error: "Orden no encontrada" };
    }

    // Verificar que la orden se puede eliminar (no está entregada)
    if (existingOrder.estado === "entregado") {
      return {
        success: false,
        error: "No se puede eliminar una orden que ya fue entregada",
      };
    }

    const { error } = await supabaseAdmin
      .from("orders")
      .delete()
      .eq("company_id", companyId)
      .eq("id_pedido", orderId);

    if (error) {
      console.error("Error al eliminar orden:", error);
      if (error.code === "23503") {
        return {
          success: false,
          error:
            "No se puede eliminar la orden porque tiene elementos asociados",
        };
      }
      throw error;
    }

    return {
      success: true,
      message: "Orden eliminada correctamente",
    };
  } catch (error) {
    console.error("Error en deleteOrder:", error);
    return {
      success: false,
      error: "Error al eliminar orden",
      details: error.message,
    };
  }
}

// Obtener órdenes por estado
async function getOrdersByStatus(companyId, estado) {
  try {
    const estadosValidos = [
      "pendiente",
      "confirmado",
      "enviado",
      "entregado",
      "cancelado",
    ];

    if (!estadosValidos.includes(estado.toLowerCase())) {
      return {
        success: false,
        error: "Estado inválido",
        details: [
          "Estado debe ser: pendiente, confirmado, enviado, entregado o cancelado",
        ],
      };
    }

    const { data, error } = await supabaseAdmin
      .from("orders")
      .select(
        `
        *,
        suppliers:id_proveedor (
          nombre_proveedor,
          contacto,
          telefono,
          email
        )
      `
      )
      .eq("company_id", companyId)
      .eq("estado", estado.toLowerCase())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error al obtener órdenes por estado:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error en getOrdersByStatus:", error);
    return {
      success: false,
      error: "Error al obtener órdenes por estado",
      details: error.message,
    };
  }
}

// Obtener órdenes por proveedor
async function getOrdersBySupplier(companyId, supplierId) {
  try {
    // Verificar que el proveedor existe
    const { data: existingSupplier } = await supabaseAdmin
      .from("suppliers")
      .select("id_proveedor")
      .eq("company_id", companyId)
      .eq("id_proveedor", supplierId)
      .single();

    if (!existingSupplier) {
      return { success: false, error: "Proveedor no encontrado" };
    }

    const { data, error } = await supabaseAdmin
      .from("orders")
      .select(
        `
        *,
        suppliers:id_proveedor (
          nombre_proveedor,
          contacto,
          telefono,
          email
        )
      `
      )
      .eq("company_id", companyId)
      .eq("id_proveedor", supplierId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error al obtener órdenes por proveedor:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error en getOrdersBySupplier:", error);
    return {
      success: false,
      error: "Error al obtener órdenes por proveedor",
      details: error.message,
    };
  }
}

// Exportar funciones para uso en EdgeFunction
export {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  getOrdersByStatus,
  getOrdersBySupplier,
  extractCompanyId,
  validateOrderData,
};
