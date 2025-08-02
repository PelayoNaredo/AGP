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

// Función para validar datos de ingreso
function validateIncomeData(data, isUpdate = false) {
  const errors = [];

  // Campos obligatorios en creación
  if (!isUpdate) {
    if (!data.concepto) {
      errors.push("concepto es obligatorio");
    }

    if (data.ingresos === undefined || data.ingresos === null) {
      errors.push("ingresos es obligatorio");
    }
  }

  // Validación de concepto
  if (
    data.concepto &&
    (typeof data.concepto !== "string" || data.concepto.trim().length === 0)
  ) {
    errors.push("concepto debe ser un texto válido");
  }

  if (data.concepto && data.concepto.length > 200) {
    errors.push("concepto no puede exceder 200 caracteres");
  }

  // Validación de ingresos
  if (data.ingresos !== undefined && data.ingresos !== null) {
    const ingresos = parseFloat(data.ingresos);
    if (isNaN(ingresos)) {
      errors.push("ingresos debe ser un número válido");
    } else if (ingresos < 0) {
      errors.push("ingresos no puede ser negativo");
    } else if (ingresos > 999999999.99) {
      errors.push("ingresos no puede exceder 999,999,999.99");
    }
  }

  // Validación de fecha de ingreso
  if (data.fecha_ingreso && !isValidDate(data.fecha_ingreso)) {
    errors.push(
      "fecha_ingreso debe ser una fecha válida (YYYY-MM-DD o ISO 8601)"
    );
  }

  // Validación de categoría
  const categoriasValidas = [
    "ventas",
    "servicios",
    "comisiones",
    "intereses",
    "alquileres",
    "inversiones",
    "subsidios",
    "donaciones",
    "cierre",
    "otros",
  ];
  if (data.categoria && !categoriasValidas.includes(data.categoria)) {
    errors.push(`categoria debe ser uno de: ${categoriasValidas.join(", ")}`);
  }

  // Validación de método de ingreso
  const metodosValidos = [
    "efectivo",
    "transferencia",
    "tarjeta",
    "cheque",
    "paypal",
    "stripe",
    "bizum",
    "multiple",
    "otros",
  ];
  if (data.metodo_ingreso && !metodosValidos.includes(data.metodo_ingreso)) {
    errors.push(`metodo_ingreso debe ser uno de: ${metodosValidos.join(", ")}`);
  }

  // Validación de comentarios
  if (data.comentarios && data.comentarios.length > 1000) {
    errors.push("comentarios no puede exceder 1000 caracteres");
  }

  // Validación de fechas lógicas
  if (data.fecha_ingreso) {
    const fechaIngreso = new Date(data.fecha_ingreso);
    const ahora = new Date();

    // Permitir fechas pasadas pero no muy antiguas (más de 10 años)
    const diezAñosAtras = new Date();
    diezAñosAtras.setFullYear(diezAñosAtras.getFullYear() - 10);

    if (fechaIngreso < diezAñosAtras) {
      errors.push("fecha_ingreso no puede ser anterior a 10 años");
    }

    // No permitir fechas muy en el futuro (más de 1 año)
    const unAñoAdelante = new Date();
    unAñoAdelante.setFullYear(unAñoAdelante.getFullYear() + 1);

    if (fechaIngreso > unAñoAdelante) {
      errors.push("fecha_ingreso no puede ser posterior a 1 año");
    }
  }

  return errors;
}

// Función auxiliar para validar fecha
function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

// Obtener todos los ingresos
async function getAllIncome(companyId, filters = {}) {
  try {
    let query = supabaseAdmin
      .from("income")
      .select("*")
      .eq("company_id", companyId)
      .order("fecha_ingreso", { ascending: false });

    // Aplicar filtros opcionales
    if (filters.categoria) {
      query = query.eq("categoria", filters.categoria);
    }

    if (filters.metodo_ingreso) {
      query = query.eq("metodo_ingreso", filters.metodo_ingreso);
    }

    // Filtro por rango de fechas
    if (filters.fecha_desde && filters.fecha_hasta) {
      query = query
        .gte("fecha_ingreso", filters.fecha_desde)
        .lte("fecha_ingreso", filters.fecha_hasta);
    } else if (filters.fecha_desde) {
      query = query.gte("fecha_ingreso", filters.fecha_desde);
    } else if (filters.fecha_hasta) {
      query = query.lte("fecha_ingreso", filters.fecha_hasta);
    }

    // Filtro por monto mínimo y máximo
    if (filters.monto_min) {
      query = query.gte("ingresos", parseFloat(filters.monto_min));
    }

    if (filters.monto_max) {
      query = query.lte("ingresos", parseFloat(filters.monto_max));
    }

    // Filtro para cierres diarios
    if (filters.solo_cierres === "true") {
      query = query.like("comentarios", "Cierre diario%");
    } else if (filters.excluir_cierres === "true") {
      query = query.not("comentarios", "like", "Cierre diario%");
    }

    // Búsqueda por texto en concepto o comentarios
    if (filters.search) {
      query = query.or(
        `concepto.ilike.%${filters.search}%,comentarios.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error al obtener ingresos:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error en getAllIncome:", error);
    return {
      success: false,
      error: "Error al obtener ingresos",
      details: error.message,
    };
  }
}

// Obtener un ingreso por ID
async function getIncomeById(companyId, incomeId) {
  try {
    const { data, error } = await supabaseAdmin
      .from("income")
      .select("*")
      .eq("company_id", companyId)
      .eq("id_ingreso", incomeId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { success: false, error: "Ingreso no encontrado" };
      }
      console.error("Error al obtener ingreso:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error en getIncomeById:", error);
    return {
      success: false,
      error: "Error al obtener ingreso",
      details: error.message,
    };
  }
}

// Crear nuevo ingreso
async function createIncome(companyId, incomeData) {
  try {
    // Validar datos
    const validationErrors = validateIncomeData(incomeData);
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
      fecha_ingreso:
        incomeData.fecha_ingreso || new Date().toISOString().split("T")[0],
      ingresos: parseFloat(incomeData.ingresos),
      concepto: incomeData.concepto,
      categoria: incomeData.categoria || "otros",
      comentarios: incomeData.comentarios || null,
      metodo_ingreso: incomeData.metodo_ingreso || "otros",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("income")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Error al crear ingreso:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error en createIncome:", error);
    return {
      success: false,
      error: "Error al crear ingreso",
      details: error.message,
    };
  }
}

// Actualizar ingreso existente
async function updateIncome(companyId, incomeId, incomeData) {
  try {
    // Validar datos
    const validationErrors = validateIncomeData(incomeData, true);
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: "Datos inválidos",
        details: validationErrors,
      };
    }

    // Verificar que el ingreso existe y pertenece a la empresa
    const { data: existingIncome } = await supabaseAdmin
      .from("income")
      .select("id_ingreso")
      .eq("company_id", companyId)
      .eq("id_ingreso", incomeId)
      .single();

    if (!existingIncome) {
      return { success: false, error: "Ingreso no encontrado" };
    }

    // Preparar datos para actualización
    const updateData = {
      fecha_ingreso: incomeData.fecha_ingreso,
      ingresos: incomeData.ingresos
        ? parseFloat(incomeData.ingresos)
        : undefined,
      concepto: incomeData.concepto,
      categoria: incomeData.categoria,
      comentarios: incomeData.comentarios,
      metodo_ingreso: incomeData.metodo_ingreso,
      updated_at: new Date().toISOString(),
    };

    // Eliminar campos undefined para usar COALESCE en SQL
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const { data, error } = await supabaseAdmin
      .from("income")
      .update(updateData)
      .eq("company_id", companyId)
      .eq("id_ingreso", incomeId)
      .select()
      .single();

    if (error) {
      console.error("Error al actualizar ingreso:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error en updateIncome:", error);
    return {
      success: false,
      error: "Error al actualizar ingreso",
      details: error.message,
    };
  }
}

// Eliminar ingreso
async function deleteIncome(companyId, incomeId) {
  try {
    // Verificar que el ingreso existe y pertenece a la empresa
    const { data: existingIncome } = await supabaseAdmin
      .from("income")
      .select("id_ingreso")
      .eq("company_id", companyId)
      .eq("id_ingreso", incomeId)
      .single();

    if (!existingIncome) {
      return { success: false, error: "Ingreso no encontrado" };
    }

    const { error } = await supabaseAdmin
      .from("income")
      .delete()
      .eq("company_id", companyId)
      .eq("id_ingreso", incomeId);

    if (error) {
      console.error("Error al eliminar ingreso:", error);
      throw error;
    }

    return {
      success: true,
      message: "Ingreso eliminado correctamente",
    };
  } catch (error) {
    console.error("Error en deleteIncome:", error);
    return {
      success: false,
      error: "Error al eliminar ingreso",
      details: error.message,
    };
  }
}

// Verificar si ya existe un cierre diario para una fecha específica
async function getDailyClosureByDate(companyId, date) {
  try {
    if (!date) {
      return {
        success: false,
        error: "Se requiere especificar una fecha",
      };
    }

    // Formatear la fecha para buscar cierres diarios
    const formattedDate = new Date(date).toISOString().split("T")[0];

    const { data, error } = await supabaseAdmin
      .from("income")
      .select("*")
      .eq("company_id", companyId)
      .gte("fecha_ingreso", formattedDate)
      .lt("fecha_ingreso", formattedDate + "T23:59:59.999Z")
      .like("comentarios", "Cierre diario%");

    if (error) {
      console.error("Error al verificar cierre diario:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error en getDailyClosureByDate:", error);
    return {
      success: false,
      error: "Error al verificar cierre diario",
      details: error.message,
    };
  }
}

// Realizar cierre diario de ventas
async function createDailyClosure(companyId, closureData) {
  try {
    const { fecha_ingreso, ingresos, comentarios, force = false } = closureData;

    if (!fecha_ingreso) {
      return {
        success: false,
        error: "Se requiere especificar una fecha",
      };
    }

    if (isNaN(parseFloat(ingresos))) {
      return {
        success: false,
        error: "Monto de ingresos inválido",
      };
    }

    // Verificar si ya existe un cierre para esta fecha
    const existingClosure = await getDailyClosureByDate(
      companyId,
      fecha_ingreso
    );

    if (existingClosure.success && existingClosure.data.length > 0 && !force) {
      return {
        success: false,
        error: "Ya existe un cierre diario para esta fecha",
        canForce: true,
      };
    }

    // Preparar datos del cierre diario
    const cierreComentario = comentarios || `Cierre diario ${fecha_ingreso}`;
    const cierreData = {
      company_id: companyId,
      fecha_ingreso: fecha_ingreso,
      ingresos: parseFloat(ingresos),
      concepto: "Cierre Diario",
      categoria: "cierre",
      comentarios: cierreComentario,
      metodo_ingreso: "multiple",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("income")
      .insert(cierreData)
      .select()
      .single();

    if (error) {
      console.error("Error al crear cierre diario:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error en createDailyClosure:", error);
    return {
      success: false,
      error: "Error al crear cierre diario",
      details: error.message,
    };
  }
}

// Obtener resumen de ingresos por período
async function getIncomeByPeriod(companyId, period) {
  try {
    const validPeriods = ["day", "week", "month", "year"];

    if (!validPeriods.includes(period)) {
      return {
        success: false,
        error: "Período inválido. Debe ser: day, week, month o year",
      };
    }

    // Esta funcionalidad requiere consultas SQL más complejas
    // Por ahora, implementamos una versión simplificada
    const { data, error } = await supabaseAdmin
      .from("income")
      .select("*")
      .eq("company_id", companyId)
      .order("fecha_ingreso", { ascending: false });

    if (error) {
      console.error("Error al obtener resumen de ingresos:", error);
      throw error;
    }

    // Procesar datos para agrupar por período
    const groupedData = {};

    data.forEach((income) => {
      const date = new Date(income.fecha_ingreso);
      let periodKey;

      switch (period) {
        case "day":
          periodKey = date.toISOString().split("T")[0];
          break;
        case "week":
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          periodKey = weekStart.toISOString().split("T")[0] + " (semana)";
          break;
        case "month":
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          break;
        case "year":
          periodKey = date.getFullYear().toString();
          break;
      }

      if (!groupedData[periodKey]) {
        groupedData[periodKey] = {
          periodo: periodKey,
          total_ingresos: 0,
          num_transacciones: 0,
          categorias: new Set(),
        };
      }

      groupedData[periodKey].total_ingresos += parseFloat(income.ingresos);
      groupedData[periodKey].num_transacciones++;
      if (income.categoria) {
        groupedData[periodKey].categorias.add(income.categoria);
      }
    });

    // Convertir Set a Array y formatear resultados
    const result = Object.values(groupedData).map((group) => ({
      ...group,
      categorias: Array.from(group.categorias),
      total_ingresos: Math.round(group.total_ingresos * 100) / 100,
    }));

    return { success: true, data: result };
  } catch (error) {
    console.error("Error en getIncomeByPeriod:", error);
    return {
      success: false,
      error: "Error al obtener resumen de ingresos",
      details: error.message,
    };
  }
}

// Obtener estadísticas generales de ingresos
async function getIncomeStats(companyId) {
  try {
    const { data: incomeData, error } = await supabaseAdmin
      .from("income")
      .select("ingresos, categoria, metodo_ingreso, fecha_ingreso")
      .eq("company_id", companyId);

    if (error) {
      console.error("Error al obtener estadísticas:", error);
      throw error;
    }

    // Calcular estadísticas
    const stats = {
      total_ingresos: 0,
      total_transacciones: incomeData.length,
      promedio_transaccion: 0,
      por_categoria: {},
      por_metodo: {},
      ingreso_maximo: 0,
      ingreso_minimo: incomeData.length > 0 ? Number.MAX_VALUE : 0,
    };

    incomeData.forEach((income) => {
      const monto = parseFloat(income.ingresos);

      stats.total_ingresos += monto;

      if (monto > stats.ingreso_maximo) {
        stats.ingreso_maximo = monto;
      }

      if (monto < stats.ingreso_minimo) {
        stats.ingreso_minimo = monto;
      }

      // Agrupar por categoría
      if (income.categoria) {
        if (!stats.por_categoria[income.categoria]) {
          stats.por_categoria[income.categoria] = { total: 0, count: 0 };
        }
        stats.por_categoria[income.categoria].total += monto;
        stats.por_categoria[income.categoria].count++;
      }

      // Agrupar por método
      if (income.metodo_ingreso) {
        if (!stats.por_metodo[income.metodo_ingreso]) {
          stats.por_metodo[income.metodo_ingreso] = { total: 0, count: 0 };
        }
        stats.por_metodo[income.metodo_ingreso].total += monto;
        stats.por_metodo[income.metodo_ingreso].count++;
      }
    });

    stats.promedio_transaccion =
      stats.total_transacciones > 0
        ? Math.round((stats.total_ingresos / stats.total_transacciones) * 100) /
          100
        : 0;

    stats.total_ingresos = Math.round(stats.total_ingresos * 100) / 100;

    if (stats.ingreso_minimo === Number.MAX_VALUE) {
      stats.ingreso_minimo = 0;
    }

    return { success: true, data: stats };
  } catch (error) {
    console.error("Error en getIncomeStats:", error);
    return {
      success: false,
      error: "Error al obtener estadísticas de ingresos",
      details: error.message,
    };
  }
}

// Exportar funciones para uso en EdgeFunction
export {
  getAllIncome,
  getIncomeById,
  createIncome,
  updateIncome,
  deleteIncome,
  getDailyClosureByDate,
  createDailyClosure,
  getIncomeByPeriod,
  getIncomeStats,
  extractCompanyId,
  validateIncomeData,
};
