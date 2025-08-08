/**
 * 🧪 Test CORS Progress - FASE 1 Día 1-2
 *
 * Testing de progreso de implementación CORS
 * Verifica que las Edge Functions actualizadas respondan correctamente a OPTIONS
 */

// Lista de Edge Functions actualizadas hasta ahora
const updatedFunctions = [
  "login",
  "signed-url",
  "alerts",
  "suppliers",
  "user-sync",
  "users",
  "settings",
  "companies",
];

// Lista de Edge Functions en progreso
const inProgressFunctions = ["register", "dashboard"];

// Lista de Edge Functions pendientes
const pendingFunctions = [
  "shifts",
  "sales",
  "orders",
  "order-detail",
  "leaves",
  "inventory",
  "income",
  "expenses",
  "employees",
  "clients",
  "appointments",
];

async function testCorsResponse(functionName, baseUrl) {
  const url = `${baseUrl}/functions/v1/${functionName}`;

  try {
    const response = await fetch(url, {
      method: "OPTIONS",
      headers: {
        Origin: "https://example.com",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type, Authorization",
      },
    });

    const corsHeaders = {
      "Access-Control-Allow-Origin": response.headers.get(
        "Access-Control-Allow-Origin"
      ),
      "Access-Control-Allow-Methods": response.headers.get(
        "Access-Control-Allow-Methods"
      ),
      "Access-Control-Allow-Headers": response.headers.get(
        "Access-Control-Allow-Headers"
      ),
    };

    return {
      status: response.status,
      corsHeaders,
      success:
        response.status === 200 &&
        corsHeaders["Access-Control-Allow-Origin"] === "*",
    };
  } catch (error) {
    return {
      status: "ERROR",
      error: error.message,
      success: false,
    };
  }
}

async function runCorsTests() {
  console.log("🔍 CORS Testing - FASE 1 Progreso\n");

  // Obtener URL base de Supabase (reemplazar con tu URL)
  const baseUrl = "https://your-project.supabase.co"; // ⚠️ REEMPLAZAR CON URL REAL

  console.log("✅ Testing Edge Functions ACTUALIZADAS:");
  for (const functionName of updatedFunctions) {
    const result = await testCorsResponse(functionName, baseUrl);
    const status = result.success ? "✅" : "❌";
    console.log(
      `${status} ${functionName}: ${result.status} ${result.success ? "(CORS OK)" : "(CORS FAIL)"}`
    );
  }

  console.log("\n🔄 Testing Edge Functions EN PROGRESO:");
  for (const functionName of inProgressFunctions) {
    const result = await testCorsResponse(functionName, baseUrl);
    const status = result.success ? "✅" : "⚠️";
    console.log(
      `${status} ${functionName}: ${result.status} ${result.success ? "(CORS OK)" : "(Necesita completar)"}`
    );
  }

  console.log("\n⏳ Testing Edge Functions PENDIENTES:");
  for (const functionName of pendingFunctions.slice(0, 3)) {
    // Solo test 3 primeras
    const result = await testCorsResponse(functionName, baseUrl);
    const status = result.success ? "✅" : "❌";
    console.log(
      `${status} ${functionName}: ${result.status} ${result.success ? "(CORS OK)" : "(Necesita actualizar)"}`
    );
  }

  console.log("\n📊 RESUMEN CORS:");
  console.log(`✅ Completadas: ${updatedFunctions.length}`);
  console.log(`🔄 En progreso: ${inProgressFunctions.length}`);
  console.log(`⏳ Pendientes: ${pendingFunctions.length}`);
  console.log(
    `📈 Progreso: ${Math.round((updatedFunctions.length / (updatedFunctions.length + inProgressFunctions.length + pendingFunctions.length)) * 100)}%`
  );
}

// Ejecutar si está siendo llamado directamente
if (typeof window === "undefined") {
  runCorsTests().catch(console.error);
}

export { runCorsTests, testCorsResponse };
