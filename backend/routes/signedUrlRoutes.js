import express from "express";
import { generateSignedUrlController } from "../controllers/signedUrlController.js";
import verifyToken from "../middleware/verifyToken.js";
import tenantContext from "../middleware/tenantContext.js";

const router = express.Router();

// Ruta para generar URLs firmadas
router.post(
  "/generate-signed-url",
  verifyToken,
  tenantContext,
  generateSignedUrlController
);

export default router;
