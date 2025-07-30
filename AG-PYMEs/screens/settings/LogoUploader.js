import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Text,
} from "react-native";
import { Card, IconButton } from "react-native-paper";
import { useTheme } from "../../context/ThemeContext";
import FileUploader from "../../components/fileUploader";
import { Services } from "../../api/index";
import LogoImage from "../../components/LogoImage";
import useNotifications from "../../hooks/useNotifications";

const { width } = Dimensions.get("window");
const LOGO_SIZE = width * 0.2;
const UPLOAD_BUTTON_SIZE = width * 0.2;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

// Componente LogoUploader permite subir un logo para la empresa
const LogoUploader = ({ onLogoChange, currentLogo }) => {
  const { themeObject } = useTheme();
  const { showError, showSuccess, showConfirmDialog } = useNotifications();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const validateFile = (file) => {
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
  };
  const handleLogoUpload = async (files) => {
    try {
      if (!files?.length) return;

      const file = files[0];
      validateFile(file);

      setIsUploading(true);
      setError(null);

      const result = await Services.File.upload(file);

      if (result?.url) {
        onLogoChange(result.path || result.url);
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
  };

  const handleImageError = () => {
    console.error("[LogoUploader] Error al cargar la imagen de logo");
    setError("No se pudo cargar el logo");
  };

  return (
    <Card
      style={[styles.card, { backgroundColor: themeObject.colors.surface }]}
    >
      <Card.Title
        title="Logo de la empresa"
        titleStyle={{ paddingTop: 4, fontWeight: "bold" }}
        left={(props) => (
          <IconButton
            {...props}
            icon="image-outline"
            size={24}
            iconColor={themeObject.colors.text}
          />
        )}
      />
      <Card.Content>
        <View style={styles.container}>
          <View style={styles.logoContainer}>
            <LogoImage
              logoUrl={currentLogo}
              size={LOGO_SIZE}
              onError={handleImageError}
              resizeMode="contain"
              containerStyle={styles.logoImageContainer}
              style={styles.logoImage}
            />
          </View>

          {isUploading ? (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator
                size="large"
                color={themeObject.colors.primary}
              />
              <Text style={styles.uploadingText}>Subiendo logo...</Text>
            </View>
          ) : (
            <View style={styles.uploaderContainer}>
              <FileUploader
                onFileSelect={handleLogoUpload}
                maxFiles={1}
                allowedTypes={ALLOWED_TYPES}
                uploadButtonStyle={styles.uploadButton}
                disabled={isUploading}
              />
            </View>
          )}
        </View>
        <View style={styles.helperTextContainer}>
          <Text style={styles.helperText}>Formatos permitidos: JPG, PNG</Text>
          <Text style={styles.helperText}>Tamaño máximo: 10MB</Text>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    gap: 20,
  },
  card: {
    margin: 10,
    borderRadius: 10,
  },
  logoContainer: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  logoImageContainer: {
    borderRadius: 8,
  },
  logoImage: {
    borderRadius: 8,
  },
  uploaderContainer: {
    width: UPLOAD_BUTTON_SIZE,
  },
  uploadButton: {
    width: UPLOAD_BUTTON_SIZE,
    height: UPLOAD_BUTTON_SIZE,
  },
  uploadingContainer: {
    alignItems: "center",
    gap: 10,
  },
  uploadingText: {
    marginTop: 10,
  },
  helperTextContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  helperText: {
    fontSize: 12,
    opacity: 0.7,
  },
  errorText: {
    color: "red",
    marginTop: 10,
    textAlign: "center",
  },
});

export default LogoUploader;
