import React, { useState, useEffect } from "react";
import { View, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import CustomButton from "../../../components/customButton";
import { Services } from "../../../api/index";
import SupplierModal from "./supplierModal";
import SupplierCard from "./supplierCard";
import useNotifications from "../../../hooks/useNotifications";

// Componente SuppliersBody para gestionar y visualizar proveedores
const SuppliersBody = () => {
  const { themeObject } = useTheme();
  const styles = createStyles(themeObject);
  const { showError, showConfirmDialog, showSuccess } = useNotifications();

  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const loadSuppliers = async () => {
    try {
      const data = await Services.Data.Suppliers.getAll();
      setSuppliers(data);
    } catch (error) {
      showError("Error", "Error cargando proveedores");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  // Manejo de guardar o actualizar proveedor
  const handleSave = async (supplierData) => {
    try {
      const savedSupplier = selectedSupplier
        ? await Services.Data.Suppliers.update(
            selectedSupplier.id_proveedor,
            supplierData
          )
        : await Services.Data.Suppliers.create(supplierData);

      setSuppliers((prev) =>
        selectedSupplier
          ? prev.map((s) =>
              s.id_proveedor === savedSupplier.id_proveedor ? savedSupplier : s
            )
          : [...prev, savedSupplier]
      );
      setIsModalVisible(false);
      setSelectedSupplier(null);
      showSuccess(
        selectedSupplier
          ? "Proveedor actualizado correctamente"
          : "Proveedor creado correctamente"
      );
    } catch (error) {
      showError("Error", "No se pudo guardar el proveedor");
    }
  };
  // Manejo de eliminación de proveedor
  const handleDelete = async (id) => {
    showConfirmDialog(
      "Confirmar eliminación",
      "¿Estás seguro de eliminar este proveedor?",
      async () => {
        try {
          await Services.Data.Suppliers.delete(id);
          setSuppliers((prev) => prev.filter((s) => s.id_proveedor !== id));
          showSuccess("Proveedor eliminado correctamente");
        } catch (error) {
          showError("Error", "No se pudo eliminar el proveedor");
        }
      },
      () => {}, // Función onCancel vacía
      "Eliminar",
      "Cancelar"
    );
  };
  // Renderiza cada proveedor en la lista
  const renderItem = ({ item }) => (
    <SupplierCard
      supplier={item}
      onSelect={(supplier) => {
        setSelectedSupplier(supplier);
        setIsModalVisible(true);
      }}
      onDelete={handleDelete}
    />
  );

  if (isLoading) {
    return <ActivityIndicator size="large" color={themeObject.colors.accent} />;
  }

  return (
    <View style={styles.container}>
      <CustomButton
        onPress={() => setIsModalVisible(true)}
        variant="info"
        ionIconLeft="add-circle-outline"
        style={styles.addButton}
      >
        Nuevo Proveedor
      </CustomButton>

      <FlatList
        data={suppliers}
        keyExtractor={(item) => item.id_proveedor.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />

      <SupplierModal
        visible={isModalVisible || !!selectedSupplier}
        onClose={() => {
          setIsModalVisible(false);
          setSelectedSupplier(null);
        }}
        supplier={selectedSupplier}
        onSave={handleSave}
      />
    </View>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: theme.colors.background,
    },
    addButton: {
      marginBottom: 16,
    },
    listContent: {
      paddingBottom: 32,
    },
  });

export default SuppliersBody;
