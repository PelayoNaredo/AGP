import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatCurrency } from "../../utils/helpers";
import { PieChart } from "react-native-gifted-charts";

// Muestra un resumen del balance entre productos y servicios
export const ProductServiceBalanceCard = ({ data, theme, navigation }) => {
  // Extraer datos del resumen
  const resumen = data?.resumen || {
    ingresos_productos: 0,
    ingresos_servicios: 0,
    porcentaje_productos: 0,
    porcentaje_servicios: 0,
    total_ventas: 0,
    solo_productos: 0,
    solo_servicios: 0,
    productos_y_servicios: 0,
  };

  // Datos para el gráfico
  const chartData = [
    {
      value: resumen.porcentaje_productos,
      color: theme.primary,
      text: `${Math.round(resumen.porcentaje_productos)}%`,
      label: "Productos",
      focused: true,
    },
    {
      value: resumen.porcentaje_servicios,
      color: theme.info,
      text: `${Math.round(resumen.porcentaje_servicios)}%`,
      label: "Servicios",
    },
  ];

  // Datos de distribución
  const distribucionVentas = [
    {
      label: "Solo Productos",
      value: resumen.solo_productos,
      percent: ((resumen.solo_productos / resumen.total_ventas) * 100).toFixed(
        1
      ),
      icon: "cube",
      color: theme.primary,
    },
    {
      label: "Solo Servicios",
      value: resumen.solo_servicios,
      percent: ((resumen.solo_servicios / resumen.total_ventas) * 100).toFixed(
        1
      ),
      icon: "construct",
      color: theme.info,
    },
    {
      label: "Mixtas",
      value: resumen.productos_y_servicios,
      percent: (
        (resumen.productos_y_servicios / resumen.total_ventas) *
        100
      ).toFixed(1),
      icon: "layers",
      color: theme.success,
    },
  ];
  // Preparar datos para el gráfico de distribución diaria si está disponible
  const distribDaily = data?.distribucion_diaria || [];
  const hasDistribution = distribDaily && distribDaily.length > 0;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.surface }]}
      accessibilityLabel="Balance entre productos y servicios"
    >
      <View style={styles.header}>
        <Ionicons name="pie-chart" size={24} color={theme.text} />
        <Text style={[styles.title, { color: theme.text }]}>
          Balance Productos vs Servicios
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.chartSection}>
          <PieChart
            data={chartData}
            donut
            radius={90}
            innerRadius={60}
            innerCircleColor={theme.background}
            centerLabelComponent={() => (
              <View style={styles.centerLabelContainer}>
                <Text style={[styles.centerLabel, { color: theme.text }]}>
                  {resumen.total_ventas}
                </Text>
                <Text
                  style={[styles.centerLabelSub, { color: theme.placeholder }]}
                >
                  ventas
                </Text>
                <Text style={[styles.centerValue, { color: theme.success }]}>
                  {formatCurrency(resumen.ingresos_totales)}
                </Text>
              </View>
            )}
          />
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendColor, { backgroundColor: theme.primary }]}
              />
              <Text style={[styles.legendText, { color: theme.text }]}>
                Productos: {formatCurrency(resumen.ingresos_productos)}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendColor, { backgroundColor: theme.info }]}
              />
              <Text style={[styles.legendText, { color: theme.text }]}>
                Servicios: {formatCurrency(resumen.ingresos_servicios)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Distribución de Ventas
          </Text>
          <View style={styles.statsContainer}>
            {distribucionVentas.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.statCard,
                  { backgroundColor: item.color + "15" },
                ]}
              >
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: item.color + "30" },
                  ]}
                >
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <View style={styles.statInfo}>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {item.value}
                  </Text>
                  <Text
                    style={[styles.statLabel, { color: theme.placeholder }]}
                  >
                    {item.label}
                  </Text>
                  <Text style={[styles.statPercent, { color: item.color }]}>
                    {item.percent}% del total
                  </Text>
                </View>
              </View>
            ))}
          </View>
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
  content: {
    gap: 24,
  },
  chartSection: {
    alignItems: "center",
  },
  centerLabelContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  centerLabel: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  centerLabelSub: {
    fontSize: 12,
    textAlign: "center",
  },
  centerValue: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 4,
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
  },
  statsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statInfo: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statPercent: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
});

export default ProductServiceBalanceCard;
