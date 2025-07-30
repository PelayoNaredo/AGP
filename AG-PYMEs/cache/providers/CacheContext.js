/**
 * CacheContext - Definición del Contexto de Cache Unificado
 *
 * Define la estructura del contexto React para el sistema de cache unificado.
 * Proporciona la base para compartir el estado y funcionalidades del cache
 * a través de toda la aplicación.
 *
 * Propiedades del contexto:
 * - Instancia del UnifiedCacheManager
 * - Estados de carga por operación
 * - Funciones de invalidación
 * - Métricas del sistema
 * - Configuración activa
 *
 * @author Sistema Unificado de Cache
 * @version 1.0.0
 * @created 2025-07-29
 */

import { createContext, useContext } from "react";

/**
 * Contexto principal del sistema de cache unificado
 */
export const CacheContext = createContext({
  // Estado del sistema
  isInitialized: false,
  isHealthy: false,

  // APIs genéricas
  get: null,
  set: null,
  invalidate: null,
  withCache: null,

  // APIs de compatibilidad - Datos maestros
  getEmployees: null,
  getServices: null,
  getClients: null,
  getSettings: null,

  // APIs de compatibilidad - Planner
  getAppointmentsMonthly: null,
  getShiftsMonthly: null,
  getShiftsByDate: null,

  // Funciones de invalidación
  invalidateEmployees: null,
  invalidateServices: null,
  invalidateClients: null,
  invalidateAppointments: null,
  invalidateShifts: null,
  clearAllCache: null,

  // Métricas y estado
  getMetrics: null,
  getKeys: null,
  getCacheStatus: null,
  isLoading: null,
  getError: null,

  // Utilidades
  preloadCriticalData: null,
  cacheManager: null,
});

/**
 * Hook para usar el contexto de cache unificado
 * @returns {object} Funcionalidades del cache
 * @throws {Error} Si se usa fuera del GlobalCacheProvider
 */
export const useCacheContext = () => {
  const context = useContext(CacheContext);

  if (context === null || context === undefined) {
    throw new Error(
      "useCacheContext must be used within a GlobalCacheProvider. " +
        "Make sure your component is wrapped with <GlobalCacheProvider>."
    );
  }

  return context;
};

/**
 * Hook para verificar si el cache está disponible (sin lanzar error)
 * @returns {boolean} True si el cache está disponible
 */
export const useIsCacheAvailable = () => {
  const context = useContext(CacheContext);
  return context !== null && context !== undefined && context.isInitialized;
};

/**
 * Hook para obtener métricas del cache de forma segura
 * @returns {object|null} Métricas del cache o null si no está disponible
 */
export const useCacheMetrics = () => {
  const context = useContext(CacheContext);

  if (!context || !context.isInitialized) {
    return null;
  }

  try {
    return context.getMetrics?.() || null;
  } catch (error) {
    console.warn("[useCacheMetrics] Error getting metrics:", error);
    return null;
  }
};

/**
 * Hook para obtener el estado de salud del cache
 * @returns {object} Estado de salud del cache
 */
export const useCacheHealth = () => {
  const context = useContext(CacheContext);

  if (!context || !context.isInitialized) {
    return {
      isHealthy: false,
      error: "Cache not initialized",
      isAvailable: false,
    };
  }

  try {
    const status = context.getCacheStatus?.() || {};
    return {
      isHealthy: status.isHealthy || false,
      isAvailable: true,
      ...status,
    };
  } catch (error) {
    return {
      isHealthy: false,
      error: error.message,
      isAvailable: false,
    };
  }
};

/**
 * Hook para verificar estados de carga
 * @param {string} key - Clave para verificar estado de carga
 * @returns {boolean} True si está cargando
 */
export const useIsLoading = (key) => {
  const context = useContext(CacheContext);

  if (!context || !context.isLoading) {
    return false;
  }

  return context.isLoading(key);
};

/**
 * Hook para obtener errores de cache
 * @param {string} key - Clave para verificar errores
 * @returns {Error|null} Error si existe, null en caso contrario
 */
export const useCacheError = (key) => {
  const context = useContext(CacheContext);

  if (!context || !context.getError) {
    return null;
  }

  return context.getError(key);
};

export default CacheContext;
