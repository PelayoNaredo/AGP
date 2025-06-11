import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  FadeInRight,
  FadeOutLeft,
  FadeInUp,
  Layout,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import HeaderWithTabs from "../../components/HeaderWithTabs";
import IncomesList from "./income/incomesBody";
import ExpensesList from "./expense/expensesBody";

// Componente principal de la pantalla de ingresos y gastos
const FinancialScreen = () => {
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
  const renderContent = () => {
    const contentProps = {
      entering: FadeInRight.duration(400).springify(),
      exiting: FadeOutLeft.duration(300),
      layout: Layout.springify(),
      style: styles.contentView,
    };

    return activeView === "income" ? (
      <Animated.View key={activeView} {...contentProps}>
        <IncomesList />
      </Animated.View>
    ) : (
      <Animated.View key={activeView} {...contentProps}>
        <ExpensesList />
      </Animated.View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: themeObject.colors.background },
      ]}
    >
      {/* Header sin animaciones */}
      <HeaderWithTabs
        title="Finanzas"
        tabs={tabs}
        activeView={activeView}
        onChangeView={setActiveView}
      />
      <Animated.View
        style={styles.content}
        entering={FadeInUp.duration(600).springify()}
      >
        {renderContent()}
      </Animated.View>
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
  contentView: {
    flex: 1,
  },
});

export default FinancialScreen;
