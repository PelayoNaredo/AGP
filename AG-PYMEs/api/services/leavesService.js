import { EdgeFunctions } from "../../config/supabase";

export const getLeaves = async () => {
  try {
    const result = await EdgeFunctions.leaves.getAll();
    if (result.success) {
      return Array.isArray(result.data) ? result.data : [];
    }
    return [];
  } catch (error) {
    console.error("Error al obtener las bajas:", error);
    return [];
  }
};

export const getLeaveById = async (id) => {
  try {
    const result = await EdgeFunctions.leaves.getById(id);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al obtener la baja");
  } catch (error) {
    console.error("Error al obtener la baja:", error);
    throw error;
  }
};

export const createLeave = async (leaveData) => {
  try {
    const result = await EdgeFunctions.leaves.create(leaveData);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al crear la baja");
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

    const result = await EdgeFunctions.leaves.update(id, formattedData);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al actualizar la baja");
  } catch (error) {
    console.error("Error al actualizar la baja:", error);
    throw new Error(error.message || "No se pudo actualizar la baja");
  }
};

export const deleteLeave = async (id) => {
  try {
    const result = await EdgeFunctions.leaves.delete(id);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al eliminar la baja");
  } catch (error) {
    console.error("Error al eliminar la baja:", error);
    throw error;
  }
};
