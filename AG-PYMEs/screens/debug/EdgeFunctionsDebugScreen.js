import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { runMigrationDiagnostics } from "../utils/edgeFunctionsDiagnostics";

/**
 * Pantalla de debug para probar la migración a EdgeFunctions
 * Se puede agregar temporalmente al navegador para pruebas
 */
const EdgeFunctionsDebugScreen = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults(null);

    try {
      const diagnosticResults = await runMigrationDiagnostics();
      setResults(diagnosticResults);
    } catch (error) {
      Alert.alert("Error", "Error ejecutando diagnósticos: " + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const renderEnvironmentStatus = () => {
    if (!results?.environment) return null;

    const { environment } = results;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Variables de Entorno</Text>
        <Text
          style={[
            styles.status,
            environment.allConfigured ? styles.success : styles.error,
          ]}
        >
          {environment.allConfigured
            ? "✅ Todas configuradas"
            : "❌ Faltan variables"}
        </Text>

        {environment.present.length > 0 && (
          <View>
            <Text style={styles.subtitle}>Configuradas:</Text>
            {environment.present.map((varName) => (
              <Text key={varName} style={styles.successText}>
                ✅ {varName}
              </Text>
            ))}
          </View>
        )}

        {environment.missing.length > 0 && (
          <View>
            <Text style={styles.subtitle}>Faltantes:</Text>
            {environment.missing.map((varName) => (
              <Text key={varName} style={styles.errorText}>
                ❌ {varName}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderConnectionStatus = () => {
    if (!results?.connection) return null;

    const { connection } = results;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Conexión Supabase</Text>
        <Text
          style={[
            styles.status,
            connection.connected ? styles.success : styles.error,
          ]}
        >
          {connection.connected ? "✅ Conectado" : "❌ Sin conexión"}
        </Text>

        {connection.connected && (
          <View>
            <Text style={styles.subtitle}>Estado de sesión:</Text>
            <Text
              style={
                connection.hasSession ? styles.successText : styles.warningText
              }
            >
              {connection.hasSession
                ? "✅ Usuario autenticado"
                : "⚠️ Sin sesión activa"}
            </Text>

            {connection.sessionInfo && (
              <View>
                <Text style={styles.infoText}>
                  ID: {connection.sessionInfo.userId}
                </Text>
                <Text style={styles.infoText}>
                  Email: {connection.sessionInfo.email}
                </Text>
              </View>
            )}
          </View>
        )}

        {connection.error && (
          <Text style={styles.errorText}>Error: {connection.error}</Text>
        )}
      </View>
    );
  };

  const renderFunctionsStatus = () => {
    if (!results?.functions) return null;

    const { functions } = results;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>EdgeFunctions</Text>
        <Text style={styles.status}>
          ✅ Exitosas: {functions.successful.length} | ❌ Fallidas:{" "}
          {functions.failed.length}
        </Text>

        {functions.successful.length > 0 && (
          <View>
            <Text style={styles.subtitle}>Funcionando:</Text>
            {functions.successful.map((test) => (
              <Text key={test} style={styles.successText}>
                ✅ {test}
              </Text>
            ))}
          </View>
        )}

        {functions.failed.length > 0 && (
          <View>
            <Text style={styles.subtitle}>Con problemas:</Text>
            {functions.failed.map((test) => (
              <Text key={test} style={styles.errorText}>
                ❌ {test}
              </Text>
            ))}
          </View>
        )}

        {functions.errors.length > 0 && (
          <View>
            <Text style={styles.subtitle}>Detalles de errores:</Text>
            {functions.errors.map(({ test, error }) => (
              <View key={test} style={styles.errorDetail}>
                <Text style={styles.errorText}>{test}:</Text>
                <Text style={styles.errorMessage}>{error}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>EdgeFunctions Debug</Text>
      <Text style={styles.description}>
        Pantalla de debug para verificar la migración a EdgeFunctions
      </Text>

      <TouchableOpacity
        style={[styles.button, isRunning && styles.buttonDisabled]}
        onPress={runDiagnostics}
        disabled={isRunning}
      >
        <Text style={styles.buttonText}>
          {isRunning ? "Ejecutando..." : "Ejecutar Diagnósticos"}
        </Text>
      </TouchableOpacity>

      {results && (
        <View>
          {renderEnvironmentStatus()}
          {renderConnectionStatus()}
          {renderFunctionsStatus()}
        </View>
      )}

      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>Instrucciones:</Text>
        <Text style={styles.instructionsText}>
          1. Asegúrate de tener configurado el archivo .env con las variables de
          Supabase
        </Text>
        <Text style={styles.instructionsText}>
          2. Verifica que tengas una sesión activa (login)
        </Text>
        <Text style={styles.instructionsText}>
          3. Ejecuta los diagnósticos para verificar el estado
        </Text>
        <Text style={styles.instructionsText}>
          4. Si hay errores, revisa la consola para más detalles
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#333",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#666",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: "#999",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  section: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 5,
    color: "#555",
  },
  status: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  success: {
    color: "#28a745",
  },
  error: {
    color: "#dc3545",
  },
  successText: {
    color: "#28a745",
    fontSize: 14,
    marginBottom: 2,
  },
  errorText: {
    color: "#dc3545",
    fontSize: 14,
    marginBottom: 2,
  },
  warningText: {
    color: "#ffc107",
    fontSize: 14,
    marginBottom: 2,
  },
  infoText: {
    color: "#666",
    fontSize: 12,
    marginBottom: 2,
  },
  errorDetail: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: "#f8f9fa",
    borderRadius: 4,
  },
  errorMessage: {
    color: "#666",
    fontSize: 12,
    fontStyle: "italic",
    marginLeft: 10,
  },
  instructions: {
    backgroundColor: "#e9ecef",
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#495057",
  },
  instructionsText: {
    fontSize: 14,
    marginBottom: 5,
    color: "#6c757d",
  },
});

export default EdgeFunctionsDebugScreen;
