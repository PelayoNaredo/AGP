import express from "express";
import {
  getAlerts,
  getAlertById,
  createAlert,
  updateAlert,
  deleteAlert,
} from "../controllers/alertsController.js";
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

router.get("/alerts", getAlerts);
router.get("/alerts/:id", getAlertById);
router.post(
  "/alerts",
  checkResourceLimit("alerts", 1),
  monitorResourceUsage("alerts", 85),
  createAlert
);
router.put("/alerts/:id", updateAlert);
router.delete("/alerts/:id", deleteAlert);

export default router;
