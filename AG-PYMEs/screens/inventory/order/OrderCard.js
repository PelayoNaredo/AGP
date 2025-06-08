import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { Card } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import CustomButton from "../../../components/customButton";
import PopupMenu, { MenuItem } from "../../../components/popupMenu";
import { formatDate, safeToFixed } from "../../../utils/helpers";

// Componente OrderCard para visualizar un pedido con menú de opciones
const OrderCard = ({
  order,
  onEdit,
  onDelete,
  onStatusChange,
  orderDetails,
  inventory,
  getSupplierName,
}) => {
  const { themeObject } = useTheme();
  const styles = createStyles(themeObject);
  const [menuVisible, setMenuVisible] = useState(false);

  const details = orderDetails.filter((d) => d.id_pedido === order.id_pedido);

  // Función auxiliar para colores de estado
  const getStatusColor = (status) => {
    const statusColors = {
      pendiente: themeObject.colors.warning,
      completado: themeObject.colors.success,
      cancelado: themeObject.colors.error,
      enviado: themeObject.colors.info,
    };
    return statusColors[status.toLowerCase()] || themeObject.colors.placeholder;
  };

  // Anchor para el menú emergente
  const menuAnchor = (
    <CustomButton
      variant="ghost"
      size="sm"
      ionIconLeft="ellipsis-vertical"
      iconColor={themeObject.colors.text}
      onPress={() => setMenuVisible(true)}
      style={styles.iconButton}
    />
  );

  return (
    <Card style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderTitle}>Pedido #{order.id_pedido}</Text>
        <View style={styles.statusContainer}>
          <Text
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(order.estado) },
            ]}
          >
            {order.estado}
          </Text>
          <PopupMenu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={menuAnchor}
          >
            <MenuItem
              title="Editar"
              leadingIcon="pencil-outline"
              iconColor={themeObject.colors.primary}
              onPress={() => {
                setMenuVisible(false);
                onEdit(order);
              }}
            />
            {order.estado !== "Completado" && (
              <MenuItem
                title="Marcar como completado"
                leadingIcon="checkmark-circle-outline"
                iconColor={themeObject.colors.success}
                onPress={() => {
                  setMenuVisible(false);
                  onStatusChange(order.id_pedido, "Completado");
                }}
              />
            )}
            {order.estado !== "Enviado" && (
              <MenuItem
                title="Marcar como enviado"
                leadingIcon="paper-plane-outline"
                iconColor={themeObject.colors.info}
                onPress={() => {
                  setMenuVisible(false);
                  onStatusChange(order.id_pedido, "Enviado");
                }}
              />
            )}
            {order.estado !== "Pendiente" && (
              <MenuItem
                title="Marcar como pendiente"
                leadingIcon="time-outline"
                iconColor={themeObject.colors.warning}
                onPress={() => {
                  setMenuVisible(false);
                  onStatusChange(order.id_pedido, "Pendiente");
                }}
              />
            )}
            {order.estado !== "Cancelado" && (
              <MenuItem
                title="Cancelar pedido"
                leadingIcon="close-circle-outline"
                iconColor={themeObject.colors.error}
                onPress={() => {
                  setMenuVisible(false);
                  onStatusChange(order.id_pedido, "Cancelado");
                }}
              />
            )}
            <MenuItem
              title="Eliminar"
              leadingIcon="trash-outline"
              iconColor={themeObject.colors.error}
              onPress={() => {
                setMenuVisible(false);
                onDelete(order.id_pedido);
              }}
            />
          </PopupMenu>
        </View>
      </View>

      <Text style={styles.supplierText}>
        Proveedor: {getSupplierName(order.id_proveedor)}
      </Text>

      <View style={styles.datesContainer}>
        <Text style={styles.dateText}>
          Pedido: {formatDate(order.fecha_pedido)}
        </Text>
        <Text style={styles.dateText}>
          Entrega prevista: {formatDate(order.fecha_entrega_estimada)}
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
          <Text style={styles.detailText}>${safeToFixed(detail.subtotal)}</Text>
        </View>
      ))}

      <View style={styles.totalContainer}>
        <Text style={styles.totalText}>Total: ${safeToFixed(order.total)}</Text>
      </View>
    </Card>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
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
      flex: 1,
    },
    statusContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
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
    iconButton: {
      width: 36,
      height: 36,
      padding: 0,
    },
  });

export default OrderCard;
