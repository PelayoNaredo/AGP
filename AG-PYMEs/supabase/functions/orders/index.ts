import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  getOrdersByStatus,
  getOrdersBySupplier,
  extractCompanyId,
} from "../../fixed-controllers/orders.js";

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

    // Rutas para orders
    if (req.method === "GET") {
      // GET /orders?status=pendiente - Obtener órdenes por estado
      if (pathSegments.length === 0 && searchParams.has("status")) {
        const status = searchParams.get("status");
        const result = await getOrdersByStatus(companyId, status);

        if (result.success) {
          return new Response(JSON.stringify(result.data), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          const statusCode = result.error === "Estado inválido" ? 400 : 500;
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

      // GET /orders?supplier=123 - Obtener órdenes por proveedor
      if (pathSegments.length === 0 && searchParams.has("supplier")) {
        const supplierId = searchParams.get("supplier");
        const result = await getOrdersBySupplier(companyId, supplierId);

        if (result.success) {
          return new Response(JSON.stringify(result.data), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          const statusCode =
            result.error === "Proveedor no encontrado" ? 404 : 500;
          return new Response(JSON.stringify({ error: result.error }), {
            status: statusCode,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // GET /orders - Obtener todas las órdenes
      if (pathSegments.length === 0) {
        const result = await getAllOrders(companyId);

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

      // GET /orders/:id - Obtener orden por ID
      if (pathSegments.length === 1) {
        const orderId = pathSegments[0];
        const result = await getOrderById(companyId, orderId);

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
    }

    if (req.method === "POST") {
      // POST /orders - Crear nueva orden
      if (pathSegments.length === 0) {
        const orderData = await req.json();
        const result = await createOrder(companyId, orderData);

        if (result.success) {
          return new Response(JSON.stringify(result.data), {
            status: 201,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          const statusCode =
            result.error === "Datos inválidos"
              ? 400
              : result.error.includes("proveedor")
                ? 400
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
      // PUT /orders/:id - Actualizar orden
      if (pathSegments.length === 1) {
        const orderId = pathSegments[0];
        const orderData = await req.json();
        const result = await updateOrder(companyId, orderId, orderData);

        if (result.success) {
          return new Response(JSON.stringify(result.data), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          const statusCode =
            result.error === "Orden no encontrada"
              ? 404
              : result.error === "Datos inválidos"
                ? 400
                : result.error.includes("proveedor")
                  ? 400
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
      // DELETE /orders/:id - Eliminar orden
      if (pathSegments.length === 1) {
        const orderId = pathSegments[0];
        const result = await deleteOrder(companyId, orderId);

        if (result.success) {
          return new Response(JSON.stringify({ message: result.message }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          const statusCode =
            result.error === "Orden no encontrada"
              ? 404
              : result.error.includes("entregada")
                ? 409
                : result.error.includes("elementos asociados")
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
    console.error("Error en orders EdgeFunction:", error);
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
