import express from "express";
import {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpensesByMonth,
} from "../controllers/expensesController.js";
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

router.get("/expenses/month", getExpensesByMonth);
router.get("/expenses", getExpenses);
router.get("/expenses/:id", getExpenseById);
router.post(
  "/expenses",
  checkResourceLimit("expenses", 1),
  monitorResourceUsage("expenses", 85),
  createExpense
);
router.put("/expenses/:id", updateExpense);
router.delete("/expenses/:id", deleteExpense);

export default router;
