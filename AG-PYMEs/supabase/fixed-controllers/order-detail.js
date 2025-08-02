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

// Función para validar datos del detalle de orden
function validateOrderDetailData(data, isUpdate = false) {
  const errors = [];

  // Validación de ID de pedido (obligatorio en creación)
  if (!isUpdate && !data.id_pedido) {
    errors.push("id_pedido es obligatorio");
  }

  if (data.id_pedido !== undefined && data.id_pedido !== null) {
    const idPedido = parseInt(data.id_pedido);
    if (isNaN(idPedido) || idPedido <= 0) {
      errors.push("ID de pedido debe ser un número entero positivo");
    }
  }

  // Validación de ID de producto (obligatorio en creación)
  if (!isUpdate && !data.id_producto) {
    errors.push("id_producto es obligatorio");
  }

  if (data.id_producto !== undefined && data.id_producto !== null) {
    const idProducto = parseInt(data.id_producto);
    if (isNaN(idProducto) || idProducto <= 0) {
      errors.push("ID de producto debe ser un número entero positivo");
    }
  }

  // Validación de cantidad (obligatorio en creación)
  if (!isUpdate && !data.cantidad) {
    errors.push("cantidad es obligatorio");
  }

  if (data.cantidad !== undefined && data.cantidad !== null) {
    const cantidad = parseInt(data.cantidad);
    if (isNaN(cantidad) || cantidad <= 0) {
      errors.push("Cantidad debe ser un número entero positivo");
    }
  }

  // Validación de precio unitario (obligatorio en creación)
  if (!isUpdate && data.precio_unitario === undefined) {
    errors.push("precio_unitario es obligatorio");
  }

  if (data.precio_unitario !== undefined && data.precio_unitario !== null) {
    const precioUnitario = parseFloat(data.precio_unitario);
    if (isNaN(precioUnitario) || precioUnitario < 0) {
      errors.push("Precio unitario debe ser un número positivo o cero");
    }
  }

  return errors;
}

// Obtener todos los detalles de órdenes
async function getAllOrderDetails(companyId) {
  try {
    const { data, error } = await supabaseAdmin
      .from("order_detail")
      .select(
        `
        *,
        orders:id_pedido!inner (
          id_pedido,
          estado,
          total,
          fecha_entrega_estimada,
          company_id,
          suppliers:id_proveedor (
            nombre_proveedor
          )
        ),
        inventory:id_producto (
          nombre_producto,
          descripcion,
          precio_unitario as precio_catalogo,
          referencia
        )
      `
      )
      .eq("orders.company_id", companyId)
      .order("id_detalle", { ascending: false });

    if (error) {
      console.error("Error al obtener detalles de órdenes:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error en getAllOrderDetails:", error);
    return {
      success: false,
      error: "Error al obtener detalles de órdenes",
      details: error.message,
    };
  }
}

// Obtener un detalle de orden por ID
async function getOrderDetailById(companyId, detailId) {
  try {
    const { data, error } = await supabaseAdmin
      .from("order_detail")
      .select(
        `
        *,
        orders:id_pedido!inner (
          id_pedido,
          estado,
          total,
          fecha_entrega_estimada,
          comentarios,
          company_id,
          suppliers:id_proveedor (
            nombre_proveedor,
            contacto,
            telefono,
            email
          )
        ),
        inventory:id_producto (
          nombre_producto,
          descripcion,
          precio_unitario as precio_catalogo,
          referencia,
          cantidad_actual
        )
      `
      )
      .eq("orders.company_id", companyId)
      .eq("id_detalle", detailId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { success: false, error: "Detalle de orden no encontrado" };
      }
      console.error("Error al obtener detalle de orden:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error en getOrderDetailById:", error);
    return {
      success: false,
      error: "Error al obtener detalle de orden",
      details: error.message,
    };
  }
}

// Obtener detalles de una orden específica
async function getDetailsByOrderId(companyId, orderId) {
  try {
    // Verificar que la orden existe y pertenece a la empresa
    const { data: existingOrder } = await supabaseAdmin
      .from("orders")
      .select("id_pedido")
      .eq("company_id", companyId)
      .eq("id_pedido", orderId)
      .single();

    if (!existingOrder) {
      return { success: false, error: "Orden no encontrada" };
    }

    const { data, error } = await supabaseAdmin
      .from("order_detail")
      .select(
        `
        *,
        inventory:id_producto (
          nombre_producto,
          descripcion,
          precio_unitario as precio_catalogo,
          referencia,
          cantidad_actual
        )
      `
      )
      .eq("id_pedido", orderId)
      .order("id_detalle");

    if (error) {
      console.error("Error al obtener detalles por orden:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error en getDetailsByOrderId:", error);
    return {
      success: false,
      error: "Error al obtener detalles por orden",
      details: error.message,
    };
  }
}

// Crear un nuevo detalle de orden
async function createOrderDetail(companyId, detailData) {
  try {
    // Validar datos
    const validationErrors = validateOrderDetailData(detailData);
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
      .eq("id_pedido", detailData.id_pedido)
      .single();

    if (!existingOrder) {
      return {
        success: false,
        error: "La orden especificada no existe",
      };
    }

    // Verificar que la orden no esté entregada o cancelada
    if (["entregado", "cancelado"].includes(existingOrder.estado)) {
      return {
        success: false,
        error: "No se puede agregar detalles a una orden entregada o cancelada",
      };
    }

    // Verificar que el producto existe y pertenece a la empresa
    const { data: existingProduct } = await supabaseAdmin
      .from("inventory")
      .select("id_producto, nombre_producto, precio_unitario, cantidad_actual")
      .eq("company_id", companyId)
      .eq("id_producto", detailData.id_producto)
      .single();

    if (!existingProduct) {
      return {
        success: false,
        error: "El producto especificado no existe",
      };
    }

    // Verificar que hay suficiente stock (si es necesario)
    if (existingProduct.cantidad_actual < detailData.cantidad) {
      return {
        success: false,
        error: `Stock insuficiente. Disponible: ${existingProduct.cantidad_actual}, Solicitado: ${detailData.cantidad}`,
      };
    }

    // Verificar que no existe ya este producto en esta orden
    const { data: existingDetail } = await supabaseAdmin
      .from("order_detail")
      .select("id_detalle")
      .eq("id_pedido", detailData.id_pedido)
      .eq("id_producto", detailData.id_producto)
      .single();

    if (existingDetail) {
      return {
        success: false,
        error:
          "Este producto ya está incluido en la orden. Use actualizar para modificar la cantidad.",
      };
    }

    // Preparar datos para inserción
    const insertData = {
      id_pedido: parseInt(detailData.id_pedido),
      id_producto: parseInt(detailData.id_producto),
      cantidad: parseInt(detailData.cantidad),
      precio_unitario: parseFloat(detailData.precio_unitario),
    };

    // Calcular subtotal
    const subtotal = insertData.cantidad * insertData.precio_unitario;

    const { data, error } = await supabaseAdmin
      .from("order_detail")
      .insert(insertData)
      .select(
        `
        *,
        inventory:id_producto (
          nombre_producto,
          descripcion,
          referencia
        )
      `
      )
      .single();

    if (error) {
      console.error("Error al crear detalle de orden:", error);
      throw error;
    }

    // Actualizar el total de la orden
    await updateOrderTotal(detailData.id_pedido);

    return {
      success: true,
      data: {
        ...data,
        subtotal,
      },
    };
  } catch (error) {
    console.error("Error en createOrderDetail:", error);
    return {
      success: false,
      error: "Error al crear detalle de orden",
      details: error.message,
    };
  }
}

// Actualizar un detalle de orden existente
async function updateOrderDetail(companyId, detailId, detailData) {
  try {
    // Validar datos
    const validationErrors = validateOrderDetailData(detailData, true);
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: "Datos inválidos",
        details: validationErrors,
      };
    }

    // Verificar que el detalle existe y la orden pertenece a la empresa
    const { data: existingDetail } = await supabaseAdmin
      .from("order_detail")
      .select(
        `
        *,
        orders:id_pedido!inner (
          id_pedido,
          estado,
          company_id
        )
      `
      )
      .eq("orders.company_id", companyId)
      .eq("id_detalle", detailId)
      .single();

    if (!existingDetail) {
      return { success: false, error: "Detalle de orden no encontrado" };
    }

    // Verificar que la orden no esté entregada o cancelada
    if (["entregado", "cancelado"].includes(existingDetail.orders.estado)) {
      return {
        success: false,
        error:
          "No se puede modificar detalles de una orden entregada o cancelada",
      };
    }

    // Si se cambia el producto, verificar que existe
    if (
      detailData.id_producto &&
      detailData.id_producto !== existingDetail.id_producto
    ) {
      const { data: existingProduct } = await supabaseAdmin
        .from("inventory")
        .select("id_producto, nombre_producto, cantidad_actual")
        .eq("company_id", companyId)
        .eq("id_producto", detailData.id_producto)
        .single();

      if (!existingProduct) {
        return {
          success: false,
          error: "El producto especificado no existe",
        };
      }

      // Verificar stock si se cambia la cantidad o el producto
      const nuevaCantidad = detailData.cantidad || existingDetail.cantidad;
      if (existingProduct.cantidad_actual < nuevaCantidad) {
        return {
          success: false,
          error: `Stock insuficiente. Disponible: ${existingProduct.cantidad_actual}, Solicitado: ${nuevaCantidad}`,
        };
      }
    }

    // Preparar datos para actualización
    const updateData = {};

    if (detailData.id_pedido !== undefined) {
      updateData.id_pedido = parseInt(detailData.id_pedido);
    }

    if (detailData.id_producto !== undefined) {
      updateData.id_producto = parseInt(detailData.id_producto);
    }

    if (detailData.cantidad !== undefined) {
      updateData.cantidad = parseInt(detailData.cantidad);
    }

    if (detailData.precio_unitario !== undefined) {
      updateData.precio_unitario = parseFloat(detailData.precio_unitario);
    }

    const { data, error } = await supabaseAdmin
      .from("order_detail")
      .update(updateData)
      .eq("id_detalle", detailId)
      .select(
        `
        *,
        inventory:id_producto (
          nombre_producto,
          descripcion,
          referencia
        )
      `
      )
      .single();

    if (error) {
      console.error("Error al actualizar detalle de orden:", error);
      throw error;
    }

    // Actualizar el total de la orden
    await updateOrderTotal(existingDetail.id_pedido);

    // Calcular subtotal
    const subtotal = data.cantidad * data.precio_unitario;

    return {
      success: true,
      data: {
        ...data,
        subtotal,
      },
    };
  } catch (error) {
    console.error("Error en updateOrderDetail:", error);
    return {
      success: false,
      error: "Error al actualizar detalle de orden",
      details: error.message,
    };
  }
}

// Eliminar un detalle de orden
async function deleteOrderDetail(companyId, detailId) {
  try {
    // Verificar que el detalle existe y la orden pertenece a la empresa
    const { data: existingDetail } = await supabaseAdmin
      .from("order_detail")
      .select(
        `
        *,
        orders:id_pedido!inner (
          id_pedido,
          estado,
          company_id
        )
      `
      )
      .eq("orders.company_id", companyId)
      .eq("id_detalle", detailId)
      .single();

    if (!existingDetail) {
      return { success: false, error: "Detalle de orden no encontrado" };
    }

    // Verificar que la orden no esté entregada o cancelada
    if (["entregado", "cancelado"].includes(existingDetail.orders.estado)) {
      return {
        success: false,
        error:
          "No se puede eliminar detalles de una orden entregada o cancelada",
      };
    }

    const { error } = await supabaseAdmin
      .from("order_detail")
      .delete()
      .eq("id_detalle", detailId);

    if (error) {
      console.error("Error al eliminar detalle de orden:", error);
      throw error;
    }

    // Actualizar el total de la orden
    await updateOrderTotal(existingDetail.id_pedido);

    return {
      success: true,
      message: "Detalle de orden eliminado correctamente",
    };
  } catch (error) {
    console.error("Error en deleteOrderDetail:", error);
    return {
      success: false,
      error: "Error al eliminar detalle de orden",
      details: error.message,
    };
  }
}

// Función auxiliar para actualizar el total de una orden
async function updateOrderTotal(orderId) {
  try {
    // Calcular el total de todos los detalles
    const { data: details } = await supabaseAdmin
      .from("order_detail")
      .select("cantidad, precio_unitario")
      .eq("id_pedido", orderId);

    const total =
      details?.reduce((sum, detail) => {
        return sum + detail.cantidad * detail.precio_unitario;
      }, 0) || 0;

    // Actualizar el total en la orden
    await supabaseAdmin
      .from("orders")
      .update({ total, updated_at: new Date().toISOString() })
      .eq("id_pedido", orderId);
  } catch (error) {
    console.error("Error al actualizar total de orden:", error);
  }
}

// Exportar funciones para uso en EdgeFunction
export {
  getAllOrderDetails,
  getOrderDetailById,
  getDetailsByOrderId,
  createOrderDetail,
  updateOrderDetail,
  deleteOrderDetail,
  extractCompanyId,
  validateOrderDetailData,
};
