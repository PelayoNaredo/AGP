import { useRef, useState, useEffect } from "react";
import { View, Modal, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

// Componente PopupMenu muestra un menú emergente que se posiciona en relación a un elemento ancla.
const PopupMenu = ({
  visible,
  onDismiss,
  anchor,
  children,
  contentStyle = {},
}) => {
  const { themeObject } = useTheme();
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const containerRef = useRef(null);

  // Posicionar el menú basado en el anchor
  useEffect(() => {
    if (visible && containerRef.current && containerRef.current.measure) {
      containerRef.current.measure((x, y, width, height, pageX, pageY) => {
        setPosition({
          top: pageY + height,
          right: 10,
        });
      });
    }
  }, [visible]);

  if (!visible) return anchor;

  return (
    <View>
      <View ref={containerRef}>{anchor}</View>
      <Modal
        transparent
        visible={visible}
        onRequestClose={onDismiss}
        animationType="fade"
      >
        <Pressable
          style={[
            styles.modalBackground,
            { backgroundColor: "rgba(0,0,0,0.2)" },
          ]}
          activeOpacity={1}
          onPress={onDismiss}
        >
          <View
            style={[
              styles.menuContainer,
              {
                backgroundColor: themeObject.colors.surface,
                shadowColor: themeObject.dark ? "#000" : "#333",
                position: "absolute",
                top: position.top,
                right: position.right,
              },
              contentStyle,
            ]}
          >
            {children}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export const MenuItem = ({
  onPress,
  title,
  leadingIcon,
  titleStyle,
  iconColor,
}) => {
  const { themeObject } = useTheme();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuItem,
        {
          borderRadius: 4,
        },
        pressed && {
          backgroundColor: themeObject.colors.text + "15",
        },
      ]}
      onPress={onPress}
    >
      {leadingIcon && (
        <Ionicons
          name={leadingIcon}
          size={20}
          style={styles.menuItemIcon}
          color={iconColor || themeObject.colors.text}
        />
      )}
      <Text
        style={[
          styles.menuItemText,
          { color: themeObject.colors.text },
          titleStyle,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
};

export const MenuDivider = () => {
  const { themeObject } = useTheme();
  return (
    <View
      style={[styles.divider, { backgroundColor: themeObject.colors.border }]}
    />
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
  },
  menuContainer: {
    borderRadius: 8,
    elevation: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    padding: 5,
    minWidth: 200,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  menuItemIcon: {
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
});

export default PopupMenu;
