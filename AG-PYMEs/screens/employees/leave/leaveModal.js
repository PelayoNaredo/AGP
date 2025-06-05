import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, Switch } from "react-native";
import { DatePickerModal } from "react-native-paper-dates";
import ModalTemplate from "../../../components/modalTemplate";
import CustomButton from "../../../components/customButton";
import CustomPicker from "../../../components/customPicker";
import { useTheme } from "../../../context/ThemeContext";

// Componente LeaveModal para registrar o editar bajas de empleados
const LeaveModal = ({
  visible,
  employees,
  onClose,
  onSubmit,
  loading,
  leaveToEdit,
}) => {
  const { themeObject } = useTheme();
  const styles = createStyles(themeObject);

  const [formData, setFormData] = useState({
    id_empleado: "",
    tipo_baja: "",
    fecha_inicio: new Date(),
    fecha_fin: null,
    comentarios: "",
    inactivo: false,
  });

  const [datePickerVisible, setDatePickerVisible] = useState({
    start: false,
    end: false,
  });

  // Inicializar el formulario con los datos de leaveToEdit si está presente
  useEffect(() => {
    if (leaveToEdit) {
      setFormData({
        id_empleado: leaveToEdit.id_empleado,
        tipo_baja: leaveToEdit.tipo_baja,
        fecha_inicio: new Date(leaveToEdit.fecha_inicio),
        fecha_fin: leaveToEdit.fecha_fin
          ? new Date(leaveToEdit.fecha_fin)
          : null,
        comentarios: leaveToEdit.comentarios || "",
        inactivo:
          employees.find((e) => e.id_empleado === leaveToEdit.id_empleado)
            ?.activo === false,
      });
    } else {
      setFormData({
        id_empleado: "",
        tipo_baja: "",
        fecha_inicio: new Date(),
        fecha_fin: null,
        comentarios: "",
        inactivo: false,
      });
    }
  }, [leaveToEdit, employees]);

  // Manejar el envío del formulario y validar que todos los campos obligatorios estén completos
  const handleSubmit = () => {
    if (!isFormValid()) {
      Alert.alert("Error", "Por favor, complete todos los campos obligatorios");
      return;
    }

    onSubmit({
      id_empleado: formData.id_empleado,
      tipo_baja: formData.tipo_baja,
      fecha_inicio: formData.fecha_inicio.toISOString().split("T")[0],
      fecha_fin: formData.fecha_fin
        ? formData.fecha_fin.toISOString().split("T")[0]
        : null,
      comentarios: formData.comentarios,
      inactivo: formData.inactivo,
    });
  };

  const isFormValid = () => {
    return formData.id_empleado && formData.tipo_baja && formData.fecha_inicio;
  };

  const formatDate = (date) => {
    if (!date) return "";
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const employeeItems = employees.map((emp) => ({
    label: emp.nombre,
    value: emp.id_empleado.toString(),
  }));

  const tiposBaja = [
    { label: "Baja por enfermedad común", value: "enfermedad_comun" },
    { label: "Baja por accidente no laboral", value: "accidente_no_laboral" },
    { label: "Baja por accidente laboral", value: "accidente_laboral" },
    {
      label: "Baja por enfermedad profesional",
      value: "enfermedad_profesional",
    },
    { label: "Baja por maternidad", value: "maternidad" },
    { label: "Baja por paternidad", value: "paternidad" },
    { label: "Baja por riesgo durante embarazo", value: "riesgo_embarazo" },
    { label: "Baja por riesgo durante lactancia", value: "riesgo_lactancia" },
    {
      label: "Baja definitiva por incapacidad permanente",
      value: "incapacidad_permanente",
    },
    {
      label: "Permiso médico (consultas o tratamientos)",
      value: "permiso_medico",
    },
  ];

  return (
    <ModalTemplate
      isVisible={visible}
      title={leaveToEdit ? "Editar Baja" : "Registrar Nueva Baja"}
      cancelLabel="Cancelar"
      cancelAction={onClose}
      confirmLabel={leaveToEdit ? "Actualizar" : "Registrar"}
      confirmAction={handleSubmit}
      confirmDisabled={!isFormValid() || loading}
    >
      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          Empleado <Text style={styles.requiredField}>*</Text>
        </Text>
        <CustomPicker
          selectedValue={formData.id_empleado}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, id_empleado: value }))
          }
          items={employeeItems}
          placeholder="Seleccione un empleado"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          Tipo de Baja <Text style={styles.requiredField}>*</Text>
        </Text>
        <CustomPicker
          selectedValue={formData.tipo_baja}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, tipo_baja: value }))
          }
          items={tiposBaja}
          placeholder="Seleccione tipo de baja"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          Fecha de Inicio <Text style={styles.requiredField}>*</Text>
        </Text>
        <CustomButton
          onPress={() =>
            setDatePickerVisible((prev) => ({ ...prev, start: true }))
          }
          variant="outline"
          style={styles.dateButton}
          textStyle={styles.dateButtonText}
        >
          {formatDate(formData.fecha_inicio)}
        </CustomButton>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Fecha de Fin</Text>
        <CustomButton
          onPress={() =>
            setDatePickerVisible((prev) => ({ ...prev, end: true }))
          }
          variant="outline"
          style={styles.dateButton}
          textStyle={styles.dateButtonText}
        >
          {formData.fecha_fin
            ? formatDate(formData.fecha_fin)
            : "Seleccionar fecha"}
        </CustomButton>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Comentarios</Text>
        <TextInput
          style={styles.input}
          value={formData.comentarios}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, comentarios: text }))
          }
          multiline
          placeholder="Añade cualquier nota relevante..."
        />
      </View>

      <View style={styles.switchContainer}>
        <Text style={styles.label}>Empleado Inactivo</Text>
        <Switch
          value={formData.inactivo}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, inactivo: value }))
          }
          trackColor={{
            false: themeObject.colors.error,
            true: themeObject.colors.success,
          }}
          thumbColor={
            formData.inactivo
              ? themeObject.colors.onSuccess
              : themeObject.colors.onError
          }
        />
      </View>

      <DatePickerModal
        locale="es"
        mode="single"
        visible={datePickerVisible.start}
        onDismiss={() =>
          setDatePickerVisible((prev) => ({ ...prev, start: false }))
        }
        date={formData.fecha_inicio}
        onConfirm={({ date }) => {
          setFormData((prev) => ({ ...prev, fecha_inicio: date }));
          setDatePickerVisible((prev) => ({ ...prev, start: false }));
        }}
      />

      <DatePickerModal
        locale="es"
        mode="single"
        visible={datePickerVisible.end}
        onDismiss={() =>
          setDatePickerVisible((prev) => ({ ...prev, end: false }))
        }
        date={formData.fecha_fin}
        onConfirm={({ date }) => {
          setFormData((prev) => ({ ...prev, fecha_fin: date }));
          setDatePickerVisible((prev) => ({ ...prev, end: false }));
        }}
      />
    </ModalTemplate>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    inputContainer: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      color: theme.colors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      padding: 12,
      color: theme.colors.text,
    },
    dateButton: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
    },
    dateButtonText: {
      color: theme.colors.text,
    },
    requiredField: {
      color: theme.colors.error,
      marginLeft: 4,
    },
    switchContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
    },
  });

export default LeaveModal;
