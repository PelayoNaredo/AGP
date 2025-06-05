import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../../../context/ThemeContext";
import CustomButton from "../../../../components/customButton";

// Componente PrinterStatus para mostrar el estado de la impresora
const PrinterStatus = ({ printer, onDisconnect, onConnect }) => {
  const { themeObject } = useTheme();

  return (
    <View style={styles.container}>
      {printer ? (
        <View
          style={[
            styles.statusContainer,
            { borderColor: themeObject.colors.border },
          ]}
        >
          <View style={styles.infoContainer}>
            <Text
              style={[styles.statusText, { color: themeObject.colors.text }]}
            >
              Impresora: {printer.name}
            </Text>
            <Text
              style={[
                styles.statusDetails,
                { color: themeObject.colors.placeholder },
              ]}
            >
              {printer.address}
            </Text>
          </View>
          <CustomButton
            variant="outline"
            size="sm"
            onPress={onDisconnect}
            ionIconLeft="bluetooth"
          >
            Desconectar
          </CustomButton>
        </View>
      ) : (
        <CustomButton
          variant="info"
          ionIconLeft="bluetooth"
          onPress={onConnect}
          style={styles.connectButton}
        >
          Conectar impresora de tickets
        </CustomButton>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
  },
  infoContainer: {
    flex: 1,
  },
  statusText: {
    fontWeight: "500",
  },
  statusDetails: {
    fontSize: 12,
    marginTop: 2,
  },
  connectButton: {
    width: "100%",
  },
});

export default PrinterStatus;
