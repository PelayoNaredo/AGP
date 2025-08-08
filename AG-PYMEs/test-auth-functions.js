/**
 * 🧪 Script de Testing - Edge Functions Auth
 *
 * Fecha: 7 de agosto de 2025
 * Propósito: Probar las Edge Functions de register y login optimizadas
 *
 * CARACTERÍSTICAS:
 * ✅ Testing completo de register y login
 * ✅ Generación automática de emails @gmail.com
 * ✅ Contraseñas seguras (8+ chars, números, especiales)
 * ✅ Validación de responses
 * ✅ Manejo de errores detallado
 * ✅ Colores en consola para mejor UX
 */

const https = require("https");
const crypto = require("crypto");

// 🔧 Configuración desde .env
const config = {
  supabaseUrl: "https://kwuxtvgnzjqlrccftnru.supabase.co",
  anonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3dXh0dmduempxbHJjY2Z0bnJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwNDAzMzIsImV4cCI6MjA2OTYxNjMzMn0.jUJ_1atnxBJPbm0RILUEegIieBXxTzT-akZn83DNt8w",
};

// 🎨 Colores para la consola
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

function log(message, color = "reset") {
  console.log(colors[color] + message + colors.reset);
}

// 🔧 Generador de datos de prueba
function generateTestData() {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 1000);

  // Email formato @gmail.com
  const email = `testuser${timestamp}${randomNum}@gmail.com`;

  // Contraseña: 8+ caracteres, números y caracteres especiales
  const password = `Test${randomNum}@${timestamp.toString().slice(-4)}`;

  // Datos completos del usuario
  const userData = {
    email,
    password,
    nombre: `Test Usuario ${randomNum}`,
    apellido: `Apellido ${timestamp.toString().slice(-4)}`,
    telefono: `+34${Math.floor(Math.random() * 900000000 + 100000000)}`,
    empresa: `Test Company ${randomNum}`,
    direccion: `Calle Test ${randomNum}, Madrid`,
    tipo_empresa: "retail",
    tamano_empresa: "pequena",
  };

  log(`📧 Email generado: ${email}`, "cyan");
  log(`🔒 Password generado: ${password}`, "cyan");

  return userData;
}

// 🌐 Función para realizar peticiones HTTP con timeout
function makeRequest(
  endpoint,
  method,
  data = null,
  headers = {},
  timeout = 30000
) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint);

    const defaultHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.anonKey}`,
      apikey: config.anonKey,
      ...headers,
    };

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: defaultHeaders,
      timeout: timeout,
    };

    log(`🌐 ${method} ${endpoint}`, "blue");
    if (data) {
      log(`📦 Payload: ${JSON.stringify(data, null, 2)}`, "cyan");
    }

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers["Content-Length"] = Buffer.byteLength(jsonData);
    }

    // Timeout general
    const timeoutId = setTimeout(() => {
      reject(new Error(`Request timeout after ${timeout}ms`));
    }, timeout);

    const req = https.request(options, (res) => {
      clearTimeout(timeoutId);
      let responseData = "";

      log(
        `📡 Response Status: ${res.statusCode}`,
        res.statusCode < 300 ? "green" : "yellow"
      );

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};

          // Solo mostrar respuesta si no es muy grande (evitar spam de documentación API)
          if (responseData.length < 2000) {
            log(
              `📥 Response Data: ${JSON.stringify(parsedData, null, 2)}`,
              "cyan"
            );
          } else {
            log(
              `📥 Response Data: [Large response - ${responseData.length} chars] - Tipo: ${typeof parsedData}`,
              "cyan"
            );
          }

          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData,
          });
        } catch (parseError) {
          log(`⚠️ Parse Error: ${parseError.message}`, "yellow");

          // Solo mostrar respuesta raw si no es muy grande
          if (responseData.length < 1000) {
            log(`📄 Raw Response: ${responseData}`, "yellow");
          } else {
            log(
              `📄 Raw Response: [Large response - ${responseData.length} chars]`,
              "yellow"
            );
          }

          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData,
            parseError: true,
          });
        }
      });
    });

    req.on("error", (error) => {
      clearTimeout(timeoutId);
      log(`💥 Request Error: ${error.message}`, "red");
      reject(error);
    });

    req.on("timeout", () => {
      clearTimeout(timeoutId);
      req.destroy();
      reject(new Error("Request timeout"));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// 🔍 Test de conectividad básica (optimizado)
async function testConnectivity() {
  log(`\n🔍 Testing conectividad básica con Supabase`, "yellow");

  try {
    // Usar endpoint más ligero - solo verificar que Supabase responde
    const response = await makeRequest(
      `${config.supabaseUrl}/functions/v1/`,
      "GET",
      null,
      { Accept: "text/plain" }, // Evitar respuestas JSON pesadas
      5000 // 5 segundos timeout - más rápido
    );

    log(
      `📊 Status Code: ${response.statusCode}`,
      response.statusCode === 404 ? "green" : "yellow"
    );

    // Para Edge Functions, 404 es normal (significa que el servicio está activo)
    if (response.statusCode === 404 || response.statusCode === 200) {
      log(`✅ CONECTIVIDAD: Supabase Edge Functions accesible`, "green");
      return { success: true };
    } else if (response.statusCode >= 500) {
      log(
        `❌ CONECTIVIDAD: Error del servidor (${response.statusCode})`,
        "red"
      );
      return { success: false, statusCode: response.statusCode };
    } else {
      log(
        `⚠️ CONECTIVIDAD: Respuesta inesperada pero servicio accesible`,
        "yellow"
      );
      return { success: true, statusCode: response.statusCode };
    }
  } catch (error) {
    log(`❌ CONECTIVIDAD: Error de conexión`, "red");
    log(`📝 Error: ${error.message}`, "red");
    return { success: false, error: error.message };
  }
}

// 🧪 Test de la función Register
async function testRegister(userData) {
  log(`\n🔧 Testing Edge Function: REGISTER`, "yellow");
  log(`📍 Endpoint: ${config.supabaseUrl}/functions/v1/register`, "blue");

  // Datos para register (formato correcto para la Edge Function)
  const registerData = {
    email: userData.email,
    password: userData.password,
    nombre: userData.nombre,
    mode: "create",
    companyData: {
      companyName: userData.empresa,
      subscriptionPlan: "basic",
    },
  };

  try {
    const response = await makeRequest(
      `${config.supabaseUrl}/functions/v1/register`,
      "POST",
      registerData
    );

    log(
      `📊 Status Code: ${response.statusCode}`,
      response.statusCode === 201 ? "green" : "red"
    );

    if (response.statusCode === 201) {
      log(`✅ REGISTER: Usuario creado exitosamente`, "green");
      log(`👤 Usuario ID: ${response.data.user?.id || "N/A"}`, "cyan");
      log(`🏢 Empresa ID: ${response.data.company?.id || "N/A"}`, "cyan");
      return { success: true, data: response.data };
    } else {
      log(`❌ REGISTER: Error ${response.statusCode}`, "red");
      log(`📝 Error: ${JSON.stringify(response.data, null, 2)}`, "red");
      return { success: false, error: response.data };
    }
  } catch (error) {
    log(`💥 REGISTER: Error de conexión`, "red");
    log(`📝 Error: ${error.message}`, "red");
    return { success: false, error: error.message };
  }
}

// 🧪 Test de la función Login
async function testLogin(email, password) {
  log(`\n🔧 Testing Edge Function: LOGIN`, "yellow");
  log(`📍 Endpoint: ${config.supabaseUrl}/functions/v1/login`, "blue");

  const loginData = { email, password };

  try {
    const response = await makeRequest(
      `${config.supabaseUrl}/functions/v1/login`,
      "POST",
      loginData
    );

    log(
      `📊 Status Code: ${response.statusCode}`,
      response.statusCode === 200 ? "green" : "red"
    );

    if (response.statusCode === 200) {
      log(`✅ LOGIN: Autenticación exitosa`, "green");
      log(
        `🎫 Access Token: ${response.data.access_token ? "Recibido ✓" : "No recibido ✗"}`,
        "cyan"
      );
      log(
        `🎫 Refresh Token: ${response.data.refresh_token ? "Recibido ✓" : "No recibido ✗"}`,
        "cyan"
      );
      log(`👤 Usuario: ${response.data.user?.email || "N/A"}`, "cyan");
      return { success: true, data: response.data };
    } else {
      log(`❌ LOGIN: Error ${response.statusCode}`, "red");
      log(`📝 Error: ${JSON.stringify(response.data, null, 2)}`, "red");
      return { success: false, error: response.data };
    }
  } catch (error) {
    log(`💥 LOGIN: Error de conexión`, "red");
    log(`📝 Error: ${error.message}`, "red");
    return { success: false, error: error.message };
  }
}

// 🧪 Test de Login con credenciales incorrectas
async function testLoginInvalid() {
  log(`\n🔧 Testing Edge Function: LOGIN (Credenciales Inválidas)`, "yellow");

  const invalidData = {
    email: "invalid@gmail.com",
    password: "WrongPass123!",
  };

  try {
    const response = await makeRequest(
      `${config.supabaseUrl}/functions/v1/login`,
      "POST",
      invalidData
    );

    log(`📊 Status Code: ${response.statusCode}`, "blue");

    if (response.statusCode === 400 || response.statusCode === 401) {
      log(`✅ LOGIN INVALID: Error manejado correctamente`, "green");
      log(`📝 Mensaje: ${JSON.stringify(response.data, null, 2)}`, "cyan");
      return { success: true, expectedError: true };
    } else {
      log(
        `⚠️ LOGIN INVALID: Respuesta inesperada ${response.statusCode}`,
        "yellow"
      );
      return { success: false, unexpectedResponse: true };
    }
  } catch (error) {
    log(`💥 LOGIN INVALID: Error de conexión`, "red");
    return { success: false, error: error.message };
  }
}

// 🚀 Función principal de testing
async function runTests() {
  log(`🧪 INICIANDO TESTS DE EDGE FUNCTIONS AUTH`, "bright");
  log(`🕒 Fecha: ${new Date().toLocaleString("es-ES")}`, "blue");
  log(`🌐 Supabase URL: ${config.supabaseUrl}`, "blue");
  log(`═══════════════════════════════════════════════════`, "cyan");

  // 📊 Estadísticas
  let stats = {
    total: 0,
    passed: 0,
    failed: 0,
  };

  // ✅ Test 0: Conectividad básica
  stats.total++;
  log(`\n🧪 TEST 0/3: CONECTIVIDAD básica`, "magenta");
  const connectivityResult = await testConnectivity();
  if (connectivityResult.success) {
    stats.passed++;
    log(`✅ TEST 0 PASSED`, "green");
  } else {
    stats.failed++;
    log(`❌ TEST 0 FAILED - Sin conectividad, abortando tests`, "red");
    return { aborted: true, reason: "No connectivity" };
  }

  // 🔧 Generar datos de prueba
  const userData = generateTestData();

  // ✅ Test 1: Register
  stats.total++;
  log(`\n🧪 TEST 1/3: REGISTER con datos válidos`, "magenta");
  const registerResult = await testRegister(userData);
  if (registerResult.success) {
    stats.passed++;
    log(`✅ TEST 1 PASSED`, "green");
  } else {
    stats.failed++;
    log(`❌ TEST 1 FAILED`, "red");
  }

  // ⏱️ Pausa entre tests
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // ✅ Test 2: Login válido (solo si register fue exitoso)
  stats.total++;
  log(`\n🧪 TEST 2/3: LOGIN con credenciales válidas`, "magenta");
  if (registerResult.success) {
    const loginResult = await testLogin(userData.email, userData.password);
    if (loginResult.success) {
      stats.passed++;
      log(`✅ TEST 2 PASSED`, "green");
    } else {
      stats.failed++;
      log(`❌ TEST 2 FAILED`, "red");
    }
  } else {
    log(`⏭️ TEST 2 SKIPPED (Register falló)`, "yellow");
    stats.failed++;
  }

  // ⏱️ Pausa entre tests
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // ✅ Test 3: Login inválido
  stats.total++;
  log(`\n🧪 TEST 3/3: LOGIN con credenciales inválidas`, "magenta");
  const loginInvalidResult = await testLoginInvalid();
  if (loginInvalidResult.success) {
    stats.passed++;
    log(`✅ TEST 3 PASSED`, "green");
  } else {
    stats.failed++;
    log(`❌ TEST 3 FAILED`, "red");
  }

  // 📊 Reporte final
  log(`\n═══════════════════════════════════════════════════`, "cyan");
  log(`📊 REPORTE FINAL DE TESTS`, "bright");
  log(`═══════════════════════════════════════════════════`, "cyan");
  log(`📈 Total de tests: ${stats.total}`, "blue");
  log(`✅ Tests pasados: ${stats.passed}`, "green");
  log(`❌ Tests fallidos: ${stats.failed}`, "red");

  const successRate = Math.round((stats.passed / stats.total) * 100);
  log(
    `📊 Tasa de éxito: ${successRate}%`,
    successRate >= 80 ? "green" : successRate >= 60 ? "yellow" : "red"
  );

  if (stats.passed === stats.total) {
    log(
      `\n🎉 ¡TODOS LOS TESTS PASARON! Edge Functions funcionando correctamente`,
      "green"
    );
  } else {
    log(`\n⚠️ Algunos tests fallaron. Revisar las Edge Functions.`, "yellow");
  }

  log(
    `\n🔗 Dashboard: https://supabase.com/dashboard/project/kwuxtvgnzjqlrccftnru/functions`,
    "cyan"
  );
  log(`🏁 Testing completado.`, "blue");
}

// 🎬 Ejecutar tests
if (require.main === module) {
  runTests().catch((error) => {
    log(`💥 Error crítico en el testing: ${error.message}`, "red");
    process.exit(1);
  });
}

module.exports = { runTests, testRegister, testLogin };
