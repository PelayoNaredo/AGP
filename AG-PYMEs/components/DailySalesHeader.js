import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { Card, Button, Divider, IconButton, Chip } from "react-native-paper";
import { useTheme } from "../context/ThemeContext";
import { formatCurrency } from "../utils/helpers";

/**
 * Componente de cabecera para mostrar el control de fechas y resumen de ventas diarias
 * en una sola tarjeta compacta
 */
const DailySalesHeader = ({
  selectedDate,
  onDateChange,
  dailyTotal = 0,
  salesCount = 0,
  hasDailyClosure = false,
  onCloseDayPress,
  isToday = false,
  filteredSales = [], // Nueva prop para recibir las ventas filtradas directamente
}) => {
  const { themeObject } = useTheme();

  // Función para cambiar de día (anterior, siguiente, hoy)
  const changeDay = (direction) => {
    const newDate = new Date(selectedDate);
    
    if (direction === "prev") {
      newDate.setDate(newDate.getDate() - 1);
    } else if (direction === "next") {
      newDate.setDate(newDate.getDate() + 1);
    } else if (direction === "today") {
      newDate.setDate(new Date().getDate());
      newDate.setMonth(new Date().getMonth());
      newDate.setFullYear(new Date().getFullYear());
    }
    
    onDateChange(newDate);
  };

  // Calcular totales por estado de pago
  const calculateTotalsByStatus = () => {
    if (!filteredSales || filteredSales.length === 0) {
      return { pagado: 0, pendiente: 0, total: 0 };
    }

    return filteredSales.reduce((totals, sale) => {
      // Asegurarse de que el total es un número válido
      const saleTotal = typeof sale.total === 'string' 
        ? parseFloat(sale.total.replace(/[^\d.-]/g, '')) 
        : parseFloat(sale.total || 0);
        
      if (!isNaN(saleTotal)) {
        if (sale.estado === 'pagado' || sale.estado === 'parcial') {
          totals.pagado += saleTotal;
        } else if (sale.estado === 'pendiente') {
          totals.pendiente += saleTotal;
        }
        totals.total += saleTotal;
      }
      return totals;
    }, { pagado: 0, pendiente: 0, total: 0 });
  };

  const totals = calculateTotalsByStatus();

  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    card: {
      marginBottom: 12,
      elevation: 3,
    },
    cardContent: {
      padding: Platform.OS === 'web' ? 12 : 8,
    },
    // Sección superior: Control de fechas
    dateControlSection: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingBottom: 8,
    },
    dateButtonsContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    dateButton: {
      margin: 0,
    },
    dateDisplay: {
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      paddingHorizontal: 8,
    },
    dateText: {
      fontSize: Platform.OS === 'web' ? 16 : 14,
      fontWeight: "bold",
      color: themeObject.colors.primary,
    },
    todayBadge: {
      fontSize: 10,
      marginLeft: 4,
      backgroundColor: themeObject.colors.primary + "40",
      color: themeObject.colors.primary,
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: 4,
    },
    divider: {
      marginVertical: 8,
    },
    // Sección inferior: Resumen de ventas
    summarySection: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: 8,
      flexWrap: Platform.OS === 'web' ? "nowrap" : "wrap",
    },
    summaryInfo: {
      flex: Platform.OS === 'web' ? 1 : 0,
      marginRight: 8,
    },
    totalAmount: {
      fontSize: Platform.OS === 'web' ? 20 : 18,
      fontWeight: "bold",
      color: themeObject.colors.primary,
    },
    subtotalRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 2,
      gap: 4,
    },
    subtotalText: {
      fontSize: 12,
      color: themeObject.colors.placeholder,
    },
    subtotalAmount: {
      fontSize: 12,
      fontWeight: "500",
      color: themeObject.colors.text,
    },
    statusChip: {
      height: 16,
      marginRight: 4,
    },
    statusText: {
      fontSize: 10,
    },
    salesDetails: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 2,
    },
    salesCount: {
      fontSize: 12,
      color: themeObject.colors.placeholder,
    },
    actionButton: {
      marginTop: Platform.OS === 'web' ? 0 : 8,
      alignSelf: Platform.OS === 'web' ? "auto" : "flex-end",
    },
  });

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          {/* Sección superior: Control de fechas */}
          <View style={styles.dateControlSection}>
            <View style={styles.dateButtonsContainer}>
              <IconButton
                icon="chevron-left"
                size={20}
                onPress={() => changeDay("prev")}
                style={styles.dateButton}
              />
              <TouchableOpacity
                style={styles.dateDisplay}
                onPress={() => changeDay("today")}
                accessible={true}
                accessibilityLabel="Ir a hoy"
                accessibilityHint="Pulse para ir a la fecha de hoy"
              >
                <Text style={styles.dateText}>
                  {selectedDate.toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: Platform.OS === 'web' ? "short" : "numeric",
                    year: "numeric",
                  })}
                </Text>
                {isToday && (
                  <Text style={styles.todayBadge}>HOY</Text>
                )}
              </TouchableOpacity>
              <IconButton
                icon="chevron-right"
                size={20}
                onPress={() => changeDay("next")}
                style={styles.dateButton}
              />
            </View>
            
            <Text style={styles.salesCount}>
              {salesCount > 0 
                ? `${salesCount} ${salesCount === 1 ? "venta" : "ventas"}`
                : "Sin ventas"}
            </Text>
          </View>

          <Divider style={styles.divider} />

          {/* Sección inferior: Resumen de ventas y botón de cierre */}
          <View style={styles.summarySection}>
            <View style={styles.summaryInfo}>
              <Text style={styles.totalAmount}>
                {formatCurrency(totals.total)}
              </Text>
              
              {totals.pagado > 0 && (
                <View style={styles.subtotalRow}>
                  <Chip 
                    mode="flat"
                    style={[styles.statusChip, { backgroundColor: themeObject.colors.success + "30" }]}
                    textStyle={[styles.statusText, { color: themeObject.colors.success }]}
                  >
                    Pagado
                  </Chip>
                  <Text style={styles.subtotalAmount}>
                    {formatCurrency(totals.pagado)}
                  </Text>
                </View>
              )}
              
              {totals.pendiente > 0 && (
                <View style={styles.subtotalRow}>
                  <Chip 
                    mode="flat"
                    style={[styles.statusChip, { backgroundColor: themeObject.colors.warning + "30" }]}
                    textStyle={[styles.statusText, { color: themeObject.colors.warning }]}
                  >
                    Pendiente
                  </Chip>
                  <Text style={styles.subtotalAmount}>
                    {formatCurrency(totals.pendiente)}
                  </Text>
                </View>
              )}
              
              <Text style={styles.salesCount}>
                {hasDailyClosure 
                  ? "✓ Día cerrado" 
                  : "Pendiente de cierre"}
              </Text>
            </View>

            <Button
              mode="contained"
              icon="cash-register"
              onPress={onCloseDayPress}
              disabled={hasDailyClosure}
              style={styles.actionButton}
              contentStyle={{ paddingHorizontal: 8 }}
              labelStyle={{ fontSize: Platform.OS === 'web' ? 14 : 12 }}
              compact={Platform.OS !== 'web'}
              theme={{ 
                colors: { 
                  primary: hasDailyClosure 
                    ? themeObject.colors.disabled 
                    : themeObject.colors.success 
                } 
              }}
            >
              {hasDailyClosure ? "Cierre Realizado" : "Cierre Diario"}
            </Button>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
};

export default DailySalesHeader;