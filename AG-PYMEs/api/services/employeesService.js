import { EdgeFunctions } from "../../config/supabase";

export const getAllEmployees = async () => {
  try {
    const result = await EdgeFunctions.employees.getAll();

    if (result.success) {
      return Array.isArray(result.data) ? result.data : [];
    } else {
      console.error("Error en Edge Function:", result.error);
      return [];
    }
  } catch (error) {
    console.error(
      "Error al obtener los empleados desde Edge Functions:",
      error
    );
    return [];
  }
};

export const getEmployeeById = async (id) => {
  try {
    const result = await EdgeFunctions.employees.getById(id);

    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error || "Error obteniendo empleado");
    }
  } catch (error) {
    console.error("Error al obtener el empleado desde Edge Functions:", error);
    throw error;
  }
};

export const createEmployee = async (employeeData) => {
  try {
    // Formatear datos antes de enviar
    const formattedData = {
      ...employeeData,
      fecha_contratacion: employeeData.fecha_contratacion
        ? new Date(employeeData.fecha_contratacion).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      salario: parseFloat(employeeData.salario || 0),
      activo: Boolean(employeeData.activo ?? true),
    };

    // TODO: Implementar manejo de documentos adjuntos con Supabase Storage
    if (employeeData.documento_adjunto) {
      console.warn(
        "Documentos adjuntos requieren implementación con Supabase Storage"
      );
      // Por ahora, removemos los documentos del objeto
      delete formattedData.documento_adjunto;
    }

    const result = await EdgeFunctions.employees.create(formattedData);

    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error || "Error creando empleado");
    }
  } catch (error) {
    console.error("Error al crear el empleado con Edge Functions:", error);
    throw error;
  }
};

export const updateEmployee = async (id, employeeData) => {
  try {
    // Formatear datos antes de enviar
    const formattedData = {
      ...employeeData,
      // Solo formatear fecha si existe
      ...(employeeData.fecha_contratacion && {
        fecha_contratacion: new Date(employeeData.fecha_contratacion)
          .toISOString()
          .split("T")[0],
      }),
      // Convertir salario a número si existe
      ...(employeeData.salario !== undefined && {
        salario: parseFloat(employeeData.salario),
      }),
      // Asegurar que activo es booleano si existe
      ...(employeeData.activo !== undefined && {
        activo: Boolean(employeeData.activo),
      }),
    };

    // TODO: Implementar manejo de documentos adjuntos con Supabase Storage
    if (employeeData.documento_adjunto) {
      console.warn(
        "Documentos adjuntos requieren implementación con Supabase Storage"
      );
      // Por ahora, removemos los documentos del objeto
      delete formattedData.documento_adjunto;
    }

    const result = await EdgeFunctions.employees.update(id, formattedData);

    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error || "Error actualizando empleado");
    }
  } catch (error) {
    console.error("Error al actualizar el empleado con Edge Functions:", error);
    throw error;
  }
};

export const deleteEmployee = async (id) => {
  try {
    const result = await EdgeFunctions.employees.delete(id);

    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error || "Error eliminando empleado");
    }
  } catch (error) {
    console.error("Error al eliminar el empleado con Edge Functions:", error);
    throw error;
  }
};
