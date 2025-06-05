import React from "react";
import { StyleSheet } from "react-native";
import { TextInput, Card, IconButton } from "react-native-paper";
import { useTheme } from "../../context/ThemeContext";

// Formulario de configuración del local
const SettingsForm = ({ settings, handleChange }) => {
  const { themeObject } = useTheme();

  return (
    <Card
      style={[styles.card, { backgroundColor: themeObject.colors.surface }]}
    >
      <Card.Title
        title="Configuración del Local"
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
        <TextInput
          label="Nombre del Local"
          value={settings.nombre_local}
          onChangeText={(value) => handleChange("nombre_local", value)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Dirección"
          value={settings.direccion}
          onChangeText={(value) => handleChange("direccion", value)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Teléfono"
          value={settings.telefono}
          onChangeText={(value) => handleChange("telefono", value)}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="URL del Backend"
          value={settings.url_backend}
          onChangeText={(value) => handleChange("url_backend", value)}
          style={styles.input}
          mode="outlined"
        />
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 10,
    borderRadius: 10,
  },
  input: {
    marginVertical: 5,
  },
});

export default SettingsForm;
