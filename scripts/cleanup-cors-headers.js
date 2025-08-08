/**
 * Script para completar la limpieza de corsHeaders restantes
 */

const fs = require("fs");
const path = require("path");

const functionsToClean = [
  "clients",
  "expenses",
  "income",
  "inventory",
  "leaves",
  "appointments",
  "employees",
  "orders",
  "sales",
  "shifts",
];

function cleanupCorsHeaders(functionName) {
  const filePath = path.join(
    __dirname,
    "..",
    "AG-PYMEs",
    "supabase",
    "functions",
    functionName,
    "index.ts"
  );

  if (!fs.existsSync(filePath)) {
    console.log(`❌ Archivo no encontrado: ${functionName}`);
    return false;
  }

  let content = fs.readFileSync(filePath, "utf8");
  const originalContent = content;

  // Patrones más específicos para limpiar corsHeaders restantes
  const cleanupPatterns = [
    // OPTIONS simple
    {
      search: /return new Response\("ok", \{ headers: corsHeaders \}\);/g,
      replace: 'return new Response("ok");',
    },

    // Respuestas de error con corsHeaders en catch blocks
    {
      search:
        /return new Response\(\s*JSON\.stringify\(\{\s*error: ([^}]+)\s*\}\),\s*\{\s*status: (\d+),\s*headers: \{ \.\.\.corsHeaders, "Content-Type": "application\/json" \},?\s*\}\s*\);/g,
      replace: 'return createCorsErrorResponse($1.replace(/"/g, ""), $2);',
    },

    // Respuestas de error con message
    {
      search:
        /return new Response\(\s*JSON\.stringify\(\{\s*message: "([^"]+)"\s*\}\),\s*\{\s*status: (\d+),\s*headers: \{ \.\.\.corsHeaders, "Content-Type": "application\/json" \},?\s*\}\s*\);/g,
      replace: 'return createCorsErrorResponse("$1", $2);',
    },

    // Respuestas con error variable
    {
      search:
        /return new Response\(\s*JSON\.stringify\(\{\s*error: error\.message\s*\}\),\s*\{\s*status: (\d+),\s*headers: \{ \.\.\.corsHeaders, "Content-Type": "application\/json" \},?\s*\}\s*\);/g,
      replace: "return createCorsErrorResponse(error.message, $1);",
    },

    // Cualquier referencia restante a corsHeaders en headers
    {
      search:
        /headers: \{ \.\.\.corsHeaders, "Content-Type": "application\/json" \}/g,
      replace: "/* CORS handled by withCors wrapper */",
    },
  ];

  cleanupPatterns.forEach((pattern) => {
    content = content.replace(pattern.search, pattern.replace);
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ ${functionName} limpiada`);
    return true;
  } else {
    console.log(`⚠️ ${functionName} no requiere limpieza adicional`);
    return false;
  }
}

function main() {
  console.log("🧹 Iniciando limpieza de corsHeaders restantes...\n");

  let cleaned = 0;

  functionsToClean.forEach((functionName) => {
    try {
      if (cleanupCorsHeaders(functionName)) {
        cleaned++;
      }
    } catch (error) {
      console.log(`❌ Error en ${functionName}: ${error.message}`);
    }
  });

  console.log(`\n📊 Limpieza completada: ${cleaned} funciones actualizadas`);
}

main();
