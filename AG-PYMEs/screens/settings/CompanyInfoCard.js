import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import {
  Card,
  List,
  Divider,
  Chip,
  Text,
  IconButton,
} from "react-native-paper";
import { useTheme } from "../../context/ThemeContext";
import { useCompany } from "../../context/CompanyContext";
import { Services } from "../../api";
import useNotifications from "../../hooks/useNotifications";

// Tarjeta para mostrar información completa de la empresa desde BD
const CompanyInfoCard = ({ navigation }) => {
  const { themeObject } = useTheme();
  const { company, limits, usageStats } = useCompany();
  const { showErrorNotification } = useNotifications();
  const [companyDetails, setCompanyDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanyDetails();
  }, []);

  const loadCompanyDetails = async () => {
    try {
      setLoading(true);
      // Obtener información completa de la empresa
      const details = await Services.Company.getCurrentCompany();
      setCompanyDetails(details);
    } catch (error) {
      console.error("Error loading company details:", error);
      showErrorNotification("Error al cargar información de la empresa");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No disponible";
    try {
      return new Date(dateString).toLocaleDateString("es-ES");
    } catch {
      return "Fecha inválida";
    }
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      active: { label: "Activa", color: "#4CAF50", icon: "check-circle" },
      inactive: { label: "Inactiva", color: "#FF5722", icon: "cancel" },
      suspended: {
        label: "Suspendida",
        color: "#FF9800",
        icon: "pause-circle",
      },
      trial: { label: "Prueba", color: "#2196F3", icon: "timer" },
    };

    const config = statusConfig[status] || statusConfig.inactive;

    return (
      <Chip
        icon={config.icon}
        style={{ backgroundColor: config.color + "20" }}
        textStyle={{
          color: config.color,
          fontSize: 12,
          lineHeight: 14,
          textAlign: "center",
          includeFontPadding: false,
        }}
        compact
      >
        {config.label}
      </Chip>
    );
  };

  if (loading) {
    return (
      <Card
        style={[styles.card, { backgroundColor: themeObject.colors.surface }]}
      >
        <Card.Content>
          <Text>Cargando información...</Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card
      style={[styles.card, { backgroundColor: themeObject.colors.surface }]}
    >
      <Card.Title
        title="Información de la Empresa"
        subtitle="Datos almacenados en la base de datos"
        titleStyle={{ fontWeight: "bold", fontSize: 16 }}
        subtitleStyle={{ fontSize: 12, opacity: 0.7 }}
        left={(props) => (
          <IconButton
            {...props}
            icon="domain"
            size={20}
            iconColor={themeObject.colors.primary}
          />
        )}
        right={(props) => (
          <IconButton
            {...props}
            icon="refresh"
            size={18}
            iconColor={themeObject.colors.text}
            onPress={loadCompanyDetails}
          />
        )}
      />

      <Card.Content>
        {companyDetails ? (
          <>
            {/* Información básica */}
            <List.Item
              title={companyDetails.name || "Sin nombre"}
              description="Nombre de la empresa"
              left={(props) => <List.Icon {...props} icon="office-building" />}
              style={styles.listItem}
            />

            <Divider style={styles.divider} />

            {/* Plan y estado */}
            <View style={styles.statusRow}>
              <View style={styles.statusItem}>
                <Text
                  style={[styles.label, { color: themeObject.colors.text }]}
                >
                  Plan Actual
                </Text>
                <Chip
                  icon="star"
                  style={styles.planChip}
                  textStyle={{
                    fontSize: 12,
                    lineHeight: 14,
                    textAlign: "center",
                    includeFontPadding: false,
                  }}
                >
                  {(companyDetails.plan || "BÁSICO").toUpperCase()}
                </Chip>
              </View>

              <View style={styles.statusItem}>
                <Text
                  style={[styles.label, { color: themeObject.colors.text }]}
                >
                  Estado
                </Text>
                {getStatusChip(companyDetails.status || "active")}
              </View>
            </View>

            <Divider style={styles.divider} />

            {/* Fechas importantes */}
            <List.Item
              title={formatDate(companyDetails.created_at)}
              description="Fecha de creación"
              left={(props) => <List.Icon {...props} icon="calendar-plus" />}
              style={styles.listItem}
            />

            {companyDetails.updated_at && (
              <List.Item
                title={formatDate(companyDetails.updated_at)}
                description="Última actualización"
                left={(props) => <List.Icon {...props} icon="calendar-edit" />}
                style={styles.listItem}
              />
            )}

            <Divider style={styles.divider} />

            {/* Estadísticas de uso */}
            <Text
              style={[styles.sectionTitle, { color: themeObject.colors.text }]}
            >
              Uso Actual
            </Text>

            <View style={styles.usageGrid}>
              <View style={styles.usageItem}>
                <Text
                  style={[
                    styles.usageNumber,
                    { color: themeObject.colors.primary },
                  ]}
                >
                  {usageStats.current_users || 0}
                </Text>
                <Text
                  style={[
                    styles.usageLabel,
                    { color: themeObject.colors.text },
                  ]}
                >
                  Usuarios
                </Text>
              </View>

              <View style={styles.usageItem}>
                <Text
                  style={[
                    styles.usageNumber,
                    { color: themeObject.colors.primary },
                  ]}
                >
                  {usageStats.current_clients || 0}
                </Text>
                <Text
                  style={[
                    styles.usageLabel,
                    { color: themeObject.colors.text },
                  ]}
                >
                  Clientes
                </Text>
              </View>

              <View style={styles.usageItem}>
                <Text
                  style={[
                    styles.usageNumber,
                    { color: themeObject.colors.primary },
                  ]}
                >
                  {usageStats.current_products || 0}
                </Text>
                <Text
                  style={[
                    styles.usageLabel,
                    { color: themeObject.colors.text },
                  ]}
                >
                  Productos
                </Text>
              </View>

              <View style={styles.usageItem}>
                <Text
                  style={[
                    styles.usageNumber,
                    { color: themeObject.colors.primary },
                  ]}
                >
                  {Math.round(
                    ((usageStats.current_storage_mb || 0) / 1024) * 100
                  ) / 100}
                  GB
                </Text>
                <Text
                  style={[
                    styles.usageLabel,
                    { color: themeObject.colors.text },
                  ]}
                >
                  Almacenamiento
                </Text>
              </View>
            </View>

            {/* ID de empresa para soporte */}
            <Divider style={styles.divider} />
            <List.Item
              title={companyDetails.id || "N/A"}
              description="ID de empresa (para soporte técnico)"
              left={(props) => <List.Icon {...props} icon="identifier" />}
              style={styles.listItem}
              titleStyle={{ fontFamily: "monospace", fontSize: 14 }}
            />
          </>
        ) : (
          <Text style={[styles.errorText, { color: themeObject.colors.error }]}>
            No se pudo cargar la información de la empresa
          </Text>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 6,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  listItem: {
    backgroundColor: "rgba(0, 0, 0, 0.025)",
    borderRadius: 6,
    marginVertical: 1,
    paddingVertical: 2,
  },
  divider: {
    marginVertical: 6,
    opacity: 0.3,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  statusItem: {
    alignItems: "center",
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 3,
    opacity: 0.7,
  },
  planChip: {
    backgroundColor: "#E3F2FD",
    height: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 4,
  },
  usageGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    flexWrap: "wrap",
  },
  usageItem: {
    alignItems: "center",
    flex: 1,
    minWidth: "22%",
    marginVertical: 2,
  },
  usageNumber: {
    fontSize: 16,
    fontWeight: "bold",
  },
  usageLabel: {
    fontSize: 10,
    marginTop: 1,
    opacity: 0.7,
    textAlign: "center",
  },
  errorText: {
    textAlign: "center",
    paddingVertical: 12,
    fontStyle: "italic",
    fontSize: 14,
  },
});

export default CompanyInfoCard;
