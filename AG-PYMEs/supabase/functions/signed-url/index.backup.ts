import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  withCors,
  createCorsJsonResponse,
  createCorsErrorResponse,
} from "../auth-utils/cors-utils.ts";

export default withCors(async (req: Request) => {
  try {
    // Extraer token de autorización
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verificar usuario autenticado
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Invalid token");
    }

    // 🔒 SECURE: Obtener company_id desde JWT metadata
    const companyId = user.user_metadata?.company_id;

    if (!companyId) {
      throw new Error("Company ID not found in user metadata");
    }

    const url = new URL(req.url);
    const method = req.method;

    console.log(`🔗 Signed URL request: ${method} ${url.pathname}`);

    if (method === "POST" && url.pathname.includes("/upload")) {
      // Generar signed URL para upload
      const { fileName, contentType } = await req.json();

      if (!fileName || !contentType) {
        throw new Error("fileName and contentType are required");
      }

      // Validar tipos de archivo permitidos
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];

      if (!allowedTypes.includes(contentType)) {
        throw new Error(`File type ${contentType} not allowed`);
      }

      // Generar path único con company_id
      const timestamp = Date.now();
      const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `${companyId}/${timestamp}-${cleanFileName}`;

      // Generar signed URL para upload
      const { data, error } = await supabaseClient.storage
        .from("company-files")
        .createSignedUploadUrl(filePath);

      if (error) {
        throw new Error(`Error generating upload URL: ${error.message}`);
      }

      console.log(`✅ Upload URL generated for: ${filePath}`);

      return createCorsJsonResponse({
        success: true,
        uploadUrl: data.signedUrl,
        filePath: filePath,
        fileName: cleanFileName,
        expiresIn: 3600,
      });
    }

    if (method === "POST" && url.pathname.includes("/download")) {
      // Generar signed URL para download
      const { filePath } = await req.json();

      if (!filePath) {
        throw new Error("filePath is required");
      }

      // Validar que el archivo pertenece a la empresa del usuario
      if (!filePath.startsWith(companyId + "/")) {
        throw new Error("Access denied: File does not belong to your company");
      }

      // Generar signed URL para download
      const { data, error } = await supabaseClient.storage
        .from("company-files")
        .createSignedUrl(filePath, 3600);

      if (error) {
        throw new Error(`Error generating download URL: ${error.message}`);
      }

      console.log(`✅ Download URL generated for: ${filePath}`);

      return createCorsJsonResponse({
        success: true,
        downloadUrl: data.signedUrl,
        filePath: filePath,
        expiresIn: 3600,
      });
    }

    if (method === "GET") {
      // Listar archivos de la empresa
      const { data: files, error } = await supabaseClient.storage
        .from("company-files")
        .list(companyId, {
          limit: 100,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (error) {
        throw new Error(`Error listing files: ${error.message}`);
      }

      const fileList = files
        .filter(
          (file) => file.name && !file.name.includes(".emptyFolderPlaceholder")
        )
        .map((file) => ({
          name: file.name,
          size: file.metadata?.size || 0,
          contentType: file.metadata?.mimetype || "unknown",
          createdAt: file.created_at,
          updatedAt: file.updated_at,
          fullPath: `${companyId}/${file.name}`,
        }));

      return new Response(JSON.stringify({ files: fileList }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in signed-url function:", error);
    return new Response(
      JSON.stringify({
        error: "Error processing request",
        details: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
