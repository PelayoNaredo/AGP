import React, { createContext, useContext, useState, useCallback } from "react";
import { Alert } from "react-native";

// Creamos el contexto
const NotificationContext = createContext();

// Tipos de notificación permitidos
export const NOTIFICATION_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
};

// Configuración por defecto para notificaciones
const DEFAULT_NOTIFICATION_CONFIG = {
  autoHide: true,
  duration: 4000, // 4 segundos
  position: "top", // top, bottom, center
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [nextId, setNextId] = useState(1);

  // Función para mostrar una notificación
  const showNotification = useCallback(
    (message, type = NOTIFICATION_TYPES.INFO, config = {}) => {
      const finalConfig = { ...DEFAULT_NOTIFICATION_CONFIG, ...config };
      const id = nextId;

      const notification = {
        id,
        message,
        type,
        timestamp: Date.now(),
        ...finalConfig,
      };

      setNotifications((prev) => [...prev, notification]);
      setNextId((prev) => prev + 1);

      // Auto-hide la notificación si está configurado
      if (finalConfig.autoHide) {
        setTimeout(() => {
          hideNotification(id);
        }, finalConfig.duration);
      }

      return id;
    },
    [nextId]
  );

  // Función para ocultar una notificación específica
  const hideNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  }, []);

  // Función para limpiar todas las notificaciones
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Funciones de conveniencia para diferentes tipos
  const showSuccess = useCallback(
    (message, config = {}) =>
      showNotification(message, NOTIFICATION_TYPES.SUCCESS, config),
    [showNotification]
  );

  const showError = useCallback(
    (message, config = {}) =>
      showNotification(message, NOTIFICATION_TYPES.ERROR, {
        ...config,
        duration: config.duration || 6000, // Los errores duran más tiempo
      }),
    [showNotification]
  );

  const showWarning = useCallback(
    (message, config = {}) =>
      showNotification(message, NOTIFICATION_TYPES.WARNING, config),
    [showNotification]
  );

  const showInfo = useCallback(
    (message, config = {}) =>
      showNotification(message, NOTIFICATION_TYPES.INFO, config),
    [showNotification]
  );

  // Función para mostrar alertas como snackbar (preferido sobre Alert nativo)
  const showAlert = useCallback(
    (title, message, config = {}) => {
      // Usar snackbar en lugar de Alert nativo para mejor UX
      const fullMessage = title ? `${title}: ${message}` : message;
      return showNotification(fullMessage, NOTIFICATION_TYPES.INFO, {
        duration: 5000, // Un poco más de tiempo para leer
        ...config,
      });
    },
    [showNotification]
  );

  // Función para alertas nativas críticas (solo cuando sea absolutamente necesario)
  const showNativeAlert = useCallback(
    (title, message, buttons = [{ text: "OK" }]) => {
      Alert.alert(title, message, buttons);
    },
    []
  );

  // Función para confirmar acciones importantes
  const showConfirmation = useCallback(
    (title, message, onConfirm, onCancel) => {
      Alert.alert(
        title,
        message,
        [
          {
            text: "Cancelar",
            style: "cancel",
            onPress: onCancel,
          },
          {
            text: "Confirmar",
            style: "default",
            onPress: onConfirm,
          },
        ],
        { cancelable: false }
      );
    },
    []
  );

  // Versión mejorada de confirmación con snackbar para casos simples
  const showConfirmDialog = useCallback(
    (
      title,
      message,
      onConfirm,
      onCancel = () => {},
      confirmText = "Confirmar",
      cancelText = "Cancelar",
      critical = false // Si es crítico, usar Alert nativo
    ) => {
      if (critical) {
        // Para acciones críticas (eliminar, cerrar, etc.), usar Alert nativo
        Alert.alert(
          title,
          message,
          [
            {
              text: cancelText,
              style: "cancel",
              onPress: onCancel,
            },
            {
              text: confirmText,
              style: "destructive",
              onPress: onConfirm,
            },
          ],
          { cancelable: false }
        );
      } else {
        // Para confirmaciones simples, usar snackbar con acciones
        const id = showNotification(
          `${title}: ${message}`,
          NOTIFICATION_TYPES.WARNING,
          {
            duration: 8000, // Más tiempo para que el usuario pueda decidir
            autoHide: false, // No ocultar automáticamente
            actions: [
              {
                text: cancelText,
                onPress: () => {
                  hideNotification(id);
                  onCancel();
                },
              },
              {
                text: confirmText,
                onPress: () => {
                  hideNotification(id);
                  onConfirm();
                },
                style: "primary",
              },
            ],
          }
        );
      }
    },
    [showNotification, hideNotification]
  );

  // Función para mostrar alertas de error con opción de reintentar
  const showErrorWithRetry = useCallback(
    (message, onRetry, retryText = "Reintentar") => {
      Alert.alert(
        "Error",
        message,
        [
          { text: "Cancelar", style: "cancel" },
          { text: retryText, onPress: onRetry },
        ],
        { cancelable: false }
      );
    },
    []
  );

  const value = {
    // Estado
    notifications,

    // Funciones principales
    showNotification,
    hideNotification,
    clearAllNotifications,

    // Funciones de conveniencia (snackbars)
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showAlert, // Ahora usa snackbar por defecto

    // Confirmaciones inteligentes
    showConfirmDialog, // Usa snackbar o Alert según criticidad
    showConfirmation, // Mantener para compatibilidad (usa Alert)

    // Alertas nativas (solo para casos críticos)
    showNativeAlert,
    showErrorWithRetry,

    // Constantes
    NOTIFICATION_TYPES,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook personalizado para usar las notificaciones
export const useNotifications = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotifications debe ser usado dentro de un NotificationProvider"
    );
  }

  return context;
};

// Hook especializado para manejo de errores de API
export const useApiNotifications = () => {
  const { showError, showSuccess, showWarning } = useNotifications();

  const handleApiError = useCallback(
    (error, customMessage = null) => {
      let message = customMessage || "Ha ocurrido un error inesperado";

      if (error?.response?.data?.message) {
        message = error.response.data.message;
      } else if (error?.message) {
        message = error.message;
      }

      showError(message);
    },
    [showError]
  );

  const handleApiSuccess = useCallback(
    (message = "Operación completada exitosamente") => {
      showSuccess(message);
    },
    [showSuccess]
  );

  const handleApiWarning = useCallback(
    (message) => {
      showWarning(message);
    },
    [showWarning]
  );

  return {
    handleApiError,
    handleApiSuccess,
    handleApiWarning,
  };
};

export default NotificationContext;
