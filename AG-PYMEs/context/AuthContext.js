import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useRef,
} from "react";
import { Services } from "../api";

// =====================================================
// CONTEXTO DE AUTENTICACIÓN ACTUALIZADO CON MULTI-TENANCY
// Fecha: 8 de agosto de 2025
// Cambios: Agregado soporte para company_id y datos de empresa
// =====================================================

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null); // ← NUEVO: Estado del token
  const hasRunCheck = useRef(false); // ← NUEVO: guard para evitar doble ejecución

  // Verificar sesión al iniciar la app
  useEffect(() => {
    if (hasRunCheck.current) return; // evita doble ejecución en dev
    hasRunCheck.current = true;

    const checkToken = async () => {
      try {
        const storedToken = await Services.Storage.Token.getToken();
        if (storedToken) {
          setToken(storedToken); // ← NUEVO: Guardar token en estado
          const userData = await Services.Auth.checkAuth();
          if (userData) {
            // ← CAMBIO: Asegurar que el usuario tenga company_id
            setUser({
              ...userData,
              company_id: userData.company_id || null,
            });
            setIsAuthenticated(true);
          } else {
            await Services.Storage.Token.removeToken();
            setToken(null);
          }
        }
      } catch (error) {
        console.error("Error en checkToken:", error);
        await Services.Storage.Token.removeToken();
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    checkToken();
  }, []);

  // Iniciar sesión
  const login = async (credentials) => {
    try {
      setLoading(true);
      const data = await Services.Auth.login(credentials);
      if (data.user && data.token) {
        // ← CAMBIO: Asegurar que el usuario tenga company_id
        const userWithCompany = {
          ...data.user,
          company_id: data.user.company_id || null,
        };

        setUser(userWithCompany);
        setToken(data.token); // ← NUEVO: Guardar token en estado
        setIsAuthenticated(true);

        // Log para debugging
        console.log("[AuthContext] Usuario autenticado:", {
          id: userWithCompany.id_usuario,
          email: userWithCompany.email,
          company_id: userWithCompany.company_id,
          hasCompany: !!userWithCompany.company_id,
        });
      }
      return data;
    } catch (error) {
      console.error("Login error:", error);
      setIsAuthenticated(false);
      setToken(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Cerrar sesión
  const logout = async () => {
    try {
      setLoading(true);
      await Services.Auth.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setToken(null); // ← NUEVO: Limpiar token
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  // ← NUEVO: Actualizar datos del usuario (útil después de cambios en perfil)
  const updateUser = (userData) => {
    setUser((prevUser) => ({
      ...prevUser,
      ...userData,
      company_id: userData.company_id || prevUser?.company_id || null,
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token, // ← NUEVO: Exponer token
        loading,
        isAuthenticated,
        login,
        logout,
        updateUser, // ← NUEVO: Función para actualizar usuario

        // ← NUEVO: Helpers para multi-tenancy
        hasCompany: !!user?.company_id,
        companyId: user?.company_id || null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
