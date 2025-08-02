import { EdgeFunctions } from "../../config/supabase";
import TokenStorage from "./storage/tokenStorage";

export const getSettingById = async (id) => {
  try {
    const token = await TokenStorage.getToken();

    if (!token) {
      console.error("[Settings] No hay token disponible para obtener settings");
      throw new Error("No hay token disponible");
    }

    const result = await EdgeFunctions.settings.getById(id);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al obtener configuración");
  } catch (error) {
    console.error("[Settings] Error en getSettingById:", {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

export const createSetting = async (settingData) => {
  try {
    const result = await EdgeFunctions.settings.create(settingData);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al crear el ajuste");
  } catch (error) {
    console.error("Error al crear el ajuste:", error);
    throw error;
  }
};

export const updateSetting = async (id, data) => {
  try {
    const token = await TokenStorage.getToken();

    if (!token) {
      console.error(
        "[Settings] No hay token disponible para actualizar settings"
      );
      throw new Error("No hay token disponible");
    }

    const result = await EdgeFunctions.settings.update(id, data);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al actualizar configuración");
  } catch (error) {
    console.error("[Settings] Error en updateSettings:", {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};
