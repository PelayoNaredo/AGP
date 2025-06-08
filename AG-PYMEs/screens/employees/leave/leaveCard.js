import React, { useState, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Card } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import CustomButton from "../../../components/customButton";
import { useTheme } from "../../../context/ThemeContext";
import PopupMenu, { MenuItem } from "../../../components/popupMenu";
import useNotifications from "../../../hooks/useNotifications";

// Componente LeaveCard muestra la información de una baja laboral de un empleado.
const LeaveCard = ({ leave, employee, onEdit, onDelete }) => {
  const { themeObject } = useTheme();
  const { showSuccess, showError, showConfirmDialog } = useNotifications();
  const [showMenu, setShowMenu] = useState(false);
  const menuButtonRef = useRef(null);

  const statusColors = {
    temporal: themeObject.colors.warning,
    definitiva: themeObject.colors.error,
    medica: themeObject.colors.info,
  };

  const getStatusConfig = () =>
    ({
      temporal: { icon: "calendar", label: "BAJA TEMPORAL" },
      definitiva: { icon: "close-circle", label: "BAJA DEFINITIVA" },
      medica: { icon: "medkit", label: "BAJA MÉDICA" },
    })[leave.tipo_baja];

  const formatDate = (dateString) => {
    if (!dateString) return "Presente";
    const date = new Date(dateString);
    const options = { day: "2-digit", month: "short", year: "numeric" };
    return date.toLocaleDateString("es-ES", options);
  };

  const calculateDuration = () => {
    if (!leave.fecha_inicio) return "";
    const start = new Date(leave.fecha_inicio);
    const end = leave.fecha_fin ? new Date(leave.fecha_fin) : new Date();

    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} día${diffDays > 1 ? "s" : ""}`;
  };

  if (!employee) return null;

  return (
    <Card
      style={[
        styles.container,
        {
          backgroundColor: themeObject.colors.surface,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.employeeInfo}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusColors[leave.tipo_baja] + "20",
                borderColor: statusColors[leave.tipo_baja],
              },
            ]}
          >
            <Ionicons
              name={getStatusConfig().icon}
              size={16}
              color={themeObject.colors.text}
            />
            <Text
              style={[styles.statusText, { color: themeObject.colors.text }]}
            >
              {getStatusConfig().label}
            </Text>
          </View>

          <Text
            style={[styles.employeeName, { color: themeObject.colors.text }]}
          >
            {employee.nombre}
          </Text>
          <Text style={[styles.position, { color: themeObject.colors.text }]}>
            {employee.cargo}
          </Text>
        </View>
        <View style={styles.actions}>
          <PopupMenu
            visible={showMenu}
            onDismiss={() => setShowMenu(false)}
            anchor={
              <CustomButton
                ref={menuButtonRef}
                variant="ghost"
                size="sm"
                ionIconLeft="ellipsis-vertical"
                onPress={() => setShowMenu(true)}
                style={styles.actionButton}
                accessibilityLabel="Opciones para baja"
              />
            }
          >
            <MenuItem
              title="Editar"
              leadingIcon="create-outline"
              onPress={() => {
                setShowMenu(false);
                onEdit(leave);
              }}
            />
            <MenuItem
              title="Eliminar"
              leadingIcon="trash-outline"
              iconColor={themeObject.colors.error}
              titleStyle={{ color: themeObject.colors.error }}
              onPress={() => {
                setShowMenu(false);
                showConfirmDialog(
                  "Eliminar baja laboral",
                  "¿Está seguro de que desea eliminar esta baja laboral? Esta acción no se puede deshacer.",
                  () => {
                    onDelete(leave);
                    showSuccess("Baja laboral eliminada correctamente");
                  }
                );
              }}
            />
          </PopupMenu>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.dateContainer}>
          <Ionicons
            name="calendar"
            size={16}
            color={themeObject.colors.placeholder}
          />
          <View style={styles.dateGroup}>
            <Text
              style={[styles.dateLabel, { color: themeObject.colors.text }]}
            >
              Fechas:{"      "}
            </Text>
            <Text style={[styles.dates, { color: themeObject.colors.text }]}>
              {formatDate(leave.fecha_inicio)} - {formatDate(leave.fecha_fin)}
            </Text>
          </View>
        </View>

        <View style={styles.durationContainer}>
          <Ionicons
            name="time"
            size={16}
            color={themeObject.colors.placeholder}
          />
          <Text style={[styles.duration, { color: themeObject.colors.text }]}>
            {calculateDuration()}
          </Text>
        </View>
      </View>

      {leave.comentarios && (
        <View style={styles.commentsContainer}>
          <Ionicons
            name="document-text"
            size={16}
            color={themeObject.colors.placeholder}
          />
          <Text style={[styles.comments, { color: themeObject.colors.text }]}>
            {leave.comentarios}
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.metaInfo}>
          <Text style={[styles.metaText, { color: themeObject.colors.text }]}>
            <Ionicons name="call" size={12} />
            {employee.telefono}
          </Text>
          <Text style={[styles.metaText, { color: themeObject.colors.text }]}>
            <Ionicons name="mail" size={12} />
            {employee.email}
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    cursor: "pointer",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  employeeInfo: {
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 4,
    textTransform: "uppercase",
  },
  employeeName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  position: {
    fontSize: 14,
    opacity: 0.8,
  },
  details: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 2,
  },
  dateGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  dateLabel: {
    fontSize: 12,
    marginBottom: 2,
    marginRight: 4,
  },
  dates: {
    fontSize: 14,
    fontWeight: "500",
  },
  durationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  duration: {
    fontSize: 14,
    fontWeight: "500",
  },
  commentsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  comments: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.08)",
    paddingTop: 12,
  },
  metaInfo: {
    gap: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaText: {
    fontSize: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionButton: {
    width: 32,
    height: 32,
    padding: 0,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },
});

export default React.memo(LeaveCard);
