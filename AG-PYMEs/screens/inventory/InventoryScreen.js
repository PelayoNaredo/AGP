import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  FadeInRight,
  FadeOutLeft,
  FadeInUp,
  Layout,
} from "react-native-reanimated";
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
  const renderContent = () => {
    const contentProps = {
      entering: FadeInRight.duration(400).springify(),
      exiting: FadeOutLeft.duration(300),
      layout: Layout.springify(),
      style: styles.contentView,
    };

    return activeView === "productos" ? (
      <Animated.View key={activeView} {...contentProps}>
        <ProductsScreen />
      </Animated.View>
    ) : (
      <Animated.View key={activeView} {...contentProps}>
        <OrdersScreen />
      </Animated.View>
    );
  };
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: themeObject.colors.background },
      ]}
    >
      <Animated.View
        style={styles.content}
        entering={FadeInUp.duration(600).springify()}
      >
        {/* Header sin animaciones */}
        <HeaderWithTabs
          title="Inventario"
          tabs={tabs}
          activeView={activeView}
          onChangeView={setActiveView}
        />
        {renderContent()}
      </Animated.View>
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
  contentView: {
    flex: 1,
  },
});

export default InventoryScreen;
