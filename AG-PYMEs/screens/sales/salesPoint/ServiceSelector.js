import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
  Dimensions,
} from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import { Card } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { Services } from "../../../api";
import ServiceLevelSelector from "./components/ServiceLevelSelector";
import LaborPriceEditor from "./components/LaborPriceEditor";

// Componente ServiceSelector para seleccionar servicios en el punto de venta
const ServiceSelector = ({ onSelectService }) => {
  const { themeObject } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("todos");
  const [categories, setCategories] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [isLevelSelectorVisible, setIsLevelSelectorVisible] = useState(false);
  const [isLaborEditorVisible, setIsLaborEditorVisible] = useState(false);
  const windowHeight = Dimensions.get("window").height;
  const isMobile = Platform.OS !== "web";

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeObject.colors.background,
      maxHeight: Platform.OS === "web" ? "100%" : "80%",
    },
    header: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 12,
      color: themeObject.colors.text,
    },
    searchInput: {
      backgroundColor: themeObject.colors.surface,
      borderRadius: themeObject.roundness,
      padding: 10,
      borderWidth: 1,
      borderColor: themeObject.colors.border,
      marginBottom: 16,
      color: themeObject.colors.text,
    },
    categoriesContainer: {
      flexDirection: "row",
      marginBottom: 16,
      flexWrap: "wrap",
    },
    categoryButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginRight: 8,
      marginBottom: 8,
    },
    categoryText: {
      fontSize: 14,
    },
    serviceCard: {
      backgroundColor: themeObject.colors.surface,
      margin: 10,
      borderRadius: 8,
      overflow: "hidden",
    },
    serviceItem: {
      flexDirection: "row",
      padding: 12,
    },
    serviceInfo: {
      flex: 1,
    },
    serviceName: {
      fontSize: 16,
      fontWeight: "500",
      marginBottom: 4,
    },
    serviceDescription: {
      fontSize: 13,
      marginBottom: 4,
    },
    servicePrice: {
      fontSize: 15,
      fontWeight: "bold",
    },
    serviceMeta: {
      fontSize: 12,
      marginTop: 4,
    },
    addButton: {
      backgroundColor: themeObject.colors.primary,
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      alignSelf: "center",
      marginLeft: 10,
    },
    addButtonText: {
      color: "#FFFFFF",
      fontSize: 20,
      fontWeight: "bold",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    emptyContainer: {
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    emptyText: {
      color: themeObject.colors.placeholder,
      fontSize: 16,
      textAlign: "center",
    },
    serviceTypeContainer: {
      flexDirection: "row",
      marginTop: 4,
      alignItems: "center",
    },
    serviceTypeTag: {
      backgroundColor: themeObject.colors.surface,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      marginRight: 8,
    },
    serviceTypeText: {
      fontSize: 11,
    },
  });

  // Cargar servicios al montar el componente y filtrar por búsqueda y categoría
  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    filterServices();
  }, [services, searchQuery, activeCategory]);
  const fetchServices = async () => {
    setLoading(true);
    try {
      let response;
      // Obtener servicios activos de la API
      response = await Services.Data.Services.getAll();

      setServices(response || []);

      // Extraer categorías únicas de los servicios
      const uniqueCategories = [
        ...new Set(response.map((service) => service.categoria)),
      ].filter(Boolean);
      setCategories(["todos", ...uniqueCategories]);
    } catch (error) {
      console.error("Error al cargar servicios:", error);
      // En caso de error, inicializamos con arrays vacíos
      setServices([]);
      setCategories(["todos"]);
    } finally {
      setLoading(false);
    }
  };

  const filterServices = async () => {
    // Solo mostrar el indicador de carga si estamos haciendo una búsqueda por texto
    // que requiere una petición a la API
    const needsApiCall = searchQuery.trim() !== "";
    if (needsApiCall) {
      setLoading(true);
    }

    try {
      let filtered = []; // Si hay un término de búsqueda, usamos la función de búsqueda
      if (searchQuery.trim()) {
        const searchResults = await Services.Data.Services.search(
          searchQuery,
          true
        );
        filtered = searchResults || [];
      } else if (activeCategory !== "todos") {
        // Si hay una categoría seleccionada que no sea "todos", filtramos localmente
        // en lugar de hacer una nueva llamada a la API
        filtered = services.filter(
          (service) => service.categoria === activeCategory
        );
      } else {
        // Si no hay filtros, mostramos todos los servicios
        filtered = [...services];
      }

      // Asegurarnos de que todos los servicios estén activos
      filtered = filtered.filter((service) => service.activo);

      setFilteredServices(filtered);
    } catch (error) {
      console.error("Error al filtrar servicios:", error);
      setFilteredServices([]);
    } finally {
      if (needsApiCall) {
        setLoading(false);
      }
    }
  };

  // Manejador para cuando se selecciona un servicio
  const handleSelectService = async (service) => {
    // Si es un servicio por nivel, mostrar el selector de niveles
    if (service.tipo_tarifa === "por_nivel") {
      try {
        // Cargar el servicio completo con niveles desde la API
        const completeService = await Services.Data.Services.getById(
          service.id_servicio
        );
        if (completeService && completeService.niveles) {
          setSelectedService(completeService);
          setIsLevelSelectorVisible(true);
        } else {
          console.error("El servicio no tiene niveles definidos");
          // Mostrar el modal igualmente, pero sin niveles
          setSelectedService(service);
          setIsLevelSelectorVisible(true);
        }
      } catch (error) {
        console.error("Error al cargar niveles de servicio:", error);
        setSelectedService(service);
        setIsLevelSelectorVisible(true);
      }
    }
    // Si es mano de obra, mostrar el editor de precio
    else if (service.tipo_tarifa === "mano_obra") {
      setSelectedService(service);
      setIsLaborEditorVisible(true);
    }
    // Para otros tipos de servicio, añadir directamente
    else {
      onSelectService(service);
    }
  };

  // Manejador para cuando se selecciona un nivel de servicio
  const handleLevelSelected = (level) => {
    if (!selectedService || !level) return;

    // Crear una copia del servicio con el nivel seleccionado
    const serviceWithLevel = {
      ...selectedService,
      nivel_seleccionado: level,
      precio_base: level.precio, // Usar el precio del nivel seleccionado
      nombre_nivel: level.nombre_nivel,
    };

    onSelectService(serviceWithLevel);
  };

  // Manejador para cuando se confirma un precio personalizado
  const handleLaborPriceConfirmed = (customService) => {
    onSelectService(customService);
  };

  // Renderizar cada tarjeta de servicio
  const renderServiceCard = ({ item }) => {
    // Asegurar que precio_base sea un número
    const precioBase =
      typeof item.precio_base === "string"
        ? parseFloat(item.precio_base)
        : typeof item.precio_base === "number"
          ? item.precio_base
          : 0;

    return (
      <Card style={styles.serviceCard}>
        <View style={styles.serviceItem}>
          <View style={styles.serviceInfo}>
            <Text
              style={[styles.serviceName, { color: themeObject.colors.text }]}
            >
              {item.nombre_servicio}
            </Text>
            {item.descripcion && (
              <Text
                style={[
                  styles.serviceDescription,
                  { color: themeObject.colors.placeholder },
                ]}
                numberOfLines={2}
              >
                {item.descripcion}
              </Text>
            )}
            <Text
              style={[styles.servicePrice, { color: themeObject.colors.text }]}
            >
              {item.tipo_tarifa === "por_nivel"
                ? "Varios precios"
                : `${precioBase.toFixed(2)} €${item.tipo_tarifa === "por_hora" ? "/hora" : ""}`}
            </Text>

            <View style={styles.serviceTypeContainer}>
              <View style={styles.serviceTypeTag}>
                <Text
                  style={[
                    styles.serviceTypeText,
                    { color: themeObject.colors.text },
                  ]}
                >
                  {item.tipo_tarifa === "fijo"
                    ? "Tarifa fija"
                    : item.tipo_tarifa === "por_hora"
                      ? "Por hora"
                      : item.tipo_tarifa === "variable"
                        ? "Variable"
                        : item.tipo_tarifa === "mano_obra"
                          ? "Mano de obra"
                          : "Por nivel"}
                </Text>
              </View>
              {item.duracion_estimada_minutos > 0 && (
                <View style={styles.serviceTypeTag}>
                  <Text
                    style={[
                      styles.serviceTypeText,
                      { color: themeObject.colors.text },
                    ]}
                  >
                    {item.duracion_estimada_minutos} min
                  </Text>
                </View>
              )}
            </View>
          </View>
          {/* Botón diferente para servicios por nivel y mano de obra */}
          {item.tipo_tarifa === "por_nivel" ? (
            <Pressable
              style={[
                styles.addButton,
                { backgroundColor: themeObject.colors.secondary },
              ]}
              onPress={() => handleSelectService(item)}
            >
              <Ionicons name="list" size={20} color="white" />
            </Pressable>
          ) : item.tipo_tarifa === "mano_obra" ? (
            <Pressable
              style={[
                styles.addButton,
                { backgroundColor: themeObject.colors.accent },
              ]}
              onPress={() => handleSelectService(item)}
            >
              <Ionicons name="create" size={20} color="white" />
            </Pressable>
          ) : (
            <Pressable
              style={styles.addButton}
              onPress={() => handleSelectService(item)}
            >
              <Ionicons name="add" size={20} color="white" />
            </Pressable>
          )}
        </View>
      </Card>
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeObject.colors.primary} />
        <Text style={{ color: themeObject.colors.text, marginTop: 10 }}>
          Cargando servicios...
        </Text>
      </View>
    );
  }
  return (
    <View
      style={[
        styles.container,
        { height: isMobile ? windowHeight * 0.6 : undefined },
      ]}
    >
      <Text style={styles.header}>Servicios</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Buscar servicios..."
        placeholderTextColor={themeObject.colors.placeholder}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <View style={styles.categoriesContainer}>
        {categories.map(renderCategoryButton)}
      </View>

      {filteredServices.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="document-outline"
            size={40}
            color={themeObject.colors.placeholder}
          />
          <Text style={styles.emptyText}>
            No se encontraron servicios que coincidan con tu búsqueda.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredServices}
          renderItem={renderServiceCard}
          keyExtractor={(item) => item.id_servicio.toString()}
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: isMobile ? windowHeight * 0.4 : undefined }}
        />
      )}

      {/* Modal Selector de Niveles */}
      <ServiceLevelSelector
        visible={isLevelSelectorVisible}
        onClose={() => setIsLevelSelectorVisible(false)}
        service={selectedService}
        onSelectLevel={handleLevelSelected}
      />

      {/* Modal Editor de Precio de Mano de Obra */}
      <LaborPriceEditor
        visible={isLaborEditorVisible}
        onClose={() => setIsLaborEditorVisible(false)}
        service={selectedService}
        onConfirm={handleLaborPriceConfirmed}
      />
    </View>
  );
};

export default ServiceSelector;
