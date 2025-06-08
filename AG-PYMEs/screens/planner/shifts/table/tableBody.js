import React from "react";
import {
  View,
  ScrollView,
  Pressable,
  Text,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useTheme } from "../../../../context/ThemeContext";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { formatTime } from "../../../../utils/helpers";

// Componente TableBody para mostrar los turnos de los empleados con diferentes vistas
const TableBody = ({
  selectedView,
  employees,
  shifts,
  businessHours,
  onEditShift,
  selectedDate,
}) => {
  const { themeObject } = useTheme();
  const styles = createStyles(themeObject);

  const screenWidth = Dimensions.get("window").width;
  const employeeColumnWidth = 180;
  const dayCellWidth =
    selectedView === "semana" ? (screenWidth - employeeColumnWidth) / 7 : 100;

  const openingHour = businessHours?.opening || "08:00";
  const closingHour = businessHours?.closing || "18:00";

  // Calcular el número total de slots de 30 minutos
  const [startH, startM] = openingHour.split(":").map(Number);
  const [endH, endM] = closingHour.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  const totalSlots = Math.ceil((endMinutes - startMinutes) / 30);
  const businessWidth = totalSlots * 60; // 60px por cada slot de 30 minutos

  // Función para calcular horas semanales
  const calculateWeeklyHours = (empleadoId) => {
    let totalMinutes = 0;
    for (let day = 1; day <= 7; day++) {
      const intervalos = shifts[empleadoId]?.[day]?.intervalos || [];
      intervalos.forEach((intervalo) => {
        if (intervalo.hora_inicio && intervalo.hora_fin) {
          const [hEnt, mEnt] = intervalo.hora_inicio.split(":").map(Number);
          const [hSal, mSal] = intervalo.hora_fin.split(":").map(Number);
          totalMinutes += hSal * 60 + mSal - (hEnt * 60 + mEnt);
        }
      });
    }
    return {
      formattedHours: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
      totalMinutes: totalMinutes,
    };
  };

  // Función para verificar si las horas exceden el contrato
  const checkExceedsContractedHours = (employee, totalMinutes) => {
    const contractedMinutes = (employee.horas_contratadas || 40) * 60;
    return totalMinutes > contractedMinutes;
  };

  // Función para calcular posición y ancho de la barra de horario
  const calculateBarPositionAndWidth = (entrada, salida) => {
    const [baseOpeningHour, baseOpeningMinute = 0] = businessHours.opening
      .split(":")
      .map(Number);
    const [baseClosingHour, baseClosingMinute = 0] = businessHours.closing
      .split(":")
      .map(Number);

    const businessStartMinutes = baseOpeningHour * 60 + baseOpeningMinute;
    const businessEndMinutes = baseClosingHour * 60 + baseClosingMinute;
    const totalBusinessMinutes = businessEndMinutes - businessStartMinutes;

    const [startHour, startMinute = 0] = entrada.split(":").map(Number);
    const [endHour, endMinute = 0] = salida.split(":").map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    const effectiveStartMinutes = Math.max(startMinutes, businessStartMinutes);
    const effectiveEndMinutes = Math.min(endMinutes, businessEndMinutes);

    const startSlots = Math.floor(
      (effectiveStartMinutes - businessStartMinutes) / 30
    );
    const durationSlots = Math.ceil(
      (effectiveEndMinutes - effectiveStartMinutes) / 30
    );

    const position = ((startSlots * 60) / businessWidth) * 100;
    const barWidth = ((durationSlots * 60) / businessWidth) * 100;

    return {
      position: Math.max(0, position),
      barWidth: Math.max(0, Math.min(100, barWidth)),
    };
  };

  // Celda de horario para vista día
  const renderScheduleCell = (empleado, dia) => (
    <Pressable
      style={[styles.scheduleCell, { width: 180 }]}
      onPress={() => onEditShift(empleado, dia)}
    >
      <MaterialIcons
        name="schedule"
        size={24}
        color={themeObject.colors.primary}
      />
      <View style={styles.scheduleIntervals}>
        {" "}
        {shifts[empleado.id_empleado]?.[dia]?.intervalos.map(
          (intervalo, index) => (
            <Text
              key={`schedule-${empleado.id_empleado}-${dia}-${intervalo.hora_inicio}-${intervalo.hora_fin}-${index}`}
              style={styles.scheduleText}
            >
              {formatTime(intervalo.hora_inicio)} -{" "}
              {formatTime(intervalo.hora_fin)}
            </Text>
          )
        )}
        {!shifts[empleado.id_empleado]?.[dia]?.intervalos?.length && (
          <Text style={styles.scheduleText}>Agregar horario</Text>
        )}
      </View>
    </Pressable>
  );

  // Función para generar slots de tiempo
  const generateTimeSlots = () => {
    const [startH, startM] = businessHours.opening.split(":").map(Number);
    const [endH, endM] = businessHours.closing.split(":").map(Number);

    const slots = [];
    let current = new Date();
    current.setHours(startH, startM, 0, 0);

    const endTime = new Date();
    endTime.setHours(endH, endM, 0, 0);
    // Añadimos 1 minuto al endTime para asegurarnos de incluir la hora de cierre
    endTime.setMinutes(endTime.getMinutes() + 1);

    while (current < endTime) {
      slots.push(new Date(current));
      current.setMinutes(current.getMinutes() + 30);
    }

    return slots;
  };

  // Función para renderizar la barra de timeline
  const renderTimelineBar = (empleadoId) => {
    const diaActual = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay();
    const intervalos = shifts[empleadoId]?.[diaActual]?.intervalos || [];

    return intervalos.map((intervalo, index) => {
      if (!intervalo.hora_inicio || !intervalo.hora_fin) return null;

      const { position, barWidth } = calculateBarPositionAndWidth(
        intervalo.hora_inicio,
        intervalo.hora_fin
      );

      return (
        <View
          key={index}
          style={[
            styles.timelineBar,
            {
              left: `${position}%`,
              width: `${barWidth}%`,
              backgroundColor:
                index % 2 === 0
                  ? themeObject.colors.primary
                  : themeObject.colors.secondary,
              opacity: 0.8,
            },
          ]}
        />
      );
    });
  };

  if (selectedView === "semana") {
    return employees.map((empleado) => (
      <View key={empleado.id_empleado} style={styles.row}>
        <View style={styles.employeeInfo}>
          <Text style={styles.employeeName}>{empleado.nombre}</Text>
          {(() => {
            const hoursData = calculateWeeklyHours(empleado.id_empleado);
            const exceedsHours = checkExceedsContractedHours(
              empleado,
              hoursData.totalMinutes
            );
            return (
              <Text
                style={
                  exceedsHours ? styles.hoursTotalExceeded : styles.hoursTotal
                }
              >
                {hoursData.formattedHours}
              </Text>
            );
          })()}
          {!empleado.activo && (
            <Text style={styles.inactiveLabel}>Inactivo</Text>
          )}
        </View>
        {Array.from({ length: 7 }).map((_, dia) => {
          const diaIndex = dia + 1;
          const intervalos =
            shifts[empleado.id_empleado]?.[diaIndex]?.intervalos || [];

          return (
            <Pressable
              key={dia}
              style={[styles.shiftCell, { width: dayCellWidth }]}
              onPress={() => onEditShift(empleado, diaIndex)}
              disabled={!empleado.activo}
            >
              {" "}
              <View style={styles.intervalsContainer}>
                {intervalos.map((intervalo, idx) => (
                  <View
                    key={`${empleado.id_empleado}-${dia}-interval-${intervalo.hora_inicio}-${intervalo.hora_fin}-${idx}`}
                    style={styles.intervalRow}
                  >
                    <Text style={styles.shiftTime}>
                      {formatTime(intervalo.hora_inicio)}
                    </Text>
                    <Text style={styles.shiftTime}>
                      {formatTime(intervalo.hora_fin)}
                    </Text>
                  </View>
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>
    ));
  }

  // Vista día
  return employees.map((empleado) => {
    const timeSlots = generateTimeSlots();
    const diaActual = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay();

    return (
      <View key={empleado.id_empleado} style={styles.dayViewRow}>
        <View style={styles.employeeInfo}>
          <Text style={styles.employeeName}>{empleado.nombre}</Text>
          {(() => {
            const hoursData = calculateWeeklyHours(empleado.id_empleado);
            const exceedsHours = checkExceedsContractedHours(
              empleado,
              hoursData.totalMinutes
            );
            return (
              <Text
                style={
                  exceedsHours ? styles.hoursTotalExceeded : styles.hoursTotal
                }
              >
                {hoursData.formattedHours}
              </Text>
            );
          })()}
          {!empleado.activo && (
            <Text style={styles.inactiveLabel}>Inactivo</Text>
          )}
        </View>
        {renderScheduleCell(empleado, diaActual)}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEnabled={true}
          overScrollMode="always"
          keyboardShouldPersistTaps="handled"
        >
          {" "}
          <View style={[styles.timelineContainer, { width: businessWidth }]}>
            {renderTimelineBar(empleado.id_empleado)}
            {timeSlots.map((slot, index) => (
              <View
                key={`timeslot-${empleado.id_empleado}-${slot}-${index}`}
                style={styles.timeSlot}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    );
  });
};

const createStyles = (theme) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderColor: theme.colors.border,
    },
    dayViewRow: {
      flex: 1,
      flexDirection: "row",
      borderBottomWidth: 1,
      borderColor: theme.colors.border,
      maxHeight: 90,
    },
    employeeInfo: {
      width: 180,
      padding: 8,
      alignItems: "center",
      justifyContent: "center",
      borderRightWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    employeeName: {
      color: theme.colors.text,
      fontWeight: "500",
      fontSize: 14,
    },
    inactiveLabel: {
      color: theme.colors.text,
      backgroundColor: theme.colors.warning,
      borderRadius: 12,
      fontSize: 10,
      marginTop: 6,
      paddingVertical: 2,
      paddingHorizontal: 8,
    },
    shiftCell: {
      height: 90,
      minWidth: 100,
      alignItems: "center",
      justifyContent: "center",

      padding: 8,
      borderRightWidth: 1,
      borderColor: theme.colors.border,
    },
    intervalsContainer: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      height: 80,
    },
    intervalRow: {
      marginBottom: 4,
      padding: 2,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 4,
    },
    shiftTime: {
      color: theme.colors.text,
      fontSize: 12,
      fontWeight: "500",
      textAlign: "center",
    },
    hoursTotal: {
      color: theme.colors.buttonWhite,
      backgroundColor: theme.colors.info,
      borderRadius: 12,
      fontSize: 12,
      marginTop: 4,
      paddingVertical: 2,
      paddingHorizontal: 8,
      alignSelf: "center",
    },
    hoursTotalExceeded: {
      color: theme.colors.buttonWhite,
      backgroundColor: theme.colors.error,
      borderRadius: 12,
      fontSize: 12,
      marginTop: 4,
      paddingVertical: 2,
      paddingHorizontal: 8,
      alignSelf: "center",
    },
    scheduleCell: {
      borderRightWidth: 1,
      borderColor: theme.colors.border,
      alignSelf: "center",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 16,
      flexDirection: "row",
      gap: 8,
    },
    scheduleIntervals: {
      flex: 1,
    },
    scheduleText: {
      color: theme.colors.text,
      fontSize: 14,
      marginBottom: 2,
    },
    timelineContainer: {
      height: "100%",
      position: "relative",
      flexDirection: "row",
    },
    timeSlot: {
      width: 60,
      height: "100%",
      borderRightWidth: 1,
      borderColor: theme.colors.border,
      opacity: 0.5,
    },
    timelineBar: {
      position: "absolute",
      height: "80%",
      top: "10%",
      borderRadius: 4,
    },
  });

export default TableBody;
