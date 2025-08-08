const fs = require("fs");
const path = require("path");

console.log(
  "🚀 Iniciando migración CORS masiva de Edge Functions restantes...\n"
);

const functionsDir = path.join(
  __dirname,
  "..",
  "AG-PYMEs",
  "supabase",
  "functions"
);

// Funciones identificadas que necesitan migración CORS
const targetFunctions = ["shifts", "sales", "orders", "leaves", "income"];

// Patrones de reemplazo para migración CORS
const replacementPatterns = [
  // 1. Eliminar declaración corsHeaders
  {
    name: "corsHeaders declaration",
    pattern: /const corsHeaders\s*=\s*\{[^}]*\};\s*/g,
    replacement: "",
  },

  // 2. Actualizar importaciones - agregar CORS imports
  {
    name: "CORS imports",
    pattern: /(import\s+\{[^}]*\}\s+from\s+"\.\.\/\_shared\/auth-utils\.ts";)/,
    replacement:
      '$1\nimport { withCors, createCorsJsonResponse, createCorsErrorResponse } from "../_shared/cors.ts";',
  },

  // 3. Reemplazar respuestas JSON exitosas
  {
    name: "JSON success responses",
    pattern:
      /return new Response\(\s*JSON\.stringify\(([^)]+)\),\s*\{\s*status:\s*(\d+),\s*headers:\s*\{\s*\.\.\.corsHeaders,\s*"Content-Type":\s*"application\/json"\s*\}\s*\}\s*\);/g,
    replacement: "return createCorsJsonResponse($1, $2);",
  },

  // 4. Reemplazar respuestas de error
  {
    name: "Error responses",
    pattern:
      /return new Response\(\s*JSON\.stringify\(\s*\{\s*error:\s*([^}]+)\s*\}\s*\),\s*\{\s*status:\s*(\d+),\s*headers:\s*\{\s*\.\.\.corsHeaders,\s*"Content-Type":\s*"application\/json"\s*\}\s*\}\s*\);/g,
    replacement: "return createCorsErrorResponse($1, $2);",
  },

  // 5. Reemplazar OPTIONS handler
  {
    name: "OPTIONS handler",
    pattern:
      /return new Response\("ok",\s*\{\s*headers:\s*corsHeaders\s*\}\);/g,
    replacement: 'return new Response("ok");',
  },

  // 6. Actualizar serve wrapper
  {
    name: "serve wrapper",
    pattern: /(serve\()(async\s*\([^)]*\)\s*=>\s*\{)/,
    replacement: "$1withCors($2",
  },

  // 7. Cerrar paréntesis del wrapper
  {
    name: "close wrapper",
    pattern: /(\}\s*)\);(\s*)$/,
    replacement: "$1}));$2",
  },
];

// Función para migrar una Edge Function
function migrateFunction(functionName) {
  const filePath = path.join(functionsDir, functionName, "index.ts");

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ No se encontró ${functionName}/index.ts`);
    return { success: false, reason: "File not found" };
  }

  console.log(`📁 Procesando ${functionName}/index.ts...`);

  try {
    let content = fs.readFileSync(filePath, "utf8");
    let totalReplacements = 0;

    // Aplicar cada patrón de reemplazo
    replacementPatterns.forEach((pattern) => {
      const matches = content.match(pattern.pattern);
      if (matches) {
        content = content.replace(pattern.pattern, pattern.replacement);
        const replacements = matches.length;
        totalReplacements += replacements;
        console.log(`  ✅ ${pattern.name}: ${replacements} reemplazos`);
      }
    });

    // Limpiar espacios en blanco y líneas vacías extra
    content = content.replace(/\n\s*\n\s*\n/g, "\n\n").replace(/[ \t]+$/gm, "");

    // Escribir archivo actualizado
    fs.writeFileSync(filePath, content);

    console.log(
      `✅ ${functionName} migrado exitosamente (${totalReplacements} cambios totales)\n`
    );

    return {
      success: true,
      replacements: totalReplacements,
      details: "Migration completed successfully",
    };
  } catch (error) {
    console.error(`❌ Error al procesar ${functionName}:`, error.message);
    return { success: false, reason: error.message };
  }
}

// Ejecutar migración en todas las funciones
console.log("🎯 Funciones objetivo:", targetFunctions.join(", "), "\n");

const results = {};
let totalSuccessful = 0;
let totalReplacements = 0;

targetFunctions.forEach((functionName) => {
  const result = migrateFunction(functionName);
  results[functionName] = result;

  if (result.success) {
    totalSuccessful++;
    totalReplacements += result.replacements || 0;
  }
});

// Mostrar resumen final
console.log("📊 RESUMEN DE MIGRACIÓN:");
console.log("========================");
console.log(
  `✅ Funciones migradas exitosamente: ${totalSuccessful}/${targetFunctions.length}`
);
console.log(`🔢 Total de reemplazos realizados: ${totalReplacements}`);
console.log("");

console.log("📋 DETALLE POR FUNCIÓN:");
targetFunctions.forEach((functionName) => {
  const result = results[functionName];
  const status = result.success ? "✅" : "❌";
  const info = result.success
    ? `(${result.replacements || 0} reemplazos)`
    : `(${result.reason})`;

  console.log(`${status} ${functionName}: ${info}`);
});

console.log("\n🎉 Migración CORS masiva completada!");

if (totalSuccessful === targetFunctions.length) {
  console.log(
    "🎯 ¡Todas las funciones migradas exitosamente al sistema CORS unificado!"
  );
} else {
  console.log(
    `⚠️ ${targetFunctions.length - totalSuccessful} funciones requieren atención manual.`
  );
}
