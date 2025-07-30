import { BluetoothPrinter } from "react-native-thermal-receipt-printer";
import { Platform } from "react-native";
import useNotifications from "../../../../hooks/useNotifications";

/**
 * Servicio para manejar las operaciones de la impresora Bluetooth
 * Implementación para dispositivos nativos (Android/iOS)(TODO: completar el servicio completo y hacer pruebas reales con una impresora Bluetooth)
 */
class BluetoothPrinterServiceNative {
  // Definir constantes de alineación
  static ALIGN = {
    LEFT: "LEFT",
    CENTER: "CENTER",
    RIGHT: "RIGHT",
  };

  //Verifica si el Bluetooth está activado
  static async isBluetoothEnabled() {
    try {
      // Esta biblioteca no tiene un método directo para verificar el Bluetooth
      await BluetoothPrinter.init();
      return true;
    } catch (error) {
      console.error("Error al verificar Bluetooth:", error);
      return false;
    }
  }

  //Solicita activar el Bluetooth al usuario
  static async enableBluetooth() {
    try {
      // Esta biblioteca no tiene un método directo para activar el Bluetooth
      Alert.alert(
        "Activación de Bluetooth",
        "Por favor, activa el Bluetooth en tu dispositivo y vuelve a intentarlo."
      );
      return true;
    } catch (error) {
      console.error("Error al activar Bluetooth:", error);
      return false;
    }
  }

  //Escanea en busca de dispositivos Bluetooth disponibles
  static async scanDevices() {
    try {
      await BluetoothPrinter.init();
      const devices = await BluetoothPrinter.getDeviceList();
      // Transformar el formato para que sea compatible con el código existente
      return devices.map((device) => ({
        name: device.device_name,
        address: device.inner_mac_address,
      }));
    } catch (error) {
      console.error("Error al escanear dispositivos:", error);
      throw error;
    }
  }

  // Conecta a una impresora Bluetooth
  static async connectPrinter(address) {
    try {
      await BluetoothPrinter.connectPrinter(address);
      return true;
    } catch (error) {
      console.error("Error al conectar con la impresora:", error);
      throw error;
    }
  }

  // Desconecta la impresora actualmente conectada
  static async disconnect() {
    try {
      await BluetoothPrinter.init();
      return true;
    } catch (error) {
      console.error("Error al desconectar la impresora:", error);
      throw error;
    }
  }

  //Imprime un ticket con los datos de una venta (TODO: completar el servicio completo Agregar titulo de la empresa, fecha, hora, etc.)
  static async printTicket(saleData) {
    try {
      // Obtener fecha actual formateada
      const currentDate = new Date().toLocaleDateString();
      const currentTime = new Date().toLocaleTimeString();

      // Construir el contenido del ticket
      let ticketContent = "";

      // Cabecera
      ticketContent += "<C>MI EMPRESA</C>\n\n"; //modificar con el nombre de la empresa
      ticketContent += "<C>TICKET DE VENTA</C>\n";
      ticketContent += `<C>${currentDate} ${currentTime}</C>\n`;
      ticketContent += `<C>No. Venta: ${saleData.id_venta}</C>\n\n`;

      // Datos del cliente
      if (saleData.cliente) {
        ticketContent += `Cliente: ${saleData.cliente.nombre} ${saleData.cliente.apellido}\n`;
      }

      // Separador
      ticketContent += "--------------------------------\n";

      // Cabecera de productos
      ticketContent += "<L>Descripción</L><C>Cant.</C><R>Importe</R>\n";
      ticketContent += "--------------------------------\n";

      // Productos
      if (saleData.productos && saleData.productos.length > 0) {
        for (const prod of saleData.productos) {
          const nombre = prod.nombre_producto || "Producto";
          const cantidad = prod.cantidad || 1;
          const precio = parseFloat(prod.precio_unitario || 0).toFixed(2);
          const subtotal = (cantidad * parseFloat(precio)).toFixed(2);

          ticketContent += `<L>${nombre}</L><C>${cantidad}</C><R>${subtotal}€</R>\n`;
        }
      }

      // Servicios
      if (saleData.servicios && saleData.servicios.length > 0) {
        for (const serv of saleData.servicios) {
          const nombre = serv.nombre_servicio || "Servicio";
          const cantidad = serv.cantidad || 1;
          const precio = parseFloat(serv.precio_unitario || 0).toFixed(2);
          const subtotal = (cantidad * parseFloat(precio)).toFixed(2);

          ticketContent += `<L>${nombre} (Serv.)</L><C>${cantidad}</C><R>${subtotal}€</R>\n`;
        }
      }

      // Separador
      ticketContent += "--------------------------------\n";

      // Resumen de la venta
      ticketContent += `<R>Subtotal: ${parseFloat(saleData.subtotal || 0).toFixed(2)}€</R>\n`;

      if (saleData.descuento && parseFloat(saleData.descuento) > 0) {
        ticketContent += `<R>Descuento: ${parseFloat(saleData.descuento).toFixed(2)}€</R>\n`;
      }

      ticketContent += `<R>IVA (${parseFloat(saleData.porcentaje_iva || 21).toFixed(0)}%): ${parseFloat(saleData.impuestos || 0).toFixed(2)}€</R>\n`;

      // Total
      ticketContent += `<B><R>TOTAL: ${parseFloat(saleData.total || 0).toFixed(2)}€</R></B>\n\n`;

      // Método de pago
      ticketContent += `<C>Método de pago: ${saleData.metodo_pago || "Efectivo"}</C>\n\n`;

      // Pie de página
      ticketContent += "<C>Gracias por su compra</C>\n\n";
      ticketContent += "<C>www.miempresa.com</C>\n"; //modificar con la URL de la empresa

      // Agregar espacios al final para cortar el papel
      ticketContent += "\n\n\n";

      // Imprimir el ticket
      await BluetoothPrinter.printBill(ticketContent);

      return true;
    } catch (error) {
      console.error("Error al imprimir ticket:", error);
      throw error;
    }
  }
}

export default BluetoothPrinterServiceNative;
