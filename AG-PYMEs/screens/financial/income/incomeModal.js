import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { DatePickerModal } from "react-native-paper-dates";
import { useTheme } from "../../../context/ThemeContext";
import ModalTemplate from "../../../components/modalTemplate";
import CustomButton from "../../../components/customButton";
import CustomPicker from "../../../components/customPicker";

// Componente IncomeModal para crear o editar ingresos
const IncomeModal = ({ visible, onClose, income, onSave }) => {
  const { themeObject } = useTheme();
  const styles = createStyles(themeObject);

  // Inicializar el estado con los nombres de campo alineados con la tabla de la base de datos
  const [formData, setFormData] = useState({
    concepto: "",
    ingresos: "",
    fecha_ingreso: new Date(),
    categoria: "",
    comentarios: "",
    comprobante: null,
    metodo_ingreso: "",
  });

  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (income) {
      setFormData({
        concepto: income.concepto,
        ingresos: income.ingresos.toString(),
        fecha_ingreso: new Date(income.fecha_ingreso),
        categoria: income.categoria,
        comentarios: income.comentarios || "",
        comprobante: income.comprobante,
        metodo_ingreso: income.metodo_ingreso || "",
      });
    } else {
      setFormData({
        concepto: "",
        ingresos: "",
        fecha_ingreso: new Date(),
        categoria: "",
        comentarios: "",
        metodo_ingreso: "",
      });
    }
  }, [income]);

  const handleSubmit = () => {
    const incomeData = {
      ...formData,
      ingresos: parseFloat(formData.ingresos),
      fecha_ingreso: formData.fecha_ingreso.toISOString().split("T")[0],
    };

    onSave(incomeData);
  };

  const isFormValid = () => {
    return (
      formData.concepto.trim() !== "" &&
      formData.ingresos.trim() !== "" &&
      !isNaN(parseFloat(formData.ingresos)) &&
      formData.categoria.trim() !== "" &&
      formData.metodo_ingreso.trim() !== ""
    );
  };

  const categorias = [
    { label: "Ventas", value: "ventas" },
    { label: "Servicios", value: "servicios" },
    { label: "Comisiones", value: "comisiones" },
    { label: "Otros", value: "otros" },
  ];

  const metodosIngreso = [
    { label: "Efectivo", value: "efectivo" },
    { label: "Bizum", value: "bizum" },
    { label: "Transferencia", value: "transferencia" },
    { label: "Otros", value: "otros" },
  ];

  return (
    <ModalTemplate
      isVisible={visible}
      title={income ? "Editar Ingreso" : "Nuevo Ingreso"}
      cancelLabel="Cancelar"
      cancelAction={onClose}
      confirmLabel={income ? "Actualizar" : "Guardar"}
      confirmAction={handleSubmit}
      confirmDisabled={!isFormValid()}
    >
      <View style={styles.formGroup}>
        <Text style={styles.label}>Concepto *</Text>
        <TextInput
          style={styles.input}
          value={formData.concepto}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, concepto: text }))
          }
          placeholder="Descripción breve del ingreso"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Importe *</Text>
        <TextInput
          style={styles.input}
          value={formData.ingresos}
          onChangeText={(text) =>
            setFormData((prev) => ({
              ...prev,
              ingresos: text.replace(/[^0-9.]/g, ""),
            }))
          }
          keyboardType="decimal-pad"
          placeholder="0.00"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Fecha</Text>
        <CustomButton
          onPress={() => setShowDatePicker(true)}
          variant="outline"
          style={styles.dateButton}
        >
          {formData.fecha_ingreso.toLocaleDateString()}
        </CustomButton>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Categoría *</Text>
        <CustomPicker
          selectedValue={formData.categoria}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, categoria: value }))
          }
          items={categorias}
          placeholder="Seleccione categoría"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Método de Ingreso *</Text>
        <CustomPicker
          selectedValue={formData.metodo_ingreso}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, metodo_ingreso: value }))
          }
          items={metodosIngreso}
          placeholder="Seleccione método de ingreso"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Comentarios</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.comentarios}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, comentarios: text }))
          }
          multiline
          numberOfLines={4}
          placeholder="Detalles adicionales..."
          textAlignVertical="top"
        />
      </View>

      <DatePickerModal
        locale="es"
        mode="single"
        visible={showDatePicker}
        onDismiss={() => setShowDatePicker(false)}
        date={formData.fecha_ingreso}
        onConfirm={({ date }) => {
          setFormData((prev) => ({ ...prev, fecha_ingreso: date }));
          setShowDatePicker(false);
        }}
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
    input: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.roundness,
      padding: 12,
      color: theme.colors.text,
    },
    textArea: {
      height: 100,
      textAlignVertical: "top",
    },
    dateButton: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.roundness,
      justifyContent: "flex-start",
    },
  });

export default IncomeModal;
