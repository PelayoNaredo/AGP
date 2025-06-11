import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { useCallback, useEffect, useMemo } from "react";

// Hook personalizado para manejar animaciones de lista mejoradas
// Proporciona funcionalidades como staggered animations, pull-to-refresh, y scroll animations

export const useAnimatedList = ({
  data = [],
  staggerDelay = 100,
  baseDelay = 0,
  enableStagger = true,
  onRefresh,
}) => {
  const refreshProgress = useSharedValue(0);
  const listOpacity = useSharedValue(1);
  const scrollY = useSharedValue(0);

  // Animación de pull-to-refresh
  const refreshStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: refreshProgress.value * 100 },
      { scale: 1 + refreshProgress.value * 0.1 },
    ],
    opacity: 1 - refreshProgress.value * 0.3,
  }));

  // Animación de lista principal
  const listStyle = useAnimatedStyle(() => ({
    opacity: listOpacity.value,
    transform: [
      { translateY: scrollY.value * 0.1 }, // Efecto parallax sutil
    ],
  }));

  // Función para generar props de animación para elementos
  const getItemAnimationProps = useCallback(
    (index) => {
      if (!enableStagger) {
        return {
          entering: withSpring({
            duration: 500,
            dampingRatio: 0.8,
          }),
        };
      }

      const delay = baseDelay + index * staggerDelay;

      return {
        entering: withTiming(1, {
          duration: 500,
          delay: delay,
        }),
        layout: withSpring({
          dampingRatio: 0.8,
          stiffness: 100,
        }),
      };
    },
    [baseDelay, staggerDelay, enableStagger]
  );

  // Función para manejar scroll
  const handleScroll = useCallback((event) => {
    "worklet";
    scrollY.value = event.nativeEvent.contentOffset.y;
  }, []);

  // Función para manejar pull-to-refresh
  const handleRefresh = useCallback(async () => {
    refreshProgress.value = withSpring(1, { duration: 300 });

    if (onRefresh) {
      await runOnJS(onRefresh)();
    }

    refreshProgress.value = withSpring(0, { duration: 400 });
  }, [onRefresh]);

  // Función para fade out y fade in de la lista
  const fadeOutList = useCallback(() => {
    listOpacity.value = withTiming(0, { duration: 300 });
  }, []);

  const fadeInList = useCallback(() => {
    listOpacity.value = withTiming(1, { duration: 400 });
  }, []);

  // Efecto para animar entrada inicial
  useEffect(() => {
    if (data.length > 0) {
      fadeInList();
    }
  }, [data.length, fadeInList]);

  return {
    // Estilos animados
    refreshStyle,
    listStyle,

    // Funciones
    getItemAnimationProps,
    handleScroll,
    handleRefresh,
    fadeOutList,
    fadeInList,

    // Valores compartidos
    refreshProgress,
    listOpacity,
    scrollY,
  };
};

// Hook para animaciones de elementos de lista individuales
// Proporciona animaciones de entrada, salida, y interactividad
export const useListItemAnimation = ({
  index = 0,
  isPressed = false,
  isSelected = false,
  pressScale = 0.95,
  selectedScale = 1.02,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);

  // Animación de interactividad
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: translateX.value }],
    opacity: opacity.value,
  }));

  // Efectos de interacción
  useEffect(() => {
    if (isPressed) {
      scale.value = withSpring(pressScale, { duration: 150 });
    } else if (isSelected) {
      scale.value = withSpring(selectedScale, { duration: 200 });
    } else {
      scale.value = withSpring(1, { duration: 200 });
    }
  }, [isPressed, isSelected, pressScale, selectedScale]);

  // Función para shake animation (útil para errores)
  const shake = useCallback(() => {
    const shakeSequence = [0, -10, 10, -10, 10, 0];

    shakeSequence.forEach((value, index) => {
      setTimeout(() => {
        translateX.value = withSpring(value, { duration: 100 });
      }, index * 50);
    });
  }, []);

  // Función para pulso (útil para notificaciones)
  const pulse = useCallback(() => {
    opacity.value = withSpring(0.6, { duration: 200 });
    setTimeout(() => {
      opacity.value = withSpring(1, { duration: 200 });
    }, 200);
  }, []);

  return {
    animatedStyle,
    shake,
    pulse,
    scale,
    opacity,
    translateX,
  };
};
