import React from "react";
import { View, StyleSheet, Text, Dimensions, Platform } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { useTheme } from "../../context/ThemeContext";
import { formatCurrency } from "../../utils/helpers";

// Componente de leyenda personalizada
const CustomLegend = ({ items, theme }) => (
  <View
    style={[styles.legendContainer, { backgroundColor: theme.colors.card }]}
  >
    {items.map((item, index) => (
      <View key={index} style={styles.legendItem}>
        <View style={[styles.legendColor, { backgroundColor: item.color }]} />
        <Text style={[styles.legendText, { color: theme.colors.text }]}>
          {item.label}
        </Text>
      </View>
    ))}
  </View>
);

// Componente principal del gráfico de barras, que recibe datos como prop
export const ChartComponent = ({ data }) => {
  const { themeObject } = useTheme();
  const windowWidth = Dimensions.get("window").width;
  const isWeb = Platform.OS === "web";

  // Ajustes responsivos
  const chartWidth = Math.min(windowWidth * 0.9, isWeb ? 1200 : windowWidth);
  const barWidth = isWeb ? 40 : windowWidth > 768 ? 30 : 24;
  const barSpacing = isWeb ? 32 : windowWidth > 768 ? 24 : 16;
  const fontSize = isWeb ? 12 : windowWidth > 768 ? 12 : 10;
  const labelMargin = isWeb ? -barWidth * 2 : -(barWidth + barSpacing * 2) * 2;

  // Formateo de números largos para el eje Y
  const formatYLabel = (value) => {
    const absValue = Math.abs(value);
    if (absValue >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (absValue >= 1e3) return `${(value / 1e3).toFixed(1)}k`;
    return formatCurrency(value);
  };

  // Definición de los periodos
  const periods = [
    {
      id: "actual",
      label: "Últimos 30 días",
      color: themeObject.colors.success,
    },
    {
      id: "anterior",
      label: "Anteriores 30 días",
      color: themeObject.colors.info,
    },
    {
      id: "anual",
      label: "Mismo periodo año anterior",
      color: themeObject.colors.warning,
    },
  ];

  // Definición de los datos de la barra
  const initialBarData = data.reduce((acc, item) => {
    const period = periods.find((p) => p.id === item.periodo);
    if (period) {
      acc.push({
        value: Math.abs(item.y),
        label: "",
        spacing: 2,
        frontColor: period.color,

        topLabelComponent: () => (
          <View style={styles.barLabelContainer}>
            <Text
              style={[
                styles.barLabel,
                {
                  color: themeObject.colors.text,
                  backgroundColor: themeObject.colors.card,
                  fontSize: fontSize,
                },
              ]}
            ></Text>
          </View>
        ),
      });
    }
    return acc;
  }, []);

  // Extraccion del mayor valor para la barra dummy y el eje Y
  const maxValue = Math.max(...initialBarData.map((bar) => bar.value), 0);

  const barData = data.reduce((acc, item, index) => {
    const period = periods.find((p) => p.id === item.periodo);
    if (period) {
      acc.push(initialBarData.find((bar) => Math.abs(item.y) === bar.value));
    }

    //Barras dummy con el label de grupo
    if ((index + 1) % 3 === 0 && index < data.length - 1) {
      acc.push({
        value: maxValue,
        label: item.x,
        spacing: barSpacing,
        frontColor: "transparent",
        labelTextStyle: {
          color: themeObject.colors.text,
          fontSize: fontSize - (isWeb ? 0 : 1),
          marginLeft: labelMargin,
        },
      });
    }
    if (data.length - 1 === index) {
      acc.push({
        value: maxValue,
        label: "Balance",
        frontColor: "transparent",
        spacing: barSpacing,
        labelTextStyle: {
          color: themeObject.colors.text,
          fontSize: fontSize - (isWeb ? 0 : 1),
          marginLeft: labelMargin,
        },
      });
    }

    return acc;
  }, []);

  const increment = (maxValue * 1.2) / 5;
  const maxValueForChart = maxValue === 0 ? 100 : maxValue * 1.2;

  const yAxisLabelTexts = Array.from({ length: 6 }, (_, index) =>
    formatYLabel(index * increment)
  );

  return (
    <View
      style={[
        styles.chartContainer,
        {
          backgroundColor: themeObject.colors.card,
          marginHorizontal: isWeb ? 16 : 8,
          padding: isWeb ? 24 : 16,
          width: chartWidth,
          alignSelf: "center",
        },
      ]}
    >
      <BarChart
        isAnimated
        data={barData}
        barWidth={barWidth}
        spacing={barSpacing}
        autoShiftLabels={true}
        barBorderRadius={6}
        xAxisColor={themeObject.colors.text}
        yAxisColor={themeObject.colors.text}
        xAxisThickness={1}
        yAxisThickness={1}
        yAxisTextStyle={{
          color: themeObject.colors.text,
          fontSize: fontSize,
          paddingRight: 12,
          width: "auto",
        }}
        noOfSections={5}
        maxValue={maxValueForChart}
        yAxisLabelTexts={yAxisLabelTexts}
        gridColor={themeObject.colors.text + "20"}
        initialSpacing={isWeb ? 20 : 30}
        endSpacing={isWeb ? 20 : 10}
        animationDuration={1000}
        xAxisConfig={{
          showXAxisIndices: true,
          labelRotation: -45,
          labelsPadding: 10,
          labelStyle: {
            color: themeObject.colors.text,
            fontSize: fontSize - (isWeb ? 0 : 1),
          },
          labelPosition: "center",
        }}
        renderTooltip={(item) => (
          <View
            style={[
              styles.tooltip,
              { backgroundColor: themeObject.colors.card },
            ]}
          >
            <Text style={{ color: themeObject.colors.text }}>
              {formatCurrency(item.value)}
            </Text>
          </View>
        )}
        yAxisOffset={isWeb ? 30 : 35}
        yAxisLabelWidth={isWeb ? 80 : 60}
        width={chartWidth * 0.85}
        style={{ marginLeft: 20 }}
      />
      <CustomLegend items={periods} theme={themeObject} />
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 36,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    overflow: "hidden",
    paddingTop: 18,
    paddingRight: 8,
  },
  legendContainer: {
    flexDirection: Platform.OS === "web" ? "row" : "column",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 20,
    marginTop: 24,
    padding: 12,
    borderRadius: 12,
    width: "100%",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
  legendText: {
    fontWeight: "600",
  },
  barLabelContainer: {
    marginBottom: 6,
    alignItems: "center",
  },
  barLabel: {
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  tooltip: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ffffff20",
  },
});
