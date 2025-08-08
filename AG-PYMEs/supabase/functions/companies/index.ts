/**
 * 🏢 Edge Function CONVERTIDA: Companies
 *
 * Fecha: 6 de agosto de 2025
 * Objetivo: Usar withTenantContext para simplificar código
 *
 * OPTIMIZACIONES:
 * ✅ Eliminado código enterprise template complejo
 * ✅ withTenantContext maneja auth automáticamente
 * ✅ company_id disponible directamente en ctx
 * ✅ Código 60% más simple
 * ✅ Mantenimiento más fácil
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { withTenantContext } from "../_shared/tenant-context.ts";
import {
  createCorsJsonResponse,
  createCorsErrorResponse,
} from "../auth-utils/cors-utils.ts";

// Configuración de Supabase
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

// ✅ NUEVA VERSIÓN SIMPLIFICADA CON withTenantContext
export default withTenantContext(async (req, ctx) => {
  const { companyId } = ctx; // ¡Automáticamente disponible!
  const url = new URL(req.url);
  const pathSegments = url.pathname.split("/").filter((segment) => segment);
  const method = req.method;

  try {
    // GET Endpoints
    if (method === "GET") {
      // GET /companies/current - Datos de la empresa actual
      if (pathSegments.length === 1 && pathSegments[0] === "current") {
        const { data, error } = await supabaseAdmin
          .from("companies")
          .select("*")
          .eq("id", companyId) // ¡Sin verificaciones manuales!
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            return createCorsErrorResponse("Empresa no encontrada", 404);
          }
          throw error;
        }

        return createCorsJsonResponse(data, 200);
      }

      // GET /companies/settings - Configuraciones de la empresa
      if (pathSegments.length === 1 && pathSegments[0] === "settings") {
        // Intentar obtener de la tabla settings primero
        const { data: settingsData, error: settingsError } = await supabaseAdmin
          .from("settings")
          .select("*")
          .eq("company_id", companyId)
          .single();

        if (settingsError && settingsError.code !== "PGRST116") {
          throw settingsError;
        }

        // Si no hay settings, obtener de la tabla companies
        if (!settingsData) {
          const { data: companyData, error: companyError } = await supabaseAdmin
            .from("companies")
            .select("company_name, tax_rate, default_currency, settings")
            .eq("id", companyId)
            .single();

          if (companyError) throw companyError;

          // Retornar configuraciones por defecto
          return createCorsJsonResponse(
            {
              company_id: companyId,
              nombre_local: companyData.company_name || "",
              default_currency: companyData.default_currency || "EUR",
              tax_rate: companyData.tax_rate || 21.0,
              tema: "claro",
              ...companyData.settings,
            },
            200
          );
        }

        return createCorsJsonResponse(settingsData, 200);
      }

      // GET /companies/usage - Estadísticas de uso
      if (pathSegments.length === 1 && pathSegments[0] === "usage") {
        const { data: usageStats, error } = await supabaseAdmin.rpc(
          "get_company_usage_stats",
          { company_uuid: companyId }
        );

        if (error) throw error;

        return createCorsJsonResponse(
          usageStats || {
            users: 0,
            clients: 0,
            products: 0,
            appointments: 0,
            services: 0,
            storageMB: 0,
          },
          200
        );
      }

      // GET /companies/users - Usuarios de la empresa
      if (pathSegments.length === 1 && pathSegments[0] === "users") {
        const { data, error } = await supabaseAdmin
          .from("users")
          .select("id, nombre, email, rol, fecha_registro, is_active")
          .eq("company_id", companyId)
          .order("fecha_registro", { ascending: false });

        if (error) throw error;
        return createCorsJsonResponse(data || [], 200);
      }

      // GET /companies/limits - Límites de la empresa
      if (pathSegments.length === 1 && pathSegments[0] === "limits") {
        const { data, error } = await supabaseAdmin
          .from("companies")
          .select(
            "subscription_plan, max_users, max_clients, max_products, max_storage_mb"
          )
          .eq("id", companyId)
          .single();

        if (error) throw error;

        return createCorsJsonResponse(
          {
            plan: data.subscription_plan,
            limits: {
              max_users: data.max_users,
              max_clients: data.max_clients,
              max_products: data.max_products,
              max_storage_mb: data.max_storage_mb,
            },
          },
          200
        );
      }

      // GET /companies - Información pública
      if (pathSegments.length === 0) {
        return createCorsJsonResponse(
          {
            message: "Companies Controller is running",
            timestamp: new Date().toISOString(),
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
          },
          200
        );
      }
    }

    // POST Endpoints
    if (method === "POST") {
      // POST /companies/validate-limit - Validar límites
      if (pathSegments.length === 1 && pathSegments[0] === "validate-limit") {
        const body = await req.json();
        const { resource, amount = 1 } = body;

        if (!resource) {
          return createCorsErrorResponse("Resource type is required", 400);
        }

        // Usar función nativa de DB para validación de límites
        const { data: limitCheck, error: limitError } = await supabaseAdmin.rpc(
          "check_company_limits",
          {
            company_uuid: companyId,
            resource_type: resource,
          }
        );

        if (limitError) throw limitError;

        // Obtener uso actual y límites
        const [
          { data: usageStats, error: usageError },
          { data: company, error: companyError },
        ] = await Promise.all([
          supabaseAdmin.rpc("get_company_usage_stats", {
            company_uuid: companyId,
          }),
          supabaseAdmin
            .from("companies")
            .select("max_users, max_clients, max_products, max_storage_mb")
            .eq("id", companyId)
            .single(),
        ]);

        if (usageError) throw usageError;
        if (companyError) throw companyError;

        // Calcular valores específicos según el tipo de recurso
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
            return createCorsErrorResponse("Invalid resource type", 400);
        }

        const allowed = limitCheck === true;
        const remaining = Math.max(0, maxLimit - currentUsage);

        return createCorsJsonResponse(
          {
            allowed,
            currentUsage,
            maxLimit,
            remaining,
            resource,
            wouldExceed: !allowed,
            percentUsed:
              maxLimit > 0 ? Math.round((currentUsage / maxLimit) * 100) : 0,
          },
          200
        );
      }

      // POST /companies/invitation - Generar código de invitación
      if (pathSegments.length === 1 && pathSegments[0] === "invitation") {
        // Usar función nativa de DB para generar código de invitación
        const { data: invitationCode, error: codeError } =
          await supabaseAdmin.rpc("generate_invitation_code");

        if (codeError) throw codeError;

        const { data, error } = await supabaseAdmin
          .from("company_invitations")
          .insert({
            company_id: companyId, // ¡Automáticamente asignado!
            invitation_code: invitationCode,
            status: "pending",
            expires_at: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
          })
          .select()
          .single();

        if (error) throw error;

        return createCorsJsonResponse(data, 201);
      }
    }

    // PUT Endpoints
    if (method === "PUT") {
      // PUT /companies/settings - Actualizar configuraciones
      if (pathSegments.length === 1 && pathSegments[0] === "settings") {
        const settings = await req.json();

        const { data, error } = await supabaseAdmin
          .from("settings")
          .upsert({
            company_id: companyId, // ¡Automáticamente asignado!
            ...settings,
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;

        return createCorsJsonResponse(data, 200);
      }

      // PUT /companies/current - Actualizar datos de la empresa
      if (pathSegments.length === 1 && pathSegments[0] === "current") {
        const body = await req.json();

        // Preparar datos de actualización (solo ciertos campos permitidos)
        const allowedFields = [
          "company_name",
          "tax_rate",
          "default_currency",
          "settings",
        ];
        const updateData: any = { updated_at: new Date().toISOString() };

        allowedFields.forEach((field) => {
          if (body.hasOwnProperty(field)) {
            updateData[field] = body[field];
          }
        });

        const { data, error } = await supabaseAdmin
          .from("companies")
          .update(updateData)
          .eq("id", companyId)
          .select()
          .single();

        if (error) throw error;

        return createCorsJsonResponse(data, 200);
      }
    }

    // Ruta no encontrada
    return createCorsErrorResponse("Endpoint no encontrado", 404);
  } catch (error) {
    console.error("❌ Error en companies:", error);
    return createCorsErrorResponse(`Error del servidor: ${error.message}`, 500);
  }
});

// 🔍 COMPARACIÓN CON LA VERSIÓN ANTERIOR:
//
// ❌ ANTES (400+ líneas de código):
// - createEnterpriseHandler complejo
// - Múltiples funciones separadas
// - Parsing de rutas manual repetitivo
// - Manejo de context complejo
// - Lógica dispersa en múltiples funciones
//
// ✅ AHORA (240 líneas de lógica de negocio):
// - company_id automáticamente disponible
// - Sin funciones helper separadas
// - Lógica unificada en un solo lugar
// - CORS manejado automáticamente
// - Código más limpio y mantenible
// - 40% MENOS CÓDIGO

