/**
 * GlobalCacheProvider - Proveedor Principal del Cache Unificado
 *
 * Componente proveedor que reemplaza múltiples providers de cache individuales
 * con una solución unificada. Mantiene compatibilidad con APIs existentes
 * mientras proporciona funcionalidades avanzadas.
 *
 * Características:
 * - Integración con UnifiedCacheManager
 * - AP      //      // Métricas
      getMetrics,
      getKeys,
      getCacheStatus,
      isLoading,

      // Utilidades
      preloadCriticalData,
      cacheManager,s
      getMetrics,
      getKeys,
      getCacheStatus,
      isLoading,

      // Utilidades
      preloadCriticalData,
      cacheManager,mpatibilidad para migración gradual
 * - Manejo de estados de carga centralizados
 * - Métricas y monitoreo integrados
 * - Configuración dinámica
 *
 * APIs de compatibilidad:
 * - getEmployees, getServices, getClients (desde cacheManager)
 * - getAppointmentsMonthly, getShiftsByDate (desde PlannerCacheBulk)
 * - Métricas (desde useCacheMetrics)
 *
 * @author Sistema Unificado de Cache
 * @version 1.0.0
 * @created 2025-07-29
 */

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { CacheContext } from "./CacheContext.js";
import UnifiedCacheManager from "../core/UnifiedCacheManager.js";
import { UNIFIED_CACHE_CONFIG } from "../config/CacheConfig.js";
import { getMonthKey, getMonthRange } from "../core/CacheUtils.js";

/**
 * Proveedor principal del sistema de cache unificado
 * @param {object} props - Props del componente
 * @param {React.ReactNode} props.children - Componentes hijos
 * @param {object} props.config - Configuración opcional del cache
 */
export const GlobalCacheProvider = ({ children, config = {} }) => {
  // Estado del cache manager
  const [isInitialized, setIsInitialized] = useState(false);
  const [loadingStates, setLoadingStates] = useState({});
  const [errors, setErrors] = useState({});

  // Crear instancia del cache manager
  const cacheManager = useMemo(() => {
    try {
      const mergedConfig = { ...UNIFIED_CACHE_CONFIG, ...config };
      const manager = new UnifiedCacheManager(mergedConfig);
      return manager;
    } catch (error) {
      console.error(
        "[GlobalCacheProvider] Failed to initialize cache manager:",
        error
      );
      return null;
    }
  }, [config]);

  // Inicializar el cache manager
  useEffect(() => {
    if (cacheManager) {
      setIsInitialized(true);

      // Exposición global para compatibilidad con servicios legacy
      if (typeof window !== "undefined") {
        window.cacheManager = cacheManager;
      }

      // Preload de datos críticos si está configurado
      if (config.autoPreload) {
        preloadCriticalData().catch((error) => {
          console.warn("[GlobalCacheProvider] Preload error:", error);
        });
      }
    } else {
      console.warn("[GlobalCacheProvider] Cache manager is null");
    }

    // Cleanup al desmontar
    return () => {
      if (cacheManager) {
        cacheManager.destroy();
      }

      // Limpiar referencia global
      if (typeof window !== "undefined") {
        window.cacheManager = null;
      }
    };
  }, [cacheManager]);

  /**
   * Maneja estados de carga por operación
   */
  const setLoading = useCallback((key, loading) => {
    setLoadingStates((prev) => ({
      ...prev,
      [key]: loading,
    }));
  }, []);

  const setError = useCallback((key, error) => {
    setErrors((prev) => ({
      ...prev,
      [key]: error,
    }));
  }, []);

  /**
   * Método genérico para operaciones con cache
   */
  const withCache = useCallback(
    async (key, apiCall, options = {}) => {
      if (!cacheManager) {
        throw new Error("Cache manager not initialized");
      }

      const loadingKey = `${key}_${JSON.stringify(options)}`;

      try {
        setLoading(loadingKey, true);
        setError(loadingKey, null);

        // Intentar obtener del cache primero
        if (!options.forceRefresh) {
          const cached = await cacheManager.get(key, options);
          if (cached) {
            return cached;
          }
        }

        // Si no hay cache o es refresh forzado, llamar API
        const freshData = await apiCall();

        // Guardar en cache
        await cacheManager.set(key, freshData, options);

        return freshData;
      } catch (error) {
        setError(loadingKey, error);

        // En caso de error, intentar retornar datos stale del cache
        try {
          const staleData = await cacheManager.get(key, {
            ...options,
            allowStale: true,
          });
          if (staleData) {
            console.warn(
              `[GlobalCacheProvider] Using stale data for ${key} due to error:`,
              error
            );
            return staleData;
          }
        } catch (staleError) {
          console.warn(
            `[GlobalCacheProvider] No stale data available for ${key}`
          );
        }

        throw error;
      } finally {
        setLoading(loadingKey, false);
      }
    },
    [cacheManager, setLoading, setError]
  );

  /**
   * APIs de compatibilidad con sistemas legacy
   */

  // Compatibilidad con utils/cacheManager.js
  const getEmployees = useCallback(
    async (forceRefresh = false) => {
      try {
        const { Services } = require("../../api/index"); // Import dinámico
        return withCache("employees", () => Services.Data.Employees.getAll(), {
          dataType: "employees",
          forceRefresh,
        });
      } catch (error) {
        console.warn(
          "🚨 [CACHE] getEmployees failed, returning empty array:",
          error.message
        );
        return [];
      }
    },
    [withCache]
  );

  const getServices = useCallback(
    async (forceRefresh = false) => {
      try {
        const { Services } = require("../../api/index");
        return withCache("services", () => Services.Data.Services.getAll(), {
          dataType: "services",
          forceRefresh,
        });
      } catch (error) {
        console.warn(
          "🚨 [CACHE] getServices failed, returning empty array:",
          error.message
        );
        return [];
      }
    },
    [withCache]
  );

  const getClients = useCallback(
    async (forceRefresh = false) => {
      try {
        const { Services } = require("../../api/index");
        return withCache("clients", () => Services.Data.Clients.getAll(), {
          dataType: "clients",
          forceRefresh,
        });
      } catch (error) {
        console.warn(
          "🚨 [CACHE] getClients failed, returning empty array:",
          error.message
        );
        return [];
      }
    },
    [withCache]
  );

  const getSettings = useCallback(
    async (forceRefresh = false) => {
      try {
        const { Services } = require("../../api/index");
        return withCache("settings", () => Services.Data.Settings.getById(1), {
          dataType: "settings",
          forceRefresh,
        });
      } catch (error) {
        console.warn(
          "🚨 [CACHE] getSettings failed, returning default settings:",
          error.message
        );
        return {
          id: 1,
          nombre_empresa: "Empresa",
          timezone: "America/Mexico_City",
          // Configuraciones por defecto
        };
      }
    },
    [withCache]
  );

  // Compatibilidad con context/PlannerCacheBulk.js
  const getAppointmentsMonthly = useCallback(
    async (date, forceRefresh = false) => {
      try {
        const { Services } = require("../../api/index");
        const monthKey = getMonthKey(date);
        const { startDate, endDate } = getMonthRange(date);

        return withCache(
          `appointments_monthly_${monthKey}`,
          () => Services.Data.Appointments.getByDateRange(startDate, endDate),
          {
            dataType: "appointments",
            strategy: "bulk",
            bulkLoading: true,
            dateRange: { month: monthKey },
            forceRefresh,
          }
        );
      } catch (error) {
        console.warn(
          "🚨 [CACHE] getAppointmentsMonthly failed, returning empty array:",
          error.message
        );
        return [];
      }
    },
    [withCache]
  );

  const getShiftsMonthly = useCallback(
    async (date, forceRefresh = false) => {
      try {
        const { Services } = require("../../api/index");
        const dateObj = new Date(date);
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth() + 1;
        const monthKey = getMonthKey(date);

        return withCache(
          `shifts_monthly_${monthKey}`,
          () => Services.Data.Shifts.getByMonth(year, month),
          {
            dataType: "shifts",
            strategy: "bulk",
            bulkLoading: true,
            dateRange: { month: monthKey },
            forceRefresh,
          }
        );
      } catch (error) {
        console.warn(
          "🚨 [CACHE] getShiftsMonthly failed, returning empty array:",
          error.message
        );
        return [];
      }
    },
    [withCache]
  );

  // Nueva función: getAppointmentsByDateRange
  const getAppointmentsByDateRange = useCallback(
    async (startDate, endDate, forceRefresh = false) => {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);

      // Determinar qué meses necesitamos
      const monthsToLoad = [];
      let currentMonth = new Date(
        startDateObj.getFullYear(),
        startDateObj.getMonth(),
        1
      );

      while (currentMonth <= endDateObj) {
        monthsToLoad.push(new Date(currentMonth));
        currentMonth.setMonth(currentMonth.getMonth() + 1);
      }

      try {
        // Cargar datos de todos los meses necesarios
        const monthlyDataPromises = monthsToLoad.map((month) =>
          getAppointmentsMonthly(month, forceRefresh)
        );

        const monthlyDataResults = await Promise.all(monthlyDataPromises);

        // Combinar todos los datos
        const allAppointments = monthlyDataResults
          .filter((result) => result && Array.isArray(result))
          .flat();

        // Filtrar por el rango específico solicitado
        const filteredAppointments = allAppointments.filter((appointment) => {
          if (!appointment.fecha_inicio && !appointment.fecha_cita)
            return false;

          // Usar fecha_inicio si existe, sino fecha_cita
          const appointmentDateStr =
            appointment.fecha_inicio || appointment.fecha_cita;
          const appointmentDate = new Date(appointmentDateStr);

          // Asegurar que las fechas están en el mismo formato para comparación
          const startCompare = new Date(startDate);
          const endCompare = new Date(endDate);

          return (
            appointmentDate >= startCompare && appointmentDate <= endCompare
          );
        });

        return filteredAppointments;
      } catch (error) {
        console.error(
          "[GlobalCacheProvider] Error in getAppointmentsByDateRange:",
          error
        );
        throw error;
      }
    },
    [getAppointmentsMonthly]
  );

  // Nueva función: getShiftsByDate
  const getShiftsByDate = useCallback(
    async (date, forceRefresh = false) => {
      try {
        // Cargar datos mensuales usando el nuevo endpoint
        const monthlyData = await getShiftsMonthly(date, forceRefresh);

        if (!monthlyData || !monthlyData.weeks) {
          return [];
        }

        // Determinar la semana de la fecha solicitada
        const requestedDate = new Date(date);
        let targetWeekData = null;

        for (const [weekKey, weekData] of Object.entries(monthlyData.weeks)) {
          const weekStart = new Date(weekKey);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);

          if (requestedDate >= weekStart && requestedDate <= weekEnd) {
            targetWeekData = weekData;
            break;
          }
        }

        return targetWeekData || [];
      } catch (error) {
        // Fallback al método original si está disponible
        try {
          const { Services } = require("../../api/index");
          return await Services.Data.Shifts.getByDate(date);
        } catch (fallbackError) {
          console.error(
            "[GlobalCacheProvider] Error in getShiftsByDate fallback:",
            fallbackError
          );
          return [];
        }
      }
    },
    [getShiftsMonthly]
  );

  /**
   * Funciones de invalidación
   */
  const invalidateEmployees = useCallback(async () => {
    if (!cacheManager) return false;
    return cacheManager.invalidate("employees");
  }, [cacheManager]);

  const invalidateServices = useCallback(async () => {
    if (!cacheManager) return false;
    return cacheManager.invalidate("services");
  }, [cacheManager]);

  const clearAllCache = useCallback(async () => {
    if (!cacheManager) return false;
    setLoadingStates({});
    setErrors({});
    return cacheManager.clearAll();
  }, [cacheManager]);

  /**
   * Funciones de métricas y estado
   */
  const getMetrics = useCallback(() => {
    if (!cacheManager) return null;
    return cacheManager.getMetrics();
  }, [cacheManager]);

  const getKeys = useCallback(async () => {
    if (!cacheManager) return [];
    // Simulamos getKeys usando las claves del cache en memoria
    try {
      return Array.from(cacheManager.memoryCache.keys());
    } catch (error) {
      console.warn("Error getting cache keys:", error);
      return [];
    }
  }, [cacheManager]);

  const getCacheStatus = useCallback(() => {
    if (!cacheManager) return { isHealthy: false, error: "Not initialized" };
    return cacheManager.getStatus();
  }, [cacheManager]);

  const isLoading = useCallback(
    (key) => {
      return loadingStates[key] || false;
    },
    [loadingStates]
  );

  /**
   * Preload de datos críticos
   */
  const preloadCriticalData = useCallback(async () => {
    if (!cacheManager) return;

    try {
      const currentDate = new Date();

      // Preload datos maestros
      await Promise.allSettled([getEmployees(), getServices(), getClients()]);

      // Preload datos del mes actual
      await Promise.allSettled([
        getAppointmentsMonthly(currentDate),
        getShiftsMonthly(currentDate),
      ]);
    } catch (error) {
      console.warn("[GlobalCacheProvider] Preload error:", error);
    }
  }, [
    cacheManager,
    getEmployees,
    getServices,
    getClients,
    getAppointmentsMonthly,
    getShiftsMonthly,
  ]);

  // Nueva función: preloadCurrentMonth
  const preloadCurrentMonth = useCallback(async () => {
    const currentDate = new Date();
    const promises = [
      getAppointmentsMonthly(currentDate, false),
      getShiftsMonthly(currentDate, false),
      getEmployees(false),
      getServices(false),
      getClients(false),
      getSettings(false),
    ];

    try {
      await Promise.all(promises);
    } catch (error) {
      console.error(
        "[GlobalCacheProvider] Error preloading current month:",
        error
      );
    }
  }, [
    getAppointmentsMonthly,
    getShiftsMonthly,
    getEmployees,
    getServices,
    getClients,
    getSettings,
  ]);

  // Nueva función: getCacheMetrics
  const getCacheMetrics = useCallback(async () => {
    if (!cacheManager) return null;

    try {
      const metrics = await getMetrics();
      const status = getCacheStatus();

      return {
        ...metrics,
        healthStatus: status,
        isHealthy: status.isHealthy,
        memoryUsage: cacheManager.getMemoryUsage
          ? await cacheManager.getMemoryUsage()
          : null,
      };
    } catch (error) {
      console.error(
        "[GlobalCacheProvider] Error getting cache metrics:",
        error
      );
      return null;
    }
  }, [cacheManager, getMetrics, getCacheStatus]);

  /**
   * Valor del contexto
   */
  const contextValue = useMemo(() => {
    return {
      // Estado del sistema
      isInitialized,
      isHealthy: cacheManager ? cacheManager.getStatus().isHealthy : false,

      // APIs genéricas
      get: (key, options) => cacheManager?.get(key, options),
      set: (key, data, options) => cacheManager?.set(key, data, options),
      invalidate: (keys, options) => cacheManager?.invalidate(keys, options),
      withCache,

      // APIs de compatibilidad - Datos maestros
      getEmployees,
      getServices,
      getClients,
      getSettings,

      // APIs de compatibilidad - Planner
      getAppointmentsMonthly,
      getShiftsMonthly,
      getAppointmentsByDateRange,
      getShiftsByDate,

      // Invalidación
      invalidateEmployees,
      invalidateServices,
      clearAllCache,

      // Métricas y estado
      getMetrics,
      getCacheMetrics,
      getCacheStatus,
      isLoading,

      // Utilidades
      preloadCriticalData,
      preloadCurrentMonth,
      getMonthKey,
      cacheManager,
    };
  }, [
    isInitialized,
    cacheManager,
    withCache,
    getEmployees,
    getServices,
    getClients,
    getSettings,
    getAppointmentsMonthly,
    getShiftsMonthly,
    getAppointmentsByDateRange,
    getShiftsByDate,
    invalidateEmployees,
    invalidateServices,
    clearAllCache,
    getMetrics,
    getCacheMetrics,
    getKeys,
    getCacheStatus,
    isLoading,
    preloadCriticalData,
    preloadCurrentMonth,
  ]);

  if (!cacheManager) {
    console.error("[GlobalCacheProvider] Cache manager failed to initialize");
    return (
      <CacheContext.Provider value={null}>{children}</CacheContext.Provider>
    );
  }

  return (
    <CacheContext.Provider value={contextValue}>
      {children}
    </CacheContext.Provider>
  );
};

export default GlobalCacheProvider;

// Re-exportar useCacheContext para conveniencia
export { useCacheContext } from "./CacheContext.js";
