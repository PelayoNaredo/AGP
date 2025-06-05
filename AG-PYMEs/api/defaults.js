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
    return responseText ? JSON.parse(responseText) : null;
  } catch (error) {
    return responseText || null;
  }
};
