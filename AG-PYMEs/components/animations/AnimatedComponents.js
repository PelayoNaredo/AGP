// AnimatedComponents.js - Componentes animados consolidados
import React, { useState, useEffect } from "react";
import {
  Pressable,
  View,
  Text,
  StyleSheet,
  Modal,
  Dimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  runOnJS,
  interpolate,
  interpolateColor,
  Extrapolate,
  FadeIn,
  FadeOut,
  FadeInDown,
  SlideInDown,
  SlideOutDown,
  SlideOutRight,
  ZoomIn,
  ZoomOut,
  Layout,
} from "react-native-reanimated";
import { PanGestureHandler } from "react-native-gesture-handler";
import { useTheme } from "../../context/ThemeContext";
import { TIMING_CONFIGS } from "./enhancedAnimations";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ===== ANIMATED CARD =====
/**
 * Componente de tarjeta animada reutilizable
 * Proporciona animaciones de entrada, salida, hover y press
 */
export const AnimatedCard = ({
  children,
  onPress,
  onLongPress,
  index = 0,
  delay = 0,
  style,
  enablePressAnimation = true,
  enableHoverAnimation = true,
  enableStagger = true,
  variant = "default",
  elevation = 4,
  pressScale = 0.95,
  hoverScale = 1.02,
  disabled = false,
  ...props
}) => {
  const { themeObject } = useTheme();
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Valores compartidos para animaciones
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const shadowOpacity = useSharedValue(0.1);

  // Configuraciones de variantes
  const variants = {
    default: {
      backgroundColor: themeObject.colors.surface || "#FFFFFF",
      borderColor: themeObject.colors.border || "#E0E0E0",
      borderWidth: 1,
    },
    elevated: {
      backgroundColor: themeObject.colors.surface || "#FFFFFF",
      elevation: elevation,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    outlined: {
      backgroundColor: "transparent",
      borderColor: themeObject.colors.primary || "#007AFF",
      borderWidth: 2,
    },
  };

  const variantStyle = variants[variant] || variants.default;

  // Gestión de eventos de presión
  const handlePressIn = () => {
    if (!disabled && enablePressAnimation) {
      setIsPressed(true);
      scale.value = withSpring(pressScale, TIMING_CONFIGS.spring.quickSpring);
      opacity.value = withTiming(0.8, { duration: 150 });
      translateY.value = withTiming(2, { duration: 150 });
    }
  };

  const handlePressOut = () => {
    if (!disabled && enablePressAnimation) {
      setIsPressed(false);
      scale.value = withSpring(1, TIMING_CONFIGS.spring.softSpring);
      opacity.value = withTiming(1, { duration: 150 });
      translateY.value = withTiming(0, { duration: 150 });
    }
  };

  const handleHoverIn = () => {
    if (!disabled && enableHoverAnimation) {
      setIsHovered(true);
      scale.value = withSpring(hoverScale, TIMING_CONFIGS.spring.softSpring);
      shadowOpacity.value = withTiming(0.15, { duration: 200 });
    }
  };

  const handleHoverOut = () => {
    if (!disabled && enableHoverAnimation) {
      setIsHovered(false);
      scale.value = withSpring(1, TIMING_CONFIGS.spring.softSpring);
      shadowOpacity.value = withTiming(0.1, { duration: 200 });
    }
  };

  // Estilos animados
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
    shadowOpacity: shadowOpacity.value,
  }));

  // Configuración de retraso para animación escalonada
  const staggerDelay = enableStagger ? index * 100 + delay : delay;

  return (
    <Animated.View
      entering={FadeInDown.delay(staggerDelay).duration(300).springify()}
      exiting={SlideOutRight.duration(200)}
      layout={Layout.springify()}
    >
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}
        style={[cardStyles.container, variantStyle, animatedStyle, style]}
        {...props}
      >
        {children}
      </AnimatedPressable>
    </Animated.View>
  );
};

// ===== ANIMATED BUTTON =====
/**
 * Botón animado mejorado con diferentes variantes y efectos
 */
export const AnimatedButton = ({
  children,
  onPress,
  style,
  disabled = false,
  variant = "primary",
  size = "medium",
  hapticFeedback = true,
  pressScale = 0.95,
  pressOpacity = 0.8,
  theme,
  ...props
}) => {
  const { themeObject } = useTheme();
  const currentTheme = theme || themeObject;

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const backgroundColor = useSharedValue(0);

  // Configuraciones de variantes
  const variants = {
    primary: {
      backgroundColor: currentTheme?.colors?.primary || "#007AFF",
      pressColor: currentTheme?.colors?.primaryDark || "#0051D5",
    },
    secondary: {
      backgroundColor: currentTheme?.colors?.secondary || "#6C757D",
      pressColor: currentTheme?.colors?.secondaryDark || "#545B62",
    },
    success: {
      backgroundColor: currentTheme?.colors?.success || "#28A745",
      pressColor: currentTheme?.colors?.successDark || "#1E7E34",
    },
    danger: {
      backgroundColor: currentTheme?.colors?.danger || "#DC3545",
      pressColor: currentTheme?.colors?.dangerDark || "#C82333",
    },
    ghost: {
      backgroundColor: "transparent",
      pressColor: currentTheme?.colors?.primary || "#007AFF",
    },
    outline: {
      backgroundColor: "transparent",
      pressColor: currentTheme?.colors?.primary || "#007AFF",
      borderColor: currentTheme?.colors?.primary || "#007AFF",
      borderWidth: 2,
    },
  };

  // Configuraciones de tamaños
  const sizes = {
    small: { paddingHorizontal: 12, paddingVertical: 6, fontSize: 14 },
    medium: { paddingHorizontal: 16, paddingVertical: 10, fontSize: 16 },
    large: { paddingHorizontal: 20, paddingVertical: 14, fontSize: 18 },
  };

  const currentVariant = variants[variant] || variants.primary;
  const currentSize = sizes[size] || sizes.medium;

  // Gestión de eventos
  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withTiming(pressScale, TIMING_CONFIGS.timing.fast);
      opacity.value = withTiming(pressOpacity, TIMING_CONFIGS.timing.fast);
      backgroundColor.value = withTiming(1, TIMING_CONFIGS.timing.fast);
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      scale.value = withSpring(1, TIMING_CONFIGS.spring.quickSpring);
      opacity.value = withTiming(1, TIMING_CONFIGS.timing.fast);
      backgroundColor.value = withTiming(0, TIMING_CONFIGS.timing.fast);
    }
  };

  const handlePress = () => {
    if (!disabled && onPress) {
      // Efecto de "bounce" al presionar
      scale.value = withSequence(
        withTiming(0.9, { duration: 100 }),
        withSpring(1, TIMING_CONFIGS.spring.quickSpring)
      );

      runOnJS(onPress)();
    }
  };

  // Estilos animados
  const animatedStyle = useAnimatedStyle(() => {
    const bgColor = interpolateColor(
      backgroundColor.value,
      [0, 1],
      [currentVariant.backgroundColor, currentVariant.pressColor]
    );

    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
      backgroundColor:
        variant === "ghost" || variant === "outline" ? "transparent" : bgColor,
    };
  });

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
      style={[
        buttonStyles.container,
        currentSize,
        currentVariant,
        disabled && buttonStyles.disabled,
        animatedStyle,
        style,
      ]}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
};

// ===== ANIMATED LOADING =====
/**
 * Componente de carga animado con diferentes variantes
 */
export const AnimatedLoading = ({
  visible = true,
  text = "Cargando...",
  size = "medium",
  color = "#007AFF",
  backgroundColor = "rgba(0, 0, 0, 0.5)",
  variant = "spinner",
  overlay = true,
  children,
  theme,
}) => {
  const { themeObject } = useTheme();
  const currentTheme = theme || themeObject;

  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  // Configuraciones de tamaños
  const sizes = {
    small: { width: 24, height: 24, borderWidth: 2 },
    medium: { width: 40, height: 40, borderWidth: 3 },
    large: { width: 60, height: 60, borderWidth: 4 },
  };

  const currentSize = sizes[size] || sizes.medium;
  const currentColor = color || currentTheme?.colors?.primary || "#007AFF";

  React.useEffect(() => {
    if (visible) {
      // Animación de rotación continua
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000 }),
        -1,
        false
      );

      // Animación de pulso
      if (variant === "pulse") {
        pulseScale.value = withRepeat(
          withSequence(
            withTiming(1.2, { duration: 500 }),
            withTiming(1, { duration: 500 })
          ),
          -1,
          false
        );
      }

      // Animación de escala
      if (variant === "bounce") {
        scale.value = withRepeat(
          withSequence(
            withSpring(1.1, TIMING_CONFIGS.spring.quickSpring),
            withSpring(1, TIMING_CONFIGS.spring.quickSpring)
          ),
          -1,
          false
        );
      }
    }
  }, [visible, variant]);

  // Estilos animados según variante
  const getAnimatedComponent = () => {
    switch (variant) {
      case "spinner":
        return (
          <Animated.View
            style={[
              loadingStyles.spinner,
              currentSize,
              {
                borderColor: `${currentColor}20`,
                borderTopColor: currentColor,
              },
              useAnimatedStyle(() => ({
                transform: [{ rotate: `${rotation.value}deg` }],
              })),
            ]}
          />
        );

      case "pulse":
        return (
          <Animated.View
            style={[
              loadingStyles.pulse,
              {
                width: currentSize.width,
                height: currentSize.height,
                backgroundColor: currentColor,
              },
              useAnimatedStyle(() => ({
                transform: [{ scale: pulseScale.value }],
                opacity: interpolate(pulseScale.value, [1, 1.2], [1, 0.6]),
              })),
            ]}
          />
        );

      case "bounce":
        return (
          <Animated.View
            style={[
              loadingStyles.bounce,
              {
                width: currentSize.width,
                height: currentSize.height,
                backgroundColor: currentColor,
              },
              useAnimatedStyle(() => ({
                transform: [{ scale: scale.value }],
              })),
            ]}
          />
        );

      case "dots":
        return (
          <View style={loadingStyles.dotsContainer}>
            {[0, 1, 2].map((index) => (
              <Animated.View
                key={index}
                style={[
                  loadingStyles.dot,
                  {
                    backgroundColor: currentColor,
                    width: currentSize.width / 3,
                    height: currentSize.height / 3,
                  },
                  useAnimatedStyle(() => ({
                    transform: [
                      {
                        translateY: interpolate(
                          (rotation.value + index * 120) % 360,
                          [0, 180, 360],
                          [0, -10, 0]
                        ),
                      },
                    ],
                  })),
                ]}
              />
            ))}
          </View>
        );

      default:
        return (
          <Animated.View
            style={[
              loadingStyles.spinner,
              currentSize,
              {
                borderColor: `${currentColor}20`,
                borderTopColor: currentColor,
              },
              useAnimatedStyle(() => ({
                transform: [{ rotate: `${rotation.value}deg` }],
              })),
            ]}
          />
        );
    }
  };

  if (!visible) return null;

  const content = (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={loadingStyles.container}
    >
      {getAnimatedComponent()}
      {text && (
        <Text
          style={[
            loadingStyles.text,
            {
              color: overlay
                ? "#FFFFFF"
                : currentTheme?.colors?.text || "#000000",
            },
          ]}
        >
          {text}
        </Text>
      )}
      {children}
    </Animated.View>
  );

  if (overlay) {
    return (
      <View style={[loadingStyles.overlay, { backgroundColor }]}>
        {content}
      </View>
    );
  }

  return content;
};

// ===== ANIMATED MODAL =====
/**
 * Componente Modal animado mejorado con gestos y diferentes animaciones
 */
export const AnimatedModal = ({
  visible,
  onClose,
  children,
  animationType = "slide",
  enableGestures = true,
  closeOnBackdrop = true,
  style,
  position = "center",
  backdropOpacity = 0.5,
  springConfig = { damping: 20, stiffness: 300 },
  ...props
}) => {
  const { themeObject } = useTheme();

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const backdropOpacityValue = useSharedValue(0);

  // Efectos de visibilidad
  useEffect(() => {
    if (visible) {
      // Mostrar modal
      backdropOpacityValue.value = withTiming(backdropOpacity, {
        duration: 300,
      });

      switch (animationType) {
        case "slide":
          translateY.value = withSpring(0, springConfig);
          break;
        case "fade":
          opacity.value = withTiming(1, { duration: 300 });
          break;
        case "zoom":
        case "scale":
          scale.value = withSpring(1, springConfig);
          opacity.value = withTiming(1, { duration: 300 });
          break;
      }
    } else {
      // Ocultar modal
      backdropOpacityValue.value = withTiming(0, { duration: 200 });

      switch (animationType) {
        case "slide":
          translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 });
          break;
        case "fade":
          opacity.value = withTiming(0, { duration: 200 });
          break;
        case "zoom":
        case "scale":
          scale.value = withTiming(0.8, { duration: 200 });
          opacity.value = withTiming(0, { duration: 200 });
          break;
      }
    }
  }, [visible, animationType]);

  // Gestión de gestos para cierre deslizando
  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      // Preparar para el gesto
    },
    onActive: (event) => {
      if (enableGestures && event.translationY > 0) {
        translateY.value = event.translationY;
        const progress = Math.min(
          event.translationY / (SCREEN_HEIGHT * 0.5),
          1
        );
        backdropOpacityValue.value = backdropOpacity * (1 - progress);
      }
    },
    onEnd: (event) => {
      if (enableGestures) {
        const shouldClose =
          event.translationY > SCREEN_HEIGHT * 0.3 || event.velocityY > 500;

        if (shouldClose) {
          translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 });
          backdropOpacityValue.value = withTiming(0, { duration: 200 });
          runOnJS(onClose)();
        } else {
          translateY.value = withSpring(0, springConfig);
          backdropOpacityValue.value = withTiming(backdropOpacity, {
            duration: 200,
          });
        }
      }
    },
  });

  // Estilos animados
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacityValue.value,
  }));

  const modalStyle = useAnimatedStyle(() => {
    let transform = [];

    if (animationType === "slide") {
      transform.push({ translateY: translateY.value });
    }

    if (animationType === "zoom" || animationType === "scale") {
      transform.push({ scale: scale.value });
    }

    return {
      transform,
      opacity: animationType === "fade" ? opacity.value : 1,
    };
  });

  const getEnteringAnimation = () => {
    switch (animationType) {
      case "slide":
        return position === "bottom" ? SlideInDown : SlideInDown;
      case "fade":
        return FadeIn;
      case "zoom":
      case "scale":
        return ZoomIn;
      default:
        return SlideInDown;
    }
  };

  const getExitingAnimation = () => {
    switch (animationType) {
      case "slide":
        return SlideOutDown;
      case "fade":
        return FadeOut;
      case "zoom":
      case "scale":
        return ZoomOut;
      default:
        return SlideOutDown;
    }
  };

  if (!visible) return null;

  const ModalContent = () => (
    <Animated.View
      entering={getEnteringAnimation().duration(300)}
      exiting={getExitingAnimation().duration(200)}
      style={[
        modalStyles.modal,
        position === "center" && modalStyles.centerModal,
        position === "bottom" && modalStyles.bottomModal,
        position === "top" && modalStyles.topModal,
        modalStyle,
        style,
      ]}
    >
      {children}
    </Animated.View>
  );

  return (
    <Modal transparent visible={visible} statusBarTranslucent {...props}>
      <View style={modalStyles.container}>
        {/* Backdrop */}
        <Animated.View style={[modalStyles.backdrop, backdropStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeOnBackdrop ? onClose : undefined}
          />
        </Animated.View>

        {/* Modal Content */}
        {enableGestures ? (
          <PanGestureHandler onGestureEvent={gestureHandler}>
            <Animated.View style={modalStyles.gestureContainer}>
              <ModalContent />
            </Animated.View>
          </PanGestureHandler>
        ) : (
          <ModalContent />
        )}
      </View>
    </Modal>
  );
};

// ===== ESTILOS =====
const cardStyles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    margin: 8,
  },
});

const buttonStyles = StyleSheet.create({
  container: {
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  disabled: {
    opacity: 0.5,
  },
});

const loadingStyles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    borderRadius: 50,
  },
  pulse: {
    borderRadius: 50,
  },
  bounce: {
    borderRadius: 8,
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    borderRadius: 50,
    marginHorizontal: 4,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
  },
});

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  gestureContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxHeight: "80%",
    maxWidth: "90%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  centerModal: {
    justifyContent: "center",
    alignItems: "center",
  },
  bottomModal: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    margin: 0,
    maxHeight: "70%",
  },
  topModal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    margin: 0,
    maxHeight: "70%",
  },
});
