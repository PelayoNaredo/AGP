/**
 * 🚀 Enterprise Template para Edge Functions - AG-PYMEs (UPDATED: FASE 1 CORS)
 *
 * Fecha: 6 de agosto de 2025
 * Objetivo: Template unificado usando funciones DB nativas + CORS optimizado
 *
 * CARACTERÍSTICAS:
 * ✅ Funciones auth.* nativas de Supabase
 * ✅ RLS context automático con set_current_company_id()
 * ✅ Validación de límites empresariales
 * ✅ Audit logging con contexto completo
 * ✅ Error handling estandarizado
 * ✅ CORS middleware unificado (FASE 1)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// 🔒 FASE 1: Importar nuevo middleware CORS
import {
  withCors,
  createCorsJsonResponse,
  createCorsErrorResponse,
} from "../auth-utils/cors-utils.ts";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

export interface EnterpriseContext {
  user_id: string;
  email: string;
  company_id: string;
  role?: string;
}

export interface BusinessLogicHandler {
  (req: Request, context: EnterpriseContext): Promise<any>;
}

/**
 * Template estándar para Edge Functions empresariales con CORS integrado
 */
export function createEnterpriseHandler(businessLogic: BusinessLogicHandler) {
  return withCors(async function handler(req: Request) {
    try {
      // 🚨 CORS ya manejado por withCors wrapper

      // ✅ PASO 1: Autenticación con funciones DB nativas
      const context = await authenticateWithDB(req);
      if (context instanceof Response) {
        return context; // Error response
      }

      // ✅ PASO 3: Establecer contexto RLS automáticamente
      try {
        await supabaseAdmin.rpc("set_current_company_id", {
          company_uuid: context.company_id,
        });
        console.log("🔧 RLS context set for company:", context.company_id);
      } catch (rlsError) {
        console.error("⚠️ Failed to set RLS context:", rlsError.message);
        // Continuar sin RLS context - logging pero no fallar
      }

      // ✅ PASO 4: Validar límites empresariales
      const limitsCheck = await validateCompanyLimits(context, req);
      if (limitsCheck instanceof Response) {
        return limitsCheck; // Limits exceeded
      }

      // ✅ PASO 5: Audit logging con contexto empresarial
      await auditLog("API_ACCESS", context, {
        endpoint: new URL(req.url).pathname,
        method: req.method,
        timestamp: new Date().toISOString(),
      });

      // ✅ PASO 6: Ejecutar business logic
      const result = await businessLogic(req, context);

      // ✅ PASO 7: Response exitosa con contexto (CORS automático)
      const response = createCorsJsonResponse({
        success: true,
        data: result,
        context: {
          company_id: context.company_id,
          timestamp: new Date().toISOString(),
        },
      });

      // Añadir header adicional de company_id
      response.headers.set("X-Company-ID", context.company_id);
      return response;
    } catch (error) {
      console.error("🚨 Enterprise Handler Error:", error);

      return createCorsErrorResponse("Internal server error", 500);
    }
  });
}

/**
 * Autenticación usando funciones DB nativas
 */
async function authenticateWithDB(
  req: Request
): Promise<EnterpriseContext | Response> {
  const authHeader = req.headers.get("authorization");

  // Validación más robusta del header de autorización
  if (
    !authHeader ||
    typeof authHeader !== "string" ||
    !authHeader.startsWith("Bearer ")
  ) {
    console.log("🚫 Missing or invalid authorization header:", authHeader);
    return errorResponses.missingAuth();
  }

  const token = authHeader.replace("Bearer ", "");

  if (!token || token.trim().length === 0) {
    console.log("🚫 Empty token after Bearer extraction");
    return errorResponses.missingAuth();
  }

  try {
    // ✅ USAR FUNCIONES AUTH NATIVAS DE SUPABASE
    const { data: userData, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !userData?.user) {
      console.log("🚫 Invalid token:", error?.message);
      return errorResponses.invalidToken();
    }

    // ✅ EXTRAER COMPANY_ID DEL JWT METADATA (SEGURO)
    const company_id = userData.user.user_metadata?.company_id;
    const role = userData.user.user_metadata?.role || "user";

    if (!company_id) {
      console.error("🚨 User without company_id:", userData.user.id);
      return errorResponses.noCompany();
    }

    console.log("✅ Authentication successful:", {
      user_id: userData.user.id,
      email: userData.user.email,
      company_id: company_id.slice(0, 8) + "...",
      role,
    });

    return {
      user_id: userData.user.id,
      email: userData.user.email || "",
      company_id,
      role,
    };
  } catch (authError) {
    console.error("🚨 Authentication error:", authError);
    return errorResponses.authFailed(authError.message);
  }
}

/**
 * Validación de límites empresariales usando funciones DB
 */
async function validateCompanyLimits(
  context: EnterpriseContext,
  req: Request
): Promise<void | Response> {
  try {
    const method = req.method;
    const url = new URL(req.url);
    const pathname = url.pathname;

    // 🔍 SKIP VALIDATION FOR READ OPERATIONS
    // Operaciones de lectura (GET) no consumen límites críticos
    if (method === "GET") {
      console.log(
        "📖 Skipping limits validation for read operation:",
        pathname
      );
      return;
    }

    // 🔍 SKIP VALIDATION FOR CERTAIN ENDPOINTS
    // Algunos endpoints son críticos para el funcionamiento básico
    const exemptEndpoints = [
      "/current",
      "/settings",
      "/verify",
      "/plans",
      "/limits",
    ];

    const isExempt = exemptEndpoints.some((endpoint) =>
      pathname.includes(endpoint)
    );
    if (isExempt) {
      console.log(
        "🔓 Skipping limits validation for exempt endpoint:",
        pathname
      );
      return;
    }

    // ✅ VALIDAR LÍMITES ESPECÍFICOS POR TIPO DE OPERACIÓN
    console.log("🔍 Validating company limits for write operation:", pathname);

    // 🔍 DETERMINAR QUE TIPO DE RECURSO VALIDAR SEGÚN EL ENDPOINT
    let resourceType = "users"; // Por defecto validar usuarios

    if (pathname.includes("/clients")) {
      resourceType = "clients";
    } else if (
      pathname.includes("/products") ||
      pathname.includes("/inventory")
    ) {
      resourceType = "products";
    } else if (pathname.includes("/storage") || pathname.includes("/files")) {
      resourceType = "storage";
    }

    const { data: withinLimits, error } = await supabaseAdmin.rpc(
      "check_company_limits",
      {
        company_uuid: context.company_id,
        resource_type: resourceType,
      }
    );

    if (error) {
      console.error("🚨 Error checking company limits:", error);
      return; // Continue on error - no bloquear por error de límites
    }

    if (!withinLimits) {
      // ✅ OBTENER ESTADÍSTICAS PARA ERROR DETALLADO
      const { data: usage } = await supabaseAdmin.rpc(
        "get_company_usage_stats",
        {
          company_uuid: context.company_id,
        }
      );

      console.log("🚫 Company limits exceeded:", {
        company_id: context.company_id,
        usage,
        endpoint: pathname,
        method: method,
      });

      return errorResponses.companyLimitExceeded(context.company_id, usage);
    }

    console.log("✅ Company limits validated for:", context.company_id);
  } catch (limitsError) {
    console.error("⚠️ Company limits validation failed:", limitsError);
    // No fallar la request por error de validación de límites
  }
}

/**
 * Audit logging con contexto empresarial
 */
async function auditLog(
  action: string,
  context: EnterpriseContext,
  metadata?: any
): Promise<void> {
  try {
    // ✅ ENRIQUECER CON ESTADÍSTICAS DE EMPRESA
    const { data: companyStats } = await supabaseAdmin.rpc(
      "get_company_usage_stats",
      {
        company_uuid: context.company_id,
      }
    );

    const auditRecord = {
      action,
      user_id: context.user_id,
      company_id: context.company_id,
      email: context.email,
      role: context.role,
      company_context: companyStats,
      metadata,
      timestamp: new Date().toISOString(),
    };

    console.log(`📊 AUDIT: ${action}`, auditRecord);

    // Opcional: Persistir en tabla de auditoría
    // await supabaseAdmin.from('audit_logs').insert(auditRecord);
  } catch (error) {
    console.error("⚠️ Audit logging failed:", error);
    // No fallar la request por error de audit
  }
}

/**
 * Respuestas de error estandarizadas con CORS integrado
 */
export const errorResponses = {
  missingAuth: () =>
    createCorsErrorResponse("Authorization header required", 401),

  invalidToken: () => createCorsErrorResponse("Invalid or expired token", 401),

  noCompany: () => createCorsErrorResponse("User has no company assigned", 403),

  companyLimitExceeded: (company_id: string, usage?: any) =>
    createCorsErrorResponse("Company usage limits exceeded", 429),

  companySuspended: (company_id: string, company_name?: string) =>
    createCorsErrorResponse("Company account suspended", 403),

  authFailed: (details: string) =>
    createCorsErrorResponse(`Authentication failed: ${details}`, 401),

  internalError: (message: string) =>
    createCorsErrorResponse(`Internal server error: ${message}`, 500),
};

/**
 * Utilidades de respuesta exitosa
 */
export const successResponses = {
  data: (data: any, context?: EnterpriseContext) =>
    new Response(
      JSON.stringify({
        success: true,
        data,
        context: context
          ? {
              company_id: context.company_id,
              timestamp: new Date().toISOString(),
            }
          : undefined,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    ),

  message: (message: string, data?: any) =>
    new Response(
      JSON.stringify({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    ),
};
