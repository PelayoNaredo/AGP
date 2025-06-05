import { httpFetch } from "../http";
import { incomesEndpoint } from "../endpoints";

export const getIncomes = async (page = 1, pageSize = 20) => {
  try {
    const endpoint = `${incomesEndpoint.base()}?page=${page}&pageSize=${pageSize}`;
    const response = await httpFetch(endpoint);

    return response;
  } catch (error) {
    console.error("[IncomesService] Error al obtener los ingresos:", error);
    console.error("[IncomesService] Mensaje:", error.message);
    console.error("[IncomesService] Stack:", error.stack);
    throw error;
  }
};

export const getIncomeById = async (id) => {
  try {
    return await httpFetch(incomesEndpoint.byId(id));
  } catch (error) {
    console.error(`[IncomesService] Error al obtener el ingreso ${id}:`, error);
    throw error;
  }
};

export const createIncome = async (incomeData) => {
  try {
    const response = await httpFetch(incomesEndpoint.base(), {
      method: "POST",
      body: incomeData,
    });
    return response;
  } catch (error) {
    console.error("[IncomesService] Error al crear el ingreso:", error);
    throw error;
  }
};

export const updateIncome = async (id, incomeData) => {
  try {
    const response = await httpFetch(incomesEndpoint.byId(id), {
      method: "PUT",
      body: incomeData,
    });
    return response;
  } catch (error) {
    console.error(
      `[IncomesService] Error al actualizar el ingreso ${id}:`,
      error
    );
    throw error;
  }
};

export const deleteIncome = async (id) => {
  try {
    return await httpFetch(incomesEndpoint.byId(id), {
      method: "DELETE",
    });
  } catch (error) {
    console.error(
      `[IncomesService] Error al eliminar el ingreso ${id}:`,
      error
    );
    throw error;
  }
};
