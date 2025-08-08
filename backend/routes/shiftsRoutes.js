import express from "express";
import {
  getAllShifts,
  getShiftById,
  getShiftByDate,
  getShiftsByMonth,
  saveShift,
  deleteShift,
  saveInterval,
  deleteInterval,
  getMonthlyShiftsForExport,
  copyShifts,
} from "../controllers/shiftsController.js";
import verifyToken from "../middleware/verifyToken.js";
import tenantContext from "../middleware/tenantContext.js";
import {
  checkResourceLimit,
  monitorResourceUsage,
} from "../middleware/featureAccess.js";

const router = express.Router();

// Aplicar middlewares a todas las rutas
router.use(verifyToken);
router.use(tenantContext);

// Ruta para obtener horarios por fecha
router.get("/shifts/date/:fecha_inicio_semana", getShiftByDate);

// Ruta optimizada para obtener horarios mensuales (cache)
router.get("/shifts/month/:year/:month", getShiftsByMonth);

// Ruta especial para exportación mensual de horarios
router.get("/shifts/export/month/:fecha_inicio_mes", getMonthlyShiftsForExport);

// Ruta para copiar horarios de una semana a otra
router.post("/shifts/copy", copyShifts);

// Ruta unificada para crear/actualizar
router.post(
  "/shifts/save",
  checkResourceLimit("shifts", 1),
  monitorResourceUsage("shifts", 85),
  saveShift
);

// Rutas para intervalos
router.post(
  "/shifts/:id/intervals",
  monitorResourceUsage("shifts", 85),
  saveInterval
);
router.delete("/shifts/:id/intervals/:intervalId", deleteInterval);

// Rutas restantes
router.get("/shifts", getAllShifts);
router.get("/shifts/:id", getShiftById);
router.delete("/shifts/:id", deleteShift);

export default router;
