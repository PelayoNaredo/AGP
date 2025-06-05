import { Router } from "express";
import { upload, handleUploadErrors } from "../middleware/upload.js";
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

// Middleware para logging de rutas de empleados
router.use((req, res, next) => {
  next();
});

// Rutas específicas primero
router.get("/employees", getAllEmployees);
router.post("/employees", upload.array("documents"), createEmployee);

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
