import React from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Modal,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useTheme } from "../../../../context/ThemeContext";
import CustomButton from "../../../../components/customButton";

// Componente BluetoothPrinterSelector para seleccionar impresoras Bluetooth
const BluetoothPrinterSelector = ({
  visible,
  onClose,
  printerList,
  isLoading,
  onConnect,
  onRefresh,
}) => {
  const { themeObject } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: themeObject.colors.surface,
              borderRadius: themeObject.roundness,
            },
          ]}
        >
          <Text style={[styles.modalTitle, { color: themeObject.colors.text }]}>
            Seleccionar Impresora
          </Text>

          {printerList.length > 0 ? (
            <FlatList
              data={printerList}
              keyExtractor={(item) => item.address}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => onConnect(item)}
                  style={({ pressed }) => [
                    styles.printerItem,
                    {
                      backgroundColor: pressed
                        ? themeObject.colors.backgroundVariant
                        : "transparent",
                      borderRadius: themeObject.roundness,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.printerName,
                      { color: themeObject.colors.text },
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      styles.printerAddress,
                      { color: themeObject.colors.placeholder },
                    ]}
                  >
                    {item.address}
                  </Text>
                </Pressable>
              )}
              style={styles.printerList}
            />
          ) : isLoading ? (
            <ActivityIndicator
              size="large"
              color={themeObject.colors.primary}
              style={styles.loader}
            />
          ) : (
            <Text
              style={[
                styles.emptyText,
                { color: themeObject.colors.placeholder },
              ]}
            >
              No se encontraron dispositivos
            </Text>
          )}

          <View style={styles.buttonContainer}>
            <CustomButton variant="outline" onPress={onClose}>
              Cancelar
            </CustomButton>
            <CustomButton
              variant="primary"
              onPress={onRefresh}
              isLoading={isLoading}
              ionIconLeft="refresh-outline"
            >
              Buscar
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
    width: "80%",
    maxWidth: 400,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  printerList: {
    maxHeight: 300,
  },
  printerItem: {
    padding: 12,
    marginBottom: 8,
  },
  printerName: {
    fontWeight: "600",
  },
  printerAddress: {
    fontSize: 12,
  },
  emptyText: {
    textAlign: "center",
    marginVertical: 15,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  loader: {
    marginVertical: 20,
  },
});

export default BluetoothPrinterSelector;
