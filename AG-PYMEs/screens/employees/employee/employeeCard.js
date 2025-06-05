import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CustomButton from "../../../components/customButton";
import ModalTemplate from "../../../components/modalTemplate";
import { useTheme } from "../../../context/ThemeContext";
import { Services } from "../../../api";
import { NGROK_HOST } from "@env";

// Card de empleado, muestra información detallada de un empleado y permite editar o eliminar un empleado.
const EmployeeCard = ({ employee, onEdit, onDelete }) => {
  const { themeObject } = useTheme();
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  const statusColor = employee.activo
    ? themeObject.colors.success
    : themeObject.colors.error;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const calculateTenure = (hireDate) => {
    const diff = Date.now() - new Date(hireDate).getTime();
    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
    const months = Math.floor(
      (diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30)
    );
    return `${years > 0 ? `${years} años ` : ""}${months} meses`;
  }; // Función para descargar documentos o abrirlos en el navegador
  const handleDocumentPress = async (doc) => {
    try {
      // Si no hay documento para descargar, salir
      if (!doc) {
        return;
      }

      // Obtener la URL del documento
      const fileUrl = typeof doc === "string" ? doc : doc.uri;

      if (!fileUrl) {
        throw new Error("URL del documento no válida");
      }

      // Para web, implementamos la descarga directa usando API del navegador
      if (Platform.OS === "web") {
        try {
          // Obtener nombre del archivo de la URL
          const fileName =
            typeof doc === "string"
              ? Services.File.getFilenameFromUrl(doc)
              : doc.name ||
                (doc.uri && Services.File.getFilenameFromUrl(doc.uri)) ||
                "archivo";

          // Solución para web: Obtener token y abrir directamente en nueva pestaña
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

          // Usar endpoint que funciona correctamente y abrir en nueva pestaña
          const downloadUrl = `${baseUrl}/api/media/${filenamePart}?t=${timestamp}&download=true&token=${token}`;
          window.open(downloadUrl, "_blank");
        } catch (error) {
          console.error("[EmployeeCard] Error en descarga web:", error);
          throw error;
        }
      } else {
        // Para dispositivos móviles, simplemente abrimos la URL en el navegador
        try {
          // Obtenemos token para autenticación
          const token = await Services.Storage.Token.getToken();

          // Extraer solo el nombre del archivo de la URL
          let filenamePart = "";
          if (fileUrl.includes("/")) {
            filenamePart = fileUrl.split("/").pop().split("?")[0];
          } else {
            filenamePart = fileUrl;
          }

          // Construir URL para abrir en el navegador
          const baseUrl = NGROK_HOST || "http://localhost:3001";
          const timestamp = Date.now();
          const finalUrl = `${baseUrl}/api/media/${filenamePart}?t=${timestamp}&download=true&token=${token}`;

          // Abrir en el navegador del dispositivo
          Linking.openURL(finalUrl);
        } catch (error) {
          console.error("[EmployeeCard] Error al abrir documento:", error);
          Alert.alert(
            "Error",
            "No se pudo abrir el documento. Intente nuevamente."
          );
        }
      }
    } catch (error) {
      console.error("[EmployeeCard] Error al procesar documento:", error);
      Alert.alert(
        "Error",
        "No se pudo procesar el documento. Intente nuevamente."
      );
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: themeObject.colors.surface,
          borderColor: themeObject.colors.border,
          ...Platform.select({
            web: {
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              ":hover": {
                transform: "translateY(-4px)",
                boxShadow: `0 8px 24px ${themeObject.colors.border}20`,
              },
            },
          }),
        },
      ]}
    >
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <Text
              style={[styles.name, { color: themeObject.colors.text }]}
              numberOfLines={2}
              accessibilityRole="header"
            >
              {employee.nombre}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColor + "15" },
              ]}
              accessibilityLabel={`Estado: ${employee.activo ? "Activo" : "Inactivo"}`}
            >
              <Ionicons
                name={employee.activo ? "checkmark-circle" : "close-circle"}
                size={16}
                color={statusColor}
              />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {employee.activo ? "ACTIVO" : "INACTIVO"}
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.position,
              {
                color: themeObject.colors.text,
                marginTop: 4,
              },
            ]}
            numberOfLines={2}
          >
            {employee.cargo}
            {employee.departamento && ` · ${employee.departamento}`}
          </Text>
        </View>

        <View style={styles.actions}>
          <CustomButton
            variant="ghost"
            size="sm"
            ionIconLeft="create-outline"
            onPress={onEdit}
            style={styles.actionButton}
            accessibilityLabel="Editar empleado"
          >
            {Platform.OS === "web" && "Editar"}
          </CustomButton>
          <CustomButton
            variant="error"
            size="sm"
            ionIconLeft="trash-outline"
            onPress={() => setIsDeleteModalVisible(true)}
            style={styles.actionButton}
            accessibilityLabel="Eliminar empleado"
          >
            {Platform.OS === "web" && "Eliminar"}
          </CustomButton>
        </View>
      </View>
      {/* Contract Info */}
      <View style={styles.contractInfoContainer}>
        <View style={styles.contractBadge}>
          <Ionicons
            name="briefcase"
            size={14}
            color={themeObject.colors.primary}
          />
          <Text
            style={[
              styles.contractText,
              {
                color: themeObject.colors.primary,
                marginLeft: 6,
              },
            ]}
          >
            {employee.tipo_contrato?.toUpperCase()}
          </Text>
        </View>

        <View style={styles.contractBadge}>
          <Ionicons name="time" size={14} color={themeObject.colors.primary} />
          <Text
            style={[
              styles.contractText,
              {
                color: themeObject.colors.primary,
                marginLeft: 6,
              },
            ]}
          >
            {employee.horas_contratadas}h/sem
          </Text>
        </View>
      </View>
      {/* Main Content */}
      <View style={styles.contentGrid}>
        {/* Personal Info Column */}
        <View style={styles.infoColumn}>
          <InfoRow
            icon="id-card"
            label="DNI"
            value={employee.dni}
            theme={themeObject}
          />
          <InfoRow
            icon="medical"
            label="NSS"
            value={employee.nss}
            theme={themeObject}
          />
          <InfoRow
            icon="calendar"
            label="Nacimiento"
            value={formatDate(employee.fecha_nacimiento)}
            theme={themeObject}
          />
        </View>

        {/* Salary and Tenure Column */}
        <View style={styles.infoColumn}>
          <InfoRow
            icon="cash"
            label="Salario"
            value={new Intl.NumberFormat("es-ES", {
              style: "currency",
              currency: "EUR",
            }).format(employee.salario)}
            theme={themeObject}
          />
          <InfoRow
            icon="calendar"
            label="Contratación"
            value={formatDate(employee.fecha_contratacion)}
            theme={themeObject}
          />
          <InfoRow
            icon="time"
            label="Antigüedad"
            value={calculateTenure(employee.fecha_contratacion)}
            theme={themeObject}
          />
        </View>
      </View>
      {/* Contact Section */}
      <View style={[styles.section, { marginTop: 16 }]}>
        <SectionTitle theme={themeObject}>Contacto</SectionTitle>
        {employee.telefono && (
          <InfoRow
            icon="call"
            label="Teléfono"
            value={employee.telefono}
            theme={themeObject}
          />
        )}
        {employee.telefono_emergencia && (
          <InfoRow
            icon="alert-circle"
            label="Emergencia"
            value={employee.telefono_emergencia}
            theme={themeObject}
          />
        )}
        <Pressable
          onPress={() => Linking.openURL(`mailto:${employee.email}`)}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <InfoRow
            icon="mail"
            label="Email"
            value={employee.email}
            theme={themeObject}
            valueStyle={{ color: themeObject.colors.primary }}
          />
        </Pressable>
        {employee.direccion && (
          <InfoRow
            icon="home"
            label="Dirección"
            value={`${employee.direccion}${employee.codigo_postal ? `, ${employee.codigo_postal}` : ""}`}
            theme={themeObject}
          />
        )}
        {employee.ciudad && (
          <InfoRow
            icon="location"
            label="Ubicación"
            value={`${employee.ciudad}${employee.pais ? `, ${employee.pais}` : ""}`}
            theme={themeObject}
          />
        )}
      </View>
      {/* Documents Section */}
      {Array.isArray(employee.documento_adjunto) &&
        employee.documento_adjunto.length > 0 && (
          <View style={styles.section}>
            <SectionTitle theme={themeObject}>Documentos Adjuntos</SectionTitle>
            <View style={styles.documentsGrid}>
              {employee.documento_adjunto.map((doc, index) => {
                // Validación mejorada
                if (!doc) return null;

                let docName = "";
                let docUrl = "";

                // Manejar tanto strings como objetos
                if (typeof doc === "string") {
                  docUrl = doc;
                  docName = doc.split("/").pop() || `Documento ${index + 1}`;
                } else if (typeof doc === "object" && doc.url) {
                  docUrl = doc.url;
                  docName =
                    doc.name ||
                    doc.url.split("/").pop() ||
                    `Documento ${index + 1}`;
                } else {
                  return null;
                }

                return (
                  <Pressable
                    key={index}
                    onPress={() => handleDocumentPress(docUrl)}
                    style={({ pressed }) => [
                      styles.documentCard,
                      {
                        backgroundColor: themeObject.colors.surfaceVariant,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                    accessibilityLabel={`Descargar documento: ${docName}`}
                  >
                    <View style={styles.documentIconContainer}>
                      <Ionicons
                        name="document-attach"
                        size={18}
                        color={themeObject.colors.primary}
                      />
                      <Ionicons
                        name="download-outline"
                        size={14}
                        color={themeObject.colors.primary}
                        style={styles.downloadIcon}
                      />
                    </View>
                    <Text
                      style={[
                        styles.documentText,
                        {
                          color: themeObject.colors.primary,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {docName}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      {/* Notes Section */}
      {employee.notas && (
        <View style={[styles.section, { marginTop: 16 }]}>
          <SectionTitle theme={themeObject}>Notas</SectionTitle>
          <Text
            style={[
              styles.notes,
              {
                color: themeObject.colors.text,
                lineHeight: 22,
              },
            ]}
          >
            {employee.notas}
          </Text>
        </View>
      )}
      {/* Modal de confirmación de eliminación */}
      <ModalTemplate
        isVisible={isDeleteModalVisible}
        title="Confirmar eliminación"
        text={`¿Estás seguro de que deseas eliminar a ${employee.nombre}?`}
        warning="Esta acción no se puede deshacer."
        cancelLabel="Cancelar"
        cancelAction={() => setIsDeleteModalVisible(false)}
        confirmLabel="Eliminar"
        confirmAction={() => {
          setIsDeleteModalVisible(false);
          onDelete();
        }}
        confirmDisabled={false}
      />
    </View>
  );
};

// Componentes auxiliares
const InfoRow = ({ icon, label, value, theme, valueStyle }) => (
  <View style={styles.infoRow}>
    <Ionicons
      name={icon}
      size={16}
      color={theme.colors.placeholder}
      style={styles.infoIcon}
    />
    <View style={styles.infoContent}>
      <Text style={[styles.infoLabel, { color: theme.colors.placeholder }]}>
        {label} {": "}
      </Text>
      <Text
        style={[styles.infoValue, { color: theme.colors.text }, valueStyle]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  </View>
);

const SectionTitle = ({ children, theme }) => (
  <View
    style={[
      styles.sectionTitle,
      { borderBottomColor: theme.colors.placeholder },
    ]}
  >
    <Text
      style={[
        styles.sectionTitleText,
        {
          color: theme.colors.text,
        },
      ]}
    >
      {children}
    </Text>
  </View>
);

// Estilos actualizados
const styles = StyleSheet.create({
  container: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      web: {
        cursor: "default",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      },
    }),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 4,
  },
  name: {
    fontSize: Platform.select({ web: 22, default: 20 }),
    fontWeight: "700",
    letterSpacing: 0.2,
    maxWidth: "80%",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  position: {
    fontSize: 15,
    opacity: 0.9,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: Platform.select({ android: 4, default: 0 }),
  },
  actionButton: {
    minWidth: Platform.select({ web: 100, default: 40 }),
    height: 40,
  },
  contractInfoContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  contractBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#00000010",
  },
  contentGrid: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 16,
    ...Platform.select({
      android: { flexDirection: "column" },
      ios: { flexDirection: "column" },
    }),
  },
  infoColumn: {
    flex: 1,
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  infoIcon: {
    marginTop: 2,
  },
  infoContent: {
    flexDirection: "row",
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: "600",
    paddingBottom: 8,
  },
  documentsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  documentCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 8,
    minWidth: 150,
    ...Platform.select({
      web: { transition: "opacity 0.2s ease, transform 0.2s ease" },
    }),
  },
  documentIconContainer: {
    position: "relative",
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  downloadIcon: {
    position: "absolute",
    right: -5,
    bottom: -5,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 2,
  },
  documentText: {
    fontSize: 14,
    flexShrink: 1,
  },
  notes: {
    fontSize: 14,
    lineHeight: 22,
  },
});

export default React.memo(EmployeeCard);
