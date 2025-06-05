import express from "express";
import {
  getAllIncome,
  getIncomeById,
  createIncome,
  updateIncome,
  deleteIncome,
  getDailyClosureByDate,
  createDailyClosure,
  getIncomeByPeriod,
} from "../controllers/incomeController.js";

const router = express.Router();

// Rutas de operaciones CRUD básicas
router.get("/income", getAllIncome);
router.get("/income/:id", getIncomeById);
router.post("/income", createIncome);
router.put("/income/:id", updateIncome);
router.delete("/income/:id", deleteIncome);

// Rutas para cierre diario
router.get("/income/daily-closure/:date", getDailyClosureByDate);
router.post("/income/daily-closure", createDailyClosure);

// Ruta para obtener ingresos agrupados por período
router.get("/income/stats/:period", getIncomeByPeriod);

export default router;
