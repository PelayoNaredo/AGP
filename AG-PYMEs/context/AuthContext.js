import { createContext, useState, useEffect, useContext } from "react";
import { Services } from "../api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // Verificar sesión al iniciar la app
  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await Services.Storage.Token.getToken();
        if (token) {
          const user = await Services.Auth.checkAuth();
          if (user) {
            setUser(user);
            setIsAuthenticated(true);
          } else {
            await Services.Storage.Token.removeToken();
          }
        }
      } catch (error) {
        console.error("Error en checkToken:", error);
        await Services.Storage.Token.removeToken();
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
        setUser(data.user);
        setIsAuthenticated(true);
      }
      return data;
    } catch (error) {
      console.error("Login error:", error);
      setIsAuthenticated(false);
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
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
