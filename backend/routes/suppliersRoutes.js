import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import tenantContext from "../middleware/tenantContext.js";
import {
  checkResourceLimit,
  monitorResourceUsage,
} from "../middleware/featureAccess.js";
import {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "../controllers/suppliersController.js";

const router = express.Router();

// ← CAMBIO: Aplicar middleware de autenticación y contexto de tenant a todas las rutas
router.use(verifyToken);
router.use(tenantContext);

router.get("/suppliers", getSuppliers);
router.get("/suppliers/:id", getSupplierById);

// Verificar límites antes de crear proveedor (usar límite de clientes como referencia)
router.post(
  "/suppliers",
  checkResourceLimit("clients", 1), // Los proveedores se cuentan como clientes externos
  monitorResourceUsage("clients", 85), // Alertar al 85%
  createSupplier
);

router.put("/suppliers/:id", updateSupplier);
router.delete("/suppliers/:id", deleteSupplier);

export default router;
