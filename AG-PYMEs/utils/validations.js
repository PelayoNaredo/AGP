// Validaciones para formularios de autenticación
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    return "El email es requerido";
  }
  if (!emailRegex.test(email)) {
    return "El formato del email no es válido";
  }
  return null;
};

export const validatePassword = (password) => {
  if (!password) {
    return "La contraseña es requerida";
  }
  if (password.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres";
  }
  if (password.length > 72) {
    return "La contraseña no puede tener más de 72 caracteres";
  }
  return null;
};

export const validateStrongPassword = (password) => {
  const basicValidation = validatePassword(password);
  if (basicValidation) return basicValidation;

  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
  if (!strongPasswordRegex.test(password)) {
    return "La contraseña debe contener al menos: una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&)";
  }
  return null;
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) {
    return "Confirmar contraseña es requerido";
  }
  if (password !== confirmPassword) {
    return "Las contraseñas no coinciden";
  }
  return null;
};

export const validateName = (name) => {
  if (!name) {
    return "El nombre es requerido";
  }
  if (name.length < 2) {
    return "El nombre debe tener al menos 2 caracteres";
  }
  if (name.length > 100) {
    return "El nombre no puede tener más de 100 caracteres";
  }
  return null;
};

export const validateCompanyName = (companyName) => {
  if (!companyName) {
    return "El nombre de la empresa es requerido";
  }
  if (companyName.length < 2) {
    return "El nombre de la empresa debe tener al menos 2 caracteres";
  }
  if (companyName.length > 150) {
    return "El nombre de la empresa no puede tener más de 150 caracteres";
  }
  return null;
};

export const validateCompanyCode = (companyCode) => {
  if (!companyCode) {
    return "El código de empresa es requerido";
  }
  if (!/^[A-Za-z0-9-_]{3,20}$/.test(companyCode)) {
    return "El código debe tener entre 3-20 caracteres (letras, números, guiones)";
  }
  return null;
};

export const validateInvitationCode = (invitationCode) => {
  if (!invitationCode) {
    return "El código de invitación es requerido";
  }
  if (invitationCode.length < 6) {
    return "El código de invitación debe tener al menos 6 caracteres";
  }
  return null;
};

export const validateSubscriptionPlan = (plan) => {
  const validPlans = ["basic", "pro", "enterprise"];
  if (plan && !validPlans.includes(plan)) {
    return "Plan de suscripción no válido";
  }
  return null;
};

// Validación completa de formulario de login
export const validateLoginForm = (formData) => {
  const errors = {};

  const emailError = validateEmail(formData.email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(formData.password);
  if (passwordError) errors.password = passwordError;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Validación completa de formulario de registro
export const validateRegisterForm = (formData) => {
  const errors = {};

  const emailError = validateEmail(formData.email);
  if (emailError) errors.email = emailError;

  const nameError = validateName(formData.nombre);
  if (nameError) errors.nombre = nameError;

  const passwordError = validateStrongPassword(formData.password);
  if (passwordError) errors.password = passwordError;

  const confirmPasswordError = validateConfirmPassword(
    formData.password,
    formData.confirmPassword
  );
  if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;

  // Validaciones específicas según el modo
  if (formData.mode === "create") {
    const companyNameError = validateCompanyName(formData.companyName);
    if (companyNameError) errors.companyName = companyNameError;

    const planError = validateSubscriptionPlan(formData.subscriptionPlan);
    if (planError) errors.subscriptionPlan = planError;
  } else if (formData.mode === "join") {
    const invitationError = validateInvitationCode(formData.invitationCode);
    if (invitationError) errors.invitationCode = invitationError;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Función helper para mostrar errores en el frontend
export const getErrorMessage = (error) => {
  if (typeof error === "string") return error;

  if (error?.message) {
    const message = error.message.toLowerCase();

    // Mapear errores comunes de Supabase/EdgeFunctions
    if (message.includes("invalid login credentials")) {
      return "Email o contraseña incorrectos";
    }
    if (
      message.includes("email already registered") ||
      message.includes("already been registered")
    ) {
      return "Este email ya está registrado";
    }
    if (message.includes("invalid email format")) {
      return "El formato del email no es válido";
    }
    if (message.includes("password must be at least")) {
      return "La contraseña debe tener al menos 8 caracteres";
    }
    if (message.includes("company name is required")) {
      return "El nombre de la empresa es requerido";
    }
    if (message.includes("invitation code") && message.includes("invalid")) {
      return "El código de invitación no es válido o ha expirado";
    }
    if (message.includes("no authentication token")) {
      return "Error de autenticación. Por favor, intenta de nuevo";
    }

    return error.message;
  }

  return "Ha ocurrido un error inesperado";
};
