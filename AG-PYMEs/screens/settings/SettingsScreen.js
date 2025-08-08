import React from "react";
import { View, StyleSheet, ScrollView, Platform, Text } from "react-native";
import { Divider, List, Card, Chip } from "react-native-paper";
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
import ThemeSelector from "./ThemeSelector";
import CompanyInfoCard from "./CompanyInfoCard";
import CompanyInvitationsCard from "./CompanyInvitationsCard";
import CustomButton from "../../components/customButton";
import CompanyLimitsOverview from "../../components/CompanyLimitsDisplay";
import useSettingsWithCache from "../../hooks/useSettings";

// Principal componente de configuración con layout mejorado
const SettingsScreen = ({ navigation }) => {
  const { themeObject } = useTheme();
  const { logout } = useAuth();
  const { company } = useCompany();
  const { showConfirmDialog, showSuccess, showErrorNotification } =
    useNotifications();
  const { settings, isLoading, hasChanges, handleChange, saveSettings } =
    useSettingsWithCache();

  const isWeb = Platform.OS === "web";

  const handleThemeChange = (theme) => {
    handleChange("tema", theme);
  };

  const handleLogoChange = (logoUrl) => {
    handleChange("logo_local", logoUrl);
  };

  const handleCompanyManagement = () => {
    navigation.navigate("CompanySelection");
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
      contentContainerStyle={styles.scrollContent}
    >
      {/* Cabecera descriptiva */}
      <Card
        style={[
          styles.headerCard,
          { backgroundColor: themeObject.colors.surface },
        ]}
      >
        <Card.Title
          title="Ajustes"
          subtitle="Personaliza la app y la información de tu negocio"
        />
        {company && (
          <Card.Content style={styles.companyHeaderRow}>
            <Chip icon="domain" style={styles.companyChip}>
              {company.name}
            </Chip>
            {company.plan && (
              <Chip icon="star" mode="outlined" style={styles.planChip}>
                Plan: {String(company.plan).toUpperCase()}
              </Chip>
            )}
          </Card.Content>
        )}
      </Card>

      {/* Layout responsive optimizado para mejor balance visual */}
      <View style={[styles.grid, isWeb && styles.gridWeb]}>
        {/* Columna Izquierda - Configuración Personal y App */}
        <View style={[styles.col, isWeb && styles.leftCol]}>
          {/* Formulario */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(500).springify()}
          >
            <SettingsForm settings={settings} handleChange={handleChange} />
          </Animated.View>

          {/* Logo */}
          <Animated.View
            entering={FadeInDown.delay(150).duration(500).springify()}
          >
            <LogoUploader
              onLogoChange={handleLogoChange}
              currentLogo={settings.logo_local}
            />
          </Animated.View>

          {/* Horarios */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(500).springify()}
          >
            <TimePickerSection
              settings={settings}
              handleChange={handleChange}
            />
          </Animated.View>

          {/* Tema */}
          <Animated.View
            entering={FadeInDown.delay(250).duration(500).springify()}
          >
            <ThemeSelector onThemeChange={handleThemeChange} />
          </Animated.View>
        </View>

        {/* Columna Derecha - Información Empresa y Gestión */}
        <View style={[styles.col, isWeb && styles.rightCol]}>
          {/* Información Completa de Empresa desde BD */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(500).springify()}
          >
            <CompanyInfoCard navigation={navigation} />
          </Animated.View>

          {/* Límites del Plan */}
          <Animated.View
            entering={FadeInDown.delay(350).duration(500).springify()}
          >
            <CompanyLimitsOverview
              showTitle={true}
              compact={isWeb}
              onLimitPress={(resourceType) => {
                console.log("Limite seleccionado:", resourceType);
              }}
            />
          </Animated.View>

          {/* Invitaciones de Empresa */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(500).springify()}
          >
            <CompanyInvitationsCard navigation={navigation} />
          </Animated.View>
        </View>
      </View>

      {/* Barra de acciones */}
      <Animated.View
        entering={SlideInRight.delay(450).duration(600).springify()}
      >
        <Card
          style={[
            styles.actionBar,
            { backgroundColor: themeObject.colors.surface },
          ]}
        >
          <View style={[styles.actionRow, isWeb && styles.actionRowWeb]}>
            <CustomButton
              onPress={saveSettings}
              variant="info"
              disabled={!hasChanges}
              style={[styles.actionButton, styles.saveButton]}
              ionIconLeft="save-outline"
            >
              Guardar Cambios
            </CustomButton>
            <CustomButton
              onPress={handleLogout}
              variant="error"
              style={[styles.actionButton, styles.logoutButton]}
              ionIconLeft="log-out-outline"
            >
              Cerrar Sesión
            </CustomButton>
          </View>
        </Card>
      </Animated.View>
    </Animated.ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  headerCard: {
    margin: 10,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  companyHeaderRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    paddingBottom: 8,
  },
  companyChip: {
    marginTop: 4,
  },
  planChip: {
    marginTop: 4,
  },
  grid: {
    flexDirection: "column",
    paddingHorizontal: 4,
  },
  gridWeb: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  col: {
    flex: 1,
    minWidth: 0, // Importante para el texto wrapping
  },
  leftCol: {
    paddingRight: 4,
    minWidth: "45%", // Asegurar un ancho mínimo
  },
  rightCol: {
    paddingLeft: 4,
    minWidth: "45%", // Asegurar un ancho mínimo
  },
  section: {
    marginVertical: 8,
  },
  listItem: {
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 8,
    marginVertical: 2,
  },
  actionBar: {
    marginHorizontal: 10,
    marginTop: 16,
    borderRadius: 12,
    padding: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  actionRow: {
    flexDirection: "column",
    gap: 12,
  },
  actionRowWeb: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  actionButton: {
    alignSelf: "stretch",
    minHeight: 48,
  },
  saveButton: {
    flex: 1,
  },
  logoutButton: {
    flex: 1,
  },
});

export default SettingsScreen;
