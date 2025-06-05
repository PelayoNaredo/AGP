import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Card, Chip } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import PopupMenu, {
  MenuItem,
  MenuDivider,
} from "../../../components/popupMenu";
import ModalTemplate from "../../../components/modalTemplate";
import CustomButton from "../../../components/customButton";

// Componente ServiceCard para mostrar los detalles de un servicio
const ServiceCard = ({
  service,
  onEdit,
  onDelete,
  onToggleStatus,
  themeObject,
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [newStatusValue, setNewStatusValue] = useState(false);

  // Asegurar que precio_base sea un número
  const precioBase =
    typeof service.precio_base === "string"
      ? parseFloat(service.precio_base)
      : typeof service.precio_base === "number"
        ? service.precio_base
        : 0;

  // Funciones para manejar la visibilidad del menú
  const openMenu = () => {
    setMenuVisible(true);
  };

  const closeMenu = () => {
    setMenuVisible(false);
  };

  const handleEditService = () => {
    closeMenu();
    onEdit(service);
  };

  const handleDeleteService = () => {
    closeMenu();
    onDelete(service);
  };

  const handleToggleServiceStatus = () => {
    closeMenu();
    const newStatus = !service.activo;
    setNewStatusValue(newStatus);
    setStatusModalVisible(true);
  };

  const confirmStatusChange = () => {
    onToggleStatus(service.id_servicio, newStatusValue);
    setStatusModalVisible(false);
  };

  return (
    <>
      <Card
        style={[
          styles.serviceCard,
          {
            backgroundColor: themeObject.colors.surface,
          },
          !service.activo && {
            borderColor: themeObject.colors.placeholder,
            borderWidth: 1,
            opacity: 0.7,
          },
        ]}
      >
        <Card.Content>
          <View style={styles.serviceHeader}>
            <View style={styles.serviceHeaderLeft}>
              <Text
                style={[styles.serviceName, { color: themeObject.colors.text }]}
              >
                {service.nombre_servicio}
              </Text>
              <View style={styles.tagsContainer}>
                {!service.activo && (
                  <Chip
                    style={{ backgroundColor: themeObject.colors.errorLight }}
                    textStyle={{
                      color: themeObject.colors.error,
                      fontSize: 11,
                    }}
                  >
                    Inactivo
                  </Chip>
                )}
                <Chip
                  style={{ backgroundColor: themeObject.colors.surface }}
                  textStyle={{ color: themeObject.colors.text, fontSize: 11 }}
                >
                  {service.categoria}
                </Chip>
                <Chip
                  style={{ backgroundColor: themeObject.colors.surface }}
                  textStyle={{ color: themeObject.colors.text, fontSize: 11 }}
                >
                  {service.tipo_tarifa === "fijo"
                    ? "Tarifa fija"
                    : service.tipo_tarifa === "por_hora"
                      ? "Por hora"
                      : service.tipo_tarifa === "variable"
                        ? "Variable"
                        : service.tipo_tarifa === "mano_obra"
                          ? "Mano de obra"
                          : "Por nivel"}
                </Chip>
              </View>
            </View>

            <PopupMenu
              visible={menuVisible}
              contentStyle={{
                backgroundColor: themeObject.colors.surface,
              }}
              onDismiss={closeMenu}
              anchor={
                <CustomButton
                  variant="icon"
                  size="icon"
                  ionIconLeft="ellipsis-vertical"
                  onPress={openMenu}
                  style={{
                    backgroundColor: themeObject.colors.surface,
                    borderRadius: 10,
                    elevation: 2,
                  }}
                />
              }
            >
              <MenuItem
                onPress={handleEditService}
                title="Editar"
                leadingIcon="pencil"
              />
              <MenuItem
                onPress={handleToggleServiceStatus}
                title={service.activo ? "Desactivar" : "Activar"}
                leadingIcon={
                  service.activo
                    ? "close-circle-outline"
                    : "checkmark-circle-outline"
                }
              />
              <MenuDivider />
              <MenuItem
                onPress={handleDeleteService}
                title="Eliminar"
                leadingIcon="trash-outline"
                titleStyle={{ color: themeObject.colors.error }}
              />
            </PopupMenu>
          </View>

          <View style={styles.serviceBody}>
            {service.descripcion && (
              <Text
                style={[
                  styles.serviceDescription,
                  { color: themeObject.colors.placeholder },
                ]}
              >
                {service.descripcion}
              </Text>
            )}

            <View style={styles.serviceInfo}>
              <View style={styles.serviceInfoItem}>
                <Ionicons
                  name="cash-outline"
                  size={16}
                  color={themeObject.colors.placeholder}
                />
                <Text
                  style={[
                    styles.serviceInfoText,
                    { color: themeObject.colors.text },
                  ]}
                >
                  {precioBase.toFixed(2)} €
                  {service.tipo_tarifa === "por_hora" ? "/hora" : ""}
                </Text>
              </View>

              {service.duracion_estimada_minutos > 0 && (
                <View style={styles.serviceInfoItem}>
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={themeObject.colors.placeholder}
                  />
                  <Text
                    style={[
                      styles.serviceInfoText,
                      { color: themeObject.colors.text },
                    ]}
                  >
                    {service.duracion_estimada_minutos} min
                  </Text>
                </View>
              )}

              <View style={styles.serviceInfoItem}>
                <Ionicons
                  name={
                    service.requiere_profesional ? "person" : "people-outline"
                  }
                  size={16}
                  color={themeObject.colors.placeholder}
                />
                <Text
                  style={[
                    styles.serviceInfoText,
                    { color: themeObject.colors.text },
                  ]}
                >
                  {service.requiere_profesional
                    ? "Requiere profesional"
                    : "No requiere profesional"}
                </Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Modal de confirmación para cambio de estado */}
      <ModalTemplate
        isVisible={statusModalVisible}
        title="Confirmar cambio de estado"
        text={`¿Estás seguro de ${newStatusValue ? "activar" : "desactivar"} el servicio "${service.nombre_servicio}"?`}
        cancelLabel="Cancelar"
        cancelAction={() => setStatusModalVisible(false)}
        confirmLabel="Confirmar"
        confirmAction={confirmStatusChange}
      />
    </>
  );
};

const styles = StyleSheet.create({
  serviceCard: {
    borderRadius: 10,
    marginBottom: 8,
    elevation: 2,
  },
  serviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  serviceHeaderLeft: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 8,
  },
  serviceBody: {
    marginTop: 4,
  },
  serviceDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  serviceInfo: {
    gap: 8,
  },
  serviceInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  serviceInfoText: {
    fontSize: 14,
  },
});

export default ServiceCard;
