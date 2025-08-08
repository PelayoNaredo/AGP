import React, { useState, useEffect, useCallback } from "react";
import {
  Text,
  View,
  StyleSheet,
  Pressable,
  Platform,
  Animated,
  Image,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import Icon from "react-native-vector-icons/Ionicons";
import { EdgeFunctions } from "../config/supabase"; // 🔄 USAR EDGE FUNCTIONS
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import LogoImage from "./LogoImage";
import logoImage from "../assets/logo.png";

const CustomHeader = ({ navigation: navProp, route, options, back }) => {
  const { theme, themeObject } = useTheme();
  const { logout } = useAuth();
  const navigation = useNavigation();
  const [localTitle, setLocalTitle] = useState("");
  const [localLogo, setLocalLogo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAlertsCount, setPendingAlertsCount] = useState(0);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [menuAnimation] = useState(new Animated.Value(0));
  const isSettingsScreen = route?.name === "Settings";
  const isAlertsScreen = route?.name === "Alerts";
  const nav = navProp || navigation;
  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("🔄 [Header] Fetching settings via Edge Functions...");

      // 🚀 USAR EDGE FUNCTIONS para obtener settings
      const response = await EdgeFunctions.settings.getById(1);

      console.log("📊 [Header] Settings response:", response);

      // ✅ MANEJAR FORMATO ENTERPRISE TEMPLATE
      let settings;
      if (response.success && response.data) {
        // Enterprise format: { success: true, data: {...} }
        settings = response.data;
        console.log("✅ [Header] Using Enterprise format settings");
      } else if (response && !response.success) {
        // Direct data format
        settings = response;
        console.log("✅ [Header] Using direct format settings");
      } else {
        console.log("⚠️ [Header] No settings found, using defaults");
        settings = null;
      }

      if (settings?.nombre_local) {
        setLocalTitle(settings.nombre_local);
        console.log("🏢 [Header] Local title set to:", settings.nombre_local);
      } else {
        setLocalTitle("Mi Negocio");
        console.log("🏢 [Header] Using default title: Mi Negocio");
      }

      if (settings?.logo_local) {
        setLocalLogo(settings.logo_local);
        console.log("🖼️ [Header] Local logo set");
      } else {
        setLocalLogo(null);
        console.log("🖼️ [Header] No local logo found");
      }
    } catch (error) {
      console.error("[Header] Error en fetchSettings:", error);
      console.error("[Header] Error details:", {
        name: error.name,
        message: error.message,
      });
      // 🎯 SIN ERROR - usar defaults siempre
      console.log("🏢 [Header] Settings failed, using defaults: Mi Negocio");
      setLocalTitle("Mi Negocio");
      setLocalLogo(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPendingAlerts = useCallback(async () => {
    try {
      console.log("🔄 [Header] Fetching alerts via Edge Functions...");

      // 🚀 USAR EDGE FUNCTIONS para obtener alertas
      const response = await EdgeFunctions.alerts.getAll();

      console.log("📊 [Header] Alerts response:", response);

      // ✅ MANEJAR FORMATO ENTERPRISE TEMPLATE
      let alerts;
      if (response.success && response.data) {
        // Enterprise format: { success: true, data: [...] }
        alerts = response.data;
        console.log("✅ [Header] Using Enterprise format alerts");
      } else if (Array.isArray(response)) {
        // Direct array format
        alerts = response;
        console.log("✅ [Header] Using direct array format alerts");
      } else {
        console.log("⚠️ [Header] No alerts found");
        alerts = [];
      }

      const pendingCount = alerts.filter(
        (alert) => alert.estado === "pendiente"
      ).length;

      setPendingAlertsCount(pendingCount);
      console.log("🔔 [Header] Pending alerts count:", pendingCount);
    } catch (error) {
      console.error("[Header] Error al obtener alertas:", error);
      console.error("[Header] Alerts error details:", {
        name: error.name,
        message: error.message,
      });
      setPendingAlertsCount(0);
    }
  }, []);
  useEffect(() => {
    fetchSettings();
    fetchPendingAlerts();
  }, [fetchSettings, fetchPendingAlerts]);

  // Actualizar alertas cuando el componente esté enfocado
  useFocusEffect(
    useCallback(() => {
      fetchPendingAlerts();
    }, [fetchPendingAlerts])
  );

  const handleSettings = () => {
    setIsMenuExpanded(false);
    // Forzar la animación inmediatamente
    Animated.timing(menuAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();

    if (nav?.navigate) {
      nav.navigate("Settings");
    }
  };

  const handleAlerts = () => {
    setIsMenuExpanded(false);
    // Forzar la animación inmediatamente
    Animated.timing(menuAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();

    if (nav?.navigate) {
      nav.navigate("Alerts");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsMenuExpanded(false);
    } catch (error) {
      console.error("[Header] Error en logout:", error);
    }
  };

  const toggleMenu = () => {
    const toValue = isMenuExpanded ? 0 : 1;
    setIsMenuExpanded(!isMenuExpanded);

    Animated.timing(menuAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // Cerrar el menú automáticamente en ciertas pantallas
  useEffect(() => {
    if (isSettingsScreen || isAlertsScreen) {
      setIsMenuExpanded(false);
      // Forzar la animación a 0 para contraer completamente
      Animated.timing(menuAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [isSettingsScreen, isAlertsScreen, menuAnimation, route?.name]);

  const menuWidth = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [44, 220],
  });

  const menuBorderRadius = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [22, 22],
  });

  const logoPosition = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -82],
  });

  // Ocultar completamente el contenedor en pantallas restringidas
  const shouldShowMenu = !isSettingsScreen && !isAlertsScreen;
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: themeObject.colors.background },
        {
          paddingTop: Platform.OS === "android" ? 45 : 16,
          paddingBottom: Platform.OS === "android" ? 4 : 16,
        },
      ]}
    >
      {/* Lado izquierdo - Logo + Título */}
      <View style={styles.leftSection}>
        {back && (
          <Pressable onPress={() => nav?.goBack?.()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={themeObject.colors.text} />
          </Pressable>
        )}
        {!back && (
          <View
            style={[
              styles.logoContainer,
              { backgroundColor: themeObject.colors.surface },
            ]}
          >
            {/* usar png directamente */}
            <Image
              source={logoImage}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        )}
        {!isLoading && (
          <Text style={[styles.title, { color: themeObject.colors.text }]}>
            {options?.title || localTitle}
          </Text>
        )}
      </View>
      {/* Lado derecho - Menú de usuario */}
      {shouldShowMenu && (
        <View style={styles.rightSection}>
          <Animated.View
            style={[
              styles.userMenuContainer,
              {
                backgroundColor: themeObject.colors.surface,
                width: menuWidth,
                borderRadius: menuBorderRadius,
              },
            ]}
          >
            {isMenuExpanded && (
              <View style={styles.menuItems}>
                <Pressable style={styles.menuIconButton} onPress={handleAlerts}>
                  <View style={styles.alertIconContainer}>
                    <Icon
                      name="notifications-outline"
                      size={20}
                      color={themeObject.colors.text}
                    />
                    {pendingAlertsCount > 0 && (
                      <View
                        style={[
                          styles.alertBadge,
                          { backgroundColor: themeObject.colors.error },
                        ]}
                      >
                        <Text style={styles.alertBadgeText}>
                          {pendingAlertsCount > 99 ? "99+" : pendingAlertsCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </Pressable>

                <Pressable
                  style={styles.menuIconButton}
                  onPress={handleSettings}
                >
                  <Icon
                    name="settings-outline"
                    size={20}
                    color={themeObject.colors.text}
                  />
                </Pressable>

                <Pressable style={styles.menuIconButton} onPress={handleLogout}>
                  <Icon
                    name="log-out-outline"
                    size={20}
                    color={themeObject.colors.text}
                  />
                </Pressable>
              </View>
            )}

            <Pressable
              style={[
                styles.userIconButton,
                { transform: [{ translateX: logoPosition }] },
              ]}
              onPress={toggleMenu}
            >
              <LogoImage
                logoUrl={localLogo}
                size={32}
                containerStyle={styles.userLogoContainer}
              />
            </Pressable>
          </Animated.View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    zIndex: 10,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  logoContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginRight: 12,
  },
  logoImageContainer: {
    borderWidth: 0,
  },
  logoImage: {
    width: 32,
    height: 32,
  },
  userLogoImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.5,
    fontVariant: "small-caps",
    color: "#2196F3",
  },
  userMenuContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    paddingHorizontal: 0,
    overflow: "hidden",
    position: "relative",
    justifyContent: "center",
  },
  menuItems: {
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    left: 4,
    right: 52, // 44px (botón) + 6px (right) + 2px margen = 52px
    justifyContent: "space-evenly",
    height: 44,
  },
  menuIconButton: {
    padding: 6,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 32,
    minHeight: 32,
  },
  userIconButton: {
    padding: 6,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    right: 6,
    zIndex: 2,
    width: 32, // Reducido para ser más preciso
    height: 32,
  },
  userLogoContainer: {
    borderWidth: 0,
    borderRadius: 16,
    overflow: "hidden",
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  alertIconContainer: {
    position: "relative",
  },
  alertBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fff",
  },
  alertBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 10,
  },
});

export default CustomHeader;
