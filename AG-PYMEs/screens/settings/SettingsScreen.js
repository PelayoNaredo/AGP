import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Pressable,
  TextInput,
} from "react-native";
import {
  Card,
  IconButton,
  Chip,
  ProgressBar,
  Divider,
  HelperText,
} from "react-native-paper";
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useCompany } from "../../context/CompanyContext";
import useNotifications from "../../hooks/useNotifications";
import CustomButton from "../../components/customButton";
import ThemeSelector from "./ThemeSelector";
import LogoUploader from "./LogoUploader";
import TimePickerSection from "./TimePickerSection";
import useSettingsValidation from "../../hooks/useSettingsValidation";

const { width, height } = Dimensions.get("window");
const isTablet = width > 768;
const isDesktop = width > 1024;

// Componente de input mejorado con estilo consistente
const AnimatedInput = ({
  label,
  value,
  onChangeText,
  error,
  icon,
  placeholder,
  multiline = false,
  keyboardType = "default",
  maxLength,
  required = false,
  style = {},
  ...props
}) => {
  const { themeObject } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useSharedValue(0);
  const errorAnim = useSharedValue(0);

  useEffect(() => {
    focusAnim.value = withSpring(isFocused ? 1 : 0, {
      damping: 25,
      stiffness: 400,
    });
  }, [isFocused, focusAnim]);

  useEffect(() => {
    errorAnim.value = withSpring(error ? 1 : 0, {
      damping: 25,
      stiffness: 400,
    });
  }, [error, errorAnim]);

  const animatedStyle = useAnimatedStyle(() => {
    "worklet";
    const borderColor = error
      ? themeObject.colors.error
      : focusAnim.value
        ? themeObject.colors.primary
        : themeObject.colors.placeholder; // Usar placeholder que es más oscuro que border

    return {
      borderColor,
      borderWidth: focusAnim.value ? 2 : 1.5,
      shadowOpacity: focusAnim.value ? 0.1 : 0.05,
    };
  }, [
    error,
    themeObject.colors.error,
    themeObject.colors.primary,
    themeObject.colors.placeholder,
  ]);

  const errorStyle = useAnimatedStyle(() => {
    "worklet";
    return {
      opacity: errorAnim.value,
      transform: [{ translateY: errorAnim.value ? 0 : -10 }],
    };
  }, []);

  // Estilos dinámicos optimizados
  const inputDynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        inputWrapper: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: themeObject.colors.surface,
          borderRadius: 16,
          borderWidth: 1.5,
          borderColor: themeObject.colors.placeholder, // Usar placeholder que es más visible
          shadowColor: themeObject.colors.onSurface,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
          minHeight: multiline ? 80 : 56,
        },
        input: {
          flex: 1,
          paddingHorizontal: 16,
          paddingRight: 8,
          fontSize: 16,
          color: themeObject.colors.text,
          fontWeight: "400",
          textAlignVertical: multiline ? "top" : "center",
          borderWidth: 0, // Eliminar borde nativo
          borderColor: "transparent", // Asegurar que no hay color de borde
          outlineWidth: 0, // Para web
          outline: "none", // Para web
        },
        labelText: {
          fontSize: 14,
          color: themeObject.colors.onBackground,
          fontWeight: "500",
          marginBottom: 8,
        },
        requiredIndicator: {
          color: themeObject.colors.error,
          fontWeight: "600",
        },
        errorMessageText: {
          fontSize: 12,
          color: themeObject.colors.error,
          fontWeight: "500",
        },
        charCountText: {
          fontSize: 10,
          color: themeObject.colors.outline,
          textAlign: "right",
          marginTop: 4,
        },
      }),
    [themeObject.colors, multiline]
  );

  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[styles.inputContainer, style]}
    >
      <Text style={inputDynamicStyles.labelText}>
        {label}
        {required && (
          <Text style={inputDynamicStyles.requiredIndicator}> *</Text>
        )}
      </Text>
      <Animated.View style={[inputDynamicStyles.inputWrapper, animatedStyle]}>
        {icon && (
          <View style={styles.inputIcon}>
            <Ionicons
              name={icon}
              size={20}
              color={themeObject.colors.onBackground}
            />
          </View>
        )}
        <TextInput
          style={[inputDynamicStyles.input, icon && styles.inputWithIcon]}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          keyboardType={keyboardType}
          maxLength={maxLength}
          placeholderTextColor={themeObject.colors.placeholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoCorrect={false}
          spellCheck={false}
          underlineColorAndroid="transparent"
          selectionColor={themeObject.colors.primary}
          // Propiedades adicionales para eliminar completamente el borde nativo
          {...(Platform.OS === "web" && {
            outlineStyle: "none",
            outlineWidth: 0,
            border: "none",
            boxShadow: "none",
            WebkitAppearance: "none",
            MozAppearance: "none",
            appearance: "none",
          })}
          {...(Platform.OS === "android" && {
            borderWidth: 0,
            borderColor: "transparent",
            focusable: true,
          })}
          {...(Platform.OS === "ios" && {
            borderWidth: 0,
            borderColor: "transparent",
          })}
          {...props}
        />
      </Animated.View>
      {error && (
        <Animated.View style={[styles.errorMessage, errorStyle]}>
          <Text style={inputDynamicStyles.errorMessageText}>{error}</Text>
        </Animated.View>
      )}
      {maxLength && value && (
        <Text style={inputDynamicStyles.charCountText}>
          {value.length}/{maxLength}
        </Text>
      )}
    </Animated.View>
  );
};

// Componente de sección con estilo moderno
const SettingsSection = ({
  title,
  icon,
  children,
  delay = 0,
  collapsible = false,
}) => {
  const { themeObject } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const scaleAnim = useSharedValue(1);

  const handlePress = useCallback(() => {
    if (!collapsible) return;

    scaleAnim.value = withSpring(0.98, {
      damping: 25,
      stiffness: 600,
    });
    setTimeout(() => {
      scaleAnim.value = withSpring(1, {
        damping: 25,
        stiffness: 600,
      });
    }, 100);
    setIsCollapsed(!isCollapsed);
  }, [collapsible, isCollapsed, scaleAnim]);

  const animatedStyle = useAnimatedStyle(() => {
    "worklet";
    return {
      transform: [{ scale: scaleAnim.value }],
    };
  }, []);

  const sectionDynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        sectionCard: {
          backgroundColor: themeObject.colors.surface,
          borderRadius: 16,
          padding: 20,
          shadowColor: themeObject.colors.onSurface,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        },
        sectionHeader: {
          flexDirection: "row",
          alignItems: "center",
          marginBottom: isCollapsed ? 0 : 20,
          paddingVertical: collapsible ? 4 : 0,
        },
        sectionIconContainer: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: `${themeObject.colors.primary}15`,
          justifyContent: "center",
          alignItems: "center",
          marginRight: 16,
        },
        sectionTitle: {
          fontSize: isDesktop ? 20 : 18,
          fontWeight: "600",
          color: themeObject.colors.text,
          flex: 1,
        },
        collapseButton: {
          padding: 8,
        },
      }),
    [themeObject.colors, isCollapsed, collapsible, isDesktop]
  );

  return (
    <Animated.View
      entering={FadeIn.delay(delay).duration(400)}
      style={styles.sectionContainer}
    >
      <Animated.View style={[sectionDynamicStyles.sectionCard, animatedStyle]}>
        <Pressable
          onPress={handlePress}
          style={sectionDynamicStyles.sectionHeader}
          disabled={!collapsible}
        >
          <View style={sectionDynamicStyles.sectionIconContainer}>
            <Ionicons
              name={icon}
              size={20}
              color={themeObject.colors.primary}
            />
          </View>
          <Text style={sectionDynamicStyles.sectionTitle}>{title}</Text>
          {collapsible && (
            <View style={sectionDynamicStyles.collapseButton}>
              <Ionicons
                name={isCollapsed ? "chevron-down" : "chevron-up"}
                size={20}
                color={themeObject.colors.onBackground}
              />
            </View>
          )}
        </Pressable>
        {!isCollapsed && children}
      </Animated.View>
    </Animated.View>
  );
};

// Componente principal rediseñado con estilo moderno
const SettingsScreen = () => {
  const [saveProgress, setSaveProgress] = useState(0);
  const { themeObject } = useTheme();
  const { logout, user } = useAuth();
  const { company, settings: companySettings, loading, error } = useCompany();
  const { showConfirmDialog, showSuccess, showErrorNotification } =
    useNotifications();

  // Animaciones del contenedor
  const containerOpacity = useSharedValue(0);
  const containerTranslateY = useSharedValue(30);

  useEffect(() => {
    containerOpacity.value = withTiming(1, { duration: 400 });
    containerTranslateY.value = withSpring(0, {
      damping: 25,
      stiffness: 400,
    });
  }, []);

  const containerAnimatedStyle = useAnimatedStyle(() => {
    "worklet";
    return {
      opacity: containerOpacity.value,
      transform: [{ translateY: containerTranslateY.value }],
    };
  }, []);

  // Usar el hook de validaciones
  const {
    settings,
    validationErrors,
    isValid,
    hasChanges,
    isLoading,
    isSaving,
    updateField,
    loadSettings,
    saveSettings,
  } = useSettingsValidation(companySettings || {});

  // Cargar settings al montar el componente
  useEffect(() => {
    loadSettings();
  }, []);

  // Manejo de cambios con validación - MEMOIZADO
  const handleValidatedChange = useCallback(
    (field, value) => {
      updateField(field, value);
    },
    [updateField]
  );

  const handleThemeChange = useCallback(
    (theme) => {
      updateField("tema", theme);
    },
    [updateField]
  );

  const handleLogoChange = useCallback(
    (logoUrl) => {
      updateField("logo_local", logoUrl);
    },
    [updateField]
  );

  // Guardar con progreso y validación - MEMOIZADO
  const handleSave = useCallback(async () => {
    if (!isValid) {
      showErrorNotification("Por favor corrige los errores antes de guardar");
      return;
    }

    setSaveProgress(0);
    try {
      // Simular progreso
      const progressInterval = setInterval(() => {
        setSaveProgress((prev) => Math.min(prev + 0.1, 0.9));
      }, 100);

      const success = await saveSettings();

      clearInterval(progressInterval);
      if (success) {
        setSaveProgress(1);
        setTimeout(() => setSaveProgress(0), 2000);
      } else {
        setSaveProgress(0);
      }
    } catch (error) {
      setSaveProgress(0);
      showErrorNotification("Error al guardar la configuración");
    }
  }, [isValid, saveSettings, showErrorNotification]);

  const handleLogout = useCallback(() => {
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
  }, [logout, showConfirmDialog, showSuccess, showErrorNotification]);

  // Estilos dinámicos con el tema usando useMemo para optimización
  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: themeObject.colors.background,
        },
        headerContainer: {
          paddingHorizontal: isDesktop ? "20%" : isTablet ? "15%" : 20,
          paddingVertical: 30,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
        },
        headerTitle: {
          fontSize: isDesktop ? 32 : isTablet ? 28 : 24,
          fontWeight: "700",
          color: themeObject.colors.onPrimary,
          textAlign: "center",
          marginBottom: 8,
        },
        headerSubtitle: {
          fontSize: isDesktop ? 18 : 16,
          color: themeObject.colors.onPrimary,
          textAlign: "center",
          opacity: 0.9,
          marginBottom: 20,
        },
        headerChips: {
          flexDirection: "row",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: 12,
        },
        headerChip: {
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 20,
          backgroundColor: themeObject.colors.surface,
        },
        headerChipText: {
          color: themeObject.colors.text,
          fontSize: 14,
          fontWeight: "500",
        },
        progressContainer: {
          marginBottom: 20,
          padding: 16,
          borderRadius: 12,
          backgroundColor: `${themeObject.colors.primary}10`,
        },
        progressBar: {
          height: 8,
          borderRadius: 4,
          backgroundColor: `${themeObject.colors.primary}20`,
          marginBottom: 8,
        },
        progressBarFill: {
          height: "100%",
          borderRadius: 4,
          backgroundColor: themeObject.colors.primary,
        },
        progressText: {
          textAlign: "center",
          fontSize: 14,
          fontWeight: "500",
          color: themeObject.colors.text,
        },
        changesIndicator: {
          padding: 16,
          borderRadius: 12,
          marginBottom: 20,
          alignItems: "center",
          backgroundColor: `${themeObject.colors.secondary}15`,
          borderLeftWidth: 4,
          borderLeftColor: themeObject.colors.secondary,
        },
        changesText: {
          fontSize: 14,
          fontWeight: "500",
          color: themeObject.colors.text,
        },
      }),
    [themeObject.colors, isDesktop, isTablet]
  );

  return (
    <KeyboardAvoidingView
      style={dynamicStyles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={[
          themeObject.colors.background,
          themeObject.colors.surface,
          themeObject.colors.card,
        ]}
        style={styles.gradientBackground}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.formContainer, containerAnimatedStyle]}>
            {/* Header moderno con información del usuario */}
            <Animated.View
              entering={FadeIn.duration(400)}
              style={styles.header}
            >
              <LinearGradient
                colors={[
                  themeObject.colors.primary,
                  `${themeObject.colors.primary}CC`,
                ]}
                style={dynamicStyles.headerContainer}
              >
                <Text style={dynamicStyles.headerTitle}>Configuración</Text>
                <Text style={dynamicStyles.headerSubtitle}>{user?.email}</Text>
                <View style={dynamicStyles.headerChips}>
                  <View style={dynamicStyles.headerChip}>
                    <View style={styles.chipContent}>
                      <Ionicons
                        name="business"
                        size={16}
                        color={themeObject.colors.primary}
                      />
                      <Text style={dynamicStyles.headerChipText}>
                        {company?.company_name || "Mi Empresa"}
                      </Text>
                    </View>
                  </View>
                  <View style={dynamicStyles.headerChip}>
                    <View style={styles.chipContent}>
                      <Ionicons
                        name="diamond"
                        size={16}
                        color={themeObject.colors.secondary}
                      />
                      <Text style={dynamicStyles.headerChipText}>
                        {company?.subscription_plan?.toUpperCase() || "BÁSICO"}
                      </Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>

            <View style={styles.formContent}>
              {/* Indicador de progreso de guardado */}
              {saveProgress > 0 && (
                <Animated.View
                  entering={FadeIn.duration(200)}
                  style={dynamicStyles.progressContainer}
                >
                  <View style={dynamicStyles.progressBar}>
                    <Animated.View
                      style={[
                        dynamicStyles.progressBarFill,
                        { width: `${saveProgress * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={dynamicStyles.progressText}>
                    {saveProgress === 1
                      ? "¡Guardado exitosamente!"
                      : "Guardando configuración..."}
                  </Text>
                </Animated.View>
              )}

              {/* Información Básica del Negocio */}
              <SettingsSection
                title="Información del Negocio"
                icon="storefront"
                delay={100}
              >
                <AnimatedInput
                  label="Nombre del Local"
                  value={settings.nombre_local || ""}
                  onChangeText={(value) =>
                    handleValidatedChange("nombre_local", value)
                  }
                  error={validationErrors.nombre_local}
                  icon="store"
                  placeholder="Ej: Mi Tienda"
                  maxLength={100}
                  required
                />

                <AnimatedInput
                  label="Dirección"
                  value={settings.direccion || ""}
                  onChangeText={(value) =>
                    handleValidatedChange("direccion", value)
                  }
                  error={validationErrors.direccion}
                  icon="location"
                  placeholder="Calle Principal 123, Ciudad"
                  multiline
                  maxLength={200}
                  required
                />

                <AnimatedInput
                  label="Teléfono"
                  value={settings.telefono || ""}
                  onChangeText={(value) =>
                    handleValidatedChange("telefono", value)
                  }
                  error={validationErrors.telefono}
                  icon="call"
                  placeholder="+34 123 456 789"
                  keyboardType="phone-pad"
                  maxLength={20}
                  required
                />
              </SettingsSection>

              {/* Información de la Empresa */}
              <SettingsSection
                title="Información Corporativa"
                icon="business"
                delay={200}
                collapsible
              >
                <AnimatedInput
                  label="Nombre de la Empresa"
                  value={settings.company_name || company?.company_name || ""}
                  onChangeText={(value) =>
                    handleValidatedChange("company_name", value)
                  }
                  error={validationErrors.company_name}
                  icon="business"
                  placeholder="Empresa SL"
                  maxLength={150}
                />

                <AnimatedInput
                  label="Email Corporativo"
                  value={settings.company_email || company?.company_email || ""}
                  onChangeText={(value) =>
                    handleValidatedChange("company_email", value)
                  }
                  error={validationErrors.company_email}
                  icon="mail"
                  placeholder="contacto@empresa.com"
                  keyboardType="email-address"
                  maxLength={100}
                />

                <AnimatedInput
                  label="Dirección de la Empresa"
                  value={
                    settings.company_address || company?.company_address || ""
                  }
                  onChangeText={(value) =>
                    handleValidatedChange("company_address", value)
                  }
                  error={validationErrors.company_address}
                  icon="location"
                  placeholder="Polígono Industrial 1, Nave 5"
                  multiline
                  maxLength={200}
                />

                <AnimatedInput
                  label="Teléfono Corporativo"
                  value={settings.company_phone || company?.company_phone || ""}
                  onChangeText={(value) =>
                    handleValidatedChange("company_phone", value)
                  }
                  error={validationErrors.company_phone}
                  icon="call"
                  placeholder="+34 987 654 321"
                  keyboardType="phone-pad"
                  maxLength={20}
                />

                <AnimatedInput
                  label="CIF/NIF"
                  value={settings.tax_id || company?.tax_id || ""}
                  onChangeText={(value) =>
                    handleValidatedChange("tax_id", value)
                  }
                  error={validationErrors.tax_id}
                  icon="card"
                  placeholder="B12345678"
                  maxLength={20}
                />
              </SettingsSection>

              {/* Configuración Financiera */}
              <SettingsSection
                title="Configuración Financiera"
                icon="card"
                delay={300}
              >
                <AnimatedInput
                  label="Moneda por Defecto"
                  value={settings.default_currency || "EUR"}
                  onChangeText={(value) =>
                    handleValidatedChange(
                      "default_currency",
                      value.toUpperCase()
                    )
                  }
                  error={validationErrors.default_currency}
                  icon="card"
                  placeholder="EUR"
                  maxLength={3}
                  required
                />

                <AnimatedInput
                  label="Tasa de Impuesto (%)"
                  value={settings.tax_rate?.toString() || "21"}
                  onChangeText={(value) => {
                    const numValue = parseFloat(value) || 0;
                    handleValidatedChange("tax_rate", numValue);
                  }}
                  error={validationErrors.tax_rate}
                  icon="calculator"
                  placeholder="21"
                  keyboardType="numeric"
                  required
                />
              </SettingsSection>

              {/* Horarios de Funcionamiento */}
              <SettingsSection
                title="Horarios de Funcionamiento"
                icon="time"
                delay={400}
              >
                <TimePickerSection
                  settings={settings}
                  handleChange={handleValidatedChange}
                />
                {validationErrors.horario_range && (
                  <Animated.View
                    entering={FadeIn.duration(200)}
                    style={styles.errorMessage}
                  >
                    <Text style={styles.errorText}>
                      {validationErrors.horario_range}
                    </Text>
                  </Animated.View>
                )}
              </SettingsSection>

              {/* Logo y Personalización */}
              <SettingsSection
                title="Logo y Personalización"
                icon="color-palette"
                delay={500}
              >
                <LogoUploader
                  onLogoChange={handleLogoChange}
                  currentLogo={settings.logo_local}
                />

                <View style={styles.divider} />

                <ThemeSelector onThemeChange={handleThemeChange} />
              </SettingsSection>

              {/* Indicador de cambios */}
              {hasChanges && (
                <Animated.View
                  entering={FadeIn.duration(200)}
                  style={dynamicStyles.changesIndicator}
                >
                  <View style={styles.changesContent}>
                    <Ionicons
                      name="warning"
                      size={16}
                      color={themeObject.colors.secondary}
                    />
                    <Text style={dynamicStyles.changesText}>
                      Tienes cambios sin guardar
                    </Text>
                  </View>
                </Animated.View>
              )}

              {/* Botones de Acción */}
              <Animated.View
                entering={FadeIn.delay(600).duration(400)}
                style={styles.actionButtons}
              >
                <CustomButton
                  onPress={handleSave}
                  variant={isValid ? "primary" : "outline"}
                  size="lg"
                  fullWidth
                  disabled={!hasChanges || !isValid || isLoading}
                  ionIconLeft="save"
                  loading={isLoading}
                  style={[styles.saveButton, !isValid && { opacity: 0.6 }]}
                >
                  {isValid ? "Guardar Cambios" : "Corregir Errores"}
                </CustomButton>

                <CustomButton
                  onPress={handleLogout}
                  variant="error"
                  size="lg"
                  fullWidth
                  ionIconLeft="log-out"
                  style={styles.logoutButton}
                >
                  Cerrar Sesión
                </CustomButton>
              </Animated.View>
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  // Layout styles - no dependen del tema
  gradientBackground: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: isDesktop ? "20%" : isTablet ? "15%" : 20,
    paddingVertical: 20,
  },
  formContainer: {
    width: "100%",
    maxWidth: isDesktop ? 800 : "100%",
    alignSelf: "center",
  },

  // Header layout
  header: {
    marginBottom: 30,
  },

  // Chip content layout
  chipContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  // Form layout
  formContent: {
    gap: 20,
  },

  // Input layout
  inputContainer: {
    marginBottom: 16,
  },
  inputIcon: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  errorMessage: {
    marginTop: 4,
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },

  // Section layout
  sectionContainer: {
    marginBottom: 20,
  },

  // Changes indicator layout
  changesContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  // Action buttons layout
  actionButtons: {
    gap: 12,
    marginTop: 20,
    marginBottom: 40,
  },
  saveButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  logoutButton: {
    borderRadius: 16,
  },

  // Divider
  divider: {
    marginVertical: 20,
    height: 1,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
});

export default SettingsScreen;
