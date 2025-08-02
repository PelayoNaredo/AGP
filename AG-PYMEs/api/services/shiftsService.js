import { EdgeFunctions } from "../../config/supabase";

export const getAllShifts = async () => {
  try {
    const result = await EdgeFunctions.shifts.getAll();
    if (result.success) {
      return transformShiftsResponse(result.data);
    }
    throw new Error(result.error || "Error al obtener turnos");
  } catch (error) {
    console.error("Error en getAllShifts:", error);
    throw error;
  }
};

export const getShiftById = async (id) => {
  try {
    const result = await EdgeFunctions.shifts.getById(id);
    if (result.success) {
      return transformShiftResponse(result.data);
    }
    throw new Error(result.error || "Error al obtener turno");
  } catch (error) {
    console.error("Error en getShiftById:", error);
    throw error;
  }
};

export const getShiftByDate = async (fecha_inicio_semana) => {
  try {
    const result = await EdgeFunctions.shifts.getByDate(fecha_inicio_semana);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al obtener turnos por fecha");
  } catch (error) {
    console.error("Error getting shifts:", error.message);
    throw error;
  }
};

// Método optimizado para cache mensual
export const getShiftsByMonth = async (year, month) => {
  try {
    const result = await EdgeFunctions.shifts.getByMonth(year, month);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al obtener turnos mensuales");
  } catch (error) {
    console.error("Error getting monthly shifts:", error.message);
    throw error;
  }
};

// Función para obtener los horarios con información completa de los empleados
// Útil para exportar o enviar por correo
export const getShiftsWithEmployeeInfo = async (fecha_inicio_semana) => {
  try {
    const result =
      await EdgeFunctions.shifts.getWithEmployeeInfo(fecha_inicio_semana);
    if (result.success) {
      return result.data;
    }
    throw new Error(
      result.error || "Error al obtener turnos con info de empleados"
    );
  } catch (error) {
    console.error("Error en getShiftsWithEmployeeInfo:", error);
    throw error;
  }
};

// Función para obtener los horarios mensuales para exportación
export const getMonthlyShiftsForExport = async (fecha_inicio_mes) => {
  try {
    const result =
      await EdgeFunctions.shifts.getMonthlyForExport(fecha_inicio_mes);
    if (result.success) {
      return result.data;
    }
    throw new Error(
      result.error || "Error al obtener turnos mensuales para exportación"
    );
  } catch (error) {
    console.error("Error en getMonthlyShiftsForExport:", error);
    throw error;
  }
};

export const saveShift = async (
  id_empleado,
  fecha_inicio_semana,
  dia_semana,
  intervalos
) => {
  try {
    const result = await EdgeFunctions.shifts.save({
      id_empleado,
      fecha_inicio_semana,
      dia_semana,
      intervalos,
    });

    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al guardar turno");
  } catch (error) {
    console.error("Error en saveShift:", error);
    throw error;
  }
};

export const deleteShift = async (id) => {
  try {
    const result = await EdgeFunctions.shifts.delete(id);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al eliminar turno");
  } catch (error) {
    console.error("Error en deleteShift:", error);
    throw error;
  }
};

export const deleteShiftInterval = async (shiftId, intervalId) => {
  try {
    const result = await EdgeFunctions.shifts.deleteInterval(
      shiftId,
      intervalId
    );
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al eliminar intervalo de turno");
  } catch (error) {
    console.error("Error en deleteShiftInterval:", error);
    throw error;
  }
};

// Función para copiar horarios de una semana a otra
export const copyShiftsFromPreviousWeek = async (sourceWeek, targetWeek) => {
  try {
    const result = await EdgeFunctions.shifts.copyFromPreviousWeek(
      sourceWeek,
      targetWeek
    );

    if (result.success) {
      return {
        success: true,
        data: result.data || { numShifts: 0 },
      };
    }

    return {
      success: false,
      error: result.error || "Error al copiar turnos",
    };
  } catch (error) {
    console.error("Error en copyShiftsFromPreviousWeek:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Funciones auxiliares para transformar datos
function transformShiftResponse(shift) {
  if (!shift) return null;

  const transformed = {
    id_horario: shift.id_horario,
    id_empleado: shift.id_empleado,
    fecha_inicio_semana: shift.fecha_inicio_semana,
    intervals: shift.intervals || [],
  };

  return transformed;
}

function transformShiftsResponse(shifts) {
  return shifts.map(transformShiftResponse);
}
