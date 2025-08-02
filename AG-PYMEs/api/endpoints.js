// EdgeFunctions endpoints configuration
// Los endpoints ahora usan las EdgeFunctions desplegadas en Supabase

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "TU_SUPABASE_URL";
const EDGE_FUNCTIONS_BASE = `${SUPABASE_URL}/functions/v1`;

export const alertsEndpoint = {
  base: () => `${EDGE_FUNCTIONS_BASE}/alerts`,
  byId: (id) => `${EDGE_FUNCTIONS_BASE}/alerts/${id}`,
};

export const authEndpoint = {
  login: () => `${EDGE_FUNCTIONS_BASE}/login`,
  verifyToken: () => `${EDGE_FUNCTIONS_BASE}/login/verify`,
  register: () => `${EDGE_FUNCTIONS_BASE}/register`,
};

// Endpoints para clientes
export const clientsEndpoint = {
  base: () => `${EDGE_FUNCTIONS_BASE}/clients`,
  byId: (id) => `${EDGE_FUNCTIONS_BASE}/clients/${id}`,
  search: (term) => `${EDGE_FUNCTIONS_BASE}/clients/search?term=${term}`,
};

// Endpoints para servicios
export const servicesEndpoint = {
  base: () => `${EDGE_FUNCTIONS_BASE}/services`,
  byId: (id) => `${EDGE_FUNCTIONS_BASE}/services/${id}`,
  admin: () => `${EDGE_FUNCTIONS_BASE}/services/admin`,
  byCategory: (category) =>
    `${EDGE_FUNCTIONS_BASE}/services/category/${category}`,
  search: (term, activeOnly) =>
    `${EDGE_FUNCTIONS_BASE}/services/search?term=${term}${activeOnly ? "&activeOnly=true" : ""}`,
};

// Endpoints para citas
export const appointmentsEndpoint = {
  base: () => `${EDGE_FUNCTIONS_BASE}/appointments`,
  byId: (id) => `${EDGE_FUNCTIONS_BASE}/appointments/${id}`,
  byClient: (clientId) =>
    `${EDGE_FUNCTIONS_BASE}/appointments/client/${clientId}`,
  byEmployee: (employeeId) =>
    `${EDGE_FUNCTIONS_BASE}/appointments/employee/${employeeId}`,
  byDateRange: (startDate, endDate) =>
    `${EDGE_FUNCTIONS_BASE}/appointments/range?startDate=${startDate}&endDate=${endDate}&timezone=${encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone)}`,
  updateStatus: (id) => `${EDGE_FUNCTIONS_BASE}/appointments/${id}/status`,
  checkAvailability: (employeeId, startDate, endDate, appointmentId = null) =>
    `${EDGE_FUNCTIONS_BASE}/appointments/availability/check?employeeId=${employeeId}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}${appointmentId ? `&appointmentId=${appointmentId}` : ""}`,
};

// Endpoints para ventas
export const salesEndpoint = {
  base: () => `${EDGE_FUNCTIONS_BASE}/sales`,
  byId: (id) => `${EDGE_FUNCTIONS_BASE}/sales/${id}`,
  byClient: (clientId) => `${EDGE_FUNCTIONS_BASE}/sales/client/${clientId}`,
  byEmployee: (employeeId) =>
    `${EDGE_FUNCTIONS_BASE}/sales/employee/${employeeId}`,
  byDateRange: (startDate, endDate) =>
    `${EDGE_FUNCTIONS_BASE}/sales/date-range?startDate=${startDate}&endDate=${endDate}`,
  updateStatus: (id) => `${EDGE_FUNCTIONS_BASE}/sales/${id}/status`,
  stats: (period) => `${EDGE_FUNCTIONS_BASE}/sales/stats/${period}`,
};

export const employeesEndpoint = {
  base: () => `${EDGE_FUNCTIONS_BASE}/employees`,
  byId: (id) => `${EDGE_FUNCTIONS_BASE}/employees/${id}`,
  update: (id) => `${EDGE_FUNCTIONS_BASE}/employees/${id}`,
  documents: (id) => `${EDGE_FUNCTIONS_BASE}/employees/${id}/documents`,
};

export const expensesEndpoint = {
  base: () => `${EDGE_FUNCTIONS_BASE}/expenses`,
  byId: (id) => `${EDGE_FUNCTIONS_BASE}/expenses/${id}`,
};

export const incomesEndpoint = {
  base: () => `${EDGE_FUNCTIONS_BASE}/income`,
  byId: (id) => `${EDGE_FUNCTIONS_BASE}/income/${id}`,
};

export const inventoryEndpoint = {
  base: () => `${EDGE_FUNCTIONS_BASE}/inventory`,
  byId: (id) => `${EDGE_FUNCTIONS_BASE}/inventory/${id}`,
};

export const leavesEndpoint = {
  base: () => `${EDGE_FUNCTIONS_BASE}/leaves`,
  byId: (id) => `${EDGE_FUNCTIONS_BASE}/leaves/${id}`,
};

export const orderDetailsEndpoint = {
  base: () => `${EDGE_FUNCTIONS_BASE}/order-details`,
  byId: (id) => `${EDGE_FUNCTIONS_BASE}/order-details/${id}`,
};

export const ordersEndpoint = {
  base: () => `${EDGE_FUNCTIONS_BASE}/orders`,
  byId: (id) => `${EDGE_FUNCTIONS_BASE}/orders/${id}`,
};

export const settingsEndpoint = {
  base: () => `${EDGE_FUNCTIONS_BASE}/settings`,
  byId: (id) => `${EDGE_FUNCTIONS_BASE}/settings/${id}`,
  logo: () => `${EDGE_FUNCTIONS_BASE}/settings/logo`,
};

export const fileEndpoint = {
  getSignedUrl: () => `${EDGE_FUNCTIONS_BASE}/signed-url`,
  deleteFile: (filename) => `${EDGE_FUNCTIONS_BASE}/signed-url/${filename}`,
};

export const shiftsEndpoint = {
  base: () => `${EDGE_FUNCTIONS_BASE}/shifts`,
  byId: (id) => `${EDGE_FUNCTIONS_BASE}/shifts/${id}`,
  byDate: (fecha) => `${EDGE_FUNCTIONS_BASE}/shifts/date/${fecha}`,
  byMonth: (year, month) =>
    `${EDGE_FUNCTIONS_BASE}/shifts/month/${year}/${month}`,
  exportMonth: (fecha) => `${EDGE_FUNCTIONS_BASE}/shifts/export/month/${fecha}`,
  save: () => `${EDGE_FUNCTIONS_BASE}/shifts/save`,
  copy: (sourceWeek, targetWeek) =>
    `${EDGE_FUNCTIONS_BASE}/shifts/copy?source=${sourceWeek}&target=${targetWeek}`,
  intervals: {
    add: (shiftId) => `${EDGE_FUNCTIONS_BASE}/shifts/${shiftId}/intervals`,
    delete: (shiftId, intervalId) =>
      `${EDGE_FUNCTIONS_BASE}/shifts/${shiftId}/intervals/${intervalId}`,
  },
};

export const suppliersEndpoint = {
  base: () => `${EDGE_FUNCTIONS_BASE}/suppliers`,
  byId: (id) => `${EDGE_FUNCTIONS_BASE}/suppliers/${id}`,
};

export const usersEndpoint = {
  base: () => `${EDGE_FUNCTIONS_BASE}/users`,
};

export const dashboardEndpoint = {
  getDashboardData: () => `${EDGE_FUNCTIONS_BASE}/dashboard`,
  getFinancial: () => `${EDGE_FUNCTIONS_BASE}/dashboard/financial`,
  getTrend: () => `${EDGE_FUNCTIONS_BASE}/dashboard/trend`,
  getInventory: () => `${EDGE_FUNCTIONS_BASE}/dashboard/inventory`,
  getAlerts: () => `${EDGE_FUNCTIONS_BASE}/dashboard/alerts`,
  getOrders: () => `${EDGE_FUNCTIONS_BASE}/dashboard/orders`,
};

export const companiesEndpoint = {
  base: () => `${EDGE_FUNCTIONS_BASE}/companies`,
  byId: (id) => `${EDGE_FUNCTIONS_BASE}/companies/${id}`,
  current: () => `${EDGE_FUNCTIONS_BASE}/companies/current`,
  settings: (id) => `${EDGE_FUNCTIONS_BASE}/companies/${id}/settings`,
  usage: () => `${EDGE_FUNCTIONS_BASE}/companies/usage`,
  limits: () => `${EDGE_FUNCTIONS_BASE}/companies/limits`,
  users: () => `${EDGE_FUNCTIONS_BASE}/companies/users`,
};

export const BASE_URL = EDGE_FUNCTIONS_BASE;
