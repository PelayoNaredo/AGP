import pool from "../db.js"; // importamos la conexion a la bd

// Obtener gastos con paginación y búsqueda
export const getExpenses = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const search = req.query.search || "";
  const offset = (page - 1) * limit;

  try {
    // Consulta para obtener el total de registros
    const countQuery = await pool.query(
      `SELECT COUNT(*) FROM expenses 
       WHERE LOWER(concepto) LIKE LOWER($1) 
       OR LOWER(comentarios) LIKE LOWER($1)`,
      [`%${search}%`]
    );

    const total = parseInt(countQuery.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    // Consulta paginada con búsqueda
    const result = await pool.query(
      `SELECT * FROM expenses 
       WHERE LOWER(concepto) LIKE LOWER($1) 
       OR LOWER(comentarios) LIKE LOWER($1)
       ORDER BY fecha_gasto DESC
       LIMIT $2 OFFSET $3`,
      [`%${search}%`, limit, offset]
    );

    res.status(200).json({
      data: result.rows,
      totalPages,
      currentPage: page,
      totalItems: total,
    });
  } catch (err) {
    console.error("Error al obtener gastos:", err);
    res.status(500).json({ message: "Error al obtener gastos" });
  }
};

// Obtener gastos del mes
export const getExpensesByMonth = async (req, res) => {
  const { month, year, search = "" } = req.query;

  try {
    // Consulta para obtener los gastos del mes específico
    const result = await pool.query(
      `SELECT * FROM expenses 
       WHERE EXTRACT(MONTH FROM fecha_gasto) = $1 
       AND EXTRACT(YEAR FROM fecha_gasto) = $2
       AND (LOWER(concepto) LIKE LOWER($3) OR LOWER(comentarios) LIKE LOWER($3))
       ORDER BY fecha_gasto DESC`,
      [month, year, `%${search}%`]
    );

    res.status(200).json({
      data: result.rows,
      month,
      year,
    });
  } catch (err) {
    console.error("Error al obtener gastos:", err);
    res.status(500).json({ message: "Error al obtener gastos" });
  }
};

// Obtener un gasto por ID
export const getExpenseById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM expenses WHERE id_gasto = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Gasto no encontrado" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Error al obtener gasto:", err);
    res.status(500).json({ message: "Error al obtener gasto" });
  }
};

// Crear un nuevo gasto
export const createExpense = async (req, res) => {
  const { tipo_gasto, concepto, monto, fecha_gasto, comentarios } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO expenses (tipo_gasto, concepto, monto, fecha_gasto, comentarios) " +
        "VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [tipo_gasto, concepto, monto, fecha_gasto, comentarios]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error al crear gasto:", err);
    res.status(500).json({ message: "Error al crear gasto" });
  }
};

// Actualizar un gasto existente
export const updateExpense = async (req, res) => {
  const { id } = req.params;
  const { tipo_gasto, concepto, monto, fecha_gasto, comentarios } = req.body;
  try {
    const result = await pool.query(
      "UPDATE expenses SET tipo_gasto = $1, concepto = $2, monto = $3, fecha_gasto = $4, comentarios = $5 " +
        "WHERE id_gasto = $6 RETURNING *",
      [tipo_gasto, concepto, monto, fecha_gasto, comentarios, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Gasto no encontrado" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Error al actualizar gasto:", err);
    res.status(500).json({ message: "Error al actualizar gasto" });
  }
};

// Eliminar un gasto
export const deleteExpense = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM expenses WHERE id_gasto = $1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Gasto no encontrado" });
    }
    res.status(200).json({ message: "Gasto eliminado con éxito" });
  } catch (err) {
    console.error("Error al eliminar gasto:", err);
    res.status(500).json({ message: "Error al eliminar gasto" });
  }
};
