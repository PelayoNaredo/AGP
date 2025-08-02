import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  extractCompanyId,
} from "../../fixed-controllers/suppliers.js";

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

    // Rutas para suppliers
    if (req.method === "GET") {
      // GET /suppliers - Obtener todos los proveedores
      if (pathSegments.length === 0) {
        const result = await getSuppliers(companyId);

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

      // GET /suppliers/:id - Obtener proveedor por ID
      if (pathSegments.length === 1) {
        const supplierId = pathSegments[0];
        const result = await getSupplierById(companyId, supplierId);

        if (result.success) {
          return new Response(JSON.stringify(result.data), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          const status = result.error === "Proveedor no encontrado" ? 404 : 500;
          return new Response(JSON.stringify({ error: result.error }), {
            status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    if (req.method === "POST") {
      // POST /suppliers - Crear nuevo proveedor
      if (pathSegments.length === 0) {
        const supplierData = await req.json();
        const result = await createSupplier(companyId, supplierData);

        if (result.success) {
          return new Response(JSON.stringify(result.data), {
            status: 201,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          const status = result.error.includes("ya está registrado")
            ? 409
            : result.error === "Datos inválidos"
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

    if (req.method === "PUT") {
      // PUT /suppliers/:id - Actualizar proveedor
      if (pathSegments.length === 1) {
        const supplierId = pathSegments[0];
        const supplierData = await req.json();
        const result = await updateSupplier(
          companyId,
          supplierId,
          supplierData
        );

        if (result.success) {
          return new Response(JSON.stringify(result.data), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          const status =
            result.error === "Proveedor no encontrado"
              ? 404
              : result.error.includes("ya está registrado")
                ? 409
                : result.error === "Datos inválidos"
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
      // DELETE /suppliers/:id - Eliminar proveedor
      if (pathSegments.length === 1) {
        const supplierId = pathSegments[0];
        const result = await deleteSupplier(companyId, supplierId);

        if (result.success) {
          return new Response(JSON.stringify({ message: result.message }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          const status =
            result.error === "Proveedor no encontrado"
              ? 404
              : result.error.includes("pedidos asociados")
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
    console.error("Error en suppliers EdgeFunction:", error);
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
