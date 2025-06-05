import pool from "../db.js";

// Obtener todos los detalles de órdenes
export const getAllOrderDetails = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM order_detail");
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener los detalles de la orden:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Obtener un detalle de orden por ID
export const getOrderDetailById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM order_detail WHERE id_detalle = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Detalle de orden no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener el detalle de la orden:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Crear un nuevo detalle de orden
export const createOrderDetail = async (req, res) => {
  const { id_pedido, id_producto, cantidad, precio_unitario } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO order_detail (id_pedido, id_producto, cantidad, precio_unitario)
             VALUES ($1, $2, $3, $4) RETURNING *`,
      [id_pedido, id_producto, cantidad, precio_unitario]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear el detalle de la orden:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Actualizar un detalle de orden
export const updateOrderDetail = async (req, res) => {
  const { id } = req.params;
  const { id_pedido, id_producto, cantidad, precio_unitario } = req.body;
  try {
    const result = await pool.query(
      `UPDATE order_detail
             SET id_pedido = $1, id_producto = $2, cantidad = $3, precio_unitario = $4
             WHERE id_detalle = $5 RETURNING *`,
      [id_pedido, id_producto, cantidad, precio_unitario, id]
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Detalle de orden no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar el detalle de la orden:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Eliminar un detalle de orden
export const deleteOrderDetail = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM order_detail WHERE id_detalle = $1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Detalle de orden no encontrado" });
    }
    res.json({ message: "Detalle de orden eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar el detalle de la orden:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
