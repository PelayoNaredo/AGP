import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Card } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import CustomButton from "../../../components/customButton";
import PopupMenu, { MenuItem } from "../../../components/popupMenu";
import { formatDate, safeToFixed } from "../../../utils/helpers";

// Componente ProductCard para visualizar un producto del inventario con menú de opciones
const ProductCard = ({ product, onEdit, onDelete, suppliersMap }) => {
  const { themeObject } = useTheme();
  const styles = createStyles(themeObject);
  const [menuVisible, setMenuVisible] = useState(false);

  // Componente helper para filas de detalle
  const DetailRow = ({ label, value }) => (
    <View style={styles.detailRow}>
      <Text
        style={[styles.detailLabel, { color: themeObject.colors.placeholder }]}
      >
        {label}:
      </Text>
      <Text style={[styles.detailValue, { color: themeObject.colors.text }]}>
        {value || "N/A"}
      </Text>
    </View>
  );

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
    <Card style={styles.productItem} onPress={() => onEdit(product)}>
      <View style={styles.productContent}>
        {/* Encabezado */}
        <View style={styles.productHeader}>
          <Text style={styles.productName}>{product.nombre_producto}</Text>
          <View style={styles.actionsContainer}>
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
                  onEdit(product);
                }}
              />
              <MenuItem
                title="Eliminar"
                leadingIcon="trash-outline"
                iconColor={themeObject.colors.error}
                onPress={() => {
                  setMenuVisible(false);
                  onDelete(product.id_producto);
                }}
              />
            </PopupMenu>
          </View>
        </View>

        {/* Referencia */}
        {product.referencia && (
          <Text style={styles.productReference}>Ref: {product.referencia}</Text>
        )}

        {/* Descripción */}
        <Text style={styles.productDescription}>{product.descripcion}</Text>

        {/* Detalles */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailColumn}>
            <DetailRow label="Stock Actual" value={product.cantidad_actual} />
            <DetailRow label="Stock Mínimo" value={product.cantidad_minima} />
          </View>

          <View style={styles.detailColumn}>
            <DetailRow
              label="Proveedor"
              value={suppliersMap[product.id_proveedor] || "No asignado"}
            />
            <DetailRow
              label="Última Actualización"
              value={formatDate(product.fecha_actualizacion)}
            />
          </View>
        </View>

        {/* Indicadores */}
        <View style={styles.stockPriceContainer}>
          <View
            style={[
              styles.stockIndicator,
              {
                backgroundColor:
                  product.cantidad_actual < product.cantidad_minima
                    ? themeObject.colors.error
                    : themeObject.colors.success,
              },
            ]}
          >
            <Text style={styles.stockText}>
              {product.cantidad_actual}/{product.cantidad_minima}
            </Text>
          </View>

          {/* Columna de precios */}
          <View style={styles.pricesColumn}>
            <Text style={styles.priceText}>
              Coste: ${safeToFixed(product.precio_unitario)}
            </Text>
            {product.pvp && (
              <Text style={styles.pvpText}>
                PVP: ${safeToFixed(product.pvp)}
              </Text>
            )}
          </View>
        </View>
      </View>
    </Card>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    productItem: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      cursor: "pointer",
      padding: 16,
      margin: 10,
    },
    productContent: {
      flex: 1,
    },
    productHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    productName: {
      color: theme.colors.text,
      fontWeight: "600",
      fontSize: 16,
      flex: 1,
    },
    productReference: {
      color: theme.colors.placeholder,
      fontSize: 13,
      marginBottom: 4,
    },
    productDescription: {
      color: theme.colors.text,
      marginBottom: 8,
    },
    actionsContainer: {
      flexDirection: "row",
      gap: 8,
    },
    iconButton: {
      width: 36,
      height: 36,
      padding: 0,
    },
    detailsGrid: {
      flexDirection: "row",
      gap: 20,
      marginVertical: 12,
    },
    detailColumn: {
      flex: 1,
      gap: 8,
    },
    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "baseline",
    },
    detailLabel: {
      fontSize: 12,
      flex: 1,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: "500",
      marginLeft: 8,
      flex: 1,
      textAlign: "right",
    },
    stockPriceContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 12,
    },
    stockIndicator: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 20,
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    stockText: {
      color: "#ffffff",
      fontWeight: "600",
      fontSize: 14,
    },
    pricesColumn: {
      alignItems: "flex-end",
    },
    priceText: {
      color: theme.colors.text,
      fontSize: 15,
      fontWeight: "700",
    },
    pvpText: {
      color: theme.colors.accent,
      fontSize: 14,
      fontWeight: "600",
      marginTop: 4,
    },
  });

export default ProductCard;
