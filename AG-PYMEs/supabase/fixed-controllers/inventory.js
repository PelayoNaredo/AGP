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

// Función para validar datos del producto
function validateProductData(data, isUpdate = false) {
  const errors = [];

  // Campos obligatorios
  if (!data.nombre_producto) {
    errors.push("nombre_producto es obligatorio");
  }

  // Validación de cantidades
  if (data.cantidad_actual !== undefined && data.cantidad_actual !== null) {
    const cantidadActual = parseInt(data.cantidad_actual);
    if (isNaN(cantidadActual) || cantidadActual < 0) {
      errors.push("Cantidad actual debe ser un número entero positivo o cero");
    }
  }

  if (data.cantidad_minima !== undefined && data.cantidad_minima !== null) {
    const cantidadMinima = parseInt(data.cantidad_minima);
    if (isNaN(cantidadMinima) || cantidadMinima < 0) {
      errors.push("Cantidad mínima debe ser un número entero positivo o cero");
    }
  }

  // Validación de precios
  if (data.precio_unitario !== undefined && data.precio_unitario !== null) {
    const precioUnitario = parseFloat(data.precio_unitario);
    if (isNaN(precioUnitario) || precioUnitario < 0) {
      errors.push("Precio unitario debe ser un número positivo o cero");
    }
  }

  if (data.pvp !== undefined && data.pvp !== null) {
    const pvp = parseFloat(data.pvp);
    if (isNaN(pvp) || pvp < 0) {
      errors.push("PVP debe ser un número positivo o cero");
    }
  }

  // Validación de proveedor (si se proporciona)
  if (data.id_proveedor !== undefined && data.id_proveedor !== null) {
    const idProveedor = parseInt(data.id_proveedor);
    if (isNaN(idProveedor) || idProveedor <= 0) {
      errors.push("ID de proveedor debe ser un número entero positivo");
    }
  }

  // Validación de fecha (si se proporciona)
  if (data.fecha_actualizacion && !isValidDate(data.fecha_actualizacion)) {
    errors.push("Fecha de actualización debe ser una fecha válida");
  }

  return errors;
}

// Función auxiliar para validar fechas
function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

// Función para validar datos de actualización de venta
function validateSaleData(productos) {
  const errors = [];

  if (!productos || !Array.isArray(productos) || productos.length === 0) {
    errors.push(
      "Se requiere un array de productos con id_producto y cantidad_vendida"
    );
    return errors;
  }

  productos.forEach((producto, index) => {
    if (!producto.id_producto) {
      errors.push(`Producto ${index + 1}: id_producto es obligatorio`);
    }

    if (
      producto.cantidad_vendida === undefined ||
      producto.cantidad_vendida === null
    ) {
      errors.push(`Producto ${index + 1}: cantidad_vendida es obligatorio`);
    } else {
      const cantidadVendida = parseInt(producto.cantidad_vendida);
      if (isNaN(cantidadVendida) || cantidadVendida <= 0) {
        errors.push(
          `Producto ${index + 1}: cantidad_vendida debe ser un número entero positivo`
        );
      }
    }
  });

  return errors;
}

// Obtener todos los productos del inventario
async function getAllInventory(companyId) {
  try {
    const { data, error } = await supabaseAdmin
      .from("inventory")
      .select(
        `
        *,
        suppliers:id_proveedor (
          nombre_proveedor,
          contacto
        )
      `
      )
      .eq("company_id", companyId)
      .order("nombre_producto");

    if (error) {
      console.error("Error al obtener inventario:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error en getAllInventory:", error);
    return {
      success: false,
      error: "Error al obtener inventario",
      details: error.message,
    };
  }
}

// Obtener un producto por ID
async function getProductById(companyId, productId) {
  try {
    const { data, error } = await supabaseAdmin
      .from("inventory")
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
      .eq("id_producto", productId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { success: false, error: "Producto no encontrado" };
      }
      console.error("Error al obtener producto:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error en getProductById:", error);
    return {
      success: false,
      error: "Error al obtener producto",
      details: error.message,
    };
  }
}

// Crear un nuevo producto
async function createProduct(companyId, productData) {
  try {
    // Validar datos
    const validationErrors = validateProductData(productData);
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: "Datos inválidos",
        details: validationErrors,
      };
    }

    // Verificar que la referencia no existe para esta empresa (si se proporciona)
    if (productData.referencia) {
      const { data: existingProduct } = await supabaseAdmin
        .from("inventory")
        .select("id_producto")
        .eq("company_id", companyId)
        .eq("referencia", productData.referencia)
        .single();

      if (existingProduct) {
        return {
          success: false,
          error: "La referencia ya está registrada para esta empresa",
        };
      }
    }

    // Verificar que el proveedor existe (si se proporciona)
    if (productData.id_proveedor) {
      const { data: existingSupplier } = await supabaseAdmin
        .from("suppliers")
        .select("id_proveedor")
        .eq("company_id", companyId)
        .eq("id_proveedor", productData.id_proveedor)
        .single();

      if (!existingSupplier) {
        return {
          success: false,
          error: "El proveedor especificado no existe",
        };
      }
    }

    // Preparar datos para inserción
    const insertData = {
      company_id: companyId,
      nombre_producto: productData.nombre_producto,
      descripcion: productData.descripcion || null,
      cantidad_actual: productData.cantidad_actual
        ? parseInt(productData.cantidad_actual)
        : 0,
      cantidad_minima: productData.cantidad_minima
        ? parseInt(productData.cantidad_minima)
        : 0,
      precio_unitario: productData.precio_unitario
        ? parseFloat(productData.precio_unitario)
        : null,
      id_proveedor: productData.id_proveedor
        ? parseInt(productData.id_proveedor)
        : null,
      fecha_actualizacion:
        productData.fecha_actualizacion ||
        new Date().toISOString().split("T")[0],
      referencia: productData.referencia || null,
      pvp: productData.pvp ? parseFloat(productData.pvp) : null,
    };

    const { data, error } = await supabaseAdmin
      .from("inventory")
      .insert(insertData)
      .select(
        `
        *,
        suppliers:id_proveedor (
          nombre_proveedor,
          contacto
        )
      `
      )
      .single();

    if (error) {
      console.error("Error al crear producto:", error);
      if (error.code === "23505") {
        return { success: false, error: "La referencia ya está registrada" };
      }
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error en createProduct:", error);
    return {
      success: false,
      error: "Error al crear producto",
      details: error.message,
    };
  }
}

// Actualizar un producto existente
async function updateProduct(companyId, productId, productData) {
  try {
    // Validar datos
    const validationErrors = validateProductData(productData, true);
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: "Datos inválidos",
        details: validationErrors,
      };
    }

    // Verificar que el producto existe y pertenece a la empresa
    const { data: existingProduct } = await supabaseAdmin
      .from("inventory")
      .select("id_producto")
      .eq("company_id", companyId)
      .eq("id_producto", productId)
      .single();

    if (!existingProduct) {
      return { success: false, error: "Producto no encontrado" };
    }

    // Verificar que la referencia no existe para otro producto de esta empresa
    if (productData.referencia) {
      const { data: duplicateRef } = await supabaseAdmin
        .from("inventory")
        .select("id_producto")
        .eq("company_id", companyId)
        .eq("referencia", productData.referencia)
        .neq("id_producto", productId)
        .single();

      if (duplicateRef) {
        return {
          success: false,
          error: "La referencia ya está registrada para otro producto",
        };
      }
    }

    // Verificar que el proveedor existe (si se proporciona)
    if (productData.id_proveedor) {
      const { data: existingSupplier } = await supabaseAdmin
        .from("suppliers")
        .select("id_proveedor")
        .eq("company_id", companyId)
        .eq("id_proveedor", productData.id_proveedor)
        .single();

      if (!existingSupplier) {
        return {
          success: false,
          error: "El proveedor especificado no existe",
        };
      }
    }

    // Preparar datos para actualización
    const updateData = {
      nombre_producto: productData.nombre_producto,
      descripcion: productData.descripcion || null,
      cantidad_actual:
        productData.cantidad_actual !== undefined
          ? parseInt(productData.cantidad_actual)
          : undefined,
      cantidad_minima:
        productData.cantidad_minima !== undefined
          ? parseInt(productData.cantidad_minima)
          : undefined,
      precio_unitario:
        productData.precio_unitario !== undefined
          ? parseFloat(productData.precio_unitario)
          : undefined,
      id_proveedor:
        productData.id_proveedor !== undefined
          ? productData.id_proveedor
            ? parseInt(productData.id_proveedor)
            : null
          : undefined,
      fecha_actualizacion:
        productData.fecha_actualizacion ||
        new Date().toISOString().split("T")[0],
      referencia:
        productData.referencia !== undefined
          ? productData.referencia
          : undefined,
      pvp:
        productData.pvp !== undefined
          ? productData.pvp
            ? parseFloat(productData.pvp)
            : null
          : undefined,
    };

    // Eliminar campos undefined
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const { data, error } = await supabaseAdmin
      .from("inventory")
      .update(updateData)
      .eq("company_id", companyId)
      .eq("id_producto", productId)
      .select(
        `
        *,
        suppliers:id_proveedor (
          nombre_proveedor,
          contacto
        )
      `
      )
      .single();

    if (error) {
      console.error("Error al actualizar producto:", error);
      if (error.code === "23505") {
        return { success: false, error: "La referencia ya está registrada" };
      }
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error en updateProduct:", error);
    return {
      success: false,
      error: "Error al actualizar producto",
      details: error.message,
    };
  }
}

// Eliminar un producto
async function deleteProduct(companyId, productId) {
  try {
    // Verificar que el producto existe y pertenece a la empresa
    const { data: existingProduct } = await supabaseAdmin
      .from("inventory")
      .select("id_producto")
      .eq("company_id", companyId)
      .eq("id_producto", productId)
      .single();

    if (!existingProduct) {
      return { success: false, error: "Producto no encontrado" };
    }

    const { error } = await supabaseAdmin
      .from("inventory")
      .delete()
      .eq("company_id", companyId)
      .eq("id_producto", productId);

    if (error) {
      console.error("Error al eliminar producto:", error);
      if (error.code === "23503") {
        return {
          success: false,
          error:
            "No se puede eliminar el producto porque tiene ventas asociadas",
        };
      }
      throw error;
    }

    return {
      success: true,
      message: "Producto eliminado correctamente",
    };
  } catch (error) {
    console.error("Error en deleteProduct:", error);
    return {
      success: false,
      error: "Error al eliminar producto",
      details: error.message,
    };
  }
}

// Actualizar cantidades de productos después de una venta
async function updateSaleQuantities(companyId, productos) {
  try {
    // Validar datos de entrada
    const validationErrors = validateSaleData(productos);
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: "Datos inválidos",
        details: validationErrors,
      };
    }

    let updatedProducts = [];
    let productsWithError = [];

    // Procesar cada producto en la lista
    for (const producto of productos) {
      const { id_producto, cantidad_vendida } = producto;
      const cantidadVendida = parseInt(cantidad_vendida);

      // Obtener información actual del producto
      const { data: productData, error: getError } = await supabaseAdmin
        .from("inventory")
        .select("*")
        .eq("company_id", companyId)
        .eq("id_producto", id_producto)
        .single();

      if (getError || !productData) {
        productsWithError.push({
          id_producto,
          error: "Producto no encontrado",
        });
        continue;
      }

      // Calcular la nueva cantidad (no puede ser negativa)
      const nuevaCantidad = Math.max(
        0,
        productData.cantidad_actual - cantidadVendida
      );

      // Actualizar el producto en la base de datos
      const { data: updatedData, error: updateError } = await supabaseAdmin
        .from("inventory")
        .update({
          cantidad_actual: nuevaCantidad,
          fecha_actualizacion: new Date().toISOString().split("T")[0],
        })
        .eq("company_id", companyId)
        .eq("id_producto", id_producto)
        .select(
          `
          *,
          suppliers:id_proveedor (
            nombre_proveedor,
            contacto
          )
        `
        )
        .single();

      if (updateError || !updatedData) {
        productsWithError.push({
          id_producto,
          error: "No se pudo actualizar el producto",
        });
        continue;
      }

      updatedProducts.push(updatedData);
    }

    // Determinar el resultado
    if (updatedProducts.length === 0 && productsWithError.length > 0) {
      return {
        success: false,
        error: "No se pudo actualizar ningún producto",
        details: productsWithError,
      };
    }

    return {
      success: true,
      message: `${updatedProducts.length} productos actualizados correctamente`,
      data: {
        updated: updatedProducts,
        errors: productsWithError.length > 0 ? productsWithError : undefined,
      },
    };
  } catch (error) {
    console.error("Error en updateSaleQuantities:", error);
    return {
      success: false,
      error: "Error al actualizar inventario después de venta",
      details: error.message,
    };
  }
}

// Exportar funciones para uso en EdgeFunction
export {
  getAllInventory,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateSaleQuantities,
  extractCompanyId,
  validateProductData,
  validateSaleData,
};
