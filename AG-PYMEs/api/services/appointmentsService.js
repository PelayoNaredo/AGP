import { httpFetch } from "../http";
import { appointmentsEndpoint } from "../endpoints";

// Función para formatear fechas manteniendo la zona horaria original
const formatDateWithTimezone = (dateInput) => {
  if (!dateInput) return null;

  const date = new Date(dateInput);

  if (isNaN(date.getTime())) {
    console.error("Fecha inválida:", dateInput);
    return null;
  }

  // Formato ISO que mantiene la hora exactamente como se introdujo
  // YYYY-MM-DDTHH:MM:SS+00:00 o YYYY-MM-DDTHH:MM:SSZ
  return date.toISOString();
};

export const getAllAppointments = async () => {
  try {
    return await httpFetch(appointmentsEndpoint.base());
  } catch (error) {
    console.error("Error al obtener las citas:", error);
    throw error;
  }
};

export const getAppointmentById = async (id) => {
  try {
    return await httpFetch(appointmentsEndpoint.byId(id));
  } catch (error) {
    console.error("Error al obtener la cita:", error);
    throw error;
  }
};

export const getAppointmentsByClient = async (clientId) => {
  try {
    return await httpFetch(appointmentsEndpoint.byClient(clientId));
  } catch (error) {
    console.error("Error al obtener citas del cliente:", error);
    throw error;
  }
};

export const getAppointmentsByEmployee = async (employeeId) => {
  try {
    return await httpFetch(appointmentsEndpoint.byEmployee(employeeId));
  } catch (error) {
    console.error("Error al obtener citas del empleado:", error);
    throw error;
  }
};

export const getAppointmentsByDateRange = async (startDate, endDate) => {
  try {
    // Validar que tenemos fechas
    if (!startDate || !endDate) {
      console.error("Se requieren ambas fechas:", { startDate, endDate });
      throw new Error("Se requieren ambas fechas");
    }

    // Asegurarnos de que las fechas están en formato ISO
    let start, end;

    try {
      // Si las fechas ya están en formato ISO, no es necesario convertirlas
      const isIsoDate = (str) => {
        return (
          str &&
          typeof str === "string" &&
          str.includes("T") &&
          str.includes("Z")
        );
      };

      // Intentar convertir las fechas a objetos Date
      start = isIsoDate(startDate)
        ? startDate
        : new Date(startDate).toISOString();
      end = isIsoDate(endDate) ? endDate : new Date(endDate).toISOString();

      // Verificar que son fechas válidas
      if (
        new Date(start).toString() === "Invalid Date" ||
        new Date(end).toString() === "Invalid Date"
      ) {
        throw new Error("Formato de fecha inválido");
      }
    } catch (error) {
      console.error("Error al procesar fechas:", { startDate, endDate, error });
      throw new Error("Fechas inválidas. Verifique el formato.");
    }

    const url = appointmentsEndpoint.byDateRange(
      encodeURIComponent(start),
      encodeURIComponent(end)
    );

    return await httpFetch(url);
  } catch (error) {
    console.error("Error al obtener citas por rango de fechas:", error);
    throw error;
  }
};

export const createAppointment = async (appointmentData) => {
  try {
    // Formatear fechas para enviar al servidor conservando la zona horaria
    // Verificamos si las fechas ya están en formato ISO
    const isIsoDate = (str) => {
      return (
        str && typeof str === "string" && str.includes("T") && str.includes("Z")
      );
    };

    const formattedData = {
      ...appointmentData,
      fecha_inicio: isIsoDate(appointmentData.fecha_inicio)
        ? appointmentData.fecha_inicio
        : formatDateWithTimezone(appointmentData.fecha_inicio),
      fecha_fin: isIsoDate(appointmentData.fecha_fin)
        ? appointmentData.fecha_fin
        : formatDateWithTimezone(appointmentData.fecha_fin),
    };

    return await httpFetch(appointmentsEndpoint.base(), {
      method: "POST",
      body: formattedData,
    });
  } catch (error) {
    console.error("Error al crear la cita:", error);
    throw error;
  }
};

export const updateAppointment = async (id, appointmentData) => {
  try {
    // Formatear fechas si existen conservando la zona horaria
    // Verificamos si las fechas ya están en formato ISO
    const isIsoDate = (str) => {
      return (
        str && typeof str === "string" && str.includes("T") && str.includes("Z")
      );
    };

    const formattedData = {
      ...appointmentData,
      ...(appointmentData.fecha_inicio && {
        fecha_inicio: isIsoDate(appointmentData.fecha_inicio)
          ? appointmentData.fecha_inicio
          : formatDateWithTimezone(appointmentData.fecha_inicio),
      }),
      ...(appointmentData.fecha_fin && {
        fecha_fin: isIsoDate(appointmentData.fecha_fin)
          ? appointmentData.fecha_fin
          : formatDateWithTimezone(appointmentData.fecha_fin),
      }),
    };

    return await httpFetch(appointmentsEndpoint.byId(id), {
      method: "PUT",
      body: formattedData,
    });
  } catch (error) {
    console.error("Error al actualizar la cita:", error);
    throw error;
  }
};

export const updateAppointmentStatus = async (id, status) => {
  try {
    return await httpFetch(appointmentsEndpoint.updateStatus(id), {
      method: "PATCH",
      body: { estado: status },
    });
  } catch (error) {
    console.error("Error al actualizar el estado de la cita:", error);
    throw error;
  }
};

export const deleteAppointment = async (id) => {
  try {
    return await httpFetch(appointmentsEndpoint.byId(id), {
      method: "DELETE",
    });
  } catch (error) {
    console.error("Error al eliminar la cita:", error);
    throw error;
  }
};

export const checkEmployeeAvailability = async (
  employeeId,
  startDate,
  endDate,
  appointmentId = null
) => {
  try {
    // Asegurarse que las fechas están en formato ISO
    const isIsoDate = (str) => {
      return (
        str && typeof str === "string" && str.includes("T") && str.includes("Z")
      );
    };

    const formattedStartDate = isIsoDate(startDate)
      ? startDate
      : new Date(startDate).toISOString();

    const formattedEndDate = isIsoDate(endDate)
      ? endDate
      : new Date(endDate).toISOString();

    return await httpFetch(
      appointmentsEndpoint.checkAvailability(
        employeeId,
        formattedStartDate,
        formattedEndDate,
        appointmentId
      )
    );
  } catch (error) {
    console.error("Error al verificar disponibilidad:", error);
    throw error;
  }
};
