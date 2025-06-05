import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { Services } from "../../api/index";
import taxCalculator from "../../utils/financial/taxCalculator";

//Hook personalizado para gestionar el procesamiento de ventas
const useSaleProcessor = ({
  cartItems,
  client,
  onSuccess,
  onError,
  onComplete,
  selectedPrinter,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [inventoryWarning, setInventoryWarning] = useState(false);
  const [lowStockItems, setLowStockItems] = useState([]);

  //Verifica si hay suficiente stock disponible para los productos
  const checkInventoryAvailability = useCallback(() => {
    const productsWithLowStock = [];

    for (const item of cartItems) {
      if (item.tipo === "producto" && item.cantidad_actual < item.cantidad) {
        productsWithLowStock.push({
          nombre: item.nombre_producto,
          stockActual: item.cantidad_actual,
          solicitado: item.cantidad,
        });
      }
    }

    setLowStockItems(productsWithLowStock);
    return productsWithLowStock;
  }, [cartItems]);

  //Procesa una venta
  const processSale = useCallback(
    async (paymentData) => {
      setIsLoading(true);

      try {
        // Verificar stock suficiente
        const productsWithLowStock = checkInventoryAvailability();

        if (productsWithLowStock.length > 0) {
          setInventoryWarning(true);

          // Mostrar alerta con los productos sin stock suficiente
          const stockWarningMessage = productsWithLowStock
            .map(
              (p) =>
                `• ${p.nombre} (Disponible: ${p.stockActual}, Solicitado: ${p.solicitado})`
            )
            .join("\n");

          Alert.alert(
            "Stock insuficiente",
            `Los siguientes productos no tienen stock suficiente:\n\n${stockWarningMessage}`,
            [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Continuar de todos modos",
                style: "destructive",
                onPress: () => completeSaleProcess(paymentData),
              },
            ]
          );

          setIsLoading(false);
          return;
        }

        // Si hay stock suficiente, proceder con la venta
        await completeSaleProcess(paymentData);
      } catch (error) {
        console.error("Error al procesar venta:", error);
        if (onError) {
          onError(error.message || "Ha ocurrido un error al procesar la venta");
        } else {
          Alert.alert(
            "Error",
            error.message || "Ha ocurrido un error al procesar la venta"
          );
        }
        setIsLoading(false);
      }
    },
    [
      cartItems,
      client,
      checkInventoryAvailability,
      onSuccess,
      onError,
      onComplete,
      selectedPrinter,
    ]
  );

  //Completa el proceso de venta
  const completeSaleProcess = useCallback(
    async (paymentData) => {
      try {
        // Generar un número de documento si no existe
        const numeroDocumento = `VENTA-${Date.now()}`;

        // Obtener valores fiscales del cliente si existe
        const clientTipoIva = client?.tipo_iva || "general";
        const clientRetencionIrpf = client?.retencion_irpf || 0;

        // Obtener tipo de IVA
        const tipoIva = paymentData.tipoIva || clientTipoIva;

        // Calcular impuestos y total
        const subtotal = cartItems.reduce(
          (sum, item) => sum + item.precio_unitario * item.cantidad,
          0
        );

        const porcentajeRetencion =
          parseFloat(paymentData.porcentajeRetencion) ||
          clientRetencionIrpf ||
          0;
        const descuento = parseFloat(paymentData.discount) || 0;

        // Usar el servicio de cálculos fiscales
        const fiscalCalculation = taxCalculator.calculateTotal(subtotal, {
          tipoIva,
          porcentajeRetencion,
          descuento,
        });

        // Verificar que hay elementos en el carrito
        if (!cartItems || cartItems.length === 0) {
          throw new Error(
            "El carrito está vacío. No se puede procesar la venta"
          );
        }

        // Crear la venta en el backend con todos los campos fiscales
        const saleData = {
          id_cliente: client?.id_cliente || null,
          metodo_pago: paymentData.paymentMethod || "efectivo",
          numero_documento: numeroDocumento,
          tipo_documento: paymentData.documentType || "ticket",
          notas: paymentData.notes || "",
          descuento: fiscalCalculation.descuento,
          subtotal: fiscalCalculation.subtotal,
          impuestos: fiscalCalculation.impuestos,
          tipo_iva: tipoIva,
          porcentaje_iva: fiscalCalculation.porcentajeIva,
          porcentaje_retencion: fiscalCalculation.porcentajeRetencion,
          estado: paymentData.estado || "pagado",
          total: fiscalCalculation.total,
          productos: cartItems
            .filter((item) => item.tipo === "producto")
            .map((item) => ({
              id_producto: item.id_producto,
              cantidad: item.cantidad,
              precio_unitario: parseFloat(item.precio_unitario || 0),
              subtotal: item.cantidad * parseFloat(item.precio_unitario || 0),
              porcentaje_impuesto: fiscalCalculation.porcentajeIva,
            })),
          servicios: cartItems
            .filter((item) => item.tipo === "servicio")
            .map((item) => ({
              id_servicio: item.id_servicio,
              cantidad: item.cantidad,
              precio_unitario: parseFloat(item.precio_unitario || 0),
              subtotal: item.cantidad * parseFloat(item.precio_unitario || 0),
              porcentaje_impuesto: fiscalCalculation.porcentajeIva,
            })),
        }; // Usar el servicio para crear la venta
        const response = await Services.Data.Sales.create(saleData); // Generar documento si es necesario
        if (paymentData.documentType !== "ninguno") {
          await Services.Data.Sales.generateSaleDocument(
            response.id_venta,
            paymentData.documentType
          );
        }

        // Notificar éxito
        if (onSuccess) {
          onSuccess(response);
        }
      } catch (error) {
        console.error("Error completando venta:", error);
        if (onError) {
          onError(error.message || "Ha ocurrido un error al procesar la venta");
        } else {
          Alert.alert(
            "Error",
            error.message || "Ha ocurrido un error al procesar la venta"
          );
        }
      } finally {
        setIsLoading(false);
        if (onComplete) {
          onComplete();
        }
      }
    },
    [cartItems, client, onSuccess, onError, onComplete]
  );

  return {
    isLoading,
    inventoryWarning,
    lowStockItems,
    processSale,
    checkInventoryAvailability,
  };
};

export default useSaleProcessor;
