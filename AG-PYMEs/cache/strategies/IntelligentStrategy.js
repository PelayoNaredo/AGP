/**
 * IntelligentStrategy - Estrategia de Cache Inteligente y Adaptativa
 *
 * Estrategia avanzada que aprende de los patrones de uso para optimizar automáticamente
 * el comportamiento del cache. Utiliza análisis de patrones, machine learning básico
 * y heurísticas para adaptarse dinámicamente a los patrones de acceso.
 *
 * Características principales:
 * - TTL adaptativo basado en patrones de acceso
 * - Preloading predictivo de datos relacionados
 * - Análisis de frecuencia y temporalidad
 * - Optimización automática de memoria
 * - Detección de patrones de invalidación
 *
 * @author Sistema Unificado de Cache
 * @version 1.0.0
 * @created 2025-07-29
 */

import CacheUtils from "../core/CacheUtils.js";

export class IntelligentStrategy {
  /**
   * @param {object} config - Configuración de la estrategia
   * @param {CacheMetrics} metrics - Sistema de métricas
   */
  constructor(config = {}, metrics = null) {
    this.config = {
      // Configuración básica
      defaultTTL: config.defaultTTL || 30 * 60 * 1000, // 30 minutos
      maxTTL: config.maxTTL || 2 * 60 * 60 * 1000, // 2 horas
      minTTL: config.minTTL || 5 * 60 * 1000, // 5 minutos

      // Configuración de análisis de patrones
      enablePatternAnalysis: config.enablePatternAnalysis !== false,
      patternAnalysisWindow: config.patternAnalysisWindow || 1000,
      patternUpdateInterval: config.patternUpdateInterval || 5 * 60 * 1000, // 5 minutos

      // Configuración de TTL adaptativo
      adaptiveTTLRange: config.adaptiveTTLRange || [
        5 * 60 * 1000,
        2 * 60 * 60 * 1000,
      ],
      ttlLearningRate: config.ttlLearningRate || 0.1,

      // Configuración de preloading
      enablePreloading: config.enablePreloading !== false,
      preloadingThreshold: config.preloadingThreshold || 0.8, // 80% de expiración
      preloadingMaxItems: config.preloadingMaxItems || 50,

      // Configuración de memoria
      maxMemoryUsage: config.maxMemoryUsage || 20 * 1024 * 1024, // 20MB
      memoryCleanupThreshold: config.memoryCleanupThreshold || 0.8,

      // Configuración de persistencia
      enablePersistence: config.enablePersistence !== false,
      persistencePrefix: config.persistencePrefix || "intelligent_cache_",

      ...config,
    };

    this.metrics = metrics;
    this.name = "Intelligent";

    // Estado interno del cache
    this.cache = new Map();
    this.memoryUsage = 0;

    // Sistema de análisis de patrones
    this.accessPatterns = new Map(); // Patrones de acceso por clave
    this.accessHistory = []; // Historial reciente de accesos
    this.relationshipGraph = new Map(); // Grafo de relaciones entre claves
    this.frequencyMap = new Map(); // Mapa de frecuencias de acceso

    // Sistema de TTL adaptativo
    this.ttlHistory = new Map(); // Historial de TTL por clave
    this.adaptiveTTLs = new Map(); // TTL calculados adaptativamente

    // Sistema de preloading
    this.preloadQueue = [];
    this.preloadInProgress = new Set();

    // Timers
    this.patternAnalysisTimer = null;
    this.preloadTimer = null;

    this._initializeStrategy();
  }

  /**
   * Inicializa la estrategia inteligente
   * @private
   */
  _initializeStrategy() {
    // Iniciar análisis de patrones
    if (this.config.enablePatternAnalysis) {
      this._startPatternAnalysis();
    }

    // Iniciar preloading
    if (this.config.enablePreloading) {
      this._startPreloadingSystem();
    }

    // Cargar datos persistentes si está habilitado
    if (this.config.enablePersistence) {
      this._loadPersistedPatterns();
    }
  }

  /**
   * Obtiene datos del cache con aprendizaje de patrones
   * @param {string} key - Clave del cache
   * @param {object} options - Opciones adicionales
   * @returns {Promise<any>} Datos del cache o null
   */
  async get(key, options = {}) {
    const startTime = Date.now();

    try {
      // Registrar acceso para análisis de patrones
      this._recordAccess(key, startTime);

      // Verificar cache
      const cached = this.cache.get(key);
      if (cached && this._isValidEntry(cached)) {
        // Actualizar último acceso
        cached.lastAccess = startTime;
        cached.accessCount++;

        // Verificar si necesita preloading de datos relacionados
        if (this.config.enablePreloading) {
          this._scheduleRelatedPreloading(key);
        }

        this._recordMetrics("hit", startTime, key, "intelligent");
        return cached.value;
      }

      // Si está expirado pero aún dentro del stale period, devolver y revalidar
      if (cached && this._isStaleButUsable(cached)) {
        cached.lastAccess = startTime;
        this._scheduleRevalidation(key, options);

        this._recordMetrics("stale_hit", startTime, key, "intelligent");
        return cached.value;
      }

      // Cache miss
      if (cached) {
        this._removeEntry(key);
      }

      this._recordMetrics("miss", startTime, key);
      return null;
    } catch (error) {
      this._recordMetrics("error", startTime, key, null, error);
      throw error;
    }
  }

  /**
   * Almacena datos en el cache con TTL adaptativo
   * @param {string} key - Clave del cache
   * @param {any} value - Valor a almacenar
   * @param {object} options - Opciones de almacenamiento
   * @returns {Promise<boolean>} Éxito de la operación
   */
  async set(key, value, options = {}) {
    const startTime = Date.now();

    try {
      // Calcular TTL adaptativo
      const adaptiveTTL = this._calculateAdaptiveTTL(key, options);

      // Crear entrada
      const entry = {
        value,
        timestamp: startTime,
        ttl: adaptiveTTL,
        lastAccess: startTime,
        accessCount: 1,
        size: this._estimateSize(value),
        staleTTL: adaptiveTTL * 1.5, // 50% más para stale
        pattern: this._getAccessPattern(key),
        priority: this._calculatePriority(key, value),
      };

      // Verificar memoria disponible
      if (this.memoryUsage + entry.size > this.config.maxMemoryUsage) {
        await this._makeSpace(entry.size);
      }

      // Almacenar en cache
      this.cache.set(key, entry);
      this.memoryUsage += entry.size;

      // Actualizar patrones
      this._updatePatterns(key, value, options);

      // Persistir si está habilitado
      if (this.config.enablePersistence) {
        this._persistEntry(key, entry);
      }

      this._recordMetrics("set", startTime, key);
      return true;
    } catch (error) {
      this._recordMetrics("error", startTime, key, null, error);
      throw error;
    }
  }

  /**
   * Invalida datos del cache con análisis de impacto
   * @param {string} key - Clave a invalidar
   * @param {object} options - Opciones de invalidación
   * @returns {Promise<boolean>} Éxito de la operación
   */
  async invalidate(key, options = {}) {
    const startTime = Date.now();
    let invalidatedCount = 0;

    try {
      // Invalidación directa
      if (this.cache.has(key)) {
        this._removeEntry(key);
        invalidatedCount++;
      }

      // Invalidación de claves relacionadas si está habilitado
      if (options.includeRelated !== false) {
        const relatedKeys = this._getRelatedKeys(key);
        for (const relatedKey of relatedKeys) {
          if (this.cache.has(relatedKey)) {
            this._removeEntry(relatedKey);
            invalidatedCount++;
          }
        }
      }

      // Registrar patrón de invalidación
      this._recordInvalidationPattern(key, invalidatedCount);

      // Cancelar preloading relacionado
      this._cancelRelatedPreloading(key);

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
   * Registra un acceso para análisis de patrones
   * @param {string} key - Clave accedida
   * @param {number} timestamp - Timestamp del acceso
   * @private
   */
  _recordAccess(key, timestamp) {
    // Actualizar historial de accesos
    this.accessHistory.push({ key, timestamp });

    // Mantener solo el window de análisis
    if (this.accessHistory.length > this.config.patternAnalysisWindow) {
      this.accessHistory.shift();
    }

    // Actualizar frecuencia
    const frequency = this.frequencyMap.get(key) || {
      count: 0,
      lastAccess: 0,
      avgInterval: 0,
    };
    frequency.count++;

    if (frequency.lastAccess > 0) {
      const interval = timestamp - frequency.lastAccess;
      frequency.avgInterval = frequency.avgInterval
        ? frequency.avgInterval * 0.8 + interval * 0.2
        : interval;
    }

    frequency.lastAccess = timestamp;
    this.frequencyMap.set(key, frequency);

    // Actualizar patrón de acceso
    this._updateAccessPattern(key, timestamp);
  }

  /**
   * Actualiza el patrón de acceso para una clave
   * @param {string} key - Clave
   * @param {number} timestamp - Timestamp
   * @private
   */
  _updateAccessPattern(key, timestamp) {
    const pattern = this.accessPatterns.get(key) || {
      accesses: [],
      periodicityScore: 0,
      trendScore: 0,
      volatilityScore: 0,
    };

    pattern.accesses.push(timestamp);

    // Mantener solo últimos 50 accesos
    if (pattern.accesses.length > 50) {
      pattern.accesses.shift();
    }

    // Calcular scores si tenemos suficientes datos
    if (pattern.accesses.length >= 5) {
      pattern.periodicityScore = this._calculatePeriodicity(pattern.accesses);
      pattern.trendScore = this._calculateTrend(pattern.accesses);
      pattern.volatilityScore = this._calculateVolatility(pattern.accesses);
    }

    this.accessPatterns.set(key, pattern);
  }

  /**
   * Calcula TTL adaptativo basado en patrones
   * @param {string} key - Clave
   * @param {object} options - Opciones
   * @returns {number} TTL calculado
   * @private
   */
  _calculateAdaptiveTTL(key, options) {
    // TTL base
    let ttl = options.ttl || this.config.defaultTTL;

    // Aplicar aprendizaje si está habilitado
    if (this.config.enablePatternAnalysis) {
      const pattern = this.accessPatterns.get(key);
      const frequency = this.frequencyMap.get(key);

      if (pattern && frequency) {
        // Factor de frecuencia (más frecuente = TTL más largo)
        const frequencyFactor = Math.min(2, 1 + frequency.count / 100);

        // Factor de periodicidad (más periódico = TTL optimizado)
        const periodicityFactor = 1 + pattern.periodicityScore * 0.5;

        // Factor de volatilidad (más volátil = TTL más corto)
        const volatilityFactor = Math.max(
          0.5,
          1 - pattern.volatilityScore * 0.3
        );

        // Aplicar factores
        ttl = ttl * frequencyFactor * periodicityFactor * volatilityFactor;
      }
    }

    // Aplicar límites
    const [minTTL, maxTTL] = this.config.adaptiveTTLRange;
    ttl = Math.max(minTTL, Math.min(maxTTL, ttl));

    // Guardar TTL calculado para análisis futuro
    this.adaptiveTTLs.set(key, ttl);

    return ttl;
  }

  /**
   * Calcula la periodicidad de los accesos
   * @param {number[]} accesses - Array de timestamps
   * @returns {number} Score de periodicidad (0-1)
   * @private
   */
  _calculatePeriodicity(accesses) {
    if (accesses.length < 3) return 0;

    const intervals = [];
    for (let i = 1; i < accesses.length; i++) {
      intervals.push(accesses[i] - accesses[i - 1]);
    }

    // Calcular varianza de intervalos
    const avgInterval =
      intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance =
      intervals.reduce(
        (sum, interval) => sum + Math.pow(interval - avgInterval, 2),
        0
      ) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // Score basado en consistencia de intervalos
    const consistencyScore = 1 - Math.min(1, stdDev / avgInterval);

    return Math.max(0, consistencyScore);
  }

  /**
   * Calcula la tendencia de los accesos
   * @param {number[]} accesses - Array de timestamps
   * @returns {number} Score de tendencia (-1 a 1)
   * @private
   */
  _calculateTrend(accesses) {
    if (accesses.length < 3) return 0;

    // Calcular intervalos
    const intervals = [];
    for (let i = 1; i < accesses.length; i++) {
      intervals.push(accesses[i] - accesses[i - 1]);
    }

    // Calcular tendencia usando regresión lineal simple
    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumXX = 0;
    const n = intervals.length;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += intervals[i];
      sumXY += i * intervals[i];
      sumXX += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    // Normalizar slope a rango -1 a 1
    return Math.max(-1, Math.min(1, slope / 10000));
  }

  /**
   * Calcula la volatilidad de los accesos
   * @param {number[]} accesses - Array de timestamps
   * @returns {number} Score de volatilidad (0-1)
   * @private
   */
  _calculateVolatility(accesses) {
    if (accesses.length < 3) return 0;

    const intervals = [];
    for (let i = 1; i < accesses.length; i++) {
      intervals.push(accesses[i] - accesses[i - 1]);
    }

    const avgInterval =
      intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance =
      intervals.reduce(
        (sum, interval) => sum + Math.pow(interval - avgInterval, 2),
        0
      ) / intervals.length;

    // Volatilidad normalizada
    const volatility = Math.sqrt(variance) / avgInterval;

    return Math.min(1, volatility);
  }

  /**
   * Obtiene claves relacionadas para invalidación
   * @param {string} key - Clave base
   * @returns {string[]} Claves relacionadas
   * @private
   */
  _getRelatedKeys(key) {
    const related = this.relationshipGraph.get(key) || new Set();
    return Array.from(related);
  }

  /**
   * Calcula prioridad de una entrada
   * @param {string} key - Clave
   * @param {any} value - Valor
   * @returns {number} Prioridad (mayor = más importante)
   * @private
   */
  _calculatePriority(key, value) {
    let priority = 1;

    // Factor de frecuencia
    const frequency = this.frequencyMap.get(key);
    if (frequency) {
      priority += Math.log(frequency.count + 1);
    }

    // Factor de tamaño (valores más pequeños tienen prioridad)
    const size = this._estimateSize(value);
    priority -= size / 10000;

    // Factor de tipo de datos
    if (
      key.includes("employees") ||
      key.includes("services") ||
      key.includes("clients")
    ) {
      priority += 2; // Datos maestros tienen alta prioridad
    }

    return Math.max(0, priority);
  }

  /**
   * Verifica si una entrada es válida
   * @param {object} entry - Entrada de cache
   * @returns {boolean} True si es válida
   * @private
   */
  _isValidEntry(entry) {
    if (!entry || !entry.timestamp) return false;

    const age = Date.now() - entry.timestamp;
    return age < entry.ttl;
  }

  /**
   * Verifica si una entrada está stale pero usable
   * @param {object} entry - Entrada de cache
   * @returns {boolean} True si está stale pero usable
   * @private
   */
  _isStaleButUsable(entry) {
    if (!entry || !entry.timestamp) return false;

    const age = Date.now() - entry.timestamp;
    return age >= entry.ttl && age < entry.staleTTL;
  }

  /**
   * Remueve una entrada del cache
   * @param {string} key - Clave a remover
   * @private
   */
  _removeEntry(key) {
    const entry = this.cache.get(key);
    if (entry) {
      this.cache.delete(key);
      this.memoryUsage -= entry.size;
    }
  }

  /**
   * Estima el tamaño de un valor
   * @param {any} value - Valor a estimar
   * @returns {number} Tamaño estimado en bytes
   * @private
   */
  _estimateSize(value) {
    return JSON.stringify(value).length * 2; // Aproximación UTF-16
  }

  /**
   * Hace espacio en memoria removiendo entradas de baja prioridad
   * @param {number} requiredSpace - Espacio requerido
   * @private
   */
  async _makeSpace(requiredSpace) {
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, entry }))
      .sort((a, b) => {
        // Ordenar por prioridad (menor primero) y último acceso
        const priorityDiff = a.entry.priority - b.entry.priority;
        if (priorityDiff !== 0) return priorityDiff;
        return a.entry.lastAccess - b.entry.lastAccess;
      });

    let freedSpace = 0;
    for (const { key, entry } of entries) {
      if (freedSpace >= requiredSpace) break;

      this._removeEntry(key);
      freedSpace += entry.size;
    }
  }

  /**
   * Inicia el sistema de análisis de patrones
   * @private
   */
  _startPatternAnalysis() {
    this.patternAnalysisTimer = setInterval(() => {
      this._analyzePatterns();
      this._updateRelationshipGraph();
      this._optimizeTTLs();
    }, this.config.patternUpdateInterval);
  }

  /**
   * Inicia el sistema de preloading
   * @private
   */
  _startPreloadingSystem() {
    this.preloadTimer = setInterval(() => {
      this._processPreloadQueue();
      this._scheduleExpirationPreloading();
    }, 30000); // Cada 30 segundos
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
    const totalAccesses = Array.from(this.frequencyMap.values()).reduce(
      (sum, freq) => sum + freq.count,
      0
    );

    return {
      name: this.name,
      totalItems: this.cache.size,
      memoryUsage: this.memoryUsage,
      memoryUsagePercent: (this.memoryUsage / this.config.maxMemoryUsage) * 100,
      totalAccesses,
      patternsTracked: this.accessPatterns.size,
      adaptiveTTLsActive: this.adaptiveTTLs.size,
      relationshipsTracked: this.relationshipGraph.size,
      preloadQueueSize: this.preloadQueue.length,
      config: { ...this.config },
    };
  }

  /**
   * Limpia completamente el cache de la estrategia
   * @returns {Promise<void>}
   */
  async clear() {
    // Limpiar timers
    if (this.patternAnalysisTimer) {
      clearInterval(this.patternAnalysisTimer);
      this.patternAnalysisTimer = null;
    }

    if (this.preloadTimer) {
      clearInterval(this.preloadTimer);
      this.preloadTimer = null;
    }

    // Limpiar datos
    this.cache.clear();
    this.accessPatterns.clear();
    this.accessHistory = [];
    this.relationshipGraph.clear();
    this.frequencyMap.clear();
    this.ttlHistory.clear();
    this.adaptiveTTLs.clear();
    this.preloadQueue = [];
    this.preloadInProgress.clear();

    // Resetear memoria
    this.memoryUsage = 0;
  }

  // Métodos auxiliares para funciones avanzadas (implementación básica)
  _getAccessPattern(key) {
    return "normal";
  }
  _updatePatterns(key, value, options) {
    /* Implementar análisis */
  }
  _persistEntry(key, entry) {
    /* Implementar persistencia */
  }
  _loadPersistedPatterns() {
    /* Cargar patrones persistidos */
  }
  _scheduleRelatedPreloading(key) {
    /* Programar preloading */
  }
  _scheduleRevalidation(key, options) {
    /* Programar revalidación */
  }
  _recordInvalidationPattern(key, count) {
    /* Registrar patrón invalidación */
  }
  _cancelRelatedPreloading(key) {
    /* Cancelar preloading */
  }
  _analyzePatterns() {
    /* Analizar patrones */
  }
  _updateRelationshipGraph() {
    /* Actualizar grafo relaciones */
  }
  _optimizeTTLs() {
    /* Optimizar TTLs */
  }
  _processPreloadQueue() {
    /* Procesar cola preloading */
  }
  _scheduleExpirationPreloading() {
    /* Preloading por expiración */
  }
}
