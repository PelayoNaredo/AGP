const fs = require("fs");
const path = require("path");

const functionsDir = "../AG-PYMEs/supabase/functions";

// Funciones que necesitan implementación de CORS
const functionsWithoutCors = [
  "alerts",
  "companies",
  "settings",
  "suppliers",
  "user-sync",
  "users",
];

function createBackup(filePath) {
  const backupPath = filePath + ".backup-cors-impl-" + Date.now();
  fs.copyFileSync(filePath, backupPath);
  console.log(`📁 Backup creado: ${path.basename(backupPath)}`);
  return backupPath;
}

function implementCors(content) {
  let changes = 0;
  let result = content;

  console.log("   🔍 Implementando sistema CORS...");

  // 1. Añadir import de CORS después del primer import
  if (!result.includes("cors-utils.ts")) {
    const firstImportMatch = result.match(/^import[^;]+;/m);
    if (firstImportMatch) {
      const insertPosition =
        result.indexOf(firstImportMatch[0]) + firstImportMatch[0].length;
      const corsImport =
        '\nimport { withCors, createCorsJsonResponse, createCorsErrorResponse } from "../auth-utils/cors-utils.ts";';
      result =
        result.substring(0, insertPosition) +
        corsImport +
        result.substring(insertPosition);
      changes++;
      console.log("   ✅ Import CORS añadido");
    }
  }

  // 2. Buscar y reemplazar patrones de servidor
  const patterns = [
    // serve(async (req) => { ... });
    {
      regex: /serve\(async \((req[^)]*)\) => \{([\s\S]*?)\}\);?\s*$/,
      replacement: (match, reqParam, body) => {
        changes++;
        console.log("   🔧 Convirtiendo serve() simple");
        return `export default withCors(async (${reqParam}: Request) => {${body}});`;
      },
    },
    // Deno.serve(async (req) => { ... });
    {
      regex: /Deno\.serve\(async \((req[^)]*)\) => \{([\s\S]*?)\}\);?\s*$/,
      replacement: (match, reqParam, body) => {
        changes++;
        console.log("   🔧 Convirtiendo Deno.serve()");
        return `export default withCors(async (${reqParam}: Request) => {${body}});`;
      },
    },
  ];

  for (const pattern of patterns) {
    if (pattern.regex.test(result)) {
      result = result.replace(pattern.regex, pattern.replacement);
      break;
    }
  }

  // 3. Eliminar import de serve si ya no se usa
  if (!result.includes("serve(") && result.includes("import { serve }")) {
    result = result.replace(
      /import\s*\{\s*serve\s*\}\s*from\s*["'][^"']+["'];\s*\n?/,
      ""
    );
    changes++;
    console.log("   ✅ Import de serve eliminado");
  }

  // 4. Reemplazar Response manuales por funciones CORS
  const responsePatterns = [
    // new Response(JSON.stringify(...), { status: xxx, headers: {...} })
    {
      regex:
        /new Response\(\s*JSON\.stringify\(([^)]+)\),\s*\{\s*status:\s*(\d+),\s*headers:\s*\{[^}]*\}\s*\}/g,
      replacement: (match, content, status) => {
        changes++;
        if (status === "200") {
          return `createCorsJsonResponse(${content})`;
        } else {
          return `createCorsErrorResponse(${content}, ${status})`;
        }
      },
    },
    // Response.json(..., { status: xxx, headers: {...} })
    {
      regex:
        /Response\.json\(([^,]+),\s*\{\s*status:\s*(\d+),\s*headers:\s*\{[^}]*\}\s*\}/g,
      replacement: (match, content, status) => {
        changes++;
        if (status === "200") {
          return `createCorsJsonResponse(${content})`;
        } else {
          return `createCorsErrorResponse(${content}, ${status})`;
        }
      },
    },
  ];

  responsePatterns.forEach((pattern) => {
    result = result.replace(pattern.regex, pattern.replacement);
  });

  // 5. Eliminar manejo manual de OPTIONS
  if (result.includes('req.method === "OPTIONS"')) {
    result = result.replace(
      /if \(req\.method === ['"]OPTIONS['"]\) \{[^}]*return[^}]*\}\s*/g,
      ""
    );
    changes++;
    console.log("   ✅ Manejo OPTIONS manual eliminado");
  }

  return { content: result, changes };
}

function processFunction(functionName) {
  const functionPath = path.join(functionsDir, functionName, "index.ts");

  if (!fs.existsSync(functionPath)) {
    console.log(`❌ ${functionName}: Archivo no encontrado`);
    return false;
  }

  console.log(`\n🚀 Implementando CORS en: ${functionName}`);

  // Crear backup
  const backupPath = createBackup(functionPath);

  try {
    // Leer contenido
    const originalContent = fs.readFileSync(functionPath, "utf8");

    // Verificar si ya tiene CORS
    if (
      originalContent.includes("withCors") &&
      originalContent.includes("export default")
    ) {
      console.log("   ✅ Ya tiene sistema CORS implementado");
      fs.unlinkSync(backupPath);
      return true;
    }

    // Implementar CORS
    const { content: corsContent, changes } = implementCors(originalContent);

    if (changes === 0) {
      console.log("   ⚠️ No se realizaron cambios");
      fs.unlinkSync(backupPath);
      return true;
    }

    // Validaciones
    if (corsContent.length < originalContent.length * 0.5) {
      throw new Error("Archivo demasiado pequeño después de los cambios");
    }

    if (!corsContent.includes("withCors")) {
      throw new Error("Sistema CORS no implementado correctamente");
    }

    // Escribir archivo
    fs.writeFileSync(functionPath, corsContent);

    console.log(`   ✅ CORS implementado exitosamente (${changes} cambios)`);
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
  console.log("🌐 IMPLEMENTACIÓN DE CORS");
  console.log("=========================");
  console.log(`📂 Directorio: ${functionsDir}`);
  console.log(`🎯 Funciones sin CORS: ${functionsWithoutCors.join(", ")}`);

  let successCount = 0;
  let errorCount = 0;

  for (const functionName of functionsWithoutCors) {
    const success = processFunction(functionName);
    if (success) {
      successCount++;
    } else {
      errorCount++;
    }
  }

  console.log("\n📊 RESUMEN DE IMPLEMENTACIÓN:");
  console.log("==============================");
  console.log(
    `✅ CORS implementado exitosamente: ${successCount}/${functionsWithoutCors.length}`
  );
  console.log(`❌ Errores: ${errorCount}`);

  if (successCount === functionsWithoutCors.length) {
    console.log("\n🎉 ¡CORS IMPLEMENTADO EN TODAS LAS FUNCIONES!");
    console.log("🌟 Sistema CORS completamente unificado");
  } else {
    console.log("\n⚠️ Revisar funciones con errores");
  }
}

main();
