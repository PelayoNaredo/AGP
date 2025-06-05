import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import CustomButton from "../../../components/customButton";

// Componente ProductSelector para seleccionar productos de inventario
const ProductSelector = ({
  inventory,
  selectedItems,
  onSelectItems,
  onRemoveItem,
}) => {
  const { themeObject } = useTheme();
  const styles = createStyles(themeObject);

  // Función para obtener el producto completo por ID
  const getFullProduct = (productId) => {
    return inventory.find((p) => p.id_producto === productId) || {};
  };

  // Maneja la adición de un producto al selector
  const handleAddItem = (product) => {
    const existingIndex = selectedItems.findIndex(
      (item) => item.id_producto === product.id_producto
    );

    if (existingIndex === -1) {
      onSelectItems([
        ...selectedItems,
        {
          id_producto: product.id_producto,
          cantidad: 1,
          precio_unitario: product.precio_compra || 0,
          nombre_producto: product.nombre_producto,
        },
      ]);
    }
  };

  // Maneja el cambio de cantidad o precio de un producto seleccionado
  const handleChange = (index, key, value) => {
    const updatedItems = [...selectedItems];
    const numericValue = parseFloat(value) || 0;

    updatedItems[index] = {
      ...updatedItems[index],
      [key]: numericValue,
    };

    onSelectItems(updatedItems);
  };

  // Maneja la eliminación de un producto seleccionado
  const handleRemoveItem = async (index) => {
    const itemToRemove = selectedItems[index];

    // Eliminar el producto del estado local primero.
    const updatedItems = selectedItems.filter((_, i) => i !== index);
    onSelectItems(updatedItems);

    // Luego, eliminar el producto de la base de datos.
    await onRemoveItem(itemToRemove.id_producto);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seleccionar Productos</Text>

      <View style={styles.inventoryList}>
        {inventory.map((product) => {
          const isSelected = selectedItems.some(
            (item) => item.id_producto === product.id_producto
          );

          return (
            <CustomButton
              key={product.id_producto}
              onPress={() => handleAddItem(product)}
              style={[
                styles.productButton,
                isSelected && styles.selectedProductButton,
              ]}
              textStyle={styles.buttonText}
              disabled={isSelected}
            >
              {product.nombre_producto}
            </CustomButton>
          );
        })}
      </View>

      {selectedItems.length > 0 && (
        <>
          <View style={styles.headerRow}>
            <Text style={styles.subtitle}>Producto</Text>
            <Text style={styles.subtitle}>Cantidad</Text>
            <Text style={styles.subtitle}>Precio</Text>
            <View style={styles.emptySpace} />
          </View>

          {selectedItems.map((item, index) => {
            const product = getFullProduct(item.id_producto);

            return (
              <View key={`${item.id_producto}-${index}`} style={styles.itemRow}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {product.nombre_producto || "Producto no encontrado"}
                </Text>

                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={item.cantidad?.toString() || ""}
                  onChangeText={(value) =>
                    handleChange(index, "cantidad", value)
                  }
                  placeholder="0"
                />

                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={item.precio_unitario?.toString() || ""}
                  onChangeText={(value) =>
                    handleChange(index, "precio_unitario", value)
                  }
                  placeholder="0.00"
                />

                <CustomButton
                  variant="error"
                  size="sm"
                  ionIconLeft="trash-outline"
                  onPress={() => handleRemoveItem(index)}
                  style={styles.removeButton}
                />
              </View>
            );
          })}
        </>
      )}
    </View>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      marginVertical: 10,
    },
    title: {
      fontSize: 16,
      fontWeight: "bold",
      color: theme.colors.text,
      marginBottom: 15,
    },
    inventoryList: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 15,
    },
    productButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    selectedProductButton: {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accentDark,
    },
    buttonText: {
      color: theme.colors.text,
      fontSize: 14,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    subtitle: {
      flex: 1,
      fontSize: 14,
      fontWeight: "500",
      color: theme.colors.text,
    },
    emptySpace: {
      width: 40,
    },
    itemRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    itemName: {
      flex: 1,
      color: theme.colors.text,
      fontSize: 14,
      marginRight: 5,
    },
    input: {
      flex: 1, // Permitir que el input se expanda
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.roundness,
      paddingHorizontal: 8,
      paddingVertical: 6,
      color: theme.colors.text,
      fontSize: 14,
      marginHorizontal: 5, // Añadir margen horizontal para separar los inputs
    },
    removeButton: {
      padding: 6,
    },
    removeButtonContainer: {
      flex: 0.2, // Ocupar una porción del espacio
      alignItems: "flex-end", // Alinear el botón a la derecha
    },
  });

export default ProductSelector;
