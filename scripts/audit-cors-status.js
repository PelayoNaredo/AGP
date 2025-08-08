const fs = require("fs");
const path = require("path");

console.log(
  "🔍 AUDITORIA COMPLETA: Estado de migración CORS en Edge Functions\n"
);

const functionsDir = path.join(
  __dirname,
  "..",
  "AG-PYMEs",
  "supabase",
  "functions"
);

// Todas las funciones a verificar
const allFunctions = [
  "alerts",
  "appointments",
  "clients",
  "companies",
  "dashboard",
  "employees",
  "expenses",
  "income",
  "inventory",
  "leaves",
  "login",
  "order-detail",
  "orders",
  "register",
  "sales",
  "services",
  "settings",
  "shifts",
  "signed-url",
  "suppliers",
  "user-sync",
  "users",
];

function analyzeFunction(functionName) {
  const filePath = path.join(functionsDir, functionName, "index.ts");

  if (!fs.existsSync(filePath)) {
    return { status: "NOT_FOUND", details: "Archivo no existe" };
  }

  const content = fs.readFileSync(filePath, "utf8");

  // Verificar indicadores de migración
  const hasWithCors = content.includes("withCors");
  const hasCreateCorsJsonResponse = content.includes("createCorsJsonResponse");
  const hasCorsHeaders = content.includes("corsHeaders");
  const corsHeadersCount = (content.match(/corsHeaders/g) || []).length;
  const hasAuthUtils = content.includes("auth-utils");
  const hasCorsImport = content.includes('from "../_shared/cors.ts"');

  // Determinar estado
  let status = "UNKNOWN";
  let needsMigration = false;
  let details = "";

  if (
    hasWithCors &&
    hasCreateCorsJsonResponse &&
    hasCorsImport &&
    !hasCorsHeaders
  ) {
    status = "FULLY_MIGRATED";
    details = "Completamente migrado al sistema CORS unificado";
  } else if (hasWithCors && hasCreateCorsJsonResponse && hasCorsHeaders) {
    status = "PARTIALLY_MIGRATED";
    details = `Migración parcial - ${corsHeadersCount} referencias corsHeaders restantes`;
    needsMigration = true;
  } else if (hasCorsHeaders && !hasWithCors) {
    status = "NEEDS_MIGRATION";
    details = `Sistema CORS antiguo - ${corsHeadersCount} referencias corsHeaders`;
    needsMigration = true;
  } else if (!hasCorsHeaders && !hasWithCors) {
    status = "NO_CORS";
    details = "Sin sistema CORS detectado";
  } else {
    status = "MIXED_STATE";
    details = "Estado mixto - requiere revisión manual";
  }

  return {
    status,
    needsMigration,
    details,
    indicators: {
      hasWithCors,
      hasCreateCorsJsonResponse,
      hasCorsHeaders,
      corsHeadersCount,
      hasAuthUtils,
      hasCorsImport,
      fileSize: content.length,
    },
  };
}

// Analizar todas las funciones
console.log("📊 ESTADO DE MIGRACIÓN CORS POR FUNCIÓN:");
console.log("=".repeat(80));

const results = {};
const categories = {
  FULLY_MIGRATED: [],
  PARTIALLY_MIGRATED: [],
  NEEDS_MIGRATION: [],
  NO_CORS: [],
  NOT_FOUND: [],
  MIXED_STATE: [],
};

allFunctions.forEach((functionName) => {
  const analysis = analyzeFunction(functionName);
  results[functionName] = analysis;
  categories[analysis.status].push(functionName);

  const statusIcon = {
    FULLY_MIGRATED: "✅",
    PARTIALLY_MIGRATED: "🔄",
    NEEDS_MIGRATION: "❌",
    NO_CORS: "⚪",
    NOT_FOUND: "🚫",
    MIXED_STATE: "❓",
  }[analysis.status];

  console.log(
    `${statusIcon} ${functionName.padEnd(15)} | ${analysis.status.padEnd(18)} | ${analysis.details}`
  );
});

// Resumen por categoría
console.log("\n📈 RESUMEN POR CATEGORÍA:");
console.log("=".repeat(50));

Object.entries(categories).forEach(([category, functions]) => {
  if (functions.length > 0) {
    console.log(`${category}: ${functions.length} funciones`);
    console.log(`  - ${functions.join(", ")}`);
  }
});

// Identificar funciones que necesitan migración
const functionsNeedingMigration = [
  ...categories.PARTIALLY_MIGRATED,
  ...categories.NEEDS_MIGRATION,
];

console.log("\n🎯 FUNCIONES QUE NECESITAN MIGRACIÓN:");
console.log("=".repeat(40));

if (functionsNeedingMigration.length === 0) {
  console.log(
    "🎉 ¡Todas las funciones están migradas o no necesitan migración!"
  );
} else {
  console.log(
    `📋 ${functionsNeedingMigration.length} funciones requieren atención:\n`
  );

  functionsNeedingMigration.forEach((functionName) => {
    const analysis = results[functionName];
    console.log(`🔧 ${functionName}:`);
    console.log(`   Estado: ${analysis.status}`);
    console.log(`   Detalle: ${analysis.details}`);
    console.log(`   corsHeaders: ${analysis.indicators.corsHeadersCount}`);
    console.log(`   withCors: ${analysis.indicators.hasWithCors}`);
    console.log(`   CORS imports: ${analysis.indicators.hasCorsImport}`);
    console.log("");
  });

  console.log("💡 RECOMENDACIÓN:");
  console.log(
    "   - Funciones PARTIALLY_MIGRATED: Completar migración limpiando corsHeaders"
  );
  console.log("   - Funciones NEEDS_MIGRATION: Migración completa necesaria");
}

console.log("\n📊 ESTADÍSTICAS FINALES:");
console.log(
  `   ✅ Completamente migradas: ${categories.FULLY_MIGRATED.length}`
);
console.log(
  `   🔄 Parcialmente migradas: ${categories.PARTIALLY_MIGRATED.length}`
);
console.log(`   ❌ Necesitan migración: ${categories.NEEDS_MIGRATION.length}`);
console.log(`   ⚪ Sin CORS: ${categories.NO_CORS.length}`);
console.log(`   🚫 No encontradas: ${categories.NOT_FOUND.length}`);
console.log(`   ❓ Estado mixto: ${categories.MIXED_STATE.length}`);

const totalManaged =
  categories.FULLY_MIGRATED.length +
  categories.PARTIALLY_MIGRATED.length +
  categories.NEEDS_MIGRATION.length;
const totalFound = allFunctions.length - categories.NOT_FOUND.length;
const migrationProgress =
  totalManaged > 0
    ? Math.round((categories.FULLY_MIGRATED.length / totalManaged) * 100)
    : 0;

console.log(
  `\n🎯 PROGRESO DE MIGRACIÓN: ${migrationProgress}% (${categories.FULLY_MIGRATED.length}/${totalManaged} funciones)`
);
