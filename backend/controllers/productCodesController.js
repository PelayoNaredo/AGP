import pool from "../db.js";

// Obtener todos los códigos de productos
export const getAllProductCodes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT pc.*, i.nombre_producto
      FROM product_codes pc
      JOIN inventory i ON pc.id_producto = i.id_producto
      ORDER BY pc.fecha_creacion DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener códigos de productos:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Obtener códigos por ID de producto
export const getProductCodesByProductId = async (req, res) => {
  const { productId } = req.params;

  if (isNaN(productId)) {
    return res.status(400).json({ message: "ID de producto inválido" });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM product_codes WHERE id_producto = $1`,
      [productId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener códigos de producto:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Obtener código por valor de código
export const getProductByCode = async (req, res) => {
  const { code } = req.params;

  try {
    const result = await pool.query(
      `SELECT pc.*, i.nombre_producto, i.precio_unitario, i.cantidad_actual
       FROM product_codes pc
       JOIN inventory i ON pc.id_producto = i.id_producto
       WHERE pc.codigo = $1`,
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Código no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al buscar código:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Crear un nuevo código de producto
export const createProductCode = async (req, res) => {
  const { id_producto, codigo, tipo_codigo } = req.body;

  try {
    // Verificar que el producto existe
    const productCheck = await pool.query(
      "SELECT id_producto FROM inventory WHERE id_producto = $1",
      [id_producto]
    );

    if (productCheck.rows.length === 0) {
      return res.status(404).json({ message: "El producto no existe" });
    }

    // Verificar si el código ya existe
    const codeCheck = await pool.query(
      "SELECT * FROM product_codes WHERE codigo = $1",
      [codigo]
    );

    if (codeCheck.rows.length > 0) {
      return res.status(409).json({ message: "El código ya está registrado" });
    }

    // Insertar nuevo código
    const result = await pool.query(
      `INSERT INTO product_codes (id_producto, codigo, tipo_codigo)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id_producto, codigo, tipo_codigo]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear código de producto:", error);

    if (error.code === "23505") {
      // Violación de unicidad
      return res.status(409).json({ message: "El código ya está registrado" });
    }

    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Actualizar un código de producto
export const updateProductCode = async (req, res) => {
  const { id } = req.params;
  const { id_producto, codigo, tipo_codigo } = req.body;

  try {
    // Verificar que el producto existe
    const productCheck = await pool.query(
      "SELECT id_producto FROM inventory WHERE id_producto = $1",
      [id_producto]
    );

    if (productCheck.rows.length === 0) {
      return res.status(404).json({ message: "El producto no existe" });
    }

    // Actualizar código
    const result = await pool.query(
      `UPDATE product_codes
       SET id_producto = $1, codigo = $2, tipo_codigo = $3
       WHERE id_codigo = $4
       RETURNING *`,
      [id_producto, codigo, tipo_codigo, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Código no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar código de producto:", error);

    if (error.code === "23505") {
      // Violación de unicidad
      return res.status(409).json({ message: "El código ya está registrado" });
    }

    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Eliminar un código de producto
export const deleteProductCode = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM product_codes WHERE id_codigo = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Código no encontrado" });
    }

    res.json({ message: "Código eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar código de producto:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Verificar si un código ya existe
export const checkCodeExists = async (req, res) => {
  const { code } = req.params;

  try {
    const result = await pool.query(
      "SELECT COUNT(*) FROM product_codes WHERE codigo = $1",
      [code]
    );

    const exists = parseInt(result.rows[0].count) > 0;

    res.json({ exists });
  } catch (error) {
    console.error("Error al verificar código:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Escanear un código de producto y devolver la información del producto
export const scanProductCode = async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ message: "El código es requerido" });
  }

  try {
    // Buscar el código en la base de datos
    const result = await pool.query(
      `
      SELECT pc.*, 
             i.id_producto, i.nombre_producto, i.descripcion, 
             i.precio_unitario, i.precio_mayorista, i.impuesto,
             i.cantidad_actual, i.imagen_url
      FROM product_codes pc
      JOIN inventory i ON pc.id_producto = i.id_producto
      WHERE pc.codigo = $1
    `,
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Código no encontrado",
      });
    }

    // Actualizar último escaneo
    await pool.query(
      `
      UPDATE product_codes
      SET ultimo_escaneo = CURRENT_TIMESTAMP,
          contador_escaneos = contador_escaneos + 1
      WHERE id_codigo = $1
    `,
      [result.rows[0].id_codigo]
    );

    // Devolver el producto encontrado
    res.json({
      success: true,
      product: result.rows[0],
    });
  } catch (error) {
    console.error("Error al escanear código de producto:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};

// Obtener un código de producto por ID
export const getProductCodeById = async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({ message: "ID de código inválido" });
  }

  try {
    const result = await pool.query(
      `
      SELECT pc.*, i.nombre_producto
      FROM product_codes pc
      JOIN inventory i ON pc.id_producto = i.id_producto
      WHERE pc.id_codigo = $1
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Código no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener código de producto:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
