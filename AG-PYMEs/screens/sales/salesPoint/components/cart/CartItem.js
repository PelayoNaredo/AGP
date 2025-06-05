import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../../../context/ThemeContext";

//Componente que renderiza un elemento del carrito
const CartItem = ({ item, onQuantityChange, getItemName, getItemId }) => {
  const { themeObject } = useTheme();

  const styles = StyleSheet.create({
    cartItemContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: themeObject.colors.border,
    },
    cartItemInfo: {
      flex: 1,
    },
    cartItemName: {
      fontSize: 16,
      color: themeObject.colors.text,
      marginBottom: 4,
    },
    cartItemPrice: {
      color: themeObject.colors.placeholder,
      fontSize: 14,
    },
    cartItemActions: {
      flexDirection: "row",
      alignItems: "center",
      width: 100,
      justifyContent: "space-between",
    },
    quantityText: {
      fontSize: 16,
      color: themeObject.colors.text,
      width: 30,
      textAlign: "center",
    },
    quantityButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: themeObject.colors.primary,
    },
    cartItemType: {
      fontSize: 12,
      fontStyle: "italic",
    },
  });

  return (
    <View style={styles.cartItemContainer}>
      <View style={styles.cartItemInfo}>
        <Text style={styles.cartItemName}>{getItemName(item)}</Text>
        <Text style={styles.cartItemPrice}>
          {parseFloat(item.precio_unitario || 0).toFixed(2)} €
          {item.tipo === "servicio" && item.tipo_tarifa === "por_hora"
            ? "/hora"
            : ""}
          {item.tipo === "servicio" &&
          item.tipo_tarifa === "mano_obra" &&
          item.horas
            ? ` x ${item.horas} h = ${(parseFloat(item.precio_unitario || 0) * parseFloat(item.horas || 1)).toFixed(2)} €`
            : ""}
          {item.tipo === "producto" && (
            <Text style={{ fontSize: 10, fontStyle: "italic" }}> (PVP)</Text>
          )}
        </Text>
        {item.tipo === "servicio" && (
          <View>
            <Text
              style={[
                styles.cartItemType,
                { color: themeObject.colors.primary },
              ]}
            >
              Servicio
              {item.tipo_tarifa === "por_nivel" && item.nivel_seleccionado
                ? ` - Nivel: ${item.nivel_seleccionado.nombre_nivel}`
                : ""}
              {item.precio_personalizado && item.horas
                ? ` - ${item.horas} hora${item.horas !== 1 ? "s" : ""}`
                : ""}
            </Text>
            {item.descripcion_personalizada && (
              <Text
                style={[
                  styles.cartItemType,
                  { color: themeObject.colors.secondary },
                ]}
              >
                {item.descripcion_personalizada}
              </Text>
            )}
          </View>
        )}
      </View>
      <View style={styles.cartItemActions}>
        <Pressable
          style={styles.quantityButton}
          onPress={() => onQuantityChange(getItemId(item), -1, item.tipo)}
        >
          <Ionicons name="remove" size={10} color="white" />
        </Pressable>
        <Text style={styles.quantityText}>{item.cantidad}</Text>
        <Pressable
          style={styles.quantityButton}
          onPress={() => onQuantityChange(getItemId(item), 1, item.tipo)}
        >
          <Ionicons name="add" size={10} color="white" />
        </Pressable>
      </View>
    </View>
  );
};

export default CartItem;
