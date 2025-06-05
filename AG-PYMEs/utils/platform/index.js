// tests/utils/platform/index.js
import { Platform } from "react-native";
import webAdapter from "./web";
import mobileAdapter from "./mobile";

/**
 * Utilidad para gestionar diferencias entre plataformas
 *
 * Este módulo centraliza la detección de plataforma y proporciona adaptadores
 * específicos para cada entorno, evitando la dispersión de lógica específica.
 */

// Detectar plataforma
const isWeb = Platform.OS === "web";
const isIOS = Platform.OS === "ios";
const isAndroid = Platform.OS === "android";

// Seleccionar adaptador adecuado
const adapter = isWeb ? webAdapter : mobileAdapter;

// Exportar constantes de plataforma
export const platformInfo = {
  isWeb,
  isIOS,
  isAndroid,
  isMobile: !isWeb,
  platformName: Platform.OS,
};

// Exportar adaptador seleccionado
export default {
  ...adapter,
  ...platformInfo,
};
