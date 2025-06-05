import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import CustomButton from "../../../components/customButton";
import CustomPicker from "../../../components/customPicker";
import ModalTemplate from "../../../components/modalTemplate";
import { Services } from "../../../api/index";
import ProductSelector from "./productSelector";
import { DatePickerModal } from "react-native-paper-dates";
import EmailOrderSender, {
  processEmailTemplate,
  sendEmail,
} from "./EmailOrderSender";

// Componente OrderModal para crear o editar pedidos
const OrderModal = ({
  visible,
  onClose,
  order,
  inventory,
  onSuccess,
  orderItems = [],
  onRemoveItem,
  orderDetails,
}) => {
  const { themeObject } = useTheme();
  const styles = createStyles(themeObject);

  const [formData, setFormData] = useState({
    id_proveedor: "",
    metodo_pago: "",
    fecha_entrega_estimada: "",
    comentarios: "",
    items: [],
    estado: "pendiente",
  });

  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [supplierError, setSupplierError] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [sendEmailToSupplier, setSendEmailToSupplier] = useState(true);

  // Cargar datos del pedido al editar o reiniciar el formulario para uno nuevo
  useEffect(() => {
    if (order) {
      setFormData({
        id_proveedor: order.id_proveedor.toString(),
        metodo_pago: order.metodo_pago,
        fecha_entrega_estimada: order.fecha_entrega_estimada,
        comentarios: order.comentarios,
        items: orderItems.map((item) => ({
          ...item,
          id_detalle: orderDetails.find(
            (detail) =>
              detail.id_pedido === order.id_pedido &&
              detail.id_producto === item.id_producto
          )?.id_detalle,
        })),
        estado: order.estado,
      });
    } else {
      setFormData({
        id_proveedor: "",
        metodo_pago: "",
        fecha_entrega_estimada: new Date().toISOString(),
        comentarios: "",
        items: [],
        estado: "pendiente",
      });
    }
  }, [order, inventory, orderItems, orderDetails]);

  // Cargar proveedores cuando la modal es visible
  useEffect(() => {
    if (visible) {
      fetchSuppliers();
    }
  }, [visible]);
  const fetchSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const data = await Services.Data.Suppliers.getAll();
      setSuppliers(data);
      setSupplierError("");
    } catch (error) {
      setSupplierError("Error al cargar proveedores");
      console.error(error);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  // Función para manejar el envío de correo al proveedor
  const handleSendEmail = async (savedOrder) => {
    try {
      // Encontrar el proveedor seleccionado
      const selectedSupplier = suppliers.find(
        (s) => s.id_proveedor === parseInt(formData.id_proveedor)
      );

      if (!selectedSupplier || !selectedSupplier.email) {
        return false;
      }

      // Procesar la plantilla de email
      const emailBody = processEmailTemplate(
        selectedSupplier.plantilla_email,
        savedOrder || formData,
        formData.items,
        selectedSupplier
      );

      // Asunto del correo
      const subject = `Nuevo pedido: ${savedOrder?.id_pedido || "Pedido"} - ${new Date().toLocaleDateString()}`;

      // Enviar el correo
      return await sendEmail(selectedSupplier.email, subject, emailBody);
    } catch (error) {
      console.error("Error al preparar el correo:", error);
      return false;
    }
  };

  // Manejar el envío del formulario
  const handleSubmit = async () => {
    try {
      // Validación mejorada
      if (
        !formData.id_proveedor ||
        formData.items.length === 0 ||
        !formData.estado
      ) {
        Alert.alert("Error", "Complete los campos requeridos (*)");
        return;
      }

      const hasInvalidItems = formData.items.some(
        (item) =>
          !item.id_producto || item.cantidad <= 0 || item.precio_unitario <= 0
      );

      if (hasInvalidItems) {
        Alert.alert("Error", "Revise los productos seleccionados");
        return;
      }

      const orderData = {
        id_proveedor: parseInt(formData.id_proveedor),
        metodo_pago: formData.metodo_pago,
        fecha_entrega_estimada: formData.fecha_entrega_estimada,
        comentarios: formData.comentarios,
        estado: formData.estado,
        total: formData.items.reduce(
          (sum, item) =>
            sum + (item.cantidad || 0) * (item.precio_unitario || 0),
          0
        ),
      }; // Crear o actualizar pedido
      const savedOrder = order
        ? await Services.Data.Orders.update(order.id_pedido, orderData)
        : await Services.Data.Orders.create(orderData);

      await Promise.all(
        formData.items.map(async (item) => {
          if (item.id_detalle) {
            // Actualizar detalle existente
            await Services.Data.OrderDetails.update(item.id_detalle, {
              id_pedido: savedOrder.id_pedido,
              id_producto: item.id_producto,
              cantidad: item.cantidad,
              precio_unitario: item.precio_unitario,
            });
          } else {
            // Crear nuevo detalle
            await Services.Data.OrderDetails.create({
              id_pedido: savedOrder.id_pedido,
              id_producto: item.id_producto,
              cantidad: item.cantidad,
              precio_unitario: item.precio_unitario,
            });
          }
        })
      );

      // Enviar correo al proveedor si está habilitado
      if (sendEmailToSupplier) {
        await handleSendEmail(savedOrder);
      }

      onSuccess(savedOrder);
      onClose();
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar el pedido");
    }
  };

  // Opciones de estado del pedido
  const statusItems = [
    { label: "Pendiente", value: "Pendiente" },
    { label: "Enviado", value: "Enviado" },
    { label: "Completado", value: "Completado" },
    { label: "Cancelado", value: "Cancelado" },
  ];

  if (!visible) return null;

  // Obtener el proveedor seleccionado para el componente EmailOrderSender
  const selectedSupplier = formData.id_proveedor
    ? suppliers.find((s) => s.id_proveedor === parseInt(formData.id_proveedor))
    : null;

  return (
    <ModalTemplate
      isVisible={visible}
      title={order ? "Editar Pedido" : "Nuevo Pedido"}
      cancelLabel="Cancelar"
      cancelAction={onClose}
      confirmLabel={order ? "Actualizar Pedido" : "Crear Pedido"}
      confirmAction={handleSubmit}
      confirmDisabled={!formData.id_proveedor || formData.items.length === 0}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Selector de Proveedor */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Proveedor *</Text>
          {loadingSuppliers ? (
            <ActivityIndicator color={themeObject.colors.accent} />
          ) : supplierError ? (
            <Text style={styles.errorText}>{supplierError}</Text>
          ) : (
            <CustomPicker
              selectedValue={formData.id_proveedor}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, id_proveedor: value }))
              }
              items={suppliers.map((s) => ({
                label: s.nombre_proveedor,
                value: s.id_proveedor.toString(),
              }))}
              placeholder="Seleccionar proveedor"
            />
          )}
        </View>

        {/* Selector de Productos */}
        <ProductSelector
          inventory={inventory}
          selectedItems={formData.items}
          onSelectItems={(items) => setFormData({ ...formData, items })}
          onRemoveItem={onRemoveItem}
        />

        <View style={styles.formGroup}>
          <Text style={styles.label}>Método de Pago</Text>
          <TextInput
            style={styles.input}
            value={formData.metodo_pago}
            onChangeText={(text) =>
              setFormData({ ...formData, metodo_pago: text })
            }
            placeholder="Ej: Transferencia, Efectivo..."
            placeholderTextColor={themeObject.colors.placeholder}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Fecha de Entrega Estimada *</Text>
          <CustomButton
            onPress={() => setShowDatePicker(true)}
            variant="outline"
            style={styles.dateButton}
          >
            {new Date(formData.fecha_entrega_estimada).toLocaleDateString()}
          </CustomButton>

          <DatePickerModal
            locale="es"
            mode="single"
            visible={showDatePicker}
            onDismiss={() => setShowDatePicker(false)}
            date={new Date(formData.fecha_entrega_estimada)}
            onConfirm={({ date }) => {
              setFormData({
                ...formData,
                fecha_entrega_estimada: date.toISOString(),
              });
              setShowDatePicker(false);
            }}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Estado *</Text>
          <CustomPicker
            selectedValue={formData.estado}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, estado: value }))
            }
            items={statusItems}
            placeholder="Seleccionar estado"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Comentarios</Text>
          <TextInput
            style={[styles.input, { height: 100 }]}
            value={formData.comentarios}
            onChangeText={(text) =>
              setFormData({ ...formData, comentarios: text })
            }
            multiline
            numberOfLines={4}
            placeholder="Añade cualquier nota relevante..."
            placeholderTextColor={themeObject.colors.placeholder}
          />
        </View>

        {/* Componente para enviar correo al proveedor */}
        <EmailOrderSender
          enabled={sendEmailToSupplier}
          onToggle={(value) => setSendEmailToSupplier(value)}
          supplier={selectedSupplier}
        />

        {order && (
          <CustomButton
            onPress={() => {
              Alert.alert("Confirmar", "¿Deseas eliminar este pedido?", [
                { text: "Cancelar", style: "cancel" },
                {
                  text: "Eliminar",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      await Services.Data.Orders.delete(order.id_pedido);
                      onSuccess(null);
                      onClose();
                    } catch (err) {
                      Alert.alert("Error", "No se pudo eliminar el pedido");
                    }
                  },
                },
              ]);
            }}
            variant="error"
            style={styles.deleteButton}
          >
            Eliminar Pedido
          </CustomButton>
        )}
      </ScrollView>
    </ModalTemplate>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    formGroup: {
      marginBottom: 16,
    },
    label: {
      color: theme.colors.text,
      marginBottom: 8,
      fontSize: 14,
      fontWeight: "500",
    },
    input: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.roundness,
      padding: 12,
      color: theme.colors.text,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: 12,
      marginTop: 4,
    },
    dateButton: {
      justifyContent: "flex-start",
      backgroundColor: theme.colors.background,
      borderColor: theme.colors.border,
    },
    deleteButton: {
      marginTop: 24,
    },
  });

export default OrderModal;
