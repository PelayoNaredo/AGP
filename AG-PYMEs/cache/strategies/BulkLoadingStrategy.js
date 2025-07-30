/**
 * BulkLoadingStrategy - Estrategia de Carga Masiva para Cache
 *
 * Estrategia especializada para la carga eficiente de grandes conjuntos de datos.
 * Diseñada específicamente para datos del planner (citas y turnos) donde es común
 * cargar información de meses completos o múltiples fechas.
 *
 * Características principales:
 * - Carga masiva de datos relacionados
 * - Agrupación inteligente de requests
 * - Cache jerárquico por fechas y categorías
 * - Optimización de memoria con compresión
 * - Invalidación en cascada
 *
 * @author Sistema Unificado de Cache
 * @version 1.0.0
 * @created 2025-07-29
 */

import CacheUtils from "../core/CacheUtils.js";

export class BulkLoadingStrategy {
  /**
   * @param {object} config - Configuración de la estrategia
   * @param {CacheMetrics} metrics - Sistema de métricas
   */
  constructor(config = {}, metrics = null) {
    this.config = {
      // Configuración de bulk loading
      maxBulkSize: config.maxBulkSize || 500, // Máximo items por bulk
      bulkTimeout: config.bulkTimeout || 2000, // Timeout para agrupar requests
      compressionThreshold: config.compressionThreshold || 100, // Items para activar compresión

      // Configuración de cache jerárquico
      hierarchicalLevels: config.hierarchicalLevels || [
        "year",
        "month",
        "week",
        "day",
      ],
      maxHierarchyDepth: config.maxHierarchyDepth || 3,

      // Configuración de memoria
      maxMemoryUsage: config.maxMemoryUsage || 50 * 1024 * 1024, // 50MB
      memoryCleanupThreshold: config.memoryCleanupThreshold || 0.8, // 80%

      // Configuración de invalidación
      cascadeInvalidation: config.cascadeInvalidation !== false,
      invalidationBatchSize: config.invalidationBatchSize || 100,

      ...config,
    };

    this.metrics = metrics;
    this.name = "BulkLoading";

    // Estado interno
    this.pendingBulks = new Map(); // Requests pendientes de agrupación
    this.hierarchyCache = new Map(); // Cache jerárquico
    this.memoryUsage = 0; // Uso actual de memoria
    this.compressionMap = new Map(); // Mapeo de datos comprimidos

    // Timers para bulk loading
    this.bulkTimers = new Map();

    this._initializeHierarchy();
  }

  /**
   * Inicializa la estructura jerárquica del cache
   * @private
   */
  _initializeHierarchy() {
    this.config.hierarchicalLevels.forEach((level) => {
      this.hierarchyCache.set(level, new Map());
    });
  }

  /**
   * Obtiene datos del cache con soporte para bulk loading
   * @param {string} key - Clave del cache
   * @param {object} options - Opciones adicionales
   * @returns {Promise<any>} Datos del cache o null
   */
  async get(key, options = {}) {
    const startTime = Date.now();

    try {
      // Verificar cache jerárquico primero
      const hierarchicalResult = await this._getFromHierarchy(key, options);
      if (hierarchicalResult !== null) {
        this._recordMetrics("hit", startTime, key, "hierarchical");
        return hierarchicalResult;
      }

      // Verificar cache comprimido
      const compressedResult = await this._getFromCompressed(key);
      if (compressedResult !== null) {
        this._recordMetrics("hit", startTime, key, "compressed");
        return compressedResult;
      }

      // Si hay bulk pendiente para esta clave, esperarlo
      const bulkResult = await this._checkPendingBulk(key);
      if (bulkResult !== null) {
        this._recordMetrics("hit", startTime, key, "bulk");
        return bulkResult;
      }

      this._recordMetrics("miss", startTime, key);
      return null;
    } catch (error) {
      this._recordMetrics("error", startTime, key, null, error);
      throw error;
    }
  }

  /**
   * Almacena datos en el cache con optimización bulk
   * @param {string} key - Clave del cache
   * @param {any} value - Valor a almacenar
   * @param {object} options - Opciones de almacenamiento
   * @returns {Promise<boolean>} Éxito de la operación
   */
  async set(key, value, options = {}) {
    const startTime = Date.now();

    try {
      // Verificar si es candidato para bulk loading
      if (options.enableBulk && this._isBulkCandidate(key, value)) {
        await this._addToBulk(key, value, options);
        this._recordMetrics("bulk_queued", startTime, key);
        return true;
      }

      // Almacenar en jerarquía si corresponde
      if (options.hierarchical) {
        await this._setInHierarchy(key, value, options);
      }

      // Comprimir si es necesario
      if (this._shouldCompress(value)) {
        await this._setCompressed(key, value, options);
      } else {
        await this._setNormal(key, value, options);
      }

      this._recordMetrics("set", startTime, key);
      return true;
    } catch (error) {
      this._recordMetrics("error", startTime, key, null, error);
      throw error;
    }
  }

  /**
   * Invalida datos del cache con cascada jerárquica
   * @param {string} key - Clave a invalidar
   * @param {object} options - Opciones de invalidación
   * @returns {Promise<boolean>} Éxito de la operación
   */
  async invalidate(key, options = {}) {
    const startTime = Date.now();
    let invalidatedCount = 0;

    try {
      // Invalidación en jerarquía
      if (this.config.cascadeInvalidation) {
        invalidatedCount += await this._invalidateHierarchy(key, options);
      }

      // Invalidación en cache comprimido
      invalidatedCount += await this._invalidateCompressed(key);

      // Cancelar bulks pendientes relacionados
      invalidatedCount += await this._cancelRelatedBulks(key);

      this._recordMetrics(
        "invalidate",
        startTime,
        key,
        null,
        null,
        invalidatedCount
      );
      return invalidatedCount > 0;
    } catch (error) {
      this._recordMetrics("error", startTime, key, null, error);
      throw error;
    }
  }

  /**
   * Verifica si una clave es candidata para bulk loading
   * @param {string} key - Clave a verificar
   * @param {any} value - Valor asociado
   * @returns {boolean} True si es candidata
   * @private
   */
  _isBulkCandidate(key, value) {
    // Patrones típicos para bulk loading
    const bulkPatterns = [
      /appointments.*monthly/i,
      /shifts.*monthly/i,
      /planner.*bulk/i,
      /calendar.*range/i,
    ];

    return (
      bulkPatterns.some((pattern) => pattern.test(key)) ||
      (Array.isArray(value) && value.length > 10)
    );
  }

  /**
   * Añade datos a un bulk pendiente
   * @param {string} key - Clave del dato
   * @param {any} value - Valor del dato
   * @param {object} options - Opciones
   * @private
   */
  async _addToBulk(key, value, options) {
    const bulkId = this._getBulkId(key);

    if (!this.pendingBulks.has(bulkId)) {
      this.pendingBulks.set(bulkId, {
        items: new Map(),
        createdAt: Date.now(),
        options: { ...options },
      });

      // Configurar timer para procesar el bulk
      this.bulkTimers.set(
        bulkId,
        setTimeout(() => {
          this._processBulk(bulkId);
        }, this.config.bulkTimeout)
      );
    }

    const bulk = this.pendingBulks.get(bulkId);
    bulk.items.set(key, value);

    // Procesar inmediatamente si alcanzamos el tamaño máximo
    if (bulk.items.size >= this.config.maxBulkSize) {
      clearTimeout(this.bulkTimers.get(bulkId));
      this.bulkTimers.delete(bulkId);
      await this._processBulk(bulkId);
    }
  }

  /**
   * Procesa un bulk pendiente
   * @param {string} bulkId - ID del bulk a procesar
   * @private
   */
  async _processBulk(bulkId) {
    const bulk = this.pendingBulks.get(bulkId);
    if (!bulk) return;

    try {
      // Agrupar datos por jerarquía
      const groupedData = this._groupByHierarchy(bulk.items);

      // Procesar cada grupo
      for (const [level, data] of groupedData) {
        await this._setBulkInHierarchy(level, data, bulk.options);
      }

      // Comprimir si es necesario
      if (bulk.items.size >= this.config.compressionThreshold) {
        await this._compressBulk(bulk.items);
      }
    } catch (error) {
      console.error("[BulkLoadingStrategy] Error processing bulk:", error);
    } finally {
      // Limpiar bulk procesado
      this.pendingBulks.delete(bulkId);
      this.bulkTimers.delete(bulkId);
    }
  }

  /**
   * Obtiene el ID de bulk para una clave
   * @param {string} key - Clave
   * @returns {string} ID del bulk
   * @private
   */
  _getBulkId(key) {
    // Extraer patrones comunes para agrupar
    const patterns = [
      /^(appointments)_(\d{4}-\d{2})/,
      /^(shifts)_(\d{4}-\d{2})/,
      /^(planner)_([^_]+)/,
    ];

    for (const pattern of patterns) {
      const match = key.match(pattern);
      if (match) {
        return `${match[1]}_${match[2]}`;
      }
    }

    // Fallback: usar prefijo de la clave
    return key.split("_")[0] || "default";
  }

  /**
   * Agrupa datos por nivel jerárquico
   * @param {Map} items - Items a agrupar
   * @returns {Map} Datos agrupados por nivel
   * @private
   */
  _groupByHierarchy(items) {
    const grouped = new Map();

    for (const [key, value] of items) {
      const level = this._getHierarchyLevel(key);
      if (!grouped.has(level)) {
        grouped.set(level, new Map());
      }
      grouped.get(level).set(key, value);
    }

    return grouped;
  }

  /**
   * Determina el nivel jerárquico de una clave
   * @param {string} key - Clave a analizar
   * @returns {string} Nivel jerárquico
   * @private
   */
  _getHierarchyLevel(key) {
    if (/\d{4}-\d{2}-\d{2}/.test(key)) return "day";
    if (/\d{4}-\d{2}/.test(key)) return "month";
    if (/\d{4}/.test(key)) return "year";
    return "default";
  }

  /**
   * Obtiene datos del cache jerárquico
   * @param {string} key - Clave
   * @param {object} options - Opciones
   * @returns {Promise<any>} Datos o null
   * @private
   */
  async _getFromHierarchy(key, options) {
    const level = this._getHierarchyLevel(key);
    const hierarchyLevel = this.hierarchyCache.get(level);

    if (hierarchyLevel && hierarchyLevel.has(key)) {
      const cached = hierarchyLevel.get(key);
      if (this._isValidCacheEntry(cached)) {
        return cached.value;
      } else {
        hierarchyLevel.delete(key);
      }
    }

    return null;
  }

  /**
   * Almacena datos en el cache jerárquico
   * @param {string} key - Clave
   * @param {any} value - Valor
   * @param {object} options - Opciones
   * @private
   */
  async _setInHierarchy(key, value, options) {
    const level = this._getHierarchyLevel(key);
    const hierarchyLevel = this.hierarchyCache.get(level);

    if (hierarchyLevel) {
      const entry = {
        value,
        timestamp: Date.now(),
        ttl: options.ttl || this.config.defaultTTL,
        size: this._estimateSize(value),
      };

      hierarchyLevel.set(key, entry);
      this.memoryUsage += entry.size;

      // Verificar límites de memoria
      if (
        this.memoryUsage >
        this.config.maxMemoryUsage * this.config.memoryCleanupThreshold
      ) {
        await this._cleanupMemory();
      }
    }
  }

  /**
   * Verifica si debe comprimir un valor
   * @param {any} value - Valor a verificar
   * @returns {boolean} True si debe comprimir
   * @private
   */
  _shouldCompress(value) {
    const size = this._estimateSize(value);
    return size > 10240; // Comprimir si es mayor a 10KB
  }

  /**
   * Estima el tamaño de un valor en bytes
   * @param {any} value - Valor a estimar
   * @returns {number} Tamaño estimado en bytes
   * @private
   */
  _estimateSize(value) {
    return JSON.stringify(value).length * 2; // Aproximación UTF-16
  }

  /**
   * Valida si una entrada de cache es válida
   * @param {object} entry - Entrada de cache
   * @returns {boolean} True si es válida
   * @private
   */
  _isValidCacheEntry(entry) {
    if (!entry || !entry.timestamp) return false;

    const age = Date.now() - entry.timestamp;
    return age < (entry.ttl || this.config.defaultTTL);
  }

  /**
   * Limpia memoria eliminando entradas más antiguas
   * @private
   */
  async _cleanupMemory() {
    const entries = [];

    // Recopilar todas las entradas con su nivel y timestamp
    for (const [level, cache] of this.hierarchyCache) {
      for (const [key, entry] of cache) {
        entries.push({ level, key, entry, timestamp: entry.timestamp });
      }
    }

    // Ordenar por timestamp (más antiguas primero)
    entries.sort((a, b) => a.timestamp - b.timestamp);

    // Eliminar entradas hasta reducir uso de memoria
    const targetMemory = this.config.maxMemoryUsage * 0.6; // Reducir a 60%

    for (const { level, key, entry } of entries) {
      if (this.memoryUsage <= targetMemory) break;

      const hierarchyLevel = this.hierarchyCache.get(level);
      if (hierarchyLevel) {
        hierarchyLevel.delete(key);
        this.memoryUsage -= entry.size;
      }
    }
  }

  /**
   * Registra métricas de la operación
   * @param {string} operation - Tipo de operación
   * @param {number} startTime - Tiempo de inicio
   * @param {string} key - Clave involucrada
   * @param {string} source - Fuente del resultado
   * @param {Error} error - Error si ocurrió
   * @param {number} count - Contador adicional
   * @private
   */
  _recordMetrics(
    operation,
    startTime,
    key,
    source = null,
    error = null,
    count = 1
  ) {
    if (!this.metrics) return;

    const duration = Date.now() - startTime;

    this.metrics.recordOperation({
      operation,
      strategy: this.name,
      key,
      duration,
      source,
      error: error?.message,
      count,
      timestamp: Date.now(),
    });
  }

  /**
   * Obtiene estadísticas de la estrategia
   * @returns {object} Estadísticas actuales
   */
  getStats() {
    const hierarchyStats = {};
    let totalItems = 0;

    for (const [level, cache] of this.hierarchyCache) {
      hierarchyStats[level] = cache.size;
      totalItems += cache.size;
    }

    return {
      name: this.name,
      totalItems,
      hierarchyStats,
      memoryUsage: this.memoryUsage,
      memoryUsagePercent: (this.memoryUsage / this.config.maxMemoryUsage) * 100,
      pendingBulks: this.pendingBulks.size,
      compressedItems: this.compressionMap.size,
      config: { ...this.config },
    };
  }

  /**
   * Limpia completamente el cache de la estrategia
   * @returns {Promise<void>}
   */
  async clear() {
    // Cancelar todos los timers de bulk
    for (const timer of this.bulkTimers.values()) {
      clearTimeout(timer);
    }
    this.bulkTimers.clear();

    // Limpiar bulks pendientes
    this.pendingBulks.clear();

    // Limpiar cache jerárquico
    for (const cache of this.hierarchyCache.values()) {
      cache.clear();
    }

    // Limpiar datos comprimidos
    this.compressionMap.clear();

    // Resetear uso de memoria
    this.memoryUsage = 0;
  }

  // Métodos auxiliares implementados

  /**
   * Obtiene datos del cache comprimido
   * @param {string} key - Clave a buscar
   * @returns {Promise<any>} Datos descomprimidos o null
   * @private
   */
  async _getFromCompressed(key) {
    if (!this.compressionMap.has(key)) {
      return null;
    }

    try {
      const compressedEntry = this.compressionMap.get(key);

      // Verificar validez
      if (!this._isValidCacheEntry(compressedEntry)) {
        this.compressionMap.delete(key);
        return null;
      }

      // Descomprimir datos (simulación - en producción usar LZ-string o similar)
      const decompressedData = JSON.parse(compressedEntry.compressedValue);

      return decompressedData;
    } catch (error) {
      console.warn(
        `[BulkLoadingStrategy] Error decompressing key "${key}":`,
        error
      );
      this.compressionMap.delete(key);
      return null;
    }
  }

  /**
   * Verifica si una clave está en un bulk pendiente
   * @param {string} key - Clave a verificar
   * @returns {Promise<any>} Datos del bulk o null
   * @private
   */
  async _checkPendingBulk(key) {
    const bulkId = this._getBulkId(key);
    const bulk = this.pendingBulks.get(bulkId);

    if (!bulk || !bulk.items.has(key)) {
      return null;
    }

    // Si está en el bulk, esperar un poco más para procesamiento
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const currentBulk = this.pendingBulks.get(bulkId);
        if (!currentBulk) {
          // Bulk ya procesado, buscar en cache
          clearInterval(checkInterval);
          this._getFromHierarchy(key, {}).then(resolve);
        }
      }, 100);

      // Timeout después de 2 segundos
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(bulk.items.get(key) || null);
      }, 2000);
    });
  }

  /**
   * Almacena datos comprimidos
   * @param {string} key - Clave
   * @param {any} value - Valor a comprimir
   * @param {object} options - Opciones
   * @private
   */
  async _setCompressed(key, value, options) {
    try {
      // Comprimir datos (simulación - en producción usar LZ-string)
      const compressedValue = JSON.stringify(value);
      const originalSize = this._estimateSize(value);
      const compressedSize = compressedValue.length * 0.6; // Simulación 40% compresión

      const entry = {
        compressedValue,
        originalSize,
        compressedSize,
        timestamp: Date.now(),
        ttl: options.ttl || this.config.defaultTTL,
        compressionRatio: compressedSize / originalSize,
      };

      this.compressionMap.set(key, entry);
      this.memoryUsage += compressedSize;

      // Limpiar memoria si es necesario
      if (
        this.memoryUsage >
        this.config.maxMemoryUsage * this.config.memoryCleanupThreshold
      ) {
        await this._cleanupMemory();
      }
    } catch (error) {
      console.error(
        `[BulkLoadingStrategy] Error compressing key "${key}":`,
        error
      );
      // Fallback a almacenamiento normal
      await this._setNormal(key, value, options);
    }
  }

  /**
   * Almacena datos sin compresión
   * @param {string} key - Clave
   * @param {any} value - Valor
   * @param {object} options - Opciones
   * @private
   */
  async _setNormal(key, value, options) {
    // Almacenar en jerarquía por defecto
    await this._setInHierarchy(key, value, { ...options, hierarchical: true });
  }

  /**
   * Invalida datos en el cache jerárquico con cascada
   * @param {string} key - Clave a invalidar
   * @param {object} options - Opciones
   * @returns {Promise<number>} Número de entradas invalidadas
   * @private
   */
  async _invalidateHierarchy(key, options) {
    let invalidatedCount = 0;

    try {
      // Invalidación directa
      const level = this._getHierarchyLevel(key);
      const hierarchyLevel = this.hierarchyCache.get(level);

      if (hierarchyLevel && hierarchyLevel.has(key)) {
        const entry = hierarchyLevel.get(key);
        hierarchyLevel.delete(key);
        this.memoryUsage -= entry.size || 0;
        invalidatedCount++;
      }

      // Invalidación en cascada si está habilitada
      if (this.config.cascadeInvalidation) {
        invalidatedCount += await this._invalidateCascade(key, options);
      }

      return invalidatedCount;
    } catch (error) {
      console.error(
        `[BulkLoadingStrategy] Error invalidating hierarchy for key "${key}":`,
        error
      );
      return invalidatedCount;
    }
  }

  /**
   * Invalida datos comprimidos
   * @param {string} key - Clave a invalidar
   * @returns {Promise<number>} Número de entradas invalidadas
   * @private
   */
  async _invalidateCompressed(key) {
    if (this.compressionMap.has(key)) {
      const entry = this.compressionMap.get(key);
      this.compressionMap.delete(key);
      this.memoryUsage -= entry.compressedSize || 0;
      return 1;
    }
    return 0;
  }

  /**
   * Cancela bulks relacionados con una clave
   * @param {string} key - Clave
   * @returns {Promise<number>} Número de bulks cancelados
   * @private
   */
  async _cancelRelatedBulks(key) {
    const bulkId = this._getBulkId(key);
    let canceledCount = 0;

    // Cancelar bulk específico
    if (this.pendingBulks.has(bulkId)) {
      const timer = this.bulkTimers.get(bulkId);
      if (timer) {
        clearTimeout(timer);
        this.bulkTimers.delete(bulkId);
      }
      this.pendingBulks.delete(bulkId);
      canceledCount++;
    }

    // Cancelar bulks relacionados por patrón
    const keyPrefix = key.split("_")[0];
    for (const [pendingBulkId] of this.pendingBulks) {
      if (pendingBulkId.startsWith(keyPrefix) && pendingBulkId !== bulkId) {
        const timer = this.bulkTimers.get(pendingBulkId);
        if (timer) {
          clearTimeout(timer);
          this.bulkTimers.delete(pendingBulkId);
        }
        this.pendingBulks.delete(pendingBulkId);
        canceledCount++;
      }
    }

    return canceledCount;
  }

  /**
   * Almacena bulk de datos en jerarquía
   * @param {string} level - Nivel jerárquico
   * @param {Map} data - Datos a almacenar
   * @param {object} options - Opciones
   * @private
   */
  async _setBulkInHierarchy(level, data, options) {
    const hierarchyLevel = this.hierarchyCache.get(level);
    if (!hierarchyLevel) return;

    const batchSize = this.config.invalidationBatchSize;
    const dataArray = Array.from(data.entries());

    // Procesar en lotes para evitar bloqueo
    for (let i = 0; i < dataArray.length; i += batchSize) {
      const batch = dataArray.slice(i, i + batchSize);

      for (const [key, value] of batch) {
        const entry = {
          value,
          timestamp: Date.now(),
          ttl: options.ttl || this.config.defaultTTL,
          size: this._estimateSize(value),
          bulkId: this._getBulkId(key),
        };

        hierarchyLevel.set(key, entry);
        this.memoryUsage += entry.size;
      }

      // Yield control para no bloquear
      if (i + batchSize < dataArray.length) {
        await new Promise((resolve) => setTimeout(resolve, 1));
      }
    }

    // Verificar límites de memoria después del bulk
    if (
      this.memoryUsage >
      this.config.maxMemoryUsage * this.config.memoryCleanupThreshold
    ) {
      await this._cleanupMemory();
    }
  }

  /**
   * Comprime un bulk completo de datos
   * @param {Map} items - Items a comprimir
   * @private
   */
  async _compressBulk(items) {
    try {
      // Agrupar items similares para mejor compresión
      const groupedItems = this._groupItemsForCompression(items);

      for (const [groupKey, groupItems] of groupedItems) {
        const combinedData = Array.from(groupItems.values());
        const compressedKey = `${groupKey}_bulk_${Date.now()}`;

        // Comprimir el grupo completo
        await this._setCompressed(compressedKey, combinedData, {
          ttl: this.config.defaultTTL,
          isBulkCompressed: true,
        });

        // Crear índices para acceso individual
        for (const [originalKey] of groupItems) {
          this.compressionMap.set(`${originalKey}_ref`, {
            bulkKey: compressedKey,
            timestamp: Date.now(),
            ttl: this.config.defaultTTL,
          });
        }
      }
    } catch (error) {
      console.error("[BulkLoadingStrategy] Error compressing bulk:", error);
    }
  }

  /**
   * Invalida en cascada basado en patrones
   * @param {string} key - Clave base
   * @param {object} options - Opciones
   * @returns {Promise<number>} Entradas invalidadas
   * @private
   */
  async _invalidateCascade(key, options) {
    let invalidatedCount = 0;

    // Patrones de cascada
    const cascadePatterns = {
      appointments_: ["planner_appointments_", "calendar_appointments_"],
      shifts_: ["planner_shifts_", "calendar_shifts_", "employees_shifts_"],
      employees_: ["shifts_", "planner_employees_"],
      services_: ["appointments_", "planner_services_"],
    };

    const keyPrefix = key.split("_")[0] + "_";
    const relatedPatterns = cascadePatterns[keyPrefix] || [];

    for (const pattern of relatedPatterns) {
      for (const [level, cache] of this.hierarchyCache) {
        const keysToInvalidate = [];

        for (const [cacheKey] of cache) {
          if (cacheKey.startsWith(pattern)) {
            keysToInvalidate.push(cacheKey);
          }
        }

        for (const keyToInvalidate of keysToInvalidate) {
          const entry = cache.get(keyToInvalidate);
          cache.delete(keyToInvalidate);
          if (entry) {
            this.memoryUsage -= entry.size || 0;
            invalidatedCount++;
          }
        }
      }
    }

    return invalidatedCount;
  }

  /**
   * Agrupa items para optimizar compresión
   * @param {Map} items - Items a agrupar
   * @returns {Map} Items agrupados
   * @private
   */
  _groupItemsForCompression(items) {
    const groups = new Map();

    for (const [key, value] of items) {
      const groupKey = this._getCompressionGroupKey(key);

      if (!groups.has(groupKey)) {
        groups.set(groupKey, new Map());
      }

      groups.get(groupKey).set(key, value);
    }

    return groups;
  }

  /**
   * Obtiene clave de grupo para compresión
   * @param {string} key - Clave original
   * @returns {string} Clave de grupo
   * @private
   */
  _getCompressionGroupKey(key) {
    // Agrupar por tipo y período
    if (key.includes("appointments_")) {
      const monthMatch = key.match(/(\d{4}-\d{2})/);
      return monthMatch ? `appointments_${monthMatch[1]}` : "appointments_misc";
    }

    if (key.includes("shifts_")) {
      const monthMatch = key.match(/(\d{4}-\d{2})/);
      return monthMatch ? `shifts_${monthMatch[1]}` : "shifts_misc";
    }

    // Fallback
    return key.split("_")[0] || "misc";
  }
}
