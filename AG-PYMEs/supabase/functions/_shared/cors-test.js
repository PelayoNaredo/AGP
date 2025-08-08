/**
 * 🧪 CORS Test Script - FASE 1 Testing
 *
 * Script para verificar que el middleware CORS funciona correctamente
 * en todas las Edge Functions después de la implementación
 */

// Test CORS desde el navegador o herramientas como Postman
const EDGE_FUNCTION_URL = "https://your-project.supabase.co/functions/v1/login";

// 🧪 Test 1: Preflight OPTIONS request
async function testPreflightCORS() {
  console.log("🧪 Testing preflight OPTIONS request...");

  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: "OPTIONS",
      headers: {
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type, Authorization",
      },
    });

    console.log("✅ Status:", response.status);
    console.log("✅ Headers:", Object.fromEntries(response.headers));

    // Verificar headers CORS necesarios
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
      "access-control-max-age": response.headers.get("access-control-max-age"),
    };

    console.log("🔍 CORS Headers:", corsHeaders);

    // Validaciones
    if (corsHeaders["access-control-allow-origin"] === "*") {
      console.log("✅ Allow-Origin: PASS");
    } else {
      console.log("❌ Allow-Origin: FAIL");
    }

    if (corsHeaders["access-control-allow-methods"]?.includes("POST")) {
      console.log("✅ Allow-Methods: PASS");
    } else {
      console.log("❌ Allow-Methods: FAIL");
    }

    return response.status === 204;
  } catch (error) {
    console.error("❌ Preflight test failed:", error);
    return false;
  }
}

// 🧪 Test 2: Actual POST request with CORS
async function testActualRequestCORS() {
  console.log("🧪 Testing actual POST request with CORS...");

  try {
    const response = await fetch(`${EDGE_FUNCTION_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000", // Simular origen diferente
      },
      body: JSON.stringify({
        email: "test@example.com",
        contrasena: "invalidpass",
      }),
    });

    console.log("✅ Status:", response.status);
    console.log("✅ Response Headers:", Object.fromEntries(response.headers));

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

    // La respuesta debería tener headers CORS incluso en errores
    if (corsHeaders["access-control-allow-origin"]) {
      console.log("✅ CORS headers present in response: PASS");
      return true;
    } else {
      console.log("❌ CORS headers missing in response: FAIL");
      return false;
    }
  } catch (error) {
    console.error("❌ Actual request test failed:", error);
    return false;
  }
}

// 🧪 Test 3: Error response has CORS
async function testErrorResponseCORS() {
  console.log("🧪 Testing error response CORS...");

  try {
    const response = await fetch(`${EDGE_FUNCTION_URL}/nonexistent`, {
      method: "GET",
      headers: {
        Origin: "http://localhost:3000",
      },
    });

    console.log("✅ Status:", response.status);

    const corsHeaders = {
      "access-control-allow-origin": response.headers.get(
        "access-control-allow-origin"
      ),
    };

    if (corsHeaders["access-control-allow-origin"]) {
      console.log("✅ Error responses have CORS: PASS");
      return true;
    } else {
      console.log("❌ Error responses missing CORS: FAIL");
      return false;
    }
  } catch (error) {
    console.error("❌ Error response test failed:", error);
    return false;
  }
}

// 🎯 Ejecutar todos los tests
async function runCORSTests() {
  console.log("🚀 Starting CORS Tests for FASE 1...");
  console.log("=" * 50);

  const results = {
    preflight: await testPreflightCORS(),
    actualRequest: await testActualRequestCORS(),
    errorResponse: await testErrorResponseCORS(),
  };

  console.log("\n📊 Test Results:");
  console.log("=" * 30);
  console.log(
    `Preflight OPTIONS: ${results.preflight ? "✅ PASS" : "❌ FAIL"}`
  );
  console.log(
    `Actual Request: ${results.actualRequest ? "✅ PASS" : "❌ FAIL"}`
  );
  console.log(
    `Error Response: ${results.errorResponse ? "✅ PASS" : "❌ FAIL"}`
  );

  const allPassed = Object.values(results).every((result) => result === true);

  if (allPassed) {
    console.log("\n🎉 ALL CORS TESTS PASSED! FASE 1 Day 1-2 Complete!");
    console.log("✅ CORS middleware working correctly");
    console.log("✅ Ready to move to Day 3-4: RLS Security");
  } else {
    console.log("\n❌ Some tests failed. Please check the implementation.");
  }

  return allPassed;
}

// Ejecutar si se llama directamente
if (typeof window !== "undefined") {
  // En el navegador
  runCORSTests();
} else {
  // En Node.js/Deno
  module.exports = {
    runCORSTests,
    testPreflightCORS,
    testActualRequestCORS,
    testErrorResponseCORS,
  };
}
