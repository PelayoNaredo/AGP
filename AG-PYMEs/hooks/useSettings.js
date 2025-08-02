import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useUnifiedCache } from "../cache/hooks/useUnifiedCache";
import { Platform, Alert } from "react-native";
import { Services } from "../api";
import useNotifications from "./useNotifications";

const useSettingsWithCache = () => {
  const { theme, toggleTheme } = useTheme();
  // Desactivar auto-refresh para evitar conflictos con persistencia de tema
  const { get, invalidate } = useUnifiedCache({
    enableAutoRefresh: false,
    autoRefreshInterval: 0,
  });
  const { showError, showSuccess, showSimpleConfirm } = useNotifications();

  const [settings, setSettings] = useState({
    nombre_local: "",
    direccion: "",
    telefono: "",
    url_backend: "",
    horario_apertura: "08:00:00",
    horario_cierre: "18:00:00",
    logo_local: "",
    tema: "",
  });
  const [initialSettings, setInitialSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Cargar settings usando cache unificado
  const loadSettings = async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      // Usar el sistema unificado de cache para obtener settings
      const setting = await get(
        "settings_1", // clave única para settings
        async () => {
          return await Services.Data.Settings.getById(1);
        },
        "settings", // tipo de datos
        forceRefresh
      );

      if (setting) {
        // Obtener tema actual del localStorage para preservarlo
        const currentTheme = await Services.Storage.Base.getItem("appTheme");

        const newSettings = {
          ...setting,
          // PRESERVAR el tema del localStorage, no usar el de la API
          tema: currentTheme || setting.tema || "claro",
        };

        // Asegurarnos de que todas las propiedades tienen un valor predeterminado
        if (!newSettings.nombre_local) newSettings.nombre_local = "";
        if (!newSettings.direccion) newSettings.direccion = "";
        if (!newSettings.telefono) newSettings.telefono = "";
        if (!newSettings.url_backend) newSettings.url_backend = "";
        if (!newSettings.horario_apertura)
          newSettings.horario_apertura = "08:00:00";
        if (!newSettings.horario_cierre)
          newSettings.horario_cierre = "18:00:00";
        if (!newSettings.logo_local) newSettings.logo_local = "";

        setSettings(newSettings);
        setInitialSettings(newSettings);

        // REMOVIDO: No sincronizar tema automáticamente para evitar conflictos
        // El tema se maneja independientemente desde el ThemeSelector
      }
    } catch (error) {
      console.error(" [SETTINGS] Error loading settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []); // Array vacío para cargar solo una vez

  // Detectar cambios en settings
  useEffect(() => {
    if (initialSettings) {
      const settingsChanged =
        JSON.stringify(settings) !== JSON.stringify(initialSettings);
      setHasChanges(settingsChanged);
    }
  }, [settings, initialSettings]);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Alias para compatibilidad con useSettings
  const handleChange = async (name, value) => {
    const newSettings = {
      ...settings,
      [name]: value,
    };
    setSettings(newSettings);

    // Si el cambio es de tema, NO hacer nada especial aquí
    // El ThemeSelector ya maneja el cambio inmediato
    if (name === "tema") {
      // Invalidar cache de settings para evitar conflictos con auto-refresh
      invalidate("settings_1");

      // NO guardar en storage, solo actualizar el estado local
      // El ThemeContext ya se encarga de la persistencia
      return; // Salir temprano para evitar efectos secundarios
    }
  };

  const validateFields = () => {
    if (!settings.nombre_local || !settings.nombre_local.trim()) {
      showError("Error", "El nombre del local es requerido");
      return false;
    }
    if (!settings.direccion || !settings.direccion.trim()) {
      showError("Error", "La dirección es requerida");
      return false;
    }
    if (!settings.telefono || !settings.telefono.trim()) {
      showError("Error", "El teléfono es requerido");
      return false;
    }
    return true;
  };

  const resetSettings = () => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  };

  const saveSettings = async () => {
    if (!hasChanges) {
      return true;
    }

    // Validar campos antes de guardar
    if (!validateFields()) {
      return false;
    }

    setIsLoading(true);
    try {
      // Preparar settings para guardar con valores por defecto
      const settingsToSave = {
        ...settings,
        nombre_local: settings.nombre_local || "Negocio",
        direccion: settings.direccion || "Dirección",
        telefono: settings.telefono || "Teléfono",
        url_backend: settings.url_backend || "",
        horario_apertura: settings.horario_apertura || "08:00:00",
        horario_cierre: settings.horario_cierre || "18:00:00",
        logo_local: settings.logo_local || "",
        // NO incluir tema aquí - se maneja por separado
        // tema: settings.tema || "claro",
      };

      // Verificar si es una actualización o creación
      const existingSetting = await Services.Data.Settings.getById(1);
      if (existingSetting) {
        await Services.Data.Settings.update(1, settingsToSave);
      } else {
        await Services.Data.Settings.create(settingsToSave);
      }

      // Invalidar cache unificado para forzar actualización
      await invalidate("settings_1");

      // Actualizar settings iniciales
      setInitialSettings(settingsToSave);
      setHasChanges(false);

      // Asegurar sincronización de tema - SOLO si es diferente
      if (settingsToSave.tema && settingsToSave.tema !== theme) {
        console.log(
          "[useSettings] saveSettings - Sincronizando tema con contexto:",
          settingsToSave.tema
        );
        await toggleTheme(settingsToSave.tema);
      }

      // NO guardar tema en localStorage desde aquí - lo maneja ThemeContext

      showSuccess("Configuración guardada correctamente");
      return true;
    } catch (error) {
      console.error(" [SETTINGS] Error saving settings:", error);
      showError(
        "Error",
        error.message || "No se pudo guardar la configuración"
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const showUnsavedChangesAlert = () => {
    return new Promise((resolve) => {
      if (!hasChanges) {
        resolve(true);
        return;
      }

      showSimpleConfirm(
        "Cambios sin guardar",
        "Tienes cambios sin guardar. ¿Qué deseas hacer?",
        // onConfirm - Guardar
        async () => {
          try {
            await saveSettings();
            resolve(true);
          } catch (error) {
            resolve(false);
          }
        },
        // onCancel - Cancelar
        () => resolve(false)
      );
    });
  };

  // Función para refrescar settings forzando actualización
  const refreshSettings = async () => {
    await loadSettings(true);
  };

  return {
    settings,
    isLoading,
    hasChanges,
    updateSetting,
    handleChange, // Alias para compatibilidad con useSettings
    resetSettings,
    saveSettings,
    showUnsavedChangesAlert,
    refreshSettings,
    loadSettings,
  };
};

export default useSettingsWithCache;
