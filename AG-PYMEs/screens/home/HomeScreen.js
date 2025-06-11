import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  Dimensions,
  Text,
  ActivityIndicator,
} from "react-native";
import Animated, { FadeInDown, FadeInLeft } from "react-native-reanimated";
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

// Componente animado para las tarjetas
const AnimatedCard = ({ children, delay = 0, index = 0, style }) => {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400).springify()}
      style={style}
    >
      {children}
    </Animated.View>
  );
};

// Componente para título de sección opcional (sin contenedor adicional)
const SectionTitle = ({ icon, title, delay = 0 }) => {
  const { themeObject } = useTheme();

  return (
    <Animated.View
      entering={FadeInLeft.delay(delay).duration(300)}
      style={styles.sectionHeader}
    >
      <Ionicons name={icon} size={20} color={themeObject.colors.text} />
      <Text style={[styles.sectionTitle, { color: themeObject.colors.text }]}>
        {title}
      </Text>
    </Animated.View>
  );
};

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
      <Animated.Text
        entering={FadeInDown.delay(50).duration(600)}
        style={[styles.screenTitle, { color: themeObject.colors.text }]}
      >
        Panel de Control
      </Animated.Text>

      <AnimatedCard delay={100}>
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
      </AnimatedCard>

      <AnimatedCard delay={200}>
        <FinancialCard
          data={
            dashboardData?.finanzas || { actual: {}, anterior: {}, anual: {} }
          }
          theme={themeObject.colors}
          navigation={navigation}
        />
      </AnimatedCard>

      {/* Títulos e Inventario y Pedidos */}
      <SectionTitle
        icon="cube-outline"
        title="Inventario y Pedidos"
        delay={250}
      />

      <View style={styles.row}>
        <AnimatedCard delay={300} style={styles.cardInRow}>
          <InventoryCard
            data={dashboardData.inventario}
            theme={themeObject.colors}
            navigation={navigation}
          />
        </AnimatedCard>

        <AnimatedCard delay={350} style={styles.cardInRow}>
          <OrdersCard
            data={dashboardData.pedidos}
            theme={themeObject.colors}
            navigation={navigation}
          />
        </AnimatedCard>
      </View>

      {/* Margen y Balance */}
      <SectionTitle
        icon="analytics-outline"
        title="Análisis Financiero"
        delay={380}
      />

      <View style={styles.row}>
        <AnimatedCard delay={400} style={styles.cardInRow}>
          <MarginCard
            data={dashboardData.margenBruto}
            theme={themeObject.colors}
            navigation={navigation}
          />
        </AnimatedCard>

        <AnimatedCard delay={450} style={styles.cardInRow}>
          <ProductServiceBalanceCard
            data={dashboardData.balanceProductosServicios}
            theme={themeObject.colors}
            navigation={navigation}
          />
        </AnimatedCard>
      </View>

      {/* Análisis de Productos */}
      <SectionTitle
        icon="podium-outline"
        title="Análisis de Productos"
        delay={480}
      />

      <AnimatedCard delay={500}>
        <TopProductsCard
          data={dashboardData.productosRanking}
          theme={themeObject.colors}
          navigation={navigation}
        />
      </AnimatedCard>

      <AnimatedCard delay={550}>
        <ProfitabilityCard
          data={dashboardData.rentabilidad}
          theme={themeObject.colors}
          navigation={navigation}
        />
      </AnimatedCard>
    </ScrollView>
  );
};

const styles = {
  container: {
    flexGrow: 1,
    padding: 16,
    gap: 16,
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  alertContainer: {
    width: "100%",
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: width > 768 ? "row" : "column",
    gap: 16,
    width: "100%",
  },
  cardInRow: {
    flex: width > 768 ? 1 : undefined,
    flexBasis: width > 768 ? "50%" : "100%",
    maxWidth: width > 768 ? "50%" : "100%",
    minWidth: 0,
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
