import React, { useState } from "react";
import { View, StyleSheet, Text, Dimensions } from "react-native";
import { useTheme } from "../context/ThemeContext";
import CustomButton from "./customButton";
import { Menu } from "react-native-paper";
import Ionicons from "react-native-vector-icons/Ionicons";

const HeaderWithTabs = ({ title, tabs, activeView, onChangeView }) => {
  const { themeObject } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const windowWidth = Dimensions.get("window").width;
  const isMobile = windowWidth < 768;

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      backgroundColor: themeObject.colors.background,
      borderBottomWidth: 1,
      borderBottomColor: themeObject.colors.border,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: themeObject.colors.text,
    },
    tabs: {
      flexDirection: "row",
      gap: 8,
    },
    menuButton: {
      borderRadius: 8,
      borderWidth: 1.5,
    },
    menuContent: {
      marginTop: 45,
      borderRadius: 12,
      paddingVertical: 4,
      elevation: 6,
      shadowColor: themeObject.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    menuItem: {
      minWidth: 200,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: themeObject.colors.border,
    },
    menuItemTitle: {
      color: themeObject.colors.text,
      fontSize: 15,
      fontWeight: "500",
      marginLeft: 8,
    },
  });

  // Determinar qué renderizar basado en si es móvil o escritorio
  const renderTabs = () => {
    // En versión desktop, mostrar los tabs normalmente
    if (!isMobile) {
      return (
        <View style={styles.tabs}>
          {tabs.map((tab) => (
            <CustomButton
              key={tab.value}
              onPress={() => onChangeView(tab.value)}
              variant={activeView === tab.value ? "primary" : "ghost"}
              size="sm"
              ionIconLeft={
                activeView === tab.value ? tab.activeIcon : tab.inactiveIcon
              }
            >
              {tab.label}
            </CustomButton>
          ))}
        </View>
      );
    }

    // En versión móvil, mostrar un menú desplegable
    return (
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <CustomButton
            onPress={() => setMenuVisible(true)}
            variant="ghost"
            size="lg"
            ionIconLeft="menu"
            style={styles.menuButton}
          />
        }
        contentStyle={{
          ...styles.menuContent,
          backgroundColor: themeObject.colors.surface,
        }}
      >
        {tabs.map((tab) => (
          <Menu.Item
            key={tab.value}
            title={
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons
                  name={
                    activeView === tab.value ? tab.activeIcon : tab.inactiveIcon
                  }
                  size={20}
                  color={themeObject.colors.text}
                />
                <Text
                  style={{ marginLeft: 10, color: themeObject.colors.text }}
                >
                  {tab.label}
                </Text>
              </View>
            }
            onPress={() => {
              onChangeView(tab.value);
              setMenuVisible(false);
            }}
            titleStyle={styles.menuItemTitle}
            style={[
              styles.menuItem,
              activeView === tab.value
                ? { backgroundColor: themeObject.colors.primaryLight }
                : null,
            ]}
          />
        ))}
      </Menu>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {renderTabs()}
    </View>
  );
};

export default HeaderWithTabs;
