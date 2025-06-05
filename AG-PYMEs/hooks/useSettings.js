import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { Alert, Platform } from "react-native";
import { Services } from "../api/index";

const useSettings = () => {
  const { theme, toggleTheme } = useTheme();
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

  useEffect(() => {
    loadSettings();
  }, []);
  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const setting = await Services.Data.Settings.getById(1);
      if (setting) {
        const newSettings = {
          ...setting,
          tema: setting.tema || "claro",
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

        // Si el tema de la API es diferente al tema actual, aplicarlo
        if (newSettings.tema !== theme) {
          await toggleTheme(newSettings.tema);
        } // Sincronizar el tema en el almacenamiento local solo como respaldo
        if (Platform.OS === "web") {
          localStorage.setItem("appTheme", newSettings.tema);
        }
        await Services.Storage.Base.setItem("appTheme", newSettings.tema);
      }
    } catch (error) {
      console.error("Error cargando configuración:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleChange = async (name, value) => {
    const newSettings = {
      ...settings,
      [name]: value,
    };
    setSettings(newSettings);

    // Si el cambio es de tema, actualizarlo y guardar en la API
    if (name === "tema" && value !== theme) {
      try {
        // Asegurarse de que todos los campos requeridos estén presentes
        const settingsToSave = {
          ...newSettings,
          nombre_local: newSettings.nombre_local || "Negocio",
          direccion: newSettings.direccion || "Dirección",
          telefono: newSettings.telefono || "Teléfono",
          url_backend: newSettings.url_backend || "",
          horario_apertura: newSettings.horario_apertura || "08:00:00",
          horario_cierre: newSettings.horario_cierre || "18:00:00",
          logo_local: newSettings.logo_local || "",
        };

        // Primero aplicar el tema en la aplicación
        await toggleTheme(value); // Luego actualizar el tema en la API (en segundo plano)
        Services.Data.Settings.update(1, settingsToSave).catch((err) => {
          console.error("Error al actualizar tema en API:", err);
        });

        // Eliminamos la recarga completa de la página
      } catch (error) {
        console.error("Error al actualizar el tema:", error);
        Alert.alert(
          "Error",
          "No se pudo actualizar el tema. Por favor, inténtalo de nuevo."
        );
      }
    }

    if (initialSettings) {
      setHasChanges(
        JSON.stringify(newSettings) !==
          JSON.stringify({
            ...initialSettings,
            tema: newSettings.tema,
          })
      );
    }
  };
  const validateFields = () => {
    if (!settings.nombre_local || !settings.nombre_local.trim()) {
      Alert.alert("Error", "El nombre del local es requerido");
      return false;
    }
    if (!settings.direccion || !settings.direccion.trim()) {
      Alert.alert("Error", "La dirección es requerida");
      return false;
    }
    if (!settings.telefono || !settings.telefono.trim()) {
      Alert.alert("Error", "El teléfono es requerido");
      return false;
    }
    return true;
  };
  const saveSettings = async () => {
    if (!validateFields()) return;

    setIsLoading(true);
    try {
      const settingsToSave = {
        ...settings,
        // Asegurarnos de que todas las propiedades tengan valores válidos
        nombre_local: settings.nombre_local || "Negocio",
        direccion: settings.direccion || "Dirección",
        telefono: settings.telefono || "Teléfono",
        url_backend: settings.url_backend || "",
        horario_apertura: settings.horario_apertura || "08:00:00",
        horario_cierre: settings.horario_cierre || "18:00:00",
        logo_local: settings.logo_local || "",
        tema: settings.tema || "claro",
      };
      const existingSetting = await Services.Data.Settings.getById(1);
      if (existingSetting) {
        // Enviamos el objeto completo de configuración
        await Services.Data.Settings.update(1, settingsToSave);
      } else {
        await Services.Data.Settings.create(settingsToSave);
      }

      setInitialSettings(settingsToSave);
      setHasChanges(false);

      // Asegurarse de que el tema esté sincronizado después de guardar
      if (settingsToSave.tema && settingsToSave.tema !== theme) {
        await toggleTheme(settingsToSave.tema);
      }

      // Guardar en localStorage solo como respaldo
      if (Platform.OS === "web" && settingsToSave.tema) {
        localStorage.setItem("appTheme", settingsToSave.tema);
      }
      Alert.alert("Éxito", "Configuración guardada correctamente");

      // Aplicar el tema sin recargar la página
      // Nota: Eliminamos la recarga completa de la página
    } catch (error) {
      console.error("Error guardando ajustes:", error);
      Alert.alert(
        "Error",
        error.message || "No se pudo guardar la configuración"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return {
    settings,
    handleChange,
    saveSettings,
    isLoading,
    hasChanges,
  };
};

export default useSettings;
