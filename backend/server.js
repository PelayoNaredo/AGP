dotenv.config(); // cargar variables de entorno

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./db.js";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import fs from "fs";

// importacion de rutas
import userRoutes from "./routes/usersRoutes.js";
import loginRoutes from "./routes/loginRoutes.js";
import employeesRoutes from "./routes/employeesRoutes.js";
import leavesRoutes from "./routes/leavesRoutes.js";
import shiftsRoutes from "./routes/shiftsRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import suppliersRouter from "./routes/suppliersRoutes.js";
import alertsRoutes from "./routes/alertsRoutes.js";
import expensesRoutes from "./routes/expensesRoutes.js";
import incomeRoutes from "./routes/incomeRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import orderDetailRoutes from "./routes/orderDetailRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import clientsRoutes from "./routes/clientsRoutes.js";
import servicesRoutes from "./routes/servicesRoutes.js";
import appointmentsRoutes from "./routes/appointmentsRoutes.js";

import salesRoutes from "./routes/salesRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import signedUrlRoutes from "./routes/signedUrlRoutes.js";

const PORT = process.env.PORT;
const DB_HOST = process.env.DB_HOST;

const app = express();
app.use(express.json());

// Configuración CORS
const corsOptions = {
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept",
    "Cache-Control",
    "Pragma",
    "Expires",
    "User-Agent",
    "X-Requested-With",
    "ngrok-skip-browser-warning",
    "Access-Control-Allow-Origin",
    "Access-Control-Allow-Headers",
    "Access-Control-Allow-Methods",
    "Cross-Origin-Resource-Policy",
    "Cross-Origin-Embedder-Policy",
    "Origin",
  ],
  exposedHeaders: [
    "Content-Type",
    "Authorization",
    "Cache-Control",
    "Pragma",
    "Expires",
    "ngrok-skip-browser-warning",
    "Access-Control-Allow-Origin",
    "Cross-Origin-Resource-Policy",
    "Cross-Origin-Embedder-Policy",
  ],
  credentials: true,
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Middleware para headers adicionales
app.use((req, res, next) => {
  res.set({
    "ngrok-skip-browser-warning": "true",
    "Cross-Origin-Resource-Policy": "cross-origin",
    "Cross-Origin-Embedder-Policy": "require-corp",
  });
  next();
});

// Construccion de ruta a media
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mediaPath = path.join(__dirname, "media");

// Asegurar que el directorio media existe
try {
  if (!fs.existsSync(mediaPath)) {
    fs.mkdirSync(mediaPath, { recursive: true });
    console.log(`[Server] Directorio media creado: ${mediaPath}`);
  }
} catch (error) {
  console.error(`[Server] Error al crear directorio media: ${error.message}`);
}

// Rutas con prefijo /api
app.use("/api", userRoutes);
app.use("/api", loginRoutes);
app.use("/api", employeesRoutes);
app.use("/api", leavesRoutes);
app.use("/api", shiftsRoutes);
app.use("/api", settingsRoutes);
app.use("/api", inventoryRoutes);
app.use("/api", suppliersRouter);
app.use("/api", alertsRoutes);
app.use("/api", expensesRoutes);
app.use("/api", incomeRoutes);
app.use("/api", authRoutes);
app.use("/api", orderRoutes);
app.use("/api", orderDetailRoutes);
app.use("/api", dashboardRoutes);
app.use("/api", clientsRoutes);
app.use("/api", servicesRoutes);
app.use("/api", appointmentsRoutes);
app.use("/api", salesRoutes);
app.use("/api", fileRoutes);
app.use("/api", signedUrlRoutes);

// Ruta adicional para manejar acceso directo a /media (sin el prefijo /api)
// Esto soluciona problemas con ngrok que puede estar redirigiendo directamente a /media
app.use("/", fileRoutes);

// prueba de conexión a bbdd
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Data Base connection error: ", err);
    process.exit(1);
  } else {
    console.log("Connected to PostgreSQL:", res.rows[0].now);
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://${DB_HOST}:${PORT}`);
    });
  }
});
