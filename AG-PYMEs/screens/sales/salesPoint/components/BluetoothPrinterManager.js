import React, { useState } from "react";
import BluetoothPrinterService from "../services/BluetoothPrinterService";
import BluetoothPrinterSelector from "./BluetoothPrinterSelector";
import PrinterStatus from "./PrinterStatus";
import ModalTemplate from "../../../../components/modalTemplate";

//Componente controlador para gestionar la impresora Bluetooth
const BluetoothPrinterManager = ({ onPrinterStatusChange }) => {
  const [printerList, setPrinterList] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState(null);
  const [isPrinterModalVisible, setIsPrinterModalVisible] = useState(false);
  const [isBluetoothEnabled, setIsBluetoothEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Estados para los modales
  const [bluetoothDisabledModalVisible, setBluetoothDisabledModalVisible] =
    useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [printerConnectionModalVisible, setPrinterConnectionModalVisible] =
    useState(false);
  const [printerDisconnectModalVisible, setPrinterDisconnectModalVisible] =
    useState(false);
  const [printTicketModalVisible, setPrintTicketModalVisible] = useState(false);

  //Escanea dispositivos Bluetooth disponibles
  const scanBluetoothDevices = async () => {
    setIsLoading(true);
    try {
      // Verificar si el Bluetooth está activado
      const isEnabled = await BluetoothPrinterService.isBluetoothEnabled();
      setIsBluetoothEnabled(isEnabled);

      if (!isEnabled) {
        setBluetoothDisabledModalVisible(true);
        setIsLoading(false);
        return;
      } // Escanear dispositivos
      const devices = await BluetoothPrinterService.scanDevices();
      setPrinterList(devices);

      if (devices.length === 0) {
        setErrorMessage("No se encontraron dispositivos Bluetooth");
        setErrorModalVisible(true);
      } else {
        setIsPrinterModalVisible(true);
      }
    } catch (error) {
      console.error("Error al escanear dispositivos Bluetooth:", error);
      setErrorMessage("No se pudieron escanear dispositivos Bluetooth");
      setErrorModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  //Conecta con la impresora seleccionada
  const connectToPrinter = async (device) => {
    setIsLoading(true);
    try {
      await BluetoothPrinterService.connectPrinter(device.address);
      setSelectedPrinter(device);
      setIsPrinterModalVisible(false);

      // Notificar el cambio de estado de la impresora
      if (onPrinterStatusChange) {
        onPrinterStatusChange(device);
      }

      setPrinterConnectionModalVisible(true);
    } catch (error) {
      console.error("Error al conectar con la impresora:", error);
      setErrorMessage("No se pudo conectar con la impresora");
      setErrorModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  //Desconecta la impresora actual
  const disconnectPrinter = async () => {
    try {
      await BluetoothPrinterService.disconnect();
      setSelectedPrinter(null);

      // Notificar el cambio de estado de la impresora
      if (onPrinterStatusChange) {
        onPrinterStatusChange(null);
      }

      setPrinterDisconnectModalVisible(true);
    } catch (error) {
      console.error("Error al desconectar la impresora:", error);
      setErrorMessage("No se pudo desconectar la impresora");
      setErrorModalVisible(true);
    }
  };

  //Imprime un ticket con los datos recibidos
  const printTicket = async (saleData) => {
    if (!selectedPrinter) {
      setPrintTicketModalVisible(true);
      return false;
    }

    try {
      await BluetoothPrinterService.printTicket(saleData);
      return true;
    } catch (error) {
      console.error("Error al imprimir el ticket:", error);
      setErrorMessage(
        "No se pudo imprimir el ticket. Verifica la conexión con la impresora."
      );
      setErrorModalVisible(true);
      return false;
    }
  };

  // Función para activar el Bluetooth
  const handleEnableBluetooth = async () => {
    try {
      const enabled = await BluetoothPrinterService.enableBluetooth();
      if (enabled) {
        setIsBluetoothEnabled(true);
        scanBluetoothDevices();
      } else {
        setErrorMessage("No se pudo activar el Bluetooth");
        setErrorModalVisible(true);
      }
    } catch (error) {
      console.error("Error al activar Bluetooth:", error);
      setErrorMessage("No se pudo activar el Bluetooth");
      setErrorModalVisible(true);
    } finally {
      setBluetoothDisabledModalVisible(false);
    }
  };

  return (
    <>
      <PrinterStatus
        printer={selectedPrinter}
        onDisconnect={disconnectPrinter}
        onConnect={scanBluetoothDevices}
      />

      <BluetoothPrinterSelector
        visible={isPrinterModalVisible}
        onClose={() => setIsPrinterModalVisible(false)}
        printerList={printerList}
        isLoading={isLoading}
        onConnect={connectToPrinter}
        onRefresh={scanBluetoothDevices}
      />

      {/* Modal para Bluetooth desactivado */}
      <ModalTemplate
        isVisible={bluetoothDisabledModalVisible}
        title="Bluetooth desactivado"
        text="Por favor, activa el Bluetooth para conectar la impresora"
        cancelLabel="Cancelar"
        cancelAction={() => setBluetoothDisabledModalVisible(false)}
        confirmLabel="Activar Bluetooth"
        confirmAction={handleEnableBluetooth}
      />

      {/* Modal para errores generales */}
      <ModalTemplate
        isVisible={errorModalVisible}
        title="Error"
        text={errorMessage}
        cancelLabel="Cerrar"
        cancelAction={() => setErrorModalVisible(false)}
        confirmLabel="Intentar de nuevo"
        confirmAction={() => {
          setErrorModalVisible(false);
          scanBluetoothDevices();
        }}
      />

      {/* Modal de conexión exitosa */}
      <ModalTemplate
        isVisible={printerConnectionModalVisible}
        title="Conexión exitosa"
        text={selectedPrinter ? `Conectado a ${selectedPrinter.name}` : ""}
        cancelLabel="Aceptar"
        cancelAction={() => setPrinterConnectionModalVisible(false)}
        confirmLabel="Aceptar"
        confirmAction={() => setPrinterConnectionModalVisible(false)}
      />

      {/* Modal de desconexión */}
      <ModalTemplate
        isVisible={printerDisconnectModalVisible}
        title="Impresora desconectada"
        text="La impresora ha sido desconectada correctamente"
        cancelLabel="Aceptar"
        cancelAction={() => setPrinterDisconnectModalVisible(false)}
        confirmLabel="Aceptar"
        confirmAction={() => setPrinterDisconnectModalVisible(false)}
      />

      {/* Modal para buscar impresora */}
      <ModalTemplate
        isVisible={printTicketModalVisible}
        title="Sin impresora"
        text="No hay una impresora conectada. ¿Deseas buscar una?"
        cancelLabel="Cancelar"
        cancelAction={() => setPrintTicketModalVisible(false)}
        confirmLabel="Buscar impresora"
        confirmAction={() => {
          setPrintTicketModalVisible(false);
          scanBluetoothDevices();
        }}
      />
    </>
  );
};

// Modificamos esta exportación para evitar conflictos con las importaciones circulares
export { BluetoothPrinterManager };
export default BluetoothPrinterManager;
