import { runSupabaseTests, displayTestResults } from "../utils/supabaseTest";

/**
 * Script de configuración inicial para Supabase
 * Ejecuta este archivo para validar tu configuración
 */

const setupSupabase = async () => {
  console.log("🚀 Iniciando configuración de Supabase...\n");

  console.log("📋 Pasos de configuración:");
  console.log("1. ✅ Archivos de configuración creados");
  console.log("2. ⏳ Validando configuración...\n");

  // Ejecutar tests
  const results = await runSupabaseTests();
  displayTestResults(results);

  // Mostrar siguiente pasos basados en resultados
  console.log("\n🎯 Siguiente pasos según el plan:");
  console.log("================================");

  if (!results.configurationValid) {
    console.log("❌ PASO CRÍTICO: Configurar variables de entorno");
    console.log("   1. Abre el archivo AG-PYMEs/.env");
    console.log("   2. Reemplaza TU_SUPABASE_URL con tu URL de Supabase");
    console.log("   3. Reemplaza TU_ANON_KEY con tu clave anónima de Supabase");
    console.log("   4. Guarda el archivo y ejecuta este script nuevamente\n");

    console.log("💡 Cómo obtener las credenciales:");
    console.log("   1. Ve a https://supabase.com/dashboard");
    console.log("   2. Selecciona tu proyecto");
    console.log("   3. Ve a Settings > API");
    console.log('   4. Copia "Project URL" y "anon public key"\n');
  } else {
    console.log("✅ Configuración de variables de entorno completa");
  }

  if (!results.connection) {
    console.log("❌ PROBLEMA: No se puede conectar a Supabase");
    console.log("   • Verifica que las credenciales sean correctas");
    console.log("   • Asegúrate de que el proyecto Supabase esté activo");
    console.log("   • Revisa la conexión a internet\n");
  } else {
    console.log("✅ Conexión a Supabase establecida");
  }

  if (!results.register) {
    console.log("⚠️  SIGUIENTE: Desplegar Edge Functions");
    console.log("   1. Ve a Supabase Dashboard > Edge Functions");
    console.log('   2. Crea una nueva función llamada "companies"');
    console.log("   3. Copia el código de docs/companies.js");
    console.log('   4. Crea una nueva función llamada "register"');
    console.log("   5. Copia el código de docs/register.js");
    console.log("   6. Ejecuta este script nuevamente para validar\n");
  } else {
    console.log("✅ Edge Functions disponibles");
  }

  if (results.connection && results.configurationValid) {
    console.log("🎉 ¡Configuración básica completada!");
    console.log("\n📋 Checklist Día 1:");
    console.log(
      `   ${results.connection ? "✅" : "❌"} Supabase client configurado`
    );
    console.log(
      `   ${results.configurationValid ? "✅" : "❌"} Variables de entorno establecidas`
    );
    console.log(`   ${results.connection ? "✅" : "❌"} Conexión verificada`);
    console.log(
      `   ${results.register ? "✅" : "❌"} Edge Functions desplegadas`
    );

    console.log("\n🚀 Siguientes pasos:");
    console.log("   • Día 2: Migrar AuthContext a Supabase Auth");
    console.log("   • Día 3: Conectar CompanyContext con Edge Functions");
    console.log("   • Continuar con el plan de 7 días");
  }

  return results;
};

// Función para mostrar ayuda específica
export const showHelp = () => {
  console.log("🆘 Ayuda - Configuración de Supabase");
  console.log("=====================================\n");

  console.log("📁 Archivos creados:");
  console.log(
    "   • AG-PYMEs/config/supabase.js - Cliente y configuración principal"
  );
  console.log("   • AG-PYMEs/.env - Variables de entorno");
  console.log("   • AG-PYMEs/utils/supabaseTest.js - Tests de validación");
  console.log("   • docs/companies.js - Edge Function de companies");
  console.log("   • docs/register.js - Edge Function de registro\n");

  console.log("🔧 Variables de entorno requeridas:");
  console.log("   • EXPO_PUBLIC_SUPABASE_URL - URL de tu proyecto Supabase");
  console.log("   • EXPO_PUBLIC_SUPABASE_ANON_KEY - Clave anónima pública\n");

  console.log("📡 Edge Functions a desplegar:");
  console.log("   • companies - Gestión de empresas (docs/companies.js)");
  console.log("   • register - Registro multi-tenant (docs/register.js)\n");

  console.log("🧪 Para ejecutar tests manualmente:");
  console.log('   import { runSupabaseTests } from "./utils/supabaseTest";');
  console.log("   const results = await runSupabaseTests();\n");

  console.log("❓ ¿Problemas? Revisa:");
  console.log("   1. Las credenciales en .env son correctas");
  console.log("   2. El proyecto Supabase está activo");
  console.log("   3. Las Edge Functions están desplegadas");
  console.log("   4. Los permisos y RLS están configurados");
};

// Ejecutar configuración si es llamado directamente
if (require.main === module) {
  setupSupabase().catch(console.error);
}

export default setupSupabase;
