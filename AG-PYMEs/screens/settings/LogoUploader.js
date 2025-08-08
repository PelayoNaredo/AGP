import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Text,
  Pressable,
} from "react-native";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import FileUploader from "../../components/fileUploader";
import { Services } from "../../api/index";
import ImageWithAuth from "../../components/ImageWithAuth";
import useNotifications from "../../hooks/useNotifications";

const { width } = Dimensions.get("window");
const isTablet = width > 768;
const isDesktop = width > 1024;
const LOGO_SIZE = isDesktop ? 120 : isTablet ? 100 : 80;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/svg+xml"];

// Componente LogoUploader permite subir un logo para la empresa
const LogoUploader = ({ onLogoChange, currentLogo }) => {
  const { themeObject } = useTheme();
  const notifications = useNotifications();
  const { showError, showSuccess, showConfirmDialog } = notifications;
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const scaleAnim = useSharedValue(1);

  const validateFile = useCallback((file) => {
    if (!file) {
      throw new Error("No se ha seleccionado ningún archivo");
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error(
        `Tipo de archivo no permitido. Use: ${ALLOWED_TYPES.map(
          (t) => t.split("/")[1]
        ).join(", ")}`
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`El archivo excede ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    return true;
  }, []);

  const handleLogoUpload = useCallback(
    async (files) => {
      try {
        if (!files?.length) return;

        const file = files[0];
        validateFile(file);

        scaleAnim.value = withSpring(0.95, {
          damping: 25,
          stiffness: 600,
        });
        setTimeout(() => {
          scaleAnim.value = withSpring(1, {
            damping: 25,
            stiffness: 600,
          });
        }, 150);

        setIsUploading(true);
        setError(null);

        const result = await Services.File.upload(file);

        if (result?.url) {
          onLogoChange(result.path || result.url);
          showSuccess("Éxito", "Logo subido correctamente");
        } else {
          throw new Error("No se recibió URL del servidor");
        }
      } catch (error) {
        console.error("Error en handleLogoUpload:", error);
        let errorMessage = error.message;

        if (error.message.includes("No hay token disponible")) {
          errorMessage =
            "Error de autenticación. Por favor, inicie sesión nuevamente.";
        }

        showError("Error", errorMessage);
        setError(errorMessage);
      } finally {
        setIsUploading(false);
      }
    },
    [validateFile, scaleAnim, onLogoChange, showError, showSuccess]
  );

  const handleImageError = useCallback(() => {
    console.error("[LogoUploader] Error al cargar la imagen de logo");
    setError("No se pudo cargar el logo");
  }, []);

  const handleRemoveLogo = useCallback(() => {
    showConfirmDialog(
      "Eliminar Logo",
      "¿Estás seguro de que quieres eliminar el logo actual?",
      () => {
        onLogoChange(null);
        setError(null);
        showSuccess(
          "Logo eliminado",
          "El logo ha sido eliminado correctamente"
        );
      },
      () => {},
      "Eliminar",
      "Cancelar"
    );
  }, [onLogoChange, showConfirmDialog, showSuccess]);

  const animatedStyle = useAnimatedStyle(() => {
    "worklet";
    return {
      transform: [{ scale: scaleAnim.value }],
    };
  }, []);

  // Estilos dinámicos optimizados
  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: themeObject.colors.surface,
          borderRadius: 16,
          padding: 20,
          shadowColor: themeObject.colors.onSurface,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        },
        headerContainer: {
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 20,
        },
        iconContainer: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: `${themeObject.colors.primary}15`,
          justifyContent: "center",
          alignItems: "center",
          marginRight: 16,
        },
        title: {
          fontSize: isDesktop ? 20 : 18,
          fontWeight: "600",
          color: themeObject.colors.text,
          flex: 1,
        },
        contentContainer: {
          flexDirection: isTablet ? "row" : "column",
          alignItems: "center",
          gap: 20,
        },
        logoContainer: {
          width: LOGO_SIZE,
          height: LOGO_SIZE,
          borderRadius: 16,
          backgroundColor: `${themeObject.colors.primary}10`,
          borderWidth: 2,
          borderColor: `${themeObject.colors.primary}30`,
          borderStyle: "dashed",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
        },
        logoImageContainer: {
          width: LOGO_SIZE - 8,
          height: LOGO_SIZE - 8,
          borderRadius: 12,
          overflow: "hidden",
        },
        logoImage: {
          width: "100%",
          height: "100%",
          borderRadius: 12,
        },
        placeholderContainer: {
          alignItems: "center",
          gap: 8,
        },
        placeholderIcon: {
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: `${themeObject.colors.primary}20`,
          justifyContent: "center",
          alignItems: "center",
        },
        placeholderText: {
          fontSize: 14,
          color: themeObject.colors.onBackground,
          textAlign: "center",
          opacity: 0.7,
        },
        removeButton: {
          position: "absolute",
          top: -8,
          right: -8,
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: themeObject.colors.error,
          justifyContent: "center",
          alignItems: "center",
          shadowColor: themeObject.colors.error,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 4,
        },
        actionsContainer: {
          flex: 1,
          alignItems: "center",
          gap: 16,
        },
        uploadButton: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: themeObject.colors.primary,
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: 12,
          gap: 8,
        },
        uploadButtonText: {
          color: themeObject.colors.onPrimary || themeObject.colors.surface,
          fontSize: 14,
          fontWeight: "600",
        },
        uploadingContainer: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: `${themeObject.colors.primary}15`,
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: 12,
          gap: 8,
        },
        uploadingText: {
          color: themeObject.colors.primary,
          fontSize: 14,
          fontWeight: "500",
        },
        helperContainer: {
          marginTop: 16,
          padding: 12,
          backgroundColor: `${themeObject.colors.surface}80`,
          borderRadius: 8,
          borderLeftWidth: 3,
          borderLeftColor: themeObject.colors.primary,
        },
        helperTitle: {
          fontSize: 12,
          fontWeight: "600",
          color: themeObject.colors.text,
          marginBottom: 4,
        },
        helperText: {
          fontSize: 11,
          color: themeObject.colors.onBackground,
          opacity: 0.7,
          lineHeight: 16,
        },
        errorContainer: {
          marginTop: 12,
          padding: 12,
          backgroundColor: `${themeObject.colors.error}15`,
          borderRadius: 8,
          borderLeftWidth: 3,
          borderLeftColor: themeObject.colors.error,
        },
        errorText: {
          fontSize: 12,
          color: themeObject.colors.error,
          fontWeight: "500",
        },
      }),
    [themeObject.colors, isDesktop, isTablet]
  );

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={[dynamicStyles.container, animatedStyle]}
    >
      {/* Header del componente */}
      <View style={dynamicStyles.headerContainer}>
        <View style={dynamicStyles.iconContainer}>
          <Ionicons
            name="business"
            size={20}
            color={themeObject.colors.primary}
          />
        </View>
        <Text style={dynamicStyles.title}>Logo de la Empresa</Text>
      </View>

      {/* Contenido principal */}
      <View style={dynamicStyles.contentContainer}>
        {/* Contenedor del logo */}
        <Animated.View
          entering={FadeIn.delay(100).duration(400)}
          style={dynamicStyles.logoContainer}
        >
          {currentLogo ? (
            <View style={dynamicStyles.logoImageContainer}>
              <ImageWithAuth
                source={currentLogo}
                style={dynamicStyles.logoImage}
                onError={handleImageError}
              />
              <Pressable
                style={dynamicStyles.removeButton}
                onPress={handleRemoveLogo}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="close"
                  size={16}
                  color={themeObject.colors.onError || "#ffffff"}
                />
              </Pressable>
            </View>
          ) : (
            <View style={dynamicStyles.placeholderContainer}>
              <View style={dynamicStyles.placeholderIcon}>
                <Ionicons
                  name="business"
                  size={24}
                  color={themeObject.colors.primary}
                />
              </View>
              <Text style={dynamicStyles.placeholderText}>
                Sube el logo de tu empresa
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Acciones */}
        <Animated.View
          entering={FadeIn.delay(200).duration(400)}
          style={dynamicStyles.actionsContainer}
        >
          {isUploading ? (
            <View style={dynamicStyles.uploadingContainer}>
              <ActivityIndicator
                size="small"
                color={themeObject.colors.primary}
              />
              <Text style={dynamicStyles.uploadingText}>Subiendo logo...</Text>
            </View>
          ) : (
            <FileUploader
              acceptedFileTypes={ALLOWED_TYPES}
              maxFileSize={MAX_FILE_SIZE}
              onFileUpload={handleLogoUpload}
              multiple={false}
              customButton={(onPickFile) => (
                <Pressable
                  style={dynamicStyles.uploadButton}
                  onPress={onPickFile}
                >
                  <Ionicons
                    name="cloud-upload-outline"
                    size={16}
                    color={
                      themeObject.colors.onPrimary || themeObject.colors.surface
                    }
                  />
                  <Text style={dynamicStyles.uploadButtonText}>
                    {currentLogo ? "Cambiar Logo" : "Subir Logo"}
                  </Text>
                </Pressable>
              )}
            />
          )}
        </Animated.View>
      </View>

      {/* Información de ayuda */}
      <Animated.View
        entering={FadeIn.delay(300).duration(400)}
        style={dynamicStyles.helperContainer}
      >
        <Text style={dynamicStyles.helperTitle}>
          Especificaciones del Logo:
        </Text>
        <Text style={dynamicStyles.helperText}>
          • Formatos permitidos: JPG, PNG, SVG{"\n"}• Tamaño máximo:{" "}
          {MAX_FILE_SIZE / (1024 * 1024)}MB{"\n"}• Resolución recomendada:
          512x512px{"\n"}• Fondo transparente preferible
        </Text>
      </Animated.View>

      {/* Mensaje de error */}
      {error && (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={dynamicStyles.errorContainer}
        >
          <Text style={dynamicStyles.errorText}>{error}</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // Solo estilos que no dependen del tema
});

export default LogoUploader;
