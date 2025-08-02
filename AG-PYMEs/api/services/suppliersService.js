import { EdgeFunctions } from "../../config/supabase";

const requiredFields = ["nombre_proveedor", "cif", "direccion_fiscal"];

export const getSuppliers = async () => {
  try {
    const result = await EdgeFunctions.suppliers.getAll();
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al obtener proveedores");
  } catch (error) {
    handleServiceError(error, "suppliers");
    throw error;
  }
};

export const getSupplierById = async (id) => {
  try {
    const result = await EdgeFunctions.suppliers.getById(id);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al obtener proveedor");
  } catch (error) {
    handleServiceError(error, "supplier");
    throw error;
  }
};

export const createSupplier = async (supplierData) => {
  try {
    validateRequiredFields(supplierData);

    const body = {
      ...supplierData,
      moneda: supplierData.moneda || "EUR", // EUR por defecto
      activo: supplierData.activo ?? true,
    };

    const result = await EdgeFunctions.suppliers.create(body);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al crear proveedor");
  } catch (error) {
    handleServiceError(error, "create supplier");
    throw error;
  }
};

export const updateSupplier = async (id, supplierData) => {
  try {
    validateRequiredFields(supplierData);
    const result = await EdgeFunctions.suppliers.update(id, supplierData);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al actualizar proveedor");
  } catch (error) {
    handleServiceError(error, "update supplier");
    throw error;
  }
};

export const deleteSupplier = async (id) => {
  try {
    const result = await EdgeFunctions.suppliers.delete(id);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al eliminar proveedor");
  } catch (error) {
    handleServiceError(error, "delete supplier");
    throw error;
  }
};

const validateRequiredFields = (data) => {
  const missingFields = requiredFields.filter((field) => !data[field]);
  if (missingFields.length > 0) {
    throw new Error(`Campos requeridos faltantes: ${missingFields.join(", ")}`);
  }
};

const handleServiceError = (error, context) => {
  console.error(`Error en ${context}:`, error);
  throw error.message.startsWith("Campos requeridos")
    ? error
    : new Error(`Error de conexión: ${error.message}`);
};
