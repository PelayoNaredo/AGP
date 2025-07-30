/**
 * Cache System Index - Punto de Entrada Principal
 *
 * Archivo principal que exporta toda la funcionalidad del sistema
 * de cache unificado para facilitar la importación desde otros módulos.
 *
 * @author Sistema Unificado de Cache
 * @version 1.0.0
 * @created 2025-07-29
 */

// Core System
export { default as UnifiedCacheManager } from "./core/UnifiedCacheManager";
export { default as CacheMetrics } from "./core/CacheMetrics";
export * from "./core/CacheUtils";

// Strategies
export { default as TTLStrategy } from "./strategies/TTLStrategy";
export { default as BulkLoadingStrategy } from "./strategies/BulkLoadingStrategy";
export { default as IntelligentStrategy } from "./strategies/IntelligentStrategy";

// Providers & Context
export { default as GlobalCacheProvider } from "./providers/GlobalCacheProvider";
export { CacheContext, useCacheContext } from "./providers/CacheContext";

// Hooks
export { default as useUnifiedCache } from "./hooks/useUnifiedCache";
export { default as useCacheMetrics } from "./hooks/useCacheMetrics";
export { default as useCacheInvalidation } from "./hooks/useCacheInvalidation";

// Configuration
export { default as UNIFIED_CACHE_CONFIG } from "./config/CacheConfig";
export { default as CACHE_DATA_TYPES } from "./config/CacheTypes";
export { default as CACHE_CONSTANTS } from "./config/CacheConstants";

// Adapters
export { default as ServiceAdapter } from "./adapters/ServiceAdapter";

// Migrations
// No legacy migrations needed - using unified system only

/**
 * Configuración de inicialización por defecto
 */
export const DEFAULT_INITIALIZATION = {
  autoMigrate: true,
  enableMetrics: true,
  enableDebugger: __DEV__,
  strategies: ["ttl", "bulk", "intelligent"],
};

/**
 * Función de inicialización del sistema completo
 * @param {object} config - Configuración de inicialización
 * @returns {Promise<UnifiedCacheManager>} Instancia configurada del cache manager
 */
export const initializeUnifiedCache = async (
  config = DEFAULT_INITIALIZATION
) => {
  // TODO: Implementar inicialización automática
  // TODO: Ejecutar migraciones si es necesario
  // TODO: Configurar métricas y debugging
  // TODO: Retornar instancia configurada
};

// Versión del sistema
export const CACHE_SYSTEM_VERSION = "1.0.0";

// Información del sistema
export const CACHE_SYSTEM_INFO = {
  version: CACHE_SYSTEM_VERSION,
  strategies: ["TTL", "BulkLoading", "Intelligent"],
  features: ["Metrics", "Migration", "Debugging", "Adapters"],
  compatibility: ["useUnifiedCache", "GlobalCacheProvider", "useCacheMetrics"],
};
