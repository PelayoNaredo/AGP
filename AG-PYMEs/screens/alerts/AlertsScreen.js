import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import AlertCard from "./AlertCard";
import AlertFilter from "./AlertFilter";
import AlertModal from "./alertModal";
import CustomButton from "../../components/customButton";
import { Services } from "../../api/index";

const AlertsScreen = () => {
  const { themeObject } = useTheme();
  const [alerts, setAlerts] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    estado: "todos",
    tipo: "todos",
  });
  const fetchAlerts = async () => {
    try {
      const data = await Services.Data.Alerts.getAll();
      setAlerts(data);
    } catch (error) {
      console.error("Error al cargar alertas:", error);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAlerts();
    setRefreshing(false);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleCompleteAlert = async (alertId) => {
    try {
      // Encontrar la alerta actual en el array de alertas
      const currentAlert = alerts.find(
        (alert) => alert.id_recordatorio === alertId
      );
      if (!currentAlert) return; // Actualizar la alerta manteniendo todos los datos existentes
      await Services.Data.Alerts.update(alertId, {
        ...currentAlert,
        estado:
          currentAlert.estado === "completado" ? "pendiente" : "completado",
      });
      await fetchAlerts();
    } catch (error) {
      console.error("Error al actualizar alerta:", error);
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    const matchesEstado =
      filters.estado === "todos" || alert.estado === filters.estado;
    const matchesTipo = filters.tipo === "todos" || alert.tipo === filters.tipo;
    return matchesEstado && matchesTipo;
  });

  // Función para manejar el envío del formulario
  const handleFormSubmit = async (formData) => {
    try {
      if (editingAlert) {
        // Actualizar alerta existente
        await Services.Data.Alerts.update(
          editingAlert.id_recordatorio,
          formData
        );
      } else {
        // Crear nueva alerta
        await Services.Data.Alerts.create(formData);
      }
      await fetchAlerts();
      setShowCreateForm(false);
      setEditingAlert(null);
    } catch (error) {
      console.error("Error guardando alerta:", error);
    }
  };

  const renderAlertItem = ({ item }) => (
    <AlertCard
      alert={item}
      onPress={() => {
        setEditingAlert(item);
        setShowCreateForm(true);
      }}
      onComplete={() => handleCompleteAlert(item.id_recordatorio)}
    />
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: themeObject.colors.background },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeObject.colors.text }]}>
          Alertas
        </Text>
        <CustomButton
          variant="primary"
          size="sm"
          ionIconLeft="add"
          onPress={() => setShowCreateForm(true)}
        >
          Nueva Alerta
        </CustomButton>
      </View>

      <AlertFilter filters={filters} onFilterChange={handleFilterChange} />

      <FlatList
        data={filteredAlerts}
        keyExtractor={(item) => item.id_recordatorio.toString()}
        renderItem={renderAlertItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text
              style={[styles.emptyText, { color: themeObject.colors.text }]}
            >
              No hay alertas para mostrar
            </Text>
          </View>
        }
      />

      <AlertModal
        visible={showCreateForm}
        initialData={editingAlert}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setShowCreateForm(false);
          setEditingAlert(null);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
});

export default AlertsScreen;
