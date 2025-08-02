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

// Función para validar datos de alerta
function validateAlertData(data, isUpdate = false) {
  const errors = [];

  // Campos obligatorios en creación
  if (!isUpdate) {
    if (!data.titulo) {
      errors.push("titulo es obligatorio");
    }

    if (!data.fecha_recordatorio) {
      errors.push("fecha_recordatorio es obligatorio");
    }
  }

  // Validación de título
  if (
    data.titulo &&
    (typeof data.titulo !== "string" || data.titulo.trim().length === 0)
  ) {
    errors.push("titulo debe ser un texto válido");
  }

  if (data.titulo && data.titulo.length > 200) {
    errors.push("titulo no puede exceder 200 caracteres");
  }

  // Validación de descripción
  if (data.descripcion && data.descripcion.length > 1000) {
    errors.push("descripcion no puede exceder 1000 caracteres");
  }

  // Validación de fecha de recordatorio
  if (data.fecha_recordatorio && !isValidDateTime(data.fecha_recordatorio)) {
    errors.push(
      "fecha_recordatorio debe ser una fecha y hora válida (ISO 8601)"
    );
  }

  // Validación de estado
  const estadosValidos = ["pendiente", "completada", "cancelada"];
  if (data.estado && !estadosValidos.includes(data.estado)) {
    errors.push(`estado debe ser uno de: ${estadosValidos.join(", ")}`);
  }

  // Validación de tipo
  const tiposValidos = [
    "recordatorio",
    "tarea",
    "evento",
    "cita",
    "pago",
    "otro",
  ];
  if (data.tipo && !tiposValidos.includes(data.tipo)) {
    errors.push(`tipo debe ser uno de: ${tiposValidos.join(", ")}`);
  }

  // Validación de prioridad
  const prioridadesValidas = ["baja", "media", "alta", "urgente"];
  if (data.prioridad && !prioridadesValidas.includes(data.prioridad)) {
    errors.push(`prioridad debe ser uno de: ${prioridadesValidas.join(", ")}`);
  }

  // Validación de fecha en el futuro (opcional, puede ser útil para recordatorios)
  if (data.fecha_recordatorio) {
    const fechaRecordatorio = new Date(data.fecha_recordatorio);
    const ahora = new Date();

    // Permitir fechas pasadas para casos donde se registran alertas ya vencidas
    // pero validar que no sea muy antigua (más de 1 año)
    const unAñoAtras = new Date();
    unAñoAtras.setFullYear(unAñoAtras.getFullYear() - 1);

    if (fechaRecordatorio < unAñoAtras) {
      errors.push("fecha_recordatorio no puede ser anterior a un año");
    }

    // Validar que no sea muy en el futuro (más de 5 años)
    const cincoAñosAdelante = new Date();
    cincoAñosAdelante.setFullYear(cincoAñosAdelante.getFullYear() + 5);

    if (fechaRecordatorio > cincoAñosAdelante) {
      errors.push("fecha_recordatorio no puede ser posterior a 5 años");
    }
  }

  return errors;
}

// Función auxiliar para validar fecha y hora
function isValidDateTime(dateTimeString) {
  const date = new Date(dateTimeString);
  return (
    date instanceof Date &&
    !isNaN(date.getTime()) &&
    dateTimeString.includes("T")
  );
}

// Obtener todas las alertas
async function getAlerts(companyId, filters = {}) {
  try {
    let query = supabaseAdmin
      .from("alerts")
      .select("*")
      .eq("company_id", companyId)
      .order("fecha_recordatorio", { ascending: false });

    // Aplicar filtros opcionales
    if (filters.estado) {
      query = query.eq("estado", filters.estado);
    }

    if (filters.tipo) {
      query = query.eq("tipo", filters.tipo);
    }

    if (filters.prioridad) {
      query = query.eq("prioridad", filters.prioridad);
    }

    // Filtro por rango de fechas
    if (filters.fecha_desde && filters.fecha_hasta) {
      query = query
        .gte("fecha_recordatorio", filters.fecha_desde)
        .lte("fecha_recordatorio", filters.fecha_hasta);
    } else if (filters.fecha_desde) {
      query = query.gte("fecha_recordatorio", filters.fecha_desde);
    } else if (filters.fecha_hasta) {
      query = query.lte("fecha_recordatorio", filters.fecha_hasta);
    }

    // Filtro para alertas vencidas
    if (filters.vencidas === "true") {
      const ahora = new Date().toISOString();
      query = query.lt("fecha_recordatorio", ahora).eq("estado", "pendiente");
    }

    // Filtro para alertas próximas (próximas 24 horas)
    if (filters.proximas === "true") {
      const ahora = new Date();
      const en24Horas = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);
      query = query
        .gte("fecha_recordatorio", ahora.toISOString())
        .lte("fecha_recordatorio", en24Horas.toISOString())
        .eq("estado", "pendiente");
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error al obtener alertas:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error en getAlerts:", error);
    return {
      success: false,
      error: "Error al obtener alertas",
      details: error.message,
    };
  }
}

// Obtener una alerta por ID
async function getAlertById(companyId, alertId) {
  try {
    const { data, error } = await supabaseAdmin
      .from("alerts")
      .select("*")
      .eq("company_id", companyId)
      .eq("id_recordatorio", alertId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { success: false, error: "Alerta no encontrada" };
      }
      console.error("Error al obtener alerta:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error en getAlertById:", error);
    return {
      success: false,
      error: "Error al obtener alerta",
      details: error.message,
    };
  }
}

// Crear nueva alerta
async function createAlert(companyId, alertData) {
  try {
    // Validar datos
    const validationErrors = validateAlertData(alertData);
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: "Datos inválidos",
        details: validationErrors,
      };
    }

    // Preparar datos para inserción
    const insertData = {
      company_id: companyId,
      titulo: alertData.titulo,
      descripcion: alertData.descripcion || null,
      fecha_recordatorio: alertData.fecha_recordatorio,
      estado: alertData.estado || "pendiente",
      tipo: alertData.tipo || "recordatorio",
      prioridad: alertData.prioridad || "media",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("alerts")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Error al crear alerta:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error en createAlert:", error);
    return {
      success: false,
      error: "Error al crear alerta",
      details: error.message,
    };
  }
}

// Actualizar alerta existente
async function updateAlert(companyId, alertId, alertData) {
  try {
    // Validar datos
    const validationErrors = validateAlertData(alertData, true);
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: "Datos inválidos",
        details: validationErrors,
      };
    }

    // Verificar que la alerta existe y pertenece a la empresa
    const { data: existingAlert } = await supabaseAdmin
      .from("alerts")
      .select("id_recordatorio")
      .eq("company_id", companyId)
      .eq("id_recordatorio", alertId)
      .single();

    if (!existingAlert) {
      return { success: false, error: "Alerta no encontrada" };
    }

    // Preparar datos para actualización
    const updateData = {
      titulo: alertData.titulo,
      descripcion: alertData.descripcion || null,
      fecha_recordatorio: alertData.fecha_recordatorio,
      estado: alertData.estado || "pendiente",
      tipo: alertData.tipo || "recordatorio",
      prioridad: alertData.prioridad || "media",
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("alerts")
      .update(updateData)
      .eq("company_id", companyId)
      .eq("id_recordatorio", alertId)
      .select()
      .single();

    if (error) {
      console.error("Error al actualizar alerta:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error en updateAlert:", error);
    return {
      success: false,
      error: "Error al actualizar alerta",
      details: error.message,
    };
  }
}

// Eliminar alerta
async function deleteAlert(companyId, alertId) {
  try {
    // Verificar que la alerta existe y pertenece a la empresa
    const { data: existingAlert } = await supabaseAdmin
      .from("alerts")
      .select("id_recordatorio")
      .eq("company_id", companyId)
      .eq("id_recordatorio", alertId)
      .single();

    if (!existingAlert) {
      return { success: false, error: "Alerta no encontrada" };
    }

    const { error } = await supabaseAdmin
      .from("alerts")
      .delete()
      .eq("company_id", companyId)
      .eq("id_recordatorio", alertId);

    if (error) {
      console.error("Error al eliminar alerta:", error);
      throw error;
    }

    return {
      success: true,
      message: "Alerta eliminada correctamente",
    };
  } catch (error) {
    console.error("Error en deleteAlert:", error);
    return {
      success: false,
      error: "Error al eliminar alerta",
      details: error.message,
    };
  }
}

// Marcar alerta como completada
async function markAlertAsCompleted(companyId, alertId) {
  try {
    // Verificar que la alerta existe y pertenece a la empresa
    const { data: existingAlert } = await supabaseAdmin
      .from("alerts")
      .select("id_recordatorio, estado")
      .eq("company_id", companyId)
      .eq("id_recordatorio", alertId)
      .single();

    if (!existingAlert) {
      return { success: false, error: "Alerta no encontrada" };
    }

    const { data, error } = await supabaseAdmin
      .from("alerts")
      .update({
        estado: "completada",
        updated_at: new Date().toISOString(),
      })
      .eq("company_id", companyId)
      .eq("id_recordatorio", alertId)
      .select()
      .single();

    if (error) {
      console.error("Error al marcar alerta como completada:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error en markAlertAsCompleted:", error);
    return {
      success: false,
      error: "Error al marcar alerta como completada",
      details: error.message,
    };
  }
}

// Obtener estadísticas de alertas
async function getAlertStats(companyId) {
  try {
    // Contar alertas por estado
    const { data: statsData, error: statsError } = await supabaseAdmin
      .from("alerts")
      .select("estado, prioridad, tipo")
      .eq("company_id", companyId);

    if (statsError) {
      console.error("Error al obtener estadísticas:", statsError);
      throw statsError;
    }

    // Procesar estadísticas
    const stats = {
      total: statsData.length,
      por_estado: {
        pendiente: 0,
        completada: 0,
        cancelada: 0,
      },
      por_prioridad: {
        baja: 0,
        media: 0,
        alta: 0,
        urgente: 0,
      },
      por_tipo: {
        recordatorio: 0,
        tarea: 0,
        evento: 0,
        cita: 0,
        pago: 0,
        otro: 0,
      },
    };

    statsData.forEach((alert) => {
      if (stats.por_estado[alert.estado] !== undefined) {
        stats.por_estado[alert.estado]++;
      }
      if (stats.por_prioridad[alert.prioridad] !== undefined) {
        stats.por_prioridad[alert.prioridad]++;
      }
      if (stats.por_tipo[alert.tipo] !== undefined) {
        stats.por_tipo[alert.tipo]++;
      }
    });

    // Contar alertas vencidas
    const ahora = new Date().toISOString();
    const { count: vencidasCount } = await supabaseAdmin
      .from("alerts")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("estado", "pendiente")
      .lt("fecha_recordatorio", ahora);

    stats.vencidas = vencidasCount || 0;

    // Contar alertas próximas (próximas 24 horas)
    const en24Horas = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { count: proximasCount } = await supabaseAdmin
      .from("alerts")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("estado", "pendiente")
      .gte("fecha_recordatorio", ahora)
      .lte("fecha_recordatorio", en24Horas);

    stats.proximas_24h = proximasCount || 0;

    return { success: true, data: stats };
  } catch (error) {
    console.error("Error en getAlertStats:", error);
    return {
      success: false,
      error: "Error al obtener estadísticas de alertas",
      details: error.message,
    };
  }
}

// Exportar funciones para uso en EdgeFunction
export {
  getAlerts,
  getAlertById,
  createAlert,
  updateAlert,
  deleteAlert,
  markAlertAsCompleted,
  getAlertStats,
  extractCompanyId,
  validateAlertData,
};
