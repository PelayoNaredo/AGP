import React, { forwardRef, useImperativeHandle } from "react";
import { View, StyleSheet } from "react-native";
import SuppliersBody from "./suppliersBody";

/**
 * Pantalla completa de Proveedores
 * Envuelve SuppliersBody para uso en el InventoryScreen optimizado
 */
const SuppliersScreen = forwardRef(({ externalSearchQuery = "" }, ref) => {
  const suppliersBodyRef = React.useRef(null);

  // Exponer métodos para el componente padre
  useImperativeHandle(ref, () => ({
    openAddModal: () => {
      if (suppliersBodyRef.current) {
        suppliersBodyRef.current.openAddModal();
      }
    },
  }));

  return (
    <View style={styles.container}>
      <SuppliersBody ref={suppliersBodyRef} searchQuery={externalSearchQuery} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SuppliersScreen;
