import { EdgeFunctions } from "../../config/supabase";

export const getIncomes = async (page = 1, pageSize = 20) => {
  try {
    const result = await EdgeFunctions.income.getAll();
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al obtener los ingresos");
  } catch (error) {
    console.error("[IncomesService] Error al obtener los ingresos:", error);
    console.error("[IncomesService] Mensaje:", error.message);
    console.error("[IncomesService] Stack:", error.stack);
    throw error;
  }
};

export const getIncomeById = async (id) => {
  try {
    const result = await EdgeFunctions.income.getById(id);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al obtener el ingreso");
  } catch (error) {
    console.error(`[IncomesService] Error al obtener el ingreso ${id}:`, error);
    throw error;
  }
};

export const createIncome = async (incomeData) => {
  try {
    const result = await EdgeFunctions.income.create(incomeData);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al crear el ingreso");
  } catch (error) {
    console.error("[IncomesService] Error al crear el ingreso:", error);
    throw error;
  }
};

export const updateIncome = async (id, incomeData) => {
  try {
    const result = await EdgeFunctions.income.update(id, incomeData);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al actualizar el ingreso");
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
    const result = await EdgeFunctions.income.delete(id);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al eliminar el ingreso");
  } catch (error) {
    console.error(
      `[IncomesService] Error al eliminar el ingreso ${id}:`,
      error
    );
    throw error;
  }
};
