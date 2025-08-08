import { registerRootComponent } from "expo";
import "react-native-paper/babel";
import { Platform } from "react-native";

import App from "./App";

// Silenciar warnings de RN Web por props táctiles en SVG usados por librerías de charts
if (Platform.OS === "web") {
  const originalError = console.error;
  console.error = (...args) => {
    const msg = args?.[0];
    if (
      typeof msg === "string" &&
      msg.includes("Unknown event handler property")
    ) {
      return; // ignorar sólo este warning
    }
    originalError(...args);
  };
}

// proyecto de aplicacion de gestion de pymes para Ilerna
registerRootComponent(App);
