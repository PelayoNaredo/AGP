/**
 * 🚀 Edge Function OPTIMIZADA: Register
 *
 * Fecha: 6 de agosto de 2025
 * Objetivo: Optimizar código sin usar withTenantContext (función de auth inicial)
 *
 * OPTIMIZACIONES:
 * ✅ Eliminado código repetitivo de Supabase client (3 instancias → 1)
 * ✅ Simplificado manejo de rutas y paths
 * ✅ Consolidadas validaciones en funciones reutilizables
 * ✅ Reducido código duplicado en error handling
 * ✅ Mejorada legibilidad y estructura
 * 
 * ANTES: 456 líneas | DESPUÉS: ~320 líneas ≈ 30% REDUCCIÓN
 */

import { createClient } from "jsr:@supabase/supabase-js@^2";
import {
  withCors,
  createCorsJsonResponse,
  createCorsErrorResponse,
} from "../auth-utils/cors-utils.ts";

// Configuración centralizada de Supabase
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Helper functions optimizadas
function generateCompanyCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getPlanLimits(plan: string) {
  const limits = {
    basic: { max_users: 3, max_clients: 100, max_products: 200, max_storage_mb: 100 },
    pro: { max_users: 10, max_clients: 500, max_products: 1000, max_storage_mb: 500 },
    enterprise: { max_users: 50, max_clients: 2000, max_products: 5000, max_storage_mb: 2000 },
  };
  return limits[plan] || limits.basic;
}

// Validaciones consolidadas
function validateRegistrationData(data: any) {
  const { email, password, nombre, mode, companyData, invitationCode } = data;

  if (!email || !password || !nombre || !mode) {
    return "Email, password, nombre, and mode are required";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Invalid email format";
  }

  if (!password || password.length < 8) {
    return "Password must be at least 8 characters long";
  }

  if (!nombre || nombre.length < 2 || nombre.length > 100) {
    return "Name must be between 2 and 100 characters";
  }

  if (mode === "create") {
    if (!companyData?.companyName || companyData.companyName.length < 2 || companyData.companyName.length > 150) {
      return "Valid company name is required for create mode";
    }
    if (companyData.subscriptionPlan && !["basic", "pro", "enterprise"].includes(companyData.subscriptionPlan)) {
      return "Invalid subscription plan";
    }
  }

  if (mode === "join" && !invitationCode) {
    return "Invitation code is required for join mode";
  }

  return null; // Sin errores
}

// Función para limpiar pathname
function cleanPathname(url: URL): string {
  let pathname = url.pathname;
  
  if (pathname.startsWith("/functions/v1/register")) {
    pathname = pathname.replace("/functions/v1/register", "");
  }
  
  if (pathname === "/register") {
    pathname = "/";
  } else if (pathname.startsWith("/register/")) {
    pathname = pathname.replace("/register", "");
  }
  
  return pathname === "" ? "/" : pathname;
}
// ✅ FUNCIÓN PRINCIPAL OPTIMIZADA
export default withCors(async (req: Request) => {
  const url = new URL(req.url);
  const method = req.method;
  const pathname = cleanPathname(url);

  try {
    // GET / - Información del controlador
    if (method === "GET" && pathname === "/") {
      return createCorsJsonResponse({
        message: "Register Controller is running",
        timestamp: new Date().toISOString(),
        endpoints: [
          "GET / - This info",
          "POST / - Register user with company creation or joining",
          "POST /validate-invitation - Validate invitation code", 
          "POST /check-company-code - Check company code availability",
          "GET /plans - Get subscription plans info",
        ],
      });
    }
    // POST / - Registrar usuario
    if (method === "POST" && pathname === "/") {
      const body = await req.json();
      
      // Validar datos
      const validationError = validateRegistrationData(body);
      if (validationError) {
        return createCorsErrorResponse(validationError, 400);
      }

      const { email, password, nombre, mode, companyData, invitationCode } = body;
      let companyId: string;
      let companyName: string;

      try {
        // Crear o unirse a empresa
        if (mode === "create") {
          const planLimits = getPlanLimits(companyData.subscriptionPlan || "basic");
          
          // Generar código con función de DB, fallback manual
          let companyCode: string;
          const { data: dbCode, error: codeError } = await supabaseAdmin.rpc("generate_company_code", {
            company_name: companyData.companyName,
          });
          
          companyCode = codeError ? generateCompanyCode() : dbCode;
          
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
            throw new Error("Error creating company");
          }

          companyId = company.id;
          companyName = company.company_name;
        } else {
          // Unirse a empresa existente
          const { data: invitation, error: invError } = await supabaseAdmin
            .from("company_invitations")
            .select(`
              company_id,
              companies (id, company_name, is_active)
            `)
            .eq("invitation_code", invitationCode)
            .eq("status", "pending")
            .gte("expires_at", new Date().toISOString())
            .single();

          if (invError || !invitation) {
            return createCorsErrorResponse("Invalid or expired invitation code", 400);
          }

          if (!invitation.companies.is_active) {
            return createCorsErrorResponse("Company is inactive", 400);
          }

          companyId = invitation.company_id;
          companyName = invitation.companies.company_name;

          // Marcar invitación como usada
          await supabaseAdmin
            .from("company_invitations")
            .update({
              status: "used",
              used_at: new Date().toISOString(),
            })
            .eq("invitation_code", invitationCode);
        }

        // Crear usuario en Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: nombre,
            company_id: companyId,
          },
        });

        if (authError) {
          // Limpiar empresa si la creamos y auth falla
          if (mode === "create") {
            await supabaseAdmin.from("companies").delete().eq("id", companyId);
          }
          if (authError.message?.includes("already been registered")) {
            return createCorsErrorResponse("User with this email already exists", 409);
          }
          throw new Error(authError.message);
        }

        // Crear perfil de usuario
        const { data: user, error: userError } = await supabaseAdmin
          .from("users")
          .insert({
            id: authData.user.id,
            nombre,
            email,
            company_id: companyId,
            rol: mode === "create" ? "admin" : "user",
            is_active: true,
          })
          .select()
          .single();

        if (userError) {
          // Limpiar usuario de auth y empresa si falla
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
          if (mode === "create") {
            await supabaseAdmin.from("companies").delete().eq("id", companyId);
          }
          throw new Error("Error creating user profile");
        }

        return createCorsJsonResponse({
          message: "Registration successful",
          user: {
            id: authData.user.id,
            email: authData.user.email,
            nombre: user.nombre,
            rol: user.rol,
          },
          company: {
            id: companyId,
            name: companyName,
            role: user.rol,
          },
          mode,
        }, 201);

      } catch (error: any) {
        return createCorsErrorResponse(error.message || "Registration failed", 500);
      }
    }
    // POST /validate-invitation - Validar código de invitación
    if (method === "POST" && pathname === "/validate-invitation") {
      const { invitationCode } = await req.json();
      
      if (!invitationCode) {
        return createCorsErrorResponse("Invitation code is required", 400);
      }

      const { data: invitation, error } = await supabaseAdmin
        .from("company_invitations")
        .select(`
          invitation_code, status, expires_at,
          companies (company_name, is_active)
        `)
        .eq("invitation_code", invitationCode)
        .single();

      if (error || !invitation) {
        return createCorsJsonResponse({ valid: false, message: "Invalid invitation code" });
      }

      if (invitation.status !== "pending") {
        return createCorsJsonResponse({ valid: false, message: "Invitation code has already been used" });
      }

      if (new Date(invitation.expires_at) < new Date()) {
        return createCorsJsonResponse({ valid: false, message: "Invitation code has expired" });
      }

      if (!invitation.companies.is_active) {
        return createCorsJsonResponse({ valid: false, message: "Company is inactive" });
      }

      return createCorsJsonResponse({
        valid: true,
        companyName: invitation.companies.company_name,
        message: "Valid invitation code",
      });
    }
    // POST /check-company-code - Verificar disponibilidad de código
    if (method === "POST" && pathname === "/check-company-code") {
      const { companyCode } = await req.json();
      
      if (!companyCode) {
        return createCorsErrorResponse("Company code is required", 400);
      }

      const { data: existingCompany } = await supabaseAdmin
        .from("companies")
        .select("id")
        .eq("company_code", companyCode.toUpperCase())
        .single();

      return createCorsJsonResponse({
        available: !existingCompany,
        message: existingCompany ? "Company code is already taken" : "Company code is available",
      });
    }

    // GET /plans - Obtener información de planes
    if (method === "GET" && pathname === "/plans") {
      const plans = [
        {
          id: "basic",
          name: "Básico",
          description: "Ideal para pequeños negocios",
          price: 0,
          currency: "EUR",
          features: ["Hasta 3 usuarios", "Hasta 100 clientes", "Hasta 200 productos", "100 MB de almacenamiento", "Soporte por email"],
          limits: getPlanLimits("basic"),
        },
        {
          id: "pro", 
          name: "Profesional",
          description: "Para empresas en crecimiento",
          price: 29,
          currency: "EUR",
          features: ["Hasta 10 usuarios", "Hasta 500 clientes", "Hasta 1,000 productos", "500 MB de almacenamiento", "Soporte prioritario", "Reportes avanzados"],
          limits: getPlanLimits("pro"),
        },
        {
          id: "enterprise",
          name: "Empresarial", 
          description: "Para grandes organizaciones",
          price: 99,
          currency: "EUR",
          features: ["Hasta 50 usuarios", "Hasta 2,000 clientes", "Hasta 5,000 productos", "2 GB de almacenamiento", "Soporte 24/7", "Integraciones personalizadas", "API completa"],
          limits: getPlanLimits("enterprise"),
        },
      ];

      return createCorsJsonResponse(plans);
    }

    // Ruta no encontrada
    return createCorsJsonResponse({
      message: "Route not found", 
      path: pathname,
      availableRoutes: ["GET /", "POST /", "POST /validate-invitation", "POST /check-company-code", "GET /plans"],
    }, 404);

  } catch (error: any) {
    console.error("❌ Unhandled error:", error);
    return createCorsErrorResponse(`Internal Server Error: ${error.message}`, 500);
  }
});

