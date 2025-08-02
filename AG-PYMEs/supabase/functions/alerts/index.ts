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

// Función para validar datos de alerta
function validateAlertData(data: any, isUpdate = false): string[] {
  const errors: string[] = [];

  // Campos obligatorios en creación
  if (!isUpdate) {
    if (!data.titulo) {
      errors.push("titulo es obligatorio");
    }

    if (!data.fecha_recordatorio) {
      errors.push("fecha_recordatorio es obligatorio");
    }
  }

  // Validación de título
  if (
    data.titulo &&
    (typeof data.titulo !== "string" || data.titulo.trim().length === 0)
  ) {
    errors.push("titulo debe ser un texto válido");
  }

  if (data.titulo && data.titulo.length > 200) {
    errors.push("titulo no puede exceder 200 caracteres");
  }

  // Validación de descripción
  if (data.descripcion && data.descripcion.length > 1000) {
    errors.push("descripcion no puede exceder 1000 caracteres");
  }

  // Validación de fecha de recordatorio
  if (data.fecha_recordatorio && !isValidDateTime(data.fecha_recordatorio)) {
    errors.push(
      "fecha_recordatorio debe ser una fecha y hora válida (ISO 8601)"
    );
  }

  // Validación de estado
  const estadosValidos = ["pendiente", "completada", "cancelada"];
  if (data.estado && !estadosValidos.includes(data.estado)) {
    errors.push(`estado debe ser uno de: ${estadosValidos.join(", ")}`);
  }

  // Validación de tipo
  const tiposValidos = [
    "recordatorio",
    "tarea",
    "evento",
    "cita",
    "pago",
    "otro",
  ];
  if (data.tipo && !tiposValidos.includes(data.tipo)) {
    errors.push(`tipo debe ser uno de: ${tiposValidos.join(", ")}`);
  }

  // Validación de prioridad
  const prioridadesValidas = ["baja", "media", "alta", "urgente"];
  if (data.prioridad && !prioridadesValidas.includes(data.prioridad)) {
    errors.push(`prioridad debe ser uno de: ${prioridadesValidas.join(", ")}`);
  }

  // Validación de fecha en el futuro (opcional)
  if (data.fecha_recordatorio) {
    const fechaRecordatorio = new Date(data.fecha_recordatorio);
    const unAñoAtras = new Date();
    unAñoAtras.setFullYear(unAñoAtras.getFullYear() - 1);

    if (fechaRecordatorio < unAñoAtras) {
      errors.push("fecha_recordatorio no puede ser anterior a un año");
    }

    const cincoAñosAdelante = new Date();
    cincoAñosAdelante.setFullYear(cincoAñosAdelante.getFullYear() + 5);

    if (fechaRecordatorio > cincoAñosAdelante) {
      errors.push("fecha_recordatorio no puede ser posterior a 5 años");
    }
  }

  return errors;
}

// Función auxiliar para validar fecha y hora
function isValidDateTime(dateTimeString: string): boolean {
  const date = new Date(dateTimeString);
  return (
    date instanceof Date &&
    !isNaN(date.getTime()) &&
    dateTimeString.includes("T")
  );
}

serve(async (req) => {
  // Configurar CORS
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
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

    // GET /alerts - Obtener todas las alertas (con filtros opcionales)
    if (method === "GET" && pathSegments.length === 1) {
      try {
        // Obtener parámetros de filtro de la URL
        const filters: any = {};
        const estado = url.searchParams.get("estado");
        const tipo = url.searchParams.get("tipo");
        const prioridad = url.searchParams.get("prioridad");
        const fecha_desde = url.searchParams.get("fecha_desde");
        const fecha_hasta = url.searchParams.get("fecha_hasta");
        const vencidas = url.searchParams.get("vencidas");
        const proximas = url.searchParams.get("proximas");

        if (estado) filters.estado = estado;
        if (tipo) filters.tipo = tipo;
        if (prioridad) filters.prioridad = prioridad;
        if (fecha_desde) filters.fecha_desde = fecha_desde;
        if (fecha_hasta) filters.fecha_hasta = fecha_hasta;
        if (vencidas) filters.vencidas = vencidas;
        if (proximas) filters.proximas = proximas;

        let query = supabaseAdmin
          .from("alerts")
          .select("*")
          .eq("company_id", companyId)
          .order("fecha_recordatorio", { ascending: false });

        // Aplicar filtros
        if (filters.estado) {
          query = query.eq("estado", filters.estado);
        }

        if (filters.tipo) {
          query = query.eq("tipo", filters.tipo);
        }

        if (filters.prioridad) {
          query = query.eq("prioridad", filters.prioridad);
        }

        // Filtro por rango de fechas
        if (filters.fecha_desde && filters.fecha_hasta) {
          query = query
            .gte("fecha_recordatorio", filters.fecha_desde)
            .lte("fecha_recordatorio", filters.fecha_hasta);
        } else if (filters.fecha_desde) {
          query = query.gte("fecha_recordatorio", filters.fecha_desde);
        } else if (filters.fecha_hasta) {
          query = query.lte("fecha_recordatorio", filters.fecha_hasta);
        }

        // Filtro para alertas vencidas
        if (filters.vencidas === "true") {
          const ahora = new Date().toISOString();
          query = query
            .lt("fecha_recordatorio", ahora)
            .eq("estado", "pendiente");
        }

        // Filtro para alertas próximas (próximas 24 horas)
        if (filters.proximas === "true") {
          const ahora = new Date();
          const en24Horas = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);
          query = query
            .gte("fecha_recordatorio", ahora.toISOString())
            .lte("fecha_recordatorio", en24Horas.toISOString())
            .eq("estado", "pendiente");
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error al obtener alertas:", error);
          throw error;
        }

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en getAllAlerts:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener alertas",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // GET /alerts/stats - Obtener estadísticas de alertas
    if (
      method === "GET" &&
      pathSegments.length === 2 &&
      pathSegments[1] === "stats"
    ) {
      try {
        // Obtener todas las alertas para calcular estadísticas
        const { data: statsData, error: statsError } = await supabaseAdmin
          .from("alerts")
          .select("estado, prioridad, tipo")
          .eq("company_id", companyId);

        if (statsError) {
          console.error("Error al obtener estadísticas:", statsError);
          throw statsError;
        }

        // Procesar estadísticas
        const stats = {
          total: statsData.length,
          por_estado: {
            pendiente: 0,
            completada: 0,
            cancelada: 0,
          },
          por_prioridad: {
            baja: 0,
            media: 0,
            alta: 0,
            urgente: 0,
          },
          por_tipo: {
            recordatorio: 0,
            tarea: 0,
            evento: 0,
            cita: 0,
            pago: 0,
            otro: 0,
          },
        };

        statsData.forEach((alert) => {
          if (stats.por_estado[alert.estado] !== undefined) {
            stats.por_estado[alert.estado]++;
          }
          if (stats.por_prioridad[alert.prioridad] !== undefined) {
            stats.por_prioridad[alert.prioridad]++;
          }
          if (stats.por_tipo[alert.tipo] !== undefined) {
            stats.por_tipo[alert.tipo]++;
          }
        });

        // Contar alertas vencidas
        const ahora = new Date().toISOString();
        const { count: vencidasCount } = await supabaseAdmin
          .from("alerts")
          .select("*", { count: "exact", head: true })
          .eq("company_id", companyId)
          .eq("estado", "pendiente")
          .lt("fecha_recordatorio", ahora);

        stats.vencidas = vencidasCount || 0;

        // Contar alertas próximas (próximas 24 horas)
        const en24Horas = new Date(
          Date.now() + 24 * 60 * 60 * 1000
        ).toISOString();
        const { count: proximasCount } = await supabaseAdmin
          .from("alerts")
          .select("*", { count: "exact", head: true })
          .eq("company_id", companyId)
          .eq("estado", "pendiente")
          .gte("fecha_recordatorio", ahora)
          .lte("fecha_recordatorio", en24Horas);

        stats.proximas_24h = proximasCount || 0;

        return new Response(JSON.stringify(stats), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en getAlertStats:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener estadísticas de alertas",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // GET /alerts/{id} - Obtener una alerta por ID
    if (
      method === "GET" &&
      pathSegments.length === 2 &&
      pathSegments[1] !== "stats"
    ) {
      try {
        const alertId = parseInt(pathSegments[1]);

        if (isNaN(alertId)) {
          return new Response(JSON.stringify({ error: "ID inválido" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data, error } = await supabaseAdmin
          .from("alerts")
          .select("*")
          .eq("company_id", companyId)
          .eq("id_recordatorio", alertId)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            return new Response(
              JSON.stringify({ error: "Alerta no encontrada" }),
              {
                status: 404,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
          console.error("Error al obtener alerta:", error);
          throw error;
        }

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en getAlertById:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener alerta",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // POST /alerts - Crear una nueva alerta
    if (method === "POST" && pathSegments.length === 1) {
      try {
        const alertData = await req.json();

        // Validar datos
        const validationErrors = validateAlertData(alertData);
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
          titulo: alertData.titulo,
          descripcion: alertData.descripcion || null,
          fecha_recordatorio: alertData.fecha_recordatorio,
          estado: alertData.estado || "pendiente",
          tipo: alertData.tipo || "recordatorio",
          prioridad: alertData.prioridad || "media",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabaseAdmin
          .from("alerts")
          .insert(insertData)
          .select()
          .single();

        if (error) {
          console.error("Error al crear alerta:", error);
          throw error;
        }

        return new Response(JSON.stringify(data), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en createAlert:", error);
        return new Response(
          JSON.stringify({
            error: "Error al crear alerta",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // PUT /alerts/{id} - Actualizar una alerta
    if (method === "PUT" && pathSegments.length === 2) {
      try {
        const alertId = parseInt(pathSegments[1]);

        if (isNaN(alertId)) {
          return new Response(JSON.stringify({ error: "ID inválido" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const alertData = await req.json();

        // Validar datos
        const validationErrors = validateAlertData(alertData, true);
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

        // Verificar que la alerta existe y pertenece a la empresa
        const { data: existingAlert } = await supabaseAdmin
          .from("alerts")
          .select("id_recordatorio")
          .eq("company_id", companyId)
          .eq("id_recordatorio", alertId)
          .single();

        if (!existingAlert) {
          return new Response(
            JSON.stringify({ error: "Alerta no encontrada" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Preparar datos para actualización
        const updateData = {
          titulo: alertData.titulo,
          descripcion: alertData.descripcion || null,
          fecha_recordatorio: alertData.fecha_recordatorio,
          estado: alertData.estado || "pendiente",
          tipo: alertData.tipo || "recordatorio",
          prioridad: alertData.prioridad || "media",
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabaseAdmin
          .from("alerts")
          .update(updateData)
          .eq("company_id", companyId)
          .eq("id_recordatorio", alertId)
          .select()
          .single();

        if (error) {
          console.error("Error al actualizar alerta:", error);
          throw error;
        }

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en updateAlert:", error);
        return new Response(
          JSON.stringify({
            error: "Error al actualizar alerta",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // PATCH /alerts/{id}/complete - Marcar alerta como completada
    if (
      method === "PATCH" &&
      pathSegments.length === 3 &&
      pathSegments[2] === "complete"
    ) {
      try {
        const alertId = parseInt(pathSegments[1]);

        if (isNaN(alertId)) {
          return new Response(JSON.stringify({ error: "ID inválido" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Verificar que la alerta existe y pertenece a la empresa
        const { data: existingAlert } = await supabaseAdmin
          .from("alerts")
          .select("id_recordatorio")
          .eq("company_id", companyId)
          .eq("id_recordatorio", alertId)
          .single();

        if (!existingAlert) {
          return new Response(
            JSON.stringify({ error: "Alerta no encontrada" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const { data, error } = await supabaseAdmin
          .from("alerts")
          .update({
            estado: "completada",
            updated_at: new Date().toISOString(),
          })
          .eq("company_id", companyId)
          .eq("id_recordatorio", alertId)
          .select()
          .single();

        if (error) {
          console.error("Error al completar alerta:", error);
          throw error;
        }

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en markAlertAsCompleted:", error);
        return new Response(
          JSON.stringify({
            error: "Error al marcar alerta como completada",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // DELETE /alerts/{id} - Eliminar una alerta
    if (method === "DELETE" && pathSegments.length === 2) {
      try {
        const alertId = parseInt(pathSegments[1]);

        if (isNaN(alertId)) {
          return new Response(JSON.stringify({ error: "ID inválido" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Verificar que la alerta existe y pertenece a la empresa
        const { data: existingAlert } = await supabaseAdmin
          .from("alerts")
          .select("id_recordatorio")
          .eq("company_id", companyId)
          .eq("id_recordatorio", alertId)
          .single();

        if (!existingAlert) {
          return new Response(
            JSON.stringify({ error: "Alerta no encontrada" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const { error } = await supabaseAdmin
          .from("alerts")
          .delete()
          .eq("company_id", companyId)
          .eq("id_recordatorio", alertId);

        if (error) {
          console.error("Error al eliminar alerta:", error);
          throw error;
        }

        return new Response(
          JSON.stringify({ message: "Alerta eliminada correctamente" }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Error en deleteAlert:", error);
        return new Response(
          JSON.stringify({
            error: "Error al eliminar alerta",
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
