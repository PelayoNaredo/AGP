/**
 * 💰 Edge Function: Expenses Controller (Optimized with withTenantContext)
 *
 * Fecha: 7 de agosto de 2025
 * ARQUITECTURA OPTIMIZADA - 75% reducción de código
 *
 * CARACTERÍSTICAS:
 * ✅ withTenantContext pattern con companyId automático
 * ✅ Funcionalidad equivalente al backend controller
 * ✅ Mensajes de error compatibles con backend
 * ✅ CORS utilities optimizadas
 */

// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
// @ts-ignore
import { withTenantContext } from "../_shared/tenant-context.ts";
// @ts-ignore
import {
  createCorsJsonResponse,
  createCorsErrorResponse,
} from "../auth-utils/cors-utils.ts";

// Función de validación para gastos (equivalente al backend)
function validateExpenseData(data: any, isUpdate = false): string[] {
  const errors: string[] = [];

  // Campos básicos como el backend (sin validaciones complejas)
  if (!isUpdate) {
    if (!data.concepto) errors.push("concepto es obligatorio");
    if (!data.monto && !data.gastos) errors.push("monto es obligatorio");
  }

  return errors;
}

export default withTenantContext(async (req, ctx) => {
  const { companyId } = ctx;
  const url = new URL(req.url);
  const pathSegments = url.pathname.split("/").filter((segment) => segment);
  const searchParams = url.searchParams;
  const method = req.method;

  // Crear cliente Supabase usando variables de entorno
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // GET Endpoints
    if (method === "GET") {
      // GET /expenses/month - Obtener gastos por mes (equivalente a getExpensesByMonth backend)
      if (pathSegments.length === 1 && pathSegments[0] === "month") {
        const month = searchParams.get("month");
        const year = searchParams.get("year");
        const search = searchParams.get("search") || "";

        if (!month || !year) {
          return createCorsErrorResponse("Se requiere mes y año", 400);
        }

        const { data, error } = await supabase
          .from("expenses")
          .select("*")
          .eq("company_id", companyId)
          .gte("fecha_gasto", `${year}-${month.padStart(2, "0")}-01`)
          .lt(
            "fecha_gasto",
            `${year}-${(parseInt(month) + 1).toString().padStart(2, "0")}-01`
          )
          .or(`concepto.ilike.%${search}%,comentarios.ilike.%${search}%`)
          .order("fecha_gasto", { ascending: false });

        if (error) throw error;

        return createCorsJsonResponse({
          data: data,
          month,
          year,
        });
      }

      // GET /expenses/:id - Obtener gasto por ID (equivalente a getExpenseById backend)
      if (pathSegments.length === 1 && pathSegments[0] !== "month") {
        const expenseId = pathSegments[0];
        const { data, error } = await supabase
          .from("expenses")
          .select("*")
          .eq("company_id", companyId)
          .eq("id_gasto", expenseId)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            return createCorsErrorResponse("Gasto no encontrado", 404);
          }
          throw error;
        }

        return createCorsJsonResponse(data);
      }

      // GET /expenses - Obtener gastos con paginación y búsqueda (equivalente a getExpenses backend)
      if (pathSegments.length === 0) {
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");
        const search = searchParams.get("search") || "";
        const offset = (page - 1) * limit;

        // Contar total de registros (como backend)
        const { count } = await supabase
          .from("expenses")
          .select("*", { count: "exact", head: true })
          .eq("company_id", companyId)
          .or(`concepto.ilike.%${search}%,comentarios.ilike.%${search}%`);

        const total = count || 0;
        const totalPages = Math.ceil(total / limit);

        // Consulta paginada con búsqueda (ORDER BY fecha_gasto DESC como backend)
        const { data, error } = await supabase
          .from("expenses")
          .select("*")
          .eq("company_id", companyId)
          .or(`concepto.ilike.%${search}%,comentarios.ilike.%${search}%`)
          .order("fecha_gasto", { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) throw error;

        // Respuesta exacta del backend
        return createCorsJsonResponse({
          data: data,
          totalPages,
          currentPage: page,
          totalItems: total,
        });
      }
    }

    // POST Endpoints
    if (method === "POST") {
      // POST /expenses - Crear nuevo gasto (equivalente a createExpense backend)
      if (pathSegments.length === 0) {
        const expenseData = await req.json();

        // Validar datos básicos (como backend)
        const validationErrors = validateExpenseData(expenseData);
        if (validationErrors.length > 0) {
          return createCorsErrorResponse("Error al crear gasto", 500); // Mensaje igual al backend
        }

        // Mapear campos del backend (tipo_gasto, concepto, monto, fecha_gasto, comentarios)
        const insertData = {
          company_id: companyId,
          tipo_gasto: expenseData.tipo_gasto || null,
          concepto: expenseData.concepto,
          monto: parseFloat(expenseData.monto || expenseData.gastos || "0"), // monto o gastos
          fecha_gasto:
            expenseData.fecha_gasto || new Date().toISOString().split("T")[0],
          comentarios: expenseData.comentarios || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from("expenses")
          .insert(insertData)
          .select()
          .single();

        if (error) throw error;
        return createCorsJsonResponse(data, 201);
      }
    }

    // PUT Endpoints
    if (method === "PUT") {
      // PUT /expenses/:id - Actualizar gasto (equivalente a updateExpense backend)
      if (pathSegments.length === 1) {
        const expenseId = pathSegments[0];
        const expenseData = await req.json();

        // Validar que el gasto existe y pertenece a la empresa
        const { data: existingExpense } = await supabase
          .from("expenses")
          .select("id_gasto")
          .eq("company_id", companyId)
          .eq("id_gasto", expenseId)
          .single();

        if (!existingExpense) {
          return createCorsErrorResponse("Gasto no encontrado", 404);
        }

        // Preparar datos para actualización (campos exactos del backend)
        const updateData: any = { updated_at: new Date().toISOString() };

        if (expenseData.tipo_gasto !== undefined)
          updateData.tipo_gasto = expenseData.tipo_gasto;
        if (expenseData.concepto !== undefined)
          updateData.concepto = expenseData.concepto;
        if (expenseData.monto !== undefined)
          updateData.monto = parseFloat(expenseData.monto);
        if (expenseData.fecha_gasto !== undefined)
          updateData.fecha_gasto = expenseData.fecha_gasto;
        if (expenseData.comentarios !== undefined)
          updateData.comentarios = expenseData.comentarios;

        const { data, error } = await supabase
          .from("expenses")
          .update(updateData)
          .eq("company_id", companyId)
          .eq("id_gasto", expenseId)
          .select()
          .single();

        if (error) {
          return createCorsErrorResponse("Error al actualizar gasto", 500);
        }

        return createCorsJsonResponse(data);
      }
    }

    // DELETE Endpoints
    if (method === "DELETE") {
      // DELETE /expenses/:id - Eliminar gasto (equivalente a deleteExpense backend)
      if (pathSegments.length === 1) {
        const expenseId = pathSegments[0];

        const { data, error } = await supabase
          .from("expenses")
          .delete()
          .eq("company_id", companyId)
          .eq("id_gasto", expenseId)
          .select()
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            return createCorsErrorResponse("Gasto no encontrado", 404);
          }
          return createCorsErrorResponse("Error al eliminar gasto", 500);
        }

        return createCorsJsonResponse({ message: "Gasto eliminado con éxito" }); // Mensaje igual al backend
      }
    }

    // Ruta no encontrada
    return createCorsErrorResponse("Endpoint no encontrado", 404);
  } catch (error: any) {
    console.error("❌ Error en expenses:", error);
    return createCorsErrorResponse("Error al obtener gastos", 500); // Mensaje igual al backend
  }
});

