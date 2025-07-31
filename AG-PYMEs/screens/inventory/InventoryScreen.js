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
import ProductsScreen from "./product/productsScreen";
import OrdersScreen from "./order/ordersScreen";
import SuppliersScreen from "./supplier/SuppliersScreen";

/**
 * InventoryScreen Optimizada - Evita montaje/desmontaje de subpantallas
 *
 * Estrategias implementadas:
 * 1. Renderizado condicional con visibilidad
 * 2. Estado persistente entre cambios de tab
 * 3. Animaciones optimizadas
 * 4. Pre-renderizado de componentes
 * 5. SearchHeaderBar integrado
 */
const InventoryScreen = () => {
  const { themeObject } = useTheme();
  const [activeView, setActiveView] = useState("productos");
  const [searchQuery, setSearchQuery] = useState("");

  // Referencias para comunicarse con los componentes hijos
  const productosRef = React.useRef(null);
  const pedidosRef = React.useRef(null);
  const proveedoresRef = React.useRef(null);

  // Estados compartidos para animaciones
  const productosOpacity = useSharedValue(1);
  const pedidosOpacity = useSharedValue(0);
  const proveedoresOpacity = useSharedValue(0);
  const productosTranslateX = useSharedValue(0);
  const pedidosTranslateX = useSharedValue(100);
  const proveedoresTranslateX = useSharedValue(100);

  const tabs = [
    {
      value: "productos",
      label: "Productos",
      activeIcon: "cube",
      inactiveIcon: "cube-outline",
    },
    {
      value: "pedidos",
      label: "Pedidos",
      activeIcon: "boat",
      inactiveIcon: "boat-outline",
    },
    {
      value: "proveedores",
      label: "Proveedores",
      activeIcon: "business",
      inactiveIcon: "business-outline",
    },
  ];

  // Función optimizada para cambio de vistas
  const handleViewChange = (newView) => {
    if (newView === activeView) return;

    const duration = 300;

    // Ocultar todas las vistas primero
    productosOpacity.value = withTiming(0, { duration: duration / 2 });
    pedidosOpacity.value = withTiming(0, { duration: duration / 2 });
    proveedoresOpacity.value = withTiming(0, { duration: duration / 2 });

    // Configurar posiciones de salida
    if (activeView === "productos") {
      productosTranslateX.value = withTiming(-100, { duration: duration / 2 });
    } else if (activeView === "pedidos") {
      pedidosTranslateX.value = withTiming(-100, { duration: duration / 2 });
    } else {
      proveedoresTranslateX.value = withTiming(-100, {
        duration: duration / 2,
      });
    }

    // Mostrar la nueva vista después de un breve delay
    setTimeout(() => {
      if (newView === "productos") {
        productosOpacity.value = withTiming(1, { duration: duration / 2 });
        productosTranslateX.value = withTiming(0, { duration: duration / 2 });
        pedidosTranslateX.value = 100;
        proveedoresTranslateX.value = 100;
      } else if (newView === "pedidos") {
        pedidosOpacity.value = withTiming(1, { duration: duration / 2 });
        pedidosTranslateX.value = withTiming(0, { duration: duration / 2 });
        productosTranslateX.value = 100;
        proveedoresTranslateX.value = 100;
      } else {
        proveedoresOpacity.value = withTiming(1, { duration: duration / 2 });
        proveedoresTranslateX.value = withTiming(0, { duration: duration / 2 });
        productosTranslateX.value = 100;
        pedidosTranslateX.value = 100;
      }
    }, duration / 2);

    // Actualizar estado inmediatamente
    setActiveView(newView);
  };

  // Estilos animados para cada vista
  const productosAnimatedStyle = useAnimatedStyle(() => ({
    opacity: productosOpacity.value,
    transform: [{ translateX: productosTranslateX.value }],
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: activeView === "productos" ? 2 : 1,
  }));

  const pedidosAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pedidosOpacity.value,
    transform: [{ translateX: pedidosTranslateX.value }],
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: activeView === "pedidos" ? 2 : 1,
  }));

  const proveedoresAnimatedStyle = useAnimatedStyle(() => ({
    opacity: proveedoresOpacity.value,
    transform: [{ translateX: proveedoresTranslateX.value }],
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: activeView === "proveedores" ? 2 : 1,
  }));

  // Memoización de componentes para evitar re-renders innecesarios
  const ProductosComponent = useMemo(
    () => (
      <ProductsScreen
        ref={productosRef}
        hideSearchBar={true}
        externalSearchQuery={searchQuery}
      />
    ),
    [searchQuery]
  );
  const PedidosComponent = useMemo(
    () => (
      <OrdersScreen
        ref={pedidosRef}
        hideSearchBar={true}
        externalSearchQuery={searchQuery}
      />
    ),
    [searchQuery]
  );
  const ProveedoresComponent = useMemo(
    () => (
      <SuppliersScreen ref={proveedoresRef} externalSearchQuery={searchQuery} />
    ),
    [searchQuery]
  );

  // Configuración del SearchHeaderBar según la vista activa
  const getSearchBarConfig = () => {
    switch (activeView) {
      case "productos":
        return {
          placeholder: "Buscar productos...",
          onAddPress: () => {
            productosRef.current?.openAddModal?.();
          },
          addButtonText: "Nuevo Producto",
        };
      case "pedidos":
        return {
          placeholder: "Buscar pedidos...",
          onAddPress: () => {
            pedidosRef.current?.openAddModal?.();
          },
          addButtonText: "Nuevo Pedido",
        };
      case "proveedores":
        return {
          placeholder: "Buscar proveedores...",
          onAddPress: () => {
            proveedoresRef.current?.openAddModal?.();
          },
          addButtonText: "Nuevo Proveedor",
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
          title="Inventario"
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
          {/* Todos los componentes se renderizan siempre, solo cambia la visibilidad */}
          <Animated.View
            style={productosAnimatedStyle}
            pointerEvents={activeView === "productos" ? "auto" : "none"}
          >
            {ProductosComponent}
          </Animated.View>
          <Animated.View
            style={pedidosAnimatedStyle}
            pointerEvents={activeView === "pedidos" ? "auto" : "none"}
          >
            {PedidosComponent}
          </Animated.View>
          <Animated.View
            style={proveedoresAnimatedStyle}
            pointerEvents={activeView === "proveedores" ? "auto" : "none"}
          >
            {ProveedoresComponent}
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
};

export default InventoryScreen;
