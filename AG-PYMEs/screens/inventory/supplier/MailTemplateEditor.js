import React, { useState, useRef, useEffect } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import CustomButton from "../../../components/customButton";
import CustomPicker from "../../../components/customPicker";

// Variables que coinciden con los replacements de EmailOrderSender
const INSERCIONES_PLANTILLA = [
  { label: "Número de Pedido", value: "{NUMERO_PEDIDO}" },
  { label: "Fecha de Pedido", value: "{FECHA_PEDIDO}" },
  { label: "Fecha de Entrega", value: "{FECHA_ENTREGA}" },
  { label: "Método de Pago", value: "{METODO_PAGO}" },
  { label: "Comentarios", value: "{COMENTARIOS}" },
  { label: "Total", value: "{TOTAL}" },
  { label: "Listado Productos", value: "{ITEMS}" },
  { label: "Estado del Pedido", value: "{ESTADO}" },
  { label: "Nombre Proveedor", value: "{PROVEEDOR}" },
];

// Componente EditorPlantillaEmail para editar plantillas de correo electrónico
const EditorPlantillaEmail = ({
  value,
  onChange,
  placeholder,
  containerStyle,
}) => {
  const { themeObject } = useTheme();
  const styles = createStyles(themeObject);
  const [texto, setTexto] = useState(value || "");
  const [seleccionInicio, setSeleccionInicio] = useState(0);
  const [mostrarInserciones, setMostrarInserciones] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setTexto(value || "");
  }, [value]);

  // Maneja el cambio de texto en el editor
  const handleChangeText = (nuevoTexto) => {
    setTexto(nuevoTexto);
    onChange(nuevoTexto);
  };

  // Inserta el texto seleccionado en la posición del cursor
  const insertarTexto = (textoAInsertar) => {
    const textoAntes = texto.substring(0, seleccionInicio);
    const textoDespues = texto.substring(seleccionInicio);
    const nuevoTexto = textoAntes + textoAInsertar + textoDespues;

    handleChangeText(nuevoTexto);

    // Cerrar el menú después de insertar
    setMostrarInserciones(false);

    // Esperar a que se actualice el texto y luego enfocar el input
    setTimeout(() => {
      inputRef.current?.focus();
      // Mover el cursor después del texto insertado
      const nuevaPosicion = seleccionInicio + textoAInsertar.length;
      inputRef.current?.setSelection(nuevaPosicion, nuevaPosicion);
    }, 100);
  };

  // Maneja el cambio de selección
  const handleSeleccion = (event) => {
    const { selection } = event.nativeEvent;
    setSeleccionInicio(selection.start);
  };

  // Maneja la selección de una variable desde el picker
  const handleVariableSelect = (itemValue) => {
    if (itemValue !== "todos") {
      insertarTexto(itemValue);
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.toolbar}>
        {Platform.OS === "ios" || Platform.OS === "android" ? (
          <CustomButton
            variant="primary"
            size="sm"
            onPress={() => setMostrarInserciones(!mostrarInserciones)}
          >
            Insertar variable
          </CustomButton>
        ) : (
          <CustomPicker
            placeholder="Insertar variable"
            selectedValue="todos"
            onValueChange={handleVariableSelect}
            items={INSERCIONES_PLANTILLA}
          />
        )}
      </View>

      {mostrarInserciones &&
        (Platform.OS === "ios" || Platform.OS === "android") && (
          <View style={styles.insercionesList}>
            {INSERCIONES_PLANTILLA.map((item, index) => (
              <CustomButton
                key={index}
                variant="ghost"
                style={styles.insercionItem}
                onPress={() => insertarTexto(item.value)}
              >
                {item.label}
              </CustomButton>
            ))}
          </View>
        )}

      <ScrollView style={styles.editorContainer}>
        <TextInput
          ref={inputRef}
          style={styles.editor}
          multiline
          value={texto}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={themeObject.colors.placeholder}
          onSelectionChange={handleSeleccion}
          textAlignVertical="top"
        />
      </ScrollView>
    </View>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.background,
      overflow: "hidden",
    },
    toolbar: {
      flexDirection: "row",
      padding: 8,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    editorContainer: {
      minHeight: 150,
      maxHeight: 250,
    },
    editor: {
      padding: 10,
      color: theme.colors.text,
      fontSize: 14,
      fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
      minHeight: 150,
    },
    insercionesList: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.roundness,
      position: "absolute",
      top: 45,
      left: 10,
      zIndex: 1000,
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    },
    insercionItem: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      width: "100%",
      justifyContent: "flex-start",
    },
  });

export default EditorPlantillaEmail;
