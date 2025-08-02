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

// Obtener datos financieros comparativos
async function getFinancialData(companyId) {
  try {
    // Query para datos financieros con períodos comparativos
    const { data, error } = await supabaseAdmin.rpc(
      "get_financial_comparison",
      {
        p_company_id: companyId,
      }
    );

    if (error) {
      console.error("Error al obtener datos financieros:", error);

      // Fallback: consulta manual si la función RPC no existe
      const fallbackQuery = `
        WITH periodos AS (
          SELECT 
            CURRENT_DATE - INTERVAL '30 days' as inicio_actual,
            CURRENT_DATE as fin_actual,
            CURRENT_DATE - INTERVAL '60 days' as inicio_anterior,
            CURRENT_DATE - INTERVAL '30 days' as fin_anterior,
            MAKE_DATE(EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER - 1, 
                     EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER,
                     EXTRACT(DAY FROM CURRENT_DATE)::INTEGER) - INTERVAL '30 days' as inicio_anual,
            MAKE_DATE(EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER - 1,
                     EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER,
                     EXTRACT(DAY FROM CURRENT_DATE)::INTEGER) as fin_anual
        ),
        ingresos_por_periodo AS (
          SELECT 
            COALESCE(SUM(CASE 
              WHEN fecha_ingreso BETWEEN p.inicio_actual AND p.fin_actual 
              THEN ingresos ELSE 0 END), 0) as ingresos_actual,
            COALESCE(SUM(CASE 
              WHEN fecha_ingreso BETWEEN p.inicio_anterior AND p.fin_anterior 
              THEN ingresos ELSE 0 END), 0) as ingresos_anterior,
            COALESCE(SUM(CASE 
              WHEN fecha_ingreso BETWEEN p.inicio_anual AND p.fin_anual 
              THEN ingresos ELSE 0 END), 0) as ingresos_anual
          FROM income, periodos p
          WHERE company_id = $1
        ),
        gastos_por_periodo AS (
          SELECT 
            COALESCE(SUM(CASE 
              WHEN fecha_gasto BETWEEN p.inicio_actual AND p.fin_actual 
              THEN monto ELSE 0 END), 0) as gastos_actual,
            COALESCE(SUM(CASE 
              WHEN fecha_gasto BETWEEN p.inicio_anterior AND p.fin_anterior 
              THEN monto ELSE 0 END), 0) as gastos_anterior,
            COALESCE(SUM(CASE 
              WHEN fecha_gasto BETWEEN p.inicio_anual AND p.fin_anual 
              THEN monto ELSE 0 END), 0) as gastos_anual
          FROM expenses, periodos p
          WHERE company_id = $1
        )
        SELECT 
          i.ingresos_actual,
          i.ingresos_anterior,
          i.ingresos_anual,
          g.gastos_actual,
          g.gastos_anterior,
          g.gastos_anual,
          (i.ingresos_actual - g.gastos_actual) as balance_actual,
          (i.ingresos_anterior - g.gastos_anterior) as balance_anterior,
          (i.ingresos_anual - g.gastos_anual) as balance_anual
        FROM ingresos_por_periodo i, gastos_por_periodo g
      `;

      const { data: fallbackData, error: fallbackError } =
        await supabaseAdmin.rpc("exec_sql", {
          sql_query: fallbackQuery,
          params: [companyId],
        });

      if (fallbackError) {
        throw fallbackError;
      }

      return { success: true, data: fallbackData[0] || {} };
    }

    return { success: true, data: data[0] || {} };
  } catch (error) {
    console.error("Error en getFinancialData:", error);
    return {
      success: false,
      error: "Error al obtener datos financieros",
      details: error.message,
    };
  }
}

// Obtener tendencia temporal (últimos 6 meses)
async function getTrendData(companyId) {
  try {
    const query = `
      WITH balance_mensual AS (
        SELECT 
          DATE_TRUNC('month', fecha_emision)::date as mes,
          COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END), 0) as ingresos_mes,
          COALESCE(SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END), 0) as gastos_mes,
          COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE -monto END), 0) as balance_mes
        FROM (
          SELECT fecha_ingreso as fecha_emision, ingresos as monto, 'ingreso' as tipo 
          FROM income
          WHERE fecha_ingreso >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
            AND company_id = $1
          
          UNION ALL
          
          SELECT fecha_gasto as fecha_emision, monto, 'gasto' as tipo 
          FROM expenses  
          WHERE fecha_gasto >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
            AND company_id = $1
        ) transacciones
        GROUP BY DATE_TRUNC('month', fecha_emision)::date
        ORDER BY mes ASC
      ),
      meses_completos AS (
        SELECT 
          generate_series(
            DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months',
            DATE_TRUNC('month', CURRENT_DATE),
            INTERVAL '1 month'
          )::date as mes
      )
      SELECT 
        mc.mes,
        COALESCE(bm.ingresos_mes, 0) as ingresos,
        COALESCE(bm.gastos_mes, 0) as gastos,
        COALESCE(bm.balance_mes, 0) as balance,
        CASE 
          WHEN mc.mes = DATE_TRUNC('month', CURRENT_DATE) THEN 'Este mes'
          WHEN mc.mes = DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month' THEN 'Mes pasado'
          ELSE TO_CHAR(mc.mes, 'Mon YY')
        END as etiqueta,
        EXTRACT(YEAR FROM mc.mes) as año,
        EXTRACT(MONTH FROM mc.mes) as mes_numero
      FROM meses_completos mc
      LEFT JOIN balance_mensual bm ON mc.mes = bm.mes
      ORDER BY mc.mes ASC
    `;

    const { data, error } = await supabaseAdmin.rpc("exec_sql", {
      sql_query: query,
      params: [companyId],
    });

    if (error) {
      console.error("Error al obtener tendencia:", error);
      throw error;
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error("Error en getTrendData:", error);
    return {
      success: false,
      error: "Error al obtener tendencia",
      details: error.message,
    };
  }
}

// Obtener datos de inventario
async function getInventoryData(companyId) {
  try {
    const query = `
      WITH stock_levels AS (
        SELECT 
          id_producto,
          CASE
            WHEN cantidad_actual <= 0 THEN 'Agotado'
            WHEN cantidad_actual <= ROUND(cantidad_minima * 0.2) THEN 'Crítico'
            WHEN cantidad_actual <= cantidad_minima THEN 'Bajo'
            WHEN cantidad_actual <= ROUND(cantidad_minima * 1.5) THEN 'Adecuado'
            ELSE 'Excedente'
          END as nivel_stock,
          cantidad_actual * precio_unitario as valor_producto
        FROM inventory
        WHERE company_id = $1
      )
      SELECT 
        COUNT(*) as productos_total,
        COUNT(CASE WHEN nivel_stock IN ('Crítico', 'Bajo') THEN 1 END) as productos_bajo_stock,
        COALESCE(SUM(valor_producto), 0) as valor_total,
        COUNT(CASE WHEN nivel_stock = 'Agotado' THEN 1 END) as productos_agotados,
        COUNT(CASE WHEN nivel_stock = 'Crítico' THEN 1 END) as productos_critico,
        COUNT(CASE WHEN nivel_stock = 'Bajo' THEN 1 END) as productos_bajo,
        COUNT(CASE WHEN nivel_stock = 'Adecuado' THEN 1 END) as productos_adecuado,
        COUNT(CASE WHEN nivel_stock = 'Excedente' THEN 1 END) as productos_excedente,
        COALESCE(SUM(CASE WHEN nivel_stock = 'Agotado' THEN valor_producto END), 0) as valor_agotado,
        COALESCE(SUM(CASE WHEN nivel_stock = 'Crítico' THEN valor_producto END), 0) as valor_critico,
        COALESCE(SUM(CASE WHEN nivel_stock = 'Bajo' THEN valor_producto END), 0) as valor_bajo,
        COALESCE(SUM(CASE WHEN nivel_stock = 'Adecuado' THEN valor_producto END), 0) as valor_adecuado,
        COALESCE(SUM(CASE WHEN nivel_stock = 'Excedente' THEN valor_producto END), 0) as valor_excedente
      FROM stock_levels
    `;

    const { data, error } = await supabaseAdmin.rpc("exec_sql", {
      sql_query: query,
      params: [companyId],
    });

    if (error) {
      console.error("Error al obtener inventario:", error);
      throw error;
    }

    return { success: true, data: data[0] || {} };
  } catch (error) {
    console.error("Error en getInventoryData:", error);
    return {
      success: false,
      error: "Error al obtener datos de inventario",
      details: error.message,
    };
  }
}

// Obtener alertas pendientes
async function getAlertsData(companyId) {
  try {
    const { data, error } = await supabaseAdmin
      .from("alerts")
      .select("id_recordatorio, titulo, fecha_recordatorio, prioridad")
      .eq("company_id", companyId)
      .eq("estado", "pendiente")
      .order("prioridad", { ascending: true }) // alta=1, media=2, baja=3
      .order("fecha_recordatorio", { ascending: true })
      .limit(5);

    if (error) {
      console.error("Error al obtener alertas:", error);
      throw error;
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error("Error en getAlertsData:", error);
    return {
      success: false,
      error: "Error al obtener alertas",
      details: error.message,
    };
  }
}

// Obtener datos de pedidos
async function getOrdersData(companyId) {
  try {
    // Pedidos pendientes
    const { data: ordersSummary, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select("estado, total")
      .eq("company_id", companyId)
      .not("estado", "in", "(entregado,cancelado)");

    if (ordersError) {
      console.error("Error al obtener resumen de pedidos:", ordersError);
      throw ordersError;
    }

    // Pedidos recientes
    const { data: recentOrders, error: recentError } = await supabaseAdmin
      .from("orders")
      .select(
        `
        id_pedido,
        fecha_pedido,
        estado,
        total,
        suppliers(nombre_proveedor)
      `
      )
      .eq("company_id", companyId)
      .order("fecha_pedido", { ascending: false })
      .limit(3);

    if (recentError) {
      console.error("Error al obtener pedidos recientes:", recentError);
      throw recentError;
    }

    // Estadísticas por estado
    const estadisticas = {};
    ordersSummary.forEach((order) => {
      if (!estadisticas[order.estado]) {
        estadisticas[order.estado] = { cantidad: 0, total: 0 };
      }
      estadisticas[order.estado].cantidad++;
      estadisticas[order.estado].total += parseFloat(order.total || 0);
    });

    const pendientes = ordersSummary.length;
    const totalPendiente = ordersSummary.reduce(
      (sum, order) => sum + parseFloat(order.total || 0),
      0
    );

    return {
      success: true,
      data: {
        pendientes,
        totalPendiente,
        recientes: recentOrders || [],
        estadisticas,
      },
    };
  } catch (error) {
    console.error("Error en getOrdersData:", error);
    return {
      success: false,
      error: "Error al obtener datos de pedidos",
      details: error.message,
    };
  }
}

// Obtener análisis de márgenes
async function getMarginAnalysis(companyId) {
  try {
    // Esta es una consulta compleja que requiere análisis de ventas
    // Por simplicidad, devolvemos datos básicos
    const mockData = {
      actual: {
        ingresos_totales: 0,
        costos_totales: 0,
        margen_total: 0,
        porcentaje_margen: 0,
      },
      anterior: {
        ingresos_totales: 0,
        costos_totales: 0,
        margen_total: 0,
        porcentaje_margen: 0,
      },
    };

    return { success: true, data: { periodos: mockData } };
  } catch (error) {
    console.error("Error en getMarginAnalysis:", error);
    return {
      success: false,
      error: "Error al obtener análisis de márgenes",
      details: error.message,
    };
  }
}

// Obtener ranking de productos
async function getProductRanking(companyId) {
  try {
    // Consulta simplificada para productos más vendidos
    const mockData = {
      mas_vendidos_unidades: [],
      mas_vendidos_importe: [],
      menos_vendidos_unidades: [],
      menos_vendidos_importe: [],
    };

    return { success: true, data: mockData };
  } catch (error) {
    console.error("Error en getProductRanking:", error);
    return {
      success: false,
      error: "Error al obtener ranking de productos",
      details: error.message,
    };
  }
}

// Obtener análisis de rentabilidad
async function getProfitabilityAnalysis(companyId) {
  try {
    const mockData = {
      mayor_rentabilidad_porcentaje: [],
      mayor_rentabilidad_total: [],
      menor_rentabilidad_porcentaje: [],
      menor_rentabilidad_total: [],
    };

    return { success: true, data: mockData };
  } catch (error) {
    console.error("Error en getProfitabilityAnalysis:", error);
    return {
      success: false,
      error: "Error al obtener análisis de rentabilidad",
      details: error.message,
    };
  }
}

// Obtener balance productos/servicios
async function getProductServiceBalance(companyId) {
  try {
    const mockData = {
      resumen: {
        total_ventas: 0,
        ingresos_totales: 0,
        ingresos_productos: 0,
        ingresos_servicios: 0,
        porcentaje_productos: 0,
        porcentaje_servicios: 0,
      },
      distribucion_diaria: [],
    };

    return { success: true, data: mockData };
  } catch (error) {
    console.error("Error en getProductServiceBalance:", error);
    return {
      success: false,
      error: "Error al obtener balance productos/servicios",
      details: error.message,
    };
  }
}

// Función principal para obtener todos los datos del dashboard
async function getDashboardData(companyId) {
  try {
    // Ejecutar todas las consultas en paralelo
    const [
      financialResult,
      trendResult,
      inventoryResult,
      alertsResult,
      ordersResult,
      marginResult,
      productRankingResult,
      profitabilityResult,
      balanceResult,
    ] = await Promise.all([
      getFinancialData(companyId),
      getTrendData(companyId),
      getInventoryData(companyId),
      getAlertsData(companyId),
      getOrdersData(companyId),
      getMarginAnalysis(companyId),
      getProductRanking(companyId),
      getProfitabilityAnalysis(companyId),
      getProductServiceBalance(companyId),
    ]);

    // Verificar errores
    const results = [
      financialResult,
      trendResult,
      inventoryResult,
      alertsResult,
      ordersResult,
      marginResult,
      productRankingResult,
      profitabilityResult,
      balanceResult,
    ];

    const firstError = results.find((result) => !result.success);
    if (firstError) {
      return firstError;
    }

    // Construir respuesta
    const finanzas = financialResult.data;
    const tendencia = trendResult.data;
    const inventario = inventoryResult.data;
    const alertas = alertsResult.data;
    const pedidos = ordersResult.data;

    return {
      success: true,
      data: {
        finanzas: {
          actual: {
            ingresos: parseFloat(finanzas.ingresos_actual || 0),
            gastos: parseFloat(finanzas.gastos_actual || 0),
            balance: parseFloat(finanzas.balance_actual || 0),
          },
          anterior: {
            ingresos: parseFloat(finanzas.ingresos_anterior || 0),
            gastos: parseFloat(finanzas.gastos_anterior || 0),
            balance: parseFloat(finanzas.balance_anterior || 0),
          },
          anual: {
            ingresos: parseFloat(finanzas.ingresos_anual || 0),
            gastos: parseFloat(finanzas.gastos_anual || 0),
            balance: parseFloat(finanzas.balance_anual || 0),
          },
        },
        tendenciaBalance: tendencia.map((mes) => ({
          mes: mes.mes,
          ingresos: parseFloat(mes.ingresos || 0),
          gastos: parseFloat(mes.gastos || 0),
          balance: parseFloat(mes.balance || 0),
          etiqueta: mes.etiqueta,
          año: parseInt(mes.año || 0),
          mesNumero: parseInt(mes.mes_numero || 0),
        })),
        inventario: {
          productosTotal: parseInt(inventario.productos_total || 0),
          productosBajoStock: parseInt(inventario.productos_bajo_stock || 0),
          valorTotal: parseFloat(inventario.valor_total || 0),
          categorias: {
            agotados: parseInt(inventario.productos_agotados || 0),
            critico: parseInt(inventario.productos_critico || 0),
            bajo: parseInt(inventario.productos_bajo || 0),
            adecuado: parseInt(inventario.productos_adecuado || 0),
            excedente: parseInt(inventario.productos_excedente || 0),
            valores: {
              agotado: parseFloat(inventario.valor_agotado || 0),
              critico: parseFloat(inventario.valor_critico || 0),
              bajo: parseFloat(inventario.valor_bajo || 0),
              adecuado: parseFloat(inventario.valor_adecuado || 0),
              excedente: parseFloat(inventario.valor_excedente || 0),
            },
          },
        },
        alertas: {
          pendientes: alertas.length,
          proximas: alertas,
        },
        pedidos: {
          pendientes: pedidos.pendientes,
          totalPendiente: pedidos.totalPendiente,
          recientes: pedidos.recientes,
          estadisticas: {
            porEstado: pedidos.estadisticas,
          },
        },
        margenBruto: marginResult.data.periodos,
        productosRanking: productRankingResult.data,
        rentabilidad: profitabilityResult.data,
        balanceProductosServicios: balanceResult.data,
      },
    };
  } catch (error) {
    console.error("Error en getDashboardData:", error);
    return {
      success: false,
      error: "Error al obtener datos del dashboard",
      details: error.message,
    };
  }
}

// Exportar funciones para uso en EdgeFunction
export {
  getDashboardData,
  getFinancialData,
  getTrendData,
  getInventoryData,
  getAlertsData,
  getOrdersData,
  getMarginAnalysis,
  getProductRanking,
  getProfitabilityAnalysis,
  getProductServiceBalance,
  extractCompanyId,
};
