import { createClient } from "@supabase/supabase-js";

// Configuración de Supabase
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Cliente con SERVICE_ROLE_KEY para operaciones administrativas
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

// Función para extraer company_id del JWT
function extractCompanyId(authHeader) {
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
function validateShiftData(data, isUpdate = false) {
  const errors = [];

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
function validateIntervalData(data) {
  const errors = [];

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
function isValidDate(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

// Función auxiliar para validar hora
function isValidTime(timeString) {
  const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(timeString);
}

// Obtener todos los horarios con intervalos
async function getAllShifts(companyId) {
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

    return { success: true, data };
  } catch (error) {
    console.error("Error en getAllShifts:", error);
    return {
      success: false,
      error: "Error al obtener horarios",
      details: error.message,
    };
  }
}

// Obtener un horario por ID
async function getShiftById(companyId, shiftId) {
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
      .eq("id_horario", shiftId)
      .eq("employees.company_id", companyId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { success: false, error: "Horario no encontrado" };
      }
      console.error("Error al obtener horario:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error en getShiftById:", error);
    return {
      success: false,
      error: "Error al obtener horario",
      details: error.message,
    };
  }
}

// Crear o actualizar un horario
async function saveShift(companyId, shiftData) {
  try {
    // Validar datos básicos
    const validationErrors = validateShiftData(shiftData);
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: "Datos inválidos",
        details: validationErrors,
      };
    }

    // Verificar que el empleado existe y pertenece a la empresa
    const { data: employee, error: employeeError } = await supabaseAdmin
      .from("employees")
      .select("id_empleado")
      .eq("company_id", companyId)
      .eq("id_empleado", shiftData.id_empleado)
      .single();

    if (employeeError || !employee) {
      return {
        success: false,
        error:
          "El empleado especificado no existe o no pertenece a esta empresa",
      };
    }

    // Verificar si ya existe un horario para este empleado y semana
    const { data: existingShift } = await supabaseAdmin
      .from("shifts")
      .select("id_horario")
      .eq("id_empleado", shiftData.id_empleado)
      .eq("fecha_inicio_semana", shiftData.fecha_inicio_semana)
      .single();

    let shiftId;

    if (existingShift) {
      // Actualizar horario existente
      shiftId = existingShift.id_horario;
    } else {
      // Crear nuevo horario
      const { data: newShift, error: createError } = await supabaseAdmin
        .from("shifts")
        .insert({
          id_empleado: parseInt(shiftData.id_empleado),
          fecha_inicio_semana: shiftData.fecha_inicio_semana,
        })
        .select()
        .single();

      if (createError) {
        console.error("Error al crear horario:", createError);
        throw createError;
      }

      shiftId = newShift.id_horario;
    }

    // Procesar updates de intervalos si se proporcionan
    if (shiftData.updates && typeof shiftData.updates === "object") {
      // Extraer día y horarios del update
      const dia_semana = Object.keys(shiftData.updates)[0].charAt(1);
      const entrada = shiftData.updates[`h${dia_semana}_entrada`];
      const salida = shiftData.updates[`h${dia_semana}_salida`];

      // Eliminar intervalos existentes para ese día
      await supabaseAdmin
        .from("shift_intervals")
        .delete()
        .eq("id_horario", shiftId)
        .eq("dia_semana", dia_semana);

      // Si hay horarios nuevos, insertarlos
      if (entrada && salida) {
        const intervalValidation = validateIntervalData({
          dia_semana,
          hora_entrada: entrada,
          hora_salida: salida,
        });

        if (intervalValidation.length > 0) {
          return {
            success: false,
            error: "Datos de intervalo inválidos",
            details: intervalValidation,
          };
        }

        await supabaseAdmin.from("shift_intervals").insert({
          id_horario: shiftId,
          dia_semana: parseInt(dia_semana),
          hora_entrada: entrada,
          hora_salida: salida,
        });
      }
    }

    // Obtener el horario actualizado con sus intervalos
    const result = await getShiftById(companyId, shiftId);
    return result;
  } catch (error) {
    console.error("Error en saveShift:", error);
    return {
      success: false,
      error: "Error al guardar horario",
      details: error.message,
    };
  }
}

// Eliminar un horario
async function deleteShift(companyId, shiftId) {
  try {
    // Verificar que el horario existe y el empleado pertenece a la empresa
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
      return { success: false, error: "Horario no encontrado" };
    }

    // Eliminar primero los intervalos (en cascada)
    await supabaseAdmin
      .from("shift_intervals")
      .delete()
      .eq("id_horario", shiftId);

    // Luego eliminar el horario principal
    const { error } = await supabaseAdmin
      .from("shifts")
      .delete()
      .eq("id_horario", shiftId);

    if (error) {
      console.error("Error al eliminar horario:", error);
      throw error;
    }

    return {
      success: true,
      message: "Horario eliminado correctamente",
    };
  } catch (error) {
    console.error("Error en deleteShift:", error);
    return {
      success: false,
      error: "Error al eliminar horario",
      details: error.message,
    };
  }
}

// Obtener horarios por fecha de inicio de semana
async function getShiftByDate(companyId, fechaInicioSemana) {
  try {
    // Obtener todos los empleados activos de la empresa
    const { data: employees, error: employeesError } = await supabaseAdmin
      .from("employees")
      .select("*")
      .eq("company_id", companyId)
      .eq("activo", true);

    if (employeesError) {
      console.error("Error al obtener empleados:", employeesError);
      throw employeesError;
    }

    // Obtener todos los horarios para la semana especificada
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
      console.error("Error al obtener horarios:", shiftsError);
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

    return { success: true, data: result };
  } catch (error) {
    console.error("Error en getShiftByDate:", error);
    return {
      success: false,
      error: "Error al obtener horarios por fecha",
      details: error.message,
    };
  }
}

// Agregar un nuevo intervalo a un horario
async function saveInterval(companyId, shiftId, intervalData) {
  try {
    // Validar datos del intervalo
    const validationErrors = validateIntervalData(intervalData);
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: "Datos de intervalo inválidos",
        details: validationErrors,
      };
    }

    // Verificar que el horario existe y pertenece a la empresa
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
      return { success: false, error: "Horario no encontrado" };
    }

    // Eliminar intervalos existentes para ese día y hora de entrada
    await supabaseAdmin
      .from("shift_intervals")
      .delete()
      .eq("id_horario", shiftId)
      .eq("dia_semana", intervalData.dia_semana)
      .eq("hora_entrada", intervalData.hora_entrada);

    // Insertar el nuevo intervalo
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
      console.error("Error al guardar intervalo:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error en saveInterval:", error);
    return {
      success: false,
      error: "Error al guardar intervalo",
      details: error.message,
    };
  }
}

// Eliminar un intervalo específico
async function deleteInterval(companyId, shiftId, intervalId) {
  try {
    // Verificar que el horario pertenece a la empresa
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
      return { success: false, error: "Horario no encontrado" };
    }

    // Eliminar el intervalo específico
    const { data, error } = await supabaseAdmin
      .from("shift_intervals")
      .delete()
      .eq("id_horario", shiftId)
      .eq("id_intervalo", intervalId)
      .select();

    if (error) {
      console.error("Error al eliminar intervalo:", error);
      throw error;
    }

    if (data.length === 0) {
      return { success: false, error: "Intervalo no encontrado" };
    }

    return {
      success: true,
      message: "Intervalo eliminado correctamente",
    };
  } catch (error) {
    console.error("Error en deleteInterval:", error);
    return {
      success: false,
      error: "Error al eliminar intervalo",
      details: error.message,
    };
  }
}

// Obtener horarios mensuales para exportación
async function getMonthlyShiftsForExport(companyId, fechaInicioMes) {
  try {
    // Validar y parsear la fecha
    const mesInicio = new Date(fechaInicioMes);
    if (isNaN(mesInicio)) {
      return { success: false, error: "Fecha inválida" };
    }

    const mes = mesInicio.getMonth() + 1;
    const anio = mesInicio.getFullYear();

    // Obtener todos los empleados activos de la empresa
    const { data: employees, error: employeesError } = await supabaseAdmin
      .from("employees")
      .select("*")
      .eq("company_id", companyId)
      .eq("activo", true);

    if (employeesError) {
      throw employeesError;
    }

    // Obtener horarios del mes usando una consulta directa
    const { data: shifts, error: shiftsError } = await supabaseAdmin.rpc(
      "get_shifts_by_month",
      {
        p_company_id: companyId,
        p_year: anio,
        p_month: mes,
      }
    );

    if (shiftsError && shiftsError.code !== "42883") {
      // Si la función RPC no existe, usar consulta alternativa
      const { data: alternativeShifts, error: altError } = await supabaseAdmin
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

      if (altError) {
        throw altError;
      }

      // Crear estructura de respuesta
      const result = employees.map((empleado) => {
        const empleadoShifts = alternativeShifts.filter(
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
                { dia_semana: 1, hora_entrada: "09:00", hora_salida: "17:00" },
                { dia_semana: 2, hora_entrada: "09:00", hora_salida: "17:00" },
                { dia_semana: 3, hora_entrada: "09:00", hora_salida: "17:00" },
                { dia_semana: 4, hora_entrada: "09:00", hora_salida: "17:00" },
                { dia_semana: 5, hora_entrada: "09:00", hora_salida: "17:00" },
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

      return { success: true, data: result };
    }

    return { success: true, data: shifts || [] };
  } catch (error) {
    console.error("Error en getMonthlyShiftsForExport:", error);
    return {
      success: false,
      error: "Error al obtener horarios mensuales",
      details: error.message,
    };
  }
}

// Obtener horarios por mes y año
async function getShiftsByMonth(companyId, year, month) {
  try {
    // Validar parámetros
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return { success: false, error: "Año o mes inválido" };
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

    // Obtener horarios del mes especificado
    const startDate = `${yearNum}-${monthNum.toString().padStart(2, "0")}-01`;
    const endDate = `${yearNum}-${(monthNum + 1).toString().padStart(2, "0")}-01`;

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
    const weekGroups = {};
    shifts.forEach((shift) => {
      const week = shift.fecha_inicio_semana;
      if (!weekGroups[week]) {
        weekGroups[week] = [];
      }
      weekGroups[week].push(shift);
    });

    // Crear estructura de respuesta por semana
    const result = {};
    Object.keys(weekGroups).forEach((week) => {
      result[week] = employees.map((empleado) => {
        const empleadoShift = weekGroups[week].find(
          (s) => s.id_empleado === empleado.id_empleado
        );

        return {
          id_empleado: empleado.id_empleado,
          fecha_inicio_semana: week,
          intervals: empleadoShift ? empleadoShift.shift_intervals : [],
        };
      });
    });

    return {
      success: true,
      data: {
        year: yearNum,
        month: monthNum,
        weeks: result,
      },
    };
  } catch (error) {
    console.error("Error en getShiftsByMonth:", error);
    return {
      success: false,
      error: "Error al obtener horarios mensuales",
      details: error.message,
    };
  }
}

// Copiar horarios de una semana a otra
async function copyShifts(companyId, sourceWeek, targetWeek) {
  try {
    if (!sourceWeek || !targetWeek) {
      return {
        success: false,
        error: "Se requieren los parámetros 'source' y 'target'",
      };
    }

    // Verificar si ya existen horarios en la semana destino
    const { data: existingShifts } = await supabaseAdmin
      .from("shifts")
      .select(
        `
        id_horario,
        employees!inner(company_id)
      `
      )
      .eq("fecha_inicio_semana", targetWeek)
      .eq("employees.company_id", companyId);

    // Eliminar horarios existentes en la semana destino si los hay
    if (existingShifts && existingShifts.length > 0) {
      const shiftIds = existingShifts.map((s) => s.id_horario);

      // Eliminar intervalos primero
      await supabaseAdmin
        .from("shift_intervals")
        .delete()
        .in("id_horario", shiftIds);

      // Eliminar horarios
      await supabaseAdmin.from("shifts").delete().in("id_horario", shiftIds);
    }

    // Obtener horarios de la semana origen
    const { data: sourceShifts, error: sourceError } = await supabaseAdmin
      .from("shifts")
      .select(
        `
        *,
        shift_intervals(*),
        employees!inner(company_id)
      `
      )
      .eq("fecha_inicio_semana", sourceWeek)
      .eq("employees.company_id", companyId);

    if (sourceError) {
      throw sourceError;
    }

    if (!sourceShifts || sourceShifts.length === 0) {
      return {
        success: false,
        error: "No se encontraron horarios en la semana origen",
      };
    }

    let copiedShiftsCount = 0;

    // Copiar cada horario a la semana destino
    for (const sourceShift of sourceShifts) {
      // Crear el nuevo horario
      const { data: newShift, error: newShiftError } = await supabaseAdmin
        .from("shifts")
        .insert({
          id_empleado: sourceShift.id_empleado,
          fecha_inicio_semana: targetWeek,
        })
        .select()
        .single();

      if (newShiftError) {
        throw newShiftError;
      }

      // Copiar cada intervalo
      if (
        sourceShift.shift_intervals &&
        sourceShift.shift_intervals.length > 0
      ) {
        const intervalData = sourceShift.shift_intervals.map((interval) => ({
          id_horario: newShift.id_horario,
          dia_semana: interval.dia_semana,
          hora_entrada: interval.hora_entrada,
          hora_salida: interval.hora_salida,
        }));

        await supabaseAdmin.from("shift_intervals").insert(intervalData);
      }

      copiedShiftsCount++;
    }

    return {
      success: true,
      message: "Horarios copiados correctamente",
      data: { numShifts: copiedShiftsCount },
    };
  } catch (error) {
    console.error("Error en copyShifts:", error);
    return {
      success: false,
      error: "Error al copiar horarios",
      details: error.message,
    };
  }
}

// Exportar funciones para uso en EdgeFunction
export {
  getAllShifts,
  getShiftById,
  saveShift,
  deleteShift,
  getShiftByDate,
  saveInterval,
  deleteInterval,
  getMonthlyShiftsForExport,
  getShiftsByMonth,
  copyShifts,
  extractCompanyId,
  validateShiftData,
  validateIntervalData,
};
