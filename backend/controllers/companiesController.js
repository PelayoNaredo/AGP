// =====================================================
// FASE 2 - TAREA 2.3: Controlador de empresas
// Fecha: 8 de agosto de 2025
// Descripción: Gestión de empresas, límites y estadísticas
// =====================================================

import pool from "../db.js";

// Obtener datos de la empresa actual
const getCompanyData = async (req, res) => {
  try {
    const companyId = req.companyId;

    const result = await pool.query(
      `
      SELECT 
        c.id,
        c.company_name,
        c.company_code,
        c.is_active,
        c.created_at,
        c.updated_at,
        sp.plan_code as plan,
        sp.plan_name,
        sp.plan_description,
        sp.features,
        sp.monthly_price,
        sp.yearly_price
      FROM companies c
      LEFT JOIN subscription_plans sp ON c.subscription_plan_id = sp.id
      WHERE c.id = $1 AND c.is_active = true
    `,
      [companyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Empresa no encontrada",
        details: "La empresa no existe o está inactiva",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error getting company data:", error);
    res.status(500).json({
      error: "Error al obtener datos de empresa",
      details: error.message,
    });
  }
};

// Obtener estadísticas de uso de la empresa
const getCompanyUsage = async (req, res) => {
  try {
    const companyId = req.companyId;

    // Usar la función de base de datos que creamos
    const result = await pool.query(
      "SELECT get_company_usage_stats($1) as stats",
      [companyId]
    );

    const stats = result.rows[0].stats;

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error getting company usage:", error);
    res.status(500).json({
      error: "Error al obtener estadísticas de uso",
      details: error.message,
    });
  }
};

// Obtener límites y porcentajes de uso
const getCompanyLimits = async (req, res) => {
  try {
    const companyId = req.companyId;

    // Obtener límites del plan y estadísticas actuales
    const limitsResult = await pool.query(
      "SELECT * FROM get_company_plan_limits($1)",
      [companyId]
    );

    const usageResult = await pool.query(
      "SELECT get_company_usage_stats($1) as stats",
      [companyId]
    );

    if (limitsResult.rows.length === 0) {
      return res.status(404).json({
        error: "Plan no encontrado",
        details: "No se encontró información del plan para esta empresa",
      });
    }

    const limits = limitsResult.rows[0];
    const usage = usageResult.rows[0].stats;

    // Calcular porcentajes
    const calculatePercentage = (current, max) => {
      if (max === -1) return 0; // Ilimitado
      return max > 0 ? Math.round((current / max) * 100) : 0;
    };

    const data = {
      // Límites del plan
      max_users: limits.max_users,
      max_clients: limits.max_clients,
      max_products: limits.max_products,
      max_storage_mb: limits.max_storage_mb,
      max_orders: limits.max_orders,
      max_invoices: limits.max_invoices,
      max_employees: limits.max_employees,

      // Uso actual
      current_users: usage.current_users,
      current_clients: usage.current_clients,
      current_products: usage.current_products,
      current_storage_mb: usage.current_storage_mb,
      current_orders: usage.current_orders || 0,
      current_invoices: usage.current_invoices || 0,
      current_employees: usage.current_employees || 0,

      // Porcentajes
      users_percentage: calculatePercentage(
        usage.current_users,
        limits.max_users
      ),
      clients_percentage: calculatePercentage(
        usage.current_clients,
        limits.max_clients
      ),
      products_percentage: calculatePercentage(
        usage.current_products,
        limits.max_products
      ),
      storage_percentage: calculatePercentage(
        usage.current_storage_mb,
        limits.max_storage_mb
      ),
      orders_percentage: calculatePercentage(
        usage.current_orders || 0,
        limits.max_orders
      ),
      invoices_percentage: calculatePercentage(
        usage.current_invoices || 0,
        limits.max_invoices
      ),
      employees_percentage: calculatePercentage(
        usage.current_employees || 0,
        limits.max_employees
      ),

      // Información del plan
      plan_info: {
        plan_code: limits.plan_code,
        plan_name: limits.plan_name,
        features: limits.features,
        monthly_price: limits.monthly_price,
        yearly_price: limits.yearly_price,
      },
    };

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error getting company limits:", error);
    res.status(500).json({
      error: "Error al obtener límites de empresa",
      details: error.message,
    });
  }
};

// Actualizar configuración de empresa
const updateCompanySettings = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { company_name } = req.body;

    // Solo permitir actualizar el nombre por ahora
    // En el futuro se pueden agregar más campos editables
    if (!company_name || company_name.trim().length === 0) {
      return res.status(400).json({
        error: "Nombre de empresa requerido",
        details: "El nombre de la empresa no puede estar vacío",
      });
    }

    const result = await pool.query(
      `
      UPDATE companies 
      SET 
        company_name = $1,
        updated_at = NOW()
      WHERE id = $2 AND is_active = true
      RETURNING id, company_name, updated_at
    `,
      [company_name.trim(), companyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Empresa no encontrada",
        details: "No se pudo actualizar la empresa",
      });
    }

    res.json({
      success: true,
      message: "Configuración actualizada correctamente",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating company settings:", error);
    res.status(500).json({
      error: "Error al actualizar configuración",
      details: error.message,
    });
  }
};

// Validar límites antes de crear recursos
const validateLimit = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { resource_type, quantity = 1 } = req.body;

    if (!resource_type) {
      return res.status(400).json({
        error: "Tipo de recurso requerido",
        details: "Especifique el tipo de recurso a validar",
      });
    }

    // Usar la función actualizada que considera los planes
    const result = await pool.query(
      "SELECT can_add_resources_with_plan($1, $2, $3) as can_add",
      [companyId, resource_type, quantity]
    );

    const canAdd = result.rows[0].can_add;

    // Si no se puede agregar, verificar si es por límite del plan
    let message = canAdd
      ? `Se pueden agregar ${quantity} ${resource_type}`
      : `Límite alcanzado para ${resource_type}`;

    if (!canAdd) {
      // Obtener información adicional del límite
      const limitsResult = await pool.query(
        "SELECT * FROM get_company_plan_limits($1)",
        [companyId]
      );

      if (limitsResult.rows.length > 0) {
        const limits = limitsResult.rows[0];
        const maxLimit = limits[`max_${resource_type}`];

        if (maxLimit === -1) {
          message = `Recurso ${resource_type} es ilimitado en tu plan`;
        } else {
          message = `Límite del plan alcanzado: ${maxLimit} ${resource_type} máximo. Considera actualizar tu plan.`;
        }
      }
    }

    res.json({
      success: true,
      data: {
        resource_type,
        quantity,
        can_add: canAdd,
        message,
      },
    });
  } catch (error) {
    console.error("Error validating limits:", error);
    res.status(500).json({
      error: "Error al validar límites",
      details: error.message,
    });
  }
};

// Generar código de invitación
const generateInvitation = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { invited_email } = req.body;

    // Verificar límite de usuarios primero
    const limitCheck = await pool.query(
      "SELECT can_add_resources($1, $2, $3) as can_add",
      [companyId, "users", 1]
    );

    if (!limitCheck.rows[0].can_add) {
      return res.status(403).json({
        error: "Límite de usuarios alcanzado",
        details: "No se pueden invitar más usuarios con el plan actual",
      });
    }

    // Generar código de invitación único
    const invitationCode =
      "INV-" + Math.random().toString(36).substring(2, 15).toUpperCase();

    // Insertar invitación en la base de datos (tabla que crearemos después)
    const result = await pool.query(
      `
      INSERT INTO company_invitations (
        company_id, 
        invitation_code, 
        invited_email,
        created_by_user_id,
        status,
        expires_at
      ) VALUES ($1, $2, $3, $4, 'pending', NOW() + INTERVAL '7 days')
      RETURNING id, invitation_code, expires_at
    `,
      [companyId, invitationCode, invited_email, req.user.id]
    );

    res.json({
      success: true,
      message: "Invitación creada correctamente",
      data: {
        invitation_code: result.rows[0].invitation_code,
        expires_at: result.rows[0].expires_at,
        invited_email,
      },
    });
  } catch (error) {
    console.error("Error generating invitation:", error);
    res.status(500).json({
      error: "Error al generar invitación",
      details: error.message,
    });
  }
};

// Listar usuarios de la empresa
const getCompanyUsers = async (req, res) => {
  try {
    const companyId = req.companyId;

    const result = await pool.query(
      `
      SELECT 
        id_usuario as id,
        nombre,
        email,
        rol as role,
        fecha_registro as created_at
      FROM users 
      WHERE company_id = $1
      ORDER BY fecha_registro DESC
    `,
      [companyId]
    );

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Error getting company users:", error);
    res.status(500).json({
      error: "Error al obtener usuarios de empresa",
      details: error.message,
    });
  }
};

// === NUEVOS ENDPOINTS PARA SISTEMA DE PLANES ===

// Listar todos los planes disponibles
const getAvailablePlans = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        id,
        plan_code,
        plan_name,
        plan_description,
        max_users,
        max_clients,
        max_products,
        max_storage_mb,
        max_orders,
        max_invoices,
        max_employees,
        features,
        monthly_price,
        yearly_price,
        sort_order
      FROM subscription_plans 
      WHERE is_active = true AND is_public = true
      ORDER BY sort_order ASC, monthly_price ASC
    `
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error getting available plans:", error);
    res.status(500).json({
      error: "Error al obtener planes disponibles",
      details: error.message,
    });
  }
};

// Obtener historial de suscripciones de la empresa
const getSubscriptionHistory = async (req, res) => {
  try {
    const companyId = req.companyId;
    const limit = parseInt(req.query.limit) || 10;

    const result = await pool.query(
      `
      SELECT 
        sh.id,
        sh.change_type,
        sh.change_reason,
        sh.effective_date,
        sh.expiry_date,
        sh.amount_charged,
        sh.billing_cycle,
        prev_plan.plan_name as previous_plan_name,
        new_plan.plan_name as new_plan_name,
        u.nombre as changed_by_user_name
      FROM subscription_history sh
      LEFT JOIN subscription_plans prev_plan ON sh.previous_plan_id = prev_plan.id
      LEFT JOIN subscription_plans new_plan ON sh.new_plan_id = new_plan.id
      LEFT JOIN users u ON sh.changed_by_user_id = u.id_usuario
      WHERE sh.company_id = $1
      ORDER BY sh.effective_date DESC
      LIMIT $2
    `,
      [companyId, limit]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error getting subscription history:", error);
    res.status(500).json({
      error: "Error al obtener historial de suscripciones",
      details: error.message,
    });
  }
};

// Obtener notificaciones activas de límites
const getLimitNotifications = async (req, res) => {
  try {
    const companyId = req.companyId;
    const unacknowledgedOnly = req.query.unacknowledged_only !== "false";

    const result = await pool.query(
      "SELECT * FROM get_company_notifications($1, $2, $3)",
      [companyId, unacknowledgedOnly, 50]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error getting limit notifications:", error);
    res.status(500).json({
      error: "Error al obtener notificaciones de límites",
      details: error.message,
    });
  }
};

// Marcar notificación como reconocida
const acknowledgeNotification = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { notification_id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `
      UPDATE limit_notifications 
      SET 
        is_acknowledged = true,
        acknowledged_by_user_id = $1,
        acknowledged_at = NOW(),
        updated_at = NOW()
      WHERE id = $2 AND company_id = $3
      RETURNING id, is_acknowledged, acknowledged_at
    `,
      [userId, notification_id, companyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Notificación no encontrada",
        details: "La notificación no existe o no pertenece a esta empresa",
      });
    }

    res.json({
      success: true,
      message: "Notificación marcada como reconocida",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error acknowledging notification:", error);
    res.status(500).json({
      error: "Error al marcar notificación como reconocida",
      details: error.message,
    });
  }
};

// Verificar si la empresa tiene acceso a una funcionalidad
const checkFeatureAccess = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { feature_name } = req.params;

    const result = await pool.query(
      "SELECT company_has_feature($1, $2) as has_access",
      [companyId, feature_name]
    );

    const hasAccess = result.rows[0].has_access;

    res.json({
      success: true,
      data: {
        feature_name,
        has_access: hasAccess,
        message: hasAccess
          ? `Acceso permitido a la funcionalidad: ${feature_name}`
          : `Acceso denegado. Actualiza tu plan para usar: ${feature_name}`,
      },
    });
  } catch (error) {
    console.error("Error checking feature access:", error);
    res.status(500).json({
      error: "Error al verificar acceso a funcionalidad",
      details: error.message,
    });
  }
};

// Crear notificación de límite (para uso interno o testing)
const createLimitNotification = async (req, res) => {
  try {
    const companyId = req.companyId;
    const {
      resource_type,
      current_usage,
      max_limit,
      threshold_percentage = 90,
    } = req.body;

    const result = await pool.query(
      "SELECT create_limit_notification($1, $2, $3, $4, $5) as notification_id",
      [companyId, resource_type, current_usage, max_limit, threshold_percentage]
    );

    const notificationId = result.rows[0].notification_id;

    if (!notificationId) {
      return res.json({
        success: true,
        message:
          "No fue necesario crear una notificación (umbral no alcanzado o ya existe una similar)",
        data: null,
      });
    }

    res.json({
      success: true,
      message: "Notificación de límite creada",
      data: { notification_id: notificationId },
    });
  } catch (error) {
    console.error("Error creating limit notification:", error);
    res.status(500).json({
      error: "Error al crear notificación de límite",
      details: error.message,
    });
  }
};

export {
  getCompanyData,
  getCompanyUsage,
  getCompanyLimits,
  updateCompanySettings,
  validateLimit,
  generateInvitation,
  getCompanyUsers,
  // Nuevos endpoints del sistema de planes
  getAvailablePlans,
  getSubscriptionHistory,
  getLimitNotifications,
  acknowledgeNotification,
  checkFeatureAccess,
  createLimitNotification,
};
