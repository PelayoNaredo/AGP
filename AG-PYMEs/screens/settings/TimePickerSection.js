import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Modal,
} from "react-native";
import { TextInput, Button, IconButton, Card } from "react-native-paper";
// import DateTimePicker from "@react-native-community/datetimepicker"; // Temporal hasta instalación
import { useTheme } from "../../context/ThemeContext";
import Animated, {
  FadeInDown,
  SlideInRight,
  ZoomIn,
} from "react-native-reanimated";

const TimePickerSection = ({ settings, handleChange }) => {
  const { themeObject } = useTheme();
  const [showOpeningPicker, setShowOpeningPicker] = useState(false);
  const [showClosingPicker, setShowClosingPicker] = useState(false);

  // Convertir string de tiempo a Date object
  const timeStringToDate = (timeString) => {
    const [hours, minutes] = timeString.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  // Convertir Date object a string de tiempo
  const dateToTimeString = (date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  // Manejar cambio de horario de apertura (temporal - usando input manual)
  const handleOpeningTimeChange = (timeString) => {
    handleChange("horario_apertura", timeString);
    setShowOpeningPicker(false);
  };

  // Manejar cambio de horario de cierre (temporal - usando input manual)
  const handleClosingTimeChange = (timeString) => {
    handleChange("horario_cierre", timeString);
    setShowClosingPicker(false);
  };

  // Validar si el horario es válido
  const validateTimeRange = () => {
    const openingTime = timeStringToDate(settings.horario_apertura || "08:00");
    const closingTime = timeStringToDate(settings.horario_cierre || "18:00");
    return openingTime < closingTime;
  };

  // Calcular duración del día laboral
  const calculateWorkingHours = () => {
    const openingTime = timeStringToDate(settings.horario_apertura || "08:00");
    const closingTime = timeStringToDate(settings.horario_cierre || "18:00");
    const diffMs = closingTime - openingTime;
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours > 0 ? diffHours : 0;
  };

  const isValidRange = validateTimeRange();
  const workingHours = calculateWorkingHours();

  return (
    <Animated.View
      entering={FadeInDown.delay(300).duration(500).springify()}
      style={styles.container}
    >
      <Card
        style={[styles.card, { backgroundColor: themeObject.colors.surface }]}
      >
        <Card.Title
          title="Horarios de Funcionamiento"
          titleStyle={[styles.title, { color: themeObject.colors.text }]}
          left={(props) => (
            <IconButton
              {...props}
              icon="clock-outline"
              size={24}
              iconColor={themeObject.colors.primary}
            />
          )}
        />

        <Card.Content>
          {/* Horarios */}
          <View style={styles.timesContainer}>
            <Animated.View
              entering={SlideInRight.delay(100).duration(400)}
              style={styles.timePickerContainer}
            >
              <Text
                style={[styles.timeLabel, { color: themeObject.colors.text }]}
              >
                Apertura
              </Text>
              <TouchableOpacity
                onPress={() => setShowOpeningPicker(true)}
                style={[
                  styles.timeButton,
                  {
                    backgroundColor: themeObject.colors.primaryContainer,
                    borderColor: isValidRange
                      ? themeObject.colors.primary
                      : themeObject.colors.error,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.timeText,
                    { color: themeObject.colors.onPrimaryContainer },
                  ]}
                >
                  {settings.horario_apertura || "08:00"}
                </Text>
                <IconButton
                  icon="clock-edit-outline"
                  size={20}
                  iconColor={themeObject.colors.onPrimaryContainer}
                />
              </TouchableOpacity>
            </Animated.View>

            {/* Separador visual */}
            <Animated.View
              entering={ZoomIn.delay(200).duration(300)}
              style={styles.separatorContainer}
            >
              <View
                style={[
                  styles.separator,
                  { backgroundColor: themeObject.colors.outline },
                ]}
              />
              <Text
                style={[
                  styles.separatorText,
                  { color: themeObject.colors.outline },
                ]}
              >
                hasta
              </Text>
              <View
                style={[
                  styles.separator,
                  { backgroundColor: themeObject.colors.outline },
                ]}
              />
            </Animated.View>

            <Animated.View
              entering={SlideInRight.delay(300).duration(400)}
              style={styles.timePickerContainer}
            >
              <Text
                style={[styles.timeLabel, { color: themeObject.colors.text }]}
              >
                Cierre
              </Text>
              <TouchableOpacity
                onPress={() => setShowClosingPicker(true)}
                style={[
                  styles.timeButton,
                  {
                    backgroundColor: themeObject.colors.secondaryContainer,
                    borderColor: isValidRange
                      ? themeObject.colors.secondary
                      : themeObject.colors.error,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.timeText,
                    { color: themeObject.colors.onSecondaryContainer },
                  ]}
                >
                  {settings.horario_cierre || "18:00"}
                </Text>
                <IconButton
                  icon="clock-edit-outline"
                  size={20}
                  iconColor={themeObject.colors.onSecondaryContainer}
                />
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Información adicional */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(500)}
            style={[
              styles.infoContainer,
              {
                backgroundColor: isValidRange
                  ? themeObject.colors.secondaryContainer
                  : themeObject.colors.errorContainer,
              },
            ]}
          >
            {isValidRange ? (
              <View style={styles.infoRow}>
                <IconButton
                  icon="information"
                  size={20}
                  iconColor={themeObject.colors.onSecondaryContainer}
                />
                <Text
                  style={[
                    styles.infoText,
                    { color: themeObject.colors.onSecondaryContainer },
                  ]}
                >
                  Jornada laboral: {workingHours.toFixed(1)} horas
                </Text>
              </View>
            ) : (
              <View style={styles.infoRow}>
                <IconButton
                  icon="alert-circle"
                  size={20}
                  iconColor={themeObject.colors.onErrorContainer}
                />
                <Text
                  style={[
                    styles.errorText,
                    { color: themeObject.colors.onErrorContainer },
                  ]}
                >
                  La hora de apertura debe ser menor que la de cierre
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Horarios predefinidos */}
          <Animated.View
            entering={FadeInDown.delay(500).duration(500)}
            style={styles.presetsContainer}
          >
            <Text
              style={[styles.presetsTitle, { color: themeObject.colors.text }]}
            >
              Horarios predefinidos:
            </Text>
            <View style={styles.presetsGrid}>
              {[
                { name: "Oficina", opening: "09:00", closing: "17:00" },
                { name: "Comercio", opening: "10:00", closing: "20:00" },
                { name: "Restaurante", opening: "12:00", closing: "23:00" },
                { name: "24h", opening: "00:00", closing: "23:59" },
              ].map((preset, index) => (
                <TouchableOpacity
                  key={preset.name}
                  onPress={() => {
                    handleChange("horario_apertura", preset.opening);
                    handleChange("horario_cierre", preset.closing);
                  }}
                  style={[
                    styles.presetButton,
                    {
                      backgroundColor: themeObject.colors.surface,
                      borderColor: themeObject.colors.outline,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.presetName,
                      { color: themeObject.colors.text },
                    ]}
                  >
                    {preset.name}
                  </Text>
                  <Text
                    style={[
                      styles.presetTime,
                      { color: themeObject.colors.outline },
                    ]}
                  >
                    {preset.opening} - {preset.closing}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </Card.Content>
      </Card>

      {/* Modales simplificados para entrada manual de hora */}
      {showOpeningPicker && (
        <Modal
          transparent
          animationType="slide"
          visible={showOpeningPicker}
          onRequestClose={() => setShowOpeningPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: themeObject.colors.surface },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text
                  style={[
                    styles.modalTitle,
                    { color: themeObject.colors.text },
                  ]}
                >
                  Hora de Apertura
                </Text>
                <Button
                  onPress={() => setShowOpeningPicker(false)}
                  textColor={themeObject.colors.primary}
                >
                  Cancelar
                </Button>
              </View>
              <View style={styles.modalBody}>
                <TextInput
                  label="Hora (HH:MM)"
                  value={settings.horario_apertura || "08:00"}
                  onChangeText={handleOpeningTimeChange}
                  placeholder="08:00"
                  mode="outlined"
                  style={styles.timeInput}
                />
                <Text
                  style={[
                    styles.helpText,
                    { color: themeObject.colors.outline },
                  ]}
                >
                  Formato 24 horas (ej: 08:30, 14:00)
                </Text>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {showClosingPicker && (
        <Modal
          transparent
          animationType="slide"
          visible={showClosingPicker}
          onRequestClose={() => setShowClosingPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: themeObject.colors.surface },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text
                  style={[
                    styles.modalTitle,
                    { color: themeObject.colors.text },
                  ]}
                >
                  Hora de Cierre
                </Text>
                <Button
                  onPress={() => setShowClosingPicker(false)}
                  textColor={themeObject.colors.primary}
                >
                  Cancelar
                </Button>
              </View>
              <View style={styles.modalBody}>
                <TextInput
                  label="Hora (HH:MM)"
                  value={settings.horario_cierre || "18:00"}
                  onChangeText={handleClosingTimeChange}
                  placeholder="18:00"
                  mode="outlined"
                  style={styles.timeInput}
                />
                <Text
                  style={[
                    styles.helpText,
                    { color: themeObject.colors.outline },
                  ]}
                >
                  Formato 24 horas (ej: 18:30, 22:00)
                </Text>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  card: {
    borderRadius: 12,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  timesContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  timePickerContainer: {
    flex: 1,
    alignItems: "center",
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  timeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 100,
  },
  timeText: {
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 4,
  },
  separatorContainer: {
    alignItems: "center",
    marginHorizontal: 16,
  },
  separator: {
    height: 1,
    width: 30,
    marginVertical: 2,
  },
  separatorText: {
    fontSize: 12,
    fontWeight: "500",
  },
  infoContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  errorText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  presetsContainer: {
    marginTop: 8,
  },
  presetsTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
  },
  presetsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  presetButton: {
    flex: 1,
    minWidth: "45%",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  presetName: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  presetTime: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalBody: {
    padding: 20,
  },
  timeInput: {
    marginBottom: 10,
  },
  helpText: {
    fontSize: 12,
    textAlign: "center",
  },
});

export default TimePickerSection;
