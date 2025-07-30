import { CACHE_EVENTS } from "../config/CacheConstants.js";

/**
 * Sistema de métricas para el cache unificado
 */
export default class CacheMetrics {
  constructor(config = {}) {
    this.config = {
      enabled: true,
      sampleRate: 1.0,
      maxHistorySize: 1000,
      alertThresholds: {
        hitRatio: 0.7,
        responseTime: 1000,
        errorRate: 0.05,
      },
      ...config,
    };

    // Métricas principales
    this.metrics = {
      totalOperations: 0,
      totalHits: 0,
      totalMisses: 0,
      totalErrors: 0,
      responseTimes: [],
      operationHistory: [],
      errorHistory: [],
    };

    // Métricas por operación
    this.operationMetrics = new Map();

    // Métricas por estrategia
    this.strategyMetrics = new Map();

    // Alertas activas
    this.activeAlerts = new Set();

    // Timestamp de inicio
    this.startTime = Date.now();
  }

  /* Registra una operación de cache */
  recordOperation(operation, key, result = {}) {
    if (!this.config.enabled || !this._shouldSample()) {
      return;
    }

    const timestamp = Date.now();
    const entry = {
      operation,
      key,
      timestamp,
      ...result,
    };

    // Actualizar métricas generales
    this.metrics.totalOperations++;

    if (result.hit === true) {
      this.metrics.totalHits++;
    } else if (result.hit === false) {
      this.metrics.totalMisses++;
    }

    if (result.responseTime) {
      this.metrics.responseTimes.push(result.responseTime);
      this._trimArray(this.metrics.responseTimes);
    }

    // Actualizar historial
    this.metrics.operationHistory.push(entry);
    this._trimArray(this.metrics.operationHistory);

    // Métricas por operación
    this._updateOperationMetrics(operation, result);

    // Métricas por estrategia
    if (result.strategy) {
      this._updateStrategyMetrics(result.strategy, result);
    }

    // Verificar alertas
    this._checkAlerts();

    // Emitir evento
    this._emitEvent(CACHE_EVENTS.HIT, entry);
  }

  /**
   * Registra un error de cache
   * @param {string} operation - Tipo de operación
   * @param {string} key - Clave del cache
   * @param {Error} error - Error ocurrido
   */
  recordError(operation, key, error) {
    if (!this.config.enabled) {
      return;
    }

    const timestamp = Date.now();
    const errorEntry = {
      operation,
      key,
      error: error.message || error,
      timestamp,
    };

    this.metrics.totalErrors++;
    this.metrics.errorHistory.push(errorEntry);
    this._trimArray(this.metrics.errorHistory);

    // Actualizar métricas de operación
    this._updateOperationMetrics(operation, { error: true });

    // Verificar alertas de error
    this._checkErrorAlerts();

    // Emitir evento de error
    this._emitEvent(CACHE_EVENTS.ERROR, errorEntry);
  }

  /**
   * Obtiene reporte completo de métricas
   * @returns {object} Reporte detallado
   */
  getReport() {
    const now = Date.now();
    const uptime = now - this.startTime;

    return {
      overview: {
        uptime,
        totalOperations: this.metrics.totalOperations,
        hitRatio: this._calculateHitRatio(),
        missRatio: this._calculateMissRatio(),
        errorRate: this._calculateErrorRate(),
        averageResponseTime: this._calculateAverageResponseTime(),
        operationsPerSecond: this._calculateOpsPerSecond(),
      },

      byOperation: this._getOperationReport(),
      byStrategy: this._getStrategyReport(),

      recentActivity: {
        last10Operations: this.metrics.operationHistory.slice(-10),
        recentErrors: this.metrics.errorHistory.slice(-5),
        responseTimes: this.metrics.responseTimes.slice(-50),
      },

      alerts: {
        active: Array.from(this.activeAlerts),
        thresholds: this.config.alertThresholds,
      },

      timestamp: now,
    };
  }

  /**
   * Obtiene estado de salud del cache
   * @returns {boolean} True si el cache está saludable
   */
  getHealthStatus() {
    // Si hay muy pocas operaciones, considerar como saludable (inicialización)
    if (this.metrics.totalOperations < 10) {
      return true;
    }

    const hitRatio = this._calculateHitRatio();
    const errorRate = this._calculateErrorRate();
    const avgResponseTime = this._calculateAverageResponseTime();

    const isHealthy =
      hitRatio >= this.config.alertThresholds.hitRatio &&
      errorRate <= this.config.alertThresholds.errorRate &&
      avgResponseTime <= this.config.alertThresholds.responseTime;

    return isHealthy;
  }

  /**
   * Reinicia todas las métricas
   */
  reset() {
    this.metrics = {
      totalOperations: 0,
      totalHits: 0,
      totalMisses: 0,
      totalErrors: 0,
      responseTimes: [],
      operationHistory: [],
      errorHistory: [],
    };

    this.operationMetrics.clear();
    this.strategyMetrics.clear();
    this.activeAlerts.clear();
    this.startTime = Date.now();
  }

  /**
   * Obtiene métricas específicas por clave
   */
  getMetricsByKey(keyPattern) {
    const matchingOperations = this.metrics.operationHistory.filter((op) =>
      op.key.includes(keyPattern)
    );

    const hits = matchingOperations.filter((op) => op.hit === true).length;
    const misses = matchingOperations.filter((op) => op.hit === false).length;
    const errors = matchingOperations.filter((op) => op.error).length;

    return {
      operations: matchingOperations.length,
      hits,
      misses,
      errors,
      hitRatio: hits / (hits + misses) || 0,
      errorRate: errors / matchingOperations.length || 0,
    };
  }

  /**
   * Métodos privados
   */

  _shouldSample() {
    return Math.random() < this.config.sampleRate;
  }

  _trimArray(array) {
    if (array.length > this.config.maxHistorySize) {
      array.splice(0, array.length - this.config.maxHistorySize);
    }
  }

  _updateOperationMetrics(operation, result) {
    if (!this.operationMetrics.has(operation)) {
      this.operationMetrics.set(operation, {
        total: 0,
        hits: 0,
        misses: 0,
        errors: 0,
        responseTimes: [],
      });
    }

    const opMetrics = this.operationMetrics.get(operation);
    opMetrics.total++;

    if (result.hit === true) opMetrics.hits++;
    if (result.hit === false) opMetrics.misses++;
    if (result.error) opMetrics.errors++;
    if (result.responseTime) {
      opMetrics.responseTimes.push(result.responseTime);
      this._trimArray(opMetrics.responseTimes);
    }
  }

  _updateStrategyMetrics(strategy, result) {
    if (!this.strategyMetrics.has(strategy)) {
      this.strategyMetrics.set(strategy, {
        total: 0,
        hits: 0,
        misses: 0,
        errors: 0,
        responseTimes: [],
      });
    }

    const strategyMetrics = this.strategyMetrics.get(strategy);
    strategyMetrics.total++;

    if (result.hit === true) strategyMetrics.hits++;
    if (result.hit === false) strategyMetrics.misses++;
    if (result.error) strategyMetrics.errors++;
    if (result.responseTime) {
      strategyMetrics.responseTimes.push(result.responseTime);
      this._trimArray(strategyMetrics.responseTimes);
    }
  }

  _calculateHitRatio() {
    const total = this.metrics.totalHits + this.metrics.totalMisses;
    return total > 0 ? this.metrics.totalHits / total : 0;
  }

  _calculateMissRatio() {
    const total = this.metrics.totalHits + this.metrics.totalMisses;
    return total > 0 ? this.metrics.totalMisses / total : 0;
  }

  _calculateErrorRate() {
    return this.metrics.totalOperations > 0
      ? this.metrics.totalErrors / this.metrics.totalOperations
      : 0;
  }

  _calculateAverageResponseTime() {
    const times = this.metrics.responseTimes;
    return times.length > 0
      ? times.reduce((sum, time) => sum + time, 0) / times.length
      : 0;
  }

  _calculateOpsPerSecond() {
    const uptime = (Date.now() - this.startTime) / 1000;
    return uptime > 0 ? this.metrics.totalOperations / uptime : 0;
  }

  _getOperationReport() {
    const report = [];

    for (const [operation, metrics] of this.operationMetrics.entries()) {
      const total = metrics.hits + metrics.misses;
      const avgResponseTime =
        metrics.responseTimes.length > 0
          ? metrics.responseTimes.reduce((sum, time) => sum + time, 0) /
            metrics.responseTimes.length
          : 0;

      report.push({
        operation,
        total: metrics.total,
        hits: metrics.hits,
        misses: metrics.misses,
        errors: metrics.errors,
        hitRatio: total > 0 ? metrics.hits / total : 0,
        errorRate: metrics.total > 0 ? metrics.errors / metrics.total : 0,
        averageResponseTime: avgResponseTime,
      });
    }

    return report;
  }

  _getStrategyReport() {
    const report = [];

    for (const [strategy, metrics] of this.strategyMetrics.entries()) {
      const total = metrics.hits + metrics.misses;
      const avgResponseTime =
        metrics.responseTimes.length > 0
          ? metrics.responseTimes.reduce((sum, time) => sum + time, 0) /
            metrics.responseTimes.length
          : 0;

      report.push({
        strategy,
        total: metrics.total,
        hits: metrics.hits,
        misses: metrics.misses,
        errors: metrics.errors,
        hitRatio: total > 0 ? metrics.hits / total : 0,
        errorRate: metrics.total > 0 ? metrics.errors / metrics.total : 0,
        averageResponseTime: avgResponseTime,
      });
    }

    return report;
  }

  _checkAlerts() {
    const hitRatio = this._calculateHitRatio();
    const avgResponseTime = this._calculateAverageResponseTime();

    // Alert de hit ratio bajo
    if (hitRatio < this.config.alertThresholds.hitRatio) {
      this.activeAlerts.add("LOW_HIT_RATIO");
    } else {
      this.activeAlerts.delete("LOW_HIT_RATIO");
    }

    // Alert de tiempo de respuesta alto
    if (avgResponseTime > this.config.alertThresholds.responseTime) {
      this.activeAlerts.add("HIGH_RESPONSE_TIME");
    } else {
      this.activeAlerts.delete("HIGH_RESPONSE_TIME");
    }
  }

  _checkErrorAlerts() {
    const errorRate = this._calculateErrorRate();

    if (errorRate > this.config.alertThresholds.errorRate) {
      this.activeAlerts.add("HIGH_ERROR_RATE");
    } else {
      this.activeAlerts.delete("HIGH_ERROR_RATE");
    }
  }

  _emitEvent(eventType, data) {
    // En React Native podríamos usar DeviceEventEmitter o un event bus personalizado
  }
}
