/**
 * 🚀 Edge Function: Users Controller (Enterprise Template)
 *
 * Fecha: 2 de agosto de 2025
 * FASE 3: Arquitectura empresarial unificada
 *
 * CARACTERÍSTICAS:
 * ✅ Enterprise template con funciones nativas DB
 * ✅ Autenticación con auth.uid() y auth.email()
 * ✅ RLS automático con set_current_company_id()
 * ✅ Límites de empresa con check_company_limits()
 * ✅ Auditoría con get_company_usage_stats()
 */

import {
  withCors,
  createCorsJsonResponse,
  createCorsErrorResponse,
} from "../auth-utils/cors-utils.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createEnterpriseHandler } from "../_shared/enterprise-template.ts";

// 🚀 Enterprise Handler: Users Management
export default withCors(
  createEnterpriseHandler(async (req, context) => {
    const url = new URL(req.url);
    const method = req.method;
    let body = null;

    if (method !== "GET" && method !== "DELETE") {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }

    const pathSegments = url.pathname.split("/").filter(Boolean);
    const cleanPath = pathSegments.filter(
      (segment) =>
        segment !== "functions" && segment !== "v1" && segment !== "users"
    );

    // Crear cliente Supabase con contexto empresarial
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Routing
    if (method === "GET") {
      if (cleanPath.length === 0) {
        // GET /users - Lista de usuarios
        return await getUsersList(supabase, context, url.searchParams);
      } else if (cleanPath.length === 1) {
        if (cleanPath[0] === "current") {
          // GET /users/current - Usuario actual
          return await getCurrentUser(supabase, context);
        } else {
          // GET /users/:id - Usuario específico
          const userId = cleanPath[0];
          return await getUser(supabase, context, userId);
        }
      }
    }

    if (method === "PUT" && cleanPath.length === 1) {
      // PUT /users/:id - Actualizar usuario
      const userId = cleanPath[0];
      return await updateUser(supabase, context, userId, body);
    }

    if (method === "DELETE" && cleanPath.length === 1) {
      // DELETE /users/:id - Desactivar usuario
      const userId = cleanPath[0];
      return await deactivateUser(supabase, context, userId);
    }

    throw new Error("Route not found");
  })
);

/**
 * 🔍 Obtener lista de usuarios de la empresa
 */
async function getUsersList(
  supabase: any,
  context: any,
  queryParams: URLSearchParams
) {
  // Paginación
  const page = parseInt(queryParams.get("page") || "1");
  const limit = Math.min(parseInt(queryParams.get("limit") || "50"), 100);
  const offset = (page - 1) * limit;

  // Filtros
  const search = queryParams.get("search");
  const rol = queryParams.get("rol");
  const activo = queryParams.get("activo");

  let query = supabase
    .from("users")
    .select(
      `
      id,
      nombre,
      email,
      rol,
      is_active,
      fecha_registro,
      last_login,
      permissions
    `
    )
    .eq("company_id", context.company_id)
    .order("fecha_registro", { ascending: false });

  // Aplicar filtros
  if (search) {
    query = query.or(`nombre.ilike.%${search}%,email.ilike.%${search}%`);
  }

  if (rol && rol !== "all") {
    query = query.eq("rol", rol);
  }

  if (activo && activo !== "all") {
    query = query.eq("is_active", activo === "true");
  }

  // Paginación
  query = query.range(offset, offset + limit - 1);

  const { data: users, error } = await query;

  if (error) {
    throw new Error(`Error fetching users: ${error.message}`);
  }

  // Count total para paginación
  let countQuery = supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("company_id", context.company_id);

  if (search) {
    countQuery = countQuery.or(
      `nombre.ilike.%${search}%,email.ilike.%${search}%`
    );
  }

  if (rol && rol !== "all") {
    countQuery = countQuery.eq("rol", rol);
  }

  if (activo && activo !== "all") {
    countQuery = countQuery.eq("is_active", activo === "true");
  }

  const { count, error: countError } = await countQuery;

  if (countError) {
    console.warn("Warning counting users:", countError);
  }

  const totalPages = Math.ceil((count || 0) / limit);

  return {
    users: users,
    pagination: {
      page: page,
      limit: limit,
      total: count || 0,
      totalPages: totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * 👤 Obtener usuario actual
 */
async function getCurrentUser(supabase: any, context: any) {
  const { data: user, error } = await supabase
    .from("users")
    .select(
      `
      id,
      nombre,
      email,
      rol,
      is_active,
      fecha_registro,
      last_login,
      permissions,
      user_settings,
      company_id
    `
    )
    .eq("id", context.user_id)
    .eq("company_id", context.company_id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw new Error("Current user not found");
    }
    throw new Error(`Error fetching current user: ${error.message}`);
  }

  return user;
}

/**
 * 👤 Obtener usuario específico
 */
async function getUser(supabase: any, context: any, userId: string) {
  const { data: user, error } = await supabase
    .from("users")
    .select(
      `
      id,
      nombre,
      email,
      rol,
      is_active,
      fecha_registro,
      last_login,
      permissions,
      user_settings
    `
    )
    .eq("id", userId)
    .eq("company_id", context.company_id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw new Error("User not found");
    }
    throw new Error(`Error fetching user: ${error.message}`);
  }

  return user;
}

/**
 * ✏️ Actualizar usuario
 */
async function updateUser(
  supabase: any,
  context: any,
  userId: string,
  updateData: any
) {
  // Verificar permisos - solo admins pueden actualizar otros usuarios
  if (context.user_id !== userId && context.role !== "admin") {
    throw new Error("Insufficient permissions to update other users");
  }

  // Campos permitidos para actualización
  const allowedFields = [
    "nombre",
    "rol",
    "is_active",
    "permissions",
    "user_settings",
  ];

  const filteredData: any = {};
  allowedFields.forEach((field) => {
    if (updateData.hasOwnProperty(field)) {
      filteredData[field] = updateData[field];
    }
  });

  // Validar rol si se está actualizando
  if (filteredData.rol) {
    const validRoles = ["admin", "empleado", "viewer"];
    if (!validRoles.includes(filteredData.rol)) {
      throw new Error(`Invalid role: ${filteredData.rol}`);
    }
  }

  filteredData.updated_at = new Date().toISOString();

  const { data: updatedUser, error } = await supabase
    .from("users")
    .update(filteredData)
    .eq("id", userId)
    .eq("company_id", context.company_id)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating user: ${error.message}`);
  }

  // Si se actualiza el rol, sincronizar con auth.users metadata
  if (filteredData.rol) {
    try {
      const { error: authError } = await supabase.auth.admin.updateUserById(
        userId,
        {
          user_metadata: {
            role: filteredData.rol,
            company_id: context.company_id,
          },
        }
      );

      if (authError) {
        console.warn("Warning updating auth metadata:", authError);
      }
    } catch (authSyncError) {
      console.warn("Warning syncing auth metadata:", authSyncError);
    }
  }

  return updatedUser;
}

/**
 * 🗑️ Desactivar usuario
 */
async function deactivateUser(supabase: any, context: any, userId: string) {
  // Solo admins pueden desactivar usuarios
  if (context.role !== "admin") {
    throw new Error("Only admins can deactivate users");
  }

  // No puede desactivarse a sí mismo
  if (context.user_id === userId) {
    throw new Error("Cannot deactivate yourself");
  }

  const { data: deactivatedUser, error } = await supabase
    .from("users")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .eq("company_id", context.company_id)
    .select()
    .single();

  if (error) {
    throw new Error(`Error deactivating user: ${error.message}`);
  }

  return deactivatedUser;
}
