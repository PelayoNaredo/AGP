import React from "react";
import { StyleSheet } from "react-native";
import { Card, IconButton } from "react-native-paper";
import { useTheme } from "../../context/ThemeContext";
import CustomButton from "../../components/customButton";

// Componente ThemeSelector permite al usuario seleccionar entre temas claro y oscuro.
const ThemeSelector = ({ onThemeChange }) => {
  const { theme, themeObject } = useTheme();

  return (
    <Card
      style={[
        styles.container,
        { backgroundColor: themeObject.colors.surface },
      ]}
    >
      <Card.Title
        title="Tema de la Aplicación"
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
          onPress={() => onThemeChange("claro")}
          variant={theme === "claro" ? "primary" : "ghost"}
          style={styles.button}
          ionIconLeft={theme === "claro" ? "sunny" : "sunny-outline"}
        >
          Claro
        </CustomButton>
        <CustomButton
          onPress={() => onThemeChange("oscuro")}
          variant={theme === "oscuro" ? "primary" : "ghost"}
          style={styles.button}
          ionIconLeft={theme === "oscuro" ? "moon" : "moon-outline"}
        >
          Oscuro
        </CustomButton>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 10,
    borderRadius: 10,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
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
});

export default ThemeSelector;
