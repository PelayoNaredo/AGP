import pool from "../db.js";

export const getDashboardData = async (req, res) => {
  try {
    // Obtener datos financieros comparativos
    const financialQuery = `
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
      FROM ingresos_por_periodo i, gastos_por_periodo g;
    `;

    // Obtener datos de inventario
    const inventoryQuery = `
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
    FROM stock_levels;
  `;

    // Obtener alertas pendientes
    const alertsQuery = `
            SELECT id_recordatorio, titulo, fecha_recordatorio, prioridad
            FROM alerts
            WHERE estado = 'pendiente'
            ORDER BY 
                CASE prioridad 
                    WHEN 'alta' THEN 1
                    WHEN 'media' THEN 2
                    WHEN 'baja' THEN 3
                END,
                fecha_recordatorio ASC
            LIMIT 5;
        `;

    // Obtener pedidos
    const ordersQuery = `
    SELECT 
        COUNT(*) FILTER (WHERE estado NOT IN ('entregado', 'cancelado')) as pendientes,
        COALESCE(SUM(total) FILTER (WHERE estado NOT IN ('entregado', 'cancelado')), 0) as total_pendiente
    FROM orders;
`;

    const recentOrdersQuery = `
    SELECT 
        o.id_pedido,
        o.fecha_pedido,
        o.estado,
        o.total,
        s.nombre_proveedor as proveedor
    FROM orders o
    JOIN suppliers s ON o.id_proveedor = s.id_proveedor
    ORDER BY o.fecha_pedido DESC
    LIMIT 3;
`;
    const ordersStatsQuery = `
    SELECT 
        estado,
        COUNT(*) as cantidad,
        COALESCE(SUM(total), 0) as total
    FROM orders
    WHERE estado NOT IN ('entregado', 'cancelado')
      AND fecha_pedido >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY estado;
`;

    // Margen bruto
    const marginQuery = `
      WITH periodos AS (
        SELECT 
          CURRENT_DATE - INTERVAL '30 days' as inicio_actual,
          CURRENT_DATE as fin_actual,
          CURRENT_DATE - INTERVAL '60 days' as inicio_anterior,
          CURRENT_DATE - INTERVAL '30 days' as fin_anterior
      ),
      ventas_productos AS (
        SELECT 
          s.id_venta,
          s.fecha_emision,
          s.subtotal as venta_subtotal,
          s.total as venta_total,
          COALESCE(SUM(sp.cantidad * i.precio_unitario), 0) as costo_productos,
          COALESCE(SUM(sp.subtotal), 0) as ingresos_productos
        FROM sales s
        LEFT JOIN sale_products sp ON s.id_venta = sp.id_venta
        LEFT JOIN inventory i ON sp.id_producto = i.id_producto
        WHERE s.estado NOT IN ('cancelado', 'devuelto')
        GROUP BY s.id_venta, s.fecha_emision, s.subtotal, s.total
      ),
      ventas_servicios AS (
        SELECT 
          s.id_venta,
          COALESCE(SUM(ss.subtotal), 0) as ingresos_servicios,
          -- Estimamos un costo estándar para servicios (40% del precio)
          COALESCE(SUM(ss.subtotal * 0.4), 0) as costo_servicios
        FROM sales s
        LEFT JOIN sale_services ss ON s.id_venta = ss.id_venta
        WHERE s.estado NOT IN ('cancelado', 'devuelto')
        GROUP BY s.id_venta
      ),
      margenes_por_venta AS (
        SELECT 
          vp.id_venta,
          vp.fecha_emision,
          vp.ingresos_productos,
          vs.ingresos_servicios,
          vp.costo_productos,
          vs.costo_servicios,
          (vp.ingresos_productos - vp.costo_productos) as margen_productos,
          (vs.ingresos_servicios - vs.costo_servicios) as margen_servicios,
          (vp.ingresos_productos + vs.ingresos_servicios) as ingresos_totales,
          (vp.costo_productos + vs.costo_servicios) as costos_totales,
          ((vp.ingresos_productos + vs.ingresos_servicios) - (vp.costo_productos + vs.costo_servicios)) as margen_total,
          CASE 
            WHEN (vp.ingresos_productos + vs.ingresos_servicios) > 0 
            THEN ROUND((((vp.ingresos_productos + vs.ingresos_servicios) - (vp.costo_productos + vs.costo_servicios)) / 
                  (vp.ingresos_productos + vs.ingresos_servicios) * 100), 2)
            ELSE 0
          END as porcentaje_margen
        FROM ventas_productos vp
        JOIN ventas_servicios vs ON vp.id_venta = vs.id_venta
      ),
      resumen_por_periodo AS (
        SELECT
          'actual' as periodo,
          COALESCE(SUM(ingresos_totales), 0) as ingresos_totales,
          COALESCE(SUM(costos_totales), 0) as costos_totales,
          COALESCE(SUM(margen_total), 0) as margen_total,
          COALESCE(SUM(ingresos_productos), 0) as ingresos_productos,
          COALESCE(SUM(ingresos_servicios), 0) as ingresos_servicios,
          COALESCE(SUM(margen_productos), 0) as margen_productos,
          COALESCE(SUM(margen_servicios), 0) as margen_servicios,
          CASE 
            WHEN SUM(ingresos_totales) > 0 
            THEN ROUND((SUM(margen_total) / SUM(ingresos_totales) * 100), 2)
            ELSE 0
          END as porcentaje_margen
        FROM margenes_por_venta, periodos
        WHERE fecha_emision BETWEEN inicio_actual AND fin_actual
        
        UNION ALL
        
        SELECT
          'anterior' as periodo,
          COALESCE(SUM(ingresos_totales), 0) as ingresos_totales,
          COALESCE(SUM(costos_totales), 0) as costos_totales,
          COALESCE(SUM(margen_total), 0) as margen_total,
          COALESCE(SUM(ingresos_productos), 0) as ingresos_productos,
          COALESCE(SUM(ingresos_servicios), 0) as ingresos_servicios,
          COALESCE(SUM(margen_productos), 0) as margen_productos,
          COALESCE(SUM(margen_servicios), 0) as margen_servicios,
          CASE 
            WHEN SUM(ingresos_totales) > 0 
            THEN ROUND((SUM(margen_total) / SUM(ingresos_totales) * 100), 2)
            ELSE 0
          END as porcentaje_margen
        FROM margenes_por_venta, periodos
        WHERE fecha_emision BETWEEN inicio_anterior AND fin_anterior      )
      SELECT 
        jsonb_object_agg(periodo, to_jsonb(t)) as periodos
      FROM resumen_por_periodo t;
    `;

    // Productos más y menos vendidos
    const topProductsQuery = `
      WITH ventas_productos AS (
        SELECT 
          sp.id_producto,
          i.nombre_producto,
          SUM(sp.cantidad) as unidades_vendidas,
          SUM(sp.subtotal) as importe_total,
          COUNT(DISTINCT sp.id_venta) as num_ventas
        FROM sale_products sp
        JOIN inventory i ON sp.id_producto = i.id_producto
        JOIN sales s ON sp.id_venta = s.id_venta
        WHERE s.estado NOT IN ('cancelado', 'devuelto')
          AND s.fecha_emision >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY sp.id_producto, i.nombre_producto
      ),
      rankings AS (
        SELECT
          id_producto,
          nombre_producto,
          unidades_vendidas,
          importe_total,
          num_ventas,
          RANK() OVER (ORDER BY unidades_vendidas DESC) as rank_por_unidades,
          RANK() OVER (ORDER BY importe_total DESC) as rank_por_importe
        FROM ventas_productos
      )
      SELECT 
        json_build_object(
          'mas_vendidos_unidades',
          (SELECT json_agg(json_build_object(
            'id_producto', id_producto,
            'nombre_producto', nombre_producto,
            'unidades_vendidas', unidades_vendidas,
            'importe_total', importe_total,
            'num_ventas', num_ventas
          ) ORDER BY unidades_vendidas DESC)
          FROM rankings
          WHERE rank_por_unidades <= 5),
          
          'mas_vendidos_importe',
          (SELECT json_agg(json_build_object(
            'id_producto', id_producto,
            'nombre_producto', nombre_producto,
            'unidades_vendidas', unidades_vendidas,
            'importe_total', importe_total,
            'num_ventas', num_ventas
          ) ORDER BY importe_total DESC)
          FROM rankings
          WHERE rank_por_importe <= 5),
          
          'menos_vendidos_unidades',
          (SELECT json_agg(json_build_object(
            'id_producto', id_producto,
            'nombre_producto', nombre_producto,
            'unidades_vendidas', unidades_vendidas,
            'importe_total', importe_total,
            'num_ventas', num_ventas
          ) ORDER BY unidades_vendidas ASC)
          FROM rankings
          WHERE rank_por_unidades > (SELECT COUNT(*) - 5 FROM rankings WHERE unidades_vendidas > 0)),
          
          'menos_vendidos_importe',
          (SELECT json_agg(json_build_object(
            'id_producto', id_producto,
            'nombre_producto', nombre_producto,
            'unidades_vendidas', unidades_vendidas,
            'importe_total', importe_total,
            'num_ventas', num_ventas
          ) ORDER BY importe_total ASC)
          FROM rankings
          WHERE rank_por_importe > (SELECT COUNT(*) - 5 FROM rankings WHERE importe_total > 0))
        ) as productos_ranking;
    `;

    // Productos con mayor y menor rentabilidad
    const profitabilityQuery = `
      WITH rentabilidad_productos AS (
        SELECT 
          i.id_producto,
          i.nombre_producto,
          i.precio_unitario as costo_compra,
          i.pvp as precio_venta,
          COALESCE(AVG(sp.precio_unitario), 0) as precio_venta_real,
          COUNT(sp.id_detalle_producto) as num_ventas,
          SUM(sp.cantidad) as unidades_vendidas,
          CASE 
            WHEN i.precio_unitario > 0 AND i.pvp > 0
            THEN ROUND(((i.pvp - i.precio_unitario) / i.precio_unitario * 100), 2)
            ELSE 0
          END as porcentaje_margen_teorico,
          CASE 
            WHEN i.precio_unitario > 0 AND AVG(sp.precio_unitario) > 0
            THEN ROUND(((AVG(sp.precio_unitario) - i.precio_unitario) / i.precio_unitario * 100), 2)
            ELSE 0
          END as porcentaje_margen_real,
          COALESCE(i.pvp - i.precio_unitario, 0) as margen_unitario_teorico,
          COALESCE(AVG(sp.precio_unitario) - i.precio_unitario, 0) as margen_unitario_real,
          COALESCE(SUM(sp.subtotal), 0) as ingresos_totales,
          COALESCE(SUM(sp.cantidad * i.precio_unitario), 0) as costos_totales,
          COALESCE(SUM(sp.subtotal) - SUM(sp.cantidad * i.precio_unitario), 0) as margen_total
        FROM inventory i
        LEFT JOIN sale_products sp ON i.id_producto = sp.id_producto
        LEFT JOIN sales s ON sp.id_venta = s.id_venta AND s.estado NOT IN ('cancelado', 'devuelto')
          AND s.fecha_emision >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY i.id_producto, i.nombre_producto, i.precio_unitario, i.pvp
      ),
      rankings AS (
        SELECT 
          *,
          RANK() OVER (ORDER BY porcentaje_margen_teorico DESC NULLS LAST) as rank_por_margen_teorico,
          RANK() OVER (ORDER BY margen_total DESC NULLS LAST) as rank_por_margen_total
        FROM rentabilidad_productos
        WHERE num_ventas > 0  -- Solo considerar productos que han sido vendidos
      )      SELECT 
        json_build_object(          'mayor_rentabilidad_porcentaje',
          (SELECT json_agg(json_build_object(
            'id_producto', id_producto,
            'nombre_producto', nombre_producto,
            'costo_compra', costo_compra,
            'precio_venta', precio_venta,
            'precio_venta_real', precio_venta_real,
            'porcentaje_margen_teorico', porcentaje_margen_teorico,
            'porcentaje_margen_real', porcentaje_margen_real,
            'margen_unitario_teorico', margen_unitario_teorico,
            'margen_unitario_real', margen_unitario_real,
            'unidades_vendidas', unidades_vendidas,
            'ingresos_totales', ingresos_totales,
            'costos_totales', costos_totales,
            'margen_total', margen_total
          ))
          FROM (SELECT * FROM rankings ORDER BY porcentaje_margen_teorico DESC NULLS LAST LIMIT 5) r),            'mayor_rentabilidad_total',
          (SELECT json_agg(json_build_object(
            'id_producto', id_producto,
            'nombre_producto', nombre_producto,
            'costo_compra', costo_compra,
            'precio_venta', precio_venta,
            'precio_venta_real', precio_venta_real,
            'porcentaje_margen_teorico', porcentaje_margen_teorico,
            'porcentaje_margen_real', porcentaje_margen_real,
            'margen_unitario_teorico', margen_unitario_teorico,
            'margen_unitario_real', margen_unitario_real,
            'unidades_vendidas', unidades_vendidas,
            'ingresos_totales', ingresos_totales,
            'costos_totales', costos_totales,
            'margen_total', margen_total
          ))
          FROM (SELECT * FROM rankings ORDER BY margen_total DESC NULLS LAST LIMIT 5) r),            'menor_rentabilidad_porcentaje',
          (SELECT json_agg(json_build_object(
            'id_producto', id_producto,
            'nombre_producto', nombre_producto,
            'costo_compra', costo_compra,
            'precio_venta', precio_venta,
            'precio_venta_real', precio_venta_real,
            'porcentaje_margen_teorico', porcentaje_margen_teorico,
            'porcentaje_margen_real', porcentaje_margen_real,
            'margen_unitario_teorico', margen_unitario_teorico,
            'margen_unitario_real', margen_unitario_real,
            'unidades_vendidas', unidades_vendidas,
            'ingresos_totales', ingresos_totales,
            'costos_totales', costos_totales,
            'margen_total', margen_total
          ))
          FROM (SELECT * FROM rankings WHERE num_ventas > 0 ORDER BY porcentaje_margen_teorico ASC NULLS LAST LIMIT 5) r),            'menor_rentabilidad_total',
          (SELECT json_agg(json_build_object(
            'id_producto', id_producto,
            'nombre_producto', nombre_producto,
            'costo_compra', costo_compra,
            'precio_venta', precio_venta,
            'precio_venta_real', precio_venta_real,
            'porcentaje_margen_teorico', porcentaje_margen_teorico,
            'porcentaje_margen_real', porcentaje_margen_real,
            'margen_unitario_teorico', margen_unitario_teorico,
            'margen_unitario_real', margen_unitario_real,
            'unidades_vendidas', unidades_vendidas,
            'ingresos_totales', ingresos_totales,
            'costos_totales', costos_totales,
            'margen_total', margen_total
          ))
          FROM (SELECT * FROM rankings WHERE num_ventas > 0 ORDER BY margen_total ASC NULLS LAST LIMIT 5) r)
        ) as rentabilidad;
    `;

    // Balance entre productos y servicios
    const productServiceBalanceQuery = `
      WITH ventas_periodo AS (
        SELECT 
          s.id_venta,
          s.fecha_emision,
          s.total,
          COALESCE(SUM(sp.subtotal), 0) as total_productos,
          COALESCE(SUM(ss.subtotal), 0) as total_servicios
        FROM sales s
        LEFT JOIN sale_products sp ON s.id_venta = sp.id_venta
        LEFT JOIN sale_services ss ON s.id_venta = ss.id_venta
        WHERE s.estado NOT IN ('cancelado', 'devuelto')
          AND s.fecha_emision >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY s.id_venta, s.fecha_emision, s.total
      ),
      resumen_balance AS (
        SELECT
          COUNT(id_venta) as total_ventas,
          SUM(total) as ingresos_totales,
          SUM(total_productos) as ingresos_productos,
          SUM(total_servicios) as ingresos_servicios,
          CASE 
            WHEN SUM(total) > 0 
            THEN ROUND((SUM(total_productos) / SUM(total) * 100), 2)
            ELSE 0
          END as porcentaje_productos,
          CASE 
            WHEN SUM(total) > 0 
            THEN ROUND((SUM(total_servicios) / SUM(total) * 100), 2)
            ELSE 0
          END as porcentaje_servicios,
          COUNT(CASE WHEN total_productos > 0 AND total_servicios = 0 THEN 1 END) as solo_productos,
          COUNT(CASE WHEN total_productos = 0 AND total_servicios > 0 THEN 1 END) as solo_servicios,
          COUNT(CASE WHEN total_productos > 0 AND total_servicios > 0 THEN 1 END) as productos_y_servicios
        FROM ventas_periodo
      ),
      distribucion_diaria AS (
        SELECT
          DATE_TRUNC('day', fecha_emision)::date as fecha,
          SUM(total) as total_diario,
          SUM(total_productos) as productos_diario,
          SUM(total_servicios) as servicios_diario
        FROM ventas_periodo
        GROUP BY DATE_TRUNC('day', fecha_emision)::date
        ORDER BY fecha
      )
      SELECT 
        json_build_object(
          'resumen', (SELECT row_to_json(rb) FROM resumen_balance rb),
          'distribucion_diaria', (SELECT json_agg(row_to_json(dd)) FROM distribucion_diaria dd)
        ) as balance;
    `;

    // Ejecutar todas las consultas en paralelo
    const [
      {
        rows: [finanzas],
      },
      {
        rows: [inventario],
      },
      { rows: alertas },
      {
        rows: [{ pendientes, total_pendiente }],
      },
      { rows: pedidosRecientes },
      { rows: estadisticas },
      {
        rows: [margenBruto],
      },
      {
        rows: [topProductos],
      },
      {
        rows: [rentabilidadProductos],
      },
      {
        rows: [balanceProductosServicios],
      },
    ] = await Promise.all([
      pool.query(financialQuery),
      pool.query(inventoryQuery),
      pool.query(alertsQuery),
      pool.query(ordersQuery),
      pool.query(recentOrdersQuery),
      pool.query(ordersStatsQuery),
      pool.query(marginQuery),
      pool.query(topProductsQuery),
      pool.query(profitabilityQuery),
      pool.query(productServiceBalanceQuery),
    ]);

    res.json({
      finanzas: {
        actual: {
          ingresos: parseFloat(finanzas.ingresos_actual),
          gastos: parseFloat(finanzas.gastos_actual),
          balance: parseFloat(finanzas.balance_actual),
        },
        anterior: {
          ingresos: parseFloat(finanzas.ingresos_anterior),
          gastos: parseFloat(finanzas.gastos_anterior),
          balance: parseFloat(finanzas.balance_anterior),
        },
        anual: {
          ingresos: parseFloat(finanzas.ingresos_anual),
          gastos: parseFloat(finanzas.gastos_anual),
          balance: parseFloat(finanzas.balance_anual),
        },
      },
      inventario: {
        productosTotal: parseInt(inventario.productos_total),
        productosBajoStock: parseInt(inventario.productos_bajo_stock),
        valorTotal: parseFloat(inventario.valor_total),
        categorias: {
          agotados: parseInt(inventario.productos_agotados),
          critico: parseInt(inventario.productos_critico),
          bajo: parseInt(inventario.productos_bajo),
          adecuado: parseInt(inventario.productos_adecuado),
          excedente: parseInt(inventario.productos_excedente),
          valores: {
            agotado: parseFloat(inventario.valor_agotado),
            critico: parseFloat(inventario.valor_critico),
            bajo: parseFloat(inventario.valor_bajo),
            adecuado: parseFloat(inventario.valor_adecuado),
            excedente: parseFloat(inventario.valor_excedente),
          },
        },
      },
      alertas: {
        pendientes: alertas.length,
        proximas: alertas,
      },
      pedidos: {
        pendientes: parseInt(pendientes),
        totalPendiente: parseFloat(total_pendiente),
        recientes: pedidosRecientes,
        estadisticas: {
          porEstado: estadisticas,
        },
      },
      margenBruto: margenBruto.periodos,
      productosRanking: topProductos.productos_ranking,
      rentabilidad: rentabilidadProductos.rentabilidad,
      balanceProductosServicios: balanceProductosServicios.balance,
    });
  } catch (error) {
    console.error("Error al obtener datos del dashboard:", error);
    res.status(500).json({ message: "Error al obtener datos del dashboard" });
  }
};
