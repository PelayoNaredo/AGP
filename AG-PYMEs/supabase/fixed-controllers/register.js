// REGISTER CONTROLLER - VERSIÓN NATIVA SIN HONO
import { createClient } from "jsr:@supabase/supabase-js@^2";

// Helper function to generate unique company code
function generateCompanyCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Helper function to get default limits by plan
function getPlanLimits(plan) {
  const limits = {
    basic: {
      max_users: 3,
      max_clients: 100,
      max_products: 200,
      max_storage_mb: 100,
    },
    pro: {
      max_users: 10,
      max_clients: 500,
      max_products: 1000,
      max_storage_mb: 500,
    },
    enterprise: {
      max_users: 50,
      max_clients: 2000,
      max_products: 5000,
      max_storage_mb: 2000,
    },
  };
  return limits[plan] || limits.basic;
}

// Manual validation functions
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  // At least 8 characters, one uppercase, one lowercase, one number
  return password && password.length >= 8;
}

function validateName(nombre) {
  return nombre && nombre.length >= 2 && nombre.length <= 100;
}

function validateCompanyName(companyName) {
  return companyName && companyName.length >= 2 && companyName.length <= 150;
}

function validatePlan(plan) {
  const validPlans = ["basic", "pro", "enterprise"];
  return !plan || validPlans.includes(plan);
}

// Main handler
Deno.serve(async (req) => {
  const url = new URL(req.url);
  const method = req.method;

  // Handle different path scenarios
  let pathname = url.pathname;

  // Remove function prefix if present
  if (pathname.startsWith("/functions/v1/register")) {
    pathname = pathname.replace("/functions/v1/register", "");
  }

  // Handle direct function calls (without /functions/v1/ prefix)
  if (pathname === "/register") {
    pathname = "/";
  } else if (pathname.startsWith("/register/")) {
    pathname = pathname.replace("/register", "");
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
    // Route handling
    if (method === "GET" && pathname === "/") {
      // Root endpoint
      return new Response(
        JSON.stringify({
          message: "Register Controller is running",
          timestamp: new Date().toISOString(),
          debug: {
            originalPath: url.pathname,
            processedPath: pathname,
            method: method,
          },
          endpoints: [
            "GET / - This info",
            "POST / - Register user with company creation or joining",
            "POST /validate-invitation - Validate invitation code",
            "POST /check-company-code - Check company code availability",
            "GET /plans - Get subscription plans info",
          ],
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (method === "POST" && pathname === "/") {
      // Register user
      console.log("👤 Registering new user...");

      const body = await req.json();
      const { email, password, nombre, mode, companyData, invitationCode } =
        body;

      // Validate required fields
      if (!email || !password || !nombre || !mode) {
        return new Response(
          JSON.stringify({
            message: "Email, password, nombre, and mode are required",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Validate email format
      if (!validateEmail(email)) {
        return new Response(
          JSON.stringify({
            message: "Invalid email format",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Validate password strength
      if (!validatePassword(password)) {
        return new Response(
          JSON.stringify({
            message: "Password must be at least 8 characters long",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Validate name
      if (!validateName(nombre)) {
        return new Response(
          JSON.stringify({
            message: "Name must be between 2 and 100 characters",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Mode-specific validation
      if (
        mode === "create" &&
        (!companyData?.companyName ||
          !validateCompanyName(companyData.companyName))
      ) {
        return new Response(
          JSON.stringify({
            message: "Valid company name is required for create mode",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (mode === "join" && !invitationCode) {
        return new Response(
          JSON.stringify({
            message: "Invitation code is required for join mode",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Validate subscription plan if provided
      if (
        companyData?.subscriptionPlan &&
        !validatePlan(companyData.subscriptionPlan)
      ) {
        return new Response(
          JSON.stringify({
            message: "Invalid subscription plan",
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

      let companyId;
      let companyName;

      try {
        // Handle company creation or joining
        if (mode === "create") {
          // Create new company
          const planLimits = getPlanLimits(
            companyData.subscriptionPlan || "basic"
          );

          // Generate company code using database function
          const { data: companyCode, error: codeError } =
            await supabaseAdmin.rpc("generate_company_code", {
              company_name: companyData.companyName,
            });

          if (codeError) {
            console.error("❌ Error generating company code:", codeError);
            // Fallback to manual generation
            const fallbackCode = generateCompanyCode();
            console.log("🔄 Using fallback company code generation");

            const { data: company, error: companyError } = await supabaseAdmin
              .from("companies")
              .insert({
                company_name: companyData.companyName,
                company_code: fallbackCode,
                subscription_plan: companyData.subscriptionPlan || "basic",
                tax_rate: companyData.taxRate || 21.0,
                default_currency: companyData.defaultCurrency || "EUR",
                ...planLimits,
                is_active: true,
              })
              .select()
              .single();

            if (companyError) {
              console.error("❌ Error creating company:", companyError);
              throw new Error("Error creating company");
            }

            companyId = company.id;
            companyName = company.company_name;
          } else {
            const { data: company, error: companyError } = await supabaseAdmin
              .from("companies")
              .insert({
                company_name: companyData.companyName,
                company_code: companyCode,
                subscription_plan: companyData.subscriptionPlan || "basic",
                tax_rate: companyData.taxRate || 21.0,
                default_currency: companyData.defaultCurrency || "EUR",
                ...planLimits,
                is_active: true,
              })
              .select()
              .single();

            if (companyError) {
              console.error("❌ Error creating company:", companyError);
              throw new Error("Error creating company");
            }

            companyId = company.id;
            companyName = company.company_name;
          }

          console.log("✅ Company created:", {
            id: companyId,
            name: companyName,
          });
        } else if (mode === "join") {
          // Join existing company using invitation code
          const { data: invitation, error: invError } = await supabaseAdmin
            .from("company_invitations")
            .select(
              `
              company_id,
              companies (
                id,
                company_name,
                is_active
              )
            `
            )
            .eq("invitation_code", invitationCode)
            .eq("status", "pending")
            .gte("expires_at", new Date().toISOString())
            .single();

          if (invError || !invitation) {
            return new Response(
              JSON.stringify({
                message: "Invalid or expired invitation code",
              }),
              {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }

          if (!invitation.companies.is_active) {
            return new Response(
              JSON.stringify({
                message: "Company is inactive",
              }),
              {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }

          companyId = invitation.company_id;
          companyName = invitation.companies.company_name;

          // Mark invitation as used
          await supabaseAdmin
            .from("company_invitations")
            .update({
              status: "used",
              used_at: new Date().toISOString(),
            })
            .eq("invitation_code", invitationCode);

          console.log("✅ Joining company:", {
            id: companyId,
            name: companyName,
          });
        }

        // Create user in Supabase Auth
        const { data: authData, error: authError } =
          await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
              full_name: nombre,
              company_id: companyId,
            },
          });

        if (authError) {
          console.error("❌ Auth registration error:", authError);

          // If we created a company and auth fails, we should clean up
          if (mode === "create") {
            await supabaseAdmin.from("companies").delete().eq("id", companyId);
          }

          if (authError.message?.includes("already been registered")) {
            return new Response(
              JSON.stringify({
                message: "User with this email already exists",
              }),
              {
                status: 409,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }

          throw new Error(authError.message);
        }

        // Create profile record
        const { data: profile, error: profileError } = await supabaseAdmin
          .from("profiles")
          .insert({
            id: authData.user.id,
            nombre,
            email,
            company_id: companyId,
            rol: mode === "create" ? "admin" : "user",
            activo: true,
          })
          .select()
          .single();

        if (profileError) {
          console.error("❌ Profile creation error:", profileError);

          // Clean up auth user if profile creation fails
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

          // Clean up company if we created it
          if (mode === "create") {
            await supabaseAdmin.from("companies").delete().eq("id", companyId);
          }

          throw new Error("Error creating user profile");
        }

        console.log("✅ User registered successfully:", {
          userId: authData.user.id,
          email: authData.user.email,
          companyId,
          companyName,
          mode,
        });

        return new Response(
          JSON.stringify({
            message: "Registration successful",
            user: {
              id: authData.user.id,
              email: authData.user.email,
              nombre: profile.nombre,
              rol: profile.rol,
            },
            company: {
              id: companyId,
              name: companyName,
              role: profile.rol,
            },
            mode,
          }),
          {
            status: 201,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("🚨 Registration failed:", error);
        return new Response(
          JSON.stringify({
            message: error.message || "Registration failed",
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    if (method === "POST" && pathname === "/validate-invitation") {
      // Validate invitation code
      console.log("🔍 Validating invitation code...");

      const { invitationCode } = await req.json();

      if (!invitationCode) {
        return new Response(
          JSON.stringify({
            message: "Invitation code is required",
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

      try {
        const { data: invitation, error } = await supabaseAdmin
          .from("company_invitations")
          .select(
            `
            invitation_code,
            status,
            expires_at,
            companies (
              company_name,
              is_active
            )
          `
          )
          .eq("invitation_code", invitationCode)
          .single();

        if (error || !invitation) {
          return new Response(
            JSON.stringify({
              valid: false,
              message: "Invalid invitation code",
            }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        if (invitation.status !== "pending") {
          return new Response(
            JSON.stringify({
              valid: false,
              message: "Invitation code has already been used",
            }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        if (new Date(invitation.expires_at) < new Date()) {
          return new Response(
            JSON.stringify({
              valid: false,
              message: "Invitation code has expired",
            }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        if (!invitation.companies.is_active) {
          return new Response(
            JSON.stringify({
              valid: false,
              message: "Company is inactive",
            }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        console.log("✅ Valid invitation code");
        return new Response(
          JSON.stringify({
            valid: true,
            companyName: invitation.companies.company_name,
            message: "Valid invitation code",
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("❌ Error validating invitation:", error);
        return new Response(
          JSON.stringify({
            valid: false,
            message: "Error validating invitation code",
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    if (method === "POST" && pathname === "/check-company-code") {
      // Check company code availability
      console.log("🔍 Checking company code availability...");

      const { companyCode } = await req.json();

      if (!companyCode) {
        return new Response(
          JSON.stringify({
            message: "Company code is required",
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

      try {
        const { data: existingCompany } = await supabaseAdmin
          .from("companies")
          .select("id")
          .eq("company_code", companyCode.toUpperCase())
          .single();

        console.log("✅ Company code availability checked");
        return new Response(
          JSON.stringify({
            available: !existingCompany,
            message: existingCompany
              ? "Company code is already taken"
              : "Company code is available",
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("❌ Error checking company code:", error);
        return new Response(
          JSON.stringify({
            message: "Error checking company code availability",
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    if (method === "GET" && pathname === "/plans") {
      // Get subscription plans info
      console.log("📋 Getting subscription plans...");

      try {
        const plans = [
          {
            id: "basic",
            name: "Básico",
            description: "Ideal para pequeños negocios",
            price: 0,
            currency: "EUR",
            features: [
              "Hasta 3 usuarios",
              "Hasta 100 clientes",
              "Hasta 200 productos",
              "100 MB de almacenamiento",
              "Soporte por email",
            ],
            limits: getPlanLimits("basic"),
          },
          {
            id: "pro",
            name: "Profesional",
            description: "Para empresas en crecimiento",
            price: 29,
            currency: "EUR",
            features: [
              "Hasta 10 usuarios",
              "Hasta 500 clientes",
              "Hasta 1,000 productos",
              "500 MB de almacenamiento",
              "Soporte prioritario",
              "Reportes avanzados",
            ],
            limits: getPlanLimits("pro"),
          },
          {
            id: "enterprise",
            name: "Empresarial",
            description: "Para grandes organizaciones",
            price: 99,
            currency: "EUR",
            features: [
              "Hasta 50 usuarios",
              "Hasta 2,000 clientes",
              "Hasta 5,000 productos",
              "2 GB de almacenamiento",
              "Soporte 24/7",
              "Integraciones personalizadas",
              "API completa",
            ],
            limits: getPlanLimits("enterprise"),
          },
        ];

        console.log("✅ Subscription plans retrieved");
        return new Response(JSON.stringify(plans), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("❌ Error getting plans:", error);
        return new Response(
          JSON.stringify({
            message: "Error getting subscription plans",
          }),
          {
            status: 500,
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
          "POST / - Register user",
          "POST /validate-invitation - Validate invitation code",
          "POST /check-company-code - Check company code availability",
          "GET /plans - Get subscription plans",
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
