import pool from "../db.js";

// Obtener todas las alertas
export const getAlerts = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM alerts ORDER BY fecha_recordatorio DESC"
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error al obtener alertas:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Obtener una alerta por ID
export const getAlertById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM alerts WHERE id_recordatorio = $1",
      [id]
    );
    result.rows.length === 0
      ? res.status(404).json({ message: "Alerta no encontrada" })
      : res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Error al obtener alerta:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Crear nueva alerta
export const createAlert = async (req, res) => {
  const { titulo, descripcion, fecha_recordatorio, estado, tipo, prioridad } =
    req.body;

  try {
    const result = await pool.query(
      `INSERT INTO alerts (
        titulo, 
        descripcion, 
        fecha_recordatorio, 
        estado, 
        tipo, 
        prioridad
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [titulo, descripcion, fecha_recordatorio, estado, tipo, prioridad]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error al crear alerta:", err);
    res.status(500).json({ message: "Error al crear la alerta" });
  }
};

// Actualizar alerta existente
export const updateAlert = async (req, res) => {
  const { id } = req.params;
  const { titulo, descripcion, fecha_recordatorio, estado, tipo, prioridad } =
    req.body;

  try {
    const result = await pool.query(
      `UPDATE alerts SET
        titulo = $1,
        descripcion = $2,
        fecha_recordatorio = $3,
        estado = $4,
        tipo = $5,
        prioridad = $6
      WHERE id_recordatorio = $7 RETURNING *`,
      [titulo, descripcion, fecha_recordatorio, estado, tipo, prioridad, id]
    );

    result.rows.length === 0
      ? res.status(404).json({ message: "Alerta no encontrada" })
      : res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Error al actualizar alerta:", err);
    res.status(500).json({ message: "Error al actualizar la alerta" });
  }
};

// Eliminar alerta
export const deleteAlert = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM alerts WHERE id_recordatorio = $1 RETURNING *",
      [id]
    );

    result.rows.length === 0
      ? res.status(404).json({ message: "Alerta no encontrada" })
      : res.status(200).json({ message: "Alerta eliminada correctamente" });
  } catch (err) {
    console.error("Error al eliminar alerta:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
