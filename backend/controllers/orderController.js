import pool from "../db.js";

// Obtener todas las órdenes
export const getAllOrders = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "orders"');
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener las órdenes:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Obtener una orden por ID
export const getOrderById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM "orders" WHERE id_pedido = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener la orden:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Crear una nueva orden
export const createOrder = async (req, res) => {
  const {
    id_proveedor,
    id_gasto,
    fecha_entrega_estimada,
    estado,
    total,
    metodo_pago,
    comentarios,
  } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO "orders" (id_proveedor, id_gasto, fecha_entrega_estimada, estado, total, metodo_pago, comentarios)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        id_proveedor,
        id_gasto,
        fecha_entrega_estimada,
        estado,
        total,
        metodo_pago,
        comentarios,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear la orden:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Actualizar una orden existente
export const updateOrder = async (req, res) => {
  const { id } = req.params;
  const {
    id_proveedor,
    id_gasto,
    fecha_entrega_estimada,
    estado,
    total,
    metodo_pago,
    comentarios,
  } = req.body;
  try {
    const result = await pool.query(
      `UPDATE "orders"
             SET id_proveedor = $1, id_gasto = $2, fecha_entrega_estimada = $3, estado = $4, total = $5, metodo_pago = $6, comentarios = $7
             WHERE id_pedido = $8 RETURNING *`,
      [
        id_proveedor,
        id_gasto,
        fecha_entrega_estimada,
        estado,
        total,
        metodo_pago,
        comentarios,
        id,
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar la orden:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Eliminar una orden
export const deleteOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM "orders" WHERE id_pedido = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }
    res.json({ message: "Orden eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar la orden:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
