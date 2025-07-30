import React from "react";
import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatCurrency } from "../../utils/helpers";
import { PieChart } from "react-native-gifted-charts";
import Color from "color";

// Muestra un resumen del inventario con un gráfico de pastel y estadísticas
export const InventoryCard = ({ data, theme, navigation }) => {
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;
  const isMediumScreen = width > 400;

  // Verificación defensiva para evitar errores si data es undefined
  if (!data || !data.categorias) {
    return (
      <View style={[styles.container, { backgroundColor: theme.card }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Inventario</Text>
          <Ionicons name="cube-outline" size={24} color={theme.primary} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Cargando datos del inventario...
          </Text>
        </View>
      </View>
    );
  }

  // Datos para el gráfico de pastel
  const chartData = [
    {
      value: data.categorias.agotados,
      text: `${data.categorias.agotados}`,
      label: "Agotado",
      color: theme.error,
      shiftTextX: 0,
      shiftTextY: -2,
      labelTextStyle: { color: theme.text },
    },
    {
      value: data.categorias.critico,
      text: `${data.categorias.critico}`,
      label: "Crítico",
      color: Color(theme.error).lighten(0.3).toString(),
      shiftTextX: 0,
      shiftTextY: -2,
      labelTextStyle: { color: theme.text },
    },
    {
      value: data.categorias.bajo,
      text: `${data.categorias.bajo}`,
      label: "Bajo",
      color: theme.warning,
      shiftTextX: 0,
      shiftTextY: -2,
      labelTextStyle: { color: theme.text },
    },
    {
      value: data.categorias.adecuado,
      text: `${data.categorias.adecuado}`,
      label: "Adecuado",
      color: theme.success,
      shiftTextX: 0,
      shiftTextY: -2,
      labelTextStyle: { color: theme.text },
    },
    {
      value: data.categorias.excedente,
      text: `${data.categorias.excedente}`,
      label: "Excedente",
      color: theme.info,
      shiftTextX: 0,
      shiftTextY: -2,
      labelTextStyle: { color: theme.text },
    },
  ];

  // Añadimos el sexto elemento para las estadísticas (Productos totales)
  const statsItems = [
    {
      icon: "pricetag",
      value: data.productosTotal,
      label: "Total",
      color: theme.text,
      backgroundColor: Color(theme.surface).alpha(0.9).toString(),
    },
    ...chartData.map((category) => ({
      value: category.value,
      label: category.label,
      color: category.color,
      backgroundColor: Color(category.color).alpha(0.1).toString(),
    })),
  ];

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: theme.surface,
          marginHorizontal: isLargeScreen ? 0 : 8,
          padding: isLargeScreen ? 24 : 16,
          borderRadius: isLargeScreen ? 16 : 12,
        },
      ]}
      accessibilityLabel={`Resumen de inventario. Valor total: ${formatCurrency(data.valorTotal)}`}
    >
      <View style={styles.cardHeader}>
        <Ionicons name="cube" size={24} color={theme.text} />
        <View>
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            Inventario
          </Text>
          <Text style={[styles.cardSubtitle, { color: theme.placeholder }]}>
            Resumen de stock
          </Text>
        </View>
      </View>

      {/* Chart primero (arriba) */}
      <View style={styles.chartContainer}>
        <PieChart
          data={chartData}
          donut
          sectionAutoFocus
          textColor={theme.text}
          radius={isLargeScreen ? 130 : 100}
          innerRadius={isLargeScreen ? 90 : 80}
          innerCircleColor={theme.card}
          centerLabelComponent={() => (
            <View
              style={[styles.centerLabel, { backgroundColor: "transparent" }]}
            >
              <Text style={[styles.centerLabelText, { color: theme.text }]}>
                {formatCurrency(data.valorTotal)}
              </Text>
              <Text
                style={[
                  styles.centerLabelSubtext,
                  { color: theme.placeholder },
                ]}
              >
                Valor Total
              </Text>
            </View>
          )}
        />
      </View>

      {/* Stats en dos filas de 3 elementos (abajo) */}
      <View style={styles.statsRows}>
        {/* Primera fila de 3 elementos */}
        <View style={styles.statsRow}>
          {statsItems.slice(0, 3).map((item, index) => (
            <View
              key={index}
              style={[
                styles.statItem,
                {
                  backgroundColor: item.backgroundColor,
                  shadowColor: theme.shadow,
                  width: "30%",
                },
              ]}
            >
              {index === 0 && (
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={theme.text}
                  style={{ marginRight: 8 }}
                />
              )}
              {index !== 0 && (
                <View
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: item.color,
                    marginRight: 12,
                  }}
                />
              )}
              <View>
                <Text style={[styles.statValue, { color: item.color }]}>
                  {item.value}
                </Text>
                <Text style={[styles.statLabel, { color: theme.placeholder }]}>
                  {item.label}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Segunda fila de 3 elementos */}
        <View style={styles.statsRow}>
          {statsItems.slice(3, 6).map((item, index) => (
            <View
              key={index + 3}
              style={[
                styles.statItem,
                {
                  backgroundColor: item.backgroundColor,
                  shadowColor: theme.shadow,
                  width: "30%",
                },
              ]}
            >
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: item.color,
                  marginRight: 12,
                }}
              />
              <View>
                <Text style={[styles.statValue, { color: item.color }]}>
                  {item.value}
                </Text>
                <Text style={[styles.statLabel, { color: theme.placeholder }]}>
                  {item.label}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 16,
    marginVertical: 8,
    padding: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    overflow: "hidden",
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 14,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.3,
    lineHeight: 24,
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.2,
    marginTop: 2,
  },
  chartContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  statsRows: {
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  totalValue: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.3,
    textAlign: "center",
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
  },
  centerLabel: {
    justifyContent: "center",
    alignItems: "center",
  },
  centerLabelText: {
    fontSize: 24,
    fontWeight: "700",
  },
  centerLabelSubtext: {
    fontSize: 14,
    fontWeight: "500",
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
  },
  loadingText: {
    fontSize: 14,
    fontStyle: "italic",
  },
});
