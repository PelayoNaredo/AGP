import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { email, action } = await req.json();

    console.log(`🔄 User sync requested for: ${email}, action: ${action}`);

    // Obtener usuario desde auth.users
    const { data: authUsers, error: authError } =
      await supabaseClient.auth.admin.listUsers();

    if (authError) {
      throw new Error(`Error fetching auth users: ${authError.message}`);
    }

    const authUser = authUsers.users.find((u) => u.email === email);

    if (!authUser) {
      throw new Error(`User not found in auth.users: ${email}`);
    }

    console.log(`✅ Found auth user: ${authUser.id}`);

    // 1. Verificar/crear profile
    let { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .single();

    if (profileError && profileError.code === "PGRST116") {
      // Profile no existe, crear uno
      console.log(`🔧 Creating profile for user: ${authUser.id}`);

      const { data: newProfile, error: createProfileError } =
        await supabaseClient
          .from("profiles")
          .insert({
            id: authUser.id,
            nombre: authUser.email.split("@")[0],
            email: authUser.email,
            company_id: "12345678-1234-1234-1234-123456789abc", // Empresa por defecto
            rol: "admin", // Por defecto admin
            activo: true,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

      if (createProfileError) {
        throw new Error(
          `Error creating profile: ${createProfileError.message}`
        );
      }

      profile = newProfile;
      console.log(`✅ Profile created: ${profile.id}`);
    } else if (profileError) {
      throw new Error(`Error fetching profile: ${profileError.message}`);
    } else {
      console.log(`✅ Profile found: ${profile.id}`);
    }

    // 2. Verificar/crear en tabla users personalizada
    let { data: customUser, error: userError } = await supabaseClient
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (userError && userError.code === "PGRST116") {
      // Usuario no existe en tabla users, crear uno
      console.log(`🔧 Creating user in custom users table: ${email}`);

      const { data: newUser, error: createUserError } = await supabaseClient
        .from("users")
        .insert({
          id: authUser.id, // Usar mismo ID que auth.users
          nombre: authUser.email.split("@")[0],
          email: authUser.email,
          company_id: profile.company_id,
          rol: profile.rol,
          activo: true,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createUserError) {
        console.warn(
          `⚠️ Could not create user in custom table: ${createUserError.message}`
        );
        // No lanzar error, continuar con profile
      } else {
        customUser = newUser;
        console.log(`✅ User created in custom table: ${customUser.id}`);
      }
    } else if (userError) {
      console.warn(`⚠️ Could not fetch custom user: ${userError.message}`);
      // No lanzar error, usar profile
    } else {
      console.log(`✅ Custom user found: ${customUser.id}`);

      // Actualizar datos si hay diferencias
      if (
        customUser.company_id !== profile.company_id ||
        customUser.rol !== profile.rol
      ) {
        const { error: updateError } = await supabaseClient
          .from("users")
          .update({
            company_id: profile.company_id,
            rol: profile.rol,
            updated_at: new Date().toISOString(),
          })
          .eq("id", authUser.id);

        if (updateError) {
          console.warn(`⚠️ Could not sync custom user: ${updateError.message}`);
        } else {
          console.log(`🔄 Custom user synced with profile`);
        }
      }
    }

    // 3. Retornar información completa del usuario
    const userData = {
      auth: {
        id: authUser.id,
        email: authUser.email,
        created_at: authUser.created_at,
      },
      profile: profile,
      user: customUser || profile, // Usar customUser si existe, sino profile
      synchronized: true,
    };

    console.log(`✅ User sync completed for: ${email}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: userData,
        message: "User synchronized successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("❌ User sync error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: "Error synchronizing user data",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
