import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

//Servicio base de almacenamiento

const isWeb = Platform.OS === "web";

const BaseStorage = {
  //Guarda un valor en el almacenamiento
  async setItem(key, value) {
    try {
      // Convertir objetos a JSON si es necesario
      const valueToStore =
        typeof value !== "string" ? JSON.stringify(value) : value;

      if (isWeb) {
        localStorage.setItem(key, valueToStore);
        return Promise.resolve();
      } else {
        return await AsyncStorage.setItem(key, valueToStore);
      }
    } catch (error) {
      console.error(`[BaseStorage] Error al guardar ${key}:`, error);
      throw error;
    }
  },

  //Obtiene un valor del almacenamiento

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
      console.error(`[BaseStorage] Error al obtener ${key}:`, error);
      return null;
    }
  },

  //Elimina un valor del almacenamiento
  async removeItem(key) {
    try {
      if (isWeb) {
        localStorage.removeItem(key);
        return Promise.resolve();
      } else {
        return await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`[BaseStorage] Error al eliminar ${key}:`, error);
      throw error;
    }
  },

  //Verifica si existe una clave en el almacenamiento
  async hasItem(key) {
    try {
      const value = await this.getItem(key);
      return value !== null;
    } catch (error) {
      console.error(`[BaseStorage] Error al verificar ${key}:`, error);
      return false;
    }
  },

  //Limpia todo el almacenamiento
  async clear() {
    try {
      if (isWeb) {
        localStorage.clear();
        return Promise.resolve();
      } else {
        return await AsyncStorage.clear();
      }
    } catch (error) {
      console.error(`[BaseStorage] Error al limpiar almacenamiento:`, error);
      throw error;
    }
  },
};

export default BaseStorage;
