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

// Función para completar migración parcial
function completeMigration(functionName) {
  const filePath = path.join(functionsDir, functionName, "index.ts");

  console.log(`🔧 Completando migración: ${functionName}`);

  try {
    if (!createBackup(functionName)) {
      throw new Error("Backup failed");
    }

    let content = fs.readFileSync(filePath, "utf8");
    const originalContent = content;
    let totalChanges = 0;

    // Verificar estado inicial
    const initialCorsHeaders = (content.match(/corsHeaders/g) || []).length;
    console.log(`  📊 corsHeaders iniciales: ${initialCorsHeaders}`);

    if (initialCorsHeaders === 0) {
      console.log(`  ✅ ${functionName} ya está limpio`);
      return { success: true, changes: 0, reason: "Already clean" };
    }

    // 1. Agregar imports CORS si faltan
    if (
      content.includes("auth-utils.ts") &&
      !content.includes('from "../_shared/cors.ts"')
    ) {
      content = content.replace(
        /(import\s+\{[^}]*\}\s+from\s+"\.\.\/\_shared\/auth-utils\.ts";)/,
        '$1\nimport { withCors, createCorsJsonResponse, createCorsErrorResponse } from "../_shared/cors.ts";'
      );
      console.log(`    ✅ Agregados imports CORS`);
      totalChanges++;
    }

    // 2. Eliminar declaración corsHeaders
    if (content.includes("const corsHeaders")) {
      content = content.replace(
        /const corsHeaders\s*=\s*\{[\s\S]*?"Access-Control-Allow-Methods":\s*"[^"]*"\s*\};\s*/g,
        ""
      );
      console.log(`    ✅ Eliminada declaración corsHeaders`);
      totalChanges++;
    }

    // 3. Reemplazar respuestas JSON con corsHeaders
    if (content.includes("...corsHeaders")) {
      const jsonResponses = content.match(
        /return new Response\(\s*JSON\.stringify\(([^,)]+)\),?\s*\{\s*status:\s*(\d+),\s*headers:\s*\{\s*\.\.\.corsHeaders,\s*"Content-Type":\s*"application\/json"\s*\}\s*\}\s*\);/g
      );
      if (jsonResponses) {
        content = content.replace(
          /return new Response\(\s*JSON\.stringify\(([^,)]+)\),?\s*\{\s*status:\s*(\d+),\s*headers:\s*\{\s*\.\.\.corsHeaders,\s*"Content-Type":\s*"application\/json"\s*\}\s*\}\s*\);/g,
          "return createCorsJsonResponse($1, $2);"
        );
        console.log(
          `    ✅ Reemplazadas ${jsonResponses.length} respuestas JSON`
        );
        totalChanges += jsonResponses.length;
      }
    }

    // 4. Reemplazar respuestas de error con corsHeaders
    const errorResponses = content.match(
      /return new Response\(\s*JSON\.stringify\(\s*\{\s*error:\s*([^}]+)\s*\}\s*\),\s*\{\s*status:\s*(\d+),\s*headers:\s*\{\s*\.\.\.corsHeaders,\s*"Content-Type":\s*"application\/json"\s*\}\s*\}\s*\);/g
    );
    if (errorResponses) {
      content = content.replace(
        /return new Response\(\s*JSON\.stringify\(\s*\{\s*error:\s*([^}]+)\s*\}\s*\),\s*\{\s*status:\s*(\d+),\s*headers:\s*\{\s*\.\.\.corsHeaders,\s*"Content-Type":\s*"application\/json"\s*\}\s*\}\s*\);/g,
        "return createCorsErrorResponse($1, $2);"
      );
      console.log(
        `    ✅ Reemplazadas ${errorResponses.length} respuestas de error`
      );
      totalChanges += errorResponses.length;
    }

    // 5. Reemplazar OPTIONS handler
    if (content.includes("headers: corsHeaders")) {
      content = content.replace(
        /return new Response\("ok",\s*\{\s*headers:\s*corsHeaders\s*\}\);/g,
        'return new Response("ok");'
      );
      console.log(`    ✅ Reemplazado OPTIONS handler`);
      totalChanges++;
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
      corsHeadersRemoved: improvement,
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
    ? `(${result.changes} cambios, ${result.corsHeadersRemoved} corsHeaders eliminados)`
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
