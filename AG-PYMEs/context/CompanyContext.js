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
  const auth = useAuth(); // Obtener TODO el contexto de auth

  console.log("🏢 CompanyContext initialized with auth state:", {
    isAuthenticated: auth.isAuthenticated,
    user: !!auth.user,
    loading: auth.loading,
    company_id: auth.user?.company_id,
  });

  // Cargar datos de empresa cuando el usuario esté autenticado Y auth context ready
  useEffect(() => {
    console.log("🏢 CompanyContext useEffect triggered:", {
      isAuthenticated: auth.isAuthenticated,
      user: !!auth.user,
      company_id: auth.user?.company_id,
      authLoading: auth.loading,
    });

    // ✅ DEPENDENCY GATES - Esperar a que AuthContext esté completamente listo
    if (!auth.isAuthenticated) {
      console.log("🏢 User not authenticated, waiting...");
      setLoading(false);
      return;
    }

    if (!auth.user) {
      console.log("🏢 User object not ready, waiting...");
      return; // Wait for complete user object
    }

    if (auth.loading) {
      console.log("🏢 AuthContext still loading, waiting...");
      return; // Wait for AuthContext completion BEFORE checking company_id
    }

    if (!auth.user.company_id) {
      console.log("🏢 User without company_id - showing error");
      setError("Usuario sin empresa asignada");
      setLoading(false);
      return;
    }

    // ✅ NOW SAFE TO PROCEED
    console.log("🏢 All conditions met, loading company data...");
    loadCompanyData();
  }, [auth.isAuthenticated, auth.user, auth.loading]); // Complete dependencies

  const loadCompanyData = async () => {
    try {
      console.log("🏢 Loading company data for company:", auth.user.company_id);
      setLoading(true);
      setError(null);

      // ✅ USAR NUEVA ENTERPRISE EDGE FUNCTION PARA DATOS DE EMPRESA
      try {
        console.log("🔄 Getting company data via Enterprise Edge Function...");

        const response = await fetch(
          `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/companies/current`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${auth.session.access_token}`,
              "Content-Type": "application/json",
              apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
            },
          }
        );

        if (response.ok) {
          const result = await response.json();

          // Enterprise template format: { success: true, data: {...} }
          if (result.success && result.data) {
            console.log(
              "✅ Company data loaded via Enterprise Edge Function:",
              result.data.name
            );

            setCompany(result.data);
            setSettings({
              company_name: result.data.name,
              default_currency: "EUR",
              tax_rate: 21,
            });
            setUsage({
              users: 1,
              clients: 0,
              products: 0,
              storageMB: 0,
            });

            console.log(
              "✅ Company data loaded successfully via Enterprise Edge Function"
            );
            return;
          }
        }

        console.log(
          "⚠️ Enterprise Edge Function response not valid, using fallback"
        );
      } catch (edgeError) {
        console.log("⚠️ Enterprise Edge Function failed:", edgeError.message);
      }

      // FALLBACK: Usar datos de empresa del usuario (sistema dual)
      if (auth.user.company) {
        console.log(
          "✅ Using company data from user object:",
          auth.user.company
        );
        setCompany(auth.user.company);
      } else {
        // Fallback final: datos por defecto si no están en user
        console.log(
          "⚠️ Using default company data (company not in user object)"
        );
        setCompany({
          id: auth.user.company_id,
          name: "Mi Empresa",
          subscription_plan: "basic",
          max_users: 5,
          max_clients: 100,
          max_products: 500,
          max_storage_mb: 1000,
        });
      }

      setSettings({
        company_name: auth.user.company?.name || "Mi Empresa",
        default_currency: "EUR",
        tax_rate: 21,
      });

      setUsage({
        users: 1,
        clients: 0,
        products: 0,
        storageMB: 0,
      });

      console.log("✅ Company data loaded successfully");

      // TODO: Implementar cuando las EdgeFunctions estén listas para datos en tiempo real
      // const [companyResult, settingsResult, usageResult] =
      //   await Promise.allSettled([
      //     EdgeFunctions.companies.getById(auth.user.company_id),
      //     EdgeFunctions.companies.getSettings(auth.user.company_id),
      //     EdgeFunctions.companies.getUsageStats(auth.user.company_id),
      //   ]);
    } catch (error) {
      console.error("❌ Error general cargando datos de empresa:", error);
      setError("Error cargando datos de empresa");

      // Establecer datos por defecto para evitar bloqueos
      setCompany({
        id: auth.user.company_id,
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

  // Funciones para validar límites usando Edge Functions
  const checkLimit = async (resource, amount = 1) => {
    if (!company?.id) return false;

    try {
      // ✅ USAR NUEVA ENTERPRISE EDGE FUNCTION PARA VALIDAR LÍMITES
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/companies/validate-limit`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${auth.session.access_token}`,
            "Content-Type": "application/json",
            apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            resource,
            amount,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        // Enterprise template format: { success: true, data: {...} }
        return result.success && result.data?.canProceed;
      }

      return false;
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
    if (!auth.isAuthenticated || !auth.user?.company_id) return;

    try {
      setLoading(true);
      setError(null);

      const [companyResult, usageResult] = await Promise.allSettled([
        EdgeFunctions.companies.getById(auth.user.company_id),
        EdgeFunctions.companies.getUsageStats(auth.user.company_id),
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
