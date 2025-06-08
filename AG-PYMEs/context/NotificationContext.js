import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
} from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import { Snackbar, Text, Portal, Button, Surface } from "react-native-paper";
import { useTheme } from "./ThemeContext";

// Definimos el contexto
const NotificationContext = createContext();

// Componente Banner personalizado
const NotificationBanner = ({
  visible,
  message,
  type = "info",
  action,
  onDismiss,
  duration = 4000,
  isPersistent = false,
  confirmAction = null,
  cancelAction = null,
}) => {
  const { themeObject } = useTheme();
  // Obtenemos dimensiones de la pantalla para cálculos de posición
  const windowHeight = Dimensions.get("window").height;

  const styles = StyleSheet.create({
    snackbar: {
      backgroundColor:
        type === "success"
          ? themeObject.colors.success || "#4CAF50"
          : type === "error"
            ? themeObject.colors.error || "#F44336"
            : type === "warning"
              ? themeObject.colors.warning || "#FF9800"
              : themeObject.colors.info || "#2196F3",
      position: "absolute",
      bottom: windowHeight * 0.07,
      left: 0,
      right: 0,
      margin: 8,
    },
    content: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    message: {
      color: "#FFFFFF",
      flex: 1,
    },
    actionButton: {
      color: "#FFFFFF",
      marginLeft: 8,
    },
    actionsContainer: {
      flexDirection: "row",
      justifyContent: "flex-end",
    },
  });
  // Si es una notificación de confirmación (con botones aceptar/cancelar)
  if (isPersistent && confirmAction && cancelAction) {
    return (
      <Portal>
        <Snackbar
          visible={visible}
          onDismiss={() => {}} // No permitimos descartar con tap fuera
          duration={Infinity} // Permanece hasta que el usuario interactúa
          style={styles.snackbar}
          wrapperStyle={{ position: "absolute" }} // Necesario para posicionar correctamente
        >
          <View style={styles.content}>
            <Text style={styles.message}>{message}</Text>
            <View style={styles.actionsContainer}>
              <Button
                onPress={() => {
                  cancelAction.onPress();
                  onDismiss();
                }}
                labelStyle={styles.actionButton}
              >
                {cancelAction.label}
              </Button>
              <Button
                onPress={() => {
                  confirmAction.onPress();
                  onDismiss();
                }}
                labelStyle={styles.actionButton}
              >
                {confirmAction.label}
              </Button>
            </View>
          </View>
        </Snackbar>
      </Portal>
    );
  }
  // Notificación estándar con un solo botón opcional
  return (
    <Portal>
      <Snackbar
        visible={visible}
        onDismiss={onDismiss}
        duration={isPersistent ? Infinity : duration}
        style={styles.snackbar}
        wrapperStyle={{ position: "absolute" }} // Necesario para posicionar correctamente
        action={
          action && {
            label: action.label,
            onPress: () => {
              action.onPress();
              onDismiss();
            },
            labelStyle: styles.actionButton,
          }
        }
      >
        <View style={styles.content}>
          <Text style={styles.message}>{message}</Text>
        </View>
      </Snackbar>
    </Portal>
  );
};

// Proveedor del contexto
export const NotificationProvider = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info"); // 'info', 'success', 'error', 'warning'
  const [action, setAction] = useState(null);
  const [duration, setDuration] = useState(4000); // Duración predeterminada
  const [isPersistent, setIsPersistent] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [cancelAction, setCancelAction] = useState(null);

  // Cola de notificaciones
  const notificationQueue = useRef([]);
  const isShowingNotification = useRef(false);
  // Mostrar la siguiente notificación en la cola
  const showNextNotification = useCallback(() => {
    if (
      notificationQueue.current.length > 0 &&
      !isShowingNotification.current
    ) {
      const nextNotification = notificationQueue.current.shift();

      setMessage(nextNotification.message);
      setType(nextNotification.type || "info");
      setAction(nextNotification.action || null);
      setDuration(nextNotification.duration || 4000);
      setIsPersistent(nextNotification.isPersistent || false);
      setConfirmAction(nextNotification.confirmAction || null);
      setCancelAction(nextNotification.cancelAction || null);

      isShowingNotification.current = true;
      setVisible(true);
    }
  }, []);

  // Ocultar la notificación actual
  const hideNotification = useCallback(() => {
    setVisible(false);
    isShowingNotification.current = false;

    // Pequeño retraso antes de mostrar la siguiente notificación
    setTimeout(() => {
      showNextNotification();
    }, 300);
  }, [showNextNotification]);

  // Agregar una notificación a la cola
  const enqueueNotification = useCallback(
    (notificationOptions) => {
      notificationQueue.current.push(notificationOptions);

      if (!isShowingNotification.current) {
        showNextNotification();
      }
    },
    [showNextNotification]
  );

  // API pública
  const showNotification = useCallback(
    (message, options = {}) => {
      enqueueNotification({
        message,
        type: options.type || "info",
        action: options.action,
        duration: options.duration || 4000,
      });
    },
    [enqueueNotification]
  );

  const showSuccess = useCallback(
    (message, options = {}) => {
      showNotification(message, { ...options, type: "success" });
    },
    [showNotification]
  );

  const showError = useCallback(
    (message, options = {}) => {
      showNotification(message, { ...options, type: "error" });
    },
    [showNotification]
  );

  const showWarning = useCallback(
    (message, options = {}) => {
      showNotification(message, { ...options, type: "warning" });
    },
    [showNotification]
  );
  const showConfirm = useCallback(
    (message, onConfirm, options = {}) => {
      showNotification(message, {
        ...options,
        type: options.type || "info",
        action: {
          label: options.confirmText || "Confirmar",
          onPress: onConfirm,
        },
      });
    },
    [showNotification]
  );

  // Nuevo método para mostrar notificación persistente con botones de aceptar/cancelar
  const showConfirmDeny = useCallback(
    (message, onConfirm, onCancel, options = {}) => {
      enqueueNotification({
        message,
        type: options.type || "info",
        isPersistent: true,
        confirmAction: {
          label: options.confirmText || "Aceptar",
          onPress: onConfirm,
        },
        cancelAction: {
          label: options.cancelText || "Cancelar",
          onPress: onCancel || (() => {}),
        },
        duration: Infinity, // Duración infinita hasta que el usuario interactúe
      });
    },
    [enqueueNotification]
  );

  // Método para mostrar notificación persistente
  const showPersistent = useCallback(
    (message, options = {}) => {
      enqueueNotification({
        message,
        type: options.type || "info",
        isPersistent: true,
        action: options.action,
        duration: Infinity,
      });
    },
    [enqueueNotification]
  );

  // Valor del contexto
  const contextValue = {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showConfirm,
    showConfirmDeny, // Nuevo método
    showPersistent, // Nuevo método
    hideNotification,
  };
  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationBanner
        visible={visible}
        message={message}
        type={type}
        action={action}
        onDismiss={hideNotification}
        duration={duration}
        isPersistent={isPersistent}
        confirmAction={confirmAction}
        cancelAction={cancelAction}
      />
    </NotificationContext.Provider>
  );
};

export default NotificationContext;

// Hook personalizado para usar el contexto de notificaciones
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};
