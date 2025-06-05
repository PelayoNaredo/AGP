import { httpFetch } from "../http";
import { usersEndpoint } from "../endpoints";

export const createUser = async (userData) => {
  try {
    return await httpFetch(usersEndpoint.base(), {
      method: "POST",
      body: userData,
    });
  } catch (error) {
    console.error("Error al crear el usuario:", error);
    throw error;
  }
};
