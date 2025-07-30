import { useState } from "react";
import { DocumentPicker } from "@react-native-picker/picker";
import { Services } from "../api/index";
import { NGROK_HOST } from "@env";
import useNotifications from "./useNotifications";

const useFileUpload = (config = {}) => {
  const { showError, showSuccess } = useNotifications();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedData, setUploadedData] = useState(null);

  const defaultConfig = {
    endpoint: "",
    method: "POST",
    fieldName: "file",
    allowedTypes: ["image/jpeg", "image/png", "application/pdf"],
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  };

  const finalConfig = {
    ...defaultConfig,
    ...config,
  };
  const getHeaders = async () => {
    const token = await Services.Storage.Token.getToken();
    return {
      "ngrok-skip-browser-warning": "true",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const validateFile = (file) => {
    if (file.size > finalConfig.maxSize) {
      throw new Error(
        `El archivo excede el límite de ${finalConfig.maxSize / 1024 / 1024}MB`
      );
    }

    if (!finalConfig.allowedTypes.includes(file.type)) {
      throw new Error("Tipo de archivo no permitido");
    }
  };

  const pickFiles = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: finalConfig.allowedTypes,
        allowMultiSelection: finalConfig.maxFiles > 1,
      });
      return result;
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        throw err;
      }
      return null;
    }
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append(finalConfig.fieldName, {
      uri: file.uri,
      name: file.name,
      type: file.type,
    });

    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (event) => {
      const progress = Math.round((event.loaded / event.total) * 100);
      setUploadProgress(progress);
    };

    return new Promise(async (resolve, reject) => {
      xhr.onreadystatechange = () => {
        if (xhr.readyState !== 4) return;

        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (e) {
            reject(new Error("Error al procesar la respuesta"));
          }
        } else {
          if (xhr.status === 401) {
            Services.Storage.Token.removeToken(); // Limpiar token si hay error de autenticación
          }
          reject(new Error(xhr.statusText || "Error en la subida"));
        }
      };

      const baseUrl = NGROK_HOST || "http://localhost:3001";
      const url = finalConfig.endpoint.startsWith("http")
        ? finalConfig.endpoint
        : `${baseUrl}${finalConfig.endpoint}`;

      xhr.open(finalConfig.method, url);

      // Configurar headers
      const headers = await getHeaders();
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      xhr.send(formData);
    });
  };

  const handleUpload = async () => {
    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(0);
      setUploadedData(null);

      const files = await pickFiles();
      if (!files) return;

      const uploadResults = [];

      for (const file of files) {
        validateFile(file);
        const result = await uploadFile(file);
        uploadResults.push(result);
      }

      setUploadedData(
        finalConfig.maxFiles === 1 ? uploadResults[0] : uploadResults
      );
      return uploadResults;
    } catch (error) {
      setError(error.message);
      showError("Error", error.message);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setIsUploading(false);
    setError(null);
    setUploadProgress(0);
    setUploadedData(null);
  };

  return {
    handleUpload,
    isUploading,
    uploadProgress,
    error,
    uploadedData,
    resetUpload,
  };
};

export default useFileUpload;
