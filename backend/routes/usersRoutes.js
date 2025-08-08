import express from "express";
import createUser from "../controllers/usersController.js";
import verifyToken from "../middleware/verifyToken.js";
import tenantContext from "../middleware/tenantContext.js";
import {
  checkResourceLimit,
  monitorResourceUsage,
} from "../middleware/featureAccess.js";

const router = express.Router();

// Para el registro público (sin autenticación)
router.post("/register", createUser);

// Para crear usuarios dentro de una empresa (con autenticación)
router.post(
  "/users",
  verifyToken,
  tenantContext,
  checkResourceLimit("users", 1),
  monitorResourceUsage("users", 85), // Alertar al 85%
  createUser
);

export default router;
