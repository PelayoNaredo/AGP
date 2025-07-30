import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  RefreshControl,
  Pressable,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
  SlideOutLeft,
  ZoomIn,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import AlertCard from "./AlertCard";
import AlertFilter from "./AlertFilter";
import AlertModal from "./alertModal";
import CustomButton from "../../components/customButton";
import { Services } from "../../api/index";

const AlertsScreen = () => {
  const { themeObject } = useTheme();
  const navigation = useNavigation();
  const [alerts, setAlerts] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    estado: "todos",
    tipo: "todos",
  });

  const [isInitialLoad, setIsInitialLoad] = useState(true);

  /**
   * Fetch de alertas con cache optimizado
   * Mantiene la misma interfaz pero usa cache internamente
   */
  const fetchAlerts = useCallback(async (forceRefresh = false) => {
    try {
      // Verificación defensiva para Services
      if (!Services || !Services.Data || !Services.Data.Alerts) {
        console.error(
          "[ALERTS_SCREEN]   Services.Data.Alerts no está disponible"
        );
        return;
      }

      const startTime = Date.now();

      // Usar servicio optimizado con cache
      const data = await Services.Data.Alerts.getAll(forceRefresh);

      const duration = Date.now() - startTime;

      setAlerts(data || []);
      setIsInitialLoad(false);
    } catch (error) {
      console.error("Error al cargar alertas:", error);
      setIsInitialLoad(false);
    }
  }, []);

  // Solo cargar en focus si es la primera vez o no hay datos
  useFocusEffect(
    useCallback(() => {
      // Solo cargar si realmente es necesario
      if (isInitialLoad) {
        fetchAlerts();
      }
      // No recargar si ya tenemos datos y no es la primera vez
    }, [fetchAlerts, isInitialLoad])
  );

  /**
   * Refresh optimizado - fuerza actualización desde servidor
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAlerts(true); // Force refresh para pull-to-refresh
    setRefreshing(false);
  }, [fetchAlerts]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleCompleteAlert = useCallback(
    async (alertId) => {
      try {
        // Encontrar la alerta actual en el array de alertas
        const currentAlert = alerts.find(
          (alert) => alert.id_recordatorio === alertId
        );
        if (!currentAlert) return;

        // Actualizar la alerta manteniendo todos los datos existentes
        await Services.Data.Alerts.update(alertId, {
          ...currentAlert,
          estado:
            currentAlert.estado === "completado" ? "pendiente" : "completado",
        });

        // Refresh después de modificación (invalida cache automáticamente)
        await fetchAlerts(false); // No forzar, el cache ya se invalidó
      } catch (error) {
        console.error("Error al actualizar alerta:", error);
      }
    },
    [alerts, fetchAlerts]
  );

  // Memoizar el filtrado para evitar recálculos innecesarios
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchesEstado =
        filters.estado === "todos" || alert.estado === filters.estado;
      const matchesTipo =
        filters.tipo === "todos" || alert.tipo === filters.tipo;
      return matchesEstado && matchesTipo;
    });
  }, [alerts, filters]);

  // Función para manejar el envío del formulario
  const handleFormSubmit = useCallback(
    async (formData) => {
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

        // Refresh después de modificación
        await fetchAlerts(false); // Cache se invalida automáticamente
        setShowCreateForm(false);
        setEditingAlert(null);
      } catch (error) {
        console.error("Error guardando alerta:", error);
      }
    },
    [editingAlert, fetchAlerts]
  );

  const renderAlertItem = useCallback(
    ({ item, index }) => (
      <Animated.View
        entering={FadeInDown.delay(index * 100)
          .duration(500)
          .springify()}
        exiting={SlideOutLeft.duration(300)}
        layout={Layout.springify()}
      >
        <AlertCard
          alert={item}
          onPress={() => {
            setEditingAlert(item);
            setShowCreateForm(true);
          }}
          onComplete={() => handleCompleteAlert(item.id_recordatorio)}
        />
      </Animated.View>
    ),
    [handleCompleteAlert]
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: themeObject.colors.background },
      ]}
    >
      <Animated.View
        style={styles.header}
        entering={FadeInUp.duration(600).springify()}
      >
        <View style={styles.leftSection}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon name="arrow-left" size={24} color={themeObject.colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: themeObject.colors.text }]}>
            Alertas
          </Text>
        </View>
        {/* Botón sin animaciones */}
        <CustomButton
          variant="primary"
          size="sm"
          ionIconLeft="add"
          onPress={() => setShowCreateForm(true)}
        >
          Nueva Alerta
        </CustomButton>
      </Animated.View>

      <ScrollView>
        <Animated.View
          entering={FadeInDown.delay(300).duration(500).springify()}
        >
          <AlertFilter filters={filters} onFilterChange={handleFilterChange} />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).duration(700).springify()}>
          <FlatList
            data={filteredAlerts}
            keyExtractor={(item) => item.id_recordatorio.toString()}
            renderItem={renderAlertItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <Animated.View
                style={styles.emptyContainer}
                entering={ZoomIn.delay(500).duration(600).springify()}
              >
                <Text
                  style={[styles.emptyText, { color: themeObject.colors.text }]}
                >
                  No hay alertas para mostrar
                </Text>
              </Animated.View>
            }
          />
        </Animated.View>
      </ScrollView>

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
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
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

export default React.memo(AlertsScreen);
