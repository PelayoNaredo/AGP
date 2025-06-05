import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import HeaderWithTabs from "../../components/HeaderWithTabs";
import IncomesList from "./income/incomesBody";
import ExpensesList from "./expense/expensesBody";

// Componente principal de la pantalla de ingresos y gastos
const SalesScreen = () => {
  const { themeObject } = useTheme();
  const [activeView, setActiveView] = useState("income");

  const tabs = [
    {
      value: "income",
      label: "Ingresos",
      activeIcon: "cash",
      inactiveIcon: "cash-outline",
    },
    {
      value: "expense",
      label: "Gastos",
      activeIcon: "wallet",
      inactiveIcon: "wallet-outline",
    },
  ];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: themeObject.colors.background },
      ]}
    >
      <HeaderWithTabs
        title="Finanzas"
        tabs={tabs}
        activeView={activeView}
        onChangeView={setActiveView}
      />
      <View style={styles.content}>
        {activeView === "income" ? <IncomesList /> : <ExpensesList />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default SalesScreen;
