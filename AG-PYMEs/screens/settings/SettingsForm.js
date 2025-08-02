import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { TextInput, Card, IconButton, Chip } from "react-native-paper";
import { useTheme } from "../../context/ThemeContext";
import { useCompany } from "../../context/CompanyContext";
import LimitChecker from "../../components/LimitChecker";

// Formulario de configuración del local
const SettingsForm = ({ settings, handleChange }) => {
  const { themeObject } = useTheme();
  const { company, usage, getRemainingLimit } = useCompany();

  return (
    <>
      {/* Información de la empresa */}
      <Card
        style={[styles.card, { backgroundColor: themeObject.colors.surface }]}
      >
        <Card.Title
          title="Información de la Empresa"
          titleStyle={{ paddingTop: 4, fontWeight: "bold" }}
          left={(props) => (
            <IconButton
              {...props}
              icon="domain"
              size={24}
              iconColor={themeObject.colors.text}
            />
          )}
        />
        <Card.Content>
          <TextInput
            label="Nombre de la empresa"
            value={settings.company_name || company?.name}
            onChangeText={(value) => handleChange("company_name", value)}
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="Dirección"
            value={settings.company_address || ""}
            onChangeText={(value) => handleChange("company_address", value)}
            style={styles.input}
            mode="outlined"
            multiline
          />
          <TextInput
            label="Teléfono"
            value={settings.company_phone || ""}
            onChangeText={(value) => handleChange("company_phone", value)}
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="Email corporativo"
            value={settings.company_email || ""}
            onChangeText={(value) => handleChange("company_email", value)}
            style={styles.input}
            mode="outlined"
          />
        </Card.Content>
      </Card>

      {/* Configuración del local (existente) */}
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

      {/* Configuración financiera */}
      <Card
        style={[styles.card, { backgroundColor: themeObject.colors.surface }]}
      >
        <Card.Title
          title="Configuración Financiera"
          titleStyle={{ paddingTop: 4, fontWeight: "bold" }}
          left={(props) => (
            <IconButton
              {...props}
              icon="currency-usd"
              size={24}
              iconColor={themeObject.colors.text}
            />
          )}
        />
        <Card.Content>
          <TextInput
            label="Moneda por defecto"
            value={settings.default_currency || "EUR"}
            onChangeText={(value) => handleChange("default_currency", value)}
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="Tasa de impuesto (%)"
            value={settings.tax_rate?.toString() || "21"}
            onChangeText={(value) =>
              handleChange("tax_rate", parseFloat(value) || 0)
            }
            style={styles.input}
            mode="outlined"
            keyboardType="numeric"
          />
        </Card.Content>
      </Card>

      {/* Límites y uso del plan */}
      <Card
        style={[styles.card, { backgroundColor: themeObject.colors.surface }]}
      >
        <Card.Title
          title={`Plan ${company?.subscription_plan?.toUpperCase() || "BÁSICO"}`}
          titleStyle={{ paddingTop: 4, fontWeight: "bold" }}
          left={(props) => (
            <IconButton
              {...props}
              icon="chart-bar"
              size={24}
              iconColor={themeObject.colors.text}
            />
          )}
        />
        <Card.Content>
          <LimitChecker resource="users" title="Usuarios" />
          <LimitChecker resource="clients" title="Clientes" />
          <LimitChecker resource="products" title="Productos" />
          <LimitChecker resource="storage" title="Almacenamiento" />
        </Card.Content>
      </Card>
    </>
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
