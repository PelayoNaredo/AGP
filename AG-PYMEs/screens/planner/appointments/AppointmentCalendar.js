import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { useTheme } from "../../../context/ThemeContext";
import {
  LightenDarkenColor,
  generateAccessibleRandomColor,
} from "../../../utils/colorUtils";

const AppointmentCalendar = ({
  selectedDate,
  selectedView,
  appointments,
  employees,
  businessHours,
  onEditAppointment,
  loading,
}) => {
  const { themeObject } = useTheme();
  const windowWidth = Dimensions.get("window").width;

  // Función para obtener el color según el estado de la cita
  const getStateColor = (state, themeObj) => {
    const colors = {
      pendiente: themeObj.colors.warning,
      confirmada: "#2196F3", // Azul más vibrante que el primary
      completada: "#4CAF50", // Verde más vibrante que el success
      cancelada: "#F44336", // Rojo más vibrante que el error
      no_asistio: "#FF5722", // Naranja oscuro para distinguir de cancelada
    };
    return colors[state] || themeObj.colors.primary;
  };

  // Traducir estado para mostrar en español
  const getStateText = (state) => {
    const states = {
      pendiente: "Pendiente",
      confirmada: "Confirmada",
      completada: "Completada",
      cancelada: "Cancelada",
      no_asistio: "No Asistió",
    };
    // Retorna el estado traducido con primera letra en mayúscula
    const stateText = states[state] || state;
    return stateText.charAt(0).toUpperCase() + stateText.slice(1);
  };

  const appointmentColors = useMemo(() => {
    // Colores base predefinidos con buen contraste y diversidad
    const predefinedColors = [
      { backgroundColor: "#5C6BC0", textColor: "#FFFFFF" }, // Indigo
      { backgroundColor: "#26A69A", textColor: "#FFFFFF" }, // Teal
      { backgroundColor: "#FFA726", textColor: "#000000" }, // Orange
      { backgroundColor: "#42A5F5", textColor: "#FFFFFF" }, // Blue
      { backgroundColor: "#EC407A", textColor: "#FFFFFF" }, // Pink
      { backgroundColor: "#66BB6A", textColor: "#000000" }, // Green
      { backgroundColor: "#AB47BC", textColor: "#FFFFFF" }, // Purple
      { backgroundColor: "#8D6E63", textColor: "#FFFFFF" }, // Brown
      { backgroundColor: "#29B6F6", textColor: "#000000" }, // Light Blue
      { backgroundColor: "#FFA000", textColor: "#000000" }, // Amber
      { backgroundColor: "#7E57C2", textColor: "#FFFFFF" }, // Deep Purple
      { backgroundColor: "#EF5350", textColor: "#FFFFFF" }, // Red
    ];

    // Crear mapa para agrupar citas por slots de tiempo
    const timeSlotMap = {};

    // Agrupar citas por hora de inicio
    appointments.forEach((appointment) => {
      const startTime = new Date(appointment.fecha_inicio).toISOString();
      if (!timeSlotMap[startTime]) {
        timeSlotMap[startTime] = [];
      }
      timeSlotMap[startTime].push(appointment.id_cita);
    });

    // Asignar colores, asegurando que citas simultaneas tengan colores distintos
    const colors = {};
    let globalColorIndex = 0;

    // Procesar cada slot de tiempo
    Object.keys(timeSlotMap).forEach((timeSlot) => {
      const appointmentIds = timeSlotMap[timeSlot];

      // Reiniciar el índice de color para cada slot con más de una cita
      // para maximizar la diferencia visual entre citas simultáneas
      let slotColorIndex = globalColorIndex;

      appointmentIds.forEach((appointmentId, index) => {
        // Calcular el índice de color para asegurar máxima diferencia entre citas simultáneas
        const colorIdx =
          appointmentIds.length > 1
            ? (slotColorIndex + index * 3) % predefinedColors.length // Saltar cada 3 colores para max diferencia
            : globalColorIndex % predefinedColors.length;

        const appointment = appointments.find(
          (a) => a.id_cita === appointmentId
        );

        colors[appointmentId] = {
          backgroundColor: predefinedColors[colorIdx].backgroundColor,
          textColor: predefinedColors[colorIdx].textColor,
          statusColor: getStateColor(appointment.estado, themeObject),
        };

        globalColorIndex++;
      });
    });

    return colors;
  }, [appointments, themeObject.colors]);

  // Generar fechas para la vista de semana
  const weekDates = useMemo(() => {
    const dates = [];
    const startDate = new Date(selectedDate);

    // Si es vista semanal, ajustar fecha inicial al lunes
    if (selectedView === "semana") {
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate.setDate(diff);
    }

    // Para vista diaria, solo necesitamos un día
    if (selectedView === "día") {
      return [new Date(startDate)];
    }

    // Para vista semanal, generamos los 7 días de la semana
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [selectedDate, selectedView]);

  // Convertir "HH:MM" a minutos desde medianoche
  const timeToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(":").map(Number);
    return hours * 60 + minutes;
  };

  // Generar intervalos de tiempo desde horario comercial
  const timeSlots = useMemo(() => {
    const slots = [];
    const startMinutes = timeToMinutes(businessHours.opening || "09:00");
    const endMinutes = timeToMinutes(businessHours.closing || "18:00");

    // Generar intervalos de 30 minutos
    for (let min = startMinutes; min <= endMinutes; min += 30) {
      const hours = Math.floor(min / 60);
      const minutes = min % 60;
      slots.push(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
      );
    }
    return slots;
  }, [businessHours]);

  // Formatear fecha para mostrar en la cabecera
  const formatHeaderDate = (date) => {
    const options = { weekday: "short", day: "numeric" };
    return date.toLocaleDateString("es-ES", options);
  };
  // Obtener color para una cita específica
  const getAppointmentColor = (appointment) => {
    // Usar el color cacheado para esta cita
    return (
      appointmentColors[appointment.id_cita] || {
        backgroundColor: themeObject.colors.primary,
        textColor: "#FFFFFF",
      }
    );
  };
  // Determinar si una cita corresponde a una fecha y hora específicas
  const getAppointmentsForSlot = (date, timeSlot) => {
    const slotDate = new Date(date);
    const [hours, minutes] = timeSlot.split(":").map(Number);

    slotDate.setHours(hours, minutes, 0, 0);

    // Calcular el final del slot (30 minutos después)
    const slotEndDate = new Date(slotDate);
    slotEndDate.setMinutes(slotEndDate.getMinutes() + 30);

    // Filtrar citas que están activas durante este intervalo de tiempo
    return appointments.filter((appointment) => {
      try {
        const startTime = new Date(appointment.fecha_inicio);
        const endTime = new Date(appointment.fecha_fin);

        // Verificar si la fecha corresponde al mismo día
        const sameDay =
          startTime.getDate() === slotDate.getDate() &&
          startTime.getMonth() === slotDate.getMonth() &&
          startTime.getFullYear() === slotDate.getFullYear();

        if (!sameDay) return false;

        // Solución mejorada: Una cita coincide con el slot si:
        // 1. La cita comienza durante este slot, O
        // 2. La cita termina durante este slot, O
        // 3. La cita abarca completamente este slot
        return (
          (startTime >= slotDate && startTime < slotEndDate) || // Comienza en este slot
          (endTime > slotDate && endTime <= slotEndDate) || // Termina en este slot
          (startTime <= slotDate && endTime >= slotEndDate) // Abarca este slot
        );
      } catch (error) {
        console.error("Error procesando cita:", error, appointment);
        return false;
      }
    });
  };

  // Obtener nombre del empleado
  const getEmployeeName = (employeeId) => {
    const employee = employees.find((emp) => emp.id_empleado === employeeId);
    return employee ? employee.nombre : "Sin asignar";
  };

  // Formatear hora para mostrar
  const formatAppointmentTime = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);

    return `${start.getHours().toString().padStart(2, "0")}:${start.getMinutes().toString().padStart(2, "0")} - ${end.getHours().toString().padStart(2, "0")}:${end.getMinutes().toString().padStart(2, "0")}`;
  };

  // Calcular la altura de la celda basada en la duración de la cita
  const calculateAppointmentHeight = (appointment) => {
    const start = new Date(appointment.fecha_inicio);
    const end = new Date(appointment.fecha_fin);

    // Calcular duración en minutos
    const durationMinutes = (end - start) / (1000 * 60);

    // Convertir minutos a unidades de celda (cada celda es de 30 minutos)
    const slots = Math.ceil(durationMinutes / 30);

    // Altura base de una celda
    const baseHeight = 60;

    return baseHeight * slots - 2; // -2 para compensar bordes
  };

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: themeObject.colors.surface },
        ]}
      >
        <ActivityIndicator size="large" color={themeObject.colors.primary} />
        <Text style={{ color: themeObject.colors.text, marginTop: 16 }}>
          Cargando citas...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.calendarContainer}>
        {/* Cabecera del calendario */}
        <View style={styles.headerRow}>
          <View
            style={[
              styles.timeHeader,
              { borderColor: themeObject.colors.border },
            ]}
          >
            <Text
              style={[styles.headerText, { color: themeObject.colors.text }]}
            >
              Hora
            </Text>
          </View>

          {weekDates.map((date, index) => (
            <View
              key={index}
              style={[
                styles.dayHeader,
                {
                  borderColor: themeObject.colors.border,
                  backgroundColor:
                    date.toDateString() === new Date().toDateString()
                      ? `${themeObject.colors.primary}20`
                      : themeObject.colors.surface,
                },
              ]}
            >
              <Text
                style={[styles.headerText, { color: themeObject.colors.text }]}
              >
                {formatHeaderDate(date)}
              </Text>
            </View>
          ))}
        </View>

        {/* Contenido del calendario */}
        <View style={styles.calendarGrid}>
          {timeSlots.map((timeSlot, timeIndex) => (
            <View key={timeSlot} style={styles.timeRow}>
              {/* Indicador de hora */}
              <View
                style={[
                  styles.timeCell,
                  { borderColor: themeObject.colors.border },
                ]}
              >
                <Text
                  style={[styles.timeText, { color: themeObject.colors.text }]}
                >
                  {timeSlot}
                </Text>
              </View>
              {/* Celdas para cada día */}
              {weekDates.map((date, dateIndex) => {
                const slotAppointments = getAppointmentsForSlot(date, timeSlot);
                return (
                  <View
                    key={`${dateIndex}-${timeIndex}`}
                    style={[
                      styles.dayCell,
                      {
                        borderColor: themeObject.colors.border,
                        backgroundColor:
                          date.toDateString() === new Date().toDateString()
                            ? `${themeObject.colors.primary}10`
                            : themeObject.colors.surface,
                      },
                    ]}
                  >
                    {slotAppointments.length > 0
                      ? slotAppointments.map((appointment, appIndex) => {
                          // Solo mostrar la cita en su hora de inicio para evitar duplicados
                          const appointmentStart = new Date(
                            appointment.fecha_inicio
                          );
                          const [hours, minutes] = timeSlot
                            .split(":")
                            .map(Number);
                          const slotMinutes = hours * 60 + minutes;
                          const startMinutes =
                            appointmentStart.getHours() * 60 +
                            appointmentStart.getMinutes();

                          // Mostrar la cita solo si este slot coincide con su hora de inicio
                          // Redondeando la hora de inicio de la cita al intervalo de 30 minutos anterior o igual
                          const roundedStartMinutes =
                            Math.floor(startMinutes / 30) * 30;
                          const isSameStartTime =
                            slotMinutes === roundedStartMinutes;

                          if (isSameStartTime) {
                            // Calcular posición para citas simultáneas
                            // Con múltiples citas, dividimos el ancho de la celda
                            const totalAppointments = slotAppointments.filter(
                              (app) => {
                                const appStart = new Date(app.fecha_inicio);
                                const appStartMinutes =
                                  appStart.getHours() * 60 +
                                  appStart.getMinutes();
                                const appRoundedStartMinutes =
                                  Math.floor(appStartMinutes / 30) * 30;
                                return (
                                  appRoundedStartMinutes === roundedStartMinutes
                                );
                              }
                            ).length;

                            // Calcular el índice de esta cita entre las citas simultáneas
                            const simultaneousIndex = slotAppointments
                              .filter((app) => {
                                const appStart = new Date(app.fecha_inicio);
                                const appStartMinutes =
                                  appStart.getHours() * 60 +
                                  appStart.getMinutes();
                                const appRoundedStartMinutes =
                                  Math.floor(appStartMinutes / 30) * 30;
                                return (
                                  appRoundedStartMinutes === roundedStartMinutes
                                );
                              })
                              .findIndex(
                                (app) => app.id_cita === appointment.id_cita
                              );
                            // Obtener colores para esta cita
                            const colorInfo = getAppointmentColor(appointment);

                            // Calcular el ancho y posición horizontal de la cita
                            const appointmentWidth =
                              totalAppointments > 1
                                ? 100 / totalAppointments + "%"
                                : "100%";

                            const appointmentLeft =
                              totalAppointments > 1
                                ? (simultaneousIndex * 100) /
                                    totalAppointments +
                                  "%"
                                : "0%";

                            return (
                              <Pressable
                                key={`${appointment.id_cita}-${appIndex}`}
                                style={[
                                  styles.appointmentCard,
                                  {
                                    backgroundColor: colorInfo.backgroundColor,
                                    height:
                                      calculateAppointmentHeight(appointment),
                                    opacity: 0.9,
                                    zIndex: 10,
                                    width: appointmentWidth,
                                    left: appointmentLeft,
                                  },
                                ]}
                                onPress={() => onEditAppointment(appointment)}
                              >
                                <View style={styles.appointmentContentWrapper}>
                                  <Text
                                    style={[
                                      styles.appointmentTime,
                                      { color: colorInfo.textColor },
                                    ]}
                                  >
                                    {formatAppointmentTime(
                                      appointment.fecha_inicio,
                                      appointment.fecha_fin
                                    )}
                                  </Text>
                                  <Text
                                    style={[
                                      styles.appointmentTitle,
                                      { color: colorInfo.textColor },
                                    ]}
                                    numberOfLines={1}
                                  >
                                    {getEmployeeName(appointment.id_empleado)}
                                  </Text>
                                  {appointment.nombre_cliente && (
                                    <Text
                                      style={[
                                        styles.appointmentClient,
                                        { color: colorInfo.textColor },
                                      ]}
                                      numberOfLines={1}
                                    >
                                      {appointment.nombre_cliente}{" "}
                                      {appointment.apellido_cliente}
                                    </Text>
                                  )}
                                  {appointment.nombre_servicio &&
                                    totalAppointments === 1 && (
                                      <Text
                                        style={[
                                          styles.appointmentService,
                                          { color: colorInfo.textColor },
                                        ]}
                                        numberOfLines={1}
                                      >
                                        {appointment.nombre_servicio}
                                      </Text>
                                    )}
                                </View>
                                {/* Etiqueta del estado */}
                                <View
                                  style={[
                                    styles.statusLabel,
                                    {
                                      backgroundColor: colorInfo.statusColor,
                                      borderColor: colorInfo.statusColor,
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.statusText,
                                      { color: "#FFFFFF" },
                                    ]}
                                  >
                                    {""}
                                  </Text>
                                </View>
                              </Pressable>
                            );
                          }
                          return null;
                        })
                      : null}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  calendarContainer: {
    flexDirection: "column",
  },
  headerRow: {
    flexDirection: "row",
    height: 50,
  },
  timeHeader: {
    width: 80,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderBottomWidth: 2,
  },
  dayHeader: {
    flex: 1,
    minWidth: 120,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderBottomWidth: 2,
  },
  headerText: {
    fontWeight: "600",
    fontSize: 14,
  },
  calendarGrid: {
    flexDirection: "column",
  },
  timeRow: {
    flexDirection: "row",
    minHeight: 60,
  },
  timeCell: {
    width: 80,
    justifyContent: "center",
    alignItems: "center",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
  },
  timeText: {
    fontSize: 12,
  },
  dayCell: {
    flex: 1,
    minWidth: 120,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    position: "relative",
  },
  appointmentCard: {
    position: "absolute",
    top: 1,
    borderRadius: 4,
    padding: 6,
    opacity: 0.9,
    zIndex: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  appointmentContentWrapper: {
    paddingRight: 50, // Espacio para la etiqueta de estado
  },
  appointmentTime: {
    fontSize: 10,
    fontWeight: "600",
  },
  appointmentTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 2,
  },
  appointmentClient: {
    fontSize: 11,
    marginTop: 4,
  },
  appointmentService: {
    fontSize: 10,
    fontStyle: "italic",
    marginTop: 2,
  },
  statusLabel: {
    position: "absolute",
    right: 4,
    top: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 0,
    alignSelf: "flex-start",
    minWidth: 8,
    minHeight: 12,
    alignItems: "center",
  },
  statusText: {
    fontSize: 9,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default AppointmentCalendar;
