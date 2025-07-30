/**
 * CacheTypes - Definiciones de Tipos de Datos para Cache
 *
 * Define los tipos de datos soportados por el sistema de cache,
 * sus características, dependencias y configuraciones específicas.
 *
 * Categorías de tipos:
 * - MASTER_DATA: Datos maestros que cambian poco
 * - RELATIONAL_DATA: Datos relacionados que requieren bulk loading
 * - TRANSACTIONAL_DATA: Datos transaccionales con TTL corto
 * - USER_DATA: Datos específicos por usuario
 *
 * @author Sistema Unificado de Cache
 * @version 1.0.0
 * @created 2025-07-29
 */

// TODO: Definir todos los tipos de datos del sistema
// TODO: Configurar dependencias entre tipos
// TODO: Implementar validadores por tipo
// TODO: Definir esquemas de serialización
// TODO: Configurar invalidación en cascada

/**
 * Categorías principales de tipos de datos
 */
export const DATA_CATEGORIES = {
  MASTER_DATA: "master_data",
  RELATIONAL_DATA: "relational_data",
  TRANSACTIONAL_DATA: "transactional_data",
  USER_DATA: "user_data",
};

/**
 * Definiciones de tipos de datos
 */
export const CACHE_DATA_TYPES = {
  // Datos Maestros
  EMPLOYEES: {
    key: "employees",
    category: DATA_CATEGORIES.MASTER_DATA,
    dependencies: [],
    invalidatesWith: ["shifts", "appointments"],
  },

  SERVICES: {
    key: "services",
    category: DATA_CATEGORIES.MASTER_DATA,
    dependencies: [],
    invalidatesWith: ["appointments", "sales"],
  },

  CLIENTS: {
    key: "clients",
    category: DATA_CATEGORIES.MASTER_DATA,
    dependencies: [],
    invalidatesWith: ["appointments", "sales"],
  },

  // Datos Relacionales
  APPOINTMENTS: {
    key: "appointments",
    category: DATA_CATEGORIES.RELATIONAL_DATA,
    dependencies: ["employees", "services", "clients"],
    bulkLoadingKey: "monthly",
  },

  SHIFTS: {
    key: "shifts",
    category: DATA_CATEGORIES.RELATIONAL_DATA,
    dependencies: ["employees"],
    bulkLoadingKey: "monthly",
  },

  // Datos Transaccionales
  DASHBOARD: {
    key: "dashboard",
    category: DATA_CATEGORIES.TRANSACTIONAL_DATA,
    dependencies: ["sales", "appointments", "inventory"],
    strategy: "intelligent",
    ttl: 60000, // 1 minuto
  },

  ALERTS: {
    key: "alerts",
    category: DATA_CATEGORIES.TRANSACTIONAL_DATA,
    dependencies: [],
    strategy: "intelligent",
    ttl: 120000, // 2 minutos
  },

  SALES: {
    key: "sales",
    category: DATA_CATEGORIES.TRANSACTIONAL_DATA,
    dependencies: ["clients", "services"],
    strategy: "bulkLoading",
    bulkLoadingKey: "daily",
    ttl: 300000, // 5 minutos
  },

  INVENTORY: {
    key: "inventory",
    category: DATA_CATEGORIES.MASTER_DATA,
    dependencies: [],
    strategy: "ttl",
    ttl: 900000, // 15 minutos
    invalidatesWith: ["sales", "orders"],
  },

  // Datos de Usuario
  USER_PREFERENCES: {
    key: "user_preferences",
    category: DATA_CATEGORIES.USER_DATA,
    dependencies: [],
    strategy: "intelligent",
    userSpecific: true,
    ttl: 1800000, // 30 minutos
  },

  USER_SESSIONS: {
    key: "user_sessions",
    category: DATA_CATEGORIES.USER_DATA,
    dependencies: ["employees"],
    strategy: "ttl",
    userSpecific: true,
    ttl: 3600000, // 1 hora
  },

  // Datos Adicionales
  REPORTS: {
    key: "reports",
    category: DATA_CATEGORIES.TRANSACTIONAL_DATA,
    dependencies: ["sales", "appointments", "employees"],
    strategy: "bulkLoading",
    bulkLoadingKey: "monthly",
    ttl: 600000, // 10 minutos
  },

  NOTIFICATIONS: {
    key: "notifications",
    category: DATA_CATEGORIES.TRANSACTIONAL_DATA,
    dependencies: [],
    strategy: "intelligent",
    ttl: 30000, // 30 segundos
  },
};

/**
 * Validadores por tipo de dato
 */
export const TYPE_VALIDATORS = {
  EMPLOYEES: (data) => {
    return (
      Array.isArray(data) &&
      data.every((emp) => emp.id && emp.name && emp.email)
    );
  },

  SERVICES: (data) => {
    return (
      Array.isArray(data) &&
      data.every(
        (service) => service.id && service.name && service.price !== undefined
      )
    );
  },

  CLIENTS: (data) => {
    return (
      Array.isArray(data) && data.every((client) => client.id && client.name)
    );
  },

  APPOINTMENTS: (data) => {
    return (
      Array.isArray(data) &&
      data.every(
        (appointment) =>
          appointment.id &&
          appointment.employeeId &&
          appointment.clientId &&
          appointment.date
      )
    );
  },

  DASHBOARD: (data) => {
    return (
      data &&
      typeof data === "object" &&
      data.hasOwnProperty("totalSales") &&
      data.hasOwnProperty("appointmentsToday")
    );
  },

  ALERTS: (data) => {
    return (
      Array.isArray(data) &&
      data.every((alert) => alert.id && alert.type && alert.message)
    );
  },
};

/**
 * Configuraciones de TTL por tipo de dato
 */
export const TTL_CONFIGS = {
  // Datos maestros - TTL largo
  [DATA_CATEGORIES.MASTER_DATA]: {
    default: 15 * 60 * 1000, // 15 minutos
    max: 60 * 60 * 1000, // 1 hora
    min: 5 * 60 * 1000, // 5 minutos
  },

  // Datos relacionales - TTL medio
  [DATA_CATEGORIES.RELATIONAL_DATA]: {
    default: 5 * 60 * 1000, // 5 minutos
    max: 15 * 60 * 1000, // 15 minutos
    min: 1 * 60 * 1000, // 1 minuto
  },

  // Datos transaccionales - TTL corto
  [DATA_CATEGORIES.TRANSACTIONAL_DATA]: {
    default: 2 * 60 * 1000, // 2 minutos
    max: 5 * 60 * 1000, // 5 minutos
    min: 30 * 1000, // 30 segundos
  },

  // Datos de usuario - TTL personalizable
  [DATA_CATEGORIES.USER_DATA]: {
    default: 30 * 60 * 1000, // 30 minutos
    max: 2 * 60 * 60 * 1000, // 2 horas
    min: 5 * 60 * 1000, // 5 minutos
  },
};

/**
 * Utilidades para trabajar con tipos de cache
 */
export const CacheTypeUtils = {
  /**
   * Obtiene la configuración TTL para un tipo de dato
   */
  getTTLForType(dataType) {
    const type = CACHE_DATA_TYPES[dataType];
    if (!type) return TTL_CONFIGS[DATA_CATEGORIES.TRANSACTIONAL_DATA].default;

    const categoryConfig = TTL_CONFIGS[type.category];
    return type.ttl || categoryConfig.default;
  },

  /**
   * Valida un tipo de dato
   */
  validateDataType(dataType, data) {
    const validator = TYPE_VALIDATORS[dataType];
    return validator ? validator(data) : true;
  },

  /**
   * Obtiene la estrategia recomendada para un tipo
   */
  getRecommendedStrategy(dataType) {
    const type = CACHE_DATA_TYPES[dataType];
    if (!type) return "ttl";

    return (
      type.strategy ||
      (type.category === DATA_CATEGORIES.MASTER_DATA
        ? "ttl"
        : type.category === DATA_CATEGORIES.RELATIONAL_DATA
          ? "bulkLoading"
          : "intelligent")
    );
  },

  /**
   * Obtiene las dependencias de un tipo de dato
   */
  getDependencies(dataType) {
    const type = CACHE_DATA_TYPES[dataType];
    return type ? type.dependencies || [] : [];
  },

  /**
   * Obtiene los tipos que se invalidan con este tipo
   */
  getInvalidationTargets(dataType) {
    const type = CACHE_DATA_TYPES[dataType];
    return type ? type.invalidatesWith || [] : [];
  },

  /**
   * Verifica si un tipo es específico de usuario
   */
  isUserSpecific(dataType) {
    const type = CACHE_DATA_TYPES[dataType];
    return type ? type.userSpecific === true : false;
  },
};

export default CACHE_DATA_TYPES;
