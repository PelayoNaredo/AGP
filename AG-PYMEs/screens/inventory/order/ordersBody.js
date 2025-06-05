import React, { useState, useEffect } from "react";
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Pressable,
  Platform,
} from "react-native";
import { Card } from "react-native-paper";
import { useTheme } from "../../../context/ThemeContext";
import CustomButton from "../../../components/customButton";
import { Services } from "../../../api/index";
import OrderModal from "./ordersModal";
import { formatDate, safeToFixed } from "../../../utils/helpers";

// Componente OrdersBody para manejar la lógica de pedidos
const OrdersBody = () => {
  const { themeObject } = useTheme();
  const styles = createStyles(themeObject);

  const [orders, setOrders] = useState([]);
  const [orderDetails, setOrderDetails] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        const [ordersData, detailsData, inventoryData, suppliersData] =
          await Promise.all([
            Services.Data.Orders.getAll(),
            Services.Data.OrderDetails.getAll(),
            Services.Data.Inventory.getAll(),
            Services.Data.Suppliers.getAll(),
          ]);

        setOrders(ordersData);
        setOrderDetails(detailsData);
        setInventory(inventoryData);
        setSuppliers(suppliersData);
      } catch (error) {
        Alert.alert("Error", "Error cargando datos");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Funciones auxiliares
  // Obtenemos el producto y lo formateamos
  const getOrderItems = (orderId) => {
    return orderDetails
      .filter((d) => d.id_pedido === orderId)
      .map((detail) => ({
        id_producto: detail.id_producto,
        cantidad: detail.cantidad,
        precio_unitario: detail.precio_unitario,
        nombre_producto:
          inventory.find((p) => p.id_producto === detail.id_producto)
            ?.nombre_producto || "Producto no encontrado",
      }));
  };

  //Obtener el nombre del proveedor
  const getSupplierName = (supplierId) => {
    const supplier = suppliers.find((s) => s.id_proveedor === supplierId);
    return supplier ? supplier.nombre_proveedor : "Proveedor no encontrado";
  };
  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const ordersData = await Services.Data.Orders.getAll();
      setOrders(ordersData);
    } catch (error) {
      Alert.alert("Error", "Error cargando pedidos");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(); // Cargar pedidos al inicio
  }, []);

  // Actualizar inventario cuando un pedido se completa
  const updateInventoryOnComplete = async (orderId) => {
    try {
      const details = orderDetails.filter((d) => d.id_pedido === orderId);

      for (const detail of details) {
        const product = inventory.find(
          (p) => p.id_producto === detail.id_producto
        );
        if (product) {
          await Services.Data.Inventory.update(product.id_producto, {
            ...product,
            cantidad_actual: product.cantidad_actual + detail.cantidad,
            fecha_actualizacion: new Date().toISOString().split("T")[0],
          });
        }
      }

      const updatedInventory = await Services.Data.Inventory.getAll();
      setInventory(updatedInventory);
    } catch (error) {
      console.error("Error actualizando inventario:", error);
    }
  };

  // Manejar cambio de estado
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const order = orders.find((o) => o.id_pedido === orderId);
      const updatedOrder = await Services.Data.Orders.update(orderId, {
        ...order,
        estado: newStatus,
      });

      setOrders((prev) =>
        prev.map((o) => (o.id_pedido === orderId ? updatedOrder : o))
      );

      if (newStatus === "Completado") {
        await updateInventoryOnComplete(orderId);
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo actualizar el estado");
    }
  };

  // Manejar la eliminación de un producto de un pedido
  const handleRemoveItem = async (orderId, productId) => {
    try {
      // Obtener el orderDetail correspondiente
      const detailToRemove = orderDetails.find(
        (d) => d.id_pedido === orderId && d.id_producto === productId
      );

      if (detailToRemove) {
        // Eliminar el orderDetail
        await Services.Data.OrderDetails.delete(detailToRemove.id_detalle);

        // Recargar los detalles del pedido
        const updatedDetails = await Services.Data.OrderDetails.getAll();
        setOrderDetails(updatedDetails);

        // Recargar los pedidos para actualizar la interfaz
        await loadOrders();
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo eliminar el producto del pedido");
    }
  };

  // Renderizar cada pedido
  const renderOrderItem = ({ item }) => {
    const details = orderDetails.filter((d) => d.id_pedido === item.id_pedido);

    return (
      <Card style={styles.orderCard}>
        <Pressable onPress={() => setSelectedOrder(item)}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderTitle}>Pedido #{item.id_pedido}</Text>
            <Text
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(item.estado, themeObject) },
              ]}
            >
              {item.estado}
            </Text>
          </View>

          <Text style={styles.supplierText}>
            Proveedor: {getSupplierName(item.id_proveedor)}
          </Text>

          <View style={styles.datesContainer}>
            <Text style={styles.dateText}>
              Pedido: {formatDate(item.fecha_pedido)}
            </Text>
            <Text style={styles.dateText}>
              Entrega prevista: {formatDate(item.fecha_entrega_estimada)}
            </Text>
          </View>

          {details.map((detail) => (
            <View key={detail.id_detalle} style={styles.detailRow}>
              <Text style={styles.detailText}>
                {
                  inventory.find((p) => p.id_producto === detail.id_producto)
                    ?.nombre_producto
                }
              </Text>
              <Text style={styles.detailText}>
                {detail.cantidad} x ${safeToFixed(detail.precio_unitario)}
              </Text>
              <Text style={styles.detailText}>
                ${safeToFixed(detail.subtotal)}
              </Text>
            </View>
          ))}

          <View style={styles.totalContainer}>
            <Text style={styles.totalText}>
              Total: ${safeToFixed(item.total)}
            </Text>
          </View>
        </Pressable>
      </Card>
    );
  };

  if (isLoading) {
    return <ActivityIndicator size="large" color={themeObject.colors.accent} />;
  }

  return (
    <View style={styles.container}>
      <CustomButton
        onPress={() => setIsModalVisible(true)}
        variant="info"
        ionIconLeft="add-circle-outline"
        style={styles.addButton}
      >
        Nuevo Pedido
      </CustomButton>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id_pedido.toString()}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContent}
      />

      <OrderModal
        visible={isModalVisible || !!selectedOrder}
        onClose={() => {
          setIsModalVisible(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        inventory={inventory}
        orderItems={selectedOrder ? getOrderItems(selectedOrder.id_pedido) : []}
        orderDetails={orderDetails}
        onRemoveItem={(productId) =>
          handleRemoveItem(selectedOrder.id_pedido, productId)
        }
        onSuccess={async (newOrder) => {
          if (selectedOrder) {
            await loadOrders();
          } else {
            await loadOrders();
          }
          if (selectedOrder) {
            await loadOrders();
            if (newOrder.estado === "Completado") {
              await handleStatusChange(newOrder.id_pedido, "Completado");
            }
          } else {
            await loadOrders();
          }
        }}
      />
    </View>
  );
};

// Función auxiliar para colores de estado
const getStatusColor = (status, theme) => {
  const statusColors = {
    pendiente: theme.colors.warning,
    completado: theme.colors.success,
    cancelado: theme.colors.error,
    enviado: theme.colors.info,
  };
  return statusColors[status.toLowerCase()] || theme.colors.placeholder;
};

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: theme.colors.background,
    },
    orderCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      padding: 16,
      margin: 10,
      ...Platform.select({
        web: {
          transition: "transform 0.2s",
          ":hover": {
            transform: "translateY(-2px)",
          },
        },
      }),
    },
    orderHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    orderTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.colors.text,
    },
    statusBadge: {
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: 20,
      color: theme.colors.buttonWhite,
      fontSize: 12,
      fontWeight: "500",
    },
    supplierText: {
      color: theme.colors.text,
    },
    datesContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginVertical: 8,
    },
    dateText: {
      fontSize: 12,
      color: theme.colors.placeholder,
    },
    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginVertical: 4,
    },
    detailText: {
      fontSize: 14,
      color: theme.colors.text,
      flex: 1,
    },
    totalContainer: {
      borderTopWidth: 1,
      borderColor: theme.colors.border,
      marginTop: 8,
      paddingTop: 8,
    },
    totalText: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.colors.text,
      textAlign: "right",
    },
    addButton: {
      marginBottom: 16,
    },
    listContent: {
      paddingBottom: 32,
    },
  });

export default OrdersBody;
