import React, { useEffect, useState } from "react";
import {
  View,
  Image,
  Text,
  StyleSheet,
  Platform,
  Alert,
  Linking,
} from "react-native";
import CustomButton from "./customButton";
import Icon from "react-native-vector-icons/Ionicons";
import { useTheme } from "../context/ThemeContext";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import ModalTemplate from "./modalTemplate";
import { Services, Components } from "../api";
import { NGROK_HOST } from "@env";

const { ImageWithAuth } = Components;

const FileUploader = ({
  files = [],
  onFileSelect,
  onDeleteFile,
  maxFiles = 5,
  allowedTypes = ["*/*", "application/pdf"], // Tipos permitidos
  uploadButtonStyle,
  previewStyle,
}) => {
  const { themeObject } = useTheme();
  const [confirmDeleteModalVisible, setConfirmDeleteModalVisible] =
    useState(false);
  const [fileIndexToDelete, setFileIndexToDelete] = useState(null);
  const [fileToDelete, setFileToDelete] = useState(null);

  // Función auxiliar para obtener el icono según el tipo de archivo
  const getFileIcon = (fileType) => {
    if (!fileType) return "document-outline";

    if (fileType.includes("png")) return "image-outline";
    if (fileType.includes("jpg")) return "image-outline";
    if (fileType.includes("jpeg")) return "image-outline";
    if (fileType.includes("pdf")) return "document-text-outline";
    if (
      fileType.includes("spreadsheet") ||
      fileType.includes("excel") ||
      fileType.includes("csv")
    )
      return "grid-outline";
    if (fileType.includes("document") || fileType.includes("word"))
      return "document-outline";
    if (fileType.includes("presentation") || fileType.includes("powerpoint"))
      return "easel-outline";
    if (fileType.includes("text/")) return "text-outline";
    if (fileType.includes("zip") || fileType.includes("compressed"))
      return "archive-outline";

    return "document-outline"; // Icono predeterminado para tipos desconocidos
  };

  // Limpiar URLs de objetos al desmontar el componente
  useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (Platform.OS === "web" && file.uri && file.uri.startsWith("blob:")) {
          URL.revokeObjectURL(file.uri);
        }
      });
    };
  }, [files]);

  // Función para manejar la subida de archivos
  const handleUpload = async () => {
    try {
      if (Platform.OS === "web") {
        const input = document.createElement("input");
        input.type = "file";
        input.multiple = maxFiles > 1;
        input.accept = allowedTypes.join(",");
        input.style.display = "none";
        const handleFileSelection = (e) => {
          const selectedFiles = Array.from(e.target.files).slice(
            0,
            maxFiles - files.length
          );

          if (selectedFiles.length === 0) {
            return;
          }

          const formattedFiles = selectedFiles.map((file) => {
            const uri = URL.createObjectURL(file);
            return {
              name: file.name,
              type: file.type,
              uri,
              size: file.size,
              originalFile: file,
            };
          });
          onFileSelect(formattedFiles);
        };

        input.addEventListener("change", handleFileSelection);
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: allowedTypes,
          multiple: true,
          copyToCacheDirectory: true,
        });

        if (
          result.type === "success" ||
          (Array.isArray(result.assets) && result.assets.length > 0)
        ) {
          const filesResult = Array.isArray(result.assets)
            ? result.assets
            : [result];
          // Limitar la cantidad de archivos a los que podemos añadir
          const filesToAdd = filesResult.slice(0, maxFiles - files.length);

          if (filesToAdd.length === 0) {
            return;
          }

          const formattedFiles = filesToAdd.map((file) => ({
            name: file.name || "Documento",
            type: file.mimeType || file.type || "*/*",
            uri: file.uri,
            size: file.size,
          }));
          onFileSelect(formattedFiles);
        }
      }
    } catch (err) {
      console.error("[DEBUG] Error en handleUpload:", err);
      Alert.alert("Error", "Error al seleccionar el archivo");
    }
  };

  // Función para manejar la eliminación de archivos
  const handleDelete = async (index) => {
    const fileToDelete = files[index];

    // Si es un archivo local (blob), simplemente liberamos la URL
    if (Platform.OS === "web" && fileToDelete?.uri?.startsWith("blob:")) {
      URL.revokeObjectURL(fileToDelete.uri);
      onDeleteFile(index);
      return;
    }

    // Para archivos del servidor, mostrar confirmación
    if (
      typeof fileToDelete === "string" ||
      (fileToDelete &&
        typeof fileToDelete === "object" &&
        fileToDelete.uri &&
        (fileToDelete.uri.startsWith("http") ||
          !fileToDelete.uri.startsWith("blob")))
    ) {
      // Mostrar modal de confirmación
      setFileToDelete(fileToDelete);
      setFileIndexToDelete(index);
      setConfirmDeleteModalVisible(true);
      return;
    }

    // Si no es un caso especial, simplemente eliminamos de la lista
    if (typeof onDeleteFile === "function") {
      onDeleteFile(index);
    } else {
      console.error("[ERROR] onDeleteFile no es una función:", onDeleteFile);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      // Usar directamente el servicio de eliminación de archivos
      await Services.File.deleteFile(fileToDelete);

      // Eliminar de la lista local
      if (typeof onDeleteFile === "function") {
        onDeleteFile(fileIndexToDelete);
      } else {
        console.error("[ERROR] onDeleteFile no es una función:", onDeleteFile);
      }
    } catch (error) {
      console.error("[FileUploader] Error al eliminar archivo:", error);
      // Incluso si falla, intentamos eliminar de la lista local
      if (typeof onDeleteFile === "function") {
        onDeleteFile(fileIndexToDelete);
      }
    } finally {
      // Cerrar el modal y limpiar estado
      setConfirmDeleteModalVisible(false);
      setFileIndexToDelete(null);
      setFileToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDeleteModalVisible(false);
    setFileIndexToDelete(null);
    setFileToDelete(null);
  };

  // Función para generar una URL de descarga directa con la configuración adecuada
  const downloadDirectly = (fileUrl, fileName) => {
    // Crear un enlace invisible en el DOM
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName || "archivo";
    link.rel = "noopener noreferrer"; // Mejora de seguridad
    link.target = "_blank"; // Abre en una nueva pestaña
    link.style.display = "none";

    // Añadir al DOM y simular clic
    document.body.appendChild(link);
    link.click();

    // Eliminar el enlace después
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
  };

  // Función para descargar archivos (disponible en web y móvil)
  const handleDownload = async (file) => {
    try {
      // Si es un archivo recién subido (con originalFile), usar la descarga directa
      if (
        Platform.OS === "web" &&
        file &&
        typeof file === "object" &&
        file.originalFile
      ) {
        // Si tenemos el archivo original (subido en esta sesión), usarlo directamente
        const blob = file.originalFile;
        const url = URL.createObjectURL(blob);

        downloadDirectly(url, file.name || "archivo");

        // Limpiar la URL creada después
        setTimeout(() => URL.revokeObjectURL(url), 100);
        return;
      }

      // Obtener nombre del archivo
      const fileName =
        typeof file === "string"
          ? Services.File.getFilenameFromUrl(file)
          : file.name ||
            (file.uri && Services.File.getFilenameFromUrl(file.uri)) ||
            "archivo";

      // Obtener la URL del archivo
      let fileUrl;
      if (typeof file === "string") {
        fileUrl = file;
      } else if (file && file.uri) {
        if (Platform.OS === "web" && file.uri.startsWith("blob:")) {
          // Para archivos blob locales, usar descarga directa
          const response = await fetch(file.uri);
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          downloadDirectly(url, fileName);
          setTimeout(() => URL.revokeObjectURL(url), 100);
          return;
        }
        fileUrl = file.uri;
      } else {
        throw new Error("Formato de archivo no reconocido");
      }

      // Verificar que tenemos una URL válida
      if (!fileUrl) {
        throw new Error("No se pudo obtener la URL del archivo");
      }

      if (Platform.OS === "web") {
        try {
          // Solución simple: Obtener token y abrir directamente en nueva pestaña
          const token = await Services.Storage.Token.getToken();
          if (!token) {
            throw new Error("No hay token disponible para descargar");
          }

          // Extraer solo el nombre del archivo de la URL
          let filenamePart = "";
          if (fileUrl.includes("/")) {
            filenamePart = fileUrl.split("/").pop().split("?")[0];
          } else {
            filenamePart = fileUrl;
          }

          // Construir la URL para descargar directamente
          const baseUrl = NGROK_HOST || "http://localhost:3001";
          const timestamp = Date.now(); // Evitar caché

          // Usar solo el endpoint que sabemos que funciona correctamente
          // Directamente abrir una nueva pestaña del navegador con la URL
          const downloadUrl = `${baseUrl}/api/media/${filenamePart}?t=${timestamp}&download=true&token=${token}`;
          window.open(downloadUrl, "_blank");
        } catch (error) {
          console.error("[FileUploader] Error en descarga web:", error);
          throw error;
        }
      } else {
        // En dispositivos móviles, usar expo-file-system
        // Primero mostrar indicador de progreso
        Alert.alert("Descargando", "El archivo se está descargando...");

        // Obtener el directorio de documentos para guardar
        const documentDirectory = FileSystem.documentDirectory;
        const localUri = `${documentDirectory}downloads/${fileName}`;

        // Asegurar que el directorio de descargas existe
        const downloadsDirectory = `${documentDirectory}downloads`;
        const dirInfo = await FileSystem.getInfoAsync(downloadsDirectory);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(downloadsDirectory, {
            intermediates: true,
          });
        }

        // Obtener token para autenticación
        const token = await Services.Storage.Token.getToken();

        // Configurar headers para la descarga
        const headers = {
          "ngrok-skip-browser-warning": "true",
          "Cache-Control": "no-cache",
        };

        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        // Preparar URL para descargar directamente
        let filenamePart = "";

        if (typeof fileUrl === "string") {
          // Extraer solo el nombre del archivo si es una ruta o URL
          if (fileUrl.includes("/")) {
            filenamePart = fileUrl.split("/").pop().split("?")[0];
          } else {
            filenamePart = fileUrl;
          }
        } else if (fileUrl && fileUrl.uri && typeof fileUrl.uri === "string") {
          // Si tenemos un objeto con uri, extraer el nombre
          if (fileUrl.uri.includes("/")) {
            filenamePart = fileUrl.uri.split("/").pop().split("?")[0];
          } else {
            filenamePart = fileUrl.uri;
          }
        } else {
          // En último caso, usar el nombre de archivo proporcionado
          filenamePart = fileName;
        }

        // Construir una URL directa y simple
        const baseUrl = NGROK_HOST || "http://localhost:3001";
        const downloadUrl = `${baseUrl}/api/media/${filenamePart}`;

        // Añadir timestamp para evitar caché y token para autenticación
        const timestamp = Date.now();
        const finalDownloadUrl = `${downloadUrl}?t=${timestamp}&download=true&token=${token}`;

        try {
          // Descargar el archivo
          const downloadResult = await FileSystem.downloadAsync(
            finalDownloadUrl,
            localUri,
            { headers }
          );

          // Verificar si la descarga fue exitosa
          if (downloadResult.status === 200) {
            Alert.alert(
              "Descarga completada",
              `El archivo se ha guardado en: ${localUri}`,
              [
                {
                  text: "OK",
                  onPress: () => {
                    // En Android podemos intentar abrir el archivo
                    if (Platform.OS === "android") {
                      FileSystem.getContentUriAsync(localUri).then(
                        (contentUri) => {
                          Linking.openURL(contentUri);
                        },
                        (error) => {
                          console.error("Error al obtener contentUri:", error);
                        }
                      );
                    } else if (Platform.OS === "ios") {
                      // En iOS, intentamos abrir el archivo
                      Linking.openURL(localUri).catch((error) => {
                        console.error("Error al abrir el archivo:", error);
                      });
                    }
                  },
                },
              ]
            );
          } else {
            throw new Error(`Error de descarga: ${downloadResult.status}`);
          }
        } catch (downloadError) {
          console.error(
            "[FileUploader] Error específico de descarga:",
            downloadError
          );
          Alert.alert(
            "Error",
            "No se pudo descargar el archivo. Detalles: " +
              downloadError.message
          );
        }
      }
    } catch (error) {
      console.error("[DEBUG] Error al descargar archivo:", error);
      Alert.alert(
        "Error",
        "No se pudo descargar el archivo. Intente nuevamente."
      );
    }
  };

  return (
    <View style={styles.container}>
      {files?.map((file, index) => (
        <View
          key={index}
          style={[
            styles.fileContainer,
            { backgroundColor: themeObject.colors.surface },
            previewStyle,
          ]}
        >
          {file &&
          typeof file === "object" &&
          file.type?.startsWith("image/") &&
          file.uri ? (
            <ImageWithAuth
              source={file.uri}
              style={styles.preview}
              onError={(e) => {
                console.debug(
                  "[DEBUG] Error al cargar imagen:",
                  file.uri,
                  e.nativeEvent.error
                );
              }}
            />
          ) : (
            <Icon
              name={getFileIcon(typeof file === "object" ? file.type : null)}
              size={40}
              color={themeObject.colors.text}
            />
          )}
          <Text
            style={[styles.fileName, { color: themeObject.colors.text }]}
            numberOfLines={1}
          >
            {typeof file === "string"
              ? Services.File.getFilenameFromUrl(file)
              : file.name ||
                (file.uri && Services.File.getFilenameFromUrl(file.uri)) ||
                "Archivo"}
          </Text>
          <View style={styles.buttonContainer}>
            <CustomButton
              onPress={() => handleDownload(file)}
              variant="primary"
              size="icon"
              ionIconLeft="download-outline"
              ionIconSize={16}
              style={styles.actionButton}
            />
            <CustomButton
              onPress={() => {
                handleDelete(index);
              }}
              variant="error"
              size="icon"
              ionIconLeft="close"
              ionIconSize={16}
              style={styles.actionButton}
            />
          </View>
        </View>
      ))}

      {(!files || files.length < maxFiles) && (
        <CustomButton
          onPress={handleUpload}
          variant="secondary"
          fullWidth={false}
          ionIconLeft="cloud-upload-outline"
          ionIconSize={30}
          style={[
            styles.uploadButton,
            {
              borderColor: themeObject.colors.accent,
              backgroundColor: themeObject.colors.surface,
              ...uploadButtonStyle,
            },
          ]}
        >
          <Text>
            {Platform.OS === "web" ? "Seleccionar archivo" : "Subir"}{" "}
          </Text>
        </CustomButton>
      )}

      {/* Modal de confirmación para eliminar archivo */}
      <ModalTemplate
        isVisible={confirmDeleteModalVisible}
        title="Eliminar archivo"
        text="¿Desea eliminar permanentemente este archivo del servidor?"
        cancelLabel="Cancelar"
        cancelAction={handleCancelDelete}
        confirmLabel="Eliminar"
        confirmAction={handleConfirmDelete}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  fileContainer: {
    position: "relative",
    width: 120,
    height: 120,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  preview: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    resizeMode: "contain",
  },
  fileName: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: "100%",
    textAlign: "center",
  },
  buttonContainer: {
    position: "absolute",
    top: -8,
    right: -8,
    flexDirection: "row",
  },
  actionButton: {
    borderRadius: 12,
    width: 24,
    height: 24,
    padding: 0,
    marginLeft: 4,
  },
  uploadButton: {
    width: 120,
    height: 120,
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default FileUploader;
