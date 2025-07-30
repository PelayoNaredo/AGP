/**
 * Configuración principal del sistema de cache unificado
 * Consolidado desde CacheConfiguration.js y CacheConfig.js
 */
export const UNIFIED_CACHE_CONFIG = {
  // Configuración del sistema
  system: {
    maxMemoryUsage: 50 * 1024 * 1024, // 50MB
    cleanupInterval: 5 * 60 * 1000, // 5 minutos
    enableMetrics: true,
    logLevel: "info",
    defaultStrategy: "ttl",
    defaultTTL: 10 * 60 * 1000, // 10 minutos
  },

  // Configuración de estrategias
  strategies: {
    ttl: {
      defaultTTL: 10 * 60 * 1000, // 10 minutos
      maxEntries: 1000,
      cleanupInterval: 5 * 60 * 1000,
    },
    bulkLoading: {
      compression: true,
      maxBatchSize: 100,
      hierarchyDepth: 3,
    },
    intelligent: {
      adaptiveTTL: true,
      patternAnalysis: true,
      staleWhileRevalidate: true,
      maxPredictionHistory: 500,
    },
  },

  // Configuraciones específicas por tipo de dato (consolidadas)
  dataTypes: {
    // Datos maestros - TTL optimizado
    employees: { ttl: 15 * 60 * 1000, strategy: "ttl" }, // 15 min
    services: { ttl: 30 * 60 * 1000, strategy: "ttl" }, // 30 min
    clients: { ttl: 10 * 60 * 1000, strategy: "ttl" }, // 10 min
    settings: { ttl: 60 * 60 * 1000, strategy: "ttl" }, // 60 min

    // Datos relacionales - Bulk loading
    appointments: {
      ttl: 5 * 60 * 1000,
      strategy: "bulkLoading",
      bulkSize: "monthly",
      preload: true,
    },
    shifts: {
      ttl: 15 * 60 * 1000,
      strategy: "bulkLoading",
      bulkSize: "monthly",
      preload: true,
    },

    // Datos transaccionales - Estrategia inteligente
    dashboard: { ttl: 1 * 60 * 1000, strategy: "intelligent" }, // 1 min
    alerts: { ttl: 2 * 60 * 1000, strategy: "intelligent" }, // 2 min
    sales: { ttl: 5 * 60 * 1000, strategy: "intelligent" }, // 5 min
    inventory: { ttl: 10 * 60 * 1000, strategy: "intelligent" }, // 10 min
  },

  // Configuración de métricas (consolidada)
  metrics: {
    enabled: true,
    sampleRate: 1.0, // 100% de operaciones
    retentionPeriod: 24 * 60 * 60 * 1000, // 24 horas
    alertThresholds: {
      hitRatio: 0.7, // Alert si hit ratio < 70%
      memoryUsage: 0.8, // Alert si memoria > 80%
      responseTime: 1000, // Alert si > 1s
      errorRate: 0.05, // Alert si error rate > 5%
    },
  },

  // Configuración de desarrollo
  development: {
    enableDetailedLogging: true,
    enablePerformanceMonitoring: true,
    enableCacheInspector: true,
  },
};

export default UNIFIED_CACHE_CONFIG;
