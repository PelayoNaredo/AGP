import { useState } from "react";
import { Alert } from "react-native";
import { useAuth } from "../context/AuthContext";
import { httpFetch } from "../api/http";

const useAuthLogic = () => {
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // login
  const handleLogin = async (email, password) => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor, completa todos los campos.");
      return;
    }

    setIsSubmitting(true);

    try {
      await login({ email, contrasena: password }); // el contexto hace el fetch
    } catch (error) {
      console.error("Error en handleLogin:", error);
      Alert.alert(
        "Error",
        error.message || "Hubo un problema al iniciar sesión"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // register
  const register = async ({ email, nombre, contrasena }) => {
    const data = await httpFetch("/api/register", {
      method: "POST",
      body: { email, nombre, contrasena },
    });
    return data;
  };

  const handleRegister = async (email, name, password, confirmPassword) => {
    // validaciones…
    setIsSubmitting(true);
    try {
      await register({ email, nombre: name, contrasena: password });
      // al registrarte, auto‑login:
      await login({ email, contrasena: password });
    } catch (err) {
      Alert.alert("Error", err.message || "…");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleLogin,
    handleRegister,
    isSubmitting,
  };
};

export default useAuthLogic;
