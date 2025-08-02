import { EdgeFunctions } from "../../config/supabase";

export const getAllInventory = async () => {
  try {
    const result = await EdgeFunctions.inventory.getAll();

    if (result.success) {
      return Array.isArray(result.data) ? result.data : [];
    } else {
      throw new Error(result.error || "Error obteniendo inventario");
    }
  } catch (error) {
    console.error(
      "Error al obtener el inventario desde Edge Functions:",
      error
    );
    throw error;
  }
};

export const getProductById = async (id) => {
  try {
    const result = await EdgeFunctions.inventory.getById(id);

    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error || "Error obteniendo producto");
    }
  } catch (error) {
    console.error("Error al obtener el producto desde Edge Functions:", error);
    throw error;
  }
};

export const createProduct = async (productData) => {
  try {
    const result = await EdgeFunctions.inventory.create(productData);

    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error || "Error creando producto");
    }
  } catch (error) {
    console.error("Error al crear el producto con Edge Functions:", error);
    throw error;
  }
};

export const updateProduct = async (id, productData) => {
  try {
    const result = await EdgeFunctions.inventory.update(id, productData);

    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error || "Error actualizando producto");
    }
  } catch (error) {
    console.error("Error al actualizar el producto con Edge Functions:", error);
    throw error;
  }
};

export const deleteProduct = async (id) => {
  try {
    const result = await EdgeFunctions.inventory.delete(id);

    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error || "Error eliminando producto");
    }
  } catch (error) {
    console.error("Error al eliminar el producto con Edge Functions:", error);
    throw error;
  }
};
