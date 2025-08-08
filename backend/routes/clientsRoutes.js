import express from "express";
import {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  searchClients,
} from "../controllers/clientsController.js";
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

router.get("/clients", getAllClients);
router.get("/clients/search", searchClients);
router.get("/clients/:id", getClientById);

// Verificar límites antes de crear cliente y monitorear uso
router.post(
  "/clients",
  checkResourceLimit("clients", 1),
  monitorResourceUsage("clients", 85), // Alertar al 85%
  createClient
);

router.put("/clients/:id", updateClient);
router.delete("/clients/:id", deleteClient);

export default router;
