import { EdgeFunctions } from "../../config/supabase";
import { createServiceAdapter } from "../../cache/adapters/ServiceAdapter.js";

/**
 * Alerts Service con Edge Functions de Supabase
 * Sistema de cache unificado y actualización optimista migrado a Supabase
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

// Función para obtener alertas desde Edge Functions
const fetchAlertsFromEdgeFunction = async () => {
  try {
    const result = await EdgeFunctions.alerts.getAll();

    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error || "Error obteniendo alertas");
    }
  } catch (error) {
    console.error("Error al obtener las alertas desde Edge Functions:", error);
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
      console.warn(
        "Cache no disponible, ejecutando llamada directa a Edge Functions"
      );
      return await fetchAlertsFromEdgeFunction();
    }

    // Si hay una petición pendiente y no es force refresh, esperar a que termine
    if (pendingRequest && !forceRefresh) {
      return await pendingRequest;
    }

    // Crear la promesa de la petición usando el nuevo sistema
    const requestPromise = adapter.withCache(
      "getAlerts",
      "all",
      fetchAlertsFromEdgeFunction,
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
    console.error(
      "[ALERTS_SERVICE] Error al obtener alertas desde Edge Functions:",
      error
    );
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
    const result = await EdgeFunctions.alerts.getById(id);

    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error || "Error obteniendo alerta");
    }
  } catch (error) {
    console.error("Error al obtener la alerta desde Edge Functions:", error);
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
    // Crear alerta usando Edge Functions
    const result = await EdgeFunctions.alerts.create(alertData);

    if (!result.success) {
      throw new Error(result.error || "Error creando alerta");
    }

    const newAlert = result.data;

    // Actualización optimista del caché
    await updateCacheAfterMutation();

    return newAlert;
  } catch (error) {
    console.error("Error al crear la alerta con Edge Functions:", error);
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
    // Actualizar usando Edge Functions
    const result = await EdgeFunctions.alerts.update(id, alertData);

    if (!result.success) {
      throw new Error(result.error || "Error actualizando alerta");
    }

    const updatedAlert = result.data;

    // Actualización optimista del caché
    await updateCacheAfterMutation();

    return updatedAlert;
  } catch (error) {
    console.error("Error al actualizar la alerta con Edge Functions:", error);
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
    // Eliminar usando Edge Functions
    const result = await EdgeFunctions.alerts.delete(id);

    if (!result.success) {
      throw new Error(result.error || "Error eliminando alerta");
    }

    // Actualización optimista del caché
    await updateCacheAfterMutation();

    return result.data;
  } catch (error) {
    console.error("Error al eliminar la alerta con Edge Functions:", error);
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
      // Invalidar caché para forzar refresh en próxima consulta
      await adapter.invalidateService(["getAlerts"]);
    } else {
      console.warn("[ALERTS_SERVICE] Cache no disponible para invalidación");
    }
  } catch (error) {
    console.error("[ALERTS_SERVICE] Error actualizando caché:", error);
    // No re-lanzar error, es operación secundaria
  }
};
