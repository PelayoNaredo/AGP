import {
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ScrollView,
} from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import { ActivityIndicator } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import ServiceModal from "./ServiceModal";
import ServiceCard from "./ServiceCard";
import CustomButton from "../../../components/customButton";
import SearchHeaderBar from "../../../components/searchHeaderBar";
import ModalTemplate from "../../../components/modalTemplate";
import { Services } from "../../../api";
import useNotifications from "../../../hooks/useNotifications";

// Pagina de servicios, permite ver, crear, editar y eliminar servicios
const ServicesScreen = forwardRef(
  ({ hideSearchBar = false, externalSearchQuery = "" }, ref) => {
    const { themeObject } = useTheme();
    const notifications = useNotifications();
    const [services, setServices] = useState([]);
    const [filteredServices, setFilteredServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("todos");
    const [categories, setCategories] = useState(["todos"]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    const [activeFilter, setActiveFilter] = useState("todos"); // 'todos', 'activos', 'inactivos'
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState(null);

    // Usar búsqueda externa si se proporciona
    const currentSearchQuery = externalSearchQuery || searchQuery;

    // Exponer métodos al componente padre
    useImperativeHandle(ref, () => ({
      openModal: () => handleAddService(),
    }));

    // Cargar servicios al iniciar la pantalla
    useFocusEffect(
      useCallback(() => {
        fetchServices();
      }, [])
    );

    // Filtrar servicios cada vez que cambian los servicios, la búsqueda, la categoría o el filtro activo
    useEffect(() => {
      filterServices();
    }, [services, currentSearchQuery, activeCategory, activeFilter]);
    const fetchServices = async () => {
      setLoading(true);
      try {
        let response;
        if (activeFilter === "inactivos") {
          // Si se necesitan también los servicios inactivos
          response = await Services.Data.Services.getAllAdmin();
        } else {
          // Por defecto trae los servicios activos
          response = await Services.Data.Services.getAll();
        }

        setServices(response || []);

        // Extraer categorías únicas de los servicios
        const uniqueCategories = [
          ...new Set(response.map((service) => service.categoria)),
        ].filter(Boolean);
        setCategories(["todos", ...uniqueCategories]);
      } catch (error) {
        console.error("Error al cargar servicios:", error);
        notifications.showErrorNotification(
          "No se pudieron cargar los servicios"
        );
        setServices([]);
        setCategories(["todos"]);
      } finally {
        setLoading(false);
      }
    };

    // Filtrar servicios según la categoría, estado y búsqueda
    const filterServices = () => {
      let filtered = [...services];

      // Filtrar por categoría
      if (activeCategory !== "todos") {
        filtered = filtered.filter(
          (service) => service.categoria === activeCategory
        );
      }

      // Filtrar por estado (activo/inactivo)
      if (activeFilter === "activos") {
        filtered = filtered.filter((service) => service.activo);
      } else if (activeFilter === "inactivos") {
        filtered = filtered.filter((service) => !service.activo);
      }

      // Filtrar por búsqueda
      if (currentSearchQuery.trim()) {
        const query = currentSearchQuery.toLowerCase();
        filtered = filtered.filter(
          (service) =>
            service.nombre_servicio.toLowerCase().includes(query) ||
            (service.descripcion &&
              service.descripcion.toLowerCase().includes(query))
        );
      }

      setFilteredServices(filtered);
    };

    // Manejo de acciones de añadir, editar y eliminar servicios
    const handleAddService = () => {
      setSelectedService(null);
      setIsModalVisible(true);
    };

    const handleEditService = (service) => {
      setSelectedService(service);
      setIsModalVisible(true);
    };

    const handleDeleteService = (service) => {
      setServiceToDelete(service);
      setDeleteModalVisible(true);
    };
    const handleDeleteServiceConfirmed = async (serviceId) => {
      setLoading(true);
      try {
        if (!serviceId) {
          console.error("[ERROR] serviceId es undefined o null");
          notifications.showErrorNotification("ID de servicio no válido");
          setLoading(false);
          return;
        }

        const response = await Services.Data.Services.delete(serviceId);

        // Comprobar si el servicio fue desactivado en lugar de eliminado
        if (response && response.inactivated) {
          // Actualizar el estado del servicio a inactivo en lugar de eliminarlo
          setServices(
            services.map((service) =>
              service.id_servicio === serviceId
                ? { ...service, activo: false }
                : service
            )
          );
          notifications.showWarning(
            response.message ||
              "El servicio ha sido desactivado porque tiene ventas asociadas."
          );
        } else {
          // Eliminar el servicio del estado
          setServices(
            services.filter((service) => service.id_servicio !== serviceId)
          );
          notifications.showSuccess("Servicio eliminado correctamente");
        }
      } catch (error) {
        console.error("[ERROR] Error al eliminar servicio:", error);
        notifications.showErrorNotification(
          "No se pudo eliminar el servicio: " +
            (error.message || "Error desconocido")
        );
      } finally {
        setLoading(false);
      }
    };

    // Actualizar el estado de un servicio (activo/inactivo)
    const updateServiceStatus = async (serviceId, newStatus) => {
      setLoading(true);
      try {
        // Primero necesitamos el servicio actual para actualizarlo
        const serviceToUpdate = services.find(
          (s) => s.id_servicio === serviceId
        );
        if (!serviceToUpdate) {
          throw new Error("Servicio no encontrado");
        }
        const updatedServiceData = {
          ...serviceToUpdate,
          activo: newStatus,
        };

        await Services.Data.Services.update(serviceId, updatedServiceData);

        setServices(
          services.map((service) =>
            service.id_servicio === serviceId
              ? { ...service, activo: newStatus }
              : service
          )
        );
        notifications.showSuccess(
          `Servicio ${newStatus ? "activado" : "desactivado"} correctamente`
        );
      } catch (error) {
        console.error("Error al actualizar estado del servicio:", error);
        notifications.showErrorNotification(
          "No se pudo actualizar el estado del servicio"
        );
      } finally {
        setLoading(false);
      }
    };

    // Manejo de guardado de servicio (nuevo o editado)
    const handleSaveService = (serviceData) => {
      if (selectedService) {
        // Actualizar servicio existente
        setServices(
          services.map((service) =>
            service.id_servicio === serviceData.id_servicio
              ? serviceData
              : service
          )
        );
      } else {
        // Añadir nuevo servicio
        setServices([serviceData, ...services]);
      }
    };

    // Renderizar cada tarjeta de servicio
    const renderServiceCard = ({ item }) => {
      return (
        <ServiceCard
          service={item}
          onEdit={handleEditService}
          onDelete={handleDeleteService}
          onToggleStatus={updateServiceStatus}
          themeObject={themeObject}
        />
      );
    };

    const renderCategoryButton = (category) => {
      const isActive = category === activeCategory;

      return (
        <Pressable
          key={category}
          style={[
            styles.categoryButton,
            {
              backgroundColor: isActive
                ? themeObject.colors.primary
                : themeObject.colors.surface,
            },
          ]}
          onPress={() => setActiveCategory(category)}
        >
          <Text
            style={[
              styles.categoryText,
              {
                color: isActive
                  ? themeObject.colors.buttonWhite
                  : themeObject.colors.text,
                fontWeight: isActive ? "bold" : "normal",
              },
            ]}
          >
            {category === "todos"
              ? "Todos"
              : category.charAt(0).toUpperCase() + category.slice(1)}
          </Text>
        </Pressable>
      );
    };

    const renderFilterButton = (filter, label, icon) => {
      const isActive = filter === activeFilter;

      return (
        <Pressable
          key={filter}
          style={[
            styles.filterButton,
            {
              backgroundColor: isActive
                ? themeObject.colors.primary
                : themeObject.colors.surface,
            },
          ]}
          onPress={() => setActiveFilter(filter)}
        >
          <Ionicons
            name={icon}
            size={16}
            color={
              isActive
                ? themeObject.colors.buttonWhite
                : themeObject.colors.placeholder
            }
            style={{ marginRight: 4 }}
          />
          <Text
            style={[
              styles.filterText,
              {
                color: isActive
                  ? themeObject.colors.buttonWhite
                  : themeObject.colors.text,
                fontWeight: isActive ? "bold" : "normal",
              },
            ]}
          >
            {label}
          </Text>
        </Pressable>
      );
    };
    return (
      <View style={{ flex: 1 }}>
        {!hideSearchBar && (
          <SearchHeaderBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onButtonPress={handleAddService}
            buttonText="Nuevo servicio"
            buttonVariant="info"
            buttonIconName="add-outline"
            searchPlaceholder="Buscar servicio por nombre o descripción..."
            containerStyle={styles.searchBarContainer}
          />
        )}
        <View
          style={[
            styles.container,
            { backgroundColor: themeObject.colors.background },
          ]}
        >
          <View style={styles.filtersContainer}>
            <View style={styles.categoriesContainer}>
              <Text
                style={[
                  styles.filtersTitle,
                  { color: themeObject.colors.text },
                ]}
              >
                Categorías:
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesScrollContent}
              >
                {categories.map(renderCategoryButton)}
              </ScrollView>
            </View>

            <View style={styles.statusFilterContainer}>
              <Text
                style={[
                  styles.filtersTitle,
                  { color: themeObject.colors.text },
                ]}
              >
                Estado:
              </Text>
              <View style={styles.statusButtons}>
                {renderFilterButton("todos", "Todos", "list-outline")}
                {renderFilterButton(
                  "activos",
                  "Activos",
                  "checkmark-circle-outline"
                )}
                {renderFilterButton(
                  "inactivos",
                  "Inactivos",
                  "close-circle-outline"
                )}
              </View>
            </View>
          </View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={themeObject.colors.primary}
              />
              <Text
                style={[styles.loadingText, { color: themeObject.colors.text }]}
              >
                Cargando servicios...
              </Text>
            </View>
          ) : filteredServices.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="construct-outline"
                size={60}
                color={themeObject.colors.placeholder}
              />
              <Text
                style={[styles.emptyText, { color: themeObject.colors.text }]}
              >
                No se encontraron servicios
              </Text>
              {searchQuery && (
                <Text
                  style={[
                    styles.emptySubtext,
                    { color: themeObject.colors.placeholder },
                  ]}
                >
                  Intenta con otra búsqueda o añade un nuevo servicio
                </Text>
              )}
              <CustomButton
                variant="primary"
                style={{ marginTop: 16 }}
                onPress={handleAddService}
              >
                Añadir servicio
              </CustomButton>
            </View>
          ) : (
            <FlatList
              data={filteredServices}
              renderItem={renderServiceCard}
              keyExtractor={(item) => item.id_servicio.toString()}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            />
          )}
          {/* Modal para crear/editar servicios */}
          <ServiceModal
            visible={isModalVisible}
            onClose={() => setIsModalVisible(false)}
            service={selectedService}
            onSave={handleSaveService}
          />
          {/* Modal de confirmación para eliminar servicio */}
          <ModalTemplate
            isVisible={deleteModalVisible}
            title="Confirmar eliminación"
            text={
              serviceToDelete
                ? `¿Estás seguro de eliminar el servicio "${serviceToDelete.nombre_servicio}"?`
                : ""
            }
            warning="Esta acción no se puede deshacer."
            cancelLabel="Cancelar"
            cancelAction={() => setDeleteModalVisible(false)}
            confirmLabel="Eliminar"
            confirmAction={() => {
              if (serviceToDelete) {
                handleDeleteServiceConfirmed(serviceToDelete.id_servicio);
                setDeleteModalVisible(false);
              }
            }}
          />
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addButton: {
    minWidth: 140,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filtersTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  categoriesContainer: {
    marginBottom: 12,
  },
  categoriesScrollContent: {
    paddingRight: 16,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
  },
  statusFilterContainer: {
    marginBottom: 8,
  },
  statusButtons: {
    flexDirection: "row",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
  },
  list: {
    padding: 4,
    gap: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    textAlign: "center",
  },
});

export default ServicesScreen;
