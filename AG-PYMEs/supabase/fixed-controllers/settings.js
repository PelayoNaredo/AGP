// SETTINGS CONTROLLER - VERSIÓN NATIVA SIN HONO
import { createClient } from "jsr:@supabase/supabase-js@^2";

// Theme options constants
const THEME_OPTIONS = ["default", "light", "dark", "modern", "classic"];

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

// Utility function to validate UUID
function isValidUUID(uuid) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Generate UUID v4
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Manual validation functions
function validateSettingData(data, isUpdate = false) {
  const errors = [];

  // Validate nombre_local (required for create, optional for update)
  if (!isUpdate && (!data.nombre_local || data.nombre_local.trim() === "")) {
    errors.push("Nombre del local es requerido");
  } else if (data.nombre_local && data.nombre_local.length > 100) {
    errors.push("Nombre del local es demasiado largo");
  }

  // Validate direccion (optional)
  if (
    data.direccion !== undefined &&
    data.direccion !== null &&
    typeof data.direccion !== "string"
  ) {
    errors.push("Dirección debe ser una cadena de texto");
  }

  // Validate telefono (optional but must be valid format if provided)
  if (data.telefono !== undefined && data.telefono !== null) {
    const phoneRegex = /^\+?[0-9]{10,14}$/;
    if (!phoneRegex.test(data.telefono)) {
      errors.push("Número de teléfono inválido");
    }
  }

  // Validate url_backend (optional but must be valid URL if provided)
  if (data.url_backend !== undefined && data.url_backend !== null) {
    try {
      new URL(data.url_backend);
    } catch {
      errors.push("URL de backend inválida");
    }
  }

  // Validate horario_apertura (optional but must be valid time format if provided)
  if (data.horario_apertura !== undefined && data.horario_apertura !== null) {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(data.horario_apertura)) {
      errors.push("Formato de hora de apertura inválido (HH:MM)");
    }
  }

  // Validate horario_cierre (optional but must be valid time format if provided)
  if (data.horario_cierre !== undefined && data.horario_cierre !== null) {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(data.horario_cierre)) {
      errors.push("Formato de hora de cierre inválido (HH:MM)");
    }
  }

  // Validate logo_local (optional but must be valid URL if provided)
  if (data.logo_local !== undefined && data.logo_local !== null) {
    try {
      new URL(data.logo_local);
    } catch {
      errors.push("URL de logo inválida");
    }
  }

  // Validate tema (optional but must be valid theme if provided)
  if (data.tema !== undefined && data.tema !== null) {
    if (!THEME_OPTIONS.includes(data.tema)) {
      errors.push("Tema inválido");
    }
  }

  return errors;
}

// Validate file for logo upload
function validateLogoFile(file) {
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/svg+xml",
  ];

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Invalid file type. Allowed types: JPEG, PNG, WebP, SVG");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File size exceeds 5MB limit");
  }
}

// Main handler
Deno.serve(async (req) => {
  const url = new URL(req.url);
  const method = req.method;

  // Handle different path scenarios
  let pathname = url.pathname;

  // Remove function prefix if present
  if (pathname.startsWith("/functions/v1/settings")) {
    pathname = pathname.replace("/functions/v1/settings", "");
  }

  // Handle direct function calls (without /functions/v1/ prefix)
  if (pathname === "/settings") {
    pathname = "/";
  } else if (pathname.startsWith("/settings/")) {
    pathname = pathname.replace("/settings", "");
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    );

    // Set RLS context
    await supabase.rpc("set_current_company_id", {
      company_uuid: companyId,
    });

    // Route handling
    if (method === "GET" && pathname === "/") {
      // Get company settings
      console.log("⚙️ Getting company settings...");

      try {
        const { data, error } = await supabase
          .from("settings")
          .select("*")
          .eq("company_id", companyId)
          .limit(1)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            // If no settings found, return default settings
            console.log("📋 No settings found, returning defaults");
            return new Response(
              JSON.stringify({
                nombre_local: null,
                direccion: null,
                telefono: null,
                url_backend: null,
                horario_apertura: null,
                horario_cierre: null,
                logo_local: null,
                tema: "default",
              }),
              {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
          console.error("❌ Error fetching company settings:", error);
          throw new Error("Internal server error");
        }

        console.log("✅ Company settings retrieved");
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("❌ Error getting settings:", error);
        return new Response(
          JSON.stringify({
            error: error.message || "Internal server error",
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    if (method === "GET" && pathname.match(/^\/[0-9a-f-]{36}$/i)) {
      // Get setting by ID
      const settingId = pathname.substring(1);
      console.log(`🔍 Getting setting by ID: ${settingId}`);

      if (!isValidUUID(settingId)) {
        return new Response(
          JSON.stringify({
            error: "Invalid setting ID",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      try {
        const { data, error } = await supabase
          .from("settings")
          .select("*")
          .eq("id", settingId)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            return new Response(
              JSON.stringify({
                error: "Setting not found",
              }),
              {
                status: 404,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
          console.error("❌ Error fetching setting:", error);
          throw new Error("Internal server error");
        }

        console.log("✅ Setting retrieved by ID");
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("❌ Error getting setting by ID:", error);
        return new Response(
          JSON.stringify({
            error: error.message || "Internal server error",
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    if (method === "POST" && pathname === "/") {
      // Create setting
      console.log("➕ Creating new setting...");

      try {
        const body = await req.json();

        // Validate setting data
        const validationErrors = validateSettingData(body, false);
        if (validationErrors.length > 0) {
          return new Response(
            JSON.stringify({
              error: validationErrors[0],
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const insertData = {
          ...body,
          company_id: companyId,
          tema: body.tema || "default",
        };

        const { data, error } = await supabase
          .from("settings")
          .insert(insertData)
          .select("*")
          .single();

        if (error) {
          console.error("❌ Error creating setting:", error);
          throw new Error("Internal server error");
        }

        console.log("✅ Setting created successfully");
        return new Response(JSON.stringify(data), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("❌ Error creating setting:", error);
        return new Response(
          JSON.stringify({
            error: error.message || "Internal server error",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    if (method === "PUT" && pathname.match(/^\/[0-9a-f-]{36}$/i)) {
      // Update setting by ID
      const settingId = pathname.substring(1);
      console.log(`📝 Updating setting: ${settingId}`);

      if (!isValidUUID(settingId)) {
        return new Response(
          JSON.stringify({
            error: "Invalid setting ID",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      try {
        const body = await req.json();

        // Validate setting update data
        const validationErrors = validateSettingData(body, true);
        if (validationErrors.length > 0) {
          return new Response(
            JSON.stringify({
              error: validationErrors[0],
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const { data, error } = await supabase
          .from("settings")
          .update(body)
          .eq("id", settingId)
          .select("*")
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            return new Response(
              JSON.stringify({
                error: "Setting not found",
              }),
              {
                status: 404,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
          console.error("❌ Error updating setting:", error);
          throw new Error("Internal server error");
        }

        console.log("✅ Setting updated successfully");
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("❌ Error updating setting:", error);
        return new Response(
          JSON.stringify({
            error: error.message || "Internal server error",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    if (method === "POST" && pathname === "/logo") {
      // Update setting logo
      console.log("🖼️ Updating setting logo...");

      try {
        const formData = await req.formData();
        const file = formData.get("logo");

        if (!file) {
          return new Response(
            JSON.stringify({
              error: "No file uploaded",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Validate file
        validateLogoFile(file);

        // Get current settings to retrieve existing logo
        const { data: currentSettings } = await supabase
          .from("settings")
          .select("logo_local")
          .eq("company_id", companyId)
          .limit(1)
          .single();

        // Generate unique filename
        const filename = `${generateUUID()}-${file.name}`;
        const filePath = `${companyId}/${filename}`;

        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("company-logos")
          .upload(filePath, file, {
            contentType: file.type,
            upsert: true,
          });

        if (uploadError) {
          console.error("❌ Error uploading file:", uploadError);
          throw new Error("Error uploading file");
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from("company-logos")
          .getPublicUrl(uploadData.path);

        const logoUrl = publicUrlData.publicUrl;

        // Update settings with new logo URL
        const { data, error } = await supabase
          .from("settings")
          .upsert({
            company_id: companyId,
            logo_local: logoUrl,
          })
          .select("*")
          .single();

        if (error) {
          console.error("❌ Error updating logo in settings:", error);
          throw new Error("Error updating logo");
        }

        // Remove previous logo if exists
        if (currentSettings?.logo_local) {
          try {
            const oldPath =
              currentSettings.logo_local.split("/company-logos/")[1];
            if (oldPath) {
              await supabase.storage.from("company-logos").remove([oldPath]);
            }
          } catch (deleteError) {
            console.error("❌ Error deleting previous logo:", deleteError);
          }
        }

        console.log("✅ Logo updated successfully");
        return new Response(
          JSON.stringify({
            message: "Logo updated successfully",
            url: logoUrl,
            path: uploadData.path,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("❌ Error updating logo:", error);
        return new Response(
          JSON.stringify({
            error: error.message || "Error updating logo",
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
          "GET / - Get company settings",
          "GET /:id - Get setting by ID",
          "POST / - Create setting",
          "PUT /:id - Update setting by ID",
          "POST /logo - Update setting logo",
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
