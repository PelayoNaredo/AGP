import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { Card, IconButton } from "react-native-paper";
import { useTheme } from "../../context/ThemeContext";
import CustomButton from "../../components/customButton";

// Componente ThemeSelector permite al usuario seleccionar entre temas claro y oscuro.
const ThemeSelector = ({ onThemeChange }) => {
  const { theme, themeObject, toggleTheme } = useTheme();

  const handleThemeChange = async (newTheme) => {
    try {
      // Cambiar tema inmediatamente en el contexto
      await toggleTheme(newTheme);

      // Llamar al callback si existe
      if (onThemeChange) {
        onThemeChange(newTheme);
      }
    } catch (error) {
      console.error("[ThemeSelector] Error al cambiar tema:", error);
    }
  };

  return (
    <Card
      style={[
        styles.container,
        { backgroundColor: themeObject.colors.surface },
      ]}
    >
      <Card.Title
        title="Tema de la Aplicación"
        subtitle="Elige cómo se ve la interfaz"
        titleStyle={{ paddingTop: 4, fontWeight: "bold" }}
        left={(props) => (
          <IconButton
            {...props}
            icon="theme-light-dark"
            size={24}
            iconColor={themeObject.colors.text}
          />
        )}
      />
      <Card.Content style={styles.buttonContainer}>
        <CustomButton
          onPress={() => handleThemeChange("claro")}
          variant={theme === "claro" ? "primary" : "outline"}
          style={styles.button}
          ionIconLeft={theme === "claro" ? "sunny" : "sunny-outline"}
        >
          Claro
        </CustomButton>
        <CustomButton
          onPress={() => handleThemeChange("oscuro")}
          variant={theme === "oscuro" ? "primary" : "outline"}
          style={styles.button}
          ionIconLeft={theme === "oscuro" ? "moon" : "moon-outline"}
        >
          Oscuro
        </CustomButton>
      </Card.Content>
      <View style={styles.hintContainer}>
        <Text style={styles.hint}>Puedes cambiarlo cuando quieras.</Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 6,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
    fontSize: 18,
  },
  hintContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  hint: {
    fontSize: 11,
    opacity: 0.7,
  },
});

export default ThemeSelector;
