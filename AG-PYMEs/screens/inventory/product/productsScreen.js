import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  View,
  FlatList,
  Text,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import SearchHeaderBar from "../../../components/searchHeaderBar";
import { Services } from "../../../api/index";
import AddProductModal from "./addProductModal";
import ProductCard from "./ProductCard";
import useNotifications from "../../../hooks/useNotifications";

// Pagina de Productos, donde se gestionan los productos del inventario
const ProductsScreen = forwardRef(
  ({ hideSearchBar = false, externalSearchQuery = "" }, ref) => {
    const { themeObject } = useTheme();
    const styles = createStyles(themeObject);
    const { showError, showConfirmDialog, showSuccess } = useNotifications();

    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [suppliersMap, setSuppliersMap] = useState({});
    const [refreshKey, setRefreshKey] = useState(0);

    // Usar búsqueda externa si se proporciona
    const currentSearchQuery = externalSearchQuery || searchQuery;

    // Exponer métodos para el componente padre
    useImperativeHandle(ref, () => ({
      openAddModal: () => setIsModalVisible(true),
      refreshData: () => setRefreshKey((prev) => prev + 1),
    }));

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
          showError("Error", "Error cargando datos de productos");
        } finally {
          setIsLoading(false);
        }
      };

      loadData();
    }, [refreshKey]);
    //Manejo de eliminación de productos
    const handleDelete = async (id) => {
      showConfirmDialog(
        "Confirmar eliminación",
        "¿Estás seguro de eliminar este producto?",
        async () => {
          try {
            await Services.Data.Inventory.delete(id);
            setProducts((prev) => prev.filter((p) => p.id_producto !== id));
            showSuccess("Producto eliminado correctamente");
          } catch (error) {
            showError("Error", "No se pudo eliminar el producto");
          }
        },
        () => {}, // Función onCancel vacía
        "Eliminar",
        "Cancelar"
      );
    };
    // Manejo de éxito al crear o editar un producto
    const handleSuccess = (isEdit = false) => {
      setRefreshKey((prev) => prev + 1);
      setIsModalVisible(false);
      setSelectedProduct(null);
      showSuccess(
        isEdit
          ? "Producto actualizado correctamente"
          : "Producto creado correctamente"
      );
    }; // Componente para renderizar cada producto
    const renderProductItem = ({ item }) => (
      <ProductCard
        product={item}
        onEdit={setSelectedProduct}
        onDelete={handleDelete}
        suppliersMap={suppliersMap}
      />
    );
    return (
      <View style={{ flex: 1 }}>
        {!hideSearchBar && (
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
        )}
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
                    .includes(currentSearchQuery.toLowerCase()) ||
                  p.descripcion
                    .toLowerCase()
                    .includes(currentSearchQuery.toLowerCase())
              )}
              keyExtractor={(item) => item.id_producto.toString()}
              renderItem={renderProductItem}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  No hay productos registrados
                </Text>
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
  }
);

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
