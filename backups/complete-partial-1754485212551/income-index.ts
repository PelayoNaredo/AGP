import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getUserAndCompanyId } from "../_shared/auth-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

// Configuración de Supabase
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

// Función para validar datos de ingreso
function validateIncomeData(data: any, isUpdate = false): string[] {
  const errors: string[] = [];

  // Campos obligatorios en creación
  if (!isUpdate) {
    if (!data.concepto) {
      errors.push("concepto es obligatorio");
    }

    if (data.ingresos === undefined || data.ingresos === null) {
      errors.push("ingresos es obligatorio");
    }
  }

  // Validación de concepto
  if (
    data.concepto &&
    (typeof data.concepto !== "string" || data.concepto.trim().length === 0)
  ) {
    errors.push("concepto debe ser un texto válido");
  }

  if (data.concepto && data.concepto.length > 200) {
    errors.push("concepto no puede exceder 200 caracteres");
  }

  // Validación de ingresos
  if (
    data.ingresos !== undefined &&
    (isNaN(parseFloat(data.ingresos)) || parseFloat(data.ingresos) < 0)
  ) {
    errors.push("ingresos debe ser un número positivo");
  }

  // Validación de fecha
  if (data.fecha && !isValidDate(data.fecha)) {
    errors.push("fecha debe ser una fecha válida");
  }

  // Validación de categoría
  const categoriasValidas = [
    "ventas",
    "servicios",
    "comisiones",
    "intereses",
    "alquileres",
    "subvenciones",
    "otros",
  ];
  if (data.categoria && !categoriasValidas.includes(data.categoria)) {
    errors.push(`categoria debe ser una de: ${categoriasValidas.join(", ")}`);
  }

  // Validación de método de pago
  const metodosPago = [
    "efectivo",
    "transferencia",
    "tarjeta",
    "cheque",
    "paypal",
    "otros",
  ];
  if (data.metodo_pago && !metodosPago.includes(data.metodo_pago)) {
    errors.push(`metodo_pago debe ser uno de: ${metodosPago.join(", ")}`);
  }

  return errors;
}

// Función auxiliar para validar fechas
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

async function handleSecureRoute(req: Request) {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split("/").filter((segment) => segment);
  const searchParams = url.searchParams;

  // Autenticación y autorización
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return createCorsErrorResponse("Token de autorización requerido", 401);
  }

  const { companyId, error: authError } = await getUserAndCompanyId(
    authHeader.replace("Bearer ", "")
  );
  if (authError || !companyId) {
    return new Response(
      JSON.stringify({
        error: authError || "Company ID no encontrado en el token",
      }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Rutas para income
  if (req.method === "GET") {
    // GET /income?category=ventas - Obtener ingresos por categoría
    if (pathSegments.length === 0 && searchParams.has("category")) {
      const category = searchParams.get("category")!;

      try {
        const { data, error } = await supabaseAdmin
          .from("income")
          .select("*")
          .eq("company_id", companyId)
          .eq("categoria", category)
          .order("fecha", { ascending: false });

        if (error) throw error;

        return createCorsJsonResponse(data, 200);
      } catch (error: any) {
        console.error("Error al obtener ingresos por categoría:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener ingresos por categoría",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // GET /income?month=2025-08 - Obtener ingresos por mes
    if (pathSegments.length === 0 && searchParams.has("month")) {
      const month = searchParams.get("month")!;

      try {
        const { data, error } = await supabaseAdmin
          .from("income")
          .select("*")
          .eq("company_id", companyId)
          .gte("fecha", `${month}-01`)
          .lt("fecha", `${month}-32`)
          .order("fecha", { ascending: false });

        if (error) throw error;

        return createCorsJsonResponse(data, 200);
      } catch (error: any) {
        console.error("Error al obtener ingresos por mes:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener ingresos por mes",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // GET /income?dateFrom=X&dateTo=Y - Obtener ingresos por rango de fechas
    if (
      pathSegments.length === 0 &&
      searchParams.has("dateFrom") &&
      searchParams.has("dateTo")
    ) {
      const dateFrom = searchParams.get("dateFrom")!;
      const dateTo = searchParams.get("dateTo")!;

      try {
        const { data, error } = await supabaseAdmin
          .from("income")
          .select("*")
          .eq("company_id", companyId)
          .gte("fecha", dateFrom)
          .lte("fecha", dateTo)
          .order("fecha", { ascending: false });

        if (error) throw error;

        return createCorsJsonResponse(data, 200);
      } catch (error: any) {
        console.error("Error al obtener ingresos por rango:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener ingresos por rango",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // GET /income/stats - Obtener estadísticas de ingresos
    if (pathSegments.length === 1 && pathSegments[0] === "stats") {
      try {
        const period = searchParams.get("period") || "month";
        const validPeriods = ["week", "month", "quarter", "year"];

        if (!validPeriods.includes(period)) {
          return new Response(
            JSON.stringify({
              error: "Período inválido. Debe ser: week, month, quarter, year",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Calcular fecha de inicio según el período
        const now = new Date();
        let startDate: Date;

        switch (period) {
          case "week":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "month":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case "quarter":
            const quarter = Math.floor(now.getMonth() / 3);
            startDate = new Date(now.getFullYear(), quarter * 3, 1);
            break;
          case "year":
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
          default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        const { data: incomeData, error } = await supabaseAdmin
          .from("income")
          .select("ingresos, categoria, metodo_pago")
          .eq("company_id", companyId)
          .gte("fecha", startDate.toISOString().split("T")[0]);

        if (error) throw error;

        // Procesar estadísticas
        const stats = {
          general: {
            total_ingresos: incomeData.reduce(
              (sum, income) => sum + parseFloat(income.ingresos || 0),
              0
            ),
            numero_registros: incomeData.length,
            promedio: 0,
            maximo: 0,
            minimo: 0,
          },
          por_categoria: {} as any,
          por_metodo_pago: {} as any,
        };

        if (incomeData.length > 0) {
          const importes = incomeData.map((income) =>
            parseFloat(income.ingresos || 0)
          );
          stats.general.promedio =
            stats.general.total_ingresos / incomeData.length;
          stats.general.maximo = Math.max(...importes);
          stats.general.minimo = Math.min(...importes);

          // Agrupar por categoría
          incomeData.forEach((income) => {
            const categoria = income.categoria || "sin_categoria";
            if (!stats.por_categoria[categoria]) {
              stats.por_categoria[categoria] = { cantidad: 0, total: 0 };
            }
            stats.por_categoria[categoria].cantidad++;
            stats.por_categoria[categoria].total += parseFloat(
              income.ingresos || 0
            );
          });

          // Agrupar por método de pago
          incomeData.forEach((income) => {
            const metodo = income.metodo_pago || "sin_especificar";
            if (!stats.por_metodo_pago[metodo]) {
              stats.por_metodo_pago[metodo] = { cantidad: 0, total: 0 };
            }
            stats.por_metodo_pago[metodo].cantidad++;
            stats.por_metodo_pago[metodo].total += parseFloat(
              income.ingresos || 0
            );
          });
        }

        return createCorsJsonResponse(stats, 200);
      } catch (error: any) {
        console.error("Error al obtener estadísticas:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener estadísticas",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // GET /income - Obtener todos los ingresos
    if (pathSegments.length === 0) {
      try {
        const { data, error } = await supabaseAdmin
          .from("income")
          .select("*")
          .eq("company_id", companyId)
          .order("fecha", { ascending: false })
          .limit(100);

        if (error) throw error;

        return createCorsJsonResponse(data, 200);
      } catch (error: any) {
        console.error("Error al obtener ingresos:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener ingresos",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // GET /income/:id - Obtener ingreso por ID
    if (pathSegments.length === 1 && pathSegments[0] !== "stats") {
      const incomeId = pathSegments[0];

      try {
        const { data, error } = await supabaseAdmin
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

        return createCorsJsonResponse(data, 200);
      } catch (error: any) {
        console.error("Error al obtener ingreso:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener ingreso",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }
  }

  if (req.method === "POST") {
    // POST /income - Crear nuevo ingreso
    if (pathSegments.length === 0) {
      try {
        const incomeData = await req.json();

        // Validar datos
        const validationErrors = validateIncomeData(incomeData);
        if (validationErrors.length > 0) {
          return new Response(
            JSON.stringify({
              error: "Datos inválidos",
              details: validationErrors,
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Preparar datos para inserción
        const insertData = {
          company_id: companyId,
          concepto: incomeData.concepto,
          descripcion: incomeData.descripcion || null,
          ingresos: parseFloat(incomeData.ingresos),
          fecha: incomeData.fecha || new Date().toISOString().split("T")[0],
          categoria: incomeData.categoria || "otros",
          metodo_pago: incomeData.metodo_pago || "efectivo",
          referencia: incomeData.referencia || null,
          cliente_id: incomeData.cliente_id || null,
          factura_id: incomeData.factura_id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabaseAdmin
          .from("income")
          .insert(insertData)
          .select()
          .single();

        if (error) throw error;

        return createCorsJsonResponse(data, 201);
      } catch (error: any) {
        console.error("Error al crear ingreso:", error);
        return new Response(
          JSON.stringify({
            error: "Error al crear ingreso",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }
  }

  if (req.method === "PUT") {
    // PUT /income/:id - Actualizar ingreso
    if (pathSegments.length === 1) {
      const incomeId = pathSegments[0];

      try {
        const incomeData = await req.json();

        // Validar datos
        const validationErrors = validateIncomeData(incomeData, true);
        if (validationErrors.length > 0) {
          return new Response(
            JSON.stringify({
              error: "Datos inválidos",
              details: validationErrors,
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Verificar que el ingreso existe y pertenece a la empresa
        const { data: existingIncome } = await supabaseAdmin
          .from("income")
          .select("id_ingreso")
          .eq("company_id", companyId)
          .eq("id_ingreso", incomeId)
          .single();

        if (!existingIncome) {
          return createCorsErrorResponse("Ingreso no encontrado", 404);
        }

        // Preparar datos para actualización
        const updateData: any = {
          updated_at: new Date().toISOString(),
        };

        if (incomeData.concepto !== undefined) {
          updateData.concepto = incomeData.concepto;
        }
        if (incomeData.descripcion !== undefined) {
          updateData.descripcion = incomeData.descripcion || null;
        }
        if (incomeData.ingresos !== undefined) {
          updateData.ingresos = parseFloat(incomeData.ingresos);
        }
        if (incomeData.fecha !== undefined) {
          updateData.fecha = incomeData.fecha;
        }
        if (incomeData.categoria !== undefined) {
          updateData.categoria = incomeData.categoria;
        }
        if (incomeData.metodo_pago !== undefined) {
          updateData.metodo_pago = incomeData.metodo_pago;
        }
        if (incomeData.referencia !== undefined) {
          updateData.referencia = incomeData.referencia || null;
        }
        if (incomeData.cliente_id !== undefined) {
          updateData.cliente_id = incomeData.cliente_id || null;
        }
        if (incomeData.factura_id !== undefined) {
          updateData.factura_id = incomeData.factura_id || null;
        }

        const { data, error } = await supabaseAdmin
          .from("income")
          .update(updateData)
          .eq("id_ingreso", incomeId)
          .select()
          .single();

        if (error) throw error;

        return createCorsJsonResponse(data, 200);
      } catch (error: any) {
        console.error("Error al actualizar ingreso:", error);
        return new Response(
          JSON.stringify({
            error: "Error al actualizar ingreso",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }
  }

  if (req.method === "DELETE") {
    // DELETE /income/:id - Eliminar ingreso
    if (pathSegments.length === 1) {
      const incomeId = pathSegments[0];

      try {
        // Verificar que el ingreso existe y pertenece a la empresa
        const { data: existingIncome } = await supabaseAdmin
          .from("income")
          .select("id_ingreso")
          .eq("company_id", companyId)
          .eq("id_ingreso", incomeId)
          .single();

        if (!existingIncome) {
          return createCorsErrorResponse("Ingreso no encontrado", 404);
        }

        const { error } = await supabaseAdmin
          .from("income")
          .delete()
          .eq("id_ingreso", incomeId);

        if (error) throw error;

        return new Response(
          JSON.stringify({ message: "Ingreso eliminado correctamente" }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } catch (error: any) {
        console.error("Error al eliminar ingreso:", error);
        return new Response(
          JSON.stringify({
            error: "Error al eliminar ingreso",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }
  }

  // Ruta no encontrada
  return createCorsErrorResponse("Endpoint no encontrado", 404);
}

serve(withCors(async (req) => {
  // Manejar preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    return await handleSecureRoute(req);
  } catch (error: any) {
    console.error("Error en income EdgeFunction:", error);
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
