import express from "express";
import {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
} from "../controllers/orderController.js";
import verifyToken from "../middleware/verifyToken.js";
import tenantContext from "../middleware/tenantContext.js";
import {
  checkResourceLimit,
  monitorResourceUsage,
} from "../middleware/featureAccess.js";

const router = express.Router();

// Aplicar middleware de autenticación y contexto a todas las rutas
router.use(verifyToken);
router.use(tenantContext);

// Definir las rutas para las órdenes
router.get("/orders", getAllOrders);
router.get("/orders/:id", getOrderById);

// Verificar límites antes de crear pedido y monitorear uso
router.post(
  "/orders",
  checkResourceLimit("orders", 1),
  monitorResourceUsage("orders", 85), // Alertar al 85%
  createOrder
);

router.put("/orders/:id", updateOrder);
router.delete("/orders/:id", deleteOrder);

export default router;
