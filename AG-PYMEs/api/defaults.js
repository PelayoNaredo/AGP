export const defaultHeaders = {
  Accept: "application/json",
  "Content-Type": "application/json",
  "User-Agent": "MyReactNativeApp/1.0",
  "ngrok-skip-browser-warning": "true",
};

export const fileUploadHeaders = {
  Accept: "application/json",
  "ngrok-skip-browser-warning": "true",
};

export const handleResponse = async (response) => {
  // Leer el cuerpo UNA SOLA VEZ
  const responseText = await response.text();

  if (!response.ok) {
    let errorData;
    try {
      errorData = responseText ? JSON.parse(responseText) : {};
    } catch {
      errorData = { message: responseText || "Error desconocido" };
    }

    const error = new Error(
      errorData.message || response.statusText || "Error en la solicitud"
    );
    error.status = response.status;
    error.data = errorData;

    throw error;
  }

  // Manejar respuestas exitosas
  try {
    const parsed = responseText ? JSON.parse(responseText) : null;
    return parsed;
  } catch (error) {
    console.warn("JSON parse failed, returning raw text");
    return responseText || null;
  }
};
