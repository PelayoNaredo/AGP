import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ChartComponent } from "./ChartComponent";
import { formatCurrency } from "../../utils/helpers";

// ComparisonIndicator muestra un icono de tendencia y un porcentaje de comparación
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

// FinancialCard muestra un resumen financiero con ingresos, gastos y balance
export const FinancialCard = ({
  data,
  tendenciaBalance,
  theme,
  navigation,
}) => {
  const calculatePercentChange = (actual, comparacion) => {
    if (comparacion === 0) return actual > 0 ? 100 : 0;
    return ((actual - comparacion) / Math.abs(comparacion)) * 100;
  };

  // Usar datos de tendencia si están disponibles, sino usar formato anterior
  const chartData = tendenciaBalance || [
    // Fallback al formato anterior
    { x: "Ingresos", y: data.actual.ingresos, periodo: "actual" },
    { x: "Ingresos", y: data.anterior.ingresos, periodo: "anterior" },
    { x: "Ingresos", y: data.anual.ingresos, periodo: "anual" },
    { x: "Gastos", y: -data.actual.gastos, periodo: "actual" },
    { x: "Gastos", y: -data.anterior.gastos, periodo: "anterior" },
    { x: "Gastos", y: -data.anual.gastos, periodo: "anual" },
    { x: "Balance", y: data.actual.balance, periodo: "actual" },
    { x: "Balance", y: data.anterior.balance, periodo: "anterior" },
    { x: "Balance", y: data.anual.balance, periodo: "anual" },
  ];

  return (
    <View
      style={[styles.container, { backgroundColor: theme.surface + "40" }]}
      accessibilityLabel="Resumen financiero"
    >
      <View style={styles.header}>
        <Ionicons name="wallet" size={24} color={theme.text} />
        <Text style={[styles.title, { color: theme.text }]}>
          Resumen Financiero (30 días)
        </Text>
      </View>

      <ChartComponent data={chartData} />

      <View style={styles.statsContainer}>
        {/* Ingresos */}
        <View style={styles.statBlock}>
          <View style={styles.statHeader}>
            <Text style={[styles.statLabel, { color: theme.text }]}>
              Ingresos
            </Text>
            <ComparisonIndicator
              value={calculatePercentChange(
                data.actual.ingresos,
                data.anterior.ingresos
              )}
              color={theme.success}
            />
          </View>
          <Text style={[styles.statValue, { color: theme.success }]}>
            {formatCurrency(data.actual.ingresos)}
          </Text>
          <View style={styles.comparisons}>
            <Text
              style={[styles.comparisonLabel, { color: theme.placeholder }]}
            >
              vs Mes pasado: {formatCurrency(data.anterior.ingresos)}
            </Text>
            <Text
              style={[styles.comparisonLabel, { color: theme.placeholder }]}
            >
              vs Año pasado: {formatCurrency(data.anual.ingresos)}
            </Text>
          </View>
        </View>

        {/* Gastos */}
        <View style={styles.statBlock}>
          <View style={styles.statHeader}>
            <Text style={[styles.statLabel, { color: theme.text }]}>
              Gastos
            </Text>
            <ComparisonIndicator
              value={calculatePercentChange(
                -data.actual.gastos,
                -data.anterior.gastos
              )}
              color={theme.error}
            />
          </View>
          <Text style={[styles.statValue, { color: theme.error }]}>
            {formatCurrency(data.actual.gastos)}
          </Text>
          <View style={styles.comparisons}>
            <Text
              style={[styles.comparisonLabel, { color: theme.placeholder }]}
            >
              vs Mes pasado: {formatCurrency(data.anterior.gastos)}
            </Text>
            <Text
              style={[styles.comparisonLabel, { color: theme.placeholder }]}
            >
              vs Año pasado: {formatCurrency(data.anual.gastos)}
            </Text>
          </View>
        </View>

        {/* Balance */}
        <View style={styles.statBlock}>
          <View style={styles.statHeader}>
            <Text style={[styles.statLabel, { color: theme.text }]}>
              Balance
            </Text>
            <ComparisonIndicator
              value={calculatePercentChange(
                data.actual.balance,
                data.anterior.balance
              )}
              color={theme.info}
            />
          </View>
          <Text
            style={[
              styles.statValue,
              {
                color: data.actual.balance >= 0 ? theme.info : theme.error,
              },
            ]}
          >
            {formatCurrency(data.actual.balance)}
          </Text>
          <View style={styles.comparisons}>
            <Text
              style={[styles.comparisonLabel, { color: theme.placeholder }]}
            >
              vs Mes pasado: {formatCurrency(data.anterior.balance)}
            </Text>
            <Text
              style={[styles.comparisonLabel, { color: theme.placeholder }]}
            >
              vs Año pasado: {formatCurrency(data.anual.balance)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
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
    marginTop: 20,
  },
  statBlock: {
    gap: 8,
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  comparison: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  comparisonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  comparisons: {
    gap: 4,
  },
  comparisonLabel: {
    fontSize: 12,
  },
});
