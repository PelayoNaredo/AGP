import express from "express";
import {
  getLeaves,
  getLeaveById,
  createLeave,
  updateLeave,
  deleteLeave,
} from "../controllers/leavesController.js";
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

router.get("/leaves", getLeaves);
router.get("/leaves/:id", getLeaveById);
router.post(
  "/leaves",
  checkResourceLimit("leaves", 1),
  monitorResourceUsage("leaves", 90),
  createLeave
);
router.put("/leaves/:id", updateLeave);
router.delete("/leaves/:id", deleteLeave);

export default router;
