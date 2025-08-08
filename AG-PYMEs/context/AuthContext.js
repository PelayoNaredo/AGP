/**
 * 🔐 NEW AUTH CONTEXT - Sistema Dual Simplificado
 * ✅ ARQUITECTURA SIMPLE - Un solo estado de loading hasta que TODO esté listo
 * ✅ SIN RACE CONDITIONS - No se marca como ready hasta tener user completo
 * ✅ SUPABASE NATIVO - Usa tokens y autenticación de Supabase directamente
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Configuración de Supabase
let supabase;
const initSupabase = async () => {
  if (!supabase) {
    const supabaseModule = await import("../config/supabase");
    supabase = supabaseModule.default; // Usar default export
  }
  return supabase;
};

// Variable temporal para datos de usuario del login
let tempUserDataFromLogin = null;

// Context
const AuthContext = createContext({
  // Estados principales
  user: null, // Usuario completo desde tabla users
  session: null, // Sesión de Supabase (tokens)
  isAuthenticated: false, // Si está autenticado
  loading: true, // Loading general (true hasta que TODO esté listo)

  // Métodos
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
  ensureTokenAvailable: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Provider principal
export const AuthProvider = ({ children }) => {
  // Estados principales
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Estados de inicialización para evitar race conditions
  const [initializationState, setInitializationState] = useState({
    supabaseReady: false,
    sessionLoaded: false,
    userDataLoaded: false,
    companyContextCanStart: false,
  });

  console.log("🔐 NEW AUTH CONTEXT: Initializing...");

  // Helper: Marcar como listo cuando todas las fases están completas
  const markAsReady = () => {
    console.log("🔍 markAsReady() called with state:", {
      supabaseReady: initializationState.supabaseReady,
      sessionLoaded: initializationState.sessionLoaded,
      userDataLoaded: initializationState.userDataLoaded,
    });

    if (
      initializationState.supabaseReady &&
      initializationState.sessionLoaded &&
      initializationState.userDataLoaded
    ) {
      setInitializationState((prev) => ({
        ...prev,
        companyContextCanStart: true,
      }));
      setLoading(false);
      setIsAuthenticated(true);
      console.log("✅ Auth initialization COMPLETE - CompanyContext can start");
      console.log("🔥 USER AUTHENTICATED - App should navigate now!");
    } else {
      console.log("⏳ Auth not ready yet, waiting for all conditions...");
    }
  };

  // UseEffect para llamar markAsReady cuando initializationState cambie
  useEffect(() => {
    markAsReady();
  }, [
    initializationState.supabaseReady,
    initializationState.sessionLoaded,
    initializationState.userDataLoaded,
  ]);

  // Helper: Obtener datos completos del usuario desde Supabase
  const fetchCompleteUserData = async (userId, session) => {
    try {
      console.log("👤 Fetching complete user data for:", userId);

      // ✅ USAR NUEVA EDGE FUNCTION ENTERPRISE CON COMPANY DATA
      try {
        console.log("🔄 Getting user data via new enterprise Edge Function...");

        // 🛡️ STRATEGY 1: XMLHttpRequest con apikey como query param (bypass Kaspersky + CORS)
        const response = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          // 🔧 Usar endpoint Enterprise con query param
          const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/users/current?apikey=${encodeURIComponent(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY)}`;

          xhr.open("GET", url);

          // Headers esenciales
          xhr.setRequestHeader("Content-Type", "application/json");
          xhr.setRequestHeader(
            "Authorization",
            `Bearer ${session.access_token}`
          );

          xhr.onload = () => {
            console.log("📡 UserData XMLHttpRequest completed:", {
              status: xhr.status,
              statusText: xhr.statusText,
              responseLength: xhr.responseText?.length,
            });

            resolve({
              ok: xhr.status >= 200 && xhr.status < 300,
              status: xhr.status,
              json: () => Promise.resolve(JSON.parse(xhr.responseText)),
            });
          };

          xhr.onerror = () => {
            console.log("❌ UserData XMLHttpRequest onerror:", {
              status: xhr.status,
              readyState: xhr.readyState,
            });
            reject(
              new Error(`UserData XMLHttpRequest failed: status=${xhr.status}`)
            );
          };

          xhr.ontimeout = () => {
            console.log("⏰ UserData XMLHttpRequest timeout");
            reject(new Error("UserData XMLHttpRequest timeout"));
          };

          xhr.timeout = 30000;

          console.log(
            "📤 Sending UserData XMLHttpRequest to:",
            url.replace(
              process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
              "[API_KEY_HIDDEN]"
            )
          );
          xhr.send();
        });

        if (response.ok) {
          const result = await response.json();

          // Enterprise template format: { success: true, data: {...} }
          if (result.success && result.data) {
            console.log(
              "✅ User data loaded via Enterprise Edge Function:",
              result.data.email
            );
            return result.data;
          }
        }

        console.log(
          "⚠️ Enterprise Edge Function response not valid, status:",
          response.status
        );
      } catch (edgeFunctionError) {
        console.log(
          "⚠️ Enterprise Edge Function failed:",
          edgeFunctionError.message
        );
      }

      // FALLBACK: Usar endpoint de verificación existente
      try {
        console.log("🔄 Fallback: Using verification endpoint...");

        // 🛡️ STRATEGY 2: XMLHttpRequest para endpoint de verificación
        const response = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/login/auth/verify?apikey=${encodeURIComponent(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY)}`;

          xhr.open("GET", url);

          xhr.setRequestHeader("Content-Type", "application/json");
          xhr.setRequestHeader(
            "Authorization",
            `Bearer ${session.access_token}`
          );

          xhr.onload = () => {
            console.log("📡 Verify XMLHttpRequest completed:", {
              status: xhr.status,
              statusText: xhr.statusText,
            });

            resolve({
              ok: xhr.status >= 200 && xhr.status < 300,
              status: xhr.status,
              json: () => Promise.resolve(JSON.parse(xhr.responseText)),
            });
          };

          xhr.onerror = () => {
            console.log("❌ Verify XMLHttpRequest onerror:", xhr.status);
            reject(new Error(`Verify XMLHttpRequest failed: ${xhr.status}`));
          };

          xhr.timeout = 30000;
          xhr.send();
        });

        if (response.ok) {
          const data = await response.json();
          if (data.valid && data.user) {
            console.log(
              "✅ User data loaded via fallback endpoint:",
              data.user.email
            );
            return data.user;
          }
        }
      } catch (fallbackError) {
        console.log("⚠️ Fallback endpoint failed:", fallbackError.message);
      }

      // Error handling robusto
      console.log("🔄 All methods failed, showing authentication error...");
      throw new Error(
        "No se pudo cargar la información del usuario. Verifica tu conexión e intenta nuevamente."
      );
    } catch (error) {
      console.error("❌ Error in fetchCompleteUserData:", error);
      throw error;
    }
  };

  // Helper: Configurar estado autenticado con patrón robusto
  const setAuthenticatedState = async (
    session,
    existingUserData = null,
    fromPersistentSession = false
  ) => {
    try {
      console.log("🔄 Setting authenticated state...");

      // Marcar Supabase como listo
      setInitializationState((prev) => ({ ...prev, supabaseReady: true }));

      // 1. Obtener datos completos del usuario (o usar los que ya tenemos)
      let userData;
      if (existingUserData) {
        console.log("✅ Using existing user data from login response");
        userData = existingUserData;
      } else if (tempUserDataFromLogin) {
        console.log("✅ Using temporary user data from login");
        userData = tempUserDataFromLogin;
        tempUserDataFromLogin = null; // Limpiar después de usar
      } else if (fromPersistentSession) {
        // 🚀 USAR DATOS DE LA SESIÓN PERSISTENTE DIRECTAMENTE
        console.log("✅ Using user data from persistent Supabase session");
        userData = {
          id: session.user.id,
          email: session.user.email,
          nombre:
            session.user.user_metadata?.full_name ||
            session.user.email.split("@")[0],
          company_id: session.user.user_metadata?.company_id,
          rol: session.user.user_metadata?.rol || "user",
        };
        console.log("📊 Reconstructed user data:", userData);
      } else {
        console.log("🔄 Fetching user data via Edge Functions...");
        userData = await fetchCompleteUserData(session.user.id, session);
      }

      // 2. Guardar token en AsyncStorage
      await AsyncStorage.setItem("auth_token", session.access_token);

      // 3. Establecer estados de sesión y usuario
      setSession(session);
      setUser(userData);

      // Marcar que los datos están cargados
      console.log("📊 Setting initialization state flags...");
      setInitializationState((prev) => ({
        ...prev,
        sessionLoaded: true,
        userDataLoaded: true,
      }));

      // 4. markAsReady() se llamará automáticamente por useEffect cuando el estado cambie

      console.log(
        "✅ Auth state ready - User:",
        userData.email,
        "Company:",
        userData.company_id
      );
    } catch (error) {
      console.error("❌ Error setting authenticated state:", error);

      // En caso de error, limpiar estado y mostrar mensaje apropiado
      setSession(null);
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);

      // Reset initialization state
      setInitializationState({
        supabaseReady: false,
        sessionLoaded: false,
        userDataLoaded: false,
        companyContextCanStart: false,
      });
    }
  };

  // Helper: Limpiar estado
  const clearAuthState = async () => {
    console.log("🧹 Clearing auth state...");

    try {
      await AsyncStorage.removeItem("auth_token");
    } catch (error) {
      console.error("❌ Error clearing token:", error);
    }

    setSession(null);
    setUser(null);
    setIsAuthenticated(false);
    setLoading(false);

    console.log("✅ Auth state cleared");
  };

  // Inicialización
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log("🚀 Initializing auth...");

        const sb = await initSupabase();

        // Verificar sesión existente
        const {
          data: { session: currentSession },
        } = await sb.auth.getSession();

        if (currentSession && mounted) {
          console.log(
            "🔍 Found existing session for:",
            currentSession.user.email
          );

          // 🔄 VERIFICAR SI EL TOKEN NECESITA REFRESH
          const now = Math.floor(Date.now() / 1000);
          const expiresAt = currentSession.expires_at;
          const timeUntilExpiry = expiresAt - now;

          console.log("⏰ Token expiry check:", {
            expiresAt: new Date(expiresAt * 1000).toLocaleTimeString(),
            timeUntilExpiry: timeUntilExpiry,
            needsRefresh: timeUntilExpiry < 300, // Menos de 5 minutos
          });

          if (timeUntilExpiry < 300) {
            // Menos de 5 minutos para expirar
            console.log("🔄 Token needs refresh, refreshing session...");
            try {
              const {
                data: { session: refreshedSession },
                error,
              } = await sb.auth.refreshSession();

              if (error) {
                console.error("❌ Failed to refresh session:", error.message);
                console.log("🧹 Clearing expired session...");
                await sb.auth.signOut();
                setLoading(false);
                return;
              }

              if (refreshedSession) {
                console.log("✅ Session refreshed successfully");
                await setAuthenticatedState(refreshedSession, null, true); // true = fromPersistentSession
                return;
              }
            } catch (refreshError) {
              console.error(
                "❌ Error refreshing session:",
                refreshError.message
              );
              await sb.auth.signOut();
              setLoading(false);
              return;
            }
          }

          // Si el token es válido, usar la sesión actual
          await setAuthenticatedState(currentSession, null, true); // true = fromPersistentSession
        } else {
          console.log("ℹ️ No existing session found");
          setLoading(false);
        }

        // Listener para cambios de autenticación
        const {
          data: { subscription },
        } = sb.auth.onAuthStateChange(async (event, newSession) => {
          if (!mounted) return;

          console.log("🔐 Auth state changed:", event);

          if (event === "SIGNED_IN" && newSession) {
            console.log("✅ User signed in:", newSession.user.email);
            setLoading(true); // Activar loading durante la configuración
            await setAuthenticatedState(newSession);
          } else if (event === "SIGNED_OUT") {
            console.log("👋 User signed out");
            await clearAuthState();
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("❌ Auth initialization error:", error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // Método de login
  const login = async ({ email, contrasena }) => {
    try {
      setLoading(true);
      console.log("🔐 Attempting login for:", email);

      // 🔍 GUARDAR LOGS EN LOCALSTORAGE PARA DEBUG
      const debugLogs = [];
      debugLogs.push(
        `[${new Date().toISOString()}] 🔐 Attempting login for: ${email}`
      );

      // Preparar datos de login
      const loginData = {
        email: email.trim(),
        contrasena: contrasena,
      };

      console.log(
        "🔍 Login data being sent:",
        JSON.stringify(loginData, null, 2)
      );
      debugLogs.push(
        `[${new Date().toISOString()}] 🔍 Login data: ${JSON.stringify(loginData, null, 2)}`
      );

      // 🛡️ STRATEGY 1: XMLHttpRequest con apikey como query param (bypass Kaspersky + CORS)
      let response;
      try {
        response = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          // 🔧 Usar endpoint Enterprise con query param
          const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/login/auth/login?apikey=${encodeURIComponent(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY)}`;

          xhr.open("POST", url);

          // Solo header esencial para evitar CORS preflight
          xhr.setRequestHeader("Content-Type", "application/json");

          xhr.onload = () => {
            console.log("📡 Login XMLHttpRequest completed:", {
              status: xhr.status,
              statusText: xhr.statusText,
              responseHeaders: xhr.getAllResponseHeaders()?.substring(0, 200),
              responseLength: xhr.responseText?.length,
            });

            debugLogs.push(
              `[${new Date().toISOString()}] 📡 Login XMLHttpRequest status: ${xhr.status}`
            );

            resolve({
              ok: xhr.status >= 200 && xhr.status < 300,
              status: xhr.status,
              json: () => Promise.resolve(JSON.parse(xhr.responseText)),
            });
          };

          xhr.onerror = () => {
            console.log("❌ Login XMLHttpRequest onerror triggered:", {
              status: xhr.status,
              statusText: xhr.statusText,
              readyState: xhr.readyState,
            });
            debugLogs.push(
              `[${new Date().toISOString()}] ❌ Login XMLHttpRequest onerror: status=${xhr.status}, readyState=${xhr.readyState}`
            );
            reject(
              new Error(
                `Login XMLHttpRequest failed: status=${xhr.status}, readyState=${xhr.readyState}`
              )
            );
          };

          xhr.ontimeout = () => {
            console.log("⏰ Login XMLHttpRequest timeout");
            debugLogs.push(
              `[${new Date().toISOString()}] ⏰ Login XMLHttpRequest timeout`
            );
            reject(new Error("Login XMLHttpRequest timeout"));
          };

          // Set timeout
          xhr.timeout = 30000; // 30 segundos

          console.log(
            "📤 Sending Login XMLHttpRequest to:",
            url.replace(
              process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
              "[API_KEY_HIDDEN]"
            )
          );
          debugLogs.push(
            `[${new Date().toISOString()}] 📤 Login XMLHttpRequest to: ${url.substring(0, 100)}...`
          );

          xhr.send(JSON.stringify(loginData));
        });

        console.log("✅ Login XMLHttpRequest strategy succeeded");
        debugLogs.push(
          `[${new Date().toISOString()}] ✅ Login XMLHttpRequest strategy succeeded`
        );
      } catch (xhrError) {
        console.log(
          "❌ Login XMLHttpRequest strategy failed:",
          xhrError.message
        );
        debugLogs.push(
          `[${new Date().toISOString()}] ❌ Login XMLHttpRequest failed: ${xhrError.message}`
        );

        // 🛡️ STRATEGY 2: Fallback a fetch normal con headers (si falla todo lo demás)
        console.log("🔄 Trying login fallback fetch strategy...");
        debugLogs.push(
          `[${new Date().toISOString()}] 🔄 Trying login fallback fetch strategy...`
        );

        response = await fetch(
          `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/login/auth/login`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify(loginData),
          }
        );

        console.log("✅ Login fallback fetch strategy completed");
        debugLogs.push(
          `[${new Date().toISOString()}] ✅ Login fallback fetch completed with status: ${response.status}`
        );
      }

      // 🔍 GUARDAR LOGS COMPLETOS
      try {
        await AsyncStorage.setItem(
          "login_debug_logs",
          JSON.stringify(debugLogs)
        );
        console.log("🔍 Login debug logs saved to AsyncStorage");
      } catch (storageError) {
        console.log(
          "⚠️ Could not save login debug logs:",
          storageError.message
        );
      }

      console.log("📡 Login response status:", response.status);
      console.log("📡 Login response ok:", response.ok);
      debugLogs.push(
        `[${new Date().toISOString()}] 📡 Login response status: ${response.status}`
      );
      debugLogs.push(
        `[${new Date().toISOString()}] 📡 Login response ok: ${response.ok}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.log("❌ Login failed with error:", errorData);
        debugLogs.push(
          `[${new Date().toISOString()}] ❌ Login failed: ${JSON.stringify(errorData)}`
        );
        throw new Error(errorData.error || `Login failed: ${response.status}`);
      }

      const result = await response.json();
      console.log("📡 Login response body:", JSON.stringify(result, null, 2));
      debugLogs.push(
        `[${new Date().toISOString()}] 📡 Login response body: ${JSON.stringify(result, null, 2)}`
      );

      // ✅ COMPATIBILIDAD: Manejar ambos formatos
      let session, user;

      if (result.success && result.data) {
        // Enterprise template format: { success: true, data: {...} }
        ({ session, user } = result.data);
        console.log("✅ Login successful via Enterprise Edge Function");
        debugLogs.push(
          `[${new Date().toISOString()}] ✅ Login successful via Enterprise format`
        );
      } else if (result.supabase_session && result.user) {
        // Legacy format: { token, user, supabase_session }
        session = result.supabase_session;
        user = result.user;
        console.log("✅ Login successful via Legacy Edge Function");
        debugLogs.push(
          `[${new Date().toISOString()}] ✅ Login successful via Legacy format`
        );
      } else {
        console.log("❌ Login failed - invalid response format:", result);
        debugLogs.push(
          `[${new Date().toISOString()}] ❌ Login failed - invalid response format: ${JSON.stringify(result)}`
        );
        throw new Error(result.error || "Invalid response format");
      }

      if (session && user) {
        console.log("✅ Login successful - setting up session");
        console.log("👤 User ID:", user.id);
        console.log("🏢 User company:", user.company_name || user.company_id);
        debugLogs.push(
          `[${new Date().toISOString()}] ✅ Login successful - User ID: ${user.id}, Company: ${user.company_name || user.company_id}`
        );

        // 🔍 ACTUALIZAR LOGS FINALES
        try {
          await AsyncStorage.setItem(
            "login_debug_logs",
            JSON.stringify(debugLogs)
          );
        } catch (storageError) {
          console.log(
            "⚠️ Could not update login debug logs:",
            storageError.message
          );
        }

        const sb = await initSupabase();

        // 🚀 GUARDAR DATOS DEL USUARIO TEMPORALMENTE
        tempUserDataFromLogin = user;
        console.log("💾 Saved user data temporarily for setAuthenticatedState");

        // Establecer sesión en Supabase Auth
        const { error } = await sb.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });

        if (error) {
          throw error;
        }

        // El onAuthStateChange se encargará del resto
        return { success: true, user };
      }

      throw new Error("Invalid response format");
    } catch (error) {
      console.error("❌ Login error:", error);
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  // Método de register
  const register = async (userData) => {
    try {
      setLoading(true);
      console.log("📝 Attempting registration for:", userData.email);

      // 🔧 MAPEAR DATOS CORRECTAMENTE - El servidor espera "password", no "contrasena"
      const registrationData = {
        email: userData.email,
        password: userData.contrasena || userData.password, // Soportar ambos formatos
        nombre: userData.nombre,
        mode: userData.mode,
        companyData: userData.companyData,
      };

      console.log(
        "🔍 Registration data being sent:",
        JSON.stringify(registrationData, null, 2)
      );

      // 🔍 GUARDAR LOGS EN LOCALSTORAGE PARA DEBUG
      const debugLogs = [];
      debugLogs.push(
        `[${new Date().toISOString()}] 📝 Attempting registration for: ${userData.email}`
      );
      debugLogs.push(
        `[${new Date().toISOString()}] 🔍 Original userData: ${JSON.stringify(userData, null, 2)}`
      );
      debugLogs.push(
        `[${new Date().toISOString()}] 🔍 Mapped registrationData: ${JSON.stringify(registrationData, null, 2)}`
      );

      // 🛡️ STRATEGY 1: XMLHttpRequest con apikey como query param (bypass Kaspersky + CORS)
      let response;
      try {
        response = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          // 🔧 Poner apikey en query param para evitar CORS preflight con headers personalizados
          const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/register?apikey=${encodeURIComponent(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY)}`;

          xhr.open("POST", url);

          // Solo header esencial para evitar CORS preflight
          xhr.setRequestHeader("Content-Type", "application/json");

          xhr.onload = () => {
            console.log("📡 XMLHttpRequest completed:", {
              status: xhr.status,
              statusText: xhr.statusText,
              responseHeaders: xhr.getAllResponseHeaders()?.substring(0, 200),
              responseLength: xhr.responseText?.length,
            });

            debugLogs.push(
              `[${new Date().toISOString()}] 📡 XMLHttpRequest status: ${xhr.status}`
            );
            debugLogs.push(
              `[${new Date().toISOString()}] 📡 XMLHttpRequest headers: ${xhr.getAllResponseHeaders()?.substring(0, 100)}`
            );

            resolve({
              ok: xhr.status >= 200 && xhr.status < 300,
              status: xhr.status,
              json: () => Promise.resolve(JSON.parse(xhr.responseText)),
            });
          };

          xhr.onerror = () => {
            console.log("❌ XMLHttpRequest onerror triggered:", {
              status: xhr.status,
              statusText: xhr.statusText,
              readyState: xhr.readyState,
            });
            debugLogs.push(
              `[${new Date().toISOString()}] ❌ XMLHttpRequest onerror: status=${xhr.status}, readyState=${xhr.readyState}`
            );
            reject(
              new Error(
                `XMLHttpRequest failed: status=${xhr.status}, readyState=${xhr.readyState}`
              )
            );
          };

          xhr.ontimeout = () => {
            console.log("⏰ XMLHttpRequest timeout");
            debugLogs.push(
              `[${new Date().toISOString()}] ⏰ XMLHttpRequest timeout`
            );
            reject(new Error("XMLHttpRequest timeout"));
          };

          // Set timeout
          xhr.timeout = 30000; // 30 segundos

          console.log(
            "📤 Sending XMLHttpRequest to:",
            url.replace(
              process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
              "[API_KEY_HIDDEN]"
            )
          );
          debugLogs.push(
            `[${new Date().toISOString()}] 📤 XMLHttpRequest to: ${url.substring(0, 100)}...`
          );

          xhr.send(JSON.stringify(registrationData));
        });

        console.log("✅ XMLHttpRequest strategy succeeded");
        debugLogs.push(
          `[${new Date().toISOString()}] ✅ XMLHttpRequest strategy succeeded`
        );
      } catch (xhrError) {
        console.log("❌ XMLHttpRequest strategy failed:", xhrError.message);
        debugLogs.push(
          `[${new Date().toISOString()}] ❌ XMLHttpRequest failed: ${xhrError.message}`
        );

        // 🛡️ STRATEGY 2: Fallback a fetch normal con headers (si falla todo lo demás)
        console.log("🔄 Trying fallback fetch strategy...");
        debugLogs.push(
          `[${new Date().toISOString()}] 🔄 Trying fallback fetch strategy...`
        );

        response = await fetch(
          `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/register`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify(registrationData),
          }
        );

        console.log("✅ Fallback fetch strategy completed");
        debugLogs.push(
          `[${new Date().toISOString()}] ✅ Fallback fetch completed with status: ${response.status}`
        );
      }

      console.log("📡 Registration response status:", response.status);
      console.log("📡 Registration response ok:", response.ok);
      debugLogs.push(
        `[${new Date().toISOString()}] 📡 Response status: ${response.status}`
      );
      debugLogs.push(
        `[${new Date().toISOString()}] 📡 Response ok: ${response.ok}`
      );

      const result = await response.json();
      console.log(
        "📡 Registration response body:",
        JSON.stringify(result, null, 2)
      );
      debugLogs.push(
        `[${new Date().toISOString()}] 📡 Response body: ${JSON.stringify(result, null, 2)}`
      );

      // 🔍 GUARDAR LOGS COMPLETOS
      try {
        await AsyncStorage.setItem(
          "registration_debug_logs",
          JSON.stringify(debugLogs)
        );
        console.log("🔍 Debug logs saved to AsyncStorage");
      } catch (storageError) {
        console.log("⚠️ Could not save debug logs:", storageError.message);
      }

      // ✅ REGISTER usa formato diferente - NO enterprise template (función pública)
      // Register: { message: "Registration successful", user: {...}, company: {...} }
      if (result.message === "Registration successful") {
        console.log("✅ Registration successful via Register Edge Function");
        console.log("👤 Created user ID:", result.user?.id);
        console.log("🏢 Created company ID:", result.company?.id);
        debugLogs.push(
          `[${new Date().toISOString()}] ✅ SUCCESS: User ID: ${result.user?.id}, Company ID: ${result.company?.id}`
        );

        // Actualizar logs con éxito
        try {
          await AsyncStorage.setItem(
            "registration_debug_logs",
            JSON.stringify(debugLogs)
          );
        } catch (storageError) {
          console.log("⚠️ Could not update debug logs:", storageError.message);
        }

        return { success: true, ...result };
      } else {
        console.log("❌ Registration failed - unexpected response format");
        console.log(
          "🔍 Expected 'Registration successful', got:",
          result.message
        );
        debugLogs.push(
          `[${new Date().toISOString()}] ❌ FAILED: Expected 'Registration successful', got: ${result.message}`
        );

        // Actualizar logs con fallo
        try {
          await AsyncStorage.setItem(
            "registration_debug_logs",
            JSON.stringify(debugLogs)
          );
        } catch (storageError) {
          console.log("⚠️ Could not update debug logs:", storageError.message);
        }
      }

      throw new Error(result.message || result.error || "Registration failed");
    } catch (error) {
      console.error("❌ Registration error:", error);
      console.error("🔍 Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });

      // Guardar error en logs
      try {
        const existingLogs = await AsyncStorage.getItem(
          "registration_debug_logs"
        );
        const logs = existingLogs ? JSON.parse(existingLogs) : [];
        logs.push(`[${new Date().toISOString()}] ❌ ERROR: ${error.message}`);
        logs.push(
          `[${new Date().toISOString()}] 🔍 Error stack: ${error.stack}`
        );
        await AsyncStorage.setItem(
          "registration_debug_logs",
          JSON.stringify(logs)
        );
      } catch (storageError) {
        console.log("⚠️ Could not save error logs:", storageError.message);
      }

      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Método de logout
  const logout = async () => {
    try {
      console.log("👋 Logging out...");

      const sb = await initSupabase();
      await sb.auth.signOut();

      // El onAuthStateChange se encargará de limpiar el estado
    } catch (error) {
      console.error("❌ Logout error:", error);
      // Limpiar estado manualmente en caso de error
      await clearAuthState();
    }
  };

  // Método para actualizar perfil
  const updateProfile = async (profileData) => {
    try {
      console.log("📝 Updating profile...");

      if (!session?.access_token) {
        throw new Error("No session available");
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/users/${user.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
            apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify(profileData),
        }
      );

      const data = await response.json();

      if (data.success && data.user) {
        setUser(data.user);
        console.log("✅ Profile updated successfully");
        return { success: true, user: data.user };
      }

      throw new Error(data.error || "Profile update failed");
    } catch (error) {
      console.error("❌ Profile update error:", error);
      return { success: false, error: error.message };
    }
  };

  // Método para asegurar que el token esté disponible
  const ensureTokenAvailable = async () => {
    try {
      console.log("🔍 Verifying token availability...");

      // Verificar que tenemos sesión activa
      if (!session?.access_token) {
        console.log("❌ No session available");
        throw new Error("No session available");
      }

      // Verificar que el token no haya expirado
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = session.expires_at;
      const timeUntilExpiry = expiresAt - now;

      console.log("⏰ Token expiry check:", {
        expiresAt: new Date(expiresAt * 1000).toLocaleTimeString(),
        timeUntilExpiry: timeUntilExpiry,
        needsRefresh: timeUntilExpiry < 300, // Menos de 5 minutos
      });

      // Si el token expira en menos de 5 minutos, refrescarlo
      if (timeUntilExpiry < 300) {
        console.log("🔄 Token needs refresh, refreshing session...");

        const sb = await initSupabase();
        const {
          data: { session: refreshedSession },
          error,
        } = await sb.auth.refreshSession();

        if (error) {
          console.error("❌ Failed to refresh session:", error.message);
          throw new Error("Failed to refresh session");
        }

        if (refreshedSession) {
          console.log("✅ Session refreshed successfully");
          setSession(refreshedSession);

          // Actualizar token en AsyncStorage
          await AsyncStorage.setItem(
            "auth_token",
            refreshedSession.access_token
          );

          return refreshedSession.access_token;
        }
      }

      console.log("✅ Token is valid and available");
      return session.access_token;
    } catch (error) {
      console.error("❌ Error ensuring token availability:", error);
      throw error;
    }
  };

  const contextValue = {
    user,
    session,
    isAuthenticated,
    loading,
    initializationState, // Expose initialization state for CompanyContext
    login,
    register,
    logout,
    updateProfile,
    ensureTokenAvailable,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export default AuthContext;
