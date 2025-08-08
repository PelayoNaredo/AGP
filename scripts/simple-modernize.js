const fs = require("fs");
const path = require("path");

const functionsDir = "../AG-PYMEs/supabase/functions";

// Funciones que necesitan conversión directa
const targetFunctions = [
  "appointments",
  "expenses",
  "income",
  "inventory",
  "leaves",
  "orders",
  "sales",
  "shifts",
  "signed-url",
];

function createBackup(filePath) {
  const backupPath = filePath + ".backup-simple-" + Date.now();
  fs.copyFileSync(filePath, backupPath);
  console.log(`📁 Backup creado: ${path.basename(backupPath)}`);
  return backupPath;
}

function simpleModernize(content) {
  let changes = 0;
  let result = content;

  // 1. Corregir import CORS si usa _shared
  if (result.includes("../_shared/cors.ts")) {
    result = result.replace(
      "../_shared/cors.ts",
      "../auth-utils/cors-utils.ts"
    );
    changes++;
    console.log("   ✅ Import CORS corregido");
  }

  // 2. Eliminar import de serve
  const serveImportRegex =
    /import\s*\{\s*serve\s*\}\s*from\s*["'][^"']+["'];\s*\n?/;
  if (serveImportRegex.test(result)) {
    result = result.replace(serveImportRegex, "");
    changes++;
    console.log("   ✅ Import de serve eliminado");
  }

  // 3. Eliminar declaración de corsHeaders manual
  const corsHeadersRegex =
    /const\s*\{\s*"Content-Type":\s*"application\/json"\s*\}\s*=\s*\{[^}]*\};\s*\n?/;
  if (corsHeadersRegex.test(result)) {
    result = result.replace(corsHeadersRegex, "");
    changes++;
    console.log("   ✅ Declaración corsHeaders manual eliminada");
  }

  // 4. Reemplazar serve(withCors(...)) por export default withCors(...)
  if (result.includes("serve(withCors(async (req)")) {
    result = result.replace(
      "serve(withCors(async (req) => {",
      "export default withCors(async (req: Request) => {"
    );

    // Buscar el cierre correspondiente y reemplazarlo
    // Buscar desde el final hacia atrás
    const lastClosing = result.lastIndexOf("}));");
    if (lastClosing !== -1) {
      result = result.substring(0, lastClosing) + "});";
    }

    changes++;
    console.log("   ✅ serve(withCors(...)) → export default withCors(...)");
  }

  return { content: result, changes };
}

function processFunction(functionName) {
  const functionPath = path.join(functionsDir, functionName, "index.ts");

  if (!fs.existsSync(functionPath)) {
    console.log(`❌ ${functionName}: Archivo no encontrado`);
    return false;
  }

  console.log(`\n🔧 Procesando: ${functionName}`);

  // Crear backup
  const backupPath = createBackup(functionPath);

  try {
    // Leer contenido
    const originalContent = fs.readFileSync(functionPath, "utf8");

    // Verificar si ya está modernizada
    if (
      originalContent.includes("export default withCors") &&
      !originalContent.includes("serve(")
    ) {
      console.log("   ✅ Ya está modernizada");
      fs.unlinkSync(backupPath);
      return true;
    }

    // Modernizar
    const { content: modernizedContent, changes } =
      simpleModernize(originalContent);

    if (changes === 0) {
      console.log("   ⚠️ No se realizaron cambios");
      fs.unlinkSync(backupPath);
      return true;
    }

    // Validaciones básicas
    if (modernizedContent.length < originalContent.length * 0.5) {
      throw new Error("Archivo demasiado pequeño después de los cambios");
    }

    // Escribir archivo
    fs.writeFileSync(functionPath, modernizedContent);

    console.log(`   ✅ Modernización completada (${changes} cambios)`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);

    // Restaurar backup
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, functionPath);
      console.log("   🔄 Backup restaurado");
    }

    return false;
  }
}

function main() {
  console.log("🎯 MODERNIZACIÓN SIMPLE Y DIRECTA");
  console.log("==================================");
  console.log(`📂 Directorio: ${functionsDir}`);
  console.log(`🎯 Funciones: ${targetFunctions.join(", ")}`);

  let successCount = 0;
  let errorCount = 0;

  for (const functionName of targetFunctions) {
    const success = processFunction(functionName);
    if (success) {
      successCount++;
    } else {
      errorCount++;
    }
  }

  console.log("\n📊 RESUMEN:");
  console.log("============");
  console.log(`✅ Éxitos: ${successCount}/${targetFunctions.length}`);
  console.log(`❌ Errores: ${errorCount}`);

  if (successCount === targetFunctions.length) {
    console.log("\n🎉 ¡TODAS LAS FUNCIONES MODERNIZADAS!");
  } else {
    console.log("\n⚠️ Revisar funciones con errores");
  }
}

main();
