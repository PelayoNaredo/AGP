import express from "express";
import {
  getAllShifts,
  getShiftById,
  getShiftByDate,
  saveShift,
  deleteShift,
  saveInterval,
  deleteInterval,
  getMonthlyShiftsForExport,
  copyShifts,
} from "../controllers/shiftsController.js";

const router = express.Router();

// Ruta para obtener horarios por fecha
router.get("/shifts/date/:fecha_inicio_semana", getShiftByDate);

// Ruta especial para exportación mensual de horarios
router.get("/shifts/export/month/:fecha_inicio_mes", getMonthlyShiftsForExport);

// Ruta para copiar horarios de una semana a otra
router.post("/shifts/copy", copyShifts);

// Ruta unificada para crear/actualizar
router.post("/shifts/save", saveShift);

// Rutas para intervalos
router.post("/shifts/:id/intervals", saveInterval);
router.delete("/shifts/:id/intervals/:intervalId", deleteInterval);

// Rutas restantes
router.get("/shifts", getAllShifts);
router.get("/shifts/:id", getShiftById);
router.delete("/shifts/:id", deleteShift);

export default router;
