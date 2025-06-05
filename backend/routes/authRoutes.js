import express from "express";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

// Ruta para verificar el token
router.get("/verify-token", verifyToken, (req, res) => {
  res.json({ user: req.user });
});

export default router;
