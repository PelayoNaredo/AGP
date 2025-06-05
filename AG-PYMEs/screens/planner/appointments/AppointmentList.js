import React, { useMemo } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { ActivityIndicator, Chip, Divider, Surface } from "react-native-paper";
import { useTheme } from "../../../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

const AppointmentList = ({
  appointments,
  selectedDate,
  selectedView,
  onEditAppointment,
  loading,
}) => {
  const { themeObject } = useTheme();

  // Filtrar y agrupar citas por fecha
  const appointmentsByDate = useMemo(() => {
    if (!appointments || appointments.length === 0) return {};

    // Agrupar citas por fecha
    return appointments.reduce((acc, appointment) => {
      const date = new Date(appointment.fecha_inicio);
      const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD

      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }

      acc[dateStr].push(appointment);
      return acc;
    }, {});
  }, [appointments]);

  // Ordenar fechas para mostrar
  const sortedDates = useMemo(() => {
    return Object.keys(appointmentsByDate).sort();
  }, [appointmentsByDate]);

  // Formatear fecha para encabezados
  const formatHeaderDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  // Formatear hora
  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Determinar color según estado de cita
  const getStatusColor = (status) => {
    const colors = {
      pendiente: themeObject.colors.warning,
      confirmada: themeObject.colors.primary,
      completada: themeObject.colors.success,
      cancelada: themeObject.colors.error,
      no_asistio: themeObject.colors.error,
    };
    return colors[status] || themeObject.colors.primary;
  };

  // Traducir estados
  const translateStatus = (status) => {
    const translations = {
      pendiente: "Pendiente",
      confirmada: "Confirmada",
      completada: "Completada",
      cancelada: "Cancelada",
      no_asistio: "No Asistió",
    };
    return translations[status] || status;
  };

  // Verificar si la fecha corresponde al día de hoy
  const isToday = (dateStr) => {
    const today = new Date();
    const date = new Date(dateStr);
    return (
      today.getDate() === date.getDate() &&
      today.getMonth() === date.getMonth() &&
      today.getFullYear() === date.getFullYear()
    );
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

  if (sortedDates.length === 0) {
    return (
      <View
        style={[
          styles.emptyContainer,
          { backgroundColor: themeObject.colors.surface },
        ]}
      >
        <Ionicons
          name="calendar-outline"
          size={60}
          color={themeObject.colors.placeholder}
        />
        <Text style={[styles.emptyText, { color: themeObject.colors.text }]}>
          No hay citas programadas
        </Text>
        <Text
          style={[
            styles.emptySubText,
            { color: themeObject.colors.placeholder },
          ]}
        >
          Puedes crear una nueva cita usando el botón "Nueva Cita"
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {sortedDates.map((dateStr) => (
        <View key={dateStr} style={styles.dateSection}>
          <Surface
            style={[
              styles.dateHeader,
              {
                backgroundColor: isToday(dateStr)
                  ? `${themeObject.colors.primary}20`
                  : themeObject.colors.surface,
                borderColor: themeObject.colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.dateHeaderText,
                { color: themeObject.colors.text },
              ]}
            >
              {formatHeaderDate(dateStr)}
            </Text>
            {isToday(dateStr) && (
              <Chip
                style={{ backgroundColor: themeObject.colors.primary }}
                textStyle={{ color: "#fff" }}
              >
                Hoy
              </Chip>
            )}
            <Text
              style={[
                styles.appointmentCount,
                { color: themeObject.colors.text },
              ]}
            >
              {appointmentsByDate[dateStr].length} citas
            </Text>
          </Surface>

          {appointmentsByDate[dateStr]
            .sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio))
            .map((appointment) => (
              <Pressable
                key={appointment.id_cita}
                style={[
                  styles.appointmentCard,
                  {
                    backgroundColor: themeObject.colors.surface,
                    borderColor: themeObject.colors.border,
                    borderLeftColor: getStatusColor(appointment.estado),
                  },
                ]}
                onPress={() => onEditAppointment(appointment)}
              >
                <View style={styles.appointmentHeader}>
                  <View style={styles.timeContainer}>
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={themeObject.colors.text}
                    />
                    <Text
                      style={[
                        styles.timeText,
                        { color: themeObject.colors.text },
                      ]}
                    >
                      {formatTime(appointment.fecha_inicio)} -{" "}
                      {formatTime(appointment.fecha_fin)}
                    </Text>
                  </View>

                  <Chip
                    style={{
                      backgroundColor: `${getStatusColor(appointment.estado)}30`,
                    }}
                    textStyle={{
                      color: getStatusColor(appointment.estado),
                      fontSize: 12,
                    }}
                  >
                    {translateStatus(appointment.estado)}
                  </Chip>
                </View>

                <Divider
                  style={[
                    styles.divider,
                    { backgroundColor: themeObject.colors.border },
                  ]}
                />

                <View style={styles.appointmentDetails}>
                  {appointment.nombre_empleado && (
                    <View style={styles.detailRow}>
                      <Ionicons
                        name="person-outline"
                        size={16}
                        color={themeObject.colors.text}
                      />
                      <Text
                        style={[
                          styles.detailText,
                          { color: themeObject.colors.text },
                        ]}
                      >
                        Profesional: {appointment.nombre_empleado}
                      </Text>
                    </View>
                  )}

                  {appointment.nombre_cliente &&
                    appointment.apellido_cliente && (
                      <View style={styles.detailRow}>
                        <Ionicons
                          name="people-outline"
                          size={16}
                          color={themeObject.colors.text}
                        />
                        <Text
                          style={[
                            styles.detailText,
                            { color: themeObject.colors.text },
                          ]}
                        >
                          Cliente: {appointment.nombre_cliente}{" "}
                          {appointment.apellido_cliente}
                        </Text>
                      </View>
                    )}

                  {appointment.nombre_servicio && (
                    <View style={styles.detailRow}>
                      <Ionicons
                        name="bookmark-outline"
                        size={16}
                        color={themeObject.colors.text}
                      />
                      <Text
                        style={[
                          styles.detailText,
                          { color: themeObject.colors.text },
                        ]}
                      >
                        Servicio: {appointment.nombre_servicio}
                      </Text>
                    </View>
                  )}

                  {appointment.notas && (
                    <View style={styles.detailRow}>
                      <Ionicons
                        name="document-text-outline"
                        size={16}
                        color={themeObject.colors.text}
                      />
                      <Text
                        style={[
                          styles.detailText,
                          { color: themeObject.colors.text },
                        ]}
                        numberOfLines={2}
                      >
                        Notas: {appointment.notas}
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            ))}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  dateSection: {
    marginBottom: 24,
  },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    justifyContent: "space-between",
    borderWidth: 1,
  },
  dateHeaderText: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    textTransform: "capitalize",
  },
  appointmentCount: {
    marginLeft: 12,
    fontSize: 14,
  },
  appointmentCard: {
    marginBottom: 12,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderLeftWidth: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  appointmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "600",
  },
  divider: {
    marginVertical: 10,
  },
  appointmentDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
  },
});

export default AppointmentList;
