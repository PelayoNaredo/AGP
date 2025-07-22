import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
  SlideInRight,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import useNotifications from "../../hooks/useNotifications";
import SettingsForm from "./SettingsForm";
import LogoUploader from "./LogoUploader";
import TimePickerSection from "./TimePickerSection";
import ThemeSelector from "./ThemeSelector";
import CustomButton from "../../components/customButton";
import useSettings from "../../hooks/useSettings";

// Principal componente de configuración
const SettingsScreen = () => {
  const { themeObject } = useTheme();
  const { logout } = useAuth();
  const { showConfirmDialog, showSuccess, showErrorNotification } =
    useNotifications();
  const { settings, isLoading, hasChanges, handleChange, saveSettings } =
    useSettings();

  const handleThemeChange = (theme) => {
    handleChange("tema", theme);
  };

  const handleLogoChange = (logoUrl) => {
    handleChange("logo_local", logoUrl);
  };

  const handleLogout = () => {
    showConfirmDialog(
      "Cerrar Sesión",
      "¿Estás seguro de que quieres cerrar sesión?",
      async () => {
        try {
          await logout();
          showSuccess("Sesión cerrada correctamente");
        } catch (error) {
          showErrorNotification("No se pudo cerrar la sesión");
        }
      },
      () => {},
      "Cerrar Sesión",
      "Cancelar"
    );
  };
  return (
    <Animated.ScrollView
      entering={FadeInUp.duration(600).springify()}
      layout={Layout.springify()}
      style={[
        styles.container,
        { backgroundColor: themeObject.colors.background },
      ]}
    >
      <View style={styles.content}>
        {/* Formulario sin animaciones */}
        <SettingsForm settings={settings} handleChange={handleChange} />
        {/* Logo uploader sin animaciones */}
        <LogoUploader
          onLogoChange={handleLogoChange}
          currentLogo={settings.logo_local}
        />
        <Animated.View
          entering={FadeInDown.delay(300).duration(500).springify()}
        >
          <TimePickerSection settings={settings} handleChange={handleChange} />
        </Animated.View>
        <Animated.View
          entering={FadeInDown.delay(400).duration(500).springify()}
        >
          <ThemeSelector onThemeChange={handleThemeChange} />
        </Animated.View>
        <Animated.View
          entering={SlideInRight.delay(500).duration(600).springify()}
        >
          <CustomButton
            onPress={saveSettings}
            variant="info"
            disabled={!hasChanges}
            style={styles.saveButton}
            ionIconLeft="save-outline"
          >
            Guardar Cambios
          </CustomButton>
        </Animated.View>
        {/* Botón de cerrar sesión */}
        <Animated.View
          entering={SlideInRight.delay(600).duration(600).springify()}
        >
          <CustomButton
            onPress={handleLogout}
            variant="error"
            style={styles.logoutButton}
            ionIconLeft="log-out-outline"
          >
            Cerrar Sesión
          </CustomButton>
        </Animated.View>
      </View>
    </Animated.ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  saveButton: {
    marginTop: 15,
    width: "98%",
    alignSelf: "center",
  },
  logoutButton: {
    marginTop: 20,
    marginBottom: 20,
    width: "98%",
    alignSelf: "center",
  },
});

export default SettingsScreen;
