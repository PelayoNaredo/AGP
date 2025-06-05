import express from "express";
import { generateSignedUrlController } from "../controllers/signedUrlController.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

// Ruta para generar URLs firmadas
router.post("/generate-signed-url", verifyToken, generateSignedUrlController);

export default router;
