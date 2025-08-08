// =====================================================
// FASE 4 - TAREA 4.8: Servicio de Planes Frontend
// Fecha: 8 de agosto de 2025
// Descripción: Servicio para gestión de planes de suscripción
// =====================================================

import http from "../http";

const PlansService = {
  // Obtener todos los planes disponibles
  getAvailablePlans: async () => {
    try {
      const response = await http.get("/companies/plans");
      return response.data;
    } catch (error) {
      console.error("Error fetching available plans:", error);
      throw error;
    }
  },

  // Obtener historial de suscripciones
  getSubscriptionHistory: async (limit = 10) => {
    try {
      const response = await http.get(
        `/companies/subscription-history?limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching subscription history:", error);
      throw error;
    }
  },

  // Obtener notificaciones de límites
  getLimitNotifications: async (unacknowledgedOnly = true) => {
    try {
      const response = await http.get(
        `/companies/notifications?unacknowledged_only=${unacknowledgedOnly}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching limit notifications:", error);
      throw error;
    }
  },

  // Marcar notificación como reconocida
  acknowledgeNotification: async (notificationId) => {
    try {
      const response = await http.put(
        `/companies/notifications/${notificationId}/acknowledge`
      );
      return response.data;
    } catch (error) {
      console.error("Error acknowledging notification:", error);
      throw error;
    }
  },

  // Verificar acceso a funcionalidad
  checkFeatureAccess: async (featureName) => {
    try {
      const response = await http.get(`/companies/features/${featureName}`);
      return response.data;
    } catch (error) {
      console.error("Error checking feature access:", error);
      throw error;
    }
  },

  // Crear notificación de límite (para testing)
  createLimitNotification: async (
    resourceType,
    currentUsage,
    maxLimit,
    threshold = 90
  ) => {
    try {
      const response = await http.post("/companies/notifications", {
        resource_type: resourceType,
        current_usage: currentUsage,
        max_limit: maxLimit,
        threshold_percentage: threshold,
      });
      return response.data;
    } catch (error) {
      console.error("Error creating limit notification:", error);
      throw error;
    }
  },

  // === MÉTODOS UTILITARIOS ===

  // Formatear precio
  formatPrice: (price, currency = "USD") => {
    if (price === 0) return "Gratis";
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: currency === "USD" ? "USD" : "EUR",
    }).format(price);
  },

  // Obtener color del plan
  getPlanColor: (planCode) => {
    const colors = {
      basic: "#4CAF50",
      professional: "#2196F3",
      enterprise: "#9C27B0",
      custom: "#FF9800",
    };
    return colors[planCode] || "#757575";
  },

  // Obtener icono del plan
  getPlanIcon: (planCode) => {
    const icons = {
      basic: "card-outline",
      professional: "business-outline",
      enterprise: "business",
      custom: "star-outline",
    };
    return icons[planCode] || "card-outline";
  },

  // Comparar planes
  comparePlans: (currentPlan, targetPlan) => {
    const features = [
      "max_users",
      "max_clients",
      "max_products",
      "max_storage_mb",
      "max_orders",
      "max_invoices",
      "max_employees",
    ];

    const comparison = {
      is_upgrade: false,
      is_downgrade: false,
      changes: [],
    };

    let upgradeCount = 0;
    let downgradeCount = 0;

    features.forEach((feature) => {
      const current = currentPlan[feature] || 0;
      const target = targetPlan[feature] || 0;

      if (target === -1 || (current !== -1 && target > current)) {
        upgradeCount++;
        comparison.changes.push({
          feature,
          type: "upgrade",
          current,
          target,
          displayName: PlansService.getFeatureDisplayName(feature),
        });
      } else if (current === -1 || (target !== -1 && target < current)) {
        downgradeCount++;
        comparison.changes.push({
          feature,
          type: "downgrade",
          current,
          target,
          displayName: PlansService.getFeatureDisplayName(feature),
        });
      }
    });

    comparison.is_upgrade = upgradeCount > downgradeCount;
    comparison.is_downgrade = downgradeCount > upgradeCount;

    return comparison;
  },

  // Obtener nombre mostrable de característica
  getFeatureDisplayName: (featureName) => {
    const names = {
      max_users: "Usuarios",
      max_clients: "Clientes",
      max_products: "Productos",
      max_storage_mb: "Almacenamiento",
      max_orders: "Pedidos",
      max_invoices: "Facturas",
      max_employees: "Empleados",
    };
    return names[featureName] || featureName;
  },

  // Formatear límite para mostrar
  formatLimit: (value, featureName) => {
    if (value === -1) return "Ilimitado";

    if (featureName === "max_storage_mb") {
      if (value >= 1024) {
        return `${Math.round((value / 1024) * 100) / 100} GB`;
      }
      return `${value} MB`;
    }

    return value.toString();
  },

  // Verificar si una funcionalidad está disponible
  hasFeature: (plan, featureName) => {
    if (!plan.features) return false;
    return plan.features[featureName] === true;
  },

  // Obtener funcionalidades principales de un plan
  getMainFeatures: (plan) => {
    const mainFeatures = [
      "inventory_management",
      "sales_analytics",
      "advanced_reports",
      "api_access",
      "multi_location",
      "custom_fields",
      "priority_support",
    ];

    return mainFeatures
      .filter((feature) => PlansService.hasFeature(plan, feature))
      .map((feature) => ({
        key: feature,
        name: PlansService.getFeatureDisplayName(feature),
        available: true,
      }));
  },

  // Obtener tipo de notificación con color y mensaje
  getNotificationStyle: (notificationType) => {
    const styles = {
      warning: {
        color: "#FFC107",
        backgroundColor: "#FFF8E1",
        icon: "warning-outline",
        title: "Advertencia",
      },
      critical: {
        color: "#FF9800",
        backgroundColor: "#FFF3E0",
        icon: "alert-outline",
        title: "Crítico",
      },
      limit_reached: {
        color: "#FF5252",
        backgroundColor: "#FFEBEE",
        icon: "stop-circle-outline",
        title: "Límite Alcanzado",
      },
      limit_exceeded: {
        color: "#D32F2F",
        backgroundColor: "#FFCDD2",
        icon: "block-helper",
        title: "Límite Excedido",
      },
    };

    return (
      styles[notificationType] || {
        color: "#757575",
        backgroundColor: "#F5F5F5",
        icon: "information-outline",
        title: "Información",
      }
    );
  },

  // Calcular ahorro anual
  calculateYearlySavings: (plan) => {
    if (!plan.monthly_price || !plan.yearly_price) return 0;

    const monthlyTotal = plan.monthly_price * 12;
    const yearlyPrice = plan.yearly_price;

    return monthlyTotal - yearlyPrice;
  },

  // Verificar si un plan es recomendado basado en el uso actual
  isRecommendedPlan: (plan, currentUsage) => {
    if (!currentUsage || !plan) return false;

    const resources = ["users", "clients", "products"];
    let recommendationScore = 0;

    resources.forEach((resource) => {
      const current = currentUsage[`current_${resource}`] || 0;
      const planLimit = plan[`max_${resource}`] || 0;

      if (planLimit === -1) {
        recommendationScore += 2; // Ilimitado es bueno
      } else if (planLimit > current * 2) {
        recommendationScore += 2; // Mucho espacio para crecer
      } else if (planLimit > current * 1.5) {
        recommendationScore += 1; // Espacio razonable
      } else if (planLimit <= current) {
        recommendationScore -= 2; // No suficiente
      }
    });

    return recommendationScore >= 3;
  },

  // Obtener sugerencia de plan basada en uso actual
  getSuggestedPlan: (plans, currentUsage) => {
    if (!plans || !currentUsage) return null;

    return (
      plans.find((plan) =>
        PlansService.isRecommendedPlan(plan, currentUsage)
      ) || plans[0]
    ); // Fallback al primer plan
  },
};

export default PlansService;
