import { View, Text, StyleSheet, Platform } from "react-native";
import { TextInput, Divider } from "react-native-paper";
import { formatCurrency } from "../../../utils/helpers";
import ModalTemplate from "../../../components/modalTemplate";
import { useTheme } from "../../../context/ThemeContext";

//Modal para realizar el cierre diario de ventas
const DailyClosureModal = ({
  isVisible,
  onCancel,
  onConfirm,
  selectedDate,
  dailyTotal,
  salesCount,
  notes,
  onNotesChange,
  isLoading = false,
}) => {
  // Acceder al contexto del tema
  const { themeObject } = useTheme();
  const { colors } = themeObject;

  // Formatear la fecha para el usuario
  const formattedDate = selectedDate?.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const styles = StyleSheet.create({
    closureDetails: {
      padding: Platform.OS === "web" ? 16 : 8,
    },
    closureDate: {
      fontSize: 16,
      marginBottom: 16,
      fontWeight: "500",
      color: colors.text,
    },
    closureTotal: {
      fontSize: Platform.OS === "web" ? 20 : 18,
      fontWeight: "bold",
      marginBottom: 8,
      color: colors.primary,
    },
    closureCount: {
      fontSize: 14,
      marginBottom: 16,
      color: colors.text,
    },
    closureNotes: {
      marginTop: 16,
    },
    separator: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 16,
    },
    infoBox: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 12,
      marginTop: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoText: {
      fontSize: 13,
      color: colors.onSurface,
      lineHeight: 18,
    },
  });

  return (
    <ModalTemplate
      isVisible={isVisible}
      title="Cierre Diario de Ventas"
      confirmLabel="Cerrar Día"
      cancelLabel="Cancelar"
      confirmAction={onConfirm}
      cancelAction={onCancel}
      confirmDisabled={isLoading}
    >
      <View style={styles.closureDetails}>
        <Text style={styles.closureDate}>Fecha: {formattedDate}</Text>

        <Divider style={styles.separator} />

        <Text style={styles.closureTotal}>
          Total: {formatCurrency(dailyTotal)}
        </Text>
        <Text style={styles.closureCount}>
          Cantidad de ventas: {salesCount}
        </Text>

        <Divider style={styles.separator} />

        <TextInput
          mode="outlined"
          label="Notas adicionales (opcional)"
          value={notes}
          onChangeText={onNotesChange}
          multiline
          numberOfLines={3}
          style={styles.closureNotes}
          theme={themeObject}
        />

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Al realizar el cierre diario se generará un registro de ingreso con
            la siguiente información:
          </Text>
          <Text style={styles.infoText}>• Concepto: Cierre Diario</Text>
          <Text style={styles.infoText}>• Categoría: cierre</Text>
          <Text style={styles.infoText}>• Método de ingreso: multiple</Text>
          <Text style={styles.infoText}>
            • Importe: {formatCurrency(dailyTotal)}
          </Text>
          <Text style={styles.infoText}>
            • Fecha: {selectedDate?.toLocaleDateString()}
          </Text>
        </View>
      </View>
    </ModalTemplate>
  );
};

export default DailyClosureModal;
