const fs = require("fs");
const path = require("path");

console.log("🧪 PRUEBA SEGURA: Migrando solo la función SHIFTS...\n");

const functionsDir = path.join(
  __dirname,
  "..",
  "AG-PYMEs",
  "supabase",
  "functions"
);
const testBackupDir = path.join(
  __dirname,
  "..",
  "backups",
  "test-shifts-" + Date.now()
);

// Crear directorio de backup
if (!fs.existsSync(path.join(__dirname, "..", "backups"))) {
  fs.mkdirSync(path.join(__dirname, "..", "backups"), { recursive: true });
}
fs.mkdirSync(testBackupDir, { recursive: true });

// Solo probar con shifts
const testFunction = "shifts";

// Crear backup
function createBackup(functionName) {
  const originalPath = path.join(functionsDir, functionName, "index.ts");
  const backupPath = path.join(testBackupDir, `${functionName}-index.ts`);

  try {
    fs.copyFileSync(originalPath, backupPath);
    console.log(`💾 Backup creado: ${functionName}`);
    return true;
  } catch (error) {
    console.error(`❌ Error creando backup de ${functionName}:`, error.message);
    return false;
  }
}

// Validar archivo antes de la migración
function validateBeforeMigration() {
  const filePath = path.join(functionsDir, testFunction, "index.ts");

  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${testFunction}: Archivo no encontrado`);
    return false;
  }

  const content = fs.readFileSync(filePath, "utf8");

  console.log("📋 ESTADO ANTES DE LA MIGRACIÓN:");
  console.log(`✓ Archivo existe: ${filePath}`);
  console.log(`✓ Tamaño: ${content.length} caracteres`);
  console.log(`✓ Tiene corsHeaders: ${content.includes("corsHeaders")}`);
  console.log(`✓ Tiene withCors: ${content.includes("withCors")}`);
  console.log(`✓ Tiene auth-utils: ${content.includes("auth-utils")}`);
  console.log(
    `✓ Referencias corsHeaders: ${(content.match(/corsHeaders/g) || []).length}`
  );
  console.log("");

  if (content.includes("withCors")) {
    console.log("⚠️ El archivo ya parece estar migrado.");
    return false;
  }

  if (!content.includes("corsHeaders")) {
    console.log("⚠️ El archivo no tiene corsHeaders para migrar.");
    return false;
  }

  return true;
}

// Patrones de migración (versión de prueba más conservadora)
const migrationPatterns = [
  // 1. Agregar imports CORS
  {
    name: "Add CORS imports",
    pattern: /(import\s+\{[^}]*\}\s+from\s+"\.\.\/\_shared\/auth-utils\.ts";)/,
    replacement:
      '$1\nimport { withCors, createCorsJsonResponse, createCorsErrorResponse } from "../_shared/cors.ts";',
    test: (content) =>
      content.includes("auth-utils.ts") && !content.includes("withCors"),
  },

  // 2. Eliminar declaración corsHeaders
  {
    name: "Remove corsHeaders declaration",
    pattern:
      /const corsHeaders\s*=\s*\{\s*"Access-Control-Allow-Origin"[^}]*\};\s*/g,
    replacement: "",
    test: (content) => content.includes("const corsHeaders"),
  },

  // 3. Reemplazar respuestas exitosas más conservador
  {
    name: "Replace success responses",
    pattern:
      /return new Response\(\s*JSON\.stringify\(([^,)]+)\),\s*\{\s*status:\s*(\d+),\s*headers:\s*\{\s*\.\.\.corsHeaders,\s*"Content-Type":\s*"application\/json"\s*\}\s*\}\s*\);/g,
    replacement: "return createCorsJsonResponse($1, $2);",
    test: (content) => content.includes("...corsHeaders"),
  },

  // 4. Reemplazar OPTIONS handler
  {
    name: "Replace OPTIONS handler",
    pattern:
      /return new Response\("ok",\s*\{\s*headers:\s*corsHeaders\s*\}\);/g,
    replacement: 'return new Response("ok");',
    test: (content) => content.includes("headers: corsHeaders"),
  },

  // 5. Envolver con withCors (más específico)
  {
    name: "Wrap with withCors",
    pattern: /serve\((async\s*\([^)]*\)\s*=>\s*\{)/,
    replacement: "serve(withCors($1",
    test: (content) =>
      content.includes("serve(async") && !content.includes("withCors("),
  },
];

// Función de migración de prueba
function testMigration() {
  const filePath = path.join(functionsDir, testFunction, "index.ts");

  console.log(`🔧 Iniciando migración de prueba: ${testFunction}`);

  try {
    // Crear backup
    if (!createBackup(testFunction)) {
      throw new Error("No se pudo crear backup");
    }

    let content = fs.readFileSync(filePath, "utf8");
    const originalContent = content;
    let changesLog = [];

    // Aplicar patrones uno por uno con validación
    for (const pattern of migrationPatterns) {
      if (!pattern.test(content)) {
        console.log(`⏭️ Saltando ${pattern.name} (condición no cumplida)`);
        continue;
      }

      const beforeContent = content;
      const matches = content.match(pattern.pattern);

      if (matches) {
        content = content.replace(pattern.pattern, pattern.replacement);
        const changes = matches.length;
        changesLog.push(`${pattern.name}: ${changes} cambios`);
        console.log(`✅ ${pattern.name}: ${changes} reemplazos`);

        // Validar que el cambio tiene sentido
        if (content === beforeContent) {
          console.log(`⚠️ ${pattern.name}: No se detectaron cambios reales`);
        }
      } else {
        console.log(`ℹ️ ${pattern.name}: Patrón no encontrado`);
      }
    }

    // Agregar cierre de paréntesis para withCors si es necesario
    if (content.includes("withCors(async") && !content.includes("}));")) {
      content = content.replace(/(\}\s*);(\s*)$/, "$1}));$2");
      changesLog.push("Close withCors wrapper: 1 cambio");
      console.log("✅ Close withCors wrapper: 1 reemplazo");
    }

    // Validaciones finales
    console.log("\n📋 VALIDACIONES FINALES:");
    console.log(`✓ Tamaño original: ${originalContent.length} caracteres`);
    console.log(`✓ Tamaño final: ${content.length} caracteres`);
    console.log(
      `✓ Diferencia: ${content.length - originalContent.length} caracteres`
    );
    console.log(`✓ Tiene serve: ${content.includes("serve")}`);
    console.log(`✓ Tiene withCors: ${content.includes("withCors")}`);
    console.log(
      `✓ Tiene createCorsJsonResponse: ${content.includes("createCorsJsonResponse")}`
    );
    console.log(
      `✓ corsHeaders restantes: ${(content.match(/corsHeaders/g) || []).length}`
    );

    // Validar que no perdimos funcionalidad crítica
    if (!content.includes("serve") || !content.includes("async")) {
      throw new Error("Se perdió funcionalidad crítica de Edge Function");
    }

    if (content.length < originalContent.length * 0.7) {
      throw new Error("El archivo resultante es demasiado pequeño");
    }

    // Limpiar formato
    content = content.replace(/\n\s*\n\s*\n/g, "\n\n").replace(/[ \t]+$/gm, "");

    // Escribir archivo
    fs.writeFileSync(filePath, content);

    console.log("\n✅ MIGRACIÓN DE PRUEBA EXITOSA!");
    console.log("📋 Cambios realizados:");
    changesLog.forEach((change) => console.log(`  - ${change}`));

    return { success: true, changes: changesLog };
  } catch (error) {
    console.error(`\n❌ ERROR EN MIGRACIÓN:`, error.message);

    // Restaurar backup
    try {
      const backupPath = path.join(testBackupDir, `${testFunction}-index.ts`);
      fs.copyFileSync(backupPath, filePath);
      console.log("🔄 Archivo restaurado desde backup");
    } catch (restoreError) {
      console.error("❌ Error restaurando backup:", restoreError.message);
    }

    return { success: false, error: error.message };
  }
}

// EJECUTAR PRUEBA
console.log(`📁 Directorio: ${functionsDir}`);
console.log(`💾 Backup: ${testBackupDir}\n`);

if (!validateBeforeMigration()) {
  console.log("❌ Validación falló. No se ejecutará la migración.");
  process.exit(1);
}

const result = testMigration();

if (result.success) {
  console.log(
    "\n🎉 ¡PRUEBA EXITOSA! El script está listo para usar en todas las funciones."
  );
  console.log(`💾 Backup disponible en: ${testBackupDir}`);
} else {
  console.log("\n❌ PRUEBA FALLÓ. Revisa el script antes de continuar.");
}
