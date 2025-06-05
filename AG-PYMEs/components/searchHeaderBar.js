import React from "react";
import { View, StyleSheet, TextInput, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import CustomButton from "./customButton";

//Componente reutilizable que muestra una barra de búsqueda con un botón de acción.
const SearchHeaderBar = ({
  searchQuery,
  setSearchQuery,
  onButtonPress,
  buttonText,
  buttonIconName = "add-outline",
  buttonVariant = "info",
  searchPlaceholder = "Buscar...",
  containerStyle,
}) => {
  const { themeObject } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 16,
      paddingHorizontal: 16,
      flexWrap: Platform.select({ web: "wrap", default: "nowrap" }),
      gap: 16,
    },
    searchContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 8,
      borderWidth: 1,
      paddingHorizontal: 8,
    },
    searchInput: {
      flex: 1,
      height: 40,
      width: "100%",
    },
  });

  return (
    <View style={[styles.container, containerStyle]}>
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: themeObject.colors.background,
            borderColor: themeObject.colors.border,
          },
        ]}
      >
        <Ionicons
          name="search-outline"
          size={20}
          color={themeObject.colors.placeholder}
        />
        <TextInput
          style={[
            styles.searchInput,
            { color: themeObject.colors.text, outlineStyle: "none" },
          ]}
          placeholder={searchPlaceholder}
          placeholderTextColor={themeObject.colors.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <CustomButton
        onPress={onButtonPress}
        variant={buttonVariant}
        size="md"
        ionIconLeft={buttonIconName}
      >
        {buttonText}
      </CustomButton>
    </View>
  );
};

export default SearchHeaderBar;
