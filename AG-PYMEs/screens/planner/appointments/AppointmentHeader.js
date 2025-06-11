import React, { useState } from "react";
import { View, Text, StyleSheet, Platform, Dimensions } from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import CustomButton from "../../../components/customButton";
import PopupMenu, { MenuItem } from "../../../components/popupMenu";

// Formato de fecha para mostrar
const formatDate = (date) => {
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return new Date(date).toLocaleDateString("es-ES", options);
};

// Formato corto para el botón de fecha
const formatShortDate = (date) => {
  const options = { day: "2-digit", month: "2-digit", year: "2-digit" };
  return new Date(date).toLocaleDateString("es-ES", options);
};

const AppointmentHeader = ({
  selectedDate,
  onDateChange,
  selectedView,
  onViewChange,
  onShowDatePicker,
  onCreateAppointment,
}) => {
  const { themeObject } = useTheme();
  const [showViewMenu, setShowViewMenu] = useState(false);
  const { width } = Dimensions.get("window");
  const isMobile = Platform.OS !== "web" || width < 768;

  // Función para obtener la fecha anterior según la vista
  const getPreviousDate = () => {
    const date = new Date(selectedDate);

    if (selectedView === "día") {
      date.setDate(date.getDate() - 1);
    } else if (selectedView === "semana") {
      date.setDate(date.getDate() - 7);
    } else if (selectedView === "mes") {
      date.setMonth(date.getMonth() - 1);
    }

    onDateChange(date);
  };

  // Función para obtener la fecha siguiente según la vista
  const getNextDate = () => {
    const date = new Date(selectedDate);

    if (selectedView === "día") {
      date.setDate(date.getDate() + 1);
    } else if (selectedView === "semana") {
      date.setDate(date.getDate() + 7);
    } else if (selectedView === "mes") {
      date.setMonth(date.getMonth() + 1);
    }

    onDateChange(date);
  };

  // Función para ir a hoy
  const goToToday = () => {
    onDateChange(new Date());
  };
  // Función para manejar el cambio de vista desde el popup
  const handleViewChange = (view) => {
    onViewChange(view);
    setShowViewMenu(false);
  };

  // Función para obtener el label de la vista actual
  const getViewLabel = () => {
    switch (selectedView) {
      case "día":
        return "Día";
      case "semana":
        return "Semana";
      case "mes":
        return "Mes";
      default:
        return "Vista";
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: themeObject.colors.surface },
      ]}
    >
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: themeObject.colors.text }]}>
          Agenda de Citas
        </Text>
        <CustomButton
          ionIconLeft="add-circle-outline"
          variant="info"
          onPress={onCreateAppointment}
          style={styles.addButton}
          size="sm"
          compact={true}
        >
          Nueva Cita
        </CustomButton>
      </View>

      <View style={styles.actionsContainer}>
        <View style={styles.dateNavContainer}>
          <CustomButton
            ionIconLeft="chevron-back-outline"
            variant="secondary"
            compact={true}
            size="sm"
            onPress={getPreviousDate}
            style={styles.navButton}
          />

          <CustomButton
            onPress={onShowDatePicker}
            variant="secondary"
            compact={true}
            style={styles.dateButton}
            ionIconLeft="calendar-outline"
          >
            {formatShortDate(selectedDate)}
          </CustomButton>

          <CustomButton
            ionIconLeft="chevron-forward-outline"
            variant="secondary"
            compact={true}
            size="sm"
            onPress={getNextDate}
            style={styles.navButton}
          />

          <CustomButton
            onPress={goToToday}
            variant="primary"
            compact={true}
            size="sm"
            style={styles.todayButton}
          >
            Hoy
          </CustomButton>

          {isMobile ? (
            <PopupMenu
              visible={showViewMenu}
              onDismiss={() => setShowViewMenu(false)}
              anchor={
                <CustomButton
                  onPress={() => setShowViewMenu(true)}
                  variant="secondary"
                  compact={true}
                  size="sm"
                  ionIconLeft="apps-outline"
                  style={styles.viewMenuButton}
                >
                  {getViewLabel()}
                </CustomButton>
              }
            >
              <MenuItem
                title="Día"
                leadingIcon={selectedView === "día" ? "checkmark" : undefined}
                onPress={() => handleViewChange("día")}
              />
              <MenuItem
                title="Semana"
                leadingIcon={
                  selectedView === "semana" ? "checkmark" : undefined
                }
                onPress={() => handleViewChange("semana")}
              />
              <MenuItem
                title="Mes"
                leadingIcon={selectedView === "mes" ? "checkmark" : undefined}
                onPress={() => handleViewChange("mes")}
              />
            </PopupMenu>
          ) : (
            <View style={styles.viewSelectorContainer}>
              <CustomButton
                onPress={() => onViewChange("día")}
                variant={selectedView === "día" ? "primary" : "secondary"}
                compact={true}
                size="sm"
                style={styles.viewButton}
              >
                Día
              </CustomButton>

              <CustomButton
                onPress={() => onViewChange("semana")}
                variant={selectedView === "semana" ? "primary" : "secondary"}
                compact={true}
                size="sm"
                style={styles.viewButton}
              >
                Semana
              </CustomButton>

              <CustomButton
                onPress={() => onViewChange("mes")}
                variant={selectedView === "mes" ? "primary" : "secondary"}
                compact={true}
                size="sm"
                style={styles.viewButton}
              >
                Mes
              </CustomButton>
            </View>
          )}
        </View>
      </View>

      {!isMobile && (
        <View style={styles.currentDateContainer}>
          <Text
            style={[styles.currentDate, { color: themeObject.colors.text }]}
          >
            {formatDate(selectedDate)}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 16 : 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    flex: 1,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: Platform.OS === "web" ? 12 : 0,
  },
  dateNavContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    flexWrap: "wrap",
  },
  navButton: {
    marginHorizontal: 2,
  },
  dateButton: {
    marginHorizontal: 4,
  },
  todayButton: {
    marginLeft: 8,
  },
  viewMenuButton: {
    marginLeft: 8,
  },
  viewSelectorContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewButton: {
    marginHorizontal: 2,
  },
  currentDateContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  currentDate: {
    fontSize: 16,
    fontWeight: "500",
  },
  addButton: {
    marginLeft: 8,
  },
});

export default AppointmentHeader;
