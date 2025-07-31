import React, {
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import { ActivityIndicator, Card, IconButton } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import ClientModal from "./ClientModal";
import ClientInfoComponent from "./ClientInfoComponent";
import SearchHeaderBar from "../../../components/searchHeaderBar";
import useNotifications from "../../../hooks/useNotifications";
import ModalTemplate from "../../../components/modalTemplate";
import PopupMenu, {
  MenuItem,
  MenuDivider,
} from "../../../components/popupMenu";
import { Services } from "../../../api/index";

// Componente ClientsScreen para gestionar y visualizar clientes
const ClientsScreen = forwardRef(
  ({ hideSearchBar = false, externalSearchQuery = "" }, ref) => {
    const { themeObject } = useTheme();
    const { showError, showSuccess, showConfirmDialog } = useNotifications();
    const [clients, setClients] = useState([]);
    const [filteredClients, setFilteredClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [menuVisible, setMenuVisible] = useState({});
    const [showNewClientForm, setShowNewClientForm] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [clientToDelete, setClientToDelete] = useState(null);

    // Usar búsqueda externa si se proporciona
    const currentSearchQuery = externalSearchQuery || searchQuery;

    // Exponer métodos al componente padre
    useImperativeHandle(ref, () => ({
      openModal: () => handleAddClient(),
    }));

    //Manejo de apertura y cierre del menú contextual
    const openMenu = (clientId) => {
      setMenuVisible({ ...menuVisible, [clientId]: true });
    };

    const closeMenu = (clientId) => {
      setMenuVisible({ ...menuVisible, [clientId]: false });
    };

    useFocusEffect(
      useCallback(() => {
        fetchClients();
      }, [])
    );

    // Efecto para aplicar filtros cada vez que cambian los clientes o la consulta de búsqueda
    useEffect(() => {
      applyFilters();
    }, [clients, currentSearchQuery]);
    const fetchClients = async () => {
      setLoading(true);
      try {
        const response = await Services.Data.Clients.getAll();
        setClients(response || []);
        setFilteredClients(response || []);
      } catch (error) {
        console.error("Error al cargar clientes:", error);
        setClients([]);
        setFilteredClients([]);
        showError("Error", "No se pudieron cargar los clientes");
      } finally {
        setLoading(false);
      }
    };

    // Función para aplicar filtros basados en la consulta de búsqueda
    const applyFilters = async () => {
      if (!currentSearchQuery.trim()) {
        setFilteredClients(clients);
        return;
      }

      try {
        // Usar el servicio de búsqueda en lugar de filtrar localmente
        const results = await Services.Data.Clients.search(currentSearchQuery);
        setFilteredClients(results || []);
      } catch (error) {
        console.error("Error al buscar clientes:", error);
        // Si la búsqueda falla, intentamos filtrar localmente como fallback
        const query = currentSearchQuery.toLowerCase();
        const filtered = clients.filter(
          (client) =>
            client.nombre.toLowerCase().includes(query) ||
            client.apellido.toLowerCase().includes(query) ||
            (client.email && client.email.toLowerCase().includes(query)) ||
            (client.telefono && client.telefono.includes(query))
        );
        setFilteredClients(filtered);
      }
    };

    // Funciones para manejar acciones de cliente
    const handleAddClient = () => {
      setSelectedClient(null);
      setShowNewClientForm(true);
      setIsModalVisible(true);
    };
    const handleEditClient = (client) => {
      setSelectedClient(client);
      setShowNewClientForm(true);
      setIsModalVisible(true);
      closeMenu(client.id_cliente);
    };
    const handleDeleteClient = (client) => {
      setClientToDelete(client);
      setDeleteModalVisible(true);
      closeMenu(client.id_cliente);
    };
    const deleteClient = async (clientId) => {
      setLoading(true);
      try {
        await Services.Data.Clients.delete(clientId);

        // Actualizar el estado local tras eliminar correctamente
        setClients(clients.filter((client) => client.id_cliente !== clientId));
        showSuccess("Cliente eliminado correctamente");
      } catch (error) {
        console.error("Error al eliminar cliente:", error);

        // Si hay un error 409, es porque hay registros asociados
        if (error.status === 409) {
          Alert.alert(
            "No se puede eliminar",
            "Este cliente tiene ventas u otros registros asociados."
          );
        } else {
          showError("Error", "No se pudo eliminar el cliente");
        }
      } finally {
        setLoading(false);
      }
    };

    // Función para manejar la vista del historial de compras del cliente (TODO)
    const handleViewClientHistory = (client) => {
      // Navegar a la vista de historial del cliente
      showInfo("Función de historial pendiente de implementar");
      closeMenu(client.id_cliente);
    };

    const formatDate = (dateString) => {
      if (!dateString) return "N/A";
      const options = { year: "numeric", month: "short", day: "numeric" };
      return new Date(dateString).toLocaleDateString("es-ES", options);
    };

    // Función para manejar la selección de cliente desde el modal
    const handleSelectClient = (newClientData) => {
      if (selectedClient) {
        // Editar cliente existente
        const updatedClients = clients.map((client) =>
          client.id_cliente === selectedClient.id_cliente
            ? { ...client, ...newClientData }
            : client
        );
        setClients(updatedClients);
        setFilteredClients(updatedClients);
      } else {
        // Añadir nuevo cliente
        const newClient = {
          id_cliente: newClientData.id_cliente || Date.now(), // Usar el ID de la API o uno simulado para desarrollo
          ...newClientData,
          fecha_registro:
            newClientData.fecha_registro || new Date().toISOString(),
        };
        const updatedClients = [newClient, ...clients];
        setClients(updatedClients);
        setFilteredClients(updatedClients);
      }
      // Reset states
      setIsModalVisible(false);
      setSelectedClient(null);
      setShowNewClientForm(false);
    };

    // Renderiza cada cliente en la lista
    const renderClientItem = ({ item }) => (
      <Card
        style={[
          styles.clientCard,
          { backgroundColor: themeObject.colors.surface },
        ]}
      >
        <Card.Content>
          <View style={styles.clientHeader}>
            <View>
              <Text
                style={[styles.clientName, { color: themeObject.colors.text }]}
              >
                {item.nombre} {item.apellido}
                {item.tipo_cliente !== "particular" && (
                  <Text style={{ fontStyle: "italic" }}>
                    {" "}
                    • {item.tipo_cliente === "empresa" ? "Empresa" : "Autónomo"}
                  </Text>
                )}
              </Text>
              {item.razon_social && (
                <Text style={{ color: themeObject.colors.text, fontSize: 13 }}>
                  {item.razon_social}
                </Text>
              )}
              {item.fecha_registro && (
                <Text
                  style={[
                    styles.clientRegistered,
                    { color: themeObject.colors.placeholder },
                  ]}
                >
                  Desde el {formatDate(item.fecha_registro)}
                </Text>
              )}
            </View>
            <PopupMenu
              visible={!!menuVisible[item.id_cliente]}
              contentStyle={{
                backgroundColor: themeObject.colors.surface,
              }}
              onDismiss={() => closeMenu(item.id_cliente)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={20}
                  onPress={() => openMenu(item.id_cliente)}
                  color={themeObject.colors.placeholder}
                />
              }
            >
              <MenuItem
                onPress={() => handleEditClient(item)}
                title="Editar"
                leadingIcon="pencil"
              />
              <MenuItem
                onPress={() => handleViewClientHistory(item)}
                title="Historial de compras"
                leadingIcon="timer"
              />
              <MenuDivider />
              <MenuItem
                onPress={() => handleDeleteClient(item)}
                title="Eliminar"
                leadingIcon="trash-outline"
                titleStyle={{ color: themeObject.colors.error }}
              />
            </PopupMenu>
          </View>

          <ClientInfoComponent
            client={item}
            customStyles={{
              container: {
                backgroundColor: "transparent",
                padding: 0,
                marginBottom: 0,
              },
            }}
            showDetailedInfo={true}
          />

          <View style={styles.clientContacts}>
            {item.telefono && (
              <Pressable style={styles.contactButton}>
                <Ionicons
                  name="call-outline"
                  size={18}
                  color={themeObject.colors.primary}
                />
                <Text
                  style={[
                    styles.contactText,
                    { color: themeObject.colors.primary },
                  ]}
                >
                  Llamar
                </Text>
              </Pressable>
            )}

            {item.email && (
              <Pressable style={styles.contactButton}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={themeObject.colors.primary}
                />
                <Text
                  style={[
                    styles.contactText,
                    { color: themeObject.colors.primary },
                  ]}
                >
                  Email
                </Text>
              </Pressable>
            )}
          </View>
        </Card.Content>
      </Card>
    );
    return (
      <View style={{ flex: 1 }}>
        {!hideSearchBar && (
          <SearchHeaderBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onButtonPress={handleAddClient}
            buttonText="Nuevo Cliente"
            buttonVariant="info"
            buttonIconName="add-outline"
            searchPlaceholder="Buscar cliente por nombre, email, teléfono..."
            containerStyle={styles.searchBarContainer}
          />
        )}
        <View
          style={[
            styles.container,
            { backgroundColor: themeObject.colors.background },
          ]}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={themeObject.colors.primary}
              />
              <Text
                style={[styles.loadingText, { color: themeObject.colors.text }]}
              >
                Cargando clientes...
              </Text>
            </View>
          ) : filteredClients.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="people-outline"
                size={60}
                color={themeObject.colors.placeholder}
              />
              <Text
                style={[styles.emptyText, { color: themeObject.colors.text }]}
              >
                No se encontraron clientes
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredClients}
              renderItem={renderClientItem}
              keyExtractor={(item) => item.id_cliente.toString()}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            />
          )}
          <ClientModal
            visible={isModalVisible}
            onClose={() => {
              setIsModalVisible(false);
              setSelectedClient(null);
              setShowNewClientForm(false);
            }}
            onSelectClient={handleSelectClient}
            showNewClientForm={showNewClientForm}
            clientToEdit={selectedClient}
          />

          {/* Modal de confirmación para eliminar cliente */}
          <ModalTemplate
            isVisible={deleteModalVisible}
            title="Confirmar eliminación"
            text={
              clientToDelete
                ? `¿Estás seguro de eliminar a ${clientToDelete.nombre} ${clientToDelete.apellido}?`
                : ""
            }
            warning="Esta acción no se puede deshacer. Si el cliente tiene ventas u otros registros asociados, no podrá ser eliminado."
            cancelLabel="Cancelar"
            cancelAction={() => setDeleteModalVisible(false)}
            confirmLabel="Eliminar"
            confirmAction={() => {
              if (clientToDelete) {
                deleteClient(clientToDelete.id_cliente);
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
    marginBottom: 16,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addButton: {
    minWidth: 100,
  },
  list: {
    padding: 4,
    gap: 12,
  },
  clientCard: {
    borderRadius: 10,
    marginBottom: 8,
    elevation: 2,
  },
  clientHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "700",
  },
  clientRegistered: {
    fontSize: 12,
  },
  clientDetails: {
    marginTop: 8,
    gap: 8,
  },
  clientDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  clientDetailText: {
    fontSize: 14,
  },
  clientContacts: {
    flexDirection: "row",
    gap: 16,
    marginTop: 12,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  contactText: {
    fontSize: 14,
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
    fontSize: 16,
    textAlign: "center",
  },
});

export default ClientsScreen;
