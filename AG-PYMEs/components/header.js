import React, { useState, useEffect, useCallback } from "react";
import { Text, View, StyleSheet, Pressable, Platform } from "react-native";
import { useTheme } from "../context/ThemeContext";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Services } from "../api";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import LogoImage from "./LogoImage";

const CustomHeader = ({ navigation: navProp, route, options, back }) => {
  const { theme, themeObject } = useTheme();
  const navigation = useNavigation();
  const [localTitle, setLocalTitle] = useState("");
  const [localLogo, setLocalLogo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAlertsCount, setPendingAlertsCount] = useState(0);
  const isSettingsScreen = route?.name === "Settings";
  const isAlertsScreen = route?.name === "Alerts";
  const nav = navProp || navigation;
  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const settings = await Services.Data.Settings.getById(1);

      if (settings?.nombre_local) {
        setLocalTitle(settings.nombre_local);
      }

      if (settings?.logo_local) {
        setLocalLogo(settings.logo_local);
      }
    } catch (error) {
      console.error("[Header] Error en fetchSettings:", error);
      setLocalTitle("Mi Negocio");
      setLocalLogo(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPendingAlerts = useCallback(async () => {
    try {
      const alerts = await Services.Data.Alerts.getAll();
      const pendingCount = alerts.filter(
        (alert) => alert.estado === "pendiente"
      ).length;
      setPendingAlertsCount(pendingCount);
    } catch (error) {
      console.error("[Header] Error al obtener alertas:", error);
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
    if (nav?.navigate) {
      nav.navigate("Settings");
    }
  };
  const handleAlerts = () => {
    if (nav?.navigate) {
      nav.navigate("Alerts");
    }
  };
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: themeObject.colors.background },
        {
          paddingTop: Platform.OS === "android" ? 45 : 40,
          paddingBottom: Platform.OS === "android" ? 4 : 16,
        },
      ]}
    >
      {/* Lado izquierdo - Logo + Título */}
      <View style={styles.leftSection}>
        {back && (
          <Pressable onPress={() => nav?.goBack?.()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={themeObject.colors.text} />
          </Pressable>
        )}
        {!back && (
          <View
            style={[
              styles.logoContainer,
              { backgroundColor: themeObject.colors.surface },
            ]}
          >
            <LogoImage
              logoUrl={localLogo}
              size={32}
              containerStyle={styles.logoImageContainer}
            />
          </View>
        )}
        {!isLoading && (
          <Text style={[styles.title, { color: themeObject.colors.text }]}>
            {options?.title || localTitle}
          </Text>
        )}
      </View>
      {/* Lado derecho - Iconos de acción */}
      {!isSettingsScreen && !isAlertsScreen && !back && (
        <View style={styles.rightSection}>
          <Pressable style={styles.iconButton} onPress={handleAlerts}>
            <View style={styles.alertIconContainer}>
              <Icon
                name="bell-outline"
                size={24}
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

          <Pressable style={styles.iconButton} onPress={handleSettings}>
            <Icon
              name="cog-outline"
              size={24}
              color={themeObject.colors.text}
            />
          </Pressable>
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
    gap: 12,
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
  title: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.5,
    fontVariant: "small-caps",
    color: "#2196F3",
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
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  alertBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 12,
  },
});

export default CustomHeader;
