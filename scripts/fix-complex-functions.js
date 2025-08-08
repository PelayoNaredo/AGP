const fs = require("fs");
const path = require("path");

const functionsDir = "../AG-PYMEs/supabase/functions";

// Funciones que fallaron en la primera pasada
const problematicFunctions = [
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
  const backupPath = filePath + ".backup-fix-" + Date.now();
  fs.copyFileSync(filePath, backupPath);
  console.log(`📁 Backup creado: ${path.basename(backupPath)}`);
  return backupPath;
}

function modernizeComplexFunction(content) {
  let changes = 0;
  let modernizedContent = content;

  console.log("   🔍 Analizando estructura compleja...");

  // 1. Buscar el patrón completo con manejo de errores
  const complexServePattern =
    /serve\(withCors\(async \((req[^)]*)\) => \{([\s\S]*?)\}\)\);?\s*$/;
  const match = modernizedContent.match(complexServePattern);

  if (match) {
    const reqParam = match[1] || "req";
    const functionBody = match[2];

    // Buscar si hay manejo de errores con Response manual
    if (
      functionBody.includes("new Response(") &&
      functionBody.includes("error")
    ) {
      console.log("   🛠️ Detectado manejo de errores manual");

      // Reemplazar Response manuales por createCorsErrorResponse
      let cleanedBody = functionBody;

      // Patrón: new Response(JSON.stringify({...}), { status: xxx, headers: {...} })
      const manualResponsePattern =
        /new Response\(\s*JSON\.stringify\([^)]+\),\s*\{\s*status:\s*(\d+),\s*headers:\s*\{[^}]*\}\s*\}/g;
      cleanedBody = cleanedBody.replace(
        manualResponsePattern,
        (match, status) => {
          console.log(`   ✅ Reemplazando Response manual (status ${status})`);
          changes++;
          // Extraer el contenido del JSON.stringify
          const contentMatch = match.match(/JSON\.stringify\(([^)]+)\)/);
          const content = contentMatch
            ? contentMatch[1]
            : '{ error: "Error interno del servidor" }';
          return `createCorsErrorResponse(${content}, ${status})`;
        }
      );

      // Crear nueva estructura sin manejo de OPTIONS manual
      const newExport = `export default withCors(async (${reqParam}: Request) => {${cleanedBody}});`;

      modernizedContent = modernizedContent.replace(
        complexServePattern,
        newExport
      );
      changes++;
      console.log("   ✅ Estructura compleja modernizada");
    } else {
      // Estructura simple
      const newExport = `export default withCors(async (${reqParam}: Request) => {${functionBody}});`;
      modernizedContent = modernizedContent.replace(
        complexServePattern,
        newExport
      );
      changes++;
      console.log("   ✅ Estructura simple modernizada");
    }
  }

  return { content: modernizedContent, changes };
}

function processFunction(functionName) {
  const functionPath = path.join(functionsDir, functionName, "index.ts");

  if (!fs.existsSync(functionPath)) {
    console.log(`❌ ${functionName}: Archivo no encontrado`);
    return false;
  }

  console.log(`\n🔄 Reparando: ${functionName}`);

  // Crear backup
  const backupPath = createBackup(functionPath);

  try {
    // Leer contenido actual
    const originalContent = fs.readFileSync(functionPath, "utf8");

    // Verificar si ya está modernizada
    if (originalContent.includes("export default withCors")) {
      console.log(`   ✅ Ya está modernizada`);
      fs.unlinkSync(backupPath);
      return true;
    }

    // Verificar si tiene serve
    if (!originalContent.includes("serve(withCors")) {
      console.log(`   ⚠️ No usa serve(withCors), revisar manualmente`);
      fs.unlinkSync(backupPath);
      return true;
    }

    // Modernizar función compleja
    const { content: modernizedContent, changes } =
      modernizeComplexFunction(originalContent);

    if (changes === 0) {
      console.log(`   ⚠️ No se realizaron cambios`);
      fs.unlinkSync(backupPath);
      return false;
    }

    // Validar que el contenido resultante es válido
    if (modernizedContent.length < originalContent.length * 0.3) {
      throw new Error("El archivo resultante es sospechosamente pequeño");
    }

    if (!modernizedContent.includes("export default withCors")) {
      throw new Error("La estructura export default withCors no está presente");
    }

    // Escribir archivo modernizado
    fs.writeFileSync(functionPath, modernizedContent);

    console.log(`   ✅ Reparación completada (${changes} cambios)`);
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
  console.log("🔧 REPARACIÓN DE FUNCIONES COMPLEJAS");
  console.log("====================================");
  console.log(`📂 Directorio: ${functionsDir}`);
  console.log(`🎯 Funciones problemáticas: ${problematicFunctions.length}`);
  console.log(`📋 Lista: ${problematicFunctions.join(", ")}`);

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

  console.log("\n📊 RESUMEN DE REPARACIÓN:");
  console.log("=========================");
  console.log(`✅ Funciones reparadas exitosamente: ${successCount}`);
  console.log(`❌ Funciones con errores: ${errorCount}`);
  console.log(
    `📝 Total procesadas: ${successCount + errorCount}/${problematicFunctions.length}`
  );

  if (successCount === problematicFunctions.length) {
    console.log("\n🎉 ¡REPARACIÓN COMPLETADA CON ÉXITO!");
  } else if (errorCount > 0) {
    console.log("\n⚠️ Algunas funciones necesitan revisión manual");
  }
}

main();
