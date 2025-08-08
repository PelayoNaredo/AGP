import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import tenantContext from "../middleware/tenantContext.js";
import {
  checkResourceLimit,
  monitorResourceUsage,
} from "../middleware/featureAccess.js";
import {
  getAllInventory,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateSaleQuantities,
} from "../controllers/inventoryController.js";

const router = express.Router();

// ← CAMBIO: Aplicar middleware de autenticación y contexto de tenant a todas las rutas
router.use(verifyToken);
router.use(tenantContext);

// Definir las rutas para el inventario
router.get("/inventory", getAllInventory);
router.get("/inventory/:id", getProductById);

// Verificar límites antes de crear producto y monitorear uso
router.post(
  "/inventory",
  checkResourceLimit("products", 1),
  monitorResourceUsage("products", 85), // Alertar al 85%
  createProduct
);

router.put("/inventory/:id", updateProduct);
router.delete("/inventory/:id", deleteProduct);

// Ruta para actualizar inventario después de ventas
router.post("/inventory/update-sale-quantities", updateSaleQuantities);

export default router;
