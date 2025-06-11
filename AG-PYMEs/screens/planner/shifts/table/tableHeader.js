import React from "react";
import { View, ScrollView, Text, StyleSheet } from "react-native";
import { useTheme } from "../../../../context/ThemeContext";

const diasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// Componente TableHeader para mostrar los encabezados de la tabla de turnos
const TableHeader = ({ selectedView, selectedDate, businessHours }) => {
  const { themeObject } = useTheme();

  const styles = createStyles(themeObject);

  // Función para obtener la fecha de cada día en la semana
  const getDayDate = (dayIndex) => {
    const date = new Date(selectedDate);
    const day = date.getDay() || 7; // Ajuste para que lunes sea 1
    date.setDate(date.getDate() - (day - 1) + dayIndex);
    return date.getDate();
  };

  // Generar intervalos de tiempo para la vista día
  const generateTimeSlots = () => {
    if (!businessHours) {
      return (
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Cargando horarios...</Text>
        </View>
      );
    }

    // 1. Usar la fecha seleccionada como base
    const baseDate = new Date(selectedDate);
    baseDate.setHours(0, 0, 0, 0); // Normalizar fecha

    // 2. Configurar horas correctamente
    const [openingH, openingM] = businessHours.opening.split(":").map(Number);
    const [closingH, closingM] = businessHours.closing.split(":").map(Number);

    const startTime = new Date(baseDate);
    startTime.setHours(openingH, openingM);

    const endTime = new Date(baseDate);
    endTime.setHours(closingH, closingM);

    // 3. Ajustar para horarios nocturnos
    if (endTime <= startTime) {
      endTime.setDate(endTime.getDate() + 1);
    }

    // 4. Generar slots cada 30 minutos
    const slots = [];
    const current = new Date(startTime);

    while (current <= endTime) {
      // <= para incluir el último slot
      slots.push(new Date(current));
      current.setMinutes(current.getMinutes() + 30); // Sumar 30 minutos exactos
    }

    return slots;
  };

  return (
    <View style={styles.headerContainer}>
      {selectedView === "semana" ? (
        <View style={styles.gridHeader}>
          <View style={[styles.headerCell, styles.employeeHeader]}>
            <Text style={styles.headerText}>Empleado</Text>
          </View>
          {diasSemana.map((dia, index) => (
            <View key={dia} style={[styles.headerCell, styles.dayHeader]}>
              <Text style={styles.headerText}>{dia}</Text>
              <Text style={styles.dayNumber}>{getDayDate(index)}</Text>
            </View>
          ))}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEnabled={true}
          overScrollMode="always"
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.gridHeader}>
            <View style={[styles.headerCell, styles.employeeHeader]}>
              <Text style={styles.headerText}>Empleado</Text>
            </View>
            <View style={[styles.headerCell, styles.timeInputHeader]}>
              <Text style={styles.headerText}>Horario</Text>
            </View>
            {generateTimeSlots().map((time, index) => (
              <View
                key={`timeslot-header-${time.getTime()}-${index}`}
                style={[styles.headerCell, styles.timeSlotHeader]}
              >
                <Text style={styles.timeSlotText}>
                  {time.toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    headerContainer: {
      borderBottomWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      width: "100%",
    },
    gridHeader: {
      flexDirection: "row",
      height: 60,
      width: "100%",
    },
    headerCell: {
      justifyContent: "center",
      alignItems: "center",
      borderRightWidth: 1,
      borderColor: theme.colors.border,
      padding: 8,
    },
    employeeHeader: {
      width: 180,
    },
    dayHeader: {
      flex: 1,
    },
    timeInputHeader: {
      width: 180,
    },
    timeSlotHeader: {
      width: 60,
      height: "100%",
    },
    headerText: {
      color: theme.colors.text,
      fontWeight: "bold",
      fontSize: 14,
    },
    dayNumber: {
      color: theme.colors.text,
      fontSize: 12,
      marginTop: 4,
    },
    timeSlotText: {
      color: theme.colors.text,
      fontSize: 10,
      width: 60,
      textAlign: "center",
    },
  });

export default TableHeader;
