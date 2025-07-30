import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
} from "react-native";
import { TextInput, Chip, ActivityIndicator } from "react-native-paper";
import { DatePickerModal, TimePickerModal } from "react-native-paper-dates";
import { Picker } from "@react-native-picker/picker";
import ModalTemplate from "../../../components/modalTemplate";
import CustomButton from "../../../components/customButton";
import { useTheme } from "../../../context/ThemeContext";
import useNotifications from "../../../hooks/useNotifications";

const AppointmentModal = ({
  visible,
  appointment,
  isNew,
  onClose,
  onSave,
  onDelete,
  onStatusChange,
  employees,
  services,
  clients,
  businessHours,
  checkEmployeeAvailability,
}) => {
  const { themeObject } = useTheme();
  const { showConfirmDialog, showSuccess, showError } = useNotifications();
  const [formData, setFormData] = useState({
    id_cliente: "",
    id_empleado: "",
    id_servicio: "",
    fecha_inicio: new Date(),
    fecha_fin: new Date(new Date().getTime() + 30 * 60000), // 30 minutos después por defecto
    estado: "pendiente",
    notas: "",
  });
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    // Inicializar el formulario si hay una cita seleccionada
    if (appointment) {
      setFormData({
        id_cliente: appointment.id_cliente || "",
        id_empleado: appointment.id_empleado || "",
        id_servicio: appointment.id_servicio || "",
        fecha_inicio: new Date(appointment.fecha_inicio),
        fecha_fin: new Date(appointment.fecha_fin),
        estado: appointment.estado || "pendiente",
        notas: appointment.notas || "",
      });
      setAvailabilityChecked(true);
      setIsAvailable(true); // Si existe la cita, asumimos que ya se verificó la disponibilidad
    } else {
      // Inicializar para nueva cita
      const now = new Date();
      // Redondeamos la hora actual al próximo intervalo de 30 minutos
      const minutes = Math.ceil(now.getMinutes() / 30) * 30;
      now.setMinutes(minutes);
      now.setSeconds(0);
      now.setMilliseconds(0);

      setFormData({
        id_cliente: "",
        id_empleado: "",
        id_servicio: "",
        fecha_inicio: now,
        fecha_fin: new Date(now.getTime() + 30 * 60000),
        estado: "pendiente",
        notas: "",
      });
      setAvailabilityChecked(false);
      setIsAvailable(true);
    }
  }, [appointment, visible]);

  const handleChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Si cambia el empleado, la fecha de inicio o la fecha de fin, reiniciamos la verificación de disponibilidad
    if (
      name === "id_empleado" ||
      name === "fecha_inicio" ||
      name === "fecha_fin"
    ) {
      setAvailabilityChecked(false);
      setIsAvailable(true);
    }
  }; // Función para verificar la disponibilidad del profesional
  const checkAvailability = async () => {
    if (
      !formData.id_empleado ||
      !formData.fecha_inicio ||
      !formData.fecha_fin
    ) {
      setError("Por favor seleccione un profesional y las fechas de la cita.");
      return false;
    }

    // Validar que fecha_fin sea después de fecha_inicio
    if (formData.fecha_fin <= formData.fecha_inicio) {
      setError(
        "La hora de finalización debe ser posterior a la hora de inicio."
      );
      setIsAvailable(false);
      setAvailabilityChecked(true);
      return false;
    }

    try {
      setLoading(true);

      // Si es "Sin asignar / Cualquier profesional", siempre está disponible pero verificamos cuántas reservas hay
      if (formData.id_empleado === "sin_asignar") {
        // Verificamos cuántas reservas hay en ese horario para mostrar información
        let result;

        if (appointment) {
          // Si estamos editando, excluimos la cita actual
          result = await checkEmployeeAvailability(
            "contar_reservas",
            formData.fecha_inicio.toISOString(),
            formData.fecha_fin.toISOString(),
            appointment.id_cita
          );
        } else {
          // Si es nueva cita
          result = await checkEmployeeAvailability(
            "contar_reservas",
            formData.fecha_inicio.toISOString(),
            formData.fecha_fin.toISOString()
          );
        }

        const reservasExistentes = typeof result === "number" ? result : 0; // Para "Sin asignar" siempre permitimos crear la cita
        setIsAvailable(true);
        setAvailabilityChecked(true);

        // Mostrar información sobre reservas existentes
        if (reservasExistentes > 0) {
          setError(
            `Información: Hay ${reservasExistentes} cita(s) programada(s) en este horario. Puedes continuar con la reserva.`
          );
        } else {
          setError("Información: No hay citas programadas en este horario.");
        }

        return true;
      }

      // Para profesionales específicos
      let result;

      if (appointment) {
        // Si estamos editando, excluimos la cita actual de la verificación
        result = await checkEmployeeAvailability(
          formData.id_empleado,
          formData.fecha_inicio.toISOString(),
          formData.fecha_fin.toISOString(),
          appointment.id_cita
        );
      } else {
        // Si es nueva cita
        result = await checkEmployeeAvailability(
          formData.id_empleado,
          formData.fecha_inicio.toISOString(),
          formData.fecha_fin.toISOString()
        );
      }

      // Extraer valores de disponibilidad
      let isEmployeeAvailable;
      let reservasSimultaneas = 0;

      if (typeof result === "object") {
        isEmployeeAvailable = result.disponible;
        reservasSimultaneas = result.reservasExistentes || 0;
      } else {
        isEmployeeAvailable = Boolean(result);
      }

      setIsAvailable(isEmployeeAvailable);
      setAvailabilityChecked(true); // Siempre mostramos información sobre las citas existentes
      if (reservasSimultaneas > 0) {
        setError(
          `Información: El profesional tiene ${reservasSimultaneas} cita(s) programada(s) en este horario.`
        );
      } else {
        setError(
          `Información: No hay citas programadas para este profesional en este horario.`
        );
      }

      return isEmployeeAvailable;
    } catch (error) {
      console.error("Error al verificar disponibilidad:", error);
      const errorMsg =
        "Error al verificar la disponibilidad. Por favor inténtelo de nuevo.";
      setError(errorMsg);
      showError("Error de verificación", errorMsg);
      setIsAvailable(false);
      setAvailabilityChecked(true);
      return false;
    } finally {
      setLoading(false);
    }
  };
  const handleSave = async () => {
    // Validar campos obligatorios
    if (
      !formData.id_empleado ||
      !formData.fecha_inicio ||
      !formData.fecha_fin
    ) {
      const errorMsg =
        "Por favor complete los campos obligatorios: Profesional, Fecha y hora de inicio y Fecha y hora de fin.";
      setError(errorMsg);
      showError("Campos incompletos", errorMsg);
      return;
    }

    // Verificar que fecha_fin sea después de fecha_inicio
    if (formData.fecha_fin <= formData.fecha_inicio) {
      const errorMsg =
        "La hora de finalización debe ser posterior a la hora de inicio.";
      setError(errorMsg);
      showError("Error en horario", errorMsg);
      return;
    }

    try {
      setLoading(true); // Si no se ha verificado la disponibilidad, la verificamos ahora
      if (!availabilityChecked) {
        await checkAvailability();
      }

      // Siempre permitimos guardar porque ahora permitimos múltiples citas simultáneas

      // Si todo está bien, intentar guardar
      const citaGuardada = await onSave({
        ...formData,
        fecha_inicio: formData.fecha_inicio.toISOString(),
        fecha_fin: formData.fecha_fin.toISOString(),
      });

      // Mostrar mensaje de éxito según sea creación o actualización
      showSuccess(
        isNew ? "Cita creada correctamente" : "Cita actualizada correctamente"
      );

      // Limpiar formulario y cerrar modal
      setError("");
      onClose();
    } catch (err) {
      console.error("Error al guardar cita:", err);

      // Mejorar el mensaje de error según el tipo de error
      if (err.status === 409) {
        const errorMsg = `El profesional ya tiene una cita programada en ese horario. Por favor seleccione otro horario.`;
        setError(errorMsg);
        showError("Conflicto de horarios", errorMsg);
      } else {
        const errorMsg = `Error al ${isNew ? "crear" : "actualizar"} la cita: ${err.message || "Error desconocido"}`;
        setError(errorMsg);
        showError("Error", errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = () => {
    // Usar el diálogo de confirmación antes de eliminar
    showConfirmDialog(
      "Eliminar cita",
      "¿Está seguro de que desea eliminar esta cita? Esta acción no se puede deshacer.",
      async () => {
        try {
          setLoading(true);
          await onDelete();
          showSuccess("Cita eliminada correctamente");
          onClose();
        } catch (err) {
          const errorMsg = `Error al eliminar la cita: ${err.message || "Error desconocido"}`;
          setError(errorMsg);
          showError("Error", errorMsg);
        } finally {
          setLoading(false);
        }
      }
    );
  };
  const handleStatusChange = async (status) => {
    if (!appointment) return;

    // Obtener un mensaje descriptivo según el estado
    const getStatusMessage = (status) => {
      switch (status) {
        case "pendiente":
          return "pendiente";
        case "confirmada":
          return "confirmada";
        case "completada":
          return "completada";
        case "cancelada":
          return "cancelada";
        case "no_asistio":
          return "marcada como no asistió";
        default:
          return status;
      }
    };

    try {
      setLoading(true);
      await onStatusChange(appointment.id_cita, status);
      setFormData((prev) => ({ ...prev, estado: status }));

      // Mostrar notificación de éxito con mensaje específico según el estado
      showSuccess(`Cita ${getStatusMessage(status)} correctamente`);
    } catch (err) {
      const errorMsg = `Error al cambiar el estado: ${err.message || "Error desconocido"}`;
      setError(errorMsg);
      showError("Error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Formateo de fecha para mostrar
  const formatDate = (date) => {
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateTime = (date) => {
    return `${formatDate(date)} ${formatTime(date)}`;
  };

  // Determinar el color según el estado
  const getStatusColor = (status) => {
    const statusColors = {
      pendiente: themeObject.colors.warning,
      confirmada: themeObject.colors.primary,
      completada: themeObject.colors.success,
      cancelada: themeObject.colors.error,
      no_asistio: themeObject.colors.error,
    };
    return statusColors[status] || themeObject.colors.text;
  };

  return (
    <ModalTemplate
      isVisible={visible}
      title={isNew ? "Nueva Cita" : "Detalles de la Cita"}
      cancelLabel="Cancelar"
      confirmLabel={isNew ? "Crear Cita" : "Guardar Cambios"}
      cancelAction={onClose}
      confirmAction={handleSave}
      confirmDisabled={loading || (!isAvailable && availabilityChecked)}
      warning={error}
    >
      <ScrollView style={styles.container}>
        {/* Estado de la cita (solo para citas existentes) */}
        {!isNew && (
          <View style={styles.statusContainer}>
            <Text style={styles.sectionTitle}>Estado:</Text>
            <View style={styles.chipContainer}>
              <Chip
                selected={formData.estado === "pendiente"}
                onPress={() => handleStatusChange("pendiente")}
                style={[
                  styles.statusChip,
                  {
                    backgroundColor:
                      formData.estado === "pendiente"
                        ? themeObject.colors.warning
                        : themeObject.colors.surface,
                  },
                ]}
                textStyle={{
                  color:
                    formData.estado === "pendiente"
                      ? "#fff"
                      : themeObject.colors.text,
                }}
              >
                Pendiente
              </Chip>
              <Chip
                selected={formData.estado === "confirmada"}
                onPress={() => handleStatusChange("confirmada")}
                style={[
                  styles.statusChip,
                  {
                    backgroundColor:
                      formData.estado === "confirmada"
                        ? themeObject.colors.primary
                        : themeObject.colors.surface,
                  },
                ]}
                textStyle={{
                  color:
                    formData.estado === "confirmada"
                      ? "#fff"
                      : themeObject.colors.text,
                }}
              >
                Confirmada
              </Chip>
              <Chip
                selected={formData.estado === "completada"}
                onPress={() => handleStatusChange("completada")}
                style={[
                  styles.statusChip,
                  {
                    backgroundColor:
                      formData.estado === "completada"
                        ? themeObject.colors.success
                        : themeObject.colors.surface,
                  },
                ]}
                textStyle={{
                  color:
                    formData.estado === "completada"
                      ? "#fff"
                      : themeObject.colors.text,
                }}
              >
                Completada
              </Chip>
              <Chip
                selected={formData.estado === "cancelada"}
                onPress={() => handleStatusChange("cancelada")}
                style={[
                  styles.statusChip,
                  {
                    backgroundColor:
                      formData.estado === "cancelada"
                        ? themeObject.colors.error
                        : themeObject.colors.surface,
                  },
                ]}
                textStyle={{
                  color:
                    formData.estado === "cancelada"
                      ? "#fff"
                      : themeObject.colors.text,
                }}
              >
                Cancelada
              </Chip>
              <Chip
                selected={formData.estado === "no_asistio"}
                onPress={() => handleStatusChange("no_asistio")}
                style={[
                  styles.statusChip,
                  {
                    backgroundColor:
                      formData.estado === "no_asistio"
                        ? themeObject.colors.error
                        : themeObject.colors.surface,
                  },
                ]}
                textStyle={{
                  color:
                    formData.estado === "no_asistio"
                      ? "#fff"
                      : themeObject.colors.text,
                }}
              >
                No Asistió
              </Chip>
            </View>
          </View>
        )}
        {/* Selección de profesional */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: themeObject.colors.text }]}>
            Profesional: <Text style={styles.requiredStar}>*</Text>
          </Text>
          <View
            style={[
              styles.inputContainer,
              { borderColor: themeObject.colors.border },
            ]}
          >
            {loading ? (
              <ActivityIndicator
                size="small"
                color={themeObject.colors.primary}
              />
            ) : employees && employees.length > 0 ? (
              <Picker
                selectedValue={formData.id_empleado}
                onValueChange={(value) => handleChange("id_empleado", value)}
                style={[styles.picker, { color: themeObject.colors.text }]}
                dropdownIconColor={themeObject.colors.text}
              >
                <Picker.Item label="Seleccionar profesional..." value="" />
                <Picker.Item
                  label="Sin asignar / Cualquier profesional"
                  value="sin_asignar"
                />
                {employees.map((employee) => (
                  <Picker.Item
                    key={employee.id_empleado}
                    label={employee.nombre}
                    value={employee.id_empleado}
                  />
                ))}
              </Picker>
            ) : (
              <Text style={{ padding: 10, color: themeObject.colors.error }}>
                No se pudieron cargar los profesionales. Por favor, cierre el
                modal e inténtelo de nuevo.
              </Text>
            )}
          </View>
        </View>
        {/* Selección de cliente */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: themeObject.colors.text }]}>
            Cliente:
          </Text>
          <View
            style={[
              styles.inputContainer,
              { borderColor: themeObject.colors.border },
            ]}
          >
            {loading ? (
              <ActivityIndicator
                size="small"
                color={themeObject.colors.primary}
              />
            ) : clients && clients.length > 0 ? (
              <Picker
                selectedValue={formData.id_cliente}
                onValueChange={(value) => handleChange("id_cliente", value)}
                style={[styles.picker, { color: themeObject.colors.text }]}
                dropdownIconColor={themeObject.colors.text}
              >
                <Picker.Item
                  label="Seleccionar cliente (opcional)..."
                  value=""
                />
                {clients.map((client) => (
                  <Picker.Item
                    key={client.id_cliente}
                    label={`${client.nombre} ${client.apellido || ""}`}
                    value={client.id_cliente}
                  />
                ))}
              </Picker>
            ) : (
              <Text style={{ padding: 10, color: themeObject.colors.text }}>
                No se encontraron clientes disponibles.
              </Text>
            )}
          </View>
        </View>
        {/* Selección de servicio */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: themeObject.colors.text }]}>
            Servicio:
          </Text>
          <View
            style={[
              styles.inputContainer,
              { borderColor: themeObject.colors.border },
            ]}
          >
            {loading ? (
              <ActivityIndicator
                size="small"
                color={themeObject.colors.primary}
              />
            ) : services && services.length > 0 ? (
              <Picker
                selectedValue={formData.id_servicio}
                onValueChange={(value) => handleChange("id_servicio", value)}
                style={[styles.picker, { color: themeObject.colors.text }]}
                dropdownIconColor={themeObject.colors.text}
              >
                <Picker.Item
                  label="Seleccionar servicio (opcional)..."
                  value=""
                />
                {services.map((service) => (
                  <Picker.Item
                    key={service.id_servicio}
                    label={service.nombre_servicio}
                    value={service.id_servicio}
                  />
                ))}
              </Picker>
            ) : (
              <Text style={{ padding: 10, color: themeObject.colors.text }}>
                No se encontraron servicios disponibles.
              </Text>
            )}
          </View>
        </View>
        {/* Fecha y hora de inicio */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: themeObject.colors.text }]}>
            Fecha y hora de inicio: <Text style={styles.requiredStar}>*</Text>
          </Text>
          <Pressable
            style={[
              styles.datePickerButton,
              { borderColor: themeObject.colors.border },
            ]}
            onPress={() => setShowStartDatePicker(true)}
          >
            <Text style={{ color: themeObject.colors.text }}>
              {formatDateTime(formData.fecha_inicio)}
            </Text>
          </Pressable>
          <DatePickerModal
            locale="es"
            mode="single"
            visible={showStartDatePicker}
            onDismiss={() => setShowStartDatePicker(false)}
            date={formData.fecha_inicio}
            onConfirm={({ date }) => {
              // Mantener la hora actual al cambiar la fecha
              const currentTime = formData.fecha_inicio;
              date.setHours(currentTime.getHours());
              date.setMinutes(currentTime.getMinutes());

              handleChange("fecha_inicio", date);
              setShowStartDatePicker(false);
              // Abrir selector de hora después de seleccionar fecha
              setShowStartTimePicker(true);
            }}
            label="Seleccionar fecha"
          />
          <TimePickerModal
            visible={showStartTimePicker}
            onDismiss={() => setShowStartTimePicker(false)}
            hours={formData.fecha_inicio.getHours()}
            minutes={formData.fecha_inicio.getMinutes()}
            onConfirm={({ hours, minutes }) => {
              const newDate = new Date(formData.fecha_inicio);
              newDate.setHours(hours);
              newDate.setMinutes(minutes);
              handleChange("fecha_inicio", newDate);
              setShowStartTimePicker(false);
            }}
          />
        </View>
        {/* Fecha y hora de fin */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: themeObject.colors.text }]}>
            Fecha y hora de fin: <Text style={styles.requiredStar}>*</Text>
          </Text>
          <Pressable
            style={[
              styles.datePickerButton,
              { borderColor: themeObject.colors.border },
            ]}
            onPress={() => setShowEndDatePicker(true)}
          >
            <Text style={{ color: themeObject.colors.text }}>
              {formatDateTime(formData.fecha_fin)}
            </Text>
          </Pressable>
          <DatePickerModal
            locale="es"
            mode="single"
            visible={showEndDatePicker}
            onDismiss={() => setShowEndDatePicker(false)}
            date={formData.fecha_fin}
            onConfirm={({ date }) => {
              // Mantener la hora actual al cambiar la fecha
              const currentTime = formData.fecha_fin;
              date.setHours(currentTime.getHours());
              date.setMinutes(currentTime.getMinutes());

              handleChange("fecha_fin", date);
              setShowEndDatePicker(false);
              // Abrir selector de hora después de seleccionar fecha
              setShowEndTimePicker(true);
            }}
            label="Seleccionar fecha"
          />
          <TimePickerModal
            visible={showEndTimePicker}
            onDismiss={() => setShowEndTimePicker(false)}
            hours={formData.fecha_fin.getHours()}
            minutes={formData.fecha_fin.getMinutes()}
            onConfirm={({ hours, minutes }) => {
              const newDate = new Date(formData.fecha_fin);
              newDate.setHours(hours);
              newDate.setMinutes(minutes);
              handleChange("fecha_fin", newDate);
              setShowEndTimePicker(false);
            }}
          />
        </View>
        {/* Notas */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: themeObject.colors.text }]}>
            Notas:
          </Text>
          <TextInput
            multiline
            numberOfLines={3}
            style={styles.textArea}
            value={formData.notas}
            onChangeText={(text) => handleChange("notas", text)}
            placeholder="Notas adicionales sobre la cita..."
            mode="outlined"
            outlineColor={themeObject.colors.border}
          />
        </View>
        {/* Verificación de disponibilidad */}
        <View style={styles.availabilityContainer}>
          <CustomButton
            onPress={checkAvailability}
            variant="primary"
            disabled={
              !formData.id_empleado ||
              !formData.fecha_inicio ||
              !formData.fecha_fin ||
              loading
            }
            ionIconLeft="checkmark-circle-outline"
          >
            {availabilityChecked
              ? "Volver a verificar disponibilidad"
              : "Verificar disponibilidad"}
          </CustomButton>

          {availabilityChecked && (
            <View style={styles.availabilityResultContainer}>
              <Text
                style={[
                  styles.availabilityMessage,
                  {
                    color: isAvailable
                      ? themeObject.colors.success
                      : themeObject.colors.error,
                  },
                ]}
              >
                {isAvailable
                  ? formData.id_empleado === "sin_asignar"
                    ? "✓ Disponible - Sin asignar profesional específico"
                    : "✓ Profesional disponible en este horario"
                  : "✗ Profesional no disponible en este horario"}
              </Text>

              {error &&
              typeof error === "string" &&
              error.includes("cita(s) programada(s)") ? (
                <Text
                  style={[
                    styles.reservationsInfo,
                    {
                      color: themeObject.colors.text,
                      backgroundColor: themeObject.colors.background,
                    },
                  ]}
                >
                  {error}
                </Text>
              ) : null}
            </View>
          )}
        </View>
        {/* Botón de eliminar para citas existentes */}
        {!isNew && (
          <View style={styles.deleteContainer}>
            <CustomButton
              onPress={handleDelete}
              variant="error"
              ionIconLeft="trash-outline"
            >
              Eliminar Cita
            </CustomButton>
          </View>
        )}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={themeObject.colors.primary}
            />
          </View>
        )}
      </ScrollView>
    </ModalTemplate>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: Platform.OS === "web" ? 500 : 400,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    width: "100%",
    height: 45,
  },
  datePickerButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    justifyContent: "center",
  },
  textArea: {
    minHeight: 80,
  },
  availabilityContainer: {
    marginVertical: 16,
    alignItems: "center",
  },
  availabilityResultContainer: {
    marginTop: 10,
    alignItems: "center",
    width: "100%",
  },
  availabilityMessage: {
    marginTop: 8,
    fontWeight: "500",
    textAlign: "center",
  },
  reservationsInfo: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    textAlign: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    width: "100%",
  },
  deleteContainer: {
    marginVertical: 16,
    alignItems: "center",
  },
  loadingContainer: {
    marginTop: 16,
    alignItems: "center",
  },
  statusContainer: {
    marginBottom: 16,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  statusChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  requiredStar: {
    color: "red",
  },
});

export default AppointmentModal;
