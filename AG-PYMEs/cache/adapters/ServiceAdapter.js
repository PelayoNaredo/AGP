/**
 * ServiceAdapter - Adaptador para Servicios API
 *
 * Proporciona una interfaz simplificada para que los servicios API
 * migren al sistema de cache unificado sin cambios complejos en su
 * implementación actual.
 *
 * Servicios objetivo:
 * - dashboardService.js
 * - alertsService.js
 * - employeesService.js
 * - financialServices.js
 * - inventoryService.js
 * - salesService.js
 *
 * @author Sistema Unificado de Cache
 * @version 2.0.0 - Implementación completa
 * @created 2025-07-29
 * @updated 2025-07-29 - Implementación de adaptador completo
 */

import { UNIFIED_CACHE_CONFIG } from "../config/CacheConfig.js";

/**
 * Adaptador para servicios API
 */
export class ServiceCacheAdapter {
  constructor(serviceName, unifiedCacheManager) {
    this.serviceName = serviceName;
    this.cacheManager = unifiedCacheManager;
    this.config =
      UNIFIED_CACHE_CONFIG.dataTypes[serviceName] ||
      UNIFIED_CACHE_CONFIG.dataTypes.dashboard;
    this.metrics = {
      calls: 0,
      hits: 0,
      misses: 0,
      errors: 0,
    };
  }

  /**
   * Wrapper genérico para métodos de servicio con cache
   */
  async withCache(method, key, apiCall, options = {}) {
    const fullKey = `${this.serviceName}:${method}:${key}`;
    const cacheOptions = { ...this.config, ...options };

    this.metrics.calls++;

    try {
      // Intentar obtener del cache
      const cached = await this.cacheManager.get(fullKey, cacheOptions);

      if (cached) {
        this.metrics.hits++;
        return cached;
      }

      // Si no está en cache, ejecutar llamada API
      this.metrics.misses++;
      const result = await apiCall();

      // Guardar en cache
      await this.cacheManager.set(fullKey, result, cacheOptions);

      return result;
    } catch (error) {
      this.metrics.errors++;
      console.error(`ServiceAdapter[${this.serviceName}] Error:`, error);

      // En caso de error, intentar devolver data del cache aunque esté expirada
      try {
        return await this.cacheManager.get(fullKey, {
          ...cacheOptions,
          allowStale: true,
        });
      } catch (fallbackError) {
        throw error; // Re-lanzar error original
      }
    }
  }

  /**
   * Invalidar cache específico del servicio
   */
  async invalidateService(patterns = []) {
    if (patterns.length === 0) {
      patterns = [`${this.serviceName}:*`];
    }

    const results = [];
    for (const pattern of patterns) {
      const fullPattern = pattern.startsWith(this.serviceName)
        ? pattern
        : `${this.serviceName}:${pattern}`;
      results.push(await this.cacheManager.invalidate(fullPattern));
    }

    return results.every((result) => result);
  }

  /**
   * Obtener métricas del servicio
   */
  getServiceMetrics() {
    return {
      ...this.metrics,
      hitRatio:
        this.metrics.calls > 0 ? this.metrics.hits / this.metrics.calls : 0,
      errorRate:
        this.metrics.calls > 0 ? this.metrics.errors / this.metrics.calls : 0,
      serviceName: this.serviceName,
    };
  }

  /**
   * Resetear métricas del servicio
   */
  resetMetrics() {
    this.metrics = {
      calls: 0,
      hits: 0,
      misses: 0,
      errors: 0,
    };
  }

  /**
   * Precargar datos específicos del servicio
   */
  async preloadData(dataLoaders = {}) {
    const results = {};

    for (const [key, loader] of Object.entries(dataLoaders)) {
      try {
        const fullKey = `${this.serviceName}:preload:${key}`;
        results[key] = await this.withCache("preload", key, loader);
      } catch (error) {
        console.error(
          `ServiceAdapter[${this.serviceName}] Preload error for ${key}:`,
          error
        );
        results[key] = null;
      }
    }

    return results;
  }
}

/**
 * Factory para crear adaptadores de servicio
 */
export const createServiceAdapter = (serviceName, cacheManager) => {
  return new ServiceCacheAdapter(serviceName, cacheManager);
};

/**
 * Decorador para métodos de servicio con cache automático
 */
export const withServiceCache = (serviceName, methodName, options = {}) => {
  return (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args) {
      const adapter =
        this._serviceAdapter ||
        createServiceAdapter(serviceName, this.cacheManager);

      // Crear key basado en argumentos
      const key = `${methodName}:${JSON.stringify(args)}`;

      return adapter.withCache(
        methodName,
        key,
        () => originalMethod.apply(this, args),
        options
      );
    };

    return descriptor;
  };
};

/**
 * Mixin para servicios que quieren usar cache automático
 */
export const ServiceCacheMixin = {
  initializeCache(serviceName, cacheManager) {
    this._serviceAdapter = createServiceAdapter(serviceName, cacheManager);
    this.cacheManager = cacheManager;
  },

  async cacheCall(method, key, apiCall, options = {}) {
    if (!this._serviceAdapter) {
      throw new Error("Cache not initialized. Call initializeCache() first.");
    }
    return this._serviceAdapter.withCache(method, key, apiCall, options);
  },

  async invalidateCache(patterns = []) {
    if (!this._serviceAdapter) return false;
    return this._serviceAdapter.invalidateService(patterns);
  },

  getMetrics() {
    if (!this._serviceAdapter) return null;
    return this._serviceAdapter.getServiceMetrics();
  },
};

export default {
  ServiceCacheAdapter,
  createServiceAdapter,
  withServiceCache,
  ServiceCacheMixin,
};
