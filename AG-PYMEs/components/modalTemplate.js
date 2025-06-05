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
} from "react-native-reanimated";
import CustomButton from "./customButton";
import { useTheme } from "../context/ThemeContext";

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
}) => {
  const { themeObject } = useTheme();
  const { height: windowHeight, width: windowWidth } = Dimensions.get("window");

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
      style={styles.modalOverlay}
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
    >
      <Animated.View
        style={styles.modalContent}
        entering={SlideInDown.springify().damping(15)}
        exiting={SlideOutDown.duration(200)}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          {text ? <Text style={styles.modalText}>{text}</Text> : null}
          {warning ? <Text style={styles.modalWarning}>{warning}</Text> : null}
        </View>

        <ScrollView
          style={styles.modalBody}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
        >
          {children}
        </ScrollView>

        <View style={styles.modalFooter}>
          <View style={styles.modalButtonRow}>
            <CustomButton
              onPress={cancelAction}
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
        </View>
      </Animated.View>
    </Animated.View>
  );
};

export default ModalTemplate;
