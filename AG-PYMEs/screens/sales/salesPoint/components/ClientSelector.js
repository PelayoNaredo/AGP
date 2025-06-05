import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Card } from "react-native-paper";
import { useTheme } from "../../../../context/ThemeContext";
import CustomButton from "../../../../components/customButton";
import ClientInfoComponent from "../../client/ClientInfoComponent";

// Componente ClientSelector para seleccionar o cambiar el cliente en el punto de venta
const ClientSelector = ({ client, onSelectClient, onAddNewClient }) => {
  const { themeObject } = useTheme();

  const styles = StyleSheet.create({
    clientCard: {
      padding: 16,
      marginVertical: 10,
      borderRadius: 10,
      backgroundColor: themeObject.colors.surface,
    },
    clientHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    clientTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: themeObject.colors.text,
    },
    clientInfo: {
      color: themeObject.colors.placeholder,
    },
    buttonsContainer: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 8,
    },
  });

  return (
    <Card style={styles.clientCard}>
      <View style={styles.clientHeader}>
        <Text style={styles.clientTitle}>Cliente</Text>
        <View style={styles.buttonsContainer}>
          <CustomButton
            variant="primary"
            size="sm"
            ionIconLeft="person-outline"
            onPress={onSelectClient}
          >
            {client ? "Cambiar" : "Seleccionar"}
          </CustomButton>
        </View>
      </View>
      <ClientInfoComponent
        client={client}
        customStyles={{
          container: {
            backgroundColor: "transparent",
            padding: 0,
            marginBottom: 0,
          },
        }}
      />
    </Card>
  );
};

export default ClientSelector;
