import { EdgeFunctions } from "../../config/supabase";

export const getAllClients = async () => {
  try {
    const result = await EdgeFunctions.clients.getAll();

    if (result.success) {
      return Array.isArray(result.data) ? result.data : [];
    } else {
      console.error("Error en Edge Function:", result.error);
      return [];
    }
  } catch (error) {
    console.error("Error al obtener los clientes desde Edge Functions:", error);
    return []; // Devolver array vacío en caso de error
  }
};

export const getClientById = async (id) => {
  try {
    const result = await EdgeFunctions.clients.getById(id);

    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error || "Error obteniendo cliente");
    }
  } catch (error) {
    console.error("Error al obtener el cliente desde Edge Functions:", error);
    throw error;
  }
};

export const createClient = async (clientData) => {
  try {
    const result = await EdgeFunctions.clients.create(clientData);

    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error || "Error creando cliente");
    }
  } catch (error) {
    console.error("Error al crear el cliente con Edge Functions:", error);
    throw error;
  }
};

export const updateClient = async (id, clientData) => {
  try {
    const result = await EdgeFunctions.clients.update(id, clientData);

    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error || "Error actualizando cliente");
    }
  } catch (error) {
    console.error("Error al actualizar el cliente con Edge Functions:", error);
    throw error;
  }
};

export const deleteClient = async (id) => {
  try {
    const result = await EdgeFunctions.clients.delete(id);

    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error || "Error eliminando cliente");
    }
  } catch (error) {
    console.error("Error al eliminar el cliente con Edge Functions:", error);
    throw error;
  }
};

export const searchClients = async (term) => {
  try {
    if (!term || !term.trim()) {
      // Si no hay término de búsqueda, devolver todos los clientes
      return await getAllClients();
    }

    // Para búsqueda, obtenemos todos y filtramos localmente
    // Esto se puede optimizar más tarde con endpoint de búsqueda específico
    const allClients = await getAllClients();
    const filtered = allClients.filter(
      (client) =>
        client.nombre?.toLowerCase().includes(term.toLowerCase()) ||
        client.email?.toLowerCase().includes(term.toLowerCase()) ||
        client.telefono?.includes(term)
    );

    return filtered;
  } catch (error) {
    console.error("Error al buscar clientes:", error);
    return []; // Devolver array vacío en caso de error
  }
};
