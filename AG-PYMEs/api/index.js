//Módulo principal para unificar todos los servicios

// Importar servicios rediseñados
import { BaseStorage, TokenStorage, ImageStorage } from "./services/storage";
import AuthService from "./services/authService";
import FileService from "./services/file";

// Importar servicio de alertas con cache
import {
  getAlerts,
  getAlertById,
  createAlert,
  updateAlert,
  deleteAlert,
  invalidateAlertsCache,
  preloadAlerts,
} from "./services/alertsService";
import {
  getAllAppointments,
  getAppointmentById,
  getAppointmentsByClient,
  getAppointmentsByEmployee,
  getAppointmentsByDateRange,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  checkEmployeeAvailability,
} from "./services/appointmentsService";
import {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
} from "./services/clientsService";
import {
  getDashboardData,
  invalidateDashboardCache,
  getDashboardCacheStats,
} from "./services/dashboardService";
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "./services/employeesService";
import {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpensesByMonth,
  getExpensesPaginated,
} from "./services/expensesService";
import {
  getIncomes,
  getIncomeById,
  createIncome,
  updateIncome,
  deleteIncome,
} from "./services/incomesService";
import {
  getAllInventory,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "./services/inventoryService";
import {
  getLeaves,
  getLeaveById,
  createLeave,
  updateLeave,
  deleteLeave,
} from "./services/leavesService";
import {
  getAllOrderDetails,
  getOrderDetailById,
  createOrderDetail,
  updateOrderDetail,
  deleteOrderDetail,
} from "./services/orderDetailService";
import {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
} from "./services/ordersService";
import {
  getAllSales,
  getSaleById,
  createSale,
  updateSale,
  deleteSale,
  updateSaleStatus,
  getSalesByClient,
  getSalesByEmployee,
  getSalesByDateRange,
  generateSaleDocument,
  updateInventoryQuantities,
  executeDailyClosure,
  checkDailyClosure,
} from "./services/salesService";
import {
  getAllServices,
  getServiceById,
  getAllServicesAdmin,
  createService,
  updateService,
  deleteService,
  getServicesByCategory,
  searchServices,
} from "./services/servicesService";
import {
  getSettingById,
  createSetting,
  updateSetting,
} from "./services/settingsService";
import {
  getAllShifts,
  getShiftById,
  getShiftByDate,
  getShiftsByMonth,
  saveShift,
  deleteShift,
  deleteShiftInterval,
  getShiftsWithEmployeeInfo,
  getMonthlyShiftsForExport,
  copyShiftsFromPreviousWeek,
} from "./services/shiftsService";
import {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "./services/suppliersService";
import { createUser } from "./services/usersService";

// Importar componentes rediseñados
import ImageWithAuth from "../components/ImageWithAuth";

//API unificada para todos los servicios
const Services = {
  //Servicios de autenticación
  Auth: AuthService,

  //Servicios para el manejo de datos
  Data: {
    //Servicio de alertas
    Alerts: {
      getById: getAlertById,
      getAll: getAlerts,
      create: createAlert,
      update: updateAlert,
      delete: deleteAlert,
      // Nuevas funciones optimizadas
      invalidateCache: invalidateAlertsCache,
      preload: preloadAlerts,
    }, //Servicio de citas
    Appointments: {
      getAll: getAllAppointments,
      getById: getAppointmentById,
      getByClient: getAppointmentsByClient,
      getByEmployee: getAppointmentsByEmployee,
      getByDateRange: getAppointmentsByDateRange,
      create: createAppointment,
      update: updateAppointment,
      updateStatus: updateAppointmentStatus,
      delete: deleteAppointment,
      checkAvailability: checkEmployeeAvailability,
    },
    //Servicio de clientes
    Clients: {
      getAll: getAllClients,
      getById: getClientById,
      create: createClient,
      update: updateClient,
      delete: deleteClient,
    },
    //Servicio del dashboard
    Dashboard: {
      getData: getDashboardData,
      invalidateCache: invalidateDashboardCache,
      getCacheStats: getDashboardCacheStats,
    },
    //Servicio de empleados
    Employees: {
      getAll: getAllEmployees,
      getById: getEmployeeById,
      create: createEmployee,
      update: updateEmployee,
      delete: deleteEmployee,
    },
    //Servicio de gastos
    Expenses: {
      getAll: getExpenses,
      getById: getExpenseById,
      getByMonth: getExpensesByMonth,
      getPaginated: getExpensesPaginated,
      create: createExpense,
      update: updateExpense,
      delete: deleteExpense,
    },
    //Servicio de ingresos
    Incomes: {
      getAll: getIncomes,
      getById: getIncomeById,
      create: createIncome,
      update: updateIncome,
      delete: deleteIncome,
    },
    //Servicio de inventario
    Inventory: {
      getAll: getAllInventory,
      getById: getProductById,
      create: createProduct,
      update: updateProduct,
      delete: deleteProduct,
    },
    //Servicio de ausencias
    Leaves: {
      getAll: getLeaves,
      getById: getLeaveById,
      create: createLeave,
      update: updateLeave,
      delete: deleteLeave,
    },
    //Servicio de detalles de órdenes
    OrderDetails: {
      getAll: getAllOrderDetails,
      getById: getOrderDetailById,
      create: createOrderDetail,
      update: updateOrderDetail,
      delete: deleteOrderDetail,
    },
    //Servicio de órdenes
    Orders: {
      getAll: getAllOrders,
      getById: getOrderById,
      create: createOrder,
      update: updateOrder,
      delete: deleteOrder,
    },
    //Servicio de ventas
    Sales: {
      getAll: getAllSales,
      getById: getSaleById,
      getByClient: getSalesByClient,
      getByEmployee: getSalesByEmployee,
      getByDateRange: getSalesByDateRange,
      create: createSale,
      update: updateSale,
      updateStatus: updateSaleStatus,
      delete: deleteSale,
      generateSaleDocument,
      updateInventoryQuantities,
      executeDailyClosure,
      checkDailyClosure,
    },
    //Servicio de servicios ofrecidos
    Services: {
      getAll: getAllServices,
      getById: getServiceById,
      getAllAdmin: getAllServicesAdmin,
      getByCategory: getServicesByCategory,
      search: searchServices,
      create: createService,
      update: updateService,
      delete: deleteService,
    }, //Servicio de configuraciones
    Settings: {
      getById: getSettingById,
      create: createSetting,
      update: updateSetting,
    }, //Servicio de turnos
    Shifts: {
      getAll: getAllShifts,
      getById: getShiftById,
      getByDate: getShiftByDate,
      getByMonth: getShiftsByMonth,
      save: saveShift,
      delete: deleteShift,
      deleteInterval: deleteShiftInterval,
      getShiftsWithEmployeeInfo: getShiftsWithEmployeeInfo,
      getMonthlyShiftsForExport: getMonthlyShiftsForExport,
      copyShiftsFromPreviousWeek: copyShiftsFromPreviousWeek,
    },
    //Servicio de proveedores
    Suppliers: {
      getAll: getSuppliers,
      getById: getSupplierById,
      create: createSupplier,
      update: updateSupplier,
      delete: deleteSupplier,
    },
    //Servicio de usuarios
    Users: {
      create: createUser,
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
    // Redefinimos los métodos con nombres más intuitivos
    normalizeUrl:
      FileService.normalizeUrl || FileService.normalizeImageUrl || null,
    normalizeImageUrl: FileService.normalizeImageUrl || null,
    createSignedUrl:
      FileService.createSignedUrl || FileService.createSignedImageUrl || null,
    createSignedImageUrl: FileService.createSignedImageUrl || null,
    download: FileService.download || FileService.downloadFile || null,
    downloadFile: FileService.downloadFile || null,
    delete: FileService.delete || FileService.deleteFile || null,
    deleteFile: FileService.deleteFile || null,
    upload: FileService.upload || FileService.uploadFile || null,
    uploadFile: FileService.uploadFile || null,
    loadImage: FileService.loadImage || FileService.load || null,
    getFilenameFromUrl:
      FileService.getFilenameFromUrl || FileService.getFilename || null,
  },
};

//Componentes
const Components = {
  ImageWithAuth,
};

// Exportar servicios y componentes
export {
  Services,
  Components,

  // Exportaciones directas para compatibilidad con el código existente
  // Auth
  AuthService,

  // Storage
  BaseStorage,
  TokenStorage,
  ImageStorage,

  // File
  FileService,

  // Alertas
  getAlertById,
  getAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
  // Citas
  getAllAppointments,
  getAppointmentById,
  getAppointmentsByClient,
  getAppointmentsByEmployee,
  getAppointmentsByDateRange,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  checkEmployeeAvailability,

  // Clientes
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,

  // Dashboard
  getDashboardData,

  // Empleados
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,

  // Gastos
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpensesByMonth,
  getExpensesPaginated,

  // Ingresos
  getIncomes,
  getIncomeById,
  createIncome,
  updateIncome,
  deleteIncome,

  // Inventario
  getAllInventory,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,

  // Ausencias
  getLeaves,
  getLeaveById,
  createLeave,
  updateLeave,
  deleteLeave,

  // Detalles de órdenes
  getAllOrderDetails,
  getOrderDetailById,
  createOrderDetail,
  updateOrderDetail,
  deleteOrderDetail,

  // Órdenes
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,

  // Ventas
  getAllSales,
  getSaleById,
  createSale,
  updateSale,
  deleteSale,
  updateSaleStatus,
  getSalesByClient,
  getSalesByEmployee,
  getSalesByDateRange,
  generateSaleDocument,
  updateInventoryQuantities,
  executeDailyClosure,
  checkDailyClosure,

  // Servicios
  getAllServices,
  getServiceById,
  getAllServicesAdmin,
  createService,
  updateService,
  deleteService,
  getServicesByCategory,
  searchServices,
  // Configuraciones
  getSettingById,
  createSetting,
  updateSetting,

  // Turnos
  // Turnos
  getAllShifts,
  getShiftById,
  getShiftByDate,
  getShiftsByMonth,
  saveShift,
  deleteShift,
  deleteShiftInterval,
  getShiftsWithEmployeeInfo,
  getMonthlyShiftsForExport,
  copyShiftsFromPreviousWeek,

  // Proveedores
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,

  // Usuarios
  createUser,

  // Componentes
  ImageWithAuth,
};

// Exportación por defecto
export default {
  Services,
  Components,
  initialize: async () => {
    try {
      // Aquí puedes añadir lógica de inicialización si es necesaria
      return true;
    } catch (error) {
      console.error("Error al inicializar servicios:", error);
      return false;
    }
  },
};
