// MIGRADO A SUPABASE STORAGE - USANDO NUEVO SERVICIO
import {
  normalizeImageUrl,
  createSignedImageUrl,
  getFilenameFromUrl,
} from "./supabaseFileService";

// Re-exportar funciones del nuevo servicio de Supabase
export { normalizeImageUrl, createSignedImageUrl, getFilenameFromUrl };

export default {
  normalizeImageUrl,
  createSignedImageUrl,
  getFilenameFromUrl,
};
