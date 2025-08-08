import { Router } from "express";
import { upload, handleUploadErrors } from "../middleware/upload.js";
import verifyToken from "../middleware/verifyToken.js";
import tenantContext from "../middleware/tenantContext.js";
import {
  checkResourceLimit,
  monitorResourceUsage,
} from "../middleware/featureAccess.js";
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  addEmployeeDocuments,
  deleteEmployeeDocument,
} from "../controllers/employeesController.js";

const router = Router();

// ← CAMBIO: Aplicar middleware de autenticación y contexto de tenant a todas las rutas
router.use(verifyToken);
router.use(tenantContext);

// Middleware para logging de rutas de empleados
router.use((req, res, next) => {
  next();
});

// Rutas específicas primero
router.get("/employees", getAllEmployees);

// Verificar límites antes de crear empleado y monitorear uso
router.post(
  "/employees",
  checkResourceLimit("employees", 1),
  monitorResourceUsage("employees", 85), // Alertar al 85%
  upload.array("documents"),
  createEmployee
);

// Rutas con ID numérico
router.get("/employees/:id", getEmployeeById);
router.put("/employees/:id", updateEmployee);
router.put(
  "/employees/:id/documents",
  upload.array("documents"),
  updateEmployee
);
router.delete("/employees/:id", deleteEmployee);

// Rutas de documentos
router.post(
  "/employees/:id/documents",
  upload.array("documents"),
  addEmployeeDocuments
);
router.delete("/employees/:id/documents/:docId", deleteEmployeeDocument);

export default router;
