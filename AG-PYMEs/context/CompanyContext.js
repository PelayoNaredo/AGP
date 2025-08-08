// =====================================================
// FASE 3 - TAREA 3.1: Contexto de Empresa
// Fecha: 8 de agosto de 2025
// Descripción: Manejo del contexto de empresa actual en React Native
// =====================================================

import React, { createContext, useContext, useReducer, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";
import { Services } from "../api";

// Estados del contexto de empresa
const CompanyContext = createContext();

// Tipos de acciones
const COMPANY_ACTIONS = {
  SET_COMPANY: "SET_COMPANY",
  SET_USAGE_STATS: "SET_USAGE_STATS",
  SET_LIMITS: "SET_LIMITS",
  SET_USERS: "SET_USERS",
  SET_LOADING: "SET_LOADING",
  SET_ERROR: "SET_ERROR",
  RESET_COMPANY: "RESET_COMPANY",
  UPDATE_USAGE: "UPDATE_USAGE",
};

// Estado inicial
const initialState = {
  // Datos de la empresa actual
  company: null,

  // Estadísticas de uso
  usageStats: {
    current_users: 0,
    current_clients: 0,
    current_products: 0,
    current_storage_mb: 0,
  },

  // Límites y porcentajes
  limits: {
    users_percentage: 0,
    clients_percentage: 0,
    products_percentage: 0,
    storage_percentage: 0,
    max_users: 0,
    max_clients: 0,
    max_products: 0,
    max_storage_mb: 0,
  },

  // Usuarios de la empresa
  users: [],

  // Estados de carga
  loading: false,
  error: null,

  // Flags de carga específicos
  loadingStats: false,
  loadingUsers: false,
};

// Reducer para manejar las acciones
function companyReducer(state, action) {
  switch (action.type) {
    case COMPANY_ACTIONS.SET_COMPANY:
      return {
        ...state,
        company: action.payload,
        error: null,
      };

    case COMPANY_ACTIONS.SET_USAGE_STATS:
      return {
        ...state,
        usageStats: action.payload,
        loadingStats: false,
        error: null,
      };

    case COMPANY_ACTIONS.SET_LIMITS:
      return {
        ...state,
        limits: action.payload,
        error: null,
      };

    case COMPANY_ACTIONS.SET_USERS:
      return {
        ...state,
        users: action.payload,
        loadingUsers: false,
        error: null,
      };

    case COMPANY_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    case COMPANY_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
        loadingStats: false,
        loadingUsers: false,
      };

    case COMPANY_ACTIONS.RESET_COMPANY:
      return {
        ...initialState,
      };

    case COMPANY_ACTIONS.UPDATE_USAGE:
      // Actualizar contadores de uso en tiempo real
      return {
        ...state,
        usageStats: {
          ...state.usageStats,
          ...action.payload,
        },
      };

    default:
      return state;
  }
}

// Provider del contexto
export const CompanyProvider = ({ children }) => {
  const [state, dispatch] = useReducer(companyReducer, initialState);
  const { user, token } = useAuth();

  // Cargar datos de la empresa actual
  const loadCompanyData = async () => {
    if (!token || !user?.company_id) return;

    try {
      dispatch({ type: COMPANY_ACTIONS.SET_LOADING, payload: true });

      const data = await Services.Company.getCurrentCompany();
      if (data) {
        dispatch({
          type: COMPANY_ACTIONS.SET_COMPANY,
          payload: data,
        });
        // Guardar en AsyncStorage para acceso offline
        await AsyncStorage.setItem("@company_data", JSON.stringify(data));
      }
    } catch (error) {
      console.error("Error loading company data:", error);
      dispatch({
        type: COMPANY_ACTIONS.SET_ERROR,
        payload: "Error al cargar datos de la empresa",
      });
      // Intentar cargar desde AsyncStorage como fallback
      try {
        const cachedData = await AsyncStorage.getItem("@company_data");
        if (cachedData) {
          dispatch({
            type: COMPANY_ACTIONS.SET_COMPANY,
            payload: JSON.parse(cachedData),
          });
        }
      } catch (storageError) {
        console.error("Error loading cached company data:", storageError);
      }
    } finally {
      dispatch({ type: COMPANY_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Cargar estadísticas de uso
  const loadUsageStats = async () => {
    if (!token || !user?.company_id) return;

    try {
      dispatch({ type: COMPANY_ACTIONS.SET_LOADING, payload: true });

      const data = await Services.Company.getUsageStats();
      if (data) {
        dispatch({
          type: COMPANY_ACTIONS.SET_USAGE_STATS,
          payload: data,
        });
      }
    } catch (error) {
      console.error("Error loading usage stats:", error);
      dispatch({
        type: COMPANY_ACTIONS.SET_ERROR,
        payload: "Error al cargar estadísticas de uso",
      });
    }
  };

  // Cargar límites y porcentajes
  const loadLimits = async () => {
    if (!token || !user?.company_id) return;

    try {
      const data = await Services.Company.getLimits();
      if (data) {
        dispatch({
          type: COMPANY_ACTIONS.SET_LIMITS,
          payload: data,
        });
      }
    } catch (error) {
      console.error("Error loading limits:", error);
      dispatch({
        type: COMPANY_ACTIONS.SET_ERROR,
        payload: "Error al cargar límites de empresa",
      });
    }
  };

  // Cargar usuarios de la empresa
  const loadCompanyUsers = async () => {
    if (!token || !user?.company_id) return;

    try {
      dispatch({ type: COMPANY_ACTIONS.SET_LOADING, payload: true });

      const users = await Services.Company.getCompanyUsers();
      if (users) {
        dispatch({
          type: COMPANY_ACTIONS.SET_USERS,
          payload: users,
        });
      }
    } catch (error) {
      console.error("Error loading company users:", error);
      dispatch({
        type: COMPANY_ACTIONS.SET_ERROR,
        payload: "Error al cargar usuarios de la empresa",
      });
    }
  };

  // Actualizar configuración de empresa
  const updateCompanySettings = async (settings) => {
    if (!token || !user?.company_id) return false;

    try {
      dispatch({ type: COMPANY_ACTIONS.SET_LOADING, payload: true });

      const updated = await Services.Company.updateSettings(settings);
      if (updated) {
        // Actualizar datos locales
        dispatch({
          type: COMPANY_ACTIONS.SET_COMPANY,
          payload: {
            ...state.company,
            ...updated,
          },
        });
        // Actualizar cache
        const updatedCompany = { ...state.company, ...updated };
        await AsyncStorage.setItem(
          "@company_data",
          JSON.stringify(updatedCompany)
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating company settings:", error);
      dispatch({
        type: COMPANY_ACTIONS.SET_ERROR,
        payload: "Error al actualizar configuración",
      });
      return false;
    } finally {
      dispatch({ type: COMPANY_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Validar límites antes de crear recursos
  const validateLimit = async (resourceType, quantity = 1) => {
    if (!token || !user?.company_id) return false;

    try {
      const res = await Services.Company.validateLimit(resourceType, quantity);
      return !!res?.canAdd;
    } catch (error) {
      console.error("Error validating limit:", error);
      return false;
    }
  };

  // Generar invitación para nuevo usuario
  const generateInvitation = async (invitedEmail) => {
    if (!token || !user?.company_id) return null;

    try {
      const invitation =
        await Services.Company.generateInvitation(invitedEmail);
      return invitation || null;
    } catch (error) {
      console.error("Error generating invitation:", error);
      dispatch({
        type: COMPANY_ACTIONS.SET_ERROR,
        payload: "Error al generar invitación",
      });
      return null;
    }
  };

  // Actualizar contadores de uso en tiempo real
  const updateUsageCounter = (resourceType, increment = 1) => {
    const updates = {};

    switch (resourceType) {
      case "users":
        updates.current_users = Math.max(
          0,
          state.usageStats.current_users + increment
        );
        break;
      case "clients":
        updates.current_clients = Math.max(
          0,
          state.usageStats.current_clients + increment
        );
        break;
      case "products":
        updates.current_products = Math.max(
          0,
          state.usageStats.current_products + increment
        );
        break;
      case "storage":
        updates.current_storage_mb = Math.max(
          0,
          state.usageStats.current_storage_mb + increment
        );
        break;
    }

    if (Object.keys(updates).length > 0) {
      dispatch({ type: COMPANY_ACTIONS.UPDATE_USAGE, payload: updates });
    }
  };

  // Refrescar todos los datos
  const refreshAllData = async () => {
    await Promise.all([
      loadCompanyData(),
      loadUsageStats(),
      loadLimits(),
      loadCompanyUsers(),
    ]);
  };

  // Limpiar contexto al hacer logout
  const resetCompany = () => {
    dispatch({ type: COMPANY_ACTIONS.RESET_COMPANY });
    AsyncStorage.removeItem("@company_data");
  };

  // Cargar datos iniciales cuando el usuario esté autenticado
  useEffect(() => {
    if (user?.company_id && token) {
      refreshAllData();
    } else {
      resetCompany();
    }
  }, [user?.company_id, token]);

  // Valores del contexto
  const contextValue = {
    // Estado
    ...state,

    // Funciones
    loadCompanyData,
    loadUsageStats,
    loadLimits,
    loadCompanyUsers,
    updateCompanySettings,
    validateLimit,
    generateInvitation,
    updateUsageCounter,
    refreshAllData,
    resetCompany,

    // Helpers
    isLimitReached: (resourceType) => {
      switch (resourceType) {
        case "users":
          return state.limits.users_percentage >= 100;
        case "clients":
          return state.limits.clients_percentage >= 100;
        case "products":
          return state.limits.products_percentage >= 100;
        case "storage":
          return state.limits.storage_percentage >= 100;
        default:
          return false;
      }
    },

    getUsagePercentage: (resourceType) => {
      switch (resourceType) {
        case "users":
          return state.limits.users_percentage;
        case "clients":
          return state.limits.clients_percentage;
        case "products":
          return state.limits.products_percentage;
        case "storage":
          return state.limits.storage_percentage;
        default:
          return 0;
      }
    },
  };

  return (
    <CompanyContext.Provider value={contextValue}>
      {children}
    </CompanyContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
};

export default CompanyContext;
