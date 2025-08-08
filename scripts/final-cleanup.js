const fs = require("fs");
const path = require("path");

const functionsDir = "../AG-PYMEs/supabase/functions";

// Funciones que podrían tener múltiples serve()
const problematicFunctions = [
  "alerts",
  "companies",
  "settings",
  "suppliers",
  "user-sync",
  "users",
];

function createBackup(filePath) {
  const backupPath = filePath + ".backup-final-clean-" + Date.now();
  fs.copyFileSync(filePath, backupPath);
  console.log(`📁 Backup creado: ${path.basename(backupPath)}`);
  return backupPath;
}

function finalCleanup(content) {
  let changes = 0;
  let result = content;

  console.log("   🧹 Limpieza final...");

  // 1. Buscar todas las ocurrencias de serve(
  const serveMatches = (result.match(/serve\(/g) || []).length;
  if (serveMatches > 0) {
    console.log(`   📊 Encontradas ${serveMatches} ocurrencias de serve(`);

    // Si hay múltiples serve, mantener solo el último con withCors
    const lines = result.split("\n");
    let foundExportDefault = false;
    let foundServeWithCors = false;

    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];

      // Si ya encontramos export default withCors, eliminar otros serve
      if (foundExportDefault && line.includes("serve(")) {
        lines[i] = "// " + line + " // ELIMINADO POR LIMPIEZA";
        changes++;
        console.log(`   🗑️ Eliminado serve() duplicado en línea ${i + 1}`);
      }

      // Detectar export default withCors
      if (line.includes("export default withCors")) {
        foundExportDefault = true;
      }

      // Convertir serve(withCors...) a export default si no hay export default
      if (!foundExportDefault && line.includes("serve(withCors(")) {
        lines[i] = line.replace("serve(withCors(", "export default withCors(");
        foundExportDefault = true;
        changes++;
        console.log(`   🔧 Convertido serve(withCors...) en línea ${i + 1}`);
      }

      // Convertir serve simple a export default con withCors
      if (
        !foundExportDefault &&
        line.trim().startsWith("serve(async ") &&
        !line.includes("withCors")
      ) {
        lines[i] = line.replace(
          "serve(async ",
          "export default withCors(async "
        );
        foundExportDefault = true;
        changes++;
        console.log(`   🔧 Convertido serve() simple en línea ${i + 1}`);
      }
    }

    result = lines.join("\n");
  }

  // 2. Eliminar imports de serve innecesarios
  if (!result.includes("serve(") && result.includes("import { serve }")) {
    result = result.replace(
      /import\s*\{\s*serve\s*\}\s*from\s*["'][^"']+["'];\s*\n?/g,
      ""
    );
    changes++;
    console.log("   ✅ Import de serve eliminado");
  }

  // 3. Limpiar líneas comentadas
  result = result.replace(/\/\/ .* \/\/ ELIMINADO POR LIMPIEZA\s*\n?/g, "");

  return { content: result, changes };
}

function processFunction(functionName) {
  const functionPath = path.join(functionsDir, functionName, "index.ts");

  if (!fs.existsSync(functionPath)) {
    console.log(`❌ ${functionName}: Archivo no encontrado`);
    return false;
  }

  console.log(`\n🔧 Limpieza final: ${functionName}`);

  // Crear backup
  const backupPath = createBackup(functionPath);

  try {
    // Leer contenido
    const originalContent = fs.readFileSync(functionPath, "utf8");

    // Verificar si necesita limpieza
    const serveCount = (originalContent.match(/serve\(/g) || []).length;
    const hasExportDefault = originalContent.includes(
      "export default withCors"
    );

    if (serveCount === 0 && hasExportDefault) {
      console.log("   ✅ Ya está limpia");
      fs.unlinkSync(backupPath);
      return true;
    }

    console.log(
      `   📊 Estado: ${serveCount} serve(), export default: ${hasExportDefault}`
    );

    // Realizar limpieza
    const { content: cleanContent, changes } = finalCleanup(originalContent);

    if (changes === 0) {
      console.log("   ⚠️ No se realizaron cambios");
      fs.unlinkSync(backupPath);
      return true;
    }

    // Validaciones
    if (cleanContent.length < originalContent.length * 0.5) {
      throw new Error("Archivo demasiado pequeño después de la limpieza");
    }

    // Escribir archivo limpio
    fs.writeFileSync(functionPath, cleanContent);

    // Verificar resultado
    const finalServeCount = (cleanContent.match(/serve\(/g) || []).length;
    const finalHasExport = cleanContent.includes("export default withCors");

    console.log(`   ✅ Limpieza completada (${changes} cambios)`);
    console.log(
      `   📊 Estado final: ${finalServeCount} serve(), export default: ${finalHasExport}`
    );

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
  console.log("🧹 LIMPIEZA FINAL Y CONSOLIDACIÓN");
  console.log("==================================");
  console.log(`📂 Directorio: ${functionsDir}`);
  console.log(`🎯 Funciones problemáticas: ${problematicFunctions.join(", ")}`);

  let successCount = 0;
  let errorCount = 0;

  for (const functionName of problematicFunctions) {
    const success = processFunction(functionName);
    if (success) {
      successCount++;
    } else {
      errorCount++;
    }
  }

  console.log("\n📊 RESUMEN DE LIMPIEZA:");
  console.log("========================");
  console.log(
    `✅ Funciones limpiadas: ${successCount}/${problematicFunctions.length}`
  );
  console.log(`❌ Errores: ${errorCount}`);

  if (successCount === problematicFunctions.length) {
    console.log("\n🎉 ¡LIMPIEZA COMPLETADA!");
    console.log("🌟 ¡Sistema CORS 100% unificado y limpio!");
  } else {
    console.log("\n⚠️ Revisar funciones con errores");
  }
}

main();
