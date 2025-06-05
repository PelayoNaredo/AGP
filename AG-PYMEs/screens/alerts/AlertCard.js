import React from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import CustomButton from "../../components/customButton";

// Componente de tarjeta de alerta
const AlertCard = ({ alert, onPress, onComplete }) => {
  const { themeObject } = useTheme();

  const getAlertIcon = (type) => {
    const icons = {
      inventario: "cube-outline",
      pagos: "cash-outline",
      horarios: "time-outline",
      mantenimiento: "construct-outline",
    };
    return icons[type] || "alert-circle-outline";
  };

  const getPriorityColor = (priority) =>
    ({
      alta: themeObject.colors.error,
      media: themeObject.colors.warning,
      baja: themeObject.colors.info,
    })[priority?.toLowerCase()] || themeObject.colors.info;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const timeOptions = { hour: "2-digit", minute: "2-digit" };
    const dateOptions = { day: "2-digit", month: "short" };

    let datePrefix = "";
    if (date.toDateString() === today.toDateString()) datePrefix = "Hoy";
    else if (date.toDateString() === tomorrow.toDateString())
      datePrefix = "Mañana";

    return `${datePrefix ? datePrefix + " • " : ""}${date.toLocaleTimeString("es-ES", timeOptions)}, ${date.toLocaleDateString("es-ES", dateOptions)}`;
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: themeObject.colors.surface,
          borderColor: themeObject.colors.border,
          opacity: pressed ? 0.9 : 1,
          ...Platform.select({
            web: {
              cursor: "pointer",
              transition: "all 0.2s ease",
              ":hover": {
                transform: "translateY(-2px)",
                boxShadow: themeObject.colors.border,
              },
            },
          }),
        },
      ]}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.iconWrapper,
            { backgroundColor: getPriorityColor(alert.prioridad) },
          ]}
        >
          <Ionicons
            name={getAlertIcon(alert.tipo)}
            size={20}
            color={themeObject.colors.buttonWhite}
          />
        </View>

        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text
              style={[styles.title, { color: themeObject.colors.text }]}
              numberOfLines={1}
            >
              {alert.titulo}
            </Text>
            <View
              style={[
                styles.priorityBadge,
                { backgroundColor: getPriorityColor(alert.prioridad) },
              ]}
            >
              <Text style={styles.priorityText}>
                {(alert.prioridad || "baja").toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.metaContainer}>
            <View style={styles.typeTag}>
              <Ionicons
                name="pricetag"
                size={12}
                color={themeObject.colors.placeholder}
              />
              <Text
                style={[
                  styles.typeText,
                  { color: themeObject.colors.placeholder },
                ]}
              >
                {alert.tipo}
              </Text>
            </View>
            <Text
              style={[styles.date, { color: themeObject.colors.placeholder }]}
            >
              {formatDate(alert.fecha_recordatorio)}
            </Text>
          </View>
        </View>
      </View>

      {alert.descripcion && (
        <Text
          style={[styles.description, { color: themeObject.colors.text }]}
          numberOfLines={3}
          ellipsizeMode="tail"
        >
          {alert.descripcion}
        </Text>
      )}

      <View style={styles.footer}>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                alert.estado === "completado"
                  ? themeObject.colors.success + "20"
                  : themeObject.colors.warning + "20",
            },
          ]}
        >
          <Ionicons
            name={alert.estado === "completado" ? "checkmark-circle" : "time"}
            size={14}
            color={
              alert.estado === "completado"
                ? themeObject.colors.success
                : themeObject.colors.warning
            }
          />
          <Text
            style={[
              styles.statusText,
              {
                color:
                  alert.estado === "completado"
                    ? themeObject.colors.success
                    : themeObject.colors.warning,
              },
            ]}
          >
            {(alert.estado || "pendiente").toUpperCase()}
          </Text>
        </View>

        <CustomButton
          variant="ghost"
          size="sm"
          ionIconLeft={
            alert.estado === "completado" ? "refresh" : "checkmark-circle"
          }
          onPress={onComplete}
          style={styles.actionButton}
        >
          {alert.estado === "completado" ? "Reabrir" : "Completar"}
        </CustomButton>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  iconWrapper: {
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    marginRight: 8,
    flexShrink: 1,
  },
  priorityBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  priorityText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
  metaContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  typeTag: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  typeText: {
    fontSize: 12,
    marginLeft: 4,
  },
  date: {
    fontSize: 12,
    opacity: 0.8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    opacity: 0.9,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  actionButton: {
    minWidth: 120,
  },
});

export default AlertCard;
