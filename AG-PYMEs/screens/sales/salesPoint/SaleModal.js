import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TextInput,
  ScrollView,
} from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import ModalTemplate from "../../../components/modalTemplate";
import { Chip, RadioButton, Divider } from "react-native-paper";
import CustomPicker from "../../../components/customPicker";
import ClientInfoComponent from "../client/ClientInfoComponent";
import taxCalculator, {
  IVA_TYPES,
} from "../../../utils/financial/taxCalculator";

const SaleModal = ({
  visible,
  onClose,
  cartItems,
  client,
  subtotal,
  tax,
  total,
  onConfirm,
  readOnly = false,
  initialData = {},
}) => {
  const { themeObject } = useTheme();
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  const [documentType, setDocumentType] = useState("ticket");
  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState("0");
  const [totalWithDiscount, setTotalWithDiscount] = useState(total);
  const [loading, setLoading] = useState(false);
  const [saleStatus, setSaleStatus] = useState("pagado");
  const [tipoIva, setTipoIva] = useState("general");
  const [porcentajeIva, setPorcentajeIva] = useState("21.00");
  const [porcentajeRetencion, setPorcentajeRetencion] = useState("0");

  // Datos adicionales para métodos de pago específicos
  const [cardDetails, setCardDetails] = useState({
    lastDigits: "",
    type: "visa", // visa, mastercard, etc.
  });

  // Detalles para transferencia bancaria
  const [transferDetails, setTransferDetails] = useState({
    reference: "",
  });

  // Detalles para pago a crédito
  const [creditDetails, setCreditDetails] = useState({
    installments: "1",
    dueDate: "",
  });

  const styles = StyleSheet.create({
    container: {
      maxHeight: 600,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 12,
      color: themeObject.colors.text,
    },
    itemsContainer: {
      maxHeight: 150,
      marginBottom: 16,
    },
    itemRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: themeObject.colors.border,
    },
    itemInfo: {
      flex: 2,
    },
    itemName: {
      fontSize: 14,
      color: themeObject.colors.text,
    },
    itemPrice: {
      fontSize: 14,
      color: themeObject.colors.placeholder,
    },
    itemQuantity: {
      fontSize: 14,
      flex: 1,
      textAlign: "center",
      color: themeObject.colors.text,
    },
    itemTotal: {
      fontSize: 14,
      flex: 1,
      textAlign: "right",
      color: themeObject.colors.text,
      fontWeight: "500",
    },
    itemTypeTag: {
      marginTop: 2,
    },
    divider: {
      height: 1,
      backgroundColor: themeObject.colors.border,
      marginVertical: 16,
    },
    summaryContainer: {
      marginBottom: 16,
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    summaryLabel: {
      fontSize: 14,
      color: themeObject.colors.text,
    },
    summaryValue: {
      fontSize: 14,
      color: themeObject.colors.text,
      fontWeight: "500",
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 4,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: themeObject.colors.border,
    },
    totalLabel: {
      fontSize: 16,
      fontWeight: "bold",
      color: themeObject.colors.text,
    },
    totalValue: {
      fontSize: 16,
      fontWeight: "bold",
      color: themeObject.colors.primary,
    },
    section: {
      marginBottom: 16,
    },
    radioGroup: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    radioButton: {
      flexDirection: "row",
      alignItems: "center",
      width: "50%",
      marginBottom: 8,
    },
    radioLabel: {
      color: themeObject.colors.text,
      fontSize: 14,
    },
    notesInput: {
      borderWidth: 1,
      borderColor: themeObject.colors.border,
      borderRadius: themeObject.roundness,
      padding: 8,
      color: themeObject.colors.text,
      backgroundColor: themeObject.colors.surface,
      height: 80,
      textAlignVertical: "top",
    },
    clientInfo: {
      backgroundColor: themeObject.colors.surface,
      padding: 12,
      borderRadius: themeObject.roundness,
      marginBottom: 16,
    },
    clientName: {
      fontSize: 14,
      fontWeight: "500",
      color: themeObject.colors.text,
    },
    clientEmail: {
      fontSize: 14,
      color: themeObject.colors.placeholder,
    },
    noClientText: {
      color: themeObject.colors.placeholder,
      textAlign: "center",
      padding: 8,
    },
    discountContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    discountInput: {
      borderWidth: 1,
      borderColor: themeObject.colors.border,
      borderRadius: themeObject.roundness,
      padding: 8,
      marginHorizontal: 8,
      width: 60,
      color: themeObject.colors.text,
      backgroundColor: themeObject.colors.surface,
      textAlign: "center",
    },
    discountLabel: {
      color: themeObject.colors.text,
      fontSize: 14,
    },
    paymentDetailsContainer: {
      marginTop: 8,
      padding: 12,
      backgroundColor: themeObject.colors.surface,
      borderRadius: themeObject.roundness,
      borderWidth: 1,
      borderColor: themeObject.colors.border,
    },
    paymentDetailInput: {
      backgroundColor: themeObject.colors.surface,
      marginBottom: 12,
      fontSize: 14,
    },
    paymentDetailRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    labelText: {
      fontSize: 14,
      color: themeObject.colors.text,
      marginRight: 8,
      width: 100,
    },
  });

  // Efecto para inicializar los valores cuando el modal se abre
  useEffect(() => {
    if (visible) {
      // Si tenemos datos iniciales (modo visualización), los usamos
      if (initialData && Object.keys(initialData).length > 0) {
        setPaymentMethod(initialData.paymentMethod || "efectivo");
        setDocumentType(initialData.documentType || "ticket");
        setNotes(initialData.notes || "");
        setDiscount(initialData.discount || "0");
        setSaleStatus(initialData.estado || "pagado");
        setTipoIva(initialData.tipoIva || "general");
        setPorcentajeIva(initialData.porcentajeIva || "21.00");
        setPorcentajeRetencion(initialData.porcentajeRetencion || "0");

        // Configurar detalles específicos del método de pago si están disponibles
        if (initialData.cardDetails) setCardDetails(initialData.cardDetails);
        if (initialData.transferDetails)
          setTransferDetails(initialData.transferDetails);
        if (initialData.creditDetails)
          setCreditDetails(initialData.creditDetails);
      } else {
        // Reset values when modal opens in normal mode
        setPaymentMethod("efectivo");
        setDocumentType("ticket");
        setNotes("");
        setDiscount("0");
        setSaleStatus("pagado");
        setTipoIva("general");
        setPorcentajeIva("21.00");
        setPorcentajeRetencion("0");

        // Reset payment specific details
        setCardDetails({ lastDigits: "", type: "visa" });
        setTransferDetails({ reference: "" });
        setCreditDetails({ installments: "1", dueDate: "" });
      }

      setTotalWithDiscount(total);
    }
  }, [visible, total, initialData]);

  // Efecto para calcular el total con descuentos y retenciones
  useEffect(() => {
    // Usar el servicio de cálculos fiscales para calcular el total con descuentos
    const discountValue = parseFloat(discount) || 0;
    const ivaPercentage = taxCalculator.getIvaPercentage(tipoIva);
    const retencionValue = parseFloat(porcentajeRetencion) || 0;

    // Calcular el total usando el servicio
    const result = taxCalculator.calculateTotal(subtotal, {
      tipoIva,
      porcentajeRetencion: retencionValue,
      descuento: discountValue,
    });

    setTotalWithDiscount(result.total);
  }, [discount, subtotal, tipoIva, porcentajeRetencion]);

  const getItemName = (item) => {
    return item.tipo === "producto"
      ? item.nombre_producto
      : item.nombre_servicio;
  };

  // Función para completar el proceso de pago
  const handleConfirm = () => {
    // Validar el método de pago
    if (paymentMethod === "tarjeta" && !cardDetails.lastDigits) {
      Alert.alert(
        "Error",
        "Por favor, ingresa los últimos dígitos de la tarjeta"
      );
      return;
    }

    if (paymentMethod === "transferencia" && !transferDetails.reference) {
      Alert.alert(
        "Error",
        "Por favor, ingresa la referencia de la transferencia"
      );
      return;
    }

    // Calcular el total con descuento
    const discountAmount = parseFloat(discount) || 0;

    // Crear objeto con datos de pago
    const paymentData = {
      paymentMethod,
      documentType,
      tipoIva,
      porcentajeIva: taxCalculator.getIvaPercentage(tipoIva),
      porcentajeRetencion,
      discount: discountAmount,
      totalWithDiscount,
      notes,
      estado: saleStatus,
      printTicket: true, // Habilitamos la impresión por defecto
      // Detalles específicos según el método de pago
      ...(paymentMethod === "tarjeta" && { cardDetails }),
      ...(paymentMethod === "transferencia" && { transferDetails }),
      ...(paymentMethod === "credito" && { creditDetails }),
    };

    onConfirm(paymentData);
  };

  // Renderizar cada producto o servicio en la lista
  const renderItem = ({ item }) => (
    <View style={styles.itemRow}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{getItemName(item)}</Text>
        <Text style={styles.itemPrice}>
          ${parseFloat(item.precio_unitario || 0).toFixed(2)}
          {item.tipo === "servicio" && item.tipo_tarifa === "por_hora"
            ? "/hora"
            : ""}
          {item.tipo === "producto" && (
            <Text style={{ fontSize: 10, fontStyle: "italic" }}> (PVP)</Text>
          )}
        </Text>
        {item.tipo === "servicio" && (
          <Chip
            style={[
              styles.itemTypeTag,
              { backgroundColor: themeObject.colors.primaryLight },
            ]}
            textStyle={{ color: themeObject.colors.primary, fontSize: 10 }}
          >
            Servicio
          </Chip>
        )}
      </View>
      <Text style={styles.itemQuantity}>{item.cantidad}</Text>
      <Text style={styles.itemTotal}>
        ${(parseFloat(item.precio_unitario || 0) * item.cantidad).toFixed(2)}
      </Text>
    </View>
  );

  return (
    <ModalTemplate
      isVisible={visible}
      title={readOnly ? "Detalle de Venta" : "Finalizar Venta"}
      text={
        readOnly
          ? "Información de la venta"
          : "Confirma los detalles de la venta"
      }
      cancelLabel="Cerrar"
      confirmLabel={readOnly ? null : "Confirmar"}
      cancelAction={onClose}
      confirmAction={readOnly ? null : handleConfirm}
      confirmDisabled={loading}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <ClientInfoComponent client={client} />
        </View>
        {/* Productos y Servicios */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalle de compra</Text>
          <View style={styles.itemRow}>
            <Text style={[styles.itemInfo, styles.summaryLabel]}>
              Producto/Servicio
            </Text>
            <Text style={[styles.itemQuantity, styles.summaryLabel]}>
              Cant.
            </Text>
            <Text style={[styles.itemTotal, styles.summaryLabel]}>Total</Text>
          </View>
          <FlatList
            data={cartItems}
            renderItem={renderItem}
            keyExtractor={(item) =>
              `${item.tipo === "producto" ? "p" : "s"}-${item.tipo === "producto" ? item.id_producto : item.id_servicio}`
            }
            style={styles.itemsContainer}
          />
        </View>
        <Divider style={styles.divider} />
        {/* Tipo de documento */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo de documento</Text>
          <RadioButton.Group
            onValueChange={(value) => !readOnly && setDocumentType(value)}
            value={documentType}
          >
            <View style={styles.radioGroup}>
              <View style={styles.radioButton}>
                <RadioButton.Android
                  value="ticket"
                  color={themeObject.colors.primary}
                  disabled={readOnly}
                />
                <Text style={styles.radioLabel}>Ticket</Text>
              </View>
              <View style={styles.radioButton}>
                <RadioButton.Android
                  value="factura"
                  color={themeObject.colors.primary}
                  disabled={readOnly}
                />
                <Text style={styles.radioLabel}>Factura</Text>
              </View>
              <View style={styles.radioButton}>
                <RadioButton.Android
                  value="presupuesto"
                  color={themeObject.colors.primary}
                  disabled={readOnly}
                />
                <Text style={styles.radioLabel}>Presupuesto</Text>
              </View>
              <View style={styles.radioButton}>
                <RadioButton.Android
                  value="abono"
                  color={themeObject.colors.primary}
                  disabled={readOnly}
                />
                <Text style={styles.radioLabel}>Abono</Text>
              </View>
            </View>
          </RadioButton.Group>
        </View>
        {/* Método de pago */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Método de pago</Text>
          <CustomPicker
            selectedValue={paymentMethod}
            onValueChange={(value) => setPaymentMethod(value)}
            items={[
              { label: "Efectivo", value: "efectivo" },
              { label: "Tarjeta", value: "tarjeta" },
              { label: "Transferencia", value: "transferencia" },
              { label: "Móvil", value: "movil" },
              { label: "Crédito", value: "credito" },
            ]}
          />

          {/* Campos específicos según el método de pago */}
          {paymentMethod === "tarjeta" && (
            <View style={styles.paymentDetailsContainer}>
              <View style={styles.paymentDetailRow}>
                <Text style={styles.labelText}>Últimos dígitos:</Text>
                <TextInput
                  style={[styles.discountInput, { width: 120 }]}
                  value={cardDetails.lastDigits}
                  onChangeText={(text) =>
                    setCardDetails({ ...cardDetails, lastDigits: text })
                  }
                  keyboardType="numeric"
                  maxLength={4}
                  placeholder="0000"
                  placeholderTextColor={themeObject.colors.placeholder}
                />
              </View>
              <View style={styles.paymentDetailRow}>
                <Text style={styles.labelText}>Tipo:</Text>
                <CustomPicker
                  selectedValue={cardDetails.type}
                  onValueChange={(value) =>
                    setCardDetails({ ...cardDetails, type: value })
                  }
                  items={[
                    { label: "Visa", value: "visa" },
                    { label: "MasterCard", value: "mastercard" },
                    { label: "American Express", value: "amex" },
                    { label: "Otra", value: "other" },
                  ]}
                  containerStyle={{ flex: 1 }}
                />
              </View>
            </View>
          )}

          {paymentMethod === "transferencia" && (
            <View style={styles.paymentDetailsContainer}>
              <View style={styles.paymentDetailRow}>
                <Text style={styles.labelText}>Referencia:</Text>
                <TextInput
                  style={[styles.discountInput, { flex: 1 }]}
                  value={transferDetails.reference}
                  onChangeText={(text) =>
                    setTransferDetails({ ...transferDetails, reference: text })
                  }
                  placeholder="Referencia de la transferencia"
                  placeholderTextColor={themeObject.colors.placeholder}
                />
              </View>
            </View>
          )}

          {paymentMethod === "credito" && (
            <View style={styles.paymentDetailsContainer}>
              <View style={styles.paymentDetailRow}>
                <Text style={styles.labelText}>Plazos:</Text>
                <CustomPicker
                  selectedValue={creditDetails.installments}
                  onValueChange={(value) =>
                    setCreditDetails({ ...creditDetails, installments: value })
                  }
                  items={[
                    { label: "1 plazo", value: "1" },
                    { label: "2 plazos", value: "2" },
                    { label: "3 plazos", value: "3" },
                    { label: "6 plazos", value: "6" },
                    { label: "12 plazos", value: "12" },
                  ]}
                  containerStyle={{ flex: 1 }}
                />
              </View>
              <View style={styles.paymentDetailRow}>
                <Text style={styles.labelText}>Vencimiento:</Text>
                <TextInput
                  style={[styles.discountInput, { flex: 1 }]}
                  value={creditDetails.dueDate}
                  onChangeText={(text) =>
                    setCreditDetails({ ...creditDetails, dueDate: text })
                  }
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor={themeObject.colors.placeholder}
                />
              </View>
            </View>
          )}
        </View>
        {/* Estado de la venta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estado de la venta</Text>
          <CustomPicker
            selectedValue={saleStatus}
            onValueChange={(value) => setSaleStatus(value)}
            items={[
              { label: "Pagado", value: "pagado" },
              { label: "Pendiente", value: "pendiente" },
              { label: "Parcial", value: "parcial" },
              { label: "Cancelado", value: "cancelado" },
              { label: "Devuelto", value: "devuelto" },
            ]}
          />
        </View>
        {/* Tipo de IVA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo de IVA</Text>
          <CustomPicker
            selectedValue={tipoIva}
            onValueChange={(value) => {
              setTipoIva(value);
              // Actualizar el porcentaje de IVA según el tipo seleccionado usando el servicio
              setPorcentajeIva(
                taxCalculator.getIvaPercentage(value).toFixed(2)
              );
            }}
            items={[
              {
                label: `General (${IVA_TYPES.GENERAL.percentage}%)`,
                value: IVA_TYPES.GENERAL.name,
              },
              {
                label: `Reducido (${IVA_TYPES.REDUCIDO.percentage}%)`,
                value: IVA_TYPES.REDUCIDO.name,
              },
              {
                label: `Superreducido (${IVA_TYPES.SUPER_REDUCIDO.percentage}%)`,
                value: IVA_TYPES.SUPER_REDUCIDO.name,
              },
              {
                label: `Exento (${IVA_TYPES.EXENTO.percentage}%)`,
                value: IVA_TYPES.EXENTO.name,
              },
            ]}
          />
        </View>
        {/* Retención IRPF */}
        {client &&
          (client.tipo_cliente === "empresa" ||
            client.tipo_cliente === "autonomo") && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Retención IRPF (%)</Text>
              <View style={styles.discountContainer}>
                <TextInput
                  style={styles.discountInput}
                  value={porcentajeRetencion}
                  onChangeText={setPorcentajeRetencion}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={themeObject.colors.placeholder}
                />
                <Text style={styles.discountLabel}>%</Text>
              </View>
              {parseFloat(porcentajeRetencion) > 0 && (
                <Text
                  style={{
                    color: themeObject.colors.placeholder,
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  Se aplicará una retención del {porcentajeRetencion}% sobre el
                  subtotal
                </Text>
              )}
            </View>
          )}
        {/* Descuento */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descuento</Text>
          <View style={styles.discountContainer}>
            <Text style={styles.discountLabel}>€</Text>
            <TextInput
              style={styles.discountInput}
              value={discount}
              onChangeText={setDiscount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={themeObject.colors.placeholder}
            />
            <Text style={styles.discountLabel}>euros</Text>
          </View>
        </View>
        {/* Notas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notas</Text>
          <TextInput
            style={styles.notesInput}
            multiline
            value={notes}
            onChangeText={setNotes}
            placeholder="Notas adicionales para esta venta..."
            placeholderTextColor={themeObject.colors.placeholder}
          />
        </View>
        <Divider style={styles.divider} />
        {/* Resumen */}
        <View style={styles.summaryContainer}>
          <Text style={styles.sectionTitle}>Resumen</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              IVA ({taxCalculator.getIvaPercentage(tipoIva)}%)
            </Text>
            <Text style={styles.summaryValue}>
              $
              {(
                (subtotal * taxCalculator.getIvaPercentage(tipoIva)) /
                100
              ).toFixed(2)}
            </Text>
          </View>
          {parseFloat(discount) > 0 && (
            <View style={styles.summaryRow}>
              <Text
                style={[
                  styles.summaryLabel,
                  { color: themeObject.colors.error },
                ]}
              >
                Descuento
              </Text>
              <Text
                style={[
                  styles.summaryValue,
                  { color: themeObject.colors.error },
                ]}
              >
                -{parseFloat(discount).toFixed(2)}€
              </Text>
            </View>
          )}
          {parseFloat(porcentajeRetencion) > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Retención IRPF ({porcentajeRetencion}%)
              </Text>
              <Text style={styles.summaryValue}>
                -
                {((subtotal * parseFloat(porcentajeRetencion)) / 100).toFixed(
                  2
                )}
                €
              </Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total a pagar</Text>
            <Text style={styles.totalValue}>
              {totalWithDiscount.toFixed(2)}€
            </Text>
          </View>
        </View>
      </ScrollView>
    </ModalTemplate>
  );
};

export default SaleModal;
