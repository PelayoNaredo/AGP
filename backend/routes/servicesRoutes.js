import express from "express";
import {
  getAllServices,
  getAllServicesAdmin,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getServicesByCategory,
} from "../controllers/servicesController.js";
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

router.get("/services", getAllServices);
router.get("/services/admin", getAllServicesAdmin);
router.get("/services/category/:categoria", getServicesByCategory);
router.get("/services/:id", getServiceById);

// Verificar límites antes de crear servicio (usar límite de productos)
router.post(
  "/services",
  checkResourceLimit("products", 1), // Los servicios se cuentan como productos
  monitorResourceUsage("products", 85), // Alertar al 85%
  createService
);

router.put("/services/:id", updateService);
router.delete("/services/:id", deleteService);

export default router;
