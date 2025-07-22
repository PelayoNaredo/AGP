import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import ModalTemplate from "../../../components/modalTemplate";
import { Ionicons } from "@expo/vector-icons";
import { Services } from "../../../api";
import CustomButton from "../../../components/customButton";
import NewClientForm from "./NewClientForm";

// Componente ClientModal para actualizar o crear un cliente
const ClientModal = ({
  visible,
  onClose,
  onSelectClient,
  showNewClientForm = false,
  clientToEdit = null,
}) => {
  const { themeObject } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewForm, setShowNewForm] = useState(showNewClientForm);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    searchBarContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    searchContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: themeObject.colors.background,
      borderRadius: themeObject.roundness,
      borderWidth: 1,
      borderColor: themeObject.colors.border,
      paddingHorizontal: 12,
      marginRight: 8,
    },
    newClientButton: {
      minWidth: 80,
    },
    searchInput: {
      flex: 1,
      height: 40,
      color: themeObject.colors.text,
      paddingHorizontal: 8,
    },
    clientsList: {
      maxHeight: 400,
    },
    clientItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: themeObject.colors.border,
    },
    clientInfo: {
      flex: 1,
    },
    clientName: {
      fontSize: 16,
      fontWeight: "500",
      color: themeObject.colors.text,
      marginBottom: 4,
    },
    clientContact: {
      fontSize: 14,
      color: themeObject.colors.placeholder,
    },
    selectButton: {
      backgroundColor: themeObject.colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 4,
    },
    selectButtonText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "500",
    },
    emptyStateContainer: {
      padding: 20,
      alignItems: "center",
    },
    emptyStateText: {
      color: themeObject.colors.placeholder,
      fontSize: 16,
      textAlign: "center",
      marginBottom: 16,
    },
    divider: {
      height: 1,
      backgroundColor: themeObject.colors.border,
      marginVertical: 16,
    },
    loadingText: {
      color: themeObject.colors.text,
      textAlign: "center",
      marginTop: 8,
    },
  });
  // Cargar clientes al abrir el modal o al cambiar el estado de creación de nuevo cliente
  useEffect(() => {
    if (visible) {
      fetchClients();
      setShowNewForm(showNewClientForm);
    }
  }, [visible, showNewClientForm]);

  // Filtrar clientes cuando cambia la lista de clientes o la consulta de búsqueda
  useEffect(() => {
    filterClients();
  }, [clients, searchQuery]);

  // Función para filtrar los clientes según la consulta de búsqueda
  const filterClients = () => {
    if (!searchQuery.trim()) {
      setFilteredClients(clients);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = clients.filter(
      (client) =>
        client.nombre.toLowerCase().includes(query) ||
        client.apellido.toLowerCase().includes(query) ||
        client.email.toLowerCase().includes(query) ||
        (client.telefono && client.telefono.includes(query))
    );
    setFilteredClients(filtered);
  }; // Función para cargar los clientes desde la API
  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const clients = await Services.Data.Clients.getAll();
      setClients(clients);
      setFilteredClients(clients);
    } catch (error) {
      setClients([]);
      setFilteredClients([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar la selección de un cliente
  const handleSelectClient = (client) => {
    onSelectClient(client);
    onClose();
  };

  // Manejar la creación de un nuevo cliente
  const handleNewClient = () => {
    setShowNewForm(true);
  };

  const handleClientCreated = (newClient) => {
    // Actualizar la lista y seleccionar el cliente creado
    setClients([newClient, ...clients]);
    setFilteredClients([newClient, ...filteredClients]);
    handleSelectClient(newClient);
  };

  // Renderizar cada cliente en la lista
  const renderClientItem = ({ item }) => (
    <View style={styles.clientItem}>
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>
          {item.nombre} {item.apellido}
        </Text>
        <Text style={styles.clientContact}>
          {item.email} · {item.telefono || "Sin teléfono"}
        </Text>
      </View>
      <Pressable
        style={styles.selectButton}
        onPress={() => handleSelectClient(item)}
      >
        <Text style={styles.selectButtonText}>Seleccionar</Text>
      </Pressable>
    </View>
  );

  // Si estamos mostrando el formulario de nuevo cliente o edición, renderizar ese modal
  if (showNewForm) {
    return (
      <NewClientForm
        visible={visible}
        onClose={() => {
          setShowNewForm(false);
          if (showNewClientForm) {
            onClose(); // Si se inició directamente en modo creación, cerrar al cancelar
          }
        }}
        onClientCreated={handleClientCreated}
        clientToEdit={clientToEdit}
      />
    );
  }

  return (
    <ModalTemplate
      isVisible={visible}
      title="Seleccionar Cliente"
      text="Busca y selecciona un cliente o crea uno nuevo"
      cancelLabel="Cerrar"
      cancelAction={onClose}
    >
      <View style={styles.container}>
        {/* Buscador con botón de nuevo cliente */}
        <View style={styles.searchBarContainer}>
          <View style={styles.searchContainer}>
            <Ionicons
              name="search-outline"
              size={20}
              color={themeObject.colors.placeholder}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar cliente..."
              placeholderTextColor={themeObject.colors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <CustomButton
            variant="primary"
            ionIconLeft="person-add-outline"
            onPress={handleNewClient}
            style={styles.newClientButton}
          >
            Nuevo
          </CustomButton>
        </View>

        <View style={styles.divider} />

        {isLoading ? (
          <View style={styles.emptyStateContainer}>
            <ActivityIndicator
              size="large"
              color={themeObject.colors.primary}
            />
            <Text style={styles.loadingText}>Cargando clientes...</Text>
          </View>
        ) : filteredClients.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>
              No se encontraron clientes con tu búsqueda
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredClients}
            renderItem={renderClientItem}
            keyExtractor={(item) => item.id_cliente.toString()}
            style={styles.clientsList}
          />
        )}
      </View>
    </ModalTemplate>
  );
};

export default ClientModal;
