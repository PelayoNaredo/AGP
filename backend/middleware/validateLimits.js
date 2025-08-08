// =====================================================
// FASE 2 - TAREA 2.4: Middleware de validación de límites
// Fecha: 8 de agosto de 2025
// Descripción: Middleware para validar límites antes de crear recursos
// =====================================================

import pool from "../db.js";

/**
 * Middleware para validar límites de recursos antes de crearlos
 * @param {string} resourceType - Tipo de recurso ('users', 'clients', 'products', etc.)
 * @param {number} quantity - Cantidad a crear (por defecto 1)
 */
const validateLimit = (resourceType, quantity = 1) => {
  return async (req, res, next) => {
    try {
      const companyId = req.companyId;

      if (!companyId) {
        return res.status(400).json({
          error: "Contexto de empresa requerido",
          details: "No se pudo determinar la empresa actual",
        });
      }

      // Usar la función de base de datos para validar límites
      const result = await pool.query(
        "SELECT can_add_resources($1, $2, $3) as can_add",
        [companyId, resourceType, quantity]
      );

      const canAdd = result.rows[0].can_add;

      if (!canAdd) {
        // Obtener información adicional sobre el límite
        const limitInfo = await pool.query(
          `
          SELECT max_users, max_clients, max_products, subscription_plan
          FROM companies WHERE id = $1
        `,
          [companyId]
        );

        const limits = limitInfo.rows[0];
        let maxAllowed;

        switch (resourceType) {
          case "users":
            maxAllowed = limits.max_users;
            break;
          case "clients":
            maxAllowed = limits.max_clients;
            break;
          case "products":
            maxAllowed = limits.max_products;
            break;
          default:
            maxAllowed = "N/A";
        }

        return res.status(403).json({
          error: `Límite de ${resourceType} alcanzado`,
          details: `Su plan ${limits.subscription_plan} permite un máximo de ${maxAllowed} ${resourceType}`,
          suggestion: "Considere actualizar su plan para obtener más recursos",
        });
      }

      // Si puede agregar el recurso, continuar
      next();
    } catch (error) {
      console.error(`[LIMITS] Error validating ${resourceType} limit:`, error);
      res.status(500).json({
        error: "Error al validar límites",
        details: error.message,
      });
    }
  };
};

/**
 * Helper function para obtener límites actuales
 */
const getCurrentLimits = async (companyId) => {
  try {
    const result = await pool.query(
      "SELECT get_company_usage_percentages($1) as limits",
      [companyId]
    );
    return result.rows[0].limits;
  } catch (error) {
    console.error("[LIMITS] Error getting current limits:", error);
    return null;
  }
};

/**
 * Middleware para validar múltiples recursos a la vez
 */
const validateMultipleLimits = (checks) => {
  return async (req, res, next) => {
    try {
      const companyId = req.companyId;

      for (const check of checks) {
        const { resourceType, quantity = 1 } = check;

        const result = await pool.query(
          "SELECT can_add_resources($1, $2, $3) as can_add",
          [companyId, resourceType, quantity]
        );

        if (!result.rows[0].can_add) {
          return res.status(403).json({
            error: `Límite de ${resourceType} alcanzado`,
            details: `No se pueden crear ${quantity} ${resourceType} adicionales`,
          });
        }
      }

      next();
    } catch (error) {
      console.error("[LIMITS] Error validating multiple limits:", error);
      res.status(500).json({
        error: "Error al validar límites múltiples",
        details: error.message,
      });
    }
  };
};

export { validateLimit, getCurrentLimits, validateMultipleLimits };
