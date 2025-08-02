import { supabase } from "../../config/supabase";
import TokenStorage from "./storage/tokenStorage";

//Servicio de autenticación centralizado usando Supabase Auth

//Obtiene el token de autenticación actual
export const getAuthToken = async () => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (token) {
      // Mantener sincronizado con TokenStorage para compatibilidad
      await TokenStorage.saveToken(token);
      return token;
    }

    // Fallback a TokenStorage si no hay sesión de Supabase
    return await TokenStorage.getToken();
  } catch (error) {
    console.error("[AuthService] Error al obtener el token:", error);
    return null;
  }
};

//Autentica al usuario con sus credenciales usando Supabase Auth
export const login = async (credentials) => {
  try {
    const { email, password } = credentials;

    // Usar Supabase Auth para login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("[AuthService] Error en el login:", error);
      throw new Error(error.message);
    }

    // Verificar que se recibió una sesión válida
    if (!data.session?.access_token) {
      console.error("[AuthService] Error en el login: No se recibió token.");
      throw new Error("No token received");
    }

    // Almacenar token en storage para compatibilidad
    await TokenStorage.saveToken(data.session.access_token);

    return {
      token: data.session.access_token,
      user: data.user,
      session: data.session,
    };
  } catch (err) {
    console.error("[AuthService] Error durante el login:", err);
    // Limpiar token en caso de error
    await TokenStorage.removeToken();
    throw err;
  }
};

//Verifica si el usuario está autenticado usando Supabase Auth
export const checkAuth = async () => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("[AuthService] Error en checkAuth:", error);
      await TokenStorage.removeToken();
      return null;
    }

    if (session?.user) {
      // Mantener token sincronizado
      await TokenStorage.saveToken(session.access_token);
      return session.user;
    }

    return null;
  } catch (err) {
    console.error("[AuthService] Error en checkAuth:", err);
    // Limpiar token en caso de error de autenticación
    await TokenStorage.removeToken();
    return null;
  }
};

//Cierra la sesión del usuario usando Supabase Auth
export const logoutUser = async () => {
  try {
    // Hacer logout en Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.warn("[AuthService] Error en logout de Supabase:", error);
    }

    // Eliminamos el token localmente
    await TokenStorage.removeToken();
  } catch (error) {
    console.error("[AuthService] Error durante logout:", error);
    throw error;
  }
};

//Función de refreshToken usando Supabase Auth
export const refreshToken = async () => {
  try {
    // Intentar refrescar la sesión en Supabase
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      console.warn(
        "[AuthService] Error al refrescar token en Supabase:",
        error
      );

      // Si falla, intentar obtener la sesión actual
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        await TokenStorage.removeToken();
        return false;
      }

      await TokenStorage.saveToken(sessionData.session.access_token);
      return true;
    }

    if (data.session?.access_token) {
      // Actualizar el token en storage local
      await TokenStorage.saveToken(data.session.access_token);
      return true;
    }

    return false;
  } catch (error) {
    console.error("[AuthService] Error en refreshToken:", error);
    await TokenStorage.removeToken();
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
