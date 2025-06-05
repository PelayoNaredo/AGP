import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import CustomButton from "../../components/customButton";

// Componente de filtro para las alertas
const AlertFilter = ({ filters, onFilterChange }) => {
  const { themeObject } = useTheme();

  const filterOptions = [
    { id: "todos", label: "Todos" },
    { id: "pendiente", label: "Pendientes" },
    { id: "completado", label: "Completados" },
  ];

  const typeOptions = [
    { id: "todos", label: "Todos", icon: "apps" },
    { id: "inventario", label: "Inventario", icon: "cube" },
    { id: "pago", label: "Pagos", icon: "cash" },
    { id: "horario", label: "Horarios", icon: "time" },
    { id: "pedido", label: "Pedidos", icon: "cart" },
    { id: "empleado", label: "Empleados", icon: "people" },
    { id: "mantenimiento", label: "Mantenimiento", icon: "construct" },
    { id: "otros", label: "Otros", icon: "apps-outline" },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {filterOptions.map((option) => (
          <CustomButton
            key={option.id}
            variant={filters.estado === option.id ? "primary" : "outline"}
            size="sm"
            onPress={() => onFilterChange("estado", option.id)}
            style={styles.filterButton}
          >
            {option.label}
          </CustomButton>
        ))}
      </View>

      <View style={styles.filterRow}>
        {typeOptions.map((option) => (
          <CustomButton
            key={option.id}
            variant={filters.tipo === option.id ? "primary" : "outline"}
            size="sm"
            ionIconLeft={option.icon}
            onPress={() => onFilterChange("tipo", option.id)}
            style={styles.filterButton}
          >
            {option.label}
          </CustomButton>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    minWidth: 100,
  },
});

export default AlertFilter;
