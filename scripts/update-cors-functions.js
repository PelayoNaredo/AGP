/**
 * Script para automatizar la actualización CORS de Edge Functions
 * Actualiza las 11 funciones restantes de forma eficiente
 */

const fs = require("fs");
const path = require("path");

// Funciones que necesitan actualización
const pendingFunctions = [
  "clients",
  "expenses",
  "income",
  "inventory",
  "leaves",
  "appointments",
  "employees",
  "orders",
  "sales",
  "services",
  "shifts",
];

// Patrones a reemplazar
const patterns = [
  // Importaciones CORS
  {
    search:
      /import { serve } from "https:\/\/deno\.land\/std@0\.168\.0\/http\/server\.ts";\nimport { createClient } from "[^"]+";(\nimport { getUserAndCompanyId } from "[^"]+";)?\n\nconst corsHeaders = \{[\s\S]*?\};/g,
    replace: `import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getUserAndCompanyId } from "../_shared/auth-utils.ts";
import { withCors, createCorsJsonResponse, createCorsErrorResponse } from "../_shared/cors.ts";`,
  },

  // serve() function
  {
    search: /serve\(async \(req\) => \{/g,
    replace: "serve(withCors(async (req) => {",
  },

  // Cierre de función
  {
    search: /\}\);$/g,
    replace: "}));",
  },

  // Respuestas exitosas simples (status 200)
  {
    search:
      /return new Response\(JSON\.stringify\(([^)]+)\), \{\s*status: 200,\s*headers: \{ \.\.\.corsHeaders, "Content-Type": "application\/json" \},?\s*\}\);/g,
    replace: "return createCorsJsonResponse($1, 200);",
  },

  // Respuestas exitosas con status 201
  {
    search:
      /return new Response\(JSON\.stringify\(([^)]+)\), \{\s*status: 201,\s*headers: \{ \.\.\.corsHeaders, "Content-Type": "application\/json" \},?\s*\}\);/g,
    replace: "return createCorsJsonResponse($1, 201);",
  },

  // Respuestas de error simples
  {
    search:
      /return new Response\(\s*JSON\.stringify\(\{\s*error: "([^"]+)"\s*\}\),\s*\{\s*status: (\d+),\s*headers: \{ \.\.\.corsHeaders, "Content-Type": "application\/json" \},?\s*\}\s*\);/g,
    replace: 'return createCorsErrorResponse("$1", $2);',
  },
];

function updateFunction(functionName) {
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

  // Aplicar patrones
  patterns.forEach((pattern) => {
    content = content.replace(pattern.search, pattern.replace);
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ ${functionName} actualizada`);
    return true;
  } else {
    console.log(
      `⚠️ ${functionName} no requiere cambios o usa patrón diferente`
    );
    return false;
  }
}

function main() {
  console.log("🚀 Iniciando actualización automática de CORS...\n");

  let updated = 0;
  let errors = 0;

  pendingFunctions.forEach((functionName) => {
    try {
      if (updateFunction(functionName)) {
        updated++;
      }
    } catch (error) {
      console.log(`❌ Error en ${functionName}: ${error.message}`);
      errors++;
    }
  });

  console.log(`\n📊 Resumen:`);
  console.log(`✅ Actualizadas: ${updated}`);
  console.log(`⚠️ Sin cambios: ${pendingFunctions.length - updated - errors}`);
  console.log(`❌ Errores: ${errors}`);
}

main();
