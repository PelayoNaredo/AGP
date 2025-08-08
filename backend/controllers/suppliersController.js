import pool from "../db.js";

// Obtener todos los proveedores (filtrados automáticamente por RLS)
export const getSuppliers = async (req, res) => {
  try {
    // ← CAMBIO: RLS filtra automáticamente por company_id
    const result = await pool.query(
      "SELECT * FROM suppliers ORDER BY nombre_proveedor"
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error al obtener proveedores:", err);
    res.status(500).json({ message: "Error al obtener proveedores" });
  }
};

// Obtener un proveedor por ID (RLS automático)
export const getSupplierById = async (req, res) => {
  const { id } = req.params;
  try {
    // ← CAMBIO: RLS garantiza que solo se vean proveedores de la empresa actual
    const result = await pool.query(
      "SELECT * FROM suppliers WHERE id_proveedor = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Error al obtener proveedor:", err);
    res.status(500).json({ message: "Error al obtener proveedor" });
  }
};

// Crear un nuevo proveedor (ahora incluye company_id automáticamente)
export const createSupplier = async (req, res) => {
  const {
    nombre_proveedor,
    contacto,
    telefono,
    email,
    plantilla_email,
    direccion_fiscal,
    cif, // Cambiado de rfc a cif
    condiciones_pago,
    dias_credito,
    cuenta_bancaria,
    moneda = "EUR", // Moneda por defecto EUR
    sitio_web,
    activo = true,
  } = req.body;

  try {
    // Validaciones básicas
    if (!nombre_proveedor || !cif) {
      return res
        .status(400)
        .json({ message: "Nombre y CIF son campos obligatorios" });
    }

    if (dias_credito && isNaN(parseInt(dias_credito))) {
      return res
        .status(400)
        .json({ message: "Días de crédito debe ser un número entero" });
    }

    // ← CAMBIO: Incluir company_id del contexto de tenant
    const result = await pool.query(
      `INSERT INTO suppliers (
        company_id, nombre_proveedor, contacto, telefono, email, plantilla_email,
        direccion_fiscal, cif, condiciones_pago, dias_credito,
        cuenta_bancaria, moneda, sitio_web, activo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        req.companyId, // ← NUEVO: company_id del middleware tenantContext
        nombre_proveedor,
        contacto,
        telefono,
        email,
        plantilla_email,
        direccion_fiscal,
        cif, // Sin formato específico
        condiciones_pago,
        parseInt(dias_credito) || null,
        cuenta_bancaria,
        moneda,
        sitio_web,
        activo,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error al crear proveedor:", err);

    if (err.code === "23505") {
      // Violación de unicidad CIF
      res.status(409).json({ message: "El CIF ya está registrado" });
    } else {
      res.status(500).json({ message: "Error al crear proveedor" });
    }
  }
};

// Actualizar un proveedor existente
export const updateSupplier = async (req, res) => {
  const { id } = req.params;
  const {
    nombre_proveedor,
    contacto,
    telefono,
    email,
    plantilla_email,
    direccion_fiscal,
    cif,
    condiciones_pago,
    dias_credito,
    cuenta_bancaria,
    moneda,
    sitio_web,
    activo,
  } = req.body;

  try {
    // Validaciones básicas
    if (!nombre_proveedor || !cif) {
      return res
        .status(400)
        .json({ message: "Nombre y CIF son campos obligatorios" });
    }

    if (dias_credito && isNaN(parseInt(dias_credito))) {
      return res
        .status(400)
        .json({ message: "Días de crédito debe ser un número entero" });
    }

    const result = await pool.query(
      `UPDATE suppliers SET
        nombre_proveedor = $1,
        contacto = $2,
        telefono = $3,
        email = $4,
        plantilla_email = $5,
        direccion_fiscal = $6,
        cif = $7,
        condiciones_pago = $8,
        dias_credito = $9,
        cuenta_bancaria = $10,
        moneda = $11,
        sitio_web = $12,
        activo = $13
      WHERE id_proveedor = $14
      RETURNING *`,
      [
        nombre_proveedor,
        contacto,
        telefono,
        email,
        plantilla_email,
        direccion_fiscal,
        cif,
        condiciones_pago,
        parseInt(dias_credito) || null,
        cuenta_bancaria,
        moneda,
        sitio_web,
        activo,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Error al actualizar proveedor:", err);

    if (err.code === "23505") {
      // Violación de unicidad CIF
      res.status(409).json({ message: "El CIF ya está registrado" });
    } else {
      res.status(500).json({ message: "Error al actualizar proveedor" });
    }
  }
};

// Eliminar un proveedor (sin cambios)
export const deleteSupplier = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM suppliers WHERE id_proveedor = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }

    res.status(200).json({ message: "Proveedor eliminado con éxito" });
  } catch (err) {
    console.error("Error al eliminar proveedor:", err);

    if (err.code === "23503") {
      // Violación de llave foránea
      res.status(409).json({
        message:
          "No se puede eliminar el proveedor porque tiene pedidos asociados",
      });
    } else {
      res.status(500).json({ message: "Error al eliminar proveedor" });
    }
  }
};
