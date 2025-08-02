import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Variables de entorno
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "TU_SUPABASE_URL";
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "TU_ANON_KEY";

// Cliente principal con configuración para React Native
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper para obtener token de múltiples fuentes
const getAuthToken = async () => {
  try {
    // Método 1: Obtener de la sesión de Supabase (más confiable)
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      console.log("🔑 Token obtenido de sesión Supabase");
      return session.access_token;
    }

    // Método 2: Fallback al TokenStorage (para compatibilidad)
    const { default: TokenStorage } = await import(
      "../api/services/storage/tokenStorage"
    );
    const storedToken = await TokenStorage.getToken();

    if (storedToken) {
      console.log("🔑 Token obtenido de TokenStorage");
      return storedToken;
    }

    return null;
  } catch (error) {
    console.error("🚨 Error obteniendo token:", error);
    return null;
  }
};

// Helper para llamar tus Edge Functions con Hono
export const callEdgeFunction = async (
  functionName,
  payload = {},
  method = "POST",
  retries = 2,
  requireAuth = true // Nuevo parámetro para endpoints públicos
) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(
          `🔄 Reintentando llamada a ${functionName} (intento ${attempt + 1}/${retries + 1})`
        );
        // Pequeño delay entre reintentos
        await new Promise((resolve) => setTimeout(resolve, 200 * attempt));
      } else {
        console.log(`🔗 Calling Edge Function: ${functionName}`, payload);
      }

      let token = null;

      // Solo intentar obtener token si se requiere autenticación
      if (requireAuth) {
        token = await getAuthToken();

        if (!token) {
          if (attempt < retries) {
            console.warn(`⚠️ No se encontró token, reintentando...`);
            continue;
          }
          throw new Error("No authentication token available");
        }
      } else {
        console.log(
          `🔓 Endpoint público: ${functionName} (sin token requerido)`
        );
      }

      // URL específica para tus Edge Functions
      const url = `${supabaseUrl}/functions/v1/${functionName}`;

      const options = {
        method,
        headers: {
          "Content-Type": "application/json",
        },
      };

      // Solo agregar Authorization header si tenemos token
      if (token) {
        options.headers.Authorization = `Bearer ${token}`;
      }

      if (method !== "GET" && payload) {
        options.body = JSON.stringify(payload);
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      if (attempt > 0) {
        console.log(`✅ Éxito en reintento de ${functionName}:`, data);
      } else {
        console.log(`✅ Success calling ${functionName}:`, data);
      }
      return data;
    } catch (error) {
      if (attempt === retries) {
        console.error(
          `🚨 Error final calling ${functionName} después de ${retries + 1} intentos:`,
          error
        );
        throw error;
      } else {
        console.warn(
          `⚠️ Error en intento ${attempt + 1} de ${functionName}:`,
          error.message
        );
      }
    }
  }
};

// Edge Functions específicas mapeadas a tus controladores desplegados
export const EdgeFunctions = {
  // Companies - usando companies EdgeFunction
  companies: {
    getById: (id) => callEdgeFunction(`companies/${id}`, {}, "GET"),
    getCurrent: () => callEdgeFunction("companies/current", {}, "GET"),
    create: (companyData) => callEdgeFunction("companies", companyData, "POST"),
    update: (id, companyData) =>
      callEdgeFunction(`companies/${id}`, companyData, "PUT"),
    updateCurrent: (companyData) =>
      callEdgeFunction("companies/current", companyData, "PUT"),
    getSettings: (id) =>
      callEdgeFunction(`companies/${id}/settings`, {}, "GET"),
    updateSettings: (id, settings) =>
      callEdgeFunction(`companies/${id}/settings`, settings, "PUT"),
    getUsageStats: (id) => callEdgeFunction(`companies/${id}/usage`, {}, "GET"),
    getUsage: () => callEdgeFunction("companies/usage", {}, "GET"),
    validateLimit: (id, resource, amount = 1) =>
      callEdgeFunction(
        `companies/${id}/validate-limit`,
        { resource, amount },
        "POST"
      ),
    generateInvitation: (id) =>
      callEdgeFunction(`companies/${id}/invitation`, {}, "POST"),
    useInvitation: (invitationCode) =>
      callEdgeFunction("companies/join", { invitationCode }, "POST"),
    validateCode: (companyCode) =>
      callEdgeFunction(`companies/validate-code/${companyCode}`, {}, "GET"),
    getPlanDetails: (id) => callEdgeFunction(`companies/${id}/plan`, {}, "GET"),
    updatePlan: (id, newPlan) =>
      callEdgeFunction(
        `companies/${id}/plan`,
        { subscriptionPlan: newPlan },
        "PUT"
      ),
    getUsers: () => callEdgeFunction("companies/users", {}, "GET"),
    getLimits: () => callEdgeFunction("companies/limits", {}, "GET"),
  },

  // Registration y Authentication - usando login y register EdgeFunctions
  auth: {
    login: (credentials) =>
      callEdgeFunction("login/auth/login", credentials, "POST", 2, false), // Sin auth requerida
    register: (registrationData) =>
      callEdgeFunction("register", registrationData, "POST", 2, false), // Sin auth requerida
    sync: (email) =>
      callEdgeFunction(
        "login/auth/sync",
        { email, action: "login" },
        "POST",
        2,
        true
      ), // Con auth
    validateInvitation: (invitationCode) =>
      callEdgeFunction(
        "register/validate-invitation",
        { invitationCode },
        "POST",
        2,
        false
      ), // Sin auth
    checkCompanyCode: (companyCode) =>
      callEdgeFunction(
        "register/check-company-code",
        { companyCode },
        "POST",
        2,
        false
      ), // Sin auth
    getPlans: () => callEdgeFunction("register/plans", {}, "GET", 2, false), // Sin auth
    resetPassword: (email) =>
      callEdgeFunction(
        "login/auth/reset-password",
        { email },
        "POST",
        2,
        false
      ), // Sin auth
    changePassword: (passwords) =>
      callEdgeFunction(
        "login/auth/change-password",
        passwords,
        "POST",
        2,
        true
      ), // Con auth
    verify: () => callEdgeFunction("login/auth/verify", {}, "GET", 2, true), // Con auth
  },

  // Alerts - usando alerts EdgeFunction
  alerts: {
    getAll: () => callEdgeFunction("alerts", {}, "GET"),
    getById: (id) => callEdgeFunction(`alerts/${id}`, {}, "GET"),
    create: (alertData) => callEdgeFunction("alerts", alertData, "POST"),
    update: (id, alertData) =>
      callEdgeFunction(`alerts/${id}`, alertData, "PUT"),
    delete: (id) => callEdgeFunction(`alerts/${id}`, {}, "DELETE"),
  },

  // Clients - usando clients EdgeFunction
  clients: {
    getAll: () => callEdgeFunction("clients", {}, "GET"),
    getById: (id) => callEdgeFunction(`clients/${id}`, {}, "GET"),
    create: (clientData) => callEdgeFunction("clients", clientData, "POST"),
    update: (id, clientData) =>
      callEdgeFunction(`clients/${id}`, clientData, "PUT"),
    delete: (id) => callEdgeFunction(`clients/${id}`, {}, "DELETE"),
  },

  // Inventory - usando inventory EdgeFunction
  inventory: {
    getAll: () => callEdgeFunction("inventory", {}, "GET"),
    getById: (id) => callEdgeFunction(`inventory/${id}`, {}, "GET"),
    create: (productData) => callEdgeFunction("inventory", productData, "POST"),
    update: (id, productData) =>
      callEdgeFunction(`inventory/${id}`, productData, "PUT"),
    delete: (id) => callEdgeFunction(`inventory/${id}`, {}, "DELETE"),
  },

  // Employees - usando employees EdgeFunction
  employees: {
    getAll: () => callEdgeFunction("employees", {}, "GET"),
    getById: (id) => callEdgeFunction(`employees/${id}`, {}, "GET"),
    create: (employeeData) =>
      callEdgeFunction("employees", employeeData, "POST"),
    update: (id, employeeData) =>
      callEdgeFunction(`employees/${id}`, employeeData, "PUT"),
    delete: (id) => callEdgeFunction(`employees/${id}`, {}, "DELETE"),
  },

  // Appointments - usando appointments EdgeFunction
  appointments: {
    getAll: () => callEdgeFunction("appointments", {}, "GET"),
    getById: (id) => callEdgeFunction(`appointments/${id}`, {}, "GET"),
    getByClient: (clientId) =>
      callEdgeFunction(`appointments/client/${clientId}`, {}, "GET"),
    getByEmployee: (employeeId) =>
      callEdgeFunction(`appointments/employee/${employeeId}`, {}, "GET"),
    getByDateRange: (startDate, endDate) =>
      callEdgeFunction(
        "appointments/date-range",
        { startDate, endDate },
        "POST"
      ),
    create: (appointmentData) =>
      callEdgeFunction("appointments", appointmentData, "POST"),
    update: (id, appointmentData) =>
      callEdgeFunction(`appointments/${id}`, appointmentData, "PUT"),
    updateStatus: (id, status) =>
      callEdgeFunction(`appointments/${id}/status`, { status }, "PUT"),
    delete: (id) => callEdgeFunction(`appointments/${id}`, {}, "DELETE"),
    checkAvailability: (employeeId, date, time) =>
      callEdgeFunction(
        "appointments/check-availability",
        { employeeId, date, time },
        "POST"
      ),
  },

  // Sales - usando sales EdgeFunction
  sales: {
    getAll: () => callEdgeFunction("sales", {}, "GET"),
    getById: (id) => callEdgeFunction(`sales/${id}`, {}, "GET"),
    getByClient: (clientId) =>
      callEdgeFunction(`sales/client/${clientId}`, {}, "GET"),
    getByEmployee: (employeeId) =>
      callEdgeFunction(`sales/employee/${employeeId}`, {}, "GET"),
    getByDateRange: (startDate, endDate) =>
      callEdgeFunction("sales/date-range", { startDate, endDate }, "POST"),
    create: (saleData) => callEdgeFunction("sales", saleData, "POST"),
    update: (id, saleData) => callEdgeFunction(`sales/${id}`, saleData, "PUT"),
    updateStatus: (id, status) =>
      callEdgeFunction(`sales/${id}/status`, { status }, "PUT"),
    delete: (id) => callEdgeFunction(`sales/${id}`, {}, "DELETE"),
    generateDocument: (id) =>
      callEdgeFunction(`sales/${id}/document`, {}, "POST"),
    updateInventory: (id) =>
      callEdgeFunction(`sales/${id}/inventory`, {}, "PUT"),
    executeDailyClosure: () =>
      callEdgeFunction("sales/daily-closure", {}, "POST"),
    checkDailyClosure: () =>
      callEdgeFunction("sales/daily-closure/check", {}, "GET"),
  },

  // Expenses - usando expenses EdgeFunction
  expenses: {
    getAll: () => callEdgeFunction("expenses", {}, "GET"),
    getById: (id) => callEdgeFunction(`expenses/${id}`, {}, "GET"),
    getByMonth: (year, month) =>
      callEdgeFunction(`expenses/month/${year}/${month}`, {}, "GET"),
    getPaginated: (page, limit) =>
      callEdgeFunction("expenses/paginated", { page, limit }, "POST"),
    create: (expenseData) => callEdgeFunction("expenses", expenseData, "POST"),
    update: (id, expenseData) =>
      callEdgeFunction(`expenses/${id}`, expenseData, "PUT"),
    delete: (id) => callEdgeFunction(`expenses/${id}`, {}, "DELETE"),
  },

  // Income - usando income EdgeFunction
  income: {
    getAll: () => callEdgeFunction("income", {}, "GET"),
    getById: (id) => callEdgeFunction(`income/${id}`, {}, "GET"),
    create: (incomeData) => callEdgeFunction("income", incomeData, "POST"),
    update: (id, incomeData) =>
      callEdgeFunction(`income/${id}`, incomeData, "PUT"),
    delete: (id) => callEdgeFunction(`income/${id}`, {}, "DELETE"),
  },

  // Services - usando services EdgeFunction
  services: {
    getAll: () => callEdgeFunction("services", {}, "GET"),
    getById: (id) => callEdgeFunction(`services/${id}`, {}, "GET"),
    getAllAdmin: () => callEdgeFunction("services/admin", {}, "GET"),
    getByCategory: (category) =>
      callEdgeFunction(`services/category/${category}`, {}, "GET"),
    search: (query) => callEdgeFunction("services/search", { query }, "POST"),
    create: (serviceData) => callEdgeFunction("services", serviceData, "POST"),
    update: (id, serviceData) =>
      callEdgeFunction(`services/${id}`, serviceData, "PUT"),
    delete: (id) => callEdgeFunction(`services/${id}`, {}, "DELETE"),
  },

  // Suppliers - usando suppliers EdgeFunction
  suppliers: {
    getAll: () => callEdgeFunction("suppliers", {}, "GET"),
    getById: (id) => callEdgeFunction(`suppliers/${id}`, {}, "GET"),
    create: (supplierData) =>
      callEdgeFunction("suppliers", supplierData, "POST"),
    update: (id, supplierData) =>
      callEdgeFunction(`suppliers/${id}`, supplierData, "PUT"),
    delete: (id) => callEdgeFunction(`suppliers/${id}`, {}, "DELETE"),
  },

  // Dashboard - usando dashboard EdgeFunction
  dashboard: {
    getData: () => callEdgeFunction("dashboard", {}, "GET"),
    invalidateCache: () => callEdgeFunction("dashboard/invalidate", {}, "POST"),
  },

  // Orders - usando orders EdgeFunction
  orders: {
    getAll: () => callEdgeFunction("orders", {}, "GET"),
    getById: (id) => callEdgeFunction(`orders/${id}`, {}, "GET"),
    create: (orderData) => callEdgeFunction("orders", orderData, "POST"),
    update: (id, orderData) =>
      callEdgeFunction(`orders/${id}`, orderData, "PUT"),
    delete: (id) => callEdgeFunction(`orders/${id}`, {}, "DELETE"),
  },

  // Order Details - usando order-detail EdgeFunction
  orderDetails: {
    getAll: () => callEdgeFunction("order-detail", {}, "GET"),
    getById: (id) => callEdgeFunction(`order-detail/${id}`, {}, "GET"),
    create: (orderDetailData) =>
      callEdgeFunction("order-detail", orderDetailData, "POST"),
    update: (id, orderDetailData) =>
      callEdgeFunction(`order-detail/${id}`, orderDetailData, "PUT"),
    delete: (id) => callEdgeFunction(`order-detail/${id}`, {}, "DELETE"),
  },

  // Settings - usando settings EdgeFunction
  settings: {
    getAll: () => callEdgeFunction("settings", {}, "GET"),
    getById: (id) => callEdgeFunction(`settings/${id}`, {}, "GET"),
    create: (settingData) => callEdgeFunction("settings", settingData, "POST"),
    update: (id, settingData) =>
      callEdgeFunction(`settings/${id}`, settingData, "PUT"),
  },

  // Shifts - usando shifts EdgeFunction
  shifts: {
    getAll: () => callEdgeFunction("shifts", {}, "GET"),
    getById: (id) => callEdgeFunction(`shifts/${id}`, {}, "GET"),
    getByDate: (date) => callEdgeFunction(`shifts/date/${date}`, {}, "GET"),
    getByMonth: (year, month) =>
      callEdgeFunction(`shifts/month/${year}/${month}`, {}, "GET"),
    getWithEmployeeInfo: () =>
      callEdgeFunction("shifts/with-employee", {}, "GET"),
    getMonthlyForExport: (year, month) =>
      callEdgeFunction(`shifts/export/${year}/${month}`, {}, "GET"),
    create: (shiftData) => callEdgeFunction("shifts", shiftData, "POST"),
    save: (shiftData) => callEdgeFunction("shifts/save", shiftData, "POST"),
    update: (id, shiftData) =>
      callEdgeFunction(`shifts/${id}`, shiftData, "PUT"),
    delete: (id) => callEdgeFunction(`shifts/${id}`, {}, "DELETE"),
    deleteInterval: (id) =>
      callEdgeFunction(`shifts/${id}/interval`, {}, "DELETE"),
    copyFromPreviousWeek: (weekData) =>
      callEdgeFunction("shifts/copy-week", weekData, "POST"),
  },

  // Leaves - usando leaves EdgeFunction
  leaves: {
    getAll: () => callEdgeFunction("leaves", {}, "GET"),
    getById: (id) => callEdgeFunction(`leaves/${id}`, {}, "GET"),
    create: (leaveData) => callEdgeFunction("leaves", leaveData, "POST"),
    update: (id, leaveData) =>
      callEdgeFunction(`leaves/${id}`, leaveData, "PUT"),
    delete: (id) => callEdgeFunction(`leaves/${id}`, {}, "DELETE"),
  },

  // Users - usando users EdgeFunction
  users: {
    getAll: () => callEdgeFunction("users", {}, "GET"),
    getById: (id) => callEdgeFunction(`users/${id}`, {}, "GET"),
    create: (userData) => callEdgeFunction("users", userData, "POST"),
    update: (id, userData) => callEdgeFunction(`users/${id}`, userData, "PUT"),
    delete: (id) => callEdgeFunction(`users/${id}`, {}, "DELETE"),
  },

  // Files - usando signed-url EdgeFunction
  files: {
    getSignedUrl: (fileName, bucketName) =>
      callEdgeFunction("signed-url", { fileName, bucketName }, "POST"),
  },
};

// Test de conexión
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    console.log("🔗 Supabase connection test:", {
      session: !!data.session,
      error,
    });
    return !error;
  } catch (error) {
    console.error("❌ Supabase connection failed:", error);
    return false;
  }
};
