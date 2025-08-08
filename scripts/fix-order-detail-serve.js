const fs = require("fs");
const path = require("path");

const functionsDir = "../AG-PYMEs/supabase/functions";
const functionName = "order-detail";

function createBackup(filePath) {
  const backupPath = filePath + ".backup-serve-" + Date.now();
  fs.copyFileSync(filePath, backupPath);
  console.log(`📁 Backup creado: ${backupPath}`);
  return backupPath;
}

function migrateServeFunction(content) {
  let changes = 0;
  let migratedContent = content;

  console.log("🔄 Migrando función que usa serve()...");

  // Paso 1: Los imports ya están presentes, verificar
  if (!migratedContent.includes("withCors")) {
    console.log("❌ withCors import no encontrado");
    return { content: migratedContent, changes: 0 };
  }

  // Paso 2: Reemplazar serve() con export default withCors()
  const servePattern = /serve\(async \(req\) => \{([\s\S]*?)\}\);?\s*$/;
  const serveMatch = migratedContent.match(servePattern);

  if (serveMatch) {
    const serveBody = serveMatch[1];

    // Crear nueva estructura
    const newExport = `export default withCors(async (req: Request) => {${serveBody}});`;

    migratedContent = migratedContent.replace(servePattern, newExport);
    changes++;
    console.log("✅ serve() reemplazado por export default withCors()");
  }

  // Paso 3: Eliminar import de serve si ya no se usa
  const serveImportPattern =
    /import \{ serve \} from "https:\/\/deno\.land\/std@[\d.]+\/http\/server\.ts";\n?/;
  if (
    serveImportPattern.test(migratedContent) &&
    !migratedContent.includes("serve(")
  ) {
    migratedContent = migratedContent.replace(serveImportPattern, "");
    changes++;
    console.log("✅ Import de serve eliminado");
  }

  // Paso 4: Limpiar cualquier headers manual restante que tenga corsHeaders pattern
  const headersPattern =
    /headers:\s*\{\s*\.\.\.{\s*"Content-Type":\s*"application\/json"\s*},\s*"Content-Type":\s*"application\/json"\s*\}/g;
  migratedContent = migratedContent.replace(headersPattern, () => {
    changes++;
    return 'headers: { "Content-Type": "application/json" }';
  });

  // Paso 5: Reemplazar Response manuales por funciones CORS
  const responsePatterns = [
    // new Response con status y headers manuales
    {
      pattern:
        /new Response\(JSON\.stringify\(([^)]+)\),\s*\{\s*status:\s*(\d+),\s*headers:\s*\{[^}]*"Content-Type"[^}]*\}\s*\}/g,
      replace: (match, content, status) => {
        changes++;
        if (status === "200") {
          return `createCorsJsonResponse(${content})`;
        } else {
          return `createCorsErrorResponse(${content}, ${status})`;
        }
      },
    },
    // new Response simple
    {
      pattern:
        /new Response\(JSON\.stringify\(([^)]+)\),\s*\{\s*headers:\s*\{[^}]*"Content-Type"[^}]*\}\s*\}/g,
      replace: (match, content) => {
        changes++;
        return `createCorsJsonResponse(${content})`;
      },
    },
  ];

  responsePatterns.forEach(({ pattern, replace }) => {
    migratedContent = migratedContent.replace(pattern, replace);
  });

  return { content: migratedContent, changes };
}

function processOrderDetail() {
  const functionPath = path.join(functionsDir, functionName, "index.ts");

  if (!fs.existsSync(functionPath)) {
    console.log(`❌ Función ${functionName} no encontrada en ${functionPath}`);
    return false;
  }

  console.log(`🔄 Corrigiendo función: ${functionName}`);
  console.log(`📂 Archivo: ${functionPath}`);

  // Crear backup
  const backupPath = createBackup(functionPath);

  try {
    // Leer contenido actual
    const originalContent = fs.readFileSync(functionPath, "utf8");

    // Verificar estado actual
    const hasServe = originalContent.includes("serve(");
    const hasWithCors = originalContent.includes("withCors");
    const hasExportDefault = originalContent.includes("export default");

    console.log(`📊 Estado actual:`);
    console.log(`   - Usa serve(): ${hasServe}`);
    console.log(`   - Tiene withCors: ${hasWithCors}`);
    console.log(`   - Tiene export default: ${hasExportDefault}`);

    if (!hasServe && hasExportDefault && hasWithCors) {
      console.log(`✅ ${functionName}: Ya está correctamente configurada`);
      fs.unlinkSync(backupPath); // Eliminar backup innecesario
      return true;
    }

    // Migrar función
    const { content: migratedContent, changes } =
      migrateServeFunction(originalContent);

    // Verificar que el contenido cambió
    if (changes === 0) {
      console.log(`⚠️ ${functionName}: No se realizaron cambios`);
      fs.unlinkSync(backupPath);
      return false;
    }

    // Validar que el archivo resultante es válido
    if (migratedContent.length < originalContent.length * 0.5) {
      throw new Error("El archivo resultante es sospechosamente pequeño");
    }

    // Verificar que tiene la estructura correcta
    if (!migratedContent.includes("export default withCors")) {
      throw new Error("La estructura export default withCors no está presente");
    }

    // Escribir archivo migrado
    fs.writeFileSync(functionPath, migratedContent);

    // Verificar resultado final
    const finalHasServe = migratedContent.includes("serve(");
    const finalHasWithCors = migratedContent.includes("withCors");
    const finalHasExportDefault = migratedContent.includes("export default");

    console.log(
      `✅ ${functionName}: Corrección completada con ${changes} cambios`
    );
    console.log(`📊 Estado final:`);
    console.log(`   - Usa serve(): ${finalHasServe}`);
    console.log(`   - Tiene withCors: ${finalHasWithCors}`);
    console.log(`   - Tiene export default: ${finalHasExportDefault}`);

    return true;
  } catch (error) {
    console.error(`❌ Error corrigiendo ${functionName}:`, error.message);

    // Restaurar backup en caso de error
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, functionPath);
      console.log(`🔄 Backup restaurado para ${functionName}`);
    }

    return false;
  }
}

function main() {
  console.log("🔧 CORRECCIÓN DE ORDER-DETAIL SERVE()");
  console.log("=====================================");
  console.log(`📂 Directorio: ${functionsDir}`);
  console.log(`🎯 Función: ${functionName}`);

  const success = processOrderDetail();

  console.log("\n📊 RESUMEN:");
  console.log("===========");

  if (success) {
    console.log("✅ Corrección completada exitosamente");
    console.log("🎉 order-detail ahora usa export default withCors()");
  } else {
    console.log("❌ La corrección falló");
    console.log("⚠️ Revisa los logs anteriores para más detalles");
  }
}

main();
