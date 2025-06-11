import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import CustomButton from "./customButton";
import { useTheme } from "../context/ThemeContext";
import { ANIMATION_CONFIGS } from "./animations";

// Componente reutilizable que muestra un modal con título, texto, advertencia y botones de acción.
const ModalTemplate = ({
  isVisible,
  title,
  text,
  warning,
  cancelLabel = "Cancel",
  cancelAction,
  confirmLabel = "Confirm",
  confirmAction,
  confirmDisabled,
  children,
  enableSwipeToClose = true,
}) => {
  const { themeObject } = useTheme();
  const { height: windowHeight, width: windowWidth } = Dimensions.get("window");

  // Valores compartidos para animaciones
  const backdropOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0.95);
  const modalTranslateY = useSharedValue(30);
  const contentOpacity = useSharedValue(0);

  // Configuración de animaciones mejoradas
  React.useEffect(() => {
    if (isVisible) {
      // Animaciones de entrada escalonadas
      backdropOpacity.value = withTiming(1, ANIMATION_CONFIGS.timing.medium);
      modalScale.value = withSpring(1, ANIMATION_CONFIGS.spring.softSpring);
      modalTranslateY.value = withSpring(0, ANIMATION_CONFIGS.spring.spring);
      contentOpacity.value = withTiming(1, {
        ...ANIMATION_CONFIGS.timing.medium,
        delay: 100,
      });
    }
  }, [isVisible]);

  // Función para cerrar modal con animación
  const closeModal = React.useCallback(() => {
    backdropOpacity.value = withTiming(0, ANIMATION_CONFIGS.timing.fast);
    modalScale.value = withTiming(0.95, ANIMATION_CONFIGS.timing.fast);
    modalTranslateY.value = withTiming(30, ANIMATION_CONFIGS.timing.fast);
    contentOpacity.value = withTiming(0, ANIMATION_CONFIGS.timing.fast, () => {
      if (cancelAction) {
        runOnJS(cancelAction)();
      }
    });
  }, [cancelAction]);

  // Gesto para cerrar deslizando hacia abajo
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (enableSwipeToClose && event.translationY > 0) {
        modalTranslateY.value = event.translationY;
        const progress = Math.min(event.translationY / 200, 1);
        backdropOpacity.value = 1 - progress * 0.5;
        modalScale.value = 1 - progress * 0.05;
      }
    })
    .onEnd((event) => {
      if (enableSwipeToClose && event.translationY > 100) {
        closeModal();
      } else {
        modalTranslateY.value = withSpring(
          0,
          ANIMATION_CONFIGS.spring.quickSpring
        );
        backdropOpacity.value = withTiming(1, ANIMATION_CONFIGS.timing.fast);
        modalScale.value = withSpring(1, ANIMATION_CONFIGS.spring.quickSpring);
      }
    });

  // Estilos animados
  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: modalScale.value },
      { translateY: modalTranslateY.value },
    ],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const styles = StyleSheet.create({
    modalOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: Platform.OS === "android" ? 12 : 20,
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: themeObject.colors.surface,
      borderRadius: 12,
      padding: Platform.OS === "android" ? 12 : 24,
      width: "100%",
      maxHeight:
        Platform.OS === "android" ? windowHeight * 0.75 : windowHeight * 0.9,
      maxWidth: Math.min(windowWidth * 0.95, 600),
    },
    modalHeader: {
      marginBottom: Platform.OS === "android" ? 4 : 8,
    },
    modalBody: {
      maxHeight:
        Platform.OS === "android" ? windowHeight * 0.45 : windowHeight * 0.6,
    },
    contentContainer: {
      flexGrow: 1,
    },
    modalFooter: {
      marginTop: Platform.OS === "android" ? 8 : 12,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: themeObject.colors.text,
      marginBottom: 8,
    },
    modalText: {
      fontSize: 16,
      color: themeObject.colors.text,
      marginBottom: 8,
    },
    modalWarning: {
      fontSize: 14,
      color: themeObject.colors.error,
      marginBottom: 16,
    },
    modalButtonRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 12,
      gap: 12,
    },
  });
  if (!isVisible) return null;

  return (
    <Animated.View
      style={[styles.modalOverlay, backdropAnimatedStyle]}
      entering={FadeIn.duration(300).easing(Easing.out(Easing.cubic))}
      exiting={FadeOut.duration(250).easing(Easing.in(Easing.cubic))}
    >
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[styles.modalContent, modalAnimatedStyle]}
          entering={SlideInDown.springify()
            .damping(20)
            .stiffness(200)
            .mass(0.8)
            .restDisplacementThreshold(0.1)
            .restSpeedThreshold(0.1)}
          exiting={SlideOutDown.duration(250).easing(Easing.in(Easing.cubic))}
        >
          <Animated.View style={[styles.modalHeader, contentAnimatedStyle]}>
            <Text style={styles.modalTitle}>{title}</Text>
            {text ? <Text style={styles.modalText}>{text}</Text> : null}
            {warning ? (
              <Text style={styles.modalWarning}>{warning}</Text>
            ) : null}
          </Animated.View>

          <Animated.ScrollView
            style={[styles.modalBody, contentAnimatedStyle]}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          >
            {children}
          </Animated.ScrollView>

          <Animated.View style={[styles.modalFooter, contentAnimatedStyle]}>
            <View style={styles.modalButtonRow}>
              <CustomButton
                onPress={closeModal}
                ionIconLeft="close-outline"
                variant="secondary"
                style={{ flex: 1 }}
              >
                {cancelLabel}
              </CustomButton>

              <CustomButton
                onPress={confirmAction}
                ionIconLeft="checkmark-outline"
                variant="success"
                style={{ flex: 1 }}
                disabled={confirmDisabled}
              >
                {confirmLabel}
              </CustomButton>
            </View>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
};

export default ModalTemplate;
