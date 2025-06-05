import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Platform,
  Linking,
} from "react-native";
import { useTheme } from "../../../context/ThemeContext";

//Componente para mostrar un switch de envío de correo al proveedor en el modal de pedidos
const EmailOrderSender = ({ enabled, onToggle, supplier }) => {
  const { themeObject } = useTheme();
  const styles = createStyles(themeObject);

  return (
    <View style={styles.switchContainer}>
      <Text style={styles.switchLabel}>
        Enviar correo al proveedor
        {!supplier?.email && (
          <Text style={styles.warningText}> (Proveedor sin email)</Text>
        )}
      </Text>
      <Switch
        value={enabled && !!supplier?.email}
        onValueChange={onToggle}
        disabled={!supplier?.email}
        trackColor={{
          false: themeObject.colors.disabled,
          true: themeObject.colors.accent,
        }}
        thumbColor={
          Platform.OS === "android" ? themeObject.colors.white : undefined
        }
      />
    </View>
  );
};

// Función para procesar la plantilla de correo electrónico
export const processEmailTemplate = (template, order, items, supplier) => {
  if (!template) {
    return getDefaultTemplate(order, items, supplier);
  }

  let processedTemplate = template;

  // Reemplazar variables del pedido
  const orderDate = new Date().toLocaleDateString();
  const deliveryDate = order.fecha_entrega_estimada
    ? new Date(order.fecha_entrega_estimada).toLocaleDateString()
    : "No especificada";

  const replacements = {
    "{NUMERO_PEDIDO}": order.id_pedido || "Nuevo pedido",
    "{FECHA_PEDIDO}": orderDate,
    "{FECHA_ENTREGA}": deliveryDate,
    "{METODO_PAGO}": order.metodo_pago || "No especificado",
    "{COMENTARIOS}": order.comentarios || "Sin comentarios",
    "{TOTAL}": calculateTotal(items).toFixed(2) + " €",
    "{ITEMS}": formatOrderItems(items),
    "{ESTADO}": order.estado || "Pendiente",
    "{PROVEEDOR}": supplier?.nombre_proveedor || "Proveedor",
  };

  // Realizar reemplazos
  Object.entries(replacements).forEach(([key, value]) => {
    processedTemplate = processedTemplate.replace(new RegExp(key, "g"), value);
  });

  return processedTemplate;
};

// Función para enviar el correo electrónico
export const sendEmail = async (to, subject, body) => {
  try {
    if (!to) {
      throw new Error("No se ha especificado un destinatario");
    }

    // Comportamiento específico según plataforma
    if (Platform.OS === "web") {
      // Para web, usamos el enlace directo a Gmail como alternativa más confiable
      const gmailComposeUrl = `https://mail.google.com/mail/u/0/?fs=1&tf=cm&source=mailto&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      // Intentar abrir en una nueva pestaña
      const opened = window.open(gmailComposeUrl, "_blank");

      // Si eso falla (bloqueador de ventanas emergentes), intentamos otra estrategia
      if (!opened) {
        console.warn(
          "No se pudo abrir Gmail automáticamente (posible bloqueador de ventanas emergentes)"
        );

        // Crear un enlace temporal y mostrar mensaje al usuario
        const tempLink = document.createElement("a");
        tempLink.href = gmailComposeUrl;
        tempLink.target = "_blank";
        tempLink.textContent = "Haga clic aquí para abrir Gmail";
        tempLink.style.display = "none";

        // Añadir a la página y simular clic
        document.body.appendChild(tempLink);
        tempLink.click();

        // Mostrar mensaje de ayuda
        alert(
          "Si el correo no se abre automáticamente, por favor habilite las ventanas emergentes para este sitio o utilice el enlace que apareció en pantalla."
        );

        // Limpiar después de un tiempo
        setTimeout(() => {
          document.body.removeChild(tempLink);
        }, 100);
      }

      return true;
    } else {
      // En móvil seguimos usando el método de Linking
      const url = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      const canOpen = await Linking.canOpenURL(url);

      if (!canOpen) {
        throw new Error("No se puede abrir la aplicación de correo");
      }

      await Linking.openURL(url);
      return true;
    }
  } catch (error) {
    console.error("Error al abrir la aplicación de correo:", error);
    return false;
  }
};

// Funciones auxiliares

// Genera una plantilla de correo electrónico por defecto
const getDefaultTemplate = (order, items, supplier) => {
  const orderDate = new Date().toLocaleDateString();
  const deliveryDate = order.fecha_entrega_estimada
    ? new Date(order.fecha_entrega_estimada).toLocaleDateString()
    : "No especificada";

  return `Estimado ${supplier?.nombre_proveedor || "Proveedor"},

Mediante el presente correo, le hacemos llegar nuestro pedido con la siguiente información:

Número de pedido: ${order.id_pedido || "Nuevo pedido"}
Fecha de pedido: ${orderDate}
Fecha de entrega estimada: ${deliveryDate}
Estado del pedido: ${order.estado || "Pendiente"}

PRODUCTOS:
${formatOrderItems(items)}

Total del pedido: ${calculateTotal(items).toFixed(2)} €

${order.comentarios ? `Notas adicionales: ${order.comentarios}` : ""}

Saludos cordiales,
Mi Empresa`;
};

// Formatea los items del pedido para el cuerpo del correo
const formatOrderItems = (items) => {
  if (!items || items.length === 0) {
    return "No hay productos en el pedido";
  }

  return items
    .map((item) => {
      // Asegurar que precio_unitario sea un número
      const precio =
        typeof item.precio_unitario === "string"
          ? parseFloat(item.precio_unitario)
          : item.precio_unitario || 0;

      // Asegurar que cantidad sea un número
      const cantidad =
        typeof item.cantidad === "string"
          ? parseFloat(item.cantidad)
          : item.cantidad || 0;

      // Calcular el total por item con seguridad
      const totalItem = (cantidad * precio).toFixed(2);

      return `- ${item.nombre_producto || "Producto"}: ${cantidad} unidades x ${precio.toFixed(2)} € = ${totalItem} €`;
    })
    .join("\n");
};

// Calcula el total del pedido sumando los precios de los items
const calculateTotal = (items) => {
  if (!items || items.length === 0) return 0;

  return items.reduce((sum, item) => {
    // Asegurar que precio_unitario y cantidad sean números
    const precio =
      typeof item.precio_unitario === "string"
        ? parseFloat(item.precio_unitario)
        : item.precio_unitario || 0;

    const cantidad =
      typeof item.cantidad === "string"
        ? parseFloat(item.cantidad)
        : item.cantidad || 0;

    return sum + cantidad * precio;
  }, 0);
};

const createStyles = (theme) =>
  StyleSheet.create({
    switchContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 8,
      marginTop: 10,
      marginBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      paddingBottom: 16,
    },
    switchLabel: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: "500",
    },
    warningText: {
      color: theme.colors.error,
      fontStyle: "italic",
      fontSize: 12,
    },
  });

export default EmailOrderSender;
