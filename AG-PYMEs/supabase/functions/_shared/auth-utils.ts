/**
 * 🔒 Utilidades de Autenticación Segura - AG-PYMEs
 *
 * Fecha: 2 de agosto de 2025
 * Objetivo: Reemplazar extracción insegura de company_id por método seguro
 *
 * REEMPLAZA:
 * - extractCompanyId() inseguro en Edge Functions
 * - Hardcoded company_id
 * - btoa() tokens inseguros
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Configuración de Supabase
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Cliente administrativo
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Interface para datos de autenticación seguros
 */
export interface SecureAuthData {
  user_id: string;
  company_id: string;
  role: string;
  email: string;
  isAuthenticated: boolean;
}

/**
 * Extrae de forma segura los datos de autenticación del usuario
 * REEMPLAZA: extractCompanyId() inseguro
 *
 * @param authHeader - Header Authorization del request
 * @returns Datos de autenticación seguros o null si no es válido
 */
export async function getSecureAuthData(
  authHeader: string | null
): Promise<SecureAuthData | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn("🚫 Auth header missing or invalid format");
    return null;
  }

  const token = authHeader.substring(7);

  try {
    // Usar Supabase para validar el token de forma segura
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      console.warn("🚫 Invalid or expired token:", error?.message);
      return null;
    }

    // Extraer company_id de user_metadata (método seguro)
    const company_id = user.user_metadata?.company_id;
    const role = user.user_metadata?.role || "user";

    if (!company_id) {
      console.error("🚨 CRITICAL: User without company_id:", user.id);
      return null;
    }

    return {
      user_id: user.id,
      company_id: company_id,
      role: role,
      email: user.email || "",
      isAuthenticated: true,
    };
  } catch (error) {
    console.error("🚨 Error validating auth token:", error);
    return null;
  }
}

/**
 * Middleware de autenticación para Edge Functions
 * REEMPLAZA: Validaciones manuales inseguras
 *
 * @param req - Request object
 * @returns Datos de autenticación o Response de error
 */
export async function requireAuthentication(
  req: Request
): Promise<SecureAuthData | Response> {
  const authHeader = req.headers.get("Authorization");
  const authData = await getSecureAuthData(authHeader);

  if (!authData) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Valid authentication required",
        code: "AUTH_REQUIRED",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return authData;
}

/**
 * Valida que el usuario tenga acceso a una empresa específica
 *
 * @param authData - Datos de autenticación del usuario
 * @param targetCompanyId - ID de empresa a validar
 * @returns true si tiene acceso, false si no
 */
export function hasCompanyAccess(
  authData: SecureAuthData,
  targetCompanyId: string
): boolean {
  return authData.company_id === targetCompanyId;
}

/**
 * Valida que el usuario tenga un rol específico
 *
 * @param authData - Datos de autenticación del usuario
 * @param requiredRole - Rol requerido
 * @returns true si tiene el rol, false si no
 */
export function hasRole(
  authData: SecureAuthData,
  requiredRole: string
): boolean {
  return authData.role === requiredRole;
}

/**
 * Valida que el usuario sea administrador
 *
 * @param authData - Datos de autenticación del usuario
 * @returns true si es admin, false si no
 */
export function isAdmin(authData: SecureAuthData): boolean {
  return authData.role === "admin";
}

/**
 * Headers CORS estándar para Edge Functions
 */
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
};

/**
 * Maneja requests OPTIONS para CORS
 *
 * @returns Response para preflight CORS
 */
export function handleCORS(): Response {
  return new Response(null, { headers: CORS_HEADERS });
}

/**
 * Crea response de error estandarizado
 *
 * @param message - Mensaje de error
 * @param status - Código de status HTTP
 * @param code - Código de error interno
 * @returns Response de error
 */
export function createErrorResponse(
  message: string,
  status: number = 500,
  code: string = "INTERNAL_ERROR"
): Response {
  return new Response(
    JSON.stringify({
      error: message,
      code: code,
      timestamp: new Date().toISOString(),
    }),
    {
      status,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    }
  );
}

/**
 * Crea response de éxito estandarizado
 *
 * @param data - Datos de respuesta
 * @param status - Código de status HTTP
 * @returns Response de éxito
 */
export function createSuccessResponse(
  data: any,
  status: number = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

/**
 * Log de auditoría para operaciones críticas
 *
 * @param action - Acción realizada
 * @param authData - Datos del usuario
 * @param details - Detalles adicionales
 */
export function auditLog(
  action: string,
  authData: SecureAuthData,
  details?: any
): void {
  console.log(`🔍 AUDIT: ${action}`, {
    user_id: authData.user_id,
    company_id: authData.company_id,
    role: authData.role,
    email: authData.email,
    timestamp: new Date().toISOString(),
    details: details,
  });
}

/**
 * Función de compatibilidad con Edge Functions existentes
 * REEMPLAZA: getUserAndCompanyId() legacy
 *
 * @param token - JWT token sin el prefijo "Bearer "
 * @returns Object con companyId y error
 */
export async function getUserAndCompanyId(
  token: string
): Promise<{ companyId: string | null; error: string | null }> {
  try {
    const authData = await getSecureAuthData(`Bearer ${token}`);

    if (!authData) {
      return { companyId: null, error: "Token inválido o expirado" };
    }

    return { companyId: authData.company_id, error: null };
  } catch (error: any) {
    return {
      companyId: null,
      error: error.message || "Error de autenticación",
    };
  }
}

// TODO: Eliminar estas funciones inseguras después de la migración
/**
 * @deprecated ❌ INSEGURO - Usar getSecureAuthData() en su lugar
 * Esta función será eliminada en la próxima versión
 */
export function extractCompanyId_DEPRECATED_INSECURE(
  authHeader: string | null
): number | null {
  console.error(
    "🚨 DEPRECATED: extractCompanyId is insecure and will be removed"
  );
  console.error("🔧 USE: getSecureAuthData() instead");
  return null;
}
