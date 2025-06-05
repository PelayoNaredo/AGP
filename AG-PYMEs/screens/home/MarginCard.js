import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatCurrency } from "../../utils/helpers";

// Muestra un indicador de comparación con un icono y un porcentaje
const ComparisonIndicator = ({ value, color }) => {
  const isPositive = value > 0;
  return (
    <View style={[styles.comparison, { backgroundColor: `${color}20` }]}>
      <Ionicons
        name={isPositive ? "trending-up" : "trending-down"}
        size={14}
        color={color}
      />
      <Text style={[styles.comparisonText, { color }]}>
        {Math.abs(value).toFixed(1)}%
      </Text>
    </View>
  );
};

// MarginCard muestra un resumen del margen bruto de ventas
export const MarginCard = ({ data, theme, navigation }) => {
  // Extraemos los datos del período actual y anterior
  const actual = data?.actual || {};
  const anterior = data?.anterior || {};

  const calculatePercentChange = (actual, comparacion) => {
    if (comparacion === 0) return actual > 0 ? 100 : 0;
    return ((actual - comparacion) / Math.abs(comparacion)) * 100;
  };

  // Calculamos los porcentajes de ingresos por productos y servicios
  const totalIngresos =
    actual.ingresos_productos + actual.ingresos_servicios || 1;
  const porcentajeProductos =
    (actual.ingresos_productos / totalIngresos) * 100 || 0;
  const porcentajeServicios =
    (actual.ingresos_servicios / totalIngresos) * 100 || 0;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.surface }]}
      accessibilityLabel="Margen bruto de ventas"
    >
      <View style={styles.header}>
        <Ionicons name="analytics" size={24} color={theme.text} />
        <Text style={[styles.title, { color: theme.text }]}>
          Margen Bruto (30 días)
        </Text>
      </View>

      <View style={styles.statsContainer}>
        {/* Margen Total */}
        <View style={styles.statBlock}>
          <View style={styles.statHeader}>
            <Text style={[styles.statLabel, { color: theme.text }]}>
              Margen Total
            </Text>
            <ComparisonIndicator
              value={calculatePercentChange(
                actual.porcentaje_margen || 0,
                anterior.porcentaje_margen || 0
              )}
              color={theme.info}
            />
          </View>
          <Text style={[styles.statValue, { color: theme.info }]}>
            {formatCurrency(actual.margen_total || 0)}
          </Text>

          <View style={styles.marginBar}>
            <View
              style={[
                styles.marginBarSegment,
                {
                  width: `${porcentajeProductos}%`,
                  backgroundColor: theme.primary,
                },
              ]}
            />
            <View
              style={[
                styles.marginBarSegment,
                {
                  width: `${porcentajeServicios}%`,
                  backgroundColor: theme.info,
                },
              ]}
            />
          </View>

          <View style={styles.marginDetails}>
            <View style={styles.marginPercentContainer}>
              <Text style={[styles.marginPercent, { color: theme.success }]}>
                {actual.porcentaje_margen || 0}%
              </Text>
              <Text
                style={[styles.comparisonLabel, { color: theme.placeholder }]}
              >
                de margen
              </Text>
            </View>

            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendColor,
                    { backgroundColor: theme.primary },
                  ]}
                />
                <Text style={[styles.legendText, { color: theme.placeholder }]}>
                  Productos ({Math.round(porcentajeProductos)}%)
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendColor, { backgroundColor: theme.info }]}
                />
                <Text style={[styles.legendText, { color: theme.placeholder }]}>
                  Servicios ({Math.round(porcentajeServicios)}%)
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.comparisons}>
            <Text
              style={[styles.comparisonLabel, { color: theme.placeholder }]}
            >
              vs Período anterior: {formatCurrency(anterior.margen_total || 0)}{" "}
              ({anterior.porcentaje_margen || 0}%)
            </Text>
          </View>
        </View>
        {/* Margen por productos */}
        <View style={styles.statBlock}>
          <View style={styles.statHeader}>
            <Text style={[styles.statLabel, { color: theme.text }]}>
              Productos
            </Text>
          </View>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={[styles.subValue, { color: theme.success }]}>
                {formatCurrency(actual.ingresos_productos || 0)}
              </Text>
              <Text
                style={[styles.comparisonLabel, { color: theme.placeholder }]}
              >
                Ingresos
              </Text>
            </View>
            <View style={styles.column}>
              <Text style={[styles.subValue, { color: theme.error }]}>
                {formatCurrency(
                  actual.costos_totales
                    ? actual.costos_totales - (actual.costo_servicios || 0)
                    : 0
                )}
              </Text>
              <Text
                style={[styles.comparisonLabel, { color: theme.placeholder }]}
              >
                Costos
              </Text>
            </View>
            <View style={styles.column}>
              <Text style={[styles.subValue, { color: theme.info }]}>
                {formatCurrency(actual.margen_productos || 0)}
              </Text>
              <Text
                style={[styles.comparisonLabel, { color: theme.placeholder }]}
              >
                Margen
              </Text>
            </View>
          </View>
        </View>
        {/* Margen por servicios */}
        <View style={styles.statBlock}>
          <View style={styles.statHeader}>
            <Text style={[styles.statLabel, { color: theme.text }]}>
              Servicios
            </Text>
          </View>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={[styles.subValue, { color: theme.success }]}>
                {formatCurrency(actual.ingresos_servicios || 0)}
              </Text>
              <Text
                style={[styles.comparisonLabel, { color: theme.placeholder }]}
              >
                Ingresos
              </Text>
            </View>
            <View style={styles.column}>
              <Text style={[styles.subValue, { color: theme.error }]}>
                {formatCurrency(actual.costo_servicios || 0)}
              </Text>
              <Text
                style={[styles.comparisonLabel, { color: theme.placeholder }]}
              >
                Costos
              </Text>
            </View>
            <View style={styles.column}>
              <Text style={[styles.subValue, { color: theme.info }]}>
                {formatCurrency(actual.margen_servicios || 0)}
              </Text>
              <Text
                style={[styles.comparisonLabel, { color: theme.placeholder }]}
              >
                Margen
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginVertical: 8,
    padding: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    overflow: "hidden",
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
  },
  statsContainer: {
    gap: 24,
  },
  statBlock: {
    marginBottom: 16,
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  subValue: {
    fontSize: 18,
    fontWeight: "600",
  },
  comparison: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 6,
    paddingHorizontal: 10,
  },
  comparisonText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  comparisonLabel: {
    fontSize: 12,
  },
  comparisons: {
    marginTop: 6,
  },
  marginBar: {
    height: 8,
    borderRadius: 4,
    flexDirection: "row",
    backgroundColor: "#00000010",
    marginBottom: 12,
    overflow: "hidden",
  },
  marginBarSegment: {
    height: "100%",
  },
  marginDetails: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  marginPercentContainer: {
    flexDirection: "column",
  },
  marginPercent: {
    fontWeight: "700",
    fontSize: 16,
  },
  legendContainer: {
    flexDirection: "column",
    gap: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  column: {
    alignItems: "center",
  },
});

export default MarginCard;
