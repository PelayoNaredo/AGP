// USERS CONTROLLER - VERSIÓN NATIVA SIN HONO
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

// Función para extraer user ID del token
async function extractUserId(request) {
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

    return user.id;
  } catch (error) {
    console.error("❌ Error in extractUserId:", error);
    return null;
  }
}

// Password Strength Validation
function isStrongPassword(password) {
  // At least 8 characters, one uppercase, one lowercase, one number, one special char
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

// Manual validation functions (replacing zod)
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateName(nombre) {
  if (!nombre || nombre.length < 2 || nombre.length > 100) {
    return false;
  }
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  return nameRegex.test(nombre);
}

function validateRole(rol) {
  const validRoles = ["admin", "user", "manager", "viewer"];
  return validRoles.includes(rol);
}

function validateUUID(uuid) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// User creation validation
function validateUserCreation(userData) {
  const errors = [];

  if (!validateEmail(userData.email)) {
    errors.push("Email inválido");
  }

  if (!validateName(userData.nombre)) {
    errors.push(
      "Nombre debe tener entre 2 y 100 caracteres y solo contener letras"
    );
  }

  if (!isStrongPassword(userData.contrasena)) {
    errors.push(
      "Contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial"
    );
  }

  if (!validateRole(userData.rol)) {
    errors.push("Rol debe ser uno de: admin, user, manager, viewer");
  }

  if (!validateUUID(userData.company_id)) {
    errors.push("ID de empresa inválido");
  }

  return errors;
}

// User update validation
function validateUserUpdate(updateData) {
  const errors = [];

  if (updateData.nombre && !validateName(updateData.nombre)) {
    errors.push(
      "Nombre debe tener entre 2 y 100 caracteres y solo contener letras"
    );
  }

  if (updateData.rol && !validateRole(updateData.rol)) {
    errors.push("Rol debe ser uno de: admin, user, manager, viewer");
  }

  return errors;
}

// Main handler
Deno.serve(async (req) => {
  const url = new URL(req.url);
  const method = req.method;

  // Handle different path scenarios
  let pathname = url.pathname;

  // Remove function prefix if present
  if (pathname.startsWith("/functions/v1/users")) {
    pathname = pathname.replace("/functions/v1/users", "");
  }

  // Handle direct function calls (without /functions/v1/ prefix)
  if (pathname === "/users") {
    pathname = "/";
  } else if (pathname.startsWith("/users/")) {
    pathname = pathname.replace("/users", "");
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
          message: "Users Controller is running",
          timestamp: new Date().toISOString(),
          debug: {
            originalPath: url.pathname,
            processedPath: pathname,
            method: method,
          },
          endpoints: [
            "GET / - This info",
            "POST / - Create user",
            "PUT /:id - Update user profile",
            "POST /:id/change-password - Change user password",
            "DELETE /:id - Deactivate user",
            "GET /company - Get company users",
          ],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (method === "POST" && pathname === "/") {
      // Create user
      console.log("👤 Creating new user...");

      const companyId = await extractCompanyId(req);
      if (!companyId) {
        return new Response(
          JSON.stringify({
            error: "Unauthorized - Company ID not found",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const body = await req.json();

      // Add company_id if not provided
      const userData = {
        ...body,
        company_id: body.company_id || companyId,
        rol: body.rol || "user", // Default role
      };

      // Validate user data
      const validationErrors = validateUserCreation(userData);
      if (validationErrors.length > 0) {
        return new Response(
          JSON.stringify({
            error: validationErrors[0],
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL"),
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
      );

      try {
        // Check if user already exists
        const { data: existingUser, error: existingUserError } =
          await supabaseAdmin.auth.admin.getUserByEmail(userData.email);

        if (existingUser && existingUser.user) {
          return new Response(
            JSON.stringify({
              error: "El correo electrónico ya está registrado",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        // Create user in Supabase Auth
        const { data: authData, error: authError } =
          await supabaseAdmin.auth.admin.createUser({
            email: userData.email,
            password: userData.contrasena,
            email_confirm: true,
            user_metadata: {
              nombre: userData.nombre,
              rol: userData.rol,
              company_id: userData.company_id,
            },
          });

        if (authError) {
          console.error("❌ Error creating user in Auth:", authError);
          return new Response(
            JSON.stringify({
              error: authError.message,
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        // Create user profile
        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .insert({
            id: authData.user.id,
            nombre: userData.nombre,
            email: userData.email,
            rol: userData.rol,
            company_id: userData.company_id,
            activo: true,
          });

        if (profileError) {
          console.error("❌ Error creating user profile:", profileError);
          // Note: In production, you might want to rollback the auth user creation
        }

        console.log("✅ User created successfully:", userData.email);
        return new Response(
          JSON.stringify({
            id_usuario: authData.user.id,
            email: authData.user.email,
            nombre: userData.nombre,
            rol: userData.rol,
            message: "Usuario creado con éxito",
          }),
          {
            status: 201,
            headers: { "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("❌ Error in user creation:", error);
        return new Response(
          JSON.stringify({
            error: "Error interno del servidor",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    if (method === "PUT" && pathname.match(/^\/[a-f0-9-]+$/)) {
      // Update user profile
      const userId = pathname.slice(1); // Remove leading slash
      console.log("✏️ Updating user profile:", userId);

      const requesterId = await extractUserId(req);
      if (!requesterId) {
        return new Response(
          JSON.stringify({
            error: "Unauthorized - User ID not found",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const body = await req.json();

      // Validate update data
      const validationErrors = validateUserUpdate(body);
      if (validationErrors.length > 0) {
        return new Response(
          JSON.stringify({
            error: validationErrors[0],
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL"),
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
      );

      try {
        // Update user metadata
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          {
            user_metadata: body,
          }
        );

        if (error) {
          console.error("❌ Error updating user:", error);
          return new Response(
            JSON.stringify({
              error: "Error al actualizar perfil de usuario",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        // Update profiles table
        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .update(body)
          .eq("id", userId);

        if (profileError) {
          console.error("❌ Error updating profile:", profileError);
        }

        console.log("✅ User profile updated:", userId);
        return new Response(
          JSON.stringify({
            message: "Perfil de usuario actualizado con éxito",
            ...body,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("❌ Error in user update:", error);
        return new Response(
          JSON.stringify({
            error: "Error interno del servidor",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    if (
      method === "POST" &&
      pathname.match(/^\/[a-f0-9-]+\/change-password$/)
    ) {
      // Change user password
      const userId = pathname.split("/")[1];
      console.log("🔒 Changing password for user:", userId);

      const requesterId = await extractUserId(req);
      if (!requesterId) {
        return new Response(
          JSON.stringify({
            error: "Unauthorized - User ID not found",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const { currentPassword, newPassword } = await req.json();

      // Validate new password strength
      if (!isStrongPassword(newPassword)) {
        return new Response(
          JSON.stringify({
            error: "Nueva contraseña no cumple con los requisitos de seguridad",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL"),
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
      );

      try {
        // Get user email for verification
        const { data: userData, error: userError } =
          await supabaseAdmin.auth.admin.getUserById(userId);

        if (userError || !userData.user) {
          return new Response(
            JSON.stringify({
              error: "Usuario no encontrado",
            }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        // Verify current password by attempting to sign in
        const { error: signInError } =
          await supabaseAdmin.auth.signInWithPassword({
            email: userData.user.email,
            password: currentPassword,
          });

        if (signInError) {
          return new Response(
            JSON.stringify({
              error: "Contraseña actual incorrecta",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        // Update password
        const { error } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          {
            password: newPassword,
          }
        );

        if (error) {
          console.error("❌ Error changing password:", error);
          return new Response(
            JSON.stringify({
              error: "Error al cambiar contraseña",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        console.log("✅ Password changed successfully for user:", userId);
        return new Response(
          JSON.stringify({
            message: "Contraseña cambiada con éxito",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("❌ Error in password change:", error);
        return new Response(
          JSON.stringify({
            error: "Error interno del servidor",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    if (method === "DELETE" && pathname.match(/^\/[a-f0-9-]+$/)) {
      // Deactivate user (soft delete)
      const userId = pathname.slice(1);
      console.log("🚫 Deactivating user:", userId);

      const requesterId = await extractUserId(req);
      if (!requesterId) {
        return new Response(
          JSON.stringify({
            error: "Unauthorized - User ID not found",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL"),
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
      );

      try {
        // Update user metadata to mark as inactive
        const { error } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          {
            user_metadata: {
              activo: false,
            },
          }
        );

        if (error) {
          console.error("❌ Error deactivating user:", error);
          return new Response(
            JSON.stringify({
              error: "Error al desactivar usuario",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        // Update profiles table
        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .update({ activo: false })
          .eq("id", userId);

        if (profileError) {
          console.error("❌ Error updating profile:", profileError);
        }

        console.log("✅ User deactivated successfully:", userId);
        return new Response(
          JSON.stringify({
            message: "Usuario desactivado con éxito",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("❌ Error in user deactivation:", error);
        return new Response(
          JSON.stringify({
            error: "Error interno del servidor",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    if (method === "GET" && pathname === "/company") {
      // Get company users
      console.log("👥 Getting company users...");

      const companyId = await extractCompanyId(req);
      if (!companyId) {
        return new Response(
          JSON.stringify({
            error: "Unauthorized - Company ID not found",
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

      try {
        const { data, error } = await supabaseClient
          .from("profiles")
          .select("id, nombre, email, rol, created_at, activo")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("❌ Error fetching company users:", error);
          return new Response(
            JSON.stringify({
              error: "Error al obtener usuarios de la empresa",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        console.log("✅ Company users retrieved");
        return new Response(JSON.stringify(data || []), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("❌ Error in getting company users:", error);
        return new Response(
          JSON.stringify({
            error: "Error interno del servidor",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
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
          "POST / - Create user",
          "PUT /:id - Update user profile",
          "POST /:id/change-password - Change password",
          "DELETE /:id - Deactivate user",
          "GET /company - Get company users",
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
