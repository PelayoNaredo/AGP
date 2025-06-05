import { httpFetch } from "../http";
import { alertsEndpoint } from "../endpoints";

export const getAlerts = async () => {
  try {
    return await httpFetch(alertsEndpoint.base());
  } catch (error) {
    console.error("Error al obtener las alertas:", error);
    throw error;
  }
};

export const getAlertById = async (id) => {
  try {
    return await httpFetch(alertsEndpoint.byId(id));
  } catch (error) {
    console.error("Error al obtener la alerta:", error);
    throw error;
  }
};

export const createAlert = async (alertData) => {
  try {
    return await httpFetch(alertsEndpoint.base(), {
      method: "POST",
      body: alertData,
    });
  } catch (error) {
    console.error("Error al crear la alerta:", error);
    throw error;
  }
};

export const updateAlert = async (id, alertData) => {
  try {
    return await httpFetch(alertsEndpoint.byId(id), {
      method: "PUT",
      body: alertData,
    });
  } catch (error) {
    console.error("Error al actualizar la alerta:", error);
    throw error;
  }
};

export const deleteAlert = async (id) => {
  try {
    return await httpFetch(alertsEndpoint.byId(id), {
      method: "DELETE",
    });
  } catch (error) {
    console.error("Error al eliminar la alerta:", error);
    throw error;
  }
};
