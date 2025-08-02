import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  Platform,
  Modal,
} from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { Services } from "../../../api";
import BarcodeScanner from "../../../components/BarcodeScanner";

// Componente ProductSelector para seleccionar productos en el punto de venta
const ProductSelector = ({ onSelectProduct }) => {
  const { themeObject } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isScannerVisible, setScannerVisible] = useState(false);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: themeObject.colors.surface,
      borderRadius: themeObject.roundness,
      overflow: "hidden",
      flex: 1,
    },
    header: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: themeObject.colors.border,
      backgroundColor: themeObject.colors.surface,
    },
    title: {
      fontSize: 18,
      fontWeight: "bold",
      color: themeObject.colors.text,
      marginBottom: 12,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: themeObject.colors.background,
      borderRadius: themeObject.roundness,
      borderWidth: 1,
      borderColor: themeObject.colors.border,
      paddingHorizontal: 12,
    },
    searchInput: {
      flex: 1,
      height: 40,
      color: themeObject.colors.text,
      paddingHorizontal: 8,
    },
    productsListContainer: {
      flex: 1,
      padding: 16,
    },
    productItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: themeObject.colors.border,
      backgroundColor: themeObject.colors.surface,
    },
    productInfo: {
      flex: 1,
    },
    productName: {
      fontSize: 16,
      fontWeight: "500",
      color: themeObject.colors.text,
      marginBottom: 4,
    },
    productPrice: {
      fontSize: 14,
      color: themeObject.colors.placeholder,
    },
    productStock: {
      fontSize: 14,
      color: themeObject.colors.primary,
      marginLeft: 8,
    },
    productReference: {
      fontSize: 12,
      color: themeObject.colors.placeholder,
      marginTop: 4,
    },
    addButton: {
      backgroundColor: themeObject.colors.primary,
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
    },
    errorText: {
      color: themeObject.colors.error,
      textAlign: "center",
      margin: 16,
    },
    emptyResultText: {
      color: themeObject.colors.placeholder,
      textAlign: "center",
      margin: 16,
    },
    scanButton: {
      marginLeft: 8,
    },
    listContainer: {
      flex: 1,
      backgroundColor: themeObject.colors.surface,
      flexGrow: 1,
    },
  });

  // Cargar productos al montar el componente
  useEffect(() => {
    fetchProducts();
  }, []);

  // Filtrar productos cuando cambia la búsqueda
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProducts(products);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = products.filter(
        (product) =>
          product.nombre_producto.toLowerCase().includes(lowercaseQuery) ||
          (product.descripcion &&
            product.descripcion.toLowerCase().includes(lowercaseQuery)) ||
          (product.referencia &&
            product.referencia.toLowerCase().includes(lowercaseQuery)) ||
          (product.codigo_producto &&
            product.codigo_producto.toLowerCase().includes(lowercaseQuery)) ||
          (product.sku && product.sku.toLowerCase().includes(lowercaseQuery))
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  // Función para obtener productos desde la API
  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Usar Edge Functions de Supabase en lugar del backend legacy
      const response = await Services.Data.Inventory.getAll();
      setProducts(response);
      setFilteredProducts(response);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Error al cargar productos. Por favor, intenta de nuevo.");

      // En caso de error, inicializamos con arrays vacíos
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar la selección de un producto
  const handleAddProduct = (product) => {
    onSelectProduct(product);
  };

  // Manejar el escaneo de código de barras
  const handleBarcodeScan = ({ type, data }) => {
    // Cerrar el scanner
    setScannerVisible(false);

    // Buscar producto por código escaneado
    const productByCode = products.find(
      (product) =>
        product.referencia === data ||
        product.codigo_producto === data ||
        product.sku === data
    );

    if (productByCode) {
      // Si encontramos el producto, lo añadimos directamente
      handleAddProduct(productByCode);
    } else {
      // Si no encontramos el producto, usamos el código como criterio de búsqueda
      setSearchQuery(data);
    }
  };

  // Renderizar cada producto en la lista
  const renderProductItem = ({ item }) => (
    <View style={styles.productItem}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.nombre_producto}</Text>
        <View style={{ flexDirection: "row" }}>
          <Text style={styles.productPrice}>
            {typeof item.pvp === "number"
              ? item.pvp.toFixed(2)
              : parseFloat(item.pvp || 0).toFixed(2)}
            €
          </Text>
          <Text style={styles.productStock}>Stock: {item.cantidad_actual}</Text>
        </View>
        <Text style={styles.productReference}>
          Ref:{" "}
          {item.referencia ||
            item.codigo_producto ||
            item.sku ||
            "Sin referencia"}
        </Text>
      </View>
      <Pressable
        style={styles.addButton}
        onPress={() => handleAddProduct(item)}
        disabled={item.cantidad_actual <= 0}
      >
        <Ionicons name="add" size={20} color="white" />
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Productos</Text>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color={themeObject.colors.placeholder}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar producto..."
            placeholderTextColor={themeObject.colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Pressable
            style={styles.scanButton}
            onPress={() => setScannerVisible(true)}
          >
            <Ionicons
              name="barcode-outline"
              size={24}
              color={themeObject.colors.primary}
            />
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={themeObject.colors.primary}
          style={{ marginTop: 20 }}
        />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : filteredProducts.length === 0 ? (
        <Text style={styles.emptyResultText}>No se encontraron productos</Text>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id_producto.toString()}
          contentContainerStyle={{
            padding: 16,
            flexGrow: 1,
          }}
          style={styles.listContainer}
          showsVerticalScrollIndicator={Platform.OS === "android"}
          removeClippedSubviews={Platform.OS === "android"}
          windowSize={5}
          maxToRenderPerBatch={8}
          initialNumToRender={6}
          nestedScrollEnabled={true}
        />
      )}

      {/* Modal para el escáner de códigos de barras */}
      <Modal
        visible={isScannerVisible}
        animationType="slide"
        onRequestClose={() => setScannerVisible(false)}
      >
        <BarcodeScanner
          onCodeScanned={handleBarcodeScan}
          buttonTitle="Cancelar Escaneo"
          onCancel={() => setScannerVisible(false)}
        />
      </Modal>
    </View>
  );
};

export default ProductSelector;
