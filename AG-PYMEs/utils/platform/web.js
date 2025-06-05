// Utilidades para almacenamiento web
const storage = {
  setItem: (key, value) => {
    try {
      const serialized =
        typeof value !== "string" ? JSON.stringify(value) : value;
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error("[WebAdapter] Error guardando en localStorage:", error);
      return false;
    }
  },

  getItem: (key) => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      try {
        return JSON.parse(item);
      } catch {
        return item;
      }
    } catch (error) {
      console.error("[WebAdapter] Error leyendo de localStorage:", error);
      return null;
    }
  },

  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error("[WebAdapter] Error eliminando de localStorage:", error);
      return false;
    }
  },
};

// Utilidades para manejo de archivos web
const fileSystem = {
  // Convertir Blob a URL de datos
  blobToDataUrl: (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  },

  // Convertir Blob a URL de objeto
  blobToObjectUrl: (blob) => {
    return URL.createObjectURL(blob);
  },

  // Limpiar URL de objeto
  revokeObjectUrl: (url) => {
    URL.revokeObjectURL(url);
  },

  // Convertir Base64 a Blob
  base64ToBlob: (base64, mimeType) => {
    const byteString = atob(base64.split(",")[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], { type: mimeType });
  },
};

// Utilidades para UI web
const ui = {
  // Verificar si estamos en modo pantalla completa
  isFullscreen: () => {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement
    );
  },

  // Solicitar pantalla completa para un elemento
  requestFullscreen: (element) => {
    if (element.requestFullscreen) {
      return element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      return element.webkitRequestFullscreen();
    } else if (element.mozRequestFullScreen) {
      return element.mozRequestFullScreen();
    }
    return Promise.reject("Fullscreen API no soportada");
  },

  // Salir de pantalla completa
  exitFullscreen: () => {
    if (document.exitFullscreen) {
      return document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      return document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      return document.mozCancelFullScreen();
    }
    return Promise.reject("Fullscreen API no soportada");
  },
};

// Exportación del adaptador completo
export default {
  storage,
  fileSystem,
  ui,
};
