import React, {
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
  useEffect,
} from "react";
import { View, StyleSheet, Platform } from "react-native";
import {
  IconButton,
  useTheme as usePaperTheme,
  Surface,
  Portal,
  Dialog,
  TextInput,
  Button,
} from "react-native-paper";
import { useTheme } from "../context/ThemeContext";

// Importar RichEditor condicionalmente para evitar errores en web
let RichEditor = null;
if (Platform.OS !== "web") {
  // Solo importamos RichEditor en plataformas nativas
  const RichEditorPkg = require("react-native-pell-rich-editor");
  RichEditor = RichEditorPkg.RichEditor;
}

// Componente para insertar enlaces
const LinkDialog = ({ visible, onDismiss, onConfirm }) => {
  const [url, setUrl] = useState("https://");
  const [text, setText] = useState("");

  const handleConfirm = () => {
    onConfirm(url, text);
    setUrl("https://");
    setText("");
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>Insertar enlace</Dialog.Title>
        <Dialog.Content>
          <TextInput
            label="URL"
            value={url}
            onChangeText={setUrl}
            mode="outlined"
            autoCapitalize="none"
            keyboardType="url"
          />
          <TextInput
            label="Texto del enlace"
            value={text}
            onChangeText={setText}
            mode="outlined"
            style={{ marginTop: 10 }}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancelar</Button>
          <Button onPress={handleConfirm}>Insertar</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

// Versión web del editor rico
const WebRichEditor = forwardRef(
  ({ initialContent, onChange, placeholder, style }, ref) => {
    const paperTheme = usePaperTheme();
    const [content, setContent] = useState(initialContent || "");
    const editorRef = useRef(null);

    useEffect(() => {
      // Inicializar el contenido cuando el componente se monta
      if (editorRef.current && initialContent) {
        editorRef.current.innerHTML = initialContent;
      }
    }, [initialContent]);

    // Exponemos métodos similares a la versión nativa
    useImperativeHandle(ref, () => ({
      insertHTML: (html) => {
        if (editorRef.current) {
          editorRef.current.innerHTML += html;
          const newContent = editorRef.current.innerHTML;
          setContent(newContent);
          if (onChange) onChange(newContent);
        }
      },
      getContentHtml: async () => {
        if (editorRef.current) {
          return editorRef.current.innerHTML;
        }
        return content;
      },
      setBold: () => {
        if (document && document.execCommand) {
          document.execCommand("bold", false, null);
        }
      },
      setItalic: () => {
        if (document && document.execCommand) {
          document.execCommand("italic", false, null);
        }
      },
      setUnderline: () => {
        if (document && document.execCommand) {
          document.execCommand("underline", false, null);
        }
      },
      insertBulletsList: () => {
        if (document && document.execCommand) {
          document.execCommand("insertUnorderedList", false, null);
        }
      },
      insertOrderedList: () => {
        if (document && document.execCommand) {
          document.execCommand("insertOrderedList", false, null);
        }
      },
      setHeading: (level) => {
        if (document && document.execCommand) {
          document.execCommand("formatBlock", false, `<h${level}>`);
        }
      },
      undo: () => {
        if (document && document.execCommand) {
          document.execCommand("undo", false, null);
        }
      },
      redo: () => {
        if (document && document.execCommand) {
          document.execCommand("redo", false, null);
        }
      },
      insertLink: (url, text) => {
        if (document && document.execCommand) {
          document.execCommand("createLink", false, url);
        }
      },
      setFocus: () => {
        if (editorRef.current) {
          editorRef.current.focus();
        }
      },
    }));

    const handleChange = (e) => {
      // Para la versión web, guardamos el HTML del editor
      if (editorRef.current) {
        const newContent = editorRef.current.innerHTML;
        setContent(newContent);
        if (onChange) onChange(newContent);
      }
    };

    // En lugar de usar dangerouslySetInnerHTML, configuramos el contenido en useEffect
    return Platform.OS === "web" ? (
      <div
        ref={editorRef}
        contentEditable
        onInput={handleChange}
        placeholder={placeholder}
        dir="ltr" // Asegurarnos que la dirección del texto es de izquierda a derecha
        style={{
          minHeight: 200,
          maxHeight: 400,
          padding: 10,
          overflow: "auto",
          backgroundColor: paperTheme.colors.background,
          color: paperTheme.colors.text,
          outline: "none",
          borderRadius: 4,
          direction: "ltr", // Otra forma de asegurar la dirección correcta del texto
          unicodeBidi: "normal", // Control adicional de la dirección del texto
          textAlign: "left", // Asegurar que el texto se alinea a la izquierda
        }}
      />
    ) : null;
  }
);

// Componente personalizado de barra de herramientas que usa Material Icons
const PaperToolbar = ({ editor, onImagePress }) => {
  const paperTheme = usePaperTheme();
  const [linkDialogVisible, setLinkDialogVisible] = useState(false);

  // En la versión web, las acciones son simples pero mantenemos la interfaz
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
          setLinkDialogVisible(true);
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

  const handleInsertLink = (url, text) => {
    if (editor.current) {
      editor.current.insertLink(url, text || url);
    }
    setLinkDialogVisible(false);
  };

  const toolbarConfig = [
    { action: "bold", icon: "format-bold", tooltip: "Negrita" },
    { action: "italic", icon: "format-italic", tooltip: "Cursiva" },
    { action: "underline", icon: "format-underline", tooltip: "Subrayado" },
    { action: "h1", icon: "format-header-1", tooltip: "Título 1" },
    { action: "h2", icon: "format-header-2", tooltip: "Título 2" },
    {
      action: "ul",
      icon: "format-list-bulleted",
      tooltip: "Lista con viñetas",
    },
    { action: "ol", icon: "format-list-numbered", tooltip: "Lista numerada" },
    { action: "link", icon: "link", tooltip: "Insertar enlace" },
    { action: "image", icon: "image", tooltip: "Insertar imagen" },
    { action: "undo", icon: "undo", tooltip: "Deshacer" },
    { action: "redo", icon: "redo", tooltip: "Rehacer" },
  ];

  // Mostramos todos los botones en todas las plataformas
  return (
    <>
      <Surface
        style={[
          styles.toolbar,
          { backgroundColor: paperTheme.colors.surfaceVariant },
        ]}
        elevation={0}
      >
        <View style={styles.toolbarInner}>
          {toolbarConfig.map((item, index) => (
            <IconButton
              key={index}
              icon={item.icon}
              size={20}
              onPress={() => handleAction(item.action)}
              accessibilityLabel={item.tooltip}
              iconColor={paperTheme.colors.onSurfaceVariant}
            />
          ))}
        </View>
      </Surface>
      <LinkDialog
        visible={linkDialogVisible}
        onDismiss={() => setLinkDialogVisible(false)}
        onConfirm={handleInsertLink}
      />
    </>
  );
};

// Componente principal que combina el editor y la barra de herramientas
const PaperRichEditor = forwardRef(
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
    const paperTheme = usePaperTheme();
    const editorRef = useRef();

    // Exponer los métodos del editor al componente padre
    useImperativeHandle(ref, () => ({
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
      setFocus: () => {
        if (editorRef.current) {
          if (Platform.OS === "web") {
            // No implementado para web
          } else {
            editorRef.current.focusContentEditor();
          }
        }
      },
    }));

    return (
      <Surface
        style={[
          styles.container,
          containerStyle,
          { borderColor: paperTheme.colors.outline },
        ]}
        elevation={1}
      >
        <PaperToolbar editor={editorRef} onImagePress={onImagePress} />

        {Platform.OS === "web" ? (
          // Versión web: usamos un TextInput multiline
          <WebRichEditor
            ref={editorRef}
            initialContent={initialContent}
            onChange={onChange}
            placeholder={placeholder}
            style={[styles.editor, editorStyle]}
          />
        ) : RichEditor ? (
          // Versión nativa: usamos RichEditor
          <RichEditor
            ref={editorRef}
            initialContentHTML={initialContent}
            onChange={onChange}
            placeholder={placeholder}
            style={[
              styles.editor,
              editorStyle,
              { backgroundColor: paperTheme.colors.background },
            ]}
            placeholderColor={paperTheme.colors.onSurfaceVariant + "80"}
            editorInitializedCallback={() => console.log("Editor inicializado")}
          />
        ) : (
          // Fallback por si RichEditor no se cargó correctamente
          <TextInput
            multiline
            value={initialContent}
            onChangeText={onChange}
            placeholder={placeholder}
            style={[styles.editor, editorStyle]}
          />
        )}
      </Surface>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
    marginVertical: 10,
  },
  toolbar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.12)",
  },
  toolbarInner: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 2,
  },
  editor: {
    minHeight: 200,
    maxHeight: 400,
  },
  webEditor: {
    minHeight: 200,
    maxHeight: 400,
    padding: 10,
    textAlignVertical: "top",
  },
});

export default PaperRichEditor;
