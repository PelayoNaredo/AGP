import React from "react";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import { Card } from "react-native-paper";
import { useTheme } from "../../../../../context/ThemeContext";
import CustomButton from "../../../../../components/customButton";
import CartItem from "./CartItem";

//Componente que muestra el carrito y sus funcionalidades
const CartComponent = ({ cart, onPayment, isLoading, printerComponent }) => {
  const { themeObject } = useTheme();
  const {
    cartItems,
    clearCart,
    changeItemQuantity,
    calculateSubtotal,
    calculateTax,
    calculateTotal,
    getItemName,
    getItemId,
    isEmpty,
  } = cart;

  const styles = StyleSheet.create({
    cartCard: {
      borderRadius: 10,
      backgroundColor: themeObject.colors.surface,
      padding: 16,
      flex: 1,
    },
    cartContent: {
      flex: 1,
    },
    cartItemsContainer: {
      flex: 1,
      maxHeight: Platform.OS === "web" ? 300 : undefined,
      minHeight: Platform.OS === "android" ? 50 : undefined,
    },
    cartTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: themeObject.colors.text,
      marginBottom: 12,
    },
    summaryContainer: {
      marginTop: 16,
      borderTopWidth: 1,
      borderTopColor: themeObject.colors.border,
      paddingTop: 16,
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    summaryLabel: {
      fontSize: 16,
      color: themeObject.colors.text,
    },
    summaryValue: {
      fontSize: 16,
      fontWeight: "500",
      color: themeObject.colors.text,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 8,
      borderTopWidth: 1,
      borderTopColor: themeObject.colors.border,
      paddingTop: 16,
    },
    totalLabel: {
      fontSize: 18,
      fontWeight: "bold",
      color: themeObject.colors.text,
    },
    totalValue: {
      fontSize: 18,
      fontWeight: "bold",
      color: themeObject.colors.primary,
    },
    actionsContainer: {
      marginTop: 24,
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
    },
    emptyCartText: {
      textAlign: "center",
      color: themeObject.colors.placeholder,
      marginTop: 32,
      fontSize: 16,
    },
  });
  return (
    <Card style={styles.cartCard}>
      <Text style={styles.cartTitle}>Carrito de Compra</Text>

      {!isEmpty ? (
        <ScrollView
          style={styles.cartContent}
          contentContainerStyle={{ flexGrow: 1 }}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={Platform.OS === "android"}
          overScrollMode={Platform.OS === "android" ? "never" : undefined}
        >
          <View style={styles.cartItemsContainer}>
            {cartItems.map((item) => (
              <CartItem
                key={`${item.tipo === "producto" ? "p" : "s"}-${getItemId(item)}`}
                item={item}
                onQuantityChange={changeItemQuantity}
                getItemName={getItemName}
                getItemId={getItemId}
              />
            ))}
          </View>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                {calculateSubtotal().toFixed(2)} €
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>IVA (21%)</Text>
              <Text style={styles.summaryValue}>
                {calculateTax().toFixed(2)} €
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                {calculateTotal().toFixed(2)} €
              </Text>
            </View>
          </View>
          <View style={styles.actionsContainer}>
            <CustomButton
              variant="outline"
              style={{ flex: 1 }}
              ionIconLeft="trash-outline"
              onPress={clearCart}
            >
              Vaciar
            </CustomButton>
            <CustomButton
              variant="success"
              style={{ flex: 2 }}
              ionIconLeft="cash-outline"
              onPress={onPayment}
              isLoading={isLoading}
            >
              Procesar Pago
            </CustomButton>
          </View>
          {/* Componente de impresora Bluetooth */}
          {printerComponent}
        </ScrollView>
      ) : (
        <Text style={styles.emptyCartText}>
          El carrito está vacío. Añade productos o servicios para comenzar.
        </Text>
      )}
    </Card>
  );
};

export default CartComponent;
