import React, { useState, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import ShiftsScreen from "./shifts/ShiftsScreen";
import AppointmentsScreen from "./appointments/AppointmentsScreen";
import HeaderWithTabs from "../../components/HeaderWithTabs";

/**
 * PlannerScreen Optimizada - Evita montaje/desmontaje de subpantallas
 *
 * Estrategias implementadas:
 * 1. Renderizado condicional con visibilidad
 * 2. Estado persistente entre cambios de tab
 * 3. Animaciones optimizadas
 * 4. Pre-renderizado de componentes
 */
const PlannerScreen = () => {
  const { themeObject } = useTheme();
  const [activeView, setActiveView] = useState("citas");

  // Estados compartidos para animaciones
  const citasOpacity = useSharedValue(1);
  const turnosOpacity = useSharedValue(0);
  const citasTranslateX = useSharedValue(0);
  const turnosTranslateX = useSharedValue(100);

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

  // Función optimizada para cambio de vistas
  const handleViewChange = (newView) => {
    if (newView === activeView) return;

    const duration = 300;

    if (newView === "citas") {
      // Animar hacia citas
      citasOpacity.value = withTiming(1, { duration });
      turnosOpacity.value = withTiming(0, { duration });
      citasTranslateX.value = withTiming(0, { duration });
      turnosTranslateX.value = withTiming(100, { duration });
    } else {
      // Animar hacia turnos
      citasOpacity.value = withTiming(0, { duration });
      turnosOpacity.value = withTiming(1, { duration });
      citasTranslateX.value = withTiming(-100, { duration });
      turnosTranslateX.value = withTiming(0, { duration });
    }

    // Actualizar estado inmediatamente
    setActiveView(newView);
  };

  // Estilos animados para cada vista
  const citasAnimatedStyle = useAnimatedStyle(() => ({
    opacity: citasOpacity.value,
    transform: [{ translateX: citasTranslateX.value }],
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: activeView === "citas" ? 2 : 1,
  }));

  const turnosAnimatedStyle = useAnimatedStyle(() => ({
    opacity: turnosOpacity.value,
    transform: [{ translateX: turnosTranslateX.value }],
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: activeView === "turnos" ? 2 : 1,
  }));

  // Memoización de componentes para evitar re-renders innecesarios
  const AppointmentsComponent = useMemo(() => <AppointmentsScreen />, []);

  const ShiftsComponent = useMemo(() => <ShiftsScreen />, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeObject.colors.background,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      flex: 1,
      position: "relative",
    },
  });

  return (
    <Animated.View
      style={styles.container}
      entering={FadeInUp.duration(600).springify()}
    >
      <HeaderWithTabs
        title="Planner"
        tabs={tabs}
        activeView={activeView}
        onChangeView={handleViewChange}
      />

      <View style={styles.content}>
        <View style={styles.contentContainer}>
          {/* Ambos componentes se renderizan siempre, solo cambia la visibilidad */}
          <Animated.View
            style={citasAnimatedStyle}
            pointerEvents={activeView === "citas" ? "auto" : "none"}
          >
            {AppointmentsComponent}
          </Animated.View>
          <Animated.View
            style={turnosAnimatedStyle}
            pointerEvents={activeView === "turnos" ? "auto" : "none"}
          >
            {ShiftsComponent}
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
};

export default PlannerScreen;
