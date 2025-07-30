/**
 * TTLStrategy - Estrategia de Cache con Time To Live
 *
 * Implementación de la estrategia básica de cache con expiración por tiempo.
 * Ideal para datos que cambian con frecuencia moderada y requieren
 * invalidación automática basada en tiempo.
 *
 * Características:
 * - TTL configurable por tipo de dato
 * - Invalidación automática por tiempo
 * - Soporte para AsyncStorage y memoria
 * - Manejo de errores robusto
 * - Métricas integradas
 *
 * Casos de uso:
 * - Datos maestros (empleados, servicios, clientes)
 * - Configuraciones del sistema
 * - Datos transaccionales con TTL corto
 *
 * @author Sistema Unificado de Cache
 * @version 1.0.0
 * @created 2025-07-29
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  generateCacheKey,
  serializeData,
  deserializeData,
} from "../core/CacheUtils.js";
import { CACHE_STRATEGIES, CACHE_STATES } from "../config/CacheConstants.js";

/**
 * Estrategia de cache con TTL (Time To Live)
 */
export default class TTLStrategy {
  constructor(config = {}) {
    this.name = CACHE_STRATEGIES.TTL;
    this.config = {
      defaultTTL: 10 * 60 * 1000, // 10 minutos por defecto
      maxEntries: 1000,
      cleanupInterval: 5 * 60 * 1000, // 5 minutos
      enableMetrics: true,
      ...config,
    };

    // Cache en memoria
    this.memoryCache = new Map();

    // Métricas específicas de TTL
    this.metrics = {
      hits: 0,
      misses: 0,
      expired: 0,
      sets: 0,
      invalidations: 0,
    };

    // Timer para cleanup automático
    this.cleanupTimer = null;
    this._setupCleanup();
  }

  /**
   * Obtiene datos del cache con validación TTL
   * @param {string} key - Clave del cache
   * @param {object} options - Opciones de configuración
   * @returns {Promise<any>} Datos cached o null si no existen/expirados
   */
  async get(key, options = {}) {
    const cacheKey = generateCacheKey(key, { ...options, strategy: this.name });
    const startTime = Date.now();

    try {
      // Buscar en memoria primero
      let entry = this.memoryCache.get(cacheKey);

      // Si no está en memoria, buscar en AsyncStorage
      if (!entry) {
        entry = await this._getFromStorage(cacheKey);
        if (entry) {
          this.memoryCache.set(cacheKey, entry);
        }
      }

      // Verificar si existe y es válido
      if (!entry) {
        this._recordMetric("miss");
        return { data: null, state: CACHE_STATES.MISS };
      }

      // Verificar TTL
      if (this._isExpired(entry, options)) {
        // Eliminar entrada expirada
        await this._removeEntry(cacheKey);
        this._recordMetric("expired");
        return { data: null, state: CACHE_STATES.STALE };
      }

      // Cache hit válido
      this._recordMetric("hit");
      return {
        data: entry.data,
        state: CACHE_STATES.SUCCESS,
        metadata: {
          cached: entry.timestamp,
          ttl: entry.ttl,
          age: Date.now() - entry.timestamp,
        },
      };
    } catch (error) {
      console.warn(`[TTLStrategy] Get error for key ${key}:`, error);
      return { data: null, state: CACHE_STATES.ERROR, error };
    }
  }

  /**
   * Guarda datos en el cache con TTL
   * @param {string} key - Clave del cache
   * @param {any} data - Datos a guardar
   * @param {object} options - Opciones de configuración
   * @returns {Promise<boolean>} True si se guardó correctamente
   */
  async set(key, data, options = {}) {
    const cacheKey = generateCacheKey(key, { ...options, strategy: this.name });
    const ttl = this._getTTL(options);

    try {
      const entry = {
        data,
        timestamp: Date.now(),
        ttl,
        key: cacheKey,
        strategy: this.name,
        metadata: {
          dataType: options.dataType,
          size: this._calculateSize(data),
          version: options.version || 1,
        },
      };

      // Guardar en memoria
      this.memoryCache.set(cacheKey, entry);

      // Verificar límite de entradas
      this._enforceMaxEntries();

      // Guardar en AsyncStorage de forma asíncrona
      this._setInStorage(cacheKey, entry).catch((error) => {
        console.warn(
          `[TTLStrategy] AsyncStorage set error for key ${key}:`,
          error
        );
      });

      this._recordMetric("set");
      return true;
    } catch (error) {
      console.warn(`[TTLStrategy] Set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Invalida entradas específicas del cache
   * @param {string|string[]} keys - Clave o array de claves
   * @param {object} options - Opciones de invalidación
   * @returns {Promise<number>} Número de entradas invalidadas
   */
  async invalidate(keys, options = {}) {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    let invalidatedCount = 0;

    try {
      for (const key of keyArray) {
        const cacheKey = generateCacheKey(key, {
          ...options,
          strategy: this.name,
        });

        // Si es un patrón, buscar claves que coincidan
        if (options.pattern) {
          const matchingKeys = this._findMatchingKeys(key);
          for (const matchingKey of matchingKeys) {
            if (await this._removeEntry(matchingKey)) {
              invalidatedCount++;
            }
          }
        } else {
          if (await this._removeEntry(cacheKey)) {
            invalidatedCount++;
          }
        }
      }

      this._recordMetric("invalidate", invalidatedCount);
      return invalidatedCount;
    } catch (error) {
      console.warn(`[TTLStrategy] Invalidate error:`, error);
      return 0;
    }
  }

  /**
   * Limpia entradas expiradas del cache
   * @returns {Promise<number>} Número de entradas limpiadas
   */
  async cleanup() {
    let cleanedCount = 0;
    const now = Date.now();

    try {
      const keysToRemove = [];

      // Buscar entradas expiradas en memoria
      for (const [cacheKey, entry] of this.memoryCache.entries()) {
        if (this._isExpired(entry)) {
          keysToRemove.push(cacheKey);
        }
      }

      // Remover entradas expiradas
      for (const key of keysToRemove) {
        if (await this._removeEntry(key)) {
          cleanedCount++;
        }
      }

      // Cleanup de AsyncStorage (más lento, ejecutar periódicamente)
      if (cleanedCount > 0) {
        this._cleanupStorage().catch((error) => {
          console.warn("[TTLStrategy] Storage cleanup error:", error);
        });
      }

      return cleanedCount;
    } catch (error) {
      console.warn("[TTLStrategy] Cleanup error:", error);
      return 0;
    }
  }

  /**
   * Obtiene estadísticas de la estrategia TTL
   * @returns {object} Estadísticas y métricas
   */
  getStats() {
    const totalOperations = this.metrics.hits + this.metrics.misses;
    const hitRatio =
      totalOperations > 0 ? this.metrics.hits / totalOperations : 0;

    return {
      strategy: this.name,
      memoryEntries: this.memoryCache.size,
      metrics: { ...this.metrics },
      hitRatio,
      config: this.config,
      memoryUsage: this._calculateMemoryUsage(),
    };
  }

  /**
   * Limpia completamente el cache TTL
   * @returns {Promise<boolean>} True si se limpió correctamente
   */
  async clear() {
    try {
      // Limpiar memoria
      this.memoryCache.clear();

      // Limpiar AsyncStorage (solo claves TTL)
      await this._clearStorage();

      // Resetear métricas
      this.metrics = {
        hits: 0,
        misses: 0,
        expired: 0,
        sets: 0,
        invalidations: 0,
      };

      return true;
    } catch (error) {
      console.warn("[TTLStrategy] Clear error:", error);
      return false;
    }
  }

  /**
   * Destruye la estrategia y limpia recursos
   */
  destroy() {
    this._clearCleanupTimer();
    this.memoryCache.clear();
  }

  /**
   * Métodos privados
   */

  _getTTL(options) {
    if (options.ttl) return options.ttl;
    if (options.dataType && this.config.dataTypeTTLs) {
      return (
        this.config.dataTypeTTLs[options.dataType] || this.config.defaultTTL
      );
    }
    return this.config.defaultTTL;
  }

  _isExpired(entry, options = {}) {
    if (!entry || !entry.timestamp) return true;

    const ttl = entry.ttl || this._getTTL(options);
    return Date.now() - entry.timestamp >= ttl;
  }

  _calculateSize(data) {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }

  _calculateMemoryUsage() {
    let totalSize = 0;
    for (const entry of this.memoryCache.values()) {
      totalSize += this._calculateSize(entry);
    }
    return totalSize;
  }

  _enforceMaxEntries() {
    if (this.memoryCache.size <= this.config.maxEntries) return;

    // Remover entradas más antiguas primero
    const entries = Array.from(this.memoryCache.entries()).sort(
      ([, a], [, b]) => a.timestamp - b.timestamp
    );

    const toRemove = entries.slice(
      0,
      this.memoryCache.size - this.config.maxEntries
    );
    for (const [key] of toRemove) {
      this.memoryCache.delete(key);
    }
  }

  _findMatchingKeys(pattern) {
    const matchingKeys = [];
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        matchingKeys.push(key);
      }
    }
    return matchingKeys;
  }

  async _removeEntry(cacheKey) {
    try {
      // Remover de memoria
      const hadMemoryEntry = this.memoryCache.delete(cacheKey);

      // Remover de AsyncStorage
      await AsyncStorage.removeItem(cacheKey);

      return hadMemoryEntry;
    } catch (error) {
      console.warn(`[TTLStrategy] Remove entry error for ${cacheKey}:`, error);
      return false;
    }
  }

  async _getFromStorage(cacheKey) {
    try {
      const stored = await AsyncStorage.getItem(cacheKey);
      return stored ? deserializeData(stored) : null;
    } catch (error) {
      console.warn(`[TTLStrategy] Storage get error for ${cacheKey}:`, error);
      return null;
    }
  }

  async _setInStorage(cacheKey, entry) {
    try {
      await AsyncStorage.setItem(cacheKey, serializeData(entry));
    } catch (error) {
      console.warn(`[TTLStrategy] Storage set error for ${cacheKey}:`, error);
    }
  }

  async _cleanupStorage() {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const ttlKeys = allKeys.filter(
        (key) => key.includes("unified_cache_") && key.includes("_ttl_")
      );

      const expiredKeys = [];
      for (const key of ttlKeys) {
        const entry = await this._getFromStorage(key);
        if (entry && this._isExpired(entry)) {
          expiredKeys.push(key);
        }
      }

      if (expiredKeys.length > 0) {
        await AsyncStorage.multiRemove(expiredKeys);
      }
    } catch (error) {
      console.warn("[TTLStrategy] Storage cleanup error:", error);
    }
  }

  async _clearStorage() {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const ttlKeys = allKeys.filter(
        (key) => key.includes("unified_cache_") && key.includes("_ttl_")
      );

      if (ttlKeys.length > 0) {
        await AsyncStorage.multiRemove(ttlKeys);
      }
    } catch (error) {
      console.warn("[TTLStrategy] Storage clear error:", error);
    }
  }

  _setupCleanup() {
    if (this.config.cleanupInterval && this.config.cleanupInterval > 0) {
      this.cleanupTimer = setInterval(() => {
        this.cleanup().catch((error) => {
          console.warn("[TTLStrategy] Scheduled cleanup error:", error);
        });
      }, this.config.cleanupInterval);
    }
  }

  _clearCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  _recordMetric(type, value = 1) {
    if (!this.config.enableMetrics) return;

    switch (type) {
      case "hit":
        this.metrics.hits += value;
        break;
      case "miss":
        this.metrics.misses += value;
        break;
      case "expired":
        this.metrics.expired += value;
        break;
      case "set":
        this.metrics.sets += value;
        break;
      case "invalidate":
        this.metrics.invalidations += value;
        break;
    }
  }
}
