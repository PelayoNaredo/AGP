import { httpFetch } from "../http";
import { shiftsEndpoint } from "../endpoints";

export const getAllShifts = async () => {
  try {
    const shifts = await httpFetch(shiftsEndpoint.base());
    return transformShiftsResponse(shifts);
  } catch (error) {
    console.error("Error en getAllShifts:", error);
    throw error;
  }
};

export const getShiftById = async (id) => {
  try {
    const shift = await httpFetch(shiftsEndpoint.byId(id));
    return transformShiftResponse(shift);
  } catch (error) {
    console.error("Error en getShiftById:", error);
    throw error;
  }
};

export const getShiftByDate = async (fecha_inicio_semana) => {
  try {
    const shifts = await httpFetch(shiftsEndpoint.byDate(fecha_inicio_semana));
    return shifts;
  } catch (error) {
    console.error("Error en getShiftByDate:", error);
    throw error;
  }
};

// Función para obtener los horarios con información completa de los empleados
// Útil para exportar o enviar por correo
export const getShiftsWithEmployeeInfo = async (fecha_inicio_semana) => {
  try {
    // Obtener horarios y empleados
    const [shifts, employees] = await Promise.all([
      getShiftByDate(fecha_inicio_semana),
      httpFetch("/api/employees"),
    ]);

    if (!shifts || shifts.length === 0) {
      return [];
    }

    // Combinar la información de horarios con los datos de los empleados
    return shifts.map((shift) => {
      const employee = employees.find(
        (e) => e.id_empleado === shift.id_empleado
      );
      return {
        ...shift,
        employee: employee || null,
      };
    });
  } catch (error) {
    console.error("Error en getShiftsWithEmployeeInfo:", error);
    throw error;
  }
};

// Función para obtener los horarios mensuales para exportación
export const getMonthlyShiftsForExport = async (fecha_inicio_mes) => {
  try {
    // Endpoint específico para exportación que ya devuelve los datos procesados
    const shiftsWithEmployeeInfo = await httpFetch(
      shiftsEndpoint.exportMonth(fecha_inicio_mes)
    );

    if (!shiftsWithEmployeeInfo || shiftsWithEmployeeInfo.length === 0) {
      return [];
    }

    // Los datos ya vienen con toda la información necesaria desde el backend
    return shiftsWithEmployeeInfo;
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
    // Primero guardamos o actualizamos el turno base
    const shiftResponse = await httpFetch(shiftsEndpoint.save(), {
      method: "POST",
      body: {
        id_empleado,
        fecha_inicio_semana,
        updates: {
          [`h${dia_semana}_entrada`]: intervalos[0]?.hora_inicio || null,
          [`h${dia_semana}_salida`]: intervalos[0]?.hora_fin || null,
        },
      },
    });

    // Luego guardamos los intervalos
    if (intervalos && intervalos.length > 0) {
      const promises = intervalos.map((intervalo) =>
        httpFetch(shiftsEndpoint.intervals.add(shiftResponse.id_horario), {
          method: "POST",
          body: {
            dia_semana,
            hora_entrada: intervalo.hora_inicio,
            hora_salida: intervalo.hora_fin,
          },
        })
      );
      await Promise.all(promises);
    }

    return await getShiftById(shiftResponse.id_horario);
  } catch (error) {
    console.error("Error en saveShift:", error);
    throw error;
  }
};

export const deleteShift = async (id) => {
  try {
    return await httpFetch(shiftsEndpoint.byId(id), {
      method: "DELETE",
    });
  } catch (error) {
    console.error("Error en deleteShift:", error);
    throw error;
  }
};

export const deleteShiftInterval = async (shiftId, intervalId) => {
  try {
    return await httpFetch(
      shiftsEndpoint.intervals.delete(shiftId, intervalId),
      {
        method: "DELETE",
      }
    );
  } catch (error) {
    console.error("Error en deleteShiftInterval:", error);
    throw error;
  }
};

// Función para copiar horarios de una semana a otra
export const copyShiftsFromPreviousWeek = async (sourceWeek, targetWeek) => {
  try {
    const result = await httpFetch(
      shiftsEndpoint.copy(sourceWeek, targetWeek),
      {
        method: "POST",
      }
    );

    return {
      success: true,
      data: result || { numShifts: 0 },
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
