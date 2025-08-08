import express from "express";
import {
  getAllOrderDetails,
  getOrderDetailById,
  createOrderDetail,
  updateOrderDetail,
  deleteOrderDetail,
} from "../controllers/orderDetailController.js";
import verifyToken from "../middleware/verifyToken.js";
import tenantContext from "../middleware/tenantContext.js";
import {
  checkResourceLimit,
  monitorResourceUsage,
} from "../middleware/featureAccess.js";

const router = express.Router();

// Aplicar middlewares a todas las rutas
router.use(verifyToken);
router.use(tenantContext);

// Definir las rutas para los detalles de la orden
router.get("/order-details", getAllOrderDetails);
router.get("/order-details/:id", getOrderDetailById);
router.post(
  "/order-details",
  monitorResourceUsage("orders", 80),
  createOrderDetail
);
router.put("/order-details/:id", updateOrderDetail);
router.delete("/order-details/:id", deleteOrderDetail);

export default router;
