import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mediaPath = path.join(__dirname, "..", "media");

// =====================================================
// CONTROLADOR DE ARCHIVOS - NO REQUIERE MULTI-TENANCY
// Los archivos son globales del sistema, no por empresa
// =====================================================

// Asegurar que el directorio media existe
try {
  if (!fs.existsSync(mediaPath)) {
    fs.mkdirSync(mediaPath, { recursive: true });
  }
} catch (error) {
  console.error(
    `[FileController] Error al crear directorio media: ${error.message}`
  );
}

// Función para servir archivos
export const serveFile = (req, res) => {
  try {
    // El middleware verifyToken ya verificó el token
    // por lo que podemos acceder a req.user directamente

    const filename = req.params.filename || req.url.split("?")[0];
    const filePath = path.join(mediaPath, filename);

    if (!fs.existsSync(filePath)) {
      console.error("[FileController] Archivo no encontrado:", filePath);
      return res.status(404).json({ error: "Archivo no encontrado" });
    }

    // Obtener el ETag del archivo basado en su última modificación
    const stats = fs.statSync(filePath);
    const etag = `W/"${stats.size}-${stats.mtime.getTime()}"`;

    // Verificar si el cliente tiene una versión en caché válida
    if (req.headers["if-none-match"] === etag) {
      return res.status(304).send();
    }

    // Establecer encabezados de CORS adicionales para asegurar el funcionamiento con imágenes
    res.set({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers":
        "Origin, X-Requested-With, Content-Type, Accept, Authorization",
      "Access-Control-Expose-Headers": "Content-Length, ETag",
      "Cross-Origin-Resource-Policy": "cross-origin",
      "Cross-Origin-Embedder-Policy": "credentialless",
    });

    // Establecer encabezados apropiados basados en el tipo de archivo
    let contentType = "application/octet-stream";
    if (filename.endsWith(".png")) {
      contentType = "image/png";
    } else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) {
      contentType = "image/jpeg";
    } else if (filename.endsWith(".pdf")) {
      contentType = "application/pdf";
    } else if (filename.endsWith(".doc") || filename.endsWith(".docx")) {
      contentType = "application/msword";
    }

    res.set({
      ETag: etag,
      "Cache-Control": "public, max-age=3600",
      "Content-Type": contentType,
    });

    res.sendFile(filePath, (err) => {
      if (err) {
        if (!res.headersSent) {
          console.error("[FileController] Error enviando archivo:", err);
          res.status(500).json({ error: "Error enviando archivo" });
        }
      }
    });
  } catch (error) {
    console.error("[FileController] Error al servir archivo:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Error al servir el archivo" });
    }
  }
};

// Función para eliminar un archivo
export const deleteFile = async (req, res) => {
  try {
    // El middleware verifyToken ya verificó el token

    // Verificar que el archivo exista
    const filename = req.params.filename;
    const filePath = path.join(mediaPath, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Archivo no encontrado" });
    }

    // Eliminar el archivo
    fs.unlinkSync(filePath);

    res.status(200).json({ message: "Archivo eliminado correctamente" });
  } catch (error) {
    console.error(`[FileController] Error al eliminar archivo:`, error);
    res.status(500).json({ error: "Error al eliminar el archivo" });
  }
};

// Función para verificar si un archivo existe
export const checkFile = (req, res) => {
  try {
    // El middleware verifyToken ya verificó el token

    const filename = req.params.filename;
    const filePath = path.join(mediaPath, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ exists: false });
    }

    const stats = fs.statSync(filePath);

    res.status(200).json({
      exists: true,
      size: stats.size,
      modified: stats.mtime,
    });
  } catch (error) {
    console.error(`[FileController] Error al verificar archivo:`, error);
    res.status(500).json({ error: "Error al verificar el archivo" });
  }
};

// Función para prueba de imágenes
export const testImage = (req, res) => {
  try {
    // El middleware verifyToken ya verificó el token

    const { filename } = req.params;
    const filePath = path.join(mediaPath, filename);

    if (!fs.existsSync(filePath)) {
      console.error(
        `[FileController] Test image - Archivo no encontrado: ${filePath}`
      );
      return res.status(404).json({ error: "Archivo no encontrado" });
    }

    // Configurar headers para permitir CORS y evitar caché
    res.set({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Cross-Origin-Resource-Policy": "cross-origin",
      "Content-Type": filename.endsWith(".png")
        ? "image/png"
        : filename.endsWith(".jpg") || filename.endsWith(".jpeg")
          ? "image/jpeg"
          : "application/octet-stream",
      "Cache-Control": "no-cache",
    });

    res.sendFile(filePath);
  } catch (error) {
    console.error(
      `[FileController] Error al servir imagen de prueba: ${error.message}`
    );
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Función para servir archivos con URL firmada
// Es una versión simplificada de serveFile pero que no depende del sistema de autenticación
export const serveSecuredFile = (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(mediaPath, filename);

    if (!fs.existsSync(filePath)) {
      console.error("[FileController] Archivo no encontrado:", filePath);
      return res.status(404).json({ error: "Archivo no encontrado" });
    }

    // Obtener el ETag del archivo basado en su última modificación
    const stats = fs.statSync(filePath);
    const etag = `W/"${stats.size}-${stats.mtime.getTime()}"`;

    // Verificar si el cliente tiene una versión en caché válida
    if (req.headers["if-none-match"] === etag) {
      return res.status(304).send();
    }

    // Obtener el origen de la solicitud
    const origin = req.headers.origin || "*";

    // Establecer encabezados de CORS adicionales para asegurar el funcionamiento con imágenes
    res.set({
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers":
        "Origin, X-Requested-With, Content-Type, Accept, Authorization, ngrok-skip-browser-warning, Cache-Control, Pragma, Expires",
      "Access-Control-Expose-Headers":
        "Content-Length, ETag, Content-Disposition",
      "Access-Control-Allow-Credentials": "true",
      "Cross-Origin-Resource-Policy": "cross-origin",
      "Cross-Origin-Embedder-Policy": "credentialless",
    });

    // Determinar si es una descarga o visualización
    const isDownload = req.query.download === "true";

    // Determinar el tipo de contenido basado en la extensión
    let contentType = "application/octet-stream";
    if (filename.endsWith(".png")) {
      contentType = "image/png";
    } else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) {
      contentType = "image/jpeg";
    } else if (filename.endsWith(".pdf")) {
      contentType = "application/pdf";
    } else if (filename.endsWith(".doc") || filename.endsWith(".docx")) {
      contentType = "application/msword";
    }

    // Configurar encabezados para descarga si es necesario
    if (isDownload) {
      res.set({
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": contentType,
      });
    } else {
      // Configurar encabezados para visualización con caché
      res.set({
        ETag: etag,
        "Cache-Control": "public, max-age=86400", // 24 horas de caché
        "Content-Type": contentType,
      });
    }

    // Enviar el archivo
    res.sendFile(filePath, (err) => {
      if (err) {
        if (!res.headersSent) {
          console.error("[FileController] Error enviando archivo:", err);
          res.status(500).json({ error: "Error enviando archivo" });
        }
      }
    });
  } catch (error) {
    console.error(
      "[FileController] Error al servir archivo con URL firmada:",
      error
    );
    if (!res.headersSent) {
      res.status(500).json({ error: "Error al servir el archivo" });
    }
  }
};
