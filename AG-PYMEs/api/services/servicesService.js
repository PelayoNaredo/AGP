import { EdgeFunctions } from "../../config/supabase";

export const getAllServices = async () => {
  try {
    const result = await EdgeFunctions.services.getAll();
    if (result.success) {
      return Array.isArray(result.data) ? result.data : [];
    }
    return [];
  } catch (error) {
    console.error("Error al obtener los servicios:", error);
    return []; // Devolver array vacío en caso de error
  }
};

export const getAllServicesAdmin = async () => {
  try {
    const result = await EdgeFunctions.services.getAllAdmin();
    if (result.success) {
      return result.data;
    }
    throw new Error(
      result.error || "Error al obtener todos los servicios (admin)"
    );
  } catch (error) {
    console.error("Error al obtener todos los servicios (admin):", error);
    throw error;
  }
};

export const getServiceById = async (id) => {
  try {
    const result = await EdgeFunctions.services.getById(id);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al obtener el servicio");
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

    const result = await EdgeFunctions.services.create(serviceData);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al crear el servicio");
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

    const result = await EdgeFunctions.services.update(id, serviceData);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al actualizar el servicio");
  } catch (error) {
    console.error("Error al actualizar el servicio:", error);
    throw error;
  }
};

export const deleteService = async (id) => {
  try {
    const result = await EdgeFunctions.services.delete(id);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al eliminar el servicio");
  } catch (error) {
    console.error("Error al eliminar el servicio:", error);
    throw error;
  }
};

export const getServicesByCategory = async (category) => {
  try {
    const result = await EdgeFunctions.services.getByCategory(category);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al obtener servicios por categoría");
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
    const result = await EdgeFunctions.services.search(term);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Error al buscar servicios");
  } catch (error) {
    console.error("Error al buscar servicios:", error);
    throw error;
  }
};
