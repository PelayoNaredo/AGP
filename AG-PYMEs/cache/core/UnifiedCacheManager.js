/**
 * UnifiedCacheManager - Motor Principal del Sistema de Cache Unificado
 *
 * Este archivo contiene la clase principal que unifica las tres estrategias de cache:
 * - TTL (Time To Live) para datos básicos
 * - Bulk Loading para datos relacionados
 * - Intelligent Caching para optimización adaptativa
 *
 * Responsabilidades:
 * - Gestión centralizada de todas las operaciones de cache
 * - Selección automática de estrategias según el tipo de dato
 * - Integración con sistema de métricas
 * - Manejo de invalidación inteligente
 * - Coordinación entre memoria y AsyncStorage
 *
 * @author Sistema Unificado de Cache
 * @version 1.0.0
 * @created 2025-07-29
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import CacheMetrics from "./CacheMetrics.js";
import {
  generateCacheKey,
  validateCacheConfig,
  getMonthKey,
} from "./CacheUtils.js";
import UNIFIED_CACHE_CONFIG from "../config/CacheConfig.js";
import {
  CACHE_STRATEGIES,
  CACHE_STATES,
  CACHE_ERROR_CODES,
} from "../config/CacheConstants.js";

/**
 * Motor principal del sistema de cache unificado
 */
export default class UnifiedCacheManager {
  constructor(config = UNIFIED_CACHE_CONFIG) {
    this.config = { ...UNIFIED_CACHE_CONFIG, ...config };
    this.memoryCache = new Map();
    this.loadingStates = new Map();
    this.metrics = new CacheMetrics();
    this.strategies = new Map();
    this.cleanupInterval = null;

    // Validar configuración
    if (!validateCacheConfig(this.config)) {
      throw new Error("Invalid cache configuration");
    }

    // Inicializar estrategias
    this._initializeStrategies();

    // Configurar cleanup automático
    this._setupCleanup();
  }

  /**
   * Inicializa las estrategias de cache disponibles
   * @private
   */
  _initializeStrategies() {
    // Se implementarán las estrategias específicas cuando estén listas
    this.strategies.set(CACHE_STRATEGIES.TTL, this._createTTLStrategy());
    this.strategies.set(
      CACHE_STRATEGIES.BULK_LOADING,
      this._createBulkStrategy()
    );
    this.strategies.set(
      CACHE_STRATEGIES.INTELLIGENT,
      this._createIntelligentStrategy()
    );
  }

  /**
   * Configura el cleanup automático
   * @private
   */
  _setupCleanup() {
    if (this.config.CLEANUP_INTERVAL && this.config.CLEANUP_INTERVAL > 0) {
      this.cleanupInterval = setInterval(() => {
        this._performCleanup();
      }, this.config.CLEANUP_INTERVAL);
    }
  }

  /**
   * Selecciona la estrategia apropiada según las opciones
   * @param {object} options - Opciones de cache
   * @returns {string} Estrategia seleccionada
   */
  selectStrategy(options = {}) {
    // Estrategia explícita
    if (options.strategy) {
      return options.strategy;
    }

    // Estrategia por tipo de dato
    if (options.dataType) {
      const dataTypeConfig = this._getDataTypeConfig(options.dataType);
      if (dataTypeConfig && dataTypeConfig.strategy) {
        return dataTypeConfig.strategy;
      }
    }

    // Estrategia por características
    if (options.bulkLoading) {
      return CACHE_STRATEGIES.BULK_LOADING;
    }

    if (options.intelligent) {
      return CACHE_STRATEGIES.INTELLIGENT;
    }

    // Estrategia por defecto
    return CACHE_STRATEGIES.TTL;
  }

  /**
   * Obtiene datos del cache con estrategia automática
   * @param {string} key - Clave del cache
   * @param {object} options - Opciones de configuración
   * @returns {Promise<any>} Datos cached o null si no existen
   */
  async get(key, options = {}) {
    const startTime = Date.now();
    const strategy = this.selectStrategy(options);
    const cacheKey = generateCacheKey(key, options);

    try {
      // Verificar si ya está cargando
      if (this.loadingStates.has(cacheKey)) {
        this.metrics.recordOperation("get", key, { hit: false, loading: true });
        return null;
      }

      // Buscar en memoria primero
      let cacheEntry = this.memoryCache.get(cacheKey);

      // Si no está en memoria, buscar en AsyncStorage
      if (!cacheEntry) {
        cacheEntry = await this._getFromStorage(cacheKey);
        if (cacheEntry) {
          this.memoryCache.set(cacheKey, cacheEntry);
        }
      }

      // Verificar validez del cache
      if (cacheEntry && this._isValidCacheEntry(cacheEntry, options)) {
        const responseTime = Date.now() - startTime;
        this.metrics.recordOperation("get", key, {
          hit: true,
          strategy,
          responseTime,
        });
        return cacheEntry.data;
      }

      // Cache miss
      const responseTime = Date.now() - startTime;
      this.metrics.recordOperation("get", key, {
        hit: false,
        strategy,
        responseTime,
      });
      return null;
    } catch (error) {
      this.metrics.recordError("get", key, error);
      console.warn(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Guarda datos en el cache
   * @param {string} key - Clave del cache
   * @param {any} data - Datos a guardar
   * @param {object} options - Opciones de configuración
   * @returns {Promise<boolean>} True si se guardó correctamente
   */
  async set(key, data, options = {}) {
    const startTime = Date.now();
    const strategy = this.selectStrategy(options);
    const cacheKey = generateCacheKey(key, options);

    try {
      const ttl = this._getTTL(options);
      const cacheEntry = {
        data,
        timestamp: Date.now(),
        ttl,
        strategy,
        key: cacheKey,
      };

      // Guardar en memoria
      this.memoryCache.set(cacheKey, cacheEntry);

      // Guardar en AsyncStorage de forma asíncrona
      this._setInStorage(cacheKey, cacheEntry).catch((error) => {
        console.warn(`AsyncStorage set error for key ${key}:`, error);
      });

      const responseTime = Date.now() - startTime;
      this.metrics.recordOperation("set", key, {
        success: true,
        strategy,
        responseTime,
      });

      return true;
    } catch (error) {
      this.metrics.recordError("set", key, error);
      console.warn(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Invalida cache por claves específicas
   * @param {string|string[]} keys - Clave o array de claves a invalidar
   * @returns {Promise<boolean>} True si se invalidó correctamente
   */
  async invalidate(keys) {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    const startTime = Date.now();

    try {
      const cacheKeysToRemove = [];

      for (const key of keyArray) {
        // Buscar claves que coincidan (incluyendo variaciones)
        const matchingKeys = this._findMatchingKeys(key);
        cacheKeysToRemove.push(...matchingKeys);
      }

      // Remover de memoria
      for (const cacheKey of cacheKeysToRemove) {
        this.memoryCache.delete(cacheKey);
      }

      // Remover de AsyncStorage
      if (cacheKeysToRemove.length > 0) {
        await AsyncStorage.multiRemove(cacheKeysToRemove);
      }

      const responseTime = Date.now() - startTime;
      this.metrics.recordOperation("invalidate", keyArray.join(","), {
        success: true,
        count: cacheKeysToRemove.length,
        responseTime,
      });

      return true;
    } catch (error) {
      this.metrics.recordError("invalidate", keyArray.join(","), error);
      console.warn(`Cache invalidate error:`, error);
      return false;
    }
  }

  /**
   * Obtiene métricas del cache
   * @returns {object} Métricas actuales
   */
  getMetrics() {
    return {
      ...this.metrics.getReport(),
      memoryEntries: this.memoryCache.size,
      loadingOperations: this.loadingStates.size,
    };
  }

  /**
   * Obtiene el estado actual del cache
   * @returns {object} Estado del sistema
   */
  getStatus() {
    return {
      isHealthy: this.metrics.getHealthStatus(),
      memoryUsage: this._calculateMemoryUsage(),
      entriesCount: this.memoryCache.size,
      activeStrategies: Array.from(this.strategies.keys()),
      config: this.config,
    };
  }

  /**
   * Limpia todo el cache
   * @returns {Promise<boolean>} True si se limpió correctamente
   */
  async clearAll() {
    try {
      // Limpiar memoria
      this.memoryCache.clear();
      this.loadingStates.clear();

      // Limpiar AsyncStorage (solo claves del cache unificado)
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(
        (key) =>
          key.startsWith("unified_cache_") ||
          key.startsWith("cache_") ||
          key.startsWith("planner_")
      );

      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }

      this.metrics.recordOperation("clearAll", "system", {
        success: true,
        clearedCount: cacheKeys.length,
      });

      return true;
    } catch (error) {
      this.metrics.recordError("clearAll", "system", error);
      return false;
    }
  }

  /**
   * Métodos privados para lógica interna
   */

  _createTTLStrategy() {
    return {
      name: "TTL",
      validate: (entry, options) => this._isValidTTL(entry, options),
    };
  }

  _createBulkStrategy() {
    return {
      name: "BulkLoading",
      validate: (entry, options) => this._isValidBulk(entry, options),
    };
  }

  _createIntelligentStrategy() {
    return {
      name: "Intelligent",
      validate: (entry, options) => this._isValidIntelligent(entry, options),
    };
  }

  _getDataTypeConfig(dataType) {
    // Verificar que existe la configuración de tipos de datos
    if (!this.config.dataTypes) {
      console.error(
        "  [Cache] No existe configuración de dataTypes en config:",
        this.config
      );
      return null;
    }

    // Buscar directamente en dataTypes (ya no hay categorías anidadas)
    if (this.config.dataTypes[dataType]) {
      return this.config.dataTypes[dataType];
    }

    console.warn(
      `   [Cache] No se encontró configuración para tipo de dato: ${dataType}`
    );
    return null;
  }

  _getTTL(options) {
    if (options.ttl) return options.ttl;
    if (options.dataType) {
      const config = this._getDataTypeConfig(options.dataType);
      if (config && config.ttl) return config.ttl;
    }
    return this.config.system?.defaultTTL || 10 * 60 * 1000; // 10 minutos por defecto
  }

  _isValidCacheEntry(entry, options) {
    if (!entry || !entry.timestamp) return false;

    const strategy = this.strategies.get(entry.strategy);
    if (strategy && strategy.validate) {
      return strategy.validate(entry, options);
    }

    // Validación por defecto (TTL)
    return this._isValidTTL(entry, options);
  }

  _isValidTTL(entry, options) {
    const ttl = entry.ttl || this._getTTL(options);
    return Date.now() - entry.timestamp < ttl;
  }

  _isValidBulk(entry, options) {
    // Para bulk loading, verificar TTL y validez de datos
    return this._isValidTTL(entry, options) && entry.data;
  }

  _isValidIntelligent(entry, options) {
    // Para cache inteligente, lógica más compleja (a implementar)
    return this._isValidTTL(entry, options);
  }

  async _getFromStorage(key) {
    try {
      const stored = await AsyncStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn(`Storage get error for key ${key}:`, error);
      return null;
    }
  }

  async _setInStorage(key, entry) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      console.warn(`Storage set error for key ${key}:`, error);
    }
  }

  _findMatchingKeys(pattern) {
    const matchingKeys = [];

    // Buscar en memoria
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        matchingKeys.push(key);
      }
    }

    return matchingKeys;
  }

  _calculateMemoryUsage() {
    let totalSize = 0;
    for (const entry of this.memoryCache.values()) {
      totalSize += JSON.stringify(entry).length;
    }
    return totalSize;
  }

  _performCleanup() {
    const now = Date.now();
    const keysToRemove = [];

    // Cleanup de memoria
    for (const [key, entry] of this.memoryCache.entries()) {
      if (!this._isValidCacheEntry(entry, {})) {
        keysToRemove.push(key);
      }
    }

    // Remover entradas expiradas
    for (const key of keysToRemove) {
      this.memoryCache.delete(key);
    }

    // Cleanup de AsyncStorage (asíncrono)
    if (keysToRemove.length > 0) {
      AsyncStorage.multiRemove(keysToRemove).catch((error) => {
        console.warn("Cleanup error:", error);
      });
    }

    this.metrics.recordOperation("cleanup", "system", {
      success: true,
      cleanedCount: keysToRemove.length,
    });
  }

  /**
   * Destructor para limpiar recursos
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.memoryCache.clear();
    this.loadingStates.clear();
  }
}
