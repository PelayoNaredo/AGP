import React, { useState, useEffect } from "react";
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import CustomButton from "../../../components/customButton";
import { Services } from "../../../api/index";
import OrderModal from "./ordersModal";
import OrderCard from "./OrderCard";
import useNotifications from "../../../hooks/useNotifications";

// Componente OrdersBody para manejar la lógica de pedidos
const OrdersBody = () => {
  const { themeObject } = useTheme();
  const styles = createStyles(themeObject);
  const { showError, showConfirmDialog, showSuccess } = useNotifications();

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
        showError("Error", "Error cargando datos");
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
      showError("Error", "Error cargando pedidos");
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
      showError("Error", "No se pudo actualizar el estado");
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
      showError("Error", "No se pudo eliminar el producto del pedido");
    }
  };

  // Manejar la eliminación de un pedido completo
  const handleDeleteOrder = async (orderId) => {
    showConfirmDialog(
      "Eliminar Pedido",
      "¿Estás seguro de que deseas eliminar este pedido? Esta acción no se puede deshacer.",
      async () => {
        try {
          // Primero eliminar todos los detalles del pedido
          const orderDetailsToDelete = orderDetails.filter(
            (detail) => detail.id_pedido === orderId
          );

          for (const detail of orderDetailsToDelete) {
            await Services.Data.OrderDetails.delete(detail.id_detalle);
          }

          // Luego eliminar el pedido principal
          await Services.Data.Orders.delete(orderId);

          // Actualizar la lista de pedidos y detalles
          const [updatedOrders, updatedDetails] = await Promise.all([
            Services.Data.Orders.getAll(),
            Services.Data.OrderDetails.getAll(),
          ]);

          setOrders(updatedOrders);
          setOrderDetails(updatedDetails);
          showSuccess("Pedido eliminado correctamente");
        } catch (error) {
          showError("Error", "No se pudo eliminar el pedido");
          console.error("Error eliminando pedido:", error);
        }
      },
      () => {}, // Función onCancel vacía
      "Eliminar",
      "Cancelar"
    );
  };
  // Renderizar cada pedido
  const renderOrderItem = ({ item }) => {
    return (
      <OrderCard
        order={item}
        onEdit={setSelectedOrder}
        onDelete={handleDeleteOrder}
        onStatusChange={handleStatusChange}
        orderDetails={orderDetails}
        inventory={inventory}
        getSupplierName={getSupplierName}
      />
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

// Los estilos de estado ahora se manejan en el componente OrderCard

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: theme.colors.background,
    },
    addButton: {
      marginBottom: 16,
    },
    listContent: {
      paddingBottom: 32,
    },
  });

export default OrdersBody;
