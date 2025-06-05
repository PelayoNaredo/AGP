import express from "express";
import {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpensesByMonth,
} from "../controllers/expensesController.js";

const router = express.Router();

router.get("/expenses/month", getExpensesByMonth);
router.get("/expenses", getExpenses);
router.get("/expenses/:id", getExpenseById);
router.post("/expenses", createExpense);
router.put("/expenses/:id", updateExpense);
router.delete("/expenses/:id", deleteExpense);

export default router;
