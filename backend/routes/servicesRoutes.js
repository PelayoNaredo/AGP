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

const router = express.Router();

router.get("/services", getAllServices);
router.get("/services/admin", getAllServicesAdmin);
router.get("/services/category/:categoria", getServicesByCategory);
router.get("/services/:id", getServiceById);
router.post("/services", createService);
router.put("/services/:id", updateService);
router.delete("/services/:id", deleteService);

export default router;
