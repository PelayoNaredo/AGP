import express from "express";
import {
  getAllProductCodes,
  getProductCodeById,
  getProductCodesByProductId,
  createProductCode,
  updateProductCode,
  deleteProductCode,
  scanProductCode,
} from "../controllers/productCodesController.js";

const router = express.Router();

router.get("/product-codes", getAllProductCodes);
router.get("/product-codes/:id", getProductCodeById);
router.get("/product-codes/product/:productId", getProductCodesByProductId);
router.post("/product-codes", createProductCode);
router.put("/product-codes/:id", updateProductCode);
router.delete("/product-codes/:id", deleteProductCode);
router.post("/product-codes/scan", scanProductCode);

export default router;
