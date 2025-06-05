import { httpFetch } from "../../../api/http";
import { TokenStorage } from "../storage";
import { NGROK_HOST } from "@env";

//Módulo para manejo de URLs de archivos y firmas

//Normaliza la URL de una imagen para asegurar formato correcto
// Nota: Esta versión NO necesita async/await y devuelve una URL directa en lugar de una promesa
export const normalizeImageUrl = (url) => {
  if (!url) {
    console.warn("[FileUrlService] Se intentó normalizar una URL vacía");
    return ""; // Devolvemos cadena vacía en lugar de null
  }

  try {
    // Convertir a string en caso de que recibamos un objeto
    const urlStr =
      typeof url === "object"
        ? url.uri || url.url || url.path || url.name || JSON.stringify(url)
        : String(url);

    const baseUrl = NGROK_HOST || "http://localhost:3001";

    // Si ya es una URL completa, la devolvemos
    if (urlStr.startsWith("http")) {
      return urlStr;
    }

    // Si es una ruta relativa, la completamos
    if (urlStr.startsWith("/")) {
      return `${baseUrl}${urlStr}`;
    }

    // Para cualquier otro caso, devolvemos una URL directa al endpoint de media
    // en lugar de usar createSignedImageUrl (que es async y devuelve una promesa)
    return `${baseUrl}/api/media/${urlStr}`;
  } catch (error) {
    console.error("[FileUrlService] Error normalizando URL:", error);
    // Devolver la URL original convertida a string en vez de un posible objeto
    return typeof url === "string" ? url : "";
  }
};

//Crea una URL firmada para acceder a imágenes protegidas
export const createSignedImageUrl = async (filename, baseUrl = null) => {
  try {
    if (!filename) {
      return null;
    }

    // Procesar diferentes formatos de entrada para obtener nombre de archivo
    let filenameOnly = filename;

    // Si es una cadena con ruta, extraer el nombre
    if (typeof filename === "string" && filename.includes("/")) {
      const parts = filename.split("/");
      filenameOnly = parts[parts.length - 1];
    }

    // Si el objeto tiene una propiedad name, usarla
    if (typeof filename === "object" && filename.name) {
      filenameOnly = filename.name;
    }

    // Si es una ruta o URI completa con nombre de archivo, extraer solo el nombre
    if (typeof filename === "object" && filename.uri) {
      const uriParts = filename.uri.split("/");
      filenameOnly = uriParts[uriParts.length - 1];
    }

    const base = baseUrl || NGROK_HOST || "http://localhost:3001";
    const token = await TokenStorage.getToken();

    if (!token) {
      // Fallback a URL tradicional sin firma
      return `${base}/api/media/${filenameOnly}`;
    }

    // Obtener la firma desde el backend usando httpFetch
    const data = await httpFetch(`${base}/api/generate-signed-url`, {
      method: "POST",
      body: { filename: filenameOnly },
    });

    // La URL firmada completa viene en la respuesta
    return data.signedUrl;
  } catch (error) {
    console.error("[FileUrlService] Error creando URL firmada:", error);
    // Fallback a URL tradicional
    const base = baseUrl || NGROK_HOST || "http://localhost:3001";
    return `${base}/api/media/${typeof filename === "string" ? filename : "image"}`;
  }
};

//Extrae el nombre de archivo de una URL

export const getFilenameFromUrl = (url) => {
  if (!url) return "";

  // Intentar extraer con expresión regular
  const match = url.match(/\/([^\/]+)(\?|$)/);
  if (match && match[1]) {
    return match[1];
  }

  // Fallback: tomar la última parte de la URL
  const parts = url.split("/");
  const lastPart = parts[parts.length - 1].split("?")[0];
  return lastPart || "";
};

export default {
  normalizeImageUrl,
  createSignedImageUrl,
  getFilenameFromUrl,
};
