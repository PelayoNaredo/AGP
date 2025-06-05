import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import HeaderWithTabs from "../../components/HeaderWithTabs";
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeObject.colors.background,
    },
  });

  return (
    <View style={styles.container}>
      <HeaderWithTabs
        title="Empleados"
        tabs={tabs}
        activeView={activeView}
        onChangeView={setActiveView}
      />

      {activeView === "employees" ? (
        <EmployeesBody
          employees={employees}
          loading={loading}
          error={error}
          onEmployeeUpdate={handleEmployeeUpdate}
        />
      ) : (
        <LeavesBody
          employees={employees}
          leaves={leaves}
          loading={loading}
          error={error}
          onLeaveUpdate={handleEmployeeUpdate}
        />
      )}
    </View>
  );
};

export default EmployeeScreen;
