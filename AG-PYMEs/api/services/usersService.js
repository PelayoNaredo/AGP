import { EdgeFunctions } from "../../config/supabase";

export const createUser = async (userData) => {
  try {
    const result = await EdgeFunctions.users.create(userData);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al crear el usuario");
  } catch (error) {
    console.error("Error al crear el usuario:", error);
    throw error;
  }
};
