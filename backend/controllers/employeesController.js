import pool from "../db.js"; // importamos la conexion a la bd

// Obtener todos los empleados (filtrados automáticamente por RLS)
export const getAllEmployees = async (req, res) => {
  try {
    // ← CAMBIO: RLS filtra automáticamente por company_id
    const result = await pool.query("SELECT * FROM employees ORDER BY nombre");

    res.json(result.rows);
  } catch (error) {
    console.error("[ERROR] Error al obtener empleados:", error);
    res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// Obtener un empleado por ID (RLS automático)
export const getEmployeeById = async (req, res) => {
  const { id } = req.params;

  // Validar que el ID sea un número
  if (isNaN(id)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  try {
    // ← CAMBIO: RLS garantiza que solo se vean empleados de la empresa actual
    const result = await pool.query(
      "SELECT * FROM employees WHERE id_empleado = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Empleado no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener el empleado:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Eliminar un empleado
export const deleteEmployee = async (req, res) => {
  const { id } = req.params;

  // Validar que el ID sea un número
  if (isNaN(id)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  try {
    const result = await pool.query(
      "DELETE FROM employees WHERE id_empleado = $1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Empleado no encontrado" });
    }
    res.json({ message: "Empleado eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar el empleado:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Modifica todos los métodos para usar documentos como array
export const createEmployee = async (req, res) => {
  const {
    nombre,
    dni,
    nss,
    email,
    telefono,
    telefono_emergencia,
    direccion,
    codigo_postal,
    ciudad,
    pais,
    fecha_contratacion,
    fecha_nacimiento,
    cargo,
    departamento,
    horas_contratadas,
    tipo_contrato,
    salario,
    activo,
    notas,
  } = req.body;
  const documentos = req.files?.map((file) => file.filename) || [];

  try {
    // ← CAMBIO: Incluir company_id del contexto de tenant
    const result = await pool.query(
      `INSERT INTO employees (
        company_id, nombre, dni, nss, email, telefono, telefono_emergencia,
        direccion, codigo_postal, ciudad, pais,
        fecha_contratacion, fecha_nacimiento, cargo,
        departamento, horas_contratadas, tipo_contrato,
        salario, activo, documento_adjunto, notas
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *`,
      [
        req.companyId, // ← NUEVO: company_id del middleware tenantContext
        nombre,
        dni,
        nss,
        email,
        telefono,
        telefono_emergencia,
        direccion,
        codigo_postal,
        ciudad,
        pais,
        fecha_contratacion,
        fecha_nacimiento,
        cargo,
        departamento,
        horas_contratadas,
        tipo_contrato,
        salario,
        activo,
        documentos,
        notas,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear el empleado:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const updateEmployee = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const currentEmployee = await pool.query(
      "SELECT * FROM employees WHERE id_empleado = $1",
      [id]
    );

    if (currentEmployee.rows.length === 0) {
      return res.status(404).json({ message: "Empleado no encontrado" });
    }

    const updatedData = {
      ...currentEmployee.rows[0],
      ...updateData,
      nombre: updateData.nombre || currentEmployee.rows[0].nombre,
      dni: updateData.dni || currentEmployee.rows[0].dni,
      nss: updateData.nss || currentEmployee.rows[0].nss,
      email: updateData.email || currentEmployee.rows[0].email,
      telefono:
        updateData.telefono !== undefined
          ? updateData.telefono
          : currentEmployee.rows[0].telefono,
      telefono_emergencia:
        updateData.telefono_emergencia !== undefined
          ? updateData.telefono_emergencia
          : currentEmployee.rows[0].telefono_emergencia,
      direccion:
        updateData.direccion !== undefined
          ? updateData.direccion
          : currentEmployee.rows[0].direccion,
      codigo_postal:
        updateData.codigo_postal !== undefined
          ? updateData.codigo_postal
          : currentEmployee.rows[0].codigo_postal,
      ciudad:
        updateData.ciudad !== undefined
          ? updateData.ciudad
          : currentEmployee.rows[0].ciudad,
      pais:
        updateData.pais !== undefined
          ? updateData.pais
          : currentEmployee.rows[0].pais,
      fecha_contratacion:
        updateData.fecha_contratacion ||
        currentEmployee.rows[0].fecha_contratacion,
      fecha_nacimiento:
        updateData.fecha_nacimiento || currentEmployee.rows[0].fecha_nacimiento,
      cargo: updateData.cargo || currentEmployee.rows[0].cargo,
      departamento:
        updateData.departamento !== undefined
          ? updateData.departamento
          : currentEmployee.rows[0].departamento,
      horas_contratadas:
        updateData.horas_contratadas ||
        currentEmployee.rows[0].horas_contratadas,
      tipo_contrato:
        updateData.tipo_contrato || currentEmployee.rows[0].tipo_contrato,
      salario: updateData.salario || currentEmployee.rows[0].salario,
      activo:
        updateData.activo !== undefined
          ? updateData.activo
          : currentEmployee.rows[0].activo,
      documento_adjunto:
        updateData.documento_adjunto ||
        currentEmployee.rows[0].documento_adjunto,
      notas:
        updateData.notas !== undefined
          ? updateData.notas
          : currentEmployee.rows[0].notas,
    };

    const result = await pool.query(
      `UPDATE employees 
       SET nombre = $1, dni = $2, nss = $3, email = $4,
           telefono = $5, telefono_emergencia = $6,
           direccion = $7, codigo_postal = $8,
           ciudad = $9, pais = $10,
           fecha_contratacion = $11, fecha_nacimiento = $12,
           cargo = $13, departamento = $14,
           horas_contratadas = $15, tipo_contrato = $16,
           salario = $17, activo = $18,
           documento_adjunto = $19, notas = $20
       WHERE id_empleado = $21 
       RETURNING *`,
      [
        updatedData.nombre,
        updatedData.dni,
        updatedData.nss,
        updatedData.email,
        updatedData.telefono,
        updatedData.telefono_emergencia,
        updatedData.direccion,
        updatedData.codigo_postal,
        updatedData.ciudad,
        updatedData.pais,
        updatedData.fecha_contratacion,
        updatedData.fecha_nacimiento,
        updatedData.cargo,
        updatedData.departamento,
        updatedData.horas_contratadas,
        updatedData.tipo_contrato,
        updatedData.salario,
        updatedData.activo,
        updatedData.documento_adjunto,
        updatedData.notas,
        id,
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar el empleado:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const addEmployeeDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const nuevosDocumentos = req.files.map((file) => file.filename);

    const result = await pool.query(
      `UPDATE employees 
         SET documento_adjunto = documento_adjunto || $1
         WHERE id_empleado = $2 RETURNING *`,
      [nuevosDocumentos, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error añadiendo documentos:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const deleteEmployeeDocument = async (req, res) => {
  try {
    const { filename } = req.params;

    const result = await pool.query(
      `UPDATE employees 
         SET documento_adjunto = array_remove(documento_adjunto, $1)
         RETURNING *`,
      [filename]
    );

    res.json({ message: "Documento eliminado correctamente" });
  } catch (error) {
    console.error("Error eliminando documento:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
