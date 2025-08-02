import { supabase } from "../../../config/supabase";
import { Platform } from "react-native";

//Servicio para manejo de archivos usando Supabase Storage

const BUCKET_NAME = "company-assets"; // Bucket principal para archivos de empresa

//Normaliza la URL de una imagen desde Supabase Storage
export const normalizeImageUrl = (url) => {
  if (!url) {
    console.warn("[SupabaseFileService] Se intentó normalizar una URL vacía");
    return "";
  }

  try {
    // Convertir a string en caso de que recibamos un objeto
    const urlStr =
      typeof url === "object"
        ? url.uri || url.url || url.path || url.name || JSON.stringify(url)
        : String(url);

    // Si ya es una URL completa de Supabase, la devolvemos
    if (urlStr.includes("supabase") && urlStr.includes("storage")) {
      return urlStr;
    }

    // Si ya es una URL completa de otro tipo, la devolvemos
    if (urlStr.startsWith("http")) {
      return urlStr;
    }

    // Si es solo un nombre de archivo, crear URL de Supabase Storage
    const fileName = urlStr.startsWith("/") ? urlStr.slice(1) : urlStr;

    // Usar getPublicUrl para obtener la URL pública
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);

    return data.publicUrl;
  } catch (error) {
    console.error("[SupabaseFileService] Error normalizando URL:", error);
    return typeof url === "string" ? url : "";
  }
};

//Crea una URL firmada para acceder a archivos privados
export const createSignedImageUrl = async (filename, expiresIn = 3600) => {
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

    // Crear URL firmada con Supabase
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filenameOnly, expiresIn);

    if (error) {
      console.error("[SupabaseFileService] Error creando URL firmada:", error);
      // Fallback a URL pública
      return normalizeImageUrl(filenameOnly);
    }

    return data.signedUrl;
  } catch (error) {
    console.error("[SupabaseFileService] Error creando URL firmada:", error);
    // Fallback a URL pública
    return normalizeImageUrl(filename);
  }
};

//Extrae el nombre de archivo de una URL
export const getFilenameFromUrl = (url) => {
  if (!url) return "";

  try {
    // Para URLs de Supabase Storage
    if (url.includes("supabase") && url.includes("storage")) {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/");
      return pathParts[pathParts.length - 1];
    }

    // Intentar extraer con expresión regular
    const match = url.match(/\/([^\/]+)(\?|$)/);
    if (match && match[1]) {
      return match[1];
    }

    // Fallback: tomar la última parte de la URL
    const parts = url.split("/");
    const lastPart = parts[parts.length - 1].split("?")[0];
    return lastPart || "";
  } catch (error) {
    console.error(
      "[SupabaseFileService] Error extrayendo nombre de archivo:",
      error
    );
    return "";
  }
};

//Comprime una imagen antes de enviarla (solo para web)
const compressImage = async (file) => {
  if (Platform.OS !== "web") {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;

        let width = img.width;
        let height = img.height;

        // Redimensionar manteniendo proporciones
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a blob con calidad 0.85
        canvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          file.type,
          0.85
        );
      };

      img.onerror = () => {
        reject(new Error("Error al cargar imagen para compresión"));
      };

      img.src = event.target.result;
    };

    reader.onerror = () => reject(new Error("Error leyendo archivo"));
    reader.readAsDataURL(file);
  });
};

//Sube un archivo a Supabase Storage
export const uploadFile = async (file, path = "", options = {}) => {
  try {
    // Comprimir imagen si está habilitado
    let fileToUpload = file;
    if (options.compress && Platform.OS === "web") {
      fileToUpload = await compressImage(file);
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const fileName = file.name || file.fileName || `file_${timestamp}`;
    const fullPath = path ? `${path}/${fileName}` : fileName;

    // Preparar el archivo según la plataforma
    let fileBlob;
    if (Platform.OS === "web") {
      fileBlob = fileToUpload;
    } else {
      // Para React Native, necesitamos convertir URI a blob
      const response = await fetch(file.uri);
      fileBlob = await response.blob();
    }

    // Subir archivo a Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fullPath, fileBlob, {
        contentType: file.type || "application/octet-stream",
        upsert: options.overwrite || false,
      });

    if (error) {
      throw error;
    }

    // Obtener URL pública del archivo subido
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return {
      path: data.path,
      fullPath: data.fullPath,
      url: urlData.publicUrl,
      fileName: fileName,
    };
  } catch (error) {
    console.error("[SupabaseFileService] Error subiendo archivo:", error);
    throw error;
  }
};

//Descarga un archivo de Supabase Storage
export const downloadFile = async (filePath) => {
  try {
    if (!filePath) {
      throw new Error("Ruta de archivo no válida para la descarga");
    }

    // Extraer nombre de archivo si es una URL completa
    let fileName = filePath;
    if (filePath.includes("/")) {
      fileName = getFilenameFromUrl(filePath);
    }

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(fileName);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("[SupabaseFileService] Error descargando archivo:", error);
    throw error;
  }
};

//Carga una imagen de Supabase Storage
export const loadImage = async (imageUrl) => {
  if (!imageUrl) return null;

  try {
    const normalizedUrl = normalizeImageUrl(imageUrl);

    // Para móvil, devolver la URL para que Image de React Native la use
    if (Platform.OS !== "web") {
      return { uri: normalizedUrl };
    }

    // Para web, crear promesa de carga de imagen
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Error cargando imagen"));
      img.crossOrigin = "anonymous";
      img.src = normalizedUrl;
    });
  } catch (error) {
    console.error("[SupabaseFileService] Error cargando imagen:", error);
    throw error;
  }
};

//Elimina un archivo de Supabase Storage
export const deleteFile = async (filePath) => {
  try {
    if (!filePath) {
      throw new Error("Ruta de archivo no válida para eliminar");
    }

    // Extraer nombre de archivo si es una URL completa
    let fileName = filePath;
    if (filePath.includes("/")) {
      fileName = getFilenameFromUrl(filePath);
    }

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fileName]);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error("[SupabaseFileService] Error eliminando archivo:", error);
    throw error;
  }
};

export default {
  normalizeImageUrl,
  createSignedImageUrl,
  getFilenameFromUrl,
  uploadFile,
  downloadFile,
  loadImage,
  deleteFile,
  compressImage,
};
