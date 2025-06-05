import { Platform } from "react-native";
import { httpFetch } from "../../../api/http";
import { TokenStorage } from "../storage";

//Módulo para manejo de subida de archivos
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 segundo

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

//Sube un archivo al servidor
export const uploadFile = async (
  file,
  endpoint,
  options = {},
  retryCount = 0
) => {
  try {
    const token = await TokenStorage.getToken();
    if (!token) {
      throw new Error("No hay token de autenticación disponible");
    }

    const formData = new FormData();

    // Preparar el archivo según la plataforma
    if (Platform.OS === "web" && file.originalFile) {
      // Si es un archivo ya procesado en web
      const compressedFile = options.compress
        ? await compressImage(file.originalFile)
        : file.originalFile;

      formData.append("file", compressedFile, file.name || "file");
    } else {
      // Para React Native o archivos simples
      const fileToUpload = {
        uri: file.uri,
        type: file.type || "application/octet-stream",
        name: file.fileName || file.name || "file",
      };

      formData.append("file", fileToUpload);
    }

    // Añadir metadatos adicionales si se proporcionan
    if (options.metadata) {
      Object.entries(options.metadata).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    // Usar httpFetch con isUpload=true para uploads
    const data = await httpFetch(endpoint, {
      method: options.method || "POST",
      body: formData,
      isUpload: true,
    });

    return data;
  } catch (error) {
    console.error("[FileUpload] Error en uploadFile:", error);

    // Reintento en caso de error de red
    if (
      (error.message.includes("network") ||
        error.message.includes("connection")) &&
      retryCount < MAX_RETRIES
    ) {
      await wait(RETRY_DELAY * (retryCount + 1));
      return uploadFile(file, endpoint, options, retryCount + 1);
    }

    if (error.status === 401) {
      // Error de autenticación
      await TokenStorage.removeToken();
    }

    throw error;
  }
};

export default {
  uploadFile,
  compressImage,
};
