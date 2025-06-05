import { httpFetch } from "../http";
import { productCodesEndpoint } from "../endpoints";

export const getAllProductCodes = async () => {
  try {
    return await httpFetch(productCodesEndpoint.base());
  } catch (error) {
    console.error("Error al obtener los códigos de productos:", error);
    throw error;
  }
};

export const getProductCodeById = async (id) => {
  try {
    return await httpFetch(productCodesEndpoint.byId(id));
  } catch (error) {
    console.error("Error al obtener el código de producto:", error);
    throw error;
  }
};

export const getProductCodesByProduct = async (productId) => {
  try {
    return await httpFetch(productCodesEndpoint.byProduct(productId));
  } catch (error) {
    console.error("Error al obtener códigos del producto:", error);
    throw error;
  }
};

export const createProductCode = async (codeData) => {
  try {
    return await httpFetch(productCodesEndpoint.base(), {
      method: "POST",
      body: codeData,
    });
  } catch (error) {
    console.error("Error al crear el código de producto:", error);
    throw error;
  }
};

export const updateProductCode = async (id, codeData) => {
  try {
    return await httpFetch(productCodesEndpoint.byId(id), {
      method: "PUT",
      body: codeData,
    });
  } catch (error) {
    console.error("Error al actualizar el código de producto:", error);
    throw error;
  }
};

export const deleteProductCode = async (id) => {
  try {
    return await httpFetch(productCodesEndpoint.byId(id), {
      method: "DELETE",
    });
  } catch (error) {
    console.error("Error al eliminar el código de producto:", error);
    throw error;
  }
};

export const scanProductCode = async (codeValue) => {
  try {
    return await httpFetch(productCodesEndpoint.scan(), {
      method: "POST",
      body: { codigo: codeValue },
    });
  } catch (error) {
    console.error("Error al escanear el código de producto:", error);
    throw error;
  }
};
