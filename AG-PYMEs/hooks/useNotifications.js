import { useState, useCallback } from "react";
import { Alert } from "react-native";

/**
 * Hook personalizado para gestionar notificaciones y mensajes al usuario
 * @returns {Object} - Funciones para mostrar distintos tipos de notificaciones
 */
const useNotifications = () => {
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarType, setSnackbarType] = useState("info"); // info, success, error, warning

  /**
   * Muestra un mensaje en el snackbar
   * @param {string} message - Mensaje a mostrar
   * @param {string} type - Tipo de mensaje (info, success, error, warning)
   * @param {number} duration - Duración del mensaje en milisegundos
   */
  const showSnackbar = useCallback(
    (message, type = "info", duration = 3000) => {
      setSnackbarMessage(message);
      setSnackbarType(type);
      setSnackbarVisible(true);

      // Auto-ocultar después de la duración especificada
      if (duration > 0) {
        setTimeout(() => {
          setSnackbarVisible(false);
        }, duration);
      }
    },
    []
  );

  /**
   * Oculta el snackbar
   */
  const hideSnackbar = useCallback(() => {
    setSnackbarVisible(false);
  }, []);

  /**
   * Muestra una alerta de confirmación
   * @param {string} title - Título de la alerta
   * @param {string} message - Mensaje de la alerta
   * @param {Function} onConfirm - Función a ejecutar al confirmar
   * @param {Function} onCancel - Función a ejecutar al cancelar
   * @param {string} confirmText - Texto del botón de confirmación
   * @param {string} cancelText - Texto del botón de cancelación
   */
  const showConfirmDialog = useCallback(
    (
      title,
      message,
      onConfirm,
      onCancel = () => {},
      confirmText = "Confirmar",
      cancelText = "Cancelar"
    ) => {
      Alert.alert(
        title,
        message,
        [
          {
            text: cancelText,
            onPress: onCancel,
            style: "cancel",
          },
          {
            text: confirmText,
            onPress: onConfirm,
          },
        ],
        { cancelable: false }
      );
    },
    []
  );

  /**
   * Muestra un mensaje de error
   * @param {string} title - Título del error
   * @param {string} message - Mensaje del error
   * @param {Function} onPress - Función a ejecutar al presionar OK
   */
  const showError = useCallback((title, message, onPress = () => {}) => {
    Alert.alert(title, message, [{ text: "OK", onPress }], {
      cancelable: false,
    });
  }, []);

  /**
   * Muestra una notificación de éxito
   * @param {string} message - Mensaje de éxito
   */
  const showSuccess = useCallback(
    (message) => {
      showSnackbar(message, "success");
    },
    [showSnackbar]
  );

  /**
   * Muestra una notificación de error
   * @param {string} message - Mensaje de error
   */
  const showErrorNotification = useCallback(
    (message) => {
      showSnackbar(message, "error");
    },
    [showSnackbar]
  );

  return {
    snackbarVisible,
    snackbarMessage,
    snackbarType,
    showSnackbar,
    hideSnackbar,
    showConfirmDialog,
    showError,
    showSuccess,
    showErrorNotification,
  };
};

export default useNotifications;
