// =============================================
// 📦 INVENTORY EDGE FUNCTION - VERSIÓN OPTIMIZADA
// =============================================
// Ejemplo de cómo usar withTenantContext para simplificar código
// Compara con la versión anterior y verás la diferencia

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { withTenantContext } from "../_shared/tenant-context.ts";
import {
  createCorsJsonResponse,
  createCorsErrorResponse,
} from "../auth-utils/cors-utils.ts";

// Configuración de Supabase
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

// ✅ NUEVA VERSIÓN SIMPLIFICADA CON withTenantContext
export default withTenantContext(async (req, ctx) => {
  const { companyId } = ctx; // ¡Automáticamente disponible!
  const url = new URL(req.url);
  const method = req.method;

  try {
    // GET /inventory - Obtener todos los productos
    if (method === "GET") {
      const { data: productos, error } = await supabaseAdmin
        .from("inventory")
        .select("*")
        .eq("company_id", companyId) // ¡Sin verificaciones manuales!
        .order("nombre_producto", { ascending: true });

      if (error) throw error;

      return createCorsJsonResponse({
        success: true,
        data: productos || [],
        total: productos?.length || 0,
      });
    }

    // POST /inventory - Crear nuevo producto
    if (method === "POST") {
      const body = await req.json();

      // Validación básica
      if (!body.nombre_producto || !body.precio_unitario) {
        return createCorsErrorResponse("Faltan campos obligatorios", 400);
      }

      const { data: newProduct, error } = await supabaseAdmin
        .from("inventory")
        .insert([
          {
            ...body,
            company_id: companyId, // ¡Automáticamente asignado!
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return createCorsJsonResponse({
        success: true,
        data: newProduct,
        message: "Producto creado exitosamente",
      });
    }

    return createCorsErrorResponse("Método no permitido", 405);
  } catch (error) {
    console.error("❌ Error en inventory:", error);
    return createCorsErrorResponse(`Error del servidor: ${error.message}`, 500);
  }
});

// 🔍 COMPARACIÓN CON LA VERSIÓN ANTERIOR:
//
// ❌ ANTES (85+ líneas de código repetitivo):
// - Verificar authHeader manualmente
// - Extraer company_id manualmente
// - Manejar errores de autenticación
// - Repetir este código en cada función
//
// ✅ AHORA (30 líneas de lógica de negocio):
// - company_id automáticamente disponible
// - Sin código de autenticación repetitivo
// - Foco 100% en la lógica de negocio
// - Código más limpio y mantenible
