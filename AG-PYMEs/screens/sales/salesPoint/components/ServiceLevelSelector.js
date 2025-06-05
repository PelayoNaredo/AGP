import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
} from "react-native";
import { useTheme } from "../../../../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import CustomButton from "../../../../components/customButton";

//Modal para seleccionar un nivel de servicio
const ServiceLevelSelector = ({ visible, onClose, service, onSelectLevel }) => {
  const { themeObject } = useTheme();
  const [selectedLevel, setSelectedLevel] = useState(null);

  const handleConfirm = () => {
    if (selectedLevel) {
      onSelectLevel(selectedLevel);
    }
    onClose();
  };

  const styles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
      width: "90%",
      maxWidth: 500,
      backgroundColor: themeObject.colors.surface,
      borderRadius: themeObject.roundness,
      padding: 20,
      elevation: 5,
      maxHeight: "80%",
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 16,
      color: themeObject.colors.text,
    },
    levelItem: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: themeObject.colors.border,
      flexDirection: "row",
      alignItems: "center",
    },
    selectedLevelItem: {
      backgroundColor: themeObject.colors.primaryLight,
    },
    levelInfo: {
      flex: 1,
    },
    levelName: {
      fontSize: 16,
      fontWeight: "500",
      color: themeObject.colors.text,
    },
    levelDescription: {
      fontSize: 14,
      color: themeObject.colors.placeholder,
      marginVertical: 4,
    },
    levelPrice: {
      fontSize: 14,
      color: themeObject.colors.primary,
      fontWeight: "bold",
    },
    levelTime: {
      fontSize: 12,
      color: themeObject.colors.placeholder,
    },
    radioIcon: {
      marginRight: 12,
    },
    serviceName: {
      fontSize: 16,
      marginBottom: 8,
      color: themeObject.colors.text,
    },
    buttonsContainer: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginTop: 20,
      gap: 10,
    },
    emptyLevels: {
      textAlign: "center",
      color: themeObject.colors.placeholder,
      marginVertical: 20,
    },
  });

  if (!service) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Seleccionar nivel de servicio</Text>
          <Text style={styles.serviceName}>{service.nombre_servicio}</Text>

          {!service.niveles || service.niveles.length === 0 ? (
            <Text style={styles.emptyLevels}>
              Este servicio no tiene niveles definidos
            </Text>
          ) : (
            <ScrollView>
              {service.niveles.map((level) => (
                <Pressable
                  key={level.id_nivel}
                  style={[
                    styles.levelItem,
                    selectedLevel === level && styles.selectedLevelItem,
                  ]}
                  onPress={() => setSelectedLevel(level)}
                >
                  <Ionicons
                    name={
                      selectedLevel === level
                        ? "radio-button-on"
                        : "radio-button-off"
                    }
                    size={24}
                    color={themeObject.colors.primary}
                    style={styles.radioIcon}
                  />
                  <View style={styles.levelInfo}>
                    <Text style={styles.levelName}>{level.nombre_nivel}</Text>
                    {level.descripcion && (
                      <Text style={styles.levelDescription}>
                        {level.descripcion}
                      </Text>
                    )}
                    <Text style={styles.levelPrice}>
                      {parseFloat(level.precio).toFixed(2)} €
                    </Text>
                    {level.tiempo_estimado_minutos && (
                      <Text style={styles.levelTime}>
                        Duración: {level.tiempo_estimado_minutos} min
                      </Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}

          <View style={styles.buttonsContainer}>
            <CustomButton
              variant="outline"
              onPress={onClose}
              style={{ flex: 1 }}
            >
              Cancelar
            </CustomButton>
            <CustomButton
              variant="primary"
              onPress={handleConfirm}
              disabled={!selectedLevel}
              style={{ flex: 2 }}
            >
              Confirmar
            </CustomButton>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ServiceLevelSelector;
