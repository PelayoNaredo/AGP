import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Dimensions,
} from "react-native";
import { Switch } from "react-native-paper";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

const { width } = Dimensions.get("window");
const isTablet = width > 768;
const isDesktop = width > 1024;

const ThemeSelector = ({ onThemeChange }) => {
  const { theme, themeObject, toggleTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState(theme || "claro");
  const [autoMode, setAutoMode] = useState(false);
  const [followSystem, setFollowSystem] = useState(false);

  const scaleValue = useSharedValue(1);

  const themes = [
    {
      id: "claro",
      name: "Claro",
      icon: "sunny",
      description: "Tema luminoso para el día",
      colors: {
        primary: "#1976D2",
        surface: "#FFFFFF",
        background: "#F5F5F5",
        text: "#000000",
      },
    },
    {
      id: "oscuro",
      name: "Oscuro",
      icon: "moon",
      description: "Tema suave para la noche",
      colors: {
        primary: "#90CAF9",
        surface: "#1E1E1E",
        background: "#121212",
        text: "#FFFFFF",
      },
    },
    {
      id: "azul",
      name: "Azul",
      icon: "water",
      description: "Tema profesional azul",
      colors: {
        primary: "#2196F3",
        surface: "#E3F2FD",
        background: "#F5F5F5",
        text: "#1A1A1A",
      },
    },
    {
      id: "verde",
      name: "Verde",
      icon: "leaf",
      description: "Tema natural verde",
      colors: {
        primary: "#4CAF50",
        surface: "#E8F5E8",
        background: "#F1F8E9",
        text: "#1B5E20",
      },
    },
  ];

  const handleThemeSelect = useCallback(
    async (themeId) => {
      scaleValue.value = withSpring(0.98, {
        damping: 25,
        stiffness: 600,
      });
      setTimeout(() => {
        scaleValue.value = withSpring(1, {
          damping: 25,
          stiffness: 600,
        });
      }, 100);

      setSelectedTheme(themeId);
      await toggleTheme(themeId);

      if (onThemeChange) {
        onThemeChange(themeId);
      }
    },
    [scaleValue, toggleTheme, onThemeChange]
  );

  const handleAutoTheme = useCallback(() => {
    const hour = new Date().getHours();
    const autoTheme = hour >= 6 && hour < 18 ? "claro" : "oscuro";
    handleThemeSelect(autoTheme);
  }, [handleThemeSelect]);

  const animatedStyle = useAnimatedStyle(() => {
    "worklet";
    return {
      transform: [{ scale: scaleValue.value }],
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
        autoButton: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: `${themeObject.colors.secondary}15`,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: themeObject.colors.secondary,
        },
        autoButtonText: {
          fontSize: 12,
          fontWeight: "500",
          color: themeObject.colors.secondary,
          marginLeft: 4,
        },
        currentThemeContainer: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 16,
          borderRadius: 12,
          marginBottom: 20,
          backgroundColor: `${themeObject.colors.primary}15`,
          borderLeftWidth: 4,
          borderLeftColor: themeObject.colors.primary,
        },
        currentThemeTitle: {
          fontSize: 14,
          fontWeight: "500",
          color: themeObject.colors.text,
          marginBottom: 2,
        },
        currentThemeName: {
          fontSize: 18,
          fontWeight: "bold",
          color: themeObject.colors.primary,
        },
        sectionTitle: {
          fontSize: 16,
          fontWeight: "600",
          color: themeObject.colors.text,
          marginBottom: 16,
        },
        themeOption: {
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          borderWidth: 2,
          borderColor: themeObject.colors.border,
          position: "relative",
          backgroundColor: themeObject.colors.surface,
        },
        themeOptionSelected: {
          borderColor: themeObject.colors.primary,
          backgroundColor: `${themeObject.colors.primary}10`,
          shadowColor: themeObject.colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 4,
        },
        themePreview: {
          height: 40,
          borderRadius: 8,
          overflow: "hidden",
          marginBottom: 12,
          flexDirection: "row",
        },
        previewColor: {
          flex: 1,
          height: "100%",
        },
        themeInfo: {
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 8,
        },
        themeIconContainer: {
          width: 32,
          height: 32,
          borderRadius: 16,
          justifyContent: "center",
          alignItems: "center",
          marginRight: 12,
        },
        themeName: {
          fontSize: 16,
          fontWeight: "600",
          color: themeObject.colors.text,
          flex: 1,
        },
        themeDescription: {
          fontSize: 12,
          color: themeObject.colors.onBackground,
          opacity: 0.7,
        },
        selectionIndicator: {
          position: "absolute",
          top: 12,
          right: 12,
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: themeObject.colors.primary,
          justifyContent: "center",
          alignItems: "center",
        },
        additionalSettings: {
          backgroundColor: `${themeObject.colors.surface}80`,
          borderRadius: 12,
          padding: 16,
          marginTop: 20,
          borderWidth: 1,
          borderColor: `${themeObject.colors.border}50`,
        },
        additionalTitle: {
          fontSize: 16,
          fontWeight: "600",
          color: themeObject.colors.text,
          marginBottom: 16,
        },
        settingRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: `${themeObject.colors.border}30`,
        },
        settingInfo: {
          flex: 1,
          marginRight: 16,
        },
        settingName: {
          fontSize: 14,
          fontWeight: "500",
          color: themeObject.colors.text,
          marginBottom: 2,
        },
        settingDescription: {
          fontSize: 12,
          color: themeObject.colors.onBackground,
          opacity: 0.7,
        },
      }),
    [themeObject.colors, isDesktop]
  );

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={dynamicStyles.container}
    >
      {/* Header del selector */}
      <View style={dynamicStyles.headerContainer}>
        <View style={dynamicStyles.iconContainer}>
          <Ionicons
            name="color-palette"
            size={20}
            color={themeObject.colors.primary}
          />
        </View>
        <Text style={dynamicStyles.title}>Personalización del Tema</Text>
        <Pressable onPress={handleAutoTheme} style={dynamicStyles.autoButton}>
          <Ionicons
            name="refresh"
            size={12}
            color={themeObject.colors.secondary}
          />
          <Text style={dynamicStyles.autoButtonText}>Auto</Text>
        </Pressable>
      </View>

      {/* Información del tema actual */}
      <Animated.View
        entering={FadeIn.delay(100).duration(400)}
        style={dynamicStyles.currentThemeContainer}
      >
        <View style={styles.currentThemeInfo}>
          <Text style={dynamicStyles.currentThemeTitle}>Tema Actual</Text>
          <Text style={dynamicStyles.currentThemeName}>
            {themes.find((t) => t.id === selectedTheme)?.name || "Claro"}
          </Text>
        </View>
        <View
          style={[
            dynamicStyles.themeIconContainer,
            { backgroundColor: themeObject.colors.primary },
          ]}
        >
          <Ionicons
            name={themes.find((t) => t.id === selectedTheme)?.icon || "sunny"}
            size={20}
            color={themeObject.colors.onPrimary || themeObject.colors.surface}
          />
        </View>
      </Animated.View>

      {/* Selector de temas */}
      <Text style={dynamicStyles.sectionTitle}>Seleccionar Tema</Text>

      <Animated.View style={animatedStyle}>
        {themes.map((themeItem, index) => (
          <Animated.View
            key={themeItem.id}
            entering={FadeIn.delay(200 + index * 100).duration(400)}
          >
            <Pressable
              onPress={() => handleThemeSelect(themeItem.id)}
              style={[
                dynamicStyles.themeOption,
                selectedTheme === themeItem.id &&
                  dynamicStyles.themeOptionSelected,
              ]}
            >
              {/* Preview del tema */}
              <View style={dynamicStyles.themePreview}>
                <View
                  style={[
                    dynamicStyles.previewColor,
                    { backgroundColor: themeItem.colors.primary },
                    { flex: 2 },
                  ]}
                />
                <View
                  style={[
                    dynamicStyles.previewColor,
                    { backgroundColor: themeItem.colors.surface },
                    { flex: 3 },
                  ]}
                />
                <View
                  style={[
                    dynamicStyles.previewColor,
                    { backgroundColor: themeItem.colors.background },
                    { flex: 2 },
                  ]}
                />
              </View>

              {/* Información del tema */}
              <View style={dynamicStyles.themeInfo}>
                <View
                  style={[
                    dynamicStyles.themeIconContainer,
                    { backgroundColor: themeItem.colors.primary },
                  ]}
                >
                  <Ionicons
                    name={themeItem.icon}
                    size={16}
                    color={themeItem.colors.surface}
                  />
                </View>
                <Text style={dynamicStyles.themeName}>{themeItem.name}</Text>
              </View>
              <Text style={dynamicStyles.themeDescription}>
                {themeItem.description}
              </Text>

              {/* Indicador de selección */}
              {selectedTheme === themeItem.id && (
                <Animated.View
                  entering={FadeIn.duration(200)}
                  style={dynamicStyles.selectionIndicator}
                >
                  <Ionicons
                    name="checkmark"
                    size={16}
                    color={
                      themeObject.colors.onPrimary || themeObject.colors.surface
                    }
                  />
                </Animated.View>
              )}
            </Pressable>
          </Animated.View>
        ))}
      </Animated.View>

      {/* Configuraciones adicionales */}
      <Animated.View
        entering={FadeIn.delay(600).duration(400)}
        style={dynamicStyles.additionalSettings}
      >
        <Text style={dynamicStyles.additionalTitle}>
          Configuraciones Adicionales
        </Text>

        <View
          style={[
            dynamicStyles.settingRow,
            { borderBottomWidth: 0, marginBottom: 8 },
          ]}
        >
          <View style={dynamicStyles.settingInfo}>
            <Text style={dynamicStyles.settingName}>Modo Automático</Text>
            <Text style={dynamicStyles.settingDescription}>
              Cambiar tema según la hora del día
            </Text>
          </View>
          <Switch
            value={autoMode}
            onValueChange={setAutoMode}
            trackColor={{
              false: `${themeObject.colors.outline}50`,
              true: `${themeObject.colors.primary}80`,
            }}
            thumbColor={
              autoMode ? themeObject.colors.primary : themeObject.colors.surface
            }
          />
        </View>

        <View style={[dynamicStyles.settingRow, { borderBottomWidth: 0 }]}>
          <View style={dynamicStyles.settingInfo}>
            <Text style={dynamicStyles.settingName}>Seguir Sistema</Text>
            <Text style={dynamicStyles.settingDescription}>
              Usar el tema del sistema operativo
            </Text>
          </View>
          <Switch
            value={followSystem}
            onValueChange={setFollowSystem}
            trackColor={{
              false: `${themeObject.colors.outline}50`,
              true: `${themeObject.colors.primary}80`,
            }}
            thumbColor={
              followSystem
                ? themeObject.colors.primary
                : themeObject.colors.surface
            }
          />
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  currentThemeInfo: {
    flex: 1,
  },
});

export default ThemeSelector;
