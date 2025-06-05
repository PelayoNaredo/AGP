import { Platform } from "react-native";
import { httpFetch } from "../../../api/http";
import { TokenStorage } from "../storage";
import { normalizeImageUrl } from "./urls";

//Módulo para manejo de descarga y carga de archivos
export const loadImage = async (imageUrl) => {
  if (!imageUrl) return null;

  // Obtener token para autenticación
  const token = await TokenStorage.getToken();
  if (!token) {
    console.warn(
      "[FileDownload] No hay token disponible para cargar la imagen"
    );
  }

  const normalizedUrl = normalizeImageUrl(imageUrl);

  // Añadir timestamp para evitar caché
  const timestamp = Date.now();
  const urlWithNoCache = `${normalizedUrl}${normalizedUrl.includes("?") ? "&" : "?"}nocache=${timestamp}`;

  const headers = {
    "ngrok-skip-browser-warning": "true",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    // Crear una promesa para cargar la imagen
    return new Promise((resolve, reject) => {
      if (Platform.OS === "web") {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Error cargando imagen"));

        // Configurar headers solo para solicitudes fetch, las imágenes no pueden usar custom headers
        // Por eso usamos un enfoque diferente para imágenes con autenticación en web
        img.crossOrigin = "anonymous";
        img.src = urlWithNoCache;
      } else {
        // En móvil, devolvemos la URL para que Image de React Native la use
        resolve({ uri: urlWithNoCache, headers });
      }
    });
  } catch (error) {
    console.error("[FileDownload] Error cargando imagen:", error);
    throw error;
  }
};

//Descarga un archivo del servidor
export const downloadFile = async (url, options = {}) => {
  try {
    if (!url) {
      throw new Error("URL no válida para la descarga");
    }

    // Primero, asegurarse de que tenemos una URL en formato string
    let fileUrl =
      typeof url === "object"
        ? url.uri || url.url || url.path || JSON.stringify(url)
        : String(url);

    // Normalizar la URL (ahora normalizeImageUrl siempre devuelve una string, no una promesa)
    let requestUrl = normalizeImageUrl(fileUrl);

    // Si necesitamos una URL firmada y no tenemos una, obtenerla
    const needsSignedUrl = options.secure || options.download;
    const isSignedUrl =
      typeof requestUrl === "string" && requestUrl.includes("signature=");

    if (needsSignedUrl && !isSignedUrl) {
      try {
        // Extraer el nombre del archivo de la URL
        const filename = requestUrl.split("/").pop().split("?")[0];
        // Intentar obtener una URL firmada
        const { createSignedImageUrl } = await import("./urls");
        const signedUrl = await createSignedImageUrl(filename);
        if (signedUrl && typeof signedUrl === "string") {
          requestUrl = signedUrl;
        }
      } catch (signError) {
        console.warn(
          "[FileDownload] No se pudo obtener URL firmada:",
          signError
        );
        // Continuamos con la URL sin firma
      }
    }

    // Añadir timestamp para evitar caché
    const timestamp = new Date().getTime();
    let urlWithCache = `${requestUrl}${typeof requestUrl === "string" && requestUrl.includes("?") ? "&" : "?"}t=${timestamp}`;

    // Si es una descarga (no solo vista previa), añadir parámetro
    if (options.download) {
      urlWithCache += `&download=true`;
    }

    // Usar httpFetch con isUpload=true para evitar Content-Type: application/json
    return await httpFetch(urlWithCache, {
      method: "GET",
      isUpload: true,
      ...options,
    });
  } catch (error) {
    console.error("[FileDownload] Error descargando archivo:", error);
    throw error;
  }
};

export default {
  loadImage,
  downloadFile,
};
