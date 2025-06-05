import { httpFetch } from "../http";
import { inventoryEndpoint } from "../endpoints";

export const getAllInventory = async () => {
  try {
    return await httpFetch(inventoryEndpoint.base());
  } catch (error) {
    console.error("Error al obtener el inventario:", error);
    throw error;
  }
};

export const getProductById = async (id) => {
  try {
    return await httpFetch(inventoryEndpoint.byId(id));
  } catch (error) {
    console.error("Error al obtener el producto:", error);
    throw error;
  }
};

export const createProduct = async (productData) => {
  try {
    return await httpFetch(inventoryEndpoint.base(), {
      method: "POST",
      body: productData,
    });
  } catch (error) {
    console.error("Error al crear el producto:", error);
    throw error;
  }
};

export const updateProduct = async (id, productData) => {
  try {
    return await httpFetch(inventoryEndpoint.byId(id), {
      method: "PUT",
      body: productData,
    });
  } catch (error) {
    console.error("Error al actualizar el producto:", error);
    throw error;
  }
};

export const deleteProduct = async (id) => {
  try {
    return await httpFetch(inventoryEndpoint.byId(id), {
      method: "DELETE",
    });
  } catch (error) {
    console.error("Error al eliminar el producto:", error);
    throw error;
  }
};
