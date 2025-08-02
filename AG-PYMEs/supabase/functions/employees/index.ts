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

// Función para validar datos del empleado
function validateEmployeeData(data: any, isUpdate = false): string[] {
  const errors: string[] = [];

  // Campos obligatorios en creación
  if (!isUpdate) {
    if (!data.nombre) {
      errors.push("nombre es obligatorio");
    }

    if (!data.dni) {
      errors.push("DNI es obligatorio");
    }

    if (!data.cargo) {
      errors.push("cargo es obligatorio");
    }

    if (!data.fecha_contratacion) {
      errors.push("fecha_contratacion es obligatorio");
    }
  }

  // Validación de email (si se proporciona)
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push("Email inválido");
  }

  // Validación de DNI (formato español básico)
  if (data.dni && !/^\d{8}[A-Za-z]$/.test(data.dni)) {
    errors.push("DNI debe tener formato válido (8 dígitos + letra)");
  }

  // Validación de NSS (formato español básico)
  if (data.nss && !/^\d{12}$/.test(data.nss.replace(/\s+/g, ""))) {
    errors.push("NSS debe tener 12 dígitos");
  }

  // Validación de teléfonos
  if (data.telefono && !/^[+]?[\d\s\-()]{9,15}$/.test(data.telefono)) {
    errors.push("Teléfono debe tener formato válido");
  }

  if (
    data.telefono_emergencia &&
    !/^[+]?[\d\s\-()]{9,15}$/.test(data.telefono_emergencia)
  ) {
    errors.push("Teléfono de emergencia debe tener formato válido");
  }

  // Validación de fechas
  if (data.fecha_contratacion && !isValidDate(data.fecha_contratacion)) {
    errors.push("Fecha de contratación debe ser una fecha válida");
  }

  if (data.fecha_nacimiento && !isValidDate(data.fecha_nacimiento)) {
    errors.push("Fecha de nacimiento debe ser una fecha válida");
  }

  // Validación de edad mínima (mayor de 16 años)
  if (data.fecha_nacimiento) {
    const birthDate = new Date(data.fecha_nacimiento);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 16) {
      errors.push("El empleado debe ser mayor de 16 años");
    }
  }

  // Validación de horas contratadas
  if (data.horas_contratadas !== undefined && data.horas_contratadas !== null) {
    const horas = parseFloat(data.horas_contratadas);
    if (isNaN(horas) || horas <= 0 || horas > 60) {
      errors.push("Horas contratadas debe ser un número entre 0 y 60");
    }
  }

  // Validación de salario
  if (data.salario !== undefined && data.salario !== null) {
    const salario = parseFloat(data.salario);
    if (isNaN(salario) || salario < 0) {
      errors.push("Salario debe ser un número positivo");
    }
  }

  // Validación de tipo de contrato
  const tiposContrato = [
    "indefinido",
    "temporal",
    "practicas",
    "formacion",
    "obra",
  ];
  if (
    data.tipo_contrato &&
    !tiposContrato.includes(data.tipo_contrato.toLowerCase())
  ) {
    errors.push(
      "Tipo de contrato debe ser: indefinido, temporal, practicas, formacion u obra"
    );
  }

  // Validación de código postal
  if (data.codigo_postal && !/^\d{5}$/.test(data.codigo_postal)) {
    errors.push("Código postal debe tener 5 dígitos");
  }

  // Validación de activo
  if (data.activo !== undefined && typeof data.activo !== "boolean") {
    errors.push("Activo debe ser true o false");
  }

  return errors;
}

// Función auxiliar para validar fechas
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
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

    // GET /employees - Obtener todos los empleados
    if (method === "GET" && pathSegments.length === 1) {
      try {
        const { data, error } = await supabaseAdmin
          .from("employees")
          .select("*")
          .eq("company_id", companyId)
          .order("nombre");

        if (error) {
          console.error("Error al obtener empleados:", error);
          throw error;
        }

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en getAllEmployees:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener empleados",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // GET /employees/{id} - Obtener un empleado por ID
    if (method === "GET" && pathSegments.length === 2) {
      try {
        const employeeId = parseInt(pathSegments[1]);

        if (isNaN(employeeId)) {
          return new Response(JSON.stringify({ error: "ID inválido" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data, error } = await supabaseAdmin
          .from("employees")
          .select("*")
          .eq("company_id", companyId)
          .eq("id_empleado", employeeId)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            return new Response(
              JSON.stringify({ error: "Empleado no encontrado" }),
              {
                status: 404,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
          console.error("Error al obtener empleado:", error);
          throw error;
        }

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en getEmployeeById:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener empleado",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // POST /employees - Crear un nuevo empleado
    if (method === "POST" && pathSegments.length === 1) {
      try {
        const employeeData = await req.json();

        // Validar datos
        const validationErrors = validateEmployeeData(employeeData);
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

        // Verificar que el DNI no existe para esta empresa
        const { data: existingEmployee } = await supabaseAdmin
          .from("employees")
          .select("id_empleado")
          .eq("company_id", companyId)
          .eq("dni", employeeData.dni)
          .single();

        if (existingEmployee) {
          return new Response(
            JSON.stringify({
              error: "El DNI ya está registrado para esta empresa",
            }),
            {
              status: 409,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Verificar email único si se proporciona
        if (employeeData.email) {
          const { data: existingEmail } = await supabaseAdmin
            .from("employees")
            .select("id_empleado")
            .eq("company_id", companyId)
            .eq("email", employeeData.email)
            .single();

          if (existingEmail) {
            return new Response(
              JSON.stringify({
                error: "El email ya está registrado para esta empresa",
              }),
              {
                status: 409,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
        }

        // Preparar datos para inserción
        const insertData = {
          company_id: companyId,
          nombre: employeeData.nombre,
          dni: employeeData.dni,
          nss: employeeData.nss || null,
          email: employeeData.email || null,
          telefono: employeeData.telefono || null,
          telefono_emergencia: employeeData.telefono_emergencia || null,
          direccion: employeeData.direccion || null,
          codigo_postal: employeeData.codigo_postal || null,
          ciudad: employeeData.ciudad || null,
          pais: employeeData.pais || "España",
          fecha_contratacion: employeeData.fecha_contratacion,
          fecha_nacimiento: employeeData.fecha_nacimiento || null,
          cargo: employeeData.cargo,
          departamento: employeeData.departamento || null,
          horas_contratadas: employeeData.horas_contratadas
            ? parseFloat(employeeData.horas_contratadas)
            : null,
          tipo_contrato:
            employeeData.tipo_contrato?.toLowerCase() || "indefinido",
          salario: employeeData.salario
            ? parseFloat(employeeData.salario)
            : null,
          activo:
            employeeData.activo !== undefined ? employeeData.activo : true,
          documento_adjunto: employeeData.documento_adjunto || [],
          notas: employeeData.notas || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabaseAdmin
          .from("employees")
          .insert(insertData)
          .select()
          .single();

        if (error) {
          console.error("Error al crear empleado:", error);
          if (error.code === "23505") {
            return new Response(
              JSON.stringify({ error: "El DNI ya está registrado" }),
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
        console.error("Error en createEmployee:", error);
        return new Response(
          JSON.stringify({
            error: "Error al crear empleado",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // PUT /employees/{id} - Actualizar un empleado
    if (method === "PUT" && pathSegments.length === 2) {
      try {
        const employeeId = parseInt(pathSegments[1]);

        if (isNaN(employeeId)) {
          return new Response(JSON.stringify({ error: "ID inválido" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const employeeData = await req.json();

        // Validar datos
        const validationErrors = validateEmployeeData(employeeData, true);
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

        // Verificar que el empleado existe y pertenece a la empresa
        const { data: existingEmployee } = await supabaseAdmin
          .from("employees")
          .select("*")
          .eq("company_id", companyId)
          .eq("id_empleado", employeeId)
          .single();

        if (!existingEmployee) {
          return new Response(
            JSON.stringify({ error: "Empleado no encontrado" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Verificar DNI único si se cambia
        if (employeeData.dni && employeeData.dni !== existingEmployee.dni) {
          const { data: duplicateDni } = await supabaseAdmin
            .from("employees")
            .select("id_empleado")
            .eq("company_id", companyId)
            .eq("dni", employeeData.dni)
            .neq("id_empleado", employeeId)
            .single();

          if (duplicateDni) {
            return new Response(
              JSON.stringify({
                error: "El DNI ya está registrado para otro empleado",
              }),
              {
                status: 409,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
        }

        // Verificar email único si se cambia
        if (
          employeeData.email &&
          employeeData.email !== existingEmployee.email
        ) {
          const { data: duplicateEmail } = await supabaseAdmin
            .from("employees")
            .select("id_empleado")
            .eq("company_id", companyId)
            .eq("email", employeeData.email)
            .neq("id_empleado", employeeId)
            .single();

          if (duplicateEmail) {
            return new Response(
              JSON.stringify({
                error: "El email ya está registrado para otro empleado",
              }),
              {
                status: 409,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
        }

        // Preparar datos para actualización con merge de datos existentes
        const updateData = {
          nombre:
            employeeData.nombre !== undefined
              ? employeeData.nombre
              : existingEmployee.nombre,
          dni:
            employeeData.dni !== undefined
              ? employeeData.dni
              : existingEmployee.dni,
          nss:
            employeeData.nss !== undefined
              ? employeeData.nss
              : existingEmployee.nss,
          email:
            employeeData.email !== undefined
              ? employeeData.email
              : existingEmployee.email,
          telefono:
            employeeData.telefono !== undefined
              ? employeeData.telefono
              : existingEmployee.telefono,
          telefono_emergencia:
            employeeData.telefono_emergencia !== undefined
              ? employeeData.telefono_emergencia
              : existingEmployee.telefono_emergencia,
          direccion:
            employeeData.direccion !== undefined
              ? employeeData.direccion
              : existingEmployee.direccion,
          codigo_postal:
            employeeData.codigo_postal !== undefined
              ? employeeData.codigo_postal
              : existingEmployee.codigo_postal,
          ciudad:
            employeeData.ciudad !== undefined
              ? employeeData.ciudad
              : existingEmployee.ciudad,
          pais:
            employeeData.pais !== undefined
              ? employeeData.pais
              : existingEmployee.pais,
          fecha_contratacion:
            employeeData.fecha_contratacion !== undefined
              ? employeeData.fecha_contratacion
              : existingEmployee.fecha_contratacion,
          fecha_nacimiento:
            employeeData.fecha_nacimiento !== undefined
              ? employeeData.fecha_nacimiento
              : existingEmployee.fecha_nacimiento,
          cargo:
            employeeData.cargo !== undefined
              ? employeeData.cargo
              : existingEmployee.cargo,
          departamento:
            employeeData.departamento !== undefined
              ? employeeData.departamento
              : existingEmployee.departamento,
          horas_contratadas:
            employeeData.horas_contratadas !== undefined
              ? employeeData.horas_contratadas
                ? parseFloat(employeeData.horas_contratadas)
                : null
              : existingEmployee.horas_contratadas,
          tipo_contrato:
            employeeData.tipo_contrato !== undefined
              ? employeeData.tipo_contrato?.toLowerCase()
              : existingEmployee.tipo_contrato,
          salario:
            employeeData.salario !== undefined
              ? employeeData.salario
                ? parseFloat(employeeData.salario)
                : null
              : existingEmployee.salario,
          activo:
            employeeData.activo !== undefined
              ? employeeData.activo
              : existingEmployee.activo,
          documento_adjunto:
            employeeData.documento_adjunto !== undefined
              ? employeeData.documento_adjunto
              : existingEmployee.documento_adjunto,
          notas:
            employeeData.notas !== undefined
              ? employeeData.notas
              : existingEmployee.notas,
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabaseAdmin
          .from("employees")
          .update(updateData)
          .eq("company_id", companyId)
          .eq("id_empleado", employeeId)
          .select()
          .single();

        if (error) {
          console.error("Error al actualizar empleado:", error);
          throw error;
        }

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en updateEmployee:", error);
        return new Response(
          JSON.stringify({
            error: "Error al actualizar empleado",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // DELETE /employees/{id} - Eliminar un empleado
    if (method === "DELETE" && pathSegments.length === 2) {
      try {
        const employeeId = parseInt(pathSegments[1]);

        if (isNaN(employeeId)) {
          return new Response(JSON.stringify({ error: "ID inválido" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Verificar que el empleado existe y pertenece a la empresa
        const { data: existingEmployee } = await supabaseAdmin
          .from("employees")
          .select("id_empleado")
          .eq("company_id", companyId)
          .eq("id_empleado", employeeId)
          .single();

        if (!existingEmployee) {
          return new Response(
            JSON.stringify({ error: "Empleado no encontrado" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const { error } = await supabaseAdmin
          .from("employees")
          .delete()
          .eq("company_id", companyId)
          .eq("id_empleado", employeeId);

        if (error) {
          console.error("Error al eliminar empleado:", error);
          if (error.code === "23503") {
            return new Response(
              JSON.stringify({
                error:
                  "No se puede eliminar el empleado porque tiene registros asociados",
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
          JSON.stringify({ message: "Empleado eliminado correctamente" }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Error en deleteEmployee:", error);
        return new Response(
          JSON.stringify({
            error: "Error al eliminar empleado",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // POST /employees/{id}/documents - Agregar documentos a un empleado
    if (
      method === "POST" &&
      pathSegments.length === 3 &&
      pathSegments[2] === "documents"
    ) {
      try {
        const employeeId = parseInt(pathSegments[1]);

        if (isNaN(employeeId)) {
          return new Response(JSON.stringify({ error: "ID inválido" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const requestData = await req.json();
        const newDocuments = requestData.documents;

        if (!Array.isArray(newDocuments) || newDocuments.length === 0) {
          return new Response(
            JSON.stringify({
              error: "Se requiere un array de documentos válido",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Verificar que el empleado existe y pertenece a la empresa
        const { data: existingEmployee } = await supabaseAdmin
          .from("employees")
          .select("documento_adjunto")
          .eq("company_id", companyId)
          .eq("id_empleado", employeeId)
          .single();

        if (!existingEmployee) {
          return new Response(
            JSON.stringify({ error: "Empleado no encontrado" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Combinar documentos existentes con nuevos
        const currentDocuments = existingEmployee.documento_adjunto || [];
        const updatedDocuments = [...currentDocuments, ...newDocuments];

        const { data, error } = await supabaseAdmin
          .from("employees")
          .update({
            documento_adjunto: updatedDocuments,
            updated_at: new Date().toISOString(),
          })
          .eq("company_id", companyId)
          .eq("id_empleado", employeeId)
          .select()
          .single();

        if (error) {
          console.error("Error al agregar documentos:", error);
          throw error;
        }

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en addEmployeeDocuments:", error);
        return new Response(
          JSON.stringify({
            error: "Error al agregar documentos",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // DELETE /employees/documents/{filename} - Eliminar un documento específico
    if (
      method === "DELETE" &&
      pathSegments.length === 3 &&
      pathSegments[1] === "documents"
    ) {
      try {
        const filename = pathSegments[2];

        if (!filename) {
          return new Response(
            JSON.stringify({ error: "Nombre de archivo es obligatorio" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Buscar el empleado que tiene este documento
        const { data: employees, error: searchError } = await supabaseAdmin
          .from("employees")
          .select("id_empleado, documento_adjunto")
          .eq("company_id", companyId)
          .contains("documento_adjunto", [filename]);

        if (searchError) {
          console.error("Error buscando documento:", searchError);
          throw searchError;
        }

        if (!employees || employees.length === 0) {
          return new Response(
            JSON.stringify({ error: "Documento no encontrado" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Actualizar cada empleado que tenga este documento
        const updatePromises = employees.map(async (employee) => {
          const updatedDocuments = employee.documento_adjunto.filter(
            (doc: string) => doc !== filename
          );

          return await supabaseAdmin
            .from("employees")
            .update({
              documento_adjunto: updatedDocuments,
              updated_at: new Date().toISOString(),
            })
            .eq("company_id", companyId)
            .eq("id_empleado", employee.id_empleado);
        });

        await Promise.all(updatePromises);

        return new Response(
          JSON.stringify({ message: "Documento eliminado correctamente" }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Error en deleteEmployeeDocument:", error);
        return new Response(
          JSON.stringify({
            error: "Error al eliminar documento",
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
