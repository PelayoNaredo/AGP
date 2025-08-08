// ✅ api/edgeFunctionsService.js - VERSIÓN CORREGIDA
// 🔧 Sin dependencias circulares, responses normalizados

import { callEdgeFunction, EdgeFunctions } from "../config/supabase.js";

// 🔐 AUTENTICACIÓN
export const authService = {
  login: async (credentials) => {
    console.log("🔐 [AUTH] Iniciando login...");
    try {
      const result = await callEdgeFunction(
        "login/auth/login",
        credentials,
        "POST",
        2,
        false // Login no requiere token previo
      );
      console.log("✅ [AUTH] Login exitoso");
      return result;
    } catch (error) {
      console.error("❌ [AUTH] Error en login:", error);
      throw error;
    }
  },

  register: async (userData) => {
    console.log("📝 [AUTH] Iniciando registro...");
    try {
      const result = await callEdgeFunction(
        "register",
        userData,
        "POST",
        2,
        false // Registro no requiere token
      );
      console.log("✅ [AUTH] Registro exitoso");
      return result;
    } catch (error) {
      console.error("❌ [AUTH] Error en registro:", error);
      throw error;
    }
  },

  sync: async (email) => {
    console.log("🔄 [AUTH] Sincronizando usuario...");
    try {
      const result = await callEdgeFunction(
        "login/auth/sync",
        { email, action: "login" },
        "POST",
        2,
        true // Sync requiere autenticación
      );
      console.log("✅ [AUTH] Sincronización exitosa");
      return result;
    } catch (error) {
      console.error("❌ [AUTH] Error en sincronización:", error);
      throw error;
    }
  },

  verify: async () => {
    console.log("🔍 [AUTH] Verificando token...");
    try {
      const result = await callEdgeFunction(
        "login/auth/verify",
        {},
        "GET",
        2,
        true
      );
      console.log("✅ [AUTH] Token verificado");
      return result;
    } catch (error) {
      console.error("❌ [AUTH] Error verificando token:", error);
      throw error;
    }
  },

  getCurrentUser: async () => {
    console.log("👤 [AUTH] Obteniendo usuario actual...");
    try {
      const result = await callEdgeFunction(
        "users/current",
        {},
        "GET",
        2,
        true
      );
      console.log("✅ [AUTH] Usuario actual obtenido");
      return result;
    } catch (error) {
      console.error("❌ [AUTH] Error obteniendo usuario actual:", error);
      throw error;
    }
  },

  logout: async () => {
    console.log("👋 [AUTH] Cerrando sesión...");
    try {
      const result = await callEdgeFunction("auth/logout", {}, "POST", 1, true);
      console.log("✅ [AUTH] Logout exitoso");
      return result;
    } catch (error) {
      console.error("❌ [AUTH] Error en logout:", error);
      throw error;
    }
  },
};

// 🏢 EMPRESAS
export const companyService = {
  getCurrent: async () => {
    console.log("🏢 [COMPANY] Obteniendo empresa actual...");
    try {
      const result = await callEdgeFunction(
        "companies/current",
        {},
        "GET",
        2,
        true
      );
      console.log("✅ [COMPANY] Empresa actual obtenida");
      return result;
    } catch (error) {
      console.error("❌ [COMPANY] Error obteniendo empresa:", error);
      throw error;
    }
  },

  create: async (companyData) => {
    console.log("🏢 [COMPANY] Creando empresa...");
    try {
      const result = await callEdgeFunction(
        "companies",
        companyData,
        "POST",
        2,
        true
      );
      console.log("✅ [COMPANY] Empresa creada");
      return result;
    } catch (error) {
      console.error("❌ [COMPANY] Error creando empresa:", error);
      throw error;
    }
  },

  update: async (id, companyData) => {
    console.log(`🏢 [COMPANY] Actualizando empresa ${id}...`);
    try {
      const result = await callEdgeFunction(
        `companies/${id}`,
        companyData,
        "PUT",
        2,
        true
      );
      console.log("✅ [COMPANY] Empresa actualizada");
      return result;
    } catch (error) {
      console.error("❌ [COMPANY] Error actualizando empresa:", error);
      throw error;
    }
  },

  getUsage: async () => {
    console.log("📊 [COMPANY] Obteniendo uso de recursos...");
    try {
      const result = await callEdgeFunction(
        "companies/usage",
        {},
        "GET",
        2,
        true
      );
      console.log("✅ [COMPANY] Uso de recursos obtenido");
      return result;
    } catch (error) {
      console.error("❌ [COMPANY] Error obteniendo uso:", error);
      throw error;
    }
  },

  getLimits: async () => {
    console.log("🚧 [COMPANY] Obteniendo límites...");
    try {
      const result = await callEdgeFunction(
        "companies/limits",
        {},
        "GET",
        2,
        true
      );
      console.log("✅ [COMPANY] Límites obtenidos");
      return result;
    } catch (error) {
      console.error("❌ [COMPANY] Error obteniendo límites:", error);
      throw error;
    }
  },
};

// 📊 DASHBOARD - SERVICIO EXPANDIDO
export const dashboardService = {
  getOverview: async () => {
    console.log("📊 [DASHBOARD] Obteniendo overview...");
    try {
      const result = await callEdgeFunction("dashboard", {}, "GET", 2, true);
      console.log("✅ [DASHBOARD] Overview obtenido");
      return result;
    } catch (error) {
      console.error("❌ [DASHBOARD] Error obteniendo overview:", error);
      throw error;
    }
  },

  getStatistics: async () => {
    console.log("📈 [DASHBOARD] Obteniendo estadísticas...");
    try {
      const result = await callEdgeFunction("dashboard", {}, "GET", 2, true);
      console.log("✅ [DASHBOARD] Estadísticas obtenidas");
      return result;
    } catch (error) {
      console.error("❌ [DASHBOARD] Error obteniendo estadísticas:", error);
      throw error;
    }
  },

  getData: async () => {
    console.log("📊 [DASHBOARD] Obteniendo datos generales...");
    try {
      const result = await callEdgeFunction("dashboard", {}, "GET", 2, true);
      console.log("✅ [DASHBOARD] Datos generales obtenidos");
      return result;
    } catch (error) {
      console.error("❌ [DASHBOARD] Error obteniendo datos:", error);
      throw error;
    }
  },

  getFinancial: async () => {
    console.log("💰 [DASHBOARD] Obteniendo datos financieros...");
    try {
      const result = await callEdgeFunction("dashboard", {}, "GET", 2, true);
      console.log("✅ [DASHBOARD] Datos financieros obtenidos");
      return result;
    } catch (error) {
      console.error(
        "❌ [DASHBOARD] Error obteniendo datos financieros:",
        error
      );
      throw error;
    }
  },

  getTrend: async (period = "month") => {
    console.log(`📈 [DASHBOARD] Obteniendo tendencias para ${period}...`);
    try {
      const result = await callEdgeFunction(
        "dashboard",
        { period },
        "POST",
        2,
        true
      );
      console.log("✅ [DASHBOARD] Tendencias obtenidas");
      return result;
    } catch (error) {
      console.error("❌ [DASHBOARD] Error obteniendo tendencias:", error);
      throw error;
    }
  },

  getInventory: async () => {
    console.log("📦 [DASHBOARD] Obteniendo resumen de inventario...");
    try {
      const result = await callEdgeFunction("dashboard", {}, "GET", 2, true);
      console.log("✅ [DASHBOARD] Resumen de inventario obtenido");
      return result;
    } catch (error) {
      console.error(
        "❌ [DASHBOARD] Error obteniendo resumen de inventario:",
        error
      );
      throw error;
    }
  },
};

// 👥 EMPLEADOS - SERVICIO EXPANDIDO
export const employeesService = {
  getAll: async () => {
    console.log("👥 [EMPLOYEES] Obteniendo empleados...");
    try {
      const result = await callEdgeFunction("employees", {}, "GET", 2, true);
      console.log("✅ [EMPLOYEES] Empleados obtenidos");
      return result;
    } catch (error) {
      console.error("❌ [EMPLOYEES] Error obteniendo empleados:", error);
      throw error;
    }
  },

  create: async (employeeData) => {
    console.log("👥 [EMPLOYEES] Creando empleado...");
    try {
      const result = await callEdgeFunction(
        "employees",
        employeeData,
        "POST",
        2,
        true
      );
      console.log("✅ [EMPLOYEES] Empleado creado");
      return result;
    } catch (error) {
      console.error("❌ [EMPLOYEES] Error creando empleado:", error);
      throw error;
    }
  },

  getById: async (id) => {
    console.log(`👥 [EMPLOYEES] Obteniendo empleado ${id}...`);
    try {
      const result = await callEdgeFunction(
        `employees/${id}`,
        {},
        "GET",
        2,
        true
      );
      console.log("✅ [EMPLOYEES] Empleado obtenido");
      return result;
    } catch (error) {
      console.error("❌ [EMPLOYEES] Error obteniendo empleado:", error);
      throw error;
    }
  },

  update: async (id, employeeData) => {
    console.log(`👥 [EMPLOYEES] Actualizando empleado ${id}...`);
    try {
      const result = await callEdgeFunction(
        `employees/${id}`,
        employeeData,
        "PUT",
        2,
        true
      );
      console.log("✅ [EMPLOYEES] Empleado actualizado");
      return result;
    } catch (error) {
      console.error("❌ [EMPLOYEES] Error actualizando empleado:", error);
      throw error;
    }
  },

  delete: async (id) => {
    console.log(`👥 [EMPLOYEES] Eliminando empleado ${id}...`);
    try {
      const result = await callEdgeFunction(
        `employees/${id}`,
        {},
        "DELETE",
        2,
        true
      );
      console.log("✅ [EMPLOYEES] Empleado eliminado");
      return result;
    } catch (error) {
      console.error("❌ [EMPLOYEES] Error eliminando empleado:", error);
      throw error;
    }
  },
};

// 📦 INVENTARIO - SERVICIO EXPANDIDO
export const inventoryService = {
  getAll: async () => {
    console.log("📦 [INVENTORY] Obteniendo inventario...");
    try {
      const result = await callEdgeFunction("inventory", {}, "GET", 2, true);
      console.log("✅ [INVENTORY] Inventario obtenido");
      return result;
    } catch (error) {
      console.error("❌ [INVENTORY] Error obteniendo inventario:", error);
      throw error;
    }
  },

  create: async (itemData) => {
    console.log("📦 [INVENTORY] Creando item...");
    try {
      const result = await callEdgeFunction(
        "inventory",
        itemData,
        "POST",
        2,
        true
      );
      console.log("✅ [INVENTORY] Item creado");
      return result;
    } catch (error) {
      console.error("❌ [INVENTORY] Error creando item:", error);
      throw error;
    }
  },

  getById: async (id) => {
    console.log(`📦 [INVENTORY] Obteniendo item ${id}...`);
    try {
      const result = await callEdgeFunction(
        `inventory/${id}`,
        {},
        "GET",
        2,
        true
      );
      console.log("✅ [INVENTORY] Item obtenido");
      return result;
    } catch (error) {
      console.error("❌ [INVENTORY] Error obteniendo item:", error);
      throw error;
    }
  },

  update: async (id, itemData) => {
    console.log(`📦 [INVENTORY] Actualizando item ${id}...`);
    try {
      const result = await callEdgeFunction(
        `inventory/${id}`,
        itemData,
        "PUT",
        2,
        true
      );
      console.log("✅ [INVENTORY] Item actualizado");
      return result;
    } catch (error) {
      console.error("❌ [INVENTORY] Error actualizando item:", error);
      throw error;
    }
  },

  delete: async (id) => {
    console.log(`📦 [INVENTORY] Eliminando item ${id}...`);
    try {
      const result = await callEdgeFunction(
        `inventory/${id}`,
        {},
        "DELETE",
        2,
        true
      );
      console.log("✅ [INVENTORY] Item eliminado");
      return result;
    } catch (error) {
      console.error("❌ [INVENTORY] Error eliminando item:", error);
      throw error;
    }
  },
};

// 💰 VENTAS - SERVICIO EXPANDIDO
export const salesService = {
  getAll: async () => {
    console.log("💰 [SALES] Obteniendo ventas...");
    try {
      const result = await callEdgeFunction("sales", {}, "GET", 2, true);
      console.log("✅ [SALES] Ventas obtenidas");
      return result;
    } catch (error) {
      console.error("❌ [SALES] Error obteniendo ventas:", error);
      throw error;
    }
  },

  create: async (saleData) => {
    console.log("💰 [SALES] Creando venta...");
    try {
      const result = await callEdgeFunction("sales", saleData, "POST", 2, true);
      console.log("✅ [SALES] Venta creada");
      return result;
    } catch (error) {
      console.error("❌ [SALES] Error creando venta:", error);
      throw error;
    }
  },

  getById: async (id) => {
    console.log(`💰 [SALES] Obteniendo venta ${id}...`);
    try {
      const result = await callEdgeFunction(`sales/${id}`, {}, "GET", 2, true);
      console.log("✅ [SALES] Venta obtenida");
      return result;
    } catch (error) {
      console.error("❌ [SALES] Error obteniendo venta:", error);
      throw error;
    }
  },

  update: async (id, saleData) => {
    console.log(`💰 [SALES] Actualizando venta ${id}...`);
    try {
      const result = await callEdgeFunction(
        `sales/${id}`,
        saleData,
        "PUT",
        2,
        true
      );
      console.log("✅ [SALES] Venta actualizada");
      return result;
    } catch (error) {
      console.error("❌ [SALES] Error actualizando venta:", error);
      throw error;
    }
  },

  delete: async (id) => {
    console.log(`💰 [SALES] Eliminando venta ${id}...`);
    try {
      const result = await callEdgeFunction(
        `sales/${id}`,
        {},
        "DELETE",
        2,
        true
      );
      console.log("✅ [SALES] Venta eliminada");
      return result;
    } catch (error) {
      console.error("❌ [SALES] Error eliminando venta:", error);
      throw error;
    }
  },

  updateStatus: async (id, status) => {
    console.log(`💰 [SALES] Actualizando status de venta ${id} a ${status}...`);
    try {
      const result = await callEdgeFunction(
        `sales/${id}/status`,
        { status },
        "PUT",
        2,
        true
      );
      console.log("✅ [SALES] Status actualizado");
      return result;
    } catch (error) {
      console.error("❌ [SALES] Error actualizando status:", error);
      throw error;
    }
  },

  getByClient: async (clientId) => {
    console.log(`💰 [SALES] Obteniendo ventas del cliente ${clientId}...`);
    try {
      const result = await callEdgeFunction(
        `sales/client/${clientId}`,
        {},
        "GET",
        2,
        true
      );
      console.log("✅ [SALES] Ventas del cliente obtenidas");
      return result;
    } catch (error) {
      console.error("❌ [SALES] Error obteniendo ventas del cliente:", error);
      throw error;
    }
  },

  getByEmployee: async (employeeId) => {
    console.log(`💰 [SALES] Obteniendo ventas del empleado ${employeeId}...`);
    try {
      const result = await callEdgeFunction(
        `sales/employee/${employeeId}`,
        {},
        "GET",
        2,
        true
      );
      console.log("✅ [SALES] Ventas del empleado obtenidas");
      return result;
    } catch (error) {
      console.error("❌ [SALES] Error obteniendo ventas del empleado:", error);
      throw error;
    }
  },

  getByDateRange: async (startDate, endDate) => {
    console.log(
      `💰 [SALES] Obteniendo ventas entre ${startDate} y ${endDate}...`
    );
    try {
      const result = await callEdgeFunction(
        "sales/date-range",
        { startDate, endDate },
        "POST",
        2,
        true
      );
      console.log("✅ [SALES] Ventas por rango de fecha obtenidas");
      return result;
    } catch (error) {
      console.error("❌ [SALES] Error obteniendo ventas por rango:", error);
      throw error;
    }
  },

  generateDocument: async (saleId, documentType = "invoice") => {
    console.log(
      `💰 [SALES] Generando documento ${documentType} para venta ${saleId}...`
    );
    try {
      const result = await callEdgeFunction(
        `sales/${saleId}/document`,
        { documentType },
        "POST",
        2,
        true
      );
      console.log("✅ [SALES] Documento generado");
      return result;
    } catch (error) {
      console.error("❌ [SALES] Error generando documento:", error);
      throw error;
    }
  },

  updateInventory: async (saleId) => {
    console.log(`💰 [SALES] Actualizando inventario para venta ${saleId}...`);
    try {
      const result = await callEdgeFunction(
        `sales/${saleId}/inventory`,
        {},
        "PUT",
        2,
        true
      );
      console.log("✅ [SALES] Inventario actualizado");
      return result;
    } catch (error) {
      console.error("❌ [SALES] Error actualizando inventario:", error);
      throw error;
    }
  },

  executeDailyClosure: async (date) => {
    console.log(`💰 [SALES] Ejecutando cierre diario para ${date}...`);
    try {
      const result = await callEdgeFunction(
        "sales/daily-closure",
        { date },
        "POST",
        2,
        true
      );
      console.log("✅ [SALES] Cierre diario ejecutado");
      return result;
    } catch (error) {
      console.error("❌ [SALES] Error en cierre diario:", error);
      throw error;
    }
  },

  checkDailyClosure: async (date) => {
    console.log(`💰 [SALES] Verificando cierre diario para ${date}...`);
    try {
      const result = await callEdgeFunction(
        `sales/daily-closure/check`,
        { date },
        "GET",
        2,
        true
      );
      console.log("✅ [SALES] Verificación de cierre completada");
      return result;
    } catch (error) {
      console.error("❌ [SALES] Error verificando cierre:", error);
      throw error;
    }
  },
};

// 👤 CLIENTES - SERVICIO EXPANDIDO
export const clientsService = {
  getAll: async () => {
    console.log("👤 [CLIENTS] Obteniendo clientes...");
    try {
      const result = await callEdgeFunction("clients", {}, "GET", 2, true);
      console.log("✅ [CLIENTS] Clientes obtenidos");
      return result;
    } catch (error) {
      console.error("❌ [CLIENTS] Error obteniendo clientes:", error);
      throw error;
    }
  },

  create: async (clientData) => {
    console.log("👤 [CLIENTS] Creando cliente...");
    try {
      const result = await callEdgeFunction(
        "clients",
        clientData,
        "POST",
        2,
        true
      );
      console.log("✅ [CLIENTS] Cliente creado");
      return result;
    } catch (error) {
      console.error("❌ [CLIENTS] Error creando cliente:", error);
      throw error;
    }
  },

  getById: async (id) => {
    console.log(`👤 [CLIENTS] Obteniendo cliente ${id}...`);
    try {
      const result = await callEdgeFunction(
        `clients/${id}`,
        {},
        "GET",
        2,
        true
      );
      console.log("✅ [CLIENTS] Cliente obtenido");
      return result;
    } catch (error) {
      console.error("❌ [CLIENTS] Error obteniendo cliente:", error);
      throw error;
    }
  },

  update: async (id, clientData) => {
    console.log(`👤 [CLIENTS] Actualizando cliente ${id}...`);
    try {
      const result = await callEdgeFunction(
        `clients/${id}`,
        clientData,
        "PUT",
        2,
        true
      );
      console.log("✅ [CLIENTS] Cliente actualizado");
      return result;
    } catch (error) {
      console.error("❌ [CLIENTS] Error actualizando cliente:", error);
      throw error;
    }
  },

  delete: async (id) => {
    console.log(`👤 [CLIENTS] Eliminando cliente ${id}...`);
    try {
      const result = await callEdgeFunction(
        `clients/${id}`,
        {},
        "DELETE",
        2,
        true
      );
      console.log("✅ [CLIENTS] Cliente eliminado");
      return result;
    } catch (error) {
      console.error("❌ [CLIENTS] Error eliminando cliente:", error);
      throw error;
    }
  },
};

// 🔧 UTILIDADES Y SALUD DEL SISTEMA
export const systemService = {
  healthCheck: async () => {
    console.log("🔧 [SYSTEM] Verificando salud del sistema...");
    try {
      const result = await callEdgeFunction(
        "system/health",
        {},
        "GET",
        1,
        false // Health check público
      );
      console.log("✅ [SYSTEM] Sistema saludable");
      return result;
    } catch (error) {
      console.error("❌ [SYSTEM] Error en health check:", error);
      throw error;
    }
  },

  getStatus: async () => {
    console.log("📊 [SYSTEM] Obteniendo estado del sistema...");
    try {
      const result = await callEdgeFunction(
        "system/status",
        {},
        "GET",
        1,
        false // Status público
      );
      console.log("✅ [SYSTEM] Estado obtenido");
      return result;
    } catch (error) {
      console.error("❌ [SYSTEM] Error obteniendo estado:", error);
      throw error;
    }
  },
};

// 📤 SERVICIO CENTRALIZADO DE EXPORTACIÓN
export const edgeFunctionService = {
  auth: authService,
  company: companyService,
  dashboard: dashboardService,
  employees: employeesService,
  inventory: inventoryService,
  sales: salesService,
  clients: clientsService,
  system: systemService,

  // 🚀 Método directo para llamadas personalizadas
  call: callEdgeFunction,

  // 🔍 Helper para debug
  debugService: async (serviceName) => {
    console.log(`🔍 [DEBUG] Verificando servicio: ${serviceName}`);
    const service = edgeFunctionService[serviceName];
    if (!service) {
      console.error(`❌ [DEBUG] Servicio no encontrado: ${serviceName}`);
      return { success: false, error: `Servicio ${serviceName} no existe` };
    }

    console.log(`✅ [DEBUG] Servicio ${serviceName} está disponible`);
    return { success: true, service: Object.keys(service) };
  },
};

// 📤 Export por defecto
export default edgeFunctionService;
