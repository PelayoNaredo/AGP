import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useTheme } from "../../../../context/ThemeContext";
import ModalTemplate from "../../../../components/modalTemplate";
import CustomButton from "../../../../components/customButton";
import CustomPicker from "../../../../components/customPicker";
import TimeSelector from "../../../../components/timeSelectorModal";
import Ionicons from "react-native-vector-icons/Ionicons";
import useNotifications from "../../../../hooks/useNotifications";

// Componente ShiftModal para crear o editar turnos
const ShiftModal = ({
  visible,
  onClose,
  onSubmit,
  onDelete,
  shift,
  employees,
  loading,
  preselectedEmployee,
  preselectedDay,
}) => {
  const { themeObject } = useTheme();
  const { showConfirmDialog } = useNotifications();
  const styles = createStyles(themeObject);

  const [formData, setFormData] = useState({
    id_empleado: "",
    dia_semana: "",
    intervalos: [],
  });

  const [timeEntries, setTimeEntries] = useState([{ start: "", end: "" }]);
  const [showTimeSelector, setShowTimeSelector] = useState({
    index: -1,
    type: null,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (shift) {
      setFormData({
        id_empleado: shift.id_empleado.toString(),
        dia_semana: shift.dia_semana.toString(),
        intervalos: shift.intervalos || [],
      });
    } else if (preselectedEmployee && preselectedDay) {
      setFormData({
        id_empleado: preselectedEmployee.id_empleado.toString(),
        dia_semana: preselectedDay.toString(),
        intervalos: [],
      });
    } else {
      setFormData({
        id_empleado: "",
        dia_semana: "",
        intervalos: [],
      });
    }
  }, [shift, preselectedEmployee, preselectedDay]);

  const handleSubmit = () => {
    // Validar superposición de intervalos
    const allIntervals = [
      ...formData.intervalos,
      ...timeEntries
        .filter((entry) => entry.start && entry.end && entry.start < entry.end)
        .map((entry) => ({
          hora_inicio: entry.start,
          hora_fin: entry.end,
        })),
    ];

    // Ordenar intervalos por hora de inicio
    const sortedIntervals = allIntervals.sort((a, b) =>
      a.hora_inicio.localeCompare(b.hora_inicio)
    );

    // Verificar superposición
    for (let i = 0; i < sortedIntervals.length - 1; i++) {
      if (sortedIntervals[i].hora_fin > sortedIntervals[i + 1].hora_inicio) {
        setError("Los intervalos no pueden superponerse");
        return;
      }
    }

    const shiftData = {
      ...formData,
      id_empleado: parseInt(formData.id_empleado),
      dia_semana: parseInt(formData.dia_semana),
      intervalos: sortedIntervals,
    };

    onSubmit(shiftData);
  };

  const isFormValid = () => {
    const hasValidNewIntervals = timeEntries.some(
      (entry) => entry.start && entry.end && entry.start < entry.end
    );
    return (
      formData.id_empleado &&
      formData.dia_semana &&
      (formData.intervalos.length > 0 || hasValidNewIntervals)
    );
  };
  const removeInterval = (index) => {
    showConfirmDialog(
      "Eliminar intervalo",
      "¿Está seguro que desea eliminar este intervalo de trabajo?",
      () => {
        setFormData((prev) => ({
          ...prev,
          intervalos: prev.intervalos.filter((_, i) => i !== index),
        }));
      }
    );
  };

  const addTimeEntry = () => {
    setTimeEntries((prev) => [...prev, { start: "", end: "" }]);
  };
  const removeTimeEntry = (index) => {
    showConfirmDialog(
      "Eliminar horario",
      "¿Está seguro que desea eliminar este horario?",
      () => {
        setTimeEntries((prev) => prev.filter((_, i) => i !== index));
      }
    );
  };

  const updateTimeEntry = (index, type, time) => {
    setTimeEntries((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, [type]: time } : entry))
    );
  };

  const diasSemana = [
    { label: "Lunes", value: "1" },
    { label: "Martes", value: "2" },
    { label: "Miércoles", value: "3" },
    { label: "Jueves", value: "4" },
    { label: "Viernes", value: "5" },
    { label: "Sábado", value: "6" },
    { label: "Domingo", value: "7" },
  ];
  const employeeItems = employees.map((emp) => ({
    label: emp.nombre,
    value: emp.id_empleado.toString(),
  })); // Función para manejar la eliminación de un turno
  const handleDelete = () => {
    showConfirmDialog(
      "Eliminar turno",
      "¿Está seguro que desea eliminar este turno? Esta acción no se puede deshacer.",
      () => {
        onDelete && onDelete(shift);
      }
    );
  };

  return (
    <ModalTemplate
      isVisible={visible}
      title={shift ? "Editar Turno" : "Nuevo Turno"}
      cancelLabel="Cancelar"
      cancelAction={onClose}
      confirmLabel={shift ? "Actualizar" : "Crear"}
      confirmAction={handleSubmit}
      confirmDisabled={!isFormValid() || loading}
    >
      <ScrollView>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Empleado *</Text>
          <CustomPicker
            selectedValue={formData.id_empleado}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, id_empleado: value }))
            }
            items={employeeItems}
            placeholder="Seleccione un empleado"
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Día de la Semana *</Text>
          <CustomPicker
            selectedValue={formData.dia_semana}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, dia_semana: value }))
            }
            items={diasSemana}
            placeholder="Seleccione un día"
          />
        </View>
        <View style={styles.intervalsContainer}>
          <Text style={styles.label}>Intervalos de Trabajo *</Text>
          {formData.intervalos.map((interval, index) => (
            <View
              key={`existing-interval-${interval.hora_inicio}-${interval.hora_fin}-${index}`}
              style={styles.intervalItem}
            >
              <Text style={styles.intervalText}>
                {interval.hora_inicio} - {interval.hora_fin}
              </Text>
              <Pressable
                onPress={() => removeInterval(index)}
                style={styles.removeButton}
              >
                <Ionicons
                  name="close-circle"
                  size={24}
                  color={themeObject.colors.error}
                />
              </Pressable>
            </View>
          ))}
          {timeEntries.map((entry, index) => (
            <View
              key={`time-entry-${entry.start || "empty"}-${entry.end || "empty"}-${index}`}
              style={styles.timeInputsRow}
            >
              <View style={styles.timeInput}>
                <Text style={styles.timeLabel}>Entrada</Text>
                <CustomButton
                  onPress={() => setShowTimeSelector({ index, type: "start" })}
                  variant="outline"
                  style={styles.timeButton}
                >
                  {entry.start || "HH:MM"}
                </CustomButton>
              </View>

              <View style={styles.timeInput}>
                <Text style={styles.timeLabel}>Salida</Text>
                <CustomButton
                  onPress={() => setShowTimeSelector({ index, type: "end" })}
                  variant="outline"
                  style={styles.timeButton}
                >
                  {entry.end || "HH:MM"}
                </CustomButton>
              </View>

              <CustomButton
                onPress={() => removeTimeEntry(index)}
                variant="error"
                style={styles.removeButton}
                ionIconLeft="close-circle-outline"
              />
            </View>
          ))}
          <CustomButton
            onPress={addTimeEntry}
            variant="secondary"
            style={styles.addButton}
            ionIconLeft="add-circle-outline"
          >
            Añadir otro horario
          </CustomButton>
          {shift && (
            <CustomButton
              onPress={handleDelete}
              variant="error"
              style={styles.deleteButton}
              ionIconLeft="trash-outline"
            >
              Eliminar turno
            </CustomButton>
          )}
        </View>
      </ScrollView>
      <TimeSelector
        visible={showTimeSelector.index !== -1}
        onClose={() => setShowTimeSelector({ index: -1, type: null })}
        onConfirm={(time) => {
          updateTimeEntry(showTimeSelector.index, showTimeSelector.type, time);
          setShowTimeSelector({ index: -1, type: null });
        }}
        initialTime="00:00"
      />
    </ModalTemplate>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    formGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      color: theme.colors.text,
      marginBottom: 8,
      fontWeight: "500",
    },
    timeLabel: {
      fontSize: 12,
      color: theme.colors.text,
      marginBottom: 4,
    },
    timeButton: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      justifyContent: "flex-start",
    },
    intervalsContainer: {
      marginTop: 16,
    },
    intervalItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      padding: 8,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    intervalText: {
      flex: 1,
      color: theme.colors.text,
    },
    removeButton: {
      padding: 4,
      minWidth: 40,
      height: 40,
    },
    timeInputsRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 8,
      marginBottom: 8,
    },
    timeInput: {
      flex: 1,
    },
    addButton: {
      marginTop: 8,
    },
    deleteButton: {
      marginTop: 16,
      backgroundColor: theme.colors.error,
    },
  });

export default ShiftModal;
