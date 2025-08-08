import { useState, useEffect, useCallback } from "react";
import { validateSettingsForm } from "../utils/validations";
import useNotifications from "./useNotifications";
import { EdgeFunctions } from "../api";

// Hook personalizado para manejar settings con validaciones avanzadas
const useSettingsValidation = (initialSettings = {}) => {
  const [settings, setSettings] = useState({
    // Valores por defecto
    nombre_local: "",
    direccion: "",
    telefono: "",
    company_name: "",
    company_email: "",
    company_address: "",
    company_phone: "",
    default_currency: "EUR",
    tax_rate: 21,
    horario_apertura: "08:00",
    horario_cierre: "18:00",
    url_backend: "",
    logo_local: "",
    tema: "claro",
    ...initialSettings,
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [isValid, setIsValid] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialState, setInitialState] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { showSuccess, showErrorNotification } = useNotifications();

  // Inicializar estado inicial al cargar los settings
  useEffect(() => {
    if (Object.keys(initialSettings).length > 0 && !initialState) {
      setInitialState({ ...initialSettings });
      setSettings({ ...settings, ...initialSettings });
    }
  }, [initialSettings]);

  // Validación en tiempo real
  useEffect(() => {
    const validation = validateSettingsForm(settings);
    setValidationErrors(validation.errors);
    setIsValid(validation.isValid);
  }, [settings]);

  // Detectar cambios
  useEffect(() => {
    if (initialState) {
      const changed = JSON.stringify(settings) !== JSON.stringify(initialState);
      setHasChanges(changed);
    }
  }, [settings, initialState]);

  // Actualizar un campo específico
  const updateField = useCallback(
    (field, value) => {
      setSettings((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Limpiar error específico cuando el usuario empieza a corregir
      if (validationErrors[field]) {
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [validationErrors]
  );

  // Cargar settings desde el servidor
  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await EdgeFunctions.get("settings/1");

      if (response.success && response.data) {
        const loadedSettings = {
          ...settings,
          ...response.data,
        };

        setSettings(loadedSettings);
        setInitialState(loadedSettings);
        return loadedSettings;
      } else {
        // Si no hay settings, usar valores por defecto
        const defaultSettings = { ...settings };
        setInitialState(defaultSettings);
        return defaultSettings;
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      showErrorNotification("Error al cargar la configuración");
      return settings;
    } finally {
      setIsLoading(false);
    }
  }, [settings, showErrorNotification]);

  // Guardar settings en el servidor
  const saveSettings = useCallback(async () => {
    if (!isValid) {
      showErrorNotification("Por favor corrige los errores antes de guardar");
      return false;
    }

    setIsSaving(true);
    try {
      // Preparar datos para enviar
      const settingsToSave = {
        ...settings,
        // Asegurar que los valores numéricos sean números
        tax_rate: parseFloat(settings.tax_rate) || 0,
        // Limpiar strings
        nombre_local: settings.nombre_local?.trim() || "",
        direccion: settings.direccion?.trim() || "",
        telefono: settings.telefono?.trim() || "",
        company_name: settings.company_name?.trim() || "",
        company_email: settings.company_email?.trim() || "",
        company_address: settings.company_address?.trim() || "",
        company_phone: settings.company_phone?.trim() || "",
        default_currency: settings.default_currency?.toUpperCase() || "EUR",
      };

      // Intentar actualizar primero
      let response = await EdgeFunctions.put("settings/1", settingsToSave);

      // Si falla la actualización, intentar crear
      if (!response.success) {
        response = await EdgeFunctions.post("settings", settingsToSave);
      }

      if (response.success) {
        setInitialState({ ...settingsToSave });
        setHasChanges(false);
        showSuccess("Configuración guardada correctamente");
        return true;
      } else {
        throw new Error(response.error || "Error al guardar");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      showErrorNotification(
        error.message || "Error al guardar la configuración"
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [settings, isValid, showSuccess, showErrorNotification]);

  // Resetear a valores iniciales
  const resetSettings = useCallback(() => {
    if (initialState) {
      setSettings({ ...initialState });
      setValidationErrors({});
    }
  }, [initialState]);

  // Validar un campo específico
  const validateField = useCallback(
    (field, value) => {
      const tempSettings = { ...settings, [field]: value };
      const validation = validateSettingsForm(tempSettings);
      return validation.errors[field] || null;
    },
    [settings]
  );

  // Limpiar errores de validación
  const clearErrors = useCallback(() => {
    setValidationErrors({});
  }, []);

  // Obtener campos requeridos que están vacíos
  const getRequiredEmptyFields = useCallback(() => {
    const requiredFields = [
      "nombre_local",
      "direccion",
      "telefono",
      "default_currency",
      "tax_rate",
      "horario_apertura",
      "horario_cierre",
    ];

    return requiredFields.filter((field) => {
      const value = settings[field];
      return !value || (typeof value === "string" && !value.trim());
    });
  }, [settings]);

  // Calcular progreso de completitud
  const getCompletionProgress = useCallback(() => {
    const allFields = [
      "nombre_local",
      "direccion",
      "telefono",
      "company_name",
      "company_email",
      "company_address",
      "company_phone",
      "default_currency",
      "tax_rate",
      "horario_apertura",
      "horario_cierre",
      "url_backend",
      "logo_local",
    ];

    const completedFields = allFields.filter((field) => {
      const value = settings[field];
      return value && (typeof value !== "string" || value.trim());
    });

    return Math.round((completedFields.length / allFields.length) * 100);
  }, [settings]);

  return {
    // Estado
    settings,
    validationErrors,
    isValid,
    hasChanges,
    isLoading,
    isSaving,

    // Funciones
    updateField,
    loadSettings,
    saveSettings,
    resetSettings,
    validateField,
    clearErrors,

    // Utilidades
    getRequiredEmptyFields,
    getCompletionProgress,

    // Datos específicos
    requiredEmptyFields: getRequiredEmptyFields(),
    completionProgress: getCompletionProgress(),
  };
};

export default useSettingsValidation;
