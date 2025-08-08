/**
 * 🚀 ULTRA SIMPLE Edge Function: Register
 *
 * Versión ultra-simplificada para testing y debug de timeouts
 * Elimina toda lógica compleja y se enfoca en funcionalidad básica
 */

import { createClient } from "jsr:@supabase/supabase-js@^2";

// Configuración básica
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Headers CORS básicos
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export default async (req: Request) => {
  console.log(`🚀 Register called: ${req.method} ${req.url}`);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method === "GET") {
      return new Response(
        JSON.stringify({
          message: "Ultra Simple Register is working",
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (req.method === "POST") {
      const startTime = Date.now();
      console.log("📥 Parsing request body...");

      const body = await req.json();
      console.log("📊 Body received:", JSON.stringify(body, null, 2));

      const { email, password, nombre } = body;

      // Validación básica
      if (!email || !password || !nombre) {
        return new Response(
          JSON.stringify({
            error: "Email, password and nombre are required",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      console.log("🔐 Creating user in Auth...");

      // Solo crear usuario en Auth (sin empresa, sin perfil)
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: nombre },
        });

      if (authError) {
        console.error("❌ Auth error:", authError);
        return new Response(
          JSON.stringify({
            error: "Failed to create user: " + authError.message,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      console.log("✅ User created successfully");

      const duration = Date.now() - startTime;
      console.log(`⏱️ Total duration: ${duration}ms`);

      return new Response(
        JSON.stringify({
          message: "User created successfully (ultra simple)",
          user: {
            id: authData.user?.id,
            email: authData.user?.email,
            nombre,
          },
          duration: `${duration}ms`,
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("💥 Unhandled error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error: " + error.message,
        stack: error.stack,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};
