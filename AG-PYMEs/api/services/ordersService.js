import { EdgeFunctions } from "../../config/supabase";

export const getAllOrders = async () => {
  try {
    const result = await EdgeFunctions.orders.getAll();
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al obtener las órdenes");
  } catch (error) {
    console.error("Error al obtener las órdenes:", error);
    throw error;
  }
};

export const getOrderById = async (id) => {
  try {
    const result = await EdgeFunctions.orders.getById(id);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al obtener la orden");
  } catch (error) {
    console.error("Error al obtener la orden:", error);
    throw error;
  }
};

export const createOrder = async (orderData) => {
  try {
    const result = await EdgeFunctions.orders.create(orderData);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al crear la orden");
  } catch (error) {
    console.error("Error al crear la orden:", error);
    throw error;
  }
};

export const updateOrder = async (id, orderData) => {
  try {
    const result = await EdgeFunctions.orders.update(id, orderData);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al actualizar la orden");
  } catch (error) {
    console.error("Error al actualizar la orden:", error);
    throw error;
  }
};

export const deleteOrder = async (id) => {
  try {
    const result = await EdgeFunctions.orders.delete(id);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al eliminar la orden");
  } catch (error) {
    console.error("Error al eliminar la orden:", error);
    throw error;
  }
};
