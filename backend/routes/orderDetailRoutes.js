import express from "express";
import {
  getAllOrderDetails,
  getOrderDetailById,
  createOrderDetail,
  updateOrderDetail,
  deleteOrderDetail,
} from "../controllers/orderDetailController.js";

const router = express.Router();

// Definir las rutas para los detalles de la orden
router.get("/order-details", getAllOrderDetails);
router.get("/order-details/:id", getOrderDetailById);
router.post("/order-details", createOrderDetail);
router.put("/order-details/:id", updateOrderDetail);
router.delete("/order-details/:id", deleteOrderDetail);

export default router;
