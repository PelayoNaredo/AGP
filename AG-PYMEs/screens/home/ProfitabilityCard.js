import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatCurrency } from "../../utils/helpers";

const { width } = Dimensions.get("window");

// Componente ProfitabilityCard muestra la rentabilidad de productos con estadísticas y listas de mayor y menor rentabilidad
export const ProfitabilityCard = ({ data, theme, navigation }) => {
  const [activeTab, setActiveTab] = useState("porcentaje"); // "porcentaje" o "total"

  // Datos según el tab activo
  const mayorRentabilidad =
    activeTab === "porcentaje"
      ? data?.mayor_rentabilidad_porcentaje || []
      : data?.mayor_rentabilidad_total || [];

  const menorRentabilidad =
    activeTab === "porcentaje"
      ? data?.menor_rentabilidad_porcentaje || []
      : data?.menor_rentabilidad_total || [];

  const renderProductItem = (item, index, type) => {
    const isTop = type === "top";
    return (
      <View
        style={[
          styles.productItem,
          {
            backgroundColor: theme.card + "20",
            borderLeftColor: isTop ? theme.success : theme.error,
            borderTopColor: theme.border,
            borderRightColor: theme.border,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <Text style={[styles.ranking, { color: theme.text }]}>
          {isTop ? index + 1 : menorRentabilidad.length - index}
        </Text>
        <View style={styles.productInfo}>
          <Text
            style={[styles.productName, { color: theme.text }]}
            numberOfLines={1}
          >
            {item.nombre_producto}
          </Text>
          <View style={styles.productStats}>
            <View style={styles.valueRow}>
              <View style={styles.statItem}>
                <Ionicons
                  name="pricetag-outline"
                  size={14}
                  color={theme.placeholder}
                />
                <Text style={[styles.statLabel, { color: theme.placeholder }]}>
                  Costo:
                </Text>
                <Text style={[styles.statValue, { color: theme.error }]}>
                  {formatCurrency(item.costo_compra)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons
                  name="cash-outline"
                  size={14}
                  color={theme.placeholder}
                />
                <Text style={[styles.statLabel, { color: theme.placeholder }]}>
                  Venta:
                </Text>
                <Text style={[styles.statValue, { color: theme.success }]}>
                  {formatCurrency(item.precio_venta)}
                </Text>
              </View>
            </View>

            <View style={styles.valueRow}>
              <View style={styles.statItem}>
                <Ionicons
                  name="trending-up"
                  size={14}
                  color={theme.placeholder}
                />
                <Text style={[styles.statLabel, { color: theme.placeholder }]}>
                  Margen:
                </Text>
                <Text style={[styles.statValue, { color: theme.primary }]}>
                  {formatCurrency(item.margen_unitario_teorico)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons
                  name="analytics-outline"
                  size={14}
                  color={theme.placeholder}
                />
                <Text style={[styles.statLabel, { color: theme.placeholder }]}>
                  %:
                </Text>
                <Text style={[styles.statValue, { color: theme.info }]}>
                  {item.porcentaje_margen_teorico}%
                </Text>
              </View>
            </View>

            <View style={styles.valueRow}>
              <View style={styles.statItem}>
                <Ionicons
                  name="cube-outline"
                  size={14}
                  color={theme.placeholder}
                />
                <Text style={[styles.statLabel, { color: theme.placeholder }]}>
                  Vendidos:
                </Text>
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {item.unidades_vendidas} uds
                </Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons
                  name="wallet-outline"
                  size={14}
                  color={theme.placeholder}
                />
                <Text style={[styles.statLabel, { color: theme.placeholder }]}>
                  Total:
                </Text>
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {formatCurrency(item.margen_total)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const TabButton = ({ title, isActive, onPress }) => (
    <Pressable
      style={[
        styles.tabButton,
        { backgroundColor: isActive ? theme.primary + "20" : "transparent" },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.tabButtonText,
          { color: isActive ? theme.primary : theme.placeholder },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.surface }]}
      accessibilityLabel="Rentabilidad de productos"
    >
      <View style={styles.header}>
        <Ionicons name="stats-chart" size={24} color={theme.text} />
        <Text style={[styles.title, { color: theme.text }]}>
          Rentabilidad de Productos
        </Text>
      </View>
      <View style={styles.tabsContainer}>
        <TabButton
          title="Por % de Margen"
          isActive={activeTab === "porcentaje"}
          onPress={() => setActiveTab("porcentaje")}
        />
        <TabButton
          title="Por Margen Total"
          isActive={activeTab === "total"}
          onPress={() => setActiveTab("total")}
        />
      </View>
      <View
        style={[
          styles.listsContainer,
          width > 768 ? styles.listsContainerRow : null,
        ]}
      >
        {/* Mayor rentabilidad */}
        <View
          style={[
            styles.listSection,
            width > 768 ? styles.listSectionHalf : null,
          ]}
        >
          <View style={styles.listHeader}>
            <Ionicons name="arrow-up" size={16} color={theme.success} />
            <Text style={[styles.listTitle, { color: theme.text }]}>
              Mayor Rentabilidad
            </Text>
          </View>
          <FlatList
            data={mayorRentabilidad}
            renderItem={({ item, index }) =>
              renderProductItem(item, index, "top")
            }
            keyExtractor={(item) => `top-${item.id_producto}`}
            scrollEnabled={false}
          />
        </View>

        {/* Menor rentabilidad */}
        <View
          style={[
            styles.listSection,
            width > 768 ? styles.listSectionHalf : null,
          ]}
        >
          <View style={styles.listHeader}>
            <Ionicons name="arrow-down" size={16} color={theme.error} />
            <Text style={[styles.listTitle, { color: theme.text }]}>
              Menor Rentabilidad
            </Text>
          </View>
          <FlatList
            data={menorRentabilidad}
            renderItem={({ item, index }) =>
              renderProductItem(item, index, "bottom")
            }
            keyExtractor={(item) => `bottom-${item.id_producto}`}
            scrollEnabled={false}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 24,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    overflow: "hidden",
    height: "auto",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
  },
  tabsContainer: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  listsContainer: {
    gap: 20,
  },
  listsContainerRow: {
    flexDirection: "row",
    gap: 16,
    justifyContent: "space-between",
  },
  listSection: {
    gap: 8,
  },
  listSectionHalf: {
    flex: 1,
    width: "48%",
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  productItem: {
    flexDirection: "row",
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  ranking: {
    fontSize: 16,
    fontWeight: "bold",
    width: 24,
    textAlign: "center",
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  productStats: {
    gap: 8,
  },
  valueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
  },
  statValue: {
    fontSize: 12,
    fontWeight: "600",
  },
});

export default ProfitabilityCard;
