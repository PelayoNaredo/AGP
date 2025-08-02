// MIGRADO A SUPABASE STORAGE - USANDO NUEVO SERVICIO
import { uploadFile, compressImage } from "./supabaseFileService";

// Re-exportar funciones del nuevo servicio de Supabase
export { uploadFile, compressImage };

export default {
  uploadFile,
  compressImage,
};
