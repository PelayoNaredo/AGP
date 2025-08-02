import { useState, useEffect } from "react";
import { Services } from "../../../api/index";
import { useUnifiedCache } from "../../../cache/hooks/useUnifiedCache";
import useNotifications from "../../../hooks/useNotifications";
import { useAuth } from "../../../context/AuthContext";

// Maneja la lógica de la pantalla de gestión de citas
const AppointmentManagerContainer = ({ children }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedView, setSelectedView] = useState("día"); // día, semana, mes
  const [appointments, setAppointments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showError, showSuccess, showInfo } = useNotifications();
  const { ensureTokenAvailable, isAuthenticated } = useAuth();

  // Hook del cache unificado (compatible con API anterior)
  const cache = useUnifiedCache();
  const {
    getEmployees,
    getServices,
    getClients,
    getAppointmentsByDateRange,
    invalidateAppointments,
    isLoading: isCacheLoading,
    getStats,
  } = cache;

  // Debug: Log cache stats periodically
  useEffect(() => {
    const logCacheStats = () => {
      try {
        const stats = getStats();
      } catch (error) {
        console.warn("[AppointmentManager] Could not get cache stats:", error);
      }
    };

    // Log stats every 30 seconds
    const interval = setInterval(logCacheStats, 30000);

    // Log initial stats
    logCacheStats();

    return () => clearInterval(interval);
  }, [getStats]);

  // Formatear fecha a YYYY-MM-DD
  function formatPostgresDate(date) {
    // Asegurar que la fecha está en el formato correcto (YYYY-MM-DD)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } // Obtener fechas de inicio y fin según la vista seleccionada
  const getDateRangeForView = (date, view) => {
    // Crear copias de la fecha para no modificar la original
    const startDate = new Date(date);
    const endDate = new Date(date);

    // Asegurar que estamos trabajando con fechas que PostgreSQL pueda manejar correctamente
    if (view === "día") {
      // Para la vista de día, usamos la misma fecha
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (view === "semana") {
      // Para la vista de semana, obtenemos el lunes y el domingo
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // ajustar si es domingo
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0);

      endDate.setTime(startDate.getTime());
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (view === "mes") {
      // Para la vista de mes, obtenemos el primer y último día del mes
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
      endDate.setHours(23, 59, 59, 999);
    }

    // Garantizar formato de fecha ISO normalizado para evitar problemas de zona horaria
    // Usar formato específico que PostgreSQL acepta sin ambigüedades, formateando con UTC
    const formatToPostgresTimestamp = (date) => {
      return date.toISOString();
    };

    return {
      startDate: formatToPostgresTimestamp(startDate),
      endDate: formatToPostgresTimestamp(endDate),
    };
  };
  // Cargar datos iniciales con cache optimizado
  useEffect(() => {
    const loadData = async () => {
      // No cargar datos si no está autenticado
      if (!isAuthenticated) {
        console.log("🔄 Esperando autenticación...");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Asegurar que el token esté disponible antes de proceder
        try {
          await ensureTokenAvailable();
          console.log("✅ Token confirmado, procediendo con carga de datos");
        } catch (tokenError) {
          console.error("❌ Token no disponible:", tokenError);
          setError(
            "Error de autenticación. Por favor, intente refrescar la página."
          );
          return;
        }

        // Obtener el rango de fechas para la vista actual
        const { startDate, endDate } = getDateRangeForView(
          selectedDate,
          selectedView
        );

        try {
          // Usar cache inteligente para cargar datos - forzar refresh si es un cambio de mes
          const currentMonth = selectedDate.getMonth();
          const currentYear = selectedDate.getFullYear();
          const forceRefresh =
            !appointments.length || // Primera carga
            appointments.some((apt) => {
              const aptDate = new Date(apt.fecha_inicio || apt.fecha_cita);
              return (
                aptDate.getMonth() !== currentMonth ||
                aptDate.getFullYear() !== currentYear
              );
            });

          const results = await Promise.allSettled([
            getAppointmentsByDateRange(startDate, endDate, forceRefresh),
            getEmployees(), // Cache de 30 min
            getServices(), // Cache de 30 min
            getClients(), // Cache de 15 min
          ]);

          // Procesar los resultados
          if (
            results[0].status === "fulfilled" &&
            Array.isArray(results[0].value)
          ) {
            setAppointments(results[0].value);
          } else {
            console.warn("Error al cargar citas:", results[0].reason);
            // Mantener las citas anteriores en lugar de limpiarlas
          }

          if (
            results[1].status === "fulfilled" &&
            Array.isArray(results[1].value)
          ) {
            setEmployees(results[1].value);
          } else {
            console.warn("Error al cargar empleados:", results[1].reason);
          }

          if (
            results[2].status === "fulfilled" &&
            Array.isArray(results[2].value)
          ) {
            setServices(results[2].value);
          } else {
            console.warn("Error al cargar servicios:", results[2].reason);
          }

          if (
            results[3].status === "fulfilled" &&
            Array.isArray(results[3].value)
          ) {
            setClients(results[3].value);
          } else {
            console.warn("Error al cargar clientes:", results[3].reason);
          }

          // Verificar si hubo algún error en las respuestas
          const errors = results
            .filter((r) => r.status === "rejected")
            .map((r) => r.reason?.message || "Error desconocido");
          if (errors.length > 0) {
            console.warn("Errores detectados:", errors);
            // Mostramos el error solo si fallan todos los servicios importantes
            if (errors.length >= 2) {
              const errorMsg =
                "Algunos datos no pudieron cargarse correctamente. La funcionalidad puede estar limitada.";
              setError(errorMsg);
              showError("Error de carga", errorMsg);
            }
          }
        } catch (apiError) {
          console.error("Error en las llamadas API:", apiError);
          const errorMsg = "Error de comunicación con el servidor.";
          setError(errorMsg);
          showError("Error de comunicación", errorMsg);
        }
      } catch (err) {
        console.error("Error general cargando datos de citas:", err);
        const errorMsg =
          "Error al cargar los datos. La vista puede estar incompleta.";
        setError(errorMsg);
        showError("Error", errorMsg);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [
    selectedDate,
    selectedView,
    isAuthenticated,
    getAppointmentsByDateRange,
    getEmployees,
    getServices,
    getClients,
    ensureTokenAvailable,
  ]); // Dependencias optimizadas

  // Crear una nueva cita
  const handleCreateAppointment = async (appointmentData) => {
    try {
      setLoading(true);

      // Limpiar datos antes de enviar
      const cleanedData = {
        ...appointmentData,
        id_cliente: appointmentData.id_cliente || null,
        id_servicio: appointmentData.id_servicio || null,
      };

      const result = await Services.Data.Appointments.create(cleanedData);

      // Actualizar las citas locales
      setAppointments((prev) => [...prev, result]);

      // Invalidar cache de appointments para refrescar datos
      await invalidateAppointments();

      // También invalida el cache específico del mes de la nueva cita
      const appointmentDate = new Date(
        result.fecha_inicio || result.fecha_cita
      );
      const monthKey = `${appointmentDate.getFullYear()}-${String(appointmentDate.getMonth() + 1).padStart(2, "0")}`;
      await cache.invalidate(`appointments_monthly_${monthKey}`);
      // Mostrar notificación de éxito
      showSuccess("Cita creada correctamente");

      return result;
    } catch (err) {
      console.error("Error creando cita:", err);
      setError(err.message);
      showError("Error", `No se pudo crear la cita: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar una cita existente
  const handleUpdateAppointment = async (id, appointmentData) => {
    try {
      setLoading(true);

      // Limpiar datos antes de enviar
      const cleanedData = {
        ...appointmentData,
        id_cliente: appointmentData.id_cliente || null,
        id_servicio: appointmentData.id_servicio || null,
      };

      const result = await Services.Data.Appointments.update(id, cleanedData);

      // Actualizar las citas locales
      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment.id_cita === id ? result : appointment
        )
      );

      // Invalidar cache de appointments para refrescar datos
      await invalidateAppointments();

      // También invalida el cache específico del mes de la cita actualizada
      const appointmentDate = new Date(
        result.fecha_inicio || result.fecha_cita
      );
      const monthKey = `${appointmentDate.getFullYear()}-${String(appointmentDate.getMonth() + 1).padStart(2, "0")}`;
      await cache.invalidate(`appointments_monthly_${monthKey}`);

      // Mostrar notificación de éxito
      showSuccess("Cita actualizada correctamente");

      return result;
    } catch (err) {
      console.error("Error actualizando cita:", err);
      setError(err.message);
      showError("Error", `No se pudo actualizar la cita: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  // Actualizar el estado de una cita
  const handleUpdateAppointmentStatus = async (id, status) => {
    try {
      setLoading(true);
      const result = await Services.Data.Appointments.updateStatus(id, status);

      // Actualizar las citas locales
      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment.id_cita === id ? result : appointment
        )
      );

      // Invalidar cache de appointments para refrescar datos
      await invalidateAppointments();
      // Mostrar notificación según el estado
      if (status === "completada") {
        showSuccess("Cita marcada como completada");
      } else if (status === "cancelada") {
        showInfo("Cita cancelada");
      } else {
        showSuccess(`Estado de la cita actualizado: ${status}`);
      }

      return result;
    } catch (err) {
      console.error("Error actualizando estado de cita:", err);
      setError(err.message);
      showError(
        "Error",
        `No se pudo actualizar el estado de la cita: ${err.message}`
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Eliminar una cita
  const handleDeleteAppointment = async (id) => {
    try {
      setLoading(true);

      // Obtener la cita antes de eliminarla para invalidar el cache correcto
      const appointmentToDelete = appointments.find(
        (apt) => apt.id_cita === id
      );

      await Services.Data.Appointments.delete(id);

      // Eliminar la cita de las citas locales
      setAppointments((prev) =>
        prev.filter((appointment) => appointment.id_cita !== id)
      );

      // Invalidar cache de appointments para refrescar datos
      await invalidateAppointments();

      // También invalida el cache específico del mes de la cita eliminada
      if (appointmentToDelete) {
        const appointmentDate = new Date(
          appointmentToDelete.fecha_inicio || appointmentToDelete.fecha_cita
        );
        const monthKey = `${appointmentDate.getFullYear()}-${String(appointmentDate.getMonth() + 1).padStart(2, "0")}`;
        await cache.invalidate(`appointments_monthly_${monthKey}`);
      }

      // Mostrar notificación de éxito
      showSuccess("Cita eliminada correctamente");

      return true;
    } catch (err) {
      console.error("Error eliminando cita:", err);
      setError(err.message);
      showError("Error", `No se pudo eliminar la cita: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleViewChange = (view) => {
    setSelectedView(view);
  };

  // Verificar disponibilidad del profesional para una nueva cita
  const checkEmployeeAvailability = async (
    employeeId,
    startDate,
    endDate,
    appointmentIdToExclude = null
  ) => {
    try {
      // Primera opción: Usar la API para verificar disponibilidad (más preciso)
      const result = await Services.Data.Appointments.checkAvailability(
        employeeId,
        startDate,
        endDate,
        appointmentIdToExclude
      );
      return result;
    } catch (error) {
      console.error("Error verificando disponibilidad con la API:", error);

      // Mostrar notificación solo si no es un error de conexión normal
      if (
        !error.message?.includes("timeout") &&
        !error.message?.includes("network")
      ) {
        showInfo(
          "Usando verificación local",
          "No se pudo verificar la disponibilidad con el servidor"
        );
      }

      // Fallback a verificación local en caso de error de conexión
      console.warn("Usando verificación local como fallback");

      // Convertir fechas a objetos Date para asegurar comparaciones correctas
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Caso especial para verificar número de reservas en un horario (sin verificar profesional)
      if (employeeId === "contar_reservas") {
        // Contar todas las citas en ese horario independiente del profesional
        const overlappingAppointments = appointments.filter((appointment) => {
          // Si estamos editando una cita, excluimos esa cita de la verificación
          if (
            appointmentIdToExclude &&
            appointment.id_cita === appointmentIdToExclude
          ) {
            return false;
          }

          // Solo considerar citas no canceladas
          if (appointment.estado === "cancelada") {
            return false;
          }

          const appointmentStart = new Date(appointment.fecha_inicio);
          const appointmentEnd = new Date(appointment.fecha_fin);

          // Verificar solapamiento de horarios
          return (
            (start >= appointmentStart && start < appointmentEnd) ||
            (end > appointmentStart && end <= appointmentEnd) ||
            (start <= appointmentStart && end >= appointmentEnd)
          );
        });

        return overlappingAppointments.length;
      }

      // Caso "sin_asignar" - Siempre disponible pero retornamos cuántas citas hay en ese horario
      if (employeeId === "sin_asignar") {
        // Contamos cuántas citas hay en ese horario (sin importar el profesional)
        const overlappingAppointments = appointments.filter((appointment) => {
          // Si estamos editando una cita, excluimos esa cita de la verificación
          if (
            appointmentIdToExclude &&
            appointment.id_cita === appointmentIdToExclude
          ) {
            return false;
          }

          // Solo considerar citas no canceladas
          if (appointment.estado === "cancelada") {
            return false;
          }

          const appointmentStart = new Date(appointment.fecha_inicio);
          const appointmentEnd = new Date(appointment.fecha_fin);

          // Verificar solapamiento de horarios
          return (
            (start >= appointmentStart && start < appointmentEnd) ||
            (end > appointmentStart && end <= appointmentEnd) ||
            (start <= appointmentStart && end >= appointmentEnd)
          );
        });

        // Retornamos un objeto con disponibilidad y número de citas
        return {
          disponible: true, // Siempre disponible para "sin_asignar"
          reservasExistentes: overlappingAppointments.length,
        };
      }

      // Para profesionales específicos
      // Filtrar todas las citas existentes para el empleado en ese rango de tiempo
      const employeeAppointments = appointments.filter((appointment) => {
        // Si estamos editando una cita, excluimos esa cita de la verificación
        if (
          appointmentIdToExclude &&
          appointment.id_cita === appointmentIdToExclude
        ) {
          return false;
        }

        // Solo considerar citas no canceladas
        if (appointment.estado === "cancelada") {
          return false;
        }

        const appointmentStart = new Date(appointment.fecha_inicio);
        const appointmentEnd = new Date(appointment.fecha_fin);

        // Verificar solapamiento:
        // 1. La nueva cita comienza durante una cita existente
        // 2. La nueva cita termina durante una cita existente
        // 3. La nueva cita abarca completamente una cita existente
        return (
          appointment.id_empleado === employeeId &&
          ((start >= appointmentStart && start < appointmentEnd) ||
            (end > appointmentStart && end <= appointmentEnd) ||
            (start <= appointmentStart && end >= appointmentEnd))
        );
      }); // Permitir múltiples citas simultáneas - siempre disponible
      return {
        disponible: true, // Siempre disponible - sin límite de citas simultáneas
        reservasExistentes: employeeAppointments.length,
      };
    }
  };

  return children({
    selectedDate,
    appointments,
    employees,
    services,
    clients,
    loading,
    error,
    selectedView,
    handleDateChange,
    handleViewChange,
    handleCreateAppointment,
    handleUpdateAppointment,
    handleUpdateAppointmentStatus,
    handleDeleteAppointment,
    checkEmployeeAvailability,
  });
};

export default AppointmentManagerContainer;
