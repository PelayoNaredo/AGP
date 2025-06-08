import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, Pressable, Linking } from "react-native";
import { Card, List, Avatar, IconButton } from "react-native-paper";
import { useTheme } from "../../../context/ThemeContext";
import { formatPhoneNumber } from "../../../utils/helpers";
import PopupMenu, { MenuItem } from "../../../components/popupMenu";

const SupplierCard = ({ supplier, onSelect, onDelete }) => {
  const { themeObject } = useTheme();
  const styles = createStyles(themeObject);
  const [menuVisible, setMenuVisible] = useState(false);
  const menuIconRef = useRef(null);

  // Obtiene las iniciales del nombre del proveedor para el avatar
  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Función para abrir el sitio web del proveedor
  const openWebsite = () => {
    if (supplier.sitio_web) {
      // Asegurarnos de que la URL tenga el formato correcto
      let url = supplier.sitio_web;
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }
      Linking.openURL(url).catch((err) =>
        console.error("Error al abrir el sitio web:", err)
      );
    }
  };

  return (
    <Card style={styles.supplierCard} elevation={3}>
      <Pressable
        onPress={() => onSelect(supplier)}
        style={({ pressed }) => [
          styles.cardContent,
          pressed && styles.cardPressed,
        ]}
      >
        <View style={styles.headerContainer}>
          <Avatar.Text
            size={50}
            label={getInitials(supplier.nombre_proveedor)}
            style={styles.avatar}
            labelStyle={styles.avatarText}
            color={themeObject.colors.buttonWhite}
            backgroundColor={themeObject.colors.primary}
          />
          <View style={styles.titleContainer}>
            <Text style={styles.supplierTitle}>
              {supplier.nombre_proveedor}
            </Text>
            <Text style={styles.cif}>CIF: {supplier.cif}</Text>
          </View>
          <View style={styles.headerActionsContainer}>
            <Text
              style={[
                styles.statusText,
                {
                  backgroundColor: supplier.activo
                    ? themeObject.colors.success
                    : themeObject.colors.error,
                },
              ]}
            >
              {supplier.activo ? "Activo" : "Inactivo"}
            </Text>
            <PopupMenu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <IconButton
                  ref={menuIconRef}
                  icon="dots-vertical"
                  iconColor={themeObject.colors.text}
                  size={24}
                  style={styles.menuButton}
                  onPress={() => setMenuVisible(true)}
                />
              }
            >
              <MenuItem
                title="Editar"
                leadingIcon="create-outline"
                iconColor={themeObject.colors.info}
                onPress={() => {
                  setMenuVisible(false);
                  onSelect(supplier);
                }}
              />
              <MenuItem
                title="Eliminar"
                leadingIcon="trash-outline"
                iconColor={themeObject.colors.error}
                onPress={() => {
                  setMenuVisible(false);
                  onDelete(supplier.id_proveedor);
                }}
              />
            </PopupMenu>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.detailsContainer}>
          <View style={styles.detailColumn}>
            <View style={styles.detailItem}>
              <List.Icon
                icon="account"
                color={themeObject.colors.primary}
                size={20}
              />
              <Text style={styles.detailText}>
                {" "}
                {supplier.contacto || "Sin contacto"}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <List.Icon
                icon="phone"
                color={themeObject.colors.primary}
                size={20}
              />
              <Text style={styles.detailText}>
                {" "}
                {supplier.telefono
                  ? formatPhoneNumber(supplier.telefono)
                  : "Sin teléfono"}
              </Text>
            </View>
          </View>

          <View style={styles.detailColumn}>
            <View style={styles.detailItem}>
              <List.Icon
                icon="email"
                color={themeObject.colors.primary}
                size={20}
              />
              <Text style={styles.detailText}>
                {" "}
                {supplier.email || "Sin email"}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <List.Icon
                icon="map-marker"
                color={themeObject.colors.primary}
                size={20}
              />
              <Text style={styles.detailText} numberOfLines={1}>
                {" "}
                {supplier.direccion_fiscal || "Sin dirección"}
              </Text>
            </View>
          </View>
        </View>
        {supplier.sitio_web && (
          <Pressable onPress={openWebsite} style={styles.websiteContainer}>
            <List.Icon
              icon="web"
              color={themeObject.colors.primary}
              size={20}
            />
            <Text style={styles.websiteText}> {supplier.sitio_web}</Text>
          </Pressable>
        )}
      </Pressable>
    </Card>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    supplierCard: {
      margin: 8,
      borderRadius: 10,
      backgroundColor: theme.colors.surface,
      overflow: "hidden",
    },
    cardContent: {
      padding: 16,
    },
    cardPressed: {
      opacity: 0.9,
      backgroundColor: theme.colors.surfaceVariant,
    },
    headerContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    avatar: {
      marginRight: 12,
    },
    avatarText: {
      fontWeight: "bold",
    },
    titleContainer: {
      flex: 1,
    },
    supplierTitle: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: "600",
    },
    cif: {
      color: theme.colors.placeholder,
      fontSize: 13,
      marginTop: 2,
    },
    headerActionsContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    statusText: {
      color: theme.colors.buttonWhite,
      textAlign: "center",
      fontSize: 12,
      fontWeight: "500",
      borderRadius: 20,
      padding: 6,
      paddingHorizontal: 12,
    },
    menuButton: {
      margin: 0,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.divider || theme.colors.disabled,
      marginVertical: 12,
    },
    detailsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    detailColumn: {
      flex: 1,
    },
    detailItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    detailText: {
      color: theme.colors.text,
      fontSize: 14,
      flex: 1,
    },
    websiteContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      marginTop: 4,
      borderRadius: 8,
    },
    websiteText: {
      color: theme.colors.primary,
      fontSize: 14,
      textDecorationLine: "underline",
      flex: 1,
    },
  });

export default SupplierCard;
