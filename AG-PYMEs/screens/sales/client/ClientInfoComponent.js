import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

//Componente reutilizable para mostrar información de un cliente
const ClientInfoComponent = ({
  client,
  customStyles = {},
  showDetailedInfo = false,
}) => {
  const { themeObject } = useTheme();

  const styles = StyleSheet.create({
    clientInfoContainer: {
      backgroundColor: themeObject.colors.surface,
      padding: 12,
      borderRadius: themeObject.roundness,
      marginBottom: 16,
      ...customStyles.container,
    },
    clientName: {
      fontSize: 14,
      fontWeight: "500",
      color: themeObject.colors.text,
      ...customStyles.name,
    },
    clientEmail: {
      fontSize: 14,
      color: themeObject.colors.placeholder,
      ...customStyles.email,
    },
    noClientText: {
      color: themeObject.colors.placeholder,
      textAlign: "center",
      padding: 8,
      ...customStyles.noClientText,
    },
    detailItem: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
      ...customStyles.detailItem,
    },
    detailText: {
      fontSize: 13,
      marginLeft: 6,
      color: themeObject.colors.text,
      ...customStyles.detailText,
    },
    clientType: {
      fontSize: 12,
      color: themeObject.colors.primary,
      marginTop: 4,
      ...customStyles.clientType,
    },
  });

  if (!client) {
    return (
      <Text style={styles.noClientText}>
        No hay cliente seleccionado (venta anónima)
      </Text>
    );
  }

  return (
    <View style={styles.clientInfoContainer}>
      <Text style={styles.clientName}>
        {client.nombre} {client.apellido}
        {client.tipo_cliente !== "particular" && (
          <Text style={{ fontStyle: "italic" }}>
            {" "}
            • {client.tipo_cliente === "empresa" ? "Empresa" : "Autónomo"}
          </Text>
        )}
      </Text>

      {client.email && <Text style={styles.clientEmail}>{client.email}</Text>}

      {showDetailedInfo && (
        <>
          {client.telefono && (
            <View style={styles.detailItem}>
              <Ionicons
                name="call-outline"
                size={16}
                color={themeObject.colors.placeholder}
              />
              <Text style={styles.detailText}>{client.telefono}</Text>
            </View>
          )}

          {client.direccion && (
            <View style={styles.detailItem}>
              <Ionicons
                name="location-outline"
                size={16}
                color={themeObject.colors.placeholder}
              />
              <Text style={styles.detailText}>
                {client.direccion}, {client.codigo_postal} {client.ciudad}
              </Text>
            </View>
          )}

          {client.documento && (
            <View style={styles.detailItem}>
              <Ionicons
                name="document-text-outline"
                size={16}
                color={themeObject.colors.placeholder}
              />
              <Text style={styles.detailText}>
                {client.tipo_documento}: {client.documento}
              </Text>
            </View>
          )}

          {client.descuento_preferencial > 0 && (
            <View style={styles.detailItem}>
              <Ionicons
                name="pricetag-outline"
                size={16}
                color={themeObject.colors.placeholder}
              />
              <Text style={styles.detailText}>
                Descuento: {client.descuento_preferencial}%
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
};

export default ClientInfoComponent;
