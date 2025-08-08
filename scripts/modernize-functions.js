const fs = require("fs");
const path = require("path");

const functionsDir = "../AG-PYMEs/supabase/functions";

// Funciones que necesitan modernización (estructura anticuada)
const functionsToModernize = [
  "appointments",
  "clients",
  "dashboard",
  "employees",
  "expenses",
  "income",
  "inventory",
  "leaves",
  "login",
  "orders",
  "register",
  "sales",
  "shifts",
  "signed-url",
];

function createBackup(filePath) {
  const backupPath = filePath + ".backup-modernize-" + Date.now();
  fs.copyFileSync(filePath, backupPath);
  console.log(`📁 Backup creado: ${path.basename(backupPath)}`);
  return backupPath;
}

function modernizeFunction(content) {
  let changes = 0;
  let modernizedContent = content;

  // 1. Corregir import de CORS
  const oldImportPattern =
    /import\s*\{\s*withCors,\s*createCorsJsonResponse,\s*createCorsErrorResponse\s*\}\s*from\s*["']\.\.\/(_shared\/cors\.ts|_shared\/cors|cors\.ts)["'];?\n?/;
  if (oldImportPattern.test(modernizedContent)) {
    modernizedContent = modernizedContent.replace(
      oldImportPattern,
      'import { withCors, createCorsJsonResponse, createCorsErrorResponse } from "../auth-utils/cors-utils.ts";\n'
    );
    changes++;
    console.log("   ✅ Import CORS corregido");
  }

  // 2. Eliminar import de serve si existe
  const serveImportPattern =
    /import\s*\{\s*serve\s*\}\s*from\s*["']https:\/\/deno\.land\/std@[\d.]+\/http\/server\.ts["'];?\n?/;
  if (serveImportPattern.test(modernizedContent)) {
    modernizedContent = modernizedContent.replace(serveImportPattern, "");
    changes++;
    console.log("   ✅ Import de serve eliminado");
  }

  // 3. Reemplazar serve(withCors(...)) por export default withCors(...)
  // Patrón: serve(withCors(async (req) => { ... }));
  const servePattern =
    /serve\(withCors\(async \((req[^)]*)\) => \{([\s\S]*?)\}\)\);?\s*$/;
  const serveMatch = modernizedContent.match(servePattern);

  if (serveMatch) {
    const reqParam = serveMatch[1] || "req";
    const functionBody = serveMatch[2];

    // Crear nueva estructura
    const newExport = `export default withCors(async (${reqParam}: Request) => {${functionBody}});`;

    modernizedContent = modernizedContent.replace(servePattern, newExport);
    changes++;
    console.log("   ✅ serve() → export default withCors()");
  }

  // 4. También manejar el patrón Deno.serve(withCors(...))
  const denoServePattern =
    /Deno\.serve\(withCors\(async \((req[^)]*)\) => \{([\s\S]*?)\}\)\);?\s*$/;
  const denoServeMatch = modernizedContent.match(denoServePattern);

  if (denoServeMatch) {
    const reqParam = denoServeMatch[1] || "req";
    const functionBody = denoServeMatch[2];

    // Crear nueva estructura
    const newExport = `export default withCors(async (${reqParam}: Request) => {${functionBody}});`;

    modernizedContent = modernizedContent.replace(denoServePattern, newExport);
    changes++;
    console.log("   ✅ Deno.serve() → export default withCors()");
  }

  return { content: modernizedContent, changes };
}

function processFunction(functionName) {
  const functionPath = path.join(functionsDir, functionName, "index.ts");

  if (!fs.existsSync(functionPath)) {
    console.log(`❌ ${functionName}: Archivo no encontrado`);
    return false;
  }

  console.log(`\n🔄 Modernizando: ${functionName}`);

  // Crear backup
  const backupPath = createBackup(functionPath);

  try {
    // Leer contenido actual
    const originalContent = fs.readFileSync(functionPath, "utf8");

    // Verificar si ya está modernizada
    const hasExportDefault = originalContent.includes(
      "export default withCors"
    );
    const hasOldImport = originalContent.includes("../_shared/cors");
    const hasServe =
      originalContent.includes("serve(") ||
      originalContent.includes("Deno.serve(");

    if (hasExportDefault && !hasOldImport && !hasServe) {
      console.log(`   ✅ Ya está modernizada`);
      fs.unlinkSync(backupPath);
      return true;
    }

    // Modernizar función
    const { content: modernizedContent, changes } =
      modernizeFunction(originalContent);

    if (changes === 0) {
      console.log(`   ⚠️ No se realizaron cambios`);
      fs.unlinkSync(backupPath);
      return true;
    }

    // Validar que el contenido resultante es válido
    if (modernizedContent.length < originalContent.length * 0.5) {
      throw new Error("El archivo resultante es sospechosamente pequeño");
    }

    if (!modernizedContent.includes("export default withCors")) {
      throw new Error("La estructura export default withCors no está presente");
    }

    // Escribir archivo modernizado
    fs.writeFileSync(functionPath, modernizedContent);

    console.log(`   ✅ Modernización completada (${changes} cambios)`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);

    // Restaurar backup
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, functionPath);
      console.log(`   🔄 Backup restaurado`);
    }

    return false;
  }
}

function main() {
  console.log("🚀 MODERNIZACIÓN MASIVA DE EDGE FUNCTIONS");
  console.log("=========================================");
  console.log(`📂 Directorio: ${functionsDir}`);
  console.log(`🎯 Funciones a modernizar: ${functionsToModernize.length}`);
  console.log(`📋 Lista: ${functionsToModernize.join(", ")}`);

  let successCount = 0;
  let errorCount = 0;

  for (const functionName of functionsToModernize) {
    const success = processFunction(functionName);
    if (success) {
      successCount++;
    } else {
      errorCount++;
    }
  }

  console.log("\n📊 RESUMEN DE MODERNIZACIÓN:");
  console.log("============================");
  console.log(`✅ Funciones modernizadas exitosamente: ${successCount}`);
  console.log(`❌ Funciones con errores: ${errorCount}`);
  console.log(
    `📝 Total procesadas: ${successCount + errorCount}/${functionsToModernize.length}`
  );

  if (successCount === functionsToModernize.length) {
    console.log("\n🎉 ¡MODERNIZACIÓN COMPLETADA CON ÉXITO!");
    console.log("Todas las funciones ahora usan la estructura moderna.");
  } else if (errorCount > 0) {
    console.log("\n⚠️ Algunas funciones tuvieron problemas");
    console.log("Revisa los logs anteriores para más detalles");
  }
}

main();
