import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  FadeInRight,
  FadeOutLeft,
  FadeInUp,
  Layout,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import ShiftsScreen from "./shifts/ShiftsScreen";
import AppointmentsScreen from "./appointments/AppointmentsScreen";
import HeaderWithTabs from "../../components/HeaderWithTabs";

const PlannerScreen = () => {
  const { themeObject } = useTheme();
  const [activeView, setActiveView] = useState("citas");

  const tabs = [
    {
      label: "Citas",
      value: "citas",
      activeIcon: "calendar",
      inactiveIcon: "calendar-outline",
    },
    {
      label: "Turnos",
      value: "turnos",
      activeIcon: "time",
      inactiveIcon: "time-outline",
    },
  ];
  const renderContent = () => {
    const contentProps = {
      entering: FadeInRight.duration(400).springify(),
      exiting: FadeOutLeft.duration(300),
      layout: Layout.springify(),
      style: styles.contentView,
    };

    switch (activeView) {
      case "citas":
        return (
          <Animated.View key={activeView} {...contentProps}>
            <AppointmentsScreen />
          </Animated.View>
        );
      case "turnos":
        return (
          <Animated.View key={activeView} {...contentProps}>
            <ShiftsScreen />
          </Animated.View>
        );
      default:
        return (
          <Animated.View key={activeView} {...contentProps}>
            <AppointmentsScreen />
          </Animated.View>
        );
    }
  };
  // Definir los estilos dentro del componente para tener acceso a themeObject
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeObject.colors.background,
    },
    content: {
      flex: 1,
    },
    contentView: {
      flex: 1,
    },
  });
  return (
    <Animated.View
      style={styles.container}
      entering={FadeInUp.duration(600).springify()}
    >
      {/* Header sin animaciones */}
      <HeaderWithTabs
        title="Planner"
        tabs={tabs}
        activeView={activeView}
        onChangeView={setActiveView}
      />
      <View style={styles.content}>{renderContent()}</View>
    </Animated.View>
  );
};

export default PlannerScreen;
