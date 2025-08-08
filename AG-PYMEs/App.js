import React, { useEffect } from "react";
import "react-native-web";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar, View, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider as PaperProvider } from "react-native-paper";

import Header from "./components/header.js";
import CustomBottomTabs from "./navigation/AppNavigator";
import { AuthProvider, useAuth } from "./context/AuthContext.js";
import { ThemeProvider, useTheme } from "./context/ThemeContext.js";
import { NotificationProvider } from "./context/NotificationContext";
import { CompanyProvider } from "./context/CompanyContext.js";
import { GlobalCacheProvider } from "./cache/providers/GlobalCacheProvider.js";
import LoginScreen from "./screens/LoginRegisterScreen.js";
import { configureDatePicker } from "./utils/datePickerConfig";

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
  const { user, isAuthenticated, loading } = useAuth();
  const { themeObject, isLoading: isThemeLoading } = useTheme();

  console.log("🔍 MainApp render - Auth state:", {
    user: !!user,
    isAuthenticated,
    loading,
    userEmail: user?.email,
  });

  // Si está cargando la autenticación o el tema, mostrar indicador
  if (loading || isThemeLoading) {
    console.log(
      "⏳ MainApp showing loader - loading:",
      loading,
      "themeLoading:",
      isThemeLoading
    );
    return <InitialLoader />;
  }

  // Si el usuario está autenticado, muestra la app
  if (isAuthenticated && user) {
    console.log("🚀 MainApp rendering authenticated app for:", user.email);
    return (
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
    );
  }

  // Si no está autenticado, muestra la pantalla de login
  console.log(
    "🔐 MainApp rendering login screen - isAuthenticated:",
    isAuthenticated,
    "user:",
    !!user
  );
  return <LoginScreen />;
};

// Punto de entrada de la aplicación
export default function App() {
  // Configurar el locale para react-native-paper-dates al iniciar la app
  useEffect(() => {
    configureDatePicker();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <CompanyProvider>
          <NotificationProvider>
            <GlobalCacheProvider
              config={{
                defaultStrategy: "ttl",
                maxMemoryUsage: 50 * 1024 * 1024, // 50MB
                cleanupInterval: 300000, // 5 minutos
                enableMetrics: true,
                logLevel: __DEV__ ? "debug" : "warn",
                strategies: {
                  ttl: {
                    defaultTTL: 10 * 60 * 1000, // 10 minutos
                    maxEntries: 1000,
                  },
                  bulkLoading: {
                    compression: true,
                    maxBatchSize: 100,
                  },
                  intelligent: {
                    adaptiveTTL: true,
                    patternAnalysis: true,
                    staleWhileRevalidate: true,
                  },
                },
              }}
            >
              <SafeAreaProvider
                style={{
                  flex: 1,
                }}
              >
                <ThemedStatusBar />
                <MainApp />
              </SafeAreaProvider>
            </GlobalCacheProvider>
          </NotificationProvider>
        </CompanyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
