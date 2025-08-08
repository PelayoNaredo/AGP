const fs = require("fs");
const path = require("path");

console.log("🔧 COMPLETAR MIGRACIONES PARCIALES: Limpieza de corsHeaders\n");

const functionsDir = path.join(
  __dirname,
  "..",
  "AG-PYMEs",
  "supabase",
  "functions"
);
const backupDir = path.join(
  __dirname,
  "..",
  "backups",
  "complete-partial-" + Date.now()
);

// Crear directorio de backup
if (!fs.existsSync(path.join(__dirname, "..", "backups"))) {
  fs.mkdirSync(path.join(__dirname, "..", "backups"), { recursive: true });
}
fs.mkdirSync(backupDir, { recursive: true });

// Funciones parcialmente migradas identificadas
const partiallyMigratedFunctions = [
  "appointments",
  "income",
  "leaves",
  "orders",
  "sales",
  "shifts",
];

// Crear backup de una función
function createBackup(functionName) {
  const originalPath = path.join(functionsDir, functionName, "index.ts");
  const backupPath = path.join(backupDir, `${functionName}-index.ts`);

  try {
    fs.copyFileSync(originalPath, backupPath);
    console.log(`💾 Backup: ${functionName}`);
    return true;
  } catch (error) {
    console.error(`❌ Error backup ${functionName}:`, error.message);
    return false;
  }
}

// Patrones específicos para completar migraciones parciales
const cleanupPatterns = [
  // 1. Agregar imports CORS si faltan
  {
    name: "Add missing CORS imports",
    pattern: /(import\s+\{[^}]*\}\s+from\s+"\.\.\/\_shared\/auth-utils\.ts";)/,
    replacement:
      '$1\nimport { withCors, createCorsJsonResponse, createCorsErrorResponse } from "../_shared/cors.ts";',
    condition: (content) =>
      content.includes("auth-utils.ts") &&
      !content.includes('from "../_shared/cors.ts"'),
  },

  // 2. Eliminar declaración corsHeaders completa
  {
    name: "Remove corsHeaders declaration",
    pattern:
      /const corsHeaders\s*=\s*\{\s*"Access-Control-Allow-Origin":\s*"\*",\s*"Access-Control-Allow-Headers":\s*"[^"]*",\s*"Access-Control-Allow-Methods":\s*"[^"]*"\s*\};\s*/g,
    replacement: "",
    condition: (content) => content.includes("const corsHeaders"),
  },

  // 3. Reemplazar respuestas JSON con corsHeaders por createCorsJsonResponse
  {
    name: "Replace JSON responses with corsHeaders",
    pattern:
      /return new Response\(\s*JSON\.stringify\(([^,)]+)\),?\s*\{\s*status:\s*(\d+),\s*headers:\s*\{\s*\.\.\.corsHeaders,\s*"Content-Type":\s*"application\/json"\s*\}\s*\}\s*\);/g,
    replacement: "return createCorsJsonResponse($1, $2);",
    condition: (content) => content.includes("...corsHeaders"),
  },

  // 4. Reemplazar respuestas de error con corsHeaders
  {
    name: "Replace error responses with corsHeaders",
    pattern:
      /return new Response\(\s*JSON\.stringify\(\s*\{\s*error:\s*([^}]+)\s*\}\s*\),\s*\{\s*status:\s*(\d+),\s*headers:\s*\{\s*\.\.\.corsHeaders,\s*"Content-Type":\s*"application\/json"\s*\}\s*\}\s*\);/g,
    replacement: "return createCorsErrorResponse($1, $2);",
    condition: (content) => content.includes("...corsHeaders"),
  },

  // 5. Reemplazar OPTIONS handler con corsHeaders
  {
    name: "Replace OPTIONS handler",
    pattern:
      /return new Response\("ok",\s*\{\s*headers:\s*corsHeaders\s*\}\);/g,
    replacement: 'return new Response("ok");',
    condition: (content) => content.includes("headers: corsHeaders"),
  },

  // 6. Limpiar referencias restantes a corsHeaders en headers
  {
    name: "Clean remaining corsHeaders in headers",
    pattern: /headers:\s*\{\s*\.\.\.corsHeaders\s*\}/g,
    replacement: 'headers: { "Content-Type": "application/json" }',
    condition: (content) => content.includes("...corsHeaders"),
  },
];

// Función para completar migración parcial
function completeMigration(functionName) {
  const filePath = path.join(functionsDir, functionName, "index.ts");

  console.log(`🔧 Completando migración: ${functionName}`);

  try {
    // Crear backup
    if (!createBackup(functionName)) {
      throw new Error("Backup failed");
    }

    let content = fs.readFileSync(filePath, "utf8");
    const originalContent = content;
    let totalChanges = 0;
    const appliedPatterns = [];

    // Verificar estado inicial
    const initialCorsHeaders = (content.match(/corsHeaders/g) || []).length;
    console.log(`  📊 corsHeaders iniciales: ${initialCorsHeaders}`);

    if (initialCorsHeaders === 0) {
      console.log(`  ✅ ${functionName} ya está limpio`);
      return { success: true, changes: 0, reason: "Already clean" };
    }

    // Aplicar patrones de limpieza
    for (const pattern of cleanupPatterns) {
      if (pattern.condition && !pattern.condition(content)) {
        continue;
      }

      const matches = content.match(pattern.pattern);
      if (matches) {
        content = content.replace(pattern.pattern, pattern.replacement);
        const changes = matches.length;
        totalChanges += changes;
        appliedPatterns.push(pattern.name);
        console.log(`    ✅ ${pattern.name}: ${changes} cambios`);
      }
    }

    // Verificar resultado
    const finalCorsHeaders = (content.match(/corsHeaders/g) || []).length;
    console.log(`  📊 corsHeaders finales: ${finalCorsHeaders}`);

    // Validaciones de seguridad
    if (content.length < originalContent.length * 0.8) {
      throw new Error("Archivo resultante sospechosamente pequeño");
    }

    if (!content.includes("serve") || !content.includes("withCors")) {
      throw new Error("Estructura crítica perdida");
    }

    // Limpiar formato
    content = content.replace(/\n\s*\n\s*\n/g, "\n\n").replace(/[ \t]+$/gm, "");

    // Escribir archivo
    fs.writeFileSync(filePath, content);

    const improvement = initialCorsHeaders - finalCorsHeaders;
    console.log(
      `  ✅ Migración completada: ${improvement} corsHeaders eliminados\n`
    );

    return {
      success: true,
      changes: totalChanges,
      patterns: appliedPatterns,
      corsHeadersRemoved: improvement,
      details: `${totalChanges} cambios, ${improvement} corsHeaders eliminados`,
    };
  } catch (error) {
    console.error(`  ❌ Error en ${functionName}:`, error.message);

    // Restaurar backup
    try {
      const backupPath = path.join(backupDir, `${functionName}-index.ts`);
      fs.copyFileSync(backupPath, filePath);
      console.log(`  🔄 ${functionName} restaurado desde backup`);
    } catch (restoreError) {
      console.error(`  ❌ Error restaurando:`, restoreError.message);
    }

    return { success: false, reason: error.message };
  }
}

// EJECUCIÓN PRINCIPAL
console.log(`📁 Directorio: ${functionsDir}`);
console.log(`💾 Backup: ${backupDir}`);
console.log(
  `🎯 Funciones a completar: ${partiallyMigratedFunctions.join(", ")}\n`
);

const results = {};
let totalSuccessful = 0;
let totalChanges = 0;
let totalCorsHeadersRemoved = 0;

// Procesar cada función
for (const functionName of partiallyMigratedFunctions) {
  const result = completeMigration(functionName);
  results[functionName] = result;

  if (result.success) {
    totalSuccessful++;
    totalChanges += result.changes || 0;
    totalCorsHeadersRemoved += result.corsHeadersRemoved || 0;
  }
}

// Resumen final
console.log("📊 RESUMEN FINAL:");
console.log("=".repeat(50));
console.log(
  `✅ Funciones completadas: ${totalSuccessful}/${partiallyMigratedFunctions.length}`
);
console.log(`🔢 Total de cambios: ${totalChanges}`);
console.log(`🧹 corsHeaders eliminados: ${totalCorsHeadersRemoved}`);
console.log(`💾 Backups en: ${backupDir}`);
console.log("");

console.log("📋 DETALLE POR FUNCIÓN:");
partiallyMigratedFunctions.forEach((functionName) => {
  const result = results[functionName];
  const status = result.success ? "✅" : "❌";
  const info = result.success
    ? `(${result.details || "Completado"})`
    : `(${result.reason})`;

  console.log(`${status} ${functionName}: ${info}`);
});

if (totalSuccessful === partiallyMigratedFunctions.length) {
  console.log("\n🎉 ¡TODAS LAS MIGRACIONES PARCIALES COMPLETADAS!");
  console.log("✅ Sistema CORS unificado implementado completamente");
} else {
  console.log(
    `\n⚠️ ${partiallyMigratedFunctions.length - totalSuccessful} funciones requieren atención manual`
  );
}

console.log(
  '\n💡 Próximo paso: Migrar "order-detail" (migración completa necesaria)'
);
