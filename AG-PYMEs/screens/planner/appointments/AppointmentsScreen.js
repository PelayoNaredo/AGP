import React, { useState, useRef } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { DatePickerModal } from "react-native-paper-dates";
import { useTheme } from "../../../context/ThemeContext";
import useSettings from "../../../hooks/useSettings";
import { NotificationProvider } from "../../../context/NotificationContext";
import AppointmentManagerContainer from "./AppointmentManagerContainer";
import AppointmentHeader from "./AppointmentHeader";
import AppointmentCalendar from "./AppointmentCalendar";
import AppointmentList from "./AppointmentList";
import AppointmentModal from "./AppointmentModal";

// Componente principal de la pantalla de citas
const AppointmentsScreen = () => {
  const { themeObject } = useTheme();
  const { settings, isLoading: settingsLoading } = useSettings();
  const scrollViewRef = useRef(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [creatingAppointment, setCreatingAppointment] = useState(false);
  const [businessHours, setBusinessHours] = useState({
    opening: "09:00",
    closing: "18:00",
  });

  // Cargar los horarios de apertura y cierre desde la configuración
  React.useEffect(() => {
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
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <NotificationProvider>
          <AppointmentManagerContainer>
            {({
              selectedDate,
              appointments,
              employees,
              services,
              clients,
              loading,
              selectedView,
              handleDateChange,
              handleViewChange,
              handleCreateAppointment,
              handleUpdateAppointment,
              handleUpdateAppointmentStatus,
              handleDeleteAppointment,
              checkEmployeeAvailability,
            }) => (
              <View style={styles.container}>
                <AppointmentHeader
                  selectedDate={selectedDate}
                  onDateChange={handleDateChange}
                  selectedView={selectedView}
                  onViewChange={handleViewChange}
                  onShowDatePicker={() => setDatePickerVisible(true)}
                  onCreateAppointment={() => setCreatingAppointment(true)}
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
                  label="Seleccionar fecha"
                  validRange={{
                    startDate: new Date(2000, 0, 1),
                    endDate: new Date(2100, 0, 1),
                  }}
                />
                {selectedView === "día" || selectedView === "semana" ? (
                  <AppointmentCalendar
                    selectedDate={selectedDate}
                    selectedView={selectedView}
                    appointments={appointments}
                    employees={employees}
                    businessHours={businessHours}
                    onEditAppointment={(appointment) =>
                      setEditingAppointment(appointment)
                    }
                    loading={loading}
                  />
                ) : (
                  <ScrollView style={styles.scrollView}>
                    <AppointmentList
                      appointments={appointments}
                      selectedDate={selectedDate}
                      selectedView={selectedView}
                      onEditAppointment={(appointment) =>
                        setEditingAppointment(appointment)
                      }
                      loading={loading}
                    />
                  </ScrollView>
                )}
                <AppointmentModal
                  visible={!!editingAppointment || creatingAppointment}
                  appointment={editingAppointment}
                  isNew={!editingAppointment}
                  onClose={() => {
                    setEditingAppointment(null);
                    setCreatingAppointment(false);
                  }}
                  onSave={async (appointmentData) => {
                    try {
                      if (editingAppointment) {
                        await handleUpdateAppointment(
                          editingAppointment.id_cita,
                          appointmentData
                        );
                      } else {
                        await handleCreateAppointment(appointmentData);
                      }
                      setEditingAppointment(null);
                      setCreatingAppointment(false);
                    } catch (error) {
                      console.error("Error en la gestión de citas:", error);
                      // Aquí podrías mostrar un mensaje de error
                    }
                  }}
                  onDelete={async () => {
                    if (editingAppointment) {
                      try {
                        await handleDeleteAppointment(
                          editingAppointment.id_cita
                        );
                        setEditingAppointment(null);
                      } catch (error) {
                        console.error("Error al eliminar cita:", error);
                      }
                    }
                  }}
                  onStatusChange={async (id, status) => {
                    try {
                      await handleUpdateAppointmentStatus(id, status);
                      // Actualizar la cita en el estado local si es necesario
                      if (
                        editingAppointment &&
                        editingAppointment.id_cita === id
                      ) {
                        setEditingAppointment((prev) => ({
                          ...prev,
                          estado: status,
                        }));
                      }
                    } catch (error) {
                      console.error("Error al cambiar estado de cita:", error);
                    }
                  }}
                  employees={employees}
                  services={services}
                  clients={clients}
                  businessHours={businessHours}
                  checkEmployeeAvailability={checkEmployeeAvailability}
                />
              </View>
            )}
          </AppointmentManagerContainer>
        </NotificationProvider>
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
  scrollView: {
    flex: 1,
  },
});

export default AppointmentsScreen;
