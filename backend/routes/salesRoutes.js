import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import tenantContext from "../middleware/tenantContext.js";
import {
  checkResourceLimit,
  monitorResourceUsage,
} from "../middleware/featureAccess.js";
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

// ← CAMBIO: Aplicar middleware de autenticación y contexto de tenant a todas las rutas
router.use(verifyToken);
router.use(tenantContext);

// Rutas de operaciones CRUD básicas
router.get("/sales", getAllSales);
router.get("/sales/:id", getSaleById);

// Verificar límites antes de crear venta/factura y monitorear uso
router.post(
  "/sales",
  checkResourceLimit("invoices", 1), // Las ventas cuentan como facturas
  monitorResourceUsage("invoices", 85), // Alertar al 85%
  createSale
);

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
