import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Switch,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import ModalTemplate from "../../../components/modalTemplate";
import { Ionicons } from "@expo/vector-icons";
import CustomButton from "../../../components/customButton";
import CustomPicker from "../../../components/customPicker";
import { Services } from "../../../api";
import useNotifications from "../../../hooks/useNotifications";

// Componente ServiceModal para crear o editar servicios
const ServiceModal = ({ visible, onClose, service = null, onSave }) => {
  const { themeObject } = useTheme();
  const notifications = useNotifications();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nombre_servicio: "",
    descripcion: "",
    precio_base: "",
    tipo_tarifa: "fijo",
    duracion_estimada_minutos: "",
    categoria: "",
    requiere_profesional: true,
    activo: true,
  });
  const [serviceLevels, setServiceLevels] = useState([]);
  const [showServiceLevels, setShowServiceLevels] = useState(false);
  const tarifaOptions = [
    { label: "Fijo", value: "fijo" },
    { label: "Por hora", value: "por_hora" },
    { label: "Variable", value: "variable" },
    { label: "Por nivel", value: "por_nivel" },
    { label: "Mano de obra", value: "mano_obra" },
  ];
  const categoryInputRef = useRef(null);

  // Función para manejar el cambio de categoría
  const handleCategoryChange = (text) => {
    setFormData({ ...formData, categoria: text });
  };

  // Efecto para inicializar el formulario cuando se abre el modal
  useEffect(() => {
    if (visible) {
      if (service) {
        setIsEditing(true);
        setFormData({
          nombre_servicio: service.nombre_servicio || "",
          descripcion: service.descripcion || "",
          precio_base: service.precio_base?.toString() || "",
          tipo_tarifa: service.tipo_tarifa || "fijo",
          duracion_estimada_minutos:
            service.duracion_estimada_minutos?.toString() || "",
          categoria: service.categoria || "",
          requiere_profesional: service.requiere_profesional !== false,
          activo: service.activo !== false,
        });

        // Si el servicio tiene niveles, cargarlos
        if (service.id_servicio && service.tipo_tarifa === "por_nivel") {
          if (service.niveles && service.niveles.length > 0) {
            // Si ya tenemos los niveles en el objeto service, usarlos directamente
            setServiceLevels(
              service.niveles.map((nivel) => ({
                id_nivel: nivel.id_nivel,
                nombre_nivel: nivel.nombre_nivel,
                descripcion: nivel.descripcion || "",
                precio: nivel.precio?.toString() || "",
                tiempo_estimado_minutos:
                  nivel.tiempo_estimado_minutos?.toString() || "",
              }))
            );
            setShowServiceLevels(true);
          } else {
            // Si no, cargarlos desde la API
            fetchServiceLevels(service.id_servicio);
            setShowServiceLevels(true);
          }
        } else {
          setShowServiceLevels(service.tipo_tarifa === "por_nivel");
          setServiceLevels([]);
        }
      } else {
        resetForm();
      }
    }
  }, [visible, service]);

  // Función para cargar los niveles de servicio desde la API
  const fetchServiceLevels = async (serviceId) => {
    try {
      // Obtener los niveles del servicio
      const response = await Services.Data.Services.getById(serviceId);
      if (response.niveles && response.niveles.length > 0) {
        // Formatear los niveles para el estado
        const formattedLevels = response.niveles.map((nivel) => ({
          id_nivel: nivel.id_nivel,
          nombre_nivel: nivel.nombre_nivel,
          descripcion: nivel.descripcion || "",
          precio: nivel.precio?.toString() || "",
          tiempo_estimado_minutos:
            nivel.tiempo_estimado_minutos?.toString() || "",
        }));
        setServiceLevels(formattedLevels);
      } else {
        setServiceLevels([]);
      }
    } catch (error) {
      console.error("Error al cargar niveles de servicio:", error);
      setServiceLevels([]);
    }
  };

  // Función para reiniciar el formulario
  const resetForm = () => {
    setFormData({
      nombre_servicio: "",
      descripcion: "",
      precio_base: "",
      tipo_tarifa: "fijo",
      duracion_estimada_minutos: "",
      categoria: "",
      requiere_profesional: true,
      activo: true,
    });
    setServiceLevels([]);
    setShowServiceLevels(false);
    setIsEditing(false);
  };

  // Función para manejar el cambio de tipo de tarifa
  const handleTarifaChange = (value) => {
    setFormData({ ...formData, tipo_tarifa: value });
    setShowServiceLevels(value === "por_nivel");
  };

  // Función para guardar el servicio
  const handleSave = async () => {
    // Validación básica
    if (!formData.nombre_servicio.trim()) {
      notifications.showErrorNotification(
        "El nombre del servicio es obligatorio"
      );
      return;
    }

    if (!formData.precio_base.trim() || isNaN(Number(formData.precio_base))) {
      notifications.showErrorNotification(
        "El precio base debe ser un número válido"
      );
      return;
    }

    if (
      formData.duracion_estimada_minutos.trim() &&
      isNaN(Number(formData.duracion_estimada_minutos))
    ) {
      notifications.showErrorNotification(
        "La duración debe ser un número válido"
      );
      return;
    }

    // Validaciones específicas para servicios por nivel
    if (formData.tipo_tarifa === "por_nivel" && serviceLevels.length === 0) {
      notifications.showErrorNotification(
        "Debes añadir al menos un nivel para este tipo de tarifa"
      );
      return;
    }

    // Validar que los niveles tengan la información requerida
    if (formData.tipo_tarifa === "por_nivel") {
      const invalidLevels = serviceLevels.filter(
        (level) =>
          !level.nombre_nivel?.trim() ||
          !level.precio?.toString().trim() ||
          isNaN(parseFloat(level.precio))
      );
      if (invalidLevels.length > 0) {
        notifications.showErrorNotification(
          "Todos los niveles deben tener un nombre y un precio válido"
        );
        return;
      }
    }
    setLoading(true);
    try {
      // Preparar la data del servicio
      const serviceData = {
        ...formData,
        precio_base: Number(formData.precio_base),
        duracion_estimada_minutos: formData.duracion_estimada_minutos
          ? Number(formData.duracion_estimada_minutos)
          : 0,
      }; // Si el servicio es por nivel, incluir los niveles en la petición
      if (formData.tipo_tarifa === "por_nivel" && serviceLevels.length > 0) {
        // Procesar los niveles y añadirlos a los datos del servicio
        serviceData.niveles = serviceLevels.map((level) => ({
          nombre_nivel: level.nombre_nivel,
          descripcion: level.descripcion,
          precio: parseFloat(level.precio),
          tiempo_estimado_minutos: level.tiempo_estimado_minutos
            ? parseInt(level.tiempo_estimado_minutos)
            : 0,
        }));
      }

      let result;
      if (isEditing) {
        result = await Services.Data.Services.update(
          service.id_servicio,
          serviceData
        );
      } else {
        result = await Services.Data.Services.create(serviceData);
      }
      onSave(result);
      onClose();
    } catch (error) {
      console.error("Error al guardar servicio:", error); // Mostrar mensaje de error más específico
      const errorMessage = error.message
        ? error.message
        : "No se pudo guardar el servicio";

      notifications.showErrorNotification(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Función para añadir un nuevo nivel de servicio
  const handleAddLevel = () => {
    setServiceLevels([
      ...serviceLevels,
      {
        id_nivel: null, // Será asignado por el servidor
        nombre_nivel: "",
        descripcion: "",
        precio: "",
        tiempo_estimado_minutos: "",
      },
    ]);
  };

  // Funciones para actualizar y eliminar niveles de servicio
  const handleUpdateLevel = (index, field, value) => {
    const updatedLevels = [...serviceLevels];
    updatedLevels[index] = {
      ...updatedLevels[index],
      [field]: value,
    };
    setServiceLevels(updatedLevels);
  };

  const handleRemoveLevel = (index) => {
    const updatedLevels = [...serviceLevels];
    updatedLevels.splice(index, 1);
    setServiceLevels(updatedLevels);
  };

  // Renderizar cada nivel de servicio
  const renderServiceLevel = (level, index) => (
    <View key={index} style={styles.levelContainer}>
      <View style={styles.levelHeader}>
        <Text style={[styles.levelTitle, { color: themeObject.colors.text }]}>
          Nivel {index + 1}
        </Text>
        <Pressable
          onPress={() => handleRemoveLevel(index)}
          style={styles.removeButton}
        >
          <Ionicons
            name="trash-outline"
            size={16}
            color={themeObject.colors.error}
          />
        </Pressable>
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: themeObject.colors.text }]}>
          Nombre del nivel *
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: themeObject.colors.surface,
              color: themeObject.colors.text,
              borderColor: themeObject.colors.border,
            },
          ]}
          placeholder="Ej: Básico, Estándar, Premium..."
          placeholderTextColor={themeObject.colors.placeholder}
          value={level.nombre_nivel}
          onChangeText={(text) =>
            handleUpdateLevel(index, "nombre_nivel", text)
          }
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: themeObject.colors.text }]}>
          Descripción
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: themeObject.colors.surface,
              color: themeObject.colors.text,
              borderColor: themeObject.colors.border,
            },
          ]}
          placeholder="Descripción del nivel"
          placeholderTextColor={themeObject.colors.placeholder}
          value={level.descripcion}
          onChangeText={(text) => handleUpdateLevel(index, "descripcion", text)}
          multiline
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
          <Text style={[styles.inputLabel, { color: themeObject.colors.text }]}>
            Precio *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: themeObject.colors.surface,
                color: themeObject.colors.text,
                borderColor: themeObject.colors.border,
              },
            ]}
            placeholder="0.00"
            placeholderTextColor={themeObject.colors.placeholder}
            value={level.precio?.toString()}
            onChangeText={(text) => handleUpdateLevel(index, "precio", text)}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={[styles.inputContainer, { flex: 1 }]}>
          <Text style={[styles.inputLabel, { color: themeObject.colors.text }]}>
            Tiempo (min)
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: themeObject.colors.surface,
                color: themeObject.colors.text,
                borderColor: themeObject.colors.border,
              },
            ]}
            placeholder="0"
            placeholderTextColor={themeObject.colors.placeholder}
            value={level.tiempo_estimado_minutos?.toString()}
            onChangeText={(text) =>
              handleUpdateLevel(index, "tiempo_estimado_minutos", text)
            }
            keyboardType="number-pad"
          />
        </View>
      </View>
    </View>
  );

  return (
    <ModalTemplate
      isVisible={visible}
      title={isEditing ? "Editar Servicio" : "Nuevo Servicio"}
      text={
        isEditing
          ? "Modifica los detalles del servicio"
          : "Completa los campos para crear un nuevo servicio"
      }
      cancelLabel="Cancelar"
      confirmLabel="Guardar"
      cancelAction={onClose}
      confirmAction={handleSave}
      confirmDisabled={loading}
    >
      <ScrollView style={styles.container}>
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: themeObject.colors.text }]}>
            Nombre del servicio *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: themeObject.colors.surface,
                color: themeObject.colors.text,
                borderColor: themeObject.colors.border,
              },
            ]}
            placeholder="Nombre del servicio"
            placeholderTextColor={themeObject.colors.placeholder}
            value={formData.nombre_servicio}
            onChangeText={(text) =>
              setFormData({ ...formData, nombre_servicio: text })
            }
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: themeObject.colors.text }]}>
            Descripción
          </Text>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: themeObject.colors.surface,
                color: themeObject.colors.text,
                borderColor: themeObject.colors.border,
              },
            ]}
            placeholder="Descripción del servicio"
            placeholderTextColor={themeObject.colors.placeholder}
            value={formData.descripcion}
            onChangeText={(text) =>
              setFormData({ ...formData, descripcion: text })
            }
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
        <View style={styles.row}>
          <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
            <Text
              style={[styles.inputLabel, { color: themeObject.colors.text }]}
            >
              Precio base *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: themeObject.colors.surface,
                  color: themeObject.colors.text,
                  borderColor: themeObject.colors.border,
                },
              ]}
              placeholder="0.00"
              placeholderTextColor={themeObject.colors.placeholder}
              value={formData.precio_base}
              onChangeText={(text) =>
                setFormData({ ...formData, precio_base: text })
              }
              keyboardType="decimal-pad"
            />
          </View>

          <View style={[styles.inputContainer, { flex: 1 }]}>
            <Text
              style={[styles.inputLabel, { color: themeObject.colors.text }]}
            >
              Duración (min)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: themeObject.colors.surface,
                  color: themeObject.colors.text,
                  borderColor: themeObject.colors.border,
                },
              ]}
              placeholder="0"
              placeholderTextColor={themeObject.colors.placeholder}
              value={formData.duracion_estimada_minutos}
              onChangeText={(text) =>
                setFormData({ ...formData, duracion_estimada_minutos: text })
              }
              keyboardType="number-pad"
            />
          </View>
        </View>
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: themeObject.colors.text }]}>
            Tipo de tarifa *
          </Text>
          <CustomPicker
            selectedValue={formData.tipo_tarifa}
            onValueChange={handleTarifaChange}
            items={tarifaOptions}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: themeObject.colors.text }]}>
            Categoría
          </Text>
          <View style={{ position: "relative" }}>
            <TextInput
              ref={categoryInputRef}
              style={[
                styles.input,
                {
                  backgroundColor: themeObject.colors.surface,
                  color: themeObject.colors.text,
                  borderColor: themeObject.colors.border,
                },
              ]}
              placeholder="Categoría del servicio"
              placeholderTextColor={themeObject.colors.placeholder}
              value={formData.categoria}
              onChangeText={handleCategoryChange}
              onFocus={() => {
                if (formData.categoria) {
                  handleCategoryChange(formData.categoria);
                }
              }}
            />
          </View>
        </View>
        <View style={styles.switchContainer}>
          <Text
            style={[styles.switchLabel, { color: themeObject.colors.text }]}
          >
            Requiere profesional
          </Text>
          <Switch
            value={formData.requiere_profesional}
            onValueChange={(value) =>
              setFormData({ ...formData, requiere_profesional: value })
            }
            thumbColor={
              formData.requiere_profesional
                ? themeObject.colors.primary
                : themeObject.colors.border
            }
            trackColor={{
              false: themeObject.colors.placeholder,
              true: themeObject.colors.primaryLight,
            }}
          />
        </View>
        <View style={styles.switchContainer}>
          <Text
            style={[styles.switchLabel, { color: themeObject.colors.text }]}
          >
            Activo
          </Text>
          <Switch
            value={formData.activo}
            onValueChange={(value) =>
              setFormData({ ...formData, activo: value })
            }
            thumbColor={
              formData.activo
                ? themeObject.colors.primary
                : themeObject.colors.border
            }
            trackColor={{
              false: themeObject.colors.placeholder,
              true: themeObject.colors.primaryLight,
            }}
          />
        </View>
        {showServiceLevels && (
          <View style={styles.levelsSection}>
            <View style={styles.levelsSectionHeader}>
              <Text
                style={[
                  styles.levelsSectionTitle,
                  { color: themeObject.colors.text },
                ]}
              >
                Niveles de servicio
              </Text>
              <CustomButton
                variant="primary"
                size="sm"
                onPress={handleAddLevel}
                ionIconLeft="add-outline"
              >
                Añadir nivel
              </CustomButton>
            </View>

            {serviceLevels.length === 0 ? (
              <Text
                style={[
                  styles.noLevelsText,
                  { color: themeObject.colors.placeholder },
                ]}
              >
                No has añadido niveles. Pulsa "Añadir nivel" para crear uno.
              </Text>
            ) : (
              serviceLevels.map(renderServiceLevel)
            )}
          </View>
        )}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={themeObject.colors.primary}
            />
            <Text
              style={[styles.loadingText, { color: themeObject.colors.text }]}
            >
              Guardando...
            </Text>
          </View>
        )}
      </ScrollView>
    </ModalTemplate>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 80,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 14,
  },
  levelsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  levelsSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  levelsSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  noLevelsText: {
    textAlign: "center",
    marginBottom: 16,
  },
  levelContainer: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
  },
  levelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  removeButton: {
    padding: 4,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
});

export default ServiceModal;
