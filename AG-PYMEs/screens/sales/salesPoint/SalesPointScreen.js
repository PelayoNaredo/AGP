import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Platform,
  Alert,
  Share,
  Text,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeInRight,
  Layout,
  SlideInRight,
} from "react-native-reanimated";
import { useTheme } from "../../../context/ThemeContext";
import { SegmentedButtons, Snackbar } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import BluetoothPrinterManager from "./components/BluetoothPrinterManager";
import BluetoothPrinterService from "./services/BluetoothPrinterService";

// Componentes modulares
import ProductSelector from "./ProductSelector";
import ServiceSelector from "./ServiceSelector";
import SaleModal from "./SaleModal";
import ClientModal from "../client/ClientModal";
import ClientSelector from "./components/ClientSelector";
import CartComponent from "./components/cart/CartComponent";

// Hooks personalizados
import useCart from "../../../hooks/sales/useCart";
import useSaleProcessor from "../../../hooks/sales/useSaleProcessor";
import useNotification from "../../../hooks/sales/useNotification";

// Pagina principal del punto de venta
const SalesPointScreen = () => {
  const { themeObject } = useTheme();
  const navigation = useNavigation();
  // Estados
  const [selectedClient, setSelectedClient] = useState(null);
  const [isClientModalVisible, setIsClientModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [activeSegment, setActiveSegment] = useState("productos");
  const [selectedPrinter, setSelectedPrinter] = useState(null);
  const [newClientMode, setNewClientMode] = useState(false);

  // Hooks personalizados
  const cart = useCart();
  const notification = useNotification();

  // Función para gestionar el cambio de estado de la impresora
  const handlePrinterStatusChange = useCallback((printer) => {
    setSelectedPrinter(printer);
  }, []);

  // Callbacks para el procesador de ventas
  const handleSaleSuccess = useCallback(
    (response) => {
      // Cierra el modal de pago
      setIsPaymentModalVisible(false);

      // Limpia el carrito
      cart.clearCart();

      // Notificación de éxito
      notification.showSuccess("Venta realizada correctamente");

      // Opciones después de la venta
      Alert.alert(
        "Venta realizada",
        `La venta #${response.id_venta} ha sido procesada correctamente.`,
        [
          { text: "OK", onPress: () => {} },
          {
            text: "Ver detalle",
            onPress: () =>
              navigation.navigate("SaleDetail", { saleId: response.id_venta }),
          },
          {
            text: "Compartir comprobante",
            onPress: () => shareSaleReceipt(response),
          },
        ]
      );

      // Imprime el ticket si se solicitó
      if (selectedPrinter && response.printTicket) {
        printTicket(response);
      }

      // Actualiza el inventario
      refreshInventory();
    },
    [navigation, selectedPrinter, cart, notification]
  );

  // Callback para manejar errores en el procesamiento de ventas
  const handleSaleError = useCallback(
    (errorMessage) => {
      notification.showError(
        "Error",
        errorMessage || "Ha ocurrido un error al procesar la venta"
      );
    },
    [notification]
  );

  const handleSaleComplete = useCallback(() => {
    // Operaciones a realizar después de completar la venta (exitosa o no)
  }, []);

  // Configurar el procesador de ventas con callbacks
  const saleProcessor = useSaleProcessor({
    cartItems: cart.cartItems,
    client: selectedClient,
    selectedPrinter,
    onSuccess: handleSaleSuccess,
    onError: handleSaleError,
    onComplete: handleSaleComplete,
  });

  // Función para compartir recibos
  const shareSaleReceipt = async (saleData) => {
    try {
      await Share.share({
        message: generateReceiptText(saleData),
      });
    } catch (error) {
      console.error("Error al compartir comprobante:", error);
      notification.showErrorNotification("Error al compartir el comprobante");
    }
  };

  // Forzar actualización del inventario
  const refreshInventory = () => {
    if (activeSegment === "productos") {
      setActiveSegment("servicios");
      setTimeout(() => setActiveSegment("productos"), 50);
    }
  };

  // Imprimir ticket
  const printTicket = async (saleData) => {
    try {
      await BluetoothPrinterService.printTicket(saleData);
      notification.showSuccess("Ticket impreso correctamente");
    } catch (error) {
      console.error("Error al imprimir ticket:", error);
      notification.showErrorNotification("Error al imprimir el ticket");
    }
  };

  // Función para generar el texto del recibo
  const generateReceiptText = (saleData) => {
    return (
      `Comprobante de venta #${saleData.id_venta}\n` +
      `Fecha: ${new Date(saleData.fecha_venta).toLocaleDateString()}\n` +
      `Cliente: ${saleData.cliente ? `${saleData.cliente.nombre} ${saleData.cliente.apellido}` : "Cliente anónimo"}\n` +
      `Total: $${saleData.total.toFixed(2)}\n` +
      `Método de pago: ${saleData.metodo_pago}\n` +
      `Gracias por su compra!`
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeObject.colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      ...(Platform.OS !== "web"
        ? {
            paddingBottom: 80,
            minHeight: "100%",
          }
        : {}),
    },
    mainContent: {
      padding: 16,
      ...(Platform.OS === "android"
        ? {
            paddingBottom: 32,
          }
        : {}),
    },
    gridContainer: {
      flexDirection: Platform.OS === "web" ? "row" : "column",
      flex: Platform.OS === "web" ? 1 : 0,
    },
    leftColumn: {
      ...(Platform.OS === "web"
        ? {
            flex: 2,
            marginRight: 16,
          }
        : {
            flex: 1,
            marginBottom: 24,
          }),
    },
    rightColumn: {
      ...(Platform.OS === "web"
        ? { flex: 1 }
        : {
            flex: 1,
            minHeight: 350,
            backgroundColor: themeObject.colors.surface,
            borderRadius: themeObject.roundness,
            overflow: "hidden",
          }),
    },
    segmentContainer: {
      marginBottom: 16,
    },
  });
  return (
    <Animated.View
      style={styles.container}
      entering={FadeInUp.duration(600).springify()}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
          bounces={Platform.OS === "ios"}
          overScrollMode={Platform.OS === "android" ? "never" : undefined}
          persistentScrollbar={Platform.OS === "android"}
        >
          <View style={styles.mainContent}>
            <View style={styles.gridContainer}>
              {/* Columna izquierda */}
              <Animated.View
                style={styles.leftColumn}
                entering={FadeInDown.delay(200).duration(500).springify()}
              >
                <Animated.View
                  entering={SlideInRight.delay(300).duration(400).springify()}
                >
                  <ClientSelector
                    client={selectedClient}
                    onSelectClient={() => {
                      setNewClientMode(false);
                      setIsClientModalVisible(true);
                    }}
                    onAddNewClient={() => {
                      setNewClientMode(true);
                      setIsClientModalVisible(true);
                    }}
                  />
                </Animated.View>

                <Animated.View
                  style={styles.segmentContainer}
                  entering={FadeInRight.delay(400).duration(500).springify()}
                >
                  <SegmentedButtons
                    value={activeSegment}
                    onValueChange={setActiveSegment}
                    buttons={[
                      {
                        value: "productos",
                        label: "Productos",
                        icon: "package-variant-closed",
                        checkedColor: themeObject.colors.primary,
                        style: { backgroundColor: themeObject.colors.surface },
                      },
                      {
                        value: "servicios",
                        label: "Servicios",
                        icon: "tools",
                        checkedColor: themeObject.colors.primary,
                        style: { backgroundColor: themeObject.colors.surface },
                      },
                    ]}
                    style={{ backgroundColor: themeObject.colors.surface }}
                  />
                </Animated.View>

                <Animated.View
                  entering={FadeInUp.delay(500).duration(600).springify()}
                  key={activeSegment}
                  layout={Layout.springify()}
                >
                  {activeSegment === "productos" ? (
                    <ProductSelector onSelectProduct={cart.addProduct} />
                  ) : (
                    <ServiceSelector onSelectService={cart.addService} />
                  )}
                </Animated.View>
              </Animated.View>

              {/* Columna derecha */}
              <Animated.View
                style={styles.rightColumn}
                entering={FadeInDown.delay(600).duration(500).springify()}
              >
                <CartComponent
                  cart={cart}
                  onPayment={() =>
                    cart.isEmpty
                      ? Alert.alert("Error", "El carrito está vacío")
                      : setIsPaymentModalVisible(true)
                  }
                  isLoading={saleProcessor.isLoading}
                  printerComponent={
                    <BluetoothPrinterManager
                      onPrinterStatusChange={handlePrinterStatusChange}
                    />
                  }
                />
              </Animated.View>
            </View>
          </View>
        </ScrollView>

        {/* Modales y Snackbar fuera del ScrollView */}
        <SaleModal
          visible={isPaymentModalVisible}
          onClose={() => setIsPaymentModalVisible(false)}
          cartItems={cart.cartItems}
          client={selectedClient}
          subtotal={cart.calculateSubtotal()}
          tax={cart.calculateTax()}
          total={cart.calculateTotal()}
          onConfirm={saleProcessor.processSale}
        />
        <ClientModal
          visible={isClientModalVisible}
          onClose={() => {
            setIsClientModalVisible(false);
            setNewClientMode(false);
          }}
          onSelectClient={setSelectedClient}
          showNewClientForm={newClientMode}
        />
      </KeyboardAvoidingView>
    </Animated.View>
  );
};

export default SalesPointScreen;
