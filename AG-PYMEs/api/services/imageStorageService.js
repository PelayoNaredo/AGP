import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import { httpFetch, getHeaders } from "../http";
import { defaultHeaders, fileUploadHeaders } from "../defaults";
import tokenStorage from "./tokenStorage";
import { NGROK_HOST } from "@env";

const IMAGE_DIR = `${FileSystem.documentDirectory}images/`;

// Función para verificar si estamos en web
const isWeb = Platform.OS === "web";

// Crear directorio si no existe (solo para móvil)
const ensureDirExists = async () => {
  if (isWeb) return;

  const dirInfo = await FileSystem.getInfoAsync(IMAGE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(IMAGE_DIR, { intermediates: true });
  }
};

export const saveImageLocally = async (imageUrl, filename) => {  try {
    if (isWeb) {
      // Para web, primero verificamos que la URL sea accesible usando httpFetch
      // que ya maneja los headers y token de autorización automáticamente
      try {
        // Solo verificamos que la URL sea accesible, no necesitamos el contenido
        if (imageUrl.startsWith('http')) {
          await httpFetch(imageUrl, { method: 'HEAD' });
        }
      } catch (error) {
        console.warn("[DEBUG] No se pudo verificar la URL de imagen:", error);
        // Continuamos de todos modos ya que podría ser un problema temporal
      }
      
      // En web, guardamos la URL en localStorage
      const imageData = {
        url: imageUrl,
        timestamp: new Date().getTime(),
      };
      localStorage.setItem(`image_${filename}`, JSON.stringify(imageData));
      return imageUrl;
    }

    await ensureDirExists();

    const localUri = `${IMAGE_DIR}${filename}`;
    const fileInfo = await FileSystem.getInfoAsync(localUri);

    if (fileInfo.exists) {
      return localUri;
    }    // Obtenemos los headers predefinidos y los adaptamos para la descarga de imágenes
    const token = await tokenStorage.getToken();
    const headers = {
      ...fileUploadHeaders, // Usamos fileUploadHeaders que no incluye Content-Type: application/json
      "Access-Control-Allow-Origin": "*",
    };
    
    // Añadimos el token de autorización si existe
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    const downloadResult = await FileSystem.downloadAsync(imageUrl, localUri, {
      headers,
    });

    return downloadResult.uri;
  } catch (error) {
    console.error("[DEBUG] Error al guardar imagen localmente:", error);
    return imageUrl;
  }
};

export const getLocalImage = async (filename) => {
  try {
    if (isWeb) {
      const imageData = localStorage.getItem(`image_${filename}`);
      if (imageData) {
        const { url } = JSON.parse(imageData);
        return url;
      }
      return null;
    }

    await ensureDirExists();
    const localUri = `${IMAGE_DIR}${filename}`;
    const fileInfo = await FileSystem.getInfoAsync(localUri);

    if (fileInfo.exists) {
      return localUri;
    }
    return null;
  } catch (error) {
    console.error("[DEBUG] Error al obtener imagen local:", error);
    return null;
  }
};

export const clearImageCache = async () => {
  try {
    if (isWeb) {
      // Limpiar todas las imágenes del localStorage
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("image_")) {
          localStorage.removeItem(key);
        }
      });
      return;
    }

    await ensureDirExists();
    await FileSystem.deleteAsync(IMAGE_DIR, { idempotent: true });
    await FileSystem.makeDirectoryAsync(IMAGE_DIR, { intermediates: true });
  } catch (error) {
    console.error("[DEBUG] Error al limpiar caché de imágenes:", error);
  }
};

// Nueva función para obtener una imagen utilizando httpFetch
// Útil cuando necesitamos verificar si una imagen es accesible o realizar
// solicitudes que requieran autenticación
export const fetchImage = async (imageUrl) => {
  try {
    // Verificamos si la URL ya incluye el dominio
    const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${NGROK_HOST || "http://localhost:3001"}${imageUrl}`;
    
    // Utilizamos httpFetch con isUpload=true para no incluir Content-Type: application/json
    // que podría causar problemas al solicitar imágenes
    const response = await httpFetch(fullUrl, { isUpload: true });
    return response;
  } catch (error) {
    console.error("[DEBUG] Error al obtener imagen con httpFetch:", error);
    throw error;
  }
};
