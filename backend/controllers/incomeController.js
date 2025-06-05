import pool from "../db.js"; // importamos la conexion a la bd

// Obtener todos los ingresos
export const getAllIncome = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM income ORDER BY fecha_ingreso DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener ingresos:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Obtener un ingreso por ID
export const getIncomeById = async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM income WHERE id_ingreso = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Ingreso no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener ingreso:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Crear un nuevo ingreso
export const createIncome = async (req, res) => {
  const {
    fecha_ingreso,
    ingresos,
    concepto,
    categoria,
    comentarios,
    metodo_ingreso,
  } = req.body;

  if (!ingresos || isNaN(parseFloat(ingresos))) {
    return res.status(400).json({ message: "Monto de ingresos inválido" });
  }

  if (!concepto) {
    return res.status(400).json({ message: "El concepto es obligatorio" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO income (fecha_ingreso, ingresos, concepto, categoria, comentarios, metodo_ingreso)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        fecha_ingreso || new Date(),
        ingresos,
        concepto,
        categoria,
        comentarios,
        metodo_ingreso,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear ingreso:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Actualizar un ingreso existente
export const updateIncome = async (req, res) => {
  const { id } = req.params;
  const {
    fecha_ingreso,
    ingresos,
    concepto,
    categoria,
    comentarios,
    metodo_ingreso,
  } = req.body;

  if (isNaN(id)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  try {
    const result = await pool.query(
      `UPDATE income 
       SET fecha_ingreso = COALESCE($1, fecha_ingreso),
           ingresos = COALESCE($2, ingresos),
           concepto = COALESCE($3, concepto),
           categoria = COALESCE($4, categoria),
           comentarios = COALESCE($5, comentarios),
           metodo_ingreso = COALESCE($6, metodo_ingreso)
       WHERE id_ingreso = $7 RETURNING *`,
      [
        fecha_ingreso,
        ingresos,
        concepto,
        categoria,
        comentarios,
        metodo_ingreso,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Ingreso no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar ingreso:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Eliminar un ingreso
export const deleteIncome = async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  try {
    const result = await pool.query(
      `DELETE FROM income WHERE id_ingreso = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Ingreso no encontrado" });
    }

    res.json({ message: "Ingreso eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar ingreso:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Verificar si ya existe un cierre diario para una fecha específica
export const getDailyClosureByDate = async (req, res) => {
  const { date } = req.params;

  if (!date) {
    return res
      .status(400)
      .json({ message: "Se requiere especificar una fecha" });
  }

  try {
    // Convertir la fecha a un objeto Date para trabajar con ella
    const targetDate = new Date(date);

    // Formato ISO para usar en la consulta
    const formattedDate = targetDate.toISOString().split("T")[0];

    const result = await pool.query(
      `SELECT * FROM income 
       WHERE DATE(fecha_ingreso) = $1 
       AND comentarios LIKE 'Cierre diario%'`,
      [formattedDate]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error al verificar cierre diario:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Realizar cierre diario de ventas
export const createDailyClosure = async (req, res) => {
  const { fecha_ingreso, ingresos, comentarios } = req.body;

  if (!fecha_ingreso) {
    return res
      .status(400)
      .json({ message: "Se requiere especificar una fecha" });
  }

  if (isNaN(parseFloat(ingresos))) {
    return res.status(400).json({ message: "Monto de ingresos inválido" });
  }

  try {
    // Verificar si ya existe un cierre para esta fecha
    const checkResult = await pool.query(
      `SELECT COUNT(*) FROM income 
       WHERE DATE(fecha_ingreso) = $1 
       AND comentarios LIKE 'Cierre diario%'`,
      [fecha_ingreso]
    );

    if (parseInt(checkResult.rows[0].count) > 0) {
      return res.status(409).json({
        message: "Ya existe un cierre diario para esta fecha",
        canForce: true,
      });
    }

    // Registrar el cierre diario como un ingreso
    const cierreComentario = comentarios || `Cierre diario ${fecha_ingreso}`;
    const cierreConcepto = "Cierre Diario";
    const cierreCategoria = "cierre";
    const cierreMetodoIngreso = "multiple";

    const result = await pool.query(
      `INSERT INTO income (fecha_ingreso, ingresos, concepto, categoria, comentarios, metodo_ingreso)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        fecha_ingreso,
        ingresos,
        cierreConcepto,
        cierreCategoria,
        cierreComentario,
        cierreMetodoIngreso,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear cierre diario:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Obtener resumen de ingresos por período
export const getIncomeByPeriod = async (req, res) => {
  const { period } = req.params;
  const validPeriods = ["day", "week", "month", "year"];

  if (!validPeriods.includes(period)) {
    return res.status(400).json({
      message: "Período inválido. Debe ser: day, week, month o year",
    });
  }

  try {
    const result = await pool.query(
      `SELECT DATE_TRUNC($1, fecha_ingreso) as periodo,
              SUM(ingresos) as total_ingresos,
              COUNT(*) as num_transacciones,
              array_agg(DISTINCT categoria) as categorias
       FROM income
       GROUP BY DATE_TRUNC($1, fecha_ingreso)
       ORDER BY DATE_TRUNC($1, fecha_ingreso) DESC`,
      [period]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener resumen de ingresos:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
