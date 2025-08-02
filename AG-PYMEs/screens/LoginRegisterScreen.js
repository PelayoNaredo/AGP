import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  Image,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  Easing,
} from "react-native-reanimated";
import useAuthLogic from "../hooks/handleLoginRegister";

const Input = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
}) => {
  return (
    <Animated.View entering={FadeIn.duration(500)} exiting={FadeOut}>
      <TextInput
        style={styles.inputText}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        placeholderTextColor="#999"
      />
    </Animated.View>
  );
};

const LoginRegisterScreen = () => {
  const { handleLogin, handleRegister, isSubmitting } = useAuthLogic();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");

  // Nuevos estados para empresa
  const [companyName, setCompanyName] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [subscriptionPlan, setSubscriptionPlan] = useState("basic");
  const [invitationCode, setInvitationCode] = useState("");
  const [registrationMode, setRegistrationMode] = useState("create"); // "create" o "join"

  // Función para generar código automático
  const generateCompanyCode = (name) => {
    return (
      name.toLowerCase().replace(/\s+/g, "").substring(0, 8) +
      Math.random().toString(36).substring(2, 6)
    );
  };

  const toggleRegister = () => {
    setIsRegistering(!isRegistering);
  };

  return (
    <View style={styles.container}>
      <Animated.View
        entering={SlideInDown.duration(500).easing(Easing.ease)}
        exiting={SlideOutDown}
        style={styles.logoContainer}
      >
        <Image
          source={require("../assets/images/App-logo.svg")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.Text
        entering={SlideInDown.duration(500).easing(Easing.ease)}
        exiting={SlideOutDown}
        style={styles.title}
      >
        {isRegistering ? "Registrarse" : "Iniciar sesión"}
      </Animated.Text>

      {isRegistering && (
        <>
          <Input placeholder="Nombre" value={name} onChangeText={setName} />

          {/* Selector de modo de registro */}
          <Animated.View
            entering={FadeIn.duration(500)}
            style={styles.modeSelector}
          >
            <Text style={styles.modeSelectorTitle}>
              ¿Cómo quieres registrarte?
            </Text>
            <View style={styles.modeButtons}>
              <Pressable
                style={[
                  styles.modeButton,
                  registrationMode === "create" && styles.modeButtonActive,
                ]}
                onPress={() => setRegistrationMode("create")}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    registrationMode === "create" &&
                      styles.modeButtonTextActive,
                  ]}
                >
                  Crear nueva empresa
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modeButton,
                  registrationMode === "join" && styles.modeButtonActive,
                ]}
                onPress={() => setRegistrationMode("join")}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    registrationMode === "join" && styles.modeButtonTextActive,
                  ]}
                >
                  Unirme a empresa
                </Text>
              </Pressable>
            </View>
          </Animated.View>

          {registrationMode === "create" ? (
            // Crear nueva empresa
            <>
              <Input
                placeholder="Nombre de la empresa"
                value={companyName}
                onChangeText={(text) => {
                  setCompanyName(text);
                  setCompanyCode(generateCompanyCode(text));
                }}
              />
              <Input
                placeholder="Código de empresa (único)"
                value={companyCode}
                onChangeText={setCompanyCode}
              />
              <Animated.View
                entering={FadeIn.duration(500)}
                style={styles.pickerContainer}
              >
                <Text style={styles.pickerLabel}>Plan de suscripción:</Text>
                <View style={styles.planButtons}>
                  {[
                    { label: "Básico (5 usuarios)", value: "basic" },
                    { label: "Pro (20 usuarios)", value: "pro" },
                    { label: "Enterprise (100 usuarios)", value: "enterprise" },
                  ].map((plan) => (
                    <Pressable
                      key={plan.value}
                      style={[
                        styles.planButton,
                        subscriptionPlan === plan.value &&
                          styles.planButtonActive,
                      ]}
                      onPress={() => setSubscriptionPlan(plan.value)}
                    >
                      <Text
                        style={[
                          styles.planButtonText,
                          subscriptionPlan === plan.value &&
                            styles.planButtonTextActive,
                        ]}
                      >
                        {plan.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Animated.View>
            </>
          ) : (
            // Unirse a empresa existente
            <Input
              placeholder="Código de invitación"
              value={invitationCode}
              onChangeText={setInvitationCode}
            />
          )}
        </>
      )}

      <Input
        placeholder="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      <Input
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {isRegistering && (
        <Input
          placeholder="Confirmar contraseña"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
      )}

      {isSubmitting ? (
        <ActivityIndicator size="small" color="#6200ee" />
      ) : (
        <Pressable
          style={({ pressed }) => [
            styles.button,
            {
              opacity: pressed ? 0.8 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
          onPress={() => {
            if (isRegistering && password !== confirmPassword) {
              setError("Las contraseñas no coinciden");
              return;
            }

            if (isRegistering) {
              // Preparar datos de empresa
              const companyData = {
                mode: registrationMode,
                companyName: registrationMode === "create" ? companyName : "",
                companyCode: registrationMode === "create" ? companyCode : "",
                subscriptionPlan:
                  registrationMode === "create" ? subscriptionPlan : "",
                invitationCode:
                  registrationMode === "join" ? invitationCode : "",
              };

              handleRegister(
                email,
                name,
                password,
                confirmPassword,
                companyData
              );
            } else {
              handleLogin(email, password);
            }
          }}
        >
          <Text style={styles.buttonText}>
            {isRegistering ? "Registrar" : "Iniciar sesión"}
          </Text>
        </Pressable>
      )}

      <Pressable onPress={toggleRegister}>
        {({ pressed }) => (
          <Text style={[styles.toggleText, { opacity: pressed ? 0.6 : 1 }]}>
            {isRegistering
              ? "¿Ya tienes cuenta? Inicia sesión"
              : "¿No tienes cuenta? Regístrate"}
          </Text>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#222831",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: 150,
    height: 150,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2196F3",
    marginBottom: 30,
    textAlign: "center",
  },
  inputText: {
    width: "100%",
    maxWidth: 450,
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    backgroundColor: "#eee",
    fontSize: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignSelf: "center",
  },
  button: {
    width: "100%",
    maxWidth: 450,
    height: 50,
    backgroundColor: "#2196F3",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    alignSelf: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  toggleText: {
    marginTop: 20,
    color: "#2196F3",
    textAlign: "center",
    fontSize: 16,
    textDecorationLine: "underline",
  },
  // Nuevos estilos para empresa
  modeSelector: {
    marginVertical: 15,
    width: "100%",
    maxWidth: 450,
    alignSelf: "center",
  },
  modeSelectorTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    textAlign: "center",
  },
  modeButtons: {
    flexDirection: "row",
    gap: 10,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#2196F3",
    backgroundColor: "transparent",
    alignItems: "center",
  },
  modeButtonActive: {
    backgroundColor: "#2196F3",
  },
  modeButtonText: {
    color: "#2196F3",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  modeButtonTextActive: {
    color: "#fff",
  },
  pickerContainer: {
    width: "100%",
    maxWidth: 450,
    alignSelf: "center",
    marginVertical: 10,
  },
  pickerLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  planButtons: {
    gap: 8,
  },
  planButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2196F3",
    backgroundColor: "transparent",
  },
  planButtonActive: {
    backgroundColor: "#2196F3",
  },
  planButtonText: {
    color: "#2196F3",
    fontSize: 14,
    textAlign: "center",
  },
  planButtonTextActive: {
    color: "#fff",
  },
});

export default LoginRegisterScreen;
