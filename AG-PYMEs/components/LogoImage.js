import React, { useState, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator, Text } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../context/ThemeContext";
import ImageWithAuth from "./ImageWithAuth";
import { TokenStorage } from "../api";

// Componente LogoImage muestra una imagen de logo con soporte para carga y manejo de errores.
const LogoImage = ({
  logoUrl,
  size = 40,
  onError,
  onLoad,
  fallbackIcon = "store-outline",
  resizeMode = "contain",
  style = {},
  containerStyle = {},
  showDebugInfo = false,
}) => {
  const { themeObject } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [tokenStatus, setTokenStatus] = useState("checking");

  // Verificar token disponible
  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await TokenStorage.getToken();
        if (token) {
          setTokenStatus("available");
        } else {
          setTokenStatus("unavailable");
        }
      } catch (error) {
        console.error("[LogoImage] Error al verificar token:", error);
        setTokenStatus("error");
      }
    };

    // Con URLs firmadas ya no necesitamos verificar el token,
    // pero lo mantenemos para compatibilidad con código existente
    setTokenStatus("available");
  }, [logoUrl]);

  // Manejar el evento de carga completada
  const handleLoadComplete = () => {
    setIsLoading(false);
    if (onLoad) onLoad();
  };

  // Manejar errores de carga
  const handleLoadError = (err) => {
    console.error(
      `[LogoImage] Error cargando imagen: ${typeof logoUrl === "string" ? logoUrl : "objeto URI"}`,
      err
    );

    setIsLoading(false);
    setHasError(true);
    if (onError) onError(err);
  };

  const containerDimensions = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  // Mostrar fallback si hay error, no hay URL, o el token no está disponible
  if (
    hasError ||
    !logoUrl ||
    tokenStatus === "unavailable" ||
    tokenStatus === "error"
  ) {
    return (
      <View style={[styles.container, containerDimensions, containerStyle]}>
        <Icon
          name={fallbackIcon}
          size={size * 0.8}
          color={themeObject.colors.primary}
          style={styles.fallbackIcon}
        />

        {showDebugInfo && (
          <Text style={styles.debugText}>
            {tokenStatus === "unavailable"
              ? "No hay token"
              : tokenStatus === "error"
                ? "Error token"
                : hasError
                  ? "Error carga"
                  : "Sin URL"}
          </Text>
        )}
      </View>
    );
  }

  // Mientras se verifica el token
  if (tokenStatus === "checking") {
    return (
      <View style={[styles.container, containerDimensions, containerStyle]}>
        <ActivityIndicator size="small" color={themeObject.colors.primary} />
        {showDebugInfo && (
          <Text style={styles.debugText}>Verificando token...</Text>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, containerDimensions, containerStyle]}>
      <ImageWithAuth
        source={logoUrl}
        style={[
          styles.image,
          containerDimensions,
          { borderColor: themeObject.colors.border },
          style,
        ]}
        resizeMode={resizeMode}
        onError={handleLoadError}
        onLoad={handleLoadComplete}
      />

      {isLoading && (
        <View style={[styles.loadingContainer, containerDimensions]}>
          <ActivityIndicator size="small" color={themeObject.colors.primary} />
        </View>
      )}

      {showDebugInfo && (
        <Text style={[styles.debugText, { position: "absolute", bottom: -15 }]}>
          {tokenStatus}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  image: {
    width: "100%",
    height: "100%",
    borderWidth: 1,
  },
  loadingContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  fallbackIcon: {
    opacity: 0.8,
  },
  debugText: {
    fontSize: 8,
    color: "red",
    position: "absolute",
    bottom: 0,
  },
});

export default LogoImage;
