import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import CustomPicker from "../../../components/customPicker";
import ModalTemplate from "../../../components/modalTemplate";
import { Ionicons } from "@expo/vector-icons";
import { Services } from "../../../api/index";
import BarcodeScanner from "../../../components/BarcodeScanner";
import useNotifications from "../../../hooks/useNotifications";

// Componente AddProductModal para crear o editar productos en el inventario
const AddProductModal = ({ visible, onClose, product, onCreateSuccess }) => {
  const { themeObject } = useTheme();
  const styles = createStyles(themeObject);
  const { showError } = useNotifications();

  const [formData, setFormData] = useState({
    nombre_producto: "",
    descripcion: "",
    cantidad_actual: "",
    cantidad_minima: "",
    precio_unitario: "",
    id_proveedor: "",
    referencia: "",
    pvp: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [supplierError, setSupplierError] = useState("");
  const [scannerVisible, setScannerVisible] = useState(false);

  // Efecto para cargar los proveedores cuando el modal es visible
  useEffect(() => {
    let isMounted = true;

    // Función para cargar los proveedores
    const loadSuppliers = async () => {
      if (!visible) return;
      setLoadingSuppliers(true);
      try {
        const data = await Services.Data.Suppliers.getAll();
        if (isMounted) {
          setSuppliers(data);
          setSupplierError("");
        }
      } catch (error) {
        if (isMounted) {
          setSupplierError("Error al cargar proveedores");
          console.error(error);
        }
      } finally {
        if (isMounted) {
          setLoadingSuppliers(false);
        }
      }
    };

    if (visible) {
      loadSuppliers();
    }

    return () => {
      isMounted = false;
    };
  }, [visible]);

  // Efecto para inicializar el formulario cuando hay un producto para editar
  useEffect(() => {
    if (product) {
      setFormData({
        nombre_producto: product.nombre_producto,
        descripcion: product.descripcion || "",
        cantidad_actual: product.cantidad_actual.toString(),
        cantidad_minima: product.cantidad_minima?.toString() || "",
        precio_unitario: product.precio_unitario.toString(),
        id_proveedor: product.id_proveedor?.toString() || "",
        referencia: product.referencia || "",
        pvp: product.pvp?.toString() || "",
      });
    } else {
      setFormData({
        nombre_producto: "",
        descripcion: "",
        cantidad_actual: "",
        cantidad_minima: "",
        precio_unitario: "",
        id_proveedor: "",
        referencia: "",
        pvp: "",
      });
    }
    setErrors({});
  }, [product]);

  // Calcular un PVP sugerido basado en un 30% sobre el precio unitario
  const calcularPVPSugerido = () => {
    if (
      !formData.precio_unitario ||
      isNaN(parseFloat(formData.precio_unitario))
    ) {
      return "0.00";
    }
    const precioUnitario = parseFloat(formData.precio_unitario);
    const pvpSugerido = precioUnitario * 1.3; // 30% más
    return pvpSugerido.toFixed(2);
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = [
      "nombre_producto",
      "cantidad_actual",
      "precio_unitario",
    ];

    requiredFields.forEach((field) => {
      if (!formData[field]) newErrors[field] = "Este campo es requerido";
    });

    if (formData.precio_unitario && isNaN(formData.precio_unitario)) {
      newErrors.precio_unitario = "Ingrese un número válido";
    }

    return Object.keys(newErrors).length === 0;
  };

  // Manejar cambios en los campos del formulario
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // Manejar el escaneo de código de barras
  const handleScanBarcode = () => {
    setScannerVisible(true);
  };

  // Manejar el resultado del escaneo de código de barras
  const handleBarCodeScanned = ({ type, data }) => {
    setScannerVisible(false);
    setFormData((prev) => ({
      ...prev,
      referencia: data,
    }));
  };

  // Manejar el envío del formulario
  const handleSubmit = async () => {
    if (!validateForm()) {
      showError("Error", "Por favor, complete todos los campos requeridos correctamente"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const productData = {
        ...formData,
        cantidad_actual: parseInt(formData.cantidad_actual),
        cantidad_minima: parseInt(formData.cantidad_minima) || 0,
        precio_unitario: parseFloat(formData.precio_unitario),
        id_proveedor: formData.id_proveedor || null,
        pvp: formData.pvp ? parseFloat(formData.pvp) : null,
      }; // Si el producto ya existe, actualizamos, si no, creamos uno nuevo
      if (product) {
        await Services.Data.Inventory.update(product.id_producto, productData);
      } else {
        await Services.Data.Inventory.create(productData);
      }

      onCreateSuccess(!!product); // Pasamos true si es una edición, false si es creación
      onClose();
    } catch (error) {
      showError(
        "Error",
        `No se pudo ${product ? "actualizar" : "crear"} el producto: ${error.message}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const suppliersItems = suppliers.map((s) => ({
    label: s.nombre_proveedor,
    value: s.id_proveedor.toString(),
  }));

  // Componente de escáner
  if (scannerVisible) {
    return (
      <ModalTemplate
        isVisible={visible}
        onClose={() => setScannerVisible(false)}
        title="Escanear código de barras"
      >
        <BarcodeScanner
          onCodeScanned={handleBarCodeScanned}
          buttonTitle="Cancelar"
          onCancel={() => setScannerVisible(false)}
        />
      </ModalTemplate>
    );
  }

  return (
    <ModalTemplate
      isVisible={visible}
      onClose={onClose}
      cancelAction={onClose}
      cancelLabel="Cancelar"
      confirmAction={handleSubmit}
      confirmLabel={product ? "Actualizar" : "Crear"}
      confirmDisabled={isSubmitting}
      title={`${product ? "Editar" : "Añadir"} Producto`}
    >
      <View style={styles.modalContent}>
        {/* Nombre del producto */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Nombre del producto *</Text>
          <TextInput
            style={[styles.input, errors.nombre_producto && styles.inputError]}
            placeholder="Nombre del producto"
            placeholderTextColor={themeObject.colors.placeholder}
            value={formData.nombre_producto}
            onChangeText={(text) => handleChange("nombre_producto", text)}
          />
          {errors.nombre_producto && (
            <Text style={styles.errorText}>{errors.nombre_producto}</Text>
          )}
        </View>

        {/* Referencia y código de barras */}
        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 3 }]}>
            <Text style={styles.label}>Referencia</Text>
            <TextInput
              style={styles.input}
              placeholder="Código de referencia"
              placeholderTextColor={themeObject.colors.placeholder}
              value={formData.referencia}
              onChangeText={(text) => handleChange("referencia", text)}
            />
          </View>
          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>&nbsp;</Text>
            <Pressable style={styles.scanButton} onPress={handleScanBarcode}>
              <Ionicons
                name="barcode-outline"
                size={24}
                color={themeObject.colors.info}
              />
            </Pressable>
          </View>
        </View>

        {/* Descripción */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Descripción del producto"
            placeholderTextColor={themeObject.colors.placeholder}
            value={formData.descripcion}
            onChangeText={(text) => handleChange("descripcion", text)}
            multiline
          />
        </View>

        {/* Cantidad actual y mínima */}
        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>Cantidad actual *</Text>
            <TextInput
              style={[
                styles.input,
                errors.cantidad_actual && styles.inputError,
              ]}
              placeholder="Cantidad actual"
              placeholderTextColor={themeObject.colors.placeholder}
              keyboardType="numeric"
              value={formData.cantidad_actual}
              onChangeText={(text) => handleChange("cantidad_actual", text)}
            />
            {errors.cantidad_actual && (
              <Text style={styles.errorText}>{errors.cantidad_actual}</Text>
            )}
          </View>
          <View style={[styles.formGroup, { flex: 1, marginLeft: 12 }]}>
            <Text style={styles.label}>Cantidad mínima</Text>
            <TextInput
              style={[
                styles.input,
                errors.cantidad_minima && styles.inputError,
              ]}
              placeholder="Cantidad mínima"
              placeholderTextColor={themeObject.colors.placeholder}
              keyboardType="numeric"
              value={formData.cantidad_minima}
              onChangeText={(text) => handleChange("cantidad_minima", text)}
            />
            {errors.cantidad_minima && (
              <Text style={styles.errorText}>{errors.cantidad_minima}</Text>
            )}
          </View>
        </View>

        {/* Precio unitario y PVP */}
        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>Precio de coste *</Text>
            <TextInput
              style={[
                styles.input,
                errors.precio_unitario && styles.inputError,
              ]}
              placeholder="Precio de coste"
              placeholderTextColor={themeObject.colors.placeholder}
              keyboardType="numeric"
              value={formData.precio_unitario}
              onChangeText={(text) => handleChange("precio_unitario", text)}
            />
            {errors.precio_unitario && (
              <Text style={styles.errorText}>{errors.precio_unitario}</Text>
            )}
          </View>
          <View style={[styles.formGroup, { flex: 1, marginLeft: 12 }]}>
            <Text style={styles.label}>Precio de venta (PVP)</Text>
            <TextInput
              style={styles.input}
              placeholder="Precio de venta"
              placeholderTextColor={themeObject.colors.placeholder}
              keyboardType="numeric"
              value={formData.pvp}
              onChangeText={(text) => handleChange("pvp", text)}
            />
            <Text style={styles.suggestedPVP}>
              PVP sugerido al 30%: {calcularPVPSugerido()}
            </Text>
          </View>
        </View>

        {/* Proveedor */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Proveedor</Text>
          {loadingSuppliers ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={themeObject.colors.accent} />
            </View>
          ) : supplierError ? (
            <Text style={styles.errorText}>{supplierError}</Text>
          ) : (
            <CustomPicker
              selectedValue={formData.id_proveedor}
              onValueChange={(value) => handleChange("id_proveedor", value)}
              items={suppliersItems}
              placeholder="Seleccionar proveedor"
            />
          )}
        </View>
      </View>
    </ModalTemplate>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    modalContent: {
      paddingVertical: 20,
    },
    formGroup: {
      marginBottom: 16,
    },
    formRow: {
      flexDirection: "row",
      marginBottom: 16,
    },
    label: {
      color: theme.colors.text,
      marginBottom: 6,
      fontSize: 14,
      fontWeight: "500",
    },
    input: {
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: 6,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
    },
    textArea: {
      height: 80,
      textAlignVertical: "top",
    },
    inputError: {
      borderColor: "red",
    },
    errorText: {
      color: "red",
      fontSize: 12,
      marginTop: 4,
    },
    buttonsContainer: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginTop: 24,
    },
    button: {
      marginLeft: 12,
      minWidth: 100,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 6,
      alignItems: "center",
    },
    cancelButton: {
      backgroundColor: theme.colors.cancelButton,
    },
    confirmButton: {
      backgroundColor: theme.colors.confirmButton,
    },
    buttonText: {
      color: theme.colors.buttonText,
      fontSize: 16,
      fontWeight: "500",
    },
    scanButton: {
      height: 46,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingContainer: {
      padding: 16,
      alignItems: "center",
    },
    suggestedPVP: {
      marginTop: 4,
      fontSize: 12,
      color: theme.colors.info,
    },
  });

export default AddProductModal;
