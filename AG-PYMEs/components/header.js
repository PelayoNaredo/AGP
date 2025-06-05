import React, { useState, useEffect, useCallback } from "react";
import {
  Text,
  View,
  StyleSheet,
  Pressable,
  Modal,
  Platform,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Services } from "../api";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import LogoImage from "./LogoImage";

const CustomHeader = ({ navigation: navProp, route, options, back }) => {
  const { theme, themeObject } = useTheme();
  const { logout } = useAuth();
  const navigation = useNavigation();
  const [localTitle, setLocalTitle] = useState("");
  const [localLogo, setLocalLogo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [menuDisabled, setMenuDisabled] = useState(false);

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

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleLogoPress = () => {
    if (!menuDisabled) {
      setShowMenu(true);
    }
  };

  const handleLogout = async () => {
    setShowMenu(false);
    await logout();
  };

  const handleSettings = () => {
    setShowMenu(false);
    if (nav?.navigate) {
      nav.navigate("Settings");
    }
  };

  const handleAlerts = () => {
    setShowMenu(false);
    if (nav?.navigate) {
      nav.navigate("Alerts");
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: themeObject.colors.background },
        { paddingTop: Platform.OS === "android" ? 30 : 24 },
      ]}
    >
      {back && (
        <Icon
          name="arrow-left"
          size={24}
          color={themeObject.colors.text}
          onPress={() => nav?.goBack?.()}
          style={styles.backButton}
        />
      )}

      {!isLoading && (
        <Text style={[styles.title, { color: themeObject.colors.text }]}>
          {options?.title || localTitle}
        </Text>
      )}

      {!isSettingsScreen && !isAlertsScreen && (
        <Pressable
          style={[
            styles.imageContainer,
            { backgroundColor: themeObject.colors.surface },
            menuDisabled && styles.imageContainerDisabled,
          ]}
          onPress={handleLogoPress}
          disabled={menuDisabled}
        >
          <LogoImage
            logoUrl={localLogo}
            size={40}
            containerStyle={styles.logoContainer}
          />
        </Pressable>
      )}

      {!isSettingsScreen && !isAlertsScreen && (
        <Modal
          visible={showMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMenu(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowMenu(false)}
          >
            <View
              style={[
                styles.menuContainer,
                { backgroundColor: themeObject.colors.surface },
              ]}
            >
              <Pressable style={styles.menuItem} onPress={handleAlerts}>
                <Icon
                  name="bell-outline"
                  size={24}
                  color={themeObject.colors.text}
                />
                <Text
                  style={[styles.menuText, { color: themeObject.colors.text }]}
                >
                  Alertas
                </Text>
              </Pressable>
              <Pressable style={styles.menuItem} onPress={handleSettings}>
                <Icon name="cog" size={24} color={themeObject.colors.text} />
                <Text
                  style={[styles.menuText, { color: themeObject.colors.text }]}
                >
                  Configuración
                </Text>
              </Pressable>
              <Pressable style={styles.menuItem} onPress={handleLogout}>
                <Icon name="logout" size={24} color={themeObject.colors.text} />
                <Text
                  style={[styles.menuText, { color: themeObject.colors.text }]}
                >
                  Cerrar sesión
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
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
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.5,
    flex: 1,
    left: 18,
    textAlign: "center",
    marginHorizontal: 12,
    fontVariant: "small-caps",
  },
  imageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,

    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  logoContainer: {
    borderWidth: 0,
  },
  profilePlaceholder: {
    opacity: 0.8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuContainer: {
    position: "absolute",
    top: 60,
    right: 20,
    borderRadius: 8,
    padding: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 8,
  },
  menuText: {
    fontSize: 16,
  },
  imageContainerDisabled: {
    opacity: 0.7,
  },
});

export default CustomHeader;
