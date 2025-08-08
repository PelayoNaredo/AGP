import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import tenantContext from "../middleware/tenantContext.js";

const router = express.Router();

// Ruta para verificar el token
router.get("/verify-token", verifyToken, tenantContext, (req, res) => {
  res.json({
    user: req.user,
    company: req.company,
  });
});

export default router;
