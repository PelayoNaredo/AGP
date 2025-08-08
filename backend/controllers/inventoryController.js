import pool from "../db.js"; // importamos la conexion a la bd

// Obtener todos los productos del inventario (filtrados automáticamente por RLS)
export const getAllInventory = async (req, res) => {
  try {
    // ← CAMBIO: RLS filtra automáticamente por company_id
    const result = await pool.query(
      "SELECT * FROM inventory ORDER BY nombre_producto"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener el inventario:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Obtener un producto por ID (RLS automático)
export const getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    // ← CAMBIO: RLS garantiza que solo se vean productos de la empresa actual
    const result = await pool.query(
      "SELECT * FROM inventory WHERE id_producto = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener el producto:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Crear un nuevo producto (ahora incluye company_id automáticamente)
export const createProduct = async (req, res) => {
  const {
    nombre_producto,
    descripcion,
    cantidad_actual,
    cantidad_minima,
    precio_unitario,
    id_proveedor,
    fecha_actualizacion,
    referencia,
    pvp,
  } = req.body;
  try {
    // ← CAMBIO: Incluir company_id del contexto de tenant
    const result = await pool.query(
      `INSERT INTO inventory (company_id, nombre_producto, descripcion, cantidad_actual, cantidad_minima, precio_unitario, id_proveedor, fecha_actualizacion, referencia, pvp)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        req.companyId, // ← NUEVO: company_id del middleware tenantContext
        nombre_producto,
        descripcion,
        cantidad_actual,
        cantidad_minima,
        precio_unitario,
        id_proveedor,
        fecha_actualizacion,
        referencia,
        pvp,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear el producto:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Actualizar un producto
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const {
    nombre_producto,
    descripcion,
    cantidad_actual,
    cantidad_minima,
    precio_unitario,
    id_proveedor,
    fecha_actualizacion,
    referencia,
    pvp,
  } = req.body;
  try {
    const result = await pool.query(
      `UPDATE inventory
             SET nombre_producto = $1, descripcion = $2, cantidad_actual = $3, cantidad_minima = $4, precio_unitario = $5, id_proveedor = $6, fecha_actualizacion = $7, referencia = $8, pvp = $9
             WHERE id_producto = $10 RETURNING *`,
      [
        nombre_producto,
        descripcion,
        cantidad_actual,
        cantidad_minima,
        precio_unitario,
        id_proveedor,
        fecha_actualizacion,
        referencia,
        pvp,
        id,
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar el producto:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Eliminar un producto
export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM inventory WHERE id_producto = $1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    res.json({ message: "Producto eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar el producto:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Función para actualizar cantidades de productos después de una venta
export const updateSaleQuantities = async (req, res) => {
  const { productos } = req.body;

  if (!productos || !Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({
      status: 400,
      message:
        "Formato incorrecto. Se requiere un array de productos con id_producto y cantidad_vendida",
    });
  }

  try {
    // Iniciamos una transacción para asegurar la integridad de los datos
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      let updatedProducts = [];
      let productsWithError = [];

      // Procesar cada producto en la lista
      for (const producto of productos) {
        const { id_producto, cantidad_vendida } = producto;

        if (!id_producto || !cantidad_vendida) {
          productsWithError.push({
            id_producto,
            error: "ID de producto o cantidad vendida no especificados",
          });
          continue;
        }

        // Obtener información actual del producto
        const productResult = await client.query(
          "SELECT * FROM inventory WHERE id_producto = $1",
          [id_producto]
        );

        if (productResult.rows.length === 0) {
          productsWithError.push({
            id_producto,
            error: "Producto no encontrado",
          });
          continue;
        }

        const product = productResult.rows[0];

        // Calcular la nueva cantidad
        const nuevaCantidad = Math.max(
          0,
          product.cantidad_actual - cantidad_vendida
        );

        // Actualizar el producto en la base de datos
        const updateResult = await client.query(
          `UPDATE inventory 
           SET cantidad_actual = $1, fecha_actualizacion = CURRENT_DATE
           WHERE id_producto = $2
           RETURNING *`,
          [nuevaCantidad, id_producto]
        );

        if (updateResult.rows.length > 0) {
          updatedProducts.push(updateResult.rows[0]);
        } else {
          productsWithError.push({
            id_producto,
            error: "No se pudo actualizar el producto",
          });
        }
      }

      // Si hay productos con error pero algunos se actualizaron, hacemos commit de los cambios
      if (updatedProducts.length > 0) {
        await client.query("COMMIT");
      } else if (productsWithError.length > 0) {
        // Si ninguno se actualizó y hay errores, revertimos los cambios
        await client.query("ROLLBACK");
        return res.status(400).json({
          status: 400,
          message: "No se pudo actualizar ningún producto",
          errors: productsWithError,
        });
      }

      return res.status(200).json({
        status: 200,
        message: `${updatedProducts.length} productos actualizados correctamente`,
        updated: updatedProducts,
        errors: productsWithError.length > 0 ? productsWithError : undefined,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error al actualizar inventario después de venta:", error);
    return res.status(500).json({
      status: 500,
      message: "Error al actualizar el inventario",
      error: error.message,
    });
  }
};
