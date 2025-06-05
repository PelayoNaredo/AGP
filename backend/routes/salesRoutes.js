import express from "express";
import {
  getAllSales,
  getSaleById,
  createSale,
  updateSale,
  deleteSale,
  searchSales,
  getSalesByDateRange,
  getSalesByClient,
  getSalesByEmployee,
  getSalesStatsByPeriod,
  updateSaleStatus,
  generateSaleDocument,
  getSalesByDate,
} from "../controllers/salesController.js";

const router = express.Router();

// Rutas de operaciones CRUD básicas
router.get("/sales", getAllSales);
router.get("/sales/:id", getSaleById);
router.post("/sales", createSale);
router.put("/sales/:id", updateSale);
router.delete("/sales/:id", deleteSale);

// Rutas para búsqueda y filtros
router.get("/sales/search", searchSales);

// Ruta para ventas por fecha específica (nuevo)
router.get("/sales/date/:date", getSalesByDate);

router.get("/sales/range", getSalesByDateRange);
router.get("/sales/client/:clientId", getSalesByClient);
router.get("/sales/employee/:employeeId", getSalesByEmployee);
router.get("/sales/stats/:period", getSalesStatsByPeriod);

// Ruta para actualizar el estado de una venta
router.put("/sales/:id/status", updateSaleStatus);

// Ruta para generar documentos de venta (tickets, facturas, etc.)
router.get("/sales/:id/document", generateSaleDocument);

export default router;
