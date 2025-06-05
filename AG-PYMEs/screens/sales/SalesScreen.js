import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import HeaderWithTabs from "../../components/HeaderWithTabs";
import SalesPointScreen from "./salesPoint/SalesPointScreen";
import SalesHistoryScreen from "./history/SalesHistoryScreen";
import ClientsScreen from "./client/ClientsScreen";
import ServicesScreen from "./service/ServicesScreen";

// Pagina principal de ventas
// Contiene las diferentes vistas de ventas: Punto de Venta, Historial, Clientes y Servicios
const SalesScreen = () => {
  const { themeObject } = useTheme();
  const [activeView, setActiveView] = useState("punto-venta");

  const tabs = [
    {
      value: "punto-venta",
      label: "Punto de Venta",
      activeIcon: "cart-outline",
      inactiveIcon: "cart-outline",
    },
    {
      value: "historial",
      label: "Historial",
      activeIcon: "receipt",
      inactiveIcon: "receipt-outline",
    },
    {
      value: "clientes",
      label: "Clientes",
      activeIcon: "people",
      inactiveIcon: "people-outline",
    },
    {
      value: "servicios",
      label: "Servicios",
      activeIcon: "construct",
      inactiveIcon: "construct-outline",
    },
  ];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: themeObject.colors.background },
      ]}
    >
      <View style={styles.content}>
        <HeaderWithTabs
          title="Ventas"
          tabs={tabs}
          activeView={activeView}
          onChangeView={setActiveView}
        />
        {activeView === "punto-venta" && <SalesPointScreen />}
        {activeView === "historial" && <SalesHistoryScreen />}
        {activeView === "clientes" && <ClientsScreen />}
        {activeView === "servicios" && <ServicesScreen />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default SalesScreen;
