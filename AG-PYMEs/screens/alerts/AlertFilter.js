import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  Modal,
  Dimensions,
  Platform,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import CustomButton from "../../components/customButton";

// Componente de filtro para las alertas
const AlertFilter = ({ filters, onFilterChange }) => {
  const { themeObject } = useTheme();
  const [showFilterModal, setShowFilterModal] = useState(false);
  const { width } = Dimensions.get("window");
  const isMobile = Platform.OS !== "web" || width < 768;

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

  const getActiveFiltersText = () => {
    const estadoLabel =
      filterOptions.find((f) => f.id === filters.estado)?.label || "Todos";
    const tipoLabel =
      typeOptions.find((f) => f.id === filters.tipo)?.label || "Todos";
    return `${estadoLabel} • ${tipoLabel}`;
  };

  const handleFilterChange = (key, value) => {
    onFilterChange(key, value);
    if (isMobile) {
      setShowFilterModal(false);
    }
  };

  // Versión para escritorio (como antes)
  const DesktopFilters = () => (
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

  // Versión para móvil (con modal)
  const MobileFilters = () => (
    <View style={styles.mobileContainer}>
      <CustomButton
        variant="outline"
        size="md"
        ionIconLeft="filter-outline"
        onPress={() => setShowFilterModal(true)}
        style={styles.filterTriggerButton}
      >
        Filtros: {getActiveFiltersText()}
      </CustomButton>

      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: themeObject.colors.surface },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text
                style={[styles.modalTitle, { color: themeObject.colors.text }]}
              >
                Filtrar Alertas
              </Text>
              <CustomButton
                variant="ghost"
                size="sm"
                ionIconLeft="close"
                onPress={() => setShowFilterModal(false)}
              />
            </View>

            <View style={styles.modalBody}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: themeObject.colors.text },
                ]}
              >
                Estado
              </Text>
              <View style={styles.modalFilterRow}>
                {filterOptions.map((option) => (
                  <CustomButton
                    key={option.id}
                    variant={
                      filters.estado === option.id ? "primary" : "outline"
                    }
                    size="sm"
                    onPress={() => handleFilterChange("estado", option.id)}
                    style={styles.modalFilterButton}
                  >
                    {option.label}
                  </CustomButton>
                ))}
              </View>

              <Text
                style={[
                  styles.sectionTitle,
                  { color: themeObject.colors.text },
                ]}
              >
                Tipo
              </Text>
              <View style={styles.modalFilterRow}>
                {typeOptions.map((option) => (
                  <CustomButton
                    key={option.id}
                    variant={filters.tipo === option.id ? "primary" : "outline"}
                    size="sm"
                    ionIconLeft={option.icon}
                    onPress={() => handleFilterChange("tipo", option.id)}
                    style={styles.modalFilterButton}
                  >
                    {option.label}
                  </CustomButton>
                ))}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  return isMobile ? <MobileFilters /> : <DesktopFilters />;
};

const styles = StyleSheet.create({
  // Estilos para escritorio (originales)
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

  // Estilos para móvil
  mobileContainer: {
    padding: 16,
  },
  filterTriggerButton: {
    width: "100%",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  modalBody: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    marginTop: 16,
  },
  modalFilterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  modalFilterButton: {
    minWidth: 100,
    marginBottom: 8,
  },
});

export default AlertFilter;
