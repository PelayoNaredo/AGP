import React, { useState, useRef } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  withTiming,
  FadeInUp,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import HeaderWithTabs from "../../components/HeaderWithTabs";
import SearchHeaderBar from "../../components/searchHeaderBar";
import SalesPointScreen from "./salesPoint/SalesPointScreen";
import SalesHistoryScreen from "./history/SalesHistoryScreen";
import ClientsScreen from "./client/ClientsScreen";
import ServicesScreen from "./service/ServicesScreen";

// Pagina principal de ventas
// Contiene las diferentes vistas de ventas: Punto de Venta, Historial, Clientes y Servicios
const SalesScreen = () => {
  const { themeObject } = useTheme();
  const [activeView, setActiveView] = useState("punto-venta");

  // Estados para SearchHeaderBar
  const [currentSearchQuery, setCurrentSearchQuery] = useState("");

  // Referencias para los componentes hijos
  const salesPointRef = useRef(null);
  const salesHistoryRef = useRef(null);
  const clientsRef = useRef(null);
  const servicesRef = useRef(null);

  // Valores compartidos para animaciones (4 pantallas)
  const salesPointOpacity = useSharedValue(1);
  const salesPointTranslateX = useSharedValue(0);
  const salesHistoryOpacity = useSharedValue(0);
  const salesHistoryTranslateX = useSharedValue(300);
  const clientsOpacity = useSharedValue(0);
  const clientsTranslateX = useSharedValue(300);
  const servicesOpacity = useSharedValue(0);
  const servicesTranslateX = useSharedValue(300);

  const tabs = [
    {
      value: "punto-venta",
      label: "Punto de Venta",
      activeIcon: "cart-outline",
      inactiveIcon: "cart-outline",
    },
    {
      value: "historial",
      label: "Historial",
      activeIcon: "receipt",
      inactiveIcon: "receipt-outline",
    },
    {
      value: "clientes",
      label: "Clientes",
      activeIcon: "people",
      inactiveIcon: "people-outline",
    },
    {
      value: "servicios",
      label: "Servicios",
      activeIcon: "construct",
      inactiveIcon: "construct-outline",
    },
  ];

  // Función para manejar el cambio de vista con animaciones
  const handleViewChange = (newView) => {
    if (newView === activeView) return;

    // Resetear todas las vistas
    const duration = 300;

    // Ocultar todas
    salesPointOpacity.value = withTiming(0, { duration });
    salesHistoryOpacity.value = withTiming(0, { duration });
    clientsOpacity.value = withTiming(0, { duration });
    servicesOpacity.value = withTiming(0, { duration });

    // Mover todas fuera de la pantalla
    salesPointTranslateX.value = withTiming(-300, { duration });
    salesHistoryTranslateX.value = withTiming(300, { duration });
    clientsTranslateX.value = withTiming(300, { duration });
    servicesTranslateX.value = withTiming(300, { duration });

    // Mostrar solo la vista activa
    switch (newView) {
      case "punto-venta":
        salesPointOpacity.value = withTiming(1, { duration });
        salesPointTranslateX.value = withTiming(0, { duration });
        break;
      case "historial":
        salesHistoryOpacity.value = withTiming(1, { duration });
        salesHistoryTranslateX.value = withTiming(0, { duration });
        break;
      case "clientes":
        clientsOpacity.value = withTiming(1, { duration });
        clientsTranslateX.value = withTiming(0, { duration });
        break;
      case "servicios":
        servicesOpacity.value = withTiming(1, { duration });
        servicesTranslateX.value = withTiming(0, { duration });
        break;
    }

    setActiveView(newView);
    // Limpiar búsqueda al cambiar de vista
    setCurrentSearchQuery("");
  };

  // Configuración de SearchHeaderBar según la vista activa
  const getSearchHeaderConfig = () => {
    switch (activeView) {
      case "punto-venta":
        return {
          showSearchBar: false, // SalesPoint no necesita SearchHeaderBar unificado
        };
      case "historial":
        return {
          showSearchBar: false, // SalesHistory tiene su propia búsqueda compleja
        };
      case "clientes":
        return {
          buttonText: "Nuevo Cliente",
          buttonIconName: "add-outline",
          buttonVariant: "info",
          searchPlaceholder: "Buscar cliente por nombre, email, teléfono...",
          onButtonPress: () => clientsRef.current?.openModal?.(),
        };
      case "servicios":
        return {
          buttonText: "Nuevo Servicio",
          buttonIconName: "add-outline",
          buttonVariant: "info",
          searchPlaceholder: "Buscar servicio por nombre o descripción...",
          onButtonPress: () => servicesRef.current?.openModal?.(),
        };
      default:
        return { showSearchBar: false };
    }
  };

  const searchConfig = getSearchHeaderConfig();
  const renderContent = () => {
    return (
      <>
        {/* SalesPointScreen - siempre renderizado */}
        <Animated.View
          style={[
            styles.contentView,
            {
              opacity: salesPointOpacity,
              transform: [{ translateX: salesPointTranslateX }],
              pointerEvents: activeView === "punto-venta" ? "auto" : "none",
            },
          ]}
        >
          <SalesPointScreen ref={salesPointRef} />
        </Animated.View>

        {/* SalesHistoryScreen - siempre renderizado */}
        <Animated.View
          style={[
            styles.contentView,
            {
              opacity: salesHistoryOpacity,
              transform: [{ translateX: salesHistoryTranslateX }],
              pointerEvents: activeView === "historial" ? "auto" : "none",
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            },
          ]}
        >
          <SalesHistoryScreen ref={salesHistoryRef} />
        </Animated.View>

        {/* ClientsScreen - siempre renderizado */}
        <Animated.View
          style={[
            styles.contentView,
            {
              opacity: clientsOpacity,
              transform: [{ translateX: clientsTranslateX }],
              pointerEvents: activeView === "clientes" ? "auto" : "none",
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            },
          ]}
        >
          <ClientsScreen
            ref={clientsRef}
            hideSearchBar={true}
            externalSearchQuery={currentSearchQuery}
          />
        </Animated.View>

        {/* ServicesScreen - siempre renderizado */}
        <Animated.View
          style={[
            styles.contentView,
            {
              opacity: servicesOpacity,
              transform: [{ translateX: servicesTranslateX }],
              pointerEvents: activeView === "servicios" ? "auto" : "none",
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            },
          ]}
        >
          <ServicesScreen
            ref={servicesRef}
            hideSearchBar={true}
            externalSearchQuery={currentSearchQuery}
          />
        </Animated.View>
      </>
    );
  };
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: themeObject.colors.background },
      ]}
    >
      <Animated.View
        style={styles.content}
        entering={FadeInUp.duration(600).springify()}
      >
        {/* Header */}
        <HeaderWithTabs
          title="Ventas"
          tabs={tabs}
          activeView={activeView}
          onChangeView={handleViewChange}
        />

        {/* SearchHeaderBar unificado - solo para clientes y servicios */}
        {searchConfig.showSearchBar !== false && (
          <SearchHeaderBar
            searchQuery={currentSearchQuery}
            setSearchQuery={setCurrentSearchQuery}
            onButtonPress={searchConfig.onButtonPress}
            buttonText={searchConfig.buttonText}
            buttonIconName={searchConfig.buttonIconName}
            buttonVariant={searchConfig.buttonVariant}
            searchPlaceholder={searchConfig.searchPlaceholder}
          />
        )}

        {/* Contenido con componentes persistentes */}
        <View style={styles.contentContainer}>{renderContent()}</View>
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
  contentContainer: {
    flex: 1,
    position: "relative",
  },
});

export default SalesScreen;
