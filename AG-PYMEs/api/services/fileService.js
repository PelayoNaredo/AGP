import { Platform } from "react-native";
import { settingsEndpoint, fileEndpoint } from "../endpoints";
import { httpFetch, getHeaders, http } from "../http";
// No necesitamos importar defaultHeaders directamente
// ya que los obtenemos a través de getHeaders
import tokenStorage from "./tokenStorage";
import { NGROK_HOST } from "@env";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 segundo

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Función para normalizar URLs de imágenes
export const normalizeImageUrl = (url) => {
  if (!url) return null;

  try {
    const baseUrl = NGROK_HOST || "http://localhost:3001";

    // Si ya es una URL completa, la devolvemos
    if (url.startsWith("http")) {
      return url;
    }

    // Si es una ruta relativa, la completamos
    if (url.startsWith("/")) {
      return `${baseUrl}${url}`;
    }

    // Si es solo el nombre del archivo, generamos la URL con firma
    return createSignedImageUrl(url, baseUrl);
  } catch (error) {
    console.error("[FileService] Error normalizando URL:", error);
    return url;
  }
};

// Función para crear una URL firmada para imágenes
export const createSignedImageUrl = async (filename, baseUrl = null) => {
  try {
    if (!filename) {
      console.warn(
        "[FileService] Nombre de archivo no proporcionado para URL firmada"
      );
      return null;
    }

    // Determinar si el nombre del archivo es realmente una URL completa
    let filenameOnly = filename;
    if (typeof filename === "string" && filename.includes("/")) {
      filenameOnly = filename.split("/").pop().split("?")[0];
    }

    // Si el objeto tiene una propiedad name, usarla
    if (typeof filename === "object" && filename.name) {
      filenameOnly = filename.name;
    }

    // Si es una ruta o URI completa con nombre de archivo, extraer solo el nombre
    if (typeof filename === "object" && filename.uri) {
      filenameOnly = filename.uri.split("/").pop().split("?")[0];
    }

    const base = baseUrl || NGROK_HOST || "http://localhost:3001";
    const token = await tokenStorage.getToken();

    if (!token) {
      console.warn("[FileService] No hay token disponible para URL firmada");
      return `${base}/api/media/${filenameOnly}`;
    }

    // Obtener la firma desde el backend usando httpFetch
    const data = await httpFetch(`${base}/api/generate-signed-url`, {
      method: "POST",
      body: { filename: filenameOnly },
    });

    // La URL firmada completa viene en la respuesta
    return data.signedUrl;
  } catch (error) {
    console.error("[FileService] Error creando URL firmada:", error);
    // Fallback a URL tradicional
    const base = baseUrl || NGROK_HOST || "http://localhost:3001";
    return `${base}/api/media/${typeof filename === "string" ? filename : "image"}`;
  }
};

// Función para extraer el nombre de archivo de una URL
export const getFilenameFromUrl = (url) => {
  if (!url) return "";

  // Intentar extraer con expresión regular
  const match = url.match(/\/([^\/]+)(\?|$)/);
  if (match && match[1]) {
    return match[1];
  }

  // Fallback: tomar la última parte de la URL
  const parts = url.split("/");
  const lastPart = parts[parts.length - 1].split("?")[0];
  return lastPart || "";
};

const compressImage = async (file) => {
  if (Platform.OS !== "web") {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Reducir el tamaño si es necesario
          const MAX_SIZE = 1200;
          if (width > MAX_SIZE || height > MAX_SIZE) {
            if (width > height) {
              height = (MAX_SIZE * height) / width;
              width = MAX_SIZE;
            } else {
              width = (MAX_SIZE * width) / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              // Conservar el nombre y tipo original
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: file.lastModified,
              });
              resolve(compressedFile);
            },
            file.type,
            0.7
          );
        } catch (error) {
          console.error("Error comprimiendo imagen:", error);
          resolve(file); // En caso de error, devolver archivo original
        }
      };
      img.onerror = () => reject(new Error("Error cargando imagen"));
      img.src = event.target.result;
    };
    reader.onerror = () => reject(new Error("Error leyendo archivo"));
    reader.readAsDataURL(file);
  });
};

// Esta función está duplicada con getHeaders en http.js
// Podemos eliminarla y usar directamente httpFetch que ya maneja los headers

export const uploadFile = async (file, retryCount = 0) => {
  try {
    const token = await tokenStorage.getToken();
    if (!token) {
      throw new Error("No hay token disponible para subir el archivo");
    }

    const formData = new FormData();

    if (Platform.OS === "web" && file.originalFile) {
      // Si estamos en web y tenemos el archivo original, lo usamos
      formData.append("logo", file.originalFile);
    } else {
      formData.append("logo", file);
    }

    // Usamos httpFetch con isUpload=true para uploads
    const data = await httpFetch(settingsEndpoint.logo(), {
      method: "PUT",
      body: formData,
      isUpload: true,
    });

    // Normalizar la URL devuelta por el servidor
    if (data.url) {
      data.url = normalizeImageUrl(data.url);
    }

    if (data.path) {
      data.path = normalizeImageUrl(data.path);
    }

    return data;
  } catch (error) {
    console.error("[FileService] Error en uploadFile:", error);

    // Reintento en caso de error de red
    if (
      (error.message.includes("network") ||
        error.message.includes("connection")) &&
      retryCount < MAX_RETRIES
    ) {
      await wait(RETRY_DELAY);
      return uploadFile(file, retryCount + 1);
    }

    if (error.status === 401) {
      await tokenStorage.removeToken();
    }
    throw error;
  }
};

// Función específica para cargar imágenes que maneja casos especiales
// Función específica para cargar imágenes que maneja casos especiales
export const loadImage = async (imageUrl) => {
  if (!imageUrl) return null;

  // Obtener token para autenticación
  const token = await tokenStorage.getToken();
  if (!token) {
    console.warn("[FileService] No hay token disponible para cargar la imagen");
  }

  const normalizedUrl = normalizeImageUrl(imageUrl);

  // Añadir timestamp para evitar caché
  const timestamp = Date.now();
  const urlWithNoCache = `${normalizedUrl}${normalizedUrl.includes("?") ? "&" : "?"}nocache=${timestamp}`;

  const headers = {
    "ngrok-skip-browser-warning": "true",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    // Crear una promesa para cargar la imagen
    return new Promise((resolve, reject) => {
      if (Platform.OS === "web") {
        // En web, realizamos una solicitud fetch con el token para obtener la imagen
        fetch(urlWithNoCache, {
          method: "GET",
          headers: headers,
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`Error cargando imagen: ${response.status}`);
            }
            // Una vez verificado que podemos acceder, cargamos la imagen
            const img = new Image();
            img.onload = () => resolve(urlWithNoCache);
            img.onerror = () => reject(new Error("Error cargando imagen"));
            img.crossOrigin = "anonymous";
            img.src = urlWithNoCache;
          })
          .catch((err) => reject(err));
      } else {
        // En mobile, devolvemos un objeto con la URI y headers para que puedan
        // usarse en componentes como Image de React Native
        resolve({
          uri: urlWithNoCache,
          headers: headers,
        });
      }
    });
  } catch (error) {
    console.error("[FileService] Error cargando imagen:", error);
    throw error;
  }
};

export const downloadFile = async (url, options = {}) => {
  try {
    // Determinar si la URL ya es firmada (contiene parámetro signature)
    const isSignedUrl = url.includes("signature=");
    let requestUrl = url;

    // Normalizar la URL si no es firmada
    if (!isSignedUrl) {
      requestUrl = normalizeImageUrl(url);
    }

    // Añadir timestamp para evitar caché
    const timestamp = new Date().getTime();
    let urlWithCache = `${requestUrl}${requestUrl.includes("?") ? "&" : "?"}t=${timestamp}`;

    // Si es una descarga (no solo vista previa), añadir parámetro
    if (options.download) {
      urlWithCache += "&download=true";
    }

    // Aquí no podemos usar directamente httpFetch porque necesitamos la respuesta original
    // para manipular el blob/stream, pero podemos usar getHeaders para obtener headers consistentes

    // Obtenemos los headers desde http.js
    const headers = await getHeaders();

    // Añadimos headers específicos para la descarga
    headers["Cache-Control"] = "no-cache";

    // Añadimos headers adicionales si existen
    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    // Realizar solicitud con modo "cors" explícito y credentials
    const response = await fetch(urlWithCache, {
      method: "GET",
      headers,
      credentials: "include",
      mode: "cors",
    });

    if (!response.ok) {
      if (response.status === 401) {
        await tokenStorage.removeToken();
      }
      throw new Error(`Error al descargar el archivo: ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error("[FileService] Error en downloadFile:", error);
    throw error;
  }
};

export const deleteFile = async (filename) => {
  try {
    // Verificar si es una URL completa o solo un nombre de archivo
    let fileToDelete = filename;

    // Si es una URL completa, extraer solo el nombre del archivo
    if (typeof filename === "string" && filename.includes("/")) {
      fileToDelete = filename.split("/").pop().split("?")[0];
    }

    // Si el objeto tiene una propiedad name, usarla
    if (typeof filename === "object" && filename.name) {
      fileToDelete = filename.name;
    }

    // Si es una ruta o URI completa con nombre de archivo, extraer solo el nombre
    if (typeof filename === "object" && filename.uri) {
      fileToDelete = filename.uri.split("/").pop().split("?")[0];
    }

    if (!fileToDelete) {
      throw new Error("Nombre de archivo no válido");
    }

    const token = await tokenStorage.getToken();
    if (!token) {
      throw new Error("No hay token disponible para eliminar el archivo");
    } // Usamos httpFetch para eliminar el archivo
    await httpFetch(fileEndpoint.deleteFile(fileToDelete), {
      method: "DELETE",
    });

    return true;
  } catch (error) {
    console.error("[FileService] Error eliminando archivo:", error);
    return false;
  }
};
