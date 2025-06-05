import { httpFetch } from "../../api/http";
import { authEndpoint } from "../../api/endpoints";
import TokenStorage from "./storage/tokenStorage";

//Servicio de autenticación centralizado

//Obtiene el token de autenticación actual
export const getAuthToken = async () => {
  try {
    const token = await TokenStorage.getToken();
    return token;
  } catch (error) {
    console.error("[AuthService] Error al obtener el token:", error);
    return null;
  }
};

//Autentica al usuario con sus credenciales
export const login = async (credentials) => {
  try {
    const data = await httpFetch(authEndpoint.login(), {
      method: "POST",
      body: credentials,
    });

    // Verificar que se recibió un token válido
    if (!data.token) {
      console.error("[AuthService] Error en el login: No se recibió token.");
      throw new Error("No token received");
    }

    // Almacenar token en storage y caché
    await TokenStorage.saveToken(data.token);
    return data;
  } catch (err) {
    console.error("[AuthService] Error durante el login:", err);
    // Limpiar token en caso de error
    await TokenStorage.removeToken();
    throw err;
  }
};

//Verifica si el usuario está autenticado

export const checkAuth = async () => {
  try {
    const token = await TokenStorage.getToken();
    if (!token) return null;

    // Verificar token con el backend
    const data = await httpFetch(authEndpoint.verifyToken());
    return data.user || null;
  } catch (err) {
    console.error("[AuthService] Error en checkAuth:", err);
    // Limpiar token en caso de error de autenticación
    await TokenStorage.removeToken();
    return null;
  }
};

//Cierra la sesión del usuario

export const logoutUser = async () => {
  try {
    // Primero intentamos hacer logout en el servidor si hay endpoint para ello
    const token = await TokenStorage.getToken();
    if (token && authEndpoint.logout) {
      try {
        await httpFetch(authEndpoint.logout(), {
          method: "POST",
        });
      } catch (logoutErr) {
        // Si falla el logout en servidor, seguimos con el proceso local
        console.warn("[AuthService] Error en logout del servidor:", logoutErr);
      }
    }

    // Eliminamos el token localmente
    await TokenStorage.removeToken();
  } catch (error) {
    console.error("[AuthService] Error durante logout:", error);
    throw error;
  }
};

//Actualiza el token si el backend proporciona refresh
export const refreshToken = async () => {
  try {
    const token = await TokenStorage.getToken();
    if (!token) return false;

    // Solo si existe un endpoint de refresh
    if (authEndpoint.refreshToken) {
      const data = await httpFetch(authEndpoint.refreshToken(), {
        method: "POST",
      });

      if (data.token) {
        await TokenStorage.saveToken(data.token);
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("[AuthService] Error actualizando token:", error);
    return false;
  }
};

// Exportación por defecto para flexibilidad
export default {
  getToken: getAuthToken,
  login,
  checkAuth,
  logout: logoutUser,
  refreshToken,
};
