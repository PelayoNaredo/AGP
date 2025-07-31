import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  withTiming,
  FadeInUp,
} from "react-native-reanimated";
import HeaderWithTabs from "../../components/HeaderWithTabs";
import SearchHeaderBar from "../../components/searchHeaderBar";
import EmployeesBody from "./employee/employeesBody";
import LeavesBody from "./leave/leavesBody";
import { useTheme } from "../../context/ThemeContext";
import { Services } from "../../api/index";

const EmployeeScreen = () => {
  const { themeObject } = useTheme();
  const [activeView, setActiveView] = useState("employees");
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para SearchHeaderBar
  const [currentSearchQuery, setCurrentSearchQuery] = useState("");

  // Referencias para los componentes hijos
  const employeesBodyRef = useRef(null);
  const leavesBodyRef = useRef(null);

  // Valores compartidos para animaciones
  const employeesOpacity = useSharedValue(1);
  const employeesTranslateX = useSharedValue(0);
  const leavesOpacity = useSharedValue(0);
  const leavesTranslateX = useSharedValue(300);

  const tabs = [
    {
      value: "employees",
      label: "Empleados",
      activeIcon: "person",
      inactiveIcon: "person-outline",
    },
    {
      value: "leaves",
      label: "Bajas",
      activeIcon: "medical",
      inactiveIcon: "medical-outline",
    },
  ];

  // Función para manejar el cambio de vista con animaciones
  const handleViewChange = (newView) => {
    if (newView === activeView) return;

    const isGoingToEmployees = newView === "employees";

    if (isGoingToEmployees) {
      // Mostrar empleados, ocultar bajas
      employeesOpacity.value = withTiming(1, { duration: 300 });
      employeesTranslateX.value = withTiming(0, { duration: 300 });
      leavesOpacity.value = withTiming(0, { duration: 300 });
      leavesTranslateX.value = withTiming(300, { duration: 300 });
    } else {
      // Mostrar bajas, ocultar empleados
      leavesOpacity.value = withTiming(1, { duration: 300 });
      leavesTranslateX.value = withTiming(0, { duration: 300 });
      employeesOpacity.value = withTiming(0, { duration: 300 });
      employeesTranslateX.value = withTiming(-300, { duration: 300 });
    }

    setActiveView(newView);
    // Limpiar búsqueda al cambiar de vista
    setCurrentSearchQuery("");
  };
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [employeesData, leavesData] = await Promise.all([
        Services.Data.Employees.getAll(),
        Services.Data.Leaves.getAll(),
      ]);

      // Asegurarse de que los datos son arrays
      setEmployees(Array.isArray(employeesData) ? employeesData : []);
      setLeaves(Array.isArray(leavesData) ? leavesData : []);
    } catch (err) {
      console.error("Error cargando datos:", err);
      setError(err.message || "Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEmployeeUpdate = () => {
    loadData(); // Recargar todos los datos cuando hay cambios
  };

  // Configuración de SearchHeaderBar según la vista activa
  const getSearchHeaderConfig = () => {
    if (activeView === "employees") {
      return {
        buttonText: "Nuevo Empleado",
        buttonIconName: "add-circle-outline",
        buttonVariant: "info",
        searchPlaceholder: "Buscar (DNI, Nombre, etc.)...",
        onButtonPress: () => employeesBodyRef.current?.openModal?.(),
      };
    } else {
      return {
        buttonText: "Nueva Baja",
        buttonIconName: "add-circle-outline",
        buttonVariant: "info",
        searchPlaceholder: "Buscar por nombre de empleado...",
        onButtonPress: () => leavesBodyRef.current?.openModal?.(),
      };
    }
  };

  const searchConfig = getSearchHeaderConfig();
  const renderContent = () => {
    return (
      <>
        {/* EmployeesBody - siempre renderizado */}
        <Animated.View
          style={[
            styles.contentView,
            {
              opacity: employeesOpacity,
              transform: [{ translateX: employeesTranslateX }],
              pointerEvents: activeView === "employees" ? "auto" : "none",
            },
          ]}
        >
          <EmployeesBody
            ref={employeesBodyRef}
            employees={employees}
            loading={loading}
            error={error}
            onEmployeeUpdate={handleEmployeeUpdate}
            hideSearchBar={true}
            externalSearchQuery={currentSearchQuery}
          />
        </Animated.View>

        {/* LeavesBody - siempre renderizado */}
        <Animated.View
          style={[
            styles.contentView,
            {
              opacity: leavesOpacity,
              transform: [{ translateX: leavesTranslateX }],
              pointerEvents: activeView === "leaves" ? "auto" : "none",
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            },
          ]}
        >
          <LeavesBody
            ref={leavesBodyRef}
            employees={employees}
            leaves={leaves}
            loading={loading}
            error={error}
            onLeaveUpdate={handleEmployeeUpdate}
            hideSearchBar={true}
            externalSearchQuery={currentSearchQuery}
          />
        </Animated.View>
      </>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeObject.colors.background,
    },
    contentView: {
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
      {/* Header */}
      <HeaderWithTabs
        title="Empleados"
        tabs={tabs}
        activeView={activeView}
        onChangeView={handleViewChange}
      />

      {/* SearchHeaderBar unificado */}
      <SearchHeaderBar
        searchQuery={currentSearchQuery}
        setSearchQuery={setCurrentSearchQuery}
        onButtonPress={searchConfig.onButtonPress}
        buttonText={searchConfig.buttonText}
        buttonIconName={searchConfig.buttonIconName}
        buttonVariant={searchConfig.buttonVariant}
        searchPlaceholder={searchConfig.searchPlaceholder}
      />

      {/* Contenido con componentes persistentes */}
      <View style={styles.contentContainer}>{renderContent()}</View>
    </Animated.View>
  );
};

export default EmployeeScreen;
