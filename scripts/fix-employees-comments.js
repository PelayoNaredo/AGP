const fs = require("fs");
const path = require("path");

console.log("🔧 Arreglando comentarios inválidos en employees/index.ts...");

const filePath = path.join(
  __dirname,
  "..",
  "AG-PYMEs",
  "supabase",
  "functions",
  "employees",
  "index.ts"
);

try {
  let content = fs.readFileSync(filePath, "utf8");

  // Remover comentarios inválidos que quedaron en las respuestas JSON
  const fixedContent = content
    // Arreglar casos donde quedó el comentario en lugar de la estructura JSON
    .replace(
      /return new Response\(JSON\.stringify\(([^)]+)\),\s*{\s*status:\s*(\d+),\s*headers:\s*{\s*"Content-Type":\s*"application\/json",\s*\/\*\s*CORS\s*handled\s*by\s*withCors\s*wrapper\s*\*\/,?\s*}\s*}\);/g,
      "return createCorsJsonResponse($1, $2);"
    )
    // Remover cualquier comentario CORS residual
    .replace(/\/\*\s*CORS\s*handled\s*by\s*withCors\s*wrapper\s*\*\/,?/g, "")
    // Limpiar líneas vacías extra
    .replace(/\n\s*\n\s*\n/g, "\n\n");

  fs.writeFileSync(filePath, fixedContent);

  console.log("✅ Comentarios inválidos eliminados exitosamente");
  console.log("📁 Archivo actualizado:", filePath);
} catch (error) {
  console.error("❌ Error al procesar el archivo:", error.message);
  process.exit(1);
}
