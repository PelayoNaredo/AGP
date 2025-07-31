import React from "react";
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  Platform,
  TouchableOpacity,
} from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { useTheme } from "../../context/ThemeContext";
import { formatCurrency } from "../../utils/helpers";

// Función para formatear números del eje Y de manera limpia
const formatYAxisLabel = (value) => {
  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  } else {
    return Math.round(value).toString();
  }
};

// Componente de gráfico financiero con 3 líneas: Ingresos, Gastos, Balance
export const ChartComponent = ({ data }) => {
  const { themeObject } = useTheme();
  const windowWidth = Dimensions.get("window").width;
  const isWeb = Platform.OS === "web";

  // Estado para tooltip manual
  const [selectedPoint, setSelectedPoint] = React.useState(null);
  const [tooltipVisible, setTooltipVisible] = React.useState(false);

  // Detectar plataforma web para evitar warnings de eventos táctiles
  const suppressWebWarnings = isWeb;

  // Validar que tenemos datos de tendencia temporal
  const isTemporalData =
    Array.isArray(data) &&
    data.length > 0 &&
    data[0].hasOwnProperty("balance") &&
    data[0].hasOwnProperty("ingresos") &&
    data[0].hasOwnProperty("gastos");

  if (!isTemporalData) {
    return (
      <View
        style={[
          styles.chartContainer,
          { backgroundColor: themeObject.colors.card },
        ]}
      >
        <Text style={[styles.noDataText, { color: themeObject.colors.text }]}>
          Datos de tendencia temporal no disponibles
        </Text>
      </View>
    );
  }

  // Definir colores para cada línea
  const colors = {
    ingresos: themeObject.colors.success, // Verde
    gastos: themeObject.colors.error, // Rojo
    balance: themeObject.colors.info, // Azul
  };

  // Preparar datos sin onPress para evitar warnings en web
  const ingresosData = data.map((item, index) => ({
    value: parseFloat(item.ingresos) || 0,
    label: item.etiqueta,
  }));

  const gastosData = data.map((item, index) => ({
    value: parseFloat(item.gastos) || 0,
    label: item.etiqueta,
  }));

  const balanceData = data.map((item, index) => ({
    value: parseFloat(item.balance) || 0,
    label: item.etiqueta,
  }));

  // Calcular rangos del eje Y de manera inteligente
  const allValues = [
    ...ingresosData.map((d) => d.value),
    ...gastosData.map((d) => d.value),
    ...balanceData.map((d) => d.value),
  ];

  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const range = maxValue - minValue;
  const padding = range * 0.15; // 15% de padding

  const yAxisMin = Math.floor((minValue - padding) / 1000) * 1000;
  const yAxisMax = Math.ceil((maxValue + padding) / 1000) * 1000;

  // Configurar divisiones del eje Y para que sea limpio
  const yAxisRange = yAxisMax - yAxisMin;
  const stepCount = 5; // Máximo 5 líneas en el eje Y
  const yAxisStep = Math.ceil(yAxisRange / stepCount / 1000) * 1000;

  // Configuración responsiva con mayor espaciado
  const chartWidth = Math.min(windowWidth * 0.95, isWeb ? 700 : windowWidth); // Más ancho
  const chartHeight = 180; // Altura fija como solicitaste
  const fontSize = isWeb ? 12 : windowWidth > 768 ? 11 : 10;

  return (
    <View
      style={[
        styles.chartContainer,
        { backgroundColor: themeObject.colors.card },
      ]}
    >
      {/* Header con título y leyenda */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeObject.colors.text }]}>
          Evolución Financiera (6 meses)
        </Text>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: colors.ingresos }]}
            />
            <Text
              style={[styles.legendText, { color: themeObject.colors.text }]}
            >
              Ingresos
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: colors.gastos }]}
            />
            <Text
              style={[styles.legendText, { color: themeObject.colors.text }]}
            >
              Gastos
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: colors.balance }]}
            />
            <Text
              style={[styles.legendText, { color: themeObject.colors.text }]}
            >
              Balance
            </Text>
          </View>
        </View>
      </View>

      {/* Gráfico de líneas */}
      <LineChart
        // Línea principal: Balance
        data={balanceData}
        color={colors.balance}
        thickness={3}
        dataPointsColor={colors.balance}
        dataPointsRadius={6}
        // Segunda línea: Ingresos
        data2={ingresosData}
        color2={colors.ingresos}
        thickness2={3}
        dataPointsColor2={colors.ingresos}
        dataPointsRadius2={6}
        // Tercera línea: Gastos
        data3={gastosData}
        color3={colors.gastos}
        thickness3={3}
        dataPointsColor3={colors.gastos}
        dataPointsRadius3={6}
        // Configuración del gráfico para mayor espaciado
        width={chartWidth}
        height={chartHeight}
        spacing={Math.max(40, chartWidth / (data.length + 1))} // Espaciado dinámico entre puntos
        initialSpacing={20} // Espaciado inicial desde el borde izquierdo
        endSpacing={20} // Espaciado final hasta el borde derecho
        // Configuración del eje Y limpia
        yAxisOffset={yAxisMin}
        maxValue={yAxisMax}
        stepValue={yAxisStep}
        noOfSections={Math.floor((yAxisMax - yAxisMin) / yAxisStep)}
        formatYLabel={formatYAxisLabel}
        // Configuración básica mejorada para web
        hideDataPoints={false}
        showValuesAsDataPointsText={false}
        // Estilos y colores
        textColor={themeObject.colors.text}
        textFontSize={fontSize - 1}
        xAxisColor={themeObject.colors.text + "40"}
        yAxisColor={themeObject.colors.text + "40"}
        gridColor={themeObject.colors.text + "15"}
        // Configuración visual
        showVerticalLines={false}
        curved={true}
        isAnimated={!isWeb} // Deshabilitar animación en web para evitar problemas
        animationDuration={isWeb ? 0 : 1200}
        // Estilos de texto
        yAxisTextStyle={{
          color: themeObject.colors.text,
          fontSize: fontSize - 2,
          fontWeight: "500",
        }}
        xAxisLabelTextStyle={{
          color: themeObject.colors.text,
          fontSize: fontSize - 1,
          textAlign: "center",
          fontWeight: "500",
        }}
        // Detectar clics en puntos de datos (solo en móvil)
        onDataPointClick={
          !isWeb
            ? (item, index) => {
                const currentData = data[index] || {};
                setSelectedPoint({ data: currentData, index });
                setTooltipVisible(true);
                setTimeout(() => setTooltipVisible(false), 3000);
              }
            : undefined
        }
      />

      {/* Tooltip manual */}
      {tooltipVisible && selectedPoint && (
        <View
          style={[
            styles.manualTooltip,
            { backgroundColor: themeObject.colors.surface },
          ]}
        >
          <Text
            style={[styles.tooltipTitle, { color: themeObject.colors.text }]}
          >
            {selectedPoint.data.etiqueta}
          </Text>
          <View style={styles.tooltipContent}>
            <Text style={[styles.tooltipLine, { color: colors.ingresos }]}>
              Ingresos: {formatCurrency(selectedPoint.data.ingresos || 0)}
            </Text>
            <Text style={[styles.tooltipLine, { color: colors.gastos }]}>
              Gastos: {formatCurrency(selectedPoint.data.gastos || 0)}
            </Text>
            <Text style={[styles.tooltipLine, { color: colors.balance }]}>
              Balance: {formatCurrency(selectedPoint.data.balance || 0)}
            </Text>
          </View>
        </View>
      )}

      {/* Controles táctiles alternativos para web */}
      {isWeb && (
        <View style={styles.webControls}>
          <Text
            style={[styles.webControlsText, { color: themeObject.colors.text }]}
          >
            Hacer clic en los meses para ver detalles:
          </Text>
          <View style={styles.monthButtons}>
            {data.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.monthButton,
                  { backgroundColor: themeObject.colors.primary + "20" },
                ]}
                onPress={() => {
                  const currentData = data[index] || {};
                  setSelectedPoint({ data: currentData, index });
                  setTooltipVisible(true);
                  setTimeout(() => setTooltipVisible(false), 4000);
                }}
              >
                <Text
                  style={[
                    styles.monthButtonText,
                    { color: themeObject.colors.primary },
                  ]}
                >
                  {item.etiqueta}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: "center",
  },
  header: {
    marginBottom: 16,
    alignItems: "center",
    width: "100%",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    fontWeight: "600",
  },
  noDataText: {
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
    padding: 20,
    opacity: 0.7,
  },
  tooltip: {
    padding: 12,
    borderRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    minWidth: 140,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  manualTooltip: {
    position: "absolute",
    top: 20,
    right: 20,
    padding: 12,
    borderRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    minWidth: 140,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    zIndex: 1000,
  },
  tooltipTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  tooltipContent: {
    gap: 4,
  },
  tooltipLine: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  webControls: {
    marginTop: 16,
    alignItems: "center",
    width: "100%",
  },
  webControlsText: {
    fontSize: 12,
    marginBottom: 10,
    opacity: 0.8,
  },
  monthButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  monthButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    margin: 2,
  },
  monthButtonText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
