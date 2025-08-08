/**
 * 💸 Edge Function: Income Controller (Optimized with withTenantContext)
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

// Función de validación para ingresos (equivalente al backend)
function validateIncomeData(data: any, isUpdate = false): string[] {
  const errors: string[] = [];

  // Campos obligatorios en creación (como backend controller)
  if (!isUpdate) {
    if (!data.concepto) {
      errors.push("El concepto es obligatorio");
    }
    if (!data.ingresos || isNaN(parseFloat(data.ingresos))) {
      errors.push("Monto de ingresos inválido");
    }
  }

  // Validación de ID (como backend)
  if (data.id_ingreso && isNaN(data.id_ingreso)) {
    errors.push("ID inválido");
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
      // GET /income/:id - Obtener ingreso por ID (equivalente a getIncomeById backend)
      if (
        pathSegments.length === 1 &&
        !["stats", "daily-closure", "period"].includes(pathSegments[0])
      ) {
        const incomeId = pathSegments[0];

        // Validación ID (como backend)
        if (isNaN(parseInt(incomeId))) {
          return createCorsErrorResponse("ID inválido", 400);
        }

        const { data, error } = await supabase
          .from("income")
          .select("*")
          .eq("company_id", companyId)
          .eq("id_ingreso", incomeId)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            return createCorsErrorResponse("Ingreso no encontrado", 404);
          }
          throw error;
        }

        return createCorsJsonResponse(data);
      }

      // GET /income/daily-closure/:date - Verificar cierre diario (equivalente a getDailyClosureByDate backend)
      if (pathSegments.length === 2 && pathSegments[0] === "daily-closure") {
        const date = pathSegments[1];

        if (!date) {
          return createCorsErrorResponse(
            "Se requiere especificar una fecha",
            400
          );
        }

        const { data, error } = await supabase
          .from("income")
          .select("*")
          .eq("company_id", companyId)
          .eq("fecha", date)
          .ilike("comentarios", "Cierre diario%");

        if (error) throw error;
        return createCorsJsonResponse(data);
      }

      // GET /income/period/:period - Resumen por período (equivalente a getIncomeByPeriod backend)
      if (pathSegments.length === 2 && pathSegments[0] === "period") {
        const period = pathSegments[1];
        const validPeriods = ["day", "week", "month", "year"];

        if (!validPeriods.includes(period)) {
          return createCorsErrorResponse(
            "Período inválido. Debe ser: day, week, month o year",
            400
          );
        }

        // Para PostgreSQL, usar DATE_TRUNC equivalente
        let dateFunction = "date_trunc";
        const { data, error } = await supabase
          .from("income")
          .select("fecha, ingresos, categoria")
          .eq("company_id", companyId)
          .order("fecha", { ascending: false });

        if (error) throw error;

        // Procesar datos localmente (simulando DATE_TRUNC)
        const groupedData = data.reduce((acc: any, item: any) => {
          const date = new Date(item.fecha);
          let key: string;

          switch (period) {
            case "day":
              key = date.toISOString().split("T")[0];
              break;
            case "week":
              const weekStart = new Date(date);
              weekStart.setDate(date.getDate() - date.getDay());
              key = weekStart.toISOString().split("T")[0];
              break;
            case "month":
              key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;
              break;
            case "year":
              key = date.getFullYear().toString();
              break;
            default:
              key = date.toISOString().split("T")[0];
          }

          if (!acc[key]) {
            acc[key] = {
              periodo: key,
              total_ingresos: 0,
              num_transacciones: 0,
              categorias: new Set(),
            };
          }

          acc[key].total_ingresos += parseFloat(item.ingresos || 0);
          acc[key].num_transacciones++;
          if (item.categoria) acc[key].categorias.add(item.categoria);

          return acc;
        }, {});

        // Convertir a array y formatear
        const result = Object.values(groupedData).map((item: any) => ({
          ...item,
          categorias: Array.from(item.categorias),
        }));

        return createCorsJsonResponse(result);
      }

      // GET /income - Obtener todos los ingresos (equivalente a getAllIncome backend)
      if (pathSegments.length === 0) {
        const { data, error } = await supabase
          .from("income")
          .select("*")
          .eq("company_id", companyId)
          .order("fecha", { ascending: false }); // ORDER BY fecha_ingreso DESC como backend

        if (error) throw error;
        return createCorsJsonResponse(data);
      }
    }

    // POST Endpoints
    if (method === "POST") {
      // POST /income - Crear nuevo ingreso (equivalente a createIncome backend)
      if (pathSegments.length === 0) {
        const incomeData = await req.json();

        // Validar datos (como backend)
        const validationErrors = validateIncomeData(incomeData);
        if (validationErrors.length > 0) {
          return createCorsErrorResponse(validationErrors[0], 400); // Primer error como backend
        }

        // Mapear campos del backend a nombres de BD
        const insertData = {
          company_id: companyId,
          fecha:
            incomeData.fecha_ingreso || new Date().toISOString().split("T")[0], // fecha_ingreso -> fecha
          ingresos: parseFloat(incomeData.ingresos),
          concepto: incomeData.concepto,
          categoria: incomeData.categoria || null,
          comentarios: incomeData.comentarios || null,
          metodo_pago: incomeData.metodo_ingreso || null, // metodo_ingreso -> metodo_pago
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from("income")
          .insert(insertData)
          .select()
          .single();

        if (error) throw error;
        return createCorsJsonResponse(data, 201);
      }

      // POST /income/daily-closure - Crear cierre diario (equivalente a createDailyClosure backend)
      if (pathSegments.length === 1 && pathSegments[0] === "daily-closure") {
        const { fecha_ingreso, ingresos, comentarios } = await req.json();

        if (!fecha_ingreso) {
          return createCorsErrorResponse(
            "Se requiere especificar una fecha",
            400
          );
        }

        if (isNaN(parseFloat(ingresos))) {
          return createCorsErrorResponse("Monto de ingresos inválido", 400);
        }

        // Verificar si ya existe un cierre para esta fecha (lógica del backend)
        const { data: existingClosure } = await supabase
          .from("income")
          .select("id_ingreso")
          .eq("company_id", companyId)
          .eq("fecha", fecha_ingreso)
          .ilike("comentarios", "Cierre diario%");

        if (existingClosure && existingClosure.length > 0) {
          return createCorsErrorResponse(
            "Ya existe un cierre diario para esta fecha",
            409
          );
        }

        // Crear cierre diario (datos exactos del backend)
        const insertData = {
          company_id: companyId,
          fecha: fecha_ingreso,
          ingresos: parseFloat(ingresos),
          concepto: "Cierre Diario",
          categoria: "cierre",
          comentarios: comentarios || `Cierre diario ${fecha_ingreso}`,
          metodo_pago: "multiple",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from("income")
          .insert(insertData)
          .select()
          .single();

        if (error) throw error;
        return createCorsJsonResponse(data, 201);
      }
    }

    // PUT Endpoints
    if (method === "PUT") {
      // PUT /income/:id - Actualizar ingreso (equivalente a updateIncome backend)
      if (pathSegments.length === 1) {
        const incomeId = pathSegments[0];
        const incomeData = await req.json();

        // Validación ID (como backend)
        if (isNaN(parseInt(incomeId))) {
          return createCorsErrorResponse("ID inválido", 400);
        }

        // Preparar datos para actualización usando COALESCE logic del backend
        const updateData: any = { updated_at: new Date().toISOString() };

        if (incomeData.fecha_ingreso !== undefined)
          updateData.fecha = incomeData.fecha_ingreso;
        if (incomeData.ingresos !== undefined)
          updateData.ingresos = parseFloat(incomeData.ingresos);
        if (incomeData.concepto !== undefined)
          updateData.concepto = incomeData.concepto;
        if (incomeData.categoria !== undefined)
          updateData.categoria = incomeData.categoria;
        if (incomeData.comentarios !== undefined)
          updateData.comentarios = incomeData.comentarios;
        if (incomeData.metodo_ingreso !== undefined)
          updateData.metodo_pago = incomeData.metodo_ingreso;

        const { data, error } = await supabase
          .from("income")
          .update(updateData)
          .eq("company_id", companyId)
          .eq("id_ingreso", incomeId)
          .select()
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            return createCorsErrorResponse("Ingreso no encontrado", 404);
          }
          throw error;
        }

        return createCorsJsonResponse(data);
      }
    }

    // DELETE Endpoints
    if (method === "DELETE") {
      // DELETE /income/:id - Eliminar ingreso (equivalente a deleteIncome backend)
      if (pathSegments.length === 1) {
        const incomeId = pathSegments[0];

        // Validación ID (como backend)
        if (isNaN(parseInt(incomeId))) {
          return createCorsErrorResponse("ID inválido", 400);
        }

        const { data, error } = await supabase
          .from("income")
          .delete()
          .eq("company_id", companyId)
          .eq("id_ingreso", incomeId)
          .select()
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            return createCorsErrorResponse("Ingreso no encontrado", 404);
          }
          throw error;
        }

        return createCorsJsonResponse({
          message: "Ingreso eliminado correctamente",
        }); // Mensaje igual al backend
      }
    }

    // Ruta no encontrada
    return createCorsErrorResponse("Endpoint no encontrado", 404);
  } catch (error: any) {
    console.error("❌ Error en income:", error);
    return createCorsErrorResponse("Error interno del servidor", 500); // Mensaje igual al backend
  }
});
