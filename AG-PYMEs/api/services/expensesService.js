import { httpFetch } from "../http";
import { expensesEndpoint } from "../endpoints";

export const getExpenses = async () => {
  try {
    return await httpFetch(expensesEndpoint.base());
  } catch (error) {
    console.error("Error al obtener los gastos:", error);
    throw error;
  }
};

export const getExpenseById = async (id) => {
  try {
    return await httpFetch(expensesEndpoint.byId(id));
  } catch (error) {
    console.error("Error al obtener el gasto:", error);
    throw error;
  }
};

export const createExpense = async (expenseData) => {
  try {
    return await httpFetch(expensesEndpoint.base(), {
      method: "POST",
      body: expenseData,
    });
  } catch (error) {
    console.error("Error al crear el gasto:", error);
    throw error;
  }
};

export const updateExpense = async (id, expenseData) => {
  try {
    return await httpFetch(expensesEndpoint.byId(id), {
      method: "PUT",
      body: expenseData,
    });
  } catch (error) {
    console.error("Error al actualizar el gasto:", error);
    throw error;
  }
};

export const deleteExpense = async (id) => {
  try {
    return await httpFetch(expensesEndpoint.byId(id), {
      method: "DELETE",
    });
  } catch (error) {
    console.error("Error al eliminar el gasto:", error);
    throw error;
  }
};

export const getExpensesPaginated = async (
  page = 1,
  itemsPerPage = 50,
  search = ""
) => {
  try {
    return await httpFetch(
      `${expensesEndpoint.base()}?page=${page}&limit=${itemsPerPage}&search=${search}`
    );
  } catch (error) {
    console.error("Error al obtener los gastos paginados:", error);
    throw error;
  }
};

export const getExpensesByMonth = async (month, year, search = "") => {
  try {
    return await httpFetch(
      `${expensesEndpoint.base()}/month?month=${month}&year=${year}&search=${search}`
    );
  } catch (error) {
    console.error("Error al obtener los gastos del mes:", error);
    throw error;
  }
};
