import { httpFetch } from "../http";
import { dashboardEndpoint } from "../endpoints";

export const getDashboardData = async () => {
  try {
    return await httpFetch(dashboardEndpoint.getDashboardData());
  } catch (error) {
    console.error("Error al obtener datos del dashboard:", error);
    throw error;
  }
};
