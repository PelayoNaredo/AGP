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

// Función para validar datos de baja laboral
function validateLeaveData(data: any, isUpdate = false): string[] {
  const errors: string[] = [];

  // Campos obligatorios en creación
  if (!isUpdate) {
    if (!data.id_empleado) {
      errors.push("id_empleado es obligatorio");
    }

    if (!data.tipo_baja) {
      errors.push("tipo_baja es obligatorio");
    }

    if (!data.fecha_inicio) {
      errors.push("fecha_inicio es obligatorio");
    }
  }

  // Validación de ID empleado
  if (data.id_empleado !== undefined && data.id_empleado !== null) {
    const empleadoId = parseInt(data.id_empleado);
    if (isNaN(empleadoId) || empleadoId <= 0) {
      errors.push("id_empleado debe ser un número entero positivo");
    }
  }

  // Validación de tipo de baja
  const tiposBaja = [
    "enfermedad_comun",
    "accidente_trabajo",
    "enfermedad_profesional",
    "maternidad",
    "paternidad",
    "riesgo_embarazo",
    "riesgo_lactancia",
    "cuidado_familiar",
    "incapacidad_temporal",
    "incapacidad_permanente",
  ];

  if (data.tipo_baja && !tiposBaja.includes(data.tipo_baja)) {
    errors.push(`tipo_baja debe ser uno de: ${tiposBaja.join(", ")}`);
  }

  // Validación de fechas
  if (data.fecha_inicio && !isValidDate(data.fecha_inicio)) {
    errors.push("fecha_inicio debe ser una fecha válida (YYYY-MM-DD)");
  }

  if (data.fecha_fin && !isValidDate(data.fecha_fin)) {
    errors.push("fecha_fin debe ser una fecha válida (YYYY-MM-DD)");
  }

  // Validación de fechas lógicas
  if (data.fecha_inicio && data.fecha_fin) {
    const fechaInicio = new Date(data.fecha_inicio);
    const fechaFin = new Date(data.fecha_fin);

    if (fechaFin < fechaInicio) {
      errors.push("fecha_fin no puede ser anterior a fecha_inicio");
    }

    // Validar que las fechas no sean futuras más allá de 1 año
    const unAñoAdelante = new Date();
    unAñoAdelante.setFullYear(unAñoAdelante.getFullYear() + 1);

    if (fechaInicio > unAñoAdelante || fechaFin > unAñoAdelante) {
      errors.push("Las fechas no pueden ser superiores a un año en el futuro");
    }
  }

  // Validación de fecha de inicio no muy antigua (más de 5 años)
  if (data.fecha_inicio) {
    const fechaInicio = new Date(data.fecha_inicio);
    const cincoAñosAtras = new Date();
    cincoAñosAtras.setFullYear(cincoAñosAtras.getFullYear() - 5);

    if (fechaInicio < cincoAñosAtras) {
      errors.push("fecha_inicio no puede ser anterior a 5 años");
    }
  }

  // Validación de estado de baja
  const estadosBaja = ["activa", "finalizada", "suspendida", "rechazada"];
  if (data.estado && !estadosBaja.includes(data.estado)) {
    errors.push(`estado debe ser uno de: ${estadosBaja.join(", ")}`);
  }

  // Validación de comentarios (longitud máxima)
  if (data.comentarios && data.comentarios.length > 1000) {
    errors.push("comentarios no puede exceder 1000 caracteres");
  }

  return errors;
}

// Función auxiliar para validar fechas
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return (
    date instanceof Date &&
    !isNaN(date.getTime()) &&
    /^\d{4}-\d{2}-\d{2}$/.test(dateString)
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

    // GET /leaves - Obtener todas las bajas (con filtros opcionales)
    if (method === "GET" && pathSegments.length === 1) {
      try {
        // Obtener parámetros de filtro de la URL
        const filters: any = {};
        const id_empleado = url.searchParams.get("id_empleado");
        const tipo_baja = url.searchParams.get("tipo_baja");
        const estado = url.searchParams.get("estado");
        const fecha_desde = url.searchParams.get("fecha_desde");
        const fecha_hasta = url.searchParams.get("fecha_hasta");

        if (id_empleado) filters.id_empleado = parseInt(id_empleado);
        if (tipo_baja) filters.tipo_baja = tipo_baja;
        if (estado) filters.estado = estado;
        if (fecha_desde) filters.fecha_desde = fecha_desde;
        if (fecha_hasta) filters.fecha_hasta = fecha_hasta;

        let query = supabaseAdmin
          .from("leaves")
          .select(
            `
            *,
            employees!inner(
              id_empleado,
              nombre,
              dni,
              cargo,
              departamento
            )
          `
          )
          .eq("employees.company_id", companyId)
          .order("fecha_inicio", { ascending: false });

        // Aplicar filtros
        if (filters.id_empleado) {
          query = query.eq("id_empleado", filters.id_empleado);
        }

        if (filters.tipo_baja) {
          query = query.eq("tipo_baja", filters.tipo_baja);
        }

        if (filters.estado) {
          query = query.eq("estado", filters.estado);
        }

        if (filters.fecha_desde) {
          query = query.gte("fecha_inicio", filters.fecha_desde);
        }

        if (filters.fecha_hasta) {
          query = query.lte("fecha_inicio", filters.fecha_hasta);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error al obtener bajas:", error);
          throw error;
        }

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en getLeaves:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener bajas",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // GET /leaves/{id} - Obtener una baja por ID
    if (method === "GET" && pathSegments.length === 2) {
      try {
        const leaveId = parseInt(pathSegments[1]);

        if (isNaN(leaveId)) {
          return new Response(JSON.stringify({ error: "ID inválido" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data, error } = await supabaseAdmin
          .from("leaves")
          .select(
            `
            *,
            employees!inner(
              id_empleado,
              nombre,
              dni,
              cargo,
              departamento,
              email,
              telefono
            )
          `
          )
          .eq("id_baja", leaveId)
          .eq("employees.company_id", companyId)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            return new Response(
              JSON.stringify({ error: "Baja no encontrada" }),
              {
                status: 404,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
          console.error("Error al obtener baja:", error);
          throw error;
        }

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en getLeaveById:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener baja",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // POST /leaves - Crear una nueva baja
    if (method === "POST" && pathSegments.length === 1) {
      try {
        const leaveData = await req.json();

        // Validar datos
        const validationErrors = validateLeaveData(leaveData);
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

        // Verificar que el empleado existe y pertenece a la empresa
        const { data: employee, error: employeeError } = await supabaseAdmin
          .from("employees")
          .select("id_empleado, nombre")
          .eq("company_id", companyId)
          .eq("id_empleado", leaveData.id_empleado)
          .single();

        if (employeeError || !employee) {
          return new Response(
            JSON.stringify({
              error:
                "El empleado especificado no existe o no pertenece a esta empresa",
            }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Verificar solapamiento de fechas para el mismo empleado
        const fechaFin = leaveData.fecha_fin || leaveData.fecha_inicio;
        const { data: overlappingLeaves } = await supabaseAdmin
          .from("leaves")
          .select("id_baja, fecha_inicio, fecha_fin")
          .eq("id_empleado", leaveData.id_empleado)
          .neq("estado", "rechazada")
          .or(
            `and(fecha_inicio.lte.${leaveData.fecha_inicio},fecha_fin.gte.${leaveData.fecha_inicio}),and(fecha_inicio.lte.${fechaFin},fecha_fin.gte.${fechaFin})`
          );

        if (overlappingLeaves && overlappingLeaves.length > 0) {
          return new Response(
            JSON.stringify({
              error:
                "Ya existe una baja activa para este empleado en el período especificado",
            }),
            {
              status: 409,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Preparar datos para inserción
        const insertData = {
          id_empleado: parseInt(leaveData.id_empleado),
          tipo_baja: leaveData.tipo_baja,
          fecha_inicio: leaveData.fecha_inicio,
          fecha_fin: leaveData.fecha_fin || null,
          estado: leaveData.estado || "activa",
          comentarios: leaveData.comentarios || null,
          documento_medico: leaveData.documento_medico || null,
          numero_parte: leaveData.numero_parte || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabaseAdmin
          .from("leaves")
          .insert(insertData)
          .select(
            `
            *,
            employees(
              id_empleado,
              nombre,
              dni,
              cargo,
              departamento
            )
          `
          )
          .single();

        if (error) {
          console.error("Error al crear baja:", error);
          if (error.code === "23503") {
            return new Response(
              JSON.stringify({ error: "El empleado especificado no existe" }),
              {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
          throw error;
        }

        return new Response(JSON.stringify(data), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en createLeave:", error);
        return new Response(
          JSON.stringify({
            error: "Error al crear baja",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // PUT /leaves/{id} - Actualizar una baja
    if (method === "PUT" && pathSegments.length === 2) {
      try {
        const leaveId = parseInt(pathSegments[1]);

        if (isNaN(leaveId)) {
          return new Response(JSON.stringify({ error: "ID inválido" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const leaveData = await req.json();

        // Validar datos
        const validationErrors = validateLeaveData(leaveData, true);
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

        // Verificar que la baja existe y el empleado pertenece a la empresa
        const { data: existingLeave } = await supabaseAdmin
          .from("leaves")
          .select(
            `
            *,
            employees!inner(company_id)
          `
          )
          .eq("id_baja", leaveId)
          .eq("employees.company_id", companyId)
          .single();

        if (!existingLeave) {
          return new Response(JSON.stringify({ error: "Baja no encontrada" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Si se cambia el empleado, verificar que el nuevo empleado existe
        if (
          leaveData.id_empleado &&
          leaveData.id_empleado !== existingLeave.id_empleado
        ) {
          const { data: newEmployee } = await supabaseAdmin
            .from("employees")
            .select("id_empleado")
            .eq("company_id", companyId)
            .eq("id_empleado", leaveData.id_empleado)
            .single();

          if (!newEmployee) {
            return new Response(
              JSON.stringify({
                error:
                  "El empleado especificado no existe o no pertenece a esta empresa",
              }),
              {
                status: 404,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
        }

        // Verificar solapamiento de fechas si se cambian las fechas
        if (leaveData.fecha_inicio || leaveData.fecha_fin) {
          const empleadoId = leaveData.id_empleado || existingLeave.id_empleado;
          const fechaInicio =
            leaveData.fecha_inicio || existingLeave.fecha_inicio;
          const fechaFin =
            leaveData.fecha_fin !== undefined
              ? leaveData.fecha_fin
              : existingLeave.fecha_fin;

          const { data: overlappingLeaves } = await supabaseAdmin
            .from("leaves")
            .select("id_baja")
            .eq("id_empleado", empleadoId)
            .neq("id_baja", leaveId)
            .neq("estado", "rechazada")
            .or(
              `and(fecha_inicio.lte.${fechaInicio},fecha_fin.gte.${fechaInicio}),and(fecha_inicio.lte.${fechaFin || fechaInicio},fecha_fin.gte.${fechaFin || fechaInicio})`
            );

          if (overlappingLeaves && overlappingLeaves.length > 0) {
            return new Response(
              JSON.stringify({
                error:
                  "Ya existe una baja activa para este empleado en el período especificado",
              }),
              {
                status: 409,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
        }

        // Preparar datos para actualización
        const updateData = {
          id_empleado:
            leaveData.id_empleado !== undefined
              ? parseInt(leaveData.id_empleado)
              : existingLeave.id_empleado,
          tipo_baja:
            leaveData.tipo_baja !== undefined
              ? leaveData.tipo_baja
              : existingLeave.tipo_baja,
          fecha_inicio:
            leaveData.fecha_inicio !== undefined
              ? leaveData.fecha_inicio
              : existingLeave.fecha_inicio,
          fecha_fin:
            leaveData.fecha_fin !== undefined
              ? leaveData.fecha_fin
              : existingLeave.fecha_fin,
          estado:
            leaveData.estado !== undefined
              ? leaveData.estado
              : existingLeave.estado,
          comentarios:
            leaveData.comentarios !== undefined
              ? leaveData.comentarios
              : existingLeave.comentarios,
          documento_medico:
            leaveData.documento_medico !== undefined
              ? leaveData.documento_medico
              : existingLeave.documento_medico,
          numero_parte:
            leaveData.numero_parte !== undefined
              ? leaveData.numero_parte
              : existingLeave.numero_parte,
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabaseAdmin
          .from("leaves")
          .update(updateData)
          .eq("id_baja", leaveId)
          .select(
            `
            *,
            employees(
              id_empleado,
              nombre,
              dni,
              cargo,
              departamento
            )
          `
          )
          .single();

        if (error) {
          console.error("Error al actualizar baja:", error);
          throw error;
        }

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en updateLeave:", error);
        return new Response(
          JSON.stringify({
            error: "Error al actualizar baja",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // DELETE /leaves/{id} - Eliminar una baja
    if (method === "DELETE" && pathSegments.length === 2) {
      try {
        const leaveId = parseInt(pathSegments[1]);

        if (isNaN(leaveId)) {
          return new Response(JSON.stringify({ error: "ID inválido" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Verificar que la baja existe y el empleado pertenece a la empresa
        const { data: existingLeave } = await supabaseAdmin
          .from("leaves")
          .select(
            `
            id_baja,
            employees!inner(company_id)
          `
          )
          .eq("id_baja", leaveId)
          .eq("employees.company_id", companyId)
          .single();

        if (!existingLeave) {
          return new Response(JSON.stringify({ error: "Baja no encontrada" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { error } = await supabaseAdmin
          .from("leaves")
          .delete()
          .eq("id_baja", leaveId);

        if (error) {
          console.error("Error al eliminar baja:", error);
          throw error;
        }

        return new Response(
          JSON.stringify({ message: "Baja eliminada con éxito" }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Error en deleteLeave:", error);
        return new Response(
          JSON.stringify({
            error: "Error al eliminar baja",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // GET /leaves/stats - Obtener estadísticas de bajas
    if (
      method === "GET" &&
      pathSegments.length === 2 &&
      pathSegments[1] === "stats"
    ) {
      try {
        const year = url.searchParams.get("year");
        const currentYear = year ? parseInt(year) : new Date().getFullYear();

        const { data, error } = await supabaseAdmin
          .from("leaves")
          .select(
            `
            tipo_baja,
            estado,
            fecha_inicio,
            fecha_fin,
            employees!inner(company_id)
          `
          )
          .eq("employees.company_id", companyId)
          .gte("fecha_inicio", `${currentYear}-01-01`)
          .lte("fecha_inicio", `${currentYear}-12-31`);

        if (error) {
          console.error("Error al obtener estadísticas:", error);
          throw error;
        }

        // Procesar estadísticas
        const stats = {
          total_bajas: data.length,
          por_tipo: {} as any,
          por_estado: {} as any,
          por_mes: {} as any,
          duracion_promedio: 0,
        };

        let totalDias = 0;
        let bajasConFin = 0;

        data.forEach((baja) => {
          // Por tipo
          stats.por_tipo[baja.tipo_baja] =
            (stats.por_tipo[baja.tipo_baja] || 0) + 1;

          // Por estado
          stats.por_estado[baja.estado] =
            (stats.por_estado[baja.estado] || 0) + 1;

          // Por mes
          const mes = new Date(baja.fecha_inicio).getMonth() + 1;
          stats.por_mes[mes] = (stats.por_mes[mes] || 0) + 1;

          // Duración
          if (baja.fecha_fin) {
            const inicio = new Date(baja.fecha_inicio);
            const fin = new Date(baja.fecha_fin);
            const dias = Math.ceil(
              (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)
            );
            totalDias += dias;
            bajasConFin++;
          }
        });

        if (bajasConFin > 0) {
          stats.duracion_promedio = Math.round(totalDias / bajasConFin);
        }

        return new Response(JSON.stringify(stats), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en getLeaveStats:", error);
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
