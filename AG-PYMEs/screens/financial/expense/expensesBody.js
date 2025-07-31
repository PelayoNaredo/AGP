import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  View,
  Pressable,
  StyleSheet,
  Text,
  ActivityIndicator,
  useWindowDimensions,
  FlatList,
} from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import CustomButton from "../../../components/customButton";
import SearchHeaderBar from "../../../components/searchHeaderBar";
import { Services } from "../../../api/index";
import ExpensesModal from "./expensesModal";

// Componente principal para gestionar gastos
const ExpensesPage = forwardRef(
  ({ hideSearchBar = false, externalSearchQuery = "" }, ref) => {
    const { themeObject } = useTheme();
    const { width } = useWindowDimensions();
    const isMobile = width < 768; // Considerar dispositivo móvil si el ancho es menor a 768px

    const [expenses, setExpenses] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [validationError, setValidationError] = useState("");
    const [selectedDate, setSelectedDate] = useState(() => {
      const now = new Date();
      return {
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      };
    });

    // Usar búsqueda externa si se proporciona
    const currentSearchQuery = externalSearchQuery || searchTerm;

    // Exponer métodos para el componente padre
    useImperativeHandle(ref, () => ({
      openAddModal: () => setIsModalVisible(true),
      refreshData: loadExpenses,
    }));
    // Función para cargar gastos del mes seleccionado
    const loadExpenses = useCallback(async () => {
      if (isLoading) return;
      try {
        const { data } = await Services.Data.Expenses.getByMonth(
          selectedDate.month,
          selectedDate.year,
          currentSearchQuery
        );
        setExpenses(data);
      } catch (error) {
        console.error("Error cargando gastos:", error);
      }
    }, [selectedDate.month, selectedDate.year, currentSearchQuery, isLoading]);

    // Efecto unificado para cargar gastos con manejo de estado de carga mejorado
    useEffect(() => {
      let isSubscribed = true;
      setIsLoading(true);
      const debounceTimeout = setTimeout(async () => {
        try {
          const { data } = await Services.Data.Expenses.getByMonth(
            selectedDate.month,
            selectedDate.year,
            currentSearchQuery
          );
          if (isSubscribed) {
            setExpenses(data);
          }
        } catch (error) {
          console.error("Error cargando gastos:", error);
        } finally {
          if (isSubscribed) {
            setIsLoading(false);
          }
        }
      }, 300);

      return () => {
        isSubscribed = false;
        clearTimeout(debounceTimeout);
      };
    }, [selectedDate.month, selectedDate.year, currentSearchQuery]);

    // Función para navegar entre meses
    const changeMonth = (increment) => {
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
    };

    // Formatear el mes y año actual
    const formatMonthYear = useCallback(() => {
      const date = new Date(selectedDate.year, selectedDate.month - 1);
      return date.toLocaleDateString("es-ES", {
        month: "long",
        year: "numeric",
      });
    }, [selectedDate]);
    // Función optimizada para procesar gastos
    const processExpenses = useCallback((data) => {
      let fixed = [];
      let variable = [];
      let fixedTotal = 0;
      let variableTotal = 0;

      for (const item of data) {
        if (item.tipo_gasto === "fijo") {
          fixed.push(item);
          fixedTotal += Number(item.monto);
        } else {
          variable.push(item);
          variableTotal += Number(item.monto);
        }
      }

      return {
        fixed: fixed.sort(
          (a, b) => new Date(b.fecha_gasto) - new Date(a.fecha_gasto)
        ),
        variable: variable.sort(
          (a, b) => new Date(b.fecha_gasto) - new Date(a.fecha_gasto)
        ),
        totals: {
          fixed: fixedTotal.toFixed(2),
          variable: variableTotal.toFixed(2),
        },
      };
    }, []);

    // Memoización de datos procesados
    const processedData = useMemo(
      () => processExpenses(expenses),
      [expenses, processExpenses]
    );
    // Componente de tarjeta memoizado
    const MemoizedExpenseCard = React.memo(({ item }) => (
      <Pressable
        style={[styles.card, { backgroundColor: themeObject.colors.surface }]}
        onPress={() => handleOpenModal(item)}
      >
        <View style={styles.cardHeader}>
          <Text
            style={[styles.cardTitle, { color: themeObject.colors.primary }]}
          >
            ${item.monto || "0"}
          </Text>
          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor:
                  item.tipo_gasto === "fijo"
                    ? themeObject.colors.success
                    : themeObject.colors.warning,
              },
            ]}
          >
            <Text style={styles.typeText}>
              {(item.tipo_gasto || "").toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={{ color: themeObject.colors.text, fontWeight: "500" }}>
          {item.concepto || ""}
        </Text>

        <View style={styles.cardFooter}>
          <Text style={{ color: themeObject.colors.text }}>
            {item.fecha_gasto
              ? new Date(item.fecha_gasto).toLocaleDateString()
              : ""}
          </Text>
          {item.comentarios && (
            <Text style={{ color: themeObject.colors.text }}>
              {item.comentarios}
            </Text>
          )}
        </View>
      </Pressable>
    ));

    // Optimización de estilos dinámicos
    const dynamicStyles = useMemo(
      () =>
        StyleSheet.create({
          container: {
            backgroundColor: themeObject.colors.background,
          },
          searchInput: {
            backgroundColor: themeObject.colors.surface,
            color: themeObject.colors.text,
            borderColor: themeObject.colors.border,
          },
        }),
      [themeObject]
    );

    const handleOpenModal = useCallback((expense = null) => {
      setSelectedExpense(expense);
      setIsModalVisible(true);
    }, []);
    const handleSaveExpense = async (expenseData) => {
      try {
        if (selectedExpense) {
          await Services.Data.Expenses.update(
            selectedExpense.id_gasto,
            expenseData
          );
        } else {
          await Services.Data.Expenses.create(expenseData);
        }

        setIsModalVisible(false);
        setValidationError("");
        loadExpenses();
      } catch (error) {
        console.error("Error guardando gasto:", error);
        setValidationError("Error al guardar el gasto");
      }
    }; // Layout optimizado para FlatList - mejora significativamente el scroll
    const getItemLayout = useCallback(
      (data, index) => ({
        length: 120, // altura estimada del item (card + margin)
        offset: 120 * index,
        index,
      }),
      []
    );

    // Componente de sección optimizado con manejo de carga
    const ExpenseSection = React.memo(({ title, data, type, total }) => (
      <View style={styles.sectionContainer}>
        <View
          style={[
            styles.sectionHeader,
            { backgroundColor: themeObject.colors.background },
            isMobile && styles.sectionHeaderMobile,
          ]}
        >
          <Text
            style={[styles.sectionTitle, { color: themeObject.colors.primary }]}
          >
            {title}
          </Text>
          <View>
            <Text
              style={[styles.totalText, { color: themeObject.colors.text }]}
            >
              Total: ${total}
            </Text>
          </View>
        </View>

        <View
          style={[styles.listWrapper, isMobile && styles.listWrapperMobile]}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={themeObject.colors.primary}
              />
            </View>
          ) : (
            <FlatList
              data={data}
              renderItem={({ item }) => <MemoizedExpenseCard item={item} />}
              keyExtractor={(item) => item.id_gasto.toString()}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.flatListContent}
              removeClippedSubviews={true}
              windowSize={10}
              initialNumToRender={8}
              maxToRenderPerBatch={5}
              updateCellsBatchingPeriod={50}
              onEndReachedThreshold={0.5}
              getItemLayout={getItemLayout}
              ListEmptyComponent={() => (
                <Text
                  style={[
                    styles.emptyText,
                    { color: themeObject.colors.placeholder },
                  ]}
                >
                  No hay {type === "fijo" ? "gastos fijos" : "gastos variables"}
                </Text>
              )}
            />
          )}
        </View>
      </View>
    ));

    // Limpiar recursos al desmontar
    useEffect(() => {
      return () => {
        setExpenses([]);
        setSearchTerm("");
      };
    }, []);
    return (
      <View style={{ flex: 1 }}>
        {!hideSearchBar && (
          <SearchHeaderBar
            searchQuery={searchTerm}
            setSearchQuery={setSearchTerm}
            onButtonPress={() => handleOpenModal()}
            buttonText="Nuevo Gasto"
            buttonVariant="info"
            buttonIconName="add-circle-outline"
            searchPlaceholder="Buscar gastos..."
          />
        )}

        <View style={[styles.container, dynamicStyles.container]}>
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
          <View
            style={[
              styles.listContainer,
              isMobile && styles.listContainerMobile,
            ]}
          >
            <View
              style={[styles.listColumn, isMobile && styles.listColumnMobile]}
            >
              <ExpenseSection
                title="Gastos Fijos"
                data={processedData.fixed}
                type="fijo"
                total={processedData.totals.fixed}
              />
            </View>
            {isMobile ? (
              <View style={styles.mobileSpacing} />
            ) : (
              <View
                style={[
                  styles.divider,
                  { backgroundColor: themeObject.colors.border },
                ]}
              />
            )}
            <View
              style={[styles.listColumn, isMobile && styles.listColumnMobile]}
            >
              <ExpenseSection
                title="Gastos Variables"
                data={processedData.variable}
                type="variable"
                total={processedData.totals.variable}
              />
            </View>
          </View>
          <ExpensesModal
            visible={isModalVisible}
            onClose={() => {
              setIsModalVisible(false);
              setValidationError("");
            }}
            expense={selectedExpense}
            onSave={handleSaveExpense}
            warning={validationError}
          />
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  typeBadge: {
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  typeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  cardFooter: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  listContent: {
    paddingBottom: 20,
  },
  listContainer: {
    flex: 1,
    flexDirection: "row",
    gap: 4,
  },
  listContainerMobile: {
    flexDirection: "column",
    height: "auto",
  },
  listColumn: {
    flex: 1,
    minWidth: 300,
    overflow: "hidden", // Previene que el contenido se desborde
  },
  listColumnMobile: {
    minWidth: "auto",
  },
  mobileSpacing: {
    height: 1,
  },
  divider: {
    width: 1,
  },
  sectionContainer: {
    flex: 1,
    height: "100%",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  sectionHeaderMobile: {
    position: "relative",
    marginBottom: 8,
  },
  listWrapper: {
    flex: 1,
    paddingTop: 60, // Espacio para el header fijo
  },
  listWrapperMobile: {
    paddingTop: 0, // No necesita espacio para el header en móvil
  },
  flatListContent: {
    paddingHorizontal: 16,
  },
  totalText: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    paddingVertical: 16,
    fontStyle: "italic",
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    marginTop: 2,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
});

export default React.memo(ExpensesPage);
