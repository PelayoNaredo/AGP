import React, { useState, useEffect } from "react";
import { View, TextInput, StyleSheet, Text } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import CustomPicker from "../../components/customPicker";
import ModalTemplate from "../../components/modalTemplate";

// Componente AlertModal para crear o editar alertas
const AlertModal = ({ visible, initialData, onSubmit, onCancel }) => {
  const { themeObject } = useTheme();
  const [formData, setFormData] = useState({
    titulo: initialData?.titulo || "",
    descripcion: initialData?.descripcion || "",
    tipo: initialData?.tipo || "inventario",
    prioridad: initialData?.prioridad || "media",
    fecha_recordatorio:
      initialData?.fecha_recordatorio || new Date().toISOString().split("T")[0],
  });

  // Resetear el formulario cuando cambia initialData
  useEffect(() => {
    setFormData({
      titulo: initialData?.titulo || "",
      descripcion: initialData?.descripcion || "",
      tipo: initialData?.tipo || "inventario",
      prioridad: initialData?.prioridad || "media",
      fecha_recordatorio:
        initialData?.fecha_recordatorio ||
        new Date().toISOString().split("T")[0],
    });
  }, [initialData]);

  const tipoOptions = [
    { label: "Inventario", value: "inventario" },
    { label: "Mantenimiento", value: "mantenimiento" },
    { label: "Pagos", value: "pago" },
    { label: "Horarios", value: "horario" },
    { label: "Pedidos", value: "pedido" },
    { label: "Empleados", value: "empleado" },
    { label: "Otros", value: "otros" },
  ];

  const prioridadOptions = [
    { label: "Baja", value: "baja" },
    { label: "Media", value: "media" },
    { label: "Alta", value: "alta" },
  ];

  const handleSubmit = () => {
    onSubmit(formData);
  };

  const styles = StyleSheet.create({
    modalBackdrop: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: themeObject.componentColors.overlay,
    },
    modalContent: {
      width: "90%",
      maxHeight: "85%",
      borderRadius: themeObject.roundness * 2,
      backgroundColor: themeObject.colors.surface,
      marginHorizontal: 20,
      shadowColor: themeObject.colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
      zIndex: 1,
    },
    input: {
      borderWidth: 1,
      borderRadius: themeObject.roundness,
      padding: themeObject.roundness * 2,
      marginVertical: themeObject.roundness,
      backgroundColor: themeObject.colors.background,
      borderColor: themeObject.colors.border,
      color: themeObject.colors.text,
    },
    container: {
      padding: themeObject.roundness * 3,
    },
    formGroup: {
      marginBottom: themeObject.roundness * 2,
    },
    textArea: {
      height: 120,
      textAlignVertical: "top",
      borderWidth: 1,
      borderRadius: themeObject.roundness,
      padding: themeObject.roundness * 2,
      fontSize: 16,
      backgroundColor: themeObject.colors.background,
      borderColor: themeObject.colors.border,
      color: themeObject.colors.text,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "600",
      marginBottom: themeObject.roundness * 3,
      color: themeObject.colors.primary,
      textAlign: "center",
    },
    label: {
      fontSize: 14,
      marginBottom: themeObject.roundness,
      color: themeObject.colors.onSurface,
      fontWeight: "500",
    },
    picker: {
      height: 50,
      borderWidth: 1,
      borderRadius: themeObject.roundness,
      borderColor: themeObject.colors.border,
      backgroundColor: themeObject.colors.background,
      color: themeObject.colors.text,
      marginVertical: themeObject.roundness,
    },
  });
  return (
    <ModalTemplate
      isVisible={visible}
      title={initialData ? "Editar Alerta" : "Nueva Alerta"}
      cancelLabel="Cancelar"
      cancelAction={onCancel}
      confirmLabel={initialData ? "Guardar Cambios" : "Crear Alerta"}
      confirmAction={handleSubmit}
    >
      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: themeObject.colors.text }]}>
          Título
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              color: themeObject.colors.text,
              borderColor: themeObject.colors.border,
            },
          ]}
          value={formData.titulo}
          onChangeText={(text) => setFormData({ ...formData, titulo: text })}
        />
      </View>
      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: themeObject.colors.text }]}>
          Descripción
        </Text>
        <TextInput
          style={[
            styles.textArea,
            {
              color: themeObject.colors.text,
              borderColor: themeObject.colors.border,
            },
          ]}
          value={formData.descripcion}
          onChangeText={(text) =>
            setFormData({ ...formData, descripcion: text })
          }
          multiline
          numberOfLines={4}
        />
      </View>
      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: themeObject.colors.text }]}>
          Tipo
        </Text>
        <CustomPicker
          selectedValue={formData.tipo}
          onValueChange={(value) => setFormData({ ...formData, tipo: value })}
          items={tipoOptions}
          placeholder="Seleccione un tipo"
          style={styles.picker}
        />
      </View>
      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: themeObject.colors.text }]}>
          Prioridad
        </Text>
        <CustomPicker
          selectedValue={formData.prioridad}
          onValueChange={(value) =>
            setFormData({ ...formData, prioridad: value })
          }
          items={prioridadOptions}
          placeholder="Seleccione una prioridad"
          style={styles.picker}
        />
      </View>
      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: themeObject.colors.text }]}>
          Fecha de recordatorio
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              color: themeObject.colors.text,
              borderColor: themeObject.colors.border,
            },
          ]}
          value={formData.fecha_recordatorio}
          onChangeText={(text) =>
            setFormData({ ...formData, fecha_recordatorio: text })
          }
        />
      </View>
    </ModalTemplate>
  );
};

export default AlertModal;
