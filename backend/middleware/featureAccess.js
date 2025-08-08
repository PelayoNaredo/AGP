// =====================================================
// FASE 4 - TAREA 4.6: Middleware de Verificación de Funcionalidades
// Fecha: 8 de agosto de 2025
// Descripción: Middleware para verificar acceso a funcionalidades del plan
// =====================================================

import pool from "../db.js";

/**
 * Middleware para verificar si la empresa tiene acceso a una funcionalidad específica
 * @param {string} featureName - Nombre de la funcionalidad a verificar
 * @returns {Function} Middleware function
 */
const requireFeature = (featureName) => {
  return async (req, res, next) => {
    try {
      const companyId = req.companyId;

      if (!companyId) {
        return res.status(401).json({
          error: "Contexto de empresa requerido",
          details:
            "No se pudo determinar la empresa para verificar funcionalidades",
        });
      }

      // Verificar si la empresa tiene acceso a la funcionalidad
      const result = await pool.query(
        "SELECT company_has_feature($1, $2) as has_access",
        [companyId, featureName]
      );

      const hasAccess = result.rows[0]?.has_access;

      if (!hasAccess) {
        return res.status(403).json({
          error: "Funcionalidad no disponible",
          details: `Tu plan actual no incluye acceso a: ${featureName}. Considera actualizar tu plan.`,
          feature_name: featureName,
          upgrade_required: true,
        });
      }

      // La empresa tiene acceso, continuar con la siguiente middleware/ruta
      next();
    } catch (error) {
      console.error(
        `Error verifying feature access for ${featureName}:`,
        error
      );
      res.status(500).json({
        error: "Error al verificar acceso a funcionalidad",
        details: error.message,
      });
    }
  };
};

/**
 * Middleware para verificar múltiples funcionalidades
 * @param {string[]} featureNames - Array de nombres de funcionalidades
 * @param {boolean} requireAll - Si true, requiere TODAS las funcionalidades. Si false, requiere AL MENOS UNA
 * @returns {Function} Middleware function
 */
const requireFeatures = (featureNames, requireAll = true) => {
  return async (req, res, next) => {
    try {
      const companyId = req.companyId;

      if (!companyId) {
        return res.status(401).json({
          error: "Contexto de empresa requerido",
          details:
            "No se pudo determinar la empresa para verificar funcionalidades",
        });
      }

      const accessResults = await Promise.all(
        featureNames.map(async (featureName) => {
          const result = await pool.query(
            "SELECT company_has_feature($1, $2) as has_access",
            [companyId, featureName]
          );
          return {
            feature: featureName,
            hasAccess: result.rows[0]?.has_access || false,
          };
        })
      );

      const hasAccess = requireAll
        ? accessResults.every((result) => result.hasAccess)
        : accessResults.some((result) => result.hasAccess);

      if (!hasAccess) {
        const missingFeatures = accessResults
          .filter((result) => !result.hasAccess)
          .map((result) => result.feature);

        return res.status(403).json({
          error: "Funcionalidades no disponibles",
          details: requireAll
            ? `Tu plan no incluye todas las funcionalidades requeridas: ${missingFeatures.join(", ")}`
            : `Tu plan no incluye ninguna de las funcionalidades requeridas: ${featureNames.join(", ")}`,
          missing_features: missingFeatures,
          upgrade_required: true,
        });
      }

      // Agregar información de funcionalidades accesibles al request
      req.accessibleFeatures = accessResults
        .filter((result) => result.hasAccess)
        .map((result) => result.feature);

      next();
    } catch (error) {
      console.error("Error verifying multiple features access:", error);
      res.status(500).json({
        error: "Error al verificar acceso a funcionalidades",
        details: error.message,
      });
    }
  };
};

/**
 * Middleware para verificar límites antes de crear recursos
 * @param {string} resourceType - Tipo de recurso (users, clients, products, etc.)
 * @param {number} quantity - Cantidad a crear (por defecto 1)
 * @returns {Function} Middleware function
 */
const checkResourceLimit = (resourceType, quantity = 1) => {
  return async (req, res, next) => {
    try {
      const companyId = req.companyId;

      if (!companyId) {
        return res.status(401).json({
          error: "Contexto de empresa requerido",
          details: "No se pudo determinar la empresa para verificar límites",
        });
      }

      // Obtener cantidad del body si está disponible
      const requestQuantity = req.body?.quantity || quantity;

      // Verificar límites usando la función de base de datos
      const result = await pool.query(
        "SELECT can_add_resources_with_plan($1, $2, $3) as can_add",
        [companyId, resourceType, requestQuantity]
      );

      const canAdd = result.rows[0]?.can_add;

      if (!canAdd) {
        // Obtener información del plan para mensaje más descriptivo
        const planResult = await pool.query(
          "SELECT * FROM get_company_plan_limits($1)",
          [companyId]
        );

        let message = `Límite alcanzado para ${resourceType}`;
        if (planResult.rows.length > 0) {
          const limits = planResult.rows[0];
          const maxLimit = limits[`max_${resourceType}`];

          if (maxLimit === -1) {
            message = `Recurso ${resourceType} debería ser ilimitado, pero hay un error en la validación`;
          } else {
            message = `Límite del plan alcanzado: ${maxLimit} ${resourceType} máximo. Considera actualizar tu plan.`;
          }
        }

        return res.status(403).json({
          error: "Límite de recursos alcanzado",
          details: message,
          resource_type: resourceType,
          requested_quantity: requestQuantity,
          upgrade_required: true,
        });
      }

      // Agregar información de límite al request para uso posterior
      req.resourceValidation = {
        resourceType,
        quantity: requestQuantity,
        canAdd: true,
      };

      next();
    } catch (error) {
      console.error(
        `Error checking resource limit for ${resourceType}:`,
        error
      );
      res.status(500).json({
        error: "Error al verificar límites de recursos",
        details: error.message,
      });
    }
  };
};

/**
 * Middleware dinámico que obtiene cantidad del request body
 * @param {string} resourceType - Tipo de recurso
 * @returns {Function} Middleware function
 */
const checkDynamicResourceLimit = (resourceType) => {
  return async (req, res, next) => {
    const quantity = req.body?.quantity || req.query?.quantity || 1;
    return checkResourceLimit(resourceType, parseInt(quantity))(req, res, next);
  };
};

/**
 * Middleware para crear notificación automática cuando se alcanzan umbrales
 * @param {string} resourceType - Tipo de recurso
 * @param {number} threshold - Umbral de porcentaje (90 por defecto)
 * @returns {Function} Middleware function
 */
const monitorResourceUsage = (resourceType, threshold = 90) => {
  return async (req, res, next) => {
    try {
      const companyId = req.companyId;

      if (!companyId) {
        return next(); // No bloquear si no hay contexto de empresa
      }

      // Obtener estadísticas actuales y límites
      const [usageResult, limitsResult] = await Promise.all([
        pool.query("SELECT get_company_usage_stats($1) as stats", [companyId]),
        pool.query("SELECT * FROM get_company_plan_limits($1)", [companyId]),
      ]);

      if (usageResult.rows.length > 0 && limitsResult.rows.length > 0) {
        const usage = usageResult.rows[0].stats;
        const limits = limitsResult.rows[0];

        const currentUsage = usage[`current_${resourceType}`] || 0;
        const maxLimit = limits[`max_${resourceType}`] || 0;

        if (maxLimit > 0 && currentUsage > 0) {
          // Intentar crear notificación (la función verifica si es necesaria)
          await pool.query(
            "SELECT create_limit_notification($1, $2, $3, $4, $5)",
            [companyId, resourceType, currentUsage, maxLimit, threshold]
          );
        }
      }

      next();
    } catch (error) {
      console.error(
        `Error monitoring resource usage for ${resourceType}:`,
        error
      );
      // No bloquear el request por error en monitoreo
      next();
    }
  };
};

export {
  requireFeature,
  requireFeatures,
  checkResourceLimit,
  checkDynamicResourceLimit,
  monitorResourceUsage,
};
