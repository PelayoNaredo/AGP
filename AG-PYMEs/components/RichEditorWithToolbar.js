import React, { useRef, useImperativeHandle, forwardRef } from "react";
import { View, StyleSheet } from "react-native";
import { RichEditor } from "react-native-pell-rich-editor";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import CustomButton from "./customButton";

// Componente personalizado de barra de herramientas que usa Ionicons
const CustomToolbar = ({ editor, onImagePress }) => {
  const { themeObject } = useTheme();

  const handleAction = (action) => {
    if (editor.current) {
      switch (action) {
        case "bold":
          editor.current.setBold();
          break;
        case "italic":
          editor.current.setItalic();
          break;
        case "underline":
          editor.current.setUnderline();
          break;
        case "h1":
          editor.current.setHeading(1);
          break;
        case "h2":
          editor.current.setHeading(2);
          break;
        case "ul":
          editor.current.insertBulletsList();
          break;
        case "ol":
          editor.current.insertOrderedList();
          break;
        case "link":
          editor.current.insertLink("https://", "Enlace");
          break;
        case "undo":
          editor.current.undo();
          break;
        case "redo":
          editor.current.redo();
          break;
        case "image":
          if (onImagePress) onImagePress();
          break;
        default:
          break;
      }
    }
  };

  const toolbarConfig = [
    { action: "bold", icon: "bold", tooltip: "Negrita" },
    { action: "italic", icon: "italic", tooltip: "Cursiva" },
    { action: "underline", icon: "underline", tooltip: "Subrayado" },
    { action: "h1", icon: "text", tooltip: "Título 1" },
    { action: "h2", icon: "text-outline", tooltip: "Título 2" },
    { action: "ul", icon: "list", tooltip: "Lista con viñetas" },
    { action: "ol", icon: "list-outline", tooltip: "Lista numerada" },
    { action: "link", icon: "link", tooltip: "Insertar enlace" },
    { action: "image", icon: "image", tooltip: "Insertar imagen" },
    { action: "undo", icon: "arrow-undo", tooltip: "Deshacer" },
    { action: "redo", icon: "arrow-redo", tooltip: "Rehacer" },
  ];

  return (
    <View
      style={[styles.toolbar, { backgroundColor: themeObject.colors.card }]}
    >
      {toolbarConfig.map((item, index) => (
        <CustomButton
          key={index}
          onPress={() => handleAction(item.action)}
          variant="ghost"
          size="icon"
          style={styles.toolbarButton}
          aria-label={item.tooltip}
          ionIconLeft={item.icon}
          iconColor={themeObject.colors.text}
        />
      ))}
    </View>
  );
};

// Componente principal que combina el editor y la barra de herramientas
const RichEditorWithToolbar = forwardRef(
  (
    {
      initialContent = "",
      onChange,
      placeholder = "Escribe aquí...",
      containerStyle,
      editorStyle,
      onImagePress,
    },
    ref
  ) => {
    const { themeObject } = useTheme();
    const editorRef = useRef();

    // Exponer los métodos del editor al componente padre
    useImperativeHandle(ref, () => ({
      // Métodos que se pueden llamar desde el componente padre
      insertHTML: (html) => {
        if (editorRef.current) {
          editorRef.current.insertHTML(html);
        }
      },
      getContentHtml: async () => {
        if (editorRef.current) {
          return await editorRef.current.getContentHtml();
        }
        return "";
      },
      // También se pueden añadir más métodos según sea necesario
      setFocus: () => {
        if (editorRef.current) {
          editorRef.current.focusContentEditor();
        }
      },
    }));

    return (
      <View
        style={[
          styles.container,
          containerStyle,
          { borderColor: themeObject.colors.border },
        ]}
      >
        <CustomToolbar editor={editorRef} onImagePress={onImagePress} />
        <RichEditor
          ref={editorRef}
          initialContentHTML={initialContent}
          onChange={onChange}
          placeholder={placeholder}
          style={[
            styles.editor,
            editorStyle,
            { backgroundColor: themeObject.colors.background },
          ]}
          placeholderColor={themeObject.colors.text + "80"}
          editorInitializedCallback={() => console.log("Editor inicializado")}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    overflow: "hidden",
    marginVertical: 10,
  },
  toolbar: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#f9f9f9",
    padding: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  toolbarButton: {
    margin: 2,
    padding: 8,
    borderRadius: 4,
  },
  editor: {
    minHeight: 200,
    maxHeight: 400,
  },
});

export default RichEditorWithToolbar;
