import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import HeaderWithTabs from "../../components/HeaderWithTabs";
import ProductsScreen from "./product/productsScreen";
import OrdersScreen from "./order/ordersScreen";

// Componente principal de Inventario que gestiona productos, pedidos y proveedores
const InventoryScreen = () => {
  const { themeObject } = useTheme();
  const [activeView, setActiveView] = useState("productos");

  const tabs = [
    {
      value: "productos",
      label: "Productos",
      activeIcon: "cart",
      inactiveIcon: "cart-outline",
    },
    {
      value: "pedidos",
      label: "Pedidos",
      activeIcon: "boat",
      inactiveIcon: "boat-outline",
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
          title="Inventario"
          tabs={tabs}
          activeView={activeView}
          onChangeView={setActiveView}
        />
        {activeView === "productos" ? <ProductsScreen /> : <OrdersScreen />}
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

export default InventoryScreen;
