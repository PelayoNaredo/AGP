import React, { useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import { Card, IconButton } from "react-native-paper";
import CustomButton from "../../components/customButton";
import { useTheme } from "../../context/ThemeContext";
import TimeSelectorModal from "../../components/timeSelectorModal";

// Componente TimePickerSection permite al usuario seleccionar horarios de apertura y cierre
const TimePickerSection = ({ settings, handleChange }) => {
  const { themeObject } = useTheme();
  const [openApertura, setOpenApertura] = useState(false);
  const [openCierre, setOpenCierre] = useState(false);
  const [error, setError] = useState("");

  const onConfirmApertura = (time) => {
    const newVal = `${time}:00`;
    handleChange("horario_apertura", newVal);
    setOpenApertura(false);
    setError("");
  };

  const onConfirmCierre = (time) => {
    const newVal = `${time}:00`;
    handleChange("horario_cierre", newVal);
    setOpenCierre(false);
    setError("");
  };

  const formatTime = (timeString) => {
    if (!timeString) return "Seleccionar hora";
    const [hours, minutes] = timeString.split(":");
    return `${hours}:${minutes}`;
  };

  const validateTimes = () => {
    const a = settings.horario_apertura?.slice(0, 5);
    const c = settings.horario_cierre?.slice(0, 5);
    if (a && c && a >= c) {
      setError("La hora de cierre debe ser posterior a la de apertura");
      return false;
    }
    setError("");
    return true;
  };

  return (
    <Card
      style={[styles.card, { backgroundColor: themeObject.colors.surface }]}
    >
      <Card.Title
        title="Horarios de Apertura y Cierre"
        subtitle="Define la disponibilidad del local"
        titleStyle={{ paddingTop: 4, fontWeight: "bold" }}
        left={(props) => (
          <IconButton
            {...props}
            icon="clock-outline"
            size={24}
            iconColor={themeObject.colors.text}
          />
        )}
      />
      <Card.Content>
        <View style={styles.timePickerContainer}>
          <CustomButton
            variant="outline"
            size="lg"
            ionIconLeft="time"
            onPress={() => setOpenApertura(true)}
            style={styles.timeButton}
          >
            Apertura: {formatTime(settings.horario_apertura)}
          </CustomButton>

          <CustomButton
            variant="outline"
            size="lg"
            ionIconLeft="time-outline"
            onPress={() => setOpenCierre(true)}
            style={styles.timeButton}
          >
            Cierre: {formatTime(settings.horario_cierre)}
          </CustomButton>
        </View>

        {!!error && <Text style={styles.error}>{error}</Text>}
        <Text style={styles.hint}>Formato 24h. Ej: 09:00 - 18:00</Text>

        <TimeSelectorModal
          visible={openApertura}
          initialTime={settings.horario_apertura?.slice(0, 5)}
          onConfirm={onConfirmApertura}
          onClose={() => setOpenApertura(false)}
        />

        <TimeSelectorModal
          visible={openCierre}
          initialTime={settings.horario_cierre?.slice(0, 5)}
          onConfirm={(t) => {
            onConfirmCierre(t);
            validateTimes();
          }}
          onClose={() => setOpenCierre(false)}
        />
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 6,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  timePickerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  timeButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  hint: {
    fontSize: 11,
    opacity: 0.7,
    marginTop: 4,
  },
  error: {
    color: "#d32f2f",
    fontSize: 12,
    marginTop: 4,
  },
});

export default TimePickerSection;
