/**
 * useUnifiedCache - Hook Principal del Sistema de Cache Unificado
 *
 * Hook principal para acceder a todas las funcionalidades del sistema de cache unificado.
 * Proporciona una interfaz simplificada y optimizada para componentes React.
 *
 * Características principales:
 * - API unificada para todas las operaciones de cache
 * - Estados de carga automáticos
 * - Manejo de errores integrado
 * - Invalidación reactiva
 * - Compatibilidad con hooks existentes
 * - Optimización automática de re-renders
 *
 * @author Sistema Unificado de Cache
 * @version 1.0.0
 * @created 2025-07-29
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useCacheContext } from "../providers/GlobalCacheProvider.js";

/**
 * Hook principal para usar el cache unificado
 * @param {object} options - Opciones de configuración
 * @returns {object} API del cache unificado
 */
export const useUnifiedCache = (options = {}) => {
  const cacheContext = useCacheContext();
  const [loadingStates, setLoadingStates] = useState(new Map());
  const [errors, setErrors] = useState(new Map());
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Refs para evitar re-renders innecesarios
  const loadingStatesRef = useRef(loadingStates);
  const errorsRef = useRef(errors);

  // Configuración por defecto
  const config = useMemo(
    () => ({
      enableAutoRefresh: options.enableAutoRefresh !== false,
      autoRefreshInterval: options.autoRefreshInterval || 30000,
      enableOptimisticUpdates: options.enableOptimisticUpdates !== false,
      enableBulkOperations: options.enableBulkOperations !== false,
      retryOnError: options.retryOnError !== false,
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      ...options,
    }),
    [options]
  );

  /**
   * Actualiza el estado de carga para una clave
   * @param {string} key - Clave
   * @param {boolean} isLoading - Estado de carga
   */
  const setLoadingState = useCallback((key, isLoading) => {
    setLoadingStates((prev) => {
      const newStates = new Map(prev);
      if (isLoading) {
        newStates.set(key, true);
      } else {
        newStates.delete(key);
      }
      loadingStatesRef.current = newStates;
      return newStates;
    });
  }, []);

  /**
   * Actualiza el estado de error para una clave
   * @param {string} key - Clave
   * @param {Error|null} error - Error o null
   */
  const setError = useCallback((key, error) => {
    setErrors((prev) => {
      const newErrors = new Map(prev);
      if (error) {
        newErrors.set(key, error);
      } else {
        newErrors.delete(key);
      }
      errorsRef.current = newErrors;
      return newErrors;
    });
  }, []);

  /**
   * Obtiene datos del cache con estado de carga automático
   * @param {string} key - Clave del cache
   * @param {function} fetcher - Función para obtener datos si no están en cache
   * @param {object} cacheOptions - Opciones del cache
   * @returns {Promise<any>} Datos del cache
   */
  const get = useCallback(
    async (key, fetcher = null, cacheOptions = {}) => {
      if (!key) return null;

      setLoadingState(key, true);
      setError(key, null);

      try {
        // Intentar obtener del cache primero
        let result = await cacheContext.get(key, cacheOptions);

        // Si no está en cache y tenemos fetcher, obtener datos
        if (result === null && fetcher && typeof fetcher === "function") {
          try {
            result = await fetcher();

            // Almacenar en cache si obtuvimos datos
            if (result !== null && result !== undefined) {
              await cacheContext.set(key, result, cacheOptions);
            }
          } catch (fetchError) {
            console.warn(
              `[useUnifiedCache] Fetcher error for key "${key}":`,
              fetchError
            );

            // Si hay retry habilitado, intentar de nuevo
            if (config.retryOnError) {
              result = await retryOperation(
                () => fetcher(),
                key,
                config.maxRetries
              );
            } else {
              throw fetchError;
            }
          }
        }

        setLastUpdate(Date.now());
        return result;
      } catch (error) {
        setError(key, error);
        throw error;
      } finally {
        setLoadingState(key, false);
      }
    },
    [cacheContext, config, setLoadingState, setError]
  );

  /**
   * Almacena datos en el cache
   * @param {string} key - Clave del cache
   * @param {any} value - Valor a almacenar
   * @param {object} cacheOptions - Opciones del cache
   * @returns {Promise<boolean>} Éxito de la operación
   */
  const set = useCallback(
    async (key, value, cacheOptions = {}) => {
      if (!key) return false;

      setError(key, null);

      try {
        const success = await cacheContext.set(key, value, cacheOptions);
        if (success) {
          setLastUpdate(Date.now());
        }
        return success;
      } catch (error) {
        setError(key, error);
        throw error;
      }
    },
    [cacheContext, setError]
  );

  /**
   * Invalida datos del cache
   * @param {string|string[]} keys - Clave(s) a invalidar
   * @param {object} options - Opciones de invalidación
   * @returns {Promise<boolean>} Éxito de la operación
   */
  const invalidate = useCallback(
    async (keys, options = {}) => {
      const keyList = Array.isArray(keys) ? keys : [keys];

      try {
        let allSuccess = true;

        for (const key of keyList) {
          if (key) {
            setError(key, null);
            const success = await cacheContext.invalidate(key, options);
            if (!success) allSuccess = false;
          }
        }

        if (allSuccess) {
          setLastUpdate(Date.now());
        }

        return allSuccess;
      } catch (error) {
        keyList.forEach((key) => setError(key, error));
        throw error;
      }
    },
    [cacheContext, setError]
  );

  /**
   * Envuelve una función con cache automático
   * @param {string} key - Clave del cache
   * @param {function} fn - Función a envolver
   * @param {object} cacheOptions - Opciones del cache
   * @returns {function} Función envuelta con cache
   */
  const withCache = useCallback(
    (key, fn, cacheOptions = {}) => {
      return async (...args) => {
        const cacheKey = typeof key === "function" ? key(...args) : key;
        return await get(cacheKey, () => fn(...args), cacheOptions);
      };
    },
    [get]
  );

  /**
   * Reintenta una operación con backoff exponencial
   * @param {function} operation - Operación a reintentar
   * @param {string} key - Clave para logging
   * @param {number} maxRetries - Máximo número de reintentos
   * @returns {Promise<any>} Resultado de la operación
   */
  const retryOperation = useCallback(
    async (operation, key, maxRetries) => {
      let lastError;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await operation();
        } catch (error) {
          lastError = error;

          if (attempt === maxRetries) {
            break;
          }

          // Backoff exponencial
          const delay = config.retryDelay * Math.pow(2, attempt - 1);
          console.warn(
            `[useUnifiedCache] Retry ${attempt}/${maxRetries} for key "${key}" in ${delay}ms`
          );

          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      throw lastError;
    },
    [config.retryDelay]
  );

  /**
   * Operaciones en lote para múltiples claves
   * @param {object[]} operations - Array de operaciones {type, key, value?, options?}
   * @returns {Promise<object[]>} Resultados de las operaciones
   */
  const batch = useCallback(
    async (operations) => {
      if (!config.enableBulkOperations) {
        // Ejecutar secuencialmente si bulk está deshabilitado
        const results = [];
        for (const op of operations) {
          try {
            let result;
            switch (op.type) {
              case "get":
                result = await get(op.key, op.fetcher, op.options);
                break;
              case "set":
                result = await set(op.key, op.value, op.options);
                break;
              case "invalidate":
                result = await invalidate(op.key, op.options);
                break;
              default:
                throw new Error(`Unknown operation type: ${op.type}`);
            }
            results.push({ success: true, result, operation: op });
          } catch (error) {
            results.push({ success: false, error, operation: op });
          }
        }
        return results;
      }

      // Ejecutar en paralelo si bulk está habilitado
      const promises = operations.map(async (op) => {
        try {
          let result;
          switch (op.type) {
            case "get":
              result = await get(op.key, op.fetcher, op.options);
              break;
            case "set":
              result = await set(op.key, op.value, op.options);
              break;
            case "invalidate":
              result = await invalidate(op.key, op.options);
              break;
            default:
              throw new Error(`Unknown operation type: ${op.type}`);
          }
          return { success: true, result, operation: op };
        } catch (error) {
          return { success: false, error, operation: op };
        }
      });

      return await Promise.all(promises);
    },
    [config.enableBulkOperations, get, set, invalidate]
  );

  /**
   * Verifica si una clave está cargando
   * @param {string} key - Clave a verificar
   * @returns {boolean} True si está cargando
   */
  const isLoading = useCallback((key) => {
    return loadingStatesRef.current.has(key);
  }, []);

  /**
   * Obtiene el error de una clave
   * @param {string} key - Clave a verificar
   * @returns {Error|null} Error si existe
   */
  const getError = useCallback((key) => {
    return errorsRef.current.get(key) || null;
  }, []);

  /**
   * Limpia errores de una o todas las claves
   * @param {string|null} key - Clave específica o null para todas
   */
  const clearErrors = useCallback(
    (key = null) => {
      if (key) {
        setError(key, null);
      } else {
        setErrors(new Map());
        errorsRef.current = new Map();
      }
    },
    [setError]
  );

  /**
   * Obtiene estadísticas del cache
   * @returns {object} Estadísticas actuales
   */
  const getStats = useCallback(() => {
    const stats = cacheContext.getMetrics?.() || {};
    return {
      ...stats,
      loadingOperations: loadingStatesRef.current.size,
      errorCount: errorsRef.current.size,
      lastUpdate,
    };
  }, [cacheContext, lastUpdate]);

  // Auto-refresh si está habilitado
  useEffect(() => {
    if (!config.enableAutoRefresh) return;

    const interval = setInterval(() => {
      setLastUpdate(Date.now());
    }, config.autoRefreshInterval);

    return () => clearInterval(interval);
  }, [config.enableAutoRefresh, config.autoRefreshInterval]);

  return {
    // Operaciones principales
    get,
    set,
    invalidate,
    withCache,
    batch,

    // Estados
    isLoading,
    getError,
    clearErrors,

    // Estadísticas
    getStats,
    lastUpdate,

    // APIs de compatibilidad (delegadas al contexto)
    getEmployees: cacheContext.getEmployees,
    getServices: cacheContext.getServices,
    getClients: cacheContext.getClients,
    getSettings: cacheContext.getSettings,
    getAppointmentsMonthly: cacheContext.getAppointmentsMonthly,
    getShiftsMonthly: cacheContext.getShiftsMonthly,
    getAppointmentsByDateRange: cacheContext.getAppointmentsByDateRange,
    getShiftsByDate: cacheContext.getShiftsByDate,

    // Invalidaciones específicas
    invalidateEmployees: cacheContext.invalidateEmployees,
    invalidateServices: cacheContext.invalidateServices,
    invalidateClients: cacheContext.invalidateClients,
    invalidateAppointments: cacheContext.invalidateAppointments,
    invalidateShifts: cacheContext.invalidateShifts,
    clearAllCache: cacheContext.clearAllCache,

    // Utilidades
    preloadCriticalData: cacheContext.preloadCriticalData,
    preloadCurrentMonth: cacheContext.preloadCurrentMonth,
    getKeys: cacheContext.getKeys,
    getMetrics: cacheContext.getMetrics,
    getCacheMetrics: cacheContext.getCacheMetrics,
    getMonthKey: cacheContext.getMonthKey,

    // Configuración
    config,

    // Estado del sistema
    isHealthy: cacheContext.isHealthy,
    isInitialized: cacheContext.isInitialized,
    isAvailable: cacheContext.isInitialized && cacheContext.isHealthy,
  };
};

export default useUnifiedCache;
