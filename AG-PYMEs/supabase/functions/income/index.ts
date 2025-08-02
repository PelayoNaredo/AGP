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
  if (data.ingresos !== undefined && data.ingresos !== null) {
    const ingresos = parseFloat(data.ingresos);
    if (isNaN(ingresos)) {
      errors.push("ingresos debe ser un número válido");
    } else if (ingresos < 0) {
      errors.push("ingresos no puede ser negativo");
    } else if (ingresos > 999999999.99) {
      errors.push("ingresos no puede exceder 999,999,999.99");
    }
  }

  // Validación de fecha de ingreso
  if (data.fecha_ingreso && !isValidDate(data.fecha_ingreso)) {
    errors.push(
      "fecha_ingreso debe ser una fecha válida (YYYY-MM-DD o ISO 8601)"
    );
  }

  // Validación de categoría
  const categoriasValidas = [
    "ventas",
    "servicios",
    "comisiones",
    "intereses",
    "alquileres",
    "inversiones",
    "subsidios",
    "donaciones",
    "cierre",
    "otros",
  ];
  if (data.categoria && !categoriasValidas.includes(data.categoria)) {
    errors.push(`categoria debe ser uno de: ${categoriasValidas.join(", ")}`);
  }

  // Validación de método de ingreso
  const metodosValidos = [
    "efectivo",
    "transferencia",
    "tarjeta",
    "cheque",
    "paypal",
    "stripe",
    "bizum",
    "multiple",
    "otros",
  ];
  if (data.metodo_ingreso && !metodosValidos.includes(data.metodo_ingreso)) {
    errors.push(`metodo_ingreso debe ser uno de: ${metodosValidos.join(", ")}`);
  }

  // Validación de comentarios
  if (data.comentarios && data.comentarios.length > 1000) {
    errors.push("comentarios no puede exceder 1000 caracteres");
  }

  // Validación de fechas lógicas
  if (data.fecha_ingreso) {
    const fechaIngreso = new Date(data.fecha_ingreso);
    const diezAñosAtras = new Date();
    diezAñosAtras.setFullYear(diezAñosAtras.getFullYear() - 10);

    if (fechaIngreso < diezAñosAtras) {
      errors.push("fecha_ingreso no puede ser anterior a 10 años");
    }

    const unAñoAdelante = new Date();
    unAñoAdelante.setFullYear(unAñoAdelante.getFullYear() + 1);

    if (fechaIngreso > unAñoAdelante) {
      errors.push("fecha_ingreso no puede ser posterior a 1 año");
    }
  }

  return errors;
}

// Función auxiliar para validar fecha
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
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

    // GET /income - Obtener todos los ingresos (con filtros opcionales)
    if (method === "GET" && pathSegments.length === 1) {
      try {
        // Obtener parámetros de filtro de la URL
        const filters: any = {};
        const categoria = url.searchParams.get("categoria");
        const metodo_ingreso = url.searchParams.get("metodo_ingreso");
        const fecha_desde = url.searchParams.get("fecha_desde");
        const fecha_hasta = url.searchParams.get("fecha_hasta");
        const monto_min = url.searchParams.get("monto_min");
        const monto_max = url.searchParams.get("monto_max");
        const solo_cierres = url.searchParams.get("solo_cierres");
        const excluir_cierres = url.searchParams.get("excluir_cierres");
        const search = url.searchParams.get("search");

        if (categoria) filters.categoria = categoria;
        if (metodo_ingreso) filters.metodo_ingreso = metodo_ingreso;
        if (fecha_desde) filters.fecha_desde = fecha_desde;
        if (fecha_hasta) filters.fecha_hasta = fecha_hasta;
        if (monto_min) filters.monto_min = monto_min;
        if (monto_max) filters.monto_max = monto_max;
        if (solo_cierres) filters.solo_cierres = solo_cierres;
        if (excluir_cierres) filters.excluir_cierres = excluir_cierres;
        if (search) filters.search = search;

        let query = supabaseAdmin
          .from("income")
          .select("*")
          .eq("company_id", companyId)
          .order("fecha_ingreso", { ascending: false });

        // Aplicar filtros
        if (filters.categoria) {
          query = query.eq("categoria", filters.categoria);
        }

        if (filters.metodo_ingreso) {
          query = query.eq("metodo_ingreso", filters.metodo_ingreso);
        }

        // Filtro por rango de fechas
        if (filters.fecha_desde && filters.fecha_hasta) {
          query = query
            .gte("fecha_ingreso", filters.fecha_desde)
            .lte("fecha_ingreso", filters.fecha_hasta);
        } else if (filters.fecha_desde) {
          query = query.gte("fecha_ingreso", filters.fecha_desde);
        } else if (filters.fecha_hasta) {
          query = query.lte("fecha_ingreso", filters.fecha_hasta);
        }

        // Filtro por monto
        if (filters.monto_min) {
          query = query.gte("ingresos", parseFloat(filters.monto_min));
        }

        if (filters.monto_max) {
          query = query.lte("ingresos", parseFloat(filters.monto_max));
        }

        // Filtro para cierres diarios
        if (filters.solo_cierres === "true") {
          query = query.like("comentarios", "Cierre diario%");
        } else if (filters.excluir_cierres === "true") {
          query = query.not("comentarios", "like", "Cierre diario%");
        }

        // Búsqueda por texto
        if (filters.search) {
          query = query.or(
            `concepto.ilike.%${filters.search}%,comentarios.ilike.%${filters.search}%`
          );
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error al obtener ingresos:", error);
          throw error;
        }

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en getAllIncome:", error);
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

    // GET /income/stats - Obtener estadísticas de ingresos
    if (
      method === "GET" &&
      pathSegments.length === 2 &&
      pathSegments[1] === "stats"
    ) {
      try {
        const { data: incomeData, error } = await supabaseAdmin
          .from("income")
          .select("ingresos, categoria, metodo_ingreso, fecha_ingreso")
          .eq("company_id", companyId);

        if (error) {
          console.error("Error al obtener estadísticas:", error);
          throw error;
        }

        // Calcular estadísticas
        const stats = {
          total_ingresos: 0,
          total_transacciones: incomeData.length,
          promedio_transaccion: 0,
          por_categoria: {},
          por_metodo: {},
          ingreso_maximo: 0,
          ingreso_minimo: incomeData.length > 0 ? Number.MAX_VALUE : 0,
        };

        incomeData.forEach((income) => {
          const monto = parseFloat(income.ingresos);

          stats.total_ingresos += monto;

          if (monto > stats.ingreso_maximo) {
            stats.ingreso_maximo = monto;
          }

          if (monto < stats.ingreso_minimo) {
            stats.ingreso_minimo = monto;
          }

          // Agrupar por categoría
          if (income.categoria) {
            if (!stats.por_categoria[income.categoria]) {
              stats.por_categoria[income.categoria] = { total: 0, count: 0 };
            }
            stats.por_categoria[income.categoria].total += monto;
            stats.por_categoria[income.categoria].count++;
          }

          // Agrupar por método
          if (income.metodo_ingreso) {
            if (!stats.por_metodo[income.metodo_ingreso]) {
              stats.por_metodo[income.metodo_ingreso] = { total: 0, count: 0 };
            }
            stats.por_metodo[income.metodo_ingreso].total += monto;
            stats.por_metodo[income.metodo_ingreso].count++;
          }
        });

        stats.promedio_transaccion =
          stats.total_transacciones > 0
            ? Math.round(
                (stats.total_ingresos / stats.total_transacciones) * 100
              ) / 100
            : 0;

        stats.total_ingresos = Math.round(stats.total_ingresos * 100) / 100;

        if (stats.ingreso_minimo === Number.MAX_VALUE) {
          stats.ingreso_minimo = 0;
        }

        return new Response(JSON.stringify(stats), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en getIncomeStats:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener estadísticas de ingresos",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // GET /income/period/{period} - Obtener resumen por período
    if (
      method === "GET" &&
      pathSegments.length === 3 &&
      pathSegments[1] === "period"
    ) {
      try {
        const period = pathSegments[2];
        const validPeriods = ["day", "week", "month", "year"];

        if (!validPeriods.includes(period)) {
          return new Response(
            JSON.stringify({
              error: "Período inválido. Debe ser: day, week, month o year",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const { data, error } = await supabaseAdmin
          .from("income")
          .select("*")
          .eq("company_id", companyId)
          .order("fecha_ingreso", { ascending: false });

        if (error) {
          console.error("Error al obtener resumen de ingresos:", error);
          throw error;
        }

        // Procesar datos para agrupar por período
        const groupedData = {};

        data.forEach((income) => {
          const date = new Date(income.fecha_ingreso);
          let periodKey;

          switch (period) {
            case "day":
              periodKey = date.toISOString().split("T")[0];
              break;
            case "week":
              const weekStart = new Date(date);
              weekStart.setDate(date.getDate() - date.getDay());
              periodKey = weekStart.toISOString().split("T")[0] + " (semana)";
              break;
            case "month":
              periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
              break;
            case "year":
              periodKey = date.getFullYear().toString();
              break;
          }

          if (!groupedData[periodKey]) {
            groupedData[periodKey] = {
              periodo: periodKey,
              total_ingresos: 0,
              num_transacciones: 0,
              categorias: new Set(),
            };
          }

          groupedData[periodKey].total_ingresos += parseFloat(income.ingresos);
          groupedData[periodKey].num_transacciones++;
          if (income.categoria) {
            groupedData[periodKey].categorias.add(income.categoria);
          }
        });

        // Convertir Set a Array y formatear resultados
        const result = Object.values(groupedData).map((group) => ({
          ...group,
          categorias: Array.from(group.categorias),
          total_ingresos: Math.round(group.total_ingresos * 100) / 100,
        }));

        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en getIncomeByPeriod:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener resumen de ingresos",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // GET /income/closure/{date} - Verificar cierre diario por fecha
    if (
      method === "GET" &&
      pathSegments.length === 3 &&
      pathSegments[1] === "closure"
    ) {
      try {
        const date = pathSegments[2];

        if (!date) {
          return new Response(
            JSON.stringify({ error: "Se requiere especificar una fecha" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const formattedDate = new Date(date).toISOString().split("T")[0];

        const { data, error } = await supabaseAdmin
          .from("income")
          .select("*")
          .eq("company_id", companyId)
          .gte("fecha_ingreso", formattedDate)
          .lt("fecha_ingreso", formattedDate + "T23:59:59.999Z")
          .like("comentarios", "Cierre diario%");

        if (error) {
          console.error("Error al verificar cierre diario:", error);
          throw error;
        }

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en getDailyClosureByDate:", error);
        return new Response(
          JSON.stringify({
            error: "Error al verificar cierre diario",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // GET /income/{id} - Obtener un ingreso por ID
    if (
      method === "GET" &&
      pathSegments.length === 2 &&
      !["stats", "period", "closure"].includes(pathSegments[1])
    ) {
      try {
        const incomeId = parseInt(pathSegments[1]);

        if (isNaN(incomeId)) {
          return new Response(JSON.stringify({ error: "ID inválido" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data, error } = await supabaseAdmin
          .from("income")
          .select("*")
          .eq("company_id", companyId)
          .eq("id_ingreso", incomeId)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            return new Response(
              JSON.stringify({ error: "Ingreso no encontrado" }),
              {
                status: 404,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
          console.error("Error al obtener ingreso:", error);
          throw error;
        }

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en getIncomeById:", error);
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

    // POST /income - Crear un nuevo ingreso
    if (method === "POST" && pathSegments.length === 1) {
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
          fecha_ingreso:
            incomeData.fecha_ingreso || new Date().toISOString().split("T")[0],
          ingresos: parseFloat(incomeData.ingresos),
          concepto: incomeData.concepto,
          categoria: incomeData.categoria || "otros",
          comentarios: incomeData.comentarios || null,
          metodo_ingreso: incomeData.metodo_ingreso || "otros",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabaseAdmin
          .from("income")
          .insert(insertData)
          .select()
          .single();

        if (error) {
          console.error("Error al crear ingreso:", error);
          throw error;
        }

        return new Response(JSON.stringify(data), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en createIncome:", error);
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

    // POST /income/closure - Crear cierre diario
    if (
      method === "POST" &&
      pathSegments.length === 2 &&
      pathSegments[1] === "closure"
    ) {
      try {
        const closureData = await req.json();
        const {
          fecha_ingreso,
          ingresos,
          comentarios,
          force = false,
        } = closureData;

        if (!fecha_ingreso) {
          return new Response(
            JSON.stringify({ error: "Se requiere especificar una fecha" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        if (isNaN(parseFloat(ingresos))) {
          return new Response(
            JSON.stringify({ error: "Monto de ingresos inválido" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Verificar si ya existe un cierre para esta fecha
        const formattedDate = new Date(fecha_ingreso)
          .toISOString()
          .split("T")[0];
        const { data: existingClosure } = await supabaseAdmin
          .from("income")
          .select("*")
          .eq("company_id", companyId)
          .gte("fecha_ingreso", formattedDate)
          .lt("fecha_ingreso", formattedDate + "T23:59:59.999Z")
          .like("comentarios", "Cierre diario%");

        if (existingClosure && existingClosure.length > 0 && !force) {
          return new Response(
            JSON.stringify({
              error: "Ya existe un cierre diario para esta fecha",
              canForce: true,
            }),
            {
              status: 409,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Preparar datos del cierre diario
        const cierreComentario =
          comentarios || `Cierre diario ${fecha_ingreso}`;
        const cierreData = {
          company_id: companyId,
          fecha_ingreso: fecha_ingreso,
          ingresos: parseFloat(ingresos),
          concepto: "Cierre Diario",
          categoria: "cierre",
          comentarios: cierreComentario,
          metodo_ingreso: "multiple",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabaseAdmin
          .from("income")
          .insert(cierreData)
          .select()
          .single();

        if (error) {
          console.error("Error al crear cierre diario:", error);
          throw error;
        }

        return new Response(JSON.stringify(data), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en createDailyClosure:", error);
        return new Response(
          JSON.stringify({
            error: "Error al crear cierre diario",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // PUT /income/{id} - Actualizar un ingreso
    if (method === "PUT" && pathSegments.length === 2) {
      try {
        const incomeId = parseInt(pathSegments[1]);

        if (isNaN(incomeId)) {
          return new Response(JSON.stringify({ error: "ID inválido" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

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
          return new Response(
            JSON.stringify({ error: "Ingreso no encontrado" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Preparar datos para actualización
        const updateData = {
          fecha_ingreso: incomeData.fecha_ingreso,
          ingresos: incomeData.ingresos
            ? parseFloat(incomeData.ingresos)
            : undefined,
          concepto: incomeData.concepto,
          categoria: incomeData.categoria,
          comentarios: incomeData.comentarios,
          metodo_ingreso: incomeData.metodo_ingreso,
          updated_at: new Date().toISOString(),
        };

        // Eliminar campos undefined
        Object.keys(updateData).forEach((key) => {
          if (updateData[key] === undefined) {
            delete updateData[key];
          }
        });

        const { data, error } = await supabaseAdmin
          .from("income")
          .update(updateData)
          .eq("company_id", companyId)
          .eq("id_ingreso", incomeId)
          .select()
          .single();

        if (error) {
          console.error("Error al actualizar ingreso:", error);
          throw error;
        }

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en updateIncome:", error);
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

    // DELETE /income/{id} - Eliminar un ingreso
    if (method === "DELETE" && pathSegments.length === 2) {
      try {
        const incomeId = parseInt(pathSegments[1]);

        if (isNaN(incomeId)) {
          return new Response(JSON.stringify({ error: "ID inválido" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Verificar que el ingreso existe y pertenece a la empresa
        const { data: existingIncome } = await supabaseAdmin
          .from("income")
          .select("id_ingreso")
          .eq("company_id", companyId)
          .eq("id_ingreso", incomeId)
          .single();

        if (!existingIncome) {
          return new Response(
            JSON.stringify({ error: "Ingreso no encontrado" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const { error } = await supabaseAdmin
          .from("income")
          .delete()
          .eq("company_id", companyId)
          .eq("id_ingreso", incomeId);

        if (error) {
          console.error("Error al eliminar ingreso:", error);
          throw error;
        }

        return new Response(
          JSON.stringify({ message: "Ingreso eliminado correctamente" }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Error en deleteIncome:", error);
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
