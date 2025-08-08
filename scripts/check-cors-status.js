#!/usr/bin/env node

/**
 * Script para verificar el estado actual de la migración CORS
 */

const fs = require("fs");
const path = require("path");

// Todas las funciones Edge
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

function checkFunction(functionName) {
  const filePath = path.join(
    __dirname,
    "..",
    "AG-PYMEs",
    "supabase",
    "functions",
    functionName,
    "index.ts"
  );

  if (!fs.existsSync(filePath)) {
    return { status: "missing", details: "Archivo no encontrado" };
  }

  const content = fs.readFileSync(filePath, "utf8");

  // Verificar si es una función vacía
  if (content.trim().length === 0) {
    return { status: "empty", details: "Archivo vacío" };
  }

  // Verificar importaciones CORS
  const hasNewCorsImport = content.includes(
    "import { withCors, createCorsJsonResponse, createCorsErrorResponse }"
  );
  const hasOldCorsHeaders = content.includes("const corsHeaders = {");
  const hasWithCorsServe = content.includes("serve(withCors(async (req) => {");
  const hasCorsHeadersUsage =
    content.includes("...corsHeaders") ||
    content.includes("headers: corsHeaders");

  if (
    hasNewCorsImport &&
    hasWithCorsServe &&
    !hasOldCorsHeaders &&
    !hasCorsHeadersUsage
  ) {
    return { status: "completed", details: "Totalmente migrada" };
  } else if (hasNewCorsImport && hasWithCorsServe) {
    return {
      status: "partial",
      details: "Migrada parcialmente - quedan referencias corsHeaders",
    };
  } else if (hasOldCorsHeaders) {
    return { status: "pending", details: "Usa patrón antiguo corsHeaders" };
  } else {
    return { status: "unknown", details: "Patrón no reconocido" };
  }
}

function main() {
  console.log("📊 Estado de migración CORS en Edge Functions\n");

  const results = {
    completed: [],
    partial: [],
    pending: [],
    missing: [],
    empty: [],
    unknown: [],
  };

  allFunctions.forEach((functionName) => {
    const result = checkFunction(functionName);
    results[result.status].push({
      name: functionName,
      details: result.details,
    });
  });

  // Mostrar resultados
  console.log("✅ COMPLETADAS (100% migradas):");
  results.completed.forEach((f) => console.log(`   ${f.name}`));

  console.log("\n🔄 PARCIALES (migradas pero con corsHeaders restantes):");
  results.partial.forEach((f) => console.log(`   ${f.name} - ${f.details}`));

  console.log("\n⏳ PENDIENTES (patrón antiguo):");
  results.pending.forEach((f) => console.log(`   ${f.name} - ${f.details}`));

  console.log("\n⚠️ VACÍAS O FALTANTES:");
  [...results.empty, ...results.missing].forEach((f) =>
    console.log(`   ${f.name} - ${f.details}`)
  );

  console.log("\n❓ ESTADO DESCONOCIDO:");
  results.unknown.forEach((f) => console.log(`   ${f.name} - ${f.details}`));

  // Resumen
  const total = allFunctions.length;
  const completed = results.completed.length;
  const partial = results.partial.length;
  const effective = completed + partial;

  console.log("\n📈 RESUMEN:");
  console.log(`Total de funciones: ${total}`);
  console.log(
    `Completamente migradas: ${completed} (${Math.round((completed / total) * 100)}%)`
  );
  console.log(
    `Parcialmente migradas: ${partial} (${Math.round((partial / total) * 100)}%)`
  );
  console.log(
    `Efectivamente migradas: ${effective} (${Math.round((effective / total) * 100)}%)`
  );
  console.log(
    `Pendientes: ${total - effective} (${Math.round(((total - effective) / total) * 100)}%)`
  );
}

main();
