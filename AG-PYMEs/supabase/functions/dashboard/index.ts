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

// Función para obtener datos financieros comparativos
async function getFinancialData(companyId: number) {
  try {
    // Consulta para datos financieros con períodos comparativos
    const { data, error } = await supabaseAdmin.rpc("get_financial_summary", {
      p_company_id: companyId,
      p_days_current: 30,
      p_days_previous: 30,
    });

    if (error) {
      console.error("Error al obtener datos financieros:", error);

      // Fallback: datos básicos simulados
      return {
        ingresos_actual: 0,
        ingresos_anterior: 0,
        ingresos_anual: 0,
        gastos_actual: 0,
        gastos_anterior: 0,
        gastos_anual: 0,
        balance_actual: 0,
        balance_anterior: 0,
        balance_anual: 0,
      };
    }

    return data[0] || {};
  } catch (error) {
    console.error("Error en getFinancialData:", error);
    throw error;
  }
}

// Función para obtener tendencia temporal (últimos 6 meses)
async function getTrendData(companyId: number) {
  try {
    // Generar fechas de los últimos 6 meses
    const meses = [];
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date();
      fecha.setMonth(fecha.getMonth() - i);
      fecha.setDate(1); // Primer día del mes

      const mesStr = fecha.toISOString().slice(0, 7) + "-01"; // YYYY-MM-01

      meses.push({
        mes: mesStr,
        ingresos: Math.random() * 10000, // Datos simulados
        gastos: Math.random() * 8000,
        balance: 0,
        etiqueta:
          i === 0
            ? "Este mes"
            : i === 1
              ? "Mes pasado"
              : fecha.toLocaleDateString("es-ES", {
                  month: "short",
                  year: "2-digit",
                }),
        año: fecha.getFullYear(),
        mes_numero: fecha.getMonth() + 1,
      });
    }

    // Calcular balance
    meses.forEach((mes) => {
      mes.balance = mes.ingresos - mes.gastos;
    });

    return meses;
  } catch (error) {
    console.error("Error en getTrendData:", error);
    throw error;
  }
}

// Función para obtener datos de inventario
async function getInventoryData(companyId: number) {
  try {
    const { data: productos, error } = await supabaseAdmin
      .from("inventory")
      .select("cantidad_actual, cantidad_minima, precio_unitario")
      .eq("company_id", companyId);

    if (error) {
      console.error("Error al obtener inventario:", error);
      throw error;
    }

    // Calcular estadísticas de stock
    const stats = {
      productos_total: productos.length,
      productos_bajo_stock: 0,
      valor_total: 0,
      productos_agotados: 0,
      productos_critico: 0,
      productos_bajo: 0,
      productos_adecuado: 0,
      productos_excedente: 0,
      valor_agotado: 0,
      valor_critico: 0,
      valor_bajo: 0,
      valor_adecuado: 0,
      valor_excedente: 0,
    };

    productos.forEach((producto) => {
      const valor =
        (producto.cantidad_actual || 0) * (producto.precio_unitario || 0);
      stats.valor_total += valor;

      let categoria = "Adecuado";
      if ((producto.cantidad_actual || 0) <= 0) {
        categoria = "Agotado";
        stats.productos_agotados++;
        stats.valor_agotado += valor;
      } else if (
        (producto.cantidad_actual || 0) <=
        (producto.cantidad_minima || 0) * 0.2
      ) {
        categoria = "Crítico";
        stats.productos_critico++;
        stats.valor_critico += valor;
      } else if (
        (producto.cantidad_actual || 0) <= (producto.cantidad_minima || 0)
      ) {
        categoria = "Bajo";
        stats.productos_bajo++;
        stats.valor_bajo += valor;
      } else if (
        (producto.cantidad_actual || 0) <=
        (producto.cantidad_minima || 0) * 1.5
      ) {
        categoria = "Adecuado";
        stats.productos_adecuado++;
        stats.valor_adecuado += valor;
      } else {
        categoria = "Excedente";
        stats.productos_excedente++;
        stats.valor_excedente += valor;
      }

      if (categoria === "Crítico" || categoria === "Bajo") {
        stats.productos_bajo_stock++;
      }
    });

    return stats;
  } catch (error) {
    console.error("Error en getInventoryData:", error);
    throw error;
  }
}

// Función para obtener alertas pendientes
async function getAlertsData(companyId: number) {
  try {
    const { data, error } = await supabaseAdmin
      .from("alerts")
      .select("id_recordatorio, titulo, fecha_recordatorio, prioridad")
      .eq("company_id", companyId)
      .eq("estado", "pendiente")
      .order("fecha_recordatorio", { ascending: true })
      .limit(5);

    if (error) {
      console.error("Error al obtener alertas:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error en getAlertsData:", error);
    throw error;
  }
}

// Función para obtener datos de pedidos
async function getOrdersData(companyId: number) {
  try {
    // Obtener pedidos no finalizados
    const { data: pedidos, error: pedidosError } = await supabaseAdmin
      .from("orders")
      .select("estado, total")
      .eq("company_id", companyId)
      .not("estado", "in", "(entregado,cancelado)");

    if (pedidosError) {
      console.error("Error al obtener pedidos:", pedidosError);
      throw pedidosError;
    }

    // Obtener pedidos recientes con información del proveedor
    const { data: recientes, error: recientesError } = await supabaseAdmin
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

    if (recientesError) {
      console.error("Error al obtener pedidos recientes:", recientesError);
      throw recientesError;
    }

    // Calcular estadísticas
    const estadisticas: Record<string, { cantidad: number; total: number }> =
      {};
    let totalPendiente = 0;

    (pedidos || []).forEach((pedido) => {
      const estado = pedido.estado || "pendiente";
      const total = parseFloat(pedido.total || "0");

      if (!estadisticas[estado]) {
        estadisticas[estado] = { cantidad: 0, total: 0 };
      }

      estadisticas[estado].cantidad++;
      estadisticas[estado].total += total;
      totalPendiente += total;
    });

    return {
      pendientes: (pedidos || []).length,
      totalPendiente,
      recientes: recientes || [],
      estadisticas,
    };
  } catch (error) {
    console.error("Error en getOrdersData:", error);
    throw error;
  }
}

serve(async (req) => {
  // Configurar CORS
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
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

    // GET /dashboard - Obtener todos los datos del dashboard
    if (method === "GET" && pathSegments.length === 1) {
      try {
        // Ejecutar todas las consultas en paralelo
        const [
          financialData,
          trendData,
          inventoryData,
          alertsData,
          ordersData,
        ] = await Promise.all([
          getFinancialData(companyId),
          getTrendData(companyId),
          getInventoryData(companyId),
          getAlertsData(companyId),
          getOrdersData(companyId),
        ]);

        // Construir respuesta completa
        const dashboardData = {
          finanzas: {
            actual: {
              ingresos: parseFloat(financialData.ingresos_actual || "0"),
              gastos: parseFloat(financialData.gastos_actual || "0"),
              balance: parseFloat(financialData.balance_actual || "0"),
            },
            anterior: {
              ingresos: parseFloat(financialData.ingresos_anterior || "0"),
              gastos: parseFloat(financialData.gastos_anterior || "0"),
              balance: parseFloat(financialData.balance_anterior || "0"),
            },
            anual: {
              ingresos: parseFloat(financialData.ingresos_anual || "0"),
              gastos: parseFloat(financialData.gastos_anual || "0"),
              balance: parseFloat(financialData.balance_anual || "0"),
            },
          },
          tendenciaBalance: trendData.map((mes: any) => ({
            mes: mes.mes,
            ingresos: parseFloat(mes.ingresos || "0"),
            gastos: parseFloat(mes.gastos || "0"),
            balance: parseFloat(mes.balance || "0"),
            etiqueta: mes.etiqueta,
            año: parseInt(mes.año || "0"),
            mesNumero: parseInt(mes.mes_numero || "0"),
          })),
          inventario: {
            productosTotal: inventoryData.productos_total,
            productosBajoStock: inventoryData.productos_bajo_stock,
            valorTotal: inventoryData.valor_total,
            categorias: {
              agotados: inventoryData.productos_agotados,
              critico: inventoryData.productos_critico,
              bajo: inventoryData.productos_bajo,
              adecuado: inventoryData.productos_adecuado,
              excedente: inventoryData.productos_excedente,
              valores: {
                agotado: inventoryData.valor_agotado,
                critico: inventoryData.valor_critico,
                bajo: inventoryData.valor_bajo,
                adecuado: inventoryData.valor_adecuado,
                excedente: inventoryData.valor_excedente,
              },
            },
          },
          alertas: {
            pendientes: alertsData.length,
            proximas: alertsData,
          },
          pedidos: {
            pendientes: ordersData.pendientes,
            totalPendiente: ordersData.totalPendiente,
            recientes: ordersData.recientes,
            estadisticas: {
              porEstado: ordersData.estadisticas,
            },
          },
          // Datos adicionales con valores por defecto
          margenBruto: {
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
          },
          productosRanking: {
            mas_vendidos_unidades: [],
            mas_vendidos_importe: [],
            menos_vendidos_unidades: [],
            menos_vendidos_importe: [],
          },
          rentabilidad: {
            mayor_rentabilidad_porcentaje: [],
            mayor_rentabilidad_total: [],
            menor_rentabilidad_porcentaje: [],
            menor_rentabilidad_total: [],
          },
          balanceProductosServicios: {
            resumen: {
              total_ventas: 0,
              ingresos_totales: 0,
              ingresos_productos: 0,
              ingresos_servicios: 0,
              porcentaje_productos: 0,
              porcentaje_servicios: 0,
            },
            distribucion_diaria: [],
          },
        };

        return new Response(JSON.stringify(dashboardData), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error al obtener datos del dashboard:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener datos del dashboard",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // GET /dashboard/financial - Obtener solo datos financieros
    if (
      method === "GET" &&
      pathSegments.length === 2 &&
      pathSegments[1] === "financial"
    ) {
      try {
        const financialData = await getFinancialData(companyId);

        return new Response(
          JSON.stringify({
            actual: {
              ingresos: parseFloat(financialData.ingresos_actual || "0"),
              gastos: parseFloat(financialData.gastos_actual || "0"),
              balance: parseFloat(financialData.balance_actual || "0"),
            },
            anterior: {
              ingresos: parseFloat(financialData.ingresos_anterior || "0"),
              gastos: parseFloat(financialData.gastos_anterior || "0"),
              balance: parseFloat(financialData.balance_anterior || "0"),
            },
            anual: {
              ingresos: parseFloat(financialData.ingresos_anual || "0"),
              gastos: parseFloat(financialData.gastos_anual || "0"),
              balance: parseFloat(financialData.balance_anual || "0"),
            },
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Error al obtener datos financieros:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener datos financieros",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // GET /dashboard/trend - Obtener tendencia temporal
    if (
      method === "GET" &&
      pathSegments.length === 2 &&
      pathSegments[1] === "trend"
    ) {
      try {
        const trendData = await getTrendData(companyId);

        return new Response(JSON.stringify(trendData), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error al obtener tendencia:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener tendencia",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // GET /dashboard/inventory - Obtener datos de inventario
    if (
      method === "GET" &&
      pathSegments.length === 2 &&
      pathSegments[1] === "inventory"
    ) {
      try {
        const inventoryData = await getInventoryData(companyId);

        return new Response(JSON.stringify(inventoryData), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error al obtener inventario:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener datos de inventario",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // GET /dashboard/alerts - Obtener alertas pendientes
    if (
      method === "GET" &&
      pathSegments.length === 2 &&
      pathSegments[1] === "alerts"
    ) {
      try {
        const alertsData = await getAlertsData(companyId);

        return new Response(
          JSON.stringify({
            pendientes: alertsData.length,
            proximas: alertsData,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Error al obtener alertas:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener alertas",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // GET /dashboard/orders - Obtener datos de pedidos
    if (
      method === "GET" &&
      pathSegments.length === 2 &&
      pathSegments[1] === "orders"
    ) {
      try {
        const ordersData = await getOrdersData(companyId);

        return new Response(JSON.stringify(ordersData), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error al obtener pedidos:", error);
        return new Response(
          JSON.stringify({
            error: "Error al obtener datos de pedidos",
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
