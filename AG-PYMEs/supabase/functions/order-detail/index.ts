import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  getAllOrderDetails,
  getOrderDetailById,
  getDetailsByOrderId,
  createOrderDetail,
  updateOrderDetail,
  deleteOrderDetail,
  extractCompanyId,
} from "../../fixed-controllers/order-detail.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

serve(async (req) => {
  // Manejar preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split("/").filter((segment) => segment);
    const searchParams = url.searchParams;

    // Extraer company_id del JWT
    const authHeader = req.headers.get("authorization");
    const companyId = extractCompanyId(authHeader);

    if (!companyId) {
      return new Response(
        JSON.stringify({ error: "Company ID no encontrado en el token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Rutas para order-detail
    if (req.method === "GET") {
      // GET /order-detail?order=123 - Obtener detalles de una orden específica
      if (pathSegments.length === 0 && searchParams.has("order")) {
        const orderId = searchParams.get("order");
        const result = await getDetailsByOrderId(companyId, orderId);

        if (result.success) {
          return new Response(JSON.stringify(result.data), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          const statusCode = result.error === "Orden no encontrada" ? 404 : 500;
          return new Response(JSON.stringify({ error: result.error }), {
            status: statusCode,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // GET /order-detail - Obtener todos los detalles de órdenes
      if (pathSegments.length === 0) {
        const result = await getAllOrderDetails(companyId);

        if (result.success) {
          return new Response(JSON.stringify(result.data), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          return new Response(JSON.stringify({ error: result.error }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // GET /order-detail/:id - Obtener detalle por ID
      if (pathSegments.length === 1) {
        const detailId = pathSegments[0];
        const result = await getOrderDetailById(companyId, detailId);

        if (result.success) {
          return new Response(JSON.stringify(result.data), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          const statusCode =
            result.error === "Detalle de orden no encontrado" ? 404 : 500;
          return new Response(JSON.stringify({ error: result.error }), {
            status: statusCode,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    if (req.method === "POST") {
      // POST /order-detail - Crear nuevo detalle de orden
      if (pathSegments.length === 0) {
        const detailData = await req.json();
        const result = await createOrderDetail(companyId, detailData);

        if (result.success) {
          return new Response(JSON.stringify(result.data), {
            status: 201,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          const statusCode =
            result.error === "Datos inválidos"
              ? 400
              : result.error.includes("no existe")
                ? 400
                : result.error.includes("Stock insuficiente")
                  ? 400
                  : result.error.includes("ya está incluido")
                    ? 409
                    : result.error.includes("entregada o cancelada")
                      ? 409
                      : 500;
          return new Response(
            JSON.stringify({
              error: result.error,
              details: result.details,
            }),
            {
              status: statusCode,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }
    }

    if (req.method === "PUT") {
      // PUT /order-detail/:id - Actualizar detalle de orden
      if (pathSegments.length === 1) {
        const detailId = pathSegments[0];
        const detailData = await req.json();
        const result = await updateOrderDetail(companyId, detailId, detailData);

        if (result.success) {
          return new Response(JSON.stringify(result.data), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          const statusCode =
            result.error === "Detalle de orden no encontrado"
              ? 404
              : result.error === "Datos inválidos"
                ? 400
                : result.error.includes("no existe")
                  ? 400
                  : result.error.includes("Stock insuficiente")
                    ? 400
                    : result.error.includes("entregada o cancelada")
                      ? 409
                      : 500;
          return new Response(
            JSON.stringify({
              error: result.error,
              details: result.details,
            }),
            {
              status: statusCode,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }
    }

    if (req.method === "DELETE") {
      // DELETE /order-detail/:id - Eliminar detalle de orden
      if (pathSegments.length === 1) {
        const detailId = pathSegments[0];
        const result = await deleteOrderDetail(companyId, detailId);

        if (result.success) {
          return new Response(JSON.stringify({ message: result.message }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          const statusCode =
            result.error === "Detalle de orden no encontrado"
              ? 404
              : result.error.includes("entregada o cancelada")
                ? 409
                : 500;
          return new Response(JSON.stringify({ error: result.error }), {
            status: statusCode,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // Ruta no encontrada
    return new Response(JSON.stringify({ error: "Endpoint no encontrado" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error en order-detail EdgeFunction:", error);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
