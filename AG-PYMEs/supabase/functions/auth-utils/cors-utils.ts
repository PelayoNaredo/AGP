/**
 * 🔒 CORS Utilities for Edge Functions
 *
 * Utilidades centralizadas para manejo de CORS en Edge Functions
 * Fecha: 6 de agosto de 2025
 */

// Configuración de headers CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

/**
 * Wrapper principal para funciones Edge con soporte CORS
 */
export function withCors(
  handler: (req: Request) => Promise<Response> | Response
) {
  return async (req: Request): Promise<Response> => {
    // Manejar preflight requests (OPTIONS)
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        status: 200,
        headers: corsHeaders,
      });
    }

    try {
      // Ejecutar el handler
      const response = await handler(req);

      // Añadir headers CORS a la respuesta
      const corsResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          ...corsHeaders,
        },
      });

      return corsResponse;
    } catch (error: any) {
      console.error("Error en withCors:", error);
      return createCorsErrorResponse("Error interno del servidor", 500);
    }
  };
}

/**
 * Crear respuesta JSON con headers CORS
 */
export function createCorsJsonResponse(
  data: any,
  status: number = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

/**
 * Crear respuesta de error con headers CORS
 */
export function createCorsErrorResponse(
  message: string,
  status: number = 400
): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

/**
 * Crear respuesta de éxito con headers CORS
 */
export function createCorsSuccessResponse(
  message: string,
  data?: any
): Response {
  const responseData = data ? { message, data } : { message };
  return new Response(JSON.stringify(responseData), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}
