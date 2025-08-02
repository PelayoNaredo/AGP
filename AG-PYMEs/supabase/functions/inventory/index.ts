import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  getAllInventory,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateSaleQuantities,
  extractCompanyId,
} from "../../fixed-controllers/inventory.js";

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

    // Rutas para inventory
    if (req.method === "GET") {
      // GET /inventory - Obtener todos los productos
      if (pathSegments.length === 0) {
        const result = await getAllInventory(companyId);

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

      // GET /inventory/:id - Obtener producto por ID
      if (pathSegments.length === 1) {
        const productId = pathSegments[0];
        const result = await getProductById(companyId, productId);

        if (result.success) {
          return new Response(JSON.stringify(result.data), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          const status = result.error === "Producto no encontrado" ? 404 : 500;
          return new Response(JSON.stringify({ error: result.error }), {
            status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    if (req.method === "POST") {
      // POST /inventory - Crear nuevo producto
      if (pathSegments.length === 0) {
        const productData = await req.json();
        const result = await createProduct(companyId, productData);

        if (result.success) {
          return new Response(JSON.stringify(result.data), {
            status: 201,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          const status = result.error.includes("ya está registrada")
            ? 409
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
              status,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }

      // POST /inventory/update-sale - Actualizar cantidades después de venta
      if (pathSegments.length === 1 && pathSegments[0] === "update-sale") {
        const requestData = await req.json();
        const result = await updateSaleQuantities(
          companyId,
          requestData.productos
        );

        if (result.success) {
          return new Response(
            JSON.stringify({
              status: 200,
              message: result.message,
              updated: result.data.updated,
              errors: result.data.errors,
            }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        } else {
          const status = result.error === "Datos inválidos" ? 400 : 500;
          return new Response(
            JSON.stringify({
              status: status,
              message: result.error,
              errors: result.details,
            }),
            {
              status,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }
    }

    if (req.method === "PUT") {
      // PUT /inventory/:id - Actualizar producto
      if (pathSegments.length === 1) {
        const productId = pathSegments[0];
        const productData = await req.json();
        const result = await updateProduct(companyId, productId, productData);

        if (result.success) {
          return new Response(JSON.stringify(result.data), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          const status =
            result.error === "Producto no encontrado"
              ? 404
              : result.error.includes("ya está registrada")
                ? 409
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
              status,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }
    }

    if (req.method === "DELETE") {
      // DELETE /inventory/:id - Eliminar producto
      if (pathSegments.length === 1) {
        const productId = pathSegments[0];
        const result = await deleteProduct(companyId, productId);

        if (result.success) {
          return new Response(JSON.stringify({ message: result.message }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          const status =
            result.error === "Producto no encontrado"
              ? 404
              : result.error.includes("ventas asociadas")
                ? 409
                : 500;
          return new Response(JSON.stringify({ error: result.error }), {
            status,
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
    console.error("Error en inventory EdgeFunction:", error);
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
