import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import useNotifications from "./useNotifications";
import {
  validateLoginForm,
  validateRegisterForm,
  getErrorMessage,
} from "../utils/validations";

const useAuthLogic = () => {
  const { login, register } = useAuth();
  const { showError, showSuccess } = useNotifications();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Clear validation errors
  const clearValidationErrors = () => {
    setValidationErrors({});
  };

  // Login con validaciones mejoradas
  const handleLogin = async (email, password) => {
    clearValidationErrors();

    // Validar formulario
    const validation = validateLoginForm({ email, password });
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      showError(
        "Error de validación",
        "Por favor, corrige los errores en el formulario."
      );
      return false;
    }

    setIsSubmitting(true);

    try {
      console.log("🔐 Attempting login for:", email);
      await login({ email, contrasena: password });
      showSuccess("¡Bienvenido!", "Has iniciado sesión correctamente.");
      return true;
    } catch (error) {
      console.error("Error en handleLogin:", error);
      const errorMessage = getErrorMessage(error);
      showError("Error de inicio de sesión", errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Register con validaciones mejoradas - OPTIMIZADO para nuevo AuthContext
  const handleRegister = async (
    email,
    nombre,
    password,
    confirmPassword,
    companyData
  ) => {
    clearValidationErrors();

    // Crear objeto formData desde los parámetros
    const formData = {
      email,
      nombre,
      password,
      confirmPassword,
      mode: companyData.mode,
      companyName: companyData.companyName,
      companyCode: companyData.companyCode,
      subscriptionPlan: companyData.subscriptionPlan,
      invitationCode: companyData.invitationCode,
    };

    // Validar formulario completo
    const validation = validateRegisterForm(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      showError(
        "Error de validación",
        "Por favor, corrige los errores en el formulario."
      );
      return false;
    }

    setIsSubmitting(true);

    try {
      console.log(
        "📝 Attempting registration via new AuthContext:",
        formData.email
      );

      const registrationData = {
        email: formData.email,
        nombre: formData.nombre,
        contrasena: formData.password,
        mode: formData.mode || "create",
      };

      // Agregar datos específicos según el modo
      if (formData.mode === "create") {
        registrationData.companyData = {
          companyName: formData.companyName,
          subscriptionPlan: formData.subscriptionPlan || "basic",
          taxRate: 21.0,
          defaultCurrency: "EUR",
        };
      } else if (formData.mode === "join") {
        registrationData.invitationCode = formData.invitationCode;
      }

      // Usar el AuthContext refactorizado (ya usa Edge Functions directamente)
      const result = await register(registrationData);

      if (result && result.success) {
        showSuccess(
          "¡Registro exitoso!",
          formData.mode === "create"
            ? "Tu cuenta y empresa han sido creadas correctamente. Iniciando sesión..."
            : "Te has unido a la empresa correctamente. Iniciando sesión..."
        );

        // 🚀 HACER LOGIN AUTOMÁTICO DESPUÉS DEL REGISTRO EXITOSO
        console.log("🔄 Attempting automatic login after registration...");
        try {
          const loginResult = await login({
            email: formData.email,
            contrasena: formData.contrasena,
          });

          if (loginResult && loginResult.success) {
            console.log("✅ Automatic login after registration successful");
            return true;
          } else {
            console.log(
              "⚠️ Automatic login failed, but registration was successful"
            );
            showError(
              "Login automático falló",
              "El registro fue exitoso, pero el login automático falló. Por favor, inicia sesión manualmente."
            );
            return true; // El registro fue exitoso
          }
        } catch (loginError) {
          console.error("❌ Automatic login error:", loginError);
          showError(
            "Login automático falló",
            "El registro fue exitoso, pero el login automático falló. Por favor, inicia sesión manualmente."
          );
          return true; // El registro fue exitoso
        }
      }

      return false;
    } catch (error) {
      console.error("Error en handleRegister:", error);
      const errorMessage = getErrorMessage(error);
      showError("Error de registro", errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para validar email en tiempo real
  const validateEmailField = async (email) => {
    if (!email) return null;

    const emailValidation = validateLoginForm({ email, password: "dummy" });
    return emailValidation.errors.email || null;
  };

  // Función para verificar disponibilidad de código de empresa
  const checkCompanyCodeAvailability = async (companyCode) => {
    try {
      const { auth } = await import("../config/supabase");
      const result = await auth.checkCompanyCode(companyCode);
      return result.available;
    } catch (error) {
      console.error("Error checking company code:", error);
      return false;
    }
  };

  // Función para validar código de invitación
  const validateInvitationCode = async (invitationCode) => {
    try {
      const { auth } = await import("../config/supabase");
      const result = await auth.validateInvitation(invitationCode);
      return result.valid
        ? { valid: true, companyName: result.companyName }
        : { valid: false, message: result.message };
    } catch (error) {
      console.error("Error validating invitation:", error);
      return {
        valid: false,
        message: "Error validando el código de invitación",
      };
    }
  };

  return {
    handleLogin,
    handleRegister,
    isSubmitting,
    validationErrors,
    clearValidationErrors,
    validateEmailField,
    checkCompanyCodeAvailability,
    validateInvitationCode,
  };
};

export default useAuthLogic;
