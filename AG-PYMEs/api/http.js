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
    }

    return headers;
  } catch (error) {
    console.error("Error al obtener headers:", error);
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
      config.body = isUpload
        ? body
        : typeof body === "string"
          ? body
          : JSON.stringify(body);
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      }

    const result = await handleResponse(response);
    return result;
  } catch (error) {
    console.error(
      `Error (attempt ${retryCount + 1}) for ${endpoint}:`,
      error.message
    );

    if (
      (error.message.includes("network") ||
        error.message.includes("Failed to fetch")) &&
      retryCount < MAX_RETRIES
    ) {
      console.log(`Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
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
