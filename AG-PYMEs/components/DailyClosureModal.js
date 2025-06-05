import React, { useState } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { TextInput, Divider, ActivityIndicator } from "react-native-paper";
import { useTheme } from "../context/ThemeContext";
import { formatCurrency, formatDate } from "../utils/helpers";
import ModalTemplate from "./modalTemplate";
import CustomPicker from "./customPicker";

/**
 * Componente modal para realizar cierre diario de ventas
 */
const DailyClosureModal = ({
  isVisible,
  onCancel,
  onConfirm,
  selectedDate,
  dailyTotal,
  salesCount,
  notes,
  onNotesChange,
  isLoading,
}) => {
  const { themeObject } = useTheme();
  const [defaultSaleStatus, setDefaultSaleStatus] = useState("pagado");

  // Opciones para el selector de estado predeterminado
  const statusOptions = [
    { label: "Pagado", value: "pagado" },
    { label: "Pendiente", value: "pendiente" },
    { label: "Pago Parcial", value: "parcial" },
  ];

  // Guardar la configuración del estado predeterminado
  const saveDefaultStatus = () => {
    // Aquí guardaríamos el estado predeterminado en localStorage o AsyncStorage
    // para que se use en la creación de nuevas ventas
    try {
      if (Platform.OS === "web") {
        localStorage.setItem("defaultSaleStatus", defaultSaleStatus);
      }
    } catch (error) {
      console.error("Error al guardar estado predeterminado:", error);
    }
  };

  // Función para manejar la confirmación del cierre
  const handleConfirm = () => {
    // Guardar la configuración antes de confirmar
    saveDefaultStatus();
    // Llamar a la función de confirmación pasada como prop
    onConfirm();
  };

  const styles = StyleSheet.create({
    closureDetails: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "500",
      color: themeObject.colors.text,
      marginBottom: 8,
    },
    dateText: {
      fontSize: 16,
      fontWeight: "bold",
      color: themeObject.colors.primary,
      marginBottom: 8,
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    infoLabel: {
      fontSize: 14,
      color: themeObject.colors.placeholder,
    },
    infoValue: {
      fontSize: 14,
      fontWeight: "500",
      color: themeObject.colors.text,
    },
    totalAmount: {
      fontSize: 18,
      fontWeight: "bold",
      color: themeObject.colors.primary,
    },
    divider: {
      marginVertical: 16,
    },
    configSection: {
      marginBottom: 16,
    },
    inputRow: {
      marginBottom: 8,
    },
    pickerContainer: {
      marginVertical: 8,
    },
    notesInput: {
      backgroundColor: "transparent",
      marginTop: 8,
    },
    loadingContainer: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.3)",
      zIndex: 10,
      borderRadius: 12,
    },
  });

  return (
    <ModalTemplate
      isVisible={isVisible}
      title="Cierre Diario de Ventas"
      text="Confirme el cierre diario para esta fecha"
      cancelLabel="Cancelar"
      cancelAction={onCancel}
      confirmLabel="Confirmar Cierre"
      confirmAction={handleConfirm}
    >
      <View style={styles.closureDetails}>
        <Text style={styles.dateText}>
          {selectedDate.toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ventas registradas:</Text>
          <Text style={styles.infoValue}>{salesCount}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Total a ingresar:</Text>
          <Text style={styles.totalAmount}>{formatCurrency(dailyTotal)}</Text>
        </View>
      </View>

      <Divider style={styles.divider} />

      {/* Sección de configuración para nuevas ventas */}
      <View style={styles.configSection}>
        <Text style={styles.sectionTitle}>
          Configuración para nuevas ventas
        </Text>

        <View style={styles.pickerContainer}>
          <Text style={styles.infoLabel}>Estado predeterminado:</Text>
          <CustomPicker
            selectedValue={defaultSaleStatus}
            onValueChange={setDefaultSaleStatus}
            items={statusOptions}
            placeholder="Seleccione estado predeterminado"
          />
        </View>
      </View>

      <Divider style={styles.divider} />

      {/* Campo para notas adicionales */}
      <View style={styles.inputRow}>
        <Text style={styles.infoLabel}>Notas adicionales:</Text>
        <TextInput
          value={notes}
          onChangeText={onNotesChange}
          placeholder="Escribe notas o comentarios adicionales sobre el cierre..."
          multiline
          numberOfLines={3}
          style={styles.notesInput}
          theme={{ colors: { primary: themeObject.colors.primary } }}
        />
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeObject.colors.primary} />
        </View>
      )}
    </ModalTemplate>
  );
};

export default DailyClosureModal;
