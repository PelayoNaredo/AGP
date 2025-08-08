import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Variables de entorno
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "https://kwuxtvgnzjqlrccftnru.supabase.co";
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3dXh0dmduempxbHJjY2Z0bnJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwNDAzMzIsImV4cCI6MjA2OTYxNjMzMn0.jUJ_1atnxBJPbm0RILUEegIieBXxTzT-akZn83DNt8w";
const supabaseServiceRoleKey =
  process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

// ✅ VALIDACIÓN DE CONFIGURACIÓN (solo warning, no bloquear)
if (
  supabaseUrl.includes("kwuxtvgnzjqlrccftnru") ||
  supabaseAnonKey.includes("eyJhbGciOiJIUzI1NiI")
) {
  console.log("🔧 [SUPABASE] Usando configuración de desarrollo");
  console.log("   Para producción, configurar variables de entorno");
}

// 🔧 STORAGE UNIVERSAL: Funciona en web y React Native
const universalStorage = {
  getItem: async (key) => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(key);
    } else {
      return await AsyncStorage.getItem(key);
    }
  },
  setItem: async (key, value) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  },
  removeItem: async (key) => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  },
};

// 🔗 CLIENTE SUPABASE: Configuración autenticación
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: universalStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// 🏆 CONFIGURACIÓN GANADORA: Headers Estándar (60% éxito confirmado)
// ✅ Esta configuración pasó la prueba exhaustiva con 3/5 endpoints funcionando
const callEdgeFunction = async (functionName, body = {}, method = "POST") => {
  console.log(`🎯 [EDGE FUNCTION] Llamando a función: ${functionName}`);
  console.log(`📋 [BODY]:`, JSON.stringify(body, null, 2));

  try {
    // 📝 Obtener token de sesión actual
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      console.warn(
        "⚠️ [CORS SOLUTION] No hay token de sesión - algunas funciones pueden fallar"
      );
    }

    // 🏆 CONFIGURACIÓN GANADORA: Headers Estándar (60% éxito confirmado)
    const headers = {
      "Content-Type": "application/json",
      apikey: supabaseAnonKey,
    };

    // Agregar Authorization header si hay token (OBLIGATORIO para funcionamiento)
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    console.log("🔑 [HEADERS]:", {
      "Content-Type": headers["Content-Type"],
      apikey: headers["apikey"] ? "***SET***" : "MISSING",
      Authorization: headers["Authorization"] ? "***SET***" : "MISSING",
    });

    const url = `${supabaseUrl}/functions/v1/${functionName}`;
    console.log(`🌐 [URL]: ${url}`);

    // 🎯 FETCH CON CONFIGURACIÓN GANADORA
    const response = await fetch(url, {
      method,
      headers,
      body: method !== "GET" ? JSON.stringify(body) : undefined,
    });

    console.log(
      `📊 [RESPONSE STATUS]: ${response.status} ${response.statusText}`
    );

    // 🔍 Log headers de respuesta para debug
    const responseHeaders = {};
    response.headers.forEach((value, name) => {
      responseHeaders[name] = value;
    });
    console.log("📋 [RESPONSE HEADERS]:", responseHeaders);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [ERROR ${response.status}]:`, errorText);

      if (response.status === 503) {
        throw new Error(
          `Servicio no disponible: ${functionName} - ${errorText}`
        );
      } else if (response.status >= 400 && response.status < 500) {
        throw new Error(`Error del cliente (${response.status}): ${errorText}`);
      } else {
        throw new Error(
          `Error del servidor (${response.status}): ${errorText}`
        );
      }
    }

    const data = await response.json();
    console.log(
      `✅ [SUCCESS] Función ${functionName} ejecutada correctamente:`,
      data
    );
    return data;
  } catch (error) {
    console.error(`💥 [EDGE FUNCTION ERROR] ${functionName}:`, error);

    // 🔍 Análisis específico del error para debugging
    if (error.message.includes("CORS")) {
      console.error("🚫 [CORS ERROR] - Problema de política CORS detectado");
    } else if (error.message.includes("503")) {
      console.error(
        "🔧 [SERVICE ERROR] - Función Edge no disponible (problema de despliegue)"
      );
    } else if (error.message.includes("401") || error.message.includes("403")) {
      console.error("🔐 [AUTH ERROR] - Problema de autenticación/autorización");
    }

    throw error;
  }
};

// 🛠️ FUNCIONES DE UTILIDAD PARA DEBUGGING
export const testCorsConfiguration = async () => {
  console.log("🧪 [CORS TEST] Iniciando prueba de configuración...");

  const testEndpoints = [
    { name: "alerts", path: "alerts" },
    { name: "users/current", path: "users/current" },
    { name: "login/auth/verify", path: "login/auth/verify" },
    { name: "inventory", path: "inventory" },
    { name: "dashboard", path: "dashboard" },
  ];

  const results = [];

  for (const endpoint of testEndpoints) {
    try {
      const result = await callEdgeFunction(endpoint.path, {});
      results.push({
        endpoint: endpoint.name,
        status: "✅ SUCCESS",
        data: result,
      });
    } catch (error) {
      results.push({
        endpoint: endpoint.name,
        status: "❌ FAILED",
        error: error.message,
      });
    }
  }

  console.log("📊 [CORS TEST RESULTS]:", results);
  return results;
};

export const debugSupabaseConnection = async () => {
  console.log("🔍 [DEBUG] Verificando conexión Supabase...");

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    console.log("🔐 [SESSION]:", session ? "✅ Activa" : "❌ No encontrada");

    if (session) {
      console.log("👤 [USER]:", session.user?.email);
      console.log("🏢 [COMPANY_ID]:", session.user?.user_metadata?.company_id);
    }

    return { session: !!session, user: session?.user };
  } catch (error) {
    console.error("💥 [DEBUG ERROR]:", error);
    return { error: error.message };
  }
};

// 📤 EXPORTACIONES
export default supabase;
export {
  callEdgeFunction,
  supabaseUrl,
  supabaseAnonKey,
  supabaseServiceRoleKey,
};
