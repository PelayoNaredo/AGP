import express from "express";
import { getDashboardData } from "../controllers/dashboardController.js";
import verifyToken from "../middleware/verifyToken.js";
import tenantContext from "../middleware/tenantContext.js";

const router = express.Router();

// Aplicar middlewares a todas las rutas
router.use(verifyToken);
router.use(tenantContext);

router.get("/dashboard", getDashboardData);

export default router;
