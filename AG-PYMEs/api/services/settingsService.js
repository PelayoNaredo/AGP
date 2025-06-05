import { settingsEndpoint } from "../endpoints";
import { httpFetch } from "../http";
import TokenStorage from "./storage/tokenStorage";

export const getSettingById = async (id) => {
  try {
    const token = await TokenStorage.getToken();

    if (!token) {
      console.error("[Settings] No hay token disponible para obtener settings");
      throw new Error("No hay token disponible");
    }

    const response = await httpFetch(settingsEndpoint.byId(id));

    return response;
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
    return await httpFetch(settingsEndpoint.base(), {
      method: "POST",
      body: settingData,
    });
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

    const response = await httpFetch(settingsEndpoint.byId(id), {
      method: "PUT",
      body: data,
    });

    return response;
  } catch (error) {
    console.error("[Settings] Error en updateSettings:", {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};
