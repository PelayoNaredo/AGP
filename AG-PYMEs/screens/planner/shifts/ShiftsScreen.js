import React, { useRef, useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { DatePickerModal } from "react-native-paper-dates";
import { useTheme } from "../../../context/ThemeContext";
import useSettings from "../../../hooks/useSettings";
import ShiftManagerContainer from "./ShiftManagerContainer";
import ShiftHeader from "./header/shiftHeader";
import TableHeader from "./table/tableHeader";
import TableBody from "./table/tableBody";
import ShiftModal from "./table/shiftModal";

// Componente principal de la pantalla de turnos
const ShiftsScreen = () => {
  const { themeObject } = useTheme();
  const { settings, isLoading: settingsLoading } = useSettings();
  const scrollViewRef = useRef(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [businessHours, setBusinessHours] = useState({
    opening: "09:00",
    closing: "18:00",
  });

  // Cargar los horarios de apertura y cierre desde la configuración
  useEffect(() => {
    if (settings && !settingsLoading) {
      // Convertir formato "HH:MM:SS" a "HH:MM"
      const formatTime = (timeStr) => {
        if (!timeStr) return null;
        return timeStr.substring(0, 5); // Tomar solo las primeras 5 caracteres (HH:MM)
      };

      setBusinessHours({
        opening: formatTime(settings.horario_apertura) || "09:00",
        closing: formatTime(settings.horario_cierre) || "18:00",
      });
    }
  }, [settings, settingsLoading]);

  const calculateContainerMinWidth = (businessHours, currentView) => {
    const windowWidth = Dimensions.get("window").width;

    if (currentView === "semana") {
      return Math.max(windowWidth, 180 + 100 * 7);
    }

    const [openingHour, openingMinute = 0] = businessHours.opening
      .split(":")
      .map(Number);
    const [closingHour, closingMinute = 0] = businessHours.closing
      .split(":")
      .map(Number);

    // Convertir todo a minutos
    const startMinutes = openingHour * 60 + openingMinute;
    const endMinutes = closingHour * 60 + closingMinute;
    const totalMinutes = endMinutes - startMinutes;

    // Calcular el número de slots de 30 minutos
    const totalSlots = Math.ceil(totalMinutes / 30);

    const columnWidth = 70;
    const baseWidth = 180;
    return Math.max((baseWidth + totalSlots * columnWidth) * 2, windowWidth);
  };

  useEffect(() => {
    if (Platform.OS === "web") {
      const handleWheel = (e) => {
        if (scrollViewRef.current) {
          const scrollElement = scrollViewRef.current;

          if (scrollElement.scrollWidth > scrollElement.clientWidth) {
            if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
              e.preventDefault();
              scrollElement.scrollLeft += e.deltaY;
            }
          }
        }
      };

      document.addEventListener("wheel", handleWheel, { passive: false });
      return () => document.removeEventListener("wheel", handleWheel);
    }
  }, [businessHours]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ShiftManagerContainer>
          {({
            selectedDate,
            employees,
            shifts,
            handleDateChange,
            handleSaveShift,
            selectedView,
            handleViewChange,
            handleDeleteShift,
          }) => (
            <View style={styles.container}>
              <ShiftHeader
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
                selectedView={selectedView}
                onViewChange={handleViewChange}
                onShowDatePicker={() => setDatePickerVisible(true)}
              />

              <DatePickerModal
                locale="es"
                mode="single"
                startWeekOnMonday
                visible={datePickerVisible}
                onDismiss={() => setDatePickerVisible(false)}
                date={selectedDate}
                onConfirm={({ date }) => {
                  handleDateChange(date);
                  setDatePickerVisible(false);
                }}
                label="Seleccionar semana"
                validRange={{
                  startDate: new Date(2000, 0, 1),
                  endDate: new Date(2100, 0, 1),
                }}
              />

              <ScrollView
                ref={scrollViewRef}
                horizontal
                style={{ flex: 1 }}
                contentContainerStyle={{
                  width: calculateContainerMinWidth(
                    businessHours,
                    selectedView
                  ),
                }}
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled
              >
                <View
                  style={[
                    styles.gridContainer,
                    {
                      width: calculateContainerMinWidth(
                        businessHours,
                        selectedView
                      ),
                    },
                  ]}
                >
                  <TableHeader
                    selectedView={selectedView}
                    selectedDate={selectedDate}
                    businessHours={businessHours}
                  />
                  <TableBody
                    selectedView={selectedView}
                    employees={employees}
                    shifts={shifts}
                    selectedDate={selectedDate}
                    businessHours={businessHours}
                    onEditShift={(empleado, dia) => {
                      setEditingShift({
                        empleado,
                        dia,
                        intervalos:
                          shifts[empleado.id_empleado]?.[dia]?.intervalos || [],
                      });
                    }}
                  />
                </View>
              </ScrollView>

              <ShiftModal
                visible={!!editingShift}
                onClose={() => setEditingShift(null)}
                onSubmit={(shiftData) => {
                  handleSaveShift(shiftData.id_empleado, shiftData.dia_semana, {
                    intervalos: shiftData.intervalos,
                  });
                  setEditingShift(null);
                }}
                onDelete={(shiftData) => {
                  handleDeleteShift(shiftData);
                  setEditingShift(null);
                }}
                shift={
                  editingShift
                    ? {
                        id_empleado: editingShift.empleado.id_empleado,
                        dia_semana: editingShift.dia,
                        intervalos: editingShift.intervalos,
                      }
                    : null
                }
                employees={employees}
                loading={false}
                preselectedEmployee={editingShift?.empleado}
                preselectedDay={editingShift?.dia}
              />
            </View>
          )}
        </ShiftManagerContainer>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    flex: 1,
  },
  gridContainer: {
    width: "100%",
    flexDirection: "column",
  },
});

export default ShiftsScreen;
