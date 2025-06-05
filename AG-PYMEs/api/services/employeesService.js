import { httpFetch } from "../http";
import { employeesEndpoint } from "../endpoints";

export const getAllEmployees = async () => {
  try {
    const response = await httpFetch(employeesEndpoint.base());
    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error("Error al obtener los empleados:", error);
    return [];
  }
};

export const getEmployeeById = async (id) => {
  try {
    return await httpFetch(employeesEndpoint.byId(id));
  } catch (error) {
    console.error("Error al obtener el empleado:", error);
    throw error;
  }
};

export const createEmployee = async (employeeData) => {
  try {
    // Verificar si hay documentos adjuntos
    const hasDocuments =
      employeeData.documento_adjunto &&
      employeeData.documento_adjunto.some(
        (doc) => typeof doc === "object" && doc.originalFile
      );

    if (hasDocuments) {
      // Crear FormData para subir archivos
      const formData = new FormData();

      // Formatear fecha si existe
      const fecha_contratacion = employeeData.fecha_contratacion
        ? new Date(employeeData.fecha_contratacion).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      // Agregar datos del empleado
      Object.keys(employeeData).forEach((key) => {
        if (key !== "documento_adjunto") {
          formData.append(
            key,
            key === "fecha_contratacion"
              ? fecha_contratacion
              : key === "salario"
                ? parseFloat(employeeData[key])
                : key === "activo"
                  ? Boolean(employeeData[key])
                  : employeeData[key]
          );
        }
      });

      // Agregar documentos
      employeeData.documento_adjunto.forEach((doc) => {
        if (doc.originalFile) {
          formData.append("documents", doc.originalFile);
        }
      });

      const response = await httpFetch(employeesEndpoint.base(), {
        method: "POST",
        body: formData,
        isUpload: true,
      });

      return response;
    } else {
      // Formatear fecha si existe
      const formattedData = {
        ...employeeData,
        fecha_contratacion: employeeData.fecha_contratacion
          ? new Date(employeeData.fecha_contratacion)
              .toISOString()
              .split("T")[0]
          : new Date().toISOString().split("T")[0],
        // Asegurar que el salario es número
        salario: parseFloat(employeeData.salario),
        // Asegurar que activo es booleano
        activo: Boolean(employeeData.activo),
      };

      const response = await httpFetch(employeesEndpoint.base(), {
        method: "POST",
        body: formattedData,
      });

      return response;
    }
  } catch (error) {
    console.error("Error al crear el empleado:", error);
    throw error;
  }
};

export const updateEmployee = async (id, employeeData) => {
  try {
    // Verificar si hay documentos adjuntos
    const hasDocuments =
      employeeData.documento_adjunto &&
      employeeData.documento_adjunto.some(
        (doc) => typeof doc === "object" && doc.originalFile
      );

    if (hasDocuments) {
      // Crear FormData para subir archivos
      const formData = new FormData();

      // Agregar datos del empleado
      Object.keys(employeeData).forEach((key) => {
        if (key !== "documento_adjunto") {
          formData.append(key, employeeData[key]);
        }
      });

      // Agregar documentos
      employeeData.documento_adjunto.forEach((doc, index) => {
        if (typeof doc === "string") {
          // Si es una cadena (documento existente), agregarlo al formData como string
          formData.append(`documento_existente_${index}`, doc);
        } else if (doc.originalFile) {
          // Si es un objeto con originalFile, agregar el archivo
          formData.append("documents", doc.originalFile);
        }
      });

      const response = await httpFetch(employeesEndpoint.documents(id), {
        method: "POST",
        body: formData,
        isUpload: true,
      });

      return response;
    } else {
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

      const response = await httpFetch(employeesEndpoint.update(id), {
        method: "PUT",
        body: formattedData,
      });

      return response;
    }
  } catch (error) {
    console.error("Error al actualizar el empleado:", error);
    throw error;
  }
};

export const deleteEmployee = async (id) => {
  try {
    return await httpFetch(employeesEndpoint.byId(id), {
      method: "DELETE",
    });
  } catch (error) {
    console.error("Error al eliminar el empleado:", error);
    throw error;
  }
};
