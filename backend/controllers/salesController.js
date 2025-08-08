import pool from "../db.js";

// Obtener todas las ventas (filtradas automáticamente por RLS)
export const getAllSales = async (req, res) => {
  try {
    // ← CAMBIO: RLS filtra automáticamente tanto sales como clients por company_id
    const result = await pool.query(`
      SELECT s.*, 
             c.nombre as nombre_cliente, c.apellido as apellido_cliente,
             c.tipo_cliente, c.tipo_documento, c.documento, c.razon_social
      FROM sales s
      LEFT JOIN clients c ON s.id_cliente = c.id_cliente
      ORDER BY s.fecha_emision DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener ventas:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Obtener venta por ID con detalles (RLS automático)
export const getSaleById = async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  const client = await pool.connect();

  try {
    // ← CAMBIO: RLS garantiza que solo se vean ventas y clientes de la empresa actual
    // Obtener información de la venta con campos fiscales
    const saleQuery = await client.query(
      `
      SELECT s.*, 
             c.nombre as nombre_cliente, c.apellido as apellido_cliente,
             c.tipo_cliente, c.tipo_documento, c.documento, 
             c.direccion, c.codigo_postal, c.ciudad, c.provincia, c.pais,
             c.email, c.telefono, c.razon_social, c.regimen_fiscal,
             c.tipo_iva as cliente_tipo_iva
      FROM sales s
      LEFT JOIN clients c ON s.id_cliente = c.id_cliente
      WHERE s.id_venta = $1
    `,
      [id]
    );

    if (saleQuery.rows.length === 0) {
      return res.status(404).json({ message: "Venta no encontrada" });
    }

    const sale = saleQuery.rows[0];

    // Obtener productos incluidos en la venta
    const productsQuery = await client.query(
      `
      SELECT sp.*, i.nombre_producto, i.descripcion
      FROM sale_products sp
      JOIN inventory i ON sp.id_producto = i.id_producto
      WHERE sp.id_venta = $1
    `,
      [id]
    );

    // Obtener servicios incluidos en la venta
    const servicesQuery = await client.query(
      `
      SELECT ss.*, s.nombre_servicio, s.descripcion,
             e.nombre as nombre_empleado,
             sl.nombre_nivel
      FROM sale_services ss
      JOIN services s ON ss.id_servicio = s.id_servicio
      LEFT JOIN employees e ON ss.id_empleado = e.id_empleado
      LEFT JOIN service_levels sl ON ss.id_nivel_servicio = sl.id_nivel
      WHERE ss.id_venta = $1
    `,
      [id]
    );

    // Construir respuesta completa
    const response = {
      ...sale,
      productos: productsQuery.rows,
      servicios: servicesQuery.rows,
    };

    res.json(response);
  } catch (error) {
    console.error("Error al obtener detalles de venta:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  } finally {
    client.release();
  }
};

// Crear una nueva venta con sus detalles
export const createSale = async (req, res) => {
  const {
    numero_documento,
    tipo_documento,
    id_cliente,
    id_empleado_vendedor,
    tipo_iva,
    porcentaje_iva,
    porcentaje_retencion,
    subtotal,
    descuento,
    impuestos,
    total,
    metodo_pago,
    estado,
    notas,
    productos,
    servicios,
  } = req.body;

  // Validar campos obligatorios
  if (
    !numero_documento ||
    !tipo_documento ||
    subtotal === undefined ||
    total === undefined
  ) {
    return res.status(400).json({
      message: "Faltan campos obligatorios para la venta",
    });
  }

  // Normalizar valores numéricos y asegurarse de que sean números
  const subtotalNum = parseFloat(subtotal);
  const descuentoNum = parseFloat(descuento || 0);
  const impuestosNum = parseFloat(impuestos || 0);
  const porcentajeRetencionNum = parseFloat(porcentaje_retencion || 0);
  const totalNum = parseFloat(total);

  // Validar consistencia de datos fiscales y totales
  const retencionCalculada = (subtotalNum * porcentajeRetencionNum) / 100;
  const totalCalculado =
    subtotalNum - descuentoNum + impuestosNum - retencionCalculada;

  const diferenciaTotal = Math.abs(totalCalculado - totalNum);

  if (diferenciaTotal > 0.05) {
    // Permitir pequeña diferencia por redondeo
    return res.status(400).json({
      message:
        "El total proporcionado no coincide con el cálculo basado en los valores de subtotal, descuento, impuestos y retención",
      detalles: {
        totalCalculado: parseFloat(totalCalculado.toFixed(2)),
        totalProporcionado: totalNum,
        diferencia: parseFloat(diferenciaTotal.toFixed(2)),
      },
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Verificar si ya existe una venta con ese número de documento
    const docCheck = await client.query(
      "SELECT COUNT(*) FROM sales WHERE numero_documento = $1",
      [numero_documento]
    );

    if (parseInt(docCheck.rows[0].count) > 0) {
      return res.status(409).json({
        message: "Ya existe una venta con ese número de documento",
      });
    }

    // Verificar que el cliente existe si se proporciona un id_cliente
    let clienteExistente = null;
    if (id_cliente && id_cliente !== "null" && id_cliente !== null) {
      try {
        const clientCheck = await client.query(
          "SELECT * FROM clients WHERE id_cliente = $1",
          [id_cliente]
        );

        if (clientCheck.rows.length === 0) {
          await client.query("ROLLBACK");
          return res.status(404).json({ message: "Cliente no encontrado" });
        }

        clienteExistente = clientCheck.rows[0];
      } catch (error) {
        console.error("Error al verificar cliente:", error);
        await client.query("ROLLBACK");
        return res.status(500).json({
          message: "Error al verificar cliente",
          error: error.message,
        });
      }
    }

    // Definir valores predeterminados o usar valores del cliente
    const tipoIvaFinal = tipo_iva || clienteExistente?.tipo_iva || "general";
    let porcentajeIvaFinal;

    switch (tipoIvaFinal) {
      case "general":
        porcentajeIvaFinal = 21.0;
        break;
      case "reducido":
        porcentajeIvaFinal = 10.0;
        break;
      case "superreducido":
        porcentajeIvaFinal = 4.0;
        break;
      case "exento":
        porcentajeIvaFinal = 0.0;
        break;
      default:
        porcentajeIvaFinal = 21.0;
    }

    if (porcentaje_iva !== undefined) {
      porcentajeIvaFinal = parseFloat(porcentaje_iva);
    }

    // Asegurar que el total sea exactamente el calculado para evitar problemas con la restricción CHECK
    const totalFinal = parseFloat(totalCalculado.toFixed(2));

    try {
      // ← CAMBIO: Incluir company_id del contexto de tenant
      // Insertar la venta principal con campos fiscales
      const saleResult = await client.query(
        `
        INSERT INTO sales (
          company_id, numero_documento, tipo_documento, fecha_emision, id_cliente, 
          tipo_iva, porcentaje_iva, porcentaje_retencion,
          subtotal, descuento, impuestos, total, 
          metodo_pago, estado, notas
        ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `,
        [
          req.companyId, // ← NUEVO: company_id del middleware tenantContext
          numero_documento,
          tipo_documento,
          id_cliente || null, // Asegurar explícitamente NULL para ventas sin cliente
          tipoIvaFinal,
          porcentajeIvaFinal,
          porcentajeRetencionNum,
          subtotalNum,
          descuentoNum,
          impuestosNum,
          totalFinal, // Usar el valor calculado para asegurar consistencia
          metodo_pago || "efectivo",
          estado || "pagado",
          notas || null,
        ]
      );

      const saleId = saleResult.rows[0].id_venta;

      // Resto del código para insertar productos y servicios
      // ...existing code...

      // Insertar productos si existen
      if (productos && productos.length > 0) {
        for (const producto of productos) {
          await client.query(
            `
            INSERT INTO sale_products (
              id_venta, id_producto, cantidad, precio_unitario, 
              porcentaje_descuento, porcentaje_impuesto, subtotal
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          `,
            [
              saleId,
              producto.id_producto,
              producto.cantidad,
              producto.precio_unitario,
              producto.porcentaje_descuento || 0,
              producto.porcentaje_impuesto || porcentajeIvaFinal,
              producto.subtotal,
            ]
          );

          // Actualizar inventario si la venta no es un presupuesto
          if (tipo_documento !== "presupuesto") {
            await client.query(
              `
              UPDATE inventory 
              SET cantidad_actual = cantidad_actual - $1
              WHERE id_producto = $2
            `,
              [producto.cantidad, producto.id_producto]
            );
          }
        }
      }

      // Insertar servicios si existen
      if (servicios && servicios.length > 0) {
        for (const servicio of servicios) {
          await client.query(
            `
            INSERT INTO sale_services (
              id_venta, id_servicio, id_empleado, horas_trabajadas,
              id_nivel_servicio, cantidad, precio_unitario,
              porcentaje_descuento, porcentaje_impuesto,
              fecha_programada, fecha_completado, estado_servicio,
              subtotal, notas_servicio
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          `,
            [
              saleId,
              servicio.id_servicio,
              servicio.id_empleado,
              servicio.horas_trabajadas || null,
              servicio.id_nivel_servicio || null,
              servicio.cantidad || 1,
              servicio.precio_unitario,
              servicio.porcentaje_descuento || 0,
              servicio.porcentaje_impuesto || porcentajeIvaFinal,
              servicio.fecha_programada || null,
              servicio.fecha_completado || null,
              servicio.estado_servicio || "completado",
              servicio.subtotal,
              servicio.notas_servicio || null,
            ]
          );
        }
      }

      // Actualizar la fecha de última compra del cliente si hay cliente
      if (id_cliente && tipo_documento !== "presupuesto") {
        await client.query(
          `
          UPDATE clients 
          SET fecha_ultima_compra = CURRENT_DATE
          WHERE id_cliente = $1
        `,
          [id_cliente]
        );
      }

      await client.query("COMMIT");

      // Obtener la venta completa con sus detalles
      const completeResult = await getSaleWithDetails(client, saleId);

      res.status(201).json(completeResult);
    } catch (error) {
      console.error("Error específico al insertar venta:", error);
      await client.query("ROLLBACK");
      throw error; // Propagar para el catch externo
    }
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al crear venta:", error);

    // Proporcionar información de error más detallada
    let errorMsg = "Error interno del servidor";
    let errorDetail = null;

    if (error.constraint) {
      if (error.constraint === "sales_check") {
        errorMsg =
          "Error en la validación de total: No coincide con la fórmula del sistema";
        errorDetail = {
          totalCalculado: totalCalculado,
          totalRecibido: totalNum,
          formula:
            "subtotal - descuento + impuestos - (subtotal * porcentaje_retencion / 100)",
        };
      } else if (error.constraint.includes("fk_")) {
        errorMsg = "Error de clave foránea: Referencia no encontrada";
        errorDetail = error.detail;
      }
    }

    res.status(500).json({
      message: errorMsg,
      error: error.message,
      detail: errorDetail || error.detail,
      hint: error.hint,
      code: error.code,
    });
  } finally {
    client.release();
  }
};

// Actualizar estado de una venta
export const updateSaleStatus = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  if (isNaN(id)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  if (
    !["pagado", "pendiente", "parcial", "cancelado", "devuelto"].includes(
      estado
    )
  ) {
    return res.status(400).json({
      message:
        "Estado inválido. Debe ser: pagado, pendiente, parcial, cancelado o devuelto",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Obtener la venta actual
    const currentSale = await client.query(
      "SELECT * FROM sales WHERE id_venta = $1",
      [id]
    );

    if (currentSale.rows.length === 0) {
      return res.status(404).json({ message: "Venta no encontrada" });
    }

    const oldStatus = currentSale.rows[0].estado;

    // Si se cancela o devuelve la venta, devolver los productos al inventario
    if (
      (estado === "cancelado" || estado === "devuelto") &&
      (oldStatus === "pagado" ||
        oldStatus === "pendiente" ||
        oldStatus === "parcial")
    ) {
      // Obtener los productos de la venta
      const productsQuery = await client.query(
        "SELECT * FROM sale_products WHERE id_venta = $1",
        [id]
      );

      // Devolver cada producto al inventario
      for (const product of productsQuery.rows) {
        await client.query(
          `
          UPDATE inventory 
          SET cantidad_actual = cantidad_actual + $1
          WHERE id_producto = $2
        `,
          [product.cantidad, product.id_producto]
        );
      }
    }

    // Actualizar el estado de la venta
    const result = await client.query(
      `
      UPDATE sales 
      SET estado = $1
      WHERE id_venta = $2
      RETURNING *
    `,
      [estado, id]
    );

    await client.query("COMMIT");

    res.json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al actualizar estado de venta:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  } finally {
    client.release();
  }
};

// Actualizar una venta existente
export const updateSale = async (req, res) => {
  const { id } = req.params;
  const {
    numero_documento,
    tipo_documento,
    id_cliente,
    tipo_iva,
    porcentaje_iva,
    porcentaje_retencion,
    subtotal,
    descuento,
    impuestos,
    total,
    metodo_pago,
    estado,
    notas,
    productos,
    servicios,
  } = req.body;

  if (isNaN(id)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  // Validar consistencia de datos fiscales y totales si se proporcionan todos los valores
  if (subtotal !== undefined && total !== undefined) {
    const totalCalculado =
      subtotal -
      (descuento || 0) +
      (impuestos || 0) -
      (subtotal * (porcentaje_retencion || 0)) / 100;
    const diferenciaTotal = Math.abs(totalCalculado - total);

    if (diferenciaTotal > 0.05) {
      // Permitir pequeña diferencia por redondeo
      return res.status(400).json({
        message:
          "El total proporcionado no coincide con el cálculo basado en los valores de subtotal, descuento, impuestos y retención",
      });
    }
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Verificar si la venta existe
    const saleCheck = await client.query(
      "SELECT * FROM sales WHERE id_venta = $1",
      [id]
    );

    if (saleCheck.rows.length === 0) {
      return res.status(404).json({ message: "Venta no encontrada" });
    }

    // Si cambia el número de documento, verificar que no esté duplicado
    if (
      numero_documento &&
      numero_documento !== saleCheck.rows[0].numero_documento
    ) {
      const docCheck = await client.query(
        "SELECT COUNT(*) FROM sales WHERE numero_documento = $1 AND id_venta != $2",
        [numero_documento, id]
      );

      if (parseInt(docCheck.rows[0].count) > 0) {
        return res.status(409).json({
          message: "Ya existe una venta con ese número de documento",
        });
      }
    }

    // Actualizar la venta principal
    await client.query(
      `
      UPDATE sales SET
        numero_documento = COALESCE($1, numero_documento),
        tipo_documento = COALESCE($2, tipo_documento),
        id_cliente = COALESCE($3, id_cliente),
        tipo_iva = COALESCE($4, tipo_iva),
        porcentaje_iva = COALESCE($5, porcentaje_iva),
        porcentaje_retencion = COALESCE($6, porcentaje_retencion),
        subtotal = COALESCE($7, subtotal),
        descuento = COALESCE($8, descuento),
        impuestos = COALESCE($9, impuestos),
        total = COALESCE($10, total),
        metodo_pago = COALESCE($11, metodo_pago),
        estado = COALESCE($12, estado),
        notas = COALESCE($13, notas)
      WHERE id_venta = $14
    `,
      [
        numero_documento,
        tipo_documento,
        id_cliente,
        tipo_iva,
        porcentaje_iva,
        porcentaje_retencion,
        subtotal,
        descuento,
        impuestos,
        total,
        metodo_pago,
        estado,
        notas,
        id,
      ]
    );

    // Si se proporcionan productos, actualizar
    if (productos) {
      // Primero devolver inventario actual
      const currentProducts = await client.query(
        "SELECT * FROM sale_products WHERE id_venta = $1",
        [id]
      );

      if (saleCheck.rows[0].tipo_documento !== "presupuesto") {
        for (const product of currentProducts.rows) {
          await client.query(
            `
            UPDATE inventory 
            SET cantidad_actual = cantidad_actual + $1
            WHERE id_producto = $2
          `,
            [product.cantidad, product.id_producto]
          );
        }
      }

      // Eliminar registros actuales
      await client.query("DELETE FROM sale_products WHERE id_venta = $1", [id]);

      // Insertar nuevos productos
      for (const producto of productos) {
        await client.query(
          `
          INSERT INTO sale_products (
            id_venta, id_producto, cantidad, precio_unitario, 
            porcentaje_descuento, porcentaje_impuesto, subtotal
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
          [
            id,
            producto.id_producto,
            producto.cantidad,
            producto.precio_unitario,
            producto.porcentaje_descuento || 0,
            producto.porcentaje_impuesto ||
              porcentaje_iva ||
              saleCheck.rows[0].porcentaje_iva,
            producto.subtotal,
          ]
        );

        // Actualizar inventario si no es presupuesto
        if (
          tipo_documento !== "presupuesto" &&
          saleCheck.rows[0].tipo_documento !== "presupuesto"
        ) {
          await client.query(
            `
            UPDATE inventory 
            SET cantidad_actual = cantidad_actual - $1
            WHERE id_producto = $2
          `,
            [producto.cantidad, producto.id_producto]
          );
        }
      }
    }

    // Si se proporcionan servicios, actualizar
    if (servicios) {
      // Eliminar registros actuales
      await client.query("DELETE FROM sale_services WHERE id_venta = $1", [id]);

      // Insertar nuevos servicios
      for (const servicio of servicios) {
        await client.query(
          `
          INSERT INTO sale_services (
            id_venta, id_servicio, id_empleado, horas_trabajadas,
            id_nivel_servicio, cantidad, precio_unitario,
            porcentaje_descuento, porcentaje_impuesto,
            fecha_programada, fecha_completado, estado_servicio,
            subtotal, notas_servicio
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `,
          [
            id,
            servicio.id_servicio,
            servicio.id_empleado,
            servicio.horas_trabajadas || null,
            servicio.id_nivel_servicio || null,
            servicio.cantidad || 1,
            servicio.precio_unitario,
            servicio.porcentaje_descuento || 0,
            servicio.porcentaje_impuesto ||
              porcentaje_iva ||
              saleCheck.rows[0].porcentaje_iva,
            servicio.fecha_programada || null,
            servicio.fecha_completado || null,
            servicio.estado_servicio || "completado",
            servicio.subtotal,
            servicio.notas_servicio || null,
          ]
        );
      }
    }

    await client.query("COMMIT");

    // Obtener la venta actualizada con todos sus detalles
    const updatedSale = await getSaleWithDetails(client, id);

    res.json(updatedSale);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al actualizar venta:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  } finally {
    client.release();
  }
};

// Eliminar una venta
export const deleteSale = async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Verificar si la venta existe
    const saleCheck = await client.query(
      "SELECT * FROM sales WHERE id_venta = $1",
      [id]
    );

    if (saleCheck.rows.length === 0) {
      return res.status(404).json({ message: "Venta no encontrada" });
    }

    // Obtener productos para devolverlos al inventario si la venta no es presupuesto
    if (saleCheck.rows[0].tipo_documento !== "presupuesto") {
      const productsQuery = await client.query(
        "SELECT * FROM sale_products WHERE id_venta = $1",
        [id]
      );

      // Devolver cada producto al inventario
      for (const product of productsQuery.rows) {
        await client.query(
          `
          UPDATE inventory 
          SET cantidad_actual = cantidad_actual + $1
          WHERE id_producto = $2
        `,
          [product.cantidad, product.id_producto]
        );
      }
    }

    // Eliminar registros relacionados
    await client.query("DELETE FROM sale_products WHERE id_venta = $1", [id]);
    await client.query("DELETE FROM sale_services WHERE id_venta = $1", [id]);

    // Marcar la venta como eliminada en lugar de eliminarla físicamente
    await client.query(
      "UPDATE sales SET fecha_eliminacion = CURRENT_DATE WHERE id_venta = $1",
      [id]
    );

    await client.query("COMMIT");

    res.json({ message: "Venta eliminada correctamente" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al eliminar venta:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  } finally {
    client.release();
  }
};

// Buscar ventas por varios criterios (número, cliente, fechas, etc.)
export const searchSales = async (req, res) => {
  const {
    term,
    clienteId,
    fechaInicio,
    fechaFin,
    tipoDocumento,
    estado,
    tipoIva,
    metodosPago,
  } = req.query;

  let query = `
    SELECT s.*, 
           c.nombre as nombre_cliente, c.apellido as apellido_cliente,
           c.tipo_cliente, c.tipo_documento as cliente_tipo_documento, 
           c.documento, c.razon_social
    FROM sales s
    LEFT JOIN clients c ON s.id_cliente = c.id_cliente
    WHERE s.fecha_eliminacion IS NULL
  `;

  const queryParams = [];
  let paramCounter = 1;

  // Búsqueda por término general
  if (term) {
    query += ` AND (
      s.numero_documento LIKE $${paramCounter} OR
      CAST(s.id_venta AS TEXT) LIKE $${paramCounter} OR
      LOWER(c.nombre) LIKE LOWER($${paramCounter}) OR
      LOWER(c.apellido) LIKE LOWER($${paramCounter}) OR
      LOWER(c.documento) LIKE LOWER($${paramCounter}) OR
      LOWER(c.razon_social) LIKE LOWER($${paramCounter})
    )`;
    queryParams.push(`%${term}%`);
    paramCounter++;
  }

  // Filtrar por cliente
  if (clienteId) {
    query += ` AND s.id_cliente = $${paramCounter}`;
    queryParams.push(clienteId);
    paramCounter++;
  }

  // Filtrar por rango de fechas
  if (fechaInicio && fechaFin) {
    query += ` AND s.fecha_emision BETWEEN $${paramCounter} AND $${paramCounter + 1}`;
    queryParams.push(fechaInicio, fechaFin);
    paramCounter += 2;
  } else if (fechaInicio) {
    query += ` AND s.fecha_emision >= $${paramCounter}`;
    queryParams.push(fechaInicio);
    paramCounter++;
  } else if (fechaFin) {
    query += ` AND s.fecha_emision <= $${paramCounter}`;
    queryParams.push(fechaFin);
    paramCounter++;
  }

  // Filtrar por tipo de documento
  if (tipoDocumento) {
    query += ` AND s.tipo_documento = $${paramCounter}`;
    queryParams.push(tipoDocumento);
    paramCounter++;
  }

  // Filtrar por estado
  if (estado) {
    query += ` AND s.estado = $${paramCounter}`;
    queryParams.push(estado);
    paramCounter++;
  }

  // Filtrar por tipo de IVA
  if (tipoIva) {
    query += ` AND s.tipo_iva = $${paramCounter}`;
    queryParams.push(tipoIva);
    paramCounter++;
  }

  // Filtrar por método de pago
  if (metodosPago) {
    const metodos = Array.isArray(metodosPago) ? metodosPago : [metodosPago];
    if (metodos.length > 0) {
      query += ` AND s.metodo_pago IN (`;
      metodos.forEach((metodo, index) => {
        query += index === 0 ? `$${paramCounter}` : `, $${paramCounter}`;
        queryParams.push(metodo);
        paramCounter++;
      });
      query += `)`;
    }
  }

  query += ` ORDER BY s.fecha_emision DESC`;

  try {
    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al buscar ventas:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Obtener ventas por rango de fecha
export const getSalesByDateRange = async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res
      .status(400)
      .json({ message: "Se requieren fechas de inicio y fin" });
  }

  try {
    const result = await pool.query(
      `
      SELECT s.*, 
             c.nombre as nombre_cliente, c.apellido as apellido_cliente,
             c.tipo_cliente, c.razon_social
      FROM sales s
      LEFT JOIN clients c ON s.id_cliente = c.id_cliente
      WHERE s.fecha_emision BETWEEN $1 AND $2
      AND s.fecha_eliminacion IS NULL
      ORDER BY s.fecha_emision DESC
    `,
      [startDate, endDate]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener ventas por rango de fechas:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Obtener ventas por cliente
export const getSalesByClient = async (req, res) => {
  const { clientId } = req.params;

  if (isNaN(clientId)) {
    return res.status(400).json({ message: "ID de cliente inválido" });
  }

  try {
    const result = await pool.query(
      `
      SELECT s.*, 
             c.nombre as nombre_cliente, c.apellido as apellido_cliente,
             c.tipo_cliente, c.razon_social
      FROM sales s
      LEFT JOIN clients c ON s.id_cliente = c.id_cliente
      WHERE s.id_cliente = $1
      AND s.fecha_eliminacion IS NULL
      ORDER BY s.fecha_emision DESC
    `,
      [clientId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener ventas por cliente:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Obtener ventas por empleado
export const getSalesByEmployee = async (req, res) => {
  const { employeeId } = req.params;

  if (isNaN(employeeId)) {
    return res.status(400).json({ message: "ID de empleado inválido" });
  }

  try {
    const result = await pool.query(
      `
      SELECT s.*, 
             c.nombre as nombre_cliente, c.apellido as apellido_cliente,
             e.nombre as nombre_empleado
      FROM sales s
      LEFT JOIN clients c ON s.id_cliente = c.id_cliente
      LEFT JOIN employees e ON s.id_empleado_vendedor = e.id_empleado
      WHERE s.id_empleado_vendedor = $1
      ORDER BY s.fecha_emision DESC
    `,
      [employeeId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener ventas por empleado:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Obtener estadísticas de ventas por período
export const getSalesStatsByPeriod = async (req, res) => {
  const { period } = req.params;
  const validPeriods = ["day", "week", "month", "year"];

  if (!validPeriods.includes(period)) {
    return res.status(400).json({
      message: "Período inválido. Debe ser: day, week, month o year",
    });
  }

  let intervalQuery;
  switch (period) {
    case "day":
      intervalQuery = `DATE_TRUNC('day', fecha_emision)`;
      break;
    case "week":
      intervalQuery = `DATE_TRUNC('week', fecha_emision)`;
      break;
    case "month":
      intervalQuery = `DATE_TRUNC('month', fecha_emision)`;
      break;
    case "year":
      intervalQuery = `DATE_TRUNC('year', fecha_emision)`;
      break;
  }

  try {
    // Estadísticas generales
    const generalStats = await pool.query(`
      SELECT 
        COUNT(*) as total_ventas,
        SUM(total) as ingresos_totales,
        AVG(total) as promedio_venta,
        MIN(total) as venta_minima,
        MAX(total) as venta_maxima
      FROM sales
      WHERE fecha_emision >= DATE_TRUNC('${period}', CURRENT_DATE)
    `);

    // Ventas por tipo de documento
    const salesByType = await pool.query(`
      SELECT 
        tipo_documento,
        COUNT(*) as cantidad,
        SUM(total) as total
      FROM sales
      WHERE fecha_emision >= DATE_TRUNC('${period}', CURRENT_DATE)
      GROUP BY tipo_documento
    `);

    // Ventas por período (día, semana, mes, año)
    const salesByPeriod = await pool.query(`
      SELECT 
        ${intervalQuery} as periodo,
        COUNT(*) as cantidad,
        SUM(total) as total
      FROM sales
      WHERE fecha_emision >= DATE_TRUNC('${period}', CURRENT_DATE - INTERVAL '1 year')
      GROUP BY ${intervalQuery}
      ORDER BY ${intervalQuery} DESC
    `);

    // Productos más vendidos
    const topProducts = await pool.query(`
      SELECT 
        i.id_producto,
        i.nombre_producto,
        SUM(sp.cantidad) as cantidad_total,
        SUM(sp.subtotal) as total_ventas
      FROM sale_products sp
      JOIN inventory i ON sp.id_producto = i.id_producto
      JOIN sales s ON sp.id_venta = s.id_venta
      WHERE s.fecha_emision >= DATE_TRUNC('${period}', CURRENT_DATE)
      GROUP BY i.id_producto, i.nombre_producto
      ORDER BY cantidad_total DESC
      LIMIT 10
    `);

    // Servicios más vendidos
    const topServices = await pool.query(`
      SELECT 
        s.id_servicio,
        s.nombre_servicio,
        COUNT(ss.id_servicio) as cantidad_total,
        SUM(ss.subtotal) as total_ventas
      FROM sale_services ss
      JOIN services s ON ss.id_servicio = s.id_servicio
      JOIN sales sa ON ss.id_venta = sa.id_venta
      WHERE sa.fecha_emision >= DATE_TRUNC('${period}', CURRENT_DATE)
      GROUP BY s.id_servicio, s.nombre_servicio
      ORDER BY cantidad_total DESC
      LIMIT 10
    `);

    // Clientes con más compras
    const topClients = await pool.query(`
      SELECT 
        c.id_cliente,
        c.nombre,
        c.apellido,
        COUNT(s.id_venta) as cantidad_compras,
        SUM(s.total) as total_gastado
      FROM sales s
      JOIN clients c ON s.id_cliente = c.id_cliente
      WHERE s.fecha_emision >= DATE_TRUNC('${period}', CURRENT_DATE)
      GROUP BY c.id_cliente, c.nombre, c.apellido
      ORDER BY total_gastado DESC
      LIMIT 10
    `);

    res.json({
      general: generalStats.rows[0],
      por_tipo: salesByType.rows,
      por_periodo: salesByPeriod.rows,
      productos_top: topProducts.rows,
      servicios_top: topServices.rows,
      clientes_top: topClients.rows,
    });
  } catch (error) {
    console.error("Error al obtener estadísticas de ventas:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Función auxiliar para obtener una venta con todos sus detalles
async function getSaleWithDetails(client, saleId) {
  // Obtener información de la venta con campos fiscales
  try {
    const saleQuery = await client.query(
      `
      SELECT s.*, 
             c.nombre as nombre_cliente, c.apellido as apellido_cliente,
             c.tipo_cliente, c.tipo_documento, c.documento, 
             c.direccion, c.codigo_postal, c.ciudad, c.provincia, c.pais,
             c.email, c.telefono, c.razon_social, c.regimen_fiscal,
             c.tipo_iva as cliente_tipo_iva
      FROM sales s
      LEFT JOIN clients c ON s.id_cliente = c.id_cliente
      WHERE s.id_venta = $1
    `,
      [saleId]
    );

    if (saleQuery.rows.length === 0) {
      return null;
    }

    const sale = saleQuery.rows[0];

    // Obtener productos incluidos en la venta
    const productsQuery = await client.query(
      `
      SELECT sp.*, i.nombre_producto, i.descripcion
      FROM sale_products sp
      JOIN inventory i ON sp.id_producto = i.id_producto
      WHERE sp.id_venta = $1
    `,
      [saleId]
    );

    // Obtener servicios incluidos en la venta
    const servicesQuery = await client.query(
      `
      SELECT ss.*, s.nombre_servicio, s.descripcion,
             e.nombre as nombre_empleado,
             sl.nombre_nivel
      FROM sale_services ss
      JOIN services s ON ss.id_servicio = s.id_servicio
      LEFT JOIN employees e ON ss.id_empleado = e.id_empleado
      LEFT JOIN service_levels sl ON ss.id_nivel_servicio = sl.id_nivel
      WHERE ss.id_venta = $1
    `,
      [saleId]
    );

    // Construir respuesta completa
    return {
      ...sale,
      productos: productsQuery.rows,
      servicios: servicesQuery.rows,
    };
  } catch (error) {
    console.error("Error en getSaleWithDetails:", error);
    throw error;
  }
}

// Función para generar documento de venta (ticket, factura, etc.)
export const generateSaleDocument = async (req, res) => {
  const { id } = req.params;
  const { type } = req.query; // ticket, factura, presupuesto, etc.

  if (!id) {
    return res.status(400).json({
      status: 400,
      message: "ID de venta no especificado",
    });
  }

  if (!type) {
    return res.status(400).json({
      status: 400,
      message: "Tipo de documento no especificado",
    });
  }

  try {
    // 1. Obtener datos de la venta con campos fiscales
    const saleResult = await pool.query(
      `SELECT s.*, 
         c.nombre, c.apellido, c.email, c.documento, c.direccion,
         c.codigo_postal, c.ciudad, c.provincia, c.pais,
         c.tipo_cliente, c.razon_social, c.regimen_fiscal,
         c.tipo_iva as cliente_tipo_iva
       FROM sales s
       LEFT JOIN clients c ON s.id_cliente = c.id_cliente
       WHERE s.id_venta = $1`,
      [id]
    );

    if (saleResult.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Venta no encontrada",
      });
    }

    const sale = saleResult.rows[0];

    // 2. Obtener detalles de productos vendidos
    const productsResult = await pool.query(
      `SELECT sp.*, i.nombre_producto 
       FROM sale_products sp
       JOIN inventory i ON sp.id_producto = i.id_producto
       WHERE sp.id_venta = $1`,
      [id]
    );

    // 3. Obtener detalles de servicios vendidos
    const servicesResult = await pool.query(
      `SELECT ss.*, s.nombre_servicio 
       FROM sale_services ss
       JOIN services s ON ss.id_servicio = s.id_servicio
       WHERE ss.id_venta = $1`,
      [id]
    );

    // 4. Combinar los datos
    const documentData = {
      venta: sale,
      productos: productsResult.rows,
      servicios: servicesResult.rows,
      fecha_generacion: new Date(),
      tipo_documento: type,
    };

    // 5. Aquí implementarías la lógica para generar PDF, etc.
    // Para este ejemplo, simplemente devolvemos los datos como JSON
    // En una implementación real, generarías un PDF y devolverías la URL

    return res.status(200).json({
      status: 200,
      message: `Documento de tipo ${type} generado correctamente`,
      data: documentData,
      // En producción: url: `${process.env.BASE_URL}/documents/${filename}`
    });
  } catch (error) {
    console.error(`Error al generar documento para venta ${id}:`, error);
    return res.status(500).json({
      status: 500,
      message: "Error al generar el documento",
      error: error.message,
    });
  }
};

// Obtener ventas por fecha específica
export const getSalesByDate = async (req, res) => {
  const { date } = req.params;

  if (!date) {
    return res
      .status(400)
      .json({ message: "Se requiere especificar una fecha" });
  }

  try {
    // Construir rango de fechas para el día completo (desde 00:00:00 hasta 23:59:59)
    // Asegurarnos de manejar correctamente la fecha sin problemas de zona horaria
    const dateParts = date.split("-");
    if (dateParts.length !== 3) {
      return res
        .status(400)
        .json({ message: "Formato de fecha inválido. Debe ser YYYY-MM-DD" });
    }

    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1; // Los meses en JS son 0-indexed
    const day = parseInt(dateParts[2]);

    // Crear objetos Date utilizando la misma fecha local
    const startDate = new Date(year, month, day, 0, 0, 0, 0);
    const endDate = new Date(year, month, day, 23, 59, 59, 999);

    // Formatear las fechas en YYYY-MM-DD HH:MM:SS para PostgreSQL
    const startDateStr = `${year}-${dateParts[1]}-${dateParts[2]} 00:00:00`;
    const endDateStr = `${year}-${dateParts[1]}-${dateParts[2]} 23:59:59`;

    const result = await pool.query(
      `SELECT s.*, 
              c.nombre as nombre_cliente, c.apellido as apellido_cliente,
              e.nombre as nombre_empleado
       FROM sales s
       LEFT JOIN clients c ON s.id_cliente = c.id_cliente
       LEFT JOIN employees e ON s.id_empleado_vendedor = e.id_empleado
       WHERE s.fecha_emision BETWEEN $1 AND $2
       ORDER BY s.fecha_emision DESC`,
      [startDateStr, endDateStr]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener ventas por fecha:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
