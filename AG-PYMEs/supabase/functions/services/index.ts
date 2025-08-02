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

// Función para validar datos de servicio
function validateServiceData(data: any, isUpdate = false): string[] {
  const errors: string[] = [];

  // Campos obligatorios en creación
  if (!isUpdate) {
    if (!data.nombre_servicio) {
      errors.push("nombre_servicio es obligatorio");
    }

    if (!data.tipo_tarifa) {
      errors.push("tipo_tarifa es obligatorio");
    }
  }

  // Validación de nombre del servicio
  if (
    data.nombre_servicio &&
    (typeof data.nombre_servicio !== "string" ||
      data.nombre_servicio.trim().length === 0)
  ) {
    errors.push("nombre_servicio debe ser un texto válido");
  }

  if (data.nombre_servicio && data.nombre_servicio.length > 200) {
    errors.push("nombre_servicio no puede exceder 200 caracteres");
  }

  // Validación de descripción
  if (data.descripcion && data.descripcion.length > 1000) {
    errors.push("descripcion no puede exceder 1000 caracteres");
  }

  // Validación de tipo de tarifa
  const tiposTarifaValidos = ["fija", "por_nivel", "por_tiempo", "variable"];
  if (data.tipo_tarifa && !tiposTarifaValidos.includes(data.tipo_tarifa)) {
    errors.push(
      `tipo_tarifa debe ser uno de: ${tiposTarifaValidos.join(", ")}`
    );
  }

  // Validación de precio base
  if (data.precio_base !== undefined && data.precio_base !== null) {
    const precio = parseFloat(data.precio_base);
    if (isNaN(precio) || precio < 0) {
      errors.push("precio_base debe ser un número positivo");
    }
  }

  // Validación de duración estimada
  if (
    data.duracion_estimada_minutos !== undefined &&
    data.duracion_estimada_minutos !== null
  ) {
    const duracion = parseInt(data.duracion_estimada_minutos);
    if (isNaN(duracion) || duracion <= 0) {
      errors.push(
        "duracion_estimada_minutos debe ser un número entero positivo"
      );
    }
  }

  // Validación de categoría
  if (data.categoria && data.categoria.length > 100) {
    errors.push("categoria no puede exceder 100 caracteres");
  }

  // Validación de requiere_profesional
  if (
    data.requiere_profesional !== undefined &&
    typeof data.requiere_profesional !== "boolean"
  ) {
    errors.push("requiere_profesional debe ser true o false");
  }

  // Validación de activo
  if (data.activo !== undefined && typeof data.activo !== "boolean") {
    errors.push("activo debe ser true o false");
  }

  // Validación específica para servicios por nivel
  if (
    data.tipo_tarifa === "por_nivel" &&
    (!data.niveles || !Array.isArray(data.niveles) || data.niveles.length === 0)
  ) {
    errors.push(
      "Para servicios con tarifa por nivel, debe proporcionar al menos un nivel"
    );
  }

  // Validación de niveles si se proporcionan
  if (data.niveles && Array.isArray(data.niveles)) {
    data.niveles.forEach((nivel: any, index: number) => {
      if (!nivel.nombre_nivel) {
        errors.push(`Nivel ${index + 1}: nombre_nivel es obligatorio`);
      }
      if (nivel.precio === undefined || nivel.precio === null) {
        errors.push(`Nivel ${index + 1}: precio es obligatorio`);
      } else {
        const precio = parseFloat(nivel.precio);
        if (isNaN(precio) || precio < 0) {
          errors.push(`Nivel ${index + 1}: precio debe ser un número positivo`);
        }
      }
      if (
        nivel.tiempo_estimado_minutos !== undefined &&
        nivel.tiempo_estimado_minutos !== null
      ) {
        const tiempo = parseInt(nivel.tiempo_estimado_minutos);
        if (isNaN(tiempo) || tiempo <= 0) {
          errors.push(
            `Nivel ${index + 1}: tiempo_estimado_minutos debe ser un número entero positivo`
          );
        }
      }
    });
  }

  // Validación de empleados si se proporcionan
  if (data.empleados && Array.isArray(data.empleados)) {
    data.empleados.forEach((empleado: any, index: number) => {
      if (!empleado.id_empleado) {
        errors.push(`Empleado ${index + 1}: id_empleado es obligatorio`);
      } else {
        const empleadoId = parseInt(empleado.id_empleado);
        if (isNaN(empleadoId) || empleadoId <= 0) {
          errors.push(
            `Empleado ${index + 1}: id_empleado debe ser un número entero positivo`
          );
        }
      }
      if (
        empleado.porcentaje_comision !== undefined &&
        empleado.porcentaje_comision !== null
      ) {
        const porcentaje = parseFloat(empleado.porcentaje_comision);
        if (isNaN(porcentaje) || porcentaje < 0 || porcentaje > 100) {
          errors.push(
            `Empleado ${index + 1}: porcentaje_comision debe ser un número entre 0 y 100`
          );
        }
      }
    });
  }

  return errors;
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

    // GET /services - Obtener todos los servicios (con filtros opcionales)
    if (method === "GET" && pathSegments.length === 1) {
      try {
        const includeInactive =
          url.searchParams.get("includeInactive") === "true";
        const categoria = url.searchParams.get("categoria");
        const search = url.searchParams.get("search");

        let data;
        let error;

        if (search) {
          // Búsqueda por término
          let query = supabaseAdmin
            .from("services")
            .select("*")
            .eq("company_id", companyId);

          if (!includeInactive) {
            query = query.eq("activo", true);
          }

          query = query.or(
            `nombre_servicio.ilike.%${search}%,descripcion.ilike.%${search}%,categoria.ilike.%${search}%`
          );
          query = query.order("nombre_servicio");

          const result = await query;
          data = result.data;
          error = result.error;
        } else if (categoria) {
          // Filtro por categoría
          let query = supabaseAdmin
            .from("services")
            .select("*")
            .eq("company_id", companyId)
            .eq("categoria", categoria)
            .order("nombre_servicio");

          if (!includeInactive) {
            query = query.eq("activo", true);
          }

          const result = await query;
          data = result.data;
          error = result.error;
        } else {
          // Obtener todos los servicios
          let query = supabaseAdmin
            .from("services")
            .select("*")
            .eq("company_id", companyId)
            .order("nombre_servicio");

          if (!includeInactive) {
            query = query.eq("activo", true);
          }

          const result = await query;
          data = result.data;
          error = result.error;
        }

        if (error) {
          console.error("Error al obtener servicios:", error);
          throw error;
        }

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en getServices:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener servicios",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // GET /services/{id} - Obtener un servicio por ID con sus relaciones
    if (method === "GET" && pathSegments.length === 2) {
      try {
        const serviceId = parseInt(pathSegments[1]);

        if (isNaN(serviceId)) {
          return new Response(JSON.stringify({ error: "ID inválido" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Obtener el servicio base
        const { data: service, error: serviceError } = await supabaseAdmin
          .from("services")
          .select("*")
          .eq("company_id", companyId)
          .eq("id_servicio", serviceId)
          .single();

        if (serviceError) {
          if (serviceError.code === "PGRST116") {
            return new Response(
              JSON.stringify({ error: "Servicio no encontrado" }),
              {
                status: 404,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
          console.error("Error al obtener servicio:", serviceError);
          throw serviceError;
        }

        // Si el servicio es por nivel, obtener los niveles
        if (service.tipo_tarifa === "por_nivel") {
          const { data: niveles, error: nivelesError } = await supabaseAdmin
            .from("service_levels")
            .select("*")
            .eq("id_servicio", serviceId)
            .order("precio", { ascending: true });

          if (nivelesError) {
            console.error("Error al obtener niveles:", nivelesError);
          } else {
            service.niveles = niveles;
          }
        }

        // Obtener los empleados que pueden ofrecer este servicio
        const { data: empleadosRelacion, error: empleadosError } =
          await supabaseAdmin
            .from("employee_services")
            .select(
              `
            id_empleado_servicio,
            porcentaje_comision,
            employees!inner(
              id_empleado,
              nombre,
              cargo,
              company_id
            )
          `
            )
            .eq("id_servicio", serviceId)
            .eq("employees.company_id", companyId);

        if (empleadosError) {
          console.error("Error al obtener empleados:", empleadosError);
        } else {
          service.empleados = empleadosRelacion.map((rel) => ({
            id_empleado_servicio: rel.id_empleado_servicio,
            porcentaje_comision: rel.porcentaje_comision,
            id_empleado: rel.employees.id_empleado,
            nombre: rel.employees.nombre,
            cargo: rel.employees.cargo,
          }));
        }

        return new Response(JSON.stringify(service), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en getServiceById:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener servicio",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // POST /services - Crear un nuevo servicio
    if (method === "POST" && pathSegments.length === 1) {
      try {
        const serviceData = await req.json();

        // Validar datos
        const validationErrors = validateServiceData(serviceData);
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

        // Verificar que el nombre no existe para esta empresa
        const { data: existingService } = await supabaseAdmin
          .from("services")
          .select("id_servicio")
          .eq("company_id", companyId)
          .eq("nombre_servicio", serviceData.nombre_servicio)
          .single();

        if (existingService) {
          return new Response(
            JSON.stringify({
              error: "Ya existe un servicio con este nombre en la empresa",
            }),
            {
              status: 409,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Verificar empleados si se proporcionan
        if (serviceData.empleados && serviceData.empleados.length > 0) {
          const empleadoIds = serviceData.empleados.map(
            (emp: any) => emp.id_empleado
          );
          const { data: empleadosValidos } = await supabaseAdmin
            .from("employees")
            .select("id_empleado")
            .eq("company_id", companyId)
            .in("id_empleado", empleadoIds);

          if (empleadosValidos.length !== empleadoIds.length) {
            return new Response(
              JSON.stringify({
                error:
                  "Algunos empleados especificados no pertenecen a esta empresa",
              }),
              {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
        }

        // Preparar datos para inserción
        const insertData = {
          company_id: companyId,
          nombre_servicio: serviceData.nombre_servicio,
          descripcion: serviceData.descripcion || null,
          precio_base: serviceData.precio_base
            ? parseFloat(serviceData.precio_base)
            : null,
          tipo_tarifa: serviceData.tipo_tarifa,
          duracion_estimada_minutos: serviceData.duracion_estimada_minutos
            ? parseInt(serviceData.duracion_estimada_minutos)
            : null,
          categoria: serviceData.categoria || null,
          requiere_profesional:
            serviceData.requiere_profesional !== undefined
              ? serviceData.requiere_profesional
              : true,
          activo: serviceData.activo !== undefined ? serviceData.activo : true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: newService, error: serviceError } = await supabaseAdmin
          .from("services")
          .insert(insertData)
          .select()
          .single();

        if (serviceError) {
          console.error("Error al crear servicio:", serviceError);
          throw serviceError;
        }

        const serviceId = newService.id_servicio;

        // Si el tipo de tarifa es por_nivel, insertar los niveles
        if (
          serviceData.tipo_tarifa === "por_nivel" &&
          serviceData.niveles &&
          serviceData.niveles.length > 0
        ) {
          const nivelesData = serviceData.niveles.map((nivel: any) => ({
            id_servicio: serviceId,
            nombre_nivel: nivel.nombre_nivel,
            descripcion: nivel.descripcion || null,
            precio: parseFloat(nivel.precio),
            tiempo_estimado_minutos: nivel.tiempo_estimado_minutos
              ? parseInt(nivel.tiempo_estimado_minutos)
              : null,
          }));

          const { error: nivelesError } = await supabaseAdmin
            .from("service_levels")
            .insert(nivelesData);

          if (nivelesError) {
            console.error("Error al crear niveles:", nivelesError);
            // Si falla la creación de niveles, eliminar el servicio creado
            await supabaseAdmin
              .from("services")
              .delete()
              .eq("id_servicio", serviceId);
            throw nivelesError;
          }
        }

        // Si se proporcionaron empleados, asociarlos al servicio
        if (serviceData.empleados && serviceData.empleados.length > 0) {
          const empleadosData = serviceData.empleados.map((empleado: any) => ({
            id_empleado: parseInt(empleado.id_empleado),
            id_servicio: serviceId,
            porcentaje_comision: empleado.porcentaje_comision
              ? parseFloat(empleado.porcentaje_comision)
              : null,
          }));

          const { error: empleadosError } = await supabaseAdmin
            .from("employee_services")
            .insert(empleadosData);

          if (empleadosError) {
            console.error("Error al asociar empleados:", empleadosError);
            // Continuar sin fallar, los empleados se pueden asociar después
          }
        }

        return new Response(JSON.stringify(newService), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en createService:", error);
        return new Response(
          JSON.stringify({
            error: "Error al crear servicio",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // PUT /services/{id} - Actualizar un servicio
    if (method === "PUT" && pathSegments.length === 2) {
      try {
        const serviceId = parseInt(pathSegments[1]);

        if (isNaN(serviceId)) {
          return new Response(JSON.stringify({ error: "ID inválido" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const serviceData = await req.json();

        // Validar datos
        const validationErrors = validateServiceData(serviceData, true);
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

        // Verificar que el servicio existe y pertenece a la empresa
        const { data: existingService } = await supabaseAdmin
          .from("services")
          .select("id_servicio, nombre_servicio")
          .eq("company_id", companyId)
          .eq("id_servicio", serviceId)
          .single();

        if (!existingService) {
          return new Response(
            JSON.stringify({ error: "Servicio no encontrado" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Verificar que el nombre no existe para otro servicio
        if (
          serviceData.nombre_servicio &&
          serviceData.nombre_servicio !== existingService.nombre_servicio
        ) {
          const { data: duplicateName } = await supabaseAdmin
            .from("services")
            .select("id_servicio")
            .eq("company_id", companyId)
            .eq("nombre_servicio", serviceData.nombre_servicio)
            .neq("id_servicio", serviceId)
            .single();

          if (duplicateName) {
            return new Response(
              JSON.stringify({
                error: "Ya existe otro servicio con este nombre en la empresa",
              }),
              {
                status: 409,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
        }

        // Verificar empleados si se proporcionan
        if (serviceData.empleados && serviceData.empleados.length > 0) {
          const empleadoIds = serviceData.empleados.map(
            (emp: any) => emp.id_empleado
          );
          const { data: empleadosValidos } = await supabaseAdmin
            .from("employees")
            .select("id_empleado")
            .eq("company_id", companyId)
            .in("id_empleado", empleadoIds);

          if (empleadosValidos.length !== empleadoIds.length) {
            return new Response(
              JSON.stringify({
                error:
                  "Algunos empleados especificados no pertenecen a esta empresa",
              }),
              {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
        }

        // Preparar datos para actualización
        const updateData = {
          nombre_servicio: serviceData.nombre_servicio,
          descripcion: serviceData.descripcion || null,
          precio_base: serviceData.precio_base
            ? parseFloat(serviceData.precio_base)
            : null,
          tipo_tarifa: serviceData.tipo_tarifa,
          duracion_estimada_minutos: serviceData.duracion_estimada_minutos
            ? parseInt(serviceData.duracion_estimada_minutos)
            : null,
          categoria: serviceData.categoria || null,
          requiere_profesional:
            serviceData.requiere_profesional !== undefined
              ? serviceData.requiere_profesional
              : true,
          activo: serviceData.activo !== undefined ? serviceData.activo : true,
          updated_at: new Date().toISOString(),
        };

        const { data: updatedService, error: updateError } = await supabaseAdmin
          .from("services")
          .update(updateData)
          .eq("company_id", companyId)
          .eq("id_servicio", serviceId)
          .select()
          .single();

        if (updateError) {
          console.error("Error al actualizar servicio:", updateError);
          throw updateError;
        }

        // Si el tipo de tarifa es por_nivel, actualizar los niveles
        if (serviceData.tipo_tarifa === "por_nivel" && serviceData.niveles) {
          // Eliminar los niveles actuales
          await supabaseAdmin
            .from("service_levels")
            .delete()
            .eq("id_servicio", serviceId);

          // Insertar los nuevos niveles
          if (serviceData.niveles.length > 0) {
            const nivelesData = serviceData.niveles.map((nivel: any) => ({
              id_servicio: serviceId,
              nombre_nivel: nivel.nombre_nivel,
              descripcion: nivel.descripcion || null,
              precio: parseFloat(nivel.precio),
              tiempo_estimado_minutos: nivel.tiempo_estimado_minutos
                ? parseInt(nivel.tiempo_estimado_minutos)
                : null,
            }));

            const { error: nivelesError } = await supabaseAdmin
              .from("service_levels")
              .insert(nivelesData);

            if (nivelesError) {
              console.error("Error al actualizar niveles:", nivelesError);
            }
          }
        }

        // Si se proporcionaron empleados, actualizar las asociaciones
        if (serviceData.empleados !== undefined) {
          // Eliminar las asociaciones actuales
          await supabaseAdmin
            .from("employee_services")
            .delete()
            .eq("id_servicio", serviceId);

          // Insertar las nuevas asociaciones
          if (serviceData.empleados.length > 0) {
            const empleadosData = serviceData.empleados.map(
              (empleado: any) => ({
                id_empleado: parseInt(empleado.id_empleado),
                id_servicio: serviceId,
                porcentaje_comision: empleado.porcentaje_comision
                  ? parseFloat(empleado.porcentaje_comision)
                  : null,
              })
            );

            const { error: empleadosError } = await supabaseAdmin
              .from("employee_services")
              .insert(empleadosData);

            if (empleadosError) {
              console.error("Error al actualizar empleados:", empleadosError);
            }
          }
        }

        return new Response(JSON.stringify(updatedService), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error en updateService:", error);
        return new Response(
          JSON.stringify({
            error: "Error al actualizar servicio",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // DELETE /services/{id} - Eliminar un servicio
    if (method === "DELETE" && pathSegments.length === 2) {
      try {
        const serviceId = parseInt(pathSegments[1]);

        if (isNaN(serviceId)) {
          return new Response(JSON.stringify({ error: "ID inválido" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Verificar que el servicio existe y pertenece a la empresa
        const { data: existingService } = await supabaseAdmin
          .from("services")
          .select("id_servicio")
          .eq("company_id", companyId)
          .eq("id_servicio", serviceId)
          .single();

        if (!existingService) {
          return new Response(
            JSON.stringify({ error: "Servicio no encontrado" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Verificar si hay ventas que incluyen este servicio
        const { data: salesCheck, error: salesError } = await supabaseAdmin
          .from("sale_services")
          .select("id_venta_servicio")
          .eq("id_servicio", serviceId)
          .limit(1);

        if (salesError) {
          console.error("Error al verificar ventas:", salesError);
        }

        if (salesCheck && salesCheck.length > 0) {
          // Si hay ventas asociadas, marcar como inactivo en lugar de eliminar
          const { data: inactivatedService, error: inactivateError } =
            await supabaseAdmin
              .from("services")
              .update({
                activo: false,
                updated_at: new Date().toISOString(),
              })
              .eq("company_id", companyId)
              .eq("id_servicio", serviceId)
              .select()
              .single();

          if (inactivateError) {
            console.error(
              "Error al marcar servicio como inactivo:",
              inactivateError
            );
            throw inactivateError;
          }

          return new Response(
            JSON.stringify({
              message:
                "El servicio tiene ventas asociadas. Se ha marcado como inactivo.",
              inactivated: true,
              data: inactivatedService,
            }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Si no hay ventas, eliminar las asociaciones y el servicio
        await supabaseAdmin
          .from("employee_services")
          .delete()
          .eq("id_servicio", serviceId);

        await supabaseAdmin
          .from("service_levels")
          .delete()
          .eq("id_servicio", serviceId);

        const { error: deleteError } = await supabaseAdmin
          .from("services")
          .delete()
          .eq("company_id", companyId)
          .eq("id_servicio", serviceId);

        if (deleteError) {
          console.error("Error al eliminar servicio:", deleteError);
          throw deleteError;
        }

        return new Response(
          JSON.stringify({ message: "Servicio eliminado correctamente" }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Error en deleteService:", error);
        return new Response(
          JSON.stringify({
            error: "Error al eliminar servicio",
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
