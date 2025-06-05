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
        <Input placeholder="Nombre" value={name} onChangeText={setName} />
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
              handleRegister(email, name, password, confirmPassword);
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
  },  inputText: {
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
  },  button: {
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
});

export default LoginRegisterScreen;
