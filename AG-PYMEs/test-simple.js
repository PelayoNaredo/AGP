/**
 * 🧪 Test Simple de Edge Functions
 * Verificación básica de conectividad
 */

const https = require("https");

const config = {
  supabaseUrl: "https://kwuxtvgnzjqlrccftnru.supabase.co",
  anonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3dXh0dmduempxbHJjY2Z0bnJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwNDAzMzIsImV4cCI6MjA2OTYxNjMzMn0.jUJ_1atnxBJPbm0RILUEegIieBXxTzT-akZn83DNt8w",
};

function makeRequest(endpoint, method, data = null, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint);

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.anonKey}`,
        apikey: config.anonKey,
      },
      timeout: timeout,
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers["Content-Length"] = Buffer.byteLength(jsonData);
    }

    const timeoutId = setTimeout(() => {
      reject(new Error(`Timeout after ${timeout}ms`));
    }, timeout);

    const req = https.request(options, (res) => {
      clearTimeout(timeoutId);
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};
          resolve({
            statusCode: res.statusCode,
            data: parsedData,
          });
        } catch (parseError) {
          resolve({
            statusCode: res.statusCode,
            data: responseData,
            parseError: true,
          });
        }
      });
    });

    req.on("error", (error) => {
      clearTimeout(timeoutId);
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

async function testFunctionInfo() {
  console.log("\n🧪 Testing Register Function Info...");

  try {
    const response = await makeRequest(
      `${config.supabaseUrl}/functions/v1/register`,
      "GET"
    );
    console.log(`✅ Register GET: ${response.statusCode}`);
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log(`❌ Register GET Error: ${error.message}`);
  }

  console.log("\n🧪 Testing Login Function Info...");

  try {
    const response = await makeRequest(
      `${config.supabaseUrl}/functions/v1/login`,
      "GET"
    );
    console.log(`✅ Login GET: ${response.statusCode}`);
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log(`❌ Login GET Error: ${error.message}`);
  }
}

testFunctionInfo();
