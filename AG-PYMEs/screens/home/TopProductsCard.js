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

// Componente ProfitabilityCard muestra los productos mas vendidos con estadísticas
export const TopProductsCard = ({ data, theme, navigation }) => {
  const [activeTab, setActiveTab] = useState("unidades"); // "unidades" o "importe"

  // Selección de datos según el tab activo
  const masVendidos =
    activeTab === "unidades"
      ? data?.mas_vendidos_unidades || []
      : data?.mas_vendidos_importe || [];

  const menosVendidos =
    activeTab === "unidades"
      ? data?.menos_vendidos_unidades || []
      : data?.menos_vendidos_importe || [];

  const renderProductItem = (item, index, type) => {
    const isTop = type === "top";
    return (
      <View
        style={[
          styles.productItem,
          {
            backgroundColor: theme.surface,
            borderLeftColor: isTop ? theme.success : theme.warning,
            borderTopColor: theme.border,
            borderRightColor: theme.border,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <Text style={[styles.ranking, { color: theme.text }]}>
          {isTop ? index + 1 : menosVendidos.length - index}
        </Text>
        <View style={styles.productInfo}>
          <Text
            style={[styles.productName, { color: theme.text }]}
            numberOfLines={1}
          >
            {item.nombre_producto}
          </Text>
          <View style={styles.productStats}>
            <View style={styles.statItem}>
              <Ionicons
                name="cube-outline"
                size={14}
                color={theme.placeholder}
              />
              <Text style={[styles.statValue, { color: theme.text }]}>
                {item.unidades_vendidas} uds
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons
                name="cash-outline"
                size={14}
                color={theme.placeholder}
              />
              <Text style={[styles.statValue, { color: theme.text }]}>
                {formatCurrency(item.importe_total)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons
                name="receipt-outline"
                size={14}
                color={theme.placeholder}
              />
              <Text style={[styles.statValue, { color: theme.text }]}>
                {item.num_ventas} ventas
              </Text>
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
      accessibilityLabel="Rankings de productos"
    >
      <View style={styles.header}>
        <Ionicons name="podium" size={24} color={theme.text} />
        <Text style={[styles.title, { color: theme.text }]}>
          Rankings de Productos
        </Text>
      </View>
      <View style={styles.tabsContainer}>
        <TabButton
          title="Por Unidades"
          isActive={activeTab === "unidades"}
          onPress={() => setActiveTab("unidades")}
        />
        <TabButton
          title="Por Importe"
          isActive={activeTab === "importe"}
          onPress={() => setActiveTab("importe")}
        />
      </View>
      <View
        style={[
          styles.listsContainer,
          width > 768 ? styles.listsContainerRow : null,
        ]}
      >
        {/* Más vendidos */}
        <View
          style={[
            styles.listSection,
            width > 768 ? styles.listSectionHalf : null,
          ]}
        >
          <View style={styles.listHeader}>
            <Ionicons name="trending-up" size={16} color={theme.success} />
            <Text style={[styles.listTitle, { color: theme.text }]}>
              Más Vendidos
            </Text>
          </View>
          <FlatList
            data={masVendidos}
            renderItem={({ item, index }) =>
              renderProductItem(item, index, "top")
            }
            keyExtractor={(item) => `top-${item.id_producto}`}
            scrollEnabled={false}
          />
        </View>

        {/* Menos vendidos */}
        <View
          style={[
            styles.listSection,
            width > 768 ? styles.listSectionHalf : null,
          ]}
        >
          <View style={styles.listHeader}>
            <Ionicons name="trending-down" size={16} color={theme.warning} />
            <Text style={[styles.listTitle, { color: theme.text }]}>
              Menos Vendidos
            </Text>
          </View>
          <FlatList
            data={menosVendidos}
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
    marginBottom: 6,
  },
  productStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 12,
  },
});

export default TopProductsCard;
