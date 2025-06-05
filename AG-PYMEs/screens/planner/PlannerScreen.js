import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
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
    switch (activeView) {
      case "citas":
        return <AppointmentsScreen />;
      case "turnos":
        return <ShiftsScreen />;
      default:
        return <AppointmentsScreen />;
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
  });

  return (
    <View style={styles.container}>
      <HeaderWithTabs
        title="Planner"
        tabs={tabs}
        activeView={activeView}
        onChangeView={setActiveView}
      />
      <View style={styles.content}>{renderContent()}</View>
    </View>
  );
};

export default PlannerScreen;
