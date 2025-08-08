import pool from "../db.js";

// Obtener todos los servicios activos (filtrados automáticamente por RLS)
export const getAllServices = async (req, res) => {
  try {
    // ← CAMBIO: RLS filtra automáticamente por company_id
    const result = await pool.query(`
      SELECT * FROM services
      WHERE activo = true
      ORDER BY nombre_servicio
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener servicios:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Obtener todos los servicios incluyendo inactivos (RLS automático)
export const getAllServicesAdmin = async (req, res) => {
  try {
    // ← CAMBIO: RLS filtra automáticamente por company_id
    const result = await pool.query(`
      SELECT * FROM services
      ORDER BY nombre_servicio
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener servicios:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Obtener servicio por ID (RLS automático)
export const getServiceById = async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  const client = await pool.connect();

  try {
    // Obtener el servicio base
    const serviceResult = await client.query(
      `
      SELECT * FROM services WHERE id_servicio = $1
    `,
      [id]
    );

    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ message: "Servicio no encontrado" });
    }

    const service = serviceResult.rows[0];

    // Si el servicio es por nivel, obtener los niveles
    if (service.tipo_tarifa === "por_nivel") {
      const levelsResult = await client.query(
        `
        SELECT * FROM service_levels 
        WHERE id_servicio = $1
        ORDER BY precio ASC
      `,
        [id]
      );

      service.niveles = levelsResult.rows;
    }

    // Obtener los empleados que pueden ofrecer este servicio
    const employeesResult = await client.query(
      `
      SELECT es.id_empleado_servicio, es.porcentaje_comision,
             e.id_empleado, e.nombre, e.cargo
      FROM employee_services es
      JOIN employees e ON es.id_empleado = e.id_empleado
      WHERE es.id_servicio = $1 AND e.activo = true
    `,
      [id]
    );

    service.empleados = employeesResult.rows;

    res.json(service);
  } catch (error) {
    console.error("Error al obtener servicio:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  } finally {
    client.release();
  }
};

// Crear un nuevo servicio
export const createService = async (req, res) => {
  const {
    nombre_servicio,
    descripcion,
    precio_base,
    tipo_tarifa,
    duracion_estimada_minutos,
    categoria,
    requiere_profesional,
    activo,
    niveles,
    empleados,
  } = req.body;

  // Validar campos obligatorios
  if (!nombre_servicio || !tipo_tarifa) {
    return res.status(400).json({
      message: "Nombre del servicio y tipo de tarifa son obligatorios",
    });
  }

  // Validar que si el tipo de tarifa es por_nivel, se proporcionen niveles
  if (tipo_tarifa === "por_nivel" && (!niveles || niveles.length === 0)) {
    return res.status(400).json({
      message:
        "Para servicios con tarifa por nivel, debe proporcionar al menos un nivel",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    // ← CAMBIO: Incluir company_id del contexto de tenant
    // Insertar el servicio base
    const serviceResult = await client.query(
      `
      INSERT INTO services (
        company_id, nombre_servicio, descripcion, precio_base, tipo_tarifa,
        duracion_estimada_minutos, categoria, requiere_profesional, activo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `,
      [
        req.companyId, // ← NUEVO: company_id del middleware tenantContext
        nombre_servicio,
        descripcion || null,
        precio_base || null,
        tipo_tarifa,
        duracion_estimada_minutos || null,
        categoria || null,
        requiere_profesional !== undefined ? requiere_profesional : true,
        activo !== undefined ? activo : true,
      ]
    );

    const serviceId = serviceResult.rows[0].id_servicio;

    // Si el tipo de tarifa es por_nivel, insertar los niveles
    if (tipo_tarifa === "por_nivel" && niveles && niveles.length > 0) {
      for (const nivel of niveles) {
        await client.query(
          `
          INSERT INTO service_levels (
            id_servicio, nombre_nivel, descripcion, precio, tiempo_estimado_minutos
          ) VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `,
          [
            serviceId,
            nivel.nombre_nivel,
            nivel.descripcion || null,
            nivel.precio,
            nivel.tiempo_estimado_minutos || null,
          ]
        );
      }
    }

    // Si se proporcionaron empleados, asociarlos al servicio
    if (empleados && empleados.length > 0) {
      for (const empleado of empleados) {
        await client.query(
          `
          INSERT INTO employee_services (
            id_empleado, id_servicio, porcentaje_comision
          ) VALUES ($1, $2, $3)
          RETURNING *
        `,
          [
            empleado.id_empleado,
            serviceId,
            empleado.porcentaje_comision || null,
          ]
        );
      }
    }

    await client.query("COMMIT");

    // Obtener el servicio completo con sus relaciones
    const completeService = await getCompleteService(client, serviceId);

    res.status(201).json(completeService);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al crear servicio:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  } finally {
    client.release();
  }
};

// Actualizar un servicio existente
export const updateService = async (req, res) => {
  const { id } = req.params;
  const {
    nombre_servicio,
    descripcion,
    precio_base,
    tipo_tarifa,
    duracion_estimada_minutos,
    categoria,
    requiere_profesional,
    activo,
    niveles,
    empleados,
  } = req.body;

  if (isNaN(id)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  // Validar campos obligatorios
  if (!nombre_servicio || !tipo_tarifa) {
    return res.status(400).json({
      message: "Nombre del servicio y tipo de tarifa son obligatorios",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Verificar que el servicio existe
    const serviceCheck = await client.query(
      "SELECT * FROM services WHERE id_servicio = $1",
      [id]
    );

    if (serviceCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Servicio no encontrado" });
    }

    // Actualizar el servicio base
    await client.query(
      `
      UPDATE services SET
        nombre_servicio = $1,
        descripcion = $2,
        precio_base = $3,
        tipo_tarifa = $4,
        duracion_estimada_minutos = $5,
        categoria = $6,
        requiere_profesional = $7,
        activo = $8
      WHERE id_servicio = $9
    `,
      [
        nombre_servicio,
        descripcion || null,
        precio_base || null,
        tipo_tarifa,
        duracion_estimada_minutos || null,
        categoria || null,
        requiere_profesional !== undefined ? requiere_profesional : true,
        activo !== undefined ? activo : true,
        id,
      ]
    );

    // Si el tipo de tarifa es por_nivel, actualizar los niveles
    if (tipo_tarifa === "por_nivel" && niveles) {
      // Eliminar los niveles actuales
      await client.query("DELETE FROM service_levels WHERE id_servicio = $1", [
        id,
      ]);

      // Insertar los nuevos niveles
      for (const nivel of niveles) {
        await client.query(
          `
          INSERT INTO service_levels (
            id_servicio, nombre_nivel, descripcion, precio, tiempo_estimado_minutos
          ) VALUES ($1, $2, $3, $4, $5)
        `,
          [
            id,
            nivel.nombre_nivel,
            nivel.descripcion || null,
            nivel.precio,
            nivel.tiempo_estimado_minutos || null,
          ]
        );
      }
    }

    // Si se proporcionaron empleados, actualizar las asociaciones
    if (empleados) {
      // Eliminar las asociaciones actuales
      await client.query(
        "DELETE FROM employee_services WHERE id_servicio = $1",
        [id]
      );

      // Insertar las nuevas asociaciones
      for (const empleado of empleados) {
        await client.query(
          `
          INSERT INTO employee_services (
            id_empleado, id_servicio, porcentaje_comision
          ) VALUES ($1, $2, $3)
        `,
          [empleado.id_empleado, id, empleado.porcentaje_comision || null]
        );
      }
    }

    await client.query("COMMIT");

    // Obtener el servicio completo con sus relaciones
    const completeService = await getCompleteService(client, id);

    res.json(completeService);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al actualizar servicio:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  } finally {
    client.release();
  }
};

// Eliminar un servicio
export const deleteService = async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Verificar si hay ventas que incluyen este servicio
    const salesCheck = await client.query(
      "SELECT COUNT(*) FROM sale_services WHERE id_servicio = $1",
      [id]
    );

    if (parseInt(salesCheck.rows[0].count) > 0) {
      // En lugar de impedir la eliminación, marcar como inactivo
      await client.query(
        "UPDATE services SET activo = false WHERE id_servicio = $1",
        [id]
      );

      await client.query("COMMIT");
      return res.json({
        message:
          "El servicio tiene ventas asociadas. Se ha marcado como inactivo.",
        inactivated: true,
      });
    }

    // Si no hay ventas, eliminar las asociaciones y el servicio
    await client.query("DELETE FROM employee_services WHERE id_servicio = $1", [
      id,
    ]);
    await client.query("DELETE FROM service_levels WHERE id_servicio = $1", [
      id,
    ]);

    const result = await client.query(
      "DELETE FROM services WHERE id_servicio = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Servicio no encontrado" });
    }

    await client.query("COMMIT");
    res.json({ message: "Servicio eliminado correctamente" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al eliminar servicio:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  } finally {
    client.release();
  }
};

// Obtener servicios por categoría
export const getServicesByCategory = async (req, res) => {
  const { categoria } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT * FROM services
      WHERE categoria = $1 AND activo = true
      ORDER BY nombre_servicio
    `,
      [categoria]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener servicios por categoría:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Buscar servicios por término
export const searchServices = async (req, res) => {
  const { term } = req.query;
  const activeOnly = req.query.activeOnly === "true";

  if (!term) {
    return activeOnly
      ? getAllServices(req, res)
      : getAllServicesAdmin(req, res);
  }

  try {
    let query = `
      SELECT * FROM services
      WHERE (
        LOWER(nombre_servicio) LIKE LOWER($1) OR
        LOWER(descripcion) LIKE LOWER($1) OR
        LOWER(categoria) LIKE LOWER($1)
      )
    `;

    if (activeOnly) {
      query += " AND activo = true";
    }

    query += " ORDER BY nombre_servicio";

    const result = await pool.query(query, [`%${term}%`]);

    res.json(result.rows);
  } catch (error) {
    console.error("Error al buscar servicios:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Función auxiliar para obtener un servicio completo con sus relaciones
async function getCompleteService(client, serviceId) {
  // Obtener el servicio base
  const serviceResult = await client.query(
    "SELECT * FROM services WHERE id_servicio = $1",
    [serviceId]
  );

  if (serviceResult.rows.length === 0) {
    return null;
  }

  const service = serviceResult.rows[0];

  // Si el servicio es por nivel, obtener los niveles
  if (service.tipo_tarifa === "por_nivel") {
    const levelsResult = await client.query(
      "SELECT * FROM service_levels WHERE id_servicio = $1 ORDER BY precio ASC",
      [serviceId]
    );

    service.niveles = levelsResult.rows;
  }

  // Obtener los empleados que pueden ofrecer este servicio
  const employeesResult = await client.query(
    `
    SELECT es.id_empleado_servicio, es.porcentaje_comision,
           e.id_empleado, e.nombre, e.cargo
    FROM employee_services es
    JOIN employees e ON es.id_empleado = e.id_empleado
    WHERE es.id_servicio = $1
  `,
    [serviceId]
  );

  service.empleados = employeesResult.rows;

  return service;
}
