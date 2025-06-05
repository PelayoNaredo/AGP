import React, { useState, useEffect } from "react";
import {
  View,
  FlatList,
  Text,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
import { Card } from "react-native-paper";
import { useTheme } from "../../../context/ThemeContext";
import CustomButton from "../../../components/customButton";
import SearchHeaderBar from "../../../components/searchHeaderBar";
import { Services } from "../../../api/index";
import AddProductModal from "./addProductModal";
import { formatDate, safeToFixed } from "../../../utils/helpers";

// Pagina de Productos, donde se gestionan los productos del inventario
const ProductsScreen = () => {
  const { themeObject } = useTheme();
  const styles = createStyles(themeObject);

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [suppliersMap, setSuppliersMap] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);

  // Cargar productos y proveedores
  useEffect(() => {
    const loadData = async () => {
      try {
        const [inventoryData, suppliersData] = await Promise.all([
          Services.Data.Inventory.getAll(),
          Services.Data.Suppliers.getAll(),
        ]);

        setProducts(inventoryData);

        const suppliersMapping = suppliersData.reduce((acc, supplier) => {
          acc[supplier.id_proveedor] = supplier.nombre_proveedor;
          return acc;
        }, {});
        setSuppliersMap(suppliersMapping);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [refreshKey]);

  //Manejo de eliminación de productos
  const handleDelete = async (id) => {
    try {
      await Services.Data.Inventory.delete(id);
      setProducts((prev) => prev.filter((p) => p.id_producto !== id));
    } catch (error) {
      Alert.alert("Error", "No se pudo eliminar el producto");
    }
  };

  // Manejo de éxito al crear o editar un producto
  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    setIsModalVisible(false);
    setSelectedProduct(null);
  };

  // Componente helper para filas de detalle
  const DetailRow = ({ label, value, theme }) => (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: theme.colors.placeholder }]}>
        {label}:
      </Text>
      <Text style={[styles.detailValue, { color: theme.colors.text }]}>
        {value || "N/A"}
      </Text>
    </View>
  );

  // Componente para renderizar cada producto
  const renderProductItem = ({ item }) => (
    <Card style={styles.productItem} onPress={() => setSelectedProduct(item)}>
      <View style={styles.productContent}>
        {/* Encabezado */}
        <View style={styles.productHeader}>
          <Text style={styles.productName}>{item.nombre_producto}</Text>
          <View style={styles.actionsContainer}>
            <CustomButton
              variant="error"
              size="sm"
              ionIconLeft="trash-outline"
              onPress={() => handleDelete(item.id_producto)}
              style={styles.iconButton}
            />
          </View>
        </View>

        {/* Referencia */}
        {item.referencia && (
          <Text style={styles.productReference}>Ref: {item.referencia}</Text>
        )}

        {/* Descripción */}
        <Text style={styles.productDescription}>{item.descripcion}</Text>

        {/* Detalles */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailColumn}>
            <DetailRow
              label="Stock Actual"
              value={item.cantidad_actual}
              theme={themeObject}
            />
            <DetailRow
              label="Stock Mínimo"
              value={item.cantidad_minima}
              theme={themeObject}
            />
          </View>

          <View style={styles.detailColumn}>
            <DetailRow
              label="Proveedor"
              value={suppliersMap[item.id_proveedor] || "No asignado"}
              theme={themeObject}
            />
            <DetailRow
              label="Última Actualización"
              value={formatDate(item.fecha_actualizacion)}
              theme={themeObject}
            />
          </View>
        </View>

        {/* Indicadores */}
        <View style={styles.stockPriceContainer}>
          <View
            style={[
              styles.stockIndicator,
              {
                backgroundColor:
                  item.cantidad_actual < item.cantidad_minima
                    ? themeObject.colors.error
                    : themeObject.colors.success,
              },
            ]}
          >
            <Text style={styles.stockText}>
              {item.cantidad_actual}/{item.cantidad_minima}
            </Text>
          </View>

          {/* Columna de precios */}
          <View style={styles.pricesColumn}>
            <Text style={styles.priceText}>
              Coste: ${safeToFixed(item.precio_unitario)}
            </Text>
            {item.pvp && (
              <Text style={styles.pvpText}>PVP: ${safeToFixed(item.pvp)}</Text>
            )}
          </View>
        </View>
      </View>
    </Card>
  );
  return (
    <View style={{ flex: 1 }}>
      <SearchHeaderBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onButtonPress={() => setIsModalVisible(true)}
        buttonText="Nuevo Producto"
        buttonVariant="info"
        buttonIconName="add-circle-outline"
        searchPlaceholder="Buscar productos..."
        containerStyle={styles.topBar}
      />
      <View style={styles.container}>
        {/* Barra superior */}

        {/* Listado */}
        {isLoading ? (
          <ActivityIndicator size="large" color={themeObject.colors.accent} />
        ) : (
          <FlatList
            showsVerticalScrollIndicator={false}
            data={products.filter(
              (p) =>
                p.nombre_producto
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase()) ||
                p.descripcion.toLowerCase().includes(searchQuery.toLowerCase())
            )}
            keyExtractor={(item) => item.id_producto.toString()}
            renderItem={renderProductItem}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No hay productos registrados</Text>
            }
          />
        )}

        {/* Modal */}
        <AddProductModal
          visible={isModalVisible || !!selectedProduct}
          onClose={() => {
            setIsModalVisible(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
          onCreateSuccess={handleSuccess}
        />
      </View>
    </View>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 8,
      backgroundColor: theme.colors.background,
    },
    topBar: {
      flexDirection: "row",
      gap: 16,
      marginBottom: 24,
      ...Platform.select({
        web: { gap: "1rem", marginBottom: "1.5rem" },
      }),
    },
    productItem: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      cursor: "pointer",
      padding: 16,
      margin: 10,
    },
    productName: {
      color: theme.colors.text,
      fontWeight: "600",
      fontSize: 16,
    },
    productReference: {
      color: theme.colors.placeholder,
      fontSize: 13,
      marginBottom: 4,
    },
    productDescription: {
      color: theme.colors.text,
      marginBottom: 8,
    },
    productHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    actionsContainer: {
      flexDirection: "row",
      gap: 8,
    },
    iconButton: {
      width: 36,
      height: 36,
      padding: 0,
    },
    detailsGrid: {
      flexDirection: "row",
      gap: 20,
      marginVertical: 12,
    },
    detailColumn: {
      flex: 1,
      gap: 8,
    },
    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "baseline",
    },
    detailLabel: {
      fontSize: 12,
      flex: 1,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: "500",
      marginLeft: 8,
      flex: 1,
      textAlign: "right",
    },
    stockPriceContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 12,
    },
    stockIndicator: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 20,
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    stockText: {
      color: theme.colors.buttonWhite,
      fontWeight: "600",
      fontSize: 14,
    },
    pricesColumn: {
      alignItems: "flex-end",
    },
    priceText: {
      color: theme.colors.text,
      fontSize: 15,
      fontWeight: "700",
    },
    pvpText: {
      color: theme.colors.accent,
      fontSize: 14,
      fontWeight: "600",
      marginTop: 4,
    },
    emptyText: {
      textAlign: "center",
      color: theme.colors.placeholder,
      marginTop: 20,
    },
    addButton: {
      width: 160,
      ...Platform.select({
        web: { width: "auto", paddingHorizontal: "1.5rem" },
      }),
    },
  });

export default ProductsScreen;
