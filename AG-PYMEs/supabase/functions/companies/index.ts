// COMPANIES CONTROLLER - VERSIÓN NATIVA SIN HONO
import { createClient } from "jsr:@supabase/supabase-js@^2";

// Función para extraer company ID del perfil del usuario
async function extractCompanyId(request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      console.log("❌ No authorization header");
      return null;
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_ANON_KEY"),
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // Get user from token
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.log("❌ Invalid token or user not found:", userError?.message);
      return null;
    }

    console.log("✅ User authenticated:", user.email);

    // Get user profile to extract company_id
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.company_id) {
      console.log(
        "❌ Profile not found or no company_id:",
        profileError?.message
      );
      return null;
    }

    console.log("✅ Company ID extracted:", profile.company_id);
    return profile.company_id;
  } catch (error) {
    console.error("❌ Error in extractCompanyId:", error);
    return null;
  }
}

// Main handler
Deno.serve(async (req) => {
  const url = new URL(req.url);
  const method = req.method;

  // Handle different path scenarios
  let pathname = url.pathname;

  // Remove function prefix if present
  if (pathname.startsWith("/functions/v1/companies")) {
    pathname = pathname.replace("/functions/v1/companies", "");
  }

  // Handle direct function calls (without /functions/v1/ prefix)
  if (pathname === "/companies") {
    pathname = "/";
  } else if (pathname.startsWith("/companies/")) {
    pathname = pathname.replace("/companies", "");
  }

  // Normalize empty path to root
  if (pathname === "" || pathname === "/") {
    pathname = "/";
  }

  console.log(`🔍 ${method} ${pathname} (original: ${url.pathname})`);

  try {
    // Route handling
    if (method === "GET" && pathname === "/") {
      // Root endpoint
      return new Response(
        JSON.stringify({
          message: "Companies Controller is running",
          timestamp: new Date().toISOString(),
          debug: {
            originalPath: url.pathname,
            processedPath: pathname,
            method: method,
          },
          endpoints: [
            "GET / - This info",
            "GET /current - Get current company data",
            "GET /settings - Get company settings",
            "PUT /settings - Update company settings",
            "GET /usage - Get company usage statistics",
            "POST /validate-limit - Validate company limits",
            "POST /invitation - Generate invitation code",
            "GET /users - Get company users",
            "GET /limits - Get company limits info",
            "PUT /current - Update company data",
          ],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (method === "GET" && pathname === "/current") {
      // Get current company data
      console.log("🏢 Getting current company data...");

      const companyId = await extractCompanyId(req);
      if (!companyId) {
        return new Response(
          JSON.stringify({
            message: "Unauthorized - Company ID not found",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL"),
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
      );

      // Set company context
      await supabaseClient.rpc("set_current_company_id", {
        company_uuid: companyId,
      });

      const { data, error } = await supabaseClient
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .single();

      if (error) {
        console.error("❌ Error fetching company:", error);
        if (error.code === "PGRST116") {
          return new Response(
            JSON.stringify({
              message: "Company not found",
            }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
        throw error;
      }

      console.log("✅ Company data retrieved for:", data.company_name);
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (method === "GET" && pathname === "/settings") {
      // Get company settings
      console.log("⚙️ Getting company settings...");

      const companyId = await extractCompanyId(req);
      if (!companyId) {
        return new Response(
          JSON.stringify({
            message: "Unauthorized - Company ID not found",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL"),
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
      );

      await supabaseClient.rpc("set_current_company_id", {
        company_uuid: companyId,
      });

      // Try to get settings from the settings table first
      const { data: settingsData, error: settingsError } = await supabaseClient
        .from("settings")
        .select("*")
        .eq("company_id", companyId)
        .single();

      if (settingsError && settingsError.code !== "PGRST116") {
        throw settingsError;
      }

      // If no settings found, get from company table
      if (!settingsData) {
        const { data: companyData, error: companyError } = await supabaseClient
          .from("companies")
          .select("company_name, tax_rate, default_currency, settings")
          .eq("id", companyId)
          .single();

        if (companyError) throw companyError;

        // Return default settings structure
        const defaultSettings = {
          company_id: companyId,
          nombre_local: companyData.company_name || "",
          default_currency: companyData.default_currency || "EUR",
          tax_rate: companyData.tax_rate || 21.0,
          tema: "claro",
          ...companyData.settings,
        };

        console.log("✅ Default settings returned for company:", companyId);
        return new Response(JSON.stringify(defaultSettings), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      console.log("✅ Settings retrieved for company:", companyId);
      return new Response(JSON.stringify(settingsData), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (method === "PUT" && pathname === "/settings") {
      // Update company settings
      console.log("⚙️ Updating company settings...");

      const companyId = await extractCompanyId(req);
      if (!companyId) {
        return new Response(
          JSON.stringify({
            message: "Unauthorized - Company ID not found",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const body = await req.json();
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL"),
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
      );

      await supabaseClient.rpc("set_current_company_id", {
        company_uuid: companyId,
      });

      // Upsert settings in the settings table
      const { data, error } = await supabaseClient
        .from("settings")
        .upsert({
          company_id: companyId,
          ...body,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      console.log("✅ Settings updated for company:", companyId);
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (method === "GET" && pathname === "/usage") {
      // Get company usage statistics
      console.log("📊 Getting company usage statistics...");

      const companyId = await extractCompanyId(req);
      if (!companyId) {
        return new Response(
          JSON.stringify({
            message: "Unauthorized - Company ID not found",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL"),
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
      );

      await supabaseClient.rpc("set_current_company_id", {
        company_uuid: companyId,
      });

      // Use your existing database function for usage stats
      const { data: usageStats, error: usageError } = await supabaseClient.rpc(
        "get_company_usage_stats",
        {
          company_uuid: companyId,
        }
      );

      if (usageError) throw usageError;

      console.log("✅ Usage stats retrieved for company:", companyId);
      return new Response(
        JSON.stringify(
          usageStats || {
            users: 0,
            clients: 0,
            products: 0,
            appointments: 0,
            services: 0,
            storageMB: 0,
          }
        ),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (method === "POST" && pathname === "/validate-limit") {
      // Validate company limits
      console.log("🔍 Validating company limits...");

      const companyId = await extractCompanyId(req);
      if (!companyId) {
        return new Response(
          JSON.stringify({
            message: "Unauthorized - Company ID not found",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const body = await req.json();
      const { resource, amount = 1 } = body;

      if (!resource) {
        return new Response(
          JSON.stringify({
            message: "Resource type is required",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL"),
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
      );

      await supabaseClient.rpc("set_current_company_id", {
        company_uuid: companyId,
      });

      // Use your existing database function for limit validation
      const { data: limitCheck, error: limitError } = await supabaseClient.rpc(
        "check_company_limits",
        {
          company_uuid: companyId,
          resource_type: resource,
        }
      );

      if (limitError) throw limitError;

      // Get current usage for detailed response
      const { data: usageStats, error: usageError } = await supabaseClient.rpc(
        "get_company_usage_stats",
        {
          company_uuid: companyId,
        }
      );

      if (usageError) throw usageError;

      // Get company limits for detailed response
      const { data: company, error: companyError } = await supabaseClient
        .from("companies")
        .select("max_users, max_clients, max_products, max_storage_mb")
        .eq("id", companyId)
        .single();

      if (companyError) throw companyError;

      // Calculate specific values based on resource type
      let currentUsage = 0;
      let maxLimit = 0;

      switch (resource) {
        case "users":
          currentUsage = usageStats.users || 0;
          maxLimit = company.max_users;
          break;
        case "clients":
          currentUsage = usageStats.clients || 0;
          maxLimit = company.max_clients;
          break;
        case "products":
          currentUsage = usageStats.products || 0;
          maxLimit = company.max_products;
          break;
        case "storage":
          currentUsage = usageStats.storageMB || 0;
          maxLimit = company.max_storage_mb;
          break;
        default:
          return new Response(
            JSON.stringify({
              message: "Invalid resource type",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
      }

      const allowed = limitCheck === true;
      const remaining = Math.max(0, maxLimit - currentUsage);

      console.log("✅ Limit validation completed for:", resource);
      return new Response(
        JSON.stringify({
          allowed,
          currentUsage,
          maxLimit,
          remaining,
          resource,
          wouldExceed: !allowed,
          percentUsed:
            maxLimit > 0 ? Math.round((currentUsage / maxLimit) * 100) : 0,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (method === "POST" && pathname === "/invitation") {
      // Generate invitation code
      console.log("💌 Generating invitation code...");

      const companyId = await extractCompanyId(req);
      if (!companyId) {
        return new Response(
          JSON.stringify({
            message: "Unauthorized - Company ID not found",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL"),
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
      );

      await supabaseClient.rpc("set_current_company_id", {
        company_uuid: companyId,
      });

      // Use your existing database function to generate invitation code
      const { data: invitationCode, error: codeError } =
        await supabaseClient.rpc("generate_invitation_code");

      if (codeError) throw codeError;

      const { data, error } = await supabaseClient
        .from("company_invitations")
        .insert({
          company_id: companyId,
          invitation_code: invitationCode,
          status: "pending",
          expires_at: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      console.log("✅ Invitation code generated");
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (method === "GET" && pathname === "/users") {
      // Get company users
      console.log("👥 Getting company users...");

      const companyId = await extractCompanyId(req);
      if (!companyId) {
        return new Response(
          JSON.stringify({
            message: "Unauthorized - Company ID not found",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL"),
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
      );

      await supabaseClient.rpc("set_current_company_id", {
        company_uuid: companyId,
      });

      const { data, error } = await supabaseClient
        .from("profiles")
        .select("id, nombre, email, rol, created_at, activo")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      console.log("✅ Company users retrieved");
      return new Response(JSON.stringify(data || []), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (method === "GET" && pathname === "/limits") {
      // Get company limits info
      console.log("📊 Getting company limits...");

      const companyId = await extractCompanyId(req);
      if (!companyId) {
        return new Response(
          JSON.stringify({
            message: "Unauthorized - Company ID not found",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL"),
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
      );

      await supabaseClient.rpc("set_current_company_id", {
        company_uuid: companyId,
      });

      const { data, error } = await supabaseClient
        .from("companies")
        .select(
          "subscription_plan, max_users, max_clients, max_products, max_storage_mb"
        )
        .eq("id", companyId)
        .single();

      if (error) throw error;

      console.log("✅ Company limits retrieved");
      return new Response(
        JSON.stringify({
          plan: data.subscription_plan,
          limits: {
            max_users: data.max_users,
            max_clients: data.max_clients,
            max_products: data.max_products,
            max_storage_mb: data.max_storage_mb,
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (method === "PUT" && pathname === "/current") {
      // Update company data
      console.log("✏️ Updating company data...");

      const companyId = await extractCompanyId(req);
      if (!companyId) {
        return new Response(
          JSON.stringify({
            message: "Unauthorized - Company ID not found",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const body = await req.json();
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL"),
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
      );

      await supabaseClient.rpc("set_current_company_id", {
        company_uuid: companyId,
      });

      // Prepare update data (only allow certain fields)
      const allowedFields = [
        "company_name",
        "tax_rate",
        "default_currency",
        "settings",
      ];

      const updateData = {};
      allowedFields.forEach((field) => {
        if (body.hasOwnProperty(field)) {
          updateData[field] = body[field];
        }
      });

      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabaseClient
        .from("companies")
        .update(updateData)
        .eq("id", companyId)
        .select()
        .single();

      if (error) throw error;

      console.log("✅ Company data updated");
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Default 404 for unmatched routes
    console.log("❌ Route not found:", pathname);
    return new Response(
      JSON.stringify({
        message: "Route not found",
        path: pathname,
        availableRoutes: [
          "/",
          "/current",
          "/settings",
          "/usage",
          "/validate-limit",
          "/invitation",
          "/users",
          "/limits",
        ],
      }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
