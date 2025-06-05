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

const router = express.Router();

router.get("/appointments", getAllAppointments);
router.get("/appointments/range", getAppointmentsByDateRange);
router.get("/appointments/employee/:employeeId", getAppointmentsByEmployee);
router.get("/appointments/client/:clientId", getAppointmentsByClient);
router.get("/appointments/availability/check", checkEmployeeAvailability);
router.get("/appointments/:id", getAppointmentById);
router.post("/appointments", createAppointment);
router.put("/appointments/:id", updateAppointment);
router.put("/appointments/:id/status", updateAppointmentStatus);
router.delete("/appointments/:id", deleteAppointment);

export default router;
