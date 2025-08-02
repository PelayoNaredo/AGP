import { EdgeFunctions } from "../../config/supabase";

export const getExpenses = async () => {
  try {
    const result = await EdgeFunctions.expenses.getAll();
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al obtener los gastos");
  } catch (error) {
    console.error("Error al obtener los gastos:", error);
    throw error;
  }
};

export const getExpenseById = async (id) => {
  try {
    const result = await EdgeFunctions.expenses.getById(id);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al obtener el gasto");
  } catch (error) {
    console.error("Error al obtener el gasto:", error);
    throw error;
  }
};

export const createExpense = async (expenseData) => {
  try {
    const result = await EdgeFunctions.expenses.create(expenseData);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al crear el gasto");
  } catch (error) {
    console.error("Error al crear el gasto:", error);
    throw error;
  }
};

export const updateExpense = async (id, expenseData) => {
  try {
    const result = await EdgeFunctions.expenses.update(id, expenseData);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al actualizar el gasto");
  } catch (error) {
    console.error("Error al actualizar el gasto:", error);
    throw error;
  }
};

export const deleteExpense = async (id) => {
  try {
    const result = await EdgeFunctions.expenses.delete(id);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al eliminar el gasto");
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
    const result = await EdgeFunctions.expenses.getPaginated(
      page,
      itemsPerPage
    );
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al obtener los gastos paginados");
  } catch (error) {
    console.error("Error al obtener los gastos paginados:", error);
    throw error;
  }
};

export const getExpensesByMonth = async (month, year, search = "") => {
  try {
    const result = await EdgeFunctions.expenses.getByMonth(year, month);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al obtener los gastos del mes");
  } catch (error) {
    console.error("Error al obtener los gastos del mes:", error);
    throw error;
  }
};
