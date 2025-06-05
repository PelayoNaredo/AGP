import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import SettingsForm from "./SettingsForm";
import LogoUploader from "./LogoUploader";
import TimePickerSection from "./TimePickerSection";
import ThemeSelector from "./ThemeSelector";
import CustomButton from "../../components/customButton";
import useSettings from "../../hooks/useSettings";

// Principal componente de configuración
const SettingsScreen = () => {
  const { themeObject } = useTheme();
  const { settings, isLoading, hasChanges, handleChange, saveSettings } =
    useSettings();

  const handleThemeChange = (theme) => {
    handleChange("tema", theme);
  };

  const handleLogoChange = (logoUrl) => {
    handleChange("logo_local", logoUrl);
  };

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: themeObject.colors.background },
      ]}
    >
      <View style={styles.content}>
        <SettingsForm settings={settings} handleChange={handleChange} />
        <LogoUploader
          onLogoChange={handleLogoChange}
          currentLogo={settings.logo_local}
        />
        <TimePickerSection settings={settings} handleChange={handleChange} />
        <ThemeSelector onThemeChange={handleThemeChange} />
        <CustomButton
          onPress={saveSettings}
          variant="info"
          disabled={!hasChanges}
          style={styles.saveButton}
          ionIconLeft="save-outline"
        >
          Guardar Cambios
        </CustomButton>
      </View>
    </ScrollView>
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
});

export default SettingsScreen;
