import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, ScrollView } from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import ModalTemplate from "../../../components/modalTemplate";
import { Services } from "../../../api";
import CustomPicker from "../../../components/customPicker";
import useNotifications from "../../../hooks/useNotifications";

// Componente NewClientForm para crear o editar clientes
const NewClientForm = ({
  visible,
  onClose,
  onClientCreated,
  clientToEdit = null,
  initialData = {
    tipo_cliente: "particular",
    nombre: "",
    apellido: "",
    tipo_documento: "DNI",
    documento: "",
    direccion: "",
    codigo_postal: "",
    ciudad: "",
    provincia: "",
    pais: "España",
    telefono: "",
    email: "",
    razon_social: "",
    regimen_fiscal: "",
    tipo_iva: "general",
    descuento_preferencial: 0,
    notas: "",
  },
}) => {
  const { themeObject } = useTheme();
  const notifications = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [newClient, setNewClient] = useState(clientToEdit || initialData);
  const isEditMode = !!clientToEdit;

  // Si cambia el cliente a editar, actualizar el estado
  useEffect(() => {
    if (clientToEdit) {
      setNewClient(clientToEdit);
    } else {
      setNewClient(initialData);
    }
  }, [clientToEdit, visible]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    formContainer: {
      marginBottom: 16,
    },
    formTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: themeObject.colors.text,
      marginBottom: 16,
    },
    inputContainer: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      marginBottom: 8,
      color: themeObject.colors.text,
    },
    input: {
      borderWidth: 1,
      borderColor: themeObject.colors.border,
      borderRadius: themeObject.roundness,
      padding: 10,
      color: themeObject.colors.text,
      backgroundColor: themeObject.colors.surface,
    },
    formActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 8,
      marginTop: 8,
    },
  }); // Función para manejar el guardado de un nuevo cliente o la actualización de uno existente
  const handleSaveNewClient = async () => {
    // Validación básica
    if (!newClient.nombre || !newClient.apellido) {
      notifications.showErrorNotification(
        "Por favor introduce nombre y apellido"
      );
      return;
    }

    setIsLoading(true);
    try {
      let response;

      if (isEditMode) {
        // Actualizar cliente existente
        response = await Services.Data.Clients.update(
          newClient.id_cliente,
          newClient
        );
      } else {
        // Crear nuevo cliente
        response = await Services.Data.Clients.create(newClient);
      }

      // Notificar que se ha creado/actualizado un cliente
      onClientCreated(response);
    } catch (error) {
      console.error(
        `Error al ${isEditMode ? "actualizar" : "crear"} cliente:`,
        error
      );
      notifications.showErrorNotification(
        `No se pudo ${isEditMode ? "actualizar" : "crear"} el cliente. ${error.message || ""}`
      );
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <ModalTemplate
      isVisible={visible}
      title={isEditMode ? "Editar Cliente" : "Nuevo Cliente"}
      text={
        isEditMode
          ? "Edita los datos del cliente"
          : "Ingresa los datos del nuevo cliente"
      }
      cancelLabel="Cancelar"
      cancelAction={onClose}
      confirmLabel={isEditMode ? "Actualizar" : "Guardar"}
      confirmAction={handleSaveNewClient}
      confirmDisabled={isLoading}
    >
      <ScrollView style={styles.container}>
        <View style={styles.formContainer}>
          {/* Tipo de cliente */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Tipo de Cliente *</Text>
            <CustomPicker
              selectedValue={newClient.tipo_cliente}
              onValueChange={(value) =>
                setNewClient({ ...newClient, tipo_cliente: value })
              }
              items={[
                { label: "Particular", value: "particular" },
                { label: "Empresa", value: "empresa" },
                { label: "Autónomo", value: "autonomo" },
              ]}
            />
          </View>

          {/* Datos personales/empresa */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nombre *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre"
              placeholderTextColor={themeObject.colors.placeholder}
              value={newClient.nombre}
              onChangeText={(text) =>
                setNewClient({ ...newClient, nombre: text })
              }
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Apellido *</Text>
            <TextInput
              style={styles.input}
              placeholder="Apellido"
              placeholderTextColor={themeObject.colors.placeholder}
              value={newClient.apellido}
              onChangeText={(text) =>
                setNewClient({ ...newClient, apellido: text })
              }
            />
          </View>

          {/* Documento */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Tipo de Documento *</Text>
            <CustomPicker
              selectedValue={newClient.tipo_documento}
              onValueChange={(value) =>
                setNewClient({ ...newClient, tipo_documento: value })
              }
              items={[
                { label: "DNI", value: "DNI" },
                { label: "NIF", value: "NIF" },
                { label: "CIF", value: "CIF" },
                { label: "NIE", value: "NIE" },
                { label: "PASAPORTE", value: "PASAPORTE" },
              ]}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Número de Documento *</Text>
            <TextInput
              style={styles.input}
              placeholder="Documento"
              placeholderTextColor={themeObject.colors.placeholder}
              value={newClient.documento}
              onChangeText={(text) =>
                setNewClient({ ...newClient, documento: text })
              }
            />
          </View>

          {/* Datos fiscales */}
          {(newClient.tipo_cliente === "empresa" ||
            newClient.tipo_cliente === "autonomo") && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Razón Social</Text>
              <TextInput
                style={styles.input}
                placeholder="Razón Social"
                placeholderTextColor={themeObject.colors.placeholder}
                value={newClient.razon_social}
                onChangeText={(text) =>
                  setNewClient({ ...newClient, razon_social: text })
                }
              />
            </View>
          )}

          {(newClient.tipo_cliente === "empresa" ||
            newClient.tipo_cliente === "autonomo") && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Régimen Fiscal</Text>
              <TextInput
                style={styles.input}
                placeholder="Régimen Fiscal"
                placeholderTextColor={themeObject.colors.placeholder}
                value={newClient.regimen_fiscal}
                onChangeText={(text) =>
                  setNewClient({ ...newClient, regimen_fiscal: text })
                }
              />
            </View>
          )}

          {/* Datos de contacto */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={themeObject.colors.placeholder}
              value={newClient.email}
              onChangeText={(text) =>
                setNewClient({ ...newClient, email: text })
              }
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Teléfono</Text>
            <TextInput
              style={styles.input}
              placeholder="Teléfono"
              placeholderTextColor={themeObject.colors.placeholder}
              value={newClient.telefono}
              onChangeText={(text) =>
                setNewClient({ ...newClient, telefono: text })
              }
              keyboardType="phone-pad"
            />
          </View>

          {/* Dirección */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Dirección *</Text>
            <TextInput
              style={styles.input}
              placeholder="Dirección"
              placeholderTextColor={themeObject.colors.placeholder}
              value={newClient.direccion}
              onChangeText={(text) =>
                setNewClient({ ...newClient, direccion: text })
              }
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Código Postal *</Text>
            <TextInput
              style={styles.input}
              placeholder="Código Postal"
              placeholderTextColor={themeObject.colors.placeholder}
              value={newClient.codigo_postal}
              onChangeText={(text) =>
                setNewClient({ ...newClient, codigo_postal: text })
              }
              keyboardType="numeric"
              maxLength={5}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Ciudad *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ciudad"
              placeholderTextColor={themeObject.colors.placeholder}
              value={newClient.ciudad}
              onChangeText={(text) =>
                setNewClient({ ...newClient, ciudad: text })
              }
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Provincia *</Text>
            <TextInput
              style={styles.input}
              placeholder="Provincia"
              placeholderTextColor={themeObject.colors.placeholder}
              value={newClient.provincia}
              onChangeText={(text) =>
                setNewClient({ ...newClient, provincia: text })
              }
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>País</Text>
            <TextInput
              style={styles.input}
              placeholder="País"
              placeholderTextColor={themeObject.colors.placeholder}
              value={newClient.pais}
              onChangeText={(text) =>
                setNewClient({ ...newClient, pais: text })
              }
            />
          </View>

          {/* Datos fiscales adicionales */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Tipo de IVA</Text>
            <CustomPicker
              selectedValue={newClient.tipo_iva}
              onValueChange={(value) =>
                setNewClient({ ...newClient, tipo_iva: value })
              }
              items={[
                { label: "General (21%)", value: "general" },
                { label: "Reducido (10%)", value: "reducido" },
                { label: "Superreducido (4%)", value: "superreducido" },
                { label: "Exento", value: "exento" },
              ]}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Descuento Preferencial (%)</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={themeObject.colors.placeholder}
              value={newClient.descuento_preferencial.toString()}
              onChangeText={(text) =>
                setNewClient({
                  ...newClient,
                  descuento_preferencial: isNaN(parseFloat(text))
                    ? 0
                    : parseFloat(text),
                })
              }
              keyboardType="numeric"
            />
          </View>

          {/* Notas */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Notas</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: "top" }]}
              placeholder="Notas adicionales..."
              placeholderTextColor={themeObject.colors.placeholder}
              value={newClient.notas}
              onChangeText={(text) =>
                setNewClient({ ...newClient, notas: text })
              }
              multiline={true}
            />
          </View>
        </View>
      </ScrollView>
    </ModalTemplate>
  );
};

export default NewClientForm;
