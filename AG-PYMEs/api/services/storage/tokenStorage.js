import BaseStorage from "./baseStorage";

//Servicio de almacenamiento de tokens
const TOKEN_KEY = "authToken";
const TOKEN_CACHE_DURATION = 5 * 60 * 1000; // 5 minutos en milisegundos

// Variables para caché en memoria
let cachedToken = null;
let tokenExpirationTime = null;

const TokenStorage = {
  //Guarda un token en el almacenamiento y en caché
  async saveToken(token) {
    try {
      await BaseStorage.setItem(TOKEN_KEY, token);
      // Actualizar caché
      cachedToken = token;
      tokenExpirationTime = Date.now() + TOKEN_CACHE_DURATION;
    } catch (error) {
      console.error("[TokenStorage] Error guardando token:", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  },

  //Obtiene el token de autenticación (de caché o almacenamiento)
  async getToken() {
    const currentTime = Date.now();

    // Si tenemos un token en caché y no ha expirado, lo devolvemos
    if (
      cachedToken &&
      tokenExpirationTime &&
      currentTime < tokenExpirationTime
    ) {
      return cachedToken;
    }

    try {
      const token = await BaseStorage.getItem(TOKEN_KEY);

      if (token) {
        // Actualizar caché
        cachedToken = token;
        tokenExpirationTime = currentTime + TOKEN_CACHE_DURATION;
        return token;
      }

      return null;
    } catch (error) {
      console.error("[TokenStorage] Error al obtener token:", {
        error: error.message,
        stack: error.stack,
      });
      return null;
    }
  },

  //Elimina el token de autenticación
  async removeToken() {
    try {
      await BaseStorage.removeItem(TOKEN_KEY);
      // Limpiar caché
      cachedToken = null;
      tokenExpirationTime = null;
    } catch (error) {
      console.error("[TokenStorage] Error eliminando token:", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  },

  //Verifica si hay un token almacenado
  async hasToken() {
    try {
      const token = await this.getToken();
      return !!token;
    } catch (error) {
      console.error("[TokenStorage] Error verificando token:", {
        error: error.message,
        stack: error.stack,
      });
      return false;
    }
  },

  //Limpia la caché de tokens en memoria
  clearCache() {
    cachedToken = null;
    tokenExpirationTime = null;
  },
};

export default TokenStorage;
