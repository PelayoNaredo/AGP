/**
 * 🔐 Edge Function OPTIMIZADA: Login
 *
 * Fecha: 6 de agosto de 2025
 * Objetivo: Optimizar función de autenticación manteniendo funcionalidad
 *
 * OPTIMIZACIONES:
 * ✅ Código más limpio y mantenible
 * ✅ Mejor manejo de errores
 * ✅ Funcionalidad completa mantenida
 * ✅ No usa withTenantContext (correcto para auth)
 * ✅ Validaciones mejoradas
 */

import { createClient } from "jsr:@supabase/supabase-js@^2";
import {
  requireAuthentication,
  createErrorResponse,
  createSuccessResponse,
  SecureAuthData,
} from "../_shared/auth-utils.ts";
import {
  withCors,
  createCorsJsonResponse,
  createCorsErrorResponse,
} from "../auth-utils/cors-utils.ts";

// Configuración de Supabase
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const frontendUrl = Deno.env.get("FRONTEND_URL") || "http://localhost:3000";

// Funciones de validación optimizadas
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password: string): boolean {
  return password && password.length >= 8 && password.length <= 72;
}

function validateStrongPassword(password: string): boolean {
  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return strongPasswordRegex.test(password);
}
// Función de login optimizada
async function loginUser(loginData: any) {
  const { email, password, contrasena } = loginData;

  // Normalizar password field (compatibilidad con diferentes formatos)
  const userPassword = password || contrasena;

  // Validar entrada
  if (!validateEmail(email)) {
    throw new Error("Email inválido");
  }
  if (!validatePassword(userPassword)) {
    throw new Error("Contraseña debe tener al menos 8 caracteres");
  }

  // Autenticar con Supabase
  const supabaseClient = createClient(supabaseUrl, anonKey);
  const { data: authData, error: authError } =
    await supabaseClient.auth.signInWithPassword({
      email: email,
      password: userPassword,
    });

  if (authError || !authData.user) {
    throw new Error("Credenciales inválidas");
  }

  // Obtener perfil de usuario
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  const { data: userData, error: userError } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", authData.user.id)
    .single();

  if (userError && userError.code === "PGRST116") {
    console.log(`❌ User not found in users table: ${authData.user.id}`);
    throw new Error(
      "Usuario no configurado correctamente. Contacta al administrador."
    );
  } else if (userError) {
    throw new Error("Perfil de usuario no encontrado");
  }

  // Verificar estado de la cuenta
  if (!userData.is_active) {
    throw new Error("Cuenta de usuario desactivada");
  }

  // Crear payload del token
  const payload = {
    id_usuario: userData.id,
    email: userData.email,
    nombre: userData.nombre,
    company_id: userData.company_id,
    rol: userData.rol,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 72 * 60 * 60, // 72 horas
  };

  // Crear token simple
  const token = btoa(JSON.stringify(payload));

  return {
    token: token,
    user: {
      id: userData.id,
      email: userData.email,
      nombre: userData.nombre,
      rol: userData.rol,
      company_id: userData.company_id,
    },
    supabase_session: {
      access_token: authData.session?.access_token,
      refresh_token: authData.session?.refresh_token,
      expires_at: authData.session?.expires_at,
    },
  };
}
// Función de reset de contraseña optimizada
async function requestPasswordReset(email: string) {
  // Validar entrada
  if (!validateEmail(email)) {
    throw new Error("Email inválido");
  }

  // Verificar que el usuario existe
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  const { data: userData, error: userError } = await supabaseAdmin
    .from("users")
    .select("id, email")
    .eq("email", email)
    .single();

  if (userError || !userData) {
    throw new Error("Usuario no encontrado");
  }

  // Enviar email de reset
  const supabaseClient = createClient(supabaseUrl, anonKey);
  const { error: resetError } = await supabaseClient.auth.resetPasswordForEmail(
    email,
    {
      redirectTo: `${frontendUrl}/reset-password`,
    }
  );

  if (resetError) {
    throw new Error("Error al enviar correo de restablecimiento");
  }

  return {
    message: "Correo de restablecimiento de contraseña enviado",
    email: email,
  };
}
// Función de cambio de contraseña optimizada
async function changePassword(userId: string, passwords: any) {
  const { current_password, new_password } = passwords;

  // Validar entrada
  if (!current_password) {
    throw new Error("Contraseña actual requerida");
  }
  if (!validatePassword(new_password)) {
    throw new Error("Nueva contraseña debe tener al menos 8 caracteres");
  }
  if (!validateStrongPassword(new_password)) {
    throw new Error(
      "Nueva contraseña debe contener mayúsculas, minúsculas, números y caracteres especiales"
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  // Obtener datos del usuario
  const { data: userData, error: getUserError } =
    await supabaseAdmin.auth.admin.getUserById(userId);
  if (getUserError || !userData.user?.email) {
    throw new Error("Usuario no encontrado");
  }

  // Verificar contraseña actual
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.signInWithPassword({
      email: userData.user.email,
      password: current_password,
    });

  if (authError) {
    throw new Error("Contraseña actual incorrecta");
  }

  // Actualizar contraseña
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    {
      password: new_password,
    }
  );

  if (updateError) {
    throw new Error("Error al actualizar la contraseña");
  }

  return {
    message: "Contraseña actualizada exitosamente",
  };
}
// Función para extraer ID de usuario del header de autorización
async function extractUserId(request: Request): Promise<string | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return null;
  }

  // Token custom (base64)
  if (!authHeader.includes(".")) {
    try {
      const token = authHeader.replace("Bearer ", "");
      const payload = JSON.parse(atob(token));
      return payload.id_usuario;
    } catch {
      // Continúa con JWT de Supabase
    }
  }

  // Token JWT de Supabase
  const token = authHeader.replace("Bearer ", "");

  // Intentar con ANON_KEY primero
  try {
    const supabaseClient = createClient(supabaseUrl, anonKey);
    const {
      data: { user },
      error,
    } = await supabaseClient.auth.getUser(token);

    if (!error && user) {
      return user.id;
    }
  } catch {
    // Continúa con SERVICE_ROLE
  }

  // Fallback: SERVICE_ROLE_KEY
  try {
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (!error && user) {
      return user.id;
    }
  } catch {
    // Ignora error
  }

  return null;
}
export default withCors(async (req: Request) => {
  const url = new URL(req.url);
  const method = req.method;

  // Normalizar pathname
  let pathname = url.pathname;
  if (pathname.startsWith("/functions/v1/login")) {
    pathname = pathname.replace("/functions/v1/login", "");
  }
  if (pathname === "/login") {
    pathname = "/";
  } else if (pathname.startsWith("/login/")) {
    pathname = pathname.replace("/login", "");
  }
  if (pathname === "" || pathname === "/") {
    pathname = "/";
  }

  try {
    if (method === "GET" && pathname === "/") {
      return createCorsJsonResponse({
        message: "Login Controller is running",
        timestamp: new Date().toISOString(),
        endpoints: [
          "GET / - This info",
          "POST /auth/login - User login",
          "POST /auth/reset-password - Request password reset",
          "POST /auth/change-password - Change password (requires auth)",
          "GET /auth/verify - Verify token",
        ],
      });
    }

    // POST / - Login principal (compatible con testing)
    if (method === "POST" && pathname === "/") {
      const body = await req.json();
      const result = await loginUser(body);
      return createCorsJsonResponse(result);
    }

    if (method === "POST" && pathname === "/auth/login") {
      const body = await req.json();
      const result = await loginUser(body);
      return createCorsJsonResponse(result);
    }

    if (method === "POST" && pathname === "/auth/reset-password") {
      const body = await req.json();
      const result = await requestPasswordReset(body.email);
      return createCorsJsonResponse(result);
    }

    if (method === "POST" && pathname === "/auth/change-password") {
      const userId = await extractUserId(req);
      if (!userId) {
        return createCorsErrorResponse("Unauthorized - User ID not found", 401);
      }
      const body = await req.json();
      const result = await changePassword(userId, body);
      return createCorsJsonResponse(result);
    }

    if (method === "GET" && pathname === "/auth/verify") {
      const authResult = await requireAuthentication(req);
      if (authResult instanceof Response) {
        return authResult;
      }

      const authData = authResult as SecureAuthData;

      // Establecer company context para RLS
      try {
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
        await supabaseAdmin.rpc("set_current_company_id", {
          company_uuid: authData.company_id,
        });
      } catch (rlsError) {
        console.error("⚠️ Failed to set RLS context:", rlsError.message);
      }

      // Obtener datos del usuario
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
      const { data: userData, error: userError } = await supabaseAdmin
        .from("users")
        .select("id, email, nombre, rol, company_id, is_active")
        .eq("id", authData.user_id)
        .single();

      if (userError || !userData || !userData.is_active) {
        return createCorsErrorResponse("User not found or inactive", 401);
      }

      return createCorsJsonResponse({
        valid: true,
        user: {
          id: userData.id,
          email: userData.email,
          nombre: userData.nombre,
          rol: userData.rol,
          company_id: userData.company_id,
        },
      });
    }

    return createCorsErrorResponse("Route not found", 404);
  } catch (error) {
    console.error("❌ Unhandled error:", error);
    return createCorsErrorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
});
