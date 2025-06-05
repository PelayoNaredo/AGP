import { httpFetch } from "../http";
import { orderDetailsEndpoint } from "../endpoints";

export const getAllOrderDetails = async () => {
  try {
    return await httpFetch(orderDetailsEndpoint.base());
  } catch (error) {
    console.error("Error al obtener los detalles de la orden:", error);
    throw error;
  }
};

export const getOrderDetailById = async (id) => {
  try {
    return await httpFetch(orderDetailsEndpoint.byId(id));
  } catch (error) {
    console.error("Error al obtener el detalle de la orden:", error);
    throw error;
  }
};

export const createOrderDetail = async (orderDetailData) => {
  try {
    return await httpFetch(orderDetailsEndpoint.base(), {
      method: "POST",
      body: orderDetailData,
    });
  } catch (error) {
    console.error("Error al crear el detalle de la orden:", error);
    throw error;
  }
};

export const updateOrderDetail = async (id, orderDetailData) => {
  try {
    return await httpFetch(orderDetailsEndpoint.byId(id), {
      method: "PUT",
      body: orderDetailData,
    });
  } catch (error) {
    console.error("Error al actualizar el detalle de la orden:", error);
    throw error;
  }
};

export const deleteOrderDetail = async (id) => {
  try {
    return await httpFetch(orderDetailsEndpoint.byId(id), {
      method: "DELETE",
    });
  } catch (error) {
    console.error("Error al eliminar el detalle de la orden:", error);
    throw error;
  }
};
