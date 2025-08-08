import pool from "../db.js";

// =====================================================
// CONTROLADOR ACTUALIZADO CON MULTI-TENANCY
// Fecha: 8 de agosto de 2025
// Cambios: Agregado soporte para company_id y RLS
// =====================================================

// Obtener todos los clientes (ahora filtrado por empresa automáticamente con RLS)
export const getAllClients = async (req, res) => {
  try {
    // Con RLS habilitado, esta query solo retornará clientes de la empresa actual
    const result = await pool.query("SELECT * FROM clients ORDER BY nombre");
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error al obtener clientes:", err);
    res.status(500).json({ message: "Error al obtener clientes" });
  }
};

// Obtener un cliente por ID (RLS automático)
export const getClientById = async (req, res) => {
  const { id } = req.params;
  try {
    // RLS garantiza que solo se vean clientes de la empresa actual
    const result = await pool.query(
      "SELECT * FROM clients WHERE id_cliente = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Error al obtener cliente:", err);
    res.status(500).json({ message: "Error al obtener cliente" });
  }
};

// Crear un nuevo cliente (ahora incluye company_id automáticamente)
export const createClient = async (req, res) => {
  const {
    tipo_cliente,
    nombre,
    apellido,
    tipo_documento,
    documento,
    direccion,
    codigo_postal,
    ciudad,
    provincia,
    pais,
    telefono,
    email,
    razon_social,
    regimen_fiscal,
    tipo_iva,
    descuento_preferencial,
    notas,
  } = req.body;

  // Validación de campos obligatorios
  if (
    !tipo_cliente ||
    !tipo_documento ||
    !documento ||
    !direccion ||
    !codigo_postal ||
    !ciudad ||
    !provincia
  ) {
    return res.status(400).json({ message: "Faltan campos obligatorios" });
  }

  try {
    // ← CAMBIO: Incluir company_id del contexto de tenant
    const result = await pool.query(
      `INSERT INTO clients (
        company_id, tipo_cliente, nombre, apellido, tipo_documento, documento, 
        direccion, codigo_postal, ciudad, provincia, pais, 
        telefono, email, razon_social, regimen_fiscal, tipo_iva,
        descuento_preferencial, notas
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING *`,
      [
        req.companyId, // ← NUEVO: company_id del middleware tenantContext
        tipo_cliente,
        nombre || "",
        apellido || "",
        tipo_documento,
        documento,
        direccion,
        codigo_postal,
        ciudad,
        provincia,
        pais || "España",
        telefono || null,
        email || null,
        razon_social || null,
        regimen_fiscal || null,
        tipo_iva || "general",
        descuento_preferencial || 0,
        notas || null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error al crear cliente:", err);

    if (err.code === "23505") {
      // Error de duplicidad
      return res
        .status(409)
        .json({ message: "El documento ya está registrado" });
    }

    res.status(500).json({ message: "Error al crear cliente" });
  }
};

// Actualizar un cliente existente
export const updateClient = async (req, res) => {
  const { id } = req.params;
  const {
    tipo_cliente,
    nombre,
    apellido,
    tipo_documento,
    documento,
    direccion,
    codigo_postal,
    ciudad,
    provincia,
    pais,
    telefono,
    email,
    razon_social,
    regimen_fiscal,
    tipo_iva,
    descuento_preferencial,
    notas,
    fecha_ultima_compra,
  } = req.body;

  // Validar que existan los campos mínimos necesarios
  if (tipo_documento && !documento) {
    return res.status(400).json({
      message:
        "Si se cambia el tipo de documento, se debe proporcionar el documento",
    });
  }

  try {
    const result = await pool.query(
      `UPDATE clients SET
        tipo_cliente = COALESCE($1, tipo_cliente),
        nombre = COALESCE($2, nombre),
        apellido = COALESCE($3, apellido),
        tipo_documento = COALESCE($4, tipo_documento),
        documento = COALESCE($5, documento),
        direccion = COALESCE($6, direccion),
        codigo_postal = COALESCE($7, codigo_postal),
        ciudad = COALESCE($8, ciudad),
        provincia = COALESCE($9, provincia),
        pais = COALESCE($10, pais),
        telefono = COALESCE($11, telefono),
        email = COALESCE($12, email),
        razon_social = COALESCE($13, razon_social),
        regimen_fiscal = COALESCE($14, regimen_fiscal),
        tipo_iva = COALESCE($15, tipo_iva),
        descuento_preferencial = COALESCE($16, descuento_preferencial),
        notas = COALESCE($17, notas),
        fecha_ultima_compra = COALESCE($18, fecha_ultima_compra)
      WHERE id_cliente = $19 RETURNING *`,
      [
        tipo_cliente,
        nombre,
        apellido,
        tipo_documento,
        documento,
        direccion,
        codigo_postal,
        ciudad,
        provincia,
        pais,
        telefono,
        email,
        razon_social,
        regimen_fiscal,
        tipo_iva,
        descuento_preferencial,
        notas,
        fecha_ultima_compra,
        id,
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Error al actualizar cliente:", err);

    if (err.code === "23505") {
      return res
        .status(409)
        .json({ message: "El documento ya está registrado por otro cliente" });
    }

    res.status(500).json({ message: "Error al actualizar cliente" });
  }
};

// Eliminar un cliente
export const deleteClient = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM clients WHERE id_cliente = $1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }
    res.status(200).json({ message: "Cliente eliminado con éxito" });
  } catch (err) {
    console.error("Error al eliminar cliente:", err);

    if (err.code === "23503") {
      // Error de clave foránea
      return res.status(409).json({
        message:
          "No se puede eliminar el cliente porque tiene registros asociados",
      });
    }

    res.status(500).json({ message: "Error al eliminar cliente" });
  }
};

// Buscar clientes por término
export const searchClients = async (req, res) => {
  const { term } = req.query;

  if (!term) {
    return res
      .status(400)
      .json({ message: "Se requiere un término de búsqueda" });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM clients 
       WHERE LOWER(nombre) LIKE LOWER($1)
       OR LOWER(apellido) LIKE LOWER($1)
       OR LOWER(documento) LIKE LOWER($1)
       OR LOWER(email) LIKE LOWER($1)
       OR LOWER(telefono) LIKE LOWER($1)
       OR LOWER(razon_social) LIKE LOWER($1)
       ORDER BY nombre`,
      [`%${term}%`]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error al buscar clientes:", err);
    res.status(500).json({ message: "Error al buscar clientes" });
  }
};
