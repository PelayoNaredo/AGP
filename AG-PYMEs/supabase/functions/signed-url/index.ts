// SIGNED URL CONTROLLER - VERSIÓN NATIVA SIN HONO
import { createClient } from "jsr:@supabase/supabase-js@^2";

// Helper function to extract company ID from JWT
async function extractCompanyId(req) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("Missing or invalid authorization header");
    }

    const token = authHeader.substring(7);

    // Create supabase client to verify JWT
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_ANON_KEY")
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new Error("Invalid token");
    }

    // Get company_id from user metadata or profile
    let companyId = user.user_metadata?.company_id;

    if (!companyId) {
      // Fallback: get from profiles table
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      companyId = profile?.company_id;
    }

    if (!companyId) {
      throw new Error("No company associated with user");
    }

    return companyId;
  } catch (error) {
    console.error("❌ Error extracting company ID:", error);
    throw error;
  }
}

// Manual validation functions
function validateFilename(filename) {
  if (!filename || typeof filename !== "string") {
    return "Nombre de archivo requerido";
  }

  if (filename.length > 255) {
    return "Nombre de archivo demasiado largo";
  }

  const filenameRegex = /^[a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9]+$/;
  if (!filenameRegex.test(filename)) {
    return "Nombre de archivo inválido";
  }

  return null;
}

function validateExpiresIn(expiresIn) {
  if (expiresIn === undefined || expiresIn === null) {
    return null; // Will use default
  }

  if (typeof expiresIn !== "number") {
    return "Tiempo de expiración debe ser un número";
  }

  if (expiresIn < 60) {
    return "Tiempo de expiración mínimo: 1 minuto";
  }

  if (expiresIn > 86400) {
    return "Tiempo de expiración máximo: 24 horas";
  }

  return null;
}

function validateBucket(bucket) {
  if (bucket === undefined || bucket === null) {
    return null; // Will use default
  }

  if (!bucket || typeof bucket !== "string" || bucket.trim() === "") {
    return "Nombre de bucket requerido";
  }

  return null;
}

function validateOperation(operation) {
  const validOperations = ["read", "write", "delete"];

  if (operation === undefined || operation === null) {
    return null; // Will use default
  }

  if (!validOperations.includes(operation)) {
    return "Operación inválida. Permitidas: read, write, delete";
  }

  return null;
}

function validateSignedUrlData(data) {
  const errors = [];

  // Validate filename
  const filenameError = validateFilename(data.filename);
  if (filenameError) errors.push(filenameError);

  // Validate expiresIn
  const expiresInError = validateExpiresIn(data.expiresIn);
  if (expiresInError) errors.push(expiresInError);

  // Validate bucket
  const bucketError = validateBucket(data.bucket);
  if (bucketError) errors.push(bucketError);

  // Validate operation
  const operationError = validateOperation(data.operation);
  if (operationError) errors.push(operationError);

  return errors;
}

function validateMultipleSignedUrlsData(data) {
  const errors = [];

  // Validate files array
  if (!data.files || !Array.isArray(data.files)) {
    errors.push("Se requiere un array de archivos");
    return errors;
  }

  if (data.files.length === 0) {
    errors.push("Al menos un archivo es requerido");
  }

  if (data.files.length > 10) {
    errors.push("Máximo 10 archivos permitidos");
  }

  // Validate each file
  data.files.forEach((file, index) => {
    const filenameError = validateFilename(file.filename);
    if (filenameError) {
      errors.push(`Archivo ${index + 1}: ${filenameError}`);
    }

    const operationError = validateOperation(file.operation);
    if (operationError) {
      errors.push(`Archivo ${index + 1}: ${operationError}`);
    }
  });

  // Validate global expiresIn
  const expiresInError = validateExpiresIn(data.expiresIn);
  if (expiresInError) errors.push(expiresInError);

  // Validate global bucket
  const bucketError = validateBucket(data.bucket);
  if (bucketError) errors.push(bucketError);

  return errors;
}

// Generate single signed URL
async function generateSignedUrl(companyId, urlData) {
  try {
    // Set defaults
    const validatedData = {
      filename: urlData.filename,
      expiresIn: urlData.expiresIn || 3600,
      bucket: urlData.bucket || "company-files",
      operation: urlData.operation || "read",
    };

    // Validate data
    const validationErrors = validateSignedUrlData(validatedData);
    if (validationErrors.length > 0) {
      throw new Error(validationErrors[0]);
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    );

    // Construct file path
    const filePath = `${companyId}/${validatedData.filename}`;

    // Verify file exists for read/delete operations
    if (validatedData.operation !== "write") {
      const { data: fileExists, error: listError } = await supabaseAdmin.storage
        .from(validatedData.bucket)
        .list(companyId, {
          search: validatedData.filename,
          limit: 1,
        });

      if (listError) {
        console.error("❌ Error verificando archivo:", listError);
        throw new Error("Error verificando archivo");
      }

      if (!fileExists || fileExists.length === 0) {
        throw new Error(`Archivo ${validatedData.filename} no encontrado`);
      }
    }

    // Generate signed URL based on operation
    let signedUrlResult;

    switch (validatedData.operation) {
      case "read":
        signedUrlResult = await supabaseAdmin.storage
          .from(validatedData.bucket)
          .createSignedUrl(filePath, validatedData.expiresIn);
        break;

      case "write":
        signedUrlResult = await supabaseAdmin.storage
          .from(validatedData.bucket)
          .createSignedUploadUrl(filePath);
        break;

      case "delete":
        // For delete, we'll use a signed URL with a custom policy
        signedUrlResult = await supabaseAdmin.storage
          .from(validatedData.bucket)
          .createSignedUrl(filePath, validatedData.expiresIn);
        break;
    }

    const { data: signedUrlData, error: signedUrlError } = signedUrlResult;

    if (signedUrlError) {
      console.error("❌ Error generando URL firmada:", signedUrlError);
      throw new Error("Error generando URL firmada");
    }

    // Calculate expiration
    const expiresAt = new Date(Date.now() + validatedData.expiresIn * 1000);

    return {
      signedUrl: signedUrlData.signedUrl || signedUrlData.signedURL,
      expiresIn: validatedData.expiresIn,
      expiresAt: expiresAt.toISOString(),
      filename: validatedData.filename,
      bucket: validatedData.bucket,
      path: filePath,
      operation: validatedData.operation,
    };
  } catch (error) {
    console.error("❌ Error generando URL firmada:", error);
    throw error;
  }
}

// Generate multiple signed URLs
async function generateMultipleSignedUrls(companyId, urlData) {
  try {
    // Set defaults
    const validatedData = {
      files: urlData.files,
      expiresIn: urlData.expiresIn || 3600,
      bucket: urlData.bucket || "company-files",
    };

    // Validate data
    const validationErrors = validateMultipleSignedUrlsData(validatedData);
    if (validationErrors.length > 0) {
      throw new Error(validationErrors[0]);
    }

    // Generate signed URLs for multiple files
    const signedUrls = await Promise.all(
      validatedData.files.map(async (file) => {
        try {
          return await generateSignedUrl(companyId, {
            filename: file.filename,
            expiresIn: validatedData.expiresIn,
            bucket: validatedData.bucket,
            operation: file.operation || "read",
          });
        } catch (error) {
          return {
            filename: file.filename,
            error: error.message,
          };
        }
      })
    );

    // Separate successful and failed URL generations
    const successfulUrls = signedUrls.filter((url) => !("error" in url));
    const failedUrls = signedUrls.filter((url) => "error" in url);

    return {
      successfulUrls,
      failedUrls,
      totalRequested: validatedData.files.length,
      totalSuccessful: successfulUrls.length,
    };
  } catch (error) {
    console.error("❌ Error generando múltiples URLs firmadas:", error);
    throw error;
  }
}

// Main handler
Deno.serve(async (req) => {
  const url = new URL(req.url);
  const method = req.method;

  // Handle different path scenarios
  let pathname = url.pathname;

  // Remove function prefix if present
  if (pathname.startsWith("/functions/v1/signed-url")) {
    pathname = pathname.replace("/functions/v1/signed-url", "");
  }

  // Handle direct function calls (without /functions/v1/ prefix)
  if (pathname === "/signed-url") {
    pathname = "/";
  } else if (pathname.startsWith("/signed-url/")) {
    pathname = pathname.replace("/signed-url", "");
  }

  // Normalize empty path to root
  if (pathname === "" || pathname === "/") {
    pathname = "/";
  }

  console.log(`🔍 ${method} ${pathname} (original: ${url.pathname})`);

  // Add CORS headers for all responses
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // Handle preflight requests
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Extract company ID for all authenticated routes
    let companyId;
    try {
      companyId = await extractCompanyId(req);
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: error.message,
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Route handling
    if (method === "GET" && pathname === "/") {
      // Root endpoint - info
      return new Response(
        JSON.stringify({
          message: "Signed URL Controller is running",
          timestamp: new Date().toISOString(),
          endpoints: [
            "POST / - Generate single signed URL",
            "POST /multiple - Generate multiple signed URLs",
            "POST /validate - Validate signed URL",
          ],
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (method === "POST" && pathname === "/") {
      // Generate single signed URL
      console.log("🔗 Generating single signed URL...");

      try {
        const body = await req.json();
        const result = await generateSignedUrl(companyId, body);

        console.log("✅ Signed URL generated successfully");
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("❌ Error generating signed URL:", error);
        return new Response(
          JSON.stringify({
            error: error.message,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    if (method === "POST" && pathname === "/multiple") {
      // Generate multiple signed URLs
      console.log("🔗 Generating multiple signed URLs...");

      try {
        const body = await req.json();
        const result = await generateMultipleSignedUrls(companyId, body);

        console.log("✅ Multiple signed URLs generated successfully");
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("❌ Error generating multiple signed URLs:", error);
        return new Response(
          JSON.stringify({
            error: error.message,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    if (method === "POST" && pathname === "/validate") {
      // Validate signed URL
      console.log("🔍 Validating signed URL...");

      try {
        const body = await req.json();

        if (!body.signedUrl) {
          return new Response(
            JSON.stringify({
              error: "URL firmada requerida",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const supabaseAdmin = createClient(
          Deno.env.get("SUPABASE_URL"),
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
        );

        // Simple validation by attempting to use the URL
        try {
          // For validation, we'll try to make a HEAD request to the signed URL
          const response = await fetch(body.signedUrl, { method: "HEAD" });

          const result = {
            valid: response.status < 400,
            status: response.status,
            message:
              response.status < 400
                ? "URL firmada válida"
                : "URL firmada inválida o expirada",
          };

          console.log("✅ Signed URL validation completed");
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch (validationError) {
          console.error("❌ Error validating signed URL:", validationError);
          return new Response(
            JSON.stringify({
              valid: false,
              message: "URL firmada inválida o expirada",
            }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      } catch (error) {
        console.error("❌ Error validating signed URL:", error);
        return new Response(
          JSON.stringify({
            error: error.message,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Default 404 for unmatched routes
    console.log("❌ Route not found:", pathname);
    return new Response(
      JSON.stringify({
        message: "Route not found",
        path: pathname,
        availableRoutes: [
          "GET / - Controller info",
          "POST / - Generate single signed URL",
          "POST /multiple - Generate multiple signed URLs",
          "POST /validate - Validate signed URL",
        ],
      }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Unhandled error:", error);
    return new Response(
      JSON.stringify({
        message: "Internal Server Error",
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
