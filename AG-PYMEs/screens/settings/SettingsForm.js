import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { TextInput, Card, IconButton } from "react-native-paper";
import { useTheme } from "../../context/ThemeContext";

// Formulario de configuración del local
const SettingsForm = ({ settings, handleChange }) => {
  const { themeObject } = useTheme();

  const clearField = (key) => handleChange(key, "");

  return (
    <Card
      style={[styles.card, { backgroundColor: themeObject.colors.surface }]}
    >
      <Card.Title
        title="Configuración del Local"
        subtitle="Datos básicos mostrados en documentos y la app"
        titleStyle={{ paddingTop: 4, fontWeight: "bold" }}
        left={(props) => (
          <IconButton
            {...props}
            icon="storefront-outline"
            size={24}
            iconColor={themeObject.colors.text}
          />
        )}
      />
      <Card.Content>
        <View style={styles.fieldGroup}>
          <TextInput
            label="Nombre del Local"
            placeholder="Ej. Barbería Central"
            value={settings.nombre_local}
            onChangeText={(value) => handleChange("nombre_local", value)}
            style={styles.input}
            mode="outlined"
            left={<TextInput.Icon icon="store" />}
            right={
              settings.nombre_local ? (
                <TextInput.Icon
                  icon="close"
                  onPress={() => clearField("nombre_local")}
                />
              ) : null
            }
            autoCapitalize="words"
          />
          <Text style={styles.helper}>
            Nombre comercial que verán tus clientes.
          </Text>
        </View>

        <View style={styles.fieldGroup}>
          <TextInput
            label="Dirección"
            placeholder="Calle, número, ciudad"
            value={settings.direccion}
            onChangeText={(value) => handleChange("direccion", value)}
            style={styles.input}
            mode="outlined"
            left={<TextInput.Icon icon="map-marker" />}
            right={
              settings.direccion ? (
                <TextInput.Icon
                  icon="close"
                  onPress={() => clearField("direccion")}
                />
              ) : null
            }
            autoCapitalize="words"
            multiline
          />
          <Text style={styles.helper}>Usada en facturas y comunicaciones.</Text>
        </View>

        <View style={styles.fieldGroup}>
          <TextInput
            label="Teléfono"
            placeholder="Ej. 600 000 000"
            value={settings.telefono}
            onChangeText={(value) => handleChange("telefono", value)}
            style={styles.input}
            mode="outlined"
            left={<TextInput.Icon icon="phone" />}
            right={
              settings.telefono ? (
                <TextInput.Icon
                  icon="close"
                  onPress={() => clearField("telefono")}
                />
              ) : null
            }
            keyboardType="phone-pad"
          />
          <Text style={styles.helper}>
            Teléfono de contacto visible para clientes.
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 6,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  input: {
    marginVertical: 5,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  helper: {
    fontSize: 11,
    opacity: 0.7,
    marginTop: 2,
  },
});

export default SettingsForm;
