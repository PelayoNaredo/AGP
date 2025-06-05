import { View, Text, FlatList, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatCurrency } from "../../utils/helpers";
import { useTheme } from "../../context/ThemeContext";

// Componente OrdersCard muestra un resumen de pedidos con estadísticas y una lista de pedidos recientes
export const OrdersCard = ({ data }) => {
  const windowWidth = Dimensions.get("window").width;
  const { themeObject } = useTheme();
  const theme = themeObject.colors;

  const getStatusColor = (status) => {
    const statusColors = {
      Pendiente: theme.warning,
      Enviado: theme.info,
      Completado: theme.success,
      Cancelado: theme.error,
    };
    return statusColors[status] || theme.text;
  };

  // Función para encontrar un estado específico en las estadísticas
  const findStatusData = (statusName) => {
    const estadoEncontrado = data.estadisticas.porEstado.find(
      (estado) => estado.estado === statusName
    );
    return estadoEncontrado ? estadoEncontrado.cantidad : 0;
  };

  const renderOrderItem = ({ item }) => (
    <View style={styles.orderItem}>
      <View style={styles.orderHeader}>
        <Text style={[styles.orderId, { color: theme.text }]}>
          ID del pedido: #{item.id_pedido}
        </Text>
        <View
          style={[
            styles.orderStatus,
            { backgroundColor: getStatusColor(item.estado) + "20" },
          ]}
        >
          <Text
            style={[styles.statusText, { color: getStatusColor(item.estado) }]}
          >
            {item.estado.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={[styles.supplier, { color: theme.text }]} numberOfLines={1}>
        {item.proveedor}
      </Text>

      <View style={styles.orderFooter}>
        <Text style={[styles.orderDate, { color: theme.placeholder }]}>
          {new Date(item.fecha_pedido).toLocaleDateString()}
        </Text>
        <Text style={[styles.orderTotal, { color: theme.text }]}>
          {formatCurrency(item.total)}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.cardContainer, { backgroundColor: theme.surface }]}>
      <View style={styles.cardHeader}>
        <Ionicons name="boat" size={24} color={theme.text} />
        <Text style={[styles.cardTitle, { color: theme.text }]}>Pedidos</Text>
        <View style={styles.ordersCounter}>
          <Text style={[styles.counterText, { color: theme.text }]}>
            {data.pendientes} Pedidos
          </Text>
          <Text style={[styles.totalText, { color: theme.text }]}>
            {formatCurrency(data.totalPendiente)}
          </Text>
        </View>
      </View>

      {/* Tarjetas de estado en lugar del gráfico */}
      <View style={styles.statusCardsContainer}>
        {["Pendiente", "Enviado", "Completado", "Cancelado"].map((estado) => (
          <View
            key={estado}
            style={[
              styles.statusCard,
              { backgroundColor: getStatusColor(estado) + "15" },
            ]}
          >
            <Text
              style={[
                styles.statusCardTitle,
                { color: getStatusColor(estado) },
              ]}
            >
              {estado}
            </Text>
            <Text style={[styles.statusCardCount, { color: theme.text }]}>
              {findStatusData(estado)}
            </Text>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: getStatusColor(estado) },
              ]}
            />
          </View>
        ))}
      </View>

      <FlatList
        data={data.recientes}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id_pedido.toString()}
        scrollEnabled={false}
        contentContainerStyle={styles.ordersList}
      />
    </View>
  );
};

const styles = {
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
    marginBottom: 20,
    paddingTop: 12,
    paddingHorizontal: 12,
    gap: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
    letterSpacing: 0.5,
  },
  ordersCounter: {
    textAlign: "center",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  counterText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  statusCardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginVertical: 16,
    paddingHorizontal: 8,
  },
  statusCard: {
    width: "48%",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    position: "relative",
    overflow: "hidden",
    minHeight: 90,
  },
  statusCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  statusCardCount: {
    fontSize: 24,
    fontWeight: "700",
  },
  statusIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
    height: 4,
  },
  orderItem: {
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 12,
    padding: 12,
    marginVertical: 4,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderStatus: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  supplier: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  orderId: {
    fontSize: 14,
    fontWeight: "500",
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderDate: {
    fontSize: 12,
    opacity: 0.8,
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: "600",
  },
  ordersList: {
    marginTop: 16,
  },
  verTodos: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 16,
    paddingVertical: 8,
  },
  totalText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
};
