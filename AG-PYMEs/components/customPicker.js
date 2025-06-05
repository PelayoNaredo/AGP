import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useTheme } from "../context/ThemeContext";

const CustomPicker = ({ selectedValue, onValueChange, items, placeholder }) => {
  const { themeObject } = useTheme();

  return (
    <View
      style={[
        styles.pickerContainer,
        Platform.OS === "ios" && styles.pickerContainerIOS,
      ]}
    >
      {Platform.OS === "ios" && (
        <Text
          style={[
            styles.pickerLabel,
            { color: themeObject.colors.placeholder },
          ]}
        >
          {placeholder}
        </Text>
      )}
      <Picker
        selectedValue={selectedValue}
        onValueChange={onValueChange}
        style={[
          styles.picker,
          Platform.OS === "ios" && styles.pickerIOS,
          {
            color: themeObject.colors.text,
            backgroundColor: "transparent",
            borderRadius: 8,
            fontSize: Platform.OS === "android" ? 14 : 12,
            height: Platform.OS === "android" ? 50 : 45,
          },
          Platform.OS === "web" && {
            appearance: "none",
            WebkitAppearance: "none",
            MozAppearance: "none",
            border: "1px solid rgba(0,0,0,0.1)",
            backgroundColor: themeObject.colors.surface,
          },
        ]}
        dropdownIconColor={themeObject.colors.text}
        dropdownIconRippleColor={themeObject.colors.primary}
        dropdownBackgroundColor={themeObject.colors.surface}
        itemStyle={Platform.OS === "ios" ? styles.pickerItemIOS : undefined}
        mode={Platform.OS === "android" ? "dropdown" : undefined}
      >
        <Picker.Item
          label={placeholder}
          value="todos"
          color={
            Platform.OS === "ios"
              ? themeObject.colors.placeholder
              : themeObject.colors.text
          }
          backgroundColor={themeObject.colors.card}
          enabled={Platform.OS !== "ios"}
        />
        {items.map((item) => (
          <Picker.Item
            key={item.value}
            label={item.label}
            value={item.value}
            color={themeObject.colors.text}
            style={Platform.OS === "android" ? styles.pickerItemAndroid : undefined}
          />
        ))}
      </Picker>
      {Platform.OS === "ios" && (
        <View
          style={[
            styles.pickerArrow,
            { borderTopColor: themeObject.colors.text },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  pickerContainer: {
    flex: Platform.select({ web: 1, default: undefined }),
    minWidth: Platform.select({ web: 200, default: "100%" }),
    backgroundColor: "transparent",
    borderRadius: 8,
    justifyContent: "center",
    overflow: "hidden",
    ...Platform.select({
      android: {
        elevation: 0,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.1)",
        borderRadius: 8,
        paddingRight: 0,
        paddingLeft: 0,
        paddingVertical: 0,

      },
      ios: {
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.1)",
      },
      web: {
        borderWidth: 0,
        borderRadius: 8,
      },
    }),
  },
  pickerContainerIOS: {
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  pickerLabel: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: "500",
  },
  picker: {
    ...Platform.select({
      ios: {
        marginTop: -8,
        marginBottom: -8,
      },
      android: {
        height: 50,
        paddingHorizontal: 0,
        paddingVertical: 0,
        marginTop: 0,
        marginBottom: 0,
      },
      web: {
        height: 40,
        paddingHorizontal: 12,
      },
    }),
  },
  pickerIOS: {
    fontSize: 16,
  },
  pickerItemIOS: {
    fontSize: 16,
    height: 44,
  },
  pickerItemAndroid: {
    marginVertical: 10,
    fontSize: 14,
    height: 50,
  },
  pickerArrow: {
    position: "absolute",
    right: 12,
    top: "50%",
    width: 0,
    height: 0,
    marginTop: -2,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderStyle: "solid",
    backgroundColor: "transparent",
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
});

export default CustomPicker;
