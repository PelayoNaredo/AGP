import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import CustomButton from "../../../components/customButton";
import SearchHeaderBar from "../../../components/searchHeaderBar";
import { Services } from "../../../api/index";
import IncomesModal from "./incomeModal";
import IncomesCard from "./incomesCard";
import useNotifications from "../../../hooks/useNotifications";

const PAGE_SIZE = 30;

const IncomePage = () => {
  const { themeObject } = useTheme();
  const { showError, showSuccess, showConfirmDialog } = useNotifications();
  const [state, setState] = useState({
    incomes: [],
    searchTerm: "",
    isModalVisible: false,
    selectedIncome: null,
    validationError: "",
    page: 1,
    loading: false,
    hasMore: true,
  });

  // Selector de mes
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    };
  });

  const [initialRenderCount, setInitialRenderCount] = useState(PAGE_SIZE);

  // Estilos dinámicos basados en el tema
  const dynamicStyles = useMemo(
    () => getDynamicStyles(themeObject),
    [themeObject]
  );

  // Cargar ingresos iniciales
  useEffect(() => {
    loadIncomes();
  }, [selectedDate]);
  // Función para navegar entre meses
  const changeMonth = (increment) => {
    // Si el modal de ingreso está abierto, mostrar confirmación antes de cambiar de mes
    if (state.isModalVisible) {
      showConfirmDialog(
        "Cambio de mes",
        "Tienes cambios sin guardar. ¿Deseas continuar sin guardar?",
        () => {
          // Continuar con el cambio de mes
          setSelectedDate((prev) => {
            let newMonth = prev.month + increment;
            let newYear = prev.year;

            if (newMonth > 12) {
              newMonth = 1;
              newYear += 1;
            } else if (newMonth < 1) {
              newMonth = 12;
              newYear -= 1;
            }

            return { month: newMonth, year: newYear };
          });
          // Cerrar el modal
          setState((prev) => ({
            ...prev,
            isModalVisible: false,
            selectedIncome: null,
          }));
        },
        // Función para cancelar (no hace nada)
        () => {}
      );
    } else {
      // Si no hay cambios pendientes, cambiar de mes directamente
      setSelectedDate((prev) => {
        let newMonth = prev.month + increment;
        let newYear = prev.year;

        if (newMonth > 12) {
          newMonth = 1;
          newYear += 1;
        } else if (newMonth < 1) {
          newMonth = 12;
          newYear -= 1;
        }

        return { month: newMonth, year: newYear };
      });
    }
  };

  // Formatear el mes y año actual
  const formatMonthYear = useCallback(() => {
    const date = new Date(selectedDate.year, selectedDate.month - 1);
    return date.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  }, [selectedDate]);
  const loadIncomes = async (page = 1) => {
    try {
      setState((prev) => ({ ...prev, loading: true }));

      // Filtrar ingresos del mes actual (normalmente haría esto con un endpoint específico)
      const response = await Services.Data.Incomes.getAll(page, 9999); // Obtenemos una cantidad mayor para filtrar después

      // Verificar estructura de la respuesta
      if (!response) {
        console.error("[Ingresos] La respuesta es nula o indefinida");
        showError("Error", "La respuesta del servidor es inválida");
        return;
      }

      // Filtrar por mes seleccionado
      const items = response.items || response || [];
      const filteredItems = items.filter((item) => {
        const date = new Date(item.fecha_ingreso);
        return (
          date.getMonth() + 1 === selectedDate.month &&
          date.getFullYear() === selectedDate.year
        );
      });

      setState((prev) => {
        const newState = {
          ...prev,
          incomes: filteredItems,
          hasMore: false, // Ya no necesitamos paginación al filtrar por mes
          page: 1,
        };
        return newState;
      });
    } catch (error) {
      console.error("[Ingresos] Error cargando ingresos:", error);
      showError(
        "Error",
        `No se pudieron cargar los ingresos: ${error.message}`
      );
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  // Confirmar acción de guardar ingreso
  const handleSaveIncome = async (incomeData) => {
    try {
      if (state.selectedIncome) {
        await Services.Data.Incomes.update(
          state.selectedIncome.id_ingreso,
          incomeData
        );
        showSuccess("Ingreso actualizado correctamente");
      } else {
        await Services.Data.Incomes.create(incomeData);
        showSuccess("Nuevo ingreso guardado correctamente");
      }
      setState((prev) => ({
        ...prev,
        isModalVisible: false,
        validationError: "",
      }));
      loadIncomes();
    } catch (error) {
      console.error("[Ingresos] Error guardando ingreso:", error);
      showError("Error", `No se pudo guardar el ingreso: ${error.message}`);
      setState((prev) => ({ ...prev, validationError: "Error al guardar" }));
    }
  };
  // Eliminar un ingreso
  const handleDeleteIncome = (income) => {
    if (!income || !income.id_ingreso) return;

    showConfirmDialog(
      "Eliminar ingreso",
      `¿Estás seguro de que deseas eliminar el ingreso ${income.concepto}?`,
      async () => {
        try {
          await Services.Data.Incomes.delete(income.id_ingreso);
          showSuccess("Ingreso eliminado correctamente");
          loadIncomes();
        } catch (error) {
          console.error("[Ingresos] Error eliminando ingreso:", error);
          showError(
            "Error",
            `No se pudo eliminar el ingreso: ${error.message}`
          );
        }
      }
    );
  };

  // Acciones del Modal
  const handleOpenModal = (income = null) => {
    setState((prev) => ({
      ...prev,
      selectedIncome: income,
      isModalVisible: true,
      validationError: "",
    }));
  };

  // Filtrar ingresos por comentarios
  const filteredIncomes = useMemo(() => {
    const result = !state.searchTerm
      ? state.incomes
      : state.incomes.filter((income) => {
          const comentarios = income.comentarios || "";
          return comentarios
            .toLowerCase()
            .includes(state.searchTerm.toLowerCase());
        });

    // Ordenar por fecha (más reciente primero)
    return [...result].sort(
      (a, b) => new Date(b.fecha_ingreso) - new Date(a.fecha_ingreso)
    );
  }, [state.incomes, state.searchTerm]);

  // Calcular total
  const totalIngresos = useMemo(() => {
    return filteredIncomes
      .reduce((total, income) => total + parseFloat(income.ingresos || 0), 0)
      .toFixed(2);
  }, [filteredIncomes]); // Card de ingreso
  const renderIncomeCard = useCallback(
    ({ item }) => (
      <IncomesCard
        item={item}
        onPress={() => handleOpenModal(item)}
        onDelete={handleDeleteIncome}
      />
    ),
    []
  );
  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <SearchHeaderBar
          searchQuery={state.searchTerm}
          setSearchQuery={(text) =>
            setState((prev) => ({ ...prev, searchTerm: text }))
          }
          onButtonPress={() => handleOpenModal()}
          buttonText="Nuevo Ingreso"
          buttonVariant="info"
          buttonIconName="add-outline"
          searchPlaceholder="Buscar en comentarios..."
        />
        <View style={styles.monthSelector}>
          <CustomButton
            onPress={() => changeMonth(-1)}
            variant="ghost"
            ionIconLeft="chevron-back-outline"
          />
          <Text
            style={[styles.monthYearText, { color: themeObject.colors.text }]}
          >
            {formatMonthYear()}
          </Text>
          <CustomButton
            onPress={() => changeMonth(1)}
            variant="ghost"
            ionIconLeft="chevron-forward-outline"
          />
        </View>
        <View style={styles.sectionHeader}>
          <Text style={dynamicStyles.sectionTitle}>Ingresos</Text>
          <Text
            style={[styles.totalText, { color: themeObject.colors.success }]}
          >
            Total: ${totalIngresos}
          </Text>
        </View>
      </View>

      <FlatList
        data={filteredIncomes}
        renderItem={renderIncomeCard}
        keyExtractor={(item) => {
          if (!item || !item.id_ingreso) {
            console.error("[Ingresos] Item sin ID:", JSON.stringify(item));
            return Math.random().toString();
          }
          return item.id_ingreso.toString();
        }}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={dynamicStyles.text}>
              {state.loading
                ? "Cargando ingresos..."
                : `No hay ingresos en ${formatMonthYear()}`}
            </Text>
            {!state.loading && (
              <Text style={[dynamicStyles.text, styles.subText]}>
                {state.searchTerm
                  ? "Prueba con otra búsqueda"
                  : "Añade un nuevo ingreso con el botón superior"}
              </Text>
            )}
          </View>
        )}
        contentContainerStyle={[
          styles.listContent,
          filteredIncomes.length === 0 && styles.emptyListContent,
        ]}
        initialNumToRender={initialRenderCount}
        showsHorizontalScrollIndicator={false}
        ListFooterComponent={
          <View style={styles.footerContainer}>
            {state.loading && (
              <ActivityIndicator
                size="large"
                color={themeObject.colors.primary}
              />
            )}
          </View>
        }
      />

      <IncomesModal
        visible={state.isModalVisible}
        onClose={() => setState((prev) => ({ ...prev, isModalVisible: false }))}
        income={state.selectedIncome}
        onSave={handleSaveIncome}
        warning={state.validationError}
      />
    </View>
  );
};

// Estilos dinámicos
const getDynamicStyles = (theme) =>
  StyleSheet.create({
    surfaceBackground: { backgroundColor: theme.colors.surface },
    primaryText: {
      color: theme.colors.primary,
      fontSize: 18,
      fontWeight: "bold",
    },
    text: { color: theme.colors.text },
    sectionTitle: {
      color: theme.colors.text,
      fontSize: 20,
      fontWeight: "bold",
    },
    input: {
      backgroundColor: theme.colors.surface,
      color: theme.colors.text,
      borderColor: theme.colors.border,
    },
  });

// Estilos base (el resto se mantiene igual)
const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSection: { padding: 0 },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  listContent: { padding: 16, paddingTop: 0 },
  card: { borderRadius: 8, padding: 16, marginBottom: 8, elevation: 2 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  input: { borderRadius: 8, borderWidth: 1, padding: 12, marginBottom: 12 },
  footerContainer: { padding: 16, alignItems: "center" },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  subText: {
    marginTop: 8,
    opacity: 0.7,
    fontSize: 14,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  monthSelector: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
    padding: 8,
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: "600",
    minWidth: 150,
    textAlign: "center",
    textTransform: "capitalize",
  },
  totalText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default IncomePage;
