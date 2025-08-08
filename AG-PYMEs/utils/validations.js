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

// === VALIDACIONES PARA SETTINGS ===

export const validateBusinessName = (name) => {
  if (!name || !name.trim()) {
    return "El nombre del negocio es requerido";
  }
  if (name.trim().length < 2) {
    return "El nombre debe tener al menos 2 caracteres";
  }
  if (name.trim().length > 100) {
    return "El nombre no puede tener más de 100 caracteres";
  }
  return null;
};

export const validateAddress = (address) => {
  if (!address || !address.trim()) {
    return "La dirección es requerida";
  }
  if (address.trim().length < 5) {
    return "La dirección debe tener al menos 5 caracteres";
  }
  if (address.trim().length > 200) {
    return "La dirección no puede tener más de 200 caracteres";
  }
  return null;
};

export const validatePhone = (phone) => {
  if (!phone || !phone.trim()) {
    return "El teléfono es requerido";
  }

  // Permitir números con espacios, guiones y paréntesis
  const phoneRegex = /^[\+]?[\d\s\-\(\)]{7,20}$/;
  if (!phoneRegex.test(phone.trim())) {
    return "El formato del teléfono no es válido";
  }
  return null;
};

export const validateEmailCorporativo = (email) => {
  if (!email || !email.trim()) {
    return null; // Email corporativo es opcional
  }
  return validateEmail(email);
};

export const validateUrl = (url) => {
  if (!url || !url.trim()) {
    return null; // URL es opcional
  }
  try {
    new URL(url);
    return null;
  } catch {
    return "La URL no tiene un formato válido";
  }
};

export const validateCurrency = (currency) => {
  if (!currency || !currency.trim()) {
    return "La moneda es requerida";
  }

  const validCurrencies = [
    "EUR",
    "USD",
    "GBP",
    "JPY",
    "ARS",
    "MXN",
    "COP",
    "PEN",
    "CLP",
  ];
  if (!validCurrencies.includes(currency.toUpperCase())) {
    return "Moneda no válida. Use EUR, USD, ARS, etc.";
  }
  return null;
};

export const validateTaxRate = (rate) => {
  if (rate === undefined || rate === null || rate === "") {
    return "La tasa de impuesto es requerida";
  }

  const numRate = parseFloat(rate);
  if (isNaN(numRate)) {
    return "La tasa debe ser un número válido";
  }
  if (numRate < 0) {
    return "La tasa no puede ser negativa";
  }
  if (numRate > 100) {
    return "La tasa no puede ser mayor a 100%";
  }
  return null;
};

export const validateTime = (time) => {
  if (!time || !time.trim()) {
    return "La hora es requerida";
  }

  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(time)) {
    return "Formato de hora inválido (HH:MM)";
  }
  return null;
};

export const validateTimeRange = (startTime, endTime) => {
  const startError = validateTime(startTime);
  const endError = validateTime(endTime);

  if (startError) return { start: startError };
  if (endError) return { end: endError };

  // Convertir a minutos para comparar
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  if (startMinutes >= endMinutes) {
    return { range: "La hora de apertura debe ser menor que la de cierre" };
  }

  return null;
};

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

// Validación completa de formulario de settings
export const validateSettingsForm = (settings) => {
  const errors = {};

  // Información básica del negocio
  const businessNameError = validateBusinessName(settings.nombre_local);
  if (businessNameError) errors.nombre_local = businessNameError;

  const addressError = validateAddress(settings.direccion);
  if (addressError) errors.direccion = addressError;

  const phoneError = validatePhone(settings.telefono);
  if (phoneError) errors.telefono = phoneError;

  // Información de empresa (opcional)
  const companyEmailError = validateEmailCorporativo(settings.company_email);
  if (companyEmailError) errors.company_email = companyEmailError;

  // Configuración financiera
  const currencyError = validateCurrency(settings.default_currency);
  if (currencyError) errors.default_currency = currencyError;

  const taxError = validateTaxRate(settings.tax_rate);
  if (taxError) errors.tax_rate = taxError;

  // URL del backend (opcional)
  const urlError = validateUrl(settings.url_backend);
  if (urlError) errors.url_backend = urlError;

  // Horarios
  const timeRangeError = validateTimeRange(
    settings.horario_apertura,
    settings.horario_cierre
  );
  if (timeRangeError) {
    if (timeRangeError.start) errors.horario_apertura = timeRangeError.start;
    if (timeRangeError.end) errors.horario_cierre = timeRangeError.end;
    if (timeRangeError.range) errors.horario_range = timeRangeError.range;
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
