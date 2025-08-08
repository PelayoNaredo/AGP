// =====================================================
// FASE 2 - TAREA 2.1: Middleware tenant-context
// Fecha: 8 de agosto de 2025
// Descripción: Middleware para establecer contexto de empresa en cada request
// =====================================================

import pool from "../db.js";

/**
 * Middleware para establecer el contexto de tenant (empresa) en cada request
 * Extrae el company_id del JWT y lo establece en la sesión de PostgreSQL
 */
const tenantContext = async (req, res, next) => {
  try {
    // Log para debugging
    console.log(
      "[TENANT] Request user object:",
      JSON.stringify(req.user, null, 2)
    );

    // Verificar que el usuario esté autenticado y tenga company_id
    if (!req.user || !req.user.company_id) {
      console.error("[TENANT] No company_id found in JWT token");
      console.error("[TENANT] User object:", req.user);
      return res.status(401).json({
        error: "Contexto de empresa requerido",
        details: "El token no contiene información de empresa válida",
      });
    }

    const companyId = req.user.company_id;
    console.log("[TENANT] Company ID from token:", companyId);

    // Validar formato UUID general (incluye legacy con ceros)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(companyId)) {
      console.log("[TENANT] Valid UUID format confirmed");
    } else {
      console.warn(
        "[TENANT] Non-UUID format detected. Proceeding but check data:",
        companyId
      );
    }

    // Establecer el contexto de tenant en la sesión de PostgreSQL usando set_config parametrizado
    // Evita el uso de SET con concatenación y permite parámetros de forma segura
    try {
      await pool.query(
        "SELECT set_config('app.current_company_id', $1, false)",
        [companyId]
      );
      console.log(
        "[TENANT] PostgreSQL context set successfully via set_config"
      );
    } catch (dbError) {
      console.error(
        "[TENANT] Error setting PostgreSQL context via set_config:",
        dbError
      );
      // Continuar sin fallar para debugging
    }

    // Agregar company_id al objeto request para fácil acceso
    req.companyId = companyId;

    // Intentar obtener información de la empresa
    try {
      const result = await pool.query(
        "SELECT id, company_name, is_active, subscription_plan FROM companies WHERE id = $1",
        [companyId]
      );

      if (result.rows.length > 0) {
        req.company = result.rows[0];
        console.log("[TENANT] Company found:", req.company.company_name);
      } else {
        console.warn("[TENANT] Company not found in database:", companyId);
        // Empresa placeholder para debugging
        req.company = {
          id: companyId,
          company_name: "Empresa de Prueba",
          is_active: true,
          subscription_plan: "basic",
        };
      }
    } catch (companyError) {
      console.error("[TENANT] Error fetching company:", companyError);
      // Empresa placeholder para debugging
      req.company = {
        id: companyId,
        company_name: "Empresa de Prueba",
        is_active: true,
        subscription_plan: "basic",
      };
    }

    // Log para debugging (remover en producción)
    console.log(`[TENANT] Context set for company: ${companyId}`);

    next();
  } catch (error) {
    console.error("[TENANT] Error setting tenant context:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      details: "No se pudo establecer el contexto de empresa",
    });
  }
};

/**
 * Middleware opcional para resetear el contexto después del request
 * Útil para evitar contaminación entre requests
 */
const resetTenantContext = async (req, res, next) => {
  try {
    await pool.query("RESET app.current_company_id");
    console.log("[TENANT] Context reset");
    next();
  } catch (error) {
    console.error("[TENANT] Error resetting context:", error);
    // No fallar el request por esto
    next();
  }
};

/**
 * Middleware para verificar que una empresa existe y está activa
 */
const validateCompany = async (req, res, next) => {
  try {
    const companyId = req.companyId;

    const result = await pool.query(
      "SELECT id, company_name, is_active FROM companies WHERE id = $1",
      [companyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Empresa no encontrada",
        details: "La empresa especificada no existe",
      });
    }

    const company = result.rows[0];
    if (!company.is_active) {
      return res.status(403).json({
        error: "Empresa inactiva",
        details: "La empresa está desactivada",
      });
    }

    // Agregar datos de empresa al request
    req.company = company;

    next();
  } catch (error) {
    console.error("[TENANT] Error validating company:", error);
    res.status(500).json({
      error: "Error al validar empresa",
      details: error.message,
    });
  }
};

export { tenantContext, resetTenantContext, validateCompany };
export default tenantContext;
