import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Configuración de Supabase
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Cliente con SERVICE_ROLE_KEY para operaciones administrativas
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

// Función para extraer company_id del JWT
function extractCompanyId(authHeader: string | null): number | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.company_id || null;
  } catch (error) {
    console.error("Error extracting company_id:", error);
    return null;
  }
}

// Función para validar datos del cliente
function validateClientData(data: any, isUpdate = false): string[] {
  const errors: string[] = [];

  // Campos obligatorios en creación
  if (!isUpdate) {
    if (!data.tipo_cliente) {
      errors.push("tipo_cliente es obligatorio");
    }

    if (!data.tipo_documento) {
      errors.push("tipo_documento es obligatorio");
    }

    if (!data.documento) {
      errors.push("documento es obligatorio");
    }

    if (!data.direccion) {
      errors.push("direccion es obligatorio");
    }

    if (!data.codigo_postal) {
      errors.push("codigo_postal es obligatorio");
    }

    if (!data.ciudad) {
      errors.push("ciudad es obligatorio");
    }

    if (!data.provincia) {
      errors.push("provincia es obligatorio");
    }
  }

  // Validación de tipo de cliente
  const tiposClienteValidos = ["particular", "empresa", "autonomo"];
  if (data.tipo_cliente && !tiposClienteValidos.includes(data.tipo_cliente)) {
    errors.push(
      `tipo_cliente debe ser uno de: ${tiposClienteValidos.join(", ")}`
    );
  }

  // Validación de tipo de documento
  const tiposDocumentoValidos = ["DNI", "NIE", "CIF", "pasaporte"];
  if (
    data.tipo_documento &&
    !tiposDocumentoValidos.includes(data.tipo_documento)
  ) {
    errors.push(
      `tipo_documento debe ser uno de: ${tiposDocumentoValidos.join(", ")}`
    );
  }

  // Validación de documento según tipo
  if (data.tipo_documento && data.documento) {
    const documento = data.documento.toUpperCase().replace(/\s/g, "");

    switch (data.tipo_documento) {
      case "DNI":
        if (!/^\d{8}[A-Z]$/.test(documento)) {
          errors.push("DNI debe tener formato: 12345678A");
        }
        break;
      case "NIE":
        if (!/^[XYZ]\d{7}[A-Z]$/.test(documento)) {
          errors.push("NIE debe tener formato: X1234567A");
        }
        break;
      case "CIF":
        if (!/^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/.test(documento)) {
          errors.push("CIF debe tener formato: A12345674");
        }
        break;
      case "pasaporte":
        if (!/^[A-Z]{3}\d{6}$/.test(documento) && !/^\d{9}$/.test(documento)) {
          errors.push("Pasaporte debe tener formato: ABC123456 o 123456789");
        }
        break;
    }
  }

  // Validación de email si se proporciona
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push("Email inválido");
  }

  // Validación de teléfono si se proporciona
  if (
    data.telefono &&
    !/^(\+34|0034|34)?[6789]\d{8}$/.test(data.telefono.replace(/\s/g, ""))
  ) {
    errors.push("Teléfono debe tener formato español válido");
  }

  // Validación de código postal
  if (data.codigo_postal && !/^\d{5}$/.test(data.codigo_postal)) {
    errors.push("Código postal debe tener 5 dígitos");
  }

  // Validación de tipo de IVA
  const tiposIvaValidos = ["general", "reducido", "superreducido", "exento"];
  if (data.tipo_iva && !tiposIvaValidos.includes(data.tipo_iva)) {
    errors.push(`tipo_iva debe ser uno de: ${tiposIvaValidos.join(", ")}`);
  }

  // Validación de descuento preferencial
  if (
    data.descuento_preferencial !== undefined &&
    data.descuento_preferencial !== null
  ) {
    const descuento = parseFloat(data.descuento_preferencial);
    if (isNaN(descuento) || descuento < 0 || descuento > 100) {
      errors.push("descuento_preferencial debe ser un número entre 0 y 100");
    }
  }

  // Validación de régimen fiscal
  const regimenesFiscalesValidos = [
    "general",
    "recargo_equivalencia",
    "criterio_caja",
    "exento",
  ];
  if (
    data.regimen_fiscal &&
    !regimenesFiscalesValidos.includes(data.regimen_fiscal)
  ) {
    errors.push(
      `regimen_fiscal debe ser uno de: ${regimenesFiscalesValidos.join(", ")}`
    );
  }

  // Validación de fecha de última compra
  if (data.fecha_ultima_compra && !isValidDate(data.fecha_ultima_compra)) {
    errors.push("fecha_ultima_compra debe ser una fecha válida (YYYY-MM-DD)");
  }

  return errors;
}

// Función auxiliar para validar fecha
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return (
    date instanceof Date &&
    !isNaN(date.getTime()) &&
    dateString.match(/^\d{4}-\d{2}-\d{2}$/)
  );
}

serve(async (req) => {
  // Configurar CORS
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  };

  // Manejar preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar autenticación
    const authHeader = req.headers.get("Authorization");
    const companyId = extractCompanyId(authHeader);

    if (!companyId) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const pathSegments = url.pathname.split("/").filter(Boolean);
    const method = req.method;

    // GET /clients - Obtener todos los clientes (con filtros opcionales)
    if (method === "GET" && pathSegments.length === 1) {
      try {
        // Obtener parámetros de filtro de la URL
        const filters: any = {};
        const tipo_cliente = url.searchParams.get("tipo_cliente");
        const ciudad = url.searchParams.get("ciudad");
        const provincia = url.searchParams.get("provincia");

        if (tipo_cliente) filters.tipo_cliente = tipo_cliente;
        if (ciudad) filters.ciudad = ciudad;
        if (provincia) filters.provincia = provincia;

        let query = supabaseAdmin
          .from("clients")
          .select("*")
          .eq("company_id", companyId)
          .order("nombre");

        // Aplicar filtros
        if (filters.tipo_cliente) {
          query = query.eq("tipo_cliente", filters.tipo_cliente);
        }

        if (filters.ciudad) {
          query = query.eq("ciudad", filters.ciudad);
        }

        if (filters.provincia) {
          query = query.eq("provincia", filters.provincia);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error al obtener clientes:", error);
          throw error;
        }

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en getAllClients:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener clientes",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // GET /clients/search - Buscar clientes por término
    if (
      method === "GET" &&
      pathSegments.length === 2 &&
      pathSegments[1] === "search"
    ) {
      try {
        const searchTerm = url.searchParams.get("term");

        if (!searchTerm) {
          return new Response(
            JSON.stringify({ error: "Se requiere un término de búsqueda" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const term = `%${searchTerm.toLowerCase()}%`;

        const { data, error } = await supabaseAdmin
          .from("clients")
          .select("*")
          .eq("company_id", companyId)
          .or(
            `nombre.ilike.${term},apellido.ilike.${term},documento.ilike.${term},email.ilike.${term},telefono.ilike.${term},razon_social.ilike.${term}`
          )
          .order("nombre");

        if (error) {
          console.error("Error al buscar clientes:", error);
          throw error;
        }

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en searchClients:", error);
        return new Response(
          JSON.stringify({
            error: "Error al buscar clientes",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // GET /clients/stats - Obtener estadísticas de clientes
    if (
      method === "GET" &&
      pathSegments.length === 2 &&
      pathSegments[1] === "stats"
    ) {
      try {
        // Obtener todos los clientes para calcular estadísticas
        const { data: clientsData, error: clientsError } = await supabaseAdmin
          .from("clients")
          .select("tipo_cliente, provincia, ciudad, fecha_ultima_compra")
          .eq("company_id", companyId);

        if (clientsError) {
          console.error(
            "Error al obtener estadísticas de clientes:",
            clientsError
          );
          throw clientsError;
        }

        // Procesar estadísticas
        const stats = {
          total: clientsData.length,
          por_tipo: {
            particular: 0,
            empresa: 0,
            autonomo: 0,
          },
          por_provincia: {},
          por_ciudad: {},
          con_compras: 0,
          sin_compras: 0,
        };

        clientsData.forEach((client) => {
          // Estadísticas por tipo
          if (stats.por_tipo[client.tipo_cliente] !== undefined) {
            stats.por_tipo[client.tipo_cliente]++;
          }

          // Estadísticas por provincia
          if (client.provincia) {
            stats.por_provincia[client.provincia] =
              (stats.por_provincia[client.provincia] || 0) + 1;
          }

          // Estadísticas por ciudad
          if (client.ciudad) {
            stats.por_ciudad[client.ciudad] =
              (stats.por_ciudad[client.ciudad] || 0) + 1;
          }

          // Estadísticas de compras
          if (client.fecha_ultima_compra) {
            stats.con_compras++;
          } else {
            stats.sin_compras++;
          }
        });

        return new Response(JSON.stringify(stats), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en getClientStats:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener estadísticas de clientes",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // GET /clients/{id} - Obtener un cliente por ID
    if (
      method === "GET" &&
      pathSegments.length === 2 &&
      pathSegments[1] !== "search" &&
      pathSegments[1] !== "stats"
    ) {
      try {
        const clientId = parseInt(pathSegments[1]);

        if (isNaN(clientId)) {
          return new Response(JSON.stringify({ error: "ID inválido" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data, error } = await supabaseAdmin
          .from("clients")
          .select("*")
          .eq("company_id", companyId)
          .eq("id_cliente", clientId)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            return new Response(
              JSON.stringify({ error: "Cliente no encontrado" }),
              {
                status: 404,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
          console.error("Error al obtener cliente:", error);
          throw error;
        }

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en getClientById:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener cliente",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // POST /clients - Crear un nuevo cliente
    if (method === "POST" && pathSegments.length === 1) {
      try {
        const clientData = await req.json();

        // Validar datos
        const validationErrors = validateClientData(clientData);
        if (validationErrors.length > 0) {
          return new Response(
            JSON.stringify({
              error: "Datos inválidos",
              details: validationErrors,
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Verificar que el documento no existe para esta empresa
        const { data: existingClient } = await supabaseAdmin
          .from("clients")
          .select("id_cliente")
          .eq("company_id", companyId)
          .eq(
            "documento",
            clientData.documento.toUpperCase().replace(/\s/g, "")
          )
          .single();

        if (existingClient) {
          return new Response(
            JSON.stringify({
              error: "El documento ya está registrado para esta empresa",
            }),
            {
              status: 409,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Preparar datos para inserción
        const insertData = {
          company_id: companyId,
          tipo_cliente: clientData.tipo_cliente,
          nombre: clientData.nombre || "",
          apellido: clientData.apellido || "",
          tipo_documento: clientData.tipo_documento,
          documento: clientData.documento.toUpperCase().replace(/\s/g, ""),
          direccion: clientData.direccion,
          codigo_postal: clientData.codigo_postal,
          ciudad: clientData.ciudad,
          provincia: clientData.provincia,
          pais: clientData.pais || "España",
          telefono: clientData.telefono || null,
          email: clientData.email || null,
          razon_social: clientData.razon_social || null,
          regimen_fiscal: clientData.regimen_fiscal || null,
          tipo_iva: clientData.tipo_iva || "general",
          descuento_preferencial: clientData.descuento_preferencial
            ? parseFloat(clientData.descuento_preferencial)
            : 0,
          notas: clientData.notas || null,
          fecha_ultima_compra: clientData.fecha_ultima_compra || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabaseAdmin
          .from("clients")
          .insert(insertData)
          .select()
          .single();

        if (error) {
          console.error("Error al crear cliente:", error);
          if (error.code === "23505") {
            return new Response(
              JSON.stringify({ error: "El documento ya está registrado" }),
              {
                status: 409,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
          throw error;
        }

        return new Response(JSON.stringify(data), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en createClient:", error);
        return new Response(
          JSON.stringify({
            error: "Error al crear cliente",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // PUT /clients/{id} - Actualizar un cliente
    if (method === "PUT" && pathSegments.length === 2) {
      try {
        const clientId = parseInt(pathSegments[1]);

        if (isNaN(clientId)) {
          return new Response(JSON.stringify({ error: "ID inválido" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const clientData = await req.json();

        // Validar datos
        const validationErrors = validateClientData(clientData, true);
        if (validationErrors.length > 0) {
          return new Response(
            JSON.stringify({
              error: "Datos inválidos",
              details: validationErrors,
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Verificar que el cliente existe y pertenece a la empresa
        const { data: existingClient } = await supabaseAdmin
          .from("clients")
          .select("id_cliente")
          .eq("company_id", companyId)
          .eq("id_cliente", clientId)
          .single();

        if (!existingClient) {
          return new Response(
            JSON.stringify({ error: "Cliente no encontrado" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Verificar que el documento no existe para otro cliente de esta empresa
        if (clientData.documento) {
          const { data: duplicateDoc } = await supabaseAdmin
            .from("clients")
            .select("id_cliente")
            .eq("company_id", companyId)
            .eq(
              "documento",
              clientData.documento.toUpperCase().replace(/\s/g, "")
            )
            .neq("id_cliente", clientId)
            .single();

          if (duplicateDoc) {
            return new Response(
              JSON.stringify({
                error: "El documento ya está registrado para otro cliente",
              }),
              {
                status: 409,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
        }

        // Preparar datos para actualización (solo campos proporcionados)
        const updateData: any = {
          updated_at: new Date().toISOString(),
        };

        if (clientData.tipo_cliente !== undefined)
          updateData.tipo_cliente = clientData.tipo_cliente;
        if (clientData.nombre !== undefined)
          updateData.nombre = clientData.nombre;
        if (clientData.apellido !== undefined)
          updateData.apellido = clientData.apellido;
        if (clientData.tipo_documento !== undefined)
          updateData.tipo_documento = clientData.tipo_documento;
        if (clientData.documento !== undefined)
          updateData.documento = clientData.documento
            .toUpperCase()
            .replace(/\s/g, "");
        if (clientData.direccion !== undefined)
          updateData.direccion = clientData.direccion;
        if (clientData.codigo_postal !== undefined)
          updateData.codigo_postal = clientData.codigo_postal;
        if (clientData.ciudad !== undefined)
          updateData.ciudad = clientData.ciudad;
        if (clientData.provincia !== undefined)
          updateData.provincia = clientData.provincia;
        if (clientData.pais !== undefined) updateData.pais = clientData.pais;
        if (clientData.telefono !== undefined)
          updateData.telefono = clientData.telefono;
        if (clientData.email !== undefined) updateData.email = clientData.email;
        if (clientData.razon_social !== undefined)
          updateData.razon_social = clientData.razon_social;
        if (clientData.regimen_fiscal !== undefined)
          updateData.regimen_fiscal = clientData.regimen_fiscal;
        if (clientData.tipo_iva !== undefined)
          updateData.tipo_iva = clientData.tipo_iva;
        if (clientData.descuento_preferencial !== undefined) {
          updateData.descuento_preferencial = parseFloat(
            clientData.descuento_preferencial
          );
        }
        if (clientData.notas !== undefined) updateData.notas = clientData.notas;
        if (clientData.fecha_ultima_compra !== undefined)
          updateData.fecha_ultima_compra = clientData.fecha_ultima_compra;

        const { data, error } = await supabaseAdmin
          .from("clients")
          .update(updateData)
          .eq("company_id", companyId)
          .eq("id_cliente", clientId)
          .select()
          .single();

        if (error) {
          console.error("Error al actualizar cliente:", error);
          if (error.code === "23505") {
            return new Response(
              JSON.stringify({ error: "El documento ya está registrado" }),
              {
                status: 409,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
          throw error;
        }

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en updateClient:", error);
        return new Response(
          JSON.stringify({
            error: "Error al actualizar cliente",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // DELETE /clients/{id} - Eliminar un cliente
    if (method === "DELETE" && pathSegments.length === 2) {
      try {
        const clientId = parseInt(pathSegments[1]);

        if (isNaN(clientId)) {
          return new Response(JSON.stringify({ error: "ID inválido" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Verificar que el cliente existe y pertenece a la empresa
        const { data: existingClient } = await supabaseAdmin
          .from("clients")
          .select("id_cliente")
          .eq("company_id", companyId)
          .eq("id_cliente", clientId)
          .single();

        if (!existingClient) {
          return new Response(
            JSON.stringify({ error: "Cliente no encontrado" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const { error } = await supabaseAdmin
          .from("clients")
          .delete()
          .eq("company_id", companyId)
          .eq("id_cliente", clientId);

        if (error) {
          console.error("Error al eliminar cliente:", error);
          if (error.code === "23503") {
            return new Response(
              JSON.stringify({
                error:
                  "No se puede eliminar el cliente porque tiene registros asociados",
              }),
              {
                status: 409,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
          throw error;
        }

        return new Response(
          JSON.stringify({ message: "Cliente eliminado con éxito" }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Error en deleteClient:", error);
        return new Response(
          JSON.stringify({
            error: "Error al eliminar cliente",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Si no coincide con ninguna ruta
    return new Response(JSON.stringify({ error: "Endpoint no encontrado" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error general:", error);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
