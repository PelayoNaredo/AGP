import { httpFetch } from "../http";
import { alertsEndpoint } from "../endpoints";
import { createServiceAdapter } from "../../cache/adapters/ServiceAdapter.js";
import { useUnifiedCache } from "../../cache/hooks/useUnifiedCache.js";

/**
 * Alerts Service con Sistema de Cache Unificado
 * Implementa caché inteligente y actualizaciones optimistas usando el nuevo sistema
 */

// Instancia del adaptador de cache para alerts
let alertsAdapter = null;

// Inicializar adaptador de cache
const initializeCache = () => {
  if (!alertsAdapter && window.cacheManager) {
    alertsAdapter = createServiceAdapter("alerts", window.cacheManager);
  }
  return alertsAdapter;
};

// Control de llamadas simultáneas para evitar duplicados
let pendingRequest = null;

// Función original para obtener alertas del servidor
const fetchAlertsFromServer = async () => {
  try {
    return await httpFetch(alertsEndpoint.base());
  } catch (error) {
    console.error("Error al obtener las alertas del servidor:", error);
    throw error;
  }
};

/**
 * Obtiene alertas con caché inteligente y control de concurrencia
 * @param {boolean} forceRefresh - Forzar actualización desde servidor
 * @returns {Promise<Array>} Lista de alertas
 */
export const getAlerts = async (forceRefresh = false) => {
  try {
    // Inicializar cache si no está disponible
    const adapter = initializeCache();

    if (!adapter) {
      // Fallback: llamada directa si no hay cache disponible
      console.warn("Cache no disponible, ejecutando llamada directa");
      return await fetchAlertsFromServer();
    }

    // Si hay una petición pendiente y no es force refresh, esperar a que termine
    if (pendingRequest && !forceRefresh) {
      return await pendingRequest;
    }

    // Crear la promesa de la petición usando el nuevo sistema
    const requestPromise = adapter.withCache(
      "getAlerts",
      "all",
      fetchAlertsFromServer,
      forceRefresh ? { skipCache: true } : {}
    );

    // Almacenar como petición pendiente
    pendingRequest = requestPromise;

    const alerts = await requestPromise;

    // Limpiar petición pendiente
    pendingRequest = null;

    return alerts;
  } catch (error) {
    // Limpiar petición pendiente en caso de error
    pendingRequest = null;
    console.error("[ALERTS_SERVICE]  Error al obtener alertas:", error);
    throw error;
  }
};

/**
 * Obtiene una alerta específica por ID
 * @param {string} id - ID de la alerta
 * @returns {Promise<Object>} Alerta específica
 */
export const getAlertById = async (id) => {
  try {
    return await httpFetch(alertsEndpoint.byId(id));
  } catch (error) {
    console.error("Error al obtener la alerta:", error);
    throw error;
  }
};

/**
 * Crea nueva alerta con actualización optimista del caché
 * @param {Object} alertData - Datos de la nueva alerta
 * @returns {Promise<Object>} Alerta creada
 */
export const createAlert = async (alertData) => {
  try {
    // Crear alerta en servidor
    const newAlert = await httpFetch(alertsEndpoint.base(), {
      method: "POST",
      body: alertData,
    });

    // Actualización optimista del caché
    await updateCacheAfterMutation();

    return newAlert;
  } catch (error) {
    console.error("Error al crear la alerta:", error);
    throw error;
  }
};

/**
 * Actualiza alerta con optimización de caché
 * @param {string} id - ID de la alerta
 * @param {Object} alertData - Datos actualizados
 * @returns {Promise<Object>} Alerta actualizada
 */
export const updateAlert = async (id, alertData) => {
  try {
    // Actualizar en servidor
    const updatedAlert = await httpFetch(alertsEndpoint.byId(id), {
      method: "PUT",
      body: alertData,
    });

    // Actualización optimista del caché
    await updateCacheAfterMutation();

    return updatedAlert;
  } catch (error) {
    console.error("Error al actualizar la alerta:", error);
    throw error;
  }
};

/**
 * Elimina alerta con limpieza de caché
 * @param {string} id - ID de la alerta a eliminar
 * @returns {Promise<Object>} Resultado de la eliminación
 */
export const deleteAlert = async (id) => {
  try {
    // Eliminar del servidor
    const result = await httpFetch(alertsEndpoint.byId(id), {
      method: "DELETE",
    });

    // Actualización optimista del caché
    await updateCacheAfterMutation();

    return result;
  } catch (error) {
    console.error("Error al eliminar la alerta:", error);
    throw error;
  }
};

/**
 * Actualiza el caché después de mutaciones (create/update/delete)
 * Estrategia: invalidar caché para forzar refresh en próxima consulta
 */
const updateCacheAfterMutation = async () => {
  try {
    const adapter = initializeCache();

    if (adapter) {
      // Opción 1: Invalidar caché (más seguro, refetch en próxima consulta)
      await adapter.invalidateService(["getAlerts"]);

      // Opción 2: Pre-cargar datos frescos inmediatamente (opcional)
      // await adapter.withCache('getAlerts', 'all', fetchAlertsFromServer, { skipCache: true });
    } else {
      console.warn("[ALERTS_SERVICE] Cache no disponible para invalidación");
    }
  } catch (error) {
    console.error("[ALERTS_SERVICE]    Error actualizando caché:", error);
    // No re-lanzar error, es operación secundaria
  }
};

/**
 * Invalida manualmente el caché de alertas
 * Útil para refresh manual o cuando se detectan datos desactualizados
 */
export const invalidateAlertsCache = async () => {
  try {
    const adapter = initializeCache();

    if (adapter) {
      await adapter.invalidateService();
    } else {
      console.warn("[ALERTS_SERVICE] Cache no disponible para invalidación");
    }
  } catch (error) {
    console.error("[ALERTS_SERVICE]  Error limpiando caché:", error);
  }
};

/**
 * Pre-carga alertas en background
 * Útil para mejorar UX precargando datos
 */
export const preloadAlerts = async () => {
  try {
    await getAlerts(false); // Usar caché si está disponible
  } catch (error) {
    console.error("[ALERTS_SERVICE]    Error pre-cargando alertas:", error);
    // Error silencioso, no afecta funcionalidad principal
  }
};
