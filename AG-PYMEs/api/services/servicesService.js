import { httpFetch } from "../http";
import { servicesEndpoint } from "../endpoints";

export const getAllServices = async () => {
  try {
    const response = await httpFetch(servicesEndpoint.base());
    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error("Error al obtener los servicios:", error);
    return []; // Devolver array vacío en caso de error
  }
};

export const getAllServicesAdmin = async () => {
  try {
    return await httpFetch(servicesEndpoint.admin());
  } catch (error) {
    console.error("Error al obtener todos los servicios (admin):", error);
    throw error;
  }
};

export const getServiceById = async (id) => {
  try {
    return await httpFetch(servicesEndpoint.byId(id));
  } catch (error) {
    console.error("Error al obtener el servicio:", error);
    throw error;
  }
};

export const createService = async (serviceData) => {
  try {
    // Validar que si es por_nivel tenga niveles
    if (
      serviceData.tipo_tarifa === "por_nivel" &&
      (!serviceData.niveles || serviceData.niveles.length === 0)
    ) {
      throw new Error(
        "Para servicios con tarifa por nivel, debe proporcionar al menos un nivel"
      );
    }

    return await httpFetch(servicesEndpoint.base(), {
      method: "POST",
      body: serviceData, // httpFetch ya se encargará de la serialización
    });
  } catch (error) {
    console.error("Error al crear el servicio:", error);
    throw error;
  }
};

export const updateService = async (id, serviceData) => {
  try {
    // Validar que si es por_nivel tenga niveles
    if (
      serviceData.tipo_tarifa === "por_nivel" &&
      (!serviceData.niveles || serviceData.niveles.length === 0)
    ) {
      throw new Error(
        "Para servicios con tarifa por nivel, debe proporcionar al menos un nivel"
      );
    }

    return await httpFetch(servicesEndpoint.byId(id), {
      method: "PUT",
      body: serviceData, // httpFetch ya se encargará de la serialización
    });
  } catch (error) {
    console.error("Error al actualizar el servicio:", error);
    throw error;
  }
};

export const deleteService = async (id) => {
  try {
    const response = await httpFetch(servicesEndpoint.byId(id), {
      method: "DELETE",
    });
    return response;
  } catch (error) {
    console.error("Error al eliminar el servicio:", error);
    throw error;
  }
};

export const getServicesByCategory = async (category) => {
  try {
    return await httpFetch(servicesEndpoint.byCategory(category));
  } catch (error) {
    console.error("Error al obtener servicios por categoría:", error);
    throw error;
  }
};

export const searchServices = async (term, activeOnly = true) => {
  try {
    if (!term) {
      return activeOnly ? await getAllServices() : await getAllServicesAdmin();
    }
    return await httpFetch(servicesEndpoint.search(term, activeOnly));
  } catch (error) {
    console.error("Error al buscar servicios:", error);
    throw error;
  }
};
