import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { DatePickerModal } from "react-native-paper-dates";
import { useTheme } from "../../../context/ThemeContext";
import ModalTemplate from "../../../components/modalTemplate";
import CustomButton from "../../../components/customButton";
import CustomPicker from "../../../components/customPicker";
import FileUploader from "../../../components/fileUploader";

// Componente ExpenseModal para crear o editar gastos
const ExpenseModal = ({ visible, onClose, expense, onSave, warning }) => {
  const { themeObject } = useTheme();
  const styles = createStyles(themeObject);
  const [formData, setFormData] = useState({
    tipo_gasto: "fijo",
    concepto: "",
    monto: "",
    fecha_gasto: new Date().toISOString().split("T")[0], // Inicializar con la fecha actual
    categoria: "",
    comentarios: "",
    comprobante: null,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  useEffect(() => {
    if (expense) {
      // Si tenemos un gasto existente, usamos sus datos
      const fechaGasto = expense.fecha_gasto;

      setFormData({
        tipo_gasto: expense.tipo_gasto || "fijo",
        concepto: expense.concepto || "",
        monto: expense.monto ? expense.monto.toString() : "",
        fecha_gasto: fechaGasto || new Date().toISOString().split("T")[0],
        categoria: expense.categoria || "",
        comentarios: expense.comentarios || "",
        comprobante: expense.comprobante || null,
      });
    } else {
      // Para un nuevo gasto, inicializamos con fecha de hoy
      const hoy = new Date();
      const year = hoy.getFullYear();
      const month = String(hoy.getMonth() + 1).padStart(2, "0");
      const day = String(hoy.getDate()).padStart(2, "0");
      const fechaHoy = `${year}-${month}-${day}`;

      setFormData({
        tipo_gasto: "fijo",
        concepto: "",
        monto: "",
        fecha_gasto: fechaHoy,
        categoria: "",
        comentarios: "",
        comprobante: null,
      });
    }
  }, [expense]);
  const handleSubmit = () => {
    // Aseguramos que la fecha se mantenga exactamente como la ingresó el usuario
    const expenseData = {
      ...formData,
      monto: parseFloat(formData.monto),
      fecha_gasto: formData.fecha_gasto, // Mantenemos la fecha tal como está en el estado
    };

    // Incluimos una verificación adicional para depurar
    onSave(expenseData);
  };
  const isFormValid = () => {
    return (
      formData.concepto &&
      formData.concepto.trim() !== "" &&
      formData.monto &&
      formData.monto.trim() !== "" &&
      !isNaN(parseFloat(formData.monto || "0")) &&
      formData.categoria &&
      formData.categoria.trim() !== ""
    );
  };

  const categorias = [
    { label: "Seleccione categoría", value: "" },
    { label: "Suministros", value: "suministros" },
    { label: "Servicios", value: "servicios" },
    { label: "Personal", value: "personal" },
    { label: "Mantenimiento", value: "mantenimiento" },
    { label: "Marketing", value: "marketing" },
    { label: "Impuestos", value: "impuestos" },
    { label: "Otros", value: "otros" },
  ];

  return (
    <ModalTemplate
      isVisible={visible}
      title={expense ? "Editar Gasto" : "Nuevo Gasto"}
      cancelLabel="Cancelar"
      cancelAction={onClose}
      confirmLabel={expense ? "Actualizar" : "Guardar"}
      confirmAction={handleSubmit}
      confirmDisabled={!isFormValid()}
      warning={warning}
    >
      <View style={styles.typeSelector}>
        <CustomButton
          onPress={() => setFormData({ ...formData, tipo_gasto: "fijo" })}
          variant={formData.tipo_gasto === "fijo" ? "primary" : "outline"}
          style={{ flex: 1 }}
        >
          Fijo
        </CustomButton>
        <CustomButton
          onPress={() => setFormData({ ...formData, tipo_gasto: "variable" })}
          variant={formData.tipo_gasto === "variable" ? "primary" : "outline"}
          style={{ flex: 1 }}
        >
          Variable
        </CustomButton>
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Concepto *</Text>
        <TextInput
          style={styles.input}
          value={formData.concepto}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, concepto: text }))
          }
          placeholder="Descripción breve del gasto"
          placeholderTextColor={themeObject.colors.placeholder}
        />
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Monto *</Text>
        <TextInput
          style={styles.input}
          value={formData.monto}
          onChangeText={(text) =>
            setFormData((prev) => ({
              ...prev,
              monto: text.replace(/[^0-9.]/g, ""),
            }))
          }
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={themeObject.colors.placeholder}
        />
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Fecha</Text>
        <CustomButton
          onPress={() => setShowDatePicker(true)}
          variant="outline"
          style={styles.dateButton}
        >
          {formData.fecha_gasto}
        </CustomButton>
        {/* Añadir texto informativo para confirmar la fecha seleccionada */}
        <Text style={styles.dateInfo}>
          Fecha seleccionada: {formData.fecha_gasto}
        </Text>
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
          placeholderTextColor={themeObject.colors.placeholder}
          textAlignVertical="top"
        />
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Comprobante</Text>
        <FileUploader
          onFileSelect={(file) =>
            setFormData((prev) => ({ ...prev, comprobante: file }))
          }
          currentFile={formData.comprobante}
        />
      </View>
      <DatePickerModal
        locale="es"
        mode="single"
        visible={showDatePicker}
        onDismiss={() => setShowDatePicker(false)}
        date={
          formData.fecha_gasto ? new Date(formData.fecha_gasto) : new Date()
        }
        onConfirm={({ date }) => {
          // Aseguramos que se capture correctamente la fecha evitando problemas de zona horaria

          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0"); // +1 porque en JS los meses van de 0 a 11
          const day = String(date.getDate()).padStart(2, "0");

          // Construimos la fecha en formato YYYY-MM-DD
          const formattedDate = `${year}-${month}-${day}`;

          setFormData((prev) => ({
            ...prev,
            fecha_gasto: formattedDate,
          }));
          setShowDatePicker(false);
        }}
        presentationStyle="pageSheet"
        validRange={{
          startDate: new Date(1900, 0, 1), // Permite seleccionar fechas desde el año 1900
          endDate: new Date(2100, 11, 31), // Hasta el año 2100
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
    typeSelector: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 16,
    },
    dateInfo: {
      fontSize: 12,
      color: theme.colors.text,
      marginTop: 4,
      fontStyle: "italic",
    },
  });

export default ExpenseModal;
