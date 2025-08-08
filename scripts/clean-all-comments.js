const fs = require("fs");
const path = require("path");

console.log("🔧 Limpiando comentarios inválidos en todas las funciones...");

const functionsDir = path.join(
  __dirname,
  "..",
  "AG-PYMEs",
  "supabase",
  "functions"
);
const functionNames = ["clients", "employees", "expenses", "inventory"];

functionNames.forEach((functionName) => {
  const filePath = path.join(functionsDir, functionName, "index.ts");

  if (fs.existsSync(filePath)) {
    console.log(`📁 Procesando ${functionName}/index.ts...`);

    try {
      let content = fs.readFileSync(filePath, "utf8");

      // Remover comentarios inválidos que quedaron en las respuestas JSON
      const fixedContent = content
        // Remover cualquier comentario CORS residual
        .replace(
          /\/\*\s*CORS\s*handled\s*by\s*withCors\s*wrapper\s*\*\/,?/g,
          ""
        )
        // Limpiar líneas vacías extra
        .replace(/\n\s*\n\s*\n/g, "\n\n")
        // Limpiar espacios en blanco al final de líneas
        .replace(/[ \t]+$/gm, "");

      fs.writeFileSync(filePath, fixedContent);
      console.log(`✅ ${functionName} limpiado exitosamente`);
    } catch (error) {
      console.error(`❌ Error al procesar ${functionName}:`, error.message);
    }
  } else {
    console.warn(`⚠️ No se encontró ${functionName}/index.ts`);
  }
});

console.log("🎉 Limpieza completada para todas las funciones");
