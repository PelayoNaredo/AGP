import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, "..", "media");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGE_DIMENSIONS = { width: 2048, height: 2048 };

const ALLOWED_MIME_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
};

// Crear directorio si no existe con manejo de errores
try {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true, mode: 0o755 });
  }
  // Verificar y corregir permisos
  fs.chmodSync(UPLOAD_DIR, 0o755);
} catch (error) {
  console.error("[ERROR] Error al configurar directorio de uploads:", error);
  process.exit(1);
}

const validateMimeType = (file) => {
  const allowedExtensions = ALLOWED_MIME_TYPES[file.mimetype];
  if (!allowedExtensions) return false;

  const ext = path.extname(file.originalname).toLowerCase();
  return allowedExtensions.includes(ext);
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${ext}`;

    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    // Imágenes
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    // Documentos
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    // Texto y otros formatos
    "text/plain",
    "application/zip",
    "application/x-zip-compressed",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Tipo de archivo no permitido"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
});

// Middleware de manejo de errores para multer
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "Archivo demasiado grande",
        details: "El tamaño máximo permitido es 5MB",
      });
    }
    return res.status(400).json({
      error: "Error al subir archivo",
      details: err.message,
    });
  }

  if (err) {
    return res.status(400).json({
      error: "Error al procesar archivo",
      details: err.message,
    });
  }

  next();
};

export { upload, handleUploadErrors };
