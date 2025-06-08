import React, { forwardRef } from "react";
import { Pressable, Text, ActivityIndicator, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useTheme } from "../context/ThemeContext";

const CustomButton = forwardRef(
  (
    {
      children,
      onPress,
      disabled = false,
      isLoading = false,
      fullWidth = false,
      compact = false,
      variant = "default",
      size = "md",
      iconName,
      ionIconLeft,
      ionIconRight,
      ionIconSize = 16,
      style = {},
      textStyle = {},
      iconStyle = {},
      accessibilityLabel,
    },
    ref
  ) => {
    const { themeObject } = useTheme();

    // Mapeo de variantes actualizado
    const getVariantStyles = () => {
      const variants = {
        default: {
          bg: themeObject.colors.primary,
          text: themeObject.colors.buttonWhite,
          border: "transparent",
        },
        primary: {
          bg: themeObject.colors.primary,
          text: themeObject.colors.buttonWhite,
          border: "transparent",
        },
        secondary: {
          bg: themeObject.colors.surface,
          text: themeObject.colors.text,
          border: themeObject.colors.border,
        },
        accent: {
          bg: themeObject.colors.accent,
          text: themeObject.colors.buttonWhite,
          border: "transparent",
        },
        outline: {
          bg: themeObject.colors.surface,
          text: themeObject.colors.text,
          border: themeObject.colors.primary,
        },
        ghost: {
          bg: "transparent",
          text: themeObject.colors.text,
          border: "transparent",
        },
        link: {
          bg: "transparent",
          text: themeObject.colors.primary,
          border: "transparent",
        },
        success: {
          bg: themeObject.colors.success,
          text: themeObject.colors.buttonWhite,
          border: "transparent",
        },
        warning: {
          bg: themeObject.colors.warning,
          text: themeObject.colors.buttonWhite,
          border: "transparent",
        },
        error: {
          bg: themeObject.colors.error,
          text: themeObject.colors.buttonWhite,
          border: "transparent",
        },
        info: {
          bg: themeObject.colors.info,
          text: themeObject.colors.buttonWhite,
          border: "transparent",
        },
      };

      return variants[variant] || variants.default;
    };

    // Mapeo de tamaños
    const getSizeStyles = () => {
      const sizes = {
        sm: {
          paddingVertical: 6,
          paddingHorizontal: 12,
          height: 32,
          fontSize: 12,
        },
        md: {
          paddingVertical: 8,
          paddingHorizontal: 16,
          height: 40,
          fontSize: 14,
        },
        lg: {
          paddingVertical: 12,
          paddingHorizontal: 24,
          height: 48,
          fontSize: 16,
        },
        icon: {
          padding: 8,
          width: 40,
          height: 40,
        },
      };

      return sizes[size] || sizes.md;
    };

    const { bg, text, border } = getVariantStyles();
    const sizeStyles = getSizeStyles();
    const isIconOnly = !children && (ionIconLeft || ionIconRight);

    // Color de icono siempre igual al texto
    const iconColor = disabled ? themeObject.colors.disabled : text;
    return (
      <Pressable
        ref={ref}
        onPress={onPress}
        disabled={disabled || isLoading}
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [
          {
            backgroundColor: bg,
            borderColor: border,
            borderWidth:
              variant === "outline" || variant === "secondary" ? 1 : 0,
            borderRadius: themeObject.roundness,
            opacity: disabled ? 0.6 : pressed ? 0.8 : 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            ...(fullWidth && { width: "100%" }),
            ...(compact && { paddingHorizontal: 8 }),
            ...sizeStyles,
            ...(isIconOnly && {
              width: sizeStyles.height,
              paddingHorizontal: 0,
            }),
          },
          style,
        ]}
        android_ripple={{
          color: themeObject.componentColors.buttonHover,
          borderless: variant === "ghost" || variant === "link",
        }}
      >
        {/* Loading state */}
        {isLoading && (
          <ActivityIndicator
            size="small"
            color={iconColor}
            style={{ marginRight: children ? 8 : 0 }}
          />
        )}

        {/* Iconos izquierdos */}
        {!isLoading && ionIconLeft && (
          <Icon
            name={ionIconLeft}
            size={ionIconSize}
            color={iconColor}
            style={[
              styles.icon,
              iconStyle,
              isIconOnly && { marginHorizontal: 0 },
              { marginRight: children ? 8 : 0 },
            ]}
          />
        )}

        {/* Contenido textual */}
        {children && (
          <Text
            style={[
              {
                color: iconColor,
                fontWeight: "600",
                fontSize: sizeStyles.fontSize,
                ...(variant === "link" && { textDecorationLine: "underline" }),
              },
              textStyle,
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {children}
          </Text>
        )}

        {/* Iconos derechos */}
        {!isLoading && ionIconRight && (
          <Icon
            name={ionIconRight}
            size={ionIconSize}
            color={iconColor}
            style={[styles.icon, iconStyle, { marginLeft: children ? 8 : 0 }]}
          />
        )}
      </Pressable>
    );
  }
);

const styles = StyleSheet.create({
  icon: {
    marginHorizontal: 4,
  },
});

export default CustomButton;
