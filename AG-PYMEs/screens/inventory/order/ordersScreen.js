import React, { useState, forwardRef, useImperativeHandle } from "react";
import { View } from "react-native";
import OrdersHeader from "./ordersHeader";
import OrdersBody from "./ordersBody";
import SuppliersBody from "../supplier/suppliersBody";

//Componente principal de la pantalla de pedidos
const OrdersScreen = forwardRef(
  ({ hideSearchBar = false, externalSearchQuery = "" }, ref) => {
    const [activeView, setActiveView] = useState("pedidos");
    const ordersBodyRef = React.useRef(null);
    const suppliersBodyRef = React.useRef(null);

    // Exponer métodos para el componente padre
    useImperativeHandle(ref, () => ({
      openAddModal: () => {
        if (activeView === "pedidos" && ordersBodyRef.current) {
          ordersBodyRef.current.openAddModal();
        } else if (activeView === "proveedores" && suppliersBodyRef.current) {
          suppliersBodyRef.current.openAddModal();
        }
      },
    }));

    return (
      <View style={{ flex: 1 }}>
        {!hideSearchBar && (
          <OrdersHeader activeView={activeView} onViewChange={setActiveView} />
        )}
        {activeView === "pedidos" ? (
          <OrdersBody ref={ordersBodyRef} searchQuery={externalSearchQuery} />
        ) : (
          <SuppliersBody
            ref={suppliersBodyRef}
            searchQuery={externalSearchQuery}
          />
        )}
      </View>
    );
  }
);

export default OrdersScreen;
