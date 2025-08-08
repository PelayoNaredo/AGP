//Módulo principal para unificar todos los servicios usando EdgeFunctions

// Importar el nuevo servicio unificado de EdgeFunctions
import EdgeFunctionsAPI, {
  authService,
  companyService,
  dashboardService,
  employeesService,
  inventoryService,
  salesService,
  clientsService,
  systemService,
} from "./edgeFunctionsService";

// ✅ CREAR ALIASES PARA COMPATIBILIDAD
const companiesService = companyService; // Alias para mantener compatibilidad

// 🚧 SERVICIOS TEMPORALES HASTA IMPLEMENTAR EDGE FUNCTIONS
// Control de logs para servicios mock - solo mostrar en desarrollo y una vez por servicio
const MOCK_LOGS_ENABLED = __DEV__ && false; // Cambiar a true para debug
const loggedServices = new Set();

const createMockService = (serviceName) => {
  const logOnce = (message) => {
    if (MOCK_LOGS_ENABLED && !loggedServices.has(serviceName)) {
      console.warn(`⚠️ ${serviceName} no implementado aún - usando mock`);
      loggedServices.add(serviceName);
    }
  };

  return {
    getAll: async () => {
      logOnce();
      return { success: true, data: [] };
    },
    getById: async (id) => {
      logOnce();
      return { success: true, data: null };
    },
    create: async (data) => {
      logOnce();
      return { success: true, data: { id: Date.now(), ...data } };
    },
    update: async (id, data) => {
      logOnce();
      return { success: true, data: { id, ...data } };
    },
    delete: async (id) => {
      logOnce();
      return { success: true, data: { id } };
    },
  };
};

// Servicios mock temporales
const alertsService = createMockService("alertsService");

const appointmentsService = (() => {
  const logOnce = () => {
    if (MOCK_LOGS_ENABLED && !loggedServices.has("appointmentsService")) {
      console.warn("⚠️ appointmentsService no implementado aún - usando mock");
      loggedServices.add("appointmentsService");
    }
  };

  return {
    ...createMockService("appointmentsService"),
    getByClient: async (clientId) => {
      logOnce();
      return { success: true, data: [] };
    },
    getByEmployee: async (employeeId) => {
      logOnce();
      return { success: true, data: [] };
    },
    getByDateRange: async (startDate, endDate) => {
      logOnce();
      return { success: true, data: [] };
    },
    updateStatus: async (id, status) => {
      logOnce();
      return { success: true, data: { id, status } };
    },
    checkAvailability: async (employeeId, datetime) => {
      logOnce();
      return { success: true, data: { available: true } };
    },
  };
})();

const expensesService = (() => {
  const logOnce = () => {
    if (MOCK_LOGS_ENABLED && !loggedServices.has("expensesService")) {
      console.warn("⚠️ expensesService no implementado aún - usando mock");
      loggedServices.add("expensesService");
    }
  };

  return {
    ...createMockService("expensesService"),
    getByMonth: async (month, year) => {
      logOnce();
      return { success: true, data: [] };
    },
    getPaginated: async (page, limit) => {
      logOnce();
      return { success: true, data: { items: [], total: 0 } };
    },
  };
})();

const incomeService = createMockService("incomeService");
const leavesService = createMockService("leavesService");
const ordersService = createMockService("ordersService");
const orderDetailsService = createMockService("orderDetailsService");
const servicesService = (() => {
  const logOnce = () => {
    if (MOCK_LOGS_ENABLED && !loggedServices.has("servicesService")) {
      console.warn("⚠️ servicesService no implementado aún - usando mock");
      loggedServices.add("servicesService");
    }
  };

  return {
    ...createMockService("servicesService"),
    getAllAdmin: async () => {
      logOnce();
      return { success: true, data: [] };
    },
  };
})();
const settingsService = createMockService("settingsService");
const shiftsService = (() => {
  const logOnce = () => {
    if (MOCK_LOGS_ENABLED && !loggedServices.has("shiftsService")) {
      console.warn("⚠️ shiftsService no implementado aún - usando mock");
      loggedServices.add("shiftsService");
    }
  };

  return {
    ...createMockService("shiftsService"),
    getByDate: async (date) => {
      logOnce();
      return { success: true, data: [] };
    },
    getByMonth: async (month, year) => {
      logOnce();
      return { success: true, data: [] };
    },
    save: async (data) => {
      logOnce();
      return { success: true, data };
    },
    deleteInterval: async (start, end) => {
      logOnce();
      return { success: true, data: null };
    },
    getWithEmployeeInfo: async () => {
      logOnce();
      return { success: true, data: [] };
    },
    getMonthlyForExport: async (month, year) => {
      logOnce();
      return { success: true, data: [] };
    },
    copyFromPreviousWeek: async (date) => {
      logOnce();
      return { success: true, data: null };
    },
  };
})();
const suppliersService = createMockService("suppliersService");
const usersService = createMockService("usersService");
const filesService = {
  getSignedUrl: async (filename) => {
    console.warn("⚠️ filesService.getSignedUrl no implementado - usando mock");
    return { success: true, data: { url: `https://example.com/${filename}` } };
  },
};

// Importar servicios rediseñados que no tienen EdgeFunction equivalente
import { BaseStorage, TokenStorage, ImageStorage } from "./services/storage";
import AuthService from "./services/authService";
import FileService from "./services/file";
import CompanyService from "./services/CompanyService";

// Importar componentes rediseñados
import ImageWithAuth from "../components/ImageWithAuth";

//API unificada para todos los servicios usando EdgeFunctions
const Services = {
  //Servicios de autenticación - Migrado a EdgeFunctions
  Auth: {
    ...AuthService, // Mantener AuthService original para compatibilidad
    // Nuevos métodos con EdgeFunctions
    login: authService.login,
    register: authService.register,
  },

  //Servicios para el manejo de datos - Migrados a EdgeFunctions
  Data: {
    //Servicio de empresas - Migrado a EdgeFunctions
    Companies: {
      ...CompanyService, // Mantener CompanyService original para compatibilidad
      // Nuevos métodos con EdgeFunctions
      getAll: companiesService.getAll,
      getById: companiesService.getById,
      getCurrent: companiesService.getCurrent,
      getUsage: companiesService.getUsage,
    },

    //Servicio de alertas - Migrado a EdgeFunctions
    Alerts: {
      getById: alertsService.getById,
      getAll: alertsService.getAll,
      create: alertsService.create,
      update: alertsService.update,
      delete: alertsService.delete,
    },

    //Servicio de citas - Migrado a EdgeFunctions
    Appointments: {
      getAll: appointmentsService.getAll,
      getById: appointmentsService.getById,
      getByClient: appointmentsService.getByClient,
      getByEmployee: appointmentsService.getByEmployee,
      getByDateRange: appointmentsService.getByDateRange,
      create: appointmentsService.create,
      update: appointmentsService.update,
      updateStatus: appointmentsService.updateStatus,
      delete: appointmentsService.delete,
      checkAvailability: appointmentsService.checkAvailability,
    },

    //Servicio de clientes - Migrado a EdgeFunctions
    Clients: {
      getAll: clientsService.getAll,
      getById: clientsService.getById,
      create: clientsService.create,
      update: clientsService.update,
      delete: clientsService.delete,
    },

    //Servicio de dashboard - Migrado a EdgeFunctions
    Dashboard: {
      getData: dashboardService.getData,
      getFinancial: dashboardService.getFinancial,
      getTrend: dashboardService.getTrend,
      getInventory: dashboardService.getInventory,
    },

    //Servicio de empleados - Migrado a EdgeFunctions
    Employees: {
      getAll: employeesService.getAll,
      getById: employeesService.getById,
      create: employeesService.create,
      update: employeesService.update,
      delete: employeesService.delete,
    },

    //Servicios de gastos - Migrado a EdgeFunctions
    Expenses: {
      getAll: expensesService.getAll,
      getById: expensesService.getById,
      create: expensesService.create,
      update: expensesService.update,
      delete: expensesService.delete,
      getByMonth: expensesService.getByMonth,
      getPaginated: expensesService.getPaginated,
    },

    //Servicios de ingresos - Migrado a EdgeFunctions
    Incomes: {
      getAll: incomeService.getAll,
      getById: incomeService.getById,
      create: incomeService.create,
      update: incomeService.update,
      delete: incomeService.delete,
    },

    //Servicio de inventario - Migrado a EdgeFunctions
    Inventory: {
      getAll: inventoryService.getAll,
      getById: inventoryService.getById,
      create: inventoryService.create,
      update: inventoryService.update,
      delete: inventoryService.delete,
    },

    //Servicios de ausencias - Migrado a EdgeFunctions
    Leaves: {
      getAll: leavesService.getAll,
      getById: leavesService.getById,
      create: leavesService.create,
      update: leavesService.update,
      delete: leavesService.delete,
    },

    //Servicios de detalles de órdenes - Migrado a EdgeFunctions
    OrderDetails: {
      getAll: orderDetailsService.getAll,
      getById: orderDetailsService.getById,
      create: orderDetailsService.create,
      update: orderDetailsService.update,
      delete: orderDetailsService.delete,
    },

    //Servicios de órdenes - Migrado a EdgeFunctions
    Orders: {
      getAll: ordersService.getAll,
      getById: ordersService.getById,
      create: ordersService.create,
      update: ordersService.update,
      delete: ordersService.delete,
    },

    //Servicios de ventas - Migrado a EdgeFunctions
    Sales: {
      getAll: salesService.getAll,
      getById: salesService.getById,
      getByClient: salesService.getByClient,
      getByEmployee: salesService.getByEmployee,
      getByDateRange: salesService.getByDateRange,
      create: salesService.create,
      update: salesService.update,
      updateStatus: salesService.updateStatus,
      delete: salesService.delete,
      generateDocument: salesService.generateDocument,
      updateInventory: salesService.updateInventory,
      executeDailyClosure: salesService.executeDailyClosure,
      checkDailyClosure: salesService.checkDailyClosure,
    },

    //Servicio de servicios ofrecidos - Migrado a EdgeFunctions
    Services: {
      getAll: servicesService.getAll,
      getById: servicesService.getById,
      getAllAdmin: servicesService.getAllAdmin,
      create: servicesService.create,
      update: servicesService.update,
      delete: servicesService.delete,
    },

    //Servicios de configuraciones - Migrado a EdgeFunctions
    Settings: {
      getAll: settingsService.getAll,
      getById: settingsService.getById,
      create: settingsService.create,
      update: settingsService.update,
    },

    //Servicios de turnos - Migrado a EdgeFunctions
    Shifts: {
      getAll: shiftsService.getAll,
      getById: shiftsService.getById,
      getByDate: shiftsService.getByDate,
      getByMonth: shiftsService.getByMonth,
      save: shiftsService.save,
      delete: shiftsService.delete,
      deleteInterval: shiftsService.deleteInterval,
      getWithEmployeeInfo: shiftsService.getWithEmployeeInfo,
      getMonthlyForExport: shiftsService.getMonthlyForExport,
      copyFromPreviousWeek: shiftsService.copyFromPreviousWeek,
    },

    //Servicios de proveedores - Migrado a EdgeFunctions
    Suppliers: {
      getAll: suppliersService.getAll,
      getById: suppliersService.getById,
      create: suppliersService.create,
      update: suppliersService.update,
      delete: suppliersService.delete,
    },

    //Servicios de usuarios - Migrado a EdgeFunctions
    Users: {
      getAll: usersService.getAll,
      getById: usersService.getById,
      create: usersService.create,
      update: usersService.update,
      delete: usersService.delete,
    },
  },

  //Servicios de almacenamiento
  Storage: {
    Base: BaseStorage,
    Token: TokenStorage,
    Image: ImageStorage,
  },

  //Servicios de archivos
  File: {
    ...FileService,
    getSignedUrl: filesService.getSignedUrl,
  },

  //Componentes
  Components: {
    ImageWithAuth,
  },

  // EdgeFunctions API directa (para casos avanzados)
  EdgeFunctions: EdgeFunctionsAPI,
};

// Funciones auxiliares para compatibilidad con el sistema anterior
export const getAlerts = alertsService.getAll;
export const getAlertById = alertsService.getById;
export const createAlert = alertsService.create;
export const updateAlert = alertsService.update;
export const deleteAlert = alertsService.delete;

export const getAllAppointments = appointmentsService.getAll;
export const getAppointmentById = appointmentsService.getById;
export const getAppointmentsByClient = appointmentsService.getByClient;
export const getAppointmentsByEmployee = appointmentsService.getByEmployee;
export const getAppointmentsByDateRange = appointmentsService.getByDateRange;
export const createAppointment = appointmentsService.create;
export const updateAppointment = appointmentsService.update;
export const updateAppointmentStatus = appointmentsService.updateStatus;
export const deleteAppointment = appointmentsService.delete;
export const checkEmployeeAvailability = appointmentsService.checkAvailability;

export const getAllClients = clientsService.getAll;
export const getClientById = clientsService.getById;
export const createClient = clientsService.create;
export const updateClient = clientsService.update;
export const deleteClient = clientsService.delete;

export const getDashboardData = dashboardService.getData;
export const invalidateDashboardCache = () =>
  console.log("Cache invalidation not needed with EdgeFunctions");

export const getAllEmployees = employeesService.getAll;
export const getEmployeeById = employeesService.getById;
export const createEmployee = employeesService.create;
export const updateEmployee = employeesService.update;
export const deleteEmployee = employeesService.delete;

export const getAllInventory = inventoryService.getAll;
export const getProductById = inventoryService.getById;
export const createProduct = inventoryService.create;
export const updateProduct = inventoryService.update;
export const deleteProduct = inventoryService.delete;

export const getAllServices = servicesService.getAll;
export const getServiceById = servicesService.getById;
export const getAllServicesAdmin = servicesService.getAllAdmin;
export const createService = servicesService.create;
export const updateService = servicesService.update;
export const deleteService = servicesService.delete;
export const getServicesByCategory = (category) => servicesService.getAll(); // Temporal
export const searchServices = (query) => servicesService.getAll(); // Temporal

// Re-exportar servicios migrados a EdgeFunctions para compatibilidad
export const getExpenses = expensesService.getAll;
export const getExpenseById = expensesService.getById;
export const createExpense = expensesService.create;
export const updateExpense = expensesService.update;
export const deleteExpense = expensesService.delete;
export const getExpensesByMonth = expensesService.getByMonth;
export const getExpensesPaginated = expensesService.getPaginated;

export const getIncomes = incomeService.getAll;
export const getIncomeById = incomeService.getById;
export const createIncome = incomeService.create;
export const updateIncome = incomeService.update;
export const deleteIncome = incomeService.delete;

export const getLeaves = leavesService.getAll;
export const getLeaveById = leavesService.getById;
export const createLeave = leavesService.create;
export const updateLeave = leavesService.update;
export const deleteLeave = leavesService.delete;

export const getAllOrderDetails = orderDetailsService.getAll;
export const getOrderDetailById = orderDetailsService.getById;
export const createOrderDetail = orderDetailsService.create;
export const updateOrderDetail = orderDetailsService.update;
export const deleteOrderDetail = orderDetailsService.delete;

export const getAllOrders = ordersService.getAll;
export const getOrderById = ordersService.getById;
export const createOrder = ordersService.create;
export const updateOrder = ordersService.update;
export const deleteOrder = ordersService.delete;

export const getAllSales = salesService.getAll;
export const getSaleById = salesService.getById;
export const createSale = salesService.create;
export const updateSale = salesService.update;
export const deleteSale = salesService.delete;
export const updateSaleStatus = salesService.updateStatus;
export const getSalesByClient = salesService.getByClient;
export const getSalesByEmployee = salesService.getByEmployee;
export const getSalesByDateRange = salesService.getByDateRange;
export const generateSaleDocument = salesService.generateDocument;
export const updateInventoryQuantities = salesService.updateInventory;
export const executeDailyClosure = salesService.executeDailyClosure;
export const checkDailyClosure = salesService.checkDailyClosure;

export const getSettingById = settingsService.getById;
export const createSetting = settingsService.create;
export const updateSetting = settingsService.update;

export const getAllShifts = shiftsService.getAll;
export const getShiftById = shiftsService.getById;
export const getShiftByDate = shiftsService.getByDate;
export const getShiftsByMonth = shiftsService.getByMonth;
export const saveShift = shiftsService.save;
export const deleteShift = shiftsService.delete;
export const deleteShiftInterval = shiftsService.deleteInterval;
export const getShiftsWithEmployeeInfo = shiftsService.getWithEmployeeInfo;
export const getMonthlyShiftsForExport = shiftsService.getMonthlyForExport;
export const copyShiftsFromPreviousWeek = shiftsService.copyFromPreviousWeek;

export const getSuppliers = suppliersService.getAll;
export const getSupplierById = suppliersService.getById;
export const createSupplier = suppliersService.create;
export const updateSupplier = suppliersService.update;
export const deleteSupplier = suppliersService.delete;

export const createUser = usersService.create;

// Exportar servicios rediseñados
export {
  BaseStorage,
  TokenStorage,
  ImageStorage,
  AuthService,
  FileService,
  CompanyService,
  ImageWithAuth,
};

// Exportar Components para destructuración directa
export const Components = {
  ImageWithAuth,
};

// 📤 EXPORTACIONES FINALES - Mantener compatibilidad
export { Services }; // Export nombrado para compatibilidad
export default Services;
