import express from "express";
import loginUser from "../controllers/loginController.js";

const router = express.Router();

router.options("/login", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, ngrok-skip-browser-warning"
  );
  res.status(200).end();
});

// ruta para iniciar sesión
router.post("/login", loginUser);
router.get("/login", (req, res) => {
  res.send("Servidor funcionando correctamente");
});

export default router;
