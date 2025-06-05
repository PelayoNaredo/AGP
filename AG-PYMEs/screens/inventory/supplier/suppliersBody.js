import React, { useState, useEffect } from "react";
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Pressable,
} from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import CustomButton from "../../../components/customButton";
import { Services } from "../../../api/index";
import SupplierModal from "./supplierModal";
import { formatPhoneNumber } from "../../../utils/helpers";
import { List, Card } from "react-native-paper";

// Componente SuppliersBody para gestionar y visualizar proveedores
const SuppliersBody = () => {
  const { themeObject } = useTheme();
  const styles = createStyles(themeObject);

  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const loadSuppliers = async () => {
    try {
      const data = await Services.Data.Suppliers.getAll();
      setSuppliers(data);
    } catch (error) {
      Alert.alert("Error", "Error cargando proveedores");
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
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar el proveedor");
    }
  };

  // Manejo de eliminación de proveedor
  const handleDelete = async (id) => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Estás seguro de eliminar este proveedor?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await Services.Data.Suppliers.delete(id);
              setSuppliers((prev) => prev.filter((s) => s.id_proveedor !== id));
            } catch (error) {
              Alert.alert("Error", "No se pudo eliminar el proveedor");
            }
          },
        },
      ]
    );
  };

  // Renderiza cada proveedor en la lista
  const renderItem = ({ item }) => (
    <Card style={styles.supplierCard}>
      <Pressable
        onPress={() => {
          setSelectedSupplier(item);
          setIsModalVisible(true);
        }}
      >
        <List.Item
          title={item.nombre_proveedor}
          description={
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionText}>CIF: {item.cif}</Text>
              <Text style={styles.descriptionText}>{item.contacto}</Text>
              <Text style={styles.descriptionText}>
                {formatPhoneNumber(item.telefono)}
              </Text>
              <Text style={styles.descriptionText}>
                {item.direccion_fiscal}
              </Text>
            </View>
          }
          right={() => (
            <View style={styles.rightContainer}>
              <Text
                style={[
                  styles.statusText,
                  {
                    backgroundColor: item.activo
                      ? themeObject.colors.success
                      : themeObject.colors.error,
                  },
                ]}
              >
                {item.activo ? "Activo" : "Inactivo"}
              </Text>
              <CustomButton
                variant="error"
                size="sm"
                ionIconLeft="trash-outline"
                onPress={() => handleDelete(item.id_proveedor)}
                style={styles.deleteButton}
              />
            </View>
          )}
          style={styles.listItem}
          titleStyle={styles.supplierTitle}
          descriptionStyle={styles.supplierSubtitle}
        />
      </Pressable>
    </Card>
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
    supplierCard: {
      margin: 10,
      borderRadius: 10,
      backgroundColor: theme.colors.surface,
    },
    listItem: {
      cursor: "pointer",
      alignItems: "center",
    },
    supplierTitle: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: "600",
    },
    supplierSubtitle: {
      color: theme.colors.placeholder,
      fontSize: 14,
    },

    addButton: {
      marginBottom: 16,
    },
    listContent: {
      paddingBottom: 32,
    },
    descriptionContainer: {
      gap: 4,
    },
    descriptionText: {
      color: theme.colors.placeholder,
      fontSize: 12,
      marginTop: 4,
    },
    rightContainer: {
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: 8,
    },
    statusText: {
      color: theme.colors.buttonWhite,
      textAlign: "center",
      fontSize: 12,
      fontWeight: "500",
      borderRadius: 20,
      padding: 4,
      paddingHorizontal: 12,
    },
  });

export default SuppliersBody;
