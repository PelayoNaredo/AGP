// MIGRADO A SUPABASE STORAGE - USANDO NUEVO SERVICIO
import { loadImage, downloadFile } from "./supabaseFileService";

// Re-exportar funciones del nuevo servicio de Supabase
export { loadImage, downloadFile };

export default {
  loadImage,
  downloadFile,
};
