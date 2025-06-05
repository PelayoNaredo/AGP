import BaseStorage from "./baseStorage";
import TokenStorage from "./tokenStorage";
import ImageStorage from "./imageStorage";

//Exportación unificada de servicios de almacenamiento

export { BaseStorage, TokenStorage, ImageStorage };

// Exportación por defecto para mayor flexibilidad
export default {
  base: BaseStorage,
  token: TokenStorage,
  image: ImageStorage,
};
