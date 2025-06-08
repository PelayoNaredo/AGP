import { useNotification as useGlobalNotification } from "../../context/NotificationContext";

/**
 * Hook personalizado para manejar notificaciones usando el contexto global de notificaciones
 * Este hook mantiene compatibilidad con el hook anterior para evitar romper código existente,
 * pero ahora utiliza el sistema global de notificaciones
 */
const useNotification = () => {
  const globalNotification = useGlobalNotification();

  // Muestra una notificación tipo snackbar
  const showNotification = (message, type = "info") => {
    globalNotification.showNotification(message, { type });
  };

  // Muestra una notificación de éxito
  const showSuccess = (message) => {
    globalNotification.showSuccess(message);
  };

  // Muestra una notificación de error
  const showError = (title, message) => {
    if (title && message) {
      globalNotification.showError(`${title}: ${message}`);
    } else {
      globalNotification.showError(title || message);
    }
  };

  // Muestra una notificación de error (mantiene compatibilidad)
  const showErrorNotification = (message) => {
    globalNotification.showError(message);
  };

  // Oculta la notificación snackbar
  const hideSnackbar = () => {
    globalNotification.hideNotification();
  };
  // Para mantener compatibilidad con el código existente
  return {
    snackbarVisible: true, // Este valor no se usa ya que ahora lo maneja el contexto global
    snackbarMessage: "", // Este valor no se usa ya que ahora lo maneja el contexto global
    snackbarType: "info", // Este valor no se usa ya que ahora lo maneja el contexto global
    showNotification,
    showSuccess,
    showError,
    showErrorNotification,
    hideSnackbar,

    // Nuevos métodos del sistema global
    showWarning: globalNotification.showWarning,
    showConfirm: globalNotification.showConfirm,
    showConfirmDeny: globalNotification.showConfirmDeny,
    showPersistent: globalNotification.showPersistent,
  };
};

export default useNotification;
