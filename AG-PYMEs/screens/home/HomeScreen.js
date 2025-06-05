import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  Dimensions,
  Text,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CustomButton from "../../components/customButton";
import { FinancialCard } from "./FinancialCard";
import { InventoryCard } from "./InventoryCard";
import { OrdersCard } from "./OrdersCard";
import { MarginCard } from "./MarginCard";
import { TopProductsCard } from "./TopProductsCard";
import { ProfitabilityCard } from "./ProfitabilityCard";
import { ProductServiceBalanceCard } from "./ProductServiceBalanceCard";
import AlertManager from "../../components/alertManager";
import { useTheme } from "../../context/ThemeContext";
import { Services } from "../../api/index";

const { width } = Dimensions.get("window");

const HomeScreen = ({ navigation }) => {
  const { themeObject } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const fetchData = async () => {
    try {
      const data = await Services.Data.Dashboard.getData();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError("Error al cargar los datos");
      console.error(err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading || !dashboardData) {
    return (
      <ActivityIndicator size="large" color={themeObject.colors.primary} />
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={{ color: themeObject.colors.error }}>{error}</Text>
        <CustomButton title="Reintentar" onPress={fetchData} />
      </View>
    );
  }
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={themeObject.colors.primary}
        />
      }
      contentContainerStyle={[
        styles.container,
        { backgroundColor: themeObject.colors.background },
      ]}
    >
      <Text style={[styles.screenTitle, { color: themeObject.colors.text }]}>
        Panel de Control
      </Text>
      <View style={styles.alertContainer}>
        <AlertManager
          customAlerts={
            dashboardData &&
            dashboardData.alertas &&
            Array.isArray(dashboardData.alertas)
              ? dashboardData.alertas.map((alerta) => ({
                  message:
                    alerta.mensaje ||
                    alerta.description ||
                    alerta.message ||
                    "",
                  type: alerta.tipo || alerta.type || "info",
                  id: alerta.id || Math.random().toString(36).substring(7),
                  data: alerta, // Conservamos los datos originales
                }))
              : []
          }
        />
      </View>
      <FinancialCard
        data={
          dashboardData?.finanzas || { actual: {}, anterior: {}, anual: {} }
        }
        theme={themeObject.colors}
        navigation={navigation}
      />
      {/* Inventario y Pedidos en la misma fila en web, columna en móvil */}
      <View style={width > 768 ? styles.row : styles.column}>
        <View
          style={[
            width > 768 ? styles.cardHalf : styles.cardFull,
            width > 768 && styles.equalHeightCard,
          ]}
        >
          <InventoryCard
            data={dashboardData.inventario}
            theme={themeObject.colors}
            navigation={navigation}
          />
        </View>
        <View
          style={[
            width > 768 ? styles.cardHalf : styles.cardFull,
            width > 768 && styles.equalHeightCard,
          ]}
        >
          <OrdersCard
            data={dashboardData.pedidos}
            theme={themeObject.colors}
            navigation={navigation}
          />
        </View>
      </View>
      {/* Nuevas tarjetas para los datos adicionales */}
      <View style={styles.sectionHeader}>
        <Ionicons
          name="analytics-outline"
          size={24}
          color={themeObject.colors.text}
        />
        <Text style={[styles.sectionTitle, { color: themeObject.colors.text }]}>
          Análisis de Ventas y Rentabilidad
        </Text>
      </View>
      {/* Primera fila de tarjetas: Margen y Balance */}
      <View style={width > 768 ? styles.row : styles.column}>
        <MarginCard
          data={dashboardData.margenBruto}
          theme={themeObject.colors}
          navigation={navigation}
        />
        {width > 1024 && (
          <ProductServiceBalanceCard
            data={dashboardData.balanceProductosServicios}
            theme={themeObject.colors}
            navigation={navigation}
          />
        )}
      </View>
      {/* Tarjeta de balance para pantallas más pequeñas */}
      {width <= 1024 && (
        <ProductServiceBalanceCard
          data={dashboardData.balanceProductosServicios}
          theme={themeObject.colors}
          navigation={navigation}
        />
      )}
      {/* Segunda fila de tarjetas: Rankings de productos */}
      <View style={styles.sectionHeader}>
        <Ionicons
          name="podium-outline"
          size={24}
          color={themeObject.colors.text}
        />
        <Text style={[styles.sectionTitle, { color: themeObject.colors.text }]}>
          Análisis de Productos
        </Text>
      </View>
      <View style={styles.column}>
        <View style={styles.autoHeightCard}>
          <TopProductsCard
            data={dashboardData.productosRanking}
            theme={themeObject.colors}
            navigation={navigation}
          />
        </View>
        <View style={styles.autoHeightCard}>
          <ProfitabilityCard
            data={dashboardData.rentabilidad}
            theme={themeObject.colors}
            navigation={navigation}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = {
  container: {
    flexGrow: 1,
    padding: 24,
    gap: 24,
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: "800",

    letterSpacing: 0.5,
  },
  alertContainer: {
    width: "100%",
    marginBottom: 4,
    minHeight: 40,
    maxHeight: 60,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    width: "100%",
    flexWrap: "wrap",
  },
  column: {
    gap: 24,
  },
  cardHalf: {
    flex: 1,
    width: "48%",
  },
  cardFull: {
    width: "100%",
  },
  autoHeightCard: {
    width: "100%",
    height: "auto",
    minHeight: 0,
    flexShrink: 1,
    flexGrow: 0,
  },
  equalHeightCard: {
    height: 700,
    overflow: "hidden",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
    opacity: 0.8,
  },
};

export default HomeScreen;
