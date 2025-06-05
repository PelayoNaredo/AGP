import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import CustomButton from "../../../components/customButton";

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
        </View>

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
      </View>

      <View style={styles.currentDateContainer}>
        <Text style={[styles.currentDate, { color: themeObject.colors.text }]}>
          {formatDate(selectedDate)}
        </Text>
        <CustomButton
          ionIconLeft="add-outline"
          variant="accent"
          onPress={onCreateAppointment}
          style={styles.addButton}
        >
          Nueva Cita
        </CustomButton>
      </View>
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
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  dateNavContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: Platform.OS === "web" ? 0 : 8,
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
  viewSelectorContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewButton: {
    marginHorizontal: 2,
  },
  currentDateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
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
