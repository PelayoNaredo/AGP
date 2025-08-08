import pool from "../db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// =====================================================
// CONTROLADOR ACTUALIZADO CON MULTI-TENANCY
// Fecha: 8 de agosto de 2025
// Cambios: Agregado soporte para company_id y RLS
// =====================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MEDIA_DIR = path.join(__dirname, "..", "media");

const cleanOldLogo = async (oldLogoUrl) => {
  if (!oldLogoUrl) return;

  try {
    const filename = oldLogoUrl.split("/api/media/")[1];
    if (!filename) return;

    const filePath = path.join(MEDIA_DIR, filename);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (error) {
    console.error("Error al eliminar logo anterior:", error);
  }
};

// Obtener un ajuste por ID (RLS automático)
export const getSettingById = async (req, res) => {
  const { id } = req.params;
  try {
    // ← CAMBIO: RLS garantiza que solo se vean ajustes de la empresa actual
    const result = await pool.query(
      "SELECT * FROM settings WHERE id_ajuste = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Ajuste no encontrado" });
    }
    const setting = result.rows[0];
    res.json(setting);
  } catch (error) {
    console.error("Error al obtener el ajuste:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Crear un nuevo ajuste (ahora incluye company_id automáticamente)
export const createSetting = async (req, res) => {
  const {
    nombre_local,
    direccion,
    telefono,
    url_backend,
    horario_apertura,
    horario_cierre,

    logo_local,
    tema,
  } = req.body;
  try {
    // ← CAMBIO: Incluir company_id del contexto de tenant
    const result = await pool.query(
      `INSERT INTO settings (company_id, nombre_local, direccion, telefono, url_backend, horario_apertura, horario_cierre, logo_local, tema)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        req.companyId, // ← NUEVO: company_id del middleware tenantContext
        nombre_local,
        direccion,
        telefono,
        url_backend,
        horario_apertura,
        horario_cierre,
        logo_local,
        tema,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear el ajuste:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Actualizar un ajuste
export const updateSetting = async (req, res) => {
  const { id } = req.params;
  const {
    nombre_local,
    direccion,
    telefono,
    url_backend,
    horario_apertura,
    horario_cierre,
    logo_local,
    tema,
  } = req.body;
  try {
    const result = await pool.query(
      `UPDATE settings
             SET nombre_local = $1, direccion = $2, telefono = $3, url_backend = $4, horario_apertura = $5, horario_cierre = $6,
                   logo_local = $7, tema = $8
             WHERE id_ajuste = $9 RETURNING *`,
      [
        nombre_local,
        direccion,
        telefono,
        url_backend,
        horario_apertura,
        horario_cierre,
        logo_local,
        tema,
        id,
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Ajuste no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar el ajuste:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const updateSettingLogo = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (!req.file) {
      return res
        .status(400)
        .json({ message: "No se ha subido ningún archivo" });
    }

    // Verificar que el archivo existe
    if (!fs.existsSync(req.file.path)) {
      return res.status(500).json({ message: "Error al guardar el archivo" });
    }

    // Obtener el logo actual antes de actualizarlo (RLS automático)
    const currentSettings = await client.query(
      "SELECT logo_local FROM settings WHERE id_ajuste = 1"
    );

    const filename = req.file.filename;
    // Guardar solo la ruta relativa en la base de datos
    const logoPath = `/api/media/${filename}`;

    // Actualizar la base de datos
    const result = await client.query(
      "UPDATE settings SET logo_local = $1 WHERE id_ajuste = 1 RETURNING *",
      [logoPath]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ message: "No se encontró la configuración" });
    }

    // Si todo sale bien, eliminar el logo anterior
    if (currentSettings.rows[0]?.logo_local) {
      await cleanOldLogo(currentSettings.rows[0].logo_local);
    }

    await client.query("COMMIT");

    // Construir la URL completa solo para la respuesta
    const baseUrl = process.env.NGROK_HOST || "http://localhost:3001";
    const logoUrl = `${baseUrl.replace(/\/$/, "")}${logoPath}`;

    res.json({
      message: "Logo actualizado correctamente",
      url: logoUrl,
      path: logoPath,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al actualizar el logo:", error);

    // Si hubo error, intentar eliminar el archivo subido
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch (unlinkError) {
        console.error("Error al eliminar archivo temporal:", unlinkError);
      }
    }

    res.status(500).json({
      message: "Error al actualizar el logo",
      error: error.message,
    });
  } finally {
    client.release();
  }
};
