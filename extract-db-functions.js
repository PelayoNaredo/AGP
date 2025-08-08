#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Configuración
const config = {
  migrationsPath: "./AG-PYMEs/supabase/migrations",
  outputFile: "./AG-PYMEs/Database_Funciones_y_Triggers_Complete.md",
  useSupabaseCLI: process.argv.includes("--use-cli"),
  verbose: process.argv.includes("--verbose"),
};

// Utilidades
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  warn: (msg) => console.log(`⚠️  ${msg}`),
  verbose: (msg) => config.verbose && console.log(`🔍 ${msg}`),
};

// Función para extraer funciones de un archivo SQL
function extractFunctionsFromSQL(sqlContent, fileName) {
  const functions = [];
  const triggers = [];

  // Regex para encontrar funciones
  const functionRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+([^\s(]+)/gi;
  const triggerRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?TRIGGER\s+([^\s]+)/gi;

  let match;

  // Extraer funciones
  while ((match = functionRegex.exec(sqlContent)) !== null) {
    const functionName = match[1];
    const startIndex = match.index;

    // Buscar el final de la función (buscar el próximo $$; o END;)
    const endPattern = /\$\$;|END\s*;/gi;
    endPattern.lastIndex = startIndex;
    const endMatch = endPattern.exec(sqlContent);

    if (endMatch) {
      const functionContent = sqlContent.substring(
        startIndex,
        endMatch.index + endMatch[0].length
      );
      functions.push({
        name: functionName,
        content: functionContent,
        file: fileName,
        startLine: sqlContent.substring(0, startIndex).split("\n").length,
      });
    }
  }

  // Extraer triggers
  while ((match = triggerRegex.exec(sqlContent)) !== null) {
    const triggerName = match[1];
    const startIndex = match.index;

    // Buscar el final del trigger (buscar el próximo ;)
    let endIndex = sqlContent.indexOf(";", startIndex);
    if (endIndex === -1) endIndex = sqlContent.length;

    const triggerContent = sqlContent.substring(startIndex, endIndex + 1);
    triggers.push({
      name: triggerName,
      content: triggerContent,
      file: fileName,
      startLine: sqlContent.substring(0, startIndex).split("\n").length,
    });
  }

  return { functions, triggers };
}

// Función para analizar archivos de migración
function analyzeMigrations() {
  log.info("Analizando archivos de migración...");

  if (!fs.existsSync(config.migrationsPath)) {
    log.error(
      `No se encontró la carpeta de migraciones: ${config.migrationsPath}`
    );
    return { functions: [], triggers: [], files: [] };
  }

  const migrationFiles = fs
    .readdirSync(config.migrationsPath)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  log.info(`Encontrados ${migrationFiles.length} archivos de migración`);

  const allFunctions = [];
  const allTriggers = [];
  const processedFiles = [];

  migrationFiles.forEach((fileName) => {
    const filePath = path.join(config.migrationsPath, fileName);
    log.verbose(`Procesando: ${fileName}`);

    try {
      const content = fs.readFileSync(filePath, "utf8");
      const { functions, triggers } = extractFunctionsFromSQL(
        content,
        fileName
      );

      allFunctions.push(...functions);
      allTriggers.push(...triggers);

      processedFiles.push({
        name: fileName,
        path: filePath,
        content: content,
        functions: functions.length,
        triggers: triggers.length,
        size: content.length,
      });

      if (functions.length > 0 || triggers.length > 0) {
        log.success(
          `${fileName}: ${functions.length} funciones, ${triggers.length} triggers`
        );
      }
    } catch (error) {
      log.error(`Error procesando ${fileName}: ${error.message}`);
    }
  });

  return {
    functions: allFunctions,
    triggers: allTriggers,
    files: processedFiles,
  };
}

// Función para extraer con Supabase CLI
function extractWithSupabaseCLI() {
  log.info("Intentando extraer con Supabase CLI...");

  try {
    // Verificar si Supabase CLI está disponible
    execSync("supabase --version", { stdio: "pipe" });
    log.success("Supabase CLI encontrado");

    // Cambiar al directorio AG-PYMEs
    process.chdir("./AG-PYMEs");

    // Extraer esquema
    log.info("Extrayendo esquema de la base de datos...");
    const schema = execSync("supabase db dump -s public", {
      encoding: "utf8",
      timeout: 30000, // 30 segundos timeout
    });

    // Volver al directorio original
    process.chdir("..");

    log.success("Esquema extraído exitosamente");

    // Extraer funciones y triggers del esquema
    const { functions, triggers } = extractFunctionsFromSQL(
      schema,
      "supabase-cli-dump"
    );

    return {
      success: true,
      schema: schema,
      functions: functions,
      triggers: triggers,
    };
  } catch (error) {
    log.warn(`No se pudo usar Supabase CLI: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Función para generar la documentación
function generateDocumentation(migrationData, cliData) {
  const now = new Date().toLocaleString("es-ES");

  let content = `# 🗄️ Base de Datos: Funciones y Triggers Completas

*Generado automáticamente el ${now}*

## 📊 Resumen del Sistema

### 🎯 Información General
- **Archivos de migración analizados**: ${migrationData.files.length}
- **Funciones encontradas en migraciones**: ${migrationData.functions.length}
- **Triggers encontrados en migraciones**: ${migrationData.triggers.length}`;

  if (cliData && cliData.success) {
    content += `
- **Extracción con Supabase CLI**: ✅ Exitosa
- **Funciones encontradas en CLI**: ${cliData.functions.length}
- **Triggers encontrados en CLI**: ${cliData.triggers.length}`;
  } else {
    content += `
- **Extracción con Supabase CLI**: ❌ No disponible`;
  }

  content += `

### 📋 Ubicaciones
- **Migraciones**: \`AG-PYMEs/supabase/migrations/\`
- **Archivos analizados**: ${migrationData.files.map((f) => f.name).join(", ")}

---

## 🔧 Funciones Encontradas

### 📁 Desde Archivos de Migración

`;

  // Documentar funciones de migraciones
  if (migrationData.functions.length > 0) {
    migrationData.functions.forEach((func) => {
      content += `
#### 🔹 \`${func.name}\`

**📄 Archivo**: \`${func.file}\` (línea ${func.startLine})

\`\`\`sql
${func.content}
\`\`\`

---
`;
    });
  } else {
    content += `
*No se encontraron funciones en los archivos de migración.*

`;
  }

  // Documentar funciones del CLI si están disponibles
  if (cliData && cliData.success && cliData.functions.length > 0) {
    content += `
### 🌐 Desde Supabase CLI (Base de Datos Actual)

`;
    cliData.functions.forEach((func) => {
      content += `
#### 🔹 \`${func.name}\` (Base de Datos)

\`\`\`sql
${func.content}
\`\`\`

---
`;
    });
  }

  content += `
## ⚡ Triggers Encontrados

### 📁 Desde Archivos de Migración

`;

  // Documentar triggers de migraciones
  if (migrationData.triggers.length > 0) {
    migrationData.triggers.forEach((trigger) => {
      content += `
#### 🔸 \`${trigger.name}\`

**📄 Archivo**: \`${trigger.file}\` (línea ${trigger.startLine})

\`\`\`sql
${trigger.content}
\`\`\`

---
`;
    });
  } else {
    content += `
*No se encontraron triggers en los archivos de migración.*

`;
  }

  // Documentar triggers del CLI si están disponibles
  if (cliData && cliData.success && cliData.triggers.length > 0) {
    content += `
### 🌐 Desde Supabase CLI (Base de Datos Actual)

`;
    cliData.triggers.forEach((trigger) => {
      content += `
#### 🔸 \`${trigger.name}\` (Base de Datos)

\`\`\`sql
${trigger.content}
\`\`\`

---
`;
    });
  }

  content += `
## 📋 Detalle de Archivos de Migración

`;

  // Documentar cada archivo de migración
  migrationData.files.forEach((file) => {
    content += `
### 📄 ${file.name}

- **Tamaño**: ${file.size} caracteres
- **Funciones**: ${file.functions}
- **Triggers**: ${file.triggers}

<details>
<summary>👁️ Ver contenido completo</summary>

\`\`\`sql
${file.content}
\`\`\`

</details>

---
`;
  });

  content += `
## 📊 Consultas SQL para Extracción Manual

### 🔍 Consulta 1: Todas las Funciones Personalizadas

\`\`\`sql
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_functiondef(p.oid) as function_definition,
    obj_description(p.oid, 'pg_proc') as description,
    CASE 
        WHEN p.provolatile = 'i' THEN 'IMMUTABLE'
        WHEN p.provolatile = 's' THEN 'STABLE'
        WHEN p.provolatile = 'v' THEN 'VOLATILE'
    END as volatility,
    CASE p.prosecdef 
        WHEN true THEN 'SECURITY DEFINER'
        ELSE 'SECURITY INVOKER'
    END as security
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'auth')
  AND p.prokind = 'f'
  AND NOT EXISTS (
    SELECT 1 FROM pg_depend d 
    WHERE d.objid = p.oid 
    AND d.deptype = 'e'
  )
ORDER BY n.nspname, p.proname;
\`\`\`

### 🔍 Consulta 2: Todos los Triggers

\`\`\`sql
SELECT 
    t.schemaname,
    t.tablename,
    t.triggername,
    pg_get_triggerdef(tr.oid) as trigger_definition,
    obj_description(tr.oid, 'pg_trigger') as description,
    CASE t.tgtype & 66
        WHEN 2 THEN 'BEFORE'
        WHEN 64 THEN 'AFTER'
        WHEN 66 THEN 'INSTEAD OF'
    END as timing,
    CASE t.tgtype & 28
        WHEN 4 THEN 'INSERT'
        WHEN 8 THEN 'DELETE'
        WHEN 16 THEN 'UPDATE'
        WHEN 12 THEN 'INSERT, DELETE'
        WHEN 20 THEN 'INSERT, UPDATE'
        WHEN 24 THEN 'DELETE, UPDATE'
        WHEN 28 THEN 'INSERT, DELETE, UPDATE'
    END as events
FROM pg_trigger tr
JOIN pg_class c ON tr.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_stat_user_tables t ON t.schemaname = n.nspname AND t.tablename = c.relname
WHERE n.nspname = 'public'
  AND NOT tr.tgisinternal
ORDER BY t.schemaname, t.tablename, t.triggername;
\`\`\`

## 🚀 Comandos de Extracción

### Usando Supabase CLI:
\`\`\`bash
# Extraer esquema completo
cd AG-PYMEs
supabase db dump --schema public --schema-only

# Filtrar solo funciones
supabase db dump --schema public --schema-only | grep -A 50 "CREATE.*FUNCTION"

# Filtrar solo triggers
supabase db dump --schema public --schema-only | grep -A 20 "CREATE.*TRIGGER"
\`\`\`

### Usando este script:
\`\`\`bash
# Solo migraciones
node extract-db-functions.js

# Con Supabase CLI
node extract-db-functions.js --use-cli

# Modo verbose
node extract-db-functions.js --verbose --use-cli
\`\`\`

---

## 📝 Instrucciones de Uso

### ✅ Para Ejecutar este Script:

1. **Instalar dependencias** (si es necesario):
   \`\`\`bash
   npm install
   \`\`\`

2. **Ejecutar análisis básico**:
   \`\`\`bash
   node extract-db-functions.js
   \`\`\`

3. **Ejecutar con Supabase CLI**:
   \`\`\`bash
   node extract-db-functions.js --use-cli
   \`\`\`

4. **Modo detallado**:
   \`\`\`bash
   node extract-db-functions.js --verbose --use-cli
   \`\`\`

### 🎯 Características del Script:

- ✅ **Análisis de migraciones**: Escanea todos los archivos .sql
- ✅ **Extracción con CLI**: Usa Supabase CLI si está disponible
- ✅ **Detección automática**: Encuentra funciones y triggers
- ✅ **Documentación completa**: Genera markdown estructurado
- ✅ **Manejo de errores**: Continúa aunque falte CLI
- ✅ **Modo verbose**: Información detallada del proceso

---

*📅 Última actualización: ${now}*
*🤖 Generado por: extract-db-functions.js (Node.js)*
*📊 Análisis automático de ${migrationData.files.length} archivos de migración*
`;

  return content;
}

// Función principal
async function main() {
  log.info("🚀 Iniciando extracción de funciones y triggers de Supabase...");

  try {
    // Analizar migraciones
    const migrationData = analyzeMigrations();

    // Intentar extracción con CLI si se especifica
    let cliData = null;
    if (config.useSupabaseCLI) {
      cliData = extractWithSupabaseCLI();
    }

    // Generar documentación
    log.info("📝 Generando documentación...");
    const documentation = generateDocumentation(migrationData, cliData);

    // Guardar archivo
    const outputPath = path.resolve(config.outputFile);
    fs.writeFileSync(outputPath, documentation, "utf8");

    // Mostrar resumen
    log.success(`Documentación generada: ${config.outputFile}`);
    log.info(`📊 Resumen:`);
    log.info(`   - Archivos analizados: ${migrationData.files.length}`);
    log.info(`   - Funciones encontradas: ${migrationData.functions.length}`);
    log.info(`   - Triggers encontrados: ${migrationData.triggers.length}`);

    if (cliData && cliData.success) {
      log.info(`   - CLI funciones: ${cliData.functions.length}`);
      log.info(`   - CLI triggers: ${cliData.triggers.length}`);
    }

    log.success("🎉 Script completado exitosamente!");
  } catch (error) {
    log.error(`Error durante la ejecución: ${error.message}`);
    if (config.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Verificar argumentos y mostrar ayuda
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
🗄️  Extract DB Functions - Extractor de funciones y triggers de Supabase

Uso:
  node extract-db-functions.js [opciones]

Opciones:
  --use-cli     Intentar usar Supabase CLI para extraer desde la BD
  --verbose     Mostrar información detallada del proceso
  --help, -h    Mostrar esta ayuda

Ejemplos:
  node extract-db-functions.js                    # Solo migraciones
  node extract-db-functions.js --use-cli          # Con Supabase CLI
  node extract-db-functions.js --verbose --use-cli # Modo detallado

Salida:
  ${config.outputFile}
`);
  process.exit(0);
}

// Ejecutar script
if (require.main === module) {
  main();
}

module.exports = {
  extractFunctionsFromSQL,
  analyzeMigrations,
  generateDocumentation,
};
