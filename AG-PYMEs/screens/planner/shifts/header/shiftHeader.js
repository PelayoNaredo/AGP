import React, { useState } from "react";
import { View, StyleSheet, Text, Platform } from "react-native";
import { useTheme } from "../../../../context/ThemeContext";
import CustomButton from "../../../../components/customButton";
import { Menu, Portal } from "react-native-paper";
import Ionicons from "react-native-vector-icons/Ionicons";
import CopyWeekModal from "./CopyWeekModal";
import ExportCsvModal from "./ExportCsvModal";
import EmailModal from "./EmailModal";
import { NotificationProvider } from "../../../../context/NotificationContext";

// Función para obtener el número de semana
const getWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
};

//Componente ShiftHeader para la cabecera de la vista de turnos permite navegación entre días/semanas, cambio de vista y accciones de gestión
const ShiftHeader = ({
  selectedDate,
  onDateChange,
  selectedView,
  onViewChange,
  onShowDatePicker,
}) => {
  const { themeObject } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [isCopyModalVisible, setIsCopyModalVisible] = useState(false);
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [isEmailModalVisible, setIsEmailModalVisible] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  // Función para navegación
  const handleNavigation = (direction) => {
    const newDate = new Date(selectedDate);

    if (selectedView === "semana") {
      // Para vista semanal, avanzar/retroceder una semana completa
      const offset = direction === "prev" ? -7 : 7;
      newDate.setDate(newDate.getDate() + offset);

      // Asegurarse de que la fecha caiga en lunes
      const day = newDate.getDay();
      const diff = newDate.getDate() - day + (day === 0 ? -6 : 1); // Ajuste para que sea lunes
      newDate.setDate(diff);
    } else {
      // Para vista diaria, avanzar/retroceder un día
      const offset = direction === "prev" ? -1 : 1;
      newDate.setDate(newDate.getDate() + offset);
    }

    onDateChange(newDate);
  };

  // Manipuladores para los componentes modales
  const handleCopyStart = () => setIsCopying(true);
  const handleCopyComplete = () => setIsCopying(false);

  const isWeb = Platform.OS === "web";
  const styles = createStyles(themeObject);

  return (
    <View style={styles.headerContainer}>
      {/* Navegación */}
      <View style={styles.navigationContainer}>
        <CustomButton
          onPress={() => handleNavigation("prev")}
          variant="ghost"
          ionIconLeft="chevron-back-outline"
          size="icon"
        />

        <CustomButton
          onPress={onShowDatePicker}
          variant="outline"
          ionIconLeft="calendar-outline"
          size="lg"
          style={styles.dateButton}
        >
          <Text style={styles.dateText}>
            {selectedView === "semana"
              ? `${selectedDate.toLocaleDateString("es-ES", {
                  month: "long",
                  year: "numeric",
                })}\nSemana ${getWeekNumber(selectedDate)}`
              : selectedDate.toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
          </Text>
        </CustomButton>

        <CustomButton
          onPress={() => handleNavigation("next")}
          variant="ghost"
          ionIconLeft="chevron-forward-outline"
          size="icon"
        />
      </View>
      {/* Selector de Vista */}
      {isWeb ? (
        <View style={styles.viewSelectorContainer}>
          <CustomButton
            onPress={() => setIsCopyModalVisible(true)}
            variant="secondary"
            ionIconLeft="copy-outline"
            size="sm"
            disabled={isCopying}
          >
            {isCopying ? "Copiando..." : "Copiar semana anterior"}
          </CustomButton>

          <CustomButton
            onPress={() => setIsExportModalVisible(true)}
            variant="secondary"
            ionIconLeft="download-outline"
            size="sm"
          >
            Exportar CSV
          </CustomButton>

          <CustomButton
            onPress={() => setIsEmailModalVisible(true)}
            variant="secondary"
            ionIconLeft="mail-outline"
            size="sm"
          >
            Enviar email
          </CustomButton>

          <CustomButton
            onPress={() => onViewChange("dia")}
            variant={selectedView === "dia" ? "default" : "secondary"}
            size="sm"
            ionIconLeft="today-outline"
          >
            Día
          </CustomButton>

          <CustomButton
            onPress={() => onViewChange("semana")}
            variant={selectedView === "semana" ? "default" : "secondary"}
            size="sm"
            ionIconLeft="calendar-outline"
          >
            Semana
          </CustomButton>
        </View>
      ) : (
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <CustomButton
              onPress={() => setMenuVisible(true)}
              variant="outline"
              size="icon"
              ionIconLeft="menu-outline"
              style={styles.menuButton}
            />
          }
          contentStyle={{
            ...styles.menuContent,
            backgroundColor: themeObject.colors.surface,
          }}
        >
          <Menu.Item
            title={
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons
                  name="copy-outline"
                  size={20}
                  color={themeObject.colors.text}
                />
                <Text
                  style={{ marginLeft: 10, color: themeObject.colors.text }}
                >
                  Copiar semana anterior
                </Text>
              </View>
            }
            onPress={() => {
              setIsCopyModalVisible(true);
              setMenuVisible(false);
            }}
            titleStyle={styles.menuItemTitle}
            style={styles.menuItem}
          />
          <Menu.Item
            title={
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons
                  name="today-outline"
                  size={20}
                  color={themeObject.colors.text}
                />
                <Text
                  style={{ marginLeft: 10, color: themeObject.colors.text }}
                >
                  Vista Diaria
                </Text>
              </View>
            }
            onPress={() => {
              onViewChange("dia");
              setMenuVisible(false);
            }}
            titleStyle={styles.menuItemTitle}
            style={styles.menuItem}
          />
          <Menu.Item
            title={
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={themeObject.colors.text}
                />
                <Text
                  style={{ marginLeft: 10, color: themeObject.colors.text }}
                >
                  Vista Semanal
                </Text>
              </View>
            }
            onPress={() => {
              onViewChange("semana");
              setMenuVisible(false);
            }}
            titleStyle={styles.menuItemTitle}
            style={styles.menuItem}
          />
          <Menu.Item
            title={
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons
                  name="download-outline"
                  size={20}
                  color={themeObject.colors.text}
                />
                <Text
                  style={{ marginLeft: 10, color: themeObject.colors.text }}
                >
                  Exportar horarios
                </Text>
              </View>
            }
            onPress={() => {
              setIsExportModalVisible(true);
              setMenuVisible(false);
            }}
            titleStyle={styles.menuItemTitle}
            style={styles.menuItem}
          />
          <Menu.Item
            title={
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={themeObject.colors.text}
                />
                <Text
                  style={{ marginLeft: 10, color: themeObject.colors.text }}
                >
                  Enviar horarios por correo
                </Text>
              </View>
            }
            onPress={() => {
              setIsEmailModalVisible(true);
              setMenuVisible(false);
            }}
            titleStyle={styles.menuItemTitle}
            style={styles.menuItem}
          />
        </Menu>
      )}
      {/* Modales */}
      <Portal>
        <NotificationProvider>
          <CopyWeekModal
            visible={isCopyModalVisible}
            onDismiss={() => setIsCopyModalVisible(false)}
            selectedDate={selectedDate}
            themeObject={themeObject}
            onCopyStart={handleCopyStart}
            onCopyComplete={handleCopyComplete}
          />

          <ExportCsvModal
            visible={isExportModalVisible}
            onDismiss={() => setIsExportModalVisible(false)}
            selectedDate={selectedDate}
            themeObject={themeObject}
          />

          <EmailModal
            visible={isEmailModalVisible}
            onDismiss={() => setIsEmailModalVisible(false)}
            selectedDate={selectedDate}
            themeObject={themeObject}
          />
        </NotificationProvider>
      </Portal>
    </View>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    headerContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 12,
      borderBottomWidth: 1,
      borderColor: theme.colors.border,
    },
    viewSelectorContainer: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginLeft: 8,
      gap: 8,
    },
    navigationContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    dateButton: {
      flexDirection: "column",
      alignItems: "center",
      paddingVertical: 4,
      minHeight: 48,
      justifyContent: "center",
      borderColor: theme.colors.text,
    },
    dateText: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: "500",
      lineHeight: 18,
    },
    weekText: {
      color: theme.colors.textSecondary,
      fontSize: 12,
    },
    menuButton: {
      borderRadius: 8,
      borderWidth: 1.5,
    },
    menuContent: {
      top: 40,
      borderRadius: 12,
      paddingVertical: 4,
      elevation: 6,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    menuItem: {
      minWidth: 200,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    menuItemTitle: {
      color: theme.colors.text,
      fontSize: 15,
      fontWeight: "500",
      marginLeft: 8,
      includeFontPadding: false,
    },
    iconStyle: {
      marginRight: 0,
      marginLeft: -5,
    },
  });

export default ShiftHeader;
