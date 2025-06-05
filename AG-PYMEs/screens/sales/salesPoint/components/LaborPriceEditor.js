import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useTheme } from "../../../../context/ThemeContext";
import CustomButton from "../../../../components/customButton";

//Modal para editar el precio de un servicio de mano de obra
const LaborPriceEditor = ({ visible, onClose, service, onConfirm }) => {
  const { themeObject } = useTheme();
  const [price, setPrice] = useState(service?.precio_base?.toString() || "");
  const [hours, setHours] = useState("1");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    // Validar el precio
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      setError("Por favor, introduce un precio válido");
      return;
    }

    // Validar las horas
    const hoursValue = parseFloat(hours);
    if (!hours || isNaN(hoursValue) || hoursValue <= 0) {
      setError("Por favor, introduce un número de horas válido");
      return;
    }

    // Crear una copia del servicio con el precio personalizado
    const customService = {
      ...service,
      precio_base: parseFloat(price),
      horas: hoursValue,
      descripcion_personalizada: description,
      precio_personalizado: true,
    };

    onConfirm(customService);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setPrice(service?.precio_base?.toString() || "");
    setHours("1");
    setDescription("");
    setError("");
  };

  const handleClose = () => {
    resetForm();
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
      maxWidth: 400,
      backgroundColor: themeObject.colors.surface,
      borderRadius: themeObject.roundness,
      padding: 20,
      elevation: 5,
    },
    title: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 16,
      color: themeObject.colors.text,
    },
    serviceName: {
      fontSize: 16,
      marginBottom: 20,
      color: themeObject.colors.text,
    },
    inputContainer: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      marginBottom: 8,
      color: themeObject.colors.text,
    },
    input: {
      borderWidth: 1,
      borderColor: themeObject.colors.border,
      borderRadius: themeObject.roundness,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      color: themeObject.colors.text,
      backgroundColor: themeObject.colors.background,
    },
    descriptionInput: {
      height: 100,
      textAlignVertical: "top",
    },
    errorText: {
      color: themeObject.colors.error,
      marginTop: 4,
      fontSize: 14,
    },
    buttonsContainer: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginTop: 20,
      gap: 10,
    },
    row: {
      flexDirection: "row",
      gap: 10,
    },
    halfInput: {
      flex: 1,
    },
    infoText: {
      fontSize: 12,
      color: themeObject.colors.placeholder,
      marginTop: 4,
    },
  });

  if (!service) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Editar precio de mano de obra</Text>
            <Text style={styles.serviceName}>{service.nombre_servicio}</Text>

            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.halfInput]}>
                <Text style={styles.label}>Precio por hora (€)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  value={price}
                  onChangeText={(text) => {
                    setPrice(text);
                    setError("");
                  }}
                  placeholder="0.00"
                  placeholderTextColor={themeObject.colors.placeholder}
                />
              </View>

              <View style={[styles.inputContainer, styles.halfInput]}>
                <Text style={styles.label}>Horas estimadas</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  value={hours}
                  onChangeText={(text) => {
                    setHours(text);
                    setError("");
                  }}
                  placeholder="1"
                  placeholderTextColor={themeObject.colors.placeholder}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Descripción del trabajo (opcional)
              </Text>
              <TextInput
                style={[styles.input, styles.descriptionInput]}
                value={description}
                onChangeText={setDescription}
                placeholder="Añade detalles del servicio a realizar..."
                placeholderTextColor={themeObject.colors.placeholder}
                multiline
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Text style={styles.infoText}>
              Precio total estimado:{" "}
              {parseFloat(price || 0) * parseFloat(hours || 0)} €
            </Text>

            <View style={styles.buttonsContainer}>
              <CustomButton
                variant="outline"
                onPress={handleClose}
                style={{ flex: 1 }}
              >
                Cancelar
              </CustomButton>
              <CustomButton
                variant="primary"
                onPress={handleConfirm}
                style={{ flex: 2 }}
              >
                Confirmar
              </CustomButton>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default LaborPriceEditor;
