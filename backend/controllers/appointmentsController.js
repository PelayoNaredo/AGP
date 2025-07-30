import pool from "../db.js";

// Obtener todas las citas
export const getAllAppointments = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, 
             c.nombre as nombre_cliente, c.apellido as apellido_cliente,
             e.nombre as nombre_empleado,
             s.nombre_servicio
      FROM appointments a
      LEFT JOIN clients c ON a.id_cliente = c.id_cliente
      LEFT JOIN employees e ON a.id_empleado = e.id_empleado
      LEFT JOIN services s ON a.id_servicio = s.id_servicio
      ORDER BY a.fecha_inicio DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener citas:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Obtener citas por rango de fechas
export const getAppointmentsByDateRange = async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res
      .status(400)
      .json({ message: "Se requieren fechas de inicio y fin" });
  }
  try {
    // Convertir las fechas a formato timestamp con timezone
    const result = await pool.query(
      `
      SELECT a.*, 
             c.nombre as nombre_cliente, c.apellido as apellido_cliente,
             e.nombre as nombre_empleado,
             s.nombre_servicio
      FROM appointments a
      LEFT JOIN clients c ON a.id_cliente = c.id_cliente
      LEFT JOIN employees e ON a.id_empleado = e.id_empleado
      LEFT JOIN services s ON a.id_servicio = s.id_servicio
      WHERE (
        -- Citas que comienzan en el rango de fechas
        (a.fecha_inicio >= $1::timestamp AND a.fecha_inicio <= $2::timestamp)
        OR
        -- Citas que terminan en el rango de fechas
        (a.fecha_fin >= $1::timestamp AND a.fecha_fin <= $2::timestamp)
        OR
        -- Citas que abarcan todo el rango
        (a.fecha_inicio <= $1::timestamp AND a.fecha_fin >= $2::timestamp)
      )
      AND a.estado != 'cancelada'
      ORDER BY a.fecha_inicio
    `,
      [startDate, endDate]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(
      "[APPOINTMENTS_CONTROLLER] Error al obtener citas por rango de fechas:",
      error
    );
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Obtener citas por empleado
export const getAppointmentsByEmployee = async (req, res) => {
  const { employeeId } = req.params;
  const { startDate, endDate } = req.query;

  if (isNaN(employeeId)) {
    return res.status(400).json({ message: "ID de empleado inválido" });
  }

  let query = `
    SELECT a.*, 
           c.nombre as nombre_cliente, c.apellido as apellido_cliente,
           e.nombre as nombre_empleado,
           s.nombre_servicio
    FROM appointments a
    LEFT JOIN clients c ON a.id_cliente = c.id_cliente
    LEFT JOIN employees e ON a.id_empleado = e.id_empleado
    LEFT JOIN services s ON a.id_servicio = s.id_servicio
    WHERE a.id_empleado = $1
  `;

  const queryParams = [employeeId];

  if (startDate && endDate) {
    query += ` AND a.fecha_inicio >= $2 AND a.fecha_inicio <= $3`;
    queryParams.push(startDate, endDate);
  }

  query += ` ORDER BY a.fecha_inicio`;

  try {
    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener citas por empleado:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Obtener citas por cliente
export const getAppointmentsByClient = async (req, res) => {
  const { clientId } = req.params;

  if (isNaN(clientId)) {
    return res.status(400).json({ message: "ID de cliente inválido" });
  }

  try {
    const result = await pool.query(
      `
      SELECT a.*, 
             c.nombre as nombre_cliente, c.apellido as apellido_cliente,
             e.nombre as nombre_empleado,
             s.nombre_servicio
      FROM appointments a
      LEFT JOIN clients c ON a.id_cliente = c.id_cliente
      LEFT JOIN employees e ON a.id_empleado = e.id_empleado
      LEFT JOIN services s ON a.id_servicio = s.id_servicio
      WHERE a.id_cliente = $1
      ORDER BY a.fecha_inicio DESC
    `,
      [clientId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener citas por cliente:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Obtener una cita por ID
export const getAppointmentById = async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  try {
    const result = await pool.query(
      `
      SELECT a.*, 
             c.nombre as nombre_cliente, c.apellido as apellido_cliente,
             e.nombre as nombre_empleado,
             s.nombre_servicio
      FROM appointments a
      LEFT JOIN clients c ON a.id_cliente = c.id_cliente
      LEFT JOIN employees e ON a.id_empleado = e.id_empleado
      LEFT JOIN services s ON a.id_servicio = s.id_servicio
      WHERE a.id_cita = $1
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Cita no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener cita:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Crear una nueva cita
export const createAppointment = async (req, res) => {
  const {
    id_cliente,
    id_empleado,
    id_servicio,
    fecha_inicio,
    fecha_fin,
    estado,
    notas,
  } = req.body;

  if ((!id_empleado || id_empleado === "") && id_empleado !== "sin_asignar") {
    return res.status(400).json({
      message:
        "Empleado, fecha de inicio y fecha de fin son campos obligatorios",
    });
  }

  if (!fecha_inicio || !fecha_fin) {
    return res.status(400).json({
      message: "Fecha de inicio y fecha de fin son campos obligatorios",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Verificar que el empleado existe (solo si no es "sin_asignar")
    if (id_empleado && id_empleado !== "sin_asignar") {
      const employeeCheck = await client.query(
        "SELECT id_empleado FROM employees WHERE id_empleado = $1",
        [id_empleado]
      );

      if (employeeCheck.rows.length === 0) {
        return res.status(404).json({ message: "El empleado no existe" });
      }
    }

    // Verificar que el cliente existe si se proporciona
    if (id_cliente) {
      const clientCheck = await client.query(
        "SELECT id_cliente FROM clients WHERE id_cliente = $1",
        [id_cliente]
      );

      if (clientCheck.rows.length === 0) {
        return res.status(404).json({ message: "El cliente no existe" });
      }
    }

    // Verificar que el servicio existe si se proporciona
    if (id_servicio) {
      const serviceCheck = await client.query(
        "SELECT id_servicio FROM services WHERE id_servicio = $1",
        [id_servicio]
      );

      if (serviceCheck.rows.length === 0) {
        return res.status(404).json({ message: "El servicio no existe" });
      }
    }
    // Ya no verificamos solapamientos - permitimos múltiples citas simultáneas
    // para cualquier profesional

    // Crear la cita
    // Convertir cadenas vacías a null para campos de ID para evitar error de tipo de datos
    const cleanedClientId = id_cliente === "" ? null : id_cliente;
    const cleanedServiceId = id_servicio === "" ? null : id_servicio;
    const cleanedEmployeeId =
      id_empleado === "sin_asignar" || id_empleado === "" ? null : id_empleado;

    // Asegurar que las fechas son tratadas correctamente con zona horaria
    const parsedFechaInicio = new Date(fecha_inicio);
    const parsedFechaFin = new Date(fecha_fin);

    // Convertir las fechas a formato timestamp sin timezone para PostgreSQL
    // Usa TIMESTAMPTZ para mantener la información de zona horaria
    const result = await client.query(
      `
      INSERT INTO appointments (
        id_cliente, id_empleado, id_servicio, fecha_inicio, fecha_fin, estado, notas
      ) VALUES ($1, $2, $3, $4::timestamptz, $5::timestamptz, $6, $7)
      RETURNING *
    `,
      [
        cleanedClientId,
        cleanedEmployeeId,
        cleanedServiceId,
        fecha_inicio,
        fecha_fin,
        estado || "pendiente",
        notas,
      ]
    );

    await client.query("COMMIT");

    // Obtener la cita con información detallada
    const appointmentWithDetails = await client.query(
      `
      SELECT a.*, 
             c.nombre as nombre_cliente, c.apellido as apellido_cliente,
             e.nombre as nombre_empleado,
             s.nombre_servicio
      FROM appointments a
      LEFT JOIN clients c ON a.id_cliente = c.id_cliente
      LEFT JOIN employees e ON a.id_empleado = e.id_empleado
      LEFT JOIN services s ON a.id_servicio = s.id_servicio
      WHERE a.id_cita = $1
    `,
      [result.rows[0].id_cita]
    );

    res.status(201).json(appointmentWithDetails.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al crear cita:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  } finally {
    client.release();
  }
};

// Actualizar una cita existente
export const updateAppointment = async (req, res) => {
  const { id } = req.params;
  const {
    id_cliente,
    id_empleado,
    id_servicio,
    fecha_inicio,
    fecha_fin,
    estado,
    notas,
  } = req.body;

  if (isNaN(id)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Verificar que la cita existe
    const appointmentCheck = await client.query(
      "SELECT * FROM appointments WHERE id_cita = $1",
      [id]
    );

    if (appointmentCheck.rows.length === 0) {
      return res.status(404).json({ message: "Cita no encontrada" });
    } // Verificar disponibilidad del empleado si se cambia la fecha o el empleado
    // Solo verificar si no es "sin_asignar"
    const empleadoToCheck = id_empleado || appointmentCheck.rows[0].id_empleado;

    if (
      empleadoToCheck !== "sin_asignar" &&
      ((fecha_inicio && fecha_fin) ||
        (id_empleado && id_empleado !== appointmentCheck.rows[0].id_empleado))
    ) {
      const overlapCheck = await client.query(
        `
        SELECT COUNT(*) FROM appointments
        WHERE id_empleado = $1
        AND id_cita != $2
        AND (
          (fecha_inicio <= $3 AND fecha_fin >= $3) OR
          (fecha_inicio <= $4 AND fecha_fin >= $4) OR
          (fecha_inicio >= $3 AND fecha_fin <= $4)
        )
        AND estado != 'cancelada'
      `,
        [
          empleadoToCheck,
          id,
          fecha_inicio || appointmentCheck.rows[0].fecha_inicio,
          fecha_fin || appointmentCheck.rows[0].fecha_fin,
        ]
      );

      if (parseInt(overlapCheck.rows[0].count) > 0) {
        return res.status(409).json({
          message: "El empleado ya tiene una cita programada en ese horario",
        });
      }
    }

    // Actualizar la cita
    // Manejar fechas con timezone correctamente
    const fechaInicioToUse =
      fecha_inicio || appointmentCheck.rows[0].fecha_inicio;
    const fechaFinToUse = fecha_fin || appointmentCheck.rows[0].fecha_fin;

    const result = await client.query(
      `
      UPDATE appointments SET
        id_cliente = $1,
        id_empleado = $2,
        id_servicio = $3,
        fecha_inicio = $4::timestamptz,
        fecha_fin = $5::timestamptz,
        estado = $6,
        notas = $7
      WHERE id_cita = $8
      RETURNING *
    `,
      [
        // Manejar cadenas vacías como null para los campos de ID
        id_cliente !== undefined
          ? id_cliente === ""
            ? null
            : id_cliente
          : appointmentCheck.rows[0].id_cliente,
        id_empleado !== undefined
          ? id_empleado === "" || id_empleado === "sin_asignar"
            ? null
            : id_empleado
          : appointmentCheck.rows[0].id_empleado,
        id_servicio !== undefined
          ? id_servicio === ""
            ? null
            : id_servicio
          : appointmentCheck.rows[0].id_servicio,
        fechaInicioToUse,
        fechaFinToUse,
        estado || appointmentCheck.rows[0].estado,
        notas !== undefined ? notas : appointmentCheck.rows[0].notas,
        id,
      ]
    );

    await client.query("COMMIT");

    // Obtener la cita actualizada con información detallada
    const appointmentWithDetails = await client.query(
      `
      SELECT a.*, 
             c.nombre as nombre_cliente, c.apellido as apellido_cliente,
             e.nombre as nombre_empleado,
             s.nombre_servicio
      FROM appointments a
      LEFT JOIN clients c ON a.id_cliente = c.id_cliente
      LEFT JOIN employees e ON a.id_empleado = e.id_empleado
      LEFT JOIN services s ON a.id_servicio = s.id_servicio
      WHERE a.id_cita = $1
    `,
      [id]
    );

    res.json(appointmentWithDetails.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al actualizar cita:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  } finally {
    client.release();
  }
};

// Eliminar una cita
export const deleteAppointment = async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  try {
    const result = await pool.query(
      "DELETE FROM appointments WHERE id_cita = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Cita no encontrada" });
    }

    res.json({ message: "Cita eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar cita:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Cambiar estado de una cita
export const updateAppointmentStatus = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  if (isNaN(id)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  if (
    !estado ||
    !["pendiente", "confirmada", "completada", "cancelada"].includes(estado)
  ) {
    return res.status(400).json({
      message:
        "Estado inválido. Debe ser: pendiente, confirmada, completada o cancelada",
    });
  }

  try {
    const result = await pool.query(
      "UPDATE appointments SET estado = $1 WHERE id_cita = $2 RETURNING *",
      [estado, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Cita no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar estado de cita:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Verificar disponibilidad de un empleado para una nueva cita
export const checkEmployeeAvailability = async (req, res) => {
  const { employeeId, startDate, endDate, appointmentId } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({
      message: "Se requieren fechas de inicio y fin",
    });
  }

  try {
    // Caso especial para contar citas en un rango horario sin importar el empleado
    if (employeeId === "contar_reservas") {
      let query = `
        SELECT COUNT(*) FROM appointments
        WHERE (
          (fecha_inicio <= $1 AND fecha_fin >= $1)
          OR (fecha_inicio <= $2 AND fecha_fin >= $2)
          OR (fecha_inicio >= $1 AND fecha_fin <= $2)
        )
        AND estado != 'cancelada'
      `;

      const params = [endDate, startDate];

      // Si hay una cita a excluir (para edición)
      if (appointmentId) {
        query += ` AND id_cita != $3`;
        params.push(appointmentId);
      }

      const result = await pool.query(query, params);
      return res.json(parseInt(result.rows[0].count));
    }

    // Para "sin_asignar", siempre está disponible pero contamos cuántas hay
    if (employeeId === "sin_asignar") {
      let query = `
        SELECT COUNT(*) FROM appointments
        WHERE (
          (fecha_inicio <= $1 AND fecha_fin >= $1)
          OR (fecha_inicio <= $2 AND fecha_fin >= $2)
          OR (fecha_inicio >= $1 AND fecha_fin <= $2)
        )
        AND estado != 'cancelada'
      `;

      const params = [endDate, startDate];

      // Si hay una cita a excluir (para edición)
      if (appointmentId) {
        query += ` AND id_cita != $3`;
        params.push(appointmentId);
      }

      const result = await pool.query(query, params);
      return res.json({
        disponible: true,
        reservasExistentes: parseInt(result.rows[0].count),
      });
    }

    // Para profesionales específicos
    let query = `
      SELECT COUNT(*) FROM appointments
      WHERE 
        id_empleado = $1
        AND (
          (fecha_inicio <= $2 AND fecha_fin >= $2)
          OR (fecha_inicio <= $3 AND fecha_fin >= $3)
          OR (fecha_inicio >= $2 AND fecha_fin <= $3)
        )
        AND estado != 'cancelada'
    `;

    const params = [employeeId, endDate, startDate];

    // Si hay una cita a excluir (para edición)
    if (appointmentId) {
      query += ` AND id_cita != $4`;
      params.push(appointmentId);
    }
    const result = await pool.query(query, params);
    const reservasExistentes = parseInt(result.rows[0].count);

    // No hay límite de citas simultáneas - siempre disponible
    return res.json({
      disponible: true, // Siempre permitimos citas simultáneas
      reservasExistentes: reservasExistentes,
    });
  } catch (error) {
    console.error("Error al verificar disponibilidad:", error);
    res.status(500).json({
      message: "Error al verificar disponibilidad del profesional",
    });
  }
};
