import React, { useState, useEffect } from "react";
import { View, Text, Modal, StyleSheet, Platform } from "react-native";
import { Picker } from "@react-native-picker/picker";
import CustomButton from "./customButton";
import { useTheme } from "../context/ThemeContext";

const TimeSelectorModal = ({
  visible,
  initialTime = "00:00",
  onConfirm,
  onClose,
}) => {
  const { themeObject } = useTheme();
  const [selectedHour, setSelectedHour] = useState("00");
  const [selectedMinute, setSelectedMinute] = useState("00");

  useEffect(() => {
    if (visible && initialTime) {
      const [hours = "00", minutes = "00"] = (initialTime || "").split(":");
      setSelectedHour(hours.padStart(2, "0"));
      setSelectedMinute(minutes.padStart(2, "0"));
    }
  }, [visible, initialTime]);

  const hours = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0")
  );
  const minutes = Array.from({ length: 60 }, (_, i) =>
    i.toString().padStart(2, "0")
  );

  const handleConfirm = () => {
    if (typeof onConfirm === "function") {
      const time = `${selectedHour}:${selectedMinute}`;
      onConfirm(time);
    }
  };

  const handleCancel = () => {
    if (typeof onClose === "function") {
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: themeObject.colors.surface },
          ]}
        >
          <Text style={[styles.modalTitle, { color: themeObject.colors.text }]}>
            Seleccionar Hora
          </Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedHour}
              onValueChange={setSelectedHour}
              style={[
                styles.picker,
                {
                  color: themeObject.colors.text,
                  backgroundColor: themeObject.colors.surface,
                },
              ]}
              itemStyle={styles.pickerItem}
            >
              {hours.map((hour) => (
                <Picker.Item key={hour} label={hour} value={hour} />
              ))}
            </Picker>

            <Text
              style={[styles.separator, { color: themeObject.colors.text }]}
            >
              :
            </Text>

            <Picker
              selectedValue={selectedMinute}
              onValueChange={setSelectedMinute}
              style={[
                styles.picker,
                {
                  color: themeObject.colors.text,
                  backgroundColor: themeObject.colors.surface,
                },
              ]}
              itemStyle={styles.pickerItem}
            >
              {minutes.map((minute) => (
                <Picker.Item key={minute} label={minute} value={minute} />
              ))}
            </Picker>
          </View>

          <View style={styles.buttonContainer}>
            <CustomButton
              variant="ghost"
              onPress={handleCancel}
              style={styles.button}
              ionIconLeft="close-outline"
            >
              Cancelar
            </CustomButton>
            <CustomButton
              variant="primary"
              onPress={handleConfirm}
              style={styles.button}
              ionIconLeft="checkmark-outline"
            >
              Confirmar
            </CustomButton>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    maxWidth: 400,
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  picker: {
    width: Platform.OS === "web" ? 80 : 60,
    height: Platform.OS === "web" ? 80 : 60,
    textAlign: "center",
  },
  pickerItem: {
    fontSize: 22,
    fontWeight: "500",
  },
  separator: {
    fontSize: 28,
    fontWeight: "bold",
    marginHorizontal: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
    gap: 8,
  },
  button: {
    flex: 1,
    borderRadius: 10,
  },
});

export default TimeSelectorModal;
