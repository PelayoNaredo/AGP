/**
 * CacheConstants - Constantes del Sistema de Cache
 *
 * Define todas las constantes utilizadas por el sistema de cache unificado,
 * incluyendo claves, prefijos, códigos de error y configuraciones fijas.
 *
 * @author Sistema Unificado de Cache
 * @version 1.0.0
 * @created 2025-07-29
 */

/**
 * Prefijos para claves de cache
 */
export const CACHE_KEY_PREFIXES = {
  UNIFIED: "unified_cache_",
  LEGACY_PLANNER: "planner_",
  LEGACY_BASIC: "cache_",
  METRICS: "metrics_",
  TEMP: "temp_",
  SERVICE: "service_",
  BULK: "bulk_",
  INTELLIGENT: "intelligent_",
  SESSION: "session_",
  PERSISTENT: "persistent_",
};

/**
 * Estrategias de cache disponibles
 */
export const CACHE_STRATEGIES = {
  TTL: "ttl",
  BULK_LOADING: "bulk",
  INTELLIGENT: "intelligent",
};

/**
 * Estados del cache
 */
export const CACHE_STATES = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
  STALE: "stale",
  INVALIDATED: "invalidated",
  EXPIRED: "expired",
  REFRESHING: "refreshing",
};

/**
 * Códigos de error del cache
 */
export const CACHE_ERROR_CODES = {
  STORAGE_ERROR: "STORAGE_ERROR",
  SERIALIZATION_ERROR: "SERIALIZATION_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  STRATEGY_ERROR: "STRATEGY_ERROR",
  TIMEOUT_ERROR: "TIMEOUT_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
  INITIALIZATION_ERROR: "INITIALIZATION_ERROR",
  CLEANUP_ERROR: "CLEANUP_ERROR",
  CORRUPTION_ERROR: "CORRUPTION_ERROR",
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",
};

/**
 * Eventos del sistema de cache
 */
export const CACHE_EVENTS = {
  HIT: "cache_hit",
  MISS: "cache_miss",
  SET: "cache_set",
  INVALIDATE: "cache_invalidate",
  ERROR: "cache_error",
  CLEANUP: "cache_cleanup",
  INIT: "cache_init",
  DESTROY: "cache_destroy",
  STRATEGY_CHANGE: "cache_strategy_change",
  MEMORY_WARNING: "cache_memory_warning",
  PERFORMANCE_ALERT: "cache_performance_alert",
};

/**
 * Configuraciones por defecto
 */
export const DEFAULT_CONFIG = {
  TTL: 10 * 60 * 1000, // 10 minutos
  MAX_RETRIES: 3,
  TIMEOUT: 5000, // 5 segundos
  BATCH_SIZE: 100,
  CLEANUP_THRESHOLD: 0.8, // 80% de capacidad
  MAX_MEMORY_USAGE: 50 * 1024 * 1024, // 50MB
  CLEANUP_INTERVAL: 5 * 60 * 1000, // 5 minutos
  METRICS_RETENTION: 24 * 60 * 60 * 1000, // 24 horas
};

/**
 * Prioridades de cache
 */
export const CACHE_PRIORITIES = {
  CRITICAL: "critical",
  HIGH: "high",
  NORMAL: "normal",
  LOW: "low",
  BACKGROUND: "background",
};

/**
 * Tipos de almacenamiento
 */
export const STORAGE_TYPES = {
  MEMORY: "memory",
  ASYNC_STORAGE: "async_storage",
  HYBRID: "hybrid",
  TEMPORARY: "temporary",
};

/**
 * Niveles de logging
 */
export const LOG_LEVELS = {
  ERROR: "error",
  WARN: "warn",
  INFO: "info",
  DEBUG: "debug",
  TRACE: "trace",
};

/**
 * Modos de invalidación
 */
export const INVALIDATION_MODES = {
  IMMEDIATE: "immediate",
  LAZY: "lazy",
  SCHEDULED: "scheduled",
  PATTERN: "pattern",
  CASCADE: "cascade",
};

/**
 * Tipos de métricas
 */
export const METRIC_TYPES = {
  HIT_RATIO: "hit_ratio",
  RESPONSE_TIME: "response_time",
  MEMORY_USAGE: "memory_usage",
  ERROR_RATE: "error_rate",
  CACHE_SIZE: "cache_size",
  THROUGHPUT: "throughput",
  LATENCY: "latency",
};

/**
 * Intervalos de tiempo comunes
 */
export const TIME_INTERVALS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
};

/**
 * Configuraciones por tipo de estrategia
 */
export const STRATEGY_CONFIGS = {
  [CACHE_STRATEGIES.TTL]: {
    DEFAULT_TTL: 10 * TIME_INTERVALS.MINUTE,
    MAX_ENTRIES: 1000,
    CLEANUP_INTERVAL: 5 * TIME_INTERVALS.MINUTE,
  },
  [CACHE_STRATEGIES.BULK_LOADING]: {
    BATCH_SIZE: 100,
    COMPRESSION: true,
    HIERARCHY_DEPTH: 3,
    PRELOAD_THRESHOLD: 0.1,
  },
  [CACHE_STRATEGIES.INTELLIGENT]: {
    ADAPTIVE_TTL: true,
    PATTERN_ANALYSIS: true,
    STALE_WHILE_REVALIDATE: true,
    MAX_PREDICTION_HISTORY: 500,
    LEARNING_RATE: 0.1,
  },
};

/**
 * Patrones de claves comunes
 */
export const KEY_PATTERNS = {
  WILDCARD: "*",
  SEPARATOR: ":",
  DATE_FORMAT: "YYYY-MM-DD",
  MONTH_FORMAT: "YYYY-MM",
  YEAR_FORMAT: "YYYY",
};

/**
 * Límites del sistema
 */
export const SYSTEM_LIMITS = {
  MAX_KEY_LENGTH: 250,
  MAX_VALUE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_CACHE_ENTRIES: 10000,
  MAX_CONCURRENT_OPERATIONS: 100,
  MAX_RETRY_ATTEMPTS: 5,
  MAX_CLEANUP_TIME: 30 * 1000, // 30 segundos
};

/**
 * Configuraciones de ambiente
 */
export const ENVIRONMENT_CONFIGS = {
  DEVELOPMENT: {
    LOG_LEVEL: LOG_LEVELS.DEBUG,
    ENABLE_DETAILED_LOGGING: true,
    ENABLE_PERFORMANCE_MONITORING: true,
    ENABLE_CACHE_INSPECTOR: true,
    STRICT_MODE: true,
  },
  PRODUCTION: {
    LOG_LEVEL: LOG_LEVELS.ERROR,
    ENABLE_DETAILED_LOGGING: false,
    ENABLE_PERFORMANCE_MONITORING: true,
    ENABLE_CACHE_INSPECTOR: false,
    STRICT_MODE: false,
  },
  TEST: {
    LOG_LEVEL: LOG_LEVELS.WARN,
    ENABLE_DETAILED_LOGGING: false,
    ENABLE_PERFORMANCE_MONITORING: false,
    ENABLE_CACHE_INSPECTOR: false,
    STRICT_MODE: true,
  },
};

/**
 * Códigos de respuesta HTTP relacionados con cache
 */
export const HTTP_CACHE_CODES = {
  NOT_MODIFIED: 304,
  PRECONDITION_FAILED: 412,
  REQUEST_TIMEOUT: 408,
  TOO_MANY_REQUESTS: 429,
  SERVICE_UNAVAILABLE: 503,
};

/**
 * Headers HTTP para control de cache
 */
export const CACHE_HEADERS = {
  CACHE_CONTROL: "Cache-Control",
  ETAG: "ETag",
  LAST_MODIFIED: "Last-Modified",
  EXPIRES: "Expires",
  IF_NONE_MATCH: "If-None-Match",
  IF_MODIFIED_SINCE: "If-Modified-Since",
};

/**
 * Políticas de cache HTTP
 */
export const CACHE_POLICIES = {
  NO_CACHE: "no-cache",
  NO_STORE: "no-store",
  MUST_REVALIDATE: "must-revalidate",
  PROXY_REVALIDATE: "proxy-revalidate",
  PUBLIC: "public",
  PRIVATE: "private",
  IMMUTABLE: "immutable",
};

export default {
  CACHE_KEY_PREFIXES,
  CACHE_STRATEGIES,
  CACHE_STATES,
  CACHE_ERROR_CODES,
  CACHE_EVENTS,
  DEFAULT_CONFIG,
  CACHE_PRIORITIES,
  STORAGE_TYPES,
  LOG_LEVELS,
  INVALIDATION_MODES,
  METRIC_TYPES,
  TIME_INTERVALS,
  STRATEGY_CONFIGS,
  KEY_PATTERNS,
  SYSTEM_LIMITS,
  ENVIRONMENT_CONFIGS,
  HTTP_CACHE_CODES,
  CACHE_HEADERS,
  CACHE_POLICIES,
};
