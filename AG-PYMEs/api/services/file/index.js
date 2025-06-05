import { uploadFile } from "./upload";
import { loadImage, downloadFile } from "./download";
import {
  normalizeImageUrl,
  createSignedImageUrl,
  getFilenameFromUrl,
} from "./urls";
import { ImageStorage } from "../storage";

// Servicio unificado para manejo de archivos
// Re-exportamos funciones individuales para flexibilidad
export {
  // Subida
  uploadFile,

  // Descarga
  loadImage,
  downloadFile,

  // URLs
  normalizeImageUrl,
  createSignedImageUrl,
  getFilenameFromUrl,
};

//Elimina un archivo del servidor
export const deleteFile = async (filename) => {
  try {
    // Implementación de la lógica para eliminar archivos
    // Esta función serviría como ejemplo de centralización

    // También eliminamos cualquier copia local
    await ImageStorage.removeImage(filename);

    return true;
  } catch (error) {
    console.error("[FileService] Error eliminando archivo:", error);
    return false;
  }
};

// Exportación por defecto del servicio completo
export default {
  // Carga
  upload: uploadFile,
  uploadFile: uploadFile, // Añadir alias explícito para compatibilidad

  // Descarga
  load: loadImage,
  download: downloadFile,
  downloadFile: downloadFile, // Añadir alias explícito para compatibilidad
  loadImage: loadImage, // Añadir alias explícito para compatibilidad

  // URLs
  normalizeUrl: normalizeImageUrl,
  normalizeImageUrl: normalizeImageUrl, // Añadir alias explícito para compatibilidad
  createSignedUrl: createSignedImageUrl,
  createSignedImageUrl: createSignedImageUrl, // Añadir alias explícito para compatibilidad
  getFilename: getFilenameFromUrl,
  getFilenameFromUrl: getFilenameFromUrl, // Añadir alias explícito para compatibilidad

  // Eliminación
  delete: deleteFile,
  deleteFile: deleteFile, // Añadir alias explícito para compatibilidad

  // Almacenamiento local (redirige a ImageStorage)
  saveLocally: ImageStorage.saveImage.bind(ImageStorage),
  getLocal: ImageStorage.getImage.bind(ImageStorage),
  clearCache: ImageStorage.clearCache.bind(ImageStorage),
};
