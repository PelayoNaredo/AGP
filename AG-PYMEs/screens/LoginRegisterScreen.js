import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import useAuthLogic from "../hooks/handleLoginRegister";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import CustomButton from "../components/customButton";

const { width, height } = Dimensions.get("window");
const isTablet = width > 768;
const isDesktop = width > 1024;

// Componente Input mejorado con animaciones y estados
const AnimatedInput = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = "default",
  icon,
  error,
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

  // Efecto para manejar autofill en web - OPTIMIZADO para evitar bucles
  useEffect(() => {
    if (Platform.OS === "web") {
      const styleId = "autofill-override";
      // Solo agregar una vez al montar el componente
      if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.innerHTML = `
          input:-webkit-autofill,
          input:-webkit-autofill:hover,
          input:-webkit-autofill:focus,
          input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px transparent inset !important;
            -webkit-text-fill-color: inherit !important;
            background-color: transparent !important;
            color: inherit !important;
            transition: background-color 5000s ease-in-out 0s !important;
          }
          input:-moz-autofill {
            filter: none !important;
            background-color: transparent !important;
            color: inherit !important;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []); // Solo ejecutar una vez al montar

  const animatedStyle = useAnimatedStyle(() => {
    "worklet";
    const borderColor = error
      ? themeObject.colors.error
      : focusAnim.value
        ? themeObject.colors.primary
        : themeObject.colors.border;

    return {
      borderColor,
      borderWidth: focusAnim.value ? 2 : 1,
      shadowOpacity: focusAnim.value ? 0.1 : 0.05,
    };
  }, [
    error,
    themeObject.colors.error,
    themeObject.colors.primary,
    themeObject.colors.border,
  ]);

  const errorStyle = useAnimatedStyle(() => {
    "worklet";
    return {
      opacity: errorAnim.value,
      transform: [
        {
          translateY: errorAnim.value ? 0 : -10,
        },
      ],
    };
  }, []);

  // Generar estilos dinámicos para este componente usando useMemo para optimización
  const inputDynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        inputWrapper: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: themeObject.colors.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: themeObject.colors.border,
          shadowColor: themeObject.colors.onSurface,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        },
        input: {
          flex: 1,
          height: 50,
          paddingHorizontal: 16,
          paddingRight: 8, // Reducido para evitar solapamiento con el borde
          fontSize: 16,
          color: themeObject.colors.text,
          fontWeight: "400",
          borderWidth: 0, // Eliminar borde nativo para evitar doble borde
          // Estilos optimizados para manejar autocompletado del navegador en web
          ...(Platform.OS === "web" && {
            outlineStyle: "none",
            outlineWidth: 0,
            border: "none",
            WebkitAppearance: "none",
            MozAppearance: "none",
            appearance: "none",
            backgroundColor: "transparent",
          }),
        },
        errorMessageText: {
          fontSize: 14,
          color: themeObject.colors.error,
          fontWeight: "500",
        },
      }),
    [themeObject.colors]
  );

  // Callbacks optimizados para evitar recreaciones - MEMOIZADOS ESTÁTICAMENTE
  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);

  return (
    <Animated.View
      entering={FadeIn.duration(300)} // Simplificado
      style={styles.inputContainer}
    >
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
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          placeholderTextColor={themeObject.colors.placeholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
          // Propiedades optimizadas para mejor rendimiento
          autoComplete={
            keyboardType === "email-address"
              ? "email"
              : secureTextEntry
                ? "current-password"
                : "off"
          }
          textContentType={
            keyboardType === "email-address"
              ? "emailAddress"
              : secureTextEntry
                ? "password"
                : "none"
          }
          autoCorrect={false}
          spellCheck={false}
          underlineColorAndroid="transparent"
          // Desactivar animaciones innecesarias en iOS
          clearButtonMode="never"
          autoCapitalize={
            keyboardType === "email-address" ? "none" : "sentences"
          }
          {...props}
        />
      </Animated.View>
      {error && (
        <Animated.View style={[styles.errorMessage, errorStyle]}>
          <Text style={inputDynamicStyles.errorMessageText}>{error}</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
};

// Componente StepIndicator
const StepIndicator = ({ currentStep, totalSteps }) => {
  const { themeObject } = useTheme();

  // Generar estilos dinámicos para este componente usando useMemo
  const stepDynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        stepDot: {
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: `${themeObject.colors.onBackground}30`,
        },
        stepDotActive: {
          backgroundColor: themeObject.colors.primary,
          shadowColor: themeObject.colors.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.5,
          shadowRadius: 4,
          elevation: 4,
        },
      }),
    [themeObject.colors]
  );

  return (
    <View style={styles.stepIndicator}>
      {Array.from({ length: totalSteps }, (_, index) => (
        <Animated.View
          key={index}
          entering={FadeIn.delay(index * 50)} // Reducido el delay
          style={[
            stepDynamicStyles.stepDot,
            index <= currentStep && stepDynamicStyles.stepDotActive,
          ]}
        />
      ))}
    </View>
  );
};

// Componente SelectionCard
const SelectionCard = ({ title, subtitle, isSelected, onPress, icon }) => {
  const { themeObject } = useTheme();
  const scaleAnim = useSharedValue(1);

  const handlePress = useCallback(() => {
    scaleAnim.value = withSpring(0.95, {
      damping: 25,
      stiffness: 600,
    });
    // Programar el rebote de vuelta sin callback anidado
    setTimeout(() => {
      scaleAnim.value = withSpring(1, {
        damping: 25,
        stiffness: 600,
      });
    }, 100);
    onPress();
  }, [onPress, scaleAnim]);

  const animatedStyle = useAnimatedStyle(() => {
    "worklet";
    return {
      transform: [{ scale: scaleAnim.value }],
    };
  }, []);

  // Generar estilos dinámicos para este componente usando useMemo
  const cardDynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        selectionCard: {
          flexDirection: "row",
          alignItems: "center",
          padding: 20,
          backgroundColor: themeObject.colors.surface,
          borderRadius: 16,
          borderWidth: 2,
          borderColor: themeObject.colors.border,
        },
        selectionCardActive: {
          borderColor: themeObject.colors.primary,
          backgroundColor: `${themeObject.colors.primary}15`,
          shadowColor: themeObject.colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 4,
        },
        cardTitle: {
          fontSize: 18,
          fontWeight: "600",
          color: themeObject.colors.text,
          marginBottom: 4,
        },
        cardTitleActive: {
          color: themeObject.colors.primary,
        },
        cardSubtitle: {
          fontSize: 14,
          color: themeObject.colors.onBackground,
        },
        cardSubtitleActive: {
          color: themeObject.colors.primary,
        },
        cardCheckbox: {
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: themeObject.colors.border,
          justifyContent: "center",
          alignItems: "center",
        },
        cardCheckboxActive: {
          borderColor: themeObject.colors.primary,
          backgroundColor: themeObject.colors.primary,
        },
        checkmark: {
          color: themeObject.colors.onPrimary || themeObject.colors.surface,
          fontSize: 14,
          fontWeight: "bold",
        },
      }),
    [themeObject.colors]
  );

  return (
    <Pressable onPress={handlePress} style={styles.selectionCardPressable}>
      <Animated.View
        style={[
          cardDynamicStyles.selectionCard,
          isSelected && cardDynamicStyles.selectionCardActive,
          animatedStyle,
        ]}
      >
        <View style={styles.cardIcon}>
          <Ionicons
            name={icon}
            size={24}
            color={
              isSelected
                ? themeObject.colors.primary
                : themeObject.colors.onBackground
            }
          />
        </View>
        <View style={styles.cardContent}>
          <Text
            style={[
              cardDynamicStyles.cardTitle,
              isSelected && cardDynamicStyles.cardTitleActive,
            ]}
          >
            {title}
          </Text>
          <Text
            style={[
              cardDynamicStyles.cardSubtitle,
              isSelected && cardDynamicStyles.cardSubtitleActive,
            ]}
          >
            {subtitle}
          </Text>
        </View>
        <View
          style={[
            cardDynamicStyles.cardCheckbox,
            isSelected && cardDynamicStyles.cardCheckboxActive,
          ]}
        >
          {isSelected && <Text style={cardDynamicStyles.checkmark}>✓</Text>}
        </View>
      </Animated.View>
    </Pressable>
  );
};

// Componente PlanSelector
const PlanSelector = ({ selectedPlan, onSelectPlan }) => {
  const { themeObject } = useTheme();

  const plans = [
    {
      value: "basic",
      title: "Plan Básico",
      subtitle: "Hasta 5 usuarios",
      features: ["Gestión básica", "5 usuarios", "Soporte estándar"],
      price: "Gratis",
      popular: false,
    },
    {
      value: "pro",
      title: "Plan Pro",
      subtitle: "Hasta 20 usuarios",
      features: [
        "Todas las funciones",
        "20 usuarios",
        "Soporte prioritario",
        "Reportes avanzados",
      ],
      price: "$29/mes",
      popular: true,
    },
    {
      value: "enterprise",
      title: "Plan Enterprise",
      subtitle: "Hasta 100 usuarios",
      features: [
        "Funciones premium",
        "100 usuarios",
        "Soporte 24/7",
        "API personalizada",
      ],
      price: "$99/mes",
      popular: false,
    },
  ];

  // Generar estilos dinámicos para este componente usando useMemo
  const planDynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        planCard: {
          backgroundColor: themeObject.colors.surface,
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          borderWidth: 2,
          borderColor: themeObject.colors.border,
          position: "relative",
        },
        planCardActive: {
          borderColor: themeObject.colors.primary,
          backgroundColor: `${themeObject.colors.primary}10`,
          shadowColor: themeObject.colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 6,
        },
        planCardPopular: {
          borderColor: themeObject.colors.accent || themeObject.colors.primary,
        },
        popularBadge: {
          position: "absolute",
          top: -8,
          right: 16,
          backgroundColor:
            themeObject.colors.accent || themeObject.colors.primary,
          paddingHorizontal: 12,
          paddingVertical: 4,
          borderRadius: 12,
        },
        popularBadgeText: {
          color: themeObject.colors.onPrimary || themeObject.colors.surface,
          fontSize: 12,
          fontWeight: "600",
        },
        planTitle: {
          fontSize: 20,
          fontWeight: "700",
          color: themeObject.colors.text,
          marginBottom: 4,
        },
        planTitleActive: {
          color: themeObject.colors.primary,
        },
        planPrice: {
          fontSize: 24,
          fontWeight: "800",
          color: themeObject.colors.primary,
        },
        planSubtitle: {
          fontSize: 14,
          color: themeObject.colors.onBackground,
          marginBottom: 16,
        },
        planFeature: {
          fontSize: 14,
          color: themeObject.colors.onBackground,
          marginBottom: 4,
        },
      }),
    [themeObject.colors]
  );

  return (
    <View style={styles.planSelector}>
      {plans.map((plan, index) => (
        <Animated.View
          key={plan.value}
          entering={FadeIn.delay(index * 50)} // Reducido el delay
        >
          <Pressable
            style={[
              planDynamicStyles.planCard,
              selectedPlan === plan.value && planDynamicStyles.planCardActive,
              plan.popular && planDynamicStyles.planCardPopular,
            ]}
            onPress={() => onSelectPlan(plan.value)}
          >
            {plan.popular && (
              <View style={planDynamicStyles.popularBadge}>
                <Text style={planDynamicStyles.popularBadgeText}>
                  Más Popular
                </Text>
              </View>
            )}
            <View style={styles.planHeader}>
              <Text
                style={[
                  planDynamicStyles.planTitle,
                  selectedPlan === plan.value &&
                    planDynamicStyles.planTitleActive,
                ]}
              >
                {plan.title}
              </Text>
              <Text style={planDynamicStyles.planPrice}>{plan.price}</Text>
            </View>
            <Text style={planDynamicStyles.planSubtitle}>{plan.subtitle}</Text>
            <View style={styles.planFeatures}>
              {plan.features.map((feature, idx) => (
                <Text key={idx} style={planDynamicStyles.planFeature}>
                  • {feature}
                </Text>
              ))}
            </View>
          </Pressable>
        </Animated.View>
      ))}
    </View>
  );
};

const LoginRegisterScreen = () => {
  const { handleLogin, handleRegister, isSubmitting, validationErrors } =
    useAuthLogic();
  const { loading: authLoading } = useAuth();
  const { themeObject } = useTheme();

  // Estados principales
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");

  // Estados para empresa
  const [companyName, setCompanyName] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [subscriptionPlan, setSubscriptionPlan] = useState("basic");
  const [invitationCode, setInvitationCode] = useState("");
  const [registrationMode, setRegistrationMode] = useState("create");

  // Estados de UX
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAction, setCurrentAction] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Animaciones del contenedor - OPTIMIZADAS
  const containerOpacity = useSharedValue(0);
  const containerTranslateY = useSharedValue(30); // Reducido para menos movimiento

  useEffect(() => {
    // Animaciones más suaves y rápidas
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

  // Función para generar código automático - MEMOIZADA
  const generateCompanyCode = useCallback((name) => {
    if (!name) return "";
    return (
      name.toLowerCase().replace(/\s+/g, "").substring(0, 8) +
      Math.random().toString(36).substring(2, 6)
    );
  }, []);

  // Validaciones en tiempo real - MEMOIZADA para evitar recreaciones
  const getFieldError = useCallback(
    (field) => {
      if (validationErrors && validationErrors[field]) {
        return validationErrors[field];
      }
      return "";
    },
    [validationErrors]
  );

  // Función para avanzar en el registro por pasos - MEMOIZADA
  const nextStep = useCallback(() => {
    if (currentStep === 0) {
      // Validar datos básicos
      if (!email || !password || !name) {
        setError("Por favor, completa todos los campos");
        return;
      }
      if (isRegistering && password !== confirmPassword) {
        setError("Las contraseñas no coinciden");
        return;
      }
    }

    setError("");
    setCurrentStep(currentStep + 1);
  }, [currentStep, email, password, name, isRegistering, confirmPassword]);

  const prevStep = useCallback(() => {
    setError("");
    setCurrentStep(Math.max(0, currentStep - 1));
  }, [currentStep]);

  // Función mejorada de login con mejor UX
  const handleLoginPress = async () => {
    if (!email || !password) {
      setError("Por favor, completa todos los campos");
      return;
    }

    setIsProcessing(true);
    setCurrentAction("login");
    setError("");

    try {
      const success = await handleLogin(email, password);
      if (success) {
        // El AuthContext manejará la navegación automáticamente
        console.log("✅ Login successful - AuthContext will handle navigation");
      }
    } catch (error) {
      setError(error.message || "Error al iniciar sesión");
    } finally {
      setIsProcessing(false);
      setCurrentAction("");
    }
  };

  // Función mejorada de registro con mejor UX
  const handleRegisterPress = async () => {
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (!email || !password || !name) {
      setError("Por favor, completa todos los campos obligatorios");
      return;
    }

    if (registrationMode === "create" && !companyName) {
      setError("Por favor, ingresa el nombre de la empresa");
      return;
    }

    if (registrationMode === "join" && !invitationCode) {
      setError("Por favor, ingresa el código de invitación");
      return;
    }

    setIsProcessing(true);
    setCurrentAction("register");
    setError("");

    try {
      const companyData = {
        mode: registrationMode,
        companyName: registrationMode === "create" ? companyName : "",
        companyCode: registrationMode === "create" ? companyCode : "",
        subscriptionPlan: registrationMode === "create" ? subscriptionPlan : "",
        invitationCode: registrationMode === "join" ? invitationCode : "",
      };

      const success = await handleRegister(
        email,
        name,
        password,
        confirmPassword,
        companyData
      );
      if (success) {
        console.log(
          "✅ Registration successful - AuthContext will handle navigation"
        );
      }
    } catch (error) {
      setError(error.message || "Error al registrarse");
    } finally {
      setIsProcessing(false);
      setCurrentAction("");
    }
  };

  const toggleRegister = () => {
    setIsRegistering(!isRegistering);
    setCurrentStep(0);
    setError("");

    // Limpiar campos al cambiar modo
    if (!isRegistering) {
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setName("");
      setCompanyName("");
      setCompanyCode("");
      setInvitationCode("");
    }
  };

  // Loading state combinado
  const isLoading = isSubmitting || authLoading || isProcessing;

  // Determinar el total de pasos según el modo - MEMOIZADO
  const getTotalSteps = useCallback(() => {
    if (!isRegistering) return 1;
    return registrationMode === "create" ? 3 : 2;
  }, [isRegistering, registrationMode]);

  // Generar estilos dinámicos con el tema usando useMemo para optimización
  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: themeObject.colors.background,
        },
        logoContainer: {
          backgroundColor: `${themeObject.colors.primary}20`,
          shadowColor: themeObject.colors.primary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
          elevation: 8,
        },
        title: {
          fontSize: isDesktop ? 36 : isTablet ? 32 : 28,
          fontWeight: "700",
          color: themeObject.colors.text,
          textAlign: "center",
          letterSpacing: 0.5,
        },
        subtitle: {
          fontSize: isDesktop ? 18 : 16,
          color: themeObject.colors.onBackground,
          textAlign: "center",
          marginTop: 8,
          fontWeight: "400",
        },
        stepTitle: {
          fontSize: isDesktop ? 24 : 20,
          fontWeight: "600",
          color: themeObject.colors.text,
          textAlign: "center",
          marginBottom: 10,
        },
        stepDescription: {
          fontSize: 16,
          color: themeObject.colors.onBackground,
          textAlign: "center",
          marginBottom: 20,
        },
        sectionTitle: {
          fontSize: 18,
          fontWeight: "600",
          color: themeObject.colors.text,
          marginBottom: 15,
          marginTop: 10,
        },
        errorContainer: {
          backgroundColor: `${themeObject.colors.error}15`,
          borderLeftColor: themeObject.colors.error,
        },
        errorText: {
          color: themeObject.colors.error,
          fontSize: 14,
          fontWeight: "500",
          lineHeight: 20,
        },
        loadingContainer: {
          backgroundColor: `${themeObject.colors.surface}80`,
        },
        loadingText: {
          color: themeObject.colors.primary,
          fontSize: 16,
          fontWeight: "600",
          marginTop: 12,
          textAlign: "center",
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
            {/* Header con logo y título - ANIMACIÓN SIMPLIFICADA */}
            <Animated.View
              entering={FadeIn.duration(400)}
              style={styles.header}
            >
              <View style={styles.logoContainer}>
                <Image
                  source={require("../assets/images/App-logo.svg")}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <Text style={dynamicStyles.title}>
                {isRegistering ? "Crear Cuenta" : "Bienvenido"}
              </Text>
              <Text style={dynamicStyles.subtitle}>
                {isRegistering
                  ? "Únete a la revolución empresarial"
                  : "Accede a tu panel de gestión"}
              </Text>
            </Animated.View>

            {/* Indicador de pasos para registro - ANIMACIÓN SIMPLIFICADA */}
            {isRegistering && (
              <Animated.View entering={FadeIn.delay(200)}>
                <StepIndicator
                  currentStep={currentStep}
                  totalSteps={getTotalSteps()}
                />
              </Animated.View>
            )}

            {/* Formulario principal */}
            <View style={styles.formContent}>
              {/* Paso 0: Datos básicos - ANIMACIÓN SIMPLIFICADA */}
              {(!isRegistering || currentStep === 0) && (
                <Animated.View
                  key="step0"
                  entering={FadeIn.duration(300)}
                  style={styles.stepContainer}
                >
                  {isRegistering && (
                    <AnimatedInput
                      placeholder="Nombre completo"
                      value={name}
                      onChangeText={setName}
                      icon="person-outline"
                      error={getFieldError("name")}
                    />
                  )}

                  <AnimatedInput
                    placeholder="Correo electrónico"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    icon="mail-outline"
                    error={getFieldError("email")}
                    autoCapitalize="none"
                  />

                  <AnimatedInput
                    placeholder="Contraseña"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    icon="lock-closed-outline"
                    error={getFieldError("password")}
                  />

                  {isRegistering && (
                    <AnimatedInput
                      placeholder="Confirmar contraseña"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      icon="lock-closed-outline"
                      error={
                        password !== confirmPassword && confirmPassword
                          ? "Las contraseñas no coinciden"
                          : ""
                      }
                    />
                  )}
                </Animated.View>
              )}

              {/* Paso 1: Tipo de registro - ANIMACIÓN SIMPLIFICADA */}
              {isRegistering && currentStep === 1 && (
                <Animated.View
                  key="step1"
                  entering={FadeIn.duration(300)}
                  style={styles.stepContainer}
                >
                  <Text style={dynamicStyles.stepTitle}>
                    ¿Cómo quieres comenzar?
                  </Text>

                  <SelectionCard
                    title="Crear nueva empresa"
                    subtitle="Configura tu empresa desde cero"
                    icon="business-outline"
                    isSelected={registrationMode === "create"}
                    onPress={() => setRegistrationMode("create")}
                  />

                  <SelectionCard
                    title="Unirme a empresa"
                    subtitle="Usa un código de invitación"
                    icon="people-outline"
                    isSelected={registrationMode === "join"}
                    onPress={() => setRegistrationMode("join")}
                  />
                </Animated.View>
              )}

              {/* Paso 2: Configuración de empresa - ANIMACIÓN SIMPLIFICADA */}
              {isRegistering && currentStep === 2 && (
                <Animated.View
                  key="step2"
                  entering={FadeIn.duration(300)}
                  style={styles.stepContainer}
                >
                  {registrationMode === "create" ? (
                    <>
                      <Text style={dynamicStyles.stepTitle}>
                        Configura tu empresa
                      </Text>

                      <AnimatedInput
                        placeholder="Nombre de la empresa"
                        value={companyName}
                        onChangeText={(text) => {
                          setCompanyName(text);
                          setCompanyCode(generateCompanyCode(text));
                        }}
                        icon="business-outline"
                        error={getFieldError("companyName")}
                      />

                      <AnimatedInput
                        placeholder="Código de empresa (único)"
                        value={companyCode}
                        onChangeText={setCompanyCode}
                        icon="key-outline"
                        error={getFieldError("companyCode")}
                      />

                      <Text style={dynamicStyles.sectionTitle}>
                        Selecciona tu plan
                      </Text>
                      <PlanSelector
                        selectedPlan={subscriptionPlan}
                        onSelectPlan={setSubscriptionPlan}
                      />
                    </>
                  ) : (
                    <>
                      <Text style={dynamicStyles.stepTitle}>
                        Código de invitación
                      </Text>
                      <Text style={dynamicStyles.stepDescription}>
                        Ingresa el código que recibiste de tu empresa
                      </Text>

                      <AnimatedInput
                        placeholder="Código de invitación"
                        value={invitationCode}
                        onChangeText={setInvitationCode}
                        icon="ticket-outline"
                        error={getFieldError("invitationCode")}
                        autoCapitalize="characters"
                      />
                    </>
                  )}
                </Animated.View>
              )}

              {/* Mensajes de error - ANIMACIÓN SIMPLIFICADA */}
              {(error ||
                (validationErrors &&
                  Object.keys(validationErrors).length > 0)) && (
                <Animated.View
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(150)}
                  style={[styles.errorContainer, dynamicStyles.errorContainer]}
                >
                  {error && (
                    <View style={styles.errorWithIcon}>
                      <Ionicons
                        name="warning-outline"
                        size={16}
                        color={themeObject.colors.error}
                      />
                      <Text style={dynamicStyles.errorText}> {error}</Text>
                    </View>
                  )}
                  {validationErrors &&
                    Object.entries(validationErrors).map(
                      ([key, message], index) => (
                        <Text key={index} style={dynamicStyles.errorText}>
                          • {message}
                        </Text>
                      )
                    )}
                </Animated.View>
              )}

              {/* Loading state */}
              {/* Loading state - ANIMACIÓN SIMPLIFICADA */}
              {isLoading && (
                <Animated.View
                  entering={FadeIn.duration(150)}
                  style={[
                    styles.loadingContainer,
                    dynamicStyles.loadingContainer,
                  ]}
                >
                  {" "}
                  <ActivityIndicator
                    size="large"
                    color={themeObject.colors.primary}
                  />
                  <Text style={dynamicStyles.loadingText}>
                    {currentAction === "login" && "Iniciando sesión..."}
                    {currentAction === "register" && "Creando cuenta..."}
                    {currentAction === "validating" && "Validando datos..."}
                    {!currentAction && "Cargando..."}
                  </Text>
                </Animated.View>
              )}

              {/* Botones de acción - ANIMACIÓN SIMPLIFICADA */}
              {!isLoading && (
                <Animated.View
                  entering={FadeIn.duration(200)}
                  style={styles.actionButtons}
                >
                  {/* Botones de navegación para registro por pasos */}
                  {isRegistering && currentStep > 0 && (
                    <CustomButton
                      variant="outline"
                      size="lg"
                      onPress={prevStep}
                      ionIconLeft="arrow-back-outline"
                      style={styles.secondaryButton}
                    >
                      Anterior
                    </CustomButton>
                  )}

                  {/* Botón principal */}
                  <CustomButton
                    variant="primary"
                    size="lg"
                    fullWidth
                    onPress={
                      !isRegistering
                        ? handleLoginPress
                        : currentStep < getTotalSteps() - 1
                          ? nextStep
                          : handleRegisterPress
                    }
                    ionIconRight={
                      !isRegistering
                        ? undefined
                        : currentStep < getTotalSteps() - 1
                          ? "arrow-forward-outline"
                          : "sparkles-outline"
                    }
                    style={styles.primaryButton}
                  >
                    {!isRegistering
                      ? "Iniciar Sesión"
                      : currentStep < getTotalSteps() - 1
                        ? "Continuar"
                        : "Crear Cuenta"}
                  </CustomButton>
                </Animated.View>
              )}

              {/* Toggle entre login y registro - ANIMACIÓN SIMPLIFICADA */}
              <Animated.View entering={FadeIn.delay(300)}>
                <CustomButton
                  variant="link"
                  size="md"
                  fullWidth
                  onPress={toggleRegister}
                  style={styles.toggleContainer}
                >
                  {isRegistering
                    ? "¿Ya tienes cuenta? Inicia sesión"
                    : "¿No tienes cuenta? Regístrate gratis"}
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
    justifyContent: "center",
    paddingHorizontal: isDesktop ? "20%" : isTablet ? "15%" : 20,
    paddingVertical: 40,
  },
  formContainer: {
    width: "100%",
    maxWidth: isDesktop ? 500 : "100%",
    alignSelf: "center",
  },

  // Header layout
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoContainer: {
    width: isDesktop ? 120 : isTablet ? 100 : 80,
    height: isDesktop ? 120 : isTablet ? 100 : 80,
    marginBottom: 20,
    borderRadius: isDesktop ? 60 : isTablet ? 50 : 40,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: "70%",
    height: "70%",
  },

  // Step indicator layout
  stepIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 30,
    gap: 12,
  },

  // Form layout
  formContent: {
    gap: 20,
  },
  stepContainer: {
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

  // Selection cards layout
  selectionCardPressable: {
    marginBottom: 12,
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },

  // Plan selector layout
  planSelector: {
    gap: 12,
  },
  planPressable: {
    marginBottom: 12,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  planFeatures: {
    gap: 4,
  },

  // Navigation layout
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
    gap: 16,
  },
  switchModeContainer: {
    marginTop: 30,
    alignItems: "center",
  },

  // Missing layout styles
  errorContainer: {
    borderLeftWidth: 4,
    padding: 16,
    borderRadius: 12,
    marginVertical: 10,
  },
  errorWithIcon: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    borderRadius: 16,
    marginVertical: 20,
  },
  actionButtons: {
    gap: 12,
    marginTop: 20,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  secondaryButton: {
    borderRadius: 16,
  },
  toggleContainer: {
    marginTop: 30,
    alignItems: "center",
  },
});

export default LoginRegisterScreen;
