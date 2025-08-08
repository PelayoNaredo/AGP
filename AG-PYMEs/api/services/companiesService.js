// =====================================================
// FASE 3 - TAREA 3.2: Servicio de Empresas
// Fecha: 8 de agosto de 2025
// Descripción: API service para operaciones de empresa multi-tenant
// =====================================================

import { http } from "../http";
import { companiesEndpoint } from "../endpoints";

export const CompaniesService = {
  // Obtener datos de la empresa actual
  async getCurrentCompany() {
    try {
      console.log("[CompaniesService] Obteniendo datos de empresa actual...");
      const result = await http.get(companiesEndpoint.current());

      if (result?.success) {
        console.log("[CompaniesService] Datos de empresa obtenidos:", {
          id: result.data.id,
          name: result.data.company_name,
          plan: result.data.subscription_plan,
        });
        return result.data;
      }

      throw new Error(result?.error || "Error al obtener datos de empresa");
    } catch (error) {
      console.error("[CompaniesService] Error getCurrentCompany:", error);
      throw error;
    }
  },

  // Obtener estadísticas de uso
  async getUsageStats() {
    try {
      console.log("[CompaniesService] Obteniendo estadísticas de uso...");
      const result = await http.get(companiesEndpoint.usage());

      if (result?.success) {
        console.log("[CompaniesService] Estadísticas obtenidas:", result.data);
        return result.data;
      }

      throw new Error(result?.error || "Error al obtener estadísticas");
    } catch (error) {
      console.error("[CompaniesService] Error getUsageStats:", error);
      throw error;
    }
  },

  // Obtener límites y porcentajes
  async getLimits() {
    try {
      console.log("[CompaniesService] Obteniendo límites de empresa...");
      const result = await http.get(companiesEndpoint.limits());

      if (result?.success) {
        console.log("[CompaniesService] Límites obtenidos:", result.data);
        return result.data;
      }

      throw new Error(result?.error || "Error al obtener límites");
    } catch (error) {
      console.error("[CompaniesService] Error getLimits:", error);
      throw error;
    }
  },

  // Actualizar configuración de empresa
  async updateSettings(settings) {
    try {
      console.log("[CompaniesService] Actualizando configuración:", settings);
      const result = await http.put(companiesEndpoint.settings(), settings);

      if (result?.success) {
        console.log(
          "[CompaniesService] Configuración actualizada:",
          result.data
        );
        return result.data;
      }

      throw new Error(result?.error || "Error al actualizar configuración");
    } catch (error) {
      console.error("[CompaniesService] Error updateSettings:", error);
      throw error;
    }
  },

  // Validar límites antes de crear recursos
  async validateLimit(resourceType, quantity = 1) {
    try {
      console.log("[CompaniesService] Validando límite:", {
        resourceType,
        quantity,
      });
      const result = await http.post(companiesEndpoint.validateLimit(), {
        resource_type: resourceType,
        quantity,
      });

      if (result?.success) {
        const canAdd = result.data.can_add;
        console.log("[CompaniesService] Validación de límite:", {
          resourceType,
          quantity,
          canAdd,
          message: result.data.message,
        });
        return {
          canAdd,
          message: result.data.message,
        };
      }

      throw new Error(result?.error || "Error al validar límite");
    } catch (error) {
      console.error("[CompaniesService] Error validateLimit:", error);
      // En caso de error de red, ser permisivo
      return {
        canAdd: true,
        message: "No se pudo validar el límite, se permite la operación",
      };
    }
  },

  // Generar invitación para nuevo usuario
  async generateInvitation(invitedEmail) {
    try {
      console.log(
        "[CompaniesService] Generando invitación para:",
        invitedEmail
      );
      const result = await http.post(companiesEndpoint.invitation(), {
        invited_email: invitedEmail,
      });

      if (result?.success) {
        console.log("[CompaniesService] Invitación generada:", result.data);
        return result.data;
      }

      throw new Error(result?.error || "Error al generar invitación");
    } catch (error) {
      console.error("[CompaniesService] Error generateInvitation:", error);
      throw error;
    }
  },

  // Obtener usuarios de la empresa
  async getCompanyUsers() {
    try {
      console.log("[CompaniesService] Obteniendo usuarios de empresa...");
      const result = await http.get(companiesEndpoint.users());

      if (result?.success) {
        console.log("[CompaniesService] Usuarios obtenidos:", {
          count: result.count,
          users: result.data.map((u) => ({
            id: u.id,
            email: u.email,
            role: u.role,
          })),
        });
        return result.data;
      }

      throw new Error(result?.error || "Error al obtener usuarios");
    } catch (error) {
      console.error("[CompaniesService] Error getCompanyUsers:", error);
      throw error;
    }
  },

  // Helper para formatear nombres de recursos
  getResourceDisplayName(resourceType) {
    const names = {
      users: "Usuarios",
      clients: "Clientes",
      products: "Productos",
      storage: "Almacenamiento",
    };

    return names[resourceType] || resourceType;
  },

  // Helper para formatear valores de límites
  formatLimitValue(resourceType, value) {
    // Normalizar el valor a número seguro (permitir 0)
    const numeric =
      typeof value === "number" && !isNaN(value)
        ? value
        : value != null && !isNaN(Number(value))
          ? Number(value)
          : 0;

    if (resourceType === "storage") {
      const mb = numeric;
      if (mb >= 1024) {
        return `${(mb / 1024).toFixed(1)} GB`;
      }
      return `${mb} MB`;
    }

    return String(numeric);
  },

  // Verificar si se puede realizar una acción
  canPerformAction(limits, usageStats, resourceType, quantity = 1) {
    const currentKey = `current_${resourceType}`;
    const maxKey = `max_${resourceType}`;

    const current = usageStats[currentKey] || 0;
    const max = limits[maxKey] || 0;

    return current + quantity <= max;
  },

  // Calcular porcentaje de uso
  calculateUsagePercentage(current, max) {
    if (max === 0) return 0;
    return Math.round((current / max) * 100);
  },

  // Obtener resumen de límites críticos
  getCriticalLimits(limits) {
    const critical = [];
    const resourceTypes = ["users", "clients", "products", "storage"];

    resourceTypes.forEach((type) => {
      const percentage = limits[`${type}_percentage`] || 0;
      if (percentage >= 90) {
        critical.push({
          type,
          percentage,
          displayName: this.getResourceDisplayName(type),
        });
      }
    });

    return critical;
  },

  // Helper para alertas visuales de uso de límites
  getLimitAlert(resourceType, percentage) {
    if (percentage >= 100) {
      return {
        shouldWarn: true,
        color: "#FF5252",
        message: "Límite alcanzado",
      };
    }
    if (percentage >= 90) {
      return {
        shouldWarn: true,
        color: "#FF9800",
        message: "Cerca del límite",
      };
    }
    if (percentage >= 75) {
      return {
        shouldWarn: true,
        color: "#FFC107",
        message: "Límite en progreso",
      };
    }
    return { shouldWarn: false, color: "#4CAF50", message: "Disponible" };
  },
};
