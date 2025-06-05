import React, { useState } from "react";
import { View } from "react-native";
import OrdersHeader from "./ordersHeader";
import OrdersBody from "./ordersBody";
import SuppliersBody from "../supplier/suppliersBody";

//Componente principal de la pantalla de pedidos
const OrdersScreen = () => {
  const [activeView, setActiveView] = useState("pedidos");

  return (
    <View style={{ flex: 1 }}>
      <OrdersHeader activeView={activeView} onViewChange={setActiveView} />
      {activeView === "pedidos" ? <OrdersBody /> : <SuppliersBody />}
    </View>
  );
};

export default OrdersScreen;
