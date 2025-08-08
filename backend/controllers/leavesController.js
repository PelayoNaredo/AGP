import pool from "../db.js"; // importamos la conexion a la bd

// Obtener todas las bajas (filtradas automáticamente por RLS)
export const getLeaves = async (req, res) => {
  try {
    // ← CAMBIO: RLS filtra automáticamente por company_id
    const result = await pool.query(
      "SELECT * FROM leaves ORDER BY fecha_inicio DESC"
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error al obtener bajas:", err);
    res.status(500).json({ message: "Error al obtener bajas" });
  }
};

// Obtener una baja por ID (RLS automático)
export const getLeaveById = async (req, res) => {
  const { id } = req.params;
  try {
    // ← CAMBIO: RLS garantiza que solo se vean bajas de la empresa actual
    const result = await pool.query("SELECT * FROM leaves WHERE id_baja = $1", [
      id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Baja no encontrada" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Error al obtener baja:", err);
    res.status(500).json({ message: "Error al obtener baja" });
  }
};

// Crear una nueva baja
export const createLeave = async (req, res) => {
  const { id_empleado, tipo_baja, fecha_inicio, fecha_fin, comentarios } =
    req.body;
  try {
    // ← CAMBIO: Incluir company_id del contexto de tenant
    const result = await pool.query(
      "INSERT INTO leaves (company_id, id_empleado, tipo_baja, fecha_inicio, fecha_fin, comentarios) " +
        "VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [
        req.companyId,
        id_empleado,
        tipo_baja,
        fecha_inicio,
        fecha_fin,
        comentarios,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error al crear baja:", err);
    res.status(500).json({ message: "Error al crear baja" });
  }
};

// controllers/leavesController.js (Código Mejorado)
export const updateLeave = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    // 1. Validar campos requeridos
    if (
      !updateData.tipo_baja ||
      !updateData.fecha_inicio ||
      !updateData.id_empleado
    ) {
      return res.status(400).json({
        message: "Campos requeridos: tipo_baja, fecha_inicio, id_empleado",
      });
    }

    // 2. Consulta SQL más robusta
    const result = await pool.query(
      `UPDATE leaves 
       SET id_empleado = $1, 
           tipo_baja = $2, 
           fecha_inicio = TO_DATE($3, 'YYYY-MM-DD'),
           fecha_fin = $4::DATE, 
           comentarios = $5 
       WHERE id_baja = $6 
       RETURNING *`,
      [
        updateData.id_empleado,
        updateData.tipo_baja,
        updateData.fecha_inicio,
        updateData.fecha_fin || null, // Manejar fecha opcional
        updateData.comentarios || "",
        id,
      ]
    );

    // 3. Mejor manejo de resultados
    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Baja no encontrada o ningún cambio aplicado",
      });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    // 4. Log detallado
    console.error("🔥 Error en updateLeave:", {
      error: err.message,
      query: err.query, // Asegúrate de que pool muestre la query
      parameters: err.parameters,
    });

    // 5. Mensajes de error específicos
    let errorMessage = "Error interno al actualizar baja";
    if (err.code === "23503") {
      // Foreign key violation
      errorMessage = "El empleado especificado no existe";
    } else if (err.code === "22007") {
      // Formato fecha inválido
      errorMessage = "Formato de fecha inválido (Use YYYY-MM-DD)";
    }

    res.status(500).json({
      message: errorMessage,
      errorCode: err.code,
      detail: err.detail,
    });
  }
};

// Eliminar una baja
export const deleteLeave = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM leaves WHERE id_baja = $1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Baja no encontrada" });
    }
    res.status(200).json({ message: "Baja eliminada con éxito" });
  } catch (err) {
    console.error("Error al eliminar baja:", err);
    res.status(500).json({ message: "Error al eliminar baja" });
  }
};
