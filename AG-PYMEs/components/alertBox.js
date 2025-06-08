import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "../context/ThemeContext";
import { hexToRgb } from "../utils/helpers";

const AlertBox = ({
  message,
  type = "info",
  priority = "normal",
  estado = "pendiente",
  style,
}) => {
  const { themeObject } = useTheme();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-20);
  const scale = useSharedValue(0.95);

  // Configuración de iconos y colores basada en el tipo de alerta
  const iconConfig = {
    // Tipos estándar
    success: {
      name: "checkmark-circle",
      color: themeObject?.colors?.success || "#16A34A",
    },
    warning: {
      name: "warning",
      color: themeObject?.colors?.warning || "#F59E0B",
    },
    error: {
      name: "close-circle",
      color: themeObject?.colors?.error || "#DC2626",
    },
    info: {
      name: "information-circle",
      color: themeObject?.colors?.info || "#2563EB",
    },

    // Tipos de negocio específicos
    inventario: { name: "cube", color: "#9333EA" },
    pago: { name: "cash", color: "#047857" },
    horario: { name: "time", color: "#0284C7" },
    pedido: { name: "cart", color: "#9F1239" },
    empleado: { name: "people", color: "#9A3412" },
    mantenimiento: { name: "construct", color: "#854D0E" },
    todos: { name: "apps", color: themeObject?.colors?.accent || "#0D9488" },
  };
  // Asegurar que siempre tengamos una configuración válida, incluso para tipos desconocidos
  const { name: iconName, color: iconColor } =
    iconConfig[type] || iconConfig.info; // Obtener el fondo con opacidad basado en el color del icono
  const getBgColor = () => {
    return `rgba(${hexToRgb(iconColor)}, 0.12)`; // Fondo muy sutil
  };
  // Función para obtener el estilo de la barra de prioridad
  const getPriorityStyle = () => {
    const priorityConfig = {
      alta: {
        width: 4,
        color: themeObject.colors.error, // Rojo para alta prioridad
        opacity: 1,
      },
      media: {
        width: 4,
        color: themeObject.colors.warning, // Naranja para prioridad media
        opacity: 0.9,
      },
      baja: {
        width: 4,
        color: themeObject.colors.info, // Gris para baja prioridad
        opacity: 0.5,
      },
    };

    return priorityConfig[priority] || priorityConfig.normal;
  };

  // Función para obtener el estilo según el estado
  const getEstadoStyle = () => {
    const estadoConfig = {
      pendiente: {
        icon: "time-outline",
        color: themeObject.colors.info, // Azul para pendiente
        text: "Pendiente",
      },
      completado: {
        icon: "checkmark-done-outline",
        color: themeObject.colors.success, // Verde para completado
        text: "Completado",
      },
    };

    return estadoConfig[estado] || estadoConfig.pendiente;
  };

  React.useEffect(() => {
    // Reiniciamos los valores antes de animar
    opacity.value = 0;
    translateY.value = -20;
    scale.value = 0.95;

    // Iniciamos la animación después de un pequeño retraso
    setTimeout(() => {
      opacity.value = withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.ease),
      });
      translateY.value = withTiming(0, {
        duration: 400,
        easing: Easing.out(Easing.ease),
      });
      scale.value = withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.ease),
      });
    }, 50);

    return () => {
      // Animación de salida cuando se desmonta el componente
      opacity.value = withTiming(0, { duration: 250 });
      translateY.value = withTiming(-20, { duration: 250 });
      scale.value = withTiming(0.95, { duration: 250 });
    };
  }, [message, type]);
  const animatedStyles = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  })); // Componente para renderizar
  const AlertContent = () => {
    const priorityStyle = getPriorityStyle();
    const estadoStyle = getEstadoStyle();

    return (
      <>
        <View
          style={[
            styles.priorityIndicator,
            {
              backgroundColor: priorityStyle.color,
              width: priorityStyle.width,
              opacity: priorityStyle.opacity,
            },
          ]}
        />
        <View style={[styles.iconContainer, { backgroundColor: getBgColor() }]}>
          <Ionicons name={iconName} size={22} color={iconColor} />
        </View>
        <View style={styles.contentContainer}>
          <Text
            style={[
              styles.message,
              { color: themeObject?.colors?.text || "#333" },
            ]}
            numberOfLines={2}
          >
            {message}
          </Text>
          <View style={styles.estadoContainer}>
            <Ionicons
              name={estadoStyle.icon}
              size={14}
              color={estadoStyle.color}
              style={styles.estadoIcon}
            />
            <Text style={[styles.estadoText, { color: estadoStyle.color }]}>
              {estadoStyle.text}
            </Text>
          </View>
        </View>
      </>
    );
  };

  // Si tiene onPress, lo envolvemos en un TouchableOpacity
  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: themeObject?.colors?.card || "#FFF",
          shadowColor: iconColor,
        },
        animatedStyles,
        style,
      ]}
    >
      <AlertContent />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#fff",
    marginVertical: 6,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: "hidden",
  },
  priorityIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  contentContainer: {
    flex: 1,
  },
  message: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500",
    letterSpacing: 0.1,
  },
  estadoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  estadoIcon: {
    marginRight: 4,
  },
  estadoText: {
    fontSize: 12,
    fontWeight: "500",
  },
});

export default AlertBox;
