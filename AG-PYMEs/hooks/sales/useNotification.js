import { useState } from "react";

//Hook personalizado para manejar notificaciones mediante snackbar
const useNotification = () => {
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarType, setSnackbarType] = useState("info"); // 'info', 'success', 'error'

  //Muestra una notificación tipo snackbar
  const showNotification = (message, type = "info") => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  //Muestra una notificación de éxito
  const showSuccess = (message) => {
    showNotification(message, "success");
  };

  // Muestra una notificación de error
  const showError = (title, message) => {
    if (title && message) {
      showNotification(`${title}: ${message}`, "error");
    } else {
      showNotification(title || message, "error");
    }
  };

  //Muestra una notificación de error
  const showErrorNotification = (message) => {
    showNotification(message, "error");
  };

  //Oculta la notificación snackbar
  const hideSnackbar = () => {
    setSnackbarVisible(false);
  };

  return {
    snackbarVisible,
    snackbarMessage,
    snackbarType,
    showNotification,
    showSuccess,
    showError,
    showErrorNotification,
    hideSnackbar,
  };
};

export default useNotification;
