import React, { useState, useEffect, useRef } from "react";
import { StyleSheet } from "react-native";
import AlertBox from "./alertBox.js";
import useNotifications from "../hooks/useNotifications";

// Import dinámico defensivo para evitar problemas de timing
let Services = null;
try {
  Services = require("../api").default?.Services || require("../api")?.Services;
} catch (error) {
  // Error silencioso, se manejará en el useEffect
}

// Objeto de alerta estática para usar con métodos
export const AlertManagerService = {
  showAlert: (type, title, message) => {
    // Usar el sistema de notificaciones moderno en lugar de Alert nativo
    const { showAlert } = useNotifications();
    showAlert(title, message);
  },
};

const AlertManager = ({
  alertType,
  customAlerts = [],
  onAlertPress,
  disableApiCalls = false, // Nueva prop para deshabilitar llamadas de API
}) => {
  const [apiAlerts, setApiAlerts] = useState([]);
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
  const [isServicesReady, setIsServicesReady] = useState(false);
  const alertQueue = useRef([]);
  const isMounted = useRef(true);

  // Verificar disponibilidad de Services al montar (solo si necesitamos API)
  useEffect(() => {
    if (disableApiCalls) {
      setIsServicesReady(false);
      return;
    }

    const checkServices = () => {
      // Re-intentar cargar Services si no está disponible
      if (!Services) {
        try {
          Services =
            require("../api").default?.Services || require("../api")?.Services;
        } catch (error) {
          // Error silencioso, reintentará
        }
      }

      if (Services && Services.Data && Services.Data.Alerts) {
        setIsServicesReady(true);
      } else {
        // Reintentar en 100ms
        setTimeout(checkServices, 100);
      }
    };
    checkServices();
  }, [disableApiCalls]);

  // Combinar y validar alertas de API y personalizadas
  const allAlerts = React.useMemo(() => {
    // Si se deshabilitan las API calls, solo usar customAlerts
    const alerts = disableApiCalls ? [] : apiAlerts;

    // Combinamos alertas de la API (si están habilitadas) y personalizadas
    const combinedAlerts = [
      ...alerts,
      ...(Array.isArray(customAlerts) ? customAlerts : []),
    ];

    // Filtramos alertas vacías y solo mostramos las que no están completadas
    return combinedAlerts.filter(
      (alert) => alert && alert.message && alert.estado !== "completado"
    );
  }, [apiAlerts, customAlerts, disableApiCalls]);

  // Obtener alertas desde la API usando el servicio optimizado
  useEffect(() => {
    // Solo ejecutar si Services está listo Y no están deshabilitadas las API calls
    if (!isServicesReady || disableApiCalls) return;

    const fetchAlerts = async () => {
      try {
        // Doble verificación defensiva
        if (!Services?.Data?.Alerts) {
          console.error(
            "[ALERT_MANAGER]   Services.Data.Alerts no está disponible"
          );
          return;
        }

        // Usar servicio optimizado con cache - no forzar refresh
        const data = await Services.Data.Alerts.getAll(false);

        const filteredAlerts = alertType
          ? data.filter(
              (alert) => alert.type === alertType || alert.tipo === alertType
            )
          : data;
        const normalizedAlerts = filteredAlerts.map((alert) => ({
          id: alert.id_recordatorio || alert.id,
          message:
            alert.message ||
            alert.mensaje ||
            alert.description ||
            alert.descripcion ||
            alert.titulo ||
            "",
          type: alert.type || alert.tipo || "info",
          priority: alert.priority || alert.prioridad || "normal",
          estado: alert.estado || "pendiente",
        }));

        if (isMounted.current) {
          setApiAlerts(normalizedAlerts);
        }
      } catch (error) {
        console.error("Error al obtener alertas:", error);
      }
    };

    fetchAlerts();

    return () => {
      isMounted.current = false;
    };
  }, [alertType, isServicesReady, disableApiCalls]); // Añadir dependencia de disableApiCalls
  // Manejar la cola de alertas
  useEffect(() => {
    if (allAlerts.length === 0) return;

    // Reiniciar el índice si cambian las alertas
    setCurrentAlertIndex(0);

    const interval = setInterval(() => {
      setCurrentAlertIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        return nextIndex >= allAlerts.length ? 0 : nextIndex;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [allAlerts.length]); // Solo dependemos del length para evitar problemas de referencia
  if (allAlerts.length === 0) {
    return null;
  }

  const currentAlert = allAlerts[currentAlertIndex];

  // Verificar que la alerta actual tenga los campos necesarios
  if (!currentAlert || !currentAlert.message) {
    console.warn("Alerta sin mensaje o mal formateada:", currentAlert);
    return null;
  }

  // Función para manejar el press de la alerta
  const handleAlertPress = () => {
    if (onAlertPress && typeof onAlertPress === "function") {
      onAlertPress(currentAlert);
    }
  };

  // Usamos key para forzar la recreación del componente cuando cambie la alerta
  return (
    <AlertBox
      key={`alert-${currentAlertIndex}-${currentAlert.message}`}
      message={currentAlert.message}
      type={currentAlert.type || "info"}
      priority={currentAlert.priority || "normal"}
      estado={currentAlert.estado || "pendiente"}
      style={styles.alert}
      onPress={onAlertPress ? handleAlertPress : undefined}
    />
  );
};

const styles = StyleSheet.create({
  alert: {
    marginVertical: 10,
  },
});

export default AlertManager;
