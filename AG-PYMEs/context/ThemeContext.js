import React, { createContext, useState, useEffect, useContext } from "react";
import { Platform } from "react-native";
import { DefaultTheme, Provider as PaperProvider } from "react-native-paper";
import { Services } from "../api/index";

// Paleta de colores profesional
const colors = {
  // Colores base
  darkPrimary: "#1f242b", // Azul oscuro más profundo
  darkSecondary: "#343b45", // Azul grisáceo
  accent: "#0D9488", // Verde azulado más accesible
  accentSecondary: "#14B8A6", // Verde azulado más claro
  lightText: "#F8FAFC", // Blanco ligeramente cálido

  // Colores semánticos
  success: "#16A34A", // Verde más vibrante
  warning: "#F59E0B", // Ámbar más cálido
  error: "#DC2626", // Rojo más intenso
  info: "#2563EB", // Azul más claro

  // Nuevos colores para mejor contraste
  lightPrimary: "#1E40AF", // Azul intenso para modo claro
  lightSecondary: "#3B82F6", // Azul medio
};

// Variables adicionales para componentes específicos
const componentColors = {
  buttonHover: `${colors.accent}20`,
  buttonPressed: `${colors.accent}40`,
  overlay: "rgba(0,0,0,0.7)",
  shimmerPrimary: "#F1F5F9",
  shimmerSecondary: "#E2E8F0",
  link: colors.accentSecondary,
  highlight: `${colors.accent}20`,
};

// Tema Claro
const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.lightSecondary,
    accent: colors.accent,
    background: "#FFFFFF",
    surface: "#F8FAFC",
    text: "#0F172A",
    placeholder: "#64748B",
    disabled: "#CBD5E1",
    header: colors.lightPrimary,
    card: "#FFFFFF",
    border: "#E2E8F0",
    notification: colors.accent,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.info,
    onSurface: "#0F172A",
    onBackground: "#334155",
    buttonWhite: colors.lightText,
  },
  roundness: 8,
  componentColors: {
    ...componentColors,
    buttonHover: `${colors.lightPrimary}20`,
    buttonPressed: `${colors.lightPrimary}40`,
  },
};

// Tema Oscuro
const darkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.accent,
    accent: colors.accentSecondary,
    background: colors.darkPrimary,
    surface: colors.darkSecondary,
    text: colors.lightText,
    placeholder: "#94A3B8",
    disabled: "#475569",
    header: colors.darkSecondary,
    card: "#1E293B",
    border: "#334155",
    notification: colors.accentSecondary,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.info,
    onSurface: colors.lightText,
    onBackground: "#CBD5E1",
    buttonWhite: colors.lightText,
  },
  roundness: 8,
  componentColors: {
    ...componentColors,
    shimmerPrimary: "#334155",
    shimmerSecondary: "#475569",
  },
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("claro");
  const [themeObject, setThemeObject] = useState(lightTheme);
  const [isLoading, setIsLoading] = useState(true); // Función para aplicar el tema consistentemente
  const applyTheme = async (themeName, updateApi = true) => {
    // Validación para evitar temas inválidos
    const validThemeName = themeName === "oscuro" ? "oscuro" : "claro";
    const newTheme = validThemeName === "oscuro" ? darkTheme : lightTheme;

    // Actualizar estado (usamos el nombre validado)
    setTheme(validThemeName);
    setThemeObject(newTheme);

    try {
      // Para web: guardar directamente en localStorage primero para asegurar persistencia entre recargas
      if (Platform.OS === "web") {
        localStorage.setItem("appTheme", validThemeName);
        // Actualizar la clase y el color de fondo del body en tiempo real
        document.body.className = validThemeName;
        document.body.style.backgroundColor = newTheme.colors.background;
        document.body.style.color =
          validThemeName === "oscuro" ? "#F8FAFC" : "#0F172A";
        // Variable CSS para que otros componentes puedan detectar el tema actual
        document.documentElement.style.setProperty(
          "--current-theme",
          validThemeName
        );
      } // Guardar en caché local (para consistencia en móvil)
      await Services.Storage.Base.setItem("appTheme", validThemeName);
    } catch (error) {
      console.error("Error guardando tema:", error);
      // No propagamos el error para no interrumpir la UI
    }

    return validThemeName;
  };

  // Función para cambiar tema
  const toggleTheme = async (themeName) => {
    try {
      setIsLoading(true);
      // Si no se especifica un tema, alternar entre oscuro y claro
      const nextTheme = themeName || (theme === "claro" ? "oscuro" : "claro");

      // Evitar cambios innecesarios si el tema solicitado ya está activo
      if (nextTheme === theme) {
        setIsLoading(false);
        return;
      }

      await applyTheme(nextTheme, true);
    } catch (error) {
      console.error("Error changing theme:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar eventos de almacenamiento para sincronizar temas entre pestañas/ventanas (solo web)
  useEffect(() => {
    if (Platform.OS === "web") {
      const handleStorageChange = (e) => {
        if (e.key === "appTheme" && e.newValue) {
          const newTheme = e.newValue === "oscuro" ? "oscuro" : "claro";
          if (theme !== newTheme) {
            setTheme(newTheme);
            setThemeObject(newTheme === "oscuro" ? darkTheme : lightTheme);

            // Aplicar inmediatamente el cambio visual
            document.body.className = newTheme;
            document.body.style.backgroundColor =
              newTheme === "oscuro"
                ? darkTheme.colors.background
                : lightTheme.colors.background;
          }
        }
      };

      window.addEventListener("storage", handleStorageChange);

      return () => {
        window.removeEventListener("storage", handleStorageChange);
      };
    }
  }, [theme]);

  // Cargar el tema al iniciar la aplicación - implementación simplificada y más directa
  useEffect(() => {
    const initializeTheme = async () => {
      try {
        setIsLoading(true);
        let selectedTheme = "claro"; // Tema por defecto

        // Para la web: primero intentar obtener del localStorage (más rápido)
        if (Platform.OS === "web") {
          const storedTheme = localStorage.getItem("appTheme");
          if (storedTheme) {
            selectedTheme = storedTheme === "oscuro" ? "oscuro" : "claro";
            // Aplicar inmediatamente para evitar parpadeos
            document.body.className = selectedTheme;
            document.body.style.backgroundColor =
              selectedTheme === "oscuro"
                ? darkTheme.colors.background
                : lightTheme.colors.background;
          }
        }

        // Intentar desde AsyncStorage (para móvil o como respaldo)
        try {
          const cachedTheme = await Services.Storage.Base.getItem("appTheme");
          if (cachedTheme) {
            selectedTheme = cachedTheme === "oscuro" ? "oscuro" : "claro";
          }
        } catch (e) {
          console.error("Error al cargar tema desde AsyncStorage:", e);
        }

        // Verificar con la API (si es necesario)
        try {
          const settings = await Services.Data.Settings.getById(1);
          if (settings?.tema) {
            selectedTheme = settings.tema === "oscuro" ? "oscuro" : "claro";
          }
        } catch (e) {
          console.warn("No se pudo cargar el tema desde la API:", e);
          // Continuamos con el tema que ya tenemos
        }

        // Aplicar el tema final
        const themeToApply =
          selectedTheme === "oscuro" ? darkTheme : lightTheme;
        setTheme(selectedTheme);
        setThemeObject(themeToApply);

        // Guardar en localStorage para futuras sesiones (web)
        if (Platform.OS === "web") {
          localStorage.setItem("appTheme", selectedTheme);
        }

        // También guardar en AsyncStorage
        await Services.Storage.Base.setItem("appTheme", selectedTheme);

        // Aplicar estilos para web
        if (Platform.OS === "web") {
          document.body.className = selectedTheme;
          document.body.style.backgroundColor = themeToApply.colors.background;
        }
      } catch (error) {
        console.error("Error al inicializar el tema:", error);
        // En caso de error, asegurarse de que al menos tengamos un tema válido
        setTheme("claro");
        setThemeObject(lightTheme);
      } finally {
        setIsLoading(false);
      }
    };

    initializeTheme();
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        themeObject,
        isLoading,
        colors, // Exportamos la paleta principal
        componentColors, // Exportamos los colores de componentes
      }}
    >
      <PaperProvider theme={themeObject}>{children}</PaperProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme debe ser usado dentro de un ThemeProvider");
  }

  // En la web, siempre sincronizar con localStorage cuando se usa el hook
  if (Platform.OS === "web" && context.theme) {
    // Utilizar un efecto lateral para sincronizar
    // Esto garantiza que el tema esté siempre actualizado incluso si se recarga la página
    if (typeof localStorage !== "undefined") {
      const currentTheme = localStorage.getItem("appTheme");
      if (currentTheme !== context.theme) {
        localStorage.setItem("appTheme", context.theme);
      }
    }
  }

  return context;
};
