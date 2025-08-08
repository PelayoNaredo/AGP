// =====================================================
// FASE 3 - TAREA 3.3: Componente de Límites de Empresa
// Fecha: 8 de agosto de 2025
// Descripción: Componente para mostrar límites y alertas de uso
// =====================================================

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Card, ProgressBar, Chip, IconButton } from "react-native-paper";
import { useCompany } from "../context/CompanyContext";
import { useTheme } from "../context/ThemeContext";
import { Services } from "../api";

const LimitCard = ({
  resourceType,
  current,
  max,
  percentage,
  onPress,
  showDetails = false,
}) => {
  const { themeObject } = useTheme();

  const alert = Services.Company.getLimitAlert(resourceType, percentage);
  const displayName = Services.Company.getResourceDisplayName(resourceType);
  const formattedMax = Services.Company.formatLimitValue(resourceType, max);
  const formattedCurrent = Services.Company.formatLimitValue(
    resourceType,
    current
  );

  const getProgressColor = () => {
    if (percentage >= 100) return "#FF5252";
    if (percentage >= 90) return "#FF9800";
    if (percentage >= 75) return "#FFC107";
    return "#4CAF50";
  };

  return (
    <Card
      style={[styles.card, { backgroundColor: themeObject.colors.surface }]}
      onPress={onPress}
    >
      <Card.Content>
        <View style={styles.header}>
          <Text style={[styles.title, { color: themeObject.colors.text }]}>
            {displayName}
          </Text>
          {alert.shouldWarn && (
            <Chip
              mode="outlined"
              textStyle={{ fontSize: 10 }}
              style={[styles.warningChip, { borderColor: alert.color }]}
            >
              {Math.round(percentage)}%
            </Chip>
          )}
        </View>

        <View style={styles.progressContainer}>
          <ProgressBar
            progress={Math.min(percentage / 100, 1)}
            color={getProgressColor()}
            style={styles.progressBar}
          />
          <Text
            style={[styles.progressText, { color: themeObject.colors.text }]}
          >
            {formattedCurrent} / {formattedMax}
          </Text>
        </View>

        {showDetails && alert.shouldWarn && (
          <Text style={[styles.alertText, { color: alert.color }]}>
            {alert.message}
          </Text>
        )}
      </Card.Content>
    </Card>
  );
};

const CompanyLimitsOverview = ({
  showTitle = true,
  onLimitPress,
  compact = false,
}) => {
  const { company, limits, usageStats, loading, error } = useCompany();
  const { themeObject } = useTheme();

  // Mostrar loading solo si realmente está cargando y no hay datos previos
  if (loading && (!company || !limits)) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={[styles.loadingText, { color: themeObject.colors.text }]}>
          Cargando límites...
        </Text>
      </View>
    );
  }

  // Si hay error y no hay datos, mostrar mensaje de error
  if (error && !company) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={[styles.errorText, { color: themeObject.colors.error }]}>
          Error al cargar límites
        </Text>
      </View>
    );
  }

  // Si no hay empresa pero no está cargando, no mostrar nada
  if (!company) {
    return null;
  }

  // Asegurar que tenemos datos de límites por defecto
  const safeLimits = {
    users_percentage: 0,
    clients_percentage: 0,
    products_percentage: 0,
    storage_percentage: 0,
    max_users: 0,
    max_clients: 0,
    max_products: 0,
    max_storage_mb: 0,
    ...limits,
  };

  const safeUsageStats = {
    current_users: 0,
    current_clients: 0,
    current_products: 0,
    current_storage_mb: 0,
    ...usageStats,
  };

  const limitData = [
    {
      resourceType: "users",
      current: safeUsageStats.current_users,
      max: safeLimits.max_users,
      percentage: safeLimits.users_percentage,
    },
    {
      resourceType: "clients",
      current: safeUsageStats.current_clients,
      max: safeLimits.max_clients,
      percentage: safeLimits.clients_percentage,
    },
    {
      resourceType: "products",
      current: safeUsageStats.current_products,
      max: safeLimits.max_products,
      percentage: safeLimits.products_percentage,
    },
    {
      resourceType: "storage",
      current: safeUsageStats.current_storage_mb,
      max: safeLimits.max_storage_mb,
      percentage: safeLimits.storage_percentage,
    },
  ];

  const hasWarnings = limitData.some(
    (item) =>
      Services.Company.getLimitAlert(item.resourceType, item.percentage)
        .shouldWarn
  );

  return (
    <View style={styles.container}>
      {showTitle && (
        <View style={styles.titleContainer}>
          <Text
            style={[styles.sectionTitle, { color: themeObject.colors.text }]}
          >
            Límites de Plan
          </Text>
          {hasWarnings && (
            <Chip
              icon="alert-circle-outline"
              mode="outlined"
              textStyle={{ fontSize: 12, color: "#FF5252" }}
              style={[styles.warningChip, { borderColor: "#FF5252" }]}
            >
              Atención
            </Chip>
          )}
        </View>
      )}

      <View style={compact ? styles.compactGrid : styles.grid}>
        {limitData.map((item) => (
          <LimitCard
            key={item.resourceType}
            {...item}
            onPress={() => onLimitPress?.(item.resourceType)}
            showDetails={!compact}
          />
        ))}
      </View>

      {hasWarnings && !compact && (
        <Card style={[styles.alertCard, { backgroundColor: "#FFF3E0" }]}>
          <Card.Content>
            <Text style={[styles.alertTitle, { color: "#E65100" }]}>
              ⚠️ Límites del Plan
            </Text>
            <Text style={[styles.alertDescription, { color: "#BF360C" }]}>
              Algunos recursos están cerca del límite. Considera actualizar tu
              plan.
            </Text>
          </Card.Content>
        </Card>
      )}
    </View>
  );
};

// Componente específico para mostrar un límite individual
const SingleLimitDisplay = ({ resourceType, showUpgrade = false }) => {
  const { company, limits, usageStats, validateLimit } = useCompany();
  const { themeObject } = useTheme();

  if (!company) return null;

  const current = usageStats[`current_${resourceType}`] || 0;
  const max = limits[`max_${resourceType}`] || 0;
  const percentage = limits[`${resourceType}_percentage`] || 0;

  const alert = Services.Company.getLimitAlert(resourceType, percentage);
  const displayName = Services.Company.getResourceDisplayName(resourceType);

  const checkCanAdd = async (quantity = 1) => {
    const result = await validateLimit(resourceType, quantity);
    return result.canAdd;
  };

  return (
    <View style={styles.singleLimitContainer}>
      <View style={styles.singleLimitHeader}>
        <Text
          style={[styles.singleLimitTitle, { color: themeObject.colors.text }]}
        >
          {displayName}
        </Text>
        <View style={styles.singleLimitStats}>
          <Text style={[styles.singleLimitCurrent, { color: alert.color }]}>
            {current}
          </Text>
          <Text
            style={[
              styles.singleLimitSeparator,
              { color: themeObject.colors.text },
            ]}
          >
            /
          </Text>
          <Text
            style={[styles.singleLimitMax, { color: themeObject.colors.text }]}
          >
            {max}
          </Text>
        </View>
      </View>

      <ProgressBar
        progress={Math.min(percentage / 100, 1)}
        color={alert.color}
        style={styles.singleProgressBar}
      />

      {alert.shouldWarn && (
        <Text style={[styles.singleAlertText, { color: alert.color }]}>
          {alert.message}
        </Text>
      )}

      {showUpgrade && percentage >= 90 && (
        <Text
          style={[styles.upgradeHint, { color: themeObject.colors.primary }]}
        >
          💡 Considera actualizar tu plan
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  loadingContainer: {
    padding: 16,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  compactGrid: {
    flexDirection: "column",
    gap: 8,
  },
  card: {
    width: "48%",
    marginBottom: 12,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
  },
  progressContainer: {
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: "right",
  },
  alertText: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: "500",
  },
  warningChip: {
    height: 24,
  },
  alertCard: {
    marginTop: 12,
    elevation: 2,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 12,
  },

  // Estilos para límite individual
  singleLimitContainer: {
    padding: 16,
  },
  singleLimitHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  singleLimitTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  singleLimitStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  singleLimitCurrent: {
    fontSize: 18,
    fontWeight: "bold",
  },
  singleLimitSeparator: {
    fontSize: 16,
    marginHorizontal: 4,
  },
  singleLimitMax: {
    fontSize: 16,
  },
  singleProgressBar: {
    height: 12,
    borderRadius: 6,
    marginVertical: 8,
  },
  singleAlertText: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  upgradeHint: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 4,
  },
});

export { CompanyLimitsOverview, SingleLimitDisplay };
export default CompanyLimitsOverview;
