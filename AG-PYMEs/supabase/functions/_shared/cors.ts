/**
 * 🔒 CORS Middleware Unificado - FASE 1 DeepSeek Implementation
 *
 * Fecha: 6 de agosto de 2025
 * Objetivo: Eliminar 100% de errores CORS en Edge Functions
 *
 * CARACTERÍSTICAS:
 * ✅ Headers CORS completos y seguros
 * ✅ Manejo de preflight OPTIONS
 * ✅ Compatibilidad cross-browser
 * ✅ Performance optimizado < 50ms
 */

// 🎯 Headers CORS estándar para todas las Edge Functions
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Authorization, Content-Type, X-Company-ID, X-Client-Info",
  "Access-Control-Max-Age": "86400", // 24 horas cache para preflight
} as const;

/**
 * 🔧 Middleware principal para manejar CORS
 * @param response - Response object a decorar con headers CORS
 * @returns Response con headers CORS aplicados
 */
export const handleCors = (response: Response): Response => {
  // Aplicar todos los headers CORS
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
};

/**
 * 🎯 Manejo específico de preflight OPTIONS requests
 * @returns Response optimizada para preflight
 */
export const handlePreflightOptions = (): Response => {
  return new Response(null, {
    status: 204, // No Content
    headers: CORS_HEADERS,
  });
};

/**
 * 🛡️ Wrapper para Edge Functions con CORS automático
 * @param handler - Función Edge Function a wrapear
 * @returns Edge Function con CORS integrado
 */
export const withCors = (handler: (req: Request) => Promise<Response>) => {
  return async (req: Request): Promise<Response> => {
    // Manejar preflight OPTIONS inmediatamente
    if (req.method === "OPTIONS") {
      return handlePreflightOptions();
    }

    try {
      // Ejecutar handler original
      const response = await handler(req);

      // Aplicar CORS a la respuesta
      return handleCors(response);
    } catch (error) {
      // Manejar errores con CORS incluido
      console.error("Edge Function Error:", error);

      const errorResponse = new Response(
        JSON.stringify({
          error:
            error instanceof Error ? error.message : "Internal server error",
          timestamp: new Date().toISOString(),
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return handleCors(errorResponse);
    }
  };
};

/**
 * 🎨 Helper para crear respuestas JSON con CORS
 * @param data - Datos a serializar
 * @param status - HTTP status code (default: 200)
 * @returns Response con CORS y JSON
 */
export const createCorsJsonResponse = (
  data: any,
  status: number = 200
): Response => {
  const response = new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });

  return handleCors(response);
};

/**
 * 🚨 Helper para crear respuestas de error con CORS
 * @param message - Mensaje de error
 * @param status - HTTP status code (default: 400)
 * @param code - Código de error opcional
 * @returns Response de error con CORS
 */
export const createCorsErrorResponse = (
  message: string,
  status: number = 400,
  code?: string
): Response => {
  const errorData = {
    error: message,
    code,
    timestamp: new Date().toISOString(),
  };

  return createCorsJsonResponse(errorData, status);
};

// 🧪 Exportar headers para testing
export { CORS_HEADERS };
