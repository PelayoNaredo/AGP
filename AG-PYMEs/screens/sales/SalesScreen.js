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
  const renderContent = () => {
    const contentProps = {
      entering: FadeInRight.duration(400).springify(),
      exiting: FadeOutLeft.duration(300),
      layout: Layout.springify(),
    };

    switch (activeView) {
      case "punto-venta":
        return (
          <Animated.View
            key={activeView}
            style={styles.contentView}
            {...contentProps}
          >
            <SalesPointScreen />
          </Animated.View>
        );
      case "historial":
        return (
          <Animated.View
            key={activeView}
            style={styles.contentView}
            {...contentProps}
          >
            <SalesHistoryScreen />
          </Animated.View>
        );
      case "clientes":
        return (
          <Animated.View
            key={activeView}
            style={styles.contentView}
            {...contentProps}
          >
            <ClientsScreen />
          </Animated.View>
        );
      case "servicios":
        return (
          <Animated.View
            key={activeView}
            style={styles.contentView}
            {...contentProps}
          >
            <ServicesScreen />
          </Animated.View>
        );
      default:
        return (
          <Animated.View style={styles.contentView} {...contentProps}>
            <SalesPointScreen />
          </Animated.View>
        );
    }
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
          title="Ventas"
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

export default SalesScreen;
