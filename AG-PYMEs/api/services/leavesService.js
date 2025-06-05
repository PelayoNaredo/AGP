import { httpFetch } from "../http";
import { leavesEndpoint } from "../endpoints";

export const getLeaves = async () => {
  try {
    const response = await httpFetch(leavesEndpoint.base());
    if (!response) return [];
    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error("Error al obtener las bajas:", error);
    return [];
  }
};

export const getLeaveById = async (id) => {
  try {
    return await httpFetch(leavesEndpoint.byId(id));
  } catch (error) {
    console.error("Error al obtener la baja:", error);
    throw error;
  }
};

export const createLeave = async (leaveData) => {
  try {
    // No hacer JSON.stringify aquí, httpFetch lo hará
    const response = await httpFetch(leavesEndpoint.base(), {
      method: "POST",
      body: leaveData,
    });
    return response;
  } catch (error) {
    console.error("Error al crear la baja:", error);
    throw new Error("No se pudo crear la baja");
  }
};

export const updateLeave = async (id, leaveData) => {
  try {
    // Validar datos antes de enviar
    if (!leaveData.tipo_baja || !leaveData.fecha_inicio) {
      throw new Error("Campos requeridos faltantes");
    }

    // Convertir fechas a formato ISO
    const formattedData = {
      ...leaveData,
      fecha_inicio: new Date(leaveData.fecha_inicio)
        .toISOString()
        .split("T")[0],
      fecha_fin: leaveData.fecha_fin
        ? new Date(leaveData.fecha_fin).toISOString().split("T")[0]
        : null,
    };

    const response = await httpFetch(leavesEndpoint.byId(id), {
      method: "PUT",
      body: formattedData, // No hacer JSON.stringify aquí
    });

    return response;
  } catch (error) {
    console.error("Error al actualizar la baja:", error);
    throw new Error(error.message || "No se pudo actualizar la baja");
  }
};

export const deleteLeave = async (id) => {
  try {
    return await httpFetch(leavesEndpoint.byId(id), {
      method: "DELETE",
    });
  } catch (error) {
    console.error("Error al eliminar la baja:", error);
    throw error;
  }
};
