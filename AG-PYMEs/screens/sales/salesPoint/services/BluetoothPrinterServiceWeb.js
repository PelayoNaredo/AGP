import { Alert } from "react-native";
// ATENCION : Este código es una simulación para entornos web y no interactúa con dispositivos Bluetooth reales.
// BUSCAR IMPLEMENTACION REAL ( cuando tengamos una impresora Bluetooth para pruebas reales )

//Servicio simulado de impresora Bluetooth para entorno web
class BluetoothPrinterServiceWeb {
  // Definir constantes de alineación
  static ALIGN = {
    LEFT: "LEFT",
    CENTER: "CENTER",
    RIGHT: "RIGHT",
  };

  //Verifica si el Bluetooth está activado (simulado para web)
  static async isBluetoothEnabled() {
    // En web, simulamos que el Bluetooth está habilitado
    return true;
  }

  //Solicita activar el Bluetooth al usuario (simulado para web)
  static async enableBluetooth() {
    Alert.alert(
      "Entorno web detectado",
      "La funcionalidad Bluetooth no está disponible en entornos web. Esta es una simulación."
    );
    return true;
  }

  //Escanea en busca de dispositivos Bluetooth disponibles (simulado para web)
  static async scanDevices() {
    // Retornar dispositivos de prueba simulados
    return [
      {
        name: "Impresora Simulada 1",
        address: "00:11:22:33:44:55",
      },
      {
        name: "Impresora Simulada 2",
        address: "AA:BB:CC:DD:EE:FF",
      },
    ];
  }

  //Conecta a una impresora Bluetooth (simulado para web)
  static async connectPrinter(address) {
    return true;
  }

  // Desconecta la impresora actualmente conectada (simulado para web)
  static async disconnect() {
    return true;
  }

  //Imprime un ticket con los datos de una venta (simulado para web)
  static async printTicket(saleData) {
    // Construir una representación visual del ticket para mostrarla
    let ticketContent = "";

    // Cabecera
    ticketContent += "MI EMPRESA\n\n";
    ticketContent += "TICKET DE VENTA\n";
    ticketContent += `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
    ticketContent += `No. Venta: ${saleData.id_venta}\n\n`;

    // Datos del cliente
    if (saleData.cliente) {
      ticketContent += `Cliente: ${saleData.cliente.nombre} ${saleData.cliente.apellido}\n`;
    }

    // Separador
    ticketContent += "--------------------------------\n";

    // Productos y servicios
    ticketContent += "Descripción          Cant.  Importe\n";
    ticketContent += "--------------------------------\n";

    // Productos
    if (saleData.productos && saleData.productos.length > 0) {
      for (const prod of saleData.productos) {
        const nombre = prod.nombre_producto || "Producto";
        const cantidad = prod.cantidad || 1;
        const precio = parseFloat(prod.precio_unitario || 0).toFixed(2);
        const subtotal = (cantidad * parseFloat(precio)).toFixed(2);

        ticketContent += `${nombre.padEnd(20)}${cantidad.toString().padStart(5)}${subtotal.padStart(10)}€\n`;
      }
    }

    // Servicios
    if (saleData.servicios && saleData.servicios.length > 0) {
      for (const serv of saleData.servicios) {
        const nombre = serv.nombre_servicio || "Servicio";
        const cantidad = serv.cantidad || 1;
        const precio = parseFloat(serv.precio_unitario || 0).toFixed(2);
        const subtotal = (cantidad * parseFloat(precio)).toFixed(2);

        ticketContent += `${nombre.padEnd(20)}${cantidad.toString().padStart(5)}${subtotal.padStart(10)}€\n`;
      }
    }

    // Separador
    ticketContent += "--------------------------------\n";

    // Resumen de la venta
    ticketContent += `Subtotal:${parseFloat(saleData.subtotal || 0)
      .toFixed(2)
      .padStart(26)}€\n`;

    if (saleData.descuento && parseFloat(saleData.descuento) > 0) {
      ticketContent += `Descuento:${parseFloat(saleData.descuento).toFixed(2).padStart(24)}€\n`;
    }

    ticketContent += `IVA (${parseFloat(saleData.porcentaje_iva || 21).toFixed(0)}%):${parseFloat(
      saleData.impuestos || 0
    )
      .toFixed(2)
      .padStart(21)}€\n`;

    // Total
    ticketContent += `TOTAL:${parseFloat(saleData.total || 0)
      .toFixed(2)
      .padStart(29)}€\n\n`;

    // Método de pago
    ticketContent += `Método de pago: ${saleData.metodo_pago || "Efectivo"}\n\n`;

    // Pie de página
    ticketContent += "Gracias por su compra\n\n";
    ticketContent += "www.miempresa.com\n";

    // Mostrar alerta con el ticket simulado
    Alert.alert(
      "Simulación de impresión",
      "En un entorno web, la impresión Bluetooth no está disponible. Se ha generado un ticket simulado que se muestra en la consola del navegador.",
      [
        { text: "Ver detalles", onPress: () => console.log(ticketContent) },
        { text: "OK" },
      ]
    );

    return true;
  }
}

export default BluetoothPrinterServiceWeb;
