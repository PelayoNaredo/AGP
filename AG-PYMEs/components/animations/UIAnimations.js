// UIAnimations.js - Animaciones de interfaz de usuario (Feedback y Progress)
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  PanGestureHandler,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  runOnJS,
  interpolate,
  interpolateColor,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ===== FEEDBACK ANIMATION =====
/**
 * Componente para mostrar notificaciones animadas de feedback
 * Proporciona animaciones fluidas para estados de éxito, error, warning e info
 *
 * @param {Object} props
 * @param {boolean} props.visible - Visibilidad de la notificación
 * @param {string} props.type - Tipo de notificación ('success', 'error', 'warning', 'info')
 * @param {string} props.title - Título de la notificación
 * @param {string} props.message - Mensaje de la notificación
 * @param {number} props.duration - Duración en ms antes de auto-ocultar (default: 3000)
 * @param {Function} props.onHide - Función llamada al ocultar la notificación
 * @param {string} props.position - Posición ('top', 'bottom', 'center')
 * @param {boolean} props.enableSwipeToClose - Habilitar cerrar con swipe (default: true)
 */
export const FeedbackAnimation = ({
  visible,
  type = "info",
  title,
  message,
  duration = 3000,
  onHide,
  position = "top",
  enableSwipeToClose = true,
  ...props
}) => {
  const { themeObject } = useTheme();
  const timeoutRef = useRef(null);

  // Valores compartidos para animaciones
  const translateY = useSharedValue(position === "bottom" ? 100 : -100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const progress = useSharedValue(0);
  const gestureTranslateX = useSharedValue(0);

  // Configuración de colores según el tipo
  const typeConfig = {
    success: {
      backgroundColor: themeObject.colors.success || "#4CAF50",
      icon: "checkmark-circle",
      textColor: "#FFFFFF",
    },
    error: {
      backgroundColor: themeObject.colors.error || "#F44336",
      icon: "close-circle",
      textColor: "#FFFFFF",
    },
    warning: {
      backgroundColor: themeObject.colors.warning || "#FF9800",
      icon: "warning",
      textColor: "#FFFFFF",
    },
    info: {
      backgroundColor: themeObject.colors.info || "#2196F3",
      icon: "information-circle",
      textColor: "#FFFFFF",
    },
  };

  const config = typeConfig[type] || typeConfig.info;

  // Función para ocultar la notificación
  const hideNotification = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    translateY.value = withTiming(position === "bottom" ? 100 : -100, {
      duration: 300,
    });
    opacity.value = withTiming(0, { duration: 300 });
    scale.value = withTiming(0.8, { duration: 300 });

    setTimeout(() => {
      if (onHide) onHide();
    }, 300);
  };

  // Efectos de visibilidad
  useEffect(() => {
    if (visible) {
      // Mostrar notificación
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
      });
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1, {
        damping: 12,
        stiffness: 200,
      });

      // Animación de progreso
      if (duration > 0) {
        progress.value = withTiming(1, { duration: duration });

        // Auto-ocultar
        timeoutRef.current = setTimeout(() => {
          hideNotification();
        }, duration);
      }
    } else {
      hideNotification();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible]);

  // Gestión de gestos para swipe to close
  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      gestureTranslateX.value = 0;
    },
    onActive: (event) => {
      if (enableSwipeToClose) {
        gestureTranslateX.value = event.translationX;
      }
    },
    onEnd: (event) => {
      if (enableSwipeToClose) {
        if (Math.abs(event.translationX) > SCREEN_WIDTH * 0.3) {
          gestureTranslateX.value = withTiming(
            event.translationX > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH,
            { duration: 200 }
          );
          runOnJS(hideNotification)();
        } else {
          gestureTranslateX.value = withSpring(0);
        }
      }
    },
  });

  // Estilos animados
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: gestureTranslateX.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      Math.abs(gestureTranslateX.value),
      [0, SCREEN_WIDTH * 0.2],
      [0, 5]
    );

    return {
      transform: [
        { rotate: `${gestureTranslateX.value > 0 ? rotate : -rotate}deg` },
      ],
    };
  });

  if (!visible) return null;

  const NotificationContent = () => (
    <Animated.View
      style={[
        feedbackStyles.container,
        { backgroundColor: config.backgroundColor },
        position === "center" && feedbackStyles.centerPosition,
        containerAnimatedStyle,
      ]}
    >
      <Animated.View style={[feedbackStyles.content, contentAnimatedStyle]}>
        <View style={feedbackStyles.iconContainer}>
          <Ionicons name={config.icon} size={24} color={config.textColor} />
        </View>

        <View style={feedbackStyles.textContainer}>
          {title && (
            <Text style={[feedbackStyles.title, { color: config.textColor }]}>
              {title}
            </Text>
          )}
          {message && (
            <Text style={[feedbackStyles.message, { color: config.textColor }]}>
              {message}
            </Text>
          )}
        </View>
      </Animated.View>

      {duration > 0 && (
        <Animated.View
          style={[
            feedbackStyles.progressBar,
            progressAnimatedStyle,
            { backgroundColor: "rgba(255, 255, 255, 0.3)" },
          ]}
        />
      )}
    </Animated.View>
  );

  if (enableSwipeToClose) {
    return (
      <View
        style={[
          feedbackStyles.wrapper,
          position === "top" && feedbackStyles.topPosition,
          position === "bottom" && feedbackStyles.bottomPosition,
          position === "center" && feedbackStyles.centerWrapper,
        ]}
      >
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View>
            <NotificationContent />
          </Animated.View>
        </PanGestureHandler>
      </View>
    );
  }

  return (
    <View
      style={[
        feedbackStyles.wrapper,
        position === "top" && feedbackStyles.topPosition,
        position === "bottom" && feedbackStyles.bottomPosition,
        position === "center" && feedbackStyles.centerWrapper,
      ]}
    >
      <NotificationContent />
    </View>
  );
};

// ===== PROGRESS ANIMATION =====
/**
 * Componente para mostrar animaciones de progreso durante operaciones largas
 * Proporciona diferentes tipos de indicadores de progreso animados
 *
 * @param {Object} props
 * @param {boolean} props.visible - Visibilidad del indicador
 * @param {number} props.progress - Progreso actual (0-1) para barra de progreso
 * @param {string} props.type - Tipo de animación ('circular', 'linear', 'dots', 'pulse')
 * @param {string} props.title - Título opcional
 * @param {string} props.message - Mensaje opcional
 * @param {string} props.color - Color principal de la animación
 * @param {number} props.size - Tamaño del indicador
 * @param {boolean} props.overlay - Mostrar como overlay de pantalla completa
 */
export const ProgressAnimation = ({
  visible,
  progress = 0,
  type = "circular",
  title,
  message,
  color,
  size = 40,
  overlay = false,
  duration = 1000,
  ...props
}) => {
  const { themeObject } = useTheme();

  // Color por defecto basado en el tema
  const defaultColor = color || themeObject.colors.primary || "#2196F3";

  // Valores compartidos para animaciones
  const animationProgress = useSharedValue(0);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  // Efectos de visibilidad y animación
  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });

      if (type === "circular" || type === "pulse") {
        rotation.value = withRepeat(
          withTiming(360, { duration, easing: Easing.linear }),
          -1,
          false
        );
      }

      if (type === "dots") {
        animationProgress.value = withRepeat(
          withSequence(
            withTiming(1, { duration: duration / 2 }),
            withTiming(0, { duration: duration / 2 })
          ),
          -1,
          false
        );
      }

      if (type === "pulse") {
        animationProgress.value = withRepeat(
          withSequence(
            withTiming(1, { duration: duration / 2 }),
            withTiming(0, { duration: duration / 2 })
          ),
          -1,
          false
        );
      }
    } else {
      opacity.value = withTiming(0, { duration: 300 });
      scale.value = withTiming(0.8, { duration: 300 });
    }
  }, [visible, type, duration]);

  // Actualizar progreso para barra lineal
  useEffect(() => {
    if (type === "linear" && visible) {
      animationProgress.value = withSpring(progress, {
        damping: 15,
        stiffness: 150,
      });
    }
  }, [progress, visible, type]);

  // Estilos animados para el contenedor
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  // Estilos específicos por tipo
  const getAnimatedComponent = () => {
    switch (type) {
      case "circular":
        return (
          <Animated.View
            style={[
              progressStyles.circularContainer,
              {
                width: size,
                height: size,
                borderColor: defaultColor,
                transform: [{ rotate: `${rotation.value}deg` }],
              },
              useAnimatedStyle(() => ({
                transform: [{ rotate: `${rotation.value}deg` }],
              })),
            ]}
          />
        );

      case "linear":
        return (
          <View style={[progressStyles.linearContainer, { width: size * 3 }]}>
            <Animated.View
              style={[
                progressStyles.linearProgress,
                {
                  backgroundColor: defaultColor,
                  width: `${animationProgress.value * 100}%`,
                },
                useAnimatedStyle(() => ({
                  width: `${animationProgress.value * 100}%`,
                })),
              ]}
            />
          </View>
        );

      case "dots":
        return (
          <View style={progressStyles.dotsContainer}>
            {[0, 1, 2].map((index) => (
              <Animated.View
                key={index}
                style={[
                  progressStyles.dot,
                  {
                    backgroundColor: defaultColor,
                    width: size / 4,
                    height: size / 4,
                  },
                  useAnimatedStyle(() => {
                    const delay = index * 0.2;
                    const animValue = (animationProgress.value + delay) % 1;
                    return {
                      transform: [
                        {
                          scale: interpolate(
                            animValue,
                            [0, 0.5, 1],
                            [0.8, 1.2, 0.8]
                          ),
                        },
                      ],
                      opacity: interpolate(
                        animValue,
                        [0, 0.5, 1],
                        [0.4, 1, 0.4]
                      ),
                    };
                  }),
                ]}
              />
            ))}
          </View>
        );

      case "pulse":
        return (
          <Animated.View
            style={[
              progressStyles.pulseContainer,
              {
                width: size,
                height: size,
                backgroundColor: defaultColor,
              },
              useAnimatedStyle(() => ({
                transform: [
                  {
                    scale: interpolate(
                      animationProgress.value,
                      [0, 1],
                      [0.8, 1.2]
                    ),
                  },
                ],
                opacity: interpolate(animationProgress.value, [0, 1], [0.6, 1]),
              })),
            ]}
          />
        );

      default:
        return null;
    }
  };

  if (!visible) return null;

  const content = (
    <Animated.View style={[progressStyles.container, containerAnimatedStyle]}>
      {getAnimatedComponent()}

      {title && (
        <Text
          style={[progressStyles.title, { color: themeObject.colors.text }]}
        >
          {title}
        </Text>
      )}

      {message && (
        <Text
          style={[
            progressStyles.message,
            { color: themeObject.colors.textSecondary },
          ]}
        >
          {message}
        </Text>
      )}
    </Animated.View>
  );

  if (overlay) {
    return <View style={progressStyles.overlay}>{content}</View>;
  }

  return content;
};

// ===== ESTILOS =====
const feedbackStyles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  topPosition: {
    top: 50,
  },
  bottomPosition: {
    bottom: 50,
  },
  centerWrapper: {
    top: "50%",
    marginTop: -50,
  },
  centerPosition: {
    alignSelf: "center",
  },
  container: {
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: "hidden",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  progressBar: {
    height: 3,
    position: "absolute",
    bottom: 0,
    left: 0,
  },
});

const progressStyles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  container: {
    alignItems: "center",
    padding: 20,
  },
  circularContainer: {
    borderWidth: 3,
    borderTopColor: "transparent",
    borderRadius: 50,
  },
  linearContainer: {
    height: 4,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  linearProgress: {
    height: "100%",
    borderRadius: 2,
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    borderRadius: 50,
    marginHorizontal: 4,
  },
  pulseContainer: {
    borderRadius: 50,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
});
