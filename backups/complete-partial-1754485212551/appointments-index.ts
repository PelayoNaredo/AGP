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

// Función para validar datos de cita
function validateAppointmentData(data: any, isUpdate = false): string[] {
  const errors: string[] = [];

  // Campos obligatorios en creación
  if (!isUpdate) {
    if (!data.titulo) {
      errors.push("titulo es obligatorio");
    }
    if (!data.fecha_hora) {
      errors.push("fecha_hora es obligatorio");
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

  // Validación de fecha y hora
  if (data.fecha_hora && !isValidDateTime(data.fecha_hora)) {
    errors.push("fecha_hora debe ser una fecha y hora válida");
  }

  // Validación de duración
  if (
    data.duracion_minutos !== undefined &&
    (isNaN(parseInt(data.duracion_minutos)) ||
      parseInt(data.duracion_minutos) <= 0)
  ) {
    errors.push("duracion_minutos debe ser un número positivo");
  }

  // Validación de estado
  const estadosValidos = [
    "programada",
    "confirmada",
    "en_progreso",
    "completada",
    "cancelada",
    "no_asistio",
  ];
  if (data.estado && !estadosValidos.includes(data.estado)) {
    errors.push(`estado debe ser uno de: ${estadosValidos.join(", ")}`);
  }

  // Validación de tipo
  const tiposValidos = [
    "consulta",
    "reunion",
    "seguimiento",
    "presentacion",
    "otros",
  ];
  if (data.tipo && !tiposValidos.includes(data.tipo)) {
    errors.push(`tipo debe ser uno de: ${tiposValidos.join(", ")}`);
  }

  // Validación de prioridad
  const prioridadesValidas = ["baja", "media", "alta", "urgente"];
  if (data.prioridad && !prioridadesValidas.includes(data.prioridad)) {
    errors.push(`prioridad debe ser una de: ${prioridadesValidas.join(", ")}`);
  }

  return errors;
}

// Función auxiliar para validar fecha y hora
function isValidDateTime(dateTimeString: string): boolean {
  const date = new Date(dateTimeString);
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

  // Rutas para appointments
  if (req.method === "GET") {
    // GET /appointments?status=programada - Obtener citas por estado
    if (pathSegments.length === 0 && searchParams.has("status")) {
      const status = searchParams.get("status")!;

      try {
        const { data, error } = await supabaseAdmin
          .from("appointments")
          .select(
            `
            *,
            clients(nombre, email, telefono),
            employees(nombre, apellido)
          `
          )
          .eq("company_id", companyId)
          .eq("estado", status)
          .order("fecha_hora", { ascending: true });

        if (error) throw error;

        return createCorsJsonResponse(data, 200);
      } catch (error: any) {
        console.error("Error al obtener citas por estado:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener citas por estado",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // GET /appointments?date=2025-08-02 - Obtener citas por fecha
    if (pathSegments.length === 0 && searchParams.has("date")) {
      const date = searchParams.get("date")!;

      try {
        const { data, error } = await supabaseAdmin
          .from("appointments")
          .select(
            `
            *,
            clients(nombre, email, telefono),
            employees(nombre, apellido)
          `
          )
          .eq("company_id", companyId)
          .gte("fecha_hora", `${date}T00:00:00`)
          .lt("fecha_hora", `${date}T23:59:59`)
          .order("fecha_hora", { ascending: true });

        if (error) throw error;

        return createCorsJsonResponse(data, 200);
      } catch (error: any) {
        console.error("Error al obtener citas por fecha:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener citas por fecha",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // GET /appointments?client=123 - Obtener citas por cliente
    if (pathSegments.length === 0 && searchParams.has("client")) {
      const clientId = searchParams.get("client")!;

      try {
        const { data, error } = await supabaseAdmin
          .from("appointments")
          .select(
            `
            *,
            clients(nombre, email, telefono),
            employees(nombre, apellido)
          `
          )
          .eq("company_id", companyId)
          .eq("cliente_id", clientId)
          .order("fecha_hora", { ascending: false });

        if (error) throw error;

        return createCorsJsonResponse(data, 200);
      } catch (error: any) {
        console.error("Error al obtener citas por cliente:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener citas por cliente",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // GET /appointments?employee=456 - Obtener citas por empleado
    if (pathSegments.length === 0 && searchParams.has("employee")) {
      const employeeId = searchParams.get("employee")!;

      try {
        const { data, error } = await supabaseAdmin
          .from("appointments")
          .select(
            `
            *,
            clients(nombre, email, telefono),
            employees(nombre, apellido)
          `
          )
          .eq("company_id", companyId)
          .eq("empleado_id", employeeId)
          .order("fecha_hora", { ascending: true });

        if (error) throw error;

        return createCorsJsonResponse(data, 200);
      } catch (error: any) {
        console.error("Error al obtener citas por empleado:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener citas por empleado",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // GET /appointments/today - Obtener citas de hoy
    if (pathSegments.length === 1 && pathSegments[0] === "today") {
      try {
        const today = new Date().toISOString().split("T")[0];

        const { data, error } = await supabaseAdmin
          .from("appointments")
          .select(
            `
            *,
            clients(nombre, email, telefono),
            employees(nombre, apellido)
          `
          )
          .eq("company_id", companyId)
          .gte("fecha_hora", `${today}T00:00:00`)
          .lt("fecha_hora", `${today}T23:59:59`)
          .order("fecha_hora", { ascending: true });

        if (error) throw error;

        return createCorsJsonResponse(data, 200);
      } catch (error: any) {
        console.error("Error al obtener citas de hoy:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener citas de hoy",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // GET /appointments/upcoming - Obtener próximas citas
    if (pathSegments.length === 1 && pathSegments[0] === "upcoming") {
      try {
        const now = new Date().toISOString();

        const { data, error } = await supabaseAdmin
          .from("appointments")
          .select(
            `
            *,
            clients(nombre, email, telefono),
            employees(nombre, apellido)
          `
          )
          .eq("company_id", companyId)
          .gte("fecha_hora", now)
          .in("estado", ["programada", "confirmada"])
          .order("fecha_hora", { ascending: true })
          .limit(10);

        if (error) throw error;

        return createCorsJsonResponse(data, 200);
      } catch (error: any) {
        console.error("Error al obtener próximas citas:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener próximas citas",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // GET /appointments/stats - Obtener estadísticas de citas
    if (pathSegments.length === 1 && pathSegments[0] === "stats") {
      try {
        const { data: appointmentsData, error } = await supabaseAdmin
          .from("appointments")
          .select("estado, tipo, prioridad, fecha_hora")
          .eq("company_id", companyId);

        if (error) throw error;

        // Procesar estadísticas
        const now = new Date();
        const todayStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        const weekStart = new Date(
          todayStart.getTime() - todayStart.getDay() * 24 * 60 * 60 * 1000
        );
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const stats = {
          general: {
            total_citas: appointmentsData.length,
            hoy: appointmentsData.filter((apt) => {
              const aptDate = new Date(apt.fecha_hora);
              return (
                aptDate >= todayStart &&
                aptDate < new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
              );
            }).length,
            esta_semana: appointmentsData.filter(
              (apt) => new Date(apt.fecha_hora) >= weekStart
            ).length,
            este_mes: appointmentsData.filter(
              (apt) => new Date(apt.fecha_hora) >= monthStart
            ).length,
          },
          por_estado: {} as any,
          por_tipo: {} as any,
          por_prioridad: {} as any,
        };

        // Agrupar por estado
        appointmentsData.forEach((apt) => {
          const estado = apt.estado || "sin_especificar";
          stats.por_estado[estado] = (stats.por_estado[estado] || 0) + 1;
        });

        // Agrupar por tipo
        appointmentsData.forEach((apt) => {
          const tipo = apt.tipo || "sin_especificar";
          stats.por_tipo[tipo] = (stats.por_tipo[tipo] || 0) + 1;
        });

        // Agrupar por prioridad
        appointmentsData.forEach((apt) => {
          const prioridad = apt.prioridad || "sin_especificar";
          stats.por_prioridad[prioridad] =
            (stats.por_prioridad[prioridad] || 0) + 1;
        });

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

    // GET /appointments - Obtener todas las citas
    if (pathSegments.length === 0) {
      try {
        const { data, error } = await supabaseAdmin
          .from("appointments")
          .select(
            `
            *,
            clients(nombre, email, telefono),
            employees(nombre, apellido)
          `
          )
          .eq("company_id", companyId)
          .order("fecha_hora", { ascending: false })
          .limit(50);

        if (error) throw error;

        return createCorsJsonResponse(data, 200);
      } catch (error: any) {
        console.error("Error al obtener citas:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener citas",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // GET /appointments/:id - Obtener cita por ID
    if (
      pathSegments.length === 1 &&
      !["today", "upcoming", "stats"].includes(pathSegments[0])
    ) {
      const appointmentId = pathSegments[0];

      try {
        const { data, error } = await supabaseAdmin
          .from("appointments")
          .select(
            `
            *,
            clients(nombre, email, telefono),
            employees(nombre, apellido)
          `
          )
          .eq("company_id", companyId)
          .eq("id_cita", appointmentId)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            return createCorsErrorResponse("Cita no encontrada", 404);
          }
          throw error;
        }

        return createCorsJsonResponse(data, 200);
      } catch (error: any) {
        console.error("Error al obtener cita:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener cita",
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
    // POST /appointments - Crear nueva cita
    if (pathSegments.length === 0) {
      try {
        const appointmentData = await req.json();

        // Validar datos
        const validationErrors = validateAppointmentData(appointmentData);
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

        // Verificar que no haya conflictos de horario si se especifica empleado
        if (appointmentData.empleado_id) {
          const appointmentStart = new Date(appointmentData.fecha_hora);
          const appointmentEnd = new Date(
            appointmentStart.getTime() +
              (appointmentData.duracion_minutos || 60) * 60000
          );

          const { data: conflictingAppointments } = await supabaseAdmin
            .from("appointments")
            .select("id_cita")
            .eq("company_id", companyId)
            .eq("empleado_id", appointmentData.empleado_id)
            .gte("fecha_hora", appointmentStart.toISOString())
            .lt("fecha_hora", appointmentEnd.toISOString())
            .not("estado", "in", "(cancelada,completada)");

          if (conflictingAppointments && conflictingAppointments.length > 0) {
            return new Response(
              JSON.stringify({
                error:
                  "El empleado ya tiene una cita programada en ese horario",
              }),
              {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
        }

        // Preparar datos para inserción
        const insertData = {
          company_id: companyId,
          titulo: appointmentData.titulo,
          descripcion: appointmentData.descripcion || null,
          fecha_hora: appointmentData.fecha_hora,
          duracion_minutos: parseInt(appointmentData.duracion_minutos || "60"),
          cliente_id: appointmentData.cliente_id || null,
          empleado_id: appointmentData.empleado_id || null,
          estado: appointmentData.estado || "programada",
          tipo: appointmentData.tipo || "consulta",
          prioridad: appointmentData.prioridad || "media",
          ubicacion: appointmentData.ubicacion || null,
          notas: appointmentData.notas || null,
          recordatorio_minutos: parseInt(
            appointmentData.recordatorio_minutos || "15"
          ),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabaseAdmin
          .from("appointments")
          .insert(insertData)
          .select(
            `
            *,
            clients(nombre, email, telefono),
            employees(nombre, apellido)
          `
          )
          .single();

        if (error) throw error;

        return createCorsJsonResponse(data, 201);
      } catch (error: any) {
        console.error("Error al crear cita:", error);
        return new Response(
          JSON.stringify({
            error: "Error al crear cita",
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
    // PUT /appointments/:id - Actualizar cita
    if (pathSegments.length === 1) {
      const appointmentId = pathSegments[0];

      try {
        const appointmentData = await req.json();

        // Validar datos
        const validationErrors = validateAppointmentData(appointmentData, true);
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

        // Verificar que la cita existe y pertenece a la empresa
        const { data: existingAppointment } = await supabaseAdmin
          .from("appointments")
          .select("id_cita, fecha_hora, empleado_id")
          .eq("company_id", companyId)
          .eq("id_cita", appointmentId)
          .single();

        if (!existingAppointment) {
          return createCorsErrorResponse("Cita no encontrada", 404);
        }

        // Verificar conflictos de horario si se cambia la fecha/hora o empleado
        if (
          (appointmentData.fecha_hora || appointmentData.empleado_id) &&
          (appointmentData.empleado_id || existingAppointment.empleado_id)
        ) {
          const newDateTime =
            appointmentData.fecha_hora || existingAppointment.fecha_hora;
          const newEmployeeId =
            appointmentData.empleado_id || existingAppointment.empleado_id;

          const appointmentStart = new Date(newDateTime);
          const appointmentEnd = new Date(
            appointmentStart.getTime() +
              (appointmentData.duracion_minutos || 60) * 60000
          );

          const { data: conflictingAppointments } = await supabaseAdmin
            .from("appointments")
            .select("id_cita")
            .eq("company_id", companyId)
            .eq("empleado_id", newEmployeeId)
            .gte("fecha_hora", appointmentStart.toISOString())
            .lt("fecha_hora", appointmentEnd.toISOString())
            .neq("id_cita", appointmentId)
            .not("estado", "in", "(cancelada,completada)");

          if (conflictingAppointments && conflictingAppointments.length > 0) {
            return new Response(
              JSON.stringify({
                error:
                  "El empleado ya tiene una cita programada en ese horario",
              }),
              {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
        }

        // Preparar datos para actualización
        const updateData: any = {
          updated_at: new Date().toISOString(),
        };

        if (appointmentData.titulo !== undefined) {
          updateData.titulo = appointmentData.titulo;
        }
        if (appointmentData.descripcion !== undefined) {
          updateData.descripcion = appointmentData.descripcion || null;
        }
        if (appointmentData.fecha_hora !== undefined) {
          updateData.fecha_hora = appointmentData.fecha_hora;
        }
        if (appointmentData.duracion_minutos !== undefined) {
          updateData.duracion_minutos = parseInt(
            appointmentData.duracion_minutos
          );
        }
        if (appointmentData.cliente_id !== undefined) {
          updateData.cliente_id = appointmentData.cliente_id || null;
        }
        if (appointmentData.empleado_id !== undefined) {
          updateData.empleado_id = appointmentData.empleado_id || null;
        }
        if (appointmentData.estado !== undefined) {
          updateData.estado = appointmentData.estado;
        }
        if (appointmentData.tipo !== undefined) {
          updateData.tipo = appointmentData.tipo;
        }
        if (appointmentData.prioridad !== undefined) {
          updateData.prioridad = appointmentData.prioridad;
        }
        if (appointmentData.ubicacion !== undefined) {
          updateData.ubicacion = appointmentData.ubicacion || null;
        }
        if (appointmentData.notas !== undefined) {
          updateData.notas = appointmentData.notas || null;
        }
        if (appointmentData.recordatorio_minutos !== undefined) {
          updateData.recordatorio_minutos = parseInt(
            appointmentData.recordatorio_minutos
          );
        }

        const { data, error } = await supabaseAdmin
          .from("appointments")
          .update(updateData)
          .eq("id_cita", appointmentId)
          .select(
            `
            *,
            clients(nombre, email, telefono),
            employees(nombre, apellido)
          `
          )
          .single();

        if (error) throw error;

        return createCorsJsonResponse(data, 200);
      } catch (error: any) {
        console.error("Error al actualizar cita:", error);
        return new Response(
          JSON.stringify({
            error: "Error al actualizar cita",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // PUT /appointments/:id/status - Cambiar estado de la cita
    if (pathSegments.length === 2 && pathSegments[1] === "status") {
      const appointmentId = pathSegments[0];

      try {
        const { status } = await req.json();

        const estadosValidos = [
          "programada",
          "confirmada",
          "en_progreso",
          "completada",
          "cancelada",
          "no_asistio",
        ];
        if (!estadosValidos.includes(status)) {
          return new Response(
            JSON.stringify({
              error: `Estado inválido. Debe ser uno de: ${estadosValidos.join(", ")}`,
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Verificar que la cita existe y pertenece a la empresa
        const { data: existingAppointment } = await supabaseAdmin
          .from("appointments")
          .select("id_cita")
          .eq("company_id", companyId)
          .eq("id_cita", appointmentId)
          .single();

        if (!existingAppointment) {
          return createCorsErrorResponse("Cita no encontrada", 404);
        }

        const { data, error } = await supabaseAdmin
          .from("appointments")
          .update({
            estado: status,
            updated_at: new Date().toISOString(),
          })
          .eq("id_cita", appointmentId)
          .select(
            `
            *,
            clients(nombre, email, telefono),
            employees(nombre, apellido)
          `
          )
          .single();

        if (error) throw error;

        return createCorsJsonResponse(data, 200);
      } catch (error: any) {
        console.error("Error al cambiar estado de la cita:", error);
        return new Response(
          JSON.stringify({
            error: "Error al cambiar estado de la cita",
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
    // DELETE /appointments/:id - Eliminar cita
    if (pathSegments.length === 1) {
      const appointmentId = pathSegments[0];

      try {
        // Verificar que la cita existe y pertenece a la empresa
        const { data: existingAppointment } = await supabaseAdmin
          .from("appointments")
          .select("id_cita")
          .eq("company_id", companyId)
          .eq("id_cita", appointmentId)
          .single();

        if (!existingAppointment) {
          return createCorsErrorResponse("Cita no encontrada", 404);
        }

        // En lugar de eliminar completamente, cambiar estado a cancelada
        const { data, error } = await supabaseAdmin
          .from("appointments")
          .update({
            estado: "cancelada",
            updated_at: new Date().toISOString(),
          })
          .eq("id_cita", appointmentId)
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({
            message: "Cita cancelada correctamente",
            appointment: data,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } catch (error: any) {
        console.error("Error al cancelar cita:", error);
        return new Response(
          JSON.stringify({
            error: "Error al cancelar cita",
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
    console.error("Error en appointments EdgeFunction:", error);
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
