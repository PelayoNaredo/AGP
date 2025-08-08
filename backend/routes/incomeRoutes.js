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

// Rutas de operaciones CRUD básicas
router.get("/income", getAllIncome);
router.get("/income/:id", getIncomeById);
router.post(
  "/income",
  checkResourceLimit("income", 1),
  monitorResourceUsage("income", 85),
  createIncome
);
router.put("/income/:id", updateIncome);
router.delete("/income/:id", deleteIncome);

// Rutas para cierre diario
router.get("/income/daily-closure/:date", getDailyClosureByDate);
router.post(
  "/income/daily-closure",
  monitorResourceUsage("income", 85),
  createDailyClosure
);

// Ruta para obtener ingresos agrupados por período
router.get("/income/stats/:period", getIncomeByPeriod);

export default router;
