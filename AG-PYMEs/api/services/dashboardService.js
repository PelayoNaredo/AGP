import { httpFetch } from "../http";
import { dashboardEndpoint } from "../endpoints";
import { createServiceAdapter } from "../../cache/adapters/ServiceAdapter.js";

/**
 * Dashboard Service con Sistema de Cache Unificado
 *
 * Implementa cache inteligente para datos del dashboard usando el nuevo sistema
 * con control de concurrencia para evitar llamadas duplicadas
 */

// Control de concurrencia - evitar múltiples llamadas simultáneas
let pendingDashboardRequest = null;

class DashboardService {
  constructor() {
    this.cacheKey = "dashboard_data";
    this.cacheTTL = 5 * 60 * 1000; // 5 minutos - datos dinámicos del dashboard
    this.adapter = null;
  }

  /**
   * Inicializar adaptador de cache
   */
  initializeCache() {
    if (!this.adapter && window.cacheManager) {
      this.adapter = createServiceAdapter("dashboard", window.cacheManager);
    }
    return this.adapter;
  }

  /**
   * Obtener datos del dashboard con cache optimizado
   * @param {boolean} forceRefresh - Forzar actualización desde servidor
   * @returns {Promise} Datos del dashboard
   */
  async getData(forceRefresh = false) {
    // Inicializar cache si no está disponible
    const adapter = this.initializeCache();

    if (!adapter) {
      // Fallback: llamada directa si no hay cache disponible
      console.warn(
        "[DASHBOARD_SERVICE] Cache no disponible, ejecutando llamada directa"
      );
      return await this._fetchFromServer();
    }

    // Control de concurrencia - si hay una petición en curso, esperarla
    if (pendingDashboardRequest && !forceRefresh) {
      return await pendingDashboardRequest;
    }

    try {
      // Usar el nuevo sistema de cache
      pendingDashboardRequest = adapter.withCache(
        "getData",
        "dashboard",
        () => this._fetchFromServer(),
        forceRefresh ? { skipCache: true } : {}
      );

      const result = await pendingDashboardRequest;
      pendingDashboardRequest = null;
      return result;
    } catch (error) {
      pendingDashboardRequest = null;
      throw error;
    }
  }

  /**
   * Fetch real desde servidor
   * @returns {Promise} Datos del servidor
   */
  async _fetchFromServer() {
    try {
      const startTime = Date.now();

      // Llamada al servidor
      const data = await httpFetch(dashboardEndpoint.getDashboardData());

      const duration = Date.now() - startTime;
      return data;
    } catch (error) {
      console.error("[DASHBOARD_SERVICE]   Error al obtener datos:", error);
      throw error;
    }
  }

  /**
   * Invalidar cache del dashboard
   * Útil después de operaciones que modifiquen datos
   */
  async invalidateCache() {
    const adapter = this.initializeCache();

    if (adapter) {
      await adapter.invalidateService();
    } else {
      console.warn("[DASHBOARD_SERVICE] Cache no disponible para invalidación");
    }
  }

  /**
   * Obtener estadísticas de cache
   */
  async getCacheStats() {
    const adapter = this.initializeCache();

    if (adapter) {
      return adapter.getServiceMetrics();
    } else {
      console.warn("[DASHBOARD_SERVICE] Cache no disponible para estadísticas");
      return null;
    }
  }

  /**
   * Obtener datos solo desde cache (sin fallback a servidor)
   * Útil para verificar si hay datos en cache
   */
  async getCachedDataOnly() {
    const adapter = this.initializeCache();

    if (adapter && adapter.cacheManager) {
      try {
        return await adapter.cacheManager.get("dashboard:getData:dashboard");
      } catch (error) {
        console.warn(
          "[DASHBOARD_SERVICE] Error obteniendo datos cached:",
          error
        );
        return null;
      }
    }
    return null;
  }
}

// Instancia singleton
const dashboardService = new DashboardService();

// Exportar métodos individuales para compatibilidad
export const getDashboardData = (forceRefresh = false) =>
  dashboardService.getData(forceRefresh);

export const invalidateDashboardCache = () =>
  dashboardService.invalidateCache();

export const getDashboardCacheStats = () => dashboardService.getCacheStats();

export const getCachedDashboardData = () =>
  dashboardService.getCachedDataOnly();

// Exportar servicio completo
export default dashboardService;
