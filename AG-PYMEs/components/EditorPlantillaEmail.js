import React, { useState, useRef, useEffect } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  Text,
  Platform,
  Keyboard,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import CustomButton from "./customButton";
import CustomPicker from "./customPicker";

// Actualizar las variables para que coincidan con los replacements de EmailOrderSender
const INSERCIONES_PLANTILLA = [
  { label: "Número de Pedido", value: "{NUMERO_PEDIDO}" },
  { label: "Fecha de Pedido", value: "{FECHA_PEDIDO}" },
  { label: "Fecha de Entrega", value: "{FECHA_ENTREGA}" },
  { label: "Método de Pago", value: "{METODO_PAGO}" },
  { label: "Comentarios", value: "{COMENTARIOS}" },
  { label: "Total", value: "{TOTAL}" },
  { label: "Nombre Empresa", value: "{NOMBRE_EMPRESA}" },
  { label: "Listado Productos", value: "{ITEMS}" },
  { label: "Estado del Pedido", value: "{ESTADO}" },
  { label: "Nombre Proveedor", value: "{PROVEEDOR}" },
];

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

  const handleChangeText = (nuevoTexto) => {
    setTexto(nuevoTexto);
    onChange(nuevoTexto);
  };

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

  const handleSeleccion = (event) => {
    const { selection } = event.nativeEvent;
    setSeleccionInicio(selection.start);
  };

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
