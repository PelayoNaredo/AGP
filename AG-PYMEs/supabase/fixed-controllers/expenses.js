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

// Función para validar datos de gasto
function validateExpenseData(data, isUpdate = false) {
  const errors = [];

  // Campos obligatorios en creación
  if (!isUpdate) {
    if (!data.concepto) {
      errors.push("concepto es obligatorio");
    }

    if (!data.monto) {
      errors.push("monto es obligatorio");
    }

    if (!data.fecha_gasto) {
      errors.push("fecha_gasto es obligatorio");
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

  // Validación de monto
  if (data.monto !== undefined) {
    const monto = parseFloat(data.monto);
    if (isNaN(monto) || monto <= 0) {
      errors.push("monto debe ser un número positivo mayor que 0");
    }
    if (monto > 999999.99) {
      errors.push("monto no puede exceder 999,999.99");
    }
  }

  // Validación de fecha de gasto
  if (data.fecha_gasto && !isValidDate(data.fecha_gasto)) {
    errors.push("fecha_gasto debe ser una fecha válida (YYYY-MM-DD)");
  }

  // Validación de fecha no muy en el futuro
  if (data.fecha_gasto) {
    const fechaGasto = new Date(data.fecha_gasto);
    const hoy = new Date();
    const tresMesesAdelante = new Date();
    tresMesesAdelante.setMonth(tresMesesAdelante.getMonth() + 3);

    if (fechaGasto > tresMesesAdelante) {
      errors.push("fecha_gasto no puede ser más de 3 meses en el futuro");
    }

    // Validación de fecha no muy en el pasado (más de 5 años)
    const cincoAñosAtras = new Date();
    cincoAñosAtras.setFullYear(cincoAñosAtras.getFullYear() - 5);

    if (fechaGasto < cincoAñosAtras) {
      errors.push("fecha_gasto no puede ser anterior a 5 años");
    }
  }

  // Validación de tipo de gasto
  const tiposValidos = [
    "operativo",
    "administrativo",
    "marketing",
    "ventas",
    "tecnologia",
    "recursos_humanos",
    "financiero",
    "legal",
    "mantenimiento",
    "otro",
  ];
  if (data.tipo_gasto && !tiposValidos.includes(data.tipo_gasto)) {
    errors.push(`tipo_gasto debe ser uno de: ${tiposValidos.join(", ")}`);
  }

  // Validación de comentarios (longitud máxima)
  if (data.comentarios && data.comentarios.length > 500) {
    errors.push("comentarios no puede exceder 500 caracteres");
  }

  return errors;
}

// Función auxiliar para validar fecha
function isValidDate(dateString) {
  // Verificar formato YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return (
    date instanceof Date &&
    !isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === dateString
  );
}

// Obtener gastos con paginación y búsqueda
async function getExpenses(companyId, filters = {}) {
  try {
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 50;
    const search = filters.search || "";
    const offset = (page - 1) * limit;

    // Construir query con filtros
    let query = supabaseAdmin
      .from("expenses")
      .select("*", { count: "exact" })
      .eq("company_id", companyId);

    // Aplicar búsqueda si se proporciona
    if (search) {
      query = query.or(
        `concepto.ilike.%${search}%,comentarios.ilike.%${search}%`
      );
    }

    // Aplicar filtros adicionales
    if (filters.tipo_gasto) {
      query = query.eq("tipo_gasto", filters.tipo_gasto);
    }

    if (filters.fecha_desde && filters.fecha_hasta) {
      query = query
        .gte("fecha_gasto", filters.fecha_desde)
        .lte("fecha_gasto", filters.fecha_hasta);
    } else if (filters.fecha_desde) {
      query = query.gte("fecha_gasto", filters.fecha_desde);
    } else if (filters.fecha_hasta) {
      query = query.lte("fecha_gasto", filters.fecha_hasta);
    }

    if (filters.monto_min) {
      query = query.gte("monto", parseFloat(filters.monto_min));
    }

    if (filters.monto_max) {
      query = query.lte("monto", parseFloat(filters.monto_max));
    }

    // Ordenar y paginar
    const { data, error, count } = await query
      .order("fecha_gasto", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error al obtener gastos:", error);
      throw error;
    }

    const totalPages = Math.ceil(count / limit);

    return {
      success: true,
      data: {
        expenses: data,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalItems: count,
          itemsPerPage: limit,
        },
      },
    };
  } catch (error) {
    console.error("Error en getExpenses:", error);
    return {
      success: false,
      error: "Error al obtener gastos",
      details: error.message,
    };
  }
}

// Obtener gastos del mes específico
async function getExpensesByMonth(companyId, month, year, search = "") {
  try {
    // Validar mes y año
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return {
        success: false,
        error: "El mes debe ser un número entre 1 y 12",
      };
    }

    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      return {
        success: false,
        error: "El año debe ser un número entre 2000 y 2100",
      };
    }

    // Crear fechas de inicio y fin del mes
    const fechaInicio = `${yearNum}-${monthNum.toString().padStart(2, "0")}-01`;
    const ultimoDiaDelMes = new Date(yearNum, monthNum, 0).getDate();
    const fechaFin = `${yearNum}-${monthNum.toString().padStart(2, "0")}-${ultimoDiaDelMes}`;

    let query = supabaseAdmin
      .from("expenses")
      .select("*")
      .eq("company_id", companyId)
      .gte("fecha_gasto", fechaInicio)
      .lte("fecha_gasto", fechaFin);

    // Aplicar búsqueda si se proporciona
    if (search) {
      query = query.or(
        `concepto.ilike.%${search}%,comentarios.ilike.%${search}%`
      );
    }

    const { data, error } = await query.order("fecha_gasto", {
      ascending: false,
    });

    if (error) {
      console.error("Error al obtener gastos del mes:", error);
      throw error;
    }

    // Calcular totales
    const totalMonto = data.reduce(
      (sum, expense) => sum + parseFloat(expense.monto),
      0
    );
    const totalGastos = data.length;

    return {
      success: true,
      data: {
        expenses: data,
        summary: {
          month: monthNum,
          year: yearNum,
          totalGastos: totalGastos,
          totalMonto: totalMonto,
          promedioGasto: totalGastos > 0 ? totalMonto / totalGastos : 0,
        },
      },
    };
  } catch (error) {
    console.error("Error en getExpensesByMonth:", error);
    return {
      success: false,
      error: "Error al obtener gastos del mes",
      details: error.message,
    };
  }
}

// Obtener un gasto por ID
async function getExpenseById(companyId, expenseId) {
  try {
    const { data, error } = await supabaseAdmin
      .from("expenses")
      .select("*")
      .eq("company_id", companyId)
      .eq("id_gasto", expenseId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { success: false, error: "Gasto no encontrado" };
      }
      console.error("Error al obtener gasto:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error en getExpenseById:", error);
    return {
      success: false,
      error: "Error al obtener gasto",
      details: error.message,
    };
  }
}

// Crear un nuevo gasto
async function createExpense(companyId, expenseData) {
  try {
    // Validar datos
    const validationErrors = validateExpenseData(expenseData);
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
      tipo_gasto: expenseData.tipo_gasto || "otro",
      concepto: expenseData.concepto,
      monto: parseFloat(expenseData.monto),
      fecha_gasto: expenseData.fecha_gasto,
      comentarios: expenseData.comentarios || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("expenses")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Error al crear gasto:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error en createExpense:", error);
    return {
      success: false,
      error: "Error al crear gasto",
      details: error.message,
    };
  }
}

// Actualizar un gasto existente
async function updateExpense(companyId, expenseId, expenseData) {
  try {
    // Validar datos
    const validationErrors = validateExpenseData(expenseData, true);
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: "Datos inválidos",
        details: validationErrors,
      };
    }

    // Verificar que el gasto existe y pertenece a la empresa
    const { data: existingExpense } = await supabaseAdmin
      .from("expenses")
      .select("id_gasto")
      .eq("company_id", companyId)
      .eq("id_gasto", expenseId)
      .single();

    if (!existingExpense) {
      return { success: false, error: "Gasto no encontrado" };
    }

    // Preparar datos para actualización
    const updateData = {
      tipo_gasto: expenseData.tipo_gasto || "otro",
      concepto: expenseData.concepto,
      monto: parseFloat(expenseData.monto),
      fecha_gasto: expenseData.fecha_gasto,
      comentarios: expenseData.comentarios || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("expenses")
      .update(updateData)
      .eq("company_id", companyId)
      .eq("id_gasto", expenseId)
      .select()
      .single();

    if (error) {
      console.error("Error al actualizar gasto:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error en updateExpense:", error);
    return {
      success: false,
      error: "Error al actualizar gasto",
      details: error.message,
    };
  }
}

// Eliminar un gasto
async function deleteExpense(companyId, expenseId) {
  try {
    // Verificar que el gasto existe y pertenece a la empresa
    const { data: existingExpense } = await supabaseAdmin
      .from("expenses")
      .select("id_gasto")
      .eq("company_id", companyId)
      .eq("id_gasto", expenseId)
      .single();

    if (!existingExpense) {
      return { success: false, error: "Gasto no encontrado" };
    }

    const { error } = await supabaseAdmin
      .from("expenses")
      .delete()
      .eq("company_id", companyId)
      .eq("id_gasto", expenseId);

    if (error) {
      console.error("Error al eliminar gasto:", error);
      throw error;
    }

    return {
      success: true,
      message: "Gasto eliminado correctamente",
    };
  } catch (error) {
    console.error("Error en deleteExpense:", error);
    return {
      success: false,
      error: "Error al eliminar gasto",
      details: error.message,
    };
  }
}

// Obtener estadísticas de gastos
async function getExpenseStats(companyId, filters = {}) {
  try {
    let query = supabaseAdmin
      .from("expenses")
      .select("monto, tipo_gasto, fecha_gasto")
      .eq("company_id", companyId);

    // Aplicar filtros de fecha si se proporcionan
    if (filters.fecha_desde && filters.fecha_hasta) {
      query = query
        .gte("fecha_gasto", filters.fecha_desde)
        .lte("fecha_gasto", filters.fecha_hasta);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error al obtener estadísticas:", error);
      throw error;
    }

    // Calcular estadísticas
    const stats = {
      total_gastos: data.length,
      monto_total: 0,
      promedio_gasto: 0,
      por_tipo: {
        operativo: 0,
        administrativo: 0,
        marketing: 0,
        ventas: 0,
        tecnologia: 0,
        recursos_humanos: 0,
        financiero: 0,
        legal: 0,
        mantenimiento: 0,
        otro: 0,
      },
      gastos_por_mes: {},
    };

    data.forEach((expense) => {
      const monto = parseFloat(expense.monto);
      stats.monto_total += monto;

      // Estadísticas por tipo
      if (stats.por_tipo[expense.tipo_gasto] !== undefined) {
        stats.por_tipo[expense.tipo_gasto] += monto;
      }

      // Estadísticas por mes
      const fecha = new Date(expense.fecha_gasto);
      const mesAño = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, "0")}`;

      if (!stats.gastos_por_mes[mesAño]) {
        stats.gastos_por_mes[mesAño] = {
          cantidad: 0,
          monto_total: 0,
        };
      }

      stats.gastos_por_mes[mesAño].cantidad++;
      stats.gastos_por_mes[mesAño].monto_total += monto;
    });

    stats.promedio_gasto =
      stats.total_gastos > 0 ? stats.monto_total / stats.total_gastos : 0;

    return { success: true, data: stats };
  } catch (error) {
    console.error("Error en getExpenseStats:", error);
    return {
      success: false,
      error: "Error al obtener estadísticas de gastos",
      details: error.message,
    };
  }
}

// Exportar funciones para uso en EdgeFunction
export {
  getExpenses,
  getExpensesByMonth,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats,
  extractCompanyId,
  validateExpenseData,
};
