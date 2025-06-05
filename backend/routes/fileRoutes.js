import express from "express";
import {
  serveFile,
  deleteFile,
  checkFile,
  testImage,
  serveSecuredFile,
} from "../controllers/fileController.js";
import verifyToken from "../middleware/verifyToken.js";
import { verifySignedUrl } from "../middleware/signedUrl.js";

const router = express.Router();

// Middleware CORS específico para archivos
const fileCorsMiddleware = (req, res, next) => {
  // Origen de la solicitud o permitir todos
  const origin = req.headers.origin || "*";

  res.set({
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE, HEAD",
    "Access-Control-Allow-Headers":
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, ngrok-skip-browser-warning, Cache-Control, Pragma, Expires",
    "Access-Control-Expose-Headers":
      "Content-Length, ETag, Content-Disposition",
    "Access-Control-Allow-Credentials": "true",
    "Cross-Origin-Resource-Policy": "cross-origin",
    "Cross-Origin-Embedder-Policy": "credentialless",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    Expires: "0",
  });

  // Responder inmediatamente a las solicitudes preflight
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  next();
};

// Aplicar middleware CORS a todas las rutas
router.use(fileCorsMiddleware);

// Nueva ruta para acceso público con token en la URL
router.get("/public/:filename", verifyToken, serveFile);

// Nueva ruta para acceso con URL firmada (no requiere el middleware verifyToken)
router.get("/secured-media/:filename", verifySignedUrl, serveSecuredFile);

// Rutas para manejo de archivos
router.get("/media/:filename?", verifyToken, serveFile);
router.get("/media/test/:filename", verifyToken, testImage);
router.delete("/media/:filename", verifyToken, deleteFile);
router.head("/media/:filename", verifyToken, checkFile);

export default router;
