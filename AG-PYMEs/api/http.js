import { NGROK_HOST } from "@env";
import TokenStorage from "./services/storage/tokenStorage";
import { defaultHeaders, fileUploadHeaders, handleResponse } from "./defaults";

const baseURL = NGROK_HOST || "http://localhost:3001";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const getHeaders = async (isUpload = false) => {
  try {
    const token = await TokenStorage.getToken();
    const headers = {
      ...(isUpload ? fileUploadHeaders : defaultHeaders),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      console.warn("[DEBUG] No hay token disponible para la petición");
    }

    return headers;
  } catch (error) {
    console.error("[ERROR] Error al obtener headers:", error);
    return isUpload ? fileUploadHeaders : defaultHeaders;
  }
};

export const httpFetch = async (
  endpoint,
  { method = "GET", body = null, isUpload = false } = {},
  retryCount = 0
) => {
  try {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${baseURL}${endpoint}`;
    const headers = await getHeaders(isUpload);

    const config = {
      method,
      headers,
      credentials: "include",
    };

    if (body) {
      // Si el cuerpo ya es un string (ya está serializado) no lo serializa de nuevo
      config.body = isUpload
        ? body
        : typeof body === "string"
          ? body
          : JSON.stringify(body);
    }

    const response = await fetch(url, config);
    return await handleResponse(response);
  } catch (error) {
    console.error(`Error en httpFetch (intento ${retryCount + 1}):`, error);

    if (
      (error.message.includes("network") ||
        error.message.includes("Failed to fetch")) &&
      retryCount < MAX_RETRIES
    ) {
      await wait(RETRY_DELAY * (retryCount + 1));
      return httpFetch(endpoint, { method, body, isUpload }, retryCount + 1);
    }

    if (error.status === 401) {
      await TokenStorage.removeToken();
    }

    throw {
      status: error.status || 500,
      message: error.message || "Error de conexión",
      errors: error.errors,
    };
  }
};

export const http = {
  get: (endpoint) => httpFetch(endpoint),

  post: (endpoint, data, isUpload = false) =>
    httpFetch(endpoint, { method: "POST", body: data, isUpload }),

  put: (endpoint, data, isUpload = false) =>
    httpFetch(endpoint, { method: "PUT", body: data, isUpload }),

  delete: (endpoint) => httpFetch(endpoint, { method: "DELETE" }),

  patch: (endpoint, data) =>
    httpFetch(endpoint, { method: "PATCH", body: data }),
};
