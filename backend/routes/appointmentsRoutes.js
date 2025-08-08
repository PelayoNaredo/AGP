import express from "express";
import {
  getAllAppointments,
  getAppointmentById,
  getAppointmentsByDateRange,
  getAppointmentsByEmployee,
  getAppointmentsByClient,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  updateAppointmentStatus,
  checkEmployeeAvailability,
} from "../controllers/appointmentsController.js";
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

router.get("/appointments", getAllAppointments);
router.get("/appointments/range", getAppointmentsByDateRange);
router.get("/appointments/employee/:employeeId", getAppointmentsByEmployee);
router.get("/appointments/client/:clientId", getAppointmentsByClient);
router.get("/appointments/availability/check", checkEmployeeAvailability);
router.get("/appointments/:id", getAppointmentById);
router.post(
  "/appointments",
  checkResourceLimit("appointments", 1),
  monitorResourceUsage("appointments", 80),
  createAppointment
);
router.put("/appointments/:id", updateAppointment);
router.put("/appointments/:id/status", updateAppointmentStatus);
router.delete("/appointments/:id", deleteAppointment);

export default router;
