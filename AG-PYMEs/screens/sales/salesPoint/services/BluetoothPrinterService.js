import { Platform } from "react-native";

// Implementación simulada para entorno web o implementación real para dispositivos nativos
const BluetoothPrinterService =
  Platform.OS === "web"
    ? require("./BluetoothPrinterServiceWeb").default
    : require("./BluetoothPrinterServiceNative").default;

export default BluetoothPrinterService;
