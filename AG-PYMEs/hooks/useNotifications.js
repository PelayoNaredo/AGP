import { useCallback } from "react";
import { useNotifications as useGlobalNotification } from "../context/NotificationContext";

//Hook personalizado para gestionar notificaciones y mensajes al usuario
const useNotifications = () => {
  const notification = useGlobalNotification();
  //Muestra un mensaje en el snackbar
  const showSnackbar = useCallback(
    (message, type = "info", duration = 3000) => {
      notification.showNotification(message, type, { duration });
    },
    [notification]
  );

  //Oculta el snackbar
  const hideSnackbar = useCallback(() => {
    notification.clearAllNotifications();
  }, [notification]);

  //Muestra una alerta de confirmación (snackbar para casos simples, Alert para críticos)
  const showConfirmDialog = useCallback(
    (
      title,
      message,
      onConfirm,
      onCancel = () => {},
      confirmText = "Confirmar",
      cancelText = "Cancelar",
      critical = false // Pasar true para acciones destructivas como eliminar
    ) => {
      notification.showConfirmDialog(
        title,
        message,
        onConfirm,
        onCancel,
        confirmText,
        cancelText,
        critical
      );
    },
    [notification]
  );

  //Muestra un mensaje de error
  const showError = useCallback(
    (title, message, onPress = () => {}) => {
      notification.showError(`${title}: ${message}`);
    },
    [notification]
  );

  //Muestra una notificación de éxito
  const showSuccess = useCallback(
    (message) => {
      notification.showSuccess(message);
    },
    [notification]
  );

  //Muestra una notificación de error
  const showErrorNotification = useCallback(
    (message) => {
      notification.showError(message);
    },
    [notification]
  );

  // Funciones de conveniencia para confirmaciones específicas
  const showDeleteConfirm = useCallback(
    (itemName, onConfirm, onCancel = () => {}) => {
      showConfirmDialog(
        "Confirmar eliminación",
        `¿Estás seguro de que deseas eliminar "${itemName}"? Esta acción no se puede deshacer.`,
        onConfirm,
        onCancel,
        "Eliminar",
        "Cancelar",
        true // Crítico = true para usar Alert nativo
      );
    },
    [showConfirmDialog]
  );

  const showSimpleConfirm = useCallback(
    (title, message, onConfirm, onCancel = () => {}) => {
      showConfirmDialog(
        title,
        message,
        onConfirm,
        onCancel,
        "Confirmar",
        "Cancelar",
        false // No crítico = usar snackbar
      );
    },
    [showConfirmDialog]
  );

  return {
    // Funciones principales de snackbar
    showSnackbar,
    hideSnackbar,
    showError,
    showSuccess,
    showErrorNotification,

    // Confirmaciones inteligentes
    showConfirmDialog, // Usa snackbar o Alert según criticidad
    showDeleteConfirm, // Para eliminaciones (usa Alert crítico)
    showSimpleConfirm, // Para confirmaciones simples (usa snackbar)

    // Métodos disponibles del sistema global
    showWarning: notification.showWarning,
    showInfo: notification.showInfo,
    showAlert: notification.showAlert, // Ahora usa snackbar por defecto
    showConfirmation: notification.showConfirmation, // Alert nativo tradicional
    showErrorWithRetry: notification.showErrorWithRetry,
    showNativeAlert: notification.showNativeAlert, // Para casos críticos
  };
};

export default useNotifications;
