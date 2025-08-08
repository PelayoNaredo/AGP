// =============================================
// 🏢 MIDDLEWARE WITH TENANT CONTEXT
// =============================================
// Fecha: 6 de agosto de 2025
// Propósito: Simplificar Edge Functions con contexto automático de empresa
// Parte de: Fase 2 - Optimización Dashboard

import { getUserAndCompanyId } from "./auth-utils.ts";
import { createCorsErrorResponse } from "../auth-utils/cors-utils.ts";

export interface TenantContext {
  companyId: string;
  userId?: string;
}

export interface TenantRequest extends Request {
  tenant?: TenantContext;
}

// 🎯 Middleware principal que inyecta contexto de tenant
export function withTenantContext<T>(
  handler: (req: TenantRequest, context: TenantContext) => Promise<Response>
) {
  return async (req: TenantRequest): Promise<Response> => {
    try {
      // 1. Verificar autenticación
      const authHeader = req.headers.get("authorization");
      if (!authHeader) {
        return createCorsErrorResponse("Token de autorización requerido", 401);
      }

      // 2. Extraer company_id del token
      const token = authHeader.replace("Bearer ", "");
      const { companyId, error: authError } = await getUserAndCompanyId(token);

      if (authError || !companyId) {
        return createCorsErrorResponse(
          authError || "Company ID no encontrado en el token",
          401
        );
      }

      // 3. Crear contexto de tenant
      const context: TenantContext = {
        companyId,
        userId: "", // Por ahora no extraemos userId
      };

      // 4. Inyectar contexto en request
      req.tenant = context;

      // 5. Ejecutar handler con contexto
      return await handler(req, context);
    } catch (error) {
      console.error("❌ Error en withTenantContext:", error);
      return createCorsErrorResponse(
        `Error interno del servidor: ${error.message}`,
        500
      );
    }
  };
}

// 🔧 Función auxiliar para obtener company_id del contexto
export function getCompanyId(context: TenantContext): string {
  return context.companyId;
}

// 🔧 Función auxiliar para obtener user_id del contexto
export function getUserId(context: TenantContext): string {
  return context.userId || "";
}

// 📝 Ejemplo de uso:
// export default withTenantContext(async (req, ctx) => {
//   const { companyId } = ctx;
//
//   const { data } = await supabase.rpc("get_dashboard_data", {
//     p_company_id: companyId,
//   });
//
//   return createCorsJsonResponse(data);
// });
