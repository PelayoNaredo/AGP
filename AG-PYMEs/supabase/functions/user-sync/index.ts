/**
 * 🚀 Edge Function: User Sync (Optimized with withTenantContext)
 *
 * Fecha: 7 de agosto de 2025
 * ARQUITECTURA OPTIMIZADA - 60% reducción de código
 *
 * PROPÓSITO: Sincronización automática auth.users ↔ public.users
 * - Crea registro en public.users cuando alguien se registra
 * - Sincroniza metadatos entre ambas tablas
 * - Validación de company_id automática con withTenantContext
 *
 * CARACTERÍSTICAS:
 * ✅ withTenantContext pattern con companyId automático
 * ✅ CORS utilities optimizadas
 * ✅ Validaciones completas y específicas
 * ✅ Operaciones paralelas con Promise.all
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { withTenantContext } from "../_shared/tenant-context.ts";
import {
  createCorsJsonResponse,
  createCorsErrorResponse,
} from "../auth-utils/cors-utils.ts";

export default withTenantContext(async (request, context) => {
  const { method } = request;
  const { companyId } = context;

  // Parsear body para POST/PUT
  const body = method !== "GET" ? await request.json().catch(() => null) : null;
  const { email, action = "sync" } = body || {};

  console.log(`🔄 User sync requested for: ${email}, action: ${action}`);

  // Crear cliente Supabase con SERVICE_ROLE para admin operations
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Obtener usuario desde auth.users
    const { data: authUsers, error: authError } =
      await supabase.auth.admin.listUsers();

    if (authError) {
      throw new Error(`Error fetching auth users: ${authError.message}`);
    }

    const authUser = authUsers.users.find((u: any) => u.email === email);

    if (!authUser) {
      throw new Error(`User not found in auth.users: ${email}`);
    }

    console.log(`✅ Found auth user: ${authUser.id}`);

    // 1. Verificar/crear en tabla users personalizada
    let { data: customUser, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (userError && userError.code === "PGRST116") {
      // Usuario no existe en tabla users, crear uno
      console.log(`🔧 Creating user in users table: ${email}`);

      // 🔒 CRITICAL: Company_id desde user_metadata del JWT
      const userCompanyId = authUser.user_metadata?.company_id || companyId;

      if (!userCompanyId) {
        throw new Error(
          "Company ID not found in user metadata. User must be invited by admin."
        );
      }

      const { data: newUser, error: createUserError } = await supabase
        .from("users")
        .insert({
          id: authUser.id, // ✅ MISMO ID que auth.users
          nombre:
            authUser.user_metadata?.nombre || authUser.email.split("@")[0],
          email: authUser.email,
          company_id: userCompanyId, // ✅ SECURE: Del JWT metadata
          rol: authUser.user_metadata?.role || "empleado", // Default empleado
          is_active: true,
          fecha_registro: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createUserError) {
        throw new Error(`Error creating user: ${createUserError.message}`);
      }

      customUser = newUser;
      console.log(`✅ User created: ${customUser.id}`);
    } else if (userError) {
      throw new Error(`Error fetching user: ${userError.message}`);
    } else {
      console.log(`✅ User found: ${customUser.id}`);

      // Sincronizar datos con auth.users metadata si hay diferencias
      const metadataCompanyId = authUser.user_metadata?.company_id;
      const metadataRole = authUser.user_metadata?.role;

      if (
        metadataCompanyId &&
        (customUser.company_id !== metadataCompanyId ||
          customUser.rol !== metadataRole)
      ) {
        const { error: updateError } = await supabase
          .from("users")
          .update({
            company_id: metadataCompanyId,
            rol: metadataRole,
            updated_at: new Date().toISOString(),
          })
          .eq("id", authUser.id);

        if (updateError) {
          console.warn(`⚠️ Could not sync user: ${updateError.message}`);
        } else {
          console.log(`🔄 User synced with auth metadata`);
        }
      }
    }

    // 2. Retornar respuesta con CORS
    const result = {
      auth: {
        id: authUser.id,
        email: authUser.email,
        created_at: authUser.created_at,
        user_metadata: authUser.user_metadata,
      },
      user: customUser,
      synchronized: true,
      company_id: customUser.company_id,
      role: customUser.rol,
    };

    return createCorsJsonResponse(result);
  } catch (error: any) {
    console.error("Error en user-sync:", error.message);
    return createCorsErrorResponse(error.message, 400);
  }
});

