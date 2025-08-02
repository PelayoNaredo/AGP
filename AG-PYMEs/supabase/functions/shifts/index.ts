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

// Función para validar datos de horario
function validateShiftData(data: any, isUpdate = false): string[] {
  const errors: string[] = [];

  // Validaciones básicas
  if (!isUpdate) {
    if (!data.id_empleado) {
      errors.push("id_empleado es obligatorio");
    }

    if (!data.fecha_inicio_semana) {
      errors.push("fecha_inicio_semana es obligatorio");
    }
  }

  // Validación de ID de empleado
  if (data.id_empleado !== undefined && data.id_empleado !== null) {
    const empleadoId = parseInt(data.id_empleado);
    if (isNaN(empleadoId) || empleadoId <= 0) {
      errors.push("id_empleado debe ser un número entero positivo");
    }
  }

  // Validación de fecha
  if (data.fecha_inicio_semana && !isValidDate(data.fecha_inicio_semana)) {
    errors.push("fecha_inicio_semana debe ser una fecha válida (YYYY-MM-DD)");
  }

  return errors;
}

// Función para validar datos de intervalo
function validateIntervalData(data: any): string[] {
  const errors: string[] = [];

  // Validaciones obligatorias
  if (!data.dia_semana) {
    errors.push("dia_semana es obligatorio");
  }

  if (!data.hora_entrada) {
    errors.push("hora_entrada es obligatorio");
  }

  if (!data.hora_salida) {
    errors.push("hora_salida es obligatorio");
  }

  // Validación de día de semana (1-7)
  if (data.dia_semana !== undefined) {
    const dia = parseInt(data.dia_semana);
    if (isNaN(dia) || dia < 1 || dia > 7) {
      errors.push("dia_semana debe ser un número entre 1 y 7");
    }
  }

  // Validación de formato de hora
  if (data.hora_entrada && !isValidTime(data.hora_entrada)) {
    errors.push("hora_entrada debe tener formato HH:MM");
  }

  if (data.hora_salida && !isValidTime(data.hora_salida)) {
    errors.push("hora_salida debe tener formato HH:MM");
  }

  // Validación lógica de horarios
  if (data.hora_entrada && data.hora_salida) {
    if (data.hora_entrada >= data.hora_salida) {
      errors.push("hora_salida debe ser posterior a hora_entrada");
    }
  }

  return errors;
}

// Función auxiliar para validar fecha
function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

// Función auxiliar para validar hora
function isValidTime(timeString: string): boolean {
  const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(timeString);
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

    // GET /shifts - Obtener todos los horarios
    if (method === "GET" && pathSegments.length === 1) {
      try {
        const { data, error } = await supabaseAdmin
          .from("shifts")
          .select(
            `
            *,
            shift_intervals(*),
            employees!inner(
              id_empleado,
              nombre,
              apellidos,
              company_id
            )
          `
          )
          .eq("employees.company_id", companyId)
          .order("fecha_inicio_semana", { ascending: false });

        if (error) {
          console.error("Error al obtener horarios:", error);
          throw error;
        }

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en getAllShifts:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener horarios",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // GET /shifts/{id} - Obtener un horario por ID
    if (
      method === "GET" &&
      pathSegments.length === 2 &&
      pathSegments[1] !== "date" &&
      pathSegments[1] !== "month" &&
      pathSegments[1] !== "export" &&
      pathSegments[1] !== "copy"
    ) {
      try {
        const shiftId = parseInt(pathSegments[1]);

        if (isNaN(shiftId)) {
          return new Response(JSON.stringify({ error: "ID inválido" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data, error } = await supabaseAdmin
          .from("shifts")
          .select(
            `
            *,
            shift_intervals(*),
            employees!inner(
              id_empleado,
              nombre,
              apellidos,
              company_id
            )
          `
          )
          .eq("id_horario", shiftId)
          .eq("employees.company_id", companyId)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            return new Response(
              JSON.stringify({ error: "Horario no encontrado" }),
              {
                status: 404,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
          console.error("Error al obtener horario:", error);
          throw error;
        }

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en getShiftById:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener horario",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // GET /shifts/date/{fecha} - Obtener horarios por fecha de semana
    if (
      method === "GET" &&
      pathSegments.length === 3 &&
      pathSegments[1] === "date"
    ) {
      try {
        const fechaInicioSemana = pathSegments[2];

        if (!isValidDate(fechaInicioSemana)) {
          return new Response(JSON.stringify({ error: "Fecha inválida" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Obtener empleados activos
        const { data: employees, error: employeesError } = await supabaseAdmin
          .from("employees")
          .select("*")
          .eq("company_id", companyId)
          .eq("activo", true);

        if (employeesError) {
          throw employeesError;
        }

        // Obtener horarios para la fecha especificada
        const { data: shifts, error: shiftsError } = await supabaseAdmin
          .from("shifts")
          .select(
            `
            id_horario,
            id_empleado,
            fecha_inicio_semana,
            shift_intervals(
              dia_semana,
              hora_entrada,
              hora_salida
            ),
            employees!inner(company_id)
          `
          )
          .eq("fecha_inicio_semana", fechaInicioSemana)
          .eq("employees.company_id", companyId);

        if (shiftsError) {
          throw shiftsError;
        }

        // Crear estructura de respuesta
        const result = employees.map((empleado) => {
          const empleadoShift = shifts.find(
            (s) => s.id_empleado === empleado.id_empleado
          );

          return {
            id_empleado: empleado.id_empleado,
            fecha_inicio_semana: fechaInicioSemana,
            intervals: empleadoShift ? empleadoShift.shift_intervals : [],
          };
        });

        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en getShiftByDate:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener horarios por fecha",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // GET /shifts/month/{year}/{month} - Obtener horarios mensuales
    if (
      method === "GET" &&
      pathSegments.length === 4 &&
      pathSegments[1] === "month"
    ) {
      try {
        const year = parseInt(pathSegments[2]);
        const month = parseInt(pathSegments[3]);

        if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
          return new Response(JSON.stringify({ error: "Año o mes inválido" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Obtener empleados activos
        const { data: employees, error: employeesError } = await supabaseAdmin
          .from("employees")
          .select("*")
          .eq("company_id", companyId)
          .eq("activo", true);

        if (employeesError) {
          throw employeesError;
        }

        // Obtener horarios del mes
        const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
        const endDate = `${year}-${(month + 1).toString().padStart(2, "0")}-01`;

        const { data: shifts, error: shiftsError } = await supabaseAdmin
          .from("shifts")
          .select(
            `
            id_horario,
            id_empleado,
            fecha_inicio_semana,
            shift_intervals(
              dia_semana,
              hora_entrada,
              hora_salida
            ),
            employees!inner(company_id)
          `
          )
          .eq("employees.company_id", companyId)
          .gte("fecha_inicio_semana", startDate)
          .lt("fecha_inicio_semana", endDate)
          .order("fecha_inicio_semana");

        if (shiftsError) {
          throw shiftsError;
        }

        // Agrupar por semana
        const weekGroups: any = {};
        shifts.forEach((shift) => {
          const week = shift.fecha_inicio_semana;
          if (!weekGroups[week]) {
            weekGroups[week] = [];
          }
          weekGroups[week].push(shift);
        });

        // Crear estructura de respuesta
        const result: any = {};
        Object.keys(weekGroups).forEach((week) => {
          result[week] = employees.map((empleado) => {
            const empleadoShift = weekGroups[week].find(
              (s: any) => s.id_empleado === empleado.id_empleado
            );

            return {
              id_empleado: empleado.id_empleado,
              fecha_inicio_semana: week,
              intervals: empleadoShift ? empleadoShift.shift_intervals : [],
            };
          });
        });

        return new Response(
          JSON.stringify({
            year,
            month,
            weeks: result,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Error en getShiftsByMonth:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener horarios mensuales",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // GET /shifts/export/{fecha} - Obtener horarios para exportación
    if (
      method === "GET" &&
      pathSegments.length === 3 &&
      pathSegments[1] === "export"
    ) {
      try {
        const fechaInicioMes = pathSegments[2];

        // Validar fecha
        const mesInicio = new Date(fechaInicioMes);
        if (isNaN(mesInicio.getTime())) {
          return new Response(JSON.stringify({ error: "Fecha inválida" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const mes = mesInicio.getMonth() + 1;
        const anio = mesInicio.getFullYear();

        // Obtener empleados activos
        const { data: employees, error: employeesError } = await supabaseAdmin
          .from("employees")
          .select("*")
          .eq("company_id", companyId)
          .eq("activo", true);

        if (employeesError) {
          throw employeesError;
        }

        // Obtener horarios del mes
        const { data: shifts, error: shiftsError } = await supabaseAdmin
          .from("shifts")
          .select(
            `
            id_horario,
            id_empleado,
            fecha_inicio_semana,
            shift_intervals(
              id_intervalo,
              dia_semana,
              hora_entrada,
              hora_salida
            ),
            employees!inner(
              id_empleado,
              nombre,
              apellidos,
              email,
              company_id
            )
          `
          )
          .eq("employees.company_id", companyId)
          .gte(
            "fecha_inicio_semana",
            `${anio}-${mes.toString().padStart(2, "0")}-01`
          )
          .lt(
            "fecha_inicio_semana",
            `${anio}-${(mes + 1).toString().padStart(2, "0")}-01`
          );

        if (shiftsError) {
          throw shiftsError;
        }

        // Crear estructura de respuesta
        const result = employees.map((empleado) => {
          const empleadoShifts = shifts.filter(
            (s) => s.id_empleado === empleado.id_empleado
          );

          const intervals = empleadoShifts.flatMap(
            (s) => s.shift_intervals || []
          );

          // Si no hay horarios, crear horarios por defecto
          const finalIntervals =
            intervals.length > 0
              ? intervals
              : [
                  {
                    dia_semana: 1,
                    hora_entrada: "09:00",
                    hora_salida: "17:00",
                  },
                  {
                    dia_semana: 2,
                    hora_entrada: "09:00",
                    hora_salida: "17:00",
                  },
                  {
                    dia_semana: 3,
                    hora_entrada: "09:00",
                    hora_salida: "17:00",
                  },
                  {
                    dia_semana: 4,
                    hora_entrada: "09:00",
                    hora_salida: "17:00",
                  },
                  {
                    dia_semana: 5,
                    hora_entrada: "09:00",
                    hora_salida: "17:00",
                  },
                ];

          return {
            id_empleado: empleado.id_empleado,
            fecha_inicio_semana: fechaInicioMes,
            employee: {
              id_empleado: empleado.id_empleado,
              nombre: empleado.nombre,
              apellidos: empleado.apellidos,
              email: empleado.email,
            },
            intervals: finalIntervals,
          };
        });

        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en getMonthlyShiftsForExport:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener horarios para exportación",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // POST /shifts/copy - Copiar horarios entre semanas
    if (
      method === "POST" &&
      pathSegments.length === 2 &&
      pathSegments[1] === "copy"
    ) {
      try {
        const source = url.searchParams.get("source");
        const target = url.searchParams.get("target");

        if (!source || !target) {
          return new Response(
            JSON.stringify({
              error: "Se requieren los parámetros source y target",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Verificar horarios existentes en destino
        const { data: existingShifts } = await supabaseAdmin
          .from("shifts")
          .select(
            `
            id_horario,
            employees!inner(company_id)
          `
          )
          .eq("fecha_inicio_semana", target)
          .eq("employees.company_id", companyId);

        // Eliminar horarios existentes
        if (existingShifts && existingShifts.length > 0) {
          const shiftIds = existingShifts.map((s) => s.id_horario);

          await supabaseAdmin
            .from("shift_intervals")
            .delete()
            .in("id_horario", shiftIds);

          await supabaseAdmin
            .from("shifts")
            .delete()
            .in("id_horario", shiftIds);
        }

        // Obtener horarios origen
        const { data: sourceShifts, error: sourceError } = await supabaseAdmin
          .from("shifts")
          .select(
            `
            *,
            shift_intervals(*),
            employees!inner(company_id)
          `
          )
          .eq("fecha_inicio_semana", source)
          .eq("employees.company_id", companyId);

        if (sourceError) {
          throw sourceError;
        }

        if (!sourceShifts || sourceShifts.length === 0) {
          return new Response(
            JSON.stringify({
              error: "No se encontraron horarios en la semana origen",
            }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        let copiedShiftsCount = 0;

        // Copiar horarios
        for (const sourceShift of sourceShifts) {
          const { data: newShift, error: newShiftError } = await supabaseAdmin
            .from("shifts")
            .insert({
              id_empleado: sourceShift.id_empleado,
              fecha_inicio_semana: target,
            })
            .select()
            .single();

          if (newShiftError) {
            throw newShiftError;
          }

          // Copiar intervalos
          if (
            sourceShift.shift_intervals &&
            sourceShift.shift_intervals.length > 0
          ) {
            const intervalData = sourceShift.shift_intervals.map(
              (interval: any) => ({
                id_horario: newShift.id_horario,
                dia_semana: interval.dia_semana,
                hora_entrada: interval.hora_entrada,
                hora_salida: interval.hora_salida,
              })
            );

            await supabaseAdmin.from("shift_intervals").insert(intervalData);
          }

          copiedShiftsCount++;
        }

        return new Response(
          JSON.stringify({
            message: "Horarios copiados correctamente",
            numShifts: copiedShiftsCount,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Error en copyShifts:", error);
        return new Response(
          JSON.stringify({
            error: "Error al copiar horarios",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // POST /shifts - Crear/actualizar un horario
    if (method === "POST" && pathSegments.length === 1) {
      try {
        const shiftData = await req.json();

        // Validar datos
        const validationErrors = validateShiftData(shiftData);
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

        // Verificar empleado
        const { data: employee, error: employeeError } = await supabaseAdmin
          .from("employees")
          .select("id_empleado")
          .eq("company_id", companyId)
          .eq("id_empleado", shiftData.id_empleado)
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

        // Verificar si existe horario
        const { data: existingShift } = await supabaseAdmin
          .from("shifts")
          .select("id_horario")
          .eq("id_empleado", shiftData.id_empleado)
          .eq("fecha_inicio_semana", shiftData.fecha_inicio_semana)
          .single();

        let shiftId;

        if (existingShift) {
          shiftId = existingShift.id_horario;
        } else {
          const { data: newShift, error: createError } = await supabaseAdmin
            .from("shifts")
            .insert({
              id_empleado: parseInt(shiftData.id_empleado),
              fecha_inicio_semana: shiftData.fecha_inicio_semana,
            })
            .select()
            .single();

          if (createError) {
            throw createError;
          }

          shiftId = newShift.id_horario;
        }

        // Procesar updates si existen
        if (shiftData.updates && typeof shiftData.updates === "object") {
          const dia_semana = Object.keys(shiftData.updates)[0].charAt(1);
          const entrada = shiftData.updates[`h${dia_semana}_entrada`];
          const salida = shiftData.updates[`h${dia_semana}_salida`];

          // Eliminar intervalos existentes
          await supabaseAdmin
            .from("shift_intervals")
            .delete()
            .eq("id_horario", shiftId)
            .eq("dia_semana", dia_semana);

          // Insertar nuevos intervalos
          if (entrada && salida) {
            const intervalValidation = validateIntervalData({
              dia_semana,
              hora_entrada: entrada,
              hora_salida: salida,
            });

            if (intervalValidation.length > 0) {
              return new Response(
                JSON.stringify({
                  error: "Datos de intervalo inválidos",
                  details: intervalValidation,
                }),
                {
                  status: 400,
                  headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                  },
                }
              );
            }

            await supabaseAdmin.from("shift_intervals").insert({
              id_horario: shiftId,
              dia_semana: parseInt(dia_semana),
              hora_entrada: entrada,
              hora_salida: salida,
            });
          }
        }

        // Obtener horario actualizado
        const { data: updatedShift, error: fetchError } = await supabaseAdmin
          .from("shifts")
          .select(
            `
            *,
            shift_intervals(*),
            employees(
              id_empleado,
              nombre,
              apellidos
            )
          `
          )
          .eq("id_horario", shiftId)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        return new Response(JSON.stringify(updatedShift), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en saveShift:", error);
        return new Response(
          JSON.stringify({
            error: "Error al guardar horario",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // POST /shifts/{id}/intervals - Agregar intervalo a un horario
    if (
      method === "POST" &&
      pathSegments.length === 3 &&
      pathSegments[2] === "intervals"
    ) {
      try {
        const shiftId = parseInt(pathSegments[1]);
        const intervalData = await req.json();

        if (isNaN(shiftId)) {
          return new Response(JSON.stringify({ error: "ID inválido" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Validar datos
        const validationErrors = validateIntervalData(intervalData);
        if (validationErrors.length > 0) {
          return new Response(
            JSON.stringify({
              error: "Datos de intervalo inválidos",
              details: validationErrors,
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Verificar horario
        const { data: existingShift } = await supabaseAdmin
          .from("shifts")
          .select(
            `
            id_horario,
            employees!inner(company_id)
          `
          )
          .eq("id_horario", shiftId)
          .eq("employees.company_id", companyId)
          .single();

        if (!existingShift) {
          return new Response(
            JSON.stringify({ error: "Horario no encontrado" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Eliminar intervalos existentes para ese día y hora
        await supabaseAdmin
          .from("shift_intervals")
          .delete()
          .eq("id_horario", shiftId)
          .eq("dia_semana", intervalData.dia_semana)
          .eq("hora_entrada", intervalData.hora_entrada);

        // Insertar nuevo intervalo
        const { data, error } = await supabaseAdmin
          .from("shift_intervals")
          .insert({
            id_horario: shiftId,
            dia_semana: parseInt(intervalData.dia_semana),
            hora_entrada: intervalData.hora_entrada,
            hora_salida: intervalData.hora_salida,
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        return new Response(JSON.stringify(data), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en saveInterval:", error);
        return new Response(
          JSON.stringify({
            error: "Error al guardar intervalo",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // DELETE /shifts/{id} - Eliminar un horario
    if (method === "DELETE" && pathSegments.length === 2) {
      try {
        const shiftId = parseInt(pathSegments[1]);

        if (isNaN(shiftId)) {
          return new Response(JSON.stringify({ error: "ID inválido" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Verificar horario
        const { data: existingShift } = await supabaseAdmin
          .from("shifts")
          .select(
            `
            id_horario,
            employees!inner(company_id)
          `
          )
          .eq("id_horario", shiftId)
          .eq("employees.company_id", companyId)
          .single();

        if (!existingShift) {
          return new Response(
            JSON.stringify({ error: "Horario no encontrado" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Eliminar intervalos
        await supabaseAdmin
          .from("shift_intervals")
          .delete()
          .eq("id_horario", shiftId);

        // Eliminar horario
        const { error } = await supabaseAdmin
          .from("shifts")
          .delete()
          .eq("id_horario", shiftId);

        if (error) {
          throw error;
        }

        return new Response(
          JSON.stringify({ message: "Horario eliminado correctamente" }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Error en deleteShift:", error);
        return new Response(
          JSON.stringify({
            error: "Error al eliminar horario",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // DELETE /shifts/{id}/intervals/{intervalId} - Eliminar un intervalo
    if (
      method === "DELETE" &&
      pathSegments.length === 4 &&
      pathSegments[2] === "intervals"
    ) {
      try {
        const shiftId = parseInt(pathSegments[1]);
        const intervalId = parseInt(pathSegments[3]);

        if (isNaN(shiftId) || isNaN(intervalId)) {
          return new Response(JSON.stringify({ error: "ID inválido" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Verificar horario
        const { data: existingShift } = await supabaseAdmin
          .from("shifts")
          .select(
            `
            id_horario,
            employees!inner(company_id)
          `
          )
          .eq("id_horario", shiftId)
          .eq("employees.company_id", companyId)
          .single();

        if (!existingShift) {
          return new Response(
            JSON.stringify({ error: "Horario no encontrado" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Eliminar intervalo
        const { data, error } = await supabaseAdmin
          .from("shift_intervals")
          .delete()
          .eq("id_horario", shiftId)
          .eq("id_intervalo", intervalId)
          .select();

        if (error) {
          throw error;
        }

        if (data.length === 0) {
          return new Response(
            JSON.stringify({ error: "Intervalo no encontrado" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        return new Response(
          JSON.stringify({ message: "Intervalo eliminado correctamente" }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Error en deleteInterval:", error);
        return new Response(
          JSON.stringify({
            error: "Error al eliminar intervalo",
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
