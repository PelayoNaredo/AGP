import express from "express";
import {
  getAllInventory,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateSaleQuantities,
} from "../controllers/inventoryController.js";

const router = express.Router();

// Definir las rutas para el inventario
router.get("/inventory", getAllInventory);
router.get("/inventory/:id", getProductById);
router.post("/inventory", createProduct);
router.put("/inventory/:id", updateProduct);
router.delete("/inventory/:id", deleteProduct);

// Ruta para actualizar inventario después de ventas
router.post("/inventory/update-sale-quantities", updateSaleQuantities);

export default router;
