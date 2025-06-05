import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, Alert } from "react-native";
import AlertBox from "./alertBox.js";
import { getAlerts } from "../api";

// Objeto de alerta estática para usar con métodos
export const AlertManagerService = {
  showAlert: (type, title, message) => {
    Alert.alert(title, message);
  },
};

const AlertManager = ({ alertType, customAlerts = [], onAlertPress }) => {
  const [apiAlerts, setApiAlerts] = useState([]);
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
  const alertQueue = useRef([]);
  const isMounted = useRef(true); // Combinar y validar alertas de API y personalizadas
  const allAlerts = React.useMemo(() => {
    // Combinamos alertas de la API y personalizadas
    const combinedAlerts = [
      ...apiAlerts,
      ...(Array.isArray(customAlerts) ? customAlerts : []),
    ];

    // Filtramos alertas vacías y solo mostramos las que no están completadas
    return combinedAlerts.filter(
      (alert) => alert && alert.message && alert.estado !== "completado"
    );
  }, [apiAlerts, customAlerts]);
  // Obtener alertas desde la API usando el servicio
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await getAlerts();

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
  }, [alertType]);
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
