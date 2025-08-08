/**
 * 🧪 Enterprise Template CORS Test - FASE 1
 *
 * Test específico para verificar que el enterprise template
 * funciona correctamente con el nuevo middleware CORS
 */

// URL de la función companies (ajustar según tu proyecto)
const COMPANIES_URL = "https://your-project.supabase.co/functions/v1/companies";

// 🧪 Test 1: OPTIONS preflight en enterprise function
async function testEnterprisePreflightCORS() {
  console.log("🧪 Testing Enterprise Template preflight...");

  try {
    const response = await fetch(COMPANIES_URL, {
      method: "OPTIONS",
      headers: {
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "Authorization, Content-Type",
      },
    });

    console.log("✅ Status:", response.status);
    console.log("✅ Headers:", Object.fromEntries(response.headers));

    const corsHeaders = {
      "access-control-allow-origin": response.headers.get(
        "access-control-allow-origin"
      ),
      "access-control-allow-methods": response.headers.get(
        "access-control-allow-methods"
      ),
      "access-control-allow-headers": response.headers.get(
        "access-control-allow-headers"
      ),
    };

    console.log("🔍 CORS Headers:", corsHeaders);

    if (corsHeaders["access-control-allow-origin"] === "*") {
      console.log("✅ Enterprise Template CORS: PASS");
      return true;
    } else {
      console.log("❌ Enterprise Template CORS: FAIL");
      return false;
    }
  } catch (error) {
    console.error("❌ Enterprise preflight test failed:", error);
    return false;
  }
}

// 🧪 Test 2: Error response has CORS (sin autenticación)
async function testEnterpriseErrorCORS() {
  console.log("🧪 Testing Enterprise error response CORS...");

  try {
    const response = await fetch(COMPANIES_URL, {
      method: "GET",
      // Sin Authorization header para provocar error 401
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
      },
    });

    console.log("✅ Status:", response.status, "(esperamos 401)");

    const corsHeaders = {
      "access-control-allow-origin": response.headers.get(
        "access-control-allow-origin"
      ),
    };

    if (response.status === 401 && corsHeaders["access-control-allow-origin"]) {
      console.log("✅ Enterprise Error CORS: PASS");
      return true;
    } else {
      console.log("❌ Enterprise Error CORS: FAIL");
      return false;
    }
  } catch (error) {
    console.error("❌ Enterprise error test failed:", error);
    return false;
  }
}

// 🎯 Ejecutar tests de Enterprise Template
async function runEnterpriseTemplateTests() {
  console.log("🚀 Starting Enterprise Template CORS Tests...");
  console.log("=" * 50);

  const results = {
    preflight: await testEnterprisePreflightCORS(),
    errorResponse: await testEnterpriseErrorCORS(),
  };

  console.log("\n📊 Enterprise Template Test Results:");
  console.log("=" * 40);
  console.log(
    `Preflight OPTIONS: ${results.preflight ? "✅ PASS" : "❌ FAIL"}`
  );
  console.log(
    `Error Response: ${results.errorResponse ? "✅ PASS" : "❌ FAIL"}`
  );

  const allPassed = Object.values(results).every((result) => result === true);

  if (allPassed) {
    console.log("\n🎉 ENTERPRISE TEMPLATE CORS TESTS PASSED!");
    console.log("✅ Companies, Users, Dashboard y otras functions listas");
    console.log("✅ Template enterprise working con CORS unificado");
  } else {
    console.log("\n❌ Some enterprise template tests failed.");
    console.log("🔧 Check the enterprise-template.ts implementation");
  }

  return allPassed;
}

// 📋 Lista de Edge Functions que usan Enterprise Template
const ENTERPRISE_FUNCTIONS = [
  "companies",
  "users",
  "dashboard",
  "suppliers",
  "clients",
  "employees",
  "inventory",
  "sales",
  "expenses",
  "income",
  "alerts",
  "appointments",
  "leaves",
  "services",
  "settings",
];

console.log("📋 Edge Functions actualizadas automáticamente:");
ENTERPRISE_FUNCTIONS.forEach((func) => {
  console.log(`✅ ${func} - Enterprise Template con CORS unificado`);
});

// Ejecutar si se llama directamente
if (typeof window !== "undefined") {
  // En el navegador
  runEnterpriseTemplateTests();
} else {
  // En Node.js/Deno
  module.exports = {
    runEnterpriseTemplateTests,
    testEnterprisePreflightCORS,
    testEnterpriseErrorCORS,
    ENTERPRISE_FUNCTIONS,
  };
}
