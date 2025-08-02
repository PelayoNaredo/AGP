import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { useCompany } from "../context/CompanyContext";
import useCompanyLimits from "../hooks/useCompanyLimits";
import CustomButton from "./customButton";
import LimitChecker from "./LimitChecker";

const CompanyTestingPanel = () => {
  const { company, usage, limitsStatus, loading, refreshData } = useCompany();
  const { validateAction, canAddClient, canAddUser, canAddProduct } =
    useCompanyLimits();
  const [testingState, setTestingState] = useState({
    isRunning: false,
    lastTest: null,
  });

  const runValidationTest = async (action, resource) => {
    console.log(`🧪 Testing validation: ${action} for ${resource}`);

    try {
      setTestingState({ isRunning: true, lastTest: `${action}_${resource}` });

      let result = false;
      let actionName = "";

      switch (resource) {
        case "clients":
          result = await canAddClient();
          actionName = "agregar cliente";
          break;
        case "users":
          result = await canAddUser();
          actionName = "agregar usuario";
          break;
        case "products":
          result = await canAddProduct();
          actionName = "agregar producto";
          break;
        default:
          result = await validateAction(resource, action);
          actionName = action;
      }

      const message = result
        ? `✅ ${actionName.toUpperCase()} PERMITIDO\nPuedes realizar esta acción.`
        : `❌ ${actionName.toUpperCase()} BLOQUEADO\nHas alcanzado el límite del plan.`;

      Alert.alert("🧪 Resultado del Test", message, [{ text: "OK" }]);
    } catch (error) {
      Alert.alert("Error en test", error.message);
    } finally {
      setTestingState({ isRunning: false, lastTest: null });
    }
  };

  // Crear datos de testing mock
  const createTestScenario = (scenario) => {
    Alert.alert(
      "🧪 Escenario de Testing",
      `Esta función simularía el escenario: ${scenario}\n\nEn un entorno real, esto modificaría temporalmente los datos para testing.`,
      [
        {
          text: "Refrescar Datos",
          onPress: () => refreshData(),
          style: "default",
        },
        {
          text: "OK",
          style: "cancel",
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🧪 Cargando Panel de Testing...</Text>
      </View>
    );
  }

  if (!company || !usage) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>⚠️ No hay datos de empresa disponibles</Text>
        <CustomButton
          title="🔄 Recargar"
          onPress={refreshData}
          style={styles.testButton}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        🧪 Panel de Testing - Sistema de Empresas
      </Text>

      {/* Información actual */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Estado Actual</Text>
        <Text style={styles.info}>Empresa: {company.name}</Text>
        <Text style={styles.info}>
          Plan: {company.subscription_plan?.toUpperCase()}
        </Text>

        <View style={styles.limitContainer}>
          <LimitChecker resource="users" title="Usuarios" />
          <LimitChecker resource="clients" title="Clientes" />
          <LimitChecker resource="products" title="Productos" />
          <LimitChecker resource="storage" title="Almacenamiento" />
        </View>
      </View>

      {/* Configurar escenarios simulados */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚙️ Escenarios de Testing</Text>
        <Text style={styles.subsectionTitle}>
          (Simulación - No modifica datos reales)
        </Text>

        <View style={styles.buttonRow}>
          <CustomButton
            title="🟢 Uso Normal"
            onPress={() => createTestScenario("uso normal (10-30%)")}
            style={[styles.testButton, styles.normalButton]}
          />
          <CustomButton
            title="🟡 Cerca del límite"
            onPress={() => createTestScenario("cerca del límite (80-90%)")}
            style={[styles.testButton, styles.warningButton]}
          />
        </View>

        <View style={styles.buttonRow}>
          <CustomButton
            title="🔴 En el límite"
            onPress={() => createTestScenario("en el límite (100%)")}
            style={[styles.testButton, styles.dangerButton]}
          />
          <CustomButton
            title="🔄 Refrescar Datos"
            onPress={refreshData}
            style={[styles.testButton, styles.refreshButton]}
          />
        </View>
      </View>

      {/* Tests de validación reales */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔬 Probar Validaciones Reales</Text>

        <Text style={styles.subsectionTitle}>
          Clientes ({limitsStatus?.clients?.percentage || 0}%)
        </Text>
        <View style={styles.buttonRow}>
          <CustomButton
            title="➕ Validar Agregar Cliente"
            onPress={() => runValidationTest("create", "clients")}
            style={styles.validateButton}
            disabled={testingState.isRunning}
          />
        </View>

        <Text style={styles.subsectionTitle}>
          Usuarios ({limitsStatus?.users?.percentage || 0}%)
        </Text>
        <View style={styles.buttonRow}>
          <CustomButton
            title="👤 Validar Agregar Usuario"
            onPress={() => runValidationTest("create", "users")}
            style={styles.validateButton}
            disabled={testingState.isRunning}
          />
        </View>

        <Text style={styles.subsectionTitle}>
          Productos ({limitsStatus?.products?.percentage || 0}%)
        </Text>
        <View style={styles.buttonRow}>
          <CustomButton
            title="📦 Validar Agregar Producto"
            onPress={() => runValidationTest("create", "products")}
            style={styles.validateButton}
            disabled={testingState.isRunning}
          />
        </View>
      </View>

      {/* Información detallada */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Detalles de Uso</Text>
        {limitsStatus &&
          Object.entries(limitsStatus).map(([key, info]) => (
            <View key={key} style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {key.charAt(0).toUpperCase() + key.slice(1)}:
              </Text>
              <Text
                style={[
                  styles.detailValue,
                  info.percentage >= 90 && styles.warningText,
                ]}
              >
                {info.current}/{info.max} ({info.percentage}%)
                {info.percentage >= 90 && " ⚠️"}
              </Text>
            </View>
          ))}
      </View>

      {/* Estado del testing */}
      {testingState.isRunning && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏳ Ejecutando Test...</Text>
          <Text style={styles.info}>Test actual: {testingState.lastTest}</Text>
        </View>
      )}
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
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  section: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 5,
    color: "#555",
  },
  info: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  limitContainer: {
    gap: 10,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 10,
  },
  testButton: {
    flex: 1,
    minHeight: 40,
  },
  normalButton: {
    backgroundColor: "#4CAF50",
  },
  warningButton: {
    backgroundColor: "#FF9800",
  },
  dangerButton: {
    backgroundColor: "#F44336",
  },
  refreshButton: {
    backgroundColor: "#607D8B",
  },
  validateButton: {
    flex: 1,
    backgroundColor: "#2196F3",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  detailLabel: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    color: "#666",
  },
  warningText: {
    color: "#FF9800",
    fontWeight: "bold",
  },
});

export default CompanyTestingPanel;
