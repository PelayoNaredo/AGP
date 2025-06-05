import React from "react";
import "react-native-web";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar, View, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import Header from "./components/header.js";
import CustomBottomTabs from "./navigation/AppNavigator";
import { AuthProvider, useAuth } from "./context/AuthContext.js";
import { ThemeProvider, useTheme } from "./context/ThemeContext.js";
import LoginScreen from "./screens/LoginRegisterScreen.js";

// Componente para manejar la barra de estado con el tema actual
const ThemedStatusBar = () => {
  const { themeObject } = useTheme();
  return (
    <StatusBar
      barStyle={themeObject.dark ? "light-content" : "dark-content"}
      backgroundColor={themeObject.colors.background}
    />
  );
};

// Componente para el loader inicial
const InitialLoader = () => {
  const { themeObject } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: themeObject.colors.background,
      }}
    >
      <ActivityIndicator size="large" color={themeObject.colors.primary} />
    </View>
  );
};

// Componente principal con autenticación y tema
const MainApp = () => {
  const { user, loading } = useAuth();
  const { themeObject, isLoading: isThemeLoading } = useTheme();

  // Si está cargando la autenticación o el tema, mostrar indicador
  if (loading || isThemeLoading) {
    return <InitialLoader />;
  }

  // Si el usuario está autenticado, muestra la app
  return user ? (
    <>
      <View
        style={{
          flex: 1,
          backgroundColor: themeObject.colors.background,
        }}
      >
        <NavigationContainer
          theme={{
            dark: themeObject.dark,
            colors: {
              ...themeObject.colors,
              primary: themeObject.colors.primary,
              background: themeObject.colors.background,
              card: themeObject.colors.surface,
              text: themeObject.colors.text,
              border: themeObject.colors.border,
              notification: themeObject.colors.notification,
            },
          }}
        >
          <Header />
          <CustomBottomTabs />
        </NavigationContainer>
      </View>
    </>
  ) : (
    // Si no está autenticado, muestra la pantalla de login
    <LoginScreen />
  );
};

// Punto de entrada de la aplicación
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SafeAreaProvider
          style={{
            flex: 1,
          }}
        >
          <ThemedStatusBar />
          <MainApp />
        </SafeAreaProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
