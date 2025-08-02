import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Text, Modal } from "react-native";
import { Card } from "react-native-paper";
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
  SlideInRight,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useCompany } from "../../context/CompanyContext";
import useNotifications from "../../hooks/useNotifications";
import SettingsForm from "./SettingsForm";
import LogoUploader from "./LogoUploader";
import TimePickerSection from "./TimePickerSection";
import CustomButton from "../../components/customButton";
import LimitChecker from "../../components/LimitChecker";
import CompanyTestingPanel from "../../components/CompanyTestingPanel";
import ThemeSelector from "./ThemeSelector";
import useSettingsWithCache from "../../hooks/useSettings";

// Principal componente de configuración
const SettingsScreen = () => {
  const [showTestingPanel, setShowTestingPanel] = useState(false);
  const { themeObject } = useTheme();
  const { logout } = useAuth();
  const { company, settings: companySettings, loading, error } = useCompany();
  const { showConfirmDialog, showSuccess, showErrorNotification } =
    useNotifications();
  const { settings, isLoading, hasChanges, handleChange, saveSettings } =
    useSettingsWithCache();

  const handleThemeChange = (theme) => {
    // Solo actualizar el estado local para que se guarde con los otros cambios
    // El ThemeSelector ya se encarga de aplicar el tema inmediatamente
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
    <>
      <Animated.ScrollView
        entering={FadeInUp.duration(600).springify()}
        layout={Layout.springify()}
        style={[
          styles.container,
          { backgroundColor: themeObject.colors.background },
        ]}
      >
        <View style={styles.content}>
          {/* NUEVA SECCIÓN - Información de Empresa */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(500).springify()}
          >
            <Text
              style={[
                styles.sectionTitle,
                { color: themeObject.colors.primary },
              ]}
            >
              Información de la Empresa
            </Text>
            <Card
              style={[
                styles.companyCard,
                { backgroundColor: themeObject.colors.surface },
              ]}
            >
              <Card.Content>
                <Text
                  style={[
                    styles.companyName,
                    { color: themeObject.colors.text },
                  ]}
                >
                  {company.name}
                </Text>
                <Text
                  style={[styles.planText, { color: themeObject.colors.text }]}
                >
                  Plan: {company.subscription_plan.toUpperCase()}
                </Text>
              </Card.Content>
            </Card>
          </Animated.View>

          {/* NUEVA SECCIÓN - Límites del Plan */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(500).springify()}
          >
            <Text
              style={[
                styles.sectionTitle,
                { color: themeObject.colors.primary },
              ]}
            >
              Uso del Plan
            </Text>
            <LimitChecker resource="users" title="Usuarios" />
            <LimitChecker resource="clients" title="Clientes" />
            <LimitChecker resource="products" title="Productos" />
            <LimitChecker resource="storage" title="Almacenamiento" />
          </Animated.View>

          {/* PANEL DE TESTING COMPLETO (solo para desarrollo) */}
          {__DEV__ && (
            <Animated.View
              entering={FadeInDown.delay(250).duration(500).springify()}
            >
              <CustomButton
                onPress={() => setShowTestingPanel(true)}
                variant="outline"
                style={styles.testingPanelButton}
              >
                🧪 Abrir Panel de Testing
              </CustomButton>
            </Animated.View>
          )}

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
            <TimePickerSection
              settings={settings}
              handleChange={handleChange}
            />
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

      {/* Modal del Panel de Testing */}
      <Modal
        visible={showTestingPanel}
        animationType="slide"
        onRequestClose={() => setShowTestingPanel(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Panel de Testing</Text>
            <CustomButton
              onPress={() => setShowTestingPanel(false)}
              variant="outline"
              style={styles.closeButton}
            >
              ✕ Cerrar
            </CustomButton>
          </View>
          <CompanyTestingPanel />
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginVertical: 10,
    marginLeft: 8,
  },
  companyCard: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  companyName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  planText: {
    fontSize: 14,
    opacity: 0.7,
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
  testingPanelButton: {
    marginTop: 15,
    width: "98%",
    alignSelf: "center",
    backgroundColor: "#FF9800",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    backgroundColor: "#f44336",
    paddingHorizontal: 15,
  },
});

export default SettingsScreen;
