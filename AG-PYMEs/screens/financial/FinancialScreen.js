import React, { useState, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import HeaderWithTabs from "../../components/HeaderWithTabs";
import SearchHeaderBar from "../../components/searchHeaderBar";
import IncomesList from "./income/incomesBody";
import ExpensesList from "./expense/expensesBody";

/**
 * FinancialScreen Optimizada - Evita montaje/desmontaje de subpantallas
 *
 * Estrategias implementadas:
 * 1. Renderizado condicional con visibilidad
 * 2. Estado persistente entre cambios de tab
 * 3. Animaciones optimizadas
 * 4. Pre-renderizado de componentes
 * 5. SearchHeaderBar integrado
 */
const FinancialScreen = () => {
  const { themeObject } = useTheme();
  const [activeView, setActiveView] = useState("income");
  const [searchQuery, setSearchQuery] = useState("");

  // Referencias para comunicarse con los componentes hijos
  const incomesRef = React.useRef(null);
  const expensesRef = React.useRef(null);

  // Estados compartidos para animaciones
  const incomesOpacity = useSharedValue(1);
  const expensesOpacity = useSharedValue(0);
  const incomesTranslateX = useSharedValue(0);
  const expensesTranslateX = useSharedValue(100);

  const tabs = [
    {
      value: "income",
      label: "Ingresos",
      activeIcon: "cash",
      inactiveIcon: "cash-outline",
    },
    {
      value: "expense",
      label: "Gastos",
      activeIcon: "wallet",
      inactiveIcon: "wallet-outline",
    },
  ];

  // Función optimizada para cambio de vistas
  const handleViewChange = (newView) => {
    if (newView === activeView) return;

    const duration = 300;

    if (newView === "income") {
      // Animar hacia ingresos
      incomesOpacity.value = withTiming(1, { duration });
      expensesOpacity.value = withTiming(0, { duration });
      incomesTranslateX.value = withTiming(0, { duration });
      expensesTranslateX.value = withTiming(100, { duration });
    } else {
      // Animar hacia gastos
      incomesOpacity.value = withTiming(0, { duration });
      expensesOpacity.value = withTiming(1, { duration });
      incomesTranslateX.value = withTiming(-100, { duration });
      expensesTranslateX.value = withTiming(0, { duration });
    }

    // Actualizar estado inmediatamente
    setActiveView(newView);
  };

  // Estilos animados para cada vista
  const incomesAnimatedStyle = useAnimatedStyle(() => ({
    opacity: incomesOpacity.value,
    transform: [{ translateX: incomesTranslateX.value }],
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: activeView === "income" ? 2 : 1,
  }));

  const expensesAnimatedStyle = useAnimatedStyle(() => ({
    opacity: expensesOpacity.value,
    transform: [{ translateX: expensesTranslateX.value }],
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: activeView === "expense" ? 2 : 1,
  }));

  // Memoización de componentes para evitar re-renders innecesarios
  const IncomesComponent = useMemo(
    () => (
      <IncomesList
        ref={incomesRef}
        hideSearchBar={true}
        externalSearchQuery={searchQuery}
      />
    ),
    [searchQuery]
  );
  const ExpensesComponent = useMemo(
    () => (
      <ExpensesList
        ref={expensesRef}
        hideSearchBar={true}
        externalSearchQuery={searchQuery}
      />
    ),
    [searchQuery]
  );

  // Configuración del SearchHeaderBar según la vista activa
  const getSearchBarConfig = () => {
    switch (activeView) {
      case "income":
        return {
          placeholder: "Buscar ingresos...",
          onAddPress: () => {
            incomesRef.current?.openAddModal?.();
          },
          addButtonText: "Nuevo Ingreso",
        };
      case "expense":
        return {
          placeholder: "Buscar gastos...",
          onAddPress: () => {
            expensesRef.current?.openAddModal?.();
          },
          addButtonText: "Nuevo Gasto",
        };
      default:
        return {
          placeholder: "Buscar...",
          onAddPress: () => {},
          addButtonText: "Añadir",
        };
    }
  };

  // Manejar cambio en el campo de búsqueda
  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeObject.colors.background,
    },
    content: {
      flex: 1,
    },
    searchBarContainer: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: themeObject.colors.background,
    },
    contentContainer: {
      flex: 1,
      position: "relative",
    },
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={styles.content}
        entering={FadeInUp.duration(600).springify()}
      >
        <HeaderWithTabs
          title="Finanzas"
          tabs={tabs}
          activeView={activeView}
          onChangeView={handleViewChange}
        />

        {/* SearchHeaderBar integrado */}
        <View style={styles.searchBarContainer}>
          <SearchHeaderBar
            {...getSearchBarConfig()}
            searchQuery={searchQuery}
            setSearchQuery={handleSearchChange}
            onButtonPress={getSearchBarConfig().onAddPress}
            buttonText={getSearchBarConfig().addButtonText}
            buttonVariant="info"
            buttonIconName="add-circle-outline"
            searchPlaceholder={getSearchBarConfig().placeholder}
          />
        </View>

        <View style={styles.contentContainer}>
          {/* Ambos componentes se renderizan siempre, solo cambia la visibilidad */}
          <Animated.View
            style={incomesAnimatedStyle}
            pointerEvents={activeView === "income" ? "auto" : "none"}
          >
            {IncomesComponent}
          </Animated.View>
          <Animated.View
            style={expensesAnimatedStyle}
            pointerEvents={activeView === "expense" ? "auto" : "none"}
          >
            {ExpensesComponent}
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentView: {
    flex: 1,
  },
});

export default FinancialScreen;
