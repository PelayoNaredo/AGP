import { NGROK_HOST } from "@env";

const BASE = NGROK_HOST;

export const alertsEndpoint = {
  base: () => `${BASE}/api/alerts`,
  byId: (id) => `${BASE}/api/alerts/${id}`,
};

export const authEndpoint = {
  login: () => `${BASE}/api/login`,
  verifyToken: () => `${BASE}/api/verify-token`,
};

// Nuevos endpoints para clientes
export const clientsEndpoint = {
  base: () => `${BASE}/api/clients`,
  byId: (id) => `${BASE}/api/clients/${id}`,
  search: (term) => `${BASE}/api/clients/search?term=${term}`,
};

// Nuevos endpoints para servicios
export const servicesEndpoint = {
  base: () => `${BASE}/api/services`,
  byId: (id) => `${BASE}/api/services/${id}`,
  admin: () => `${BASE}/api/services/admin`,
  byCategory: (category) => `${BASE}/api/services/category/${category}`,
  search: (term, activeOnly) =>
    `${BASE}/api/services/search?term=${term}${activeOnly ? "&activeOnly=true" : ""}`,
};

// Nuevos endpoints para citas
export const appointmentsEndpoint = {
  base: () => `${BASE}/api/appointments`,
  byId: (id) => `${BASE}/api/appointments/${id}`,
  byClient: (clientId) => `${BASE}/api/appointments/client/${clientId}`,
  byEmployee: (employeeId) => `${BASE}/api/appointments/employee/${employeeId}`,
  byDateRange: (startDate, endDate) =>
    `${BASE}/api/appointments/range?startDate=${startDate}&endDate=${endDate}&timezone=${encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone)}`,
  updateStatus: (id) => `${BASE}/api/appointments/${id}/status`,
  checkAvailability: (employeeId, startDate, endDate, appointmentId = null) =>
    `${BASE}/api/appointments/availability/check?employeeId=${employeeId}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}${appointmentId ? `&appointmentId=${appointmentId}` : ""}`,
};

// Nuevos endpoints para ventas
export const salesEndpoint = {
  base: () => `${BASE}/api/sales`,
  byId: (id) => `${BASE}/api/sales/${id}`,
  byClient: (clientId) => `${BASE}/api/sales/client/${clientId}`,
  byEmployee: (employeeId) => `${BASE}/api/sales/employee/${employeeId}`,
  byDateRange: (startDate, endDate) =>
    `${BASE}/api/sales/date-range?startDate=${startDate}&endDate=${endDate}`,
  updateStatus: (id) => `${BASE}/api/sales/${id}/status`,
  stats: (period) => `${BASE}/api/sales/stats/${period}`,
};

export const employeesEndpoint = {
  base: () => `${BASE}/api/employees`,
  byId: (id) => `${BASE}/api/employees/${id}`,
  update: (id) => `${BASE}/api/employees/${id}`,
  documents: (id) => `${BASE}/api/employees/${id}/documents`,
};

export const expensesEndpoint = {
  base: () => `${BASE}/api/expenses`,
  byId: (id) => `${BASE}/api/expenses/${id}`,
};

export const incomesEndpoint = {
  base: () => `${BASE}/api/income`,
  byId: (id) => `${BASE}/api/income/${id}`,
};

export const inventoryEndpoint = {
  base: () => `${BASE}/api/inventory`,
  byId: (id) => `${BASE}/api/inventory/${id}`,
};

export const leavesEndpoint = {
  base: () => `${BASE}/api/leaves`,
  byId: (id) => `${BASE}/api/leaves/${id}`,
};

export const orderDetailsEndpoint = {
  base: () => `${BASE}/api/order-details`,
  byId: (id) => `${BASE}/api/order-details/${id}`,
};

export const ordersEndpoint = {
  base: () => `${BASE}/api/orders`,
  byId: (id) => `${BASE}/api/orders/${id}`,
};

export const settingsEndpoint = {
  base: () => `${BASE}/api/settings`,
  byId: (id) => `${BASE}/api/settings/${id}`,
  logo: () => `${BASE}/api/settings/logo`,
};

export const fileEndpoint = {
  deleteFile: (filename) => `${BASE}/api/media/${filename}`,
};

export const shiftsEndpoint = {
  base: () => `${BASE}/api/shifts`,
  byId: (id) => `${BASE}/api/shifts/${id}`,
  byDate: (fecha) => `${BASE}/api/shifts/date/${fecha}`,
  byMonth: (year, month) => `${BASE}/api/shifts/month/${year}/${month}`,
  exportMonth: (fecha) => `${BASE}/api/shifts/export/month/${fecha}`,
  save: () => `${BASE}/api/shifts/save`,
  copy: (sourceWeek, targetWeek) =>
    `${BASE}/api/shifts/copy?source=${sourceWeek}&target=${targetWeek}`,
  intervals: {
    add: (shiftId) => `${BASE}/api/shifts/${shiftId}/intervals`,
    delete: (shiftId, intervalId) =>
      `${BASE}/api/shifts/${shiftId}/intervals/${intervalId}`,
  },
};

export const suppliersEndpoint = {
  base: () => `${BASE}/api/suppliers`,
  byId: (id) => `${BASE}/api/suppliers/${id}`,
};

export const usersEndpoint = {
  base: () => `${BASE}/api/users`,
};

export const dashboardEndpoint = {
  getDashboardData: () => `${BASE}/api/dashboard`,
};

export const BASE_URL = BASE;
