import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { View, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "../context/ThemeContext";
import { ANIMATION_CONFIGS, TIMING_CONFIGS } from "../components/animations";

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
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(isFocused ? 1 : 0.7);

  React.useEffect(() => {
    if (activeIndex.value === index) {
      scale.value = withSpring(1.3, TIMING_CONFIGS.spring.spring);
      rotation.value = withSpring(360, {
        ...TIMING_CONFIGS.spring.spring,
        duration: 600,
      });
      opacity.value = withTiming(1, TIMING_CONFIGS.timing.medium);
    } else {
      scale.value = withSpring(1, TIMING_CONFIGS.spring.quickSpring);
      rotation.value = withTiming(0, TIMING_CONFIGS.timing.fast);
      opacity.value = withTiming(0.7, TIMING_CONFIGS.timing.fast);
    }
  }, [activeIndex.value, index]);

  const iconStyle = useAnimatedStyle(() => {
    const isActive = activeIndex.value === index;

    return {
      transform: [
        { scale: scale.value },
        {
          rotate: `${interpolate(
            rotation.value,
            [0, 360],
            [0, 360],
            Extrapolate.CLAMP
          )}deg`,
        },
      ],
      opacity: opacity.value,
    };
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
  const indicatorScale = useSharedValue(1);
  const indicatorOpacity = useSharedValue(1);
  // Sincronizar activeIndex con state.index cuando cambie
  React.useEffect(() => {
    if (activeIndex.value !== state.index) {
      // Animación del indicador durante el cambio
      indicatorScale.value = withSpring(0.8, TIMING_CONFIGS.spring.quickSpring);
      indicatorOpacity.value = withTiming(0.7, TIMING_CONFIGS.timing.fast);

      setTimeout(() => {
        activeIndex.value = state.index;
        indicatorScale.value = withSpring(1, TIMING_CONFIGS.spring.spring);
        indicatorOpacity.value = withTiming(1, TIMING_CONFIGS.timing.medium);
      }, 50);
    }
  }, [state.index]);

  const handlePress = (index, route) => {
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });

    if (!event.defaultPrevented && state.index !== index) {
      // Animación de press
      indicatorScale.value = withSpring(0.9, TIMING_CONFIGS.spring.quickSpring);

      setTimeout(() => {
        activeIndex.value = index;
        navigation.navigate(route.name);
      }, 50);
    }
  };

  const indicatorStyle = useAnimatedStyle(() => {
    const tabWidth = (TAB_BAR_WIDTH - 2) / TAB_COUNT;
    const translateX = activeIndex.value * tabWidth;

    return {
      transform: [
        {
          translateX: withSpring(translateX, {
            ...TIMING_CONFIGS.spring.spring,
            damping: 18,
            stiffness: 140,
          }),
        },
        { scale: indicatorScale.value },
      ],
      backgroundColor: themeObject.colors.primary,
      opacity: indicatorOpacity.value,
      shadowColor: themeObject.colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
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
              color: themeObject.colors.primary + "30",
              borderless: true,
              radius: 25,
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
        // Optimización: Mantener pantallas en memoria
        lazy: false, // Cargar todas las pestañas inmediatamente
        unmountOnBlur: false, // No desmontar al cambiar de pestaña
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          // Optimización específica para Home
          freezeOnBlur: false,
        }}
      />
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
        headerStyle: {
          height: 80,
        },
        cardStyle: {
          paddingTop: 0, // Eliminar padding superior de las pantallas
        },
        // Optimización: Mantener pantallas en memoria
        detachPreviousScreen: false, // No desmontar pantalla anterior
        freezeOnBlur: false, // No congelar al salir de foco
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
          title: "Configuración",
          headerStyle: {
            height: 40, // Reducir altura del header
            elevation: 0, // Sin sombra en Android
            shadowOpacity: 0, // Sin sombra en iOS
          },
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: "600",
          },
          headerTitleContainerStyle: {
            paddingTop: 0,
          },
        }}
      />
      <Stack.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{
          headerShown: false,
          // Optimización: Mantener pantalla en memoria
          lazy: false, // Cargar inmediatamente
          unmountOnBlur: false, // No desmontar al perder foco
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
