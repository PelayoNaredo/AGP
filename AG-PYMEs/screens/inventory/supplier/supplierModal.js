import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
} from "react-native";
import { TextInput, HelperText } from "react-native-paper";
import { useTheme } from "../../../context/ThemeContext";
import ModalTemplate from "../../../components/modalTemplate";
import MailTemplateEditor from "./MailTemplateEditor";

// Límites de caracteres según la base de datos
const FIELD_LIMITS = {
  nombre_proveedor: 100,
  contacto: 100,
  telefono: 20,
  email: 100,
  direccion_fiscal: 255,
  cif: 13,
  condiciones_pago: 50,
  cuenta_bancaria: 20,
  moneda: 3,
  sitio_web: 100,
};

//Modal para crear o editar proveedores
const SupplierModal = ({ visible, onClose, supplier, onSave }) => {
  const { themeObject } = useTheme();
  const styles = createStyles(themeObject);

  const [formData, setFormData] = useState({
    nombre_proveedor: "",
    contacto: "",
    telefono: "",
    email: "",
    direccion_fiscal: "",
    cif: "",
    condiciones_pago: "",
    dias_credito: "",
    cuenta_bancaria: "",
    moneda: "EUR",
    sitio_web: "",
    plantilla_email: "",
    activo: true,
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Efecto para cargar los datos del proveedor si se está editando
  // y para resetear el formulario si no hay proveedor seleccionado
  useEffect(() => {
    if (supplier) {
      setFormData({
        nombre_proveedor: supplier.nombre_proveedor,
        contacto: supplier.contacto || "",
        telefono: supplier.telefono || "",
        email: supplier.email || "",
        direccion_fiscal: supplier.direccion_fiscal || "",
        cif: supplier.cif || "",
        condiciones_pago: supplier.condiciones_pago || "",
        dias_credito: supplier.dias_credito?.toString() || "",
        cuenta_bancaria: supplier.cuenta_bancaria || "",
        moneda: supplier.moneda || "EUR",
        sitio_web: supplier.sitio_web || "",
        plantilla_email: supplier.plantilla_email || "",
        activo: supplier.activo ?? true,
      });
    } else {
      setFormData({
        nombre_proveedor: "",
        contacto: "",
        telefono: "",
        email: "",
        direccion_fiscal: "",
        cif: "",
        condiciones_pago: "",
        dias_credito: "",
        cuenta_bancaria: "",
        moneda: "EUR",
        sitio_web: "",
        plantilla_email: "",
        activo: true,
      });
    }
  }, [supplier]);
  // Función para validar campos
  const validateField = (name, value) => {
    let newErrors = { ...errors };

    switch (name) {
      case "nombre_proveedor":
        if (!value.trim()) {
          newErrors.nombre_proveedor = "El nombre es obligatorio";
        } else if (value.length > FIELD_LIMITS.nombre_proveedor) {
          newErrors.nombre_proveedor = `Máximo ${FIELD_LIMITS.nombre_proveedor} caracteres`;
        } else {
          delete newErrors.nombre_proveedor;
        }
        break;

      case "cif":
        if (!value.trim()) {
          newErrors.cif = "El CIF es obligatorio";
        } else if (value.length > FIELD_LIMITS.cif) {
          newErrors.cif = `Máximo ${FIELD_LIMITS.cif} caracteres`;
        } else {
          delete newErrors.cif;
        }
        break;

      case "direccion_fiscal":
        if (!value.trim()) {
          newErrors.direccion_fiscal = "La dirección es obligatoria";
        } else if (value.length > FIELD_LIMITS.direccion_fiscal) {
          newErrors.direccion_fiscal = `Máximo ${FIELD_LIMITS.direccion_fiscal} caracteres`;
        } else {
          delete newErrors.direccion_fiscal;
        }
        break;

      case "email":
        if (value.trim() && !value.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
          newErrors.email = "Email no válido";
        } else if (value.length > FIELD_LIMITS.email) {
          newErrors.email = `Máximo ${FIELD_LIMITS.email} caracteres`;
        } else {
          delete newErrors.email;
        }
        break;

      case "telefono":
        if (value.length > FIELD_LIMITS.telefono) {
          newErrors.telefono = `Máximo ${FIELD_LIMITS.telefono} caracteres`;
        } else {
          delete newErrors.telefono;
        }
        break;

      case "cuenta_bancaria":
        if (value.length > FIELD_LIMITS.cuenta_bancaria) {
          newErrors.cuenta_bancaria = `Máximo ${FIELD_LIMITS.cuenta_bancaria} caracteres`;
        } else {
          delete newErrors.cuenta_bancaria;
        }
        break;

      case "moneda":
        if (value.length > FIELD_LIMITS.moneda) {
          newErrors.moneda = `Máximo ${FIELD_LIMITS.moneda} caracteres`;
        } else {
          delete newErrors.moneda;
        }
        break;

      case "dias_credito":
        if (value && isNaN(parseInt(value))) {
          newErrors.dias_credito = "Debe ser un número";
        } else {
          delete newErrors.dias_credito;
        }
        break;

      default:
        // Para otros campos, solo validamos longitud si tienen un límite definido
        if (FIELD_LIMITS[name] && value.length > FIELD_LIMITS[name]) {
          newErrors[name] = `Máximo ${FIELD_LIMITS[name]} caracteres`;
        } else {
          delete newErrors[name];
        }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejador para cambiar datos del formulario con validación
  const handleChange = (name, value) => {
    // Limitamos la longitud según los límites definidos
    if (FIELD_LIMITS[name] && value.length > FIELD_LIMITS[name]) {
      value = value.substring(0, FIELD_LIMITS[name]);
    }

    // Formateos específicos
    if (name === "cif") value = value.toUpperCase();
    if (name === "moneda") value = value.toUpperCase();
    if (name === "dias_credito") value = value.replace(/[^0-9]/g, "");

    setFormData({ ...formData, [name]: value });
    validateField(name, value);
  };

  // Valida todo el formulario
  const validateForm = () => {
    let isValid = true;
    let newErrors = {};

    // Validar campos obligatorios
    if (!formData.nombre_proveedor.trim()) {
      newErrors.nombre_proveedor = "El nombre es obligatorio";
      isValid = false;
    }

    if (!formData.cif.trim()) {
      newErrors.cif = "El CIF es obligatorio";
      isValid = false;
    }

    if (!formData.direccion_fiscal.trim()) {
      newErrors.direccion_fiscal = "La dirección es obligatoria";
      isValid = false;
    }

    // Validar el email si existe
    if (
      formData.email &&
      !formData.email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)
    ) {
      newErrors.email = "Email no válido";
      isValid = false;
    }

    // Validar los días de crédito
    if (formData.dias_credito && isNaN(parseInt(formData.dias_credito))) {
      newErrors.dias_credito = "Debe ser un número";
      isValid = false;
    }

    // Validar longitudes
    Object.keys(FIELD_LIMITS).forEach((field) => {
      if (formData[field] && formData[field].length > FIELD_LIMITS[field]) {
        newErrors[field] = `Máximo ${FIELD_LIMITS[field]} caracteres`;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // Maneja el envío del formulario
  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert("Error", "Por favor, corrige los errores en el formulario");
      return;
    }

    try {
      setIsLoading(true);
      await onSave({
        ...formData,
        dias_credito: formData.dias_credito
          ? parseInt(formData.dias_credito)
          : null,
      });
    } catch (error) {
      Alert.alert("Error", error.message || "No se pudo guardar el proveedor");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalTemplate
      isVisible={visible}
      title={supplier ? "Editar Proveedor" : "Nuevo Proveedor"}
      cancelLabel="Cancelar"
      cancelAction={onClose}
      confirmLabel={
        isLoading ? "Guardando..." : supplier ? "Actualizar" : "Crear"
      }
      confirmAction={handleSubmit}
      confirmDisabled={isLoading}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Sección de información básica */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Información Básica</Text>
          <TextInput
            label="Nombre del proveedor *"
            value={formData.nombre_proveedor}
            onChangeText={(text) => handleChange("nombre_proveedor", text)}
            maxLength={FIELD_LIMITS.nombre_proveedor}
            style={styles.input}
            mode="outlined"
            error={!!errors.nombre_proveedor}
          />
          {errors.nombre_proveedor && (
            <HelperText type="error">{errors.nombre_proveedor}</HelperText>
          )}

          <TextInput
            label="CIF *"
            value={formData.cif}
            onChangeText={(text) => handleChange("cif", text)}
            maxLength={FIELD_LIMITS.cif}
            style={styles.input}
            mode="outlined"
            error={!!errors.cif}
            autoCapitalize="characters"
          />
          {errors.cif && <HelperText type="error">{errors.cif}</HelperText>}

          <TextInput
            label="Dirección Fiscal *"
            value={formData.direccion_fiscal}
            onChangeText={(text) => handleChange("direccion_fiscal", text)}
            maxLength={FIELD_LIMITS.direccion_fiscal}
            multiline
            style={styles.input}
            mode="outlined"
            error={!!errors.direccion_fiscal}
          />
          {errors.direccion_fiscal && (
            <HelperText type="error">{errors.direccion_fiscal}</HelperText>
          )}
        </View>
        {/* Sección de contacto */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Contacto</Text>
          <View style={styles.twoColumnContainer}>
            <View style={styles.halfWidth}>
              <TextInput
                label="Persona de contacto"
                value={formData.contacto}
                onChangeText={(text) => handleChange("contacto", text)}
                maxLength={FIELD_LIMITS.contacto}
                style={styles.input}
                mode="outlined"
                error={!!errors.contacto}
              />
              {errors.contacto && (
                <HelperText type="error">{errors.contacto}</HelperText>
              )}
            </View>

            <View style={styles.halfWidth}>
              <TextInput
                label="Teléfono"
                value={formData.telefono}
                onChangeText={(text) => handleChange("telefono", text)}
                maxLength={FIELD_LIMITS.telefono}
                keyboardType="phone-pad"
                style={styles.input}
                mode="outlined"
                error={!!errors.telefono}
              />
              {errors.telefono && (
                <HelperText type="error">{errors.telefono}</HelperText>
              )}
            </View>
          </View>

          <TextInput
            label="Email"
            value={formData.email}
            onChangeText={(text) => handleChange("email", text)}
            maxLength={FIELD_LIMITS.email}
            keyboardType="email-address"
            style={styles.input}
            mode="outlined"
            error={!!errors.email}
          />
          {errors.email && <HelperText type="error">{errors.email}</HelperText>}

          <TextInput
            label="Sitio web"
            value={formData.sitio_web}
            onChangeText={(text) => handleChange("sitio_web", text)}
            maxLength={FIELD_LIMITS.sitio_web}
            style={styles.input}
            mode="outlined"
            error={!!errors.sitio_web}
          />
          {errors.sitio_web && (
            <HelperText type="error">{errors.sitio_web}</HelperText>
          )}
        </View>
        {/* Sección financiera */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Información Financiera</Text>
          <View style={styles.twoColumnContainer}>
            <View style={styles.halfWidth}>
              <TextInput
                label="Condiciones de pago"
                value={formData.condiciones_pago}
                onChangeText={(text) => handleChange("condiciones_pago", text)}
                maxLength={FIELD_LIMITS.condiciones_pago}
                style={styles.input}
                mode="outlined"
                error={!!errors.condiciones_pago}
              />
              {errors.condiciones_pago && (
                <HelperText type="error">{errors.condiciones_pago}</HelperText>
              )}
            </View>

            <View style={styles.halfWidth}>
              <TextInput
                label="Días de crédito"
                value={formData.dias_credito}
                onChangeText={(text) => handleChange("dias_credito", text)}
                keyboardType="numeric"
                style={styles.input}
                mode="outlined"
                error={!!errors.dias_credito}
              />
              {errors.dias_credito && (
                <HelperText type="error">{errors.dias_credito}</HelperText>
              )}
            </View>
          </View>

          <View style={styles.twoColumnContainer}>
            <View style={styles.halfWidth}>
              <TextInput
                label="Cuenta bancaria"
                value={formData.cuenta_bancaria}
                onChangeText={(text) => handleChange("cuenta_bancaria", text)}
                maxLength={FIELD_LIMITS.cuenta_bancaria}
                style={styles.input}
                mode="outlined"
                error={!!errors.cuenta_bancaria}
              />
              {errors.cuenta_bancaria && (
                <HelperText type="error">{errors.cuenta_bancaria}</HelperText>
              )}
            </View>

            <View style={styles.halfWidth}>
              <TextInput
                label="Moneda"
                value={formData.moneda}
                onChangeText={(text) => handleChange("moneda", text)}
                maxLength={FIELD_LIMITS.moneda}
                style={styles.input}
                mode="outlined"
                autoCapitalize="characters"
                error={!!errors.moneda}
              />
              {errors.moneda && (
                <HelperText type="error">{errors.moneda}</HelperText>
              )}
            </View>
          </View>
        </View>
        {/* Otras configuraciones */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Configuraciones</Text>
          <MailTemplateEditor
            value={formData.plantilla_email}
            onChange={(texto) =>
              setFormData({ ...formData, plantilla_email: texto })
            }
            placeholder="Escribe tu plantilla de email..."
            containerStyle={styles.richEditorContainer}
          />

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Proveedor activo</Text>
            <Switch
              value={formData.activo}
              onValueChange={(value) =>
                setFormData({ ...formData, activo: value })
              }
              color={themeObject.colors.accent}
            />
          </View>
        </View>
      </ScrollView>
    </ModalTemplate>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    modalOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.componentColors.overlay,
      justifyContent: "center",
      alignItems: "center",
      height: "90%",
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      width: "90%",
      maxWidth: 600,
      borderRadius: theme.roundness,
      padding: 24,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: theme.colors.text,
      marginBottom: 24,
    },
    input: {
      marginBottom: 4,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      color: theme.colors.text,
    },
    submitButton: {
      marginTop: 24,
    },
    cancelButton: {
      marginTop: 12,
    },
    sectionContainer: {
      marginBottom: 24,
    },
    sectionTitle: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 12,
    },
    twoColumnContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 16,
    },
    halfWidth: {
      flex: 1,
    },
    switchContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 8,
    },
    switchLabel: {
      color: theme.colors.text,
      fontSize: 14,
    },
    editorLabel: {
      color: theme.colors.text,
      fontSize: 14,
      marginBottom: 8,
    },
    richEditorContainer: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.roundness,
      overflow: "hidden",
      marginBottom: 16,
    },
    richToolbar: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: theme.roundness,
      borderTopRightRadius: theme.roundness,
    },
    richEditor: {
      minHeight: 150,
      backgroundColor: theme.colors.background,
      color: theme.colors.text,
    },
    editorContainer: {
      borderBottomLeftRadius: theme.roundness,
      borderBottomRightRadius: theme.roundness,
    },
  });

export default SupplierModal;
