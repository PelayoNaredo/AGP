import { EdgeFunctions } from "../../config/supabase";

export const getAllOrderDetails = async () => {
  try {
    const result = await EdgeFunctions.orderDetails.getAll();
    if (result.success) {
      return result.data;
    }
    throw new Error(
      result.error || "Error al obtener los detalles de la orden"
    );
  } catch (error) {
    console.error("Error al obtener los detalles de la orden:", error);
    throw error;
  }
};

export const getOrderDetailById = async (id) => {
  try {
    const result = await EdgeFunctions.orderDetails.getById(id);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al obtener el detalle de la orden");
  } catch (error) {
    console.error("Error al obtener el detalle de la orden:", error);
    throw error;
  }
};

export const createOrderDetail = async (orderDetailData) => {
  try {
    const result = await EdgeFunctions.orderDetails.create(orderDetailData);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al crear el detalle de la orden");
  } catch (error) {
    console.error("Error al crear el detalle de la orden:", error);
    throw error;
  }
};

export const updateOrderDetail = async (id, orderDetailData) => {
  try {
    const result = await EdgeFunctions.orderDetails.update(id, orderDetailData);
    if (result.success) {
      return result.data;
    }
    throw new Error(
      result.error || "Error al actualizar el detalle de la orden"
    );
  } catch (error) {
    console.error("Error al actualizar el detalle de la orden:", error);
    throw error;
  }
};

export const deleteOrderDetail = async (id) => {
  try {
    const result = await EdgeFunctions.orderDetails.delete(id);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al eliminar el detalle de la orden");
  } catch (error) {
    console.error("Error al eliminar el detalle de la orden:", error);
    throw error;
  }
};
