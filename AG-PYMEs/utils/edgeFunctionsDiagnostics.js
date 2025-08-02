/**
 * Script de prueba para verificar la migración a EdgeFunctions
 * Ejecutar desde la app o desde una pantalla de debug
 */

import EdgeFunctionsAPI from "../api/edgeFunctionsService";
import { EdgeFunctions } from "../config/supabase";

export const testEdgeFunctionsMigration = async () => {
  console.log("🔄 Iniciando pruebas de migración a EdgeFunctions...");

  const results = {
    successful: [],
    failed: [],
    errors: [],
  };

  // Lista de pruebas a ejecutar
  const tests = [
    {
      name: "Companies - getCurrent",
      test: () => EdgeFunctionsAPI.companies.getCurrent(),
    },
    {
      name: "Alerts - getAll",
      test: () => EdgeFunctionsAPI.alerts.getAll(),
    },
    {
      name: "Clients - getAll",
      test: () => EdgeFunctionsAPI.clients.getAll(),
    },
    {
      name: "Employees - getAll",
      test: () => EdgeFunctionsAPI.employees.getAll(),
    },
    {
      name: "Appointments - getAll",
      test: () => EdgeFunctionsAPI.appointments.getAll(),
    },
    {
      name: "Inventory - getAll",
      test: () => EdgeFunctionsAPI.inventory.getAll(),
    },
    {
      name: "Services - getAll",
      test: () => EdgeFunctionsAPI.services.getAll(),
    },
    {
      name: "Dashboard - getData",
      test: () => EdgeFunctionsAPI.dashboard.getData(),
    },
  ];

  // Ejecutar pruebas
  for (const testCase of tests) {
    try {
      console.log(`🧪 Probando: ${testCase.name}`);
      const result = await testCase.test();

      if (result !== null && result !== undefined) {
        console.log(`✅ ${testCase.name}: Exitoso`);
        results.successful.push(testCase.name);
      } else {
        console.log(`⚠️  ${testCase.name}: Respuesta vacía`);
        results.failed.push(testCase.name);
      }
    } catch (error) {
      console.error(`❌ ${testCase.name}: Error -`, error.message);
      results.failed.push(testCase.name);
      results.errors.push({
        test: testCase.name,
        error: error.message,
      });
    }
  }

  // Resumen de resultados
  console.log("\n📊 Resumen de pruebas:");
  console.log(`✅ Exitosas: ${results.successful.length}`);
  console.log(`❌ Fallidas: ${results.failed.length}`);

  if (results.successful.length > 0) {
    console.log("\n✅ Pruebas exitosas:");
    results.successful.forEach((test) => console.log(`  - ${test}`));
  }

  if (results.failed.length > 0) {
    console.log("\n❌ Pruebas fallidas:");
    results.failed.forEach((test) => console.log(`  - ${test}`));
  }

  if (results.errors.length > 0) {
    console.log("\n🔍 Detalles de errores:");
    results.errors.forEach(({ test, error }) => {
      console.log(`  - ${test}: ${error}`);
    });
  }

  return results;
};

/**
 * Prueba específica para verificar variables de entorno
 */
export const testEnvironmentVariables = () => {
  console.log("🔧 Verificando variables de entorno...");

  const requiredVars = [
    "EXPO_PUBLIC_SUPABASE_URL",
    "EXPO_PUBLIC_SUPABASE_ANON_KEY",
  ];

  const missing = [];
  const present = [];

  requiredVars.forEach((varName) => {
    const value = process.env[varName];
    if (value && value !== "TU_SUPABASE_URL" && value !== "TU_ANON_KEY") {
      console.log(`✅ ${varName}: Configurada`);
      present.push(varName);
    } else {
      console.log(`❌ ${varName}: No configurada o con valor por defecto`);
      missing.push(varName);
    }
  });

  return {
    allConfigured: missing.length === 0,
    present,
    missing,
  };
};

/**
 * Prueba de conectividad básica con Supabase
 */
export const testSupabaseConnection = async () => {
  try {
    console.log("🔗 Probando conexión con Supabase...");

    const { supabase } = await import("../config/supabase");
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error("❌ Error de conexión:", error.message);
      return { connected: false, error: error.message };
    }

    console.log("✅ Conexión con Supabase exitosa");
    return {
      connected: true,
      hasSession: !!data.session,
      sessionInfo: data.session
        ? {
            userId: data.session.user?.id,
            email: data.session.user?.email,
          }
        : null,
    };
  } catch (error) {
    console.error("❌ Error al conectar con Supabase:", error.message);
    return { connected: false, error: error.message };
  }
};

/**
 * Función principal de diagnóstico
 */
export const runMigrationDiagnostics = async () => {
  console.log("🚀 DIAGNÓSTICO DE MIGRACIÓN A EDGEFUNCTIONS");
  console.log("=".repeat(50));

  // 1. Verificar variables de entorno
  const envResults = testEnvironmentVariables();

  // 2. Probar conexión con Supabase
  const connectionResults = await testSupabaseConnection();

  // 3. Probar EdgeFunctions solo si la conexión es exitosa
  let functionResults = null;
  if (connectionResults.connected && envResults.allConfigured) {
    functionResults = await testEdgeFunctionsMigration();
  } else {
    console.log("⏭️  Saltando pruebas de EdgeFunctions (falta configuración)");
  }

  // Resumen final
  console.log("\n🎯 DIAGNÓSTICO COMPLETO:");
  console.log(
    `Variables de entorno: ${envResults.allConfigured ? "✅" : "❌"}`
  );
  console.log(
    `Conexión Supabase: ${connectionResults.connected ? "✅" : "❌"}`
  );

  if (functionResults) {
    const allWorking = functionResults.failed.length === 0;
    console.log(
      `EdgeFunctions: ${allWorking ? "✅" : "⚠️"} (${functionResults.successful.length}/${functionResults.successful.length + functionResults.failed.length})`
    );
  }

  return {
    environment: envResults,
    connection: connectionResults,
    functions: functionResults,
  };
};

export default {
  testEdgeFunctionsMigration,
  testEnvironmentVariables,
  testSupabaseConnection,
  runMigrationDiagnostics,
};
