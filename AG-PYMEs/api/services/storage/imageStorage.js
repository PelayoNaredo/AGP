import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import BaseStorage from "./baseStorage";

//Servicio de almacenamiento de imágenes

const isWeb = Platform.OS === "web";
const IMAGE_STORAGE_PREFIX = "image_";
const IMAGE_DIR = `${FileSystem.documentDirectory}images/`;

const ImageStorage = {
  //Verifica que existe el directorio de imágenes
  async ensureDirExists() {
    if (isWeb) return Promise.resolve();

    const dirInfo = await FileSystem.getInfoAsync(IMAGE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(IMAGE_DIR, { intermediates: true });
    }
  },

  //Guarda una imagen localmente
  async saveImage(imageUrl, filename, options = {}) {
    try {
      if (isWeb) {
        // En web, guardamos la URL en localStorage mediante BaseStorage
        const imageData = {
          url: imageUrl,
          timestamp: Date.now(),
          ...options,
        };

        await BaseStorage.setItem(
          `${IMAGE_STORAGE_PREFIX}${filename}`,
          imageData
        );
        return imageUrl;
      }

      // En móvil, guardamos el archivo en FileSystem
      await this.ensureDirExists();
      const localUri = `${IMAGE_DIR}${filename}`;

      // Verificar si ya existe
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      if (fileInfo.exists) {
        return localUri;
      }

      // Descargar imagen
      const downloadResult = await FileSystem.downloadAsync(
        imageUrl,
        localUri,
        options.headers || {}
      );
      return downloadResult.uri;
    } catch (error) {
      console.error(
        "[ImageStorage] Error al guardar imagen localmente:",
        error
      );
      return imageUrl; // Devolver URL original como fallback
    }
  },

  //Obtiene una imagen local por su nombre
  async getImage(filename) {
    try {
      if (isWeb) {
        // Obtener de localStorage
        const imageData = await BaseStorage.getItem(
          `${IMAGE_STORAGE_PREFIX}${filename}`
        );
        return imageData?.url || null;
      }

      // En móvil, verificar en FileSystem
      await this.ensureDirExists();
      const localUri = `${IMAGE_DIR}${filename}`;

      const fileInfo = await FileSystem.getInfoAsync(localUri);
      return fileInfo.exists ? localUri : null;
    } catch (error) {
      console.error("[ImageStorage] Error al obtener imagen local:", error);
      return null;
    }
  },

  //Limpia la caché de imágenes
  async clearCache() {
    try {
      if (isWeb) {
        // En web, limpiamos las entradas en localStorage que empiezan por el prefijo
        // Necesitamos iterar todas las claves y eliminar las que corresponden a imágenes
        const allKeys = Object.keys(localStorage);
        const imageKeys = allKeys.filter((key) =>
          key.startsWith(IMAGE_STORAGE_PREFIX)
        );

        for (const key of imageKeys) {
          await BaseStorage.removeItem(key);
        }
      } else {
        // En móvil, eliminar y recrear el directorio
        await this.ensureDirExists();
        await FileSystem.deleteAsync(IMAGE_DIR, { idempotent: true });
        await FileSystem.makeDirectoryAsync(IMAGE_DIR, { intermediates: true });
      }
    } catch (error) {
      console.error(
        "[ImageStorage] Error al limpiar caché de imágenes:",
        error
      );
      throw error;
    }
  },

  //Elimina una imagen específica de la caché
  async removeImage(filename) {
    try {
      if (isWeb) {
        await BaseStorage.removeItem(`${IMAGE_STORAGE_PREFIX}${filename}`);
      } else {
        const localUri = `${IMAGE_DIR}${filename}`;
        const fileInfo = await FileSystem.getInfoAsync(localUri);

        if (fileInfo.exists) {
          await FileSystem.deleteAsync(localUri, { idempotent: true });
        }
      }

      return true;
    } catch (error) {
      console.error("[ImageStorage] Error al eliminar imagen:", error);
      return false;
    }
  },
};

export default ImageStorage;
