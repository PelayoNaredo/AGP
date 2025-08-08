const fs = require("fs");
const path = require("path");

const functionsDir = "./AG-PYMEs/supabase/functions";

// Funciones que necesitan limpieza de corsHeaders
const targetFunctions = [
  "appointments",
  "income",
  "leaves",
  "orders",
  "sales",
  "shifts",
];

function createBackup(filePath) {
  const backupPath = filePath + ".backup-" + Date.now();
  fs.copyFileSync(filePath, backupPath);
  console.log(`📁 Backup creado: ${backupPath}`);
  return backupPath;
}

function cleanupCorsHeaders(content) {
  let changes = 0;
  let cleanedContent = content;

  // Patrón 1: Eliminar objetos Response con corsHeaders
  const responsePattern =
    /new Response\([^,]*,\s*{\s*status:\s*\d+,\s*headers:\s*corsHeaders\s*}\)/g;
  const responsesRemoved = (cleanedContent.match(responsePattern) || []).length;
  cleanedContent = cleanedContent.replace(responsePattern, (match) => {
    changes++;
    // Extraer el contenido y status
    const statusMatch = match.match(/status:\s*(\d+)/);
    const status = statusMatch ? statusMatch[1] : "200";
    const contentMatch = match.match(/new Response\(([^,]*),/);
    const responseContent = contentMatch
      ? contentMatch[1]
      : "JSON.stringify({ success: true })";

    if (status === "200") {
      return `createCorsJsonResponse(${responseContent})`;
    } else {
      return `createCorsErrorResponse(${responseContent}, ${status})`;
    }
  });

  // Patrón 2: Eliminar Response.json con corsHeaders
  const jsonPattern =
    /Response\.json\([^,]*,\s*{\s*status:\s*\d+,\s*headers:\s*corsHeaders\s*}\)/g;
  const jsonRemoved = (cleanedContent.match(jsonPattern) || []).length;
  cleanedContent = cleanedContent.replace(jsonPattern, (match) => {
    changes++;
    const statusMatch = match.match(/status:\s*(\d+)/);
    const status = statusMatch ? statusMatch[1] : "200";
    const contentMatch = match.match(/Response\.json\(([^,]*),/);
    const responseContent = contentMatch
      ? contentMatch[1]
      : "{ success: true }";

    if (status === "200") {
      return `createCorsJsonResponse(${responseContent})`;
    } else {
      return `createCorsErrorResponse(${responseContent}, ${status})`;
    }
  });

  // Patrón 3: Eliminar referencias simples a corsHeaders en headers
  const headersPattern = /headers:\s*corsHeaders/g;
  const headersRemoved = (cleanedContent.match(headersPattern) || []).length;
  cleanedContent = cleanedContent.replace(headersPattern, () => {
    changes++;
    return 'headers: { "Content-Type": "application/json" }';
  });

  // Patrón 4: Eliminar return con corsHeaders
  const returnPattern =
    /return new Response\([^,]*,\s*{\s*headers:\s*corsHeaders\s*}\)/g;
  const returnRemoved = (cleanedContent.match(returnPattern) || []).length;
  cleanedContent = cleanedContent.replace(returnPattern, (match) => {
    changes++;
    const contentMatch = match.match(/return new Response\(([^,]*),/);
    const responseContent = contentMatch
      ? contentMatch[1]
      : "JSON.stringify({ success: true })";
    return `return createCorsJsonResponse(${responseContent})`;
  });

  // Patrón 5: Limpiar cualquier referencia restante a corsHeaders
  const anyRefsPattern = /corsHeaders/g;
  const anyRefsRemoved = (cleanedContent.match(anyRefsPattern) || []).length;
  cleanedContent = cleanedContent.replace(anyRefsPattern, () => {
    changes++;
    return '{ "Content-Type": "application/json" }';
  });

  return {
    content: cleanedContent,
    changes,
    details: {
      responsesRemoved,
      jsonRemoved,
      headersRemoved,
      returnRemoved,
      anyRefsRemoved,
    },
  };
}

function processFunction(functionName) {
  const functionPath = path.join(functionsDir, functionName, "index.ts");

  if (!fs.existsSync(functionPath)) {
    console.log(`❌ Función ${functionName} no encontrada en ${functionPath}`);
    return false;
  }

  console.log(`\n🔄 Procesando función: ${functionName}`);

  // Crear backup
  const backupPath = createBackup(functionPath);

  try {
    // Leer contenido actual
    const originalContent = fs.readFileSync(functionPath, "utf8");

    // Verificar si tiene corsHeaders
    const corsHeadersCount = (originalContent.match(/corsHeaders/g) || [])
      .length;
    console.log(`📊 Referencias corsHeaders encontradas: ${corsHeadersCount}`);

    if (corsHeadersCount === 0) {
      console.log(`✅ ${functionName}: No hay corsHeaders para limpiar`);
      fs.unlinkSync(backupPath); // Eliminar backup innecesario
      return true;
    }

    // Limpiar corsHeaders
    const {
      content: cleanedContent,
      changes,
      details,
    } = cleanupCorsHeaders(originalContent);

    // Verificar que el contenido cambió
    if (changes === 0) {
      console.log(`⚠️ ${functionName}: No se realizaron cambios`);
      fs.unlinkSync(backupPath);
      return true;
    }

    // Validar que el archivo resultante es válido
    if (cleanedContent.length < originalContent.length * 0.5) {
      throw new Error("El archivo resultante es sospechosamente pequeño");
    }

    // Escribir archivo limpio
    fs.writeFileSync(functionPath, cleanedContent);

    // Verificar corsHeaders restantes
    const remainingCorsHeaders = (cleanedContent.match(/corsHeaders/g) || [])
      .length;

    console.log(`✅ ${functionName}: ${changes} cambios realizados`);
    console.log(`   - Responses con corsHeaders: ${details.responsesRemoved}`);
    console.log(`   - Response.json con corsHeaders: ${details.jsonRemoved}`);
    console.log(`   - Headers corsHeaders: ${details.headersRemoved}`);
    console.log(`   - Return con corsHeaders: ${details.returnRemoved}`);
    console.log(`   - Referencias restantes: ${details.anyRefsRemoved}`);
    console.log(`📊 corsHeaders restantes: ${remainingCorsHeaders}`);

    return true;
  } catch (error) {
    console.error(`❌ Error procesando ${functionName}:`, error.message);

    // Restaurar backup en caso de error
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, functionPath);
      console.log(`🔄 Backup restaurado para ${functionName}`);
    }

    return false;
  }
}

function main() {
  console.log("🧹 LIMPIEZA FINAL DE CORSHEADERS");
  console.log("==================================");
  console.log(`📂 Directorio: ${functionsDir}`);
  console.log(`🎯 Funciones objetivo: ${targetFunctions.join(", ")}`);

  let successCount = 0;
  let totalChanges = 0;

  for (const functionName of targetFunctions) {
    const success = processFunction(functionName);
    if (success) {
      successCount++;
    }
  }

  console.log("\n📊 RESUMEN FINAL:");
  console.log("=================");
  console.log(
    `✅ Funciones procesadas exitosamente: ${successCount}/${targetFunctions.length}`
  );
  console.log(`📝 Total de cambios realizados: ${totalChanges}`);

  if (successCount === targetFunctions.length) {
    console.log("\n🎉 ¡MIGRACIÓN COMPLETADA CON ÉXITO!");
    console.log("Todas las funciones han sido limpiadas de corsHeaders");
  } else {
    console.log("\n⚠️ Algunas funciones tuvieron problemas");
    console.log("Revisa los logs anteriores para más detalles");
  }
}

main();
