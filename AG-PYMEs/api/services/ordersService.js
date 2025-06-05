import { httpFetch } from "../http";
import { ordersEndpoint } from "../endpoints";

export const getAllOrders = async () => {
  try {
    return await httpFetch(ordersEndpoint.base());
  } catch (error) {
    console.error("Error al obtener las órdenes:", error);
    throw error;
  }
};

export const getOrderById = async (id) => {
  try {
    return await httpFetch(ordersEndpoint.byId(id));
  } catch (error) {
    console.error("Error al obtener la orden:", error);
    throw error;
  }
};

export const createOrder = async (orderData) => {
  try {
    return await httpFetch(ordersEndpoint.base(), {
      method: "POST",
      body: orderData,
    });
  } catch (error) {
    console.error("Error al crear la orden:", error);
    throw error;
  }
};

export const updateOrder = async (id, orderData) => {
  try {
    return await httpFetch(ordersEndpoint.byId(id), {
      method: "PUT",
      body: orderData,
    });
  } catch (error) {
    console.error("Error al actualizar la orden:", error);
    throw error;
  }
};

export const deleteOrder = async (id) => {
  try {
    return await httpFetch(ordersEndpoint.byId(id), {
      method: "DELETE",
    });
  } catch (error) {
    console.error("Error al eliminar la orden:", error);
    throw error;
  }
};
