// LOGIN CONTROLLER - VERSIÓN NATIVA SIN HONO
import { createClient } from "jsr:@supabase/supabase-js@^2";

// Validation functions (sin zod)
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  if (!password || password.length < 8 || password.length > 72) {
    return false;
  }
  return true;
}

function validateStrongPassword(password) {
  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return strongPasswordRegex.test(password);
}

// User Login function
async function loginUser(loginData) {
  try {
    const { email, contrasena } = loginData;

    // Validate input
    if (!validateEmail(email)) {
      throw new Error("Email inválido");
    }
    if (!validatePassword(contrasena)) {
      throw new Error("Contraseña debe tener al menos 8 caracteres");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    );

    // Authenticate with Supabase
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.signInWithPassword({
        email: email,
        password: contrasena,
      });

    if (authError || !authData.user) {
      throw new Error("Credenciales inválidas");
    }

    // Fetch user profile
    const { data: userData, error: userError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (userError || !userData) {
      throw new Error("Perfil de usuario no encontrado");
    }

    // Check user account status
    if (!userData.activo) {
      throw new Error("Cuenta de usuario desactivada");
    }

    // Create simple JWT-like payload (usando btoa para simplificar)
    const payload = {
      id_usuario: userData.id,
      email: userData.email,
      nombre: userData.nombre,
      company_id: userData.company_id,
      rol: userData.rol,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 72 * 60 * 60, // 72 hours
    };

    // Create simple token (not cryptographically secure, but functional for dev)
    const token = btoa(JSON.stringify(payload));

    return {
      token: token,
      user: {
        id: userData.id,
        email: userData.email,
        nombre: userData.nombre,
        rol: userData.rol,
        company_id: userData.company_id,
      },
      supabase_session: {
        access_token: authData.session?.access_token,
        refresh_token: authData.session?.refresh_token,
        expires_at: authData.session?.expires_at,
      },
    };
  } catch (error) {
    console.error("Login Error:", error);
    throw error;
  }
}

// Password Reset Request function
async function requestPasswordReset(email) {
  try {
    // Validate input
    if (!validateEmail(email)) {
      throw new Error("Email inválido");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    );

    // Check if user exists
    const { data: userData, error: userError } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .eq("email", email)
      .single();

    if (userError || !userData) {
      throw new Error("Usuario no encontrado");
    }

    // Send password reset email
    const { error: resetError } =
      await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: `${Deno.env.get("FRONTEND_URL") || "http://localhost:3000"}/reset-password`,
      });

    if (resetError) {
      throw new Error("Error al enviar correo de restablecimiento");
    }

    return {
      message: "Correo de restablecimiento de contraseña enviado",
      email: email,
    };
  } catch (error) {
    console.error("Password Reset Request Error:", error);
    throw error;
  }
}

// Change Password function
async function changePassword(userId, passwords) {
  try {
    const { current_password, new_password } = passwords;

    // Validate input
    if (!current_password) {
      throw new Error("Contraseña actual requerida");
    }
    if (!validatePassword(new_password)) {
      throw new Error("Nueva contraseña debe tener al menos 8 caracteres");
    }
    if (!validateStrongPassword(new_password)) {
      throw new Error(
        "Nueva contraseña debe contener mayúsculas, minúsculas, números y caracteres especiales"
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    );

    // Get user data
    const { data: userData, error: getUserError } =
      await supabaseAdmin.auth.admin.getUserById(userId);

    if (getUserError || !userData.user?.email) {
      throw new Error("Usuario no encontrado");
    }

    // Verify current password by attempting to sign in
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.signInWithPassword({
        email: userData.user.email,
        password: current_password,
      });

    if (authError) {
      throw new Error("Contraseña actual incorrecta");
    }

    // Update password
    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: new_password,
      });

    if (updateError) {
      throw new Error("Error al actualizar la contraseña");
    }

    return {
      message: "Contraseña actualizada exitosamente",
    };
  } catch (error) {
    console.error("Change Password Error:", error);
    throw error;
  }
}

// Get user ID from authorization header
async function extractUserId(request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return null;
    }

    // Si es un custom token (base64)
    if (!authHeader.includes(".")) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const payload = JSON.parse(atob(token));
        return payload.id_usuario;
      } catch {
        // Fall through to Supabase token handling
      }
    }

    // Handle Supabase JWT token
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

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return null;
    }

    return user.id;
  } catch (error) {
    console.error("Error extracting user ID:", error);
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
  if (pathname.startsWith("/functions/v1/login")) {
    pathname = pathname.replace("/functions/v1/login", "");
  }

  // Handle direct function calls
  if (pathname === "/login") {
    pathname = "/";
  } else if (pathname.startsWith("/login/")) {
    pathname = pathname.replace("/login", "");
  }

  // Normalize empty path to root
  if (pathname === "" || pathname === "/") {
    pathname = "/";
  }

  console.log(`🔍 ${method} ${pathname} (original: ${url.pathname})`);

  try {
    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/json",
    };

    // Handle preflight requests
    if (method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Route handling
    if (method === "GET" && pathname === "/") {
      // Root endpoint
      return new Response(
        JSON.stringify({
          message: "Login Controller is running",
          timestamp: new Date().toISOString(),
          debug: {
            originalPath: url.pathname,
            processedPath: pathname,
            method: method,
          },
          endpoints: [
            "GET / - This info",
            "POST /auth/login - User login",
            "POST /auth/reset-password - Request password reset",
            "POST /auth/change-password - Change password (requires auth)",
            "GET /auth/verify - Verify token",
          ],
        }),
        {
          status: 200,
          headers: corsHeaders,
        }
      );
    }

    if (method === "POST" && pathname === "/auth/login") {
      // User login
      console.log("🔐 Processing login request...");

      const body = await req.json();
      const result = await loginUser(body);

      console.log("✅ Login successful for user:", result.user.email);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (method === "POST" && pathname === "/auth/reset-password") {
      // Password reset request
      console.log("📧 Processing password reset request...");

      const body = await req.json();
      const result = await requestPasswordReset(body.email);

      console.log("✅ Password reset email sent to:", body.email);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (method === "POST" && pathname === "/auth/change-password") {
      // Change password
      console.log("🔒 Processing password change...");

      const userId = await extractUserId(req);
      if (!userId) {
        return new Response(
          JSON.stringify({
            error: "Unauthorized - User ID not found",
          }),
          {
            status: 401,
            headers: corsHeaders,
          }
        );
      }

      const body = await req.json();
      const result = await changePassword(userId, body);

      console.log("✅ Password changed for user:", userId);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (method === "GET" && pathname === "/auth/verify") {
      // Verify token
      console.log("🔍 Verifying token...");

      const userId = await extractUserId(req);
      if (!userId) {
        return new Response(
          JSON.stringify({
            valid: false,
            error: "Invalid or missing token",
          }),
          {
            status: 401,
            headers: corsHeaders,
          }
        );
      }

      // Get user data to return in verification
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL"),
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
      );

      const { data: userData, error: userError } = await supabaseAdmin
        .from("profiles")
        .select("id, email, nombre, rol, company_id, activo")
        .eq("id", userId)
        .single();

      if (userError || !userData || !userData.activo) {
        return new Response(
          JSON.stringify({
            valid: false,
            error: "User not found or inactive",
          }),
          {
            status: 401,
            headers: corsHeaders,
          }
        );
      }

      console.log("✅ Token verified for user:", userData.email);
      return new Response(
        JSON.stringify({
          valid: true,
          user: {
            id: userData.id,
            email: userData.email,
            nombre: userData.nombre,
            rol: userData.rol,
            company_id: userData.company_id,
          },
        }),
        {
          status: 200,
          headers: corsHeaders,
        }
      );
    }

    // Default 404 for unmatched routes
    console.log("❌ Route not found:", pathname);
    return new Response(
      JSON.stringify({
        message: "Route not found",
        path: pathname,
        availableRoutes: [
          "/",
          "/auth/login",
          "/auth/reset-password",
          "/auth/change-password",
          "/auth/verify",
        ],
      }),
      {
        status: 404,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("❌ Unhandled error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal Server Error",
      }),
      {
        status: error.message ? 400 : 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      }
    );
  }
});
