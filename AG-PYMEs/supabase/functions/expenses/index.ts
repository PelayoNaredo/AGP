import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Configuración de Supabase
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Cliente con SERVICE_ROLE_KEY para operaciones administrativas
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

// Función para extraer company_id del JWT
function extractCompanyId(authHeader: string | null): number | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.company_id || null;
  } catch (error) {
    console.error("Error extracting company_id:", error);
    return null;
  }
}

// Función para validar datos de gasto
function validateExpenseData(data: any, isUpdate = false): string[] {
  const errors: string[] = [];

  // Campos obligatorios en creación
  if (!isUpdate) {
    if (!data.concepto) {
      errors.push("concepto es obligatorio");
    }

    if (!data.monto) {
      errors.push("monto es obligatorio");
    }

    if (!data.fecha_gasto) {
      errors.push("fecha_gasto es obligatorio");
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

  // Validación de monto
  if (data.monto !== undefined) {
    const monto = parseFloat(data.monto);
    if (isNaN(monto) || monto <= 0) {
      errors.push("monto debe ser un número positivo mayor que 0");
    }
    if (monto > 999999.99) {
      errors.push("monto no puede exceder 999,999.99");
    }
  }

  // Validación de fecha de gasto
  if (data.fecha_gasto && !isValidDate(data.fecha_gasto)) {
    errors.push("fecha_gasto debe ser una fecha válida (YYYY-MM-DD)");
  }

  // Validación de fecha no muy en el futuro
  if (data.fecha_gasto) {
    const fechaGasto = new Date(data.fecha_gasto);
    const tresMesesAdelante = new Date();
    tresMesesAdelante.setMonth(tresMesesAdelante.getMonth() + 3);

    if (fechaGasto > tresMesesAdelante) {
      errors.push("fecha_gasto no puede ser más de 3 meses en el futuro");
    }

    const cincoAñosAtras = new Date();
    cincoAñosAtras.setFullYear(cincoAñosAtras.getFullYear() - 5);

    if (fechaGasto < cincoAñosAtras) {
      errors.push("fecha_gasto no puede ser anterior a 5 años");
    }
  }

  // Validación de tipo de gasto
  const tiposValidos = [
    "operativo",
    "administrativo",
    "marketing",
    "ventas",
    "tecnologia",
    "recursos_humanos",
    "financiero",
    "legal",
    "mantenimiento",
    "otro",
  ];
  if (data.tipo_gasto && !tiposValidos.includes(data.tipo_gasto)) {
    errors.push(`tipo_gasto debe ser uno de: ${tiposValidos.join(", ")}`);
  }

  // Validación de comentarios (longitud máxima)
  if (data.comentarios && data.comentarios.length > 500) {
    errors.push("comentarios no puede exceder 500 caracteres");
  }

  return errors;
}

// Función auxiliar para validar fecha
function isValidDate(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return (
    date instanceof Date &&
    !isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === dateString
  );
}

serve(async (req) => {
  // Configurar CORS
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  };

  // Manejar preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar autenticación
    const authHeader = req.headers.get("Authorization");
    const companyId = extractCompanyId(authHeader);

    if (!companyId) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const pathSegments = url.pathname.split("/").filter(Boolean);
    const method = req.method;

    // GET /expenses - Obtener gastos con paginación y filtros
    if (method === "GET" && pathSegments.length === 1) {
      try {
        // Obtener parámetros de consulta
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "50");
        const search = url.searchParams.get("search") || "";
        const tipo_gasto = url.searchParams.get("tipo_gasto");
        const fecha_desde = url.searchParams.get("fecha_desde");
        const fecha_hasta = url.searchParams.get("fecha_hasta");
        const monto_min = url.searchParams.get("monto_min");
        const monto_max = url.searchParams.get("monto_max");

        const offset = (page - 1) * limit;

        // Construir query con filtros
        let query = supabaseAdmin
          .from("expenses")
          .select("*", { count: "exact" })
          .eq("company_id", companyId);

        // Aplicar búsqueda si se proporciona
        if (search) {
          query = query.or(
            `concepto.ilike.%${search}%,comentarios.ilike.%${search}%`
          );
        }

        // Aplicar filtros adicionales
        if (tipo_gasto) {
          query = query.eq("tipo_gasto", tipo_gasto);
        }

        if (fecha_desde && fecha_hasta) {
          query = query
            .gte("fecha_gasto", fecha_desde)
            .lte("fecha_gasto", fecha_hasta);
        } else if (fecha_desde) {
          query = query.gte("fecha_gasto", fecha_desde);
        } else if (fecha_hasta) {
          query = query.lte("fecha_gasto", fecha_hasta);
        }

        if (monto_min) {
          query = query.gte("monto", parseFloat(monto_min));
        }

        if (monto_max) {
          query = query.lte("monto", parseFloat(monto_max));
        }

        // Ordenar y paginar
        const { data, error, count } = await query
          .order("fecha_gasto", { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) {
          console.error("Error al obtener gastos:", error);
          throw error;
        }

        const totalPages = Math.ceil((count || 0) / limit);

        const response = {
          data: data,
          totalPages: totalPages,
          currentPage: page,
          totalItems: count || 0,
        };

        return new Response(JSON.stringify(response), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en getExpenses:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener gastos",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // GET /expenses/month - Obtener gastos del mes
    if (
      method === "GET" &&
      pathSegments.length === 2 &&
      pathSegments[1] === "month"
    ) {
      try {
        const month = url.searchParams.get("month");
        const year = url.searchParams.get("year");
        const search = url.searchParams.get("search") || "";

        if (!month || !year) {
          return new Response(
            JSON.stringify({
              error: "Se requieren los parámetros month y year",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Validar mes y año
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);

        if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
          return new Response(
            JSON.stringify({ error: "El mes debe ser un número entre 1 y 12" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
          return new Response(
            JSON.stringify({
              error: "El año debe ser un número entre 2000 y 2100",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Crear fechas de inicio y fin del mes
        const fechaInicio = `${yearNum}-${monthNum.toString().padStart(2, "0")}-01`;
        const ultimoDiaDelMes = new Date(yearNum, monthNum, 0).getDate();
        const fechaFin = `${yearNum}-${monthNum.toString().padStart(2, "0")}-${ultimoDiaDelMes}`;

        let query = supabaseAdmin
          .from("expenses")
          .select("*")
          .eq("company_id", companyId)
          .gte("fecha_gasto", fechaInicio)
          .lte("fecha_gasto", fechaFin);

        // Aplicar búsqueda si se proporciona
        if (search) {
          query = query.or(
            `concepto.ilike.%${search}%,comentarios.ilike.%${search}%`
          );
        }

        const { data, error } = await query.order("fecha_gasto", {
          ascending: false,
        });

        if (error) {
          console.error("Error al obtener gastos del mes:", error);
          throw error;
        }

        // Calcular totales
        const totalMonto = data.reduce(
          (sum, expense) => sum + parseFloat(expense.monto),
          0
        );
        const totalGastos = data.length;

        const response = {
          data: data,
          month: monthNum,
          year: yearNum,
          summary: {
            totalGastos: totalGastos,
            totalMonto: totalMonto,
            promedioGasto: totalGastos > 0 ? totalMonto / totalGastos : 0,
          },
        };

        return new Response(JSON.stringify(response), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en getExpensesByMonth:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener gastos del mes",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // GET /expenses/stats - Obtener estadísticas de gastos
    if (
      method === "GET" &&
      pathSegments.length === 2 &&
      pathSegments[1] === "stats"
    ) {
      try {
        const fecha_desde = url.searchParams.get("fecha_desde");
        const fecha_hasta = url.searchParams.get("fecha_hasta");

        let query = supabaseAdmin
          .from("expenses")
          .select("monto, tipo_gasto, fecha_gasto")
          .eq("company_id", companyId);

        // Aplicar filtros de fecha si se proporcionan
        if (fecha_desde && fecha_hasta) {
          query = query
            .gte("fecha_gasto", fecha_desde)
            .lte("fecha_gasto", fecha_hasta);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error al obtener estadísticas:", error);
          throw error;
        }

        // Calcular estadísticas
        const stats = {
          total_gastos: data.length,
          monto_total: 0,
          promedio_gasto: 0,
          por_tipo: {
            operativo: 0,
            administrativo: 0,
            marketing: 0,
            ventas: 0,
            tecnologia: 0,
            recursos_humanos: 0,
            financiero: 0,
            legal: 0,
            mantenimiento: 0,
            otro: 0,
          },
          gastos_por_mes: {} as any,
        };

        data.forEach((expense) => {
          const monto = parseFloat(expense.monto);
          stats.monto_total += monto;

          // Estadísticas por tipo
          if (
            stats.por_tipo[
              expense.tipo_gasto as keyof typeof stats.por_tipo
            ] !== undefined
          ) {
            stats.por_tipo[expense.tipo_gasto as keyof typeof stats.por_tipo] +=
              monto;
          }

          // Estadísticas por mes
          const fecha = new Date(expense.fecha_gasto);
          const mesAño = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, "0")}`;

          if (!stats.gastos_por_mes[mesAño]) {
            stats.gastos_por_mes[mesAño] = {
              cantidad: 0,
              monto_total: 0,
            };
          }

          stats.gastos_por_mes[mesAño].cantidad++;
          stats.gastos_por_mes[mesAño].monto_total += monto;
        });

        stats.promedio_gasto =
          stats.total_gastos > 0 ? stats.monto_total / stats.total_gastos : 0;

        return new Response(JSON.stringify(stats), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en getExpenseStats:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener estadísticas de gastos",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // GET /expenses/{id} - Obtener un gasto por ID
    if (
      method === "GET" &&
      pathSegments.length === 2 &&
      pathSegments[1] !== "month" &&
      pathSegments[1] !== "stats"
    ) {
      try {
        const expenseId = parseInt(pathSegments[1]);

        if (isNaN(expenseId)) {
          return new Response(JSON.stringify({ error: "ID inválido" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data, error } = await supabaseAdmin
          .from("expenses")
          .select("*")
          .eq("company_id", companyId)
          .eq("id_gasto", expenseId)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            return new Response(
              JSON.stringify({ error: "Gasto no encontrado" }),
              {
                status: 404,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
          console.error("Error al obtener gasto:", error);
          throw error;
        }

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en getExpenseById:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener gasto",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // POST /expenses - Crear un nuevo gasto
    if (method === "POST" && pathSegments.length === 1) {
      try {
        const expenseData = await req.json();

        // Validar datos
        const validationErrors = validateExpenseData(expenseData);
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
          tipo_gasto: expenseData.tipo_gasto || "otro",
          concepto: expenseData.concepto,
          monto: parseFloat(expenseData.monto),
          fecha_gasto: expenseData.fecha_gasto,
          comentarios: expenseData.comentarios || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabaseAdmin
          .from("expenses")
          .insert(insertData)
          .select()
          .single();

        if (error) {
          console.error("Error al crear gasto:", error);
          throw error;
        }

        return new Response(JSON.stringify(data), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en createExpense:", error);
        return new Response(
          JSON.stringify({
            error: "Error al crear gasto",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // PUT /expenses/{id} - Actualizar un gasto
    if (method === "PUT" && pathSegments.length === 2) {
      try {
        const expenseId = parseInt(pathSegments[1]);

        if (isNaN(expenseId)) {
          return new Response(JSON.stringify({ error: "ID inválido" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const expenseData = await req.json();

        // Validar datos
        const validationErrors = validateExpenseData(expenseData, true);
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

        // Verificar que el gasto existe y pertenece a la empresa
        const { data: existingExpense } = await supabaseAdmin
          .from("expenses")
          .select("id_gasto")
          .eq("company_id", companyId)
          .eq("id_gasto", expenseId)
          .single();

        if (!existingExpense) {
          return new Response(
            JSON.stringify({ error: "Gasto no encontrado" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Preparar datos para actualización
        const updateData = {
          tipo_gasto: expenseData.tipo_gasto || "otro",
          concepto: expenseData.concepto,
          monto: parseFloat(expenseData.monto),
          fecha_gasto: expenseData.fecha_gasto,
          comentarios: expenseData.comentarios || null,
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabaseAdmin
          .from("expenses")
          .update(updateData)
          .eq("company_id", companyId)
          .eq("id_gasto", expenseId)
          .select()
          .single();

        if (error) {
          console.error("Error al actualizar gasto:", error);
          throw error;
        }

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en updateExpense:", error);
        return new Response(
          JSON.stringify({
            error: "Error al actualizar gasto",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // DELETE /expenses/{id} - Eliminar un gasto
    if (method === "DELETE" && pathSegments.length === 2) {
      try {
        const expenseId = parseInt(pathSegments[1]);

        if (isNaN(expenseId)) {
          return new Response(JSON.stringify({ error: "ID inválido" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Verificar que el gasto existe y pertenece a la empresa
        const { data: existingExpense } = await supabaseAdmin
          .from("expenses")
          .select("id_gasto")
          .eq("company_id", companyId)
          .eq("id_gasto", expenseId)
          .single();

        if (!existingExpense) {
          return new Response(
            JSON.stringify({ error: "Gasto no encontrado" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const { error } = await supabaseAdmin
          .from("expenses")
          .delete()
          .eq("company_id", companyId)
          .eq("id_gasto", expenseId);

        if (error) {
          console.error("Error al eliminar gasto:", error);
          throw error;
        }

        return new Response(
          JSON.stringify({ message: "Gasto eliminado con éxito" }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Error en deleteExpense:", error);
        return new Response(
          JSON.stringify({
            error: "Error al eliminar gasto",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Si no coincide con ninguna ruta
    return new Response(JSON.stringify({ error: "Endpoint no encontrado" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error general:", error);
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
