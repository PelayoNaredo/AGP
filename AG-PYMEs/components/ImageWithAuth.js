import React, { useState, useEffect, useRef } from "react";
import {
  Image,
  ActivityIndicator,
  View,
  StyleSheet,
  Platform,
} from "react-native";
import { Services } from "../api";

//Componente para mostrar imágenes que requieren autenticación. Utilizado por el LogoImage y el Header.
const ImageWithAuth = ({
  source,
  style,
  resizeMode = "contain",
  onLoad,
  onError,
  ...props
}) => {
  const [imageSource, setImageSource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [useFallbackMethod, setUseFallbackMethod] = useState(false);
  const isMounted = useRef(true);

  // Limpiar referencia al desmontar
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Método de respaldo para web: fetchBlob
  const fetchImageWithToken = async (url) => {
    try {
      const token = await Services.Storage.Token.getToken();

      if (!token) {
        console.error("[ImageWithAuth] No hay token disponible para fetch");
        return null;
      }

      // Determinar si la URL necesita el prefijo /api
      let urlToFetch = url;
      if (
        url.includes("ngrok") &&
        !url.includes("/api/") &&
        url.includes("/media/")
      ) {
        // Si es una URL de ngrok sin el prefijo /api/, ajustarla
        urlToFetch = url.replace("/media/", "/api/media/");
      }

      const response = await fetch(urlToFetch, {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      });

      if (!response.ok) {
        console.error(
          `[ImageWithAuth] Error en fetch: ${response.status} ${response.statusText}`
        );
        return null;
      }

      // Convertir a blob y luego a URL de datos
      const blob = await response.blob();
      if (!isMounted.current) return null;

      return URL.createObjectURL(blob);
    } catch (err) {
      console.error("[ImageWithAuth] Error en fetchImageWithToken:", err);
      return null;
    }
  };

  // Configurar fuente de imagen
  useEffect(() => {
    const setupImageSource = async () => {
      try {
        if (!source) {
          console.warn("[ImageWithAuth] No se proporcionó source");
          setError(true);
          return;
        }

        // Si estamos usando el método de fallback, cargamos con fetch
        if (Platform.OS === "web" && useFallbackMethod) {
          const sourceUrl =
            typeof source === "string"
              ? Services.File.normalizeImageUrl(source)
              : source.uri;

          const blobUrl = await fetchImageWithToken(sourceUrl);

          if (blobUrl && isMounted.current) {
            setImageSource({ uri: blobUrl });
            return;
          } else {
            setError(true);
            return;
          }
        } // Método normal usando el componente Image nativo
        // Obtener el token para autenticación
        const token = await Services.Storage.Token.getToken();
        if (!token) {
          console.warn(
            "[ImageWithAuth] No hay token disponible - intentando recargar"
          );
          // Intentar recargar el token del almacenamiento limpiando la caché
          Services.Storage.Token.clearCache();
          const freshToken = await Services.Storage.Token.getToken();
          if (!freshToken) {
            console.error(
              "[ImageWithAuth] No se pudo obtener el token después de reintento"
            );
          }
        }
        const currentToken = await Services.Storage.Token.getToken();

        const headers = {
          Authorization: currentToken ? `Bearer ${currentToken}` : "",
          "ngrok-skip-browser-warning": "true",
        };

        // Si source ya es un objeto con uri y headers
        if (typeof source === "object" && source.uri) {
          setImageSource({
            uri: source.uri,
            headers: { ...headers, ...source.headers },
          });
        } // Si es una string, normalizar la URL
        else if (typeof source === "string") {
          // Tanto para web como para nativo, ahora usamos URL firmada
          try {
            // Generar URL firmada segura que no requiere token en headers
            const signedUrl = await Services.File.createSignedImageUrl(source);

            // Añadir un parámetro de timestamp para evitar caché
            const timestamp = Date.now();
            const urlWithNoCache = `${signedUrl}${signedUrl.includes("?") ? "&" : "?"}t=${timestamp}`;

            setImageSource({
              uri: urlWithNoCache,
            });
          } catch (error) {
            console.error(
              "[ImageWithAuth] Error al generar URL firmada:",
              error
            );

            // Fallback: intentar con el método tradicional
            if (Platform.OS === "web") {
              setUseFallbackMethod(true);
            } else {
              // En entornos nativos, podemos intentar con headers
              const normalizedUrl = Services.File.normalizeImageUrl(source);

              setImageSource({
                uri: normalizedUrl,
                headers,
              });
            }
          }
        }
      } catch (err) {
        console.error("[ImageWithAuth] Error al preparar la imagen:", err);
        setError(true);
        if (onError) onError(err);
      }
    };

    if (isMounted.current) {
      setupImageSource();
    }
  }, [source, useFallbackMethod]);

  const handleLoad = () => {
    setLoading(false);
    if (onLoad) onLoad();
  };

  const handleError = (err) => {
    console.error("[ImageWithAuth] Error cargando imagen:", err);
    console.error("[ImageWithAuth] Source:", source);
    console.error("[ImageWithAuth] Procesado como:", imageSource);

    // En web, si no estamos ya usando el método de fallback, intentar con fetch
    if (Platform.OS === "web" && !useFallbackMethod) {
      setUseFallbackMethod(true);
      return;
    }

    setLoading(false);
    setError(true);
    if (onError) onError(err);
  };

  if (error) {
    return (
      <View style={[styles.errorContainer, style]}>
        <View style={styles.errorBox} />
      </View>
    );
  }

  return (
    <View style={style}>
      {imageSource && (
        <Image
          source={imageSource}
          style={StyleSheet.absoluteFill}
          resizeMode={resizeMode}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}

      {loading && (
        <View style={[styles.loadingContainer, StyleSheet.absoluteFill]}>
          <ActivityIndicator size="small" color="#0000ff" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(240, 240, 240, 0.5)",
  },
  errorContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  errorBox: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e0e0e0",
    opacity: 0.5,
  },
});

export default ImageWithAuth;
