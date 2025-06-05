import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
} from "react-native";
import { TextInput } from "react-native-paper";
import { useTheme } from "../../../context/ThemeContext";
import ModalTemplate from "../../../components/modalTemplate";
import EditorPlantillaEmail from "./MailTemplateEditor";

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

  // Maneja el envío del formulario
  const handleSubmit = async () => {
    if (
      !formData.nombre_proveedor.trim() ||
      !formData.cif ||
      !formData.direccion_fiscal
    ) {
      Alert.alert("Error", "Los campos marcados con * son obligatorios");
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
            onChangeText={(text) =>
              setFormData({ ...formData, nombre_proveedor: text })
            }
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="CIF *"
            value={formData.cif}
            onChangeText={(text) =>
              setFormData({ ...formData, cif: text.toUpperCase() })
            }
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="Dirección Fiscal *"
            value={formData.direccion_fiscal}
            onChangeText={(text) =>
              setFormData({ ...formData, direccion_fiscal: text })
            }
            multiline
            style={styles.input}
            mode="outlined"
          />
        </View>

        {/* Sección de contacto */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Contacto</Text>
          <View style={styles.twoColumnContainer}>
            <TextInput
              label="Persona de contacto"
              value={formData.contacto}
              onChangeText={(text) =>
                setFormData({ ...formData, contacto: text })
              }
              style={[styles.input, styles.halfWidth]}
              mode="outlined"
            />
            <TextInput
              label="Teléfono"
              value={formData.telefono}
              onChangeText={(text) =>
                setFormData({ ...formData, telefono: text })
              }
              keyboardType="phone-pad"
              style={[styles.input, styles.halfWidth]}
              mode="outlined"
            />
          </View>
          <TextInput
            label="Email"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="Sitio web"
            value={formData.sitio_web}
            onChangeText={(text) =>
              setFormData({ ...formData, sitio_web: text })
            }
            style={styles.input}
            mode="outlined"
          />
        </View>

        {/* Sección financiera */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Información Financiera</Text>
          <View style={styles.twoColumnContainer}>
            <TextInput
              label="Condiciones de pago"
              value={formData.condiciones_pago}
              onChangeText={(text) =>
                setFormData({ ...formData, condiciones_pago: text })
              }
              style={[styles.input, styles.halfWidth]}
              mode="outlined"
            />
            <TextInput
              label="Días de crédito"
              value={formData.dias_credito}
              onChangeText={(text) =>
                setFormData({
                  ...formData,
                  dias_credito: text.replace(/[^0-9]/g, ""),
                })
              }
              keyboardType="numeric"
              style={[styles.input, styles.halfWidth]}
              mode="outlined"
            />
          </View>
          <View style={styles.twoColumnContainer}>
            <TextInput
              label="Cuenta bancaria"
              value={formData.cuenta_bancaria}
              onChangeText={(text) =>
                setFormData({ ...formData, cuenta_bancaria: text })
              }
              style={[styles.input, styles.halfWidth]}
              mode="outlined"
            />
            <TextInput
              label="Moneda"
              value={formData.moneda}
              onChangeText={(text) =>
                setFormData({ ...formData, moneda: text.toUpperCase() })
              }
              style={[styles.input, styles.halfWidth]}
              mode="outlined"
            />
          </View>
        </View>

        {/* Otras configuraciones */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Configuraciones</Text>
          <EditorPlantillaEmail
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
      marginBottom: 16,

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
