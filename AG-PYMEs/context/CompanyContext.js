import React, { createContext, useState, useContext, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { EdgeFunctions } from "../config/supabase";

const CompanyContext = createContext(null);

export const CompanyProvider = ({ children }) => {
  const [company, setCompany] = useState(null);
  const [settings, setSettings] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, profile } = useAuth();

  // Cargar datos de empresa cuando el usuario esté autenticado
  useEffect(() => {
    const loadCompanyData = async () => {
      // Esperar a que tanto user como profile estén disponibles
      if (!user || !profile?.company_id) {
        console.log("🏢 No user or company_id, skipping company data load", {
          user: !!user,
          profile: !!profile,
          company_id: profile?.company_id,
        });
        setLoading(false);
        return;
      }

      try {
        console.log("🏢 Loading company data for company:", profile.company_id);
        setLoading(true);
        setError(null);

        // TEMPORAL: Usar datos por defecto hasta implementar EdgeFunctions de companies
        console.log(
          "⚠️ Using default company data (EdgeFunctions not implemented yet)"
        );

        setCompany({
          id: profile.company_id,
          name: "Mi Empresa",
          subscription_plan: "basic",
          max_users: 5,
          max_clients: 100,
          max_products: 500,
          max_storage_mb: 1000,
        });

        setSettings({
          company_name: "Mi Empresa",
          default_currency: "EUR",
          tax_rate: 21,
        });

        setUsage({
          users: 1,
          clients: 0,
          products: 0,
          storageMB: 0,
        });

        console.log("✅ Default company data loaded");

        // TODO: Implementar cuando las EdgeFunctions estén listas
        // const [companyResult, settingsResult, usageResult] =
        //   await Promise.allSettled([
        //     EdgeFunctions.companies.getById(profile.company_id),
        //     EdgeFunctions.companies.getSettings(profile.company_id),
        //     EdgeFunctions.companies.getUsageStats(profile.company_id),
        //   ]);
      } catch (error) {
        console.error("❌ Error general cargando datos de empresa:", error);
        setError("Error cargando datos de empresa");

        // Establecer datos por defecto para evitar bloqueos
        setCompany({
          id: profile.company_id,
          name: "Mi Empresa",
          subscription_plan: "basic",
          max_users: 5,
          max_clients: 100,
          max_products: 500,
          max_storage_mb: 1000,
        });
        setSettings({
          company_name: "Mi Empresa",
          default_currency: "EUR",
          tax_rate: 21,
        });
        setUsage({
          users: 1,
          clients: 0,
          products: 0,
          storageMB: 0,
        });
      } finally {
        setLoading(false);
        console.log("🏢 Company context loading completed");
      }
    };

    loadCompanyData();
  }, [user, profile?.company_id]);

  // Funciones para validar límites usando Edge Functions
  const checkLimit = async (resource, amount = 1) => {
    if (!company?.id) return false;

    try {
      const result = await EdgeFunctions.companies.validateLimit(
        company.id,
        resource,
        amount
      );
      return result.success && result.data.canProceed;
    } catch (error) {
      console.error("Error verificando límite:", error);
      return false;
    }
  };

  const getRemainingLimit = (resource) => {
    if (!company || !usage) return 0;

    const currentUsage = usage[resource] || 0;
    const limits = {
      users: company.max_users,
      clients: company.max_clients,
      products: company.max_products,
      storage: company.max_storage_mb,
    };
    return Math.max(0, limits[resource] - currentUsage);
  };

  // Función para actualizar configuraciones de empresa
  const updateCompanySettings = async (newSettings) => {
    if (!company?.id) {
      throw new Error("No hay empresa activa");
    }

    try {
      setLoading(true);
      const result = await EdgeFunctions.companies.updateSettings(
        company.id,
        newSettings
      );

      if (result.success) {
        setSettings({ ...settings, ...newSettings });
        return result.data;
      } else {
        throw new Error(result.error || "Error actualizando configuraciones");
      }
    } catch (error) {
      console.error("Error actualizando configuraciones:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Función para generar código de invitación
  const generateInvitation = async () => {
    if (!company?.id) {
      throw new Error("No hay empresa activa");
    }

    try {
      const result = await EdgeFunctions.companies.generateInvitation(
        company.id
      );

      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error generando invitación");
      }
    } catch (error) {
      console.error("Error generando invitación:", error);
      throw error;
    }
  };

  // Función para actualizar plan de suscripción
  const updatePlan = async (newPlan) => {
    if (!company?.id) {
      throw new Error("No hay empresa activa");
    }

    try {
      setLoading(true);
      const result = await EdgeFunctions.companies.updatePlan(
        company.id,
        newPlan
      );

      if (result.success) {
        setCompany({ ...company, subscription_plan: newPlan });
        return result.data;
      } else {
        throw new Error(result.error || "Error actualizando plan");
      }
    } catch (error) {
      console.error("Error actualizando plan:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Función para refrescar datos
  const refreshData = async () => {
    if (!user || !profile?.company_id) return;

    try {
      setLoading(true);
      setError(null);

      const [companyResult, usageResult] = await Promise.allSettled([
        EdgeFunctions.companies.getById(profile.company_id),
        EdgeFunctions.companies.getUsageStats(profile.company_id),
      ]);

      if (companyResult.status === "fulfilled" && companyResult.value.success) {
        setCompany(companyResult.value.data);
      }

      if (usageResult.status === "fulfilled" && usageResult.value.success) {
        setUsage(usageResult.value.data);
      }
    } catch (error) {
      console.error("Error refrescando datos:", error);
      setError("Error refrescando datos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CompanyContext.Provider
      value={{
        // Estados principales
        company,
        settings,
        usage,
        loading,
        error,

        // Funciones principales
        checkLimit,
        getRemainingLimit,
        updateCompanySettings,
        generateInvitation,
        updatePlan,
        refreshData,

        // Helpers específicos
        canAddUser: async (amount = 1) => await checkLimit("users", amount),
        canAddClient: async (amount = 1) => await checkLimit("clients", amount),
        canAddProduct: async (amount = 1) =>
          await checkLimit("products", amount),
        isStorageFull: () =>
          usage && company ? usage.storageMB >= company.max_storage_mb : false,

        // Información del plan
        planLimits: company
          ? {
              users: company.max_users,
              clients: company.max_clients,
              products: company.max_products,
              storageMB: company.max_storage_mb,
            }
          : null,

        // Estado de límites (porcentajes)
        limitsStatus:
          company && usage
            ? {
                users: {
                  current: usage.users || 0,
                  max: company.max_users,
                  percentage: Math.round(
                    ((usage.users || 0) / company.max_users) * 100
                  ),
                },
                clients: {
                  current: usage.clients || 0,
                  max: company.max_clients,
                  percentage: Math.round(
                    ((usage.clients || 0) / company.max_clients) * 100
                  ),
                },
                products: {
                  current: usage.products || 0,
                  max: company.max_products,
                  percentage: Math.round(
                    ((usage.products || 0) / company.max_products) * 100
                  ),
                },
                storage: {
                  current: usage.storageMB || 0,
                  max: company.max_storage_mb,
                  percentage: Math.round(
                    ((usage.storageMB || 0) / company.max_storage_mb) * 100
                  ),
                },
              }
            : null,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
};
