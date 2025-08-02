import { EdgeFunctions } from "../../config/supabase";

// Función para mejorar el manejo de errores
const handleFetchError = (error, action) => {
  // Log completo del error para depuración
  console.error(`Error en ${action}:`, error);

  // Intentar obtener más información del error
  let detailedError = {
    status: error.status || 500,
    message: error.message || `Error al ${action}`,
    errors: error.errors,
    stack: error.stack,
    // Si es una respuesta API, puede tener más detalles en la respuesta
    responseData: error.responseData,
  };

  // Mostrar el error detallado en la consola
  console.error("Error detallado:", detailedError);

  throw error;
};

// Función para ejecutar el cierre diario de ventas
export const executeDailyClosure = async (date, total, notes = "") => {
  try {
    const result = await EdgeFunctions.sales.executeDailyClosure();
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al ejecutar el cierre diario");
  } catch (error) {
    handleFetchError(error, "ejecutar el cierre diario");
  }
};

export const getAllSales = async () => {
  try {
    const result = await EdgeFunctions.sales.getAll();
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al obtener las ventas");
  } catch (error) {
    handleFetchError(error, "obtener las ventas");
  }
};

export const getSaleById = async (id) => {
  try {
    const result = await EdgeFunctions.sales.getById(id);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al obtener la venta");
  } catch (error) {
    handleFetchError(error, "obtener la venta");
  }
};

export const createSale = async (saleData) => {
  try {
    // Asegurarnos de que los campos críticos existen
    if (!saleData.numero_documento) {
      saleData.numero_documento = `VENTA-${Date.now()}`;
    }

    if (!saleData.tipo_documento) {
      saleData.tipo_documento = "ticket";
    }

    // Verificar que el id_cliente sea null si no está definido
    if (
      saleData.id_cliente === undefined ||
      saleData.id_cliente === "" ||
      saleData.id_cliente === 0
    ) {
      saleData.id_cliente = null;
    }

    // Asegurarnos de que los valores numéricos son números y no strings
    if (typeof saleData.subtotal === "string") {
      saleData.subtotal = parseFloat(saleData.subtotal) || 0;
    }

    if (typeof saleData.descuento === "string") {
      saleData.descuento = parseFloat(saleData.descuento) || 0;
    } else if (saleData.descuento === undefined) {
      saleData.descuento = 0;
    }

    if (typeof saleData.impuestos === "string") {
      saleData.impuestos = parseFloat(saleData.impuestos) || 0;
    } else if (saleData.impuestos === undefined) {
      saleData.impuestos = 0;
    }

    if (typeof saleData.total === "string") {
      saleData.total = parseFloat(saleData.total) || 0;
    }

    if (typeof saleData.porcentaje_iva === "string") {
      saleData.porcentaje_iva = parseFloat(saleData.porcentaje_iva) || 21;
    } else if (saleData.porcentaje_iva === undefined) {
      saleData.porcentaje_iva = 21;
    }

    if (typeof saleData.porcentaje_retencion === "string") {
      saleData.porcentaje_retencion =
        parseFloat(saleData.porcentaje_retencion) || 0;
    } else if (saleData.porcentaje_retencion === undefined) {
      saleData.porcentaje_retencion = 0;
    }

    // Recalcular el total para asegurar que se cumple la restricción CHECK
    // CHECK (total = subtotal - descuento + impuestos - (subtotal * porcentaje_retencion / 100))
    const retencionCalculada =
      (saleData.subtotal * saleData.porcentaje_retencion) / 100;
    const totalCalculado =
      saleData.subtotal -
      saleData.descuento +
      saleData.impuestos -
      retencionCalculada;

    // Siempre usar el total calculado para evitar problemas con la restricción CHECK
    saleData.total = Number(totalCalculado.toFixed(2));

    const result = await EdgeFunctions.sales.create(saleData);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al crear la venta");
  } catch (error) {
    handleFetchError(error, "crear la venta");
  }
};

export const updateSale = async (id, saleData) => {
  try {
    const result = await EdgeFunctions.sales.update(id, saleData);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al actualizar la venta");
  } catch (error) {
    console.error("Error al actualizar la venta:", error);
    throw error;
  }
};

export const deleteSale = async (id) => {
  try {
    const result = await EdgeFunctions.sales.delete(id);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al eliminar la venta");
  } catch (error) {
    console.error("Error al eliminar la venta:", error);
    throw error;
  }
};

export const updateSaleStatus = async (id, status) => {
  try {
    const result = await EdgeFunctions.sales.updateStatus(id, status);
    if (result.success) {
      return result.data;
    }
    throw new Error(
      result.error || "Error al actualizar el estado de la venta"
    );
  } catch (error) {
    console.error("Error al actualizar el estado de la venta:", error);
    throw error;
  }
};

export const getSalesByClient = async (clientId) => {
  try {
    const result = await EdgeFunctions.sales.getByClient(clientId);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al obtener ventas del cliente");
  } catch (error) {
    console.error("Error al obtener ventas del cliente:", error);
    throw error;
  }
};

export const getSalesByEmployee = async (employeeId) => {
  try {
    const result = await EdgeFunctions.sales.getByEmployee(employeeId);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al obtener ventas del empleado");
  } catch (error) {
    console.error("Error al obtener ventas del empleado:", error);
    throw error;
  }
};

export const getSalesByDateRange = async (startDate, endDate) => {
  try {
    // Formatear fechas si son objetos Date
    const formattedStartDate =
      typeof startDate === "object"
        ? startDate.toISOString().split("T")[0]
        : startDate;

    const formattedEndDate =
      typeof endDate === "object"
        ? endDate.toISOString().split("T")[0]
        : endDate;

    const result = await EdgeFunctions.sales.getByDateRange(
      formattedStartDate,
      formattedEndDate
    );
    if (result.success) {
      return result.data;
    }
    throw new Error(
      result.error || "Error al obtener ventas por rango de fechas"
    );
  } catch (error) {
    console.error("Error al obtener ventas por rango de fechas:", error);
    throw error;
  }
};

export const generateSaleDocument = async (saleId, documentType) => {
  try {
    const result = await EdgeFunctions.sales.generateDocument(saleId);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al generar documento de venta");
  } catch (error) {
    console.error("Error al generar documento de venta:", error);
    throw error;
  }
};

// Función para actualizar el inventario después de una venta
export const updateInventoryQuantities = async (productsData) => {
  try {
    const result = await EdgeFunctions.sales.updateInventory(productsData);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al actualizar el inventario");
  } catch (error) {
    console.error("Error al actualizar el inventario:", error);
    throw error;
  }
};

// Función para verificar si existe un cierre diario para una fecha
export const checkDailyClosure = async (formattedDate) => {
  try {
    const result = await EdgeFunctions.sales.checkDailyClosure();
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al verificar el cierre diario");
  } catch (error) {
    handleFetchError(error, "verificar el cierre diario");
  }
};
