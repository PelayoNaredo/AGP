import pool from "../db.js"; // importamos la conexion a la bd

// Obtener todos los horarios
export const getAllShifts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, si.*
      FROM shifts s
      LEFT JOIN shift_intervals si ON s.id_horario = si.id_horario
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener horarios:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Obtener un horario por ID
export const getShiftById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `
      SELECT s.*, si.*
      FROM shifts s
      LEFT JOIN shift_intervals si ON s.id_horario = si.id_horario
      WHERE s.id_horario = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Horario no encontrado" });
    }

    // Estructurar la respuesta
    const shift = {
      ...result.rows[0],
      intervals: result.rows.map((row) => ({
        dia_semana: row.dia_semana,
        hora_entrada: row.hora_entrada,
        hora_salida: row.hora_salida,
      })),
    };

    res.json(shift);
  } catch (error) {
    console.error("Error al obtener el horario:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Crear o actualizar un horario
export const saveShift = async (req, res) => {
  const { id_empleado, fecha_inicio_semana, updates } = req.body;

  if (!updates || typeof updates !== "object") {
    return res.status(400).json({
      message: "El campo 'updates' es requerido y debe ser un objeto",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Verificar si ya existe un registro en shifts
    let shiftResult = await client.query(
      "SELECT * FROM shifts WHERE id_empleado = $1 AND fecha_inicio_semana = $2",
      [id_empleado, fecha_inicio_semana]
    );

    let shiftId;
    if (shiftResult.rows.length === 0) {
      // Crear nuevo registro en shifts
      const insertShiftResult = await client.query(
        "INSERT INTO shifts (id_empleado, fecha_inicio_semana) VALUES ($1, $2) RETURNING id_horario",
        [id_empleado, fecha_inicio_semana]
      );
      shiftId = insertShiftResult.rows[0].id_horario;
    } else {
      shiftId = shiftResult.rows[0].id_horario;
    }

    // Extraer el día y los horarios del update
    const dia_semana = Object.keys(updates)[0].charAt(1);
    const entrada = updates[`h${dia_semana}_entrada`];
    const salida = updates[`h${dia_semana}_salida`];

    // Eliminar intervalos existentes para ese día
    await client.query(
      "DELETE FROM shift_intervals WHERE id_horario = $1 AND dia_semana = $2",
      [shiftId, dia_semana]
    );

    // Si hay horarios nuevos, insertarlos
    if (entrada && salida) {
      await client.query(
        "INSERT INTO shift_intervals (id_horario, dia_semana, hora_entrada, hora_salida) VALUES ($1, $2, $3, $4)",
        [shiftId, dia_semana, entrada, salida]
      );
    }

    await client.query("COMMIT");

    // Obtener el horario actualizado
    const result = await client.query(
      `
      SELECT s.*, si.*
      FROM shifts s
      LEFT JOIN shift_intervals si ON s.id_horario = si.id_horario
      WHERE s.id_horario = $1
      `,
      [shiftId]
    );

    const shift = {
      ...result.rows[0],
      intervals: result.rows.map((row) => ({
        dia_semana: row.dia_semana,
        hora_entrada: row.hora_entrada,
        hora_salida: row.hora_salida,
      })),
    };

    res.json(shift);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al guardar horario:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  } finally {
    client.release();
  }
};

// Eliminar un horario
export const deleteShift = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Eliminar primero los intervalos
    await client.query("DELETE FROM shift_intervals WHERE id_horario = $1", [
      id,
    ]);

    // Luego eliminar el turno principal
    const result = await client.query(
      "DELETE FROM shifts WHERE id_horario = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Horario no encontrado" });
    }

    await client.query("COMMIT");
    res.json({ message: "Horario eliminado correctamente" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al eliminar el horario:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  } finally {
    client.release();
  }
};

// Obtener horarios por fecha de inicio de la semana
export const getShiftByDate = async (req, res) => {
  const { fecha_inicio_semana } = req.params;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Obtener todos los empleados activos
    const employees = await client.query(
      "SELECT * FROM employees WHERE activo = true"
    );

    // Obtener todos los turnos para la semana
    const shiftsResult = await client.query(
      `
      SELECT s.id_horario, s.id_empleado, s.fecha_inicio_semana, 
             si.dia_semana, si.hora_entrada, si.hora_salida
      FROM shifts s
      LEFT JOIN shift_intervals si ON s.id_horario = si.id_horario
      WHERE s.fecha_inicio_semana = $1
      `,
      [fecha_inicio_semana]
    );

    // Crear estructura de respuesta
    const result = employees.rows.map((empleado) => {
      const empleadoShifts = shiftsResult.rows.filter(
        (s) => s.id_empleado === empleado.id_empleado
      );

      // Crear objeto base con información del empleado y turnos
      const shiftObj = {
        id_empleado: empleado.id_empleado,
        fecha_inicio_semana,
        intervals: empleadoShifts.map((s) => ({
          dia_semana: s.dia_semana,
          hora_entrada: s.hora_entrada,
          hora_salida: s.hora_salida,
        })),
      };

      return shiftObj;
    });

    await client.query("COMMIT");
    res.json(result);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al obtener horarios:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  } finally {
    client.release();
  }
};

// Agregar un nuevo intervalo a un turno
export const saveInterval = async (req, res) => {
  const { id } = req.params;
  const { dia_semana, hora_entrada, hora_salida } = req.body;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Verificar que el turno existe
    const shiftExists = await client.query(
      "SELECT * FROM shifts WHERE id_horario = $1",
      [id]
    );

    if (shiftExists.rows.length === 0) {
      return res.status(404).json({ message: "Turno no encontrado" });
    }

    // Eliminar los intervalos existentes para ese día y hora de entrada
    await client.query(
      "DELETE FROM shift_intervals WHERE id_horario = $1 AND dia_semana = $2 AND hora_entrada = $3",
      [id, dia_semana, hora_entrada]
    );

    // Insertar el nuevo intervalo
    const result = await client.query(
      "INSERT INTO shift_intervals (id_horario, dia_semana, hora_entrada, hora_salida) VALUES ($1, $2, $3, $4) RETURNING *",
      [id, dia_semana, hora_entrada, hora_salida]
    );

    await client.query("COMMIT");
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al guardar intervalo:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  } finally {
    client.release();
  }
};

// Eliminar un intervalo específico
export const deleteInterval = async (req, res) => {
  const { id, intervalId } = req.params;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      "DELETE FROM shift_intervals WHERE id_horario = $1 AND id_intervalo = $2 RETURNING *",
      [id, intervalId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Intervalo no encontrado" });
    }

    await client.query("COMMIT");
    res.json({ message: "Intervalo eliminado correctamente" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al eliminar intervalo:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  } finally {
    client.release();
  }
};

// Obtener horarios mensuales para exportación
export const getMonthlyShiftsForExport = async (req, res) => {
  const { fecha_inicio_mes } = req.params;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Validar y parsear la fecha
    const mesInicio = new Date(fecha_inicio_mes);
    if (isNaN(mesInicio)) {
      return res.status(400).json({ message: "Fecha inválida" });
    }

    // Determinar el mes y año
    const mes = mesInicio.getMonth() + 1; // Enero es 0, así que sumamos 1
    const anio = mesInicio.getFullYear();

    // Obtener todos los empleados activos
    const employees = await client.query(
      "SELECT * FROM employees WHERE activo = true"
    );

    // Obtener todos los turnos del mes solicitado (cualquier semana que comience en ese mes)
    const shiftsResult = await client.query(
      `
      SELECT s.id_horario, s.id_empleado, s.fecha_inicio_semana, 
             si.id_intervalo, si.dia_semana, si.hora_entrada, si.hora_salida
      FROM shifts s
      LEFT JOIN shift_intervals si ON s.id_horario = si.id_horario
      WHERE EXTRACT(MONTH FROM s.fecha_inicio_semana::date) = $1
      AND EXTRACT(YEAR FROM s.fecha_inicio_semana::date) = $2
      ORDER BY s.id_empleado, si.dia_semana, si.hora_entrada
      `,
      [mes, anio]
    );

    // Si no hay datos para ese mes, buscar los datos más recientes
    let finalShiftRows = shiftsResult.rows;
    let fechaReferencia = fecha_inicio_mes;

    if (shiftsResult.rowCount === 0) {
      // Buscar los datos de horarios más recientes disponibles
      const ultimaFechaQuery = await client.query(
        `SELECT MAX(fecha_inicio_semana) as ultima_fecha FROM shifts`
      );

      if (ultimaFechaQuery.rows[0]?.ultima_fecha) {
        const ultimaFecha = ultimaFechaQuery.rows[0].ultima_fecha;

        const datosUltimoMes = await client.query(
          `
          SELECT s.id_horario, s.id_empleado, s.fecha_inicio_semana, 
                 si.id_intervalo, si.dia_semana, si.hora_entrada, si.hora_salida
          FROM shifts s
          LEFT JOIN shift_intervals si ON s.id_horario = si.id_horario
          WHERE fecha_inicio_semana = $1
          ORDER BY s.id_empleado, si.dia_semana, si.hora_entrada
          `,
          [ultimaFecha]
        );

        if (datosUltimoMes.rowCount > 0) {
          finalShiftRows = datosUltimoMes.rows;
          fechaReferencia = ultimaFecha;
        }
      }
    }

    // Crear estructura de respuesta con los datos adaptados para exportación
    const result = employees.rows.map((empleado) => {
      // Filtrar los intervalos para este empleado
      const empleadoShifts = finalShiftRows.filter(
        (s) => s.id_empleado === empleado.id_empleado
      );

      // Crear objeto base con información del empleado y turnos
      const shiftObj = {
        id_empleado: empleado.id_empleado,
        fecha_inicio_semana: fechaReferencia,
        employee: {
          id_empleado: empleado.id_empleado,
          nombre: empleado.nombre,
          apellidos: empleado.apellidos,
          email: empleado.email,
        },
        intervals: [],
      };

      // Procesar los intervalos encontrados
      if (empleadoShifts.length > 0) {
        shiftObj.intervals = empleadoShifts
          .filter((s) => s.dia_semana !== null && s.hora_entrada !== null)
          .map((s) => ({
            id_intervalo: s.id_intervalo,
            dia_semana: s.dia_semana,
            hora_entrada: s.hora_entrada,
            hora_salida: s.hora_salida,
          }));
      } else {
        // Si no hay horarios definidos, crear horarios por defecto para días laborables
        for (let dia = 1; dia <= 5; dia++) {
          // 1-5 representan Lunes a Viernes
          shiftObj.intervals.push({
            dia_semana: dia,
            hora_entrada: "09:00",
            hora_salida: "17:00",
          });
        }
      }

      return shiftObj;
    });

    await client.query("COMMIT");
    res.json(result);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al obtener horarios mensuales:", error);
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.toString() });
  } finally {
    client.release();
  }
};

// Copiar horarios de una semana a otra
export const copyShifts = async (req, res) => {
  const { source, target } = req.query;
  const client = await pool.connect();

  if (!source || !target) {
    return res.status(400).json({
      message:
        "Se requieren los parámetros 'source' (semana origen) y 'target' (semana destino)",
    });
  }

  try {
    await client.query("BEGIN");

    // Paso 1: Verificar si ya existen turnos en la semana destino
    const existingShifts = await client.query(
      "SELECT * FROM shifts WHERE fecha_inicio_semana = $1",
      [target]
    );

    // Si existen turnos, podemos eliminarlos o devolver un error
    if (existingShifts.rowCount > 0) {
      // Eliminar los turnos existentes y sus intervalos (se eliminarán en cascada)
      await client.query("DELETE FROM shifts WHERE fecha_inicio_semana = $1", [
        target,
      ]);
    }

    // Paso 2: Obtener los turnos de la semana origen
    const sourceShifts = await client.query(
      "SELECT * FROM shifts WHERE fecha_inicio_semana = $1",
      [source]
    );

    if (sourceShifts.rowCount === 0) {
      return res.status(404).json({
        message: "No se encontraron horarios en la semana origen",
      });
    }

    // Paso 3: Copiar cada turno a la semana destino
    let copiedShiftsCount = 0;
    for (const sourceShift of sourceShifts.rows) {
      // Crear el nuevo turno
      const newShiftResult = await client.query(
        "INSERT INTO shifts (id_empleado, fecha_inicio_semana) VALUES ($1, $2) RETURNING id_horario",
        [sourceShift.id_empleado, target]
      );

      const newShiftId = newShiftResult.rows[0].id_horario;

      // Obtener los intervalos del turno origen
      const sourceIntervals = await client.query(
        "SELECT * FROM shift_intervals WHERE id_horario = $1",
        [sourceShift.id_horario]
      );

      // Copiar cada intervalo
      for (const interval of sourceIntervals.rows) {
        await client.query(
          "INSERT INTO shift_intervals (id_horario, dia_semana, hora_entrada, hora_salida) VALUES ($1, $2, $3, $4)",
          [
            newShiftId,
            interval.dia_semana,
            interval.hora_entrada,
            interval.hora_salida,
          ]
        );
      }

      copiedShiftsCount++;
    }

    await client.query("COMMIT");

    res.json({
      message: "Horarios copiados correctamente",
      numShifts: copiedShiftsCount,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al copiar horarios:", error);
    res.status(500).json({
      message: "Error al copiar horarios",
      error: error.toString(),
    });
  } finally {
    client.release();
  }
};
