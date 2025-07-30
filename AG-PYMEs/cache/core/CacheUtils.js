/**
 * CacheUtils - Utilidades Compartidas del Sistema de Cache
 *
 * Conjunto de funciones utilitarias reutilizables para operaciones comunes
 * del sistema de cache, incluyendo manejo de fechas, claves, serialización
 * y validaciones.
 *
 * Funcionalidades:
 * - Generación de claves de cache consistentes
 * - Utilidades para manejo de fechas y rangos
 * - Funciones de serialización/deserialización
 * - Validadores de configuración
 * - Helpers para AsyncStorage
 *
 * @author Sistema Unificado de Cache
 * @version 1.0.0
 * @created 2025-07-29
 */

import {
  CACHE_KEY_PREFIXES,
  CACHE_STRATEGIES,
} from "../config/CacheConstants.js";

/**
 * Genera una clave de cache consistente
 * @param {string} key - Clave base
 * @param {object} options - Opciones adicionales
 * @returns {string} Clave de cache generada
 */
export const generateCacheKey = (key, options = {}) => {
  let cacheKey = `${CACHE_KEY_PREFIXES.UNIFIED}${key}`;

  // Añadir prefijo específico si se especifica
  if (options.prefix) {
    cacheKey = `${options.prefix}${key}`;
  }

  // Añadir sufijos basados en opciones
  const suffixes = [];

  if (options.dateRange) {
    if (options.dateRange.month) {
      suffixes.push(`month_${options.dateRange.month}`);
    }
    if (options.dateRange.week) {
      suffixes.push(`week_${options.dateRange.week}`);
    }
    if (options.dateRange.date) {
      suffixes.push(`date_${formatDateForKey(options.dateRange.date)}`);
    }
  }

  if (options.userId) {
    suffixes.push(`user_${options.userId}`);
  }

  if (options.strategy) {
    suffixes.push(`strategy_${options.strategy}`);
  }

  if (options.version) {
    suffixes.push(`v${options.version}`);
  }

  // Unir sufijos
  if (suffixes.length > 0) {
    cacheKey += `_${suffixes.join("_")}`;
  }

  return cacheKey;
};

/**
 * Valida la configuración de cache
 * @param {object} config - Configuración a validar
 * @returns {boolean} True si la configuración es válida
 */
export const validateCacheConfig = (config) => {
  if (!config || typeof config !== "object") {
    console.warn("[CacheUtils] Invalid config: must be an object");
    return false;
  }

  // Validar configuración del sistema
  if (!config.system || typeof config.system !== "object") {
    console.warn("[CacheUtils] Invalid config.system: must be an object");
    return false;
  }

  if (
    typeof config.system.maxMemoryUsage !== "number" ||
    config.system.maxMemoryUsage <= 0
  ) {
    console.warn(
      "[CacheUtils] Invalid system.maxMemoryUsage: must be a positive number"
    );
    return false;
  }

  if (
    typeof config.system.defaultTTL !== "number" ||
    config.system.defaultTTL <= 0
  ) {
    console.warn(
      "[CacheUtils] Invalid system.defaultTTL: must be a positive number"
    );
    return false;
  }

  // Validar estrategias
  if (!config.strategies || typeof config.strategies !== "object") {
    console.warn("[CacheUtils] Invalid config.strategies: must be an object");
    return false;
  }

  // Validar configuración de métricas
  if (config.metrics) {
    if (typeof config.metrics.enabled !== "boolean") {
      console.warn("[CacheUtils] Invalid metrics.enabled: must be boolean");
      return false;
    }

    if (config.metrics.alertThresholds) {
      const thresholds = config.metrics.alertThresholds;
      if (
        typeof thresholds.hitRatio !== "number" ||
        thresholds.hitRatio < 0 ||
        thresholds.hitRatio > 1
      ) {
        console.warn(
          "[CacheUtils] Invalid hitRatio threshold: must be between 0 and 1"
        );
        return false;
      }
    }
  }

  // Validar tipos de datos
  if (config.dataTypes) {
    for (const [dataType, dataConfig] of Object.entries(config.dataTypes)) {
      if (typeof dataConfig !== "object") {
        console.warn(
          `[CacheUtils] Invalid dataTypes.${dataType}: must be an object`
        );
        return false;
      }

      // Validar TTL
      if (typeof dataConfig.ttl !== "number" || dataConfig.ttl <= 0) {
        console.warn(
          `[CacheUtils] Invalid dataTypes.${dataType}.ttl: must be a positive number`
        );
        return false;
      }

      // Validar estrategia
      if (typeof dataConfig.strategy !== "string") {
        console.warn(
          `[CacheUtils] Invalid dataTypes.${dataType}.strategy: must be a string`
        );
        return false;
      }
    }
  }

  return true;
};

/**
 * Valida configuración de un tipo de dato específico
 * @param {object} dataConfig - Configuración del tipo de dato
 * @param {string} path - Ruta para mensajes de error
 * @returns {boolean} True si es válida
 */
const validateDataTypeConfig = (dataConfig, path) => {
  if (!dataConfig || typeof dataConfig !== "object") {
    console.warn(`[CacheUtils] Invalid ${path}: must be an object`);
    return false;
  }

  // Validar TTL
  if (typeof dataConfig.ttl !== "number" || dataConfig.ttl <= 0) {
    console.warn(`[CacheUtils] Invalid ${path}.ttl: must be a positive number`);
    return false;
  }

  // Validar estrategia
  if (
    dataConfig.strategy &&
    !Object.values(CACHE_STRATEGIES).includes(dataConfig.strategy)
  ) {
    console.warn(
      `[CacheUtils] Invalid ${path}.strategy: must be one of ${Object.values(CACHE_STRATEGIES).join(", ")}`
    );
    return false;
  }

  return true;
};

/**
 * Calcula el rango de fechas para un mes específico
 * @param {Date|string} date - Fecha de referencia
 * @returns {object} Objeto con startDate y endDate
 */
export const getMonthRange = (date) => {
  const d = new Date(date);

  // Validar fecha
  if (isNaN(d.getTime())) {
    throw new Error("Invalid date provided to getMonthRange");
  }

  const year = d.getFullYear();
  const month = d.getMonth();

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0); // Último día del mes

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    month: `${year}-${String(month + 1).padStart(2, "0")}`,
  };
};

/**
 * Calcula el rango de fechas para una semana específica
 * @param {Date|string} date - Fecha de referencia
 * @returns {object} Objeto con startDate y endDate de la semana
 */
export const getWeekRange = (date) => {
  const d = new Date(date);

  if (isNaN(d.getTime())) {
    throw new Error("Invalid date provided to getWeekRange");
  }

  const dayOfWeek = d.getDay(); // 0 = Domingo, 1 = Lunes, etc.
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Ajustar para que lunes sea inicio

  const startDate = new Date(d);
  startDate.setDate(d.getDate() + mondayOffset);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    week: formatDateForKey(startDate),
  };
};

/**
 * Genera clave de mes en formato consistente
 * @param {Date|string} date - Fecha de referencia
 * @returns {string} Clave de mes (YYYY-MM)
 */
export const getMonthKey = (date) => {
  const d = new Date(date);

  if (isNaN(d.getTime())) {
    throw new Error("Invalid date provided to getMonthKey");
  }

  const year = d.getFullYear();
  const month = d.getMonth() + 1;

  return `${year}-${String(month).padStart(2, "0")}`;
};

/**
 * Genera clave de semana en formato consistente
 * @param {Date|string} date - Fecha de referencia
 * @returns {string} Clave de semana (YYYY-MM-DD del lunes)
 */
export const getWeekKey = (date) => {
  const weekRange = getWeekRange(date);
  return formatDateForKey(weekRange.startDate);
};

/**
 * Formatea fecha para usar como clave de cache
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const formatDateForKey = (date) => {
  const d = new Date(date);

  if (isNaN(d.getTime())) {
    throw new Error("Invalid date provided to formatDateForKey");
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/**
 * Parsea fecha desde clave de cache
 * @param {string} dateKey - Clave de fecha (YYYY-MM-DD)
 * @returns {Date} Objeto Date
 */
export const parseDateFromKey = (dateKey) => {
  if (typeof dateKey !== "string" || !dateKey.match(/^\d{4}-\d{2}-\d{2}$/)) {
    throw new Error("Invalid date key format. Expected YYYY-MM-DD");
  }

  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Calcula el tamaño estimado de un objeto en bytes
 * @param {any} obj - Objeto a medir
 * @returns {number} Tamaño estimado en bytes
 */
export const calculateObjectSize = (obj) => {
  try {
    return new Blob([JSON.stringify(obj)]).size;
  } catch (error) {
    // Fallback para entornos que no soportan Blob
    return JSON.stringify(obj).length * 2; // Aproximación (UTF-16)
  }
};

/**
 * Serializa datos para almacenamiento
 * @param {any} data - Datos a serializar
 * @returns {string} Datos serializados
 */
export const serializeData = (data) => {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error("[CacheUtils] Serialization error:", error);
    throw new Error("Failed to serialize cache data");
  }
};

/**
 * Deserializa datos desde almacenamiento
 * @param {string} serializedData - Datos serializados
 * @returns {any} Datos deserializados
 */
export const deserializeData = (serializedData) => {
  try {
    return JSON.parse(serializedData);
  } catch (error) {
    console.error("[CacheUtils] Deserialization error:", error);
    throw new Error("Failed to deserialize cache data");
  }
};

/**
 * Verifica si una fecha está dentro de un rango
 * @param {Date|string} date - Fecha a verificar
 * @param {Date|string} startDate - Fecha de inicio del rango
 * @param {Date|string} endDate - Fecha de fin del rango
 * @returns {boolean} True si está dentro del rango
 */
export const isDateInRange = (date, startDate, endDate) => {
  const d = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(d.getTime()) || isNaN(start.getTime()) || isNaN(end.getTime())) {
    return false;
  }

  return d >= start && d <= end;
};

/**
 * Genera un hash simple para una cadena
 * @param {string} str - Cadena a hashear
 * @returns {string} Hash de la cadena
 */
export const simpleHash = (str) => {
  let hash = 0;
  if (str.length === 0) return hash.toString();

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convertir a 32-bit integer
  }

  return Math.abs(hash).toString(36);
};

/**
 * Limpia claves de cache que coinciden con un patrón
 * @param {string[]} allKeys - Todas las claves disponibles
 * @param {string|RegExp} pattern - Patrón a buscar
 * @returns {string[]} Claves que coinciden
 */
export const findMatchingKeys = (allKeys, pattern) => {
  if (!Array.isArray(allKeys)) {
    return [];
  }

  if (typeof pattern === "string") {
    return allKeys.filter((key) => key.includes(pattern));
  }

  if (pattern instanceof RegExp) {
    return allKeys.filter((key) => pattern.test(key));
  }

  return [];
};

/**
 * Convierte un tiempo TTL en una descripción legible
 * @param {number} ttl - TTL en milisegundos
 * @returns {string} Descripción legible
 */
export const formatTTL = (ttl) => {
  if (ttl < 1000) {
    return `${ttl}ms`;
  }

  if (ttl < 60000) {
    return `${Math.round(ttl / 1000)}s`;
  }

  if (ttl < 3600000) {
    return `${Math.round(ttl / 60000)}m`;
  }

  return `${Math.round(ttl / 3600000)}h`;
};

/**
 * Obtiene información del ambiente de ejecución
 * @returns {object} Información del ambiente
 */
export const getEnvironmentInfo = () => {
  return {
    isDevelopment: __DEV__ || false,
    platform: typeof window !== "undefined" ? "web" : "native",
    hasAsyncStorage: typeof require !== "undefined",
    timestamp: Date.now(),
  };
};

// Exportar todas las utilidades como default también
export default {
  generateCacheKey,
  validateCacheConfig,
  getMonthRange,
  getWeekRange,
  getMonthKey,
  getWeekKey,
  formatDateForKey,
  parseDateFromKey,
  calculateObjectSize,
  serializeData,
  deserializeData,
  isDateInRange,
  simpleHash,
  findMatchingKeys,
  formatTTL,
  getEnvironmentInfo,
};
