import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "authToken";
let cachedToken = null;
let tokenExpirationTime = null;
const TOKEN_CACHE_DURATION = 5 * 60 * 1000; // 5 minutos en milisegundos

const tokenStorage = {
  async saveToken(token) {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
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
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        cachedToken = token;
        tokenExpirationTime = currentTime + TOKEN_CACHE_DURATION;
        return token;
      }
      console.warn("[TokenStorage] No se encontró token");
      return null;
    } catch (error) {
      console.error("[TokenStorage] Error al obtener token:", {
        error: error.message,
        stack: error.stack,
      });
      return null;
    }
  },

  async removeToken() {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
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

  async hasToken() {
    try {
      const token = await this.getToken();
      const hasToken = !!token;
      return hasToken;
    } catch (error) {
      console.error("[TokenStorage] Error verificando token:", {
        error: error.message,
        stack: error.stack,
      });
      return false;
    }
  },

  clearCache() {
    cachedToken = null;
    tokenExpirationTime = null;
  },
};

export default tokenStorage;
