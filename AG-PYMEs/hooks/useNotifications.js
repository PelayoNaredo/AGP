import { useCallback } from "react";
import { useNotification as useGlobalNotification } from "../context/NotificationContext";

//Hook personalizado para gestionar notificaciones y mensajes al usuario
const useNotifications = () => {
  const notification = useGlobalNotification();
  //Muestra un mensaje en el snackbar
  const showSnackbar = useCallback(
    (message, type = "info", duration = 3000) => {
      notification.showNotification(message, { type, duration });
    },
    [notification]
  );

  //Oculta el snackbar
  const hideSnackbar = useCallback(() => {
    notification.hideNotification();
  }, [notification]);

  //Muestra una alerta de confirmación
  const showConfirmDialog = useCallback(
    (
      title,
      message,
      onConfirm,
      onCancel = () => {},
      confirmText = "Confirmar",
      cancelText = "Cancelar"
    ) => {
      // Ahora usamos el nuevo sistema de notificaciones con soporte para confirmar/cancelar
      notification.showConfirmDeny(
        `${title}: ${message}`,
        onConfirm,
        onCancel,
        {
          confirmText,
          cancelText,
        }
      );
    },
    [notification]
  );

  //Muestra un mensaje de error
  const showError = useCallback(
    (title, message, onPress = () => {}) => {
      notification.showError(`${title}: ${message}`);
      // No es posible manejar el onPress con el sistema actual de notificaciones
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

  return {
    showSnackbar,
    hideSnackbar,
    showConfirmDialog,
    showError,
    showSuccess,
    showErrorNotification,

    // Nuevos métodos del sistema global
    showWarning: notification.showWarning,
    showPersistent: notification.showPersistent,
    showConfirmDeny: notification.showConfirmDeny,
  };
};

export default useNotifications;
