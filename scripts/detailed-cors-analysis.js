const fs = require("fs");
const path = require("path");

const functionsDir = "../AG-PYMEs/supabase/functions";

function analyzeFunction(functionName) {
  const functionPath = path.join(functionsDir, functionName, "index.ts");

  if (!fs.existsSync(functionPath)) {
    return { name: functionName, status: "NOT_FOUND" };
  }

  const content = fs.readFileSync(functionPath, "utf8");

  // Verificar si tiene servidor HTTP (serve, Deno.serve, export default function)
  const hasHttpServer =
    content.includes("serve(") ||
    content.includes("Deno.serve(") ||
    content.includes("export default async function") ||
    content.includes("export default function");

  if (!hasHttpServer) {
    return {
      name: functionName,
      status: "NO_HTTP_SERVER",
      details: "No es una función HTTP",
    };
  }

  // Análisis detallado para funciones HTTP
  const analysis = {
    name: functionName,
    hasServe: content.includes("serve("),
    hasDenoServe: content.includes("Deno.serve("),
    hasExportDefault: content.includes("export default"),
    hasWithCors: content.includes("withCors"),
    hasOldCorsImport: content.includes("../_shared/cors.ts"),
    hasNewCorsImport:
      content.includes("../auth-utils/cors-utils.ts") ||
      content.includes("cors-utils.ts"),
    hasCorsHeaders: (content.match(/corsHeaders/g) || []).length,
    hasCreateCorsResponse: content.includes("createCorsJsonResponse"),
    hasOptionsHandling: content.includes('req.method === "OPTIONS"'),
    hasLegacyResponse:
      content.includes("createSuccessResponse") ||
      content.includes("createErrorResponse"),
  };

  // Determinar el estado
  let status = "UNKNOWN";
  let issues = [];
  let recommendations = [];

  // Función con CORS completo y correcto
  if (
    analysis.hasWithCors &&
    analysis.hasNewCorsImport &&
    analysis.hasCreateCorsResponse &&
    analysis.hasCorsHeaders === 0 &&
    analysis.hasExportDefault
  ) {
    status = "FULLY_MIGRATED";
  }
  // Función con CORS pero estructura anticuada
  else if (
    analysis.hasWithCors &&
    (analysis.hasServe || analysis.hasDenoServe)
  ) {
    status = "NEEDS_STRUCTURE_UPDATE";
    issues.push("Usa serve() en lugar de export default");
    recommendations.push("Cambiar a export default withCors()");
  }
  // Función con imports incorrectos
  else if (analysis.hasWithCors && analysis.hasOldCorsImport) {
    status = "NEEDS_IMPORT_FIX";
    issues.push("Import CORS incorrecto");
    recommendations.push("Cambiar import a ../auth-utils/cors-utils.ts");
  }
  // Función con corsHeaders residuales
  else if (analysis.hasWithCors && analysis.hasCorsHeaders > 0) {
    status = "NEEDS_CLEANUP";
    issues.push(`${analysis.hasCorsHeaders} referencias corsHeaders`);
    recommendations.push("Limpiar referencias corsHeaders");
  }
  // Función HTTP sin CORS
  else if (!analysis.hasWithCors && !analysis.hasCreateCorsResponse) {
    status = "NEEDS_CORS_IMPLEMENTATION";
    issues.push("Sin sistema CORS");
    recommendations.push("Implementar sistema CORS completo");
  }
  // Función con CORS parcial
  else {
    status = "MIXED_STATE";
    if (!analysis.hasWithCors) issues.push("Sin withCors wrapper");
    if (!analysis.hasCreateCorsResponse) issues.push("Sin funciones CORS");
    if (!analysis.hasNewCorsImport) issues.push("Sin imports CORS correctos");
    if (analysis.hasCorsHeaders > 0)
      issues.push(`${analysis.hasCorsHeaders} corsHeaders restantes`);
  }

  return {
    ...analysis,
    status,
    issues,
    recommendations,
  };
}

function main() {
  console.log("🔍 ANÁLISIS DETALLADO DE FUNCIONES CORS");
  console.log("=======================================");

  // Obtener lista de funciones
  const functions = fs.readdirSync(functionsDir).filter((item) => {
    const itemPath = path.join(functionsDir, item);
    return fs.statSync(itemPath).isDirectory();
  });

  console.log(`📂 Analizando ${functions.length} funciones...\n`);

  const results = functions.map(analyzeFunction);

  // Agrupar por estado
  const byStatus = results.reduce((acc, result) => {
    if (!acc[result.status]) acc[result.status] = [];
    acc[result.status].push(result);
    return acc;
  }, {});

  // Mostrar resultados por categoría
  const statusEmojis = {
    FULLY_MIGRATED: "✅",
    NEEDS_STRUCTURE_UPDATE: "🔧",
    NEEDS_IMPORT_FIX: "📦",
    NEEDS_CLEANUP: "🧹",
    NEEDS_CORS_IMPLEMENTATION: "❌",
    MIXED_STATE: "❓",
    NO_HTTP_SERVER: "⚪",
    NOT_FOUND: "🚫",
    UNKNOWN: "❔",
  };

  Object.entries(byStatus).forEach(([status, funcs]) => {
    const emoji = statusEmojis[status] || "❔";
    console.log(`${emoji} ${status} (${funcs.length} funciones):`);
    console.log("=====================================");

    funcs.forEach((func) => {
      console.log(`📝 ${func.name}:`);
      if (func.details) {
        console.log(`   ${func.details}`);
      } else {
        if (func.issues && func.issues.length > 0) {
          console.log(`   🚨 Problemas: ${func.issues.join(", ")}`);
        }
        if (func.recommendations && func.recommendations.length > 0) {
          console.log(
            `   💡 Recomendaciones: ${func.recommendations.join(", ")}`
          );
        }

        // Mostrar detalles técnicos relevantes
        const details = [];
        if (func.hasServe) details.push("serve()");
        if (func.hasDenoServe) details.push("Deno.serve()");
        if (func.hasExportDefault) details.push("export default");
        if (func.hasOldCorsImport) details.push("import obsoleto");
        if (func.hasCorsHeaders > 0)
          details.push(`${func.hasCorsHeaders} corsHeaders`);

        if (details.length > 0) {
          console.log(`   🔍 Detalles: ${details.join(", ")}`);
        }
      }
      console.log("");
    });
  });

  // Resumen ejecutivo
  console.log("\n📊 RESUMEN EJECUTIVO:");
  console.log("====================");

  const needsWork = [
    "NEEDS_STRUCTURE_UPDATE",
    "NEEDS_IMPORT_FIX",
    "NEEDS_CLEANUP",
    "NEEDS_CORS_IMPLEMENTATION",
    "MIXED_STATE",
  ];
  const functionsNeedingWork = results.filter((r) =>
    needsWork.includes(r.status)
  );

  console.log(
    `✅ Completamente migradas: ${byStatus["FULLY_MIGRATED"]?.length || 0}`
  );
  console.log(`🔧 Necesitan trabajo: ${functionsNeedingWork.length}`);
  console.log(
    `⚪ Sin servidor HTTP: ${byStatus["NO_HTTP_SERVER"]?.length || 0}`
  );

  if (functionsNeedingWork.length > 0) {
    console.log("\n🎯 FUNCIONES QUE NECESITAN ATENCIÓN:");
    console.log("===================================");
    functionsNeedingWork.forEach((func) => {
      console.log(`${statusEmojis[func.status]} ${func.name} - ${func.status}`);
      if (func.recommendations) {
        func.recommendations.forEach((rec) => console.log(`   → ${rec}`));
      }
    });
  }

  console.log(
    `\n🎯 PROGRESO: ${byStatus["FULLY_MIGRATED"]?.length || 0}/${functions.filter((f) => byStatus[f] !== "NO_HTTP_SERVER").length} funciones HTTP migradas`
  );
}

main();
