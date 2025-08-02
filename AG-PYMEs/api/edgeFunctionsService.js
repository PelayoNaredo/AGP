// Servicio unificado para EdgeFunctions
// Reemplaza todos los servicios individuales para usar las EdgeFunctions desplegadas
import { EdgeFunctions } from "../config/supabase";

/**
 * Servicio unificado para todas las EdgeFunctions
 * Cada función maneja errores y devuelve datos consistentes
 */

// ==================== AUTHENTICATION ====================
export const authService = {
  // Login usando EdgeFunction de login
  login: async (credentials) => {
    try {
      const result =
        (await EdgeFunctions.auth.login?.(credentials)) ||
        (await fetch(
          `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/login`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify(credentials),
          }
        ).then((res) => res.json()));

      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error en login");
      }
    } catch (error) {
      console.error("[AUTH_SERVICE] Error en login:", error);
      throw error;
    }
  },

  // Register usando EdgeFunction de register
  register: async (userData) => {
    try {
      const result = await EdgeFunctions.auth.register(userData);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error en registro");
      }
    } catch (error) {
      console.error("[AUTH_SERVICE] Error en register:", error);
      throw error;
    }
  },
};

// ==================== COMPANIES ====================
export const companiesService = {
  getAll: async () => {
    try {
      const result =
        (await EdgeFunctions.companies.getAll?.()) ||
        (await fetch(
          `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/companies`,
          {
            headers: { apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY },
          }
        ).then((res) => res.json()));
      return result.success ? result.data : [];
    } catch (error) {
      console.error("[COMPANIES_SERVICE] Error getting companies:", error);
      return [];
    }
  },

  getById: async (id) => {
    try {
      const result = await EdgeFunctions.companies.getById(id);
      return result.success ? result.data : null;
    } catch (error) {
      console.error("[COMPANIES_SERVICE] Error getting company:", error);
      return null;
    }
  },

  getCurrent: async () => {
    try {
      const result = await EdgeFunctions.companies.getCurrent();
      return result.success ? result.data : null;
    } catch (error) {
      console.error(
        "[COMPANIES_SERVICE] Error getting current company:",
        error
      );
      return null;
    }
  },

  getUsage: async () => {
    try {
      const result = await EdgeFunctions.companies.getUsage();
      return result.success ? result.data : null;
    } catch (error) {
      console.error("[COMPANIES_SERVICE] Error getting usage:", error);
      return null;
    }
  },
};

// ==================== ALERTS ====================
export const alertsService = {
  getAll: async () => {
    try {
      const result = await EdgeFunctions.alerts.getAll();
      return result.success ? result.data : [];
    } catch (error) {
      console.error("[ALERTS_SERVICE] Error getting alerts:", error);
      return [];
    }
  },

  getById: async (id) => {
    try {
      const result = await EdgeFunctions.alerts.getById(id);
      return result.success ? result.data : null;
    } catch (error) {
      console.error("[ALERTS_SERVICE] Error getting alert:", error);
      return null;
    }
  },

  create: async (alertData) => {
    try {
      const result = await EdgeFunctions.alerts.create(alertData);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error creating alert");
      }
    } catch (error) {
      console.error("[ALERTS_SERVICE] Error creating alert:", error);
      throw error;
    }
  },

  update: async (id, alertData) => {
    try {
      const result = await EdgeFunctions.alerts.update(id, alertData);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error updating alert");
      }
    } catch (error) {
      console.error("[ALERTS_SERVICE] Error updating alert:", error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const result = await EdgeFunctions.alerts.delete(id);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error deleting alert");
      }
    } catch (error) {
      console.error("[ALERTS_SERVICE] Error deleting alert:", error);
      throw error;
    }
  },
};

// ==================== CLIENTS ====================
export const clientsService = {
  getAll: async () => {
    try {
      const result = await EdgeFunctions.clients.getAll();
      return result.success ? result.data : [];
    } catch (error) {
      console.error("[CLIENTS_SERVICE] Error getting clients:", error);
      return [];
    }
  },

  getById: async (id) => {
    try {
      const result = await EdgeFunctions.clients.getById(id);
      return result.success ? result.data : null;
    } catch (error) {
      console.error("[CLIENTS_SERVICE] Error getting client:", error);
      return null;
    }
  },

  create: async (clientData) => {
    try {
      const result = await EdgeFunctions.clients.create(clientData);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error creating client");
      }
    } catch (error) {
      console.error("[CLIENTS_SERVICE] Error creating client:", error);
      throw error;
    }
  },

  update: async (id, clientData) => {
    try {
      const result = await EdgeFunctions.clients.update(id, clientData);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error updating client");
      }
    } catch (error) {
      console.error("[CLIENTS_SERVICE] Error updating client:", error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const result = await EdgeFunctions.clients.delete(id);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error deleting client");
      }
    } catch (error) {
      console.error("[CLIENTS_SERVICE] Error deleting client:", error);
      throw error;
    }
  },
};

// ==================== EMPLOYEES ====================
export const employeesService = {
  getAll: async () => {
    try {
      const result = await EdgeFunctions.employees.getAll();
      return result.success ? result.data : [];
    } catch (error) {
      console.error("[EMPLOYEES_SERVICE] Error getting employees:", error);
      return [];
    }
  },

  getById: async (id) => {
    try {
      const result = await EdgeFunctions.employees.getById(id);
      return result.success ? result.data : null;
    } catch (error) {
      console.error("[EMPLOYEES_SERVICE] Error getting employee:", error);
      return null;
    }
  },

  create: async (employeeData) => {
    try {
      const result = await EdgeFunctions.employees.create(employeeData);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error creating employee");
      }
    } catch (error) {
      console.error("[EMPLOYEES_SERVICE] Error creating employee:", error);
      throw error;
    }
  },

  update: async (id, employeeData) => {
    try {
      const result = await EdgeFunctions.employees.update(id, employeeData);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error updating employee");
      }
    } catch (error) {
      console.error("[EMPLOYEES_SERVICE] Error updating employee:", error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const result = await EdgeFunctions.employees.delete(id);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error deleting employee");
      }
    } catch (error) {
      console.error("[EMPLOYEES_SERVICE] Error deleting employee:", error);
      throw error;
    }
  },
};

// ==================== APPOINTMENTS ====================
export const appointmentsService = {
  getAll: async () => {
    try {
      const result = await EdgeFunctions.appointments.getAll();
      return result.success ? result.data : [];
    } catch (error) {
      console.error(
        "[APPOINTMENTS_SERVICE] Error getting appointments:",
        error
      );
      return [];
    }
  },

  getById: async (id) => {
    try {
      const result = await EdgeFunctions.appointments.getById(id);
      return result.success ? result.data : null;
    } catch (error) {
      console.error("[APPOINTMENTS_SERVICE] Error getting appointment:", error);
      return null;
    }
  },

  getByClient: async (clientId) => {
    try {
      const result = await EdgeFunctions.appointments.getByClient(clientId);
      return result.success ? result.data : [];
    } catch (error) {
      console.error(
        "[APPOINTMENTS_SERVICE] Error getting appointments by client:",
        error
      );
      return [];
    }
  },

  getByEmployee: async (employeeId) => {
    try {
      const result = await EdgeFunctions.appointments.getByEmployee(employeeId);
      return result.success ? result.data : [];
    } catch (error) {
      console.error(
        "[APPOINTMENTS_SERVICE] Error getting appointments by employee:",
        error
      );
      return [];
    }
  },

  getByDateRange: async (startDate, endDate) => {
    try {
      const result = await EdgeFunctions.appointments.getByDateRange(
        startDate,
        endDate
      );
      return result.success ? result.data : [];
    } catch (error) {
      console.error(
        "[APPOINTMENTS_SERVICE] Error getting appointments by date range:",
        error
      );
      return [];
    }
  },

  create: async (appointmentData) => {
    try {
      const result = await EdgeFunctions.appointments.create(appointmentData);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error creating appointment");
      }
    } catch (error) {
      console.error(
        "[APPOINTMENTS_SERVICE] Error creating appointment:",
        error
      );
      throw error;
    }
  },

  update: async (id, appointmentData) => {
    try {
      const result = await EdgeFunctions.appointments.update(
        id,
        appointmentData
      );
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error updating appointment");
      }
    } catch (error) {
      console.error(
        "[APPOINTMENTS_SERVICE] Error updating appointment:",
        error
      );
      throw error;
    }
  },

  updateStatus: async (id, status) => {
    try {
      const result = await EdgeFunctions.appointments.updateStatus(id, status);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error updating appointment status");
      }
    } catch (error) {
      console.error(
        "[APPOINTMENTS_SERVICE] Error updating appointment status:",
        error
      );
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const result = await EdgeFunctions.appointments.delete(id);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error deleting appointment");
      }
    } catch (error) {
      console.error(
        "[APPOINTMENTS_SERVICE] Error deleting appointment:",
        error
      );
      throw error;
    }
  },

  checkAvailability: async (employeeId, date, time) => {
    try {
      const result = await EdgeFunctions.appointments.checkAvailability(
        employeeId,
        date,
        time
      );
      return result.success ? result.data : false;
    } catch (error) {
      console.error(
        "[APPOINTMENTS_SERVICE] Error checking availability:",
        error
      );
      return false;
    }
  },
};

// ==================== INVENTORY ====================
export const inventoryService = {
  getAll: async () => {
    try {
      const result = await EdgeFunctions.inventory.getAll();
      return result.success ? result.data : [];
    } catch (error) {
      console.error("[INVENTORY_SERVICE] Error getting inventory:", error);
      return [];
    }
  },

  getById: async (id) => {
    try {
      const result = await EdgeFunctions.inventory.getById(id);
      return result.success ? result.data : null;
    } catch (error) {
      console.error("[INVENTORY_SERVICE] Error getting product:", error);
      return null;
    }
  },

  create: async (productData) => {
    try {
      const result = await EdgeFunctions.inventory.create(productData);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error creating product");
      }
    } catch (error) {
      console.error("[INVENTORY_SERVICE] Error creating product:", error);
      throw error;
    }
  },

  update: async (id, productData) => {
    try {
      const result = await EdgeFunctions.inventory.update(id, productData);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error updating product");
      }
    } catch (error) {
      console.error("[INVENTORY_SERVICE] Error updating product:", error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const result = await EdgeFunctions.inventory.delete(id);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error deleting product");
      }
    } catch (error) {
      console.error("[INVENTORY_SERVICE] Error deleting product:", error);
      throw error;
    }
  },
};

// ==================== DASHBOARD ====================
export const dashboardService = {
  getData: async () => {
    try {
      const result = await EdgeFunctions.dashboard.getData();
      return result.success ? result.data : null;
    } catch (error) {
      console.error("[DASHBOARD_SERVICE] Error getting dashboard data:", error);
      return null;
    }
  },

  getFinancial: async () => {
    try {
      // Usar endpoint específico de dashboard financiero
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/dashboard/financial`,
        {
          headers: {
            Authorization: `Bearer ${await getAuthToken()}`,
            apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
          },
        }
      );
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error("[DASHBOARD_SERVICE] Error getting financial data:", error);
      return null;
    }
  },

  getTrend: async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/dashboard/trend`,
        {
          headers: {
            Authorization: `Bearer ${await getAuthToken()}`,
            apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
          },
        }
      );
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error("[DASHBOARD_SERVICE] Error getting trend data:", error);
      return null;
    }
  },

  getInventory: async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/dashboard/inventory`,
        {
          headers: {
            Authorization: `Bearer ${await getAuthToken()}`,
            apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
          },
        }
      );
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error("[DASHBOARD_SERVICE] Error getting inventory data:", error);
      return null;
    }
  },
};

// ==================== SERVICES ====================
export const servicesService = {
  getAll: async () => {
    try {
      const result = await EdgeFunctions.services.getAll();
      return result.success ? result.data : [];
    } catch (error) {
      console.error("[SERVICES_SERVICE] Error getting services:", error);
      return [];
    }
  },

  getById: async (id) => {
    try {
      const result = await EdgeFunctions.services.getById(id);
      return result.success ? result.data : null;
    } catch (error) {
      console.error("[SERVICES_SERVICE] Error getting service:", error);
      return null;
    }
  },

  getAllAdmin: async () => {
    try {
      const result = await EdgeFunctions.services.getAllAdmin();
      return result.success ? result.data : [];
    } catch (error) {
      console.error("[SERVICES_SERVICE] Error getting admin services:", error);
      return [];
    }
  },

  create: async (serviceData) => {
    try {
      const result = await EdgeFunctions.services.create(serviceData);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error creating service");
      }
    } catch (error) {
      console.error("[SERVICES_SERVICE] Error creating service:", error);
      throw error;
    }
  },

  update: async (id, serviceData) => {
    try {
      const result = await EdgeFunctions.services.update(id, serviceData);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error updating service");
      }
    } catch (error) {
      console.error("[SERVICES_SERVICE] Error updating service:", error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const result = await EdgeFunctions.services.delete(id);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error deleting service");
      }
    } catch (error) {
      console.error("[SERVICES_SERVICE] Error deleting service:", error);
      throw error;
    }
  },
};

// ==================== EXPENSES ====================
export const expensesService = {
  getAll: async () => {
    try {
      const result = await EdgeFunctions.expenses.getAll();
      return result.success ? result.data : [];
    } catch (error) {
      console.error("[EXPENSES_SERVICE] Error getting expenses:", error);
      return [];
    }
  },

  getById: async (id) => {
    try {
      const result = await EdgeFunctions.expenses.getById(id);
      return result.success ? result.data : null;
    } catch (error) {
      console.error("[EXPENSES_SERVICE] Error getting expense:", error);
      return null;
    }
  },

  getByMonth: async (year, month) => {
    try {
      const result = await EdgeFunctions.expenses.getByMonth(year, month);
      return result.success ? result.data : [];
    } catch (error) {
      console.error(
        "[EXPENSES_SERVICE] Error getting expenses by month:",
        error
      );
      return [];
    }
  },

  getPaginated: async (page, limit) => {
    try {
      const result = await EdgeFunctions.expenses.getPaginated(page, limit);
      return result.success ? result.data : [];
    } catch (error) {
      console.error(
        "[EXPENSES_SERVICE] Error getting paginated expenses:",
        error
      );
      return [];
    }
  },

  create: async (expenseData) => {
    try {
      const result = await EdgeFunctions.expenses.create(expenseData);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error creating expense");
      }
    } catch (error) {
      console.error("[EXPENSES_SERVICE] Error creating expense:", error);
      throw error;
    }
  },

  update: async (id, expenseData) => {
    try {
      const result = await EdgeFunctions.expenses.update(id, expenseData);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error updating expense");
      }
    } catch (error) {
      console.error("[EXPENSES_SERVICE] Error updating expense:", error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const result = await EdgeFunctions.expenses.delete(id);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error deleting expense");
      }
    } catch (error) {
      console.error("[EXPENSES_SERVICE] Error deleting expense:", error);
      throw error;
    }
  },
};

// ==================== INCOME ====================
export const incomeService = {
  getAll: async () => {
    try {
      const result = await EdgeFunctions.income.getAll();
      return result.success ? result.data : [];
    } catch (error) {
      console.error("[INCOME_SERVICE] Error getting income:", error);
      return [];
    }
  },

  getById: async (id) => {
    try {
      const result = await EdgeFunctions.income.getById(id);
      return result.success ? result.data : null;
    } catch (error) {
      console.error("[INCOME_SERVICE] Error getting income:", error);
      return null;
    }
  },

  create: async (incomeData) => {
    try {
      const result = await EdgeFunctions.income.create(incomeData);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error creating income");
      }
    } catch (error) {
      console.error("[INCOME_SERVICE] Error creating income:", error);
      throw error;
    }
  },

  update: async (id, incomeData) => {
    try {
      const result = await EdgeFunctions.income.update(id, incomeData);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error updating income");
      }
    } catch (error) {
      console.error("[INCOME_SERVICE] Error updating income:", error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const result = await EdgeFunctions.income.delete(id);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error deleting income");
      }
    } catch (error) {
      console.error("[INCOME_SERVICE] Error deleting income:", error);
      throw error;
    }
  },
};

// ==================== LEAVES ====================
export const leavesService = {
  getAll: async () => {
    try {
      const result = await EdgeFunctions.leaves.getAll();
      return result.success ? result.data : [];
    } catch (error) {
      console.error("[LEAVES_SERVICE] Error getting leaves:", error);
      return [];
    }
  },

  getById: async (id) => {
    try {
      const result = await EdgeFunctions.leaves.getById(id);
      return result.success ? result.data : null;
    } catch (error) {
      console.error("[LEAVES_SERVICE] Error getting leave:", error);
      return null;
    }
  },

  create: async (leaveData) => {
    try {
      const result = await EdgeFunctions.leaves.create(leaveData);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error creating leave");
      }
    } catch (error) {
      console.error("[LEAVES_SERVICE] Error creating leave:", error);
      throw error;
    }
  },

  update: async (id, leaveData) => {
    try {
      const result = await EdgeFunctions.leaves.update(id, leaveData);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error updating leave");
      }
    } catch (error) {
      console.error("[LEAVES_SERVICE] Error updating leave:", error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const result = await EdgeFunctions.leaves.delete(id);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error deleting leave");
      }
    } catch (error) {
      console.error("[LEAVES_SERVICE] Error deleting leave:", error);
      throw error;
    }
  },
};

// ==================== ORDERS ====================
export const ordersService = {
  getAll: async () => {
    try {
      const result = await EdgeFunctions.orders.getAll();
      return result.success ? result.data : [];
    } catch (error) {
      console.error("[ORDERS_SERVICE] Error getting orders:", error);
      return [];
    }
  },

  getById: async (id) => {
    try {
      const result = await EdgeFunctions.orders.getById(id);
      return result.success ? result.data : null;
    } catch (error) {
      console.error("[ORDERS_SERVICE] Error getting order:", error);
      return null;
    }
  },

  create: async (orderData) => {
    try {
      const result = await EdgeFunctions.orders.create(orderData);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error creating order");
      }
    } catch (error) {
      console.error("[ORDERS_SERVICE] Error creating order:", error);
      throw error;
    }
  },

  update: async (id, orderData) => {
    try {
      const result = await EdgeFunctions.orders.update(id, orderData);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error updating order");
      }
    } catch (error) {
      console.error("[ORDERS_SERVICE] Error updating order:", error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const result = await EdgeFunctions.orders.delete(id);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error deleting order");
      }
    } catch (error) {
      console.error("[ORDERS_SERVICE] Error deleting order:", error);
      throw error;
    }
  },
};

// ==================== ORDER DETAILS ====================
export const orderDetailsService = {
  getAll: async () => {
    try {
      const result = await EdgeFunctions.orderDetails.getAll();
      return result.success ? result.data : [];
    } catch (error) {
      console.error(
        "[ORDER_DETAILS_SERVICE] Error getting order details:",
        error
      );
      return [];
    }
  },

  getById: async (id) => {
    try {
      const result = await EdgeFunctions.orderDetails.getById(id);
      return result.success ? result.data : null;
    } catch (error) {
      console.error(
        "[ORDER_DETAILS_SERVICE] Error getting order detail:",
        error
      );
      return null;
    }
  },

  create: async (orderDetailData) => {
    try {
      const result = await EdgeFunctions.orderDetails.create(orderDetailData);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error creating order detail");
      }
    } catch (error) {
      console.error(
        "[ORDER_DETAILS_SERVICE] Error creating order detail:",
        error
      );
      throw error;
    }
  },

  update: async (id, orderDetailData) => {
    try {
      const result = await EdgeFunctions.orderDetails.update(
        id,
        orderDetailData
      );
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error updating order detail");
      }
    } catch (error) {
      console.error(
        "[ORDER_DETAILS_SERVICE] Error updating order detail:",
        error
      );
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const result = await EdgeFunctions.orderDetails.delete(id);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error deleting order detail");
      }
    } catch (error) {
      console.error(
        "[ORDER_DETAILS_SERVICE] Error deleting order detail:",
        error
      );
      throw error;
    }
  },
};

// ==================== SALES ====================
export const salesService = {
  getAll: async () => {
    try {
      const result = await EdgeFunctions.sales.getAll();
      return result.success ? result.data : [];
    } catch (error) {
      console.error("[SALES_SERVICE] Error getting sales:", error);
      return [];
    }
  },

  getById: async (id) => {
    try {
      const result = await EdgeFunctions.sales.getById(id);
      return result.success ? result.data : null;
    } catch (error) {
      console.error("[SALES_SERVICE] Error getting sale:", error);
      return null;
    }
  },

  getByClient: async (clientId) => {
    try {
      const result = await EdgeFunctions.sales.getByClient(clientId);
      return result.success ? result.data : [];
    } catch (error) {
      console.error("[SALES_SERVICE] Error getting sales by client:", error);
      return [];
    }
  },

  getByEmployee: async (employeeId) => {
    try {
      const result = await EdgeFunctions.sales.getByEmployee(employeeId);
      return result.success ? result.data : [];
    } catch (error) {
      console.error("[SALES_SERVICE] Error getting sales by employee:", error);
      return [];
    }
  },

  getByDateRange: async (startDate, endDate) => {
    try {
      const result = await EdgeFunctions.sales.getByDateRange(
        startDate,
        endDate
      );
      return result.success ? result.data : [];
    } catch (error) {
      console.error(
        "[SALES_SERVICE] Error getting sales by date range:",
        error
      );
      return [];
    }
  },

  create: async (saleData) => {
    try {
      const result = await EdgeFunctions.sales.create(saleData);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error creating sale");
      }
    } catch (error) {
      console.error("[SALES_SERVICE] Error creating sale:", error);
      throw error;
    }
  },

  update: async (id, saleData) => {
    try {
      const result = await EdgeFunctions.sales.update(id, saleData);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error updating sale");
      }
    } catch (error) {
      console.error("[SALES_SERVICE] Error updating sale:", error);
      throw error;
    }
  },

  updateStatus: async (id, status) => {
    try {
      const result = await EdgeFunctions.sales.updateStatus(id, status);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error updating sale status");
      }
    } catch (error) {
      console.error("[SALES_SERVICE] Error updating sale status:", error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const result = await EdgeFunctions.sales.delete(id);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error deleting sale");
      }
    } catch (error) {
      console.error("[SALES_SERVICE] Error deleting sale:", error);
      throw error;
    }
  },

  generateDocument: async (id) => {
    try {
      const result = await EdgeFunctions.sales.generateDocument(id);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error generating sale document");
      }
    } catch (error) {
      console.error("[SALES_SERVICE] Error generating sale document:", error);
      throw error;
    }
  },

  updateInventory: async (id) => {
    try {
      const result = await EdgeFunctions.sales.updateInventory(id);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error updating inventory");
      }
    } catch (error) {
      console.error("[SALES_SERVICE] Error updating inventory:", error);
      throw error;
    }
  },

  executeDailyClosure: async (date, total, notes) => {
    try {
      const result = await EdgeFunctions.sales.executeDailyClosure(
        date,
        total,
        notes
      );
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error executing daily closure");
      }
    } catch (error) {
      console.error("[SALES_SERVICE] Error executing daily closure:", error);
      throw error;
    }
  },

  checkDailyClosure: async (date) => {
    try {
      const result = await EdgeFunctions.sales.checkDailyClosure(date);
      return result.success ? result.data : null;
    } catch (error) {
      console.error("[SALES_SERVICE] Error checking daily closure:", error);
      return null;
    }
  },
};

// ==================== SETTINGS ====================
export const settingsService = {
  getAll: async () => {
    try {
      const result = await EdgeFunctions.settings.getAll();
      return result.success ? result.data : [];
    } catch (error) {
      console.error("[SETTINGS_SERVICE] Error getting settings:", error);
      return [];
    }
  },

  getById: async (id) => {
    try {
      const result = await EdgeFunctions.settings.getById(id);
      return result.success ? result.data : null;
    } catch (error) {
      console.error("[SETTINGS_SERVICE] Error getting setting:", error);
      return null;
    }
  },

  create: async (settingData) => {
    try {
      const result = await EdgeFunctions.settings.create(settingData);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error creating setting");
      }
    } catch (error) {
      console.error("[SETTINGS_SERVICE] Error creating setting:", error);
      throw error;
    }
  },

  update: async (id, settingData) => {
    try {
      const result = await EdgeFunctions.settings.update(id, settingData);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error updating setting");
      }
    } catch (error) {
      console.error("[SETTINGS_SERVICE] Error updating setting:", error);
      throw error;
    }
  },
};

// ==================== SHIFTS ====================
export const shiftsService = {
  getAll: async () => {
    try {
      const result = await EdgeFunctions.shifts.getAll();
      return result.success ? result.data : [];
    } catch (error) {
      console.error("[SHIFTS_SERVICE] Error getting shifts:", error);
      return [];
    }
  },

  getById: async (id) => {
    try {
      const result = await EdgeFunctions.shifts.getById(id);
      return result.success ? result.data : null;
    } catch (error) {
      console.error("[SHIFTS_SERVICE] Error getting shift:", error);
      return null;
    }
  },

  getByDate: async (date) => {
    try {
      const result = await EdgeFunctions.shifts.getByDate(date);
      return result.success ? result.data : [];
    } catch (error) {
      console.error("[SHIFTS_SERVICE] Error getting shifts by date:", error);
      return [];
    }
  },

  getByMonth: async (year, month) => {
    try {
      const result = await EdgeFunctions.shifts.getByMonth(year, month);
      return result.success ? result.data : [];
    } catch (error) {
      console.error("[SHIFTS_SERVICE] Error getting shifts by month:", error);
      return [];
    }
  },

  getWithEmployeeInfo: async () => {
    try {
      const result = await EdgeFunctions.shifts.getWithEmployeeInfo();
      return result.success ? result.data : [];
    } catch (error) {
      console.error(
        "[SHIFTS_SERVICE] Error getting shifts with employee info:",
        error
      );
      return [];
    }
  },

  getMonthlyForExport: async (year, month) => {
    try {
      const result = await EdgeFunctions.shifts.getMonthlyForExport(
        year,
        month
      );
      return result.success ? result.data : [];
    } catch (error) {
      console.error("[SHIFTS_SERVICE] Error getting shifts for export:", error);
      return [];
    }
  },

  create: async (shiftData) => {
    try {
      const result = await EdgeFunctions.shifts.create(shiftData);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error creating shift");
      }
    } catch (error) {
      console.error("[SHIFTS_SERVICE] Error creating shift:", error);
      throw error;
    }
  },

  save: async (shiftData) => {
    try {
      const result = await EdgeFunctions.shifts.save(shiftData);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error saving shift");
      }
    } catch (error) {
      console.error("[SHIFTS_SERVICE] Error saving shift:", error);
      throw error;
    }
  },

  update: async (id, shiftData) => {
    try {
      const result = await EdgeFunctions.shifts.update(id, shiftData);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error updating shift");
      }
    } catch (error) {
      console.error("[SHIFTS_SERVICE] Error updating shift:", error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const result = await EdgeFunctions.shifts.delete(id);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error deleting shift");
      }
    } catch (error) {
      console.error("[SHIFTS_SERVICE] Error deleting shift:", error);
      throw error;
    }
  },

  deleteInterval: async (id) => {
    try {
      const result = await EdgeFunctions.shifts.deleteInterval(id);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error deleting shift interval");
      }
    } catch (error) {
      console.error("[SHIFTS_SERVICE] Error deleting shift interval:", error);
      throw error;
    }
  },

  copyFromPreviousWeek: async (weekData) => {
    try {
      const result = await EdgeFunctions.shifts.copyFromPreviousWeek(weekData);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(
          result.error || "Error copying shifts from previous week"
        );
      }
    } catch (error) {
      console.error(
        "[SHIFTS_SERVICE] Error copying shifts from previous week:",
        error
      );
      throw error;
    }
  },
};

// ==================== SUPPLIERS ====================
export const suppliersService = {
  getAll: async () => {
    try {
      const result = await EdgeFunctions.suppliers.getAll();
      return result.success ? result.data : [];
    } catch (error) {
      console.error("[SUPPLIERS_SERVICE] Error getting suppliers:", error);
      return [];
    }
  },

  getById: async (id) => {
    try {
      const result = await EdgeFunctions.suppliers.getById(id);
      return result.success ? result.data : null;
    } catch (error) {
      console.error("[SUPPLIERS_SERVICE] Error getting supplier:", error);
      return null;
    }
  },

  create: async (supplierData) => {
    try {
      const result = await EdgeFunctions.suppliers.create(supplierData);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error creating supplier");
      }
    } catch (error) {
      console.error("[SUPPLIERS_SERVICE] Error creating supplier:", error);
      throw error;
    }
  },

  update: async (id, supplierData) => {
    try {
      const result = await EdgeFunctions.suppliers.update(id, supplierData);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error updating supplier");
      }
    } catch (error) {
      console.error("[SUPPLIERS_SERVICE] Error updating supplier:", error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const result = await EdgeFunctions.suppliers.delete(id);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error deleting supplier");
      }
    } catch (error) {
      console.error("[SUPPLIERS_SERVICE] Error deleting supplier:", error);
      throw error;
    }
  },
};

// ==================== USERS ====================
export const usersService = {
  getAll: async () => {
    try {
      const result = await EdgeFunctions.users.getAll();
      return result.success ? result.data : [];
    } catch (error) {
      console.error("[USERS_SERVICE] Error getting users:", error);
      return [];
    }
  },

  getById: async (id) => {
    try {
      const result = await EdgeFunctions.users.getById(id);
      return result.success ? result.data : null;
    } catch (error) {
      console.error("[USERS_SERVICE] Error getting user:", error);
      return null;
    }
  },

  create: async (userData) => {
    try {
      const result = await EdgeFunctions.users.create(userData);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error creating user");
      }
    } catch (error) {
      console.error("[USERS_SERVICE] Error creating user:", error);
      throw error;
    }
  },

  update: async (id, userData) => {
    try {
      const result = await EdgeFunctions.users.update(id, userData);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error updating user");
      }
    } catch (error) {
      console.error("[USERS_SERVICE] Error updating user:", error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const result = await EdgeFunctions.users.delete(id);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error deleting user");
      }
    } catch (error) {
      console.error("[USERS_SERVICE] Error deleting user:", error);
      throw error;
    }
  },
};

// ==================== FILES ====================
export const filesService = {
  getSignedUrl: async (fileName, bucketName = "media") => {
    try {
      const result = await EdgeFunctions.files.getSignedUrl(
        fileName,
        bucketName
      );
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Error getting signed URL");
      }
    } catch (error) {
      console.error("[FILES_SERVICE] Error getting signed URL:", error);
      throw error;
    }
  },
};

// Helper function para obtener token
const getAuthToken = async () => {
  try {
    const { supabase } = await import("../config/supabase");
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
};

// ==================== EXPORTS ====================
export default {
  auth: authService,
  companies: companiesService,
  alerts: alertsService,
  clients: clientsService,
  employees: employeesService,
  appointments: appointmentsService,
  inventory: inventoryService,
  dashboard: dashboardService,
  services: servicesService,
};

// Exportaciones individuales para compatibilidad
export {
  authService as Auth,
  companiesService as Companies,
  alertsService as Alerts,
  clientsService as Clients,
  employeesService as Employees,
  appointmentsService as Appointments,
  inventoryService as Inventory,
  dashboardService as Dashboard,
  servicesService as Services,
};
