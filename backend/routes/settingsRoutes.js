import { Router } from "express";
import {
  getSettingById,
  createSetting,
  updateSetting,
  updateSettingLogo,
} from "../controllers/settingsController.js";
import { upload, handleUploadErrors } from "../middleware/upload.js";
import verifyToken from "../middleware/verifyToken.js";
import tenantContext from "../middleware/tenantContext.js";
import { validateSettingsUpdate } from "../middleware/validators.js";

const router = Router();

// Middleware de autenticación y contexto para todas las rutas
router.use(verifyToken);
router.use(tenantContext);

// GET - Obtener configuración por ID
router.get("/settings/:id", async (req, res, next) => {
  try {
    await getSettingById(req, res);
  } catch (error) {
    next(error);
  }
});

// POST - Crear nueva configuración
router.post("/settings", async (req, res, next) => {
  try {
    await createSetting(req, res);
  } catch (error) {
    next(error);
  }
});

// PUT - Actualizar configuración
router.put("/settings/:id", async (req, res, next) => {
  try {
    await updateSetting(req, res);
  } catch (error) {
    next(error);
  }
});

// PUT - Actualizar logo
router.put(
  "/settings/logo",
  upload.single("logo"),
  handleUploadErrors,
  async (req, res, next) => {
    try {
      await updateSettingLogo(req, res);
    } catch (error) {
      // Limpiar archivo temporal en caso de error
      if (req.file?.path) {
        try {
          await fs.promises.unlink(req.file.path);
        } catch (unlinkError) {
          console.error("Error al limpiar archivo temporal:", unlinkError);
        }
      }
      next(error);
    }
  }
);

// Middleware de manejo de errores general
router.use((err, req, res, next) => {
  console.error("Error en settingsRoutes:", err);

  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Error de validación",
      errors: err.errors,
    });
  }

  if (err.name === "MulterError") {
    return res.status(400).json({
      message: "Error al subir archivo",
      error: err.message,
    });
  }

  res.status(500).json({
    message: "Error interno del servidor",
    error:
      process.env.NODE_ENV === "development" ? err.message : "Error interno",
  });
});

export default router;
