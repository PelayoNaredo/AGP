import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const isWeb = Platform.OS === "web";

const StorageService = {
  async setItem(key, value) {
    try {
      // Convertir objetos a JSON si es necesario
      const valueToStore =
        typeof value !== "string" ? JSON.stringify(value) : value;
      if (isWeb) {
        localStorage.setItem(key, valueToStore);
      } else {
        await AsyncStorage.setItem(key, valueToStore);
      }
    } catch (error) {
      console.error(`Error al guardar ${key}:`, error);
      throw error;
    }
  },
  async getItem(key) {
    try {
      let value;
      if (isWeb) {
        value = localStorage.getItem(key);
      } else {
        value = await AsyncStorage.getItem(key);
      }
      // Intentar parsear como JSON si es posible
      if (value) {
        try {
          return JSON.parse(value);
        } catch (e) {
          // Si no es JSON, devolver el valor original
          return value;
        }
      }
      return null;
    } catch (error) {
      console.error(`Error al obtener ${key}:`, error);
      return null;
    }
  },
  async removeItem(key) {
    try {
      if (isWeb) {
        localStorage.removeItem(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error al eliminar ${key}:`, error);
      throw error;
    }
  },
};

export default StorageService;
