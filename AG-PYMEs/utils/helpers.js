export const safeToFixed = (value, decimals = 2) => {
  try {
    const numericValue =
      typeof value === "string"
        ? parseFloat(value.replace(",", ".").replace(/[^0-9.-]/g, ""))
        : Number(value);

    if (isNaN(numericValue)) {
      return "0.00";
    }

    return numericValue.toLocaleString("es-ES", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: true,
    });
  } catch (error) {
    console.error("Error formateando número:", error);
    return "0.00";
  }
};

export const formatDate = (dateString) => {
  try {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    if (isNaN(date)) return "Fecha inválida";

    const options = {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
    };

    return date.toLocaleDateString("es-ES", options);
  } catch (error) {
    console.error("Error formateando fecha:", error);
    return "N/A";
  }
};

export const formatPhoneNumber = (phone) => {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  const match = cleaned.match(/^(\d{2,3})?(\d{3})(\d{3})(\d{4})$/);

  if (match) {
    const intlCode = match[1] ? `+${match[1]} ` : "";
    return `${intlCode}(${match[2]}) ${match[3]}-${match[4]}`;
  }

  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
  }

  return phone;
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const hexToRgb = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
};

/**
 * Formatea una hora en formato HH:MM:SS a HH:MM
 * @param {string} timeString - La cadena de hora a formatear (ej: "12:30:00")
 * @returns {string} - La hora formateada sin segundos (ej: "12:30")
 */
export const formatTime = (timeString) => {
  if (!timeString) return "";
  // Si el formato ya es HH:MM, lo devolvemos tal cual
  if (timeString.length === 5) return timeString;
  // Si tiene formato HH:MM:SS, cortamos los segundos
  return timeString.substring(0, 5);
};

/**
 * Formatea una fecha y hora para mostrar en la interfaz de usuario
 * @param {string} dateTimeString - La cadena de fecha/hora a formatear (ej: "2023-12-31T15:30:00")
 * @returns {string} - La fecha y hora formateada (ej: "31/12/2023 15:30")
 */
export const formatDateTime = (dateTimeString) => {
  try {
    if (!dateTimeString) return "N/A";

    const date = new Date(dateTimeString);
    if (isNaN(date)) return "Fecha inválida";

    const options = {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    };

    return date.toLocaleDateString("es-ES", options);
  } catch (error) {
    console.error("Error formateando fecha y hora:", error);
    return "N/A";
  }
};

/**
 * Normaliza los datos de respuesta de servicios API
 * Maneja tanto arrays directos como objetos wrapped con data/items
 * @param {any} response - La respuesta de la API
 * @returns {Array} - Array normalizado de datos
 */
export const normalizeAPIResponse = (response) => {
  // Si es null o undefined, devolver array vacío
  if (!response) {
    return [];
  }

  // Si es array directo, devolverlo
  if (Array.isArray(response)) {
    return response;
  }

  // Si es un objeto de error, devolver array vacío
  if (response && response.success === false) {
    console.warn("🚨 Respuesta de API con error:", {
      error: response.error,
      status: response.status,
      details: response.details,
    });
    return [];
  }

  // Si tiene data y es array
  if (response && Array.isArray(response.data)) {
    return response.data;
  }

  // Si tiene items y es array
  if (response && Array.isArray(response.items)) {
    return response.items;
  }

  // Si tiene success=true pero data no es array
  if (response && response.success === true && response.data) {
    if (Array.isArray(response.data)) {
      return response.data;
    }
    // Si data es un objeto único, devolverlo como array de un elemento
    return [response.data];
  }

  // Si no se puede normalizar, devolver array vacío y advertir
  console.warn("⚠️ No se pudo normalizar la respuesta API:", {
    type: typeof response,
    keys:
      response && typeof response === "object" ? Object.keys(response) : "N/A",
    response: response,
  });
  return [];
};
