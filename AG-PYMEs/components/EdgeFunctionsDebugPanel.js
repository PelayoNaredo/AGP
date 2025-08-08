/**
 * 🔧 PANEL DE DEBUG TEMPORAL PARA EDGE FUNCTIONS
 *
 * Componente React Native para debugging en tiempo real
 * de la migración a Edge Functions
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Importar diagnósticos
import AdvancedDiagnostics from "../utils/advancedDiagnostics";
import MigrationScript from "../utils/migrationScript";

const EdgeFunctionsDebugPanel = ({ onClose }) => {
  const [diagnosticResults, setDiagnosticResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Estados para tests individuales
  const [environmentStatus, setEnvironmentStatus] = useState(null);
  const [connectivityStatus, setConnectivityStatus] = useState(null);
  const [authStatus, setAuthStatus] = useState(null);
  const [edgeFunctionsStatus, setEdgeFunctionsStatus] = useState(null);

  // Ejecutar diagnóstico completo
  const runFullDiagnostic = async () => {
    setIsRunning(true);
    try {
      console.log("🚀 [DEBUG_PANEL] Iniciando diagnóstico completo...");

      const results = await AdvancedDiagnostics.runCompleteDiagnostic();
      setDiagnosticResults(results);

      // Actualizar estados individuales
      setEnvironmentStatus(results.environment);
      setConnectivityStatus(results.connectivity);
      setAuthStatus(results.authentication);
      setEdgeFunctionsStatus(results.edgeFunctions);

      console.log("✅ [DEBUG_PANEL] Diagnóstico completado");
    } catch (error) {
      console.error("❌ [DEBUG_PANEL] Error en diagnóstico:", error);
      Alert.alert("Error", "Error ejecutando diagnóstico: " + error.message);
    } finally {
      setIsRunning(false);
      setRefreshing(false);
    }
  };

  // Test individual de Edge Functions
  const testSingleEdgeFunction = async (functionName) => {
    try {
      console.log(`🧪 [DEBUG_PANEL] Probando ${functionName}...`);

      // Aquí puedes probar funciones específicas
      Alert.alert("Test", `Probando ${functionName}...`);
    } catch (error) {
      Alert.alert("Error", `Error probando ${functionName}: ${error.message}`);
    }
  };

  // Ejecutar migración
  const runMigration = async () => {
    try {
      console.log("🔄 [DEBUG_PANEL] Ejecutando migración...");

      const migrationResults = await MigrationScript.runMigration();

      Alert.alert(
        "Migración Completada",
        `Estado: ${migrationResults.overall}\n` +
          `Tests exitosos: ${migrationResults.basicTests?.successful.length || 0}`
      );

      // Refrescar diagnóstico después de migración
      await runFullDiagnostic();
    } catch (error) {
      Alert.alert("Error", "Error en migración: " + error.message);
    }
  };

  // Cargar diagnóstico inicial
  useEffect(() => {
    runFullDiagnostic();
  }, []);

  // Renderizar estado de salud con colores
  const renderHealthStatus = (status, label) => {
    const getStatusColor = () => {
      switch (status) {
        case "excellent":
          return "#4CAF50";
        case "good":
          return "#8BC34A";
        case "fair":
          return "#FF9800";
        case "poor":
          return "#F44336";
        default:
          return "#9E9E9E";
      }
    };

    const getStatusIcon = () => {
      switch (status) {
        case "excellent":
          return "checkmark-circle";
        case "good":
          return "checkmark";
        case "fair":
          return "warning";
        case "poor":
          return "close-circle";
        default:
          return "help-circle";
      }
    };

    return (
      <View style={styles.statusRow}>
        <Ionicons name={getStatusIcon()} size={20} color={getStatusColor()} />
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {label}: {status?.toUpperCase() || "UNKNOWN"}
        </Text>
      </View>
    );
  };

  // Renderizar tab de overview
  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>🏥 Estado General del Sistema</Text>

      {diagnosticResults && (
        <>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>
              Puntuación: {diagnosticResults.score}/100
            </Text>
            {renderHealthStatus(
              diagnosticResults.overallHealth,
              "Salud General"
            )}
          </View>

          <Text style={styles.sectionTitle}>📊 Componentes</Text>
          {renderHealthStatus(
            environmentStatus?.allConfigured ? "excellent" : "poor",
            "Entorno"
          )}
          {renderHealthStatus(
            connectivityStatus?.connected ? "excellent" : "poor",
            "Conectividad"
          )}
          {renderHealthStatus(
            authStatus?.hasValidAuthentication ? "excellent" : "poor",
            "Autenticación"
          )}
          {renderHealthStatus(
            edgeFunctionsStatus?.summary?.criticalPassed > 0
              ? "excellent"
              : "poor",
            "Edge Functions"
          )}

          {diagnosticResults.recommendations?.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>💡 Recomendaciones</Text>
              {diagnosticResults.recommendations.map((rec, index) => (
                <Text key={index} style={styles.recommendation}>
                  • {rec}
                </Text>
              ))}
            </>
          )}
        </>
      )}
    </View>
  );

  // Renderizar tab de Edge Functions
  const renderEdgeFunctionsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>🧪 Edge Functions Status</Text>

      {edgeFunctionsStatus && (
        <>
          <View style={styles.summaryRow}>
            <Text>Total: {edgeFunctionsStatus.summary.total}</Text>
            <Text style={{ color: "#4CAF50" }}>
              Exitosas: {edgeFunctionsStatus.summary.passed}
            </Text>
            <Text style={{ color: "#F44336" }}>
              Fallidas: {edgeFunctionsStatus.summary.failed}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>✅ Funciones Exitosas</Text>
          {edgeFunctionsStatus.successful.map((test, index) => (
            <View key={index} style={styles.testRow}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.testName}>{test.name}</Text>
              <Text style={styles.testDuration}>{test.duration}ms</Text>
            </View>
          ))}

          {edgeFunctionsStatus.failed.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>❌ Funciones Fallidas</Text>
              {edgeFunctionsStatus.failed.map((test, index) => (
                <View key={index} style={styles.testRow}>
                  <Ionicons name="close-circle" size={16} color="#F44336" />
                  <Text style={styles.testName}>{test.name}</Text>
                  <Text style={styles.testError}>{test.error}</Text>
                </View>
              ))}
            </>
          )}
        </>
      )}

      <TouchableOpacity
        style={styles.testButton}
        onPress={() => testSingleEdgeFunction("dashboard")}
      >
        <Text style={styles.buttonText}>🧪 Test Dashboard</Text>
      </TouchableOpacity>
    </View>
  );

  // Renderizar tab de entorno
  const renderEnvironmentTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>🔧 Variables de Entorno</Text>

      {environmentStatus && (
        <>
          <Text style={styles.subsectionTitle}>✅ Configuradas:</Text>
          {environmentStatus.validVariables?.map((varName, index) => (
            <Text key={index} style={styles.envVar}>
              • {varName}
            </Text>
          ))}

          {environmentStatus.missingVariables?.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>❌ Faltantes:</Text>
              {environmentStatus.missingVariables.map((varName, index) => (
                <Text key={index} style={[styles.envVar, { color: "#F44336" }]}>
                  • {varName}
                </Text>
              ))}
            </>
          )}

          <Text style={styles.sectionTitle}>📱 Plataforma</Text>
          <Text style={styles.envVar}>
            • Tipo: {environmentStatus.platform?.isWeb ? "Web" : "React Native"}
          </Text>
          <Text style={styles.envVar}>
            • AsyncStorage:{" "}
            {environmentStatus.platform?.hasAsyncStorage ? "✅" : "❌"}
          </Text>
          <Text style={styles.envVar}>
            • LocalStorage:{" "}
            {environmentStatus.platform?.hasLocalStorage ? "✅" : "❌"}
          </Text>
        </>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🔧 Edge Functions Debug</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {["overview", "edgefunctions", "environment"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab === "overview" && "📊 General"}
              {tab === "edgefunctions" && "🧪 Functions"}
              {tab === "environment" && "🔧 Entorno"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={runFullDiagnostic}
          />
        }
      >
        {activeTab === "overview" && renderOverviewTab()}
        {activeTab === "edgefunctions" && renderEdgeFunctionsTab()}
        {activeTab === "environment" && renderEnvironmentTab()}
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={runFullDiagnostic}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>
            {isRunning ? "🔄 Ejecutando..." : "🔍 Ejecutar Diagnóstico"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={runMigration}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>🚀 Ejecutar Migración</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#2196F3",
  },
  tabText: {
    fontSize: 14,
    color: "#666",
  },
  activeTabText: {
    color: "#2196F3",
    fontWeight: "bold",
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginVertical: 12,
    color: "#333",
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginVertical: 8,
    color: "#666",
  },
  scoreContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  statusText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "bold",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  testRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 4,
    marginVertical: 2,
  },
  testName: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
  },
  testDuration: {
    fontSize: 10,
    color: "#666",
  },
  testError: {
    fontSize: 10,
    color: "#F44336",
    marginLeft: 8,
  },
  envVar: {
    fontSize: 12,
    marginLeft: 16,
    marginVertical: 2,
  },
  recommendation: {
    fontSize: 12,
    marginLeft: 16,
    marginVertical: 2,
    color: "#FF9800",
  },
  actions: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  actionButton: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#2196F3",
  },
  secondaryButton: {
    backgroundColor: "#4CAF50",
  },
  testButton: {
    backgroundColor: "#FF9800",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default EdgeFunctionsDebugPanel;
