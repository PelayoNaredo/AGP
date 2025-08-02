import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase, EdgeFunctions } from "../config/supabase";
import { Services } from "../api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  // Inicializar auth state
  useEffect(() => {
    console.log("🔐 Initializing auth state...");

    // Obtener sesión actual
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log("Current session:", session ? "Found" : "None");
      setSession(session);
      if (session?.user) {
        setUser(session.user);
        setIsAuthenticated(true);
        await loadUserProfile(session.user.id);

        // Guardar token inmediatamente para compatibilidad
        if (session?.access_token) {
          try {
            // Guardar en localStorage como backup temporal
            if (typeof window !== "undefined" && window.localStorage) {
              localStorage.setItem("supabase_token", session.access_token);
            }
            console.log("✅ Token guardado temporalmente");
          } catch (error) {
            console.error("❌ Error guardando token:", error);
          }
        }
      }
      setLoading(false);
    });

    // Listener para cambios de auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔐 Auth state changed:", event);

      setSession(session);

      if (event === "SIGNED_IN" && session?.user) {
        console.log("✅ User signed in:", session.user.email);
        setUser(session.user);
        setIsAuthenticated(true);
        await loadUserProfile(session.user.id);

        // Guardar token para compatibilidad con servicios existentes
        if (session?.access_token) {
          try {
            // Guardar en localStorage como backup temporal
            if (typeof window !== "undefined" && window.localStorage) {
              localStorage.setItem("supabase_token", session.access_token);
            }
            console.log("✅ Token sincronizado temporalmente");
          } catch (error) {
            console.error("❌ Error sincronizando token:", error);
          }
        }

        // Finalizar carga después de cargar perfil
        setLoading(false);
        console.log("✅ Auth initialization completed");
      } else if (event === "SIGNED_OUT") {
        console.log("👋 User signed out");
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
        // Limpiar token del localStorage
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.removeItem("supabase_token");
        }
      } else if (event === "TOKEN_REFRESHED") {
        console.log("🔄 Token refreshed");
        if (session?.access_token) {
          try {
            // Guardar en localStorage como backup temporal
            if (typeof window !== "undefined" && window.localStorage) {
              localStorage.setItem("supabase_token", session.access_token);
            }
            console.log("✅ Token actualizado temporalmente");
          } catch (error) {
            console.error("❌ Error actualizando token:", error);
          }
        }
      }

      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  // Función para asegurar que el token esté disponible
  const ensureTokenAvailable = async (maxRetries = 3, delayMs = 500) => {
    for (let i = 0; i < maxRetries; i++) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        // Asegurar que también esté en localStorage
        try {
          if (typeof window !== "undefined" && window.localStorage) {
            localStorage.setItem("supabase_token", session.access_token);
          }
          return session.access_token;
        } catch (error) {
          console.warn(`⚠️ Error guardando token (intento ${i + 1}):`, error);
        }
      }

      if (i < maxRetries - 1) {
        console.log(`🔄 Esperando token... (intento ${i + 1}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    throw new Error("Token no disponible después de varios intentos");
  };

  // Cargar perfil del usuario desde tabla profiles
  const loadUserProfile = async (userId) => {
    try {
      console.log("👤 Loading user profile for:", userId);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error loading profile:", error);

        // Si no existe el perfil, intentar sincronización automática
        if (error.code === "PGRST116") {
          console.log("🔧 Profile not found, attempting auto-sync...");

          // Obtener información del usuario autenticado
          const {
            data: { user: currentUser },
          } = await supabase.auth.getUser();

          if (currentUser?.email) {
            try {
              // Llamar a la función de sincronización
              const syncResult = await EdgeFunctions.auth.sync(
                currentUser.email
              );

              if (syncResult.success && syncResult.data.profile) {
                console.log("✅ User synchronized:", syncResult.data.profile);
                setProfile(syncResult.data.profile);
                return;
              }
            } catch (syncError) {
              console.warn("⚠️ Auto-sync failed:", syncError);
            }
          }

          // Fallback: crear perfil temporal
          const tempProfile = {
            id: userId,
            nombre: currentUser?.email?.split("@")[0] || "Usuario",
            email: currentUser?.email || "",
            company_id: "12345678-1234-1234-1234-123456789abc",
            rol: "admin",
            activo: true,
            created_at: new Date().toISOString(),
          };
          console.log("✅ Temporary profile created:", tempProfile);
          setProfile(tempProfile);
          return;
        }

        // Para otros errores, crear perfil temporal
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        const tempProfile = {
          id: userId,
          nombre: currentUser?.email?.split("@")[0] || "Usuario",
          email: currentUser?.email || "",
          company_id: "12345678-1234-1234-1234-123456789abc",
          rol: "admin",
          activo: true,
          created_at: new Date().toISOString(),
        };
        console.log("✅ Temporary profile created due to error:", tempProfile);
        setProfile(tempProfile);
        return;
      }

      console.log("✅ Profile data received:", data);
      setProfile(data);
      console.log("✅ Profile loaded:", data?.nombre);
    } catch (error) {
      console.error("❌ Error loading user profile:", error);

      // En caso de cualquier error, crear perfil temporal para no bloquear la app
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      const tempProfile = {
        id: userId,
        nombre: currentUser?.email?.split("@")[0] || "Usuario",
        email: currentUser?.email || "",
        company_id: "12345678-1234-1234-1234-123456789abc",
        created_at: new Date().toISOString(),
        rol: "user",
      };

      console.log("✅ Emergency temporary profile created:", tempProfile);
      setProfile(tempProfile);
    }
  };

  // Login con Supabase Auth
  const login = async ({ email, contrasena }) => {
    try {
      setLoading(true);
      console.log("🔐 Attempting login for:", email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: contrasena,
      });

      if (error) {
        console.error("❌ Login error:", error);
        throw new Error(error.message);
      }

      console.log("✅ Login successful:", data.user?.email);

      // Retornar formato compatible con código existente
      return {
        user: data.user,
        token: data.session?.access_token,
        profile: profile, // Se cargará automáticamente por el listener
      };
    } catch (error) {
      console.error("🚨 Login failed:", error);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register con datos de empresa - USANDO NUEVA EDGE FUNCTION
  const register = async (registrationData) => {
    try {
      setLoading(true);
      console.log("📝 Attempting registration:", registrationData.email);

      // Usar la nueva Edge Function de registro multi-tenant (sin token requerido)
      const response = await EdgeFunctions.auth.register({
        email: registrationData.email,
        password: registrationData.contrasena, // Nota: la EdgeFunction espera 'password'
        nombre: registrationData.nombre,
        mode: registrationData.mode, // 'create' o 'join'
        companyData:
          registrationData.mode === "create"
            ? {
                companyName: registrationData.companyData?.companyName,
                subscriptionPlan:
                  registrationData.companyData?.subscriptionPlan || "basic",
                taxRate: registrationData.companyData?.taxRate || 21.0,
                defaultCurrency:
                  registrationData.companyData?.defaultCurrency || "EUR",
              }
            : undefined,
        invitationCode:
          registrationData.mode === "join"
            ? registrationData.invitationCode
            : undefined,
      });

      if (response.user) {
        console.log("✅ Registration successful:", response);

        // Si el registro fue exitoso, hacer login automático usando Supabase nativo
        // No usar EdgeFunction para el login después del registro
        console.log("🔐 Auto-login after registration...");

        const { data: authData, error: authError } =
          await supabase.auth.signInWithPassword({
            email: registrationData.email,
            password: registrationData.contrasena,
          });

        if (authError) {
          console.warn(
            "⚠️ Auto-login failed, user can login manually:",
            authError
          );
          // No lanzar error, el registro fue exitoso
          return response.user;
        }

        if (authData.user) {
          setUser(authData.user);
          setSession(authData.session);

          // Cargar perfil del usuario
          await loadUserProfile(authData.user.id);

          console.log("✅ Auto-login successful after registration");
        }

        return response.user;
      }

      throw new Error("Registration failed - no user returned");
    } catch (error) {
      console.error("🚨 Registration failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      setLoading(true);
      console.log("👋 Logging out...");

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("❌ Logout error:", error);
        throw new Error(error.message);
      }

      console.log("✅ Logout successful");
    } catch (error) {
      console.error("🚨 Logout failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Validar código de invitación
  const validateInvitationCode = async (invitationCode) => {
    try {
      return await EdgeFunctions.auth.validateInvitation(invitationCode);
    } catch (error) {
      console.error("Error validating invitation:", error);
      throw error;
    }
  };

  // Obtener planes de suscripción
  const getSubscriptionPlans = async () => {
    try {
      return await EdgeFunctions.auth.getPlans();
    } catch (error) {
      console.error("Error getting plans:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        // Estados principales
        user,
        profile,
        isAuthenticated,
        loading,
        session,

        // Funciones principales
        login,
        register,
        logout,
        loadUserProfile,

        // Funciones específicas de companies
        validateInvitationCode,
        getSubscriptionPlans,

        // Función de utilidad para token
        ensureTokenAvailable,

        // Compatibilidad con código existente
        token: session?.access_token,

        // Información de empresa desde user_metadata
        companyId: user?.user_metadata?.company_id,

        // Helper para verificar si el usuario es admin
        isAdmin: profile?.rol === "admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
