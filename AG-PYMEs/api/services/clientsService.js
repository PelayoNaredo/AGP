import { httpFetch } from "../http";
import { clientsEndpoint } from "../endpoints";

export const getAllClients = async () => {
  try {
    const response = await httpFetch(clientsEndpoint.base());
    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error("Error al obtener los clientes:", error);
    return []; // Devolver array vacío en caso de error
  }
};

export const getClientById = async (id) => {
  try {
    return await httpFetch(clientsEndpoint.byId(id));
  } catch (error) {
    console.error("Error al obtener el cliente:", error);
    throw error;
  }
};

export const createClient = async (clientData) => {
  try {
    return await httpFetch(clientsEndpoint.base(), {
      method: "POST",
      body: clientData,
    });
  } catch (error) {
    console.error("Error al crear el cliente:", error);
    throw error;
  }
};

export const updateClient = async (id, clientData) => {
  try {
    return await httpFetch(clientsEndpoint.byId(id), {
      method: "PUT",
      body: clientData,
    });
  } catch (error) {
    console.error("Error al actualizar el cliente:", error);
    throw error;
  }
};

export const deleteClient = async (id) => {
  try {
    return await httpFetch(clientsEndpoint.byId(id), {
      method: "DELETE",
    });
  } catch (error) {
    console.error("Error al eliminar el cliente:", error);
    throw error;
  }
};
