const fs = require("fs");
const path = require("path");

const functionsDir = "../AG-PYMEs/supabase/functions";

// Funciones que aún necesitan modernización
const remainingFunctions = [
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
  const backupPath = filePath + ".backup-final-" + Date.now();
  fs.copyFileSync(filePath, backupPath);
  console.log(`📁 Backup creado: ${path.basename(backupPath)}`);
  return backupPath;
}

function analyzeAndModernize(content, functionName) {
  let changes = 0;
  let modernizedContent = content;

  console.log(`   🔍 Analizando ${functionName}...`);

  // 1. Verificar si ya está modernizada
  if (modernizedContent.includes("export default withCors")) {
    console.log("   ✅ Ya está modernizada con export default withCors");
    return { content: modernizedContent, changes: 0 };
  }

  // 2. Añadir imports CORS si no están presentes
  if (!modernizedContent.includes("cors-utils.ts")) {
    console.log("   📦 Añadiendo imports CORS...");

    // Buscar el primer import para insertar después
    const importMatch = modernizedContent.match(/^import[^;]+;/m);
    if (importMatch) {
      const firstImportEnd =
        modernizedContent.indexOf(importMatch[0]) + importMatch[0].length;
      modernizedContent =
        modernizedContent.substring(0, firstImportEnd) +
        '\nimport { withCors, createCorsJsonResponse, createCorsErrorResponse } from "../auth-utils/cors-utils.ts";' +
        modernizedContent.substring(firstImportEnd);
      changes++;
    }
  }

  // 3. Eliminar import de serve
  const serveImportPattern =
    /import\s*\{\s*serve\s*\}\s*from\s*["'][^"']+["'];\s*\n?/;
  if (serveImportPattern.test(modernizedContent)) {
    modernizedContent = modernizedContent.replace(serveImportPattern, "");
    changes++;
    console.log("   ✅ Import de serve eliminado");
  }

  // 4. Buscar diferentes patrones de serve()
  const patterns = [
    // Patrón 1: serve(async (req) => { ... });
    {
      name: "serve simple",
      regex: /serve\(async \((req[^)]*)\) => \{([\s\S]*?)\}\);?\s*$/,
      wrapper: false,
    },
    // Patrón 2: serve(withCors(async (req) => { ... }));
    {
      name: "serve con withCors",
      regex:
        /serve\(withCors\(async \((req[^)]*)\) => \{([\s\S]*?)\}\)\);?\s*$/,
      wrapper: true,
    },
    // Patrón 3: Deno.serve(...)
    {
      name: "Deno.serve",
      regex:
        /Deno\.serve\((?:withCors\()?async \((req[^)]*)\) => \{([\s\S]*?)\}(?:\))?\);?\s*$/,
      wrapper: true,
    },
  ];

  for (const pattern of patterns) {
    const match = modernizedContent.match(pattern.regex);
    if (match) {
      console.log(`   🔧 Encontrado patrón: ${pattern.name}`);

      const reqParam = match[1] || "req";
      let functionBody = match[2];

      // Limpiar manejo manual de OPTIONS si existe
      if (functionBody.includes('req.method === "OPTIONS"')) {
        console.log("   🧹 Limpiando manejo manual de OPTIONS");
        functionBody = functionBody.replace(
          /if \(req\.method === ['"]OPTIONS['"]\) \{[^}]*return[^}]*\}\s*/g,
          ""
        );
        changes++;
      }

      // Limpiar Response manuales
      if (
        functionBody.includes("new Response(") &&
        !functionBody.includes("createCorsErrorResponse")
      ) {
        console.log("   🛠️ Limpiando Response manuales");

        // Reemplazar Response manuales por funciones CORS
        functionBody = functionBody.replace(
          /new Response\(\s*JSON\.stringify\(([^)]+)\),\s*\{\s*status:\s*(\d+),\s*headers:\s*\{[^}]*\}\s*\}/g,
          (match, content, status) => {
            changes++;
            if (status === "200") {
              return `createCorsJsonResponse(${content})`;
            } else {
              return `createCorsErrorResponse(${content}, ${status})`;
            }
          }
        );
      }

      // Crear nueva estructura
      const newExport = `export default withCors(async (${reqParam}: Request) => {${functionBody}});`;

      modernizedContent = modernizedContent.replace(pattern.regex, newExport);
      changes++;
      console.log(`   ✅ ${pattern.name} → export default withCors()`);
      break;
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

  console.log(`\n🔄 Procesando: ${functionName}`);

  // Crear backup
  const backupPath = createBackup(functionPath);

  try {
    // Leer contenido actual
    const originalContent = fs.readFileSync(functionPath, "utf8");

    // Analizar y modernizar
    const { content: modernizedContent, changes } = analyzeAndModernize(
      originalContent,
      functionName
    );

    if (changes === 0) {
      console.log(`   ✅ No necesita cambios o ya está modernizada`);
      fs.unlinkSync(backupPath);
      return true;
    }

    // Validaciones de seguridad
    if (modernizedContent.length < originalContent.length * 0.3) {
      throw new Error("El archivo resultante es demasiado pequeño");
    }

    if (!modernizedContent.includes("export default withCors")) {
      throw new Error(
        "La estructura export default withCors no se generó correctamente"
      );
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
  console.log("🔥 MODERNIZACIÓN FINAL DE FUNCIONES RESTANTES");
  console.log("==============================================");
  console.log(`📂 Directorio: ${functionsDir}`);
  console.log(`🎯 Funciones restantes: ${remainingFunctions.length}`);
  console.log(`📋 Lista: ${remainingFunctions.join(", ")}`);

  let successCount = 0;
  let errorCount = 0;

  for (const functionName of remainingFunctions) {
    const success = processFunction(functionName);
    if (success) {
      successCount++;
    } else {
      errorCount++;
    }
  }

  console.log("\n📊 RESUMEN FINAL:");
  console.log("==================");
  console.log(
    `✅ Funciones modernizadas: ${successCount}/${remainingFunctions.length}`
  );
  console.log(`❌ Funciones con errores: ${errorCount}`);

  if (successCount === remainingFunctions.length) {
    console.log("\n🎉 ¡TODAS LAS FUNCIONES MODERNIZADAS!");
    console.log("El sistema CORS está completamente unificado.");
  } else if (errorCount > 0) {
    console.log("\n⚠️ Algunas funciones necesitan revisión manual");
    console.log("Revisa los logs para más detalles");
  }

  console.log("\n🔍 Ejecuta una auditoría final para verificar el estado");
}

main();
