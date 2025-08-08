const fs = require("fs");
const path = require("path");

console.log(
  "🚀 Iniciando migración CORS masiva de Edge Functions (MODO SEGURO)...\n"
);

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
  "cors-migration-" + Date.now()
);

// Crear directorio de backup
if (!fs.existsSync(path.join(__dirname, "..", "backups"))) {
  fs.mkdirSync(path.join(__dirname, "..", "backups"), { recursive: true });
}
fs.mkdirSync(backupDir, { recursive: true });

// Funciones identificadas que necesitan migración CORS
const targetFunctions = ["shifts", "sales", "orders", "leaves", "income"];

// Validar que funciones existen y verificar que realmente necesitan migración
function validateTargetFunctions() {
  console.log("🔍 Validando funciones objetivo...\n");

  const validatedFunctions = [];

  for (const functionName of targetFunctions) {
    const filePath = path.join(functionsDir, functionName, "index.ts");

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ ${functionName}: Archivo no encontrado`);
      continue;
    }

    const content = fs.readFileSync(filePath, "utf8");

    // Verificar si ya tiene el sistema CORS nuevo
    if (
      content.includes("withCors") &&
      content.includes("createCorsJsonResponse")
    ) {
      console.log(`✅ ${functionName}: Ya migrado al sistema CORS unificado`);
      continue;
    }

    // Verificar si tiene corsHeaders (necesita migración)
    if (content.includes("corsHeaders")) {
      console.log(
        `🔄 ${functionName}: Necesita migración (corsHeaders encontrado)`
      );
      validatedFunctions.push(functionName);
      continue;
    }

    console.log(
      `❓ ${functionName}: Estado incierto - no tiene corsHeaders ni sistema nuevo`
    );
  }

  return validatedFunctions;
}

// Crear backup de una función
function createBackup(functionName) {
  const originalPath = path.join(functionsDir, functionName, "index.ts");
  const backupPath = path.join(backupDir, `${functionName}-index.ts`);

  try {
    fs.copyFileSync(originalPath, backupPath);
    console.log(`💾 Backup creado: ${functionName}`);
    return true;
  } catch (error) {
    console.error(`❌ Error creando backup de ${functionName}:`, error.message);
    return false;
  }
}

// Patrones de reemplazo mejorados y más específicos
const replacementPatterns = [
  // 1. Verificar y agregar imports CORS (solo si no existen)
  {
    name: "Add CORS imports",
    condition: (content) =>
      !content.includes("withCors") && content.includes("auth-utils.ts"),
    pattern: /(import\s+\{[^}]*\}\s+from\s+"\.\.\/\_shared\/auth-utils\.ts";)/,
    replacement:
      '$1\nimport { withCors, createCorsJsonResponse, createCorsErrorResponse } from "../_shared/cors.ts";',
  },

  // 2. Eliminar declaración corsHeaders (más específica)
  {
    name: "Remove corsHeaders declaration",
    condition: (content) => content.includes("const corsHeaders"),
    pattern:
      /const corsHeaders\s*=\s*\{[^}]*"Access-Control-Allow-Methods"[^}]*\};\s*/g,
    replacement: "",
  },

  // 3. Reemplazar respuestas JSON exitosas (más específico)
  {
    name: "Replace JSON success responses",
    condition: (content) => content.includes("...corsHeaders"),
    pattern:
      /return new Response\(\s*JSON\.stringify\(([^,)]+)\),?\s*\{\s*status:\s*(\d+),\s*headers:\s*\{\s*\.\.\.corsHeaders,\s*"Content-Type":\s*"application\/json"\s*\}\s*\}\s*\);/g,
    replacement: "return createCorsJsonResponse($1, $2);",
  },

  // 4. Reemplazar respuestas de error con corsHeaders
  {
    name: "Replace error responses with corsHeaders",
    condition: (content) => content.includes("...corsHeaders"),
    pattern:
      /return new Response\(\s*JSON\.stringify\(\s*\{\s*error:\s*([^}]+)\s*\}\s*\),\s*\{\s*status:\s*(\d+),\s*headers:\s*\{\s*\.\.\.corsHeaders,\s*"Content-Type":\s*"application\/json"\s*\}\s*\}\s*\);/g,
    replacement: "return createCorsErrorResponse($1, $2);",
  },

  // 5. Reemplazar OPTIONS handler básico
  {
    name: "Replace OPTIONS handler",
    condition: (content) => content.includes("headers: corsHeaders"),
    pattern:
      /return new Response\("ok",\s*\{\s*headers:\s*corsHeaders\s*\}\);/g,
    replacement: 'return new Response("ok");',
  },

  // 6. Envolver función principal con withCors (solo si no está ya envuelto)
  {
    name: "Wrap with withCors",
    condition: (content) =>
      !content.includes("withCors(") && content.includes("serve(async"),
    pattern: /serve\((async\s*\([^)]*\)\s*=>\s*\{)/,
    replacement: "serve(withCors($1",
  },

  // 7. Cerrar paréntesis del wrapper withCors
  {
    name: "Close withCors wrapper",
    condition: (content) =>
      content.includes("withCors(async") && !content.includes("}));"),
    pattern: /(\}\s*)\);(\s*)$/m,
    replacement: "$1}));$2",
  },
];

// Función para migrar una Edge Function de forma segura
function migrateFunction(functionName) {
  const filePath = path.join(functionsDir, functionName, "index.ts");

  console.log(`📁 Procesando ${functionName}/index.ts...`);

  try {
    // Crear backup antes de modificar
    if (!createBackup(functionName)) {
      return { success: false, reason: "Backup failed" };
    }

    let content = fs.readFileSync(filePath, "utf8");
    const originalContent = content;
    let totalReplacements = 0;
    const appliedPatterns = [];

    // Aplicar cada patrón de reemplazo con validaciones
    for (const pattern of replacementPatterns) {
      // Verificar condición antes de aplicar patrón
      if (pattern.condition && !pattern.condition(content)) {
        continue;
      }

      const beforeLength = content.length;
      const matches = content.match(pattern.pattern);

      if (matches) {
        content = content.replace(pattern.pattern, pattern.replacement);
        const afterLength = content.length;
        const replacements = matches.length;

        totalReplacements += replacements;
        appliedPatterns.push(pattern.name);
        console.log(`  ✅ ${pattern.name}: ${replacements} reemplazos`);

        // Validar que el cambio fue significativo pero no demasiado drástico
        const lengthDiff = Math.abs(afterLength - beforeLength);
        if (lengthDiff > beforeLength * 0.5) {
          console.log(`  ⚠️ Cambio muy grande detectado en ${pattern.name}`);
        }
      }
    }

    // Validaciones finales
    if (totalReplacements === 0) {
      console.log(`  ℹ️ No se realizaron cambios en ${functionName}`);
      return { success: true, replacements: 0, reason: "No changes needed" };
    }

    // Verificar que el archivo resultante es válido
    if (content.length < originalContent.length * 0.5) {
      throw new Error("El archivo resultante es sospechosamente pequeño");
    }

    if (!content.includes("serve") || !content.includes("function")) {
      throw new Error(
        "El archivo resultante no parece ser una Edge Function válida"
      );
    }

    // Limpiar espacios en blanco y líneas vacías extra
    content = content
      .replace(/\n\s*\n\s*\n/g, "\n\n")
      .replace(/[ \t]+$/gm, "")
      .trim();

    // Escribir archivo actualizado
    fs.writeFileSync(filePath, content);

    console.log(`✅ ${functionName} migrado exitosamente`);
    console.log(`  📊 ${totalReplacements} cambios totales`);
    console.log(`  🔧 Patrones aplicados: ${appliedPatterns.join(", ")}\n`);

    return {
      success: true,
      replacements: totalReplacements,
      patterns: appliedPatterns,
      details: "Migration completed successfully",
    };
  } catch (error) {
    console.error(`❌ Error al procesar ${functionName}:`, error.message);

    // Restaurar desde backup en caso de error
    try {
      const backupPath = path.join(backupDir, `${functionName}-index.ts`);
      if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, filePath);
        console.log(`🔄 ${functionName} restaurado desde backup`);
      }
    } catch (restoreError) {
      console.error(`❌ Error restaurando backup:`, restoreError.message);
    }

    return { success: false, reason: error.message };
  }
}

// EJECUCIÓN PRINCIPAL
console.log(`📁 Directorio de funciones: ${functionsDir}`);
console.log(`💾 Directorio de backup: ${backupDir}\n`);

// Validar funciones objetivo
const validatedFunctions = validateTargetFunctions();

if (validatedFunctions.length === 0) {
  console.log("🎉 No hay funciones que necesiten migración CORS.");
  process.exit(0);
}

console.log(`\n🎯 Funciones a migrar: ${validatedFunctions.join(", ")}\n`);

// Solicitar confirmación (simulada para script)
console.log("⚠️ PUNTO DE CONTROL: Se van a modificar archivos críticos.");
console.log("📋 Backups automáticos habilitados.");
console.log("🔄 Rollback automático en caso de error.\n");

// Ejecutar migración en funciones validadas
const results = {};
let totalSuccessful = 0;
let totalReplacements = 0;

for (const functionName of validatedFunctions) {
  const result = migrateFunction(functionName);
  results[functionName] = result;

  if (result.success) {
    totalSuccessful++;
    totalReplacements += result.replacements || 0;
  }
}

// Mostrar resumen final
console.log("📊 RESUMEN FINAL DE MIGRACIÓN:");
console.log("===============================");
console.log(
  `✅ Funciones migradas exitosamente: ${totalSuccessful}/${validatedFunctions.length}`
);
console.log(`🔢 Total de reemplazos realizados: ${totalReplacements}`);
console.log(`💾 Backups guardados en: ${backupDir}`);
console.log("");

console.log("📋 DETALLE POR FUNCIÓN:");
validatedFunctions.forEach((functionName) => {
  const result = results[functionName];
  const status = result.success ? "✅" : "❌";
  const info = result.success
    ? `(${result.replacements || 0} reemplazos)`
    : `(${result.reason})`;

  console.log(`${status} ${functionName}: ${info}`);

  if (result.patterns && result.patterns.length > 0) {
    console.log(`    🔧 Patrones: ${result.patterns.join(", ")}`);
  }
});

console.log("\n🎉 Migración CORS masiva completada!");

if (totalSuccessful === validatedFunctions.length) {
  console.log(
    "🎯 ¡Todas las funciones migradas exitosamente al sistema CORS unificado!"
  );
  console.log("✅ Todas las validaciones pasaron correctamente.");
} else {
  console.log(
    `⚠️ ${validatedFunctions.length - totalSuccessful} funciones requieren atención manual.`
  );
  console.log("🔄 Los archivos con errores fueron restaurados desde backup.");
}

console.log(`\n💡 Los backups están disponibles en: ${backupDir}`);
console.log("📝 Revisa los cambios antes de hacer commit al repositorio.");
