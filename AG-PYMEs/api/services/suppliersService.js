import { httpFetch } from "../http";
import { suppliersEndpoint } from "../endpoints";

const requiredFields = ["nombre_proveedor", "cif", "direccion_fiscal"];

export const getSuppliers = async () => {
  try {
    return await httpFetch(suppliersEndpoint.base());
  } catch (error) {
    handleServiceError(error, "suppliers");
    throw error;
  }
};

export const getSupplierById = async (id) => {
  try {
    return await httpFetch(suppliersEndpoint.byId(id));
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

    return await httpFetch(suppliersEndpoint.base(), {
      method: "POST",
      body: body,
    });
  } catch (error) {
    handleServiceError(error, "create supplier");
    throw error;
  }
};

export const updateSupplier = async (id, supplierData) => {
  try {
    validateRequiredFields(supplierData);
    return await httpFetch(suppliersEndpoint.byId(id), {
      method: "PUT",
      body: supplierData,
    });
  } catch (error) {
    handleServiceError(error, "update supplier");
    throw error;
  }
};

export const deleteSupplier = async (id) => {
  try {
    return await httpFetch(suppliersEndpoint.byId(id), {
      method: "DELETE",
    });
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
