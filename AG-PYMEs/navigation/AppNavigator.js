import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { View, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useTheme } from "../context/ThemeContext";

// Screens
import HomeScreen from "../screens/home/HomeScreen";
import PlannerScreen from "../screens/planner/PlannerScreen";
import InventoryScreen from "../screens/inventory/InventoryScreen";
import SalesScreen from "../screens/sales/SalesScreen";
import EmployeesScreen from "../screens/employees/EmployeesScreen";
import FinancialScreen from "../screens/financial/FinancialScreen";
import SettingsScreen from "../screens/settings/SettingsScreen";
import AlertsScreen from "../screens/alerts/AlertsScreen";
import Header from "../components/header";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const TAB_BAR_WIDTH = 350;
const TAB_COUNT = 6;
const BUTTON_SIZE = 50;

const AnimatedView = Animated.createAnimatedComponent(View);

const AnimatedTabIcon = ({
  isFocused,
  index,
  activeIndex,
  iconName,
  iconColor,
  theme,
}) => {
  const iconStyle = useAnimatedStyle(() => {
    const scale =
      activeIndex.value === index
        ? withSpring(1.2, { damping: 10, stiffness: 150 })
        : withSpring(1, { damping: 10, stiffness: 150 });

    return { transform: [{ scale }] };
  });

  return (
    <AnimatedView style={iconStyle}>
      <Ionicons name={iconName} size={24} color={iconColor} />
    </AnimatedView>
  );
};

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const { themeObject } = useTheme();
  const activeIndex = useSharedValue(state.index);

  // Sincronizar activeIndex con state.index cuando cambie
  React.useEffect(() => {
    if (activeIndex.value !== state.index) {
      activeIndex.value = state.index;
    }
  }, [state.index]);

  const handlePress = (index, route) => {
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });

    if (!event.defaultPrevented && state.index !== index) {
      activeIndex.value = index;
      navigation.navigate(route.name);
    }
  };

  const indicatorStyle = useAnimatedStyle(() => {
    const tabWidth = (TAB_BAR_WIDTH - 2) / TAB_COUNT;
    const translateX = activeIndex.value * tabWidth;

    return {
      transform: [
        { translateX: withSpring(translateX, { damping: 15, stiffness: 120 }) },
      ],
      backgroundColor: themeObject.colors.primary,
      color: themeObject.colors.buttonWhite,
    };
  });

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: themeObject.colors.surface,
          shadowColor: themeObject.colors.shadow,
          borderColor: themeObject.colors.border,
        },
      ]}
    >
      <AnimatedView style={[styles.activeIndicator, indicatorStyle]} />

      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const iconColor = isFocused
          ? themeObject.colors.buttonWhite
          : themeObject.colors.text;

        let iconName;
        switch (route.name) {
          case "Home":
            iconName = isFocused ? "home" : "home-outline";
            break;
          case "Planner":
            iconName = isFocused ? "calendar" : "calendar-outline";
            break;
          case "Inventory":
            iconName = isFocused ? "cube" : "cube-outline";
            break;
          case "Sales":
            iconName = isFocused ? "cart" : "cart-outline";
            break;
          case "Employees":
            iconName = isFocused ? "people" : "people-outline";
            break;
          case "Financial":
            iconName = isFocused ? "wallet" : "wallet-outline";
            break;
        }

        return (
          <Pressable
            key={route.key}
            onPress={() => handlePress(index, route)}
            style={styles.tabButton}
            android_ripple={{
              color: themeObject.colors.primary + "20",
              borderless: true,
            }}
          >
            <AnimatedTabIcon
              isFocused={isFocused}
              index={index}
              activeIndex={activeIndex}
              iconName={iconName}
              iconColor={iconColor}
              theme={themeObject}
            />
          </Pressable>
        );
      })}
    </View>
  );
};

const CustomBottomTabs = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Planner" component={PlannerScreen} />
      <Tab.Screen name="Inventory" component={InventoryScreen} />
      <Tab.Screen name="Financial" component={FinancialScreen} />
      <Tab.Screen name="Employees" component={EmployeesScreen} />
      <Tab.Screen name="Sales" component={SalesScreen} />
    </Tab.Navigator>
  );
};

const AppStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        header: (props) => <Header {...props} />,
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={CustomBottomTabs}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerShown: true,
          title: " ",
        }}
      />
      <Stack.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{
          headerShown: true,
          title: " ",
        }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    height: 60,
    width: TAB_BAR_WIDTH,
    alignSelf: "center",
    margin: 10,
    borderRadius: 30,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
  },
  tabButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    zIndex: 2,
  },
  activeIndicator: {
    position: "absolute",
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    top: 4,
    left: (TAB_BAR_WIDTH / TAB_COUNT - BUTTON_SIZE) / 2,
    zIndex: 1,
  },
});

export default AppStack;
