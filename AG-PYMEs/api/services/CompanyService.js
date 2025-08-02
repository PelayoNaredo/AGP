import { EdgeFunctions } from "../../config/supabase";

// Servicio para gestión de empresas - Migrado a Edge Functions
const CompanyService = {
  // Obtener información de empresa por ID
  getById: async (companyId) => {
    try {
      const result = await EdgeFunctions.companies.getById(companyId);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error obteniendo empresa");
      }
    } catch (error) {
      console.error("Error getting company by ID:", error);
      throw error;
    }
  },

  // Obtener estadísticas de uso
  getUsageStats: async (companyId) => {
    try {
      const result = await EdgeFunctions.companies.getUsageStats(companyId);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error obteniendo estadísticas");
      }
    } catch (error) {
      console.error("Error getting usage stats:", error);
      throw error;
    }
  },

  // Crear nueva empresa
  create: async (companyData) => {
    try {
      const result = await EdgeFunctions.companies.create(companyData);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error creando empresa");
      }
    } catch (error) {
      console.error("Error creating company:", error);
      throw error;
    }
  },

  // Actualizar empresa
  update: async (companyId, updates) => {
    try {
      const result = await EdgeFunctions.companies.update(companyId, updates);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error actualizando empresa");
      }
    } catch (error) {
      console.error("Error updating company:", error);
      throw error;
    }
  },

  // Validar código de empresa
  validateCode: async (companyCode) => {
    try {
      const result = await EdgeFunctions.companies.validateCode(companyCode);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Código de empresa inválido");
      }
    } catch (error) {
      console.error("Error validating company code:", error);
      throw error;
    }
  },

  // Generar código de invitación
  generateInvitation: async (companyId) => {
    try {
      const result =
        await EdgeFunctions.companies.generateInvitation(companyId);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error generando invitación");
      }
    } catch (error) {
      console.error("Error generating invitation:", error);
      throw error;
    }
  },

  // Usar código de invitación
  useInvitation: async (invitationCode) => {
    try {
      const result =
        await EdgeFunctions.companies.useInvitation(invitationCode);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Código de invitación inválido");
      }
    } catch (error) {
      console.error("Error using invitation:", error);
      throw error;
    }
  },

  // Obtener configuraciones de empresa
  getSettings: async (companyId) => {
    try {
      const result = await EdgeFunctions.companies.getSettings(companyId);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error obteniendo configuraciones");
      }
    } catch (error) {
      console.error("Error getting company settings:", error);
      throw error;
    }
  },

  // Actualizar configuraciones de empresa
  updateSettings: async (companyId, settings) => {
    try {
      const result = await EdgeFunctions.companies.updateSettings(
        companyId,
        settings
      );
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error actualizando configuraciones");
      }
    } catch (error) {
      console.error("Error updating company settings:", error);
      throw error;
    }
  },

  // Validar límites antes de una acción
  validateLimit: async (companyId, resource, amount = 1) => {
    try {
      const result = await EdgeFunctions.companies.validateLimit(
        companyId,
        resource,
        amount
      );
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error validando límite");
      }
    } catch (error) {
      console.error("Error validating limit:", error);
      throw error;
    }
  },

  // Obtener información del plan actual
  getPlanDetails: async (companyId) => {
    try {
      const result = await EdgeFunctions.companies.getPlanDetails(companyId);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error obteniendo detalles del plan");
      }
    } catch (error) {
      console.error("Error getting plan details:", error);
      throw error;
    }
  },

  // Actualizar plan de suscripción
  updatePlan: async (companyId, newPlan) => {
    try {
      const result = await EdgeFunctions.companies.updatePlan(
        companyId,
        newPlan
      );
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error actualizando plan");
      }
    } catch (error) {
      console.error("Error updating plan:", error);
      throw error;
    }
  },
};

export default CompanyService;
