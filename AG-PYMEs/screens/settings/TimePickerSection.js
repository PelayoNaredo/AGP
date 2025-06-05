import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Card, IconButton } from "react-native-paper";
import CustomButton from "../../components/customButton";
import { useTheme } from "../../context/ThemeContext";
import TimeSelectorModal from "../../components/timeSelectorModal";

// Componente TimePickerSection permite al usuario seleccionar horarios de apertura y cierre
const TimePickerSection = ({ settings, handleChange }) => {
  const { themeObject } = useTheme();
  const [openApertura, setOpenApertura] = useState(false);
  const [openCierre, setOpenCierre] = useState(false);

  const onConfirmApertura = (time) => {
    handleChange("horario_apertura", `${time}:00`);
    setOpenApertura(false);
  };

  const onConfirmCierre = (time) => {
    handleChange("horario_cierre", `${time}:00`);
    setOpenCierre(false);
  };

  const formatTime = (timeString) => {
    if (!timeString) return "Seleccionar hora";
    const [hours, minutes] = timeString.split(":");
    return `${hours}:${minutes}`;
  };

  return (
    <Card
      style={[styles.card, { backgroundColor: themeObject.colors.surface }]}
    >
      <Card.Title
        title="Horarios de Apertura y Cierre"
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

        <TimeSelectorModal
          visible={openApertura}
          initialTime={settings.horario_apertura?.slice(0, 5)}
          onConfirm={onConfirmApertura}
          onClose={() => setOpenApertura(false)}
        />

        <TimeSelectorModal
          visible={openCierre}
          initialTime={settings.horario_cierre?.slice(0, 5)}
          onConfirm={onConfirmCierre}
          onClose={() => setOpenCierre(false)}
        />
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 10,
    borderRadius: 10,
  },
  timePickerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  timeButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});

export default TimePickerSection;
