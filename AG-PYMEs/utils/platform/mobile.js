// tests/utils/platform/mobile.js
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Utilidades para almacenamiento móvil
const storage = {
  setItem: async (key, value) => {
    try {
      const serialized =
        typeof value !== "string" ? JSON.stringify(value) : value;
      await AsyncStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error("[MobileAdapter] Error guardando en AsyncStorage:", error);
      return false;
    }
  },

  getItem: async (key) => {
    try {
      const item = await AsyncStorage.getItem(key);
      if (!item) return null;

      try {
        return JSON.parse(item);
      } catch {
        return item;
      }
    } catch (error) {
      console.error("[MobileAdapter] Error leyendo de AsyncStorage:", error);
      return null;
    }
  },

  removeItem: async (key) => {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error("[MobileAdapter] Error eliminando de AsyncStorage:", error);
      return false;
    }
  },
};

// Utilidades para manejo de archivos móviles
const fileSystem = {
  ensureDirExists: async (directory) => {
    try {
      const dirInfo = await FileSystem.getInfoAsync(directory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
      }
      return true;
    } catch (error) {
      console.error("[MobileAdapter] Error creando directorio:", error);
      return false;
    }
  },

  downloadFile: async (remoteUri, localUri, options = {}) => {
    try {
      const downloadResult = await FileSystem.downloadAsync(
        remoteUri,
        localUri,
        options.headers || {}
      );
      return downloadResult.uri;
    } catch (error) {
      console.error("[MobileAdapter] Error descargando archivo:", error);
      throw error;
    }
  },

  readAsBase64: async (uri) => {
    try {
      return await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    } catch (error) {
      console.error(
        "[MobileAdapter] Error leyendo archivo como Base64:",
        error
      );
      throw error;
    }
  },

  deleteFile: async (uri) => {
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
      return true;
    } catch (error) {
      console.error("[MobileAdapter] Error eliminando archivo:", error);
      return false;
    }
  },
};

// Utilidades para UI móvil
const ui = {
  isTablet: () => {
    const { width, height } = Dimensions.get("window");
    const aspectRatio = width / height;
    return width >= 600 && aspectRatio >= 0.7 && aspectRatio <= 1.3;
  },

  isLandscape: () => {
    const { width, height } = Dimensions.get("window");
    return width > height;
  },

  adaptSizeToDevice: (size) => {
    const isIOS = Platform.OS === "ios";
    const tablet = ui.isTablet();

    // Factor de escala según dispositivo
    const scaleFactor = isIOS ? (tablet ? 1.2 : 1) : tablet ? 1.3 : 1.1;

    return size * scaleFactor;
  },
};

// Exportación del adaptador completo
export default {
  storage,
  fileSystem,
  ui,
};
