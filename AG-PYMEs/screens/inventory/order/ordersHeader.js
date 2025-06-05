import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import CustomButton from "../../../components/customButton";

// Componente OrdersHeader para la navegación entre vistas de pedidos y proveedores
const OrdersHeader = ({ activeView, onViewChange }) => {
  const { themeObject } = useTheme();
  const styles = createStyles(themeObject);

  return (
    <View style={styles.headerContainer}>
      <View style={styles.buttonsContainer}>
        <CustomButton
          onPress={() => onViewChange("pedidos")}
          variant={activeView === "pedidos" ? "info" : "ghost"}
          size="md"
          compact
          style={styles.button}
          textStyle={styles.buttonText}
          ionIconLeft="list-outline"
        >
          Pedidos
        </CustomButton>

        <CustomButton
          onPress={() => onViewChange("proveedores")}
          variant={activeView === "proveedores" ? "info" : "ghost"}
          size="md"
          compact
          style={styles.button}
          textStyle={styles.buttonText}
          ionIconLeft="people-outline"
        >
          Proveedores
        </CustomButton>
      </View>
    </View>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    headerContainer: {
      backgroundColor: theme.colors.background,
      ...Platform.select({
        web: {
          padding: "0.5rem",

          position: "sticky",
          top: 0,
          zIndex: 1000,
        },
        default: {
          margin: 4,
          paddingHorizontal: 8,
        },
      }),
    },
    buttonsContainer: {
      flexDirection: "row",
      gap: 16,
      justifyContent: "center",
      ...Platform.select({
        web: {
          gap: "1rem",
        },
      }),
    },
    button: {
      flex: 1,
      maxWidth: 200,
      ...Platform.select({
        web: {
          transition: "all 0.2s ease",
          ":hover": {
            transform: "translateY(-2px)",
          },
        },
      }),
    },
    buttonText: {
      ...Platform.select({
        web: {
          userSelect: "none",
        },
      }),
    },
  });

export default OrdersHeader;
