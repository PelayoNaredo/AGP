import crypto from "crypto";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// Asegurar que las variables de entorno estén cargadas
dotenv.config();

// Clave secreta para firmar URLs - idealmente debería estar en variables de entorno
const SECRET_KEY = process.env.URL_SIGNING_SECRET || process.env.JWT_SECRET;

// Tiempo de expiración para URLs firmadas (en segundos)
const URL_EXPIRY_TIME = 7 * 24 * 60 * 60; // 7 días por defecto

/**
 * Genera una URL firmada para un archivo de medios
 * @param {string} filename - Nombre del archivo
 * @param {string} baseUrl - URL base del servidor
 * @param {Object} userData - Datos del usuario para incluir en la firma
 * @param {number} expiryTime - Tiempo de expiración en segundos
 * @returns {string} URL firmada para acceso seguro
 */
export const generateSignedUrl = (
  filename,
  baseUrl,
  userData = null,
  expiryTime = URL_EXPIRY_TIME
) => {
  try {
    if (!filename) {
      throw new Error("Nombre de archivo no proporcionado");
    }

    // Extraer solo el nombre del archivo si se pasa una ruta completa
    const filenameOnly = filename.split("/").pop().split("?")[0];

    // Calcular timestamp de expiración
    const expiresAt = Math.floor(Date.now() / 1000) + expiryTime;

    // Datos a incluir en la firma
    const payload = {
      filename: filenameOnly,
      exp: expiresAt,
    };

    // Si hay datos de usuario, incluirlos
    if (userData) {
      payload.userId = userData.id;
    }

    // Crear firma JWT
    const token = jwt.sign(payload, SECRET_KEY);

    // Construir URL firmada
    return `${baseUrl}/secured-media/${filenameOnly}?signature=${token}`;
  } catch (error) {
    console.error("[SignedURL] Error generando URL firmada:", error);
    throw error;
  }
};

/**
 * Middleware para verificar URLs firmadas
 */
export const verifySignedUrl = (req, res, next) => {
  try {
    const { signature } = req.query;
    const filename = req.params.filename;

    if (!signature) {
      return res.status(401).json({
        error: "Firma requerida",
        details: "Esta URL requiere una firma válida",
      });
    }

    if (!filename) {
      return res.status(400).json({
        error: "Nombre de archivo requerido",
        details: "No se especificó el archivo a acceder",
      });
    }

    // Verificar la firma JWT
    const decoded = jwt.verify(signature, SECRET_KEY);

    // Verificar que el archivo solicitado coincide con el de la firma
    if (decoded.filename !== filename) {
      return res.status(401).json({
        error: "Firma inválida",
        details: "La firma no corresponde a este archivo",
      });
    }

    // Verificar expiración (ya lo hace jwt.verify, pero lo dejamos explícito)
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) {
      return res.status(401).json({
        error: "URL expirada",
        details: "El enlace ha expirado, solicite uno nuevo",
      });
    }

    // Almacenar datos del usuario si están disponibles
    if (decoded.userId) {
      req.securedUrlUser = {
        id: decoded.userId,
      };
    }

    // Todo está bien, continuar
    next();
  } catch (error) {
    console.error("[SignedURL] Error verificando URL firmada:", error);
    return res.status(401).json({
      error: "Firma inválida",
      details: "La firma proporcionada no es válida o ha expirado",
    });
  }
};
