import { createClient } from "@supabase/supabase-js";

// Configuración de Supabase
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Cliente con SERVICE_ROLE_KEY para operaciones administrativas
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

// Función para extraer company_id del JWT
function extractCompanyId(authHeader) {
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

// Función para validar datos de cita
function validateAppointmentData(data, isUpdate = false) {
  const errors = [];

  // Campos obligatorios en creación
  if (!isUpdate) {
    if (!data.fecha_inicio) {
      errors.push("fecha_inicio es obligatorio");
    }

    if (!data.fecha_fin) {
      errors.push("fecha_fin es obligatorio");
    }
  }

  // Validación de fechas
  if (data.fecha_inicio && !isValidDateTime(data.fecha_inicio)) {
    errors.push("fecha_inicio debe ser una fecha y hora válida (ISO 8601)");
  }

  if (data.fecha_fin && !isValidDateTime(data.fecha_fin)) {
    errors.push("fecha_fin debe ser una fecha y hora válida (ISO 8601)");
  }

  // Validación de fechas lógicas
  if (data.fecha_inicio && data.fecha_fin) {
    const fechaInicio = new Date(data.fecha_inicio);
    const fechaFin = new Date(data.fecha_fin);

    if (fechaFin <= fechaInicio) {
      errors.push("fecha_fin debe ser posterior a fecha_inicio");
    }

    // Validar duración máxima (8 horas)
    const duracionHoras = (fechaFin - fechaInicio) / (1000 * 60 * 60);
    if (duracionHoras > 8) {
      errors.push("La duración de la cita no puede exceder 8 horas");
    }

    // Validar duración mínima (5 minutos)
    const duracionMinutos = (fechaFin - fechaInicio) / (1000 * 60);
    if (duracionMinutos < 5) {
      errors.push("La duración de la cita debe ser al menos 5 minutos");
    }

    // Validar que no sea en el pasado (más de 1 hora)
    const ahora = new Date();
    const unaHoraAtras = new Date(ahora.getTime() - 60 * 60 * 1000);
    if (fechaInicio < unaHoraAtras) {
      errors.push("No se pueden crear citas en el pasado");
    }

    // Validar que no sea muy en el futuro (más de 1 año)
    const unAñoAdelante = new Date();
    unAñoAdelante.setFullYear(unAñoAdelante.getFullYear() + 1);
    if (fechaInicio > unAñoAdelante) {
      errors.push("No se pueden crear citas con más de un año de anticipación");
    }
  }

  // Validación de IDs
  if (
    data.id_empleado !== undefined &&
    data.id_empleado !== null &&
    data.id_empleado !== ""
  ) {
    const empleadoId = parseInt(data.id_empleado);
    if (isNaN(empleadoId) || empleadoId <= 0) {
      errors.push("id_empleado debe ser un número entero positivo");
    }
  }

  if (
    data.id_cliente !== undefined &&
    data.id_cliente !== null &&
    data.id_cliente !== ""
  ) {
    const clienteId = parseInt(data.id_cliente);
    if (isNaN(clienteId) || clienteId <= 0) {
      errors.push("id_cliente debe ser un número entero positivo");
    }
  }

  if (
    data.id_servicio !== undefined &&
    data.id_servicio !== null &&
    data.id_servicio !== ""
  ) {
    const servicioId = parseInt(data.id_servicio);
    if (isNaN(servicioId) || servicioId <= 0) {
      errors.push("id_servicio debe ser un número entero positivo");
    }
  }

  // Validación de estado
  const estadosValidos = ["pendiente", "confirmada", "completada", "cancelada"];
  if (data.estado && !estadosValidos.includes(data.estado)) {
    errors.push(`estado debe ser uno de: ${estadosValidos.join(", ")}`);
  }

  // Validación de notas (longitud máxima)
  if (data.notas && data.notas.length > 1000) {
    errors.push("notas no puede exceder 1000 caracteres");
  }

  return errors;
}

// Función auxiliar para validar fecha y hora
function isValidDateTime(dateTimeString) {
  const date = new Date(dateTimeString);
  return date instanceof Date && !isNaN(date) && dateTimeString.includes("T");
}

// Obtener todas las citas
async function getAllAppointments(companyId, filters = {}) {
  try {
    let query = supabaseAdmin
      .from("appointments")
      .select(
        `
        *,
        clients(
          id_cliente,
          nombre,
          apellido,
          email,
          telefono
        ),
        employees!inner(
          id_empleado,
          nombre,
          cargo,
          departamento,
          company_id
        ),
        services(
          id_servicio,
          nombre_servicio,
          descripcion,
          duracion,
          precio
        )
      `
      )
      .eq("employees.company_id", companyId)
      .order("fecha_inicio", { ascending: false });

    // Aplicar filtros opcionales
    if (filters.startDate && filters.endDate) {
      query = query.or(
        `and(fecha_inicio.gte.${filters.startDate},fecha_inicio.lte.${filters.endDate}),and(fecha_fin.gte.${filters.startDate},fecha_fin.lte.${filters.endDate}),and(fecha_inicio.lte.${filters.startDate},fecha_fin.gte.${filters.endDate})`
      );
    }

    if (filters.id_empleado) {
      query = query.eq("id_empleado", filters.id_empleado);
    }

    if (filters.id_cliente) {
      query = query.eq("id_cliente", filters.id_cliente);
    }

    if (filters.estado) {
      query = query.eq("estado", filters.estado);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error al obtener citas:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error en getAllAppointments:", error);
    return {
      success: false,
      error: "Error al obtener citas",
      details: error.message,
    };
  }
}

// Obtener una cita por ID
async function getAppointmentById(companyId, appointmentId) {
  try {
    const id = parseInt(appointmentId);
    if (isNaN(id)) {
      return { success: false, error: "ID inválido" };
    }

    const { data, error } = await supabaseAdmin
      .from("appointments")
      .select(
        `
        *,
        clients(
          id_cliente,
          nombre,
          apellido,
          email,
          telefono
        ),
        employees!inner(
          id_empleado,
          nombre,
          cargo,
          departamento,
          company_id
        ),
        services(
          id_servicio,
          nombre_servicio,
          descripcion,
          duracion,
          precio
        )
      `
      )
      .eq("id_cita", id)
      .eq("employees.company_id", companyId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { success: false, error: "Cita no encontrada" };
      }
      console.error("Error al obtener cita:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error en getAppointmentById:", error);
    return {
      success: false,
      error: "Error al obtener cita",
      details: error.message,
    };
  }
}

// Crear una nueva cita
async function createAppointment(companyId, appointmentData) {
  try {
    // Validar datos
    const validationErrors = validateAppointmentData(appointmentData);
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: "Datos inválidos",
        details: validationErrors,
      };
    }

    // Verificar que el empleado existe y pertenece a la empresa (si se especifica)
    if (appointmentData.id_empleado) {
      const { data: employee, error: employeeError } = await supabaseAdmin
        .from("employees")
        .select("id_empleado, nombre")
        .eq("company_id", companyId)
        .eq("id_empleado", appointmentData.id_empleado)
        .single();

      if (employeeError || !employee) {
        return {
          success: false,
          error:
            "El empleado especificado no existe o no pertenece a esta empresa",
        };
      }
    }

    // Verificar que el cliente existe y pertenece a la empresa (si se especifica)
    if (appointmentData.id_cliente) {
      const { data: client, error: clientError } = await supabaseAdmin
        .from("clients")
        .select("id_cliente, nombre")
        .eq("company_id", companyId)
        .eq("id_cliente", appointmentData.id_cliente)
        .single();

      if (clientError || !client) {
        return {
          success: false,
          error:
            "El cliente especificado no existe o no pertenece a esta empresa",
        };
      }
    }

    // Verificar que el servicio existe y pertenece a la empresa (si se especifica)
    if (appointmentData.id_servicio) {
      const { data: service, error: serviceError } = await supabaseAdmin
        .from("services")
        .select("id_servicio, nombre_servicio")
        .eq("company_id", companyId)
        .eq("id_servicio", appointmentData.id_servicio)
        .single();

      if (serviceError || !service) {
        return {
          success: false,
          error:
            "El servicio especificado no existe o no pertenece a esta empresa",
        };
      }
    }

    // Verificar disponibilidad del empleado (solapamiento de citas)
    if (appointmentData.id_empleado) {
      const { data: overlappingAppointments } = await supabaseAdmin
        .from("appointments")
        .select("id_cita, fecha_inicio, fecha_fin")
        .eq("id_empleado", appointmentData.id_empleado)
        .neq("estado", "cancelada")
        .or(
          `and(fecha_inicio.lte.${appointmentData.fecha_inicio},fecha_fin.gte.${appointmentData.fecha_inicio}),and(fecha_inicio.lte.${appointmentData.fecha_fin},fecha_fin.gte.${appointmentData.fecha_fin}),and(fecha_inicio.gte.${appointmentData.fecha_inicio},fecha_fin.lte.${appointmentData.fecha_fin})`
        );

      if (overlappingAppointments && overlappingAppointments.length > 0) {
        return {
          success: false,
          error: "El empleado ya tiene una cita programada en ese horario",
        };
      }
    }

    // Preparar datos para inserción
    const insertData = {
      id_cliente: appointmentData.id_cliente
        ? parseInt(appointmentData.id_cliente)
        : null,
      id_empleado: appointmentData.id_empleado
        ? parseInt(appointmentData.id_empleado)
        : null,
      id_servicio: appointmentData.id_servicio
        ? parseInt(appointmentData.id_servicio)
        : null,
      fecha_inicio: appointmentData.fecha_inicio,
      fecha_fin: appointmentData.fecha_fin,
      estado: appointmentData.estado || "pendiente",
      notas: appointmentData.notas || null,
      precio_final: appointmentData.precio_final
        ? parseFloat(appointmentData.precio_final)
        : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("appointments")
      .insert(insertData)
      .select(
        `
        *,
        clients(
          id_cliente,
          nombre,
          apellido,
          email,
          telefono
        ),
        employees(
          id_empleado,
          nombre,
          cargo,
          departamento
        ),
        services(
          id_servicio,
          nombre_servicio,
          descripcion,
          duracion,
          precio
        )
      `
      )
      .single();

    if (error) {
      console.error("Error al crear cita:", error);
      if (error.code === "23503") {
        return {
          success: false,
          error: "Referencia inválida (empleado, cliente o servicio no existe)",
        };
      }
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error en createAppointment:", error);
    return {
      success: false,
      error: "Error al crear cita",
      details: error.message,
    };
  }
}

// Actualizar una cita existente
async function updateAppointment(companyId, appointmentId, appointmentData) {
  try {
    const id = parseInt(appointmentId);
    if (isNaN(id)) {
      return { success: false, error: "ID inválido" };
    }

    // Validar datos
    const validationErrors = validateAppointmentData(appointmentData, true);
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: "Datos inválidos",
        details: validationErrors,
      };
    }

    // Verificar que la cita existe y el empleado pertenece a la empresa
    const { data: existingAppointment } = await supabaseAdmin
      .from("appointments")
      .select(
        `
        *,
        employees!inner(company_id)
      `
      )
      .eq("id_cita", id)
      .eq("employees.company_id", companyId)
      .single();

    if (!existingAppointment) {
      return { success: false, error: "Cita no encontrada" };
    }

    // Verificar referencias si se cambian
    if (
      appointmentData.id_empleado &&
      appointmentData.id_empleado !== existingAppointment.id_empleado
    ) {
      const { data: newEmployee } = await supabaseAdmin
        .from("employees")
        .select("id_empleado")
        .eq("company_id", companyId)
        .eq("id_empleado", appointmentData.id_empleado)
        .single();

      if (!newEmployee) {
        return {
          success: false,
          error:
            "El empleado especificado no existe o no pertenece a esta empresa",
        };
      }
    }

    if (
      appointmentData.id_cliente &&
      appointmentData.id_cliente !== existingAppointment.id_cliente
    ) {
      const { data: newClient } = await supabaseAdmin
        .from("clients")
        .select("id_cliente")
        .eq("company_id", companyId)
        .eq("id_cliente", appointmentData.id_cliente)
        .single();

      if (!newClient) {
        return {
          success: false,
          error:
            "El cliente especificado no existe o no pertenece a esta empresa",
        };
      }
    }

    if (
      appointmentData.id_servicio &&
      appointmentData.id_servicio !== existingAppointment.id_servicio
    ) {
      const { data: newService } = await supabaseAdmin
        .from("services")
        .select("id_servicio")
        .eq("company_id", companyId)
        .eq("id_servicio", appointmentData.id_servicio)
        .single();

      if (!newService) {
        return {
          success: false,
          error:
            "El servicio especificado no existe o no pertenece a esta empresa",
        };
      }
    }

    // Verificar solapamiento si se cambian fechas o empleado
    if (
      appointmentData.fecha_inicio ||
      appointmentData.fecha_fin ||
      appointmentData.id_empleado
    ) {
      const empleadoId =
        appointmentData.id_empleado || existingAppointment.id_empleado;
      const fechaInicio =
        appointmentData.fecha_inicio || existingAppointment.fecha_inicio;
      const fechaFin =
        appointmentData.fecha_fin || existingAppointment.fecha_fin;

      if (empleadoId) {
        const { data: overlappingAppointments } = await supabaseAdmin
          .from("appointments")
          .select("id_cita")
          .eq("id_empleado", empleadoId)
          .neq("id_cita", id)
          .neq("estado", "cancelada")
          .or(
            `and(fecha_inicio.lte.${fechaInicio},fecha_fin.gte.${fechaInicio}),and(fecha_inicio.lte.${fechaFin},fecha_fin.gte.${fechaFin}),and(fecha_inicio.gte.${fechaInicio},fecha_fin.lte.${fechaFin})`
          );

        if (overlappingAppointments && overlappingAppointments.length > 0) {
          return {
            success: false,
            error: "El empleado ya tiene una cita programada en ese horario",
          };
        }
      }
    }

    // Preparar datos para actualización
    const updateData = {
      id_cliente:
        appointmentData.id_cliente !== undefined
          ? appointmentData.id_cliente
            ? parseInt(appointmentData.id_cliente)
            : null
          : existingAppointment.id_cliente,
      id_empleado:
        appointmentData.id_empleado !== undefined
          ? appointmentData.id_empleado
            ? parseInt(appointmentData.id_empleado)
            : null
          : existingAppointment.id_empleado,
      id_servicio:
        appointmentData.id_servicio !== undefined
          ? appointmentData.id_servicio
            ? parseInt(appointmentData.id_servicio)
            : null
          : existingAppointment.id_servicio,
      fecha_inicio:
        appointmentData.fecha_inicio !== undefined
          ? appointmentData.fecha_inicio
          : existingAppointment.fecha_inicio,
      fecha_fin:
        appointmentData.fecha_fin !== undefined
          ? appointmentData.fecha_fin
          : existingAppointment.fecha_fin,
      estado:
        appointmentData.estado !== undefined
          ? appointmentData.estado
          : existingAppointment.estado,
      notas:
        appointmentData.notas !== undefined
          ? appointmentData.notas
          : existingAppointment.notas,
      precio_final:
        appointmentData.precio_final !== undefined
          ? appointmentData.precio_final
            ? parseFloat(appointmentData.precio_final)
            : null
          : existingAppointment.precio_final,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("appointments")
      .update(updateData)
      .eq("id_cita", id)
      .select(
        `
        *,
        clients(
          id_cliente,
          nombre,
          apellido,
          email,
          telefono
        ),
        employees(
          id_empleado,
          nombre,
          cargo,
          departamento
        ),
        services(
          id_servicio,
          nombre_servicio,
          descripcion,
          duracion,
          precio
        )
      `
      )
      .single();

    if (error) {
      console.error("Error al actualizar cita:", error);
      if (error.code === "23503") {
        return {
          success: false,
          error: "Referencia inválida (empleado, cliente o servicio no existe)",
        };
      }
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error en updateAppointment:", error);
    return {
      success: false,
      error: "Error al actualizar cita",
      details: error.message,
    };
  }
}

// Eliminar una cita
async function deleteAppointment(companyId, appointmentId) {
  try {
    const id = parseInt(appointmentId);
    if (isNaN(id)) {
      return { success: false, error: "ID inválido" };
    }

    // Verificar que la cita existe y el empleado pertenece a la empresa
    const { data: existingAppointment } = await supabaseAdmin
      .from("appointments")
      .select(
        `
        id_cita,
        employees!inner(company_id)
      `
      )
      .eq("id_cita", id)
      .eq("employees.company_id", companyId)
      .single();

    if (!existingAppointment) {
      return { success: false, error: "Cita no encontrada" };
    }

    const { error } = await supabaseAdmin
      .from("appointments")
      .delete()
      .eq("id_cita", id);

    if (error) {
      console.error("Error al eliminar cita:", error);
      throw error;
    }

    return {
      success: true,
      message: "Cita eliminada correctamente",
    };
  } catch (error) {
    console.error("Error en deleteAppointment:", error);
    return {
      success: false,
      error: "Error al eliminar cita",
      details: error.message,
    };
  }
}

// Verificar disponibilidad de empleado
async function checkEmployeeAvailability(companyId, params) {
  try {
    const { employeeId, startDate, endDate, appointmentId } = params;

    if (!startDate || !endDate) {
      return {
        success: false,
        error: "Se requieren fechas de inicio y fin",
      };
    }

    // Caso especial: contar todas las citas sin importar el empleado
    if (employeeId === "contar_reservas") {
      let query = supabaseAdmin
        .from("appointments")
        .select("count", { count: "exact", head: true })
        .or(
          `and(fecha_inicio.lte.${startDate},fecha_fin.gte.${startDate}),and(fecha_inicio.lte.${endDate},fecha_fin.gte.${endDate}),and(fecha_inicio.gte.${startDate},fecha_fin.lte.${endDate})`
        )
        .neq("estado", "cancelada");

      if (appointmentId) {
        query = query.neq("id_cita", appointmentId);
      }

      const { count, error } = await query;

      if (error) {
        console.error("Error al contar reservas:", error);
        throw error;
      }

      return { success: true, data: count };
    }

    // Caso especial: sin asignar (siempre disponible)
    if (employeeId === "sin_asignar") {
      return {
        success: true,
        data: {
          disponible: true,
          reservasExistentes: 0,
        },
      };
    }

    // Verificar disponibilidad de empleado específico
    if (employeeId) {
      // Verificar que el empleado pertenece a la empresa
      const { data: employee } = await supabaseAdmin
        .from("employees")
        .select("id_empleado")
        .eq("company_id", companyId)
        .eq("id_empleado", employeeId)
        .single();

      if (!employee) {
        return {
          success: false,
          error: "El empleado no existe o no pertenece a esta empresa",
        };
      }

      let query = supabaseAdmin
        .from("appointments")
        .select("count", { count: "exact", head: true })
        .eq("id_empleado", employeeId)
        .or(
          `and(fecha_inicio.lte.${startDate},fecha_fin.gte.${startDate}),and(fecha_inicio.lte.${endDate},fecha_fin.gte.${endDate}),and(fecha_inicio.gte.${startDate},fecha_fin.lte.${endDate})`
        )
        .neq("estado", "cancelada");

      if (appointmentId) {
        query = query.neq("id_cita", appointmentId);
      }

      const { count, error } = await query;

      if (error) {
        console.error("Error al verificar disponibilidad:", error);
        throw error;
      }

      return {
        success: true,
        data: {
          disponible: count === 0,
          reservasExistentes: count,
        },
      };
    }

    return { success: false, error: "employeeId es requerido" };
  } catch (error) {
    console.error("Error en checkEmployeeAvailability:", error);
    return {
      success: false,
      error: "Error al verificar disponibilidad",
      details: error.message,
    };
  }
}

// Actualizar solo el estado de una cita
async function updateAppointmentStatus(companyId, appointmentId, newStatus) {
  try {
    const id = parseInt(appointmentId);
    if (isNaN(id)) {
      return { success: false, error: "ID inválido" };
    }

    const estadosValidos = [
      "pendiente",
      "confirmada",
      "completada",
      "cancelada",
    ];
    if (!estadosValidos.includes(newStatus)) {
      return {
        success: false,
        error: `Estado inválido. Debe ser: ${estadosValidos.join(", ")}`,
      };
    }

    // Verificar que la cita existe y el empleado pertenece a la empresa
    const { data: existingAppointment } = await supabaseAdmin
      .from("appointments")
      .select(
        `
        id_cita,
        employees!inner(company_id)
      `
      )
      .eq("id_cita", id)
      .eq("employees.company_id", companyId)
      .single();

    if (!existingAppointment) {
      return { success: false, error: "Cita no encontrada" };
    }

    const { data, error } = await supabaseAdmin
      .from("appointments")
      .update({
        estado: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id_cita", id)
      .select()
      .single();

    if (error) {
      console.error("Error al actualizar estado:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error en updateAppointmentStatus:", error);
    return {
      success: false,
      error: "Error al actualizar estado de cita",
      details: error.message,
    };
  }
}

// Exportar funciones para uso en EdgeFunction
export {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  checkEmployeeAvailability,
  updateAppointmentStatus,
  extractCompanyId,
  validateAppointmentData,
};
