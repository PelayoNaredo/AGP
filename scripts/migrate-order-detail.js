const fs = require("fs");
const path = require("path");

const functionsDir = "../AG-PYMEs/supabase/functions";
const functionName = "order-detail";

function createBackup(filePath) {
  const backupPath = filePath + ".backup-" + Date.now();
  fs.copyFileSync(filePath, backupPath);
  console.log(`📁 Backup creado: ${backupPath}`);
  return backupPath;
}

function migrateOrderDetailFunction(content) {
  let changes = 0;
  let migratedContent = content;

  // Paso 1: Añadir imports del sistema CORS unificado al inicio del archivo
  if (
    !migratedContent.includes(
      "import { withCors, createCorsJsonResponse, createCorsErrorResponse }"
    )
  ) {
    const importPosition = migratedContent.indexOf("import");
    if (importPosition !== -1) {
      const importLine =
        'import { withCors, createCorsJsonResponse, createCorsErrorResponse } from "../auth-utils/cors-utils.ts";\n';
      migratedContent =
        migratedContent.substring(0, importPosition) +
        importLine +
        migratedContent.substring(importPosition);
      changes++;
      console.log("✅ Imports CORS añadidos");
    }
  }

  // Paso 2: Eliminar declaración de corsHeaders
  const corsHeadersDeclaration = /const corsHeaders = \{[^}]+\};?\n?/g;
  if (corsHeadersDeclaration.test(migratedContent)) {
    migratedContent = migratedContent.replace(corsHeadersDeclaration, "");
    changes++;
    console.log("✅ Declaración corsHeaders eliminada");
  }

  // Paso 3: Envolver función principal con withCors
  // Buscar el patrón export default async function
  const functionPattern =
    /(export default async function[^{]*\{)([\s\S]*?)(\n}\s*$)/;
  const functionMatch = migratedContent.match(functionPattern);

  if (functionMatch) {
    const functionStart = functionMatch[1];
    const functionBody = functionMatch[2];
    const functionEnd = functionMatch[3];

    // Crear nueva estructura con withCors
    const newFunction = `export default withCors(async (req: Request) => {${functionBody}${functionEnd}`;
    migratedContent = migratedContent.replace(functionPattern, newFunction);
    changes++;
    console.log("✅ Función envuelta con withCors");
  }

  // Paso 4: Reemplazar Response con corsHeaders por createCorsJsonResponse/createCorsErrorResponse
  const responsePatterns = [
    // Pattern: new Response(content, { status: xxx, headers: corsHeaders })
    {
      pattern:
        /new Response\(([^,]+),\s*\{\s*status:\s*(\d+),\s*headers:\s*corsHeaders\s*\}\)/g,
      replace: (match, content, status) => {
        changes++;
        if (status === "200") {
          return `createCorsJsonResponse(${content})`;
        } else {
          return `createCorsErrorResponse(${content}, ${status})`;
        }
      },
    },
    // Pattern: Response.json(content, { status: xxx, headers: corsHeaders })
    {
      pattern:
        /Response\.json\(([^,]+),\s*\{\s*status:\s*(\d+),\s*headers:\s*corsHeaders\s*\}\)/g,
      replace: (match, content, status) => {
        changes++;
        if (status === "200") {
          return `createCorsJsonResponse(${content})`;
        } else {
          return `createCorsErrorResponse(${content}, ${status})`;
        }
      },
    },
    // Pattern: return new Response(content, { headers: corsHeaders })
    {
      pattern:
        /return new Response\(([^,]+),\s*\{\s*headers:\s*corsHeaders\s*\}\)/g,
      replace: (match, content) => {
        changes++;
        return `return createCorsJsonResponse(${content})`;
      },
    },
  ];

  responsePatterns.forEach(({ pattern, replace }) => {
    migratedContent = migratedContent.replace(pattern, replace);
  });

  // Paso 5: Eliminar manejo manual de OPTIONS
  const optionsPattern = /if \(req\.method === ['"]OPTIONS['"]\) \{[^}]+\}/g;
  if (optionsPattern.test(migratedContent)) {
    migratedContent = migratedContent.replace(optionsPattern, "");
    changes++;
    console.log("✅ Manejo OPTIONS manual eliminado");
  }

  // Paso 6: Reemplazar cualquier referencia restante a corsHeaders
  const remainingRefs = /corsHeaders/g;
  migratedContent = migratedContent.replace(remainingRefs, () => {
    changes++;
    return '{ "Content-Type": "application/json" }';
  });

  return { content: migratedContent, changes };
}

function processOrderDetail() {
  const functionPath = path.join(functionsDir, functionName, "index.ts");

  if (!fs.existsSync(functionPath)) {
    console.log(`❌ Función ${functionName} no encontrada en ${functionPath}`);
    return false;
  }

  console.log(`🔄 Migrando función: ${functionName}`);
  console.log(`📂 Archivo: ${functionPath}`);

  // Crear backup
  const backupPath = createBackup(functionPath);

  try {
    // Leer contenido actual
    const originalContent = fs.readFileSync(functionPath, "utf8");

    // Verificar estado actual
    const corsHeadersCount = (originalContent.match(/corsHeaders/g) || [])
      .length;
    const hasWithCors = originalContent.includes("withCors");
    const hasCorsImports = originalContent.includes("createCorsJsonResponse");

    console.log(`📊 Estado actual:`);
    console.log(`   - Referencias corsHeaders: ${corsHeadersCount}`);
    console.log(`   - Tiene withCors: ${hasWithCors}`);
    console.log(`   - Tiene imports CORS: ${hasCorsImports}`);

    if (corsHeadersCount === 0 && hasWithCors && hasCorsImports) {
      console.log(`✅ ${functionName}: Ya está completamente migrada`);
      fs.unlinkSync(backupPath); // Eliminar backup innecesario
      return true;
    }

    // Migrar función
    const { content: migratedContent, changes } =
      migrateOrderDetailFunction(originalContent);

    // Verificar que el contenido cambió
    if (changes === 0) {
      console.log(`⚠️ ${functionName}: No se realizaron cambios`);
      fs.unlinkSync(backupPath);
      return true;
    }

    // Validar que el archivo resultante es válido
    if (migratedContent.length < originalContent.length * 0.5) {
      throw new Error("El archivo resultante es sospechosamente pequeño");
    }

    // Verificar que los imports están presentes
    if (
      !migratedContent.includes("withCors") ||
      !migratedContent.includes("createCorsJsonResponse")
    ) {
      throw new Error("Los imports CORS no están presentes en el resultado");
    }

    // Escribir archivo migrado
    fs.writeFileSync(functionPath, migratedContent);

    // Verificar resultado final
    const finalCorsHeaders = (migratedContent.match(/corsHeaders/g) || [])
      .length;
    const finalWithCors = migratedContent.includes("withCors");
    const finalCorsImports = migratedContent.includes("createCorsJsonResponse");

    console.log(
      `✅ ${functionName}: Migración completada con ${changes} cambios`
    );
    console.log(`📊 Estado final:`);
    console.log(`   - corsHeaders restantes: ${finalCorsHeaders}`);
    console.log(`   - withCors presente: ${finalWithCors}`);
    console.log(`   - CORS imports presente: ${finalCorsImports}`);

    return true;
  } catch (error) {
    console.error(`❌ Error migrando ${functionName}:`, error.message);

    // Restaurar backup en caso de error
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, functionPath);
      console.log(`🔄 Backup restaurado para ${functionName}`);
    }

    return false;
  }
}

function main() {
  console.log("🚀 MIGRACIÓN DE ORDER-DETAIL");
  console.log("===============================");
  console.log(`📂 Directorio: ${functionsDir}`);
  console.log(`🎯 Función: ${functionName}`);

  const success = processOrderDetail();

  console.log("\n📊 RESUMEN:");
  console.log("===========");

  if (success) {
    console.log("✅ Migración completada exitosamente");
    console.log("🎉 order-detail ahora usa el sistema CORS unificado");
  } else {
    console.log("❌ La migración falló");
    console.log("⚠️ Revisa los logs anteriores para más detalles");
  }
}

main();
