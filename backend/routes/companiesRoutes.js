// =====================================================
// FASE 2 - TAREA 2.3: Rutas de empresas
// Fecha: 8 de agosto de 2025
// Descripción: Rutas para gestión multi-tenant de empresas
// =====================================================

import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import tenantContext from "../middleware/tenantContext.js";
import {
  getCompanyData,
  getCompanyUsage,
  getCompanyLimits,
  updateCompanySettings,
  validateLimit,
  generateInvitation,
  getCompanyUsers,
  // Nuevos imports para sistema de planes
  getAvailablePlans,
  getSubscriptionHistory,
  getLimitNotifications,
  acknowledgeNotification,
  checkFeatureAccess,
  createLimitNotification,
} from "../controllers/companiesController.js";

const router = express.Router();

// Aplicar middlewares a todas las rutas
router.use(verifyToken); // Verificar autenticación
router.use(tenantContext); // Establecer contexto de empresa

// GET /api/companies/current - Datos empresa actual
router.get("/companies/current", getCompanyData);

// GET /api/companies/usage - Estadísticas de uso
router.get("/companies/usage", getCompanyUsage);

// GET /api/companies/limits - Límites del plan
router.get("/companies/limits", getCompanyLimits);

// PUT /api/companies/settings - Actualizar configuración
router.put("/companies/settings", updateCompanySettings);

// POST /api/companies/validate-limit - Validar límites
router.post("/companies/validate-limit", validateLimit);

// POST /api/companies/invitation - Generar invitación
router.post("/companies/invitation", generateInvitation);

// GET /api/companies/users - Usuarios de empresa
router.get("/companies/users", getCompanyUsers);

// === RUTAS DEL SISTEMA DE PLANES ===

// GET /api/companies/plans - Planes disponibles (público)
router.get("/companies/plans", getAvailablePlans);

// GET /api/companies/subscription-history - Historial de suscripciones
router.get("/companies/subscription-history", getSubscriptionHistory);

// GET /api/companies/notifications - Notificaciones de límites
router.get("/companies/notifications", getLimitNotifications);

// PUT /api/companies/notifications/:notification_id/acknowledge - Reconocer notificación
router.put(
  "/companies/notifications/:notification_id/acknowledge",
  acknowledgeNotification
);

// GET /api/companies/features/:feature_name - Verificar acceso a funcionalidad
router.get("/companies/features/:feature_name", checkFeatureAccess);

// POST /api/companies/notifications - Crear notificación de límite (testing/interno)
router.post("/companies/notifications", createLimitNotification);

export default router;
